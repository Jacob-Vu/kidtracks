import assert from 'node:assert/strict'
import { computeWeeklyLeaderboard } from '../../src/utils/leaderboard.js'

const referenceDate = new Date('2026-03-17T00:00:00Z')

const kids = [
    { id: 'a', name: 'Alex', avatar: 'A' },
    { id: 'b', name: 'Binh', avatar: 'B' },
    { id: 'c', name: 'Chi', avatar: 'C' },
]

const makeTasks = (kidId, date, total, done) => {
    const tasks = []
    for (let idx = 0; idx < total; idx += 1) {
        tasks.push({
            id: `${kidId}-${date}-${idx}`,
            kidId,
            date,
            status: idx < done ? 'completed' : 'pending',
        })
    }
    return tasks
}

const run = (name, fn) => {
    fn()
    console.log(`ok - ${name}`)
}

run('computes ranking, most improved, and streak star', () => {
    const dailyTasks = [
        ...makeTasks('a', '2026-03-11', 2, 2),
        ...makeTasks('a', '2026-03-12', 2, 2),
        ...makeTasks('a', '2026-03-13', 2, 1),
        ...makeTasks('a', '2026-03-14', 2, 1),
        ...makeTasks('a', '2026-03-15', 2, 2),
        ...makeTasks('b', '2026-03-11', 2, 2),
        ...makeTasks('b', '2026-03-12', 2, 2),
        ...makeTasks('b', '2026-03-13', 2, 2),
        ...makeTasks('b', '2026-03-14', 2, 2),
        ...makeTasks('b', '2026-03-15', 2, 1),
        ...makeTasks('c', '2026-03-12', 2, 2),
        ...makeTasks('c', '2026-03-13', 2, 2),

        ...makeTasks('a', '2026-03-04', 2, 1),
        ...makeTasks('a', '2026-03-05', 2, 1),
        ...makeTasks('a', '2026-03-06', 2, 1),
        ...makeTasks('a', '2026-03-07', 2, 1),
        ...makeTasks('a', '2026-03-08', 2, 0),
        ...makeTasks('b', '2026-03-04', 2, 2),
        ...makeTasks('b', '2026-03-05', 2, 2),
        ...makeTasks('b', '2026-03-06', 2, 2),
        ...makeTasks('b', '2026-03-07', 2, 1),
        ...makeTasks('b', '2026-03-08', 2, 1),
    ]

    const ledger = [
        { id: 'l1', kidId: 'a', date: '2026-03-12', amount: 50000 },
        { id: 'l2', kidId: 'b', date: '2026-03-12', amount: 30000 },
    ]

    const dayConfigs = [
        { id: 'da1', kidId: 'a', date: '2026-03-16', isFinalized: true },
        { id: 'da2', kidId: 'a', date: '2026-03-15', isFinalized: true },
        { id: 'da3', kidId: 'a', date: '2026-03-14', isFinalized: true },
        { id: 'db1', kidId: 'b', date: '2026-03-16', isFinalized: true },
    ]

    dailyTasks.push(...makeTasks('a', '2026-03-16', 1, 1))
    dailyTasks.push(...makeTasks('b', '2026-03-16', 1, 1))
    dailyTasks.push(...makeTasks('a', '2026-03-14', 1, 0))

    const result = computeWeeklyLeaderboard(kids, dailyTasks, ledger, dayConfigs, { referenceDate })

    assert.equal(result.fairnessGate, true)
    assert.equal(result.rankings.length, 2)
    assert.equal(result.rankings[0].kidId, 'b')
    assert.equal(result.rankings[1].kidId, 'a')
    assert.equal(result.mostImprovedKidId, 'a')
    assert.equal(result.streakStarKidId, 'a')
    assert.equal(result.rankings[1].completionImprovement, 35)
})

run('hides ranking when fairness gate has fewer than 2 eligible kids', () => {
    const dailyTasks = [
        ...makeTasks('a', '2026-03-12', 3, 3),
        ...makeTasks('a', '2026-03-13', 3, 2),
        ...makeTasks('b', '2026-03-12', 2, 2),
    ]

    const result = computeWeeklyLeaderboard(kids, dailyTasks, [], [], { referenceDate })

    assert.equal(result.fairnessGate, false)
    assert.equal(result.rankings.length, 1)
    assert.equal(result.rankings[0].kidId, 'a')
})

run('does not assign streak star when no one has a streak', () => {
    const dailyTasks = [
        ...makeTasks('a', '2026-03-11', 3, 3),
        ...makeTasks('a', '2026-03-12', 3, 2),
        ...makeTasks('b', '2026-03-11', 3, 2),
        ...makeTasks('b', '2026-03-12', 3, 3),
    ]

    const result = computeWeeklyLeaderboard(kids.slice(0, 2), dailyTasks, [], [], { referenceDate, minTasks: 3, minActiveDays: 1 })

    assert.equal(result.fairnessGate, true)
    assert.equal(result.streakStarKidId, null)
})

console.log('leaderboard unit tests passed')
