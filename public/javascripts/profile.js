

// Function to set the active icon
function setActiveIcon(selectedIcon) {
    const icons = document.querySelectorAll('.icon-section i');
    icons.forEach(icon => icon.classList.remove('active'));
    selectedIcon.classList.add('active');
}



// Load content for the default (posts) grid when the page loads
window.onload = function () {
    loadContent('posts');
    setActiveIcon(document.getElementById('posts-icon'));
};

// Preview the uploaded image as the profile picture
function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('profile-pic').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Toggle visibility of the settings card
document.getElementById('settings-icon').addEventListener('click', function () {
    const settingsCard = document.getElementById('settings-card');
    settingsCard.classList.toggle('active-card');
    settingsCard.classList.toggle('hidden');
});


// Close icon functionality (redirect to profile page)
document.getElementById('close-icon').addEventListener('click', function () {
    window.location.href = '/profile';
});

// Logout button functionality (redirect to logout route)
document.getElementById('logout-btn').addEventListener('click', function () {
    window.location.href = '/logout';
});

// Redirect to upload page when "no posts" section is clicked
document.getElementById('no-posts').addEventListener('click', function () {
    window.location.href = '/upload-articles';
});

document.querySelector('.editprofile').addEventListener('click', () => {
    // Inject the HTML into the profile-card-container
    const profileCardHTML = `
        <div class="profile-card">
            <!-- Close icon -->
            <div class="close-icon">
                <i class="fas fa-times" onclick="closeEditCard()"></i>
            </div>
            <form action="/updateprofile" method="post" enctype="multipart/form-data">
                <div class="profile-image">
                    <img src="profile.jpg" alt="Profile Picture" id="profile-pic">
                    <!-- Hidden input wrapped inside a label -->
                    <label for="file-upload" class="edit-icon-label">
                        <i class="fas fa-edit edit-icon"></i>
                    </label>
                    <input id="file-upload" name="file" type="file" style="display: none;" onchange="previewImage(this)">
                </div>
                <div class="profile-details">
                    <div class="info-item">
                        <label for="username">Username</label>
                        <input type="text" name="username" placeholder="Enter your Username">
                    </div>
                    <div class="info-item">
                        <label for="password">Password</label>
                        <input type="password" name="password" placeholder="Enter your password">
                    </div>
                    <div class="info-item">
                        <label for="bio">Bio</label>
                        <textarea name="bio" placeholder="Enter your bio"></textarea>
                    </div>
                </div>
                <div class="edit-button">
                    <button type="submit">Save</button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('profile-card-container').innerHTML = profileCardHTML;
});

function closeEditCard() {
    // Clear the profile card HTML to close it
    document.getElementById('profile-card-container').innerHTML = '';
}

// Image preview function (optional)
function previewImage(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('profile-pic').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}
