
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
    const tripMapUrl = document.getElementById('tripMapUrl');
    const tripFrom = document.getElementById('tripFrom');
    const tripTo = document.getElementById('tripTo');
    const tripDistance = document.getElementById('tripDistance');
    const routeStatus = document.getElementById('routeStatus');
    let routeRequestId = 0;

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
    setupNavigation("fuelMenu", "fueltracker.html");
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
        if (tripMapUrl) {
            tripMapUrl.addEventListener('change', updateRouteFromMapLink);
            tripMapUrl.addEventListener('blur', updateRouteFromMapLink);
            tripMapUrl.addEventListener('input', updateRouteFromMapLink);
        }

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

    async function updateRouteFromMapLink() {
        const mapUrl = tripMapUrl.value.trim();
        const requestId = ++routeRequestId;
        if (!mapUrl) return;

        const route = extractRouteFromMapLink(mapUrl);
        if (!route) {
            tripDistance.value = '';
            tripFrom.value = '';
            tripTo.value = '';
            return;
        }

        tripFrom.value = route.places[0];
        tripTo.value = route.places[route.places.length - 1];
        setRouteStatus('Finding the driving route and distance...', 'loading');

        try {
            const points = await Promise.all(route.places.map(geocodePlace));
            if (requestId !== routeRequestId) return;

            const routeResponse = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${points.map(point => `${point.lon},${point.lat}`).join(';')}?overview=false`
            );
            if (!routeResponse.ok) throw new Error('Route service unavailable');

            const routeData = await routeResponse.json();
            const meters = routeData.routes && routeData.routes[0] ? routeData.routes[0].distance : 0;
            if (!meters) throw new Error('No drivable route found');

            tripDistance.value = (meters / 1000).toFixed(1);
            setRouteStatus(
                `${route.places.length} stops: ${route.places.join(' → ')}. Total driving distance: ${(meters / 1000).toFixed(1)} km`,
                'success'
            );
        } catch (error) {
            if (requestId !== routeRequestId) return;
            setRouteStatus('Could not calculate this route automatically. Enter the distance manually.', 'error');
        }
    }

    function extractRouteFromMapLink(value) {
        try {
            const url = new URL(value);
            const isGoogleMapsHost = /(^|\.)google\.[a-z.]+$/i.test(url.hostname)
                && (url.hostname.startsWith('www.google.') || url.hostname.startsWith('maps.google.'));
            const isDirectionsPath = /^\/maps\/dir(?:\/|$)/i.test(url.pathname);

            if (!isGoogleMapsHost || !isDirectionsPath) {
                setRouteStatus(
                    'Only a normal Google Maps directions link is supported. Open Google Maps, choose Share → Copy link, and paste that link here.',
                    'error'
                );
                return null;
            }

            const origin = url.searchParams.get('origin');
            const destination = url.searchParams.get('destination');
            const waypoints = url.searchParams.get('waypoints');
            if (origin && destination) {
                const places = [origin, ...(waypoints ? waypoints.split('|') : []), destination]
                    .map(cleanPlace)
                    .filter(Boolean);
                return places.length >= 2 ? { places } : null;
            }

            const directionIndex = url.pathname.indexOf('/dir/');
            if (directionIndex !== -1) {
                const places = url.pathname.slice(directionIndex + 5)
                    .split('/')
                    .map(item => cleanPlace(decodeURIComponent(item)))
                    .filter(item => item && !item.startsWith('@') && !item.startsWith('data='));
                if (places.length >= 2) {
                    return { places };
                }
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    async function geocodePlace(place) {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(place)}`
        );
        if (!response.ok) throw new Error('Location lookup failed');
        const results = await response.json();
        if (!results.length) throw new Error(`Location not found: ${place}`);
        return { lat: results[0].lat, lon: results[0].lon };
    }

    function cleanPlace(value) {
        return value.replace(/\+/g, ' ').replace(/%2C/gi, ',').trim();
    }

    function setRouteStatus(message, state) {
        if (!routeStatus) return;
        routeStatus.textContent = message;
        routeStatus.className = `route-helper ${state}`;
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
        return String(unsafeText ?? '')
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