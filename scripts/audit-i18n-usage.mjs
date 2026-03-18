import fs from 'node:fs'
import path from 'node:path'
import en from '../src/i18n/en.js'
import vi from '../src/i18n/vi.js'
import DEFAULT_PACKS from '../src/data/defaultTemplates.js'

const SRC_DIR = path.resolve('src')
const locales = { en, vi }
const localeNames = Object.keys(locales)
const strictVi = process.argv.includes('--strict-vi')

const ALLOWED_VI_SAME_AS_EN = new Set([
  'app.name',
  'login.title',
  'dash.linkEmailLabel',
  'dash.reportLegendFull',
  'dash.reportLegendNone',
  'goal.targetPlaceholder',
  'login.kidPasswordPlaceholder',
  'login.simpleUsernameLabel',
  'weekly.trendUp',
  'weekly.trendDown',
])

const JS_EXT = new Set(['.js', '.jsx', '.ts', '.tsx'])
const usageKeys = new Set()
const keySources = new Map()
const dynamicPatterns = []

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
    const ext = path.extname(entry.name)
    if (!JS_EXT.has(ext)) continue

    const content = fs.readFileSync(fullPath, 'utf8')
    const regex = /\b(?:t|tr)\(\s*(['"`])([^'"`]+)\1/g
    let match
    while ((match = regex.exec(content)) !== null) {
      const key = (match[2] || '').trim()
      if (!key || !key.includes('.')) continue
      if (key.includes('${')) {
        dynamicPatterns.push({ key, source: path.relative(process.cwd(), fullPath) })
        continue
      }
      usageKeys.add(key)
      if (!keySources.has(key)) keySources.set(key, new Set())
      keySources.get(key).add(path.relative(process.cwd(), fullPath))
    }
  }
}

walk(SRC_DIR)

const toCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

for (const pattern of dynamicPatterns) {
  if (pattern.key === 'landing.social.metrics.${metric.id}') {
    for (const id of ['families', 'tasks', 'streak']) {
      const concrete = `landing.social.metrics.${id}`
      usageKeys.add(concrete)
      if (!keySources.has(concrete)) keySources.set(concrete, new Set())
      keySources.get(concrete).add(pattern.source)
    }
  }

  if (pattern.key === 'pack.${toCamel(pack.id)}' || pattern.key === 'pack.${toCamel(pack.id)}Desc') {
    for (const pack of DEFAULT_PACKS) {
      const base = `pack.${toCamel(pack.id)}`
      const concrete = pattern.key.endsWith('Desc') ? `${base}Desc` : base
      usageKeys.add(concrete)
      if (!keySources.has(concrete)) keySources.set(concrete, new Set())
      keySources.get(concrete).add(pattern.source)
    }
  }
}

const missing = []
for (const key of [...usageKeys].sort()) {
  for (const locale of localeNames) {
    if (!(key in locales[locale])) {
      missing.push({ key, locale, sources: [...(keySources.get(key) || [])] })
    }
  }
}

const fallbackToKey = []
for (const locale of localeNames) {
  for (const key of Object.keys(locales[locale])) {
    if (String(locales[locale][key]).trim() === key.trim()) {
      fallbackToKey.push({ key, locale })
    }
  }
}

const viSameAsEn = []
for (const key of [...usageKeys].sort()) {
  const enValue = en[key]
  const viValue = vi[key]
  if (typeof enValue !== 'string' || typeof viValue !== 'string') continue
  if (enValue.trim() && viValue.trim() && enValue.trim() === viValue.trim()) {
    viSameAsEn.push({ key, value: enValue })
  }
}

const unexpectedViSameAsEn = viSameAsEn.filter((item) => !ALLOWED_VI_SAME_AS_EN.has(item.key))

const unusedLocaleKeys = {}
for (const locale of localeNames) {
  unusedLocaleKeys[locale] = Object.keys(locales[locale]).filter((key) => !usageKeys.has(key)).sort()
}

const report = {
  generatedAt: new Date().toISOString(),
  usageKeyCount: usageKeys.size,
  dynamicPatternCount: dynamicPatterns.length,
  missing,
  fallbackToKey,
  viSameAsEn,
  unexpectedViSameAsEn,
  unusedLocaleKeys,
}

const reportPath = path.resolve('docs', 'i18n-audit-report.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8')

console.log(`[i18n-audit] usage keys: ${usageKeys.size}`)
console.log(`[i18n-audit] dynamic patterns: ${dynamicPatterns.length}`)
console.log(`[i18n-audit] missing entries: ${missing.length}`)
console.log(`[i18n-audit] value equals key: ${fallbackToKey.length}`)
console.log(`[i18n-audit] vi same as en (used keys): ${viSameAsEn.length}`)
console.log(`[i18n-audit] unexpected vi same as en: ${unexpectedViSameAsEn.length}`)
console.log(`[i18n-audit] report: ${path.relative(process.cwd(), reportPath)}`)

if (missing.length > 0 || fallbackToKey.length > 0 || (strictVi && unexpectedViSameAsEn.length > 0)) {
  process.exit(1)
}
