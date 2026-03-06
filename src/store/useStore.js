import { create } from 'zustand'
import { format } from 'date-fns'

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

const useStore = create((set, get) => ({
    // ─── App State ──────────────────────────────────────────────────────────────
    isLoading: true,
    firestoreError: null,
    setIsLoading: (v) => set({ isLoading: v }),
    setError: (err) => set({ firestoreError: err }),

    // ─── Hydrate from Firestore (called by useFirebaseSync) ────────────────────
    setKids: (kids) => set({ kids }),
    setTemplates: (templates) => set({ templates }),
    setDailyTasks: (dailyTasks) => set({ dailyTasks }),
    setDayConfigs: (dayConfigs) => set({ dayConfigs }),
    setLedger: (ledger) => set({ ledger }),

    // ─── Data ──────────────────────────────────────────────────────────────────
    kids: [],
    templates: [],
    dailyTasks: [],
    dayConfigs: [],
    ledger: [],

    // ─── Kids ──────────────────────────────────────────────────────────────────
    addKid: (name, avatar) => ({ id: generateId(), name, avatar: avatar || '🧒', balance: 0 }),

    buildKidUpdate: (id, updates) => {
        const kid = get().kids.find((k) => k.id === id)
        return kid ? { ...kid, ...updates } : null
    },

    // ─── Templates ─────────────────────────────────────────────────────────────
    buildTemplate: (title, description) => ({ id: generateId(), title, description: description || '' }),

    // ─── Daily Tasks ───────────────────────────────────────────────────────────
    buildDailyTask: (kidId, date, title, description) => ({
        id: generateId(), kidId, date, title, description: description || '', status: 'pending',
    }),

    buildLoadedTemplates: (kidId, date) => {
        const { templates, dailyTasks } = get()
        const existing = dailyTasks.filter((t) => t.kidId === kidId && t.date === date).map((t) => t.title)
        return templates
            .filter((t) => {
                const assigned = t.assignedKidIds
                if (assigned && assigned.length > 0 && !assigned.includes(kidId)) return false
                return !existing.includes(t.title)
            })
            .map((t) => ({ id: generateId(), kidId, date, title: t.title, description: t.description, status: 'pending' }))
    },


    buildTaskToggle: (id) => {
        const task = get().dailyTasks.find((t) => t.id === id)
        return task ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' } : null
    },

    buildTaskFailed: (id) => {
        const task = get().dailyTasks.find((t) => t.id === id)
        return task ? { ...task, status: task.status === 'failed' ? 'pending' : 'failed' } : null
    },

    // ─── Day Config ────────────────────────────────────────────────────────────
    buildDayConfig: (kidId, date, rewardAmount, penaltyAmount) => {
        const existing = get().dayConfigs.find((c) => c.kidId === kidId && c.date === date)
        return existing
            ? { ...existing, rewardAmount, penaltyAmount }
            : { id: `${kidId}_${date}`, kidId, date, rewardAmount, penaltyAmount, isFinalized: false }
    },

    // ─── Finalize ──────────────────────────────────────────────────────────────
    computeFinalize: (kidId, date) => {
        const { dailyTasks, dayConfigs, kids } = get()
        const tasks = dailyTasks.filter((t) => t.kidId === kidId && t.date === date)
        const config = dayConfigs.find((c) => c.kidId === kidId && c.date === date)
        if (!config || config.isFinalized) return { success: false, reason: 'already_finalized' }
        if (tasks.length === 0) return { success: false, reason: 'no_tasks' }

        const allCompleted = tasks.every((t) => t.status === 'completed')
        const completedCount = tasks.filter((t) => t.status === 'completed').length
        const failedCount = tasks.filter((t) => t.status === 'failed').length
        const pendingCount = tasks.filter((t) => t.status === 'pending').length
        const kid = kids.find((k) => k.id === kidId)
        if (!kid) return { success: false, reason: 'kid_not_found' }

        let delta = 0
        const ledgerEntries = []
        if (allCompleted) {
            delta += config.rewardAmount
            ledgerEntries.push({ id: generateId(), kidId, date, type: 'reward', amount: config.rewardAmount, label: `🎉 All ${completedCount} tasks completed!` })
        } else {
            if (failedCount > 0) {
                const p = config.penaltyAmount * failedCount
                delta -= p
                ledgerEntries.push({ id: generateId(), kidId, date, type: 'penalty', amount: -p, label: `😞 ${failedCount} task(s) failed` })
            }
            if (pendingCount > 0) {
                const p = config.penaltyAmount * pendingCount
                delta -= p
                ledgerEntries.push({ id: generateId(), kidId, date, type: 'penalty', amount: -p, label: `⏰ ${pendingCount} task(s) not completed` })
            }
        }

        return {
            success: true, allCompleted, delta,
            updatedKid: { ...kid, balance: Math.max(0, kid.balance + delta) },
            updatedConfig: { ...config, isFinalized: true },
            ledgerEntries,
        }
    },

    // ─── Manual Transaction ────────────────────────────────────────────────────
    buildManualTransaction: (kidId, amount, label) => {
        const kid = get().kids.find((k) => k.id === kidId)
        if (!kid) return null
        return {
            entry: {
                id: generateId(), kidId,
                date: format(new Date(), 'yyyy-MM-dd'),
                type: amount >= 0 ? 'manual_reward' : 'manual_penalty',
                amount,
                label: label || (amount >= 0 ? 'Manual reward' : 'Manual deduction'),
            },
            updatedKid: { ...kid, balance: Math.max(0, kid.balance + amount) },
        }
    },
}))

export default useStore
