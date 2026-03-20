import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const SOURCE_PROJECT = process.env.SOURCE_PROJECT || 'kidtracks-e50ac'
const TARGET_PROJECT = process.env.TARGET_PROJECT || 'kidstrack-71632'
const SOURCE_DATABASE_ID = process.env.SOURCE_FIRESTORE_DATABASE_ID || '(default)'
const TARGET_DATABASE_ID = process.env.TARGET_FIRESTORE_DATABASE_ID || 'default'
const PAGE_SIZE = Number(process.env.PAGE_SIZE || '200')

function loadAccessToken() {
    const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json')
    const raw = fs.readFileSync(configPath, 'utf8')
    const config = JSON.parse(raw)
    const token = config?.tokens?.access_token
    const expiresAt = Number(config?.tokens?.expires_at || 0)
    if (!token) throw new Error(`No access token found in ${configPath}`)
    if (!expiresAt || Date.now() >= expiresAt) {
        throw new Error('Firebase CLI access token is expired. Run `firebase login --reauth` and retry.')
    }
    return token
}

const accessToken = loadAccessToken()

function encodeDocPath(docPath) {
    return docPath
        .split('/')
        .filter(Boolean)
        .map((s) => encodeURIComponent(s))
        .join('/')
}

function sourceDocumentsBase() {
    return `https://firestore.googleapis.com/v1/projects/${SOURCE_PROJECT}/databases/${encodeURIComponent(SOURCE_DATABASE_ID)}/documents`
}

function targetDocumentsBase() {
    return `https://firestore.googleapis.com/v1/projects/${TARGET_PROJECT}/databases/${encodeURIComponent(TARGET_DATABASE_ID)}/documents`
}

async function api(url, options = {}, attempt = 1) {
    const res = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    })

    if (res.ok) return res

    const text = await res.text()
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
        const waitMs = 500 * 2 ** (attempt - 1)
        await new Promise((r) => setTimeout(r, waitMs))
        return api(url, options, attempt + 1)
    }

    throw new Error(`HTTP ${res.status} for ${url}\n${text}`)
}

async function listCollectionIds(parentDocPath = '') {
    let pageToken = ''
    const out = []
    do {
        const parentUrl = parentDocPath
            ? `${sourceDocumentsBase()}/${encodeDocPath(parentDocPath)}:listCollectionIds`
            : `${sourceDocumentsBase()}:listCollectionIds`
        const res = await api(parentUrl, {
            method: 'POST',
            body: JSON.stringify({
                pageSize: PAGE_SIZE,
                ...(pageToken ? { pageToken } : {}),
            }),
        })
        const data = await res.json()
        out.push(...(data.collectionIds || []))
        pageToken = data.nextPageToken || ''
    } while (pageToken)

    return out
}

async function listDocumentsInCollection(collectionPath) {
    let pageToken = ''
    const docs = []
    do {
        const url = `${sourceDocumentsBase()}/${encodeDocPath(collectionPath)}?pageSize=${PAGE_SIZE}${
            pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''
        }`
        const res = await api(url, { method: 'GET' })
        const data = await res.json()
        docs.push(...(data.documents || []))
        pageToken = data.nextPageToken || ''
    } while (pageToken)

    return docs
}

function docPathFromName(fullName, projectId) {
    const marker = `projects/${projectId}/databases/${SOURCE_DATABASE_ID}/documents/`
    const idx = fullName.indexOf(marker)
    if (idx === -1) {
        throw new Error(`Unexpected document name format: ${fullName}`)
    }
    return fullName.slice(idx + marker.length)
}

async function writeTargetDoc(docPath, fields) {
    const url = `${targetDocumentsBase()}/${encodeDocPath(docPath)}`
    await api(url, {
        method: 'PATCH',
        body: JSON.stringify({
            fields: fields || {},
        }),
    })
}

let copiedCount = 0

async function copyCollectionRecursive(collectionPath) {
    const docs = await listDocumentsInCollection(collectionPath)
    for (const doc of docs) {
        const srcDocPath = docPathFromName(doc.name, SOURCE_PROJECT)
        await writeTargetDoc(srcDocPath, doc.fields)
        copiedCount += 1
        if (copiedCount % 50 === 0) {
            console.log(`[copy] ${copiedCount} documents copied...`)
        }

        const subCollections = await listCollectionIds(srcDocPath)
        for (const subCollectionId of subCollections) {
            const subCollectionPath = `${srcDocPath}/${subCollectionId}`
            await copyCollectionRecursive(subCollectionPath)
        }
    }
}

async function main() {
    console.log(
        `[start] Source: ${SOURCE_PROJECT}/${SOURCE_DATABASE_ID}, Target: ${TARGET_PROJECT}/${TARGET_DATABASE_ID}`,
    )
    const rootCollections = await listCollectionIds('')
    if (!rootCollections.length) {
        console.log('[done] No source collections found.')
        return
    }

    for (const rootCollection of rootCollections) {
        console.log(`[copy] Root collection: ${rootCollection}`)
        await copyCollectionRecursive(rootCollection)
    }

    console.log(`[done] Copied ${copiedCount} documents from ${SOURCE_PROJECT} to ${TARGET_PROJECT}.`)
}

main().catch((err) => {
    console.error('[error] Firestore copy failed.')
    console.error(err?.stack || err?.message || String(err))
    process.exit(1)
})
