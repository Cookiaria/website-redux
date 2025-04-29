document.addEventListener("DOMContentLoaded", () => {
    const mainContent = document.querySelector(".ca-maincontent");

    let loadingAnimationTimeout;
    let showBarTimeout;
    let isNavigating = false;
    let isBarVisible = false;

    // delay before actually showing the thing if you have nasa internet (real)
    const VISIBILITY_DELAY_MS = 500;

    let loadingBar = document.getElementById('loadingbar');
    if (!loadingBar) {
        loadingBar = document.createElement('div');
        loadingBar.id = 'loadingbar';
        document.body.prepend(loadingBar);
    }

    loadingBar.style.width = '0%';
    loadingBar.style.opacity = '0';
    loadingBar.style.transition = 'none';


    function startLoadingAnimation() {
        isBarVisible = true;
        clearTimeout(loadingAnimationTimeout);

        loadingBar.style.transition = 'none';
        loadingBar.style.width = '0%';
        loadingBar.style.opacity = '1';
        void loadingBar.offsetWidth;

        loadingBar.style.transition = 'width 30s cubic-bezier(0.25, 0.1, 0.5, 1)';
        loadingBar.style.width = '90%';
    }

    function completeLoadingAnimation() {
        if (!isBarVisible) {
            isNavigating = false;
            return;
        }

        clearTimeout(loadingAnimationTimeout);

        const FADE_OUT_DELAY = '0.1s';

        // duration in seconds
        const WIDTH_ANIMATION_DURATION = 0.2;
        const OPACITY_ANIMATION_DURATION = 0.25;

        loadingBar.style.transition = `width ${WIDTH_ANIMATION_DURATION}s ease-out, opacity ${OPACITY_ANIMATION_DURATION}s ease ${FADE_OUT_DELAY}`;
        loadingBar.style.width = '100%';

        // the 
        const totalAnimationTime = WIDTH_ANIMATION_DURATION * 1000 + (parseFloat(FADE_OUT_DELAY) * 1000) + OPACITY_ANIMATION_DURATION * 1000;

        loadingAnimationTimeout = setTimeout(() => {
            loadingBar.style.transition = 'none';
            loadingBar.style.width = '0%';
            loadingBar.style.opacity = '0';
            isBarVisible = false;
        }, totalAnimationTime);
    }

    function failLoadingAnimation() {
        if (!isBarVisible) {
            isNavigating = false;
            return;
        }

        clearTimeout(loadingAnimationTimeout);

        loadingBar.style.backgroundColor = 'red';

        const FADE_OUT_DELAY = '0.1s';
        const WIDTH_ANIMATION_DURATION = 0.2;
        const OPACITY_ANIMATION_DURATION = 0.25;

        loadingBar.style.transition = `width ${WIDTH_ANIMATION_DURATION}s ease-out, opacity ${OPACITY_ANIMATION_DURATION}s ease ${FADE_OUT_DELAY}`;
        loadingBar.style.width = '100%';

        const totalAnimationTime = WIDTH_ANIMATION_DURATION * 1000 + (parseFloat(FADE_OUT_DELAY) * 1000) + OPACITY_ANIMATION_DURATION * 1000;

        loadingAnimationTimeout = setTimeout(() => {
            loadingBar.style.transition = 'none';
            loadingBar.style.width = '0%';
            loadingBar.style.opacity = '0';
            isBarVisible = false;
            loadingBar.style.backgroundColor = 'var(--accent-color)'; // Reset color if changed
        }, totalAnimationTime);
    }

    async function loadPage(url, isPopState = false) {
        if (isNavigating) {
            console.warn("Navigation already in progress for:", url);
            return;
        }
        isNavigating = true;
        isBarVisible = false;
        clearTimeout(showBarTimeout);
        clearTimeout(loadingAnimationTimeout);

        showBarTimeout = setTimeout(() => {
            if (isNavigating) {
                startLoadingAnimation();
            }
        }, VISIBILITY_DELAY_MS);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load page: ${response.status} ${response.statusText}`);
            }
            const html = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Fix relative paths in the loaded content
            const baseUrl = new URL(url, window.location.origin);
            const basePath = baseUrl.pathname.split('/').slice(0, -1).join('/') + '/';

            const newContentElement = doc.querySelector(".ca-maincontent");
            if (newContentElement) {
                // Convert relative paths to absolute paths before inserting
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = newContentElement.innerHTML;

                // Fix img src attributes
                tempDiv.querySelectorAll('img[src^="./"], img[src^="../"], img[src^="/"]').forEach(img => {
                    if (img.src.startsWith('/')) {
                        // Already absolute path (root-relative)
                        return;
                    }
                    try {
                        const absoluteUrl = new URL(img.getAttribute('src'), baseUrl).pathname;
                        img.src = absoluteUrl;
                    } catch (e) {
                        console.warn("couldn't resolve image path:", img.src);
                    }
                });

                // Fix a[href] attributes if needed
                tempDiv.querySelectorAll('a[href^="./"], a[href^="../"]').forEach(link => {
                    try {
                        const absoluteUrl = new URL(link.getAttribute('href'), baseUrl).pathname;
                        link.href = absoluteUrl;
                    } catch (e) {
                        console.warn("couldn't resolve link path:", link.href);
                    }
                });

                mainContent.innerHTML = tempDiv.innerHTML;
            } else {
                mainContent.innerHTML = "<p>error: content structure mismatch. how the hell did you end up here?</p>";
            }

            const images = mainContent.querySelectorAll('img');
            const imageLoadPromises = Array.from(images).map(img => {
                return new Promise((resolve) => {
                    if (img.complete || !img.src) {
                        resolve();
                    } else {
                        img.onload = resolve;
                        img.onerror = resolve;
                    }
                });
            });

            await Promise.allSettled(imageLoadPromises);

            isNavigating = false;
            clearTimeout(showBarTimeout);

            const newTitle = doc.querySelector("title")?.innerText || "cookiaria website";
            document.title = newTitle;

            const logoText = document.querySelector(".ca-logo-text h2");
            if (logoText) logoText.innerText = newTitle;

            if (!isPopState) {
                const currentFullUrl = window.location.pathname + window.location.search + window.location.hash;
                if (url !== currentFullUrl && url !== window.location.pathname && url !== window.location.pathname + '/') {
                    history.pushState({ url }, newTitle, url);
                }
            }

            updateActiveTab(url);
            completeLoadingAnimation();
        } catch (error) {
            console.error("error loading page:", error);
            mainContent.innerHTML = `<p>something went wrong. probably your internet? clicking on another tab should fix it. here's the error:<br><br>${error.message}<br><br> also if you're somehow seeing this, check this out:</p><br><img src="https://files.catbox.moe/q3lfvs.jpg" style="width: 400px;"><br><p>its pom-pom (real)</p>`;
            isNavigating = false;
            clearTimeout(showBarTimeout);
            failLoadingAnimation();
        }
    }

    function updateActiveTab(currentUrl) {
        const normalizedCurrentUrl = currentUrl.split('#')[0].replace(/\/$/, "");

        const allTabs = document.querySelectorAll(".ca-tablinks, .ca-bottom-tablinks");
        allTabs.forEach(tab => {
            const tabUrl = tab.getAttribute("href");
            if (!tabUrl) return;

            const normalizedTabUrl = tabUrl.split('#')[0].replace(/\/$/, "");

            const isActive = (normalizedTabUrl === normalizedCurrentUrl) ||
                (normalizedTabUrl === '/index.html' && normalizedCurrentUrl === '') ||
                (normalizedTabUrl === '' && normalizedCurrentUrl === '/index.html');


            if (isActive) {
                tab.classList.add("active");
            } else {
                tab.classList.remove("active");
            }
        });
    }

    // --- Event Listeners ---
    document.body.addEventListener("click", event => {
        const tab = event.target.closest(".ca-tablinks, .ca-bottom-tablinks");

        if (tab) {
            const url = tab.getAttribute("href");
            // Basic check for internal links (starts with /, doesn't contain ':', or starts with origin)
            const isInternalLink = url && (url.startsWith('/') || !url.includes(':') || url.startsWith(window.location.origin));

            if (isInternalLink) {
                event.preventDefault();

                // Normalize URLs for comparison to prevent unnecessary reloads
                const targetUrl = new URL(url, window.location.origin);
                const currentUrl = new URL(window.location.href);

                if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
                    if (targetUrl.hash !== currentUrl.hash) {
                    }
                    return;
                }

                loadPage(url, false);
            }
        }
    });

    // --- Handle Back/Forward Button Clicks why didn't i do this before---
    window.addEventListener("popstate", event => {
        const stateUrl = event.state?.url;
        const currentFullUrl = window.location.pathname + window.location.search + window.location.hash;

        if (stateUrl && stateUrl !== currentFullUrl) {
            loadPage(stateUrl, true);
        } else if (!stateUrl && currentFullUrl !== '/') {
            loadPage('/', true);
        } else {

            updateActiveTab(currentFullUrl);
        }
    });

    const initialUrl = window.location.pathname + window.location.search + window.location.hash;
    updateActiveTab(initialUrl);

    if (!history.state || history.state.url !== initialUrl) {
        history.replaceState({ url: initialUrl }, document.title, initialUrl);
    }

}); 