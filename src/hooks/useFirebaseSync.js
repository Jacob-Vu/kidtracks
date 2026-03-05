import { useEffect } from 'react'
import { saveDoc, removeDoc, subscribeToCol, batchDeleteByKidId } from '../firebase/db'
import useStore from '../store/useStore'

/**
 * useFireSync — subscribes to all Firestore collections for the current familyId
 * and hydrates the Zustand store. Also provides action helpers that write to
 * Firestore (triggering the onSnapshot → store update loop).
 */
export function useFireSync() {
    const {
        familyId,
        setIsLoading, setKids, setTemplates, setDailyTasks, setDayConfigs, setLedger,
        setError,
    } = useStore()

    useEffect(() => {
        if (!familyId) return

        let loaded = { kids: false, templates: false, dailyTasks: false, dayConfigs: false, ledger: false }
        const checkAllLoaded = () => {
            if (Object.values(loaded).every(Boolean)) setIsLoading(false)
        }

        const handleError = (err) => {
            console.error('Firestore error:', err)
            if (err?.code === 'permission-denied') {
                setError('permission-denied')
                setIsLoading(false)
            }
        }

        const unsubKids = subscribeToCol(familyId, 'kids', (docs) => {
            setKids(docs); loaded.kids = true; checkAllLoaded()
        }, handleError)
        const unsubTemplates = subscribeToCol(familyId, 'templates', (docs) => {
            setTemplates(docs); loaded.templates = true; checkAllLoaded()
        }, handleError)
        const unsubTasks = subscribeToCol(familyId, 'dailyTasks', (docs) => {
            setDailyTasks(docs); loaded.dailyTasks = true; checkAllLoaded()
        }, handleError)
        const unsubConfigs = subscribeToCol(familyId, 'dayConfigs', (docs) => {
            setDayConfigs(docs); loaded.dayConfigs = true; checkAllLoaded()
        }, handleError)
        const unsubLedger = subscribeToCol(familyId, 'ledger', (docs) => {
            setLedger(docs); loaded.ledger = true; checkAllLoaded()
        }, handleError)

        return () => {
            unsubKids(); unsubTemplates(); unsubTasks(); unsubConfigs(); unsubLedger()
        }
    }, [familyId])
}


// ─── Action helpers ────────────────────────────────────────────────────────────
// Each helper writes to Firestore; onSnapshot then updates the store automatically.

export function useFireActions() {
    const store = useStore()
    const { familyId } = store

    return {
        // ── Kids ──
        addKid: async (name, avatar) => {
            const kid = store.addKid(name, avatar)
            await saveDoc(familyId, 'kids', kid)
        },
        updateKid: async (id, updates) => {
            const updated = store.buildKidUpdate(id, updates)
            if (updated) await saveDoc(familyId, 'kids', updated)
        },
        deleteKid: async (id) => {
            await removeDoc(familyId, 'kids', id)
            await batchDeleteByKidId(familyId, id)
        },

        // ── Templates ──
        addTemplate: async (title, description) => {
            const tmpl = store.buildTemplate(title, description)
            await saveDoc(familyId, 'templates', tmpl)
        },
        updateTemplate: async (id, updates) => {
            const tmpl = store.templates.find((t) => t.id === id)
            if (tmpl) await saveDoc(familyId, 'templates', { ...tmpl, ...updates })
        },
        deleteTemplate: async (id) => {
            await removeDoc(familyId, 'templates', id)
        },

        // ── Daily Tasks ──
        addDailyTask: async (kidId, date, title, description) => {
            const task = store.buildDailyTask(kidId, date, title, description)
            await saveDoc(familyId, 'dailyTasks', task)
        },
        loadTemplatesForDay: async (kidId, date) => {
            const newTasks = store.buildLoadedTemplates(kidId, date)
            await Promise.all(newTasks.map((t) => saveDoc(familyId, 'dailyTasks', t)))
        },
        updateDailyTask: async (id, updates) => {
            const task = store.dailyTasks.find((t) => t.id === id)
            if (task) await saveDoc(familyId, 'dailyTasks', { ...task, ...updates })
        },
        deleteDailyTask: async (id) => {
            await removeDoc(familyId, 'dailyTasks', id)
        },
        toggleTaskStatus: async (id) => {
            const updated = store.buildTaskToggle(id)
            if (updated) await saveDoc(familyId, 'dailyTasks', updated)
        },
        markTaskFailed: async (id) => {
            const updated = store.buildTaskFailed(id)
            if (updated) await saveDoc(familyId, 'dailyTasks', updated)
        },

        // ── Day Config ──
        setDayConfig: async (kidId, date, rewardAmount, penaltyAmount) => {
            const config = store.buildDayConfig(kidId, date, rewardAmount, penaltyAmount)
            await saveDoc(familyId, 'dayConfigs', config)
        },

        // ── Finalize ──
        finalizeDay: async (kidId, date) => {
            const result = store.computeFinalize(kidId, date)
            if (!result.success) return result
            await Promise.all([
                saveDoc(familyId, 'kids', result.updatedKid),
                saveDoc(familyId, 'dayConfigs', result.updatedConfig),
                ...result.ledgerEntries.map((e) => saveDoc(familyId, 'ledger', e)),
            ])
            return result
        },

        // ── Manual transaction ──
        addManualTransaction: async (kidId, amount, label) => {
            const result = store.buildManualTransaction(kidId, amount, label)
            if (!result) return
            await Promise.all([
                saveDoc(familyId, 'ledger', result.entry),
                saveDoc(familyId, 'kids', result.updatedKid),
            ])
        },
    }
}
