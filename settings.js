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
    setLink("tripMenu", "trip.html");
    setLink("journeyMenu", "achivement.html");
    setLink("wishlistMenu", "wishlist.html");
    setLink("profileMenu", "profile.html");
    setLink("settingsMenu", "setting.html");

    const navButtons = document.querySelectorAll('.settings-sidebar .nav-btn');
    const sections = document.querySelectorAll('.settings-section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active-sec'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active-sec');
        });
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

    Object.keys(prefsMap).forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;

        input.addEventListener('change', () => {
            const val = input.type === 'checkbox' ? input.checked : input.value;
            localStorage.setItem(prefsMap[id], val);

            if (id === 'prefVehicle') equipVehicle(val);

            // Re-apply the shared, global settings logic (theme.js) right away
            // so the change is visible instantly on this page too, not just
            // after navigating to a different page and back.
            if (window.SoulRideSettings) {
                window.SoulRideSettings.applyGlobalSettings();
            }
        });
    });

    // Clear Cache / Reset App
    document.getElementById('resetAppBtn').addEventListener('click', () => {
        if (confirm("WARNING: This will delete ALL data (Vehicles, Trips, Fuel). This cannot be undone. Type 'RESET' to confirm.")) {
            localStorage.clear();
            alert("App cache cleared. Reloading...");
            window.location.href = "login.html";
        }
    });

    document.getElementById('exportCsvBtn').addEventListener('click', () => {
        alert("Preparing CSV export... Check your downloads folder in a moment.");
    });

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