import { expect, test } from '@playwright/test'

const parentState = {
    user: {
        uid: 'parent-prod-smoke',
        email: 'parent@example.com',
        displayName: 'Parent Smoke',
        photoURL: null,
        providerData: [{ providerId: 'google.com' }],
    },
    profile: {
        role: 'parent',
        familyId: 'family-prod-smoke',
        displayName: 'Parent Smoke',
        email: 'parent@example.com',
    },
    collections: {
        kids: [
            { id: 'kid-1', displayName: 'Milo', name: 'Milo', avatar: 'M', balance: 20000 },
        ],
        templates: [],
        dailyTasks: [],
        dayConfigs: [],
        ledger: [],
    },
}

test('production smoke: unauthenticated user lands on login', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.removeItem('kidstrack-e2e-state')
    })

    await page.goto('/?e2e=1')

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/motivate your kids, every day/i)).toBeVisible()
})

test('production smoke: parent dashboard loads with e2e fixture', async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, parentState)

    await page.goto('/?e2e=1')

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByText(/manage your kids and their pocket balances/i)).toBeVisible()
    await expect(page.getByText('Milo')).toBeVisible()
})

test('production smoke: parent can open templates page', async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, parentState)

    await page.goto('/templates?e2e=1')

    await expect(page.getByRole('heading', { name: /task templates/i })).toBeVisible()
    await expect(page.getByText(/import default packs or create custom templates/i)).toBeVisible()
})
