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
    if (searchInput) {
        searchInput.addEventListener("keyup", function () {
            console.log("Searching :", this.value);
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

    // --- Load username into profile dropdown ---
    const dropdownUsername = document.getElementById('dropdownUsername');
    const savedUserData = localStorage.getItem('soulride_user');
    if (dropdownUsername && savedUserData) {
        const user = JSON.parse(savedUserData);
        dropdownUsername.textContent = user.username;
        dropdownUsername.nextElementSibling.textContent = `@${user.username.toLowerCase().replace(/\s+/g, '_')}`;
    }

});

document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch the master database state
    const state = getAppState();
    
    // 2. Target the dashboard container (make sure you have a div with this ID in dashboard.html)
    const reviewContainer = document.getElementById('quick-review-container');
    
    if (reviewContainer) {
        reviewContainer.innerHTML = ''; // Clear loading text
        
        // 3. Check if any trips exist
        if (state.trips && state.trips.length > 0) {
            // Get the last item in the array (most recent trip)
            const lastTrip = state.trips[state.trips.length - 1];
            
            // Inject it into the HTML
            reviewContainer.innerHTML = `
                <div class="review-card">
                    <h4>Recent Trip: ${lastTrip.destination}</h4>
                    <p>Distance: ${lastTrip.distance} km</p>
                    <p>Date: ${lastTrip.date}</p>
                </div>
            `;
        } else {
            reviewContainer.innerHTML = '<p>No recent trips found. Start riding!</p>';
        }
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch the master database state
    const state = getAppState();

    // --- NEW LOGIC: UPDATE DASHBOARD SUMMARY CARDS ---
    
    const summary = getDashboardSummary(getSelectedVehicleId());

    const totalDistance = getTotalDistance(getSelectedVehicleId());

    // Inject the calculated totals into the HTML boxes
    const distanceBox = document.getElementById('dash-total-distance');
    const fuelBox = document.getElementById('dash-fuel-spent');

    if (distanceBox) distanceBox.innerText = totalDistance + ' km';
    if (fuelBox) fuelBox.innerText = '₹' + summary.fuelSpent.toLocaleString();

    // --- KEEP YOUR EXISTING QUICK REVIEW LOGIC BELOW THIS ---
});