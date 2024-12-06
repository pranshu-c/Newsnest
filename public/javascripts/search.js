document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function () {
        // Remove 'active' class from all tabs
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        // Add 'active' class to the clicked tab
        this.classList.add('active');

        // Hide all sections
        document.querySelectorAll('.section').forEach(section => section.style.display = 'none');

        // Show the relevant section
        const sectionId = this.getAttribute('data-tab') + '-section';
        const sectionToShow = document.getElementById(sectionId);

        if (sectionToShow) {
            sectionToShow.style.display = 'block';
        }

        // Special case: Show 'Top' section by default on page load or if it's clicked
        if (this.getAttribute('data-tab') === 'top') {
            document.getElementById('accounts-section').style.display = 'block';
            document.getElementById('top-videos-section').style.display = 'block';
        }
    });
});

// Show 'Top' section by default on page load
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('accounts-section').style.display = 'block';
});

// Redirect to homepage when clicking the back arrow
document.getElementById('back-arrow').addEventListener('click', function () {
window.location.href = '/home';  // Adjust URL as necessary
});


//////////////////////////////////////////////////////
