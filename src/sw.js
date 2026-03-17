import { precacheAndRoute } from 'workbox-precaching'

// Precache all assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)

// Handle SHOW_NOTIFICATION messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, url = '/', tag = 'kidstrack-reminder' } = event.data
        self.registration.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag,
            renotify: true,
            data: { url },
        })
    }
})

self.addEventListener('notificationclick', (event) => {
    const targetUrl = event.notification?.data?.url || '/report/weekly'
    event.notification.close()

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            const sameClient = clientList.find((client) => client.url.includes(targetUrl))
            if (sameClient) return sameClient.focus()

            if (clientList.length > 0) {
                const client = clientList[0]
                client.navigate(targetUrl)
                return client.focus()
            }

            if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
            return null
        }),
    )
})
