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

if (hasError) {
  process.exit(1)
}

console.log('[i18n] Key parity check passed for: ' + localeNames.join(', '))
