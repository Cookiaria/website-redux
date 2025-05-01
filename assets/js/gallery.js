console.log('Gallery loading, loadingBar exists?', !!window.loadingBar);

// Safe initialization guard
if (typeof window.loadingBar === 'undefined') {
    window.loadingBar = {
        handle: () => console.warn('LoadingBar not ready'),
        isLoading: false
    };
}

async function updateLoadingBar(progress) {
    if (!window.loadingBar) {
        console.warn('Loading bar not available');
        return;
    }
    try {
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
        await window.loadingBar.handle(progress, true); // Always force show
        console.log('Loading bar updated to', progress);
    } catch (e) {
        console.error('Failed to update loading bar:', e);
    }
}

async function initializeGallery() {
    const gallery = document.querySelector('#gallery');
    if (!gallery) return;

    // Check if overlay already exists and remove it
    const existingOverlay = document.querySelector('.overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    // Hide gallery completely during loading
    gallery.style.display = 'none';

    // Create and show loading throbber
    const loadingThrobber = document.createElement('div');
    loadingThrobber.className = 'gallery-loading-throbber';
    loadingThrobber.innerHTML = '<img src="/assets/images/ball.gif" alt="loading the creatures..." />';
    gallery.parentNode.insertBefore(loadingThrobber, gallery);

    // Set loading state
    await updateLoadingBar(10);

    fetch('/assets/gallery.json')
        .then(async response => {
            if (!response.ok) throw new Error('Failed to load gallery data');
            await updateLoadingBar(30);
            return response.json();
        })
        .then(async imageData => {
            gallery.innerHTML = '';
            await updateLoadingBar(50);

            // Populate gallery
            imageData.forEach(item => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery-item';
                const img = document.createElement('img');
                img.src = item.thumbnail;
                img.dataset.source = item.image;
                img.dataset.title = item.title;
                img.dataset.description = item.description || '';
                img.dataset.artistName = item.artist.name;
                img.dataset.artistUrl = item.artist.url || '';
                galleryItem.appendChild(img);
                gallery.appendChild(galleryItem);
            });

            await updateLoadingBar(70);

            // Image loading
            const images = gallery.querySelectorAll('img');



            await new Promise(async (resolve) => {
                if (images.length === 0) {
                    resolve();
                    return;
                }

                let loadedCount = 0;
                const checkComplete = async () => {
                    loadedCount++;
                    const progress = 70 + Math.floor((loadedCount / images.length) * 25);
                    await updateLoadingBar(progress);
                    if (loadedCount === images.length) {
                        resolve();
                    }
                };

                images.forEach(img => {
                    if (img.complete) {
                        checkComplete();
                    } else {
                        img.addEventListener('load', checkComplete);
                        img.addEventListener('error', checkComplete);
                    }
                });
            });

            // Initialize Masonry
            const masonry = new Masonry(gallery, {
                itemSelector: '.gallery-item',
                columnWidth: 175,
                gutter: 10,
                fitWidth: true,
                transitionDuration: 0
            });

            const recalculateMasonry = () => {
                if (masonry) {
                    masonry.layout();
                    setTimeout(() => masonry.layout(), 100);
                }
            };

            await updateLoadingBar(100);
            recalculateMasonry();

            setTimeout(() => {
                loadingThrobber.remove();
                gallery.style.display = 'block'; 
                recalculateMasonry();

                // One final recalculation after display becomes visible
                setTimeout(() => recalculateMasonry(), 50);
            }, 300);

            setTimeout(async () => {
                await updateLoadingBar(0);
                window.loadingBar.isLoading = false;
                // One final recalculation after everything settles
                recalculateMasonry();
            }, 300);

            // Create overlay (rest of overlay code remains the same)
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

                    // Updated error handling
                    overlayImg.onerror = (error) => {
                        const errorMessage = error ? `screenshot this and send me the screenshot please! here's the error:\n${error.message}` : 'if you\'re seeing this specific bit of text it means that something really fucked up';
                        alert(`Something went wrong: \n \n ${errorMessage}`);
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
        })
        .catch(async error => {
            console.error('Error:', error);
            await updateLoadingBar(0);
            window.loadingBar.isLoading = false;
        });

    adjustMainScale();
}

function cleanupGallery() {
    const existingThrobber = document.querySelector('.gallery-loading-throbber');
    if (existingThrobber) {
        existingThrobber.remove();
    }
    
    const existingOverlay = document.querySelector('.overlay');
    if (existingOverlay) {
        existingOverlay.remove();
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