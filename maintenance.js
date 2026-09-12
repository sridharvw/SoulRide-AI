
// Updated: 2026-09-09
let editingServiceId = null;
let currentVehicleId = null;

document.addEventListener("DOMContentLoaded", () => {

    // --- Sidebar Navigation ---
    function setLink(id, url) {
        const el = document.getElementById(id);
        if (el) el.onclick = () => window.location.href = url;
    }
    setLink("dashboardMenu", "dashboard.html");
    setLink("garageMenu", "garage.html");
    setLink("chatMenu", "chat.html");
    setLink("maintenanceMenu", "maintenance.html");
    setLink("fuelMenu", "fuel.html");
    setLink("tripMenu", "trip.html"); // Fixed from trip.html
    setLink("journeyMenu", "journey.html");
    setLink("profileMenu", "profile.html");
    setLink("logoutMenu", "login.html");

    // --- DOM Elements ---
    const serviceModal = document.getElementById('serviceModal');
    const openLogModalBtn = document.getElementById('openLogModalBtn');
    const closeServiceModal = document.getElementById('closeServiceModal');
    const serviceForm = document.getElementById('serviceForm');
    const timelineContainer = document.getElementById('timelineContainer');
    const alertsContainer = document.getElementById('alertsContainer');
    const maintenanceTitle = document.getElementById('maintenanceTitle');

    // Context Loading
    currentVehicleId = getSelectedVehicleId();
    const allVehicles = getVehicles();
    const currentVehicle = allVehicles.find(v => v.id == currentVehicleId);

    // Initialize Page Headers
    if (maintenanceTitle) {
        if (currentVehicle) {
            maintenanceTitle.textContent = `${currentVehicle.brand} ${currentVehicle.model} Maintenance`;
        } else {
            maintenanceTitle.textContent = "Maintenance Center (Select a vehicle)";
        }
    }

    // --- Modal Controls ---
    if (openLogModalBtn) {
        openLogModalBtn.addEventListener('click', () => {
            if (!currentVehicleId) {
                alert("Please select a vehicle from 'My Garage' first!");
                return;
            }
            editingServiceId = null; 
            serviceForm.reset();
            document.getElementById('serviceDate').valueAsDate = new Date();
            serviceModal.classList.add('active');
        });
    }

    if (closeServiceModal) {
        closeServiceModal.addEventListener('click', () => {
            serviceModal.classList.remove('active');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === serviceModal) {
            serviceModal.classList.remove('active');
        }
    });

    // --- Form Submission ---
    if (serviceForm) {
        serviceForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Force Number types on save to prevent string concatenation bugs
            const recordData = {
                vehicleId: currentVehicleId,
                date: document.getElementById('serviceDate').value,
                odometer: Number(document.getElementById('serviceOdo').value) || 0,
                category: document.getElementById('serviceCategory').value,
                cost: Number(document.getElementById('serviceCost').value) || 0,
                notes: document.getElementById('serviceNotes').value.trim()
            };

            if (editingServiceId) recordData.id = editingServiceId;
            addService(recordData);

            
            if (recordData.odometer >= 10000) {
                const achievements = JSON.parse(localStorage.getItem('soulride_achievements')) || [];
                const badgeExists = achievements.find(b => b.id === "badge_10k");
                
                if (!badgeExists) {
                    achievements.push({
                        id: "badge_10k",
                        title: "10,000 KM Club",
                        description: "Reached 10,000 kilometers on the odometer.",
                        date: new Date().toLocaleDateString('en-US'),
                        icon: "bx-tachometer",
                        type: "gold"
                    });
                    localStorage.setItem('soulride_achievements', JSON.stringify(achievements));
                    
                    // Small delay so the modal closes smoothly before the alert pops up
                    setTimeout(() => {
                        alert("🏆 ACHIEVEMENT UNLOCKED: 10,000 KM Club! Check your Journey page.");
                    }, 300);
                }
            }

            serviceForm.reset();
            serviceModal.classList.remove('active');
            editingServiceId = null;
            
            renderDashboard();
        });
    }

    // --- Core Rendering Engine ---
    window.renderDashboard = function() {
        if (!currentVehicleId) {
            timelineContainer.innerHTML = `<p style="color:var(--text-secondary)">Please select a vehicle from your garage to view history.</p>`;
            return;
        }

        let vehicleHistory = getServices(currentVehicleId);
        vehicleHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 1. Calculate Stats (Safely converting everything to Numbers)
        let totalCost = 0;
        let highestOdo = 0;
        
        vehicleHistory.forEach(record => {
            const costVal = Number(record.cost) || 0;
            const odoVal = Number(record.odometer) || 0;

            totalCost += costVal;
            if (odoVal > highestOdo) highestOdo = odoVal;
        });

        document.getElementById('totalCostDisplay').textContent = `₹${totalCost.toLocaleString()}`;
        document.getElementById('latestOdoDisplay').textContent = `${highestOdo.toLocaleString()} km`;
        document.getElementById('totalServicesDisplay').textContent = vehicleHistory.length;

        // 2. Render Predictive Alerts
        alertsContainer.innerHTML = ''; 
        const lastOilChange = vehicleHistory.find(s => s.category === "Engine Oil" || s.type === "Engine Oil");
        
        if (lastOilChange) {
            const lastOdo = Number(lastOilChange.odometer) || 0;
            const nextOilDue = lastOdo + 5000; 
            const kmRemaining = nextOilDue - highestOdo;

            if (kmRemaining <= 0 && highestOdo > 0) {
                alertsContainer.innerHTML += `
                    <div class="alert-card">
                        <i class='bx bx-error-circle'></i>
                        <div>
                            <h3>Oil Change OVERDUE</h3>
                            <p>Was due at ${nextOilDue.toLocaleString()} km. Book a service immediately.</p>
                        </div>
                    </div>`;
            } else if (kmRemaining <= 1000 && highestOdo > 0) {
                alertsContainer.innerHTML += `
                    <div class="alert-card">
                        <i class='bx bx-alarm-exclamation'></i>
                        <div>
                            <h3>Oil Change Due Soon</h3>
                            <p>Due at ${nextOilDue.toLocaleString()} km (In ${kmRemaining} km).</p>
                        </div>
                    </div>`;
            } else {
                alertsContainer.innerHTML += `
                    <div class="alert-card good">
                        <i class='bx bx-check-shield'></i>
                        <div>
                            <h3>Engine Healthy</h3>
                            <p>Next oil change due in ${kmRemaining} km.</p>
                        </div>
                    </div>`;
            }
        } else {
             alertsContainer.innerHTML = `
                <div class="alert-card good">
                    <i class='bx bx-info-circle'></i>
                    <div>
                        <h3>No Alerts</h3>
                        <p>Log an "Engine Oil" service to activate predictive alerts.</p>
                    </div>
                </div>`;
        }

        // 3. Render Timeline
        timelineContainer.innerHTML = '';
        if (vehicleHistory.length === 0) {
            timelineContainer.innerHTML = `<p style="color:var(--text-secondary)">No service history logged yet.</p>`;
            return;
        }

        vehicleHistory.forEach(record => {
            // Safe fallback for old V1 data
            const dateStr = record.date || new Date().toISOString();
            const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            const costVal = Number(record.cost) || 0;
            const odoVal = Number(record.odometer) || 0;
            const categoryLabel = record.category || record.type || 'General Service';
            const notesHTML = record.notes ? `<p class="tl-notes">${record.notes}</p>` : '';
            // Handle missing IDs from V1 safely
            const recordId = record.id || Date.now().toString() + Math.random(); 

            timelineContainer.innerHTML += `
                <div class="timeline-card">
                    <div class="tl-header">
                        <div>
                            <div class="tl-title">${categoryLabel}</div>
                            <div class="tl-meta">
                                <span><i class='bx bx-calendar'></i> ${formattedDate}</span>
                                <span><i class='bx bx-tachometer'></i> ${odoVal.toLocaleString()} km</span>
                            </div>
                        </div>
                        <div class="tl-cost">₹${costVal.toLocaleString()}</div>
                    </div>
                    ${notesHTML}
                    <div class="tl-actions">
                        <button class="edit-btn" onclick="editService('${recordId}')">
                            <i class='bx bx-edit'></i> <span>Edit</span>
                        </button>
                        <button class="delete-btn" onclick="deleteService('${recordId}')">
                            <i class='bx bx-trash'></i> <span>Delete</span>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    // Initialize
    renderDashboard();
});

// --- Global Functions ---
window.deleteService = function(id) {
    if(confirm("Are you sure you want to delete this service record?")) {
        deleteService(id);
        window.renderDashboard(); 
    }
};

window.editService = function(id) {
    const record = getServices(currentVehicleId).find(s => s.id === id);
    
    if (record) {
        editingServiceId = id; 
        
        document.getElementById('serviceDate').value = record.date || '';
        document.getElementById('serviceOdo').value = record.odometer || '';
        
        // Handle V1 "type" fallback in the dropdown
        const catSelect = document.getElementById('serviceCategory');
        catSelect.value = record.category || 'General';
        
        document.getElementById('serviceCost').value = record.cost || '';
        document.getElementById('serviceNotes').value = record.notes || '';
        
        document.getElementById('serviceModal').classList.add('active');
    } else {
        alert("Cannot edit this older record format. Please delete and recreate it.");
    }
};