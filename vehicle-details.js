// Updated: 2026-09-09
document.addEventListener('DOMContentLoaded', () => {
    const vehicle = getEquippedVehicle();
    const vehicles = getVehicles();
    const switcher = document.getElementById('vehicleSwitcher');

    if (!vehicle) {
        document.getElementById('vehicleTitle').textContent = 'No vehicle equipped';
        document.getElementById('vehicleMeta').textContent = 'Add a vehicle from My Garage to begin.';
        switcher.innerHTML = '<option value="">No vehicles available</option>';
        return;
    }

    switcher.innerHTML = vehicles.map(item =>
        `<option value="${item.id}" ${item.id == vehicle.id ? 'selected' : ''}>${escapeHtml(item.brand)} ${escapeHtml(item.model)}</option>`
    ).join('');

    switcher.addEventListener('change', () => {
        if (equipVehicle(switcher.value)) renderDetails();
    });

    renderDetails();

    window.addEventListener('soulride:vehicle-changed', renderDetails);

    function renderDetails() {
        const equipped = getEquippedVehicle();
        if (!equipped) return;

        const vehicleServices = getServices(equipped.id);
        const vehicleFuel = getFuelLogs(equipped.id);
        const entries = getFinancialEntries(equipped.id)
            .sort((first, second) => new Date(second.date) - new Date(first.date));
        const nextService = getNextService(equipped.id);
        const latestOdometer = Math.max(
            Number(equipped.odometer) || 0,
            ...vehicleServices.map(item => Number(item.odometer) || 0),
            ...vehicleFuel.map(item => Number(item.odometer) || 0)
        );
        const totalSpent = entries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        document.getElementById('vehicleTitle').textContent = `${equipped.brand} ${equipped.model}`;
        document.getElementById('vehicleMeta').textContent = [
            equipped.nickname,
            equipped.year,
            equipped.registration,
            equipped.fuelType || equipped.fuel
        ].filter(Boolean).join(' | ');
        document.getElementById('odometerValue').textContent = `${latestOdometer.toLocaleString()} km`;
        document.getElementById('totalSpentValue').textContent = `₹${totalSpent.toLocaleString()}`;
        document.getElementById('serviceCountValue').textContent = vehicleServices.length;
        document.getElementById('fuelCountValue').textContent = vehicleFuel.length;
        document.getElementById('serviceStatusTitle').textContent =
            nextService.status === 'overdue' ? 'Service attention needed' : 'Keep your vehicle in top shape';
        document.getElementById('serviceStatusText').textContent =
            nextService.status === 'not-scheduled'
                ? 'Log your next service to receive a maintenance reminder.'
                : nextService.label;

        const image = document.getElementById('vehicleImage');
        image.innerHTML = equipped.image
            ? `<img src="${equipped.image}" alt="${escapeHtml(equipped.brand)} ${escapeHtml(equipped.model)}">`
            : "<i class='bx bx-car'></i>";

        document.getElementById('vehicleInformation').innerHTML = [
            ['Brand', equipped.brand],
            ['Model', equipped.model],
            ['Type', equipped.type],
            ['Fuel', equipped.fuelType || equipped.fuel],
            ['Year', equipped.year],
            ['Registration', equipped.registration],
            ['Color', equipped.color],
            ['Nickname', equipped.nickname]
        ].filter(item => item[1]).map(item => `<div><dt>${item[0]}</dt><dd>${escapeHtml(String(item[1]))}</dd></div>`).join('');

        const activity = document.getElementById('recentActivity');
        activity.innerHTML = entries.slice(0, 6).map(entry => `
            <div class="activity-row">
                <span class="activity-icon"><i class="bx ${entry.category === 'Fuel' ? 'bx-gas-pump' : 'bx-wrench'}"></i></span>
                <div class="activity-copy"><strong>${escapeHtml(entry.title || entry.category)}</strong><p>${entry.date || 'Date not recorded'} <span>•</span> ${entry.category}</p></div>
                <span class="amount">₹${(Number(entry.amount) || 0).toLocaleString()}</span>
            </div>
        `).join('') || '<p class="empty-state">No records for this vehicle yet.</p>';
    }

    function escapeHtml(value) {
        return value.replace(/[&<>'"]/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
        }[character]));
    }
});
