const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { GoogleAuth } = require("google-auth-library");

setGlobalOptions({ region: "asia-southeast1" });

initializeApp();
const db = getFirestore();
const adminAuth = getAuth();
const googleAuth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});
// chirp_2 is only available in us-central1 and europe-west4.
// asia-southeast1 does NOT support chirp_2 → use us-central1 as default.
const STT_LOCATION = process.env.STT_LOCATION || "us-central1";
const MAX_STT_AUDIO_BYTES = 10 * 1024 * 1024;

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

exports.signInParentSimple = onCall(async (request) => {
  const rawUsername = request.data?.username;
  const displayNameInput = request.data?.displayName;
  const username = normalizeUsername(rawUsername);

  if (!username || username.length < 3 || username.length > 32) {
    throw new HttpsError("invalid-argument", "Username must be 3-32 characters.");
  }

  if (!/^[a-z0-9._-]+$/.test(username)) {
    throw new HttpsError("invalid-argument", "Username contains invalid characters.");
  }

  const accountRef = db.collection("simpleParentAccounts").doc(username);
  const accountSnap = await accountRef.get();
  const now = new Date().toISOString();

  let uid;
  let isNew = false;

  if (accountSnap.exists) {
    uid = accountSnap.data().uid;
    await accountRef.set({ lastLoginAt: now }, { merge: true });
  } else {
    const displayName = (String(displayNameInput || "").trim() || username).slice(0, 80);
    const userRecord = await adminAuth.createUser({ displayName });
    uid = userRecord.uid;
    isNew = true;

    await accountRef.set({
      uid,
      username,
      displayName,
      createdAt: now,
      lastLoginAt: now,
    });
  }

  const profileRef = db.collection("userProfiles").doc(uid);
  const profileSnap = await profileRef.get();
  if (!profileSnap.exists) {
    await profileRef.set({
      role: "parent",
      simpleLogin: true,
      simpleUsername: username,
      displayName: String(displayNameInput || "").trim() || username,
      createdAt: now,
    });
  }

  const token = await adminAuth.createCustomToken(uid);
  return { token, isNew, username };
});

/**
 * Helper to ensure the user is authenticated.
 */
function ensureAuth(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated to call this function.");
  }
}

exports.transcribeSpeech = onCall({ timeoutSeconds: 60, memory: "256MiB" }, async (request) => {
  ensureAuth(request);

  const audioBase64Raw = String(request.data?.audioBase64 || "").trim();
  const languageCode = String(request.data?.languageCode || "vi-VN").trim() || "vi-VN";

  if (!audioBase64Raw) {
    throw new HttpsError("invalid-argument", "Missing audioBase64.");
  }

  const audioBase64 = audioBase64Raw.includes(",")
    ? audioBase64Raw.split(",")[1]
    : audioBase64Raw;

  let audioBytes;
  try {
    audioBytes = Buffer.from(audioBase64, "base64");
  } catch (_) {
    throw new HttpsError("invalid-argument", "Invalid audio payload.");
  }

  if (!audioBytes || audioBytes.length === 0) {
    throw new HttpsError("invalid-argument", "Audio payload is empty.");
  }
  if (audioBytes.length > MAX_STT_AUDIO_BYTES) {
    throw new HttpsError("invalid-argument", "Audio is too large (max 10MB).");
  }

  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
  if (!projectId) {
    throw new HttpsError("internal", "Missing project id for STT request.");
  }

  const recognizerPath = `projects/${projectId}/locations/${STT_LOCATION}/recognizers/_`;
  const endpoint = `https://speech.googleapis.com/v2/${recognizerPath}:recognize`;

  try {
    const authClient = await googleAuth.getClient();
    const tokenInfo = await authClient.getAccessToken();
    const accessToken = typeof tokenInfo === "string" ? tokenInfo : tokenInfo?.token;

    if (!accessToken) {
      throw new Error("missing_access_token");
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recognizer: recognizerPath,
        config: {
          autoDecodingConfig: {},
          languageCodes: [languageCode],
          model: "chirp_2",
          features: {
            enableAutomaticPunctuation: true,
          },
        },
        content: audioBase64,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("transcribeSpeech failed", {
        status: response.status,
        body: payload,
      });
      throw new HttpsError("internal", "Speech transcription failed.");
    }

    const text = Array.isArray(payload.results)
      ? payload.results
        .map((item) => item?.alternatives?.[0]?.transcript || "")
        .filter(Boolean)
        .join(" ")
        .trim()
      : "";

    return { text };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    console.error("transcribeSpeech unexpected error", err);
    throw new HttpsError("internal", "Speech transcription failed.");
  }
});

/**
 * ─── Kids ─────────────────────────────────────────────────────────────
 */

exports.addKid = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, name, avatar, id } = request.data;
  
  if (!familyId || !name || !id) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  const kidDoc = {
    id,
    displayName: name,
    name,
    avatar: avatar || "🧒",
    balance: 0,
  };

  await db.collection("families").doc(familyId).collection("kids").doc(id).set(kidDoc);
  return { success: true, kid: kidDoc };
});

exports.updateKid = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, kidId, updates } = request.data;

  if (!familyId || !kidId || !updates) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  // To properly mimic the store.buildKidUpdate logic: we just update the specific fields provided
  await db.collection("families").doc(familyId).collection("kids").doc(kidId).set(updates, { merge: true });
  return { success: true };
});

// Note: To delete a kid, we also need to delete their tasks, day configs, and ledger entries (formerly batchDeleteByKidId)
exports.deleteKid = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, kidId } = request.data;

  if (!familyId || !kidId) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  const batch = db.batch();

  // 1. Delete the Kid document
  const kidRef = db.collection("families").doc(familyId).collection("kids").doc(kidId);
  batch.delete(kidRef);

  // 2. Batch delete related docs
  const cols = ["dailyTasks", "dayConfigs", "ledger", "goals", "badges"];
  for (const colName of cols) {
    const querySnapshot = await db.collection("families").doc(familyId).collection(colName)
      .where("kidId", "==", kidId)
      .get();
    
    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
  }

  await batch.commit();
  return { success: true };
});

/**
 * ─── Templates ────────────────────────────────────────────────────────
 */

exports.addTemplate = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, template } = request.data;

  if (!familyId || !template || !template.id) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  await db.collection("families").doc(familyId).collection("templates").doc(template.id).set(template);
  return { success: true };
});

exports.updateTemplate = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, templateId, updates } = request.data;

  if (!familyId || !templateId || !updates) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  await db.collection("families").doc(familyId).collection("templates").doc(templateId).set(updates, { merge: true });
  return { success: true };
});

exports.deleteTemplate = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, templateId } = request.data;

  if (!familyId || !templateId) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  await db.collection("families").doc(familyId).collection("templates").doc(templateId).delete();
  return { success: true };
});

exports.importDefaultPack = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, pack, selectedTasks } = request.data;

  if (!familyId || !pack) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  const tasksToImport = selectedTasks || pack.tasks;
  
  // Get existing templates to avoid duplicates based on title
  const existingSnap = await db.collection("families").doc(familyId).collection("templates").get();
  const existingTitles = existingSnap.docs.map(doc => doc.data().title);

  const newTasks = tasksToImport.filter(t => !existingTitles.includes(t.title));
  
  const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  
  const batch = db.batch();
  newTasks.forEach(task => {
    const id = generateId();
    const ref = db.collection("families").doc(familyId).collection("templates").doc(id);
    batch.set(ref, {
      id,
      title: task.title,
      descriptions: {
        en: task.description || "",
        vi: task.descriptionVi || task.description || "",
      },
      description: task.description || task.descriptionVi || "",
      assignedKidIds: [],
      importedFrom: pack.id
    });
  });

  await batch.commit();
  return { success: true, count: newTasks.length };
});

exports.assignTemplateToKids = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, templateId, kidIds } = request.data;

  if (!familyId || !templateId || !kidIds) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  await db.collection("families").doc(familyId).collection("templates").doc(templateId).set({ assignedKidIds: kidIds }, { merge: true });
  return { success: true };
});

/**
 * ─── Daily Tasks ──────────────────────────────────────────────────────
 */

exports.addDailyTask = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, task } = request.data;

  if (!familyId || !task || !task.id) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  await db.collection("families").doc(familyId).collection("dailyTasks").doc(task.id).set(task);
  return { success: true };
});

exports.loadTemplatesForDay = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, kidId, date, templates, existingTaskTitles } = request.data;
  
  // To avoid complex DB reads and store rebuilding in Functions, we can pass the evaluated templates 
  // and existing tasks from the client and just perform the bulk write here.
  // The client will construct the array of DailyTasks to create based on templates.
  const { tasksToCreate } = request.data;
  if (!familyId || !tasksToCreate) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  const batch = db.batch();
  tasksToCreate.forEach(task => {
    const ref = db.collection("families").doc(familyId).collection("dailyTasks").doc(task.id);
    batch.set(ref, task);
  });

  await batch.commit();
  return { success: true };
});

exports.syncAssignedTemplatesForDay = onCall(async (request) => {
  ensureAuth(request);
  // Same logic as loadTemplatesForDay for simplicity, we receive the exact tasks to bulk-create from the client
  const { familyId, tasksToCreate } = request.data;
  if (!familyId || !tasksToCreate) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  if (tasksToCreate.length === 0) return { success: true };

  const batch = db.batch();
  tasksToCreate.forEach(task => {
    const ref = db.collection("families").doc(familyId).collection("dailyTasks").doc(task.id);
    batch.set(ref, task);
  });

  await batch.commit();
  return { success: true };
});

exports.updateDailyTask = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, taskId, updates } = request.data;

  if (!familyId || !taskId || !updates) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  await db.collection("families").doc(familyId).collection("dailyTasks").doc(taskId).set(updates, { merge: true });
  return { success: true };
});

exports.deleteDailyTask = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, taskId } = request.data;

  if (!familyId || !taskId) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  await db.collection("families").doc(familyId).collection("dailyTasks").doc(taskId).delete();
  return { success: true };
});

// Batch-delete all tasks for a kid+date (used by Clear All and Undo auto-load)
exports.clearDayTasks = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, taskIds } = request.data;

  if (!familyId || !Array.isArray(taskIds) || taskIds.length === 0) {
    return { success: true };
  }

  const batch = db.batch();
  taskIds.forEach((id) => {
    const ref = db.collection("families").doc(familyId).collection("dailyTasks").doc(id);
    batch.delete(ref);
  });

  await batch.commit();
  return { success: true };
});

// For toggleTaskStatus and markTaskFailed, the client can just use updateDailyTask.
// We'll wrap the logic there rather than creating separate endpoints.

/**
 * ─── Day Config & Ledger ──────────────────────────────────────────────
 */

exports.setDayConfig = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, config } = request.data;

  if (!familyId || !config || !config.id) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  await db.collection("families").doc(familyId).collection("dayConfigs").doc(config.id).set(config);
  return { success: true };
});

exports.finalizeDay = onCall(async (request) => {
  ensureAuth(request);
  // The client store calculates the finalizeDay result (updated kid, day config, ledger entries).
  // We receive that payload and perform the batch transaction across collections.
  const { familyId, updatedKid, updatedConfig, ledgerEntries } = request.data;

  if (!familyId || !updatedKid || !updatedConfig || !ledgerEntries) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  const batch = db.batch();

  // 1. Update Kid
  const kidRef = db.collection("families").doc(familyId).collection("kids").doc(updatedKid.id);
  batch.set(kidRef, updatedKid, { merge: true });

  // 2. Update Day Config
  const configRef = db.collection("families").doc(familyId).collection("dayConfigs").doc(updatedConfig.id);
  // Use set instead of update because the DayConfig might not exist yet
  batch.set(configRef, updatedConfig);

  // 3. Add Ledger Entries
  ledgerEntries.forEach(entry => {
    const entryRef = db.collection("families").doc(familyId).collection("ledger").doc(entry.id);
    batch.set(entryRef, entry);
  });

  await batch.commit();
  return { success: true };
});

exports.addManualTransaction = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, updatedKid, entry } = request.data;

  if (!familyId || !updatedKid || !entry) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  const batch = db.batch();

  // Update Kid Balance
  const kidRef = db.collection("families").doc(familyId).collection("kids").doc(updatedKid.id);
  batch.set(kidRef, updatedKid, { merge: true });

  // Add Entry
  const entryRef = db.collection("families").doc(familyId).collection("ledger").doc(entry.id);
  batch.set(entryRef, entry);

  await batch.commit();
  return { success: true };
});

/**
 * ─── Savings Goals ────────────────────────────────────────────────────────────
 */

exports.addGoal = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, goal } = request.data;

  if (!familyId || !goal || !goal.id) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  await db.collection("families").doc(familyId).collection("goals").doc(goal.id).set(goal);
  return { success: true };
});

exports.updateGoal = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, goalId, updates } = request.data;

  if (!familyId || !goalId || !updates) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  await db.collection("families").doc(familyId).collection("goals").doc(goalId).set(updates, { merge: true });
  return { success: true };
});

exports.deleteGoal = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, goalId } = request.data;

  if (!familyId || !goalId) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  await db.collection("families").doc(familyId).collection("goals").doc(goalId).delete();
  return { success: true };
});

exports.upsertBadge = onCall(async (request) => {
  ensureAuth(request);
  const { familyId, badge } = request.data;

  if (!familyId || !badge || !badge.id || !badge.kidId || !badge.code || !badge.unlockedAt) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  await db.collection("families").doc(familyId).collection("badges").doc(badge.id).set(badge, { merge: true });
  return { success: true };
});
