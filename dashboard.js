// Updated: 2026-09-09
document.addEventListener("DOMContentLoaded", () => {

    showWelcomeSplash();
    startRideTicker();

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

    function showWelcomeSplash() {
        const splash = document.getElementById('welcomeSplash');
        const greeting = document.getElementById('splashGreeting');
        const quote = document.getElementById('splashQuote');
        if (!splash || !greeting || !quote) return;

        const splashKey = 'soulride_dashboard_welcome_shown';
        if (sessionStorage.getItem(splashKey) === 'true') {
            splash.remove();
            return;
        }

        const quotes = [
            'Every journey begins with a single turn of the key.',
            'The best stories are found between the starting point and the destination.',
            'Ride with purpose, travel with joy.',
            'Your next great memory is just one ride away.',
            'Take the scenic route. The journey is yours to enjoy.',
            'Keep moving forward; every kilometre has a story.'
        ];
        const hour = new Date().getHours();
        const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        const previousQuote = sessionStorage.getItem('soulride_dashboard_last_quote');
        const availableQuotes = quotes.filter(item => item !== previousQuote);
        const selectedQuote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];

        sessionStorage.setItem(splashKey, 'true');
        sessionStorage.setItem('soulride_dashboard_last_quote', selectedQuote);
        greeting.textContent = `${timeGreeting} 👋`;
        quote.textContent = selectedQuote;

        const closeSplash = () => {
            splash.classList.add('is-closing');
            window.setTimeout(() => splash.remove(), 500);
        };

        splash.addEventListener('click', closeSplash, { once: true });
        window.setTimeout(closeSplash, 3800);
    }
// a text ediot as led pannel 
    function startRideTicker() {
        const ticker = document.getElementById('rideTicker');
        const tickerText = document.getElementById('rideTickerText');
        if (!ticker || !tickerText) return;

        const quotes = [
            'Ride safe. Make memories.',
            'The best routes are the ones you remember.',
            'Every kilometre is part of your story.',
            'Good rides begin with good care.',
            'Keep moving. Your next adventure awaits.',
            'Small trips. Big memories.',
            'A well-kept ride is always ready for the next story.'
        ];
        const safetyMessages = [
            'SAFETY FIRST  •  DON’T DRINK AND DRIVE',
            'BUCKLE UP  •  EVERY RIDE, EVERY TIME',
            'STAY ALERT  •  KEEP YOUR EYES ON THE ROAD',
            'SLOW DOWN  •  ARRIVE ALIVE',
            'SPEED THRILLS  • BUT KILLS',
            'NO PHONE WHILE RIDING  •  FOCUS ON THE ROAD',
            'WEAR YOUR HELMET  •  PROTECT EVERY JOURNEY',
            'CHECK MIRRORS  •  SIGNAL EARLY  •  RIDE SMART',
            'TAKE A BREAK  •  NEVER RIDE WHEN TIRED',
            'RESPECT THE ROAD  •  SHARE IT SAFELY'
        ];
        let messages = [];
        let currentIndex = 0;

        const renderMessage = () => {
            if (!messages.length) return;
            tickerText.textContent = messages[currentIndex];
            tickerText.classList.remove('ticker-marquee');
            void tickerText.offsetWidth;
            tickerText.classList.add('ticker-marquee');
            currentIndex = (currentIndex + 1) % messages.length;
        };

        const refreshMessages = () => {
            const nextMessages = [];
            const vehicle = typeof getEquippedVehicle === 'function' ? getEquippedVehicle() : null;

            if (!vehicle) {
                nextMessages.push('WELCOME RIDER  •  Add your first vehicle to begin');
            } else {
                const vehicleName = vehicle.nickname || `${vehicle.brand} ${vehicle.model}`;
                const state = getAppState();
                const service = getNextService(vehicle.id);
                const summary = getDashboardSummary(vehicle.id);
                const vehicleServices = getServices(vehicle.id);
                const vehicleFuel = getFuelLogs(vehicle.id);
                const vehicleTrips = state.trips.filter(trip =>
                    trip.vehicleId == vehicle.id ||
                    trip.vehicle === `${vehicle.brand} ${vehicle.model}` ||
                    trip.vehicle === vehicleName
                );

                nextMessages.push(`READY TO RIDE  •  ${vehicleName}`);
                nextMessages.push(`ODOMETER  •  ${summary.latestOdometer.toLocaleString()} KM ON THE ROAD`);

                if (service.status !== 'not-scheduled') {
                    nextMessages.push(`SERVICE UPDATE  •  ${service.label}`);
                }
                if (summary.totalDistance > 0) {
                    nextMessages.push(`JOURNEY LOG  •  ${summary.totalDistance.toLocaleString()} KM RECORDED`);
                }

                const latestService = [...vehicleServices]
                    .sort((first, second) => new Date(second.date || 0) - new Date(first.date || 0))[0];
                if (latestService) {
                    nextMessages.push(`RECENT SERVICE  •  ${latestService.category || 'MAINTENANCE'} LOGGED`);
                }

                const latestFuel = [...vehicleFuel]
                    .sort((first, second) => new Date(second.date || 0) - new Date(first.date || 0))[0];
                if (latestFuel) {
                    nextMessages.push(`RECENT FUEL  •  ₹${(Number(latestFuel.totalCost) || 0).toLocaleString()} REFILL RECORDED`);
                }

                const latestTrip = [...vehicleTrips]
                    .sort((first, second) => new Date(second.date || 0) - new Date(first.date || 0))[0];
                if (latestTrip) {
                    const destination = latestTrip.destination || latestTrip.title || 'NEW ROUTE';
                    const distance = Number(latestTrip.distance ?? latestTrip.distanceKm) || 0;
                    nextMessages.push(`RECENT TRIP  •  ${destination} ${distance ? `• ${distance.toLocaleString()} KM` : ''}`);
                }
            }

            safetyMessages.forEach(message => nextMessages.push(message));
            quotes.forEach(quote => nextMessages.push(`SOULRIDE NOTE  •  ${quote}`));
            messages = nextMessages;
            currentIndex = 0;
            renderMessage();
        };

        refreshMessages();
        window.addEventListener('soulride:data-changed', refreshMessages);
        window.addEventListener('soulride:vehicle-changed', refreshMessages);
        window.setInterval(renderMessage, 8500);
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
        const item = document.createElement('li');
        item.className = 'notification-item';
        item.textContent = equippedVehicle
            ? 'No notifications for this vehicle.'
            : 'Add a vehicle to receive notifications.';
        notificationsList.appendChild(item);
        if (notificationBadge) notificationBadge.textContent = "0 New";
    }

    function generateNotifications() {
        if (!notificationsList) return;
        notificationsList.innerHTML = '';

        const notifications = getNotifications(getSelectedVehicleId());
        if (notifications.length > 0) {
            notifications.slice(0, 4).forEach(notification => {
                const item = document.createElement('li');
                item.className = `notification-item ${notification.read ? '' : 'unread'}`;

                const icon = document.createElement('i');
                icon.className = `bx ${notification.type === 'maintenance' ? 'bx-wrench' : 'bx-bell'}`;

                const content = document.createElement('div');
                content.className = 'notif-content';
                const message = document.createElement('p');
                const title = document.createElement('strong');
                title.textContent = notification.title || 'Notification';
                message.append(title, `: ${notification.desc || ''}`);
                const time = document.createElement('span');
                time.className = 'time';
                time.textContent = notification.time || 'Recently';
                content.append(message, time);
                item.append(icon, content);
                notificationsList.appendChild(item);
            });
            const unreadCount = notifications.filter(item => !item.read).length;
            if (notificationBadge) notificationBadge.textContent = `${unreadCount} New`;
        } else {
            showEmptyNotification();
        }
    }

    generateNotifications();
    window.addEventListener('soulride:data-changed', generateNotifications);
    window.addEventListener('soulride:vehicle-changed', generateNotifications);

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

    const distanceBox = document.getElementById('dash-total-distance');
    const fuelBox = document.getElementById('dash-fuel-spent');
    const odometerBox = document.getElementById('dash-odometer');

    function updateDashboardSummary() {
        const vehicleId = getSelectedVehicleId();
        const summary = getDashboardSummary(vehicleId);
        if (distanceBox) distanceBox.textContent = `${summary.totalDistance.toLocaleString()} km`;
        if (fuelBox) fuelBox.textContent = `₹${summary.fuelSpent.toLocaleString()}`;
        if (odometerBox) {
            const odometer = summary.vehicle ? summary.latestOdometer : null;
            odometerBox.innerHTML = '';
            if (odometer === null) {
                odometerBox.textContent = '------';
            } else {
                String(Math.max(0, Math.floor(odometer))).padStart(6, '0').split('').forEach(digit => {
                    const digitBox = document.createElement('span');
                    digitBox.textContent = digit;
                    odometerBox.appendChild(digitBox);
                });
            }
        }
        if (statService) {
            statService.textContent = vehicleId ? getNextService(vehicleId).label : '--';
        }
    }

    updateDashboardSummary();
    window.addEventListener('soulride:data-changed', updateDashboardSummary);
    window.addEventListener('soulride:vehicle-changed', updateDashboardSummary);

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