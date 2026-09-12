
// Updated: 2026-09-09
document.addEventListener('DOMContentLoaded', () => {

    // 1. Get Elements from the DOM
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userHandleDisplay = document.querySelector('.user-handle');
    const joinDateDisplay = document.querySelector('.join-date'); 
    const userEmailInput = document.querySelector('input[type="email"]'); 
    
    const statNumbers = document.querySelectorAll('.stat h3');

    const savedUserData = localStorage.getItem('soulride_user');
    
    if (savedUserData) {
        const user = JSON.parse(savedUserData);
        
        // Update the display names and email
        if (userNameDisplay) userNameDisplay.textContent = user.username;
        if (userHandleDisplay) userHandleDisplay.textContent = `@${user.username.toLowerCase().replace(/\s+/g, '_')}`;
        
        // Update the Join Date if it exists in the saved data
        if (joinDateDisplay && user.joinDate) {
            joinDateDisplay.textContent = `Joined: ${user.joinDate}`;
        }

        // Find the email input and update its value
        if (userEmailInput) {
            userEmailInput.value = user.email;
        }
    } else {
        // If no user is logged in, redirect them back to login
        window.location.href = 'login.html';
        return; // Stop execution
    }

    // 3. Load Vehicle Data and Update Stats
    const vehicles = getVehicles();
    const vehicleCount = vehicles.length;

    // Update the Stats displays (Ensuring the elements actually exist)
    if (statNumbers.length >= 3) {
        statNumbers[0].textContent = vehicleCount; 
        
        statNumbers[1].textContent = "0"; 
        
        let garageLevel = vehicleCount; 
        
        
        statNumbers[2].textContent = `Lvl ${garageLevel}`; 
    }


    const profileForm = document.getElementById('profileForm');
    
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
          
            
            alert('Profile updated successfully!');
        });
    }
});