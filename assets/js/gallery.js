// Function to initialize the gallery
function initializeGallery() {
    const gallery = document.querySelector('.gallery');
    if (!gallery) return;

    fetch('/assets/gallery.json')
        .then(response => response.json())
        .then(imageData => {
            // Populate gallery with thumbnails
            imageData.forEach(item => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery-item';
                const img = document.createElement('img');
                img.src = item.thumbnail;
                img.dataset.source = item.source;
                img.dataset.title = item.title;
                img.dataset.artist = item.artist;
                galleryItem.appendChild(img);
                gallery.appendChild(galleryItem);
            });
            // Wait for all images to load before initializing Masonry
            const images = gallery.querySelectorAll('img');
            const imageLoadPromises = Array.from(images).map(img => {
                return new Promise((resolve, reject) => {
                    if (img.complete) {
                        resolve();
                    } else {
                        img.addEventListener('load', resolve);
                        img.addEventListener('error', reject);
                    }
                });
            });
            Promise.all(imageLoadPromises)
                .then(() => {
                    // Initialize Masonry after all images are loaded
                    const masonry = new Masonry(gallery, {
                        itemSelector: '.gallery-item',
                        columnWidth: 175,
                        gutter: 10,
                        fitWidth: true,
                        transitionDuration: 0
                    });
                })
                .catch(error => {
                    console.error('Error loading images:', error);
                });

            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'overlay';
            const closeBtn = document.createElement('span');
            closeBtn.className = 'close-btn';
            closeBtn.innerHTML = '&times;';
            overlay.appendChild(closeBtn);

            const prevBtn = document.createElement('button');
            prevBtn.className = 'nav-btn prev-btn';
            prevBtn.innerHTML = '<i class="nf nf-oct-arrow_left"></i>';
            overlay.appendChild(prevBtn);

            const nextBtn = document.createElement('button');
            nextBtn.className = 'nav-btn next-btn';
            nextBtn.innerHTML = '<i class="nf nf-oct-arrow_right"></i>';
            overlay.appendChild(nextBtn);

            const overlayContent = document.createElement('div');
            overlayContent.className = 'overlay-content';

            const overlayImg = document.createElement('img');
            overlayContent.appendChild(overlayImg);

            // Add a throbber element
            const throbber = document.createElement('div');
            throbber.className = 'throbber';
            throbber.innerHTML = '<img src="/assets/images/ball.gif" alt="Loading..." />';
            throbber.style.display = 'none'; // Initially hidden
            overlayContent.appendChild(throbber);

            const overlayTitle = document.createElement('div');
            overlayTitle.className = 'overlay-title';
            overlayContent.appendChild(overlayTitle);

            const overlayArtist = document.createElement('div');
            overlayArtist.className = 'overlay-artist';
            overlayContent.appendChild(overlayArtist);

            overlay.appendChild(overlayContent);
            document.body.appendChild(overlay);

            // Track the current image index
            let currentIndex = 0;

            // Function to update overlay content
            function updateOverlay(index) {
                const currentItem = imageData[index];

                // Show the throbber
                throbber.style.display = 'block';

                // Dim the current image
                overlayImg.classList.add('dimmed');

                // Update caption immediately
                overlayTitle.innerHTML = currentItem.title;
                overlayArtist.innerHTML = `art by <span class="artist-name">${currentItem.artist}</span>!`;

                // Set the new image source and wait for it to load
                overlayImg.onload = () => {
                    throbber.style.display = 'none';
                    overlayImg.classList.remove('dimmed');
                };
                overlayImg.onerror = () => {
                    alert('something went wrong, try refreshing?')
                    throbber.style.display = 'none';
                    overlayImg.classList.remove('dimmed');
                };
                overlayImg.src = currentItem.source;

                currentIndex = index;
            }

            // Add click event listeners to gallery items
            const galleryItems = document.querySelectorAll('.gallery-item img');
            galleryItems.forEach((img, index) => {
                img.addEventListener('click', () => {
                    updateOverlay(index);
                    overlay.style.display = 'flex';
                });
            });

            // Close overlay
            closeBtn.addEventListener('click', () => {
                overlay.style.display = 'none';
            });
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.style.display = 'none';
                }
            });

            // Previous button functionality
            prevBtn.addEventListener('click', () => {
                let newIndex = currentIndex > 0 ? currentIndex - 1 : imageData.length - 1;
                updateOverlay(newIndex);
            });

            // Next button functionality
            nextBtn.addEventListener('click', () => {
                let newIndex = currentIndex < imageData.length - 1 ? currentIndex + 1 : 0;
                updateOverlay(newIndex);
            });

            // Add keydown event listener for keybindings
            document.addEventListener('keydown', (e) => {
                if (overlay.style.display === 'flex') {
                    if (e.key === 'ArrowLeft') {
                        let newIndex = currentIndex > 0 ? currentIndex - 1 : imageData.length - 1;
                        updateOverlay(newIndex);
                    } else if (e.key === 'ArrowRight') {
                        let newIndex = currentIndex < imageData.length - 1 ? currentIndex + 1 : 0;
                        updateOverlay(newIndex);
                    } else if (e.key === 'Escape') {
                        overlay.style.display = 'none';
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error loading JSON file:', error);
        });
}

function cleanupGallery() {
    const overlay = document.querySelector('.overlay');
    if (overlay) {
        overlay.remove(); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeGallery();
});

window.initializeGallery = initializeGallery;
cleanupGallery