import { test, expect } from '@playwright/test'

const e2eState = {
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
                avatar: '??',
                balance: 0,
            },
        ],
        templates: [
            {
                id: 'tmpl-bed',
                title: 'Make bed',
                description: 'Tidy up before school',
                assignedKidIds: ['kid-1'],
            },
        ],
        dailyTasks: [],
        dayConfigs: [],
        ledger: [],
    },
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, e2eState)
})

test('parent can manage templates, tasks, and ledger', async ({ page }) => {
    await page.goto('/?e2e=1')

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByText('Milo')).toBeVisible()

    await page.getByRole('link', { name: /task templates/i }).click()
    await expect(page.getByRole('heading', { name: /task templates/i })).toBeVisible()

    await page.getByRole('button', { name: /new template/i }).click()
    await page.getByPlaceholder(/make your bed/i).fill('Pack school bag')
    await page.getByPlaceholder(/additional notes/i).fill('Before bedtime')
    await page.getByRole('button', { name: /^save$/i }).click()
    await expect(page.getByText('Pack school bag')).toBeVisible()

    await page.getByRole('link', { name: /daily tasks/i }).click()
    await expect(page.getByRole('heading', { name: /daily tasks/i })).toBeVisible()

    await page.getByRole('button', { name: /load templates/i }).click()
    await expect(page.getByText('Make bed')).toBeVisible()
    await expect(page.getByText('Pack school bag')).toBeVisible()

    await page.getByRole('button', { name: /add task/i }).click()
    await page.getByPlaceholder(/what needs to be done/i).fill('Brush teeth')
    await page.getByPlaceholder(/additional details/i).fill('Morning routine')
    await page.getByRole('button', { name: /^save$/i }).click()
    await expect(page.getByText('Brush teeth')).toBeVisible()

    await page.getByRole('button', { name: /set rewards/i }).click()
    await page.getByRole('button', { name: /save settings/i }).click()

    const taskChecks = page.locator('.task-checkbox')
    await expect(taskChecks).toHaveCount(3)
    await taskChecks.nth(0).click()
    await taskChecks.nth(1).click()
    await taskChecks.nth(2).click()

    await page.getByRole('button', { name: /claim reward/i }).click()
    await expect(page.getByText(/all tasks completed/i)).toBeVisible()

    await page.getByRole('link', { name: /pocket ledger/i }).click()
    await expect(page.getByRole('heading', { name: /pocket ledger/i })).toBeVisible()
    await expect(page.getByText(/all 3 tasks completed/i)).toBeVisible()
    await expect(page.getByText('+20k').first()).toBeVisible()
})


