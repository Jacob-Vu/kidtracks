import { useEffect } from 'react'
import { saveDoc, removeDoc, subscribeToCol, batchDeleteByKidId } from '../firebase/db'
import useStore from '../store/useStore'
import { useAuth } from '../contexts/AuthContext'
import { getE2EState, isE2EMode, subscribeToE2EState, updateE2EState } from '../testing/e2e'

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

export function useFireSync() {
    const { familyId, user } = useAuth()
    const { setIsLoading, setKids, setTemplates, setDailyTasks, setDayConfigs, setLedger, setError } = useStore()

    useEffect(() => {
        if (isE2EMode()) {
            const syncFromE2E = (state = getE2EState()) => {
                setKids(state.collections.kids)
                setTemplates(state.collections.templates)
                setDailyTasks(state.collections.dailyTasks)
                setDayConfigs(state.collections.dayConfigs)
                setLedger(state.collections.ledger)
                setError(null)
                setIsLoading(false)
            }

            syncFromE2E()
            return subscribeToE2EState(syncFromE2E)
        }

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

    if (isE2EMode()) {
        return {
            addKid: async (name, avatar) => {
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        kids: [
                            ...state.collections.kids,
                            {
                                id: generateId(),
                                displayName: name,
                                name,
                                avatar: avatar || '🧒',
                                balance: 0,
                            },
                        ],
                    },
                }))
            },
            updateKid: async (id, updates) => {
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        kids: state.collections.kids.map((kid) => kid.id === id ? { ...kid, ...updates } : kid),
                    },
                }))
            },
            deleteKid: async (id) => {
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        kids: state.collections.kids.filter((kid) => kid.id !== id),
                        dailyTasks: state.collections.dailyTasks.filter((task) => task.kidId !== id),
                        dayConfigs: state.collections.dayConfigs.filter((config) => config.kidId !== id),
                        ledger: state.collections.ledger.filter((entry) => entry.kidId !== id),
                    },
                }))
            },
            addTemplate: async (title, description) => {
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        templates: [...state.collections.templates, store.buildTemplate(title, description)],
                    },
                }))
            },
            updateTemplate: async (id, updates) => {
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        templates: state.collections.templates.map((tmpl) => tmpl.id === id ? { ...tmpl, ...updates } : tmpl),
                    },
                }))
            },
            deleteTemplate: async (id) => {
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        templates: state.collections.templates.filter((tmpl) => tmpl.id !== id),
                    },
                }))
            },
            importDefaultPack: async (pack, selectedTasks) => {
                const tasksToImport = selectedTasks || pack.tasks
                let importedCount = 0

                updateE2EState((state) => {
                    const existingTitles = state.collections.templates.map((tmpl) => tmpl.title)
                    const newTemplates = tasksToImport
                        .filter((task) => !existingTitles.includes(task.title))
                        .map((task) => ({
                            id: generateId(),
                            title: task.title,
                            description: task.description,
                            assignedKidIds: [],
                            importedFrom: pack.id,
                        }))

                    importedCount = newTemplates.length
                    return {
                        ...state,
                        collections: {
                            ...state.collections,
                            templates: [...state.collections.templates, ...newTemplates],
                        },
                    }
                })

                return importedCount
            },
            assignTemplateToKids: async (templateId, kidIds) => {
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        templates: state.collections.templates.map((tmpl) =>
                            tmpl.id === templateId ? { ...tmpl, assignedKidIds: kidIds } : tmpl
                        ),
                    },
                }))
            },
            addDailyTask: async (kidId, date, title, description) => {
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        dailyTasks: [...state.collections.dailyTasks, store.buildDailyTask(kidId, date, title, description)],
                    },
                }))
            },
            loadTemplatesForDay: async (kidId, date) => {
                updateE2EState((state) => {
                    const existingTitles = state.collections.dailyTasks
                        .filter((task) => task.kidId === kidId && task.date === date)
                        .map((task) => task.title)

                    const tasks = state.collections.templates
                        .filter((tmpl) => {
                            const assigned = tmpl.assignedKidIds
                            if (assigned && assigned.length > 0 && !assigned.includes(kidId)) return false
                            return !existingTitles.includes(tmpl.title)
                        })
                        .map((tmpl) => store.buildDailyTask(kidId, date, tmpl.title, tmpl.description))

                    return {
                        ...state,
                        collections: {
                            ...state.collections,
                            dailyTasks: [...state.collections.dailyTasks, ...tasks],
                        },
                    }
                })
            },
            syncAssignedTemplatesForDay: async (kidId, date) => {
                updateE2EState((state) => {
                    const existingTitles = state.collections.dailyTasks
                        .filter((task) => task.kidId === kidId && task.date === date)
                        .map((task) => task.title)

                    const tasks = state.collections.templates
                        .filter((tmpl) => {
                            const assigned = tmpl.assignedKidIds
                            if (!assigned || !assigned.includes(kidId)) return false
                            return !existingTitles.includes(tmpl.title)
                        })
                        .map((tmpl) => store.buildDailyTask(kidId, date, tmpl.title, tmpl.description))

                    if (tasks.length === 0) return state

                    return {
                        ...state,
                        collections: {
                            ...state.collections,
                            dailyTasks: [...state.collections.dailyTasks, ...tasks],
                        },
                    }
                })
            },
            updateDailyTask: async (id, updates) => {
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        dailyTasks: state.collections.dailyTasks.map((task) => task.id === id ? { ...task, ...updates } : task),
                    },
                }))
            },
            deleteDailyTask: async (id) => {
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        dailyTasks: state.collections.dailyTasks.filter((task) => task.id !== id),
                    },
                }))
            },
            toggleTaskStatus: async (id) => {
                const updated = store.buildTaskToggle(id)
                if (!updated) return
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        dailyTasks: state.collections.dailyTasks.map((task) => task.id === id ? updated : task),
                    },
                }))
            },
            markTaskFailed: async (id) => {
                const updated = store.buildTaskFailed(id)
                if (!updated) return
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        dailyTasks: state.collections.dailyTasks.map((task) => task.id === id ? updated : task),
                    },
                }))
            },
            setDayConfig: async (kidId, date, rewardAmount, penaltyAmount) => {
                const nextConfig = store.buildDayConfig(kidId, date, rewardAmount, penaltyAmount)
                updateE2EState((state) => {
                    const exists = state.collections.dayConfigs.some((config) => config.id === nextConfig.id)
                    return {
                        ...state,
                        collections: {
                            ...state.collections,
                            dayConfigs: exists
                                ? state.collections.dayConfigs.map((config) => config.id === nextConfig.id ? nextConfig : config)
                                : [...state.collections.dayConfigs, nextConfig],
                        },
                    }
                })
            },
            finalizeDay: async (kidId, date) => {
                const result = store.computeFinalize(kidId, date)
                if (!result.success) return result

                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        kids: state.collections.kids.map((kid) => kid.id === kidId ? result.updatedKid : kid),
                        dayConfigs: state.collections.dayConfigs.map((config) => config.id === result.updatedConfig.id ? result.updatedConfig : config),
                        ledger: [...state.collections.ledger, ...result.ledgerEntries],
                    },
                }))

                return result
            },
            addManualTransaction: async (kidId, amount, label) => {
                const result = store.buildManualTransaction(kidId, amount, label)
                if (!result) return

                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        kids: state.collections.kids.map((kid) => kid.id === kidId ? result.updatedKid : kid),
                        ledger: [...state.collections.ledger, result.entry],
                    },
                }))
            },
        }
    }

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
        importDefaultPack: async (pack, selectedTasks) => {
            const tasksToImport = selectedTasks || pack.tasks
            const existingTitles = store.templates.map((t) => t.title)
            const newTasks = tasksToImport.filter((t) => !existingTitles.includes(t.title))
            const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
            await Promise.all(
                newTasks.map((t) =>
                    saveDoc(familyId, 'templates', {
                        id: generateId(),
                        title: t.title,
                        description: t.description,
                        assignedKidIds: [],
                        importedFrom: pack.id,
                    })
                )
            )
            return newTasks.length
        },
        assignTemplateToKids: async (templateId, kidIds) => {
            const tmpl = store.templates.find((t) => t.id === templateId)
            if (tmpl) await saveDoc(familyId, 'templates', { ...tmpl, assignedKidIds: kidIds })
        },
        addDailyTask: async (kidId, date, title, description) => {
            await saveDoc(familyId, 'dailyTasks', store.buildDailyTask(kidId, date, title, description))
        },
        loadTemplatesForDay: async (kidId, date) => {
            const existing = store.dailyTasks.filter((t) => t.kidId === kidId && t.date === date).map((t) => t.title)
            const tasks = store.templates.filter((t) => {
                const assigned = t.assignedKidIds
                if (assigned && assigned.length > 0 && !assigned.includes(kidId)) return false
                return !existing.includes(t.title)
            }).map((t) => store.buildDailyTask(kidId, date, t.title, t.description))

            await Promise.all(tasks.map((t) => saveDoc(familyId, 'dailyTasks', t)))
        },
        syncAssignedTemplatesForDay: async (kidId, date) => {
            const existing = store.dailyTasks.filter((t) => t.kidId === kidId && t.date === date).map((t) => t.title)
            const tasks = store.templates.filter((t) => {
                const assigned = t.assignedKidIds
                if (!assigned || !assigned.includes(kidId)) return false
                return !existing.includes(t.title)
            }).map((t) => store.buildDailyTask(kidId, date, t.title, t.description))

            if (tasks.length > 0) {
                await Promise.all(tasks.map((t) => saveDoc(familyId, 'dailyTasks', t)))
            }
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
