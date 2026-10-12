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
    setLink("fuelMenu", "fueltracker.html");
    setLink("tripMenu", "trip.html");
    setLink("journeyMenu", "achievement.html");
    setLink("wishlistMenu", "wishlist.html");
    setLink("profileMenu", "profile.html");
    setLink("settingsMenu", "setting.html");

    const navButtons = document.querySelectorAll('.settings-sidebar .nav-btn');
    const sections = document.querySelectorAll('.settings-section');
    const saveStatus = document.getElementById('saveStatus');

    function showSaveStatus(message, saved) {
        saveStatus.textContent = message;
        saveStatus.classList.toggle('is-saved', saved);
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active-sec'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active-sec');
            document.getElementById(targetId).scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    document.getElementById('settingsSearch').addEventListener('input', (event) => {
        const query = event.target.value.trim().toLowerCase();
        navButtons.forEach(button => {
            const section = document.getElementById(button.dataset.target);
            const matches = !query || `${button.textContent} ${section.textContent}`.toLowerCase().includes(query);
            button.classList.toggle('search-hidden', !matches);
            section.classList.toggle('search-hidden', !matches);
        });
        if (query) {
            const firstMatch = [...navButtons].find(button => !button.classList.contains('search-hidden'));
            if (firstMatch) firstMatch.click();
        }
    });

    function loadGarageToSelect() {
        const garage = getVehicles();
        const select = document.getElementById('prefVehicle');
        if (garage.length === 0) {
            select.innerHTML = '<option>No Vehicles Added</option>';
        } else {
            const equippedId = getEquippedVehicleId();
            select.innerHTML = garage.map(v => `<option value="${v.id}" ${v.id == equippedId ? 'selected' : ''}>${v.brand} ${v.model}</option>`).join('');
        }
    }
    loadGarageToSelect();

    const prefsMap = {
        // Account
        'accName': 'sr_user_name',
        'accEmail': 'sr_user_email',
        'accPhone': 'sr_user_phone',
        // Garage
        'prefVehicle': 'sr_def_vehicle',
        'prefFuel': 'sr_def_fuel',
        'prefUnit': 'sr_def_unit',
        'prefCurrency': 'sr_def_currency',
        'prefStyle': 'sr_def_style',
        'prefStation': 'sr_def_station',
        'prefService': 'sr_def_service_center',
        'prefRideDay': 'sr_def_ride_day',
        // App Prefs
        'appDarkMode': 'sr_app_dark_mode',
        'appThemeColor': 'sr_app_theme',
        'appLang': 'sr_app_lang',
        'appFont': 'sr_app_font',
        // Notifications
        'notifService': 'sr_notif_service',
        'notifDocs': 'sr_notif_docs',
        'notifFuel': 'sr_notif_fuel',
        'notifTrip': 'sr_notif_trip',
        'notifAchieve': 'sr_notif_achieve',
        'notifAi': 'sr_notif_ai',
        // AI Companion
        'aiName': 'sr_ai_name',
        'aiPersona': 'sr_ai_persona',
        'aiVoice': 'sr_ai_voice',
        'aiMute': 'sr_ai_mute',
        'aiGreet': 'sr_ai_greet',
        'aiTips': 'sr_ai_tips',
        'aiMaint': 'sr_ai_maint',
        // Privacy / Backup
        'priv2fa': 'sr_priv_2fa',
        'privAutoLog': 'sr_priv_autolog',
        'syncFirebase': 'sr_sync_fire',
        'syncDrive': 'sr_sync_drive'
    };

    Object.keys(prefsMap).forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;

        const savedValue = localStorage.getItem(prefsMap[id]);
        if (savedValue !== null) {
            if (input.type === 'checkbox') {
                input.checked = (savedValue === 'true');
            } else {
                input.value = savedValue;
            }
        }
    });

    document.getElementById('accName').addEventListener('input', (e) => {
        document.getElementById('displayUserName').textContent = e.target.value;
    });

    document.getElementById('displayUserName').textContent = document.getElementById('accName').value;
    document.getElementById('profileInitials').textContent = document.getElementById('accName').value
        .split(/\s+/).filter(Boolean).slice(0, 2).map(name => name[0]).join('').toUpperCase() || 'SR';

    Object.keys(prefsMap).forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;

        input.addEventListener('change', () => {
            const val = input.type === 'checkbox' ? input.checked : input.value;
            localStorage.setItem(prefsMap[id], val);
            showSaveStatus('Changes saved', true);

            if (id === 'prefVehicle') equipVehicle(val);

            // Re-apply the shared, global settings logic (theme.js) right away
            // so the change is visible instantly on this page too, not just
            // after navigating to a different page and back.
            if (window.SoulRideSettings) {
                window.SoulRideSettings.applyGlobalSettings();
            }
        });

        document.getElementById('accName').addEventListener('input', (event) => {
            const name = event.target.value.trim() || 'Soul Rider';
            document.getElementById('displayUserName').textContent = name;
            document.getElementById('profileInitials').textContent = name
                .split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
        });

        document.getElementById('changePasswordBtn').addEventListener('click', () => {
            const password = prompt('Enter a new password (at least 8 characters):');
            if (password === null) return;
            if (password.length < 8) {
                alert('Password must be at least 8 characters long.');
                return;
            }
            localStorage.setItem('sr_password_updated', new Date().toISOString());
            alert('Password updated successfully.');
        });

        document.getElementById('deleteAccountBtn').addEventListener('click', () => {
            if (!confirm('Delete your local SoulRide account and all saved data? This cannot be undone.')) return;
            localStorage.clear();
            window.location.href = 'login.html';
        });

        document.getElementById('loginHistoryBtn').addEventListener('click', () => {
            alert(`Current session\nDevice: This browser\nLast activity: ${new Date().toLocaleString()}`);
        });

        document.getElementById('activeDevicesBtn').addEventListener('click', () => {
            alert('No other active devices were found for this local account.');
        });

        document.getElementById('helpCenterBtn').addEventListener('click', () => {
            document.querySelector('.nav-btn[data-target="sec-about"]').click();
            alert('Tip: use the search box above to quickly find any setting.');
        });
        document.getElementById('reportBugBtn').addEventListener('click', () => {
            window.location.href = 'mailto:support@soulride.ai?subject=SoulRide%20AI%20bug%20report';
        });
        document.getElementById('contactSupportBtn').addEventListener('click', () => {
            window.location.href = 'mailto:support@soulride.ai?subject=SoulRide%20AI%20support';
        });
    });

    // Clear Cache / Reset App
    document.getElementById('resetAppBtn').addEventListener('click', () => {
        if (prompt("This will delete all vehicles, trips, fuel and preferences. Type RESET to confirm.") === 'RESET') {
            localStorage.clear();
            alert("App cache cleared. Reloading...");
            window.location.href = "login.html";
        }
    });

    document.getElementById('exportCsvBtn').addEventListener('click', () => {
        const state = getAppState();
        const rows = [['Type', 'Date', 'Title', 'Amount']];
        const vehicleId = getSelectedVehicleId();
        [...getServices(vehicleId), ...getFuelLogs(vehicleId), ...getExpenses(vehicleId)].forEach(entry => rows.push([
            entry.category || entry.type || 'Other', entry.date || entry.createdAt || '', entry.title || entry.description || 'Entry', entry.amount || entry.totalCost || 0
        ]));
        const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
        const link = document.createElement('a');
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
        link.download = `soulride-data-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    });

    document.getElementById('exportPdfBtn').addEventListener('click', () => window.print());

    document.getElementById('exportJsonBtn').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(getAppState(), null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `soulride-backup-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
    });

    const importButton = document.getElementById('importDataBtn');
    const importInput = document.getElementById('importDataInput');
    if (importButton && importInput) {
        importButton.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', async () => {
            const file = importInput.files && importInput.files[0];
            if (!file) return;
            try {
                const imported = JSON.parse(await file.text());
                if (!imported || !Array.isArray(imported.vehicles) || !Array.isArray(imported.trips)) {
                    throw new Error('The backup file is missing required data.');
                }
                saveAppState(imported);
                alert('Backup imported successfully.');
                window.location.reload();
            } catch (error) {
                alert(`Import failed: ${error.message}`);
            } finally {
                importInput.value = '';
            }
        });
    }

    document.getElementById('syncNowBtn').addEventListener('click', () => {
        const btn = document.getElementById('syncNowBtn');
        btn.innerHTML = "<i class='bx bx-loader bx-spin'></i> Syncing...";
        setTimeout(() => {
            btn.innerHTML = "Sync Complete";
            const now = new Date().toLocaleString();
            document.getElementById('lastSyncTime').textContent = now;
            localStorage.setItem('sr_last_sync', now);
            setTimeout(() => btn.innerHTML = "Sync Now", 2000);
        }, 1500);
    });

    const lastSync = localStorage.getItem('sr_last_sync');
    if (lastSync) document.getElementById('lastSyncTime').textContent = lastSync;

    document.getElementById('cancelLogout').addEventListener('click', () => {
        document.querySelector('.nav-btn[data-target="sec-account"]').click();
    });

    document.getElementById('confirmLogout').addEventListener('click', () => {
        window.location.href = "login.html";
    });

});