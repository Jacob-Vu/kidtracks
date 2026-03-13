import { test, expect } from '@playwright/test'

const parentLedgerState = {
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
        kids: [
            {
                id: 'kid-1',
                displayName: 'Milo',
                name: 'Milo',
                avatar: 'M',
                balance: 30000,
            },
        ],
        templates: [],
        dailyTasks: [],
        dayConfigs: [],
        ledger: [],
    },
}

test('parent can add a manual deduction from the ledger page', async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, parentLedgerState)

    await page.goto('/ledger/kid-1?e2e=1')

    await expect(page.getByRole('heading', { name: /pocket ledger/i })).toBeVisible()

    await page.getByRole('button', { name: /add manual/i }).click()
    await page.getByRole('button', { name: /deduct/i }).click()
    await page.getByPlaceholder(/positive = reward, negative = deduction/i).fill('7')
    await page.getByPlaceholder(/birthday gift/i).fill('Late bedtime')
    await page.getByRole('button', { name: /add transaction/i }).click()

    await expect(page.getByText('Late bedtime')).toBeVisible()
    await expect(page.getByText(/-7000/).first()).toBeVisible()
})
