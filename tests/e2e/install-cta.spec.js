import { expect, test } from '@playwright/test'

// Helper: inject beforeinstallprompt after page load
async function injectBeforeInstallPrompt(page) {
    await page.evaluate(() => {
        const fakePrompt = {
            preventDefault: () => {},
            prompt: () => Promise.resolve(),
            userChoice: Promise.resolve({ outcome: 'dismissed' }),
        }
        const event = Object.assign(new Event('beforeinstallprompt'), fakePrompt)
        window.dispatchEvent(event)
    })
}

test.describe('Install App CTA — landing hero', () => {
    test('CTA is hidden when already running standalone (display-mode: standalone)', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('kidstrack-lang', 'en')
            window.localStorage.removeItem('pwa_landing_cta_dismissed_until')
            // Mock matchMedia to report standalone
            const origMatchMedia = window.matchMedia.bind(window)
            window.matchMedia = (query) => {
                if (query === '(display-mode: standalone)') {
                    return Object.assign(origMatchMedia(query), { matches: true })
                }
                return origMatchMedia(query)
            }
        })
        await page.goto('/?e2e=1')
        const cta = page.getByTestId('landing-install-cta')
        await expect(cta).not.toBeVisible()
    })

    test('CTA is hidden when dismissed within 24h cooldown', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('kidstrack-lang', 'en')
            // Set a future dismiss timestamp
            window.localStorage.setItem('pwa_landing_cta_dismissed_until', String(Date.now() + 60 * 60 * 1000))
        })
        await page.goto('/?e2e=1')
        // Inject installability signal
        await injectBeforeInstallPrompt(page)
        const cta = page.getByTestId('landing-install-cta')
        await expect(cta).not.toBeVisible()
    })

    test('CTA is hidden when cooldown has expired', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('kidstrack-lang', 'en')
            // Set a past dismiss timestamp (expired)
            window.localStorage.setItem('pwa_landing_cta_dismissed_until', String(Date.now() - 1000))
        })
        await page.goto('/?e2e=1')
        // Without beforeinstallprompt there is no native prompt, so CTA won't show anyway
        // This test verifies expired cooldown does NOT block the CTA when installable
        await injectBeforeInstallPrompt(page)
        // Wait briefly for React state to update
        await page.waitForTimeout(300)
        const cta = page.getByTestId('landing-install-cta')
        await expect(cta).toBeVisible()
    })

    test('CTA appears and can be dismissed (disappears + sets cooldown)', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('kidstrack-lang', 'en')
            window.localStorage.removeItem('pwa_landing_cta_dismissed_until')
        })
        await page.goto('/?e2e=1')
        await injectBeforeInstallPrompt(page)
        await page.waitForTimeout(300)

        const cta = page.getByTestId('landing-install-cta')
        await expect(cta).toBeVisible()

        // Click the dismiss (✕) button
        await cta.getByRole('button', { name: /dismiss/i }).click()
        await expect(cta).not.toBeVisible()

        // Verify cooldown was written to localStorage
        const until = await page.evaluate(() => localStorage.getItem('pwa_landing_cta_dismissed_until'))
        expect(Number(until)).toBeGreaterThan(Date.now())
    })

    test('CTA renders in Vietnamese', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('kidstrack-lang', 'vi')
            window.localStorage.removeItem('pwa_landing_cta_dismissed_until')
        })
        await page.goto('/?e2e=1')
        await injectBeforeInstallPrompt(page)
        await page.waitForTimeout(300)

        const cta = page.getByTestId('landing-install-cta')
        await expect(cta).toBeVisible()
        await expect(cta).toContainText('Cài ứng dụng')
    })

    test('iOS: CTA shows "Add to Home Screen" label', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('kidstrack-lang', 'en')
            window.localStorage.removeItem('pwa_landing_cta_dismissed_until')
            // Mock iOS user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                configurable: true,
            })
            // iOS: navigator.standalone = false
            Object.defineProperty(navigator, 'standalone', { value: false, configurable: true })
        })
        await page.goto('/?e2e=1')
        await page.waitForTimeout(300)

        const cta = page.getByTestId('landing-install-cta')
        await expect(cta).toBeVisible()
        await expect(cta).toContainText('Add to Home Screen')
    })

    test('iOS: clicking CTA opens the install guide modal', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('kidstrack-lang', 'en')
            window.localStorage.removeItem('pwa_landing_cta_dismissed_until')
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                configurable: true,
            })
            Object.defineProperty(navigator, 'standalone', { value: false, configurable: true })
        })
        await page.goto('/?e2e=1')
        await page.waitForTimeout(300)

        const cta = page.getByTestId('landing-install-cta')
        await expect(cta).toBeVisible()

        // Click the main install button (not the dismiss ✕)
        await cta.getByRole('button', { name: /add to home screen/i }).click()

        const guide = page.getByTestId('ios-install-guide')
        await expect(guide).toBeVisible()
        await expect(guide).toContainText('Add to Home Screen')
        await expect(guide).toContainText('Share')
    })

    test('iOS guide: "Got it" closes modal and sets cooldown', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('kidstrack-lang', 'en')
            window.localStorage.removeItem('pwa_landing_cta_dismissed_until')
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                configurable: true,
            })
            Object.defineProperty(navigator, 'standalone', { value: false, configurable: true })
        })
        await page.goto('/?e2e=1')
        await page.waitForTimeout(300)

        await page.getByTestId('landing-install-cta').getByRole('button', { name: /add to home screen/i }).click()
        await expect(page.getByTestId('ios-install-guide')).toBeVisible()

        await page.getByRole('button', { name: /got it/i }).click()
        await expect(page.getByTestId('ios-install-guide')).not.toBeVisible()

        const until = await page.evaluate(() => localStorage.getItem('pwa_landing_cta_dismissed_until'))
        expect(Number(until)).toBeGreaterThan(Date.now())
    })

    test('Primary CTA still visible alongside install CTA', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('kidstrack-lang', 'en')
            window.localStorage.removeItem('pwa_landing_cta_dismissed_until')
        })
        await page.goto('/?e2e=1')
        await injectBeforeInstallPrompt(page)
        await page.waitForTimeout(300)

        // Primary CTA must remain
        await expect(page.getByRole('button', { name: /start free/i })).toBeVisible()
        // Secondary install CTA also visible
        await expect(page.getByTestId('landing-install-cta')).toBeVisible()
    })
})
