export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return await Notification.requestPermission()
}

export function showAlertNotification({ title, body }) {
  if (Notification.permission !== 'granted') return
  new Notification(title, {
    body,
    icon: '/icons/icon-192.png',
    tag: 'cropcontract-alert',
  })
}
