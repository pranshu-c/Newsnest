document.addEventListener('DOMContentLoaded', function () {
    // Like Icon Toggle
    const likeIcons = document.querySelectorAll('.like-icon');
    likeIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            this.classList.toggle('clicked');
            if (this.classList.contains('clicked')) {
                this.classList.remove('far'); // Hollow icon class
                this.classList.add('fas'); // Filled icon class
            } else {
                this.classList.remove('fas');
                this.classList.add('far');
            }
        });
    });

    // Bookmark Icon Toggle
    const bookmarkIcons = document.querySelectorAll('.bookmark-icon');
    bookmarkIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            this.classList.toggle('clicked');
            if (this.classList.contains('clicked')) {
                this.classList.remove('far'); // Hollow icon class
                this.classList.add('fas'); // Filled icon class
            } else {
                this.classList.remove('fas');
                this.classList.add('far');
            }
        });
    });
});

