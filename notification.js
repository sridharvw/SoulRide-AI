// Updated: 2026-09-09
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('notificationList');
    if (!container) return;

    function renderNotifications() {
        const notifications = getNotifications(getSelectedVehicleId());
        container.innerHTML = '';

        if (notifications.length === 0) {
            container.innerHTML = '<p class="empty-notifications">No notifications for the equipped vehicle.</p>';
            return;
        }

        notifications.forEach(notification => {
            const card = document.createElement('article');
            card.className = `notification-card ${notification.read ? 'read' : ''}`;
            card.innerHTML = `
                <div class="icon-circle"><i class="bx ${notification.type === 'maintenance' ? 'bx-wrench' : 'bx-bell'}"></i></div>
                <div class="notif-content">
                    <h4></h4>
                    <p></p>
                    <div class="notif-time"></div>
                    ${notification.read || notification.generated ? '' : '<button class="mark-read">Mark as read</button>'}
                </div>
            `;
            card.querySelector('h4').textContent = notification.title || 'Notification';
            card.querySelector('p').textContent = notification.desc || '';
            card.querySelector('.notif-time').textContent = notification.time || 'Recently';

            const markRead = card.querySelector('.mark-read');
            if (markRead) {
                markRead.addEventListener('click', () => {
                    markNotificationRead(notification.id);
                    renderNotifications();
                });
            }
            container.appendChild(card);
        });
    }

    renderNotifications();
    window.addEventListener('soulride:data-changed', renderNotifications);
    window.addEventListener('soulride:vehicle-changed', renderNotifications);
});
