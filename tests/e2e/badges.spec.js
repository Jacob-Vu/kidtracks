import { test, expect } from '@playwright/test'

function formatDate(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function addDays(date, days) {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
}

function startOfIsoWeek(date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    const offset = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - offset)
    return d
}

function buildKidBadgeState() {
    const now = new Date()
    const yesterday = addDays(now, -1)
    const dates = [addDays(yesterday, -2), addDays(yesterday, -1), yesterday].map(formatDate)

    const dailyTasks = []
    const dayConfigs = []

    dates.forEach((date, i) => {
        dailyTasks.push(
            { id: `task-${i}-1`, kidId: 'kid-1', date, title: 'Morning routine', description: '', status: 'completed' },
            { id: `task-${i}-2`, kidId: 'kid-1', date, title: 'Evening routine', description: '', status: 'completed' },
            { id: `task-${i}-3`, kidId: 'kid-1', date, title: 'Read 20 minutes', description: '', status: 'completed' },
            { id: `task-${i}-4`, kidId: 'kid-1', date, title: 'Pack school bag', description: '', status: 'completed' },
        )

        dayConfigs.push({
            id: `cfg-${date}`,
            kidId: 'kid-1',
            date,
            rewardAmount: 20000,
            penaltyAmount: 3000,
            isFinalized: true,
        })
    })

    return {
        user: {
            uid: 'kid-badge-e2e',
            email: 'milo@family-badge.kidstrack',
            displayName: 'Milo',
            photoURL: null,
        },
        profile: {
            role: 'kid',
            familyId: 'family-badge-e2e',
            kidId: 'kid-1',
            displayName: 'Milo',
            email: 'milo@family-badge.kidstrack',
        },
        collections: {
            kids: [{ id: 'kid-1', displayName: 'Milo', name: 'Milo', avatar: 'K', balance: 50000 }],
            templates: [],
            dailyTasks,
            dayConfigs,
            ledger: [],
            goals: [{
                id: 'goal-1',
                kidId: 'kid-1',
                title: 'New bike',
                targetAmount: 100000,
                status: 'active',
                icon: 'G',
                createdAt: `${dates[0]}T10:00:00.000Z`,
                completedAt: null,
            }],
            badges: [],
        },
    }
}

function buildParentWeeklyBadgeState() {
    const now = new Date()
    const thisWeekStart = startOfIsoWeek(now)
    const lastWeekStart = addDays(thisWeekStart, -7)
    const lastWeekDate = formatDate(addDays(lastWeekStart, 2))
    const oldDate = formatDate(addDays(lastWeekStart, -10))

    return {
        user: {
            uid: 'parent-badge-e2e',
            email: 'parent@example.com',
            displayName: 'Parent',
            photoURL: null,
        },
        profile: {
            role: 'parent',
            familyId: 'family-badge-e2e',
            displayName: 'Parent',
            email: 'parent@example.com',
        },
        collections: {
            kids: [{ id: 'kid-1', displayName: 'Milo', name: 'Milo', avatar: 'K', balance: 30000 }],
            templates: [],
            dailyTasks: [{
                id: 'task-report-1',
                kidId: 'kid-1',
                date: lastWeekDate,
                title: 'Read book',
                description: '',
                status: 'completed',
            }],
            dayConfigs: [{
                id: `cfg-${lastWeekDate}`,
                kidId: 'kid-1',
                date: lastWeekDate,
                rewardAmount: 20000,
                penaltyAmount: 3000,
                isFinalized: true,
            }],
            ledger: [],
            goals: [],
            badges: [
                { id: 'kid-1_consistency_3_day_streak', kidId: 'kid-1', code: 'consistency_3_day_streak', unlockedAt: lastWeekDate },
                { id: 'kid-1_completion_first_10_tasks', kidId: 'kid-1', code: 'completion_first_10_tasks', unlockedAt: oldDate },
            ],
        },
    }
}

test('kid dashboard and profile show badge strip/gallery and persist unlocked badges', async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, buildKidBadgeState())

    await page.goto('/kid?e2e=1')

    await expect(page.getByTestId('badge-strip')).toBeVisible()
    await expect(page.getByTestId('badge-strip-progress')).toHaveText('3/6 unlocked')
    await page.locator('.lang-switch').first().click()
    await expect(page.getByText(/achievement badges/i)).toHaveCount(0)
    await page.locator('.lang-switch').first().click()

    await expect(async () => {
        const codes = await page.evaluate(() => {
            const raw = window.localStorage.getItem('kidstrack-e2e-state')
            const parsed = raw ? JSON.parse(raw) : {}
            return (parsed.collections?.badges || []).map((b) => b.code).sort()
        })
        expect(codes).toEqual([
            'completion_first_10_tasks',
            'consistency_3_day_streak',
            'responsibility_morning_evening',
        ])
    }).toPass()

    await page.getByRole('link', { name: /my profile/i }).click()
    await expect(page.getByTestId('badge-gallery')).toBeVisible()
    await expect(page.locator('[data-badge-status="unlocked"]')).toHaveCount(3)
    await expect(page.locator('[data-badge-status="locked"]')).toHaveCount(3)
})

test('weekly report highlights newly unlocked badges in selected week', async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, buildParentWeeklyBadgeState())

    await page.goto('/report/weekly?e2e=1')

    await expect(page.getByText(/newly unlocked badges/i)).toBeVisible()
    await expect(page.getByText(/3-day streak/i)).toBeVisible()
    await expect(page.getByText(/1 unlocked/i)).toBeVisible()
    // 'weekly.newBadgesSection' = 'Newly unlocked badges'
    // 'badge.consistency3Name' = '3-Day Streak'
    // 'weekly.badgesUnlockedCount' with count=1 = '1 unlocked'
})
