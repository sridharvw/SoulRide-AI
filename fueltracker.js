// Updated: 2026-09-09
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

let db = null;

// Safe Initialization: Uses the global 'firebase' object loaded in HTML
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        console.log("Firebase initialized successfully.");
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
} else {
    console.log("Firebase config missing. Running safely in offline fallback mode.");
}

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. Sidebar Navigation ---
    function setLink(id, url) {
        const el = document.getElementById(id);
        if (el) el.onclick = () => window.location.href = url;
    }
    setLink("dashboardMenu", "dashboard.html");
    setLink("garageMenu", "garage.html");
    setLink("chatMenu", "chat.html");
    setLink("maintenanceMenu", "maintenance.html");
    setLink("fuelMenu", "fueltracker.html");
    setLink("tripMenu", "trip.html");
    setLink("journeyMenu", "achivement.html");
    setLink("wishlistMenu", "wishlist.html");
    setLink("profileMenu", "profile.html");
    setLink("logoutMenu", "login.html");

    // --- 2. Live Fuel Price Data Core ---
    let liveFuelPrices = {};

    async function fetchLiveFuelPrices() {
        try {
            const petrolEl = document.getElementById('petrolPriceDisplay');
            const dieselEl = document.getElementById('dieselPriceDisplay');
            if (petrolEl) petrolEl.textContent = "Loading...";
            if (dieselEl) dieselEl.textContent = "Loading...";

            // Check if DB exists and fetch
            if (db) {
                const docRef = db.collection("fuelPrices").doc("india");
                const docSnap = await docRef.get();

                if (docSnap.exists) {
                    liveFuelPrices = docSnap.data();
                    console.log("Prices successfully synchronized from Firestore.");
                } else {
                    console.warn("Pricing document missing. Using fallback data.");
                    loadFallbackData();
                }
            } else {
                loadFallbackData();
            }

            updatePriceUI();

        } catch (error) {
            console.error("Network/Database error:", error);
            loadFallbackData();
            updatePriceUI();
        }
    }

    function loadFallbackData() {
        liveFuelPrices = {
            "Bengaluru": { petrol: "105.48", diesel: "92.76", trendP: "▲ +0.20", trendD: "▼ -0.15" },
            "Delhi":     { petrol: "94.72",  diesel: "87.62", trendP: "▼ -0.10", trendD: "▲ +0.05" },
            "Mumbai":    { petrol: "104.21", diesel: "92.15", trendP: "▲ +0.15", trendD: "▼ -0.10" },
            "Chennai":   { petrol: "100.75", diesel: "92.34", trendP: "▲ +0.05", trendD: "▲ +0.12" }
        };
    }

    function updatePriceUI() {
        const citySelect = document.getElementById('citySelect');
        if (!citySelect) return;

        const city = citySelect.value;
        const data = liveFuelPrices[city];
        
        if (data) {
            const petrolPriceEl = document.getElementById('petrolPriceDisplay');
            const dieselPriceEl = document.getElementById('dieselPriceDisplay');
            if (petrolPriceEl) petrolPriceEl.textContent = `₹${data.petrol}/L`;
            if (dieselPriceEl) dieselPriceEl.textContent = `₹${data.diesel}/L`;
            
            const trendPNode = document.querySelector('.fuel-type:first-child .trend');
            if (trendPNode) {
                trendPNode.textContent = data.trendP;
                trendPNode.className = data.trendP.includes('▲') ? 'trend up' : 'trend down';
            }
            
            const trendDNode = document.querySelector('.fuel-type:last-child .trend');
            if (trendDNode) {
                trendDNode.textContent = data.trendD;
                trendDNode.className = data.trendD.includes('▲') ? 'trend up' : 'trend down';
            }

            const timeEl = document.getElementById('lastUpdatedTime');
            if (timeEl) {
                const now = new Date();
                timeEl.textContent = `Today • ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            }
        }
    }

    const citySelectEl = document.getElementById('citySelect');
    if (citySelectEl) {
        citySelectEl.addEventListener('change', updatePriceUI);
    }

    fetchLiveFuelPrices();

    // --- 3. Modal Logic (This will now work!) ---
    const fuelModal = document.getElementById('fuelModal');
    const fuelForm = document.getElementById('fuelForm');
    
    function populateVehicles() {
        const garage = getVehicles();
        const select = document.getElementById('fuelVehicle');
        if (!select) return;
        
        if (garage.length === 0) {
            select.innerHTML = `<option value="">Select a vehicle</option>`;
            return;
        }
        const equippedId = getSelectedVehicleId();
        select.innerHTML = garage.map(v => `<option value="${v.id}" ${v.id == equippedId ? 'selected' : ''}>${v.brand} ${v.model}</option>`).join('');
    }
    populateVehicles();

    // Open Modal
    const openBtn = document.getElementById('openFuelModalBtn');
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            if (fuelForm) fuelForm.reset();
            
            const dateInput = document.getElementById('fuelDate');
            if (dateInput) dateInput.valueAsDate = new Date();
            
            const citySelect = document.getElementById('citySelect');
            const typeSelect = document.getElementById('fuelType');
            const priceInput = document.getElementById('fuelPricePerLitre');

            if (citySelect && typeSelect && priceInput) {
                const currentCity = citySelect.value;
                const currentType = typeSelect.value.toLowerCase();
                if (liveFuelPrices[currentCity] && liveFuelPrices[currentCity][currentType]) {
                    priceInput.value = liveFuelPrices[currentCity][currentType];
                }
            }
            
            if (fuelModal) fuelModal.classList.add('active');
        });
    }

    // Close Modal
    const closeBtn = document.getElementById('closeFuelModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (fuelModal) fuelModal.classList.remove('active');
        });
    }

    const litresInput = document.getElementById('fuelLitres');
    const priceInput = document.getElementById('fuelPricePerLitre');
    const totalOutput = document.getElementById('fuelTotalCost');

    function calculateTotal() {
        if (!litresInput || !priceInput || !totalOutput) return;
        const l = parseFloat(litresInput.value) || 0;
        const p = parseFloat(priceInput.value) || 0;
        totalOutput.value = (l * p).toFixed(2);
    }
    if (litresInput) litresInput.addEventListener('input', calculateTotal);
    if (priceInput) priceInput.addEventListener('input', calculateTotal);

    // --- 4. Form Submission ---
    if (fuelForm) {
        fuelForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const record = {
                id: "fuel_" + Date.now(),
                vehicleId: getSelectedVehicleId() || document.getElementById('fuelVehicle').value,
                date: document.getElementById('fuelDate').value,
                fuelType: document.getElementById('fuelType').value,
                odometer: Number(document.getElementById('fuelOdo').value),
                litres: Number(document.getElementById('fuelLitres').value),
                pricePerLitre: Number(document.getElementById('fuelPricePerLitre').value),
                totalCost: Number(document.getElementById('fuelTotalCost').value),
                payment: document.getElementById('fuelPayment').value,
                station: document.getElementById('fuelStation').value.trim()
            };

            addFuelLog(record);

            if (fuelModal) fuelModal.classList.remove('active');
            renderFuelDashboard();
        });
    }

    window.renderFuelDashboard = function() {
        const history = getFuelLogs(getSelectedVehicleId());
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        let totalSpent = 0;
        const body = document.getElementById('fuelHistoryBody');
        if (!body) return;
        
        body.innerHTML = '';

        if (history.length === 0) {
            body.innerHTML = `<tr><td colspan="6" style="text-align:center;">No fuel records found.</td></tr>`;
        }

        let vehicleData = {};
        history.forEach(r => {
            if(!vehicleData[r.vehicleId]) vehicleData[r.vehicleId] = [];
            vehicleData[r.vehicleId].push(r);
            totalSpent += Number(r.totalCost) || 0;
        });

        let allMileages = [];

        history.forEach(record => {
            const vHistory = vehicleData[record.vehicleId];
            const currentIndex = vHistory.indexOf(record);
            const prevRecord = vHistory[currentIndex + 1]; 

            let mileageStr = "N/A";
            if (prevRecord && record.odometer > prevRecord.odometer) {
                const distance = record.odometer - prevRecord.odometer;
                const mileage = (distance / record.litres).toFixed(1);
                mileageStr = `${mileage} km/L`;
                allMileages.push(Number(mileage));
            }

            const dateStr = new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            body.innerHTML += `
                <tr>
                    <td>${dateStr}</td>
                    <td>${getVehicleLabel(record.vehicleId)}</td>
                    <td>${record.litres}L<br><small style="color:var(--text-secondary)">₹${Number(record.totalCost || 0).toLocaleString()}</small></td>
                    <td class="mileage-highlight">${mileageStr}</td>
                    <td>${record.station || 'Unknown'}</td>
                    <td class="action-btns">
                        <button class="delete-row" onclick="deleteFuel('${record.id}')"><i class='bx bx-trash'></i></button>
                    </td>
                </tr>
            `;
        });

        const refuelsStat = document.getElementById('statRefuels');
        const spentStat = document.getElementById('statSpent');
        if (refuelsStat) refuelsStat.textContent = history.length;
        if (spentStat) spentStat.textContent = `₹${totalSpent.toLocaleString()}`;

        if (allMileages.length > 0) {
            const sum = allMileages.reduce((a, b) => a + b, 0);
            const avg = (sum / allMileages.length).toFixed(1);
            const max = Math.max(...allMileages).toFixed(1);
            
            const avgMilStat = document.getElementById('statAvgMileage');
            const bestMilStat = document.getElementById('statBestMileage');
            if (avgMilStat) avgMilStat.textContent = `${avg} km/L`;
            if (bestMilStat) bestMilStat.textContent = `${max} km/L`;

            const insightBox = document.getElementById('aiInsightBox');
            if (insightBox) {
                insightBox.innerHTML = `
                    <p><i class='bx bx-trending-up'></i> Averaging <strong>${avg} km/L</strong>. Your estimated running cost is <strong>₹${(totalSpent/history.reduce((acc, val) => acc + val.odometer, 1)).toFixed(2)}</strong> per KM.</p>
                `;
            }
        }
    };

    window.addEventListener('soulride:vehicle-changed', () => {
        populateVehicles();
        renderFuelDashboard();
    });

    window.deleteFuel = function(id) {
        if(confirm("Delete this fuel record?")) {
            deleteFuelLog(id);
            renderFuelDashboard();
        }
    }

    function getVehicleLabel(vehicleId) {
        const vehicle = getVehicles().find(item => item.id == vehicleId);
        return vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown vehicle';
    }

    renderFuelDashboard();
});