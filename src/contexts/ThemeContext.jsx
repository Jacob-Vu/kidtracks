import { createContext, useContext, useState, useEffect } from 'react'

export const THEMES = [
    { id: 'dark',   name: 'Space',  emoji: '🌌', colors: ['#7c3aed', '#ec4899'] },
    { id: 'ocean',  name: 'Ocean',  emoji: '🌊', colors: ['#0284c7', '#06b6d4'] },
    { id: 'forest', name: 'Forest', emoji: '🌿', colors: ['#059669', '#10b981'] },
    { id: 'sunset', name: 'Sunset', emoji: '🌅', colors: ['#ea580c', '#f59e0b'] },
    { id: 'candy',  name: 'Candy',  emoji: '🍭', colors: ['#ec4899', '#a855f7'] },
]

const ThemeContext = createContext()
const LEGACY_STORAGE_KEY = 'kidstrack-theme'
const STORAGE_KEY = 'kidstrack-theme-config'
const DEFAULT_PRIMARY = '#7c3aed'

const normalizeHex = (raw, fallback = DEFAULT_PRIMARY) => {
    const val = String(raw || '').trim()
    if (/^#[0-9a-fA-F]{6}$/.test(val)) return val.toLowerCase()
    if (/^#[0-9a-fA-F]{3}$/.test(val)) {
        const [r, g, b] = val.slice(1).split('')
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
    }
    return fallback
}

const hexToRgb = (hex) => {
    const h = normalizeHex(hex).slice(1)
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
    }
}

const rgbToHex = ({ r, g, b }) => {
    const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const mix = (baseHex, targetHex, ratio = 0.2) => {
    const a = hexToRgb(baseHex)
    const b = hexToRgb(targetHex)
    return rgbToHex({
        r: a.r + (b.r - a.r) * ratio,
        g: a.g + (b.g - a.g) * ratio,
        b: a.b + (b.b - a.b) * ratio,
    })
}

const alpha = (hex, opacity) => {
    const { r, g, b } = hexToRgb(hex)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

const clearCustomThemeVars = (root) => {
    const vars = [
        '--accent-purple',
        '--accent-purple-light',
        '--gradient-purple',
        '--shadow-glow-purple',
        '--border',
        '--border-light',
        '--bg-card',
        '--bg-card-hover',
    ]
    vars.forEach((key) => root.style.removeProperty(key))
}

const applyCustomThemeVars = (root, customPrimary) => {
    const primary = normalizeHex(customPrimary)
    const light = mix(primary, '#ffffff', 0.25)
    const border = alpha(primary, 0.16)
    const borderLight = alpha(primary, 0.08)
    const bgCard = alpha(primary, 0.08)
    const bgCardHover = alpha(primary, 0.13)
    root.style.setProperty('--accent-purple', primary)
    root.style.setProperty('--accent-purple-light', light)
    root.style.setProperty('--gradient-purple', `linear-gradient(135deg, ${primary}, ${light})`)
    root.style.setProperty('--shadow-glow-purple', `0 0 16px ${alpha(primary, 0.26)}`)
    root.style.setProperty('--border', border)
    root.style.setProperty('--border-light', borderLight)
    root.style.setProperty('--bg-card', bgCard)
    root.style.setProperty('--bg-card-hover', bgCardHover)
}

export function ThemeProvider({ children }) {
    const [themeConfig, setThemeConfig] = useState(() => {
        if (typeof window === 'undefined') {
            return { mode: 'preset', presetId: 'dark', customPrimary: DEFAULT_PRIMARY }
        }
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (raw) {
                const parsed = JSON.parse(raw)
                const mode = parsed?.mode === 'custom' ? 'custom' : 'preset'
                const presetId = THEMES.some((t) => t.id === parsed?.presetId) ? parsed.presetId : 'dark'
                const customPrimary = normalizeHex(parsed?.customPrimary, DEFAULT_PRIMARY)
                return { mode, presetId, customPrimary }
            }
            const legacyTheme = localStorage.getItem(LEGACY_STORAGE_KEY)
            const presetId = THEMES.some((t) => t.id === legacyTheme) ? legacyTheme : 'dark'
            return { mode: 'preset', presetId, customPrimary: DEFAULT_PRIMARY }
        } catch {
            return { mode: 'preset', presetId: 'dark', customPrimary: DEFAULT_PRIMARY }
        }
    })

    useEffect(() => {
        const root = document.documentElement
        const themeId = themeConfig.mode === 'custom' ? 'custom' : themeConfig.presetId
        root.setAttribute('data-theme', themeId)
        if (themeConfig.mode === 'custom') {
            applyCustomThemeVars(root, themeConfig.customPrimary)
        } else {
            clearCustomThemeVars(root)
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(themeConfig))
        localStorage.setItem(LEGACY_STORAGE_KEY, themeConfig.presetId)
    }, [themeConfig])

    // Apply on first render too
    useEffect(() => {
        const root = document.documentElement
        const themeId = themeConfig.mode === 'custom' ? 'custom' : themeConfig.presetId
        root.setAttribute('data-theme', themeId)
        if (themeConfig.mode === 'custom') {
            applyCustomThemeVars(root, themeConfig.customPrimary)
        } else {
            clearCustomThemeVars(root)
        }
    }, [])

    const setTheme = (nextPresetId) => {
        if (!THEMES.some((t) => t.id === nextPresetId)) return
        setThemeConfig((prev) => ({ ...prev, mode: 'preset', presetId: nextPresetId }))
    }

    const setCustomPrimary = (nextColor) => {
        setThemeConfig((prev) => ({ ...prev, mode: 'custom', customPrimary: normalizeHex(nextColor, prev.customPrimary) }))
    }

    const enableCustomTheme = () => {
        setThemeConfig((prev) => ({ ...prev, mode: 'custom' }))
    }

    const activeTheme = themeConfig.mode === 'custom' ? 'custom' : themeConfig.presetId

    return (
        <ThemeContext.Provider value={{
            theme: activeTheme,
            setTheme,
            themes: THEMES,
            themeMode: themeConfig.mode,
            presetThemeId: themeConfig.presetId,
            customPrimary: themeConfig.customPrimary,
            setCustomPrimary,
            enableCustomTheme,
        }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
