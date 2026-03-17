import { createContext, useContext, useState, useEffect } from 'react'

export const THEMES = [
    { id: 'dark',   name: 'Space',  emoji: '🌌', colors: ['#7c3aed', '#ec4899'] },
    { id: 'ocean',  name: 'Ocean',  emoji: '🌊', colors: ['#0284c7', '#06b6d4'] },
    { id: 'forest', name: 'Forest', emoji: '🌿', colors: ['#059669', '#10b981'] },
    { id: 'sunset', name: 'Sunset', emoji: '🌅', colors: ['#ea580c', '#f59e0b'] },
    { id: 'candy',  name: 'Candy',  emoji: '🍭', colors: ['#ec4899', '#a855f7'] },
]

const ThemeContext = createContext()
const STORAGE_KEY = 'kidstrack-theme'

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        if (typeof window === 'undefined') return 'dark'
        return localStorage.getItem(STORAGE_KEY) || 'dark'
    })

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem(STORAGE_KEY, theme)
    }, [theme])

    // Apply on first render too
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
    }, [])

    return (
        <ThemeContext.Provider value={{ theme, setTheme: setThemeState, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
