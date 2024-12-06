document.addEventListener('DOMContentLoaded', function () {
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const closeModal = document.querySelector('.close');
    const navItems = document.querySelectorAll('.nav-item');
    let activeItem = null;

    // Helper function to set the active page icon
    function setActiveIcon(items) {
        items.forEach(item => {
            const page = item.getAttribute('data-page');
            if (page === currentPage) {
                item.classList.add('active');
                activeItem = item; // Store the active item
            } else {
                item.classList.remove('active');
            }
        });
    }

    // Show the upload modal and handle the "+" button state
    uploadBtn.addEventListener('click', function () {
        // Open the modal
        uploadModal.style.display = 'block';
    
        // Save and deactivate the current active page icon
        if (activeItem) {
            activeItem.classList.remove('active');
        }
    
        // Make the "+" icon bright (active)
        uploadBtn.classList.add('active');
    });
    
    // Close the upload modal and restore the active page icon
    closeModal.addEventListener('click', function () {
        // Hide the modal
        uploadModal.style.display = 'none';
    
        // Deactivate the "+" button
        uploadBtn.classList.remove('active');
    
        // Restore the previously active icon
        if (activeItem) {
            activeItem.classList.add('active');
        }
    });
    
    // Click anywhere outside the modal to close it (optional)
    window.addEventListener('click', function (event) {
        if (event.target === uploadModal) {
            uploadModal.style.display = 'none';
            uploadBtn.classList.remove('active');
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }
    });
    uploadBtn.addEventListener('click', function () {
        uploadModal.style.display = 'block'; // Show the modal
        uploadBtn.classList.add('active'); // Highlight the "+" button
    });
    
    closeModal.addEventListener('click', function () {
        uploadModal.style.display = 'none'; // Hide the modal
        uploadBtn.classList.remove('active'); // Remove the "+" button highlight
    });
        

    // Initial set up to highlight the current page icon
    setActiveIcon(navItems);
});
