import { test, expect } from '@playwright/test'

const kidState = {
    user: {
        uid: 'kid-e2e',
        email: 'milo@family-e2e.kidstrack',
        displayName: 'Milo',
        photoURL: null,
    },
    profile: {
        role: 'kid',
        familyId: 'family-e2e',
        kidId: 'kid-1',
        displayName: 'Milo',
        email: 'milo@family-e2e.kidstrack',
    },
    collections: {
        kids: [
            {
                id: 'kid-1',
                displayName: 'Milo',
                name: 'Milo',
                avatar: 'M',
                balance: 15000,
            },
        ],
        templates: [],
        dailyTasks: [
            {
                id: 'task-1',
                kidId: 'kid-1',
                date: '2026-03-13',
                title: 'Read book',
                description: '20 minutes',
                status: 'pending',
            },
        ],
        dayConfigs: [],
        ledger: [
            {
                id: 'entry-1',
                kidId: 'kid-1',
                date: '2026-03-12',
                type: 'reward',
                amount: 10000,
                label: 'Reading streak',
            },
        ],
    },
}

test('kid can complete tasks, add a task, browse profile, and sign out', async ({ page }) => {
    await page.addInitScript((state) => {
        const now = new Date()
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        const withToday = {
            ...state,
            collections: {
                ...state.collections,
                dailyTasks: state.collections.dailyTasks.map((task) => ({ ...task, date: today })),
                ledger: state.collections.ledger.map((entry) => ({ ...entry, date: today })),
            },
        }

        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(withToday))
    }, kidState)

    await page.goto('/kid?e2e=1')

    await expect(page.getByRole('link', { name: /my dashboard/i })).toHaveClass(/active/)
    await expect(page.locator('.kid-hero-name')).toHaveText('Milo')
    await expect(page.getByText(/reading streak/i)).toBeVisible()

    await page.locator('.task-checkbox').first().click()
    await expect(page.getByText(/today's tasks \(1\/1\)/i)).toBeVisible()

    await page.getByRole('button', { name: /add task/i }).click()
    await page.getByPlaceholder(/what needs to be done/i).fill('Water plants')
    await page.getByPlaceholder(/additional details/i).fill('Use the blue can')
    await page.getByRole('button', { name: /^save$/i }).click()
    await expect(page.getByText('Water plants')).toBeVisible()

    await page.getByRole('link', { name: /my profile/i }).click()
    await expect(page.getByRole('heading', { name: /my profile/i })).toBeVisible()
    await expect(page.locator('input[type="text"]').first()).toHaveValue('Milo')
    await page.locator('input[type="text"]').first().fill('Miles')
    await page.getByRole('button', { name: /save profile/i }).click()
    await expect(page.getByRole('button', { name: /saved/i })).toBeVisible()

    await page.locator('input[type="password"]').nth(2).fill('secret123')
    await page.getByPlaceholder(/your\.email@gmail\.com/i).fill('miles@example.com')
    await page.getByRole('button', { name: /link email/i }).click()
    await expect(page.getByText(/email linked/i)).toBeVisible()

    await page.getByRole('button', { name: /log out/i }).click()
    // After log out, kid route shows auth-gate (not a redirect to /login)
    await expect(page.getByRole('heading', { name: /sign in required/i })).toBeVisible()
})
