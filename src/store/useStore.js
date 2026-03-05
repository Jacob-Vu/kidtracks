import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

const useStore = create(
    persist(
        (set, get) => ({
            // ─── KIDS ─────────────────────────────────────────────────────
            kids: [],

            addKid: (name, avatar) => set((state) => ({
                kids: [...state.kids, { id: generateId(), name, avatar: avatar || '🧒', balance: 0 }],
            })),

            updateKid: (id, updates) => set((state) => ({
                kids: state.kids.map((k) => (k.id === id ? { ...k, ...updates } : k)),
            })),

            deleteKid: (id) => set((state) => ({
                kids: state.kids.filter((k) => k.id !== id),
                dailyTasks: state.dailyTasks.filter((t) => t.kidId !== id),
                ledger: state.ledger.filter((e) => e.kidId !== id),
            })),

            // ─── TEMPLATES ────────────────────────────────────────────────
            templates: [],

            addTemplate: (title, description) => set((state) => ({
                templates: [...state.templates, { id: generateId(), title, description: description || '' }],
            })),

            updateTemplate: (id, updates) => set((state) => ({
                templates: state.templates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
            })),

            deleteTemplate: (id) => set((state) => ({
                templates: state.templates.filter((t) => t.id !== id),
            })),

            // ─── DAILY TASKS ──────────────────────────────────────────────
            dailyTasks: [],

            addDailyTask: (kidId, date, title, description) => set((state) => ({
                dailyTasks: [
                    ...state.dailyTasks,
                    { id: generateId(), kidId, date, title, description: description || '', status: 'pending' },
                ],
            })),

            loadTemplatesForDay: (kidId, date) => {
                const { templates, dailyTasks } = get();
                const existing = dailyTasks.filter((t) => t.kidId === kidId && t.date === date).map((t) => t.title);
                const newTasks = templates
                    .filter((t) => !existing.includes(t.title))
                    .map((t) => ({ id: generateId(), kidId, date, title: t.title, description: t.description, status: 'pending' }));
                set((state) => ({ dailyTasks: [...state.dailyTasks, ...newTasks] }));
            },

            updateDailyTask: (id, updates) => set((state) => ({
                dailyTasks: state.dailyTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
            })),

            deleteDailyTask: (id) => set((state) => ({
                dailyTasks: state.dailyTasks.filter((t) => t.id !== id),
            })),

            toggleTaskStatus: (id) => set((state) => ({
                dailyTasks: state.dailyTasks.map((t) =>
                    t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
                ),
            })),

            markTaskFailed: (id) => set((state) => ({
                dailyTasks: state.dailyTasks.map((t) =>
                    t.id === id ? { ...t, status: t.status === 'failed' ? 'pending' : 'failed' } : t
                ),
            })),

            // ─── DAY CONFIG ───────────────────────────────────────────────
            dayConfigs: [], // { kidId, date, rewardAmount, penaltyAmount, isFinalized }

            setDayConfig: (kidId, date, rewardAmount, penaltyAmount) => set((state) => {
                const exists = state.dayConfigs.find((c) => c.kidId === kidId && c.date === date);
                if (exists) {
                    return {
                        dayConfigs: state.dayConfigs.map((c) =>
                            c.kidId === kidId && c.date === date ? { ...c, rewardAmount, penaltyAmount } : c
                        ),
                    };
                }
                return {
                    dayConfigs: [...state.dayConfigs, { kidId, date, rewardAmount, penaltyAmount, isFinalized: false }],
                };
            }),

            // ─── FINALIZE DAY ──────────────────────────────────────────────
            finalizeDay: (kidId, date) => {
                const { dailyTasks, dayConfigs, kids } = get();
                const tasks = dailyTasks.filter((t) => t.kidId === kidId && t.date === date);
                const config = dayConfigs.find((c) => c.kidId === kidId && c.date === date);
                if (!config || config.isFinalized) return { success: false, reason: 'already_finalized' };
                if (tasks.length === 0) return { success: false, reason: 'no_tasks' };

                const allCompleted = tasks.every((t) => t.status === 'completed');
                const completedCount = tasks.filter((t) => t.status === 'completed').length;
                const failedCount = tasks.filter((t) => t.status === 'failed').length;
                const pendingCount = tasks.filter((t) => t.status === 'pending').length;

                let delta = 0;
                let entries = [];

                if (allCompleted) {
                    delta += config.rewardAmount;
                    entries.push({
                        id: generateId(), kidId, date, type: 'reward',
                        amount: config.rewardAmount,
                        label: `🎉 All ${completedCount} tasks completed!`,
                    });
                } else {
                    if (failedCount > 0) {
                        const penalty = config.penaltyAmount * failedCount;
                        delta -= penalty;
                        entries.push({
                            id: generateId(), kidId, date, type: 'penalty',
                            amount: -penalty,
                            label: `😞 ${failedCount} task(s) failed — penalty applied`,
                        });
                    }
                    if (pendingCount > 0) {
                        const pendingPenalty = config.penaltyAmount * pendingCount;
                        delta -= pendingPenalty;
                        entries.push({
                            id: generateId(), kidId, date, type: 'penalty',
                            amount: -pendingPenalty,
                            label: `⏰ ${pendingCount} task(s) not completed`,
                        });
                    }
                }

                set((state) => ({
                    kids: state.kids.map((k) => k.id === kidId ? { ...k, balance: Math.max(0, k.balance + delta) } : k),
                    ledger: [...state.ledger, ...entries],
                    dayConfigs: state.dayConfigs.map((c) =>
                        c.kidId === kidId && c.date === date ? { ...c, isFinalized: true } : c
                    ),
                }));

                return { success: true, allCompleted, delta };
            },

            // ─── LEDGER ───────────────────────────────────────────────────
            ledger: [],

            addManualTransaction: (kidId, amount, label) => set((state) => ({
                ledger: [
                    ...state.ledger,
                    {
                        id: generateId(),
                        kidId,
                        date: format(new Date(), 'yyyy-MM-dd'),
                        type: amount >= 0 ? 'manual_reward' : 'manual_penalty',
                        amount,
                        label: label || (amount >= 0 ? 'Manual reward' : 'Manual deduction'),
                    },
                ],
                kids: state.kids.map((k) =>
                    k.id === kidId ? { ...k, balance: Math.max(0, k.balance + amount) } : k
                ),
            })),
        }),
        {
            name: 'kids-task-tracker',
        }
    )
);

export default useStore;
