
// Updated: 2026-09-09
document.addEventListener("DOMContentLoaded", () => {

    // --- 1. Sidebar Navigation Router ---
    function setLink(id, url) {
        const el = document.getElementById(id);
        if (el) el.onclick = () => window.location.href = url;
    }
    setLink("dashboardMenu", "dashboard.html");
    setLink("garageMenu", "garage.html");
    setLink("chatMenu", "chat.html");
    setLink("maintenanceMenu", "maintenance.html");
    setLink("fuelMenu", "fuel.html");
    setLink("tripMenu", "trips.html");
    setLink("journeyMenu", "journey.html");
    setLink("profileMenu", "profile.html");
    setLink("logoutMenu", "login.html");

    // --- 2. Data Fetching ---
    const appState = getAppState();
    const trips = appState.trips || [];
    const maintenance = getServices();
    const garage = appState.vehicles || [];
    const achievements = JSON.parse(localStorage.getItem('soulride_achievements')) || [];
    const purchases = JSON.parse(localStorage.getItem('soulride_purchases')) || []; // For future Wishlist feature
    const mods = JSON.parse(localStorage.getItem('soulride_mods')) || []; // For future Garage feature

    // Calculate derived data
    const completedTrips = trips.filter(t => t.status === 'completed');
    let totalSpent = 0;
    maintenance.forEach(r => totalSpent += (Number(r.cost) || 0));
    purchases.forEach(p => totalSpent += (Number(p.cost) || 0));
    mods.forEach(m => totalSpent += (Number(m.cost) || 0));

    // --- 3. Render Statistics ---
    document.getElementById('statVehicles').textContent = garage.length;
    document.getElementById('statAcc').textContent = purchases.length;
    document.getElementById('statMods').textContent = mods.length;
    document.getElementById('statBadges').textContent = achievements.length;
    document.getElementById('statSpent').textContent = `₹${totalSpent.toLocaleString()}`;
    document.getElementById('statTrips').textContent = trips.length;

    // --- 4. Render Showcase (Dynamic Empty States) ---
    const showcaseGrid = document.getElementById('showcaseGrid');
    let showcaseHTML = '';

    // Pride Card
    if (garage.length > 0) {
        showcaseHTML += `<div class="showcase-card pride"><i class='bx bxs-car-garage bg-icon'></i><h4>My Pride</h4><h3>${garage[0].brand} ${garage[0].model}</h3></div>`;
    } else {
        showcaseHTML += `<div class="showcase-card"><i class='bx bxs-car-garage'></i><h4>My Pride</h4><h3 style="color:var(--text-secondary)">No vehicle added</h3></div>`;
    }

    // Badge Card
    if (achievements.length > 0) {
        showcaseHTML += `<div class="showcase-card badge-showcase"><i class='bx bxs-medal'></i><h4>Latest Badge</h4><h3>${achievements[achievements.length - 1].title}</h3></div>`;
    } else {
        showcaseHTML += `<div class="showcase-card"><i class='bx bx-medal'></i><h4>Latest Badge</h4><h3 style="color:var(--text-secondary)">None unlocked yet</h3></div>`;
    }

    // Trip Card
    if (completedTrips.length > 0) {
        const bestTrip = completedTrips[completedTrips.length - 1];
        showcaseHTML += `<div class="showcase-card trip-showcase"><i class='bx bx-landscape'></i><h4>Recent Trip</h4><h3>${bestTrip.from} → ${bestTrip.to}</h3></div>`;
    } else {
        showcaseHTML += `<div class="showcase-card"><i class='bx bx-map'></i><h4>Recent Trip</h4><h3 style="color:var(--text-secondary)">No trips completed</h3></div>`;
    }

    showcaseGrid.innerHTML = showcaseHTML;

    // --- 5. Render Trophy Cabinet ---
    const trophyGrid = document.getElementById('trophyGrid');
    const lockedTemplates = [
        { title: "First Ride", desc: "Complete your very first trip.", icon: "bx-map" },
        { title: "Gearhead", desc: "Add a vehicle to your garage.", icon: "bx-car" },
        { title: "Maintenance Master", desc: "Log your first service.", icon: "bx-wrench" }
    ];

    trophyGrid.innerHTML = '';
    
    // Render Unlocked Badges First
    achievements.forEach(badge => {
        trophyGrid.innerHTML += `
            <div class="trophy-card ${badge.type || 'gold'}">
                <div class="icon-ring"><i class='bx ${badge.icon}'></i></div>
                <h4>${badge.title}</h4>
                <p>${badge.description}</p>
            </div>
        `;
    });

    // If they have less than 3 badges, show the locked placeholders so the cabinet isn't empty
    if (achievements.length < 3) {
        lockedTemplates.forEach(locked => {
            trophyGrid.innerHTML += `
                <div class="trophy-card locked">
                    <div class="icon-ring"><i class='bx ${locked.icon}'></i></div>
                    <h4>${locked.title}</h4>
                    <p>${locked.desc}</p>
                </div>
            `;
        });
    }

    // --- 6. Render Inventory (Purchases & Mods with Edit/Delete) ---
    const purchasesList = document.getElementById('purchasesList');
    const modsList = document.getElementById('modsList');

    if (purchases.length === 0) {
        purchasesList.innerHTML = `<div class="empty-journey-state">No gear purchased yet.</div>`;
    } else {
        // Future logic for rendering purchases goes here
    }

    if (mods.length === 0) {
        modsList.innerHTML = `<div class="empty-journey-state">No mods installed yet.</div>`;
    } else {
        // Future logic for rendering mods goes here
    }

    // --- 7. Render Memory Wall ---
    const memoryWall = document.getElementById('memoryWall');
    let memoryEvents = [];

    completedTrips.forEach(trip => memoryEvents.push({ date: new Date(trip.date), icon: 'bx-map-alt', title: `Completed Trip: ${trip.name}`, desc: `Rode from ${trip.from} to ${trip.to}.` }));
    maintenance.forEach(m => memoryEvents.push({ date: new Date(m.date), icon: 'bx-wrench', title: `Service: ${m.category}`, desc: `Logged at ${m.odometer} km.` }));
    achievements.forEach(a => memoryEvents.push({ date: new Date(a.date), icon: 'bx-trophy', title: `Unlocked: ${a.title}`, desc: a.description }));

    memoryEvents.sort((a, b) => b.date - a.date); // Newest first

    if (memoryEvents.length === 0) {
        memoryWall.innerHTML = `<div class="empty-journey-state" style="margin-left: -20px;">Your journey hasn't started yet. Add a vehicle, log a trip, or record a service to build your timeline!</div>`;
    } else {
        memoryWall.innerHTML = '';
        memoryEvents.forEach(event => {
            const dateStr = event.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            memoryWall.innerHTML += `
                <div class="memory-item">
                    <div class="mem-date">${dateStr}</div>
                    <div class="mem-content">
                        <i class='bx ${event.icon} icon-badge'></i>
                        <h4>${event.title}</h4>
                        <p>${event.desc}</p>
                    </div>
                </div>
            `;
        });
    }
});