// Animation Elements
const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

// Form Elements
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

// --- 1. SLIDING ANIMATION LOGIC ---
registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});

// --- 2. REGISTRATION LOGIC ---
registerForm.addEventListener('submit', (e) => {
    e.preventDefault(); 

    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    const user = {
        username: username,
        email: email,
        password: password
    };

    localStorage.setItem('soulride_user', JSON.stringify(user));
    registerForm.reset();

    alert('Garage Created successfully! Please log in with your new credentials.');
    container.classList.remove('active'); 
});

// --- 3. LOGIN LOGIC ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); 

    const enteredUsername = document.getElementById('loginUsername').value;
    const enteredPassword = document.getElementById('loginPassword').value;
    const savedUserData = localStorage.getItem('soulride_user');

    if (savedUserData) {
        const savedUser = JSON.parse(savedUserData);

        if (enteredUsername === savedUser.username && enteredPassword === savedUser.password) {
            window.location.href = 'dashboard.html';
        } else {
            alert('Incorrect Username or Password. Please try again.');
        }
    } else {
        alert('No account found. Please create a garage first!');
    }
});

// --- 4. SOCIAL LOGIN SIMULATION LOGIC ---
function simulateSocialLogin(provider, event) {
    event.preventDefault(); 
    
    // Visually show the button was clicked (fades out slightly)
    const clickedIcon = event.currentTarget;
    clickedIcon.style.opacity = '0.5';
    clickedIcon.style.pointerEvents = 'none';
    
    // Simulate a 1.5-second network delay to mimic real OAuth
    setTimeout(() => {
        // Create a mock user profile based on the provider
        const mockUser = {
            username: provider === 'Google' ? 'Google Rider' : 'FB Rider',
            email: `rider@${provider.toLowerCase()}.com`,
            authMethod: provider
        };

        // Save to local storage using the exact same key as normal registration
        // This ensures your dashboard can read the user data seamlessly
        localStorage.setItem('soulride_user', JSON.stringify(mockUser));

        // Redirect to dashboard
        window.location.href = "dashboard.html";
    }, 1500);
}