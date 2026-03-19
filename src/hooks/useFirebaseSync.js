import { useEffect } from 'react'
import { subscribeToCol } from '../firebase/db'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../firebase/config'
import useStore from '../store/useStore'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../i18n/I18nContext'
import { getE2EState, isE2EMode, subscribeToE2EState, updateE2EState } from '../testing/e2e'
import DEFAULT_PACKS from '../data/defaultTemplates'

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
const functions = getFunctions(app, 'asia-southeast1')
const defaultTaskViByTitle = new Map(
    DEFAULT_PACKS.flatMap((pack) => pack.tasks.map((task) => [task.title, task.descriptionVi || '']))
)

export function useFireSync() {
    const { familyId, user } = useAuth()
    const { setIsLoading, setKids, setTemplates, setDailyTasks, setDayConfigs, setLedger, setGoals, setBadges, setError } = useStore()

    useEffect(() => {
        if (isE2EMode()) {
            const syncFromE2E = (state = getE2EState()) => {
                setKids(state.collections.kids)
                setTemplates(state.collections.templates)
                setDailyTasks(state.collections.dailyTasks)
                setDayConfigs(state.collections.dayConfigs)
                setLedger(state.collections.ledger)
                setGoals(state.collections.goals)
                setBadges(state.collections.badges)
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

        let loaded = { kids: false, templates: false, dailyTasks: false, dayConfigs: false, ledger: false, goals: false, badges: false }
        const checkAllLoaded = () => {
            if (Object.values(loaded).every(Boolean)) setIsLoading(false)
        }
        const handleError = (err) => {
            console.error('Firestore error:', err)
            if (err?.code === 'permission-denied') { setError('permission-denied'); setIsLoading(false) }
        }

        // Real-time reads remain unchanged for immediate UI updates
        const unsubKids = subscribeToCol(familyId, 'kids', (docs) => { setKids(docs); loaded.kids = true; checkAllLoaded() }, handleError)
        const unsubTemplates = subscribeToCol(familyId, 'templates', (docs) => { setTemplates(docs); loaded.templates = true; checkAllLoaded() }, handleError)
        const unsubTasks = subscribeToCol(familyId, 'dailyTasks', (docs) => { setDailyTasks(docs); loaded.dailyTasks = true; checkAllLoaded() }, handleError)
        const unsubConfigs = subscribeToCol(familyId, 'dayConfigs', (docs) => { setDayConfigs(docs); loaded.dayConfigs = true; checkAllLoaded() }, handleError)
        const unsubLedger = subscribeToCol(familyId, 'ledger', (docs) => { setLedger(docs); loaded.ledger = true; checkAllLoaded() }, handleError)
        const unsubGoals = subscribeToCol(familyId, 'goals', (docs) => { setGoals(docs); loaded.goals = true; checkAllLoaded() }, handleError)
        const unsubBadges = subscribeToCol(familyId, 'badges', (docs) => { setBadges(docs); loaded.badges = true; checkAllLoaded() }, handleError)

        return () => { unsubKids(); unsubTemplates(); unsubTasks(); unsubConfigs(); unsubLedger(); unsubGoals(); unsubBadges() }
    }, [user, familyId])
}

export function useFireActions() {
    const { familyId } = useAuth()
    const { lang } = useLang()
    const isVi = lang.startsWith('vi')
    const store = useStore()

    const getTemplateDescription = (template) => {
        if (isVi && !template?.descriptions?.vi) {
            const defaultVi = defaultTaskViByTitle.get(template?.title)
            if (defaultVi) return defaultVi
        }
        if (template?.descriptions?.[lang]) return template.descriptions[lang]
        if (template?.descriptions?.en) return template.descriptions.en
        if (template?.descriptions?.vi) return template.descriptions.vi
        return template?.description || ''
    }

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
                        goals: state.collections.goals.filter((goal) => goal.kidId !== id),
                        badges: state.collections.badges.filter((badge) => badge.kidId !== id),
                    },
                }))
            },
            addTemplate: async (title, descriptionByLang) => {
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        templates: [...state.collections.templates, store.buildTemplate(title, descriptionByLang)],
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
                            descriptions: {
                                en: task.description || '',
                                vi: task.descriptionVi || task.description || '',
                            },
                            description: task.description || task.descriptionVi || '',
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
                        .map((tmpl) => store.buildDailyTask(kidId, date, tmpl.title, getTemplateDescription(tmpl)))

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
                        .map((tmpl) => store.buildDailyTask(kidId, date, tmpl.title, getTemplateDescription(tmpl)))

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
            addGoal: async (kidId, title, targetAmount, icon, dueDate) => {
                const goal = store.buildGoal(kidId, title, targetAmount, icon, dueDate)
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        goals: [...state.collections.goals, goal],
                    },
                }))
            },
            updateGoal: async (goalId, updates) => {
                const updated = store.buildGoalUpdate(goalId, updates)
                if (!updated) return
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        goals: state.collections.goals.map((goal) => goal.id === goalId ? updated : goal),
                    },
                }))
            },
            deleteGoal: async (goalId) => {
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        goals: state.collections.goals.filter((goal) => goal.id !== goalId),
                    },
                }))
            },
            upsertBadge: async (kidId, code, unlockedAt) => {
                const badge = store.buildBadge(kidId, code, unlockedAt)
                updateE2EState((state) => {
                    const exists = state.collections.badges.some((b) => b.id === badge.id)
                    return {
                        ...state,
                        collections: {
                            ...state.collections,
                            badges: exists
                                ? state.collections.badges.map((b) => b.id === badge.id ? badge : b)
                                : [...state.collections.badges, badge],
                        },
                    }
                })
            },
            saveRoutine: async (kidId, tasks, fromDate) => {
                const routine = {
                    tasks: tasks.map(({ title, description }) => ({ title, description: description || '' })),
                    savedAt: new Date().toISOString(),
                    savedFromDate: fromDate,
                }
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        kids: state.collections.kids.map((kid) => kid.id === kidId ? { ...kid, routine } : kid),
                    },
                }))
            },
            clearDayTasks: async (kidId, date) => {
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        dailyTasks: state.collections.dailyTasks.filter((t) => !(t.kidId === kidId && t.date === date)),
                    },
                }))
            },
            autoLoadRoutine: async (kidId, date, routineTasks) => {
                const existing = store.dailyTasks.filter((t) => t.kidId === kidId && t.date === date).map((t) => t.title)
                const tasksToCreate = routineTasks
                    .filter((t) => !existing.includes(t.title))
                    .map((t) => store.buildDailyTask(kidId, date, t.title, t.description))
                if (tasksToCreate.length === 0) return 0
                updateE2EState((state) => ({
                    ...state,
                    collections: {
                        ...state.collections,
                        dailyTasks: [...state.collections.dailyTasks, ...tasksToCreate],
                    },
                }))
                return tasksToCreate.length
            },
        }
    }

    return {
        addKid: async (name, avatar) => {
            const id = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            const call = httpsCallable(functions, 'addKid');
            await call({ familyId, name, avatar, id });
        },
        updateKid: async (kidId, updates) => {
            const updated = store.buildKidUpdate(kidId, updates)
            if (updated) {
                const call = httpsCallable(functions, 'updateKid');
                await call({ familyId, kidId, updates: updated });
            }
        },
        deleteKid: async (kidId) => {
            const call = httpsCallable(functions, 'deleteKid');
            await call({ familyId, kidId });
        },
        addTemplate: async (title, descriptionByLang) => {
            const template = store.buildTemplate(title, descriptionByLang);
            const call = httpsCallable(functions, 'addTemplate');
            await call({ familyId, template });
        },
        updateTemplate: async (templateId, updates) => {
            const call = httpsCallable(functions, 'updateTemplate');
            await call({ familyId, templateId, updates });
        },
        deleteTemplate: async (templateId) => {
            const call = httpsCallable(functions, 'deleteTemplate');
            await call({ familyId, templateId });
        },
        importDefaultPack: async (pack, selectedTasks) => {
            const call = httpsCallable(functions, 'importDefaultPack');
            const result = await call({ familyId, pack, selectedTasks });
            return result.data.count;
        },
        assignTemplateToKids: async (templateId, kidIds) => {
            const call = httpsCallable(functions, 'assignTemplateToKids');
            await call({ familyId, templateId, kidIds });
        },
        addDailyTask: async (kidId, date, title, description) => {
            const task = store.buildDailyTask(kidId, date, title, description);
            const call = httpsCallable(functions, 'addDailyTask');
            await call({ familyId, task });
        },
        loadTemplatesForDay: async (kidId, date) => {
            const existing = store.dailyTasks.filter((t) => t.kidId === kidId && t.date === date).map((t) => t.title);
            const tasksToCreate = store.templates.filter((t) => {
                const assigned = t.assignedKidIds;
                if (assigned && assigned.length > 0 && !assigned.includes(kidId)) return false;
                return !existing.includes(t.title);
            }).map((t) => store.buildDailyTask(kidId, date, t.title, getTemplateDescription(t)));

            if (tasksToCreate.length > 0) {
                const call = httpsCallable(functions, 'loadTemplatesForDay');
                await call({ familyId, tasksToCreate });
            }
        },
        syncAssignedTemplatesForDay: async (kidId, date) => {
            const existing = store.dailyTasks.filter((t) => t.kidId === kidId && t.date === date).map((t) => t.title);
            const tasksToCreate = store.templates.filter((t) => {
                const assigned = t.assignedKidIds;
                if (!assigned || !assigned.includes(kidId)) return false;
                return !existing.includes(t.title);
            }).map((t) => store.buildDailyTask(kidId, date, t.title, getTemplateDescription(t)));

            if (tasksToCreate.length > 0) {
                const call = httpsCallable(functions, 'syncAssignedTemplatesForDay');
                await call({ familyId, tasksToCreate });
            }
        },
        updateDailyTask: async (taskId, updates) => {
            const call = httpsCallable(functions, 'updateDailyTask');
            await call({ familyId, taskId, updates });
        },
        deleteDailyTask: async (taskId) => {
            const call = httpsCallable(functions, 'deleteDailyTask');
            await call({ familyId, taskId });
        },
        toggleTaskStatus: async (taskId) => {
            const previous = store.dailyTasks.find((task) => task.id === taskId)
            if (!previous) return

            const nextStatus = previous.status === 'completed' ? 'pending' : 'completed'

            // Optimistic local status update so the checkbox responds immediately.
            useStore.setState((state) => ({
                dailyTasks: state.dailyTasks.map((task) =>
                    task.id === taskId ? { ...task, status: nextStatus } : task
                ),
            }))

            try {
                const call = httpsCallable(functions, 'updateDailyTask');
                await call({ familyId, taskId, updates: { status: nextStatus } });
            } catch (error) {
                // Roll back only if the task is still in the optimistic state.
                useStore.setState((state) => ({
                    dailyTasks: state.dailyTasks.map((task) =>
                        task.id === taskId && task.status === nextStatus
                            ? { ...task, status: previous.status }
                            : task
                    ),
                }))
                throw error
            }
        },
        markTaskFailed: async (taskId) => {
            const updated = store.buildTaskFailed(taskId);
            if (updated) {
                const call = httpsCallable(functions, 'updateDailyTask');
                await call({ familyId, taskId, updates: updated });
            }
        },
        setDayConfig: async (kidId, date, rewardAmount, penaltyAmount) => {
            const config = store.buildDayConfig(kidId, date, rewardAmount, penaltyAmount);
            const call = httpsCallable(functions, 'setDayConfig');
            await call({ familyId, config });
        },
        finalizeDay: async (kidId, date) => {
            const result = store.computeFinalize(kidId, date);
            if (!result.success) return result;
            
            const call = httpsCallable(functions, 'finalizeDay');
            await call({ 
                familyId, 
                updatedKid: result.updatedKid, 
                updatedConfig: result.updatedConfig, 
                ledgerEntries: result.ledgerEntries 
            });
            return result;
        },
        addManualTransaction: async (kidId, amount, label) => {
            const result = store.buildManualTransaction(kidId, amount, label);
            if (!result) return;

            const call = httpsCallable(functions, 'addManualTransaction');
            await call({
                familyId,
                updatedKid: result.updatedKid,
                entry: result.entry
            });
        },
        addGoal: async (kidId, title, targetAmount, icon, dueDate) => {
            const goal = store.buildGoal(kidId, title, targetAmount, icon, dueDate)
            const call = httpsCallable(functions, 'addGoal')
            await call({ familyId, goal })
        },
        updateGoal: async (goalId, updates) => {
            const updated = store.buildGoalUpdate(goalId, updates)
            if (!updated) return
            const call = httpsCallable(functions, 'updateGoal')
            await call({ familyId, goalId, updates: updated })
        },
        deleteGoal: async (goalId) => {
            const call = httpsCallable(functions, 'deleteGoal')
            await call({ familyId, goalId })
        },
        upsertBadge: async (kidId, code, unlockedAt) => {
            const badge = store.buildBadge(kidId, code, unlockedAt)
            const call = httpsCallable(functions, 'upsertBadge')
            await call({ familyId, badge })
        },
        saveRoutine: async (kidId, tasks, fromDate) => {
            const routine = {
                tasks: tasks.map(({ title, description }) => ({ title, description: description || '' })),
                savedAt: new Date().toISOString(),
                savedFromDate: fromDate,
            }
            const call = httpsCallable(functions, 'updateKid')
            await call({ familyId, kidId, updates: { routine } })
        },
        clearDayTasks: async (kidId, date) => {
            const taskIds = store.dailyTasks
                .filter((t) => t.kidId === kidId && t.date === date)
                .map((t) => t.id)
            if (taskIds.length === 0) return
            const call = httpsCallable(functions, 'clearDayTasks')
            await call({ familyId, taskIds })
        },
        autoLoadRoutine: async (kidId, date, routineTasks) => {
            const existing = store.dailyTasks.filter((t) => t.kidId === kidId && t.date === date).map((t) => t.title)
            const tasksToCreate = routineTasks
                .filter((t) => !existing.includes(t.title))
                .map((t) => store.buildDailyTask(kidId, date, t.title, t.description))
            if (tasksToCreate.length === 0) return 0
            const call = httpsCallable(functions, 'loadTemplatesForDay')
            await call({ familyId, tasksToCreate })
            return tasksToCreate.length
        },
    }
}
