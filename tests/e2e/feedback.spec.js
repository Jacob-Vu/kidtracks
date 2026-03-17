import { test, expect } from '@playwright/test'

const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const addDays = (date, days) => {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
}

const buildKidState = () => {
    const now = new Date()
    const today = formatDate(now)
    const yesterday = formatDate(addDays(now, -1))
    const twoDaysAgo = formatDate(addDays(now, -2))

    return {
        user: {
            uid: 'kid-feedback-e2e',
            email: 'kid-feedback@example.com',
            displayName: 'Milo',
            photoURL: null,
        },
        profile: {
            role: 'kid',
            familyId: 'family-feedback-e2e',
            kidId: 'kid-1',
            displayName: 'Milo',
            email: 'kid-feedback@example.com',
        },
        collections: {
            kids: [{ id: 'kid-1', displayName: 'Milo', name: 'Milo', avatar: 'K', balance: 20000 }],
            templates: [],
            dailyTasks: [
                { id: 'task-1', kidId: 'kid-1', date: today, title: 'Read book', description: '', status: 'pending' },
                { id: 'task-2', kidId: 'kid-1', date: today, title: 'Clean desk', description: '', status: 'pending' },
                { id: 'old-1', kidId: 'kid-1', date: yesterday, title: 'Morning routine', description: '', status: 'completed' },
                { id: 'old-2', kidId: 'kid-1', date: yesterday, title: 'Evening routine', description: '', status: 'completed' },
                { id: 'old-3', kidId: 'kid-1', date: twoDaysAgo, title: 'Morning routine', description: '', status: 'completed' },
                { id: 'old-4', kidId: 'kid-1', date: twoDaysAgo, title: 'Evening routine', description: '', status: 'completed' },
            ],
            dayConfigs: [],
            ledger: [],
            goals: [],
            badges: [],
        },
    }
}

const buildBadgeUnlockState = () => {
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
            uid: 'kid-feedback-badge-e2e',
            email: 'kid-feedback-badge@example.com',
            displayName: 'Milo',
            photoURL: null,
        },
        profile: {
            role: 'kid',
            familyId: 'family-feedback-e2e',
            kidId: 'kid-1',
            displayName: 'Milo',
            email: 'kid-feedback-badge@example.com',
        },
        collections: {
            kids: [{ id: 'kid-1', displayName: 'Milo', name: 'Milo', avatar: 'K', balance: 50000 }],
            templates: [],
            dailyTasks,
            dayConfigs,
            ledger: [],
            goals: [],
            badges: [],
        },
    }
}

test('sound toggle persists and disables task/day feedback audio', async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-feedback-sound-enabled', 'true')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
        window.__kidFeedbackAudio = []
        window.addEventListener('kidstrack:feedback-audio', (event) => {
            window.__kidFeedbackAudio.push(event.detail?.eventType)
        })
    }, buildKidState())

    await page.goto('/kid?e2e=1')

    await page.locator('.task-checkbox').first().click()
    await expect(page.locator('.task-item--feedback-pop')).toHaveCount(1)

    await expect.poll(async () => {
        return page.evaluate(() => (window.__kidFeedbackAudio || []).filter((evt) => evt === 'task_complete').length)
    }).toBeGreaterThan(0)

    await page.getByRole('link', { name: /my profile/i }).click()
    const toggle = page.getByTestId('feedback-sound-toggle').locator('input[type="checkbox"]')
    await expect(toggle).toBeChecked()
    await toggle.click()
    await expect(toggle).not.toBeChecked()

    await page.getByRole('link', { name: /my dashboard/i }).click()
    await page.locator('.task-checkbox').nth(1).click()

    const afterOffEvents = await page.evaluate(() => window.__kidFeedbackAudio || [])
    expect(afterOffEvents.filter((evt) => evt === 'task_complete')).toHaveLength(1)
    expect(afterOffEvents.filter((evt) => evt === 'day_complete')).toHaveLength(0)

    await page.reload()
    await page.getByRole('link', { name: /my profile/i }).click()
    await expect(page.getByTestId('feedback-sound-toggle').locator('input[type="checkbox"]')).not.toBeChecked()
})

test('reduced motion removes task pop and confetti animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const state = buildKidState()

    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, {
        ...state,
        collections: {
            ...state.collections,
            dailyTasks: [state.collections.dailyTasks[0]],
        },
    })

    await page.goto('/kid?e2e=1')
    await expect(page.locator('[data-feedback-reduced-motion="true"]')).toBeVisible()

    await page.locator('.task-checkbox').first().click()
    await expect(page.locator('.task-item--feedback-pop')).toHaveCount(0)
    await expect(page.locator('[data-testid="confetti-piece"]')).toHaveCount(0)
})

test('badge unlock shows feedback toast on kid dashboard', async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, buildBadgeUnlockState())

    await page.goto('/kid?e2e=1')
    await expect(page.getByTestId('badge-unlock-toast')).toBeVisible()
})
