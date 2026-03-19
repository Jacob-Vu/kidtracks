import { execSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const rootDir = process.cwd()
const packageJsonPath = path.join(rootDir, 'package.json')
const versionStatePath = path.join(rootDir, 'client-version.json')
const generatedVersionPath = path.join(rootDir, 'src', 'generated', 'client-version.json')

function readJsonSafe(raw, fallback) {
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function resolveCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

function to2Digits(value) {
  return String(value).padStart(2, '0')
}

function formatReleaseStamp(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (Number.isNaN(date.getTime())) return ''
  const mm = to2Digits(date.getUTCMonth() + 1)
  const dd = to2Digits(date.getUTCDate())
  const hh = to2Digits(date.getUTCHours())
  const min = to2Digits(date.getUTCMinutes())
  return `${mm}.${dd}.${hh}.${min}`
}

const packageJson = readJsonSafe(await readFile(packageJsonPath, 'utf8'), {})
const existingState = readJsonSafe(
  await readFile(versionStatePath, 'utf8').catch(() => '{}'),
  {},
)

const previousBuildNumber = Number(existingState.buildNumber) || 0
const buildNumber = previousBuildNumber + 1
const deployedDate = new Date()
const deployedAt = deployedDate.toISOString()
const releaseStamp = formatReleaseStamp(deployedDate)
const appVersion = String(packageJson.version || '0.0.0')
const channel = String(process.env.CLIENT_RELEASE_CHANNEL || 'production')
const commitHash = resolveCommitHash()

const versionPayload = {
  appVersion,
  buildNumber,
  channel,
  commitHash,
  deployedAt,
  releaseStamp,
  display: `v${appVersion}+${buildNumber}`,
}

await writeFile(versionStatePath, `${JSON.stringify(versionPayload, null, 2)}\n`)
await mkdir(path.dirname(generatedVersionPath), { recursive: true })
await writeFile(generatedVersionPath, `${JSON.stringify(versionPayload, null, 2)}\n`)

console.log(`[client-version] ${versionPayload.display} (${channel}) ${deployedAt} ${releaseStamp}`)
