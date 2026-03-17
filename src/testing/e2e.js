const E2E_STORAGE_KEY = 'kidstrack-e2e-state'
const E2E_EVENT = 'kidstrack:e2e-state-change'

const hasWindow = () => typeof window !== 'undefined'

export const isE2EMode = () => {
    if (!hasWindow()) return false
    return window.location.search.includes('e2e=1') || localStorage.getItem(E2E_STORAGE_KEY) !== null
}

const defaultState = () => ({
    user: null,
    profile: null,
    collections: {
        kids: [],
        templates: [],
        dailyTasks: [],
        dayConfigs: [],
        ledger: [],
        goals: [],
    },
})

export const getE2EState = () => {
    if (!hasWindow()) return defaultState()
    const raw = localStorage.getItem(E2E_STORAGE_KEY)
    if (!raw) return defaultState()

    try {
        const parsed = JSON.parse(raw)
        return {
            ...defaultState(),
            ...parsed,
            collections: {
                ...defaultState().collections,
                ...(parsed.collections || {}),
            },
        }
    } catch {
        return defaultState()
    }
}

export const setE2EState = (nextState) => {
    if (!hasWindow()) return defaultState()
    const normalized = {
        ...defaultState(),
        ...nextState,
        collections: {
            ...defaultState().collections,
            ...(nextState?.collections || {}),
        },
    }
    localStorage.setItem(E2E_STORAGE_KEY, JSON.stringify(normalized))
    window.dispatchEvent(new CustomEvent(E2E_EVENT, { detail: normalized }))
    return normalized
}

export const updateE2EState = (updater) => {
    const current = getE2EState()
    const next = updater(current)
    return setE2EState(next)
}

export const subscribeToE2EState = (listener) => {
    if (!hasWindow()) return () => {}

    const handler = (event) => {
        listener(event.detail || getE2EState())
    }

    window.addEventListener(E2E_EVENT, handler)
    return () => window.removeEventListener(E2E_EVENT, handler)
}

export const clearE2EState = () => {
    if (!hasWindow()) return
    localStorage.removeItem(E2E_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent(E2E_EVENT, { detail: defaultState() }))
}
