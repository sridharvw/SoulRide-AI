// Updated: 2026-09-09
document.addEventListener("DOMContentLoaded", () => {

    const welcomeTitle = document.getElementById("welcomeTitle");
    if (welcomeTitle) {
        const hour = new Date().getHours();
        if (hour < 12) {
            welcomeTitle.innerHTML = "Good Morning 👋";
        } else if (hour < 17) {
            welcomeTitle.innerHTML = "Good Afternoon 👋";
        } else {
            welcomeTitle.innerHTML = "Good Evening 🌙";
        }
    }

    const searchInput = document.getElementById("searchInput");
    const searchResults = document.getElementById("searchResults");
    if (searchInput) {
        searchInput.addEventListener("input", function () {
            const query = this.value.trim().toLowerCase();
            if (!searchResults) return;
            searchResults.innerHTML = '';
            if (!query) {
                searchResults.classList.remove('active');
                return;
            }
            const state = getAppState();
            const records = [
                ...state.vehicles.map(item => ({ title: item.nickname || `${item.brand || ''} ${item.model || ''}`, type: 'Vehicle', url: 'garage.html' })),
                ...state.trips.map(item => ({ title: item.destination || 'Trip', type: 'Trip', url: 'trip.html' })),
                ...state.services.map(item => ({ title: item.category || item.title || 'Service', type: 'Service', url: 'maintenance.html' })),
                ...state.fuelLogs.map(item => ({ title: item.station || 'Fuel log', type: 'Fuel', url: 'fueltracker.html' })),
                ...state.documents.map(item => ({ title: item.name || item.title || 'Document', type: 'Document', url: 'documents.html' }))
            ].filter(item => item.title.toLowerCase().includes(query)).slice(0, 8);
            if (!records.length) {
                searchResults.innerHTML = '<div class="search-result">No matching records</div>';
            } else {
                records.forEach(item => {
                    const link = document.createElement('a');
                    link.className = 'search-result';
                    link.href = item.url;
                    link.innerHTML = `<strong></strong><small></small>`;
                    link.querySelector('strong').textContent = item.title;
                    link.querySelector('small').textContent = item.type;
                    searchResults.appendChild(link);
                });
            }
            searchResults.classList.add('active');
        });
    }

    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    if (menuToggle && sidebar) {
        menuToggle.onclick = () => sidebar.classList.toggle("open");
    }

    // --- Dropdowns ---
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationsPanel = document.getElementById('notificationsPanel');

    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const profileImageFallback = document.getElementById('profileImageFallback');

    if (notificationBtn && notificationsPanel) {
        notificationBtn.onclick = function (event) {
            event.stopPropagation();
            notificationsPanel.classList.toggle('active');
            if (profileDropdown) profileDropdown.classList.remove('active');
        };
    }

    if (profileBtn && profileDropdown) {
        profileBtn.onclick = function (event) {
            event.stopPropagation();
            profileDropdown.classList.toggle('active');
            if (notificationsPanel) notificationsPanel.classList.remove('active');
        };
    }

    document.addEventListener('click', (event) => {
        if (notificationsPanel && !notificationsPanel.contains(event.target)) {
            notificationsPanel.classList.remove('active');
        }
        if (profileDropdown && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.remove('active');
        }
        if (searchResults && !searchResults.contains(event.target) && event.target !== searchInput) {
            searchResults.classList.remove('active');
        }
    });

    // --- Saved vehicles (shared source for notifications + stats) ---
    const vehicles = getVehicles();
    const equippedVehicle = getEquippedVehicle();

    // --- Notifications ---
    const notificationsList = document.getElementById('notificationsList');
    const notificationBadge = document.getElementById('notificationBadge');

    function showEmptyNotification() {
        notificationsList.innerHTML = `
            <li class="notification-item unread">
                <i class='bx bx-car'></i>
                <div class="notif-content">
                    <p><strong>Welcome!</strong> Add your first vehicle to get started.</p>
                    <span class="time">Just now</span>
                </div>
            </li>
        `;
        if (notificationBadge) notificationBadge.textContent = "1 New";
    }

    function generateNotifications() {
        if (!notificationsList) return;
        notificationsList.innerHTML = '';

        const notifications = getNotifications(getSelectedVehicleId());
        if (notifications.length > 0) {
            notifications.slice(0, 4).forEach(notification => {
                const item = document.createElement('li');
                item.className = `notification-item ${notification.read ? '' : 'unread'}`;
                item.innerHTML = `<i class='bx ${notification.type === 'maintenance' ? 'bx-wrench' : 'bx-bell'}'></i><div class="notif-content"><p><strong>${notification.title}</strong>: ${notification.desc}</p><span class="time">${notification.time || 'Recently'}</span></div>`;
                notificationsList.appendChild(item);
            });
            const unreadCount = notifications.filter(item => !item.read).length;
            if (notificationBadge) notificationBadge.textContent = `${unreadCount} New`;
        } else {
            showEmptyNotification();
        }
    }

    generateNotifications();

    // --- Vehicle card: swap empty state for the real vehicle once one exists ---
    const firstVehicleSection = document.getElementById('firstVehicleSection');
    if (firstVehicleSection && equippedVehicle) {
        const v = equippedVehicle;
        const displayName = v.nickname ? v.nickname : `${v.brand} ${v.model}`;
        const hasValidImage = typeof v.image === 'string' && v.image.startsWith('data:image');
        const photoHTML = hasValidImage
            ? `<img src="${v.image}" alt="${displayName}" class="vehicle-photo">`
            : `<i class='bx bx-car' id="vehicleIcon"></i>`;

        firstVehicleSection.innerHTML = `
            <div class="vehicle-card has-vehicle" id="vehicleCard">
                ${photoHTML}
                <h2 id="vehicleHeading">${displayName}</h2>
                <p id="vehicleDescription">
                    ${v.brand} ${v.model}${v.year ? ' · ' + v.year : ''}${v.registration ? ' · ' + v.registration : ''}
                </p>
                <a class="btn" href="garage.html">
                    <i class='bx bx-car'></i> View Garage
                </a>
            </div>
        `;
    }

    // --- Overview stats ---
    const statVehicles = document.getElementById('statVehicles');
    const statService = document.getElementById('statService');

    if (statVehicles) statVehicles.textContent = vehicles.length;

    if (statService && equippedVehicle) {
        statService.textContent = getNextService(equippedVehicle.id).label;
    }

    const summary = getDashboardSummary(getSelectedVehicleId());
    const distanceBox = document.getElementById('dash-total-distance');
    const fuelBox = document.getElementById('dash-fuel-spent');
    if (distanceBox) distanceBox.textContent = `${summary.totalDistance.toLocaleString()} km`;
    if (fuelBox) fuelBox.textContent = `₹${summary.fuelSpent.toLocaleString()}`;

    // --- Load username into profile dropdown ---
    const dropdownUsername = document.getElementById('dropdownUsername');
    const profileImage = document.getElementById('profileImage');
    const savedUserData = localStorage.getItem('soulride_user');
    if (dropdownUsername && savedUserData) {
        try {
            const user = JSON.parse(savedUserData);
            const username = typeof user.username === 'string' && user.username.trim()
                ? user.username.trim()
                : 'Rider Name';
            dropdownUsername.textContent = username;
            if (dropdownUsername.nextElementSibling) {
                dropdownUsername.nextElementSibling.textContent = `@${username.toLowerCase().replace(/\s+/g, '_')}`;
            }
            if (profileImage && typeof user.profilePicture === 'string' && user.profilePicture.startsWith('data:image/')) {
                profileImage.src = user.profilePicture;
                profileImage.alt = `${username}'s profile photo`;
                profileImage.hidden = false;
                if (profileImageFallback) profileImageFallback.hidden = true;
            }
        } catch (error) {
            console.warn('Could not load saved profile data.', error);
        }
    }

    const activityBox = document.getElementById('activityBox');
    const trips = getAppState().trips;
    if (activityBox && trips.length > 0) {
        const lastTrip = trips[trips.length - 1];
        const activityTitle = document.getElementById('activityTitle');
        const activityText = document.getElementById('activityText');
        if (activityTitle) activityTitle.textContent = `Recent Trip: ${lastTrip.destination || 'Unnamed destination'}`;
        if (activityText) {
            const distance = Number(lastTrip.distance ?? lastTrip.distanceKm) || 0;
            activityText.textContent = `${distance.toLocaleString()} km · ${lastTrip.date || 'Date not recorded'}`;
        }
    }

});