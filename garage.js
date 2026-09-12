
// Updated: 2026-09-09
const garageGrid = document.getElementById("garageGrid");
let vehicles = JSON.parse(localStorage.getItem("vehicles")) || [];

displayVehicles();

function displayVehicles() {
    garageGrid.innerHTML = "";

    if (vehicles.length === 0) {
        garageGrid.innerHTML = `
            <div class="empty" style="text-align: center; grid-column: 1 / -1; padding: 40px;">
                <h2>No Vehicles Added</h2>
                <p style="color: #adb5bd;">Add your first vehicle to get started.</p>
            </div>
        `;
        return;
    }

    vehicles.forEach(vehicle => {
        // UPDATED: Structured to match garage.css exactly
        garageGrid.innerHTML += `
        <div class="vehicle-card ${getEquippedVehicleId() == vehicle.id ? 'equipped' : ''}" id="card-${vehicle.id}">
            
            <img src="${vehicle.image || 'images/default-vehicle.jpg'}" class="vehicle-image" alt="${vehicle.brand}">
            
            <div class="vehicle-info">
                <h2>${vehicle.brand} ${vehicle.model}</h2>
                <p><b>Nickname:</b> ${vehicle.nickname}</p>
                <p><b>Year:</b> ${vehicle.year}</p>
                <p><b>Fuel:</b> ${vehicle.fuel}</p>
                <p><b>Color:</b> ${vehicle.color}</p>
                <p><b>Odometer:</b> ${vehicle.odometer} km</p>
            </div>
            
            <div class="vehicle-actions">
                <button onclick="viewVehicle('${vehicle.id}')">View</button>
                <button onclick="equipVehicleFromGarage('${vehicle.id}')">${getEquippedVehicleId() == vehicle.id ? 'Equipped' : 'Equip'}</button>
                <button onclick="editVehicle('${vehicle.id}')">Edit</button>
                <button onclick="deleteVehicle('${vehicle.id}')">Delete</button>
            </div>

        </div>
        `;
    });
}

function deleteVehicle(id) {
    if(confirm("Are you sure you want to delete this vehicle?")) {
        // Filter out the vehicle that matches the ID
        vehicles = vehicles.filter(vehicle => vehicle.id !== id.toString());
        
        // Save the updated array back to localStorage
        saveVehicles(vehicles);
        
        // Refresh the grid
        displayVehicles();
    }
}

function editVehicle(id) {
    localStorage.setItem("editVehicleId", id);
    window.location.href = "add-vehicle.html";
}

function viewVehicle(id) {
    equipVehicle(id);
    window.location.href = "vehicle-details.html";
}

function equipVehicleFromGarage(id) {
    equipVehicle(id);
    displayVehicles();
}

const addNewVehicleBtn = document.getElementById("addNewVehicleBtn");
if(addNewVehicleBtn){
    addNewVehicleBtn.onclick = function() {
        window.location.href = "add-vehicle.html";
    }
}