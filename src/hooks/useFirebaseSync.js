import { useEffect } from 'react'
import { saveDoc, removeDoc, subscribeToCol, batchDeleteByKidId } from '../firebase/db'
import useStore from '../store/useStore'
import { useAuth } from '../contexts/AuthContext'

export function useFireSync() {
    const { familyId, user } = useAuth()
    const { setIsLoading, setKids, setTemplates, setDailyTasks, setDayConfigs, setLedger, setError } = useStore()

    useEffect(() => {
        // Only sync when authenticated and have a familyId
        if (!user || !familyId) {
            setIsLoading(false)
            return
        }
        setIsLoading(true)

        let loaded = { kids: false, templates: false, dailyTasks: false, dayConfigs: false, ledger: false }
        const checkAllLoaded = () => {
            if (Object.values(loaded).every(Boolean)) setIsLoading(false)
        }
        const handleError = (err) => {
            console.error('Firestore error:', err)
            if (err?.code === 'permission-denied') { setError('permission-denied'); setIsLoading(false) }
        }

        const unsubKids = subscribeToCol(familyId, 'kids', (docs) => { setKids(docs); loaded.kids = true; checkAllLoaded() }, handleError)
        const unsubTemplates = subscribeToCol(familyId, 'templates', (docs) => { setTemplates(docs); loaded.templates = true; checkAllLoaded() }, handleError)
        const unsubTasks = subscribeToCol(familyId, 'dailyTasks', (docs) => { setDailyTasks(docs); loaded.dailyTasks = true; checkAllLoaded() }, handleError)
        const unsubConfigs = subscribeToCol(familyId, 'dayConfigs', (docs) => { setDayConfigs(docs); loaded.dayConfigs = true; checkAllLoaded() }, handleError)
        const unsubLedger = subscribeToCol(familyId, 'ledger', (docs) => { setLedger(docs); loaded.ledger = true; checkAllLoaded() }, handleError)

        return () => { unsubKids(); unsubTemplates(); unsubTasks(); unsubConfigs(); unsubLedger() }
    }, [user, familyId])
}

export function useFireActions() {
    const { familyId } = useAuth()
    const store = useStore()

    return {
        addKid: async (name, avatar) => {
            const kid = { id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36), displayName: name, name, avatar: avatar || '🧒', balance: 0 }
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
        addTemplate: async (title, description) => {
            await saveDoc(familyId, 'templates', store.buildTemplate(title, description))
        },
        updateTemplate: async (id, updates) => {
            const tmpl = store.templates.find((t) => t.id === id)
            if (tmpl) await saveDoc(familyId, 'templates', { ...tmpl, ...updates })
        },
        deleteTemplate: async (id) => removeDoc(familyId, 'templates', id),
        addDailyTask: async (kidId, date, title, description) => {
            await saveDoc(familyId, 'dailyTasks', store.buildDailyTask(kidId, date, title, description))
        },
        loadTemplatesForDay: async (kidId, date) => {
            const tasks = store.buildLoadedTemplates(kidId, date)
            await Promise.all(tasks.map((t) => saveDoc(familyId, 'dailyTasks', t)))
        },
        updateDailyTask: async (id, updates) => {
            const task = store.dailyTasks.find((t) => t.id === id)
            if (task) await saveDoc(familyId, 'dailyTasks', { ...task, ...updates })
        },
        deleteDailyTask: async (id) => removeDoc(familyId, 'dailyTasks', id),
        toggleTaskStatus: async (id) => {
            const updated = store.buildTaskToggle(id)
            if (updated) await saveDoc(familyId, 'dailyTasks', updated)
        },
        markTaskFailed: async (id) => {
            const updated = store.buildTaskFailed(id)
            if (updated) await saveDoc(familyId, 'dailyTasks', updated)
        },
        setDayConfig: async (kidId, date, rewardAmount, penaltyAmount) => {
            await saveDoc(familyId, 'dayConfigs', store.buildDayConfig(kidId, date, rewardAmount, penaltyAmount))
        },
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
        addManualTransaction: async (kidId, amount, label) => {
            const result = store.buildManualTransaction(kidId, amount, label)
            if (!result) return
            await Promise.all([saveDoc(familyId, 'ledger', result.entry), saveDoc(familyId, 'kids', result.updatedKid)])
        },
    }
}
