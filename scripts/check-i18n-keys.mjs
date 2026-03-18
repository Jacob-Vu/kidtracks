import fs from 'node:fs'
import path from 'node:path'
import en from '../src/i18n/en.js'
import vi from '../src/i18n/vi.js'

const locales = { en, vi }
const localeNames = Object.keys(locales)

const allKeys = new Set()
for (const data of Object.values(locales)) {
  Object.keys(data).forEach((key) => allKeys.add(key))
}

let hasError = false
for (const locale of localeNames) {
  const data = locales[locale]
  const missing = [...allKeys].filter((key) => !(key in data)).sort()
  if (missing.length > 0) {
    hasError = true
    console.error(`[i18n] Missing keys in ${locale}:`)
    missing.forEach((key) => console.error(`  - ${key}`))
  }
}

const SRC_DIR = path.resolve('src')
const JS_EXT = new Set(['.js', '.jsx', '.ts', '.tsx'])
const hardcodedTernaryHits = []

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
      continue
    }
    if (!JS_EXT.has(path.extname(entry.name))) continue

    const content = fs.readFileSync(fullPath, 'utf8')
    const pattern = /lang\s*===\s*['\"]vi['\"]\s*\?\s*['\"`][^'\"`]+['\"`]\s*:\s*['\"`][^'\"`]+['\"`]/g
    const matches = content.match(pattern)
    if (matches?.length) {
      hardcodedTernaryHits.push({
        file: path.relative(process.cwd(), fullPath),
        count: matches.length,
      })
    }
  }
}

walk(SRC_DIR)
if (hardcodedTernaryHits.length > 0) {
  hasError = true
  console.error('[i18n] Found hardcoded vi/en ternary text:')
  hardcodedTernaryHits.forEach((hit) => console.error(`  - ${hit.file}: ${hit.count}`))
  console.error('[i18n] Please move these strings to i18n keys and use t(...)')
}

if (hasError) {
  process.exit(1)
}

console.log('[i18n] Key parity check passed for: ' + localeNames.join(', '))
