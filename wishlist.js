
let editingItemId = null;
let purchasingItemId = null; 

// Updated: 2026-09-09
document.addEventListener("DOMContentLoaded", () => {

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
    setLink("wishlistMenu", "wishlist.html");
    setLink("profileMenu", "profile.html");
    setLink("logoutMenu", "login.html");

    const wishlistGrid = document.getElementById('wishlistGrid');
    const wishlistModal = document.getElementById('wishlistModal');
    const purchaseModal = document.getElementById('purchaseModal');
    const wishlistForm = document.getElementById('wishlistForm');
    const purchaseForm = document.getElementById('purchaseForm');
    
    const searchInput = document.getElementById('searchInput');
    const filterCategory = document.getElementById('filterCategory');
    const filterVehicle = document.getElementById('filterVehicle');
    const filterPriority = document.getElementById('filterPriority');
    const buildVehicleSelect = document.getElementById('buildVehicleSelect');

    function loadVehicles() {
        const garage = JSON.parse(localStorage.getItem('vehicles')) || [];
        const itemVehicleSelect = document.getElementById('itemVehicle');
        
        let optionsHTML = garage.length > 0 ? '' : `<option value="Universal">Universal / No Vehicle</option>`;
        
        garage.forEach(v => {
            const name = `${v.brand} ${v.model}`;
            optionsHTML += `<option value="${name}">${name}</option>`;
        });

        if (itemVehicleSelect) itemVehicleSelect.innerHTML = optionsHTML;
        
        if (filterVehicle) filterVehicle.innerHTML = `<option value="all">All Vehicles</option>` + optionsHTML;
        
        if (buildVehicleSelect) buildVehicleSelect.innerHTML = optionsHTML;
    }
    loadVehicles();

    document.getElementById('openAddModalBtn').addEventListener('click', () => {
        editingItemId = null;
        wishlistForm.reset();
        wishlistModal.classList.add('active');
    });

    document.getElementById('closeAddModal').addEventListener('click', () => wishlistModal.classList.remove('active'));
    document.getElementById('closePurchaseModal').addEventListener('click', () => purchaseModal.classList.remove('active'));

    // --- 5. Add / Edit Wishlist Item ---
    wishlistForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const newItem = {
            name: document.getElementById('itemName').value.trim(),
            expectedPrice: Number(document.getElementById('itemPrice').value) || 0,
            category: document.getElementById('itemCategory').value,
            vehicle: document.getElementById('itemVehicle').value,
            priority: document.getElementById('itemPriority').value,
            link: document.getElementById('itemLink').value.trim(),
            notes: document.getElementById('itemNotes').value.trim(),
            dateAdded: new Date().toISOString()
        };

        let wishlist = JSON.parse(localStorage.getItem('soulride_wishlist')) || [];

        if (editingItemId) {
            const index = wishlist.findIndex(i => i.id === editingItemId);
            if (index !== -1) {
                newItem.id = editingItemId;
                wishlist[index] = newItem;
            }
        } else {
            newItem.id = "wish_" + Date.now().toString();
            wishlist.push(newItem);
        }

        localStorage.setItem('soulride_wishlist', JSON.stringify(wishlist));
        wishlistForm.reset();
        wishlistModal.classList.remove('active');
        editingItemId = null;
        
        renderDashboard();
    });

    purchaseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!purchasingItemId) return;

        let wishlist = JSON.parse(localStorage.getItem('soulride_wishlist')) || [];
        const itemIndex = wishlist.findIndex(i => i.id === purchasingItemId);
        
        if (itemIndex === -1) return;

        const item = wishlist[itemIndex];
        const destCategory = document.querySelector('input[name="destCategory"]:checked').value; // 'accessory' or 'mod'
        const actualPrice = Number(document.getElementById('actualPrice').value) || 0;

        const officialRecord = {
            id: "inv_" + Date.now().toString(),
            name: item.name,
            cost: actualPrice,
            expectedPrice: item.expectedPrice, 
            category: item.category,
            vehicle: item.vehicle,
            notes: item.notes,
            purchaseDate: new Date().toISOString()
        };

        if (destCategory === 'accessory') {
            const purchases = JSON.parse(localStorage.getItem('soulride_purchases')) || [];
            purchases.push(officialRecord);
            localStorage.setItem('soulride_purchases', JSON.stringify(purchases));
        } else {
            const mods = JSON.parse(localStorage.getItem('soulride_mods')) || [];
            mods.push(officialRecord);
            localStorage.setItem('soulride_mods', JSON.stringify(mods));
        }

        wishlist.splice(itemIndex, 1);
        localStorage.setItem('soulride_wishlist', JSON.stringify(wishlist));

        purchaseModal.classList.remove('active');
        purchasingItemId = null;
        purchaseForm.reset();

        alert(`🎉 Successfully added to your Journey! View it on the My Journey page.`);
        
        renderDashboard();
    });

    window.renderDashboard = function() {
        const wishlist = JSON.parse(localStorage.getItem('soulride_wishlist')) || [];
        const purchases = JSON.parse(localStorage.getItem('soulride_purchases')) || [];
        const mods = JSON.parse(localStorage.getItem('soulride_mods')) || [];
        const maintenance = getServices();

        // A. Filter Wishlist for Grid
        const term = searchInput.value.toLowerCase();
        const cat = filterCategory.value;
        const veh = filterVehicle.value;
        const pri = filterPriority.value;

        const filteredList = wishlist.filter(item => {
            const matchSearch = item.name.toLowerCase().includes(term);
            const matchCat = cat === 'all' || item.category === cat;
            const matchVeh = veh === 'all' || item.vehicle === veh;
            const matchPri = pri === 'all' || item.priority === pri;
            return matchSearch && matchCat && matchVeh && matchPri;
        });

        // B. Render Cards
        wishlistGrid.innerHTML = '';
        if (filteredList.length === 0) {
            wishlistGrid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-secondary);">No wishlist items found. Start planning!</div>`;
        }

        filteredList.forEach(item => {
            const dateStr = new Date(item.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            // Priority Styling
            let priClass = 'priority-low'; let priLabel = 'Dream';
            if (item.priority === 'high') { priClass = 'priority-high'; priLabel = 'Must Have'; }
            else if (item.priority === 'medium') { priClass = 'priority-medium'; priLabel = 'Important'; }

            wishlistGrid.innerHTML += `
                <div class="wish-card">
                    <div class="wish-image"><i class='bx bx-gift'></i></div>
                    <div class="wish-content">
                        <div class="wish-header">
                            <span class="badge ${priClass}">${priLabel}</span>
                            <span class="badge category-badge">${item.category}</span>
                        </div>
                        <h3 class="wish-title">${item.name}</h3>
                        <div class="wish-price">₹${item.expectedPrice.toLocaleString()}</div>
                        <p class="wish-meta"><i class='bx bx-car'></i> ${item.vehicle}</p>
                        
                        <div class="status-tracker">
                            <div class="step active">Dream</div>
                            <div class="step">Saving</div>
                            <div class="step">Installed</div>
                        </div>

                        <div class="wish-actions">
                            <button class="btn secondary-btn" onclick="editWishlistItem('${item.id}')"><i class='bx bx-edit'></i></button>
                            <button class="btn secondary-btn" onclick="deleteWishlistItem('${item.id}')"><i class='bx bx-trash'></i></button>
                            <button class="btn success-btn" onclick="triggerPurchase('${item.id}')"><i class='bx bx-check-double'></i> Bought</button>
                        </div>
                    </div>
                </div>
            `;
        });

       
        let estCost = 0; wishlist.forEach(i => estCost += i.expectedPrice);
        document.getElementById('statItems').textContent = wishlist.length;
        document.getElementById('statEstCost').textContent = `₹${estCost.toLocaleString()}`;
        document.getElementById('statPurchased').textContent = purchases.length + mods.length;

        
        let totalBudget = Number(localStorage.getItem('soulride_budget')) || 50000;
        let spentBudget = 0;
        purchases.forEach(p => spentBudget += p.cost);
        mods.forEach(m => spentBudget += m.cost);
        maintenance.forEach(m => spentBudget += (Number(m.cost) || 0)); 

        let remaining = totalBudget - spentBudget;
        let budgetPct = Math.min((spentBudget / totalBudget) * 100, 100);

        document.getElementById('totalBudget').textContent = `₹${totalBudget.toLocaleString()}`;
        document.getElementById('spentBudget').textContent = `₹${spentBudget.toLocaleString()}`;
        document.getElementById('remainingBudget').textContent = `₹${remaining.toLocaleString()}`;
        document.getElementById('budgetProgressBar').style.width = `${budgetPct}%`;

       
        if (remaining < 0) {
            document.getElementById('remainingBudget').style.color = 'var(--accent-red)';
            document.getElementById('budgetProgressBar').style.background = 'var(--accent-red)';
        } else {
            document.getElementById('remainingBudget').style.color = '#2ecc71';
            document.getElementById('budgetProgressBar').style.background = 'linear-gradient(90deg, #ff4d5a, #e63946)';
        }

        
        if (buildVehicleSelect) {
            const targetVehicle = buildVehicleSelect.value;
            
            
            const plannedForVehicle = wishlist.filter(i => i.vehicle === targetVehicle);
            const boughtAccForVehicle = purchases.filter(p => p.vehicle === targetVehicle);
            const installedModsForVehicle = mods.filter(m => m.vehicle === targetVehicle);
            
            const totalBought = boughtAccForVehicle.length + installedModsForVehicle.length;
            const totalPlanned = plannedForVehicle.length + totalBought;

            let buildPct = totalPlanned === 0 ? 0 : Math.round((totalBought / totalPlanned) * 100);

            document.getElementById('buildPercentage').textContent = `${buildPct}%`;
            document.getElementById('buildProgressBar').style.width = `${buildPct}%`;

           
            const checklistContainer = document.getElementById('buildChecklist');
            let checklistHTML = '';
            
            [...boughtAccForVehicle, ...installedModsForVehicle].slice(0, 4).forEach(item => {
                checklistHTML += `<span style="color:var(--text-primary)"><i class='bx bx-check text-green'></i> ${item.name}</span>`;
            });
            
            plannedForVehicle.slice(0, 4).forEach(item => {
                checklistHTML += `<span><i class='bx bx-circle'></i> ${item.name}</span>`;
            });

            checklistContainer.innerHTML = checklistHTML || "<span>No build plan active.</span>";
        }
    };

    // --- 8. Set Budget Listener ---
    document.querySelector('.budget-header .icon-btn').addEventListener('click', () => {
        const newBudget = prompt("Enter your total vehicle budget (₹):", localStorage.getItem('soulride_budget') || "50000");
        if (newBudget && !isNaN(newBudget)) {
            localStorage.setItem('soulride_budget', newBudget);
            renderDashboard();
        }
    });

    // Re-render when build vehicle dropdown changes
    if(buildVehicleSelect) {
        buildVehicleSelect.addEventListener('change', renderDashboard);
    }

    // Attach filter listeners
    searchInput.addEventListener('input', renderDashboard);
    filterCategory.addEventListener('change', renderDashboard);
    filterVehicle.addEventListener('change', renderDashboard);
    filterPriority.addEventListener('change', renderDashboard);

    renderDashboard();
});

// --- Global Functions for Inline Buttons ---
window.deleteWishlistItem = function(id) {
    if(confirm("Remove this item from your Wishlist?")) {
        let list = JSON.parse(localStorage.getItem('soulride_wishlist')) || [];
        list = list.filter(i => i.id !== id);
        localStorage.setItem('soulride_wishlist', JSON.stringify(list));
        window.renderDashboard(); 
    }
};

window.editWishlistItem = function(id) {
    const list = JSON.parse(localStorage.getItem('soulride_wishlist')) || [];
    const item = list.find(i => i.id === id);
    
    if (item) {
        editingItemId = id; 
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemPrice').value = item.expectedPrice;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemVehicle').value = item.vehicle;
        document.getElementById('itemPriority').value = item.priority;
        document.getElementById('itemLink').value = item.link || '';
        document.getElementById('itemNotes').value = item.notes || '';
        
        document.getElementById('wishlistModal').classList.add('active');
    }
};

window.triggerPurchase = function(id) {
    const list = JSON.parse(localStorage.getItem('soulride_wishlist')) || [];
    const item = list.find(i => i.id === id);
    
    if (item) {
        purchasingItemId = id;
        document.getElementById('expectedPriceDisplay').value = `₹${item.expectedPrice.toLocaleString()} (Expected)`;
        document.getElementById('actualPrice').value = item.expectedPrice; 
        document.getElementById('purchaseModal').classList.add('active');
    }
};