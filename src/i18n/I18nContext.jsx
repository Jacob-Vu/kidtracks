import { createContext, useContext, useState, useCallback } from 'react'
import en from './en'
import vi from './vi'

const translations = { en, vi }

const I18nContext = createContext()

export function I18nProvider({ children }) {
    const [lang, setLangState] = useState(() => localStorage.getItem('kidstrack-lang') || 'vi')

    const setLang = useCallback((newLang) => {
        setLangState(newLang)
        localStorage.setItem('kidstrack-lang', newLang)
    }, [])

    const t = useCallback((key, paramsOrFallback, maybeFallback) => {
        const params = typeof paramsOrFallback === 'object' && paramsOrFallback !== null ? paramsOrFallback : null
        const fallback = typeof paramsOrFallback === 'string'
            ? paramsOrFallback
            : (typeof maybeFallback === 'string' ? maybeFallback : undefined)

        let str = translations[lang]?.[key] || translations.en[key] || fallback || key
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                str = str.replace(`{${k}}`, v)
            })
        }
        return str
    }, [lang])

    return (
        <I18nContext.Provider value={{ lang, setLang, t }}>
            {children}
        </I18nContext.Provider>
    )
}

/** Returns the t(key, params?) translation function */
export function useT() {
    const ctx = useContext(I18nContext)
    if (!ctx) throw new Error('useT must be used within I18nProvider')
    return ctx.t
}

/** Returns { lang, setLang } for the language switcher */
export function useLang() {
    const ctx = useContext(I18nContext)
    if (!ctx) throw new Error('useLang must be used within I18nProvider')
    return { lang: ctx.lang, setLang: ctx.setLang }
}
