import { expect, test } from '@playwright/test'

test('landing social proof renders in English', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('kidstrack-lang', 'en')
        window.localStorage.removeItem('kidstrack-e2e-state')
    })

    await page.goto('/?e2e=1')

    await expect(page.getByTestId('trust-metrics-strip')).toBeVisible()
    await expect(page.getByText('Active families')).toBeVisible()
    await expect(page.getByText('Tasks completed')).toBeVisible()
    await expect(page.getByTestId('testimonials-section')).toBeVisible()
    await expect(page.getByText('What parents say')).toBeVisible()
    await expect(page.getByTestId('community-proof-block')).toBeVisible()
    await expect(page.getByRole('button', { name: /try kidstrack free/i })).toBeVisible()
})

test('landing social proof renders in Vietnamese', async ({ page }) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('kidstrack-lang', 'vi')
        window.localStorage.removeItem('kidstrack-e2e-state')
    })

    await page.goto('/?e2e=1')

    await expect(page.getByTestId('trust-metrics-strip')).toBeVisible()
    await expect(page.getByText('Gia đình hoạt động')).toBeVisible()
    await expect(page.getByText('Nhiệm vụ đã hoàn thành')).toBeVisible()
    await expect(page.getByTestId('testimonials-section')).toBeVisible()
    await expect(page.getByText('Phụ huynh nói gì')).toBeVisible()
    await expect(page.getByTestId('community-proof-block')).toBeVisible()
    await expect(page.getByRole('button', { name: /dùng thử kidstrack miễn phí/i })).toBeVisible()
})
