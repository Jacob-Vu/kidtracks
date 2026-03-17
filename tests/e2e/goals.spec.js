import { test, expect } from '@playwright/test'

const parentState = {
    user: {
        uid: 'parent-goals',
        email: 'parent@example.com',
        displayName: 'Parent Goals',
        photoURL: null,
    },
    profile: {
        role: 'parent',
        familyId: 'family-goals',
        displayName: 'Parent Goals',
        email: 'parent@example.com',
    },
    collections: {
        kids: [
            {
                id: 'kid-1',
                displayName: 'Milo',
                name: 'Milo',
                avatar: '🧒',
                balance: 50000,
            },
        ],
        templates: [],
        dailyTasks: [],
        dayConfigs: [],
        ledger: [],
        goals: [],
    },
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript((state) => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.setItem('kidstrack-e2e-state', JSON.stringify(state))
    }, parentState)
})

test('parent can create goal, see progress, and milestones persist once', async ({ page }) => {
    await page.goto('/?e2e=1')

    await page.getByTestId('goal-create-btn').click()
    await page.getByPlaceholder(/new bicycle/i).fill('New Bicycle')
    await page.getByPlaceholder(/100000/i).fill('100000')
    await page.getByTestId('goal-save-btn').click()

    await expect(page.getByText('New Bicycle')).toBeVisible()
    await expect(page.getByTestId('goal-progress-value')).toHaveText('50%')

    await expect(async () => {
        const milestoneState = await page.evaluate(() => {
            const raw = window.localStorage.getItem('kidstrack-e2e-state')
            const parsed = raw ? JSON.parse(raw) : {}
            return parsed.collections?.goals?.[0]?.milestonesUnlocked || []
        })
        expect(milestoneState).toEqual([25, 50])
    }).toPass()

    await page.reload()
    await expect(page.getByTestId('goal-progress-value')).toHaveText('50%')

    const reloadedMilestones = await page.evaluate(() => {
        const raw = window.localStorage.getItem('kidstrack-e2e-state')
        const parsed = raw ? JSON.parse(raw) : {}
        return parsed.collections?.goals?.[0]?.milestonesUnlocked || []
    })
    expect(reloadedMilestones).toEqual([25, 50])
})
