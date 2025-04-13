function initializeGallery() {
    const gallery = document.querySelector('#gallery');
    if (!gallery) return; // Exit if gallery doesn't exist

    // Check if overlay already exists and remove it
    const existingOverlay = document.querySelector('.overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    fetch('/assets/gallery.json')
        .then(response => response.json())
        .then(imageData => {
            // Clear existing gallery items
            gallery.innerHTML = '';

            // Add 0.5 second delay before rendering
            setTimeout(() => {
                // Populate gallery with thumbnails
                imageData.forEach(item => {
                    const galleryItem = document.createElement('div');
                    galleryItem.className = 'gallery-item';
                    const img = document.createElement('img');
                    img.src = item.thumbnail;
                    img.dataset.source = item.image;
                    img.dataset.title = item.title;
                    img.dataset.description = item.description || ''; // Default to empty string if undefined
                    img.dataset.artistName = item.artist.name;
                    img.dataset.artistUrl = item.artist.url || ''; // Default to empty string if undefined
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

                // Create overlay only if it doesn't exist
                if (!document.querySelector('.overlay')) {
                    const overlay = document.createElement('div');
                    overlay.className = 'overlay';
                    const closeBtn = document.createElement('span');
                    closeBtn.className = 'close-btn';
                    closeBtn.innerHTML = '×';
                    overlay.appendChild(closeBtn);

                    const prevBtn = document.createElement('button');
                    prevBtn.className = 'nav-btn prev-btn';
                    prevBtn.innerHTML = '<i class="nerd-font nf-oct-arrow_left"></i>';
                    overlay.appendChild(prevBtn);

                    const nextBtn = document.createElement('button');
                    nextBtn.className = 'nav-btn next-btn';
                    nextBtn.innerHTML = '<i class="nerd-font nf-oct-arrow_right"></i>';
                    overlay.appendChild(nextBtn);

                    const overlayContent = document.createElement('div');
                    overlayContent.className = 'overlay-content';

                    const overlayImg = document.createElement('img');
                    overlayContent.appendChild(overlayImg);

                    const throbber = document.createElement('div');
                    throbber.className = 'throbber';
                    throbber.innerHTML = '<img src="/assets/images/ball.gif" alt="Loading..." />';
                    throbber.style.display = 'none';
                    overlayContent.appendChild(throbber);

                    const overlayTitle = document.createElement('div');
                    overlayTitle.className = 'overlay-title';
                    overlayContent.appendChild(overlayTitle);

                    const overlayDescription = document.createElement('div');
                    overlayDescription.className = 'overlay-description';
                    overlayContent.appendChild(overlayDescription);

                    const overlayArtist = document.createElement('div');
                    overlayArtist.className = 'overlay-artist';
                    overlayContent.appendChild(overlayArtist);

                    overlay.appendChild(overlayContent);
                    document.body.appendChild(overlay);

                    let currentIndex = 0;

                    function updateOverlay(index) {
                        const currentItem = imageData[index];
                        throbber.style.display = 'block';
                        overlayImg.classList.add('dimmed');
                        overlayTitle.innerHTML = currentItem.title;

                        // Convert \n in description to <br> tags
                        const formattedDescription = currentItem.description
                            ? currentItem.description.replace(/\n/g, '<br>')
                            : '';
                        
                        // Conditionally render description
                        if (formattedDescription) {
                            overlayDescription.innerHTML = formattedDescription;
                            overlayDescription.style.display = 'block'; // Ensure it's visible
                        } else {
                            overlayDescription.innerHTML = '';
                            overlayDescription.style.display = 'none'; // Hide if no description
                        }

                        // Conditionally render artist name as a link or plain text
                        if (currentItem.artist.url) {
                            const artistLink = document.createElement('a');
                            artistLink.href = currentItem.artist.url;
                            artistLink.target = '_blank'; // Open in new tab
                            artistLink.textContent = currentItem.artist.name;
                            overlayArtist.innerHTML = `art by <span class="artist-name">${artistLink.outerHTML}</span>!`;
                        } else {
                            overlayArtist.innerHTML = `art by <span class="artist-name">${currentItem.artist.name}</span>!`;
                        }

                        overlayImg.onload = () => {
                            throbber.style.display = 'none';
                            overlayImg.classList.remove('dimmed');
                        };
                        overlayImg.onerror = () => {
                            alert(`hi a_cat send this to cooki: ${overlayImg.src} - ${overlayImg.onerror.event}`);
                            throbber.style.display = 'none';
                            overlayImg.classList.remove('dimmed');
                        };
                        overlayImg.src = currentItem.image;
                        currentIndex = index;
                    }

                    const galleryItems = document.querySelectorAll('.gallery-item img');
                    galleryItems.forEach((img, index) => {
                        img.addEventListener('click', () => {
                            updateOverlay(index);
                            overlay.style.display = 'flex';
                        });
                    });

                    closeBtn.addEventListener('click', () => {
                        overlay.style.display = 'none';
                    });
                    overlay.addEventListener('click', (e) => {
                        if (e.target === overlay) {
                            overlay.style.display = 'none';
                        }
                    });

                    prevBtn.addEventListener('click', () => {
                        let newIndex = currentIndex > 0 ? currentIndex - 1 : imageData.length - 1;
                        updateOverlay(newIndex);
                    });

                    nextBtn.addEventListener('click', () => {
                        let newIndex = currentIndex < imageData.length - 1 ? currentIndex + 1 : 0;
                        updateOverlay(newIndex);
                    });

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
                }
            }, 300); // 500ms = 0.5 second delay
        })
        .catch(error => {
            console.error('Error loading JSON file:', error);
        });
    adjustMainScale();
}

function cleanupGallery() {
    const overlay = document.querySelector('.overlay');
    if (overlay) {
        overlay.remove();
    }
    const gallery = document.querySelector('#gallery');
    if (gallery) {
        gallery.innerHTML = '';
    }
}

// Use MutationObserver to watch for gallery element
function setupGalleryObserver() {
    let galleryInitialized = false;

    const observer = new MutationObserver((mutations) => {
        const gallery = document.querySelector('#gallery');
        
        if (gallery && !galleryInitialized) {
            initializeGallery();
            galleryInitialized = true;
        } else if (!gallery && galleryInitialized) {
            cleanupGallery();
            galleryInitialized = false;
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial check
    if (document.querySelector('#gallery')) {
        initializeGallery();
        galleryInitialized = true;
    }
}

// Run observer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupGalleryObserver();
});

window.initializeGallery = initializeGallery;
window.cleanupGallery = cleanupGallery;