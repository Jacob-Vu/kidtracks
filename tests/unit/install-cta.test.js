/**
 * Unit tests for install-app CTA detection logic.
 * Tests the pure detection logic extracted from useInstallPrompt.js.
 * Runs with: node tests/unit/install-cta.test.js
 */

import assert from 'node:assert/strict'

const run = (name, fn) => {
    try {
        fn()
        console.log(`ok - ${name}`)
    } catch (err) {
        console.error(`FAIL - ${name}`)
        throw err
    }
}

// ─── Standalone detection logic (mirrors useInstallPrompt) ────────────────────

function checkStandaloneFromSignals({ displayModeStandalone, navigatorStandalone, referrer }) {
    return displayModeStandalone || navigatorStandalone === true || (referrer || '').includes('android-app://')
}

run('standalone: display-mode standalone → true', () => {
    assert.equal(checkStandaloneFromSignals({ displayModeStandalone: true }), true)
})

run('standalone: navigator.standalone true → true', () => {
    assert.equal(checkStandaloneFromSignals({ navigatorStandalone: true }), true)
})

run('standalone: android-app referrer → true', () => {
    assert.equal(checkStandaloneFromSignals({ referrer: 'android-app://com.example' }), true)
})

run('standalone: all signals false → false', () => {
    assert.equal(checkStandaloneFromSignals({ displayModeStandalone: false, navigatorStandalone: false, referrer: 'https://example.com' }), false)
})

// ─── iOS detection logic ──────────────────────────────────────────────────────

function detectIOS(ua) {
    const webkit = /WebKit/i.test(ua)
    const isIOSDevice = /iPad|iPhone/i.test(ua)
    return isIOSDevice && webkit && !/CriOS/i.test(ua)
}

run('iOS detection: iPhone Safari → true', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    assert.equal(detectIOS(ua), true)
})

run('iOS detection: iPhone Chrome → false (CriOS)', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/106.0 Mobile/15E148 Safari/604.1'
    assert.equal(detectIOS(ua), false)
})

run('iOS detection: Android Chrome → false', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Mobile Safari/537.36'
    assert.equal(detectIOS(ua), false)
})

run('iOS detection: Desktop Chrome → false', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
    assert.equal(detectIOS(ua), false)
})

// ─── isInstallable derivation ─────────────────────────────────────────────────

function computeIsInstallable({ hasDeferredPrompt, isIOS, isStandalone }) {
    return hasDeferredPrompt || (isIOS && !isStandalone)
}

run('isInstallable: deferredPrompt available → true', () => {
    assert.equal(computeIsInstallable({ hasDeferredPrompt: true, isIOS: false, isStandalone: false }), true)
})

run('isInstallable: iOS + not standalone → true', () => {
    assert.equal(computeIsInstallable({ hasDeferredPrompt: false, isIOS: true, isStandalone: false }), true)
})

run('isInstallable: iOS + standalone → false', () => {
    assert.equal(computeIsInstallable({ hasDeferredPrompt: false, isIOS: true, isStandalone: true }), false)
})

run('isInstallable: no signal → false', () => {
    assert.equal(computeIsInstallable({ hasDeferredPrompt: false, isIOS: false, isStandalone: false }), false)
})

// ─── showInstallCTA derivation ────────────────────────────────────────────────

function computeShowInstallCTA({ isStandalone, isInstallable, ctaDismissed }) {
    return !isStandalone && isInstallable && !ctaDismissed
}

run('showInstallCTA: installable + not standalone + not dismissed → true', () => {
    assert.equal(computeShowInstallCTA({ isStandalone: false, isInstallable: true, ctaDismissed: false }), true)
})

run('showInstallCTA: standalone → false', () => {
    assert.equal(computeShowInstallCTA({ isStandalone: true, isInstallable: true, ctaDismissed: false }), false)
})

run('showInstallCTA: not installable → false', () => {
    assert.equal(computeShowInstallCTA({ isStandalone: false, isInstallable: false, ctaDismissed: false }), false)
})

run('showInstallCTA: dismissed within cooldown → false', () => {
    assert.equal(computeShowInstallCTA({ isStandalone: false, isInstallable: true, ctaDismissed: true }), false)
})

// ─── 24h cooldown logic ───────────────────────────────────────────────────────

const COOLDOWN_MS = 24 * 60 * 60 * 1000

function isWithinCooldown(storedUntil, now) {
    if (!storedUntil) return false
    return now < Number(storedUntil)
}

run('cooldown: no stored value → not dismissed', () => {
    assert.equal(isWithinCooldown(null, Date.now()), false)
})

run('cooldown: stored future timestamp → dismissed', () => {
    const until = String(Date.now() + COOLDOWN_MS)
    assert.equal(isWithinCooldown(until, Date.now()), true)
})

run('cooldown: stored past timestamp → not dismissed', () => {
    const until = String(Date.now() - 1000)
    assert.equal(isWithinCooldown(until, Date.now()), false)
})

run('cooldown: exactly at expiry → not dismissed', () => {
    const now = Date.now()
    const until = String(now)
    assert.equal(isWithinCooldown(until, now), false) // Date.now() < Date.now() is false
})

console.log('\ninstall-cta unit tests passed')
