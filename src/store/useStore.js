import { create } from 'zustand'
import { format } from 'date-fns'

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

// ─── Family ID ─────────────────────────────────────────────────────────────────
// Stored in localStorage so it persists across browser sessions on the same device.
// Users can share this code to access the same Firestore data on other devices.
const getOrCreateFamilyId = () => {
    let id = localStorage.getItem('kidstrack-family-id')
    if (!id) {
        id = generateId()
        localStorage.setItem('kidstrack-family-id', id)
    }
    return id
}

const useStore = create((set, get) => ({
    // ─── App State ─────────────────────────────────────────────────────────────
    familyId: getOrCreateFamilyId(),
    isLoading: true,
    firestoreError: null,

    setIsLoading: (v) => set({ isLoading: v }),
    setError: (err) => set({ firestoreError: err }),

    setFamilyId: (id) => {
        localStorage.setItem('kidstrack-family-id', id)
        set({ familyId: id, isLoading: true })
    },

    // ─── Hydrate from Firestore (called by useFirebaseSync) ────────────────────
    setKids: (kids) => set({ kids }),
    setTemplates: (templates) => set({ templates }),
    setDailyTasks: (dailyTasks) => set({ dailyTasks }),
    setDayConfigs: (dayConfigs) => set({ dayConfigs }),
    setLedger: (ledger) => set({ ledger }),

    // ─── DATA ──────────────────────────────────────────────────────────────────
    kids: [],
    templates: [],
    dailyTasks: [],
    dayConfigs: [],
    ledger: [],

    // ─── KIDS ──────────────────────────────────────────────────────────────────
    addKid: (name, avatar) => {
        const kid = { id: generateId(), name, avatar: avatar || '🧒', balance: 0 }
        return kid
    },

    buildKidUpdate: (id, updates) => {
        const kid = get().kids.find((k) => k.id === id)
        return kid ? { ...kid, ...updates } : null
    },

    // ─── TEMPLATES ─────────────────────────────────────────────────────────────
    buildTemplate: (title, description) => ({
        id: generateId(), title, description: description || '',
    }),

    // ─── DAILY TASKS ───────────────────────────────────────────────────────────
    buildDailyTask: (kidId, date, title, description) => ({
        id: generateId(), kidId, date, title, description: description || '', status: 'pending',
    }),

    buildLoadedTemplates: (kidId, date) => {
        const { templates, dailyTasks } = get()
        const existing = dailyTasks.filter((t) => t.kidId === kidId && t.date === date).map((t) => t.title)
        return templates
            .filter((t) => !existing.includes(t.title))
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

    // ─── DAY CONFIG ────────────────────────────────────────────────────────────
    buildDayConfig: (kidId, date, rewardAmount, penaltyAmount) => {
        const existing = get().dayConfigs.find((c) => c.kidId === kidId && c.date === date)
        return existing
            ? { ...existing, rewardAmount, penaltyAmount }
            : { id: `${kidId}_${date}`, kidId, date, rewardAmount, penaltyAmount, isFinalized: false }
    },

    // ─── FINALIZE (returns mutations to be written to Firestore) ───────────────
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
            ledgerEntries.push({
                id: generateId(), kidId, date, type: 'reward',
                amount: config.rewardAmount,
                label: `🎉 All ${completedCount} tasks completed!`,
            })
        } else {
            if (failedCount > 0) {
                const penalty = config.penaltyAmount * failedCount
                delta -= penalty
                ledgerEntries.push({
                    id: generateId(), kidId, date, type: 'penalty',
                    amount: -penalty,
                    label: `😞 ${failedCount} task(s) failed — penalty applied`,
                })
            }
            if (pendingCount > 0) {
                const pendingPenalty = config.penaltyAmount * pendingCount
                delta -= pendingPenalty
                ledgerEntries.push({
                    id: generateId(), kidId, date, type: 'penalty',
                    amount: -pendingPenalty,
                    label: `⏰ ${pendingCount} task(s) not completed`,
                })
            }
        }

        const newBalance = Math.max(0, kid.balance + delta)
        const updatedKid = { ...kid, balance: newBalance }
        const updatedConfig = { ...config, isFinalized: true }

        return { success: true, allCompleted, delta, updatedKid, updatedConfig, ledgerEntries }
    },

    // ─── MANUAL TRANSACTION ────────────────────────────────────────────────────
    buildManualTransaction: (kidId, amount, label) => {
        const kid = get().kids.find((k) => k.id === kidId)
        if (!kid) return null
        const entry = {
            id: generateId(), kidId,
            date: format(new Date(), 'yyyy-MM-dd'),
            type: amount >= 0 ? 'manual_reward' : 'manual_penalty',
            amount,
            label: label || (amount >= 0 ? 'Manual reward' : 'Manual deduction'),
        }
        const updatedKid = { ...kid, balance: Math.max(0, kid.balance + amount) }
        return { entry, updatedKid }
    },
}))

export default useStore
