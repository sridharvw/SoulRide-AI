
// Updated: 2026-09-09
// Updated: 2026-09-09
let editingTripId = null; 

document.addEventListener("DOMContentLoaded", () => {

    // --- 1. DOM Elements ---
    const ongoingGrid = document.getElementById('ongoingTripsGrid');
    const plannedGrid = document.getElementById('plannedTripsGrid');
    const completedGrid = document.getElementById('completedTripsGrid');
    
    const tripModal = document.getElementById('tripModal');
    const openTripModalBtn = document.getElementById('openTripModalBtn');
    const closeTripModal = document.getElementById('closeTripModal');
    const tripForm = document.getElementById('tripForm');

    // --- 2. Sidebar Navigation Router ---
    function setupNavigation(elementId, targetUrl) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = targetUrl;
            });
        }
    }

    setupNavigation("dashboardMenu", "dashboard.html");
    setupNavigation("garageMenu", "garage.html");
    setupNavigation("chatMenu", "chat.html");
    setupNavigation("maintenanceMenu", "maintenance.html");
    setupNavigation("fuelMenu", "fuel.html");
    setupNavigation("profileMenu", "profile.html");
    setupNavigation("logoutMenu", "login.html");

    // --- 3. Modal Overlay Controllers ---
    if (openTripModalBtn) {
        openTripModalBtn.addEventListener('click', () => {
            editingTripId = null; // Reset tracker so it creates a NEW trip
            tripForm.reset();
            document.getElementById('tripDate').valueAsDate = new Date();
            tripModal.classList.add('active');
        });
    }

    if (closeTripModal) {
        closeTripModal.addEventListener('click', () => {
            tripModal.classList.remove('active');
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === tripModal) {
            tripModal.classList.remove('active');
        }
    });

    
    window.renderTripJournal = function() {
        const savedTrips = getAppState().trips || [];

        if (ongoingGrid) ongoingGrid.innerHTML = '';
        if (plannedGrid) plannedGrid.innerHTML = '';
        if (completedGrid) completedGrid.innerHTML = '';

        let totalOngoing = 0, totalPlanned = 0, totalCompleted = 0;

        savedTrips.forEach(trip => {
            const formattedDate = new Date(trip.date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            const tripCardHTML = `
                <div class="trip-card" data-id="${trip.id}">
                    <div class="trip-card-header">
                        <div>
                            <div class="trip-name">${escapeHtml(trip.name)}</div>
                            <div class="trip-date"><i class='bx bx-calendar'></i> ${formattedDate}</div>
                        </div>
                        <span class="status-badge ${trip.status}">
                            ${trip.status === 'planned' ? 'Yet to Go' : trip.status}
                        </span>
                    </div>

                    <div class="trip-route">
                        <div class="route-point">${escapeHtml(trip.from)}</div>
                        <i class='bx bx-right-arrow-alt'></i>
                        <div class="route-point">${escapeHtml(trip.to)}</div>
                    </div>

                    <button class="map-btn" onclick="window.open('${encodeURI(trip.mapUrl)}', '_blank')">
                        <i class='bx bx-map-alt'></i> View Route Map
                    </button>

                    <div class="trip-actions">
                        <button class="edit-btn" onclick="editTrip('${trip.id}')">
                            <i class='bx bx-edit'></i> <span>Edit Status/Details</span>
                        </button>
                        <button class="delete-btn" onclick="deleteTrip('${trip.id}')">
                            <i class='bx bx-trash'></i> <span>Delete</span>
                        </button>
                    </div>
                </div>
            `;

            if (trip.status === 'ongoing' && ongoingGrid) {
                ongoingGrid.innerHTML += tripCardHTML;
                totalOngoing++;
            } else if (trip.status === 'planned' && plannedGrid) {
                plannedGrid.innerHTML += tripCardHTML;
                totalPlanned++;
            } else if (trip.status === 'completed' && completedGrid) {
                completedGrid.innerHTML += tripCardHTML;
                totalCompleted++;
            }
        });

        const emptyNotificationHTML = `<div class="empty-state">No recorded trips listed.</div>`;
        if (totalOngoing === 0 && ongoingGrid) ongoingGrid.innerHTML = emptyNotificationHTML;
        if (totalPlanned === 0 && plannedGrid) plannedGrid.innerHTML = emptyNotificationHTML;
        if (totalCompleted === 0 && completedGrid) completedGrid.innerHTML = emptyNotificationHTML;
    }

   
    if (tripForm) {
        tripForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const tripStatus = document.getElementById('tripStatus').value;
            const tripName = document.getElementById('tripName').value.trim();

            const tripData = {
                vehicleId: getSelectedVehicleId(),
                name: tripName,
                from: document.getElementById('tripFrom').value.trim(),
                to: document.getElementById('tripTo').value.trim(),
                date: document.getElementById('tripDate').value,
                status: tripStatus,
                distance: Number(document.getElementById('tripDistance').value) || 0,
                mapUrl: document.getElementById('tripMapUrl').value.trim()
            };

            const existingTripsList = getAppState().trips || [];

            if (editingTripId) {
                // UPDATE EXISTING TRIP
                const index = existingTripsList.findIndex(t => t.id === editingTripId);
                if (index !== -1) {
                    tripData.id = editingTripId; 
                    existingTripsList[index] = tripData;
                }
            } else {
                // CREATE NEW TRIP
                tripData.id = Date.now().toString(); 
                existingTripsList.push(tripData);
            }

            saveTrips(existingTripsList);


            if (tripStatus === 'completed') {
                awardBadge(tripName);
            }

            tripForm.reset();
            editingTripId = null;
            tripModal.classList.remove('active');
            renderTripJournal();
        });
    }

    function awardBadge(tripName) {
        const achievements = JSON.parse(localStorage.getItem('soulride_achievements')) || [];
        const badgeId = `trip_completed_${tripName.replace(/\s+/g, '_').toLowerCase()}`;

        const alreadyAwarded = achievements.find(badge => badge.id === badgeId);

        if (!alreadyAwarded) {
            const newBadge = {
                id: badgeId,
                title: "Explorer Badge Unlocked!",
                description: `Successfully navigated and completed the journey: ${tripName}`,
                date: new Date().toLocaleDateString('en-US'),
                icon: "bx-map-pin", 
                type: "gold" 
            };
            
            achievements.push(newBadge);
            localStorage.setItem('soulride_achievements', JSON.stringify(achievements));
            
            
            alert(`🏆 ACHIEVEMENT UNLOCKED: Explorer Badge for completing "${tripName}"! Check your Achievements page.`);
        }
    }


    function escapeHtml(unsafeText) {
        return unsafeText
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    renderTripJournal();
});

window.deleteTrip = function(id) {
    if(confirm("Are you sure you want to delete this trip?")) {
        let trips = getAppState().trips || [];
        trips = trips.filter(t => t.id !== id);
        saveTrips(trips);
        window.renderTripJournal(); 
    }
};

window.editTrip = function(id) {
    const trips = getAppState().trips || [];
    const trip = trips.find(t => t.id === id);
    
    if (trip) {
        editingTripId = id;
        
        // Populate the modal fields
        document.getElementById('tripName').value = trip.name || '';
        document.getElementById('tripFrom').value = trip.from || '';
        document.getElementById('tripTo').value = trip.to || '';
        document.getElementById('tripDate').value = trip.date || '';
        document.getElementById('tripStatus').value = trip.status || 'planned';
        document.getElementById('tripDistance').value = trip.distance || '';
        document.getElementById('tripMapUrl').value = trip.mapUrl || '';
        

        document.getElementById('tripModal').classList.add('active');
    }
};