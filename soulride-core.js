
// Updated: 2026-09-09
// Central data hub. Pages read and write through this API instead of using
// separate localStorage keys for the same records.
(function () {
    const STORAGE_KEY = 'soulride_state';

    function readArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function readJson(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value === null ? fallback : value;
        } catch (error) {
            console.warn(`Could not read ${key}.`, error);
            return fallback;
        }
    }

    function vehicleIdForName(vehicleName, vehicles) {
        const match = vehicles.find(vehicle => `${vehicle.brand} ${vehicle.model}` === vehicleName);
        return match ? match.id : vehicleName || null;
    }

    function migrateState() {
        const storedState = readJson(STORAGE_KEY, null);
        const vehicles = readArray(storedState && storedState.vehicles).length
            ? readArray(storedState.vehicles)
            : readArray(readJson('vehicles', []));
        const legacyServices = readArray(readJson('serviceHistory', []));
        const legacyFuelLogs = readArray(readJson('soulride_fuel', []));
        const state = storedState || {};

        const services = readArray(state.services).length
            ? readArray(state.services)
            : legacyServices.map(service => ({
                ...service,
                amount: Number(service.amount ?? service.cost) || 0,
                vehicleId: service.vehicleId || null
            }));

        const fuelLogsSource = readArray(state.fuelLogs).length
            ? readArray(state.fuelLogs)
            : legacyFuelLogs;
        const fuelLogs = fuelLogsSource.map(log => ({
                ...log,
                vehicleId: log.vehicleId || vehicleIdForName(log.vehicle, vehicles),
                totalCost: Number(log.totalCost) || 0
            }));

        const migratedState = {
            vehicles,
            services,
            fuelLogs,
            expenses: readArray(state.expenses),
            notifications: readArray(state.notifications),
            documents: readArray(state.documents),
            trips: readArray(state.trips).length ? readArray(state.trips) : readArray(readJson('soulride_trips', []))
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedState));
        return migratedState;
    }

    function getAppState() {
        return migrateState();
    }

    function saveAppState(newState) {
        const normalizedState = {
            vehicles: readArray(newState.vehicles),
            services: readArray(newState.services),
            fuelLogs: readArray(newState.fuelLogs),
            expenses: readArray(newState.expenses),
            notifications: readArray(newState.notifications),
            documents: readArray(newState.documents),
            trips: readArray(newState.trips)
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedState));
        window.dispatchEvent(new CustomEvent('soulride:data-changed'));
    }

    function getSelectedVehicleId() {
        return getEquippedVehicleId();
    }

    function getVehicles() {
        const state = getAppState();
        const localVehicles = readArray(readJson('vehicles', []));
        return state.vehicles.length >= localVehicles.length ? state.vehicles : localVehicles;
    }

    function getEquippedVehicleId() {
        const vehicles = getVehicles();
        const storedId = localStorage.getItem('equippedVehicleId') || localStorage.getItem('viewVehicleId');
        const storedVehicle = vehicles.find(vehicle => vehicle.id == storedId);
        if (storedVehicle) return storedVehicle.id;
        return vehicles[0] ? vehicles[0].id : null;
    }

    function getEquippedVehicle() {
        const equippedId = getEquippedVehicleId();
        return getVehicles().find(vehicle => vehicle.id == equippedId) || null;
    }

    function equipVehicle(vehicleId) {
        const vehicle = getVehicles().find(item => item.id == vehicleId);
        if (!vehicle) return null;
        localStorage.setItem('equippedVehicleId', vehicle.id);
        localStorage.setItem('viewVehicleId', vehicle.id);
        window.dispatchEvent(new CustomEvent('soulride:vehicle-changed'));
        return vehicle;
    }

    function saveVehicles(vehicles) {
        const state = getAppState();
        state.vehicles = readArray(vehicles);
        localStorage.setItem('vehicles', JSON.stringify(state.vehicles));
        saveAppState(state);
    }

    function matchesVehicle(record, vehicleId) {
        return !vehicleId || !record.vehicleId || record.vehicleId == vehicleId;
    }

    function addService(service) {
        const state = getAppState();
        const record = {
            ...service,
            id: service.id || `service_${Date.now()}`,
            amount: Number(service.amount ?? service.cost) || 0,
            cost: Number(service.cost ?? service.amount) || 0,
            createdAt: service.createdAt || new Date().toISOString()
        };
        const index = state.services.findIndex(item => item.id === record.id);
        if (index === -1) state.services.push(record);
        else state.services[index] = record;
        state.notifications.unshift({
            id: `notification_${Date.now()}`,
            type: 'maintenance',
            title: `Service Logged: ${record.category || 'Maintenance'}`,
            desc: `Amounting to ₹${record.amount}`,
            time: 'Today',
            read: false
        });
        saveAppState(state);
        return record;
    }

    function deleteService(serviceId) {
        const state = getAppState();
        state.services = state.services.filter(service => service.id !== serviceId);
        saveAppState(state);
    }

    function getServices(vehicleId) {
        return getAppState().services.filter(service => matchesVehicle(service, vehicleId));
    }

    function addFuelLog(fuelLog) {
        const state = getAppState();
        const record = {
            ...fuelLog,
            id: fuelLog.id || `fuel_${Date.now()}`,
            totalCost: Number(fuelLog.totalCost) || 0,
            createdAt: fuelLog.createdAt || new Date().toISOString()
        };
        const index = state.fuelLogs.findIndex(item => item.id === record.id);
        if (index === -1) state.fuelLogs.push(record);
        else state.fuelLogs[index] = record;
        saveAppState(state);
        return record;
    }

    function getFuelLogs(vehicleId) {
        return getAppState().fuelLogs
            .map(log => ({
                ...log,
                vehicleId: log.vehicleId || vehicleIdForName(log.vehicle, getVehicles()),
                totalCost: Number(log.totalCost) || 0
            }))
            .filter(log => matchesVehicle(log, vehicleId));
    }

    function deleteFuelLog(fuelLogId) {
        const state = getAppState();
        state.fuelLogs = state.fuelLogs.filter(log => log.id !== fuelLogId);
        saveAppState(state);
    }

    function addExpense(expense) {
        const state = getAppState();
        state.expenses.push({
            id: expense.id || `expense_${Date.now()}`,
            ...expense,
            amount: Number(expense.amount) || 0,
            createdAt: expense.createdAt || new Date().toISOString()
        });
        saveAppState(state);
    }

    function getExpenses(vehicleId) {
        return getAppState().expenses.filter(expense => matchesVehicle(expense, vehicleId));
    }

    function getNextService(vehicleId) {
        const vehicle = getVehicles().find(item => item.id == vehicleId) || {};
        const services = getServices(vehicleId).sort((first, second) => new Date(second.date) - new Date(first.date));
        const fuelLogs = getFuelLogs(vehicleId);
        const latestOdometer = Math.max(
            Number(vehicle.odometer) || 0,
            ...services.map(service => Number(service.odometer) || 0),
            ...fuelLogs.map(log => Number(log.odometer) || 0)
        );
        const lastOilService = services.find(service => service.category === 'Engine Oil' || service.type === 'Engine Oil');
        const dueOdometer = lastOilService ? Number(lastOilService.odometer || 0) + 5000 : null;
        const remainingKm = dueOdometer === null ? null : dueOdometer - latestOdometer;
        const date = vehicle.nextServiceDate || null;

        return {
            date,
            latestOdometer,
            dueOdometer,
            remainingKm,
            status: remainingKm === null ? (date ? 'scheduled' : 'not-scheduled') : remainingKm <= 0 ? 'overdue' : remainingKm <= 1000 ? 'due-soon' : 'healthy',
            label: remainingKm === null
                ? (date ? `Scheduled ${new Date(date).toLocaleDateString()}` : 'Not scheduled')
                : remainingKm <= 0 ? `Overdue by ${Math.abs(remainingKm).toLocaleString()} km` : `Due in ${remainingKm.toLocaleString()} km`
        };
    }

    function getNotifications(vehicleId) {
        const state = getAppState();
        const notifications = state.notifications.filter(item => !vehicleId || !item.vehicleId || item.vehicleId == vehicleId);
        const nextService = getNextService(vehicleId);
        const vehicle = getVehicles().find(item => item.id == vehicleId);

        if (vehicle && nextService.status !== 'not-scheduled') {
            notifications.unshift({
                id: `service_reminder_${vehicle.id}`,
                vehicleId: vehicle.id,
                type: 'maintenance',
                title: nextService.status === 'overdue' ? 'Service overdue' : 'Next service reminder',
                desc: `${vehicle.brand} ${vehicle.model}: ${nextService.label}.`,
                time: 'Live reminder',
                read: false,
                generated: true
            });
        }

        return notifications.sort((first, second) => Number(first.read) - Number(second.read));
    }

    function markNotificationRead(notificationId) {
        const state = getAppState();
        const notification = state.notifications.find(item => item.id === notificationId);
        if (notification) {
            notification.read = true;
            saveAppState(state);
        }
    }

    function getFinancialEntries(vehicleId) {
        const services = getServices(vehicleId).map(service => ({
            id: service.id,
            date: service.date,
            category: 'Service',
            title: service.category || 'Maintenance Service',
            amount: Number(service.amount ?? service.cost) || 0,
            vehicleId: service.vehicleId,
            source: 'service'
        }));
        const fuel = getFuelLogs(vehicleId).map(log => ({
            id: log.id,
            date: log.date,
            category: 'Fuel',
            title: log.station || 'Fuel Refill',
            amount: Number(log.totalCost) || 0,
            vehicleId: log.vehicleId,
            source: 'fuel'
        }));
        return [...services, ...fuel, ...getExpenses(vehicleId)];
    }

    function getDashboardSummary(vehicleId) {
        const entries = getFinancialEntries(vehicleId);
        return {
            totalSpent: entries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0),
            fuelSpent: entries.filter(entry => entry.category === 'Fuel').reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
            maintenanceSpent: entries.filter(entry => entry.category === 'Service').reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
            latestOdometer: Math.max(0, ...getServices(vehicleId).map(service => Number(service.odometer) || 0), ...getFuelLogs(vehicleId).map(log => Number(log.odometer) || 0)),
            tripCount: getAppState().trips.filter(trip => matchesVehicle(trip, vehicleId)).length,
            totalDistance: getTotalDistance(vehicleId),
            vehicle: getVehicles().find(vehicle => vehicle.id == vehicleId) || null
        };
    }

    function getTotalDistance(vehicleId) {
        return getAppState().trips
            .filter(trip => matchesVehicle(trip, vehicleId))
            .reduce((total, trip) => total + (Number(trip.distance ?? trip.distanceKm) || 0), 0);
    }

    function saveTrips(trips) {
        const state = getAppState();
        state.trips = readArray(trips);
        saveAppState(state);
    }

    window.getAppState = getAppState;
    window.saveAppState = saveAppState;
    window.getSelectedVehicleId = getSelectedVehicleId;
    window.getVehicles = getVehicles;
    window.getEquippedVehicleId = getEquippedVehicleId;
    window.getEquippedVehicle = getEquippedVehicle;
    window.equipVehicle = equipVehicle;
    window.saveVehicles = saveVehicles;
    window.addService = addService;
    window.deleteService = deleteService;
    window.getServices = getServices;
    window.addFuelLog = addFuelLog;
    window.getFuelLogs = getFuelLogs;
    window.deleteFuelLog = deleteFuelLog;
    window.addExpense = addExpense;
    window.getExpenses = getExpenses;
    window.getNextService = getNextService;
    window.getNotifications = getNotifications;
    window.markNotificationRead = markNotificationRead;
    window.getFinancialEntries = getFinancialEntries;
    window.getDashboardSummary = getDashboardSummary;
    window.getTotalDistance = getTotalDistance;
    window.saveTrips = saveTrips;

    migrateState();
})();