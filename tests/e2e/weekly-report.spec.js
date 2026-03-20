import { expect, test } from '@playwright/test'

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

function buildParentState({ withData = true } = {}) {
    const now = new Date()
    const thisWeekStart = startOfIsoWeek(now)
    const lastWeekStart = addDays(thisWeekStart, -7)
    const prevWeekStart = addDays(lastWeekStart, -7)

    const kids = [{
        id: 'kid-1',
        displayName: 'Milo',
        name: 'Milo',
        avatar: '🧒',
        balance: 245000,
    }]

    const dailyTasks = []
    const dayConfigs = []
    const ledger = []

    if (withData) {
        for (let i = 0; i < 7; i++) {
            const date = formatDate(addDays(lastWeekStart, i))
            dailyTasks.push(
                {
                    id: `lw-${i}-a`,
                    kidId: 'kid-1',
                    date,
                    title: 'Read book',
                    description: '20 minutes',
                    status: i % 3 === 0 ? 'pending' : 'completed',
                },
                {
                    id: `lw-${i}-b`,
                    kidId: 'kid-1',
                    date,
                    title: 'Make bed',
                    description: '',
                    status: i % 4 === 0 ? 'failed' : 'completed',
                },
            )
            dayConfigs.push({
                id: `cfg-${date}`,
                kidId: 'kid-1',
                date,
                rewardAmount: 20000,
                penaltyAmount: 3000,
                isFinalized: true,
            })
        }

        for (let i = 0; i < 7; i++) {
            const date = formatDate(addDays(prevWeekStart, i))
            dailyTasks.push({
                id: `pw-${i}`,
                kidId: 'kid-1',
                date,
                title: 'Read book',
                description: '',
                status: i === 0 ? 'completed' : 'pending',
            })
        }

        ledger.push(
            { id: 'led-1', kidId: 'kid-1', date: formatDate(addDays(lastWeekStart, 2)), amount: 30000 },
            { id: 'led-2', kidId: 'kid-1', date: formatDate(addDays(lastWeekStart, 5)), amount: -6000 },
        )
    }

    return {
        user: {
            uid: 'parent-e2e',
            email: 'parent@example.com',
            displayName: 'Parent Tester',
            photoURL: null,
        },
        profile: {
            role: 'parent',
            familyId: 'family-e2e',
            displayName: 'Parent Tester',
            email: 'parent@example.com',
        },
        collections: {
            kids,
            templates: [],
            dailyTasks,
            dayConfigs,
            ledger,
        },
    }
}

test('parent can open /report/weekly and see key sections', async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, buildParentState({ withData: true }))

    await page.goto('/report/weekly?e2e=1')

    await expect(page.getByRole('heading', { name: /weekly report/i })).toBeVisible()
    await expect(page.getByText(/per-kid breakdown/i)).toBeVisible()
    await expect(page.getByText(/weekly earnings/i)).toBeVisible()
    await expect(page.getByText(/smart tips/i)).toBeVisible()
    await expect(page).toHaveURL(/week=\d{4}-W\d{2}/)
})

test('unauthenticated user is blocked from weekly report route', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.removeItem('kidstrack-e2e-state')
    })

    await page.goto('/report/weekly?e2e=1')

    await expect(page.getByRole('heading', { name: /sign in required/i })).toBeVisible()
    await expect(page.getByText(/sign in to continue/i)).toBeVisible()
    await expect(page.getByRole('heading', { name: /weekly report/i })).toHaveCount(0)
})

test('week navigation works and next-week becomes disabled at current week', async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, buildParentState({ withData: true }))

    await page.goto('/report/weekly?week=invalid&e2e=1')

    const prevBtn = page.getByRole('button', { name: /previous week/i })
    const nextBtn = page.getByRole('button', { name: /next week/i })

    await expect(page).toHaveURL(/week=\d{4}-W\d{2}/)
    const initialUrl = page.url()

    await prevBtn.click()
    await expect(page).not.toHaveURL(initialUrl)
    await expect(nextBtn).toBeEnabled()

    await nextBtn.click()
    await expect(page).toHaveURL(initialUrl)

    await nextBtn.click()
    await expect(nextBtn).toBeDisabled()
})

test('no-data fixture shows weekly no-data state', async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, buildParentState({ withData: false }))

    await page.goto('/report/weekly?e2e=1')

    await expect(page.getByText(/no data for this week yet/i)).toBeVisible()
})

test('language toggle changes weekly report text', async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, buildParentState({ withData: true }))

    await page.goto('/report/weekly?e2e=1')

    await expect(page.getByRole('heading', { name: /weekly report/i })).toBeVisible()
    await page.locator('.lang-switch').first().click()

    await expect(page.getByRole('heading', { name: /báo cáo tuần/i })).toBeVisible()
    await expect(page.getByText(/gợi ý thông minh/i)).toBeVisible()
})

test('weekly report actions are visible and copy summary works', async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
        window.__copiedSummary = ''
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
                writeText: async (text) => {
                    window.__copiedSummary = text
                },
            },
        })
    }, buildParentState({ withData: true }))

    await page.goto('/report/weekly?e2e=1')

    await expect(page.getByRole('button', { name: /share/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /copy summary/i })).toBeVisible()
    await page.getByRole('button', { name: /copy summary/i }).click()
    await expect(page.getByText(/summary copied/i)).toBeVisible()

    const copied = await page.evaluate(() => window.__copiedSummary || '')
    expect(copied).toContain('Weekly Report')
    expect(copied).toContain('Family completion')
})

test('dashboard weekly modal appears and open report routes correctly', async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.removeItem('kidstrack-weekly-modal-seen')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, buildParentState({ withData: true }))

    await page.goto('/?e2e=1')

    await expect(page.getByRole('heading', { name: /weekly summary is ready/i })).toBeVisible()
    await page.getByRole('button', { name: /open report/i }).click()

    await expect(page).toHaveURL(/\/report\/weekly\?week=\d{4}-W\d{2}/)
    const seenWeek = await page.evaluate(() => window.localStorage.getItem('kidstrack-weekly-modal-seen'))
    expect(seenWeek).toMatch(/^\d{4}-W\d{2}$/)
})
