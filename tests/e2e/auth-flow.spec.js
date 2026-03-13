import { test, expect } from '@playwright/test'

const parentState = {
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
        kids: [],
        templates: [],
        dailyTasks: [],
        dayConfigs: [],
        ledger: [],
    },
}

test('redirects unauthenticated users to login', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.removeItem('kidstrack-e2e-state')
    })

    await page.goto('/?e2e=1')

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/motivate your kids, every day/i)).toBeVisible()
})

test('parent can sign out back to login', async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, parentState)

    await page.goto('/?e2e=1')

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await page.getByRole('button', { name: /sign out/i }).click()

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/motivate your kids, every day/i)).toBeVisible()
})
