/*
  SoulRide AI — Global Settings Loader
  -------------------------------------------------------------
  This file is already linked on every page via:
      <script src="theme.js"></script>
  So this logic now runs everywhere automatically. No other HTML
  changes are needed.
*/
(function () {
    // Updated: 2026-09-09
    const root = document.documentElement;

    function isLightMode() {
        return localStorage.getItem('sr_app_dark_mode') === 'false';
    }

    // Set the root state immediately to reduce dark-mode flash on navigation.
    root.classList.toggle('light-mode', isLightMode());

    function applyGlobalSettings() {
        const theme = localStorage.getItem('sr_app_theme') || '';
        const font = localStorage.getItem('sr_app_font') || '';
        const lightMode = isLightMode();

        root.classList.toggle('light-mode', lightMode);

        // 1. Theme color
        root.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange');
        if (theme.includes('Blue')) root.classList.add('theme-blue');
        if (theme.includes('Green')) root.classList.add('theme-green');
        if (theme.includes('Purple')) root.classList.add('theme-purple');
        if (theme.includes('Orange')) root.classList.add('theme-orange');

        // 2. Font size
        root.classList.remove('font-small', 'font-large');
        if (font === 'Small') root.classList.add('font-small');
        if (font === 'Large') root.classList.add('font-large');

        // 3. Keep body classes for existing page-specific selectors.
        if (document.body) {
            document.body.classList.toggle('light-mode', lightMode);
            document.body.classList.toggle('theme-blue', theme.includes('Blue'));
            document.body.classList.toggle('theme-green', theme.includes('Green'));
            document.body.classList.toggle('theme-purple', theme.includes('Purple'));
            document.body.classList.toggle('theme-orange', theme.includes('Orange'));
            document.body.classList.toggle('font-small', font === 'Small');
            document.body.classList.toggle('font-large', font === 'Large');
            renderEquippedVehicle();
        }
    }

    function renderEquippedVehicle() {
        const existing = document.getElementById('equippedVehicleIndicator');
        const page = (window.location.pathname || '').toLowerCase();
        const isAuthPage = page.includes('login') || page.includes('landing') || page.endsWith('index.html');
        const vehicle = typeof window.getEquippedVehicle === 'function' ? window.getEquippedVehicle() : null;

        if (existing) existing.remove();
        if (!vehicle || isAuthPage) return;

        const indicator = document.createElement('div');
        indicator.id = 'equippedVehicleIndicator';
        indicator.className = 'equipped-vehicle-indicator';
        indicator.innerHTML = `<i class='bx bx-car'></i><span>Equipped: <strong></strong></span>`;
        indicator.querySelector('strong').textContent = `${vehicle.brand} ${vehicle.model}`;
        document.body.appendChild(indicator);
    }

    // theme.js is loaded via a plain <script> in <head>, before <body>
    // exists, so wait for DOMContentLoaded.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyGlobalSettings);
    } else {
        applyGlobalSettings();
    }

    // Exposed so settings.js can re-apply instantly on change.
    window.SoulRideSettings = { applyGlobalSettings };
    window.addEventListener('soulride:vehicle-changed', renderEquippedVehicle);
})();