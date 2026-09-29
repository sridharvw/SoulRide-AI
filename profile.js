
document.addEventListener('DOMContentLoaded', () => {
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userHandleDisplay = document.querySelector('.user-handle');
    const savedUserData = localStorage.getItem('soulride_user');
    if (!savedUserData) {
        window.location.href = 'login.html';
        return;
    }

    let user;
    try {
        user = JSON.parse(savedUserData);
    } catch {
        window.location.href = 'login.html';
        return;
    }

    const form = document.getElementById('profileForm');
    const nameInput = document.getElementById('profileName');
    const photoInput = document.getElementById('photoInput');
    const photo = document.getElementById('profilePhoto');
    const fallback = document.querySelector('.avatar-fallback');
    const removePhotoButton = document.getElementById('removePhotoBtn');
    const status = document.getElementById('saveStatus');

    function renderUser() {
        const name = user.username || '';
        userNameDisplay.textContent = name || 'Rider';
        userHandleDisplay.textContent = `@${name.toLowerCase().trim().replace(/\s+/g, '_') || 'rider'}`;
        nameInput.value = name;
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('profilePhone').value = user.phone || '';
        document.getElementById('profileBloodGroup').value = user.bloodGroup || '';
        document.getElementById('profileEmergencyContact').value = user.emergencyContact || '';
        document.getElementById('profileBio').value = user.bio || '';

        if (user.profilePicture) {
            photo.src = user.profilePicture;
            photo.hidden = false;
            fallback.hidden = true;
            removePhotoButton.hidden = false;
        } else {
            photo.removeAttribute('src');
            photo.hidden = true;
            fallback.hidden = false;
            removePhotoButton.hidden = true;
        }
    }

    renderUser();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        user.username = nameInput.value.trim();
        user.email = document.getElementById('profileEmail').value.trim();
        user.phone = document.getElementById('profilePhone').value.trim();
        user.bloodGroup = document.getElementById('profileBloodGroup').value.trim();
        user.emergencyContact = document.getElementById('profileEmergencyContact').value.trim();
        user.bio = document.getElementById('profileBio').value.trim();

        try {
            localStorage.setItem('soulride_user', JSON.stringify(user));
            renderUser();
            status.textContent = 'Changes saved.';
        } catch {
            status.textContent = 'Could not save. Remove the photo and try again.';
        }
    });

    document.getElementById('choosePhotoBtn').addEventListener('click', () => photoInput.click());

    photoInput.addEventListener('change', () => {
        const file = photoInput.files && photoInput.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            status.textContent = 'Choose an image file.';
            photoInput.value = '';
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            status.textContent = 'Choose an image smaller than 10 MB.';
            photoInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            const image = new Image();
            image.addEventListener('load', () => {
                const canvas = document.createElement('canvas');
                const scale = Math.min(1, 512 / Math.max(image.width, image.height));
                canvas.width = Math.round(image.width * scale);
                canvas.height = Math.round(image.height * scale);
                canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
                user.profilePicture = canvas.toDataURL('image/jpeg', 0.82);

                try {
                    localStorage.setItem('soulride_user', JSON.stringify(user));
                    renderUser();
                    status.textContent = 'Profile photo saved.';
                } catch {
                    delete user.profilePicture;
                    status.textContent = 'Could not save this photo. Try a smaller image.';
                }
                photoInput.value = '';
            });
            image.src = reader.result;
        });
        reader.addEventListener('error', () => {
            status.textContent = 'Could not read that image. Try another one.';
            photoInput.value = '';
        });
        reader.readAsDataURL(file);
    });

    removePhotoButton.addEventListener('click', () => {
        delete user.profilePicture;
        try {
            localStorage.setItem('soulride_user', JSON.stringify(user));
            renderUser();
            status.textContent = 'Profile photo removed.';
        } catch {
            status.textContent = 'Could not update your profile.';
        }
    });
});