import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    query,
    writeBatch,
} from 'firebase/firestore'
import { db } from './config'

// ─── Collection References ─────────────────────────────────────────────────────
export const familyRef = (familyId) => `families/${familyId}`

export const colRef = (familyId, colName) =>
    collection(db, 'families', familyId, colName)

export const docRef = (familyId, colName, id) =>
    doc(db, 'families', familyId, colName, id)

// ─── Write ─────────────────────────────────────────────────────────────────────
export const saveDoc = (familyId, colName, data) =>
    setDoc(docRef(familyId, colName, data.id), data)

// ─── Delete ────────────────────────────────────────────────────────────────────
export const removeDoc = (familyId, colName, id) =>
    deleteDoc(docRef(familyId, colName, id))

// ─── Real-time listener ────────────────────────────────────────────────────────
export const subscribeToCol = (familyId, colName, callback, onError) => {
    const q = query(colRef(familyId, colName))
    return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map((d) => d.data())
        callback(docs)
    }, onError)
}

// ─── Batch delete all docs from a kid ─────────────────────────────────────────
export const batchDeleteByKidId = async (familyId, kidId) => {
    const cols = ['dailyTasks', 'dayConfigs', 'ledger', 'goals']
    for (const colName of cols) {
        const q = query(colRef(familyId, colName))
        await new Promise((resolve) => {
            const unsub = onSnapshot(q, async (snapshot) => {
                unsub()
                const batch = writeBatch(db)
                snapshot.docs
                    .filter((d) => d.data().kidId === kidId)
                    .forEach((d) => batch.delete(d.ref))
                await batch.commit()
                resolve()
            })
        })
    }
}
