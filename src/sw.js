import { precacheAndRoute } from 'workbox-precaching'

// Precache all assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)

// Handle SHOW_NOTIFICATION messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body } = event.data
        self.registration.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: 'kidstrack-reminder',
            renotify: true,
        })
    }
})
