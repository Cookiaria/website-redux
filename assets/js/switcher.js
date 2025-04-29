document.addEventListener("DOMContentLoaded", () => {
    const mainContent = document.querySelector(".ca-maincontent");
    if (!mainContent) {
        console.error("Error: '.ca-maincontent' element not found.");
        return; // Stop script if main content area is missing
    }
    let loadingAnimationTimeout;
    let showBarTimeout; // Timer to decide if the bar should appear
    let isNavigating = false; // Flag to prevent overlapping navigations
    let isBarVisible = false; // Flag to track if the bar was actually shown

    // --- Configurable Timings ---
    const VISIBILITY_DELAY_MS = 1000; // Only show bar if loading takes longer than this (milliseconds)

    // --- Create loading bar dynamically ---
    let loadingBar = document.getElementById('loadingbar');
    if (!loadingBar) {
        loadingBar = document.createElement('div');
        loadingBar.id = 'loadingbar';
        document.body.prepend(loadingBar);
    }
    // Ensure initial styles are set (important if reusing bar)
    loadingBar.style.width = '0%';
    loadingBar.style.opacity = '0'; // Start hidden
    loadingBar.style.transition = 'none';


    function startLoadingAnimation() {
        // This function is now called *only if* VISIBILITY_DELAY_MS has passed
        isBarVisible = true; // Mark the bar as visible
        clearTimeout(loadingAnimationTimeout); // Clear any pending fade-out/reset

        // Reset styles (opacity will be set to 1 here)
        loadingBar.style.transition = 'none'; // Remove transitions for immediate reset
        loadingBar.style.width = '0%';
        loadingBar.style.opacity = '1'; // Make it visible NOW

        // Force reflow to apply the reset styles before starting the animation
        void loadingBar.offsetWidth;

        // Start the slow animation (e.g., 30s to 95% - never quite 100% on its own)
        loadingBar.style.transition = 'width 30s cubic-bezier(0.25, 0.1, 0.5, 1)'; // Smoother easing
        loadingBar.style.width = '95%'; // Animate towards *almost* 100%
    }

    function completeLoadingAnimation() {
        // Only proceed if the bar was actually made visible
        if (!isBarVisible) {
            isNavigating = false; // Still need to reset navigation flag
            return; // Do nothing visually if the bar never appeared
        }

        clearTimeout(loadingAnimationTimeout); // Clear potential reset timeouts

        // --- Adjust Fade-Out Delay Here ---
        // The last value in the 'opacity' transition is the delay *after* the width animation finishes.
        // Example: 'opacity 0.5s ease 0.1s' means fade starts 0.1 seconds after width reaches 100%.
        // Example: 'opacity 0.5s ease 0s' means fade starts immediately when width reaches 100%.
        const FADE_OUT_DELAY = '0.1s'; // <-- CHANGE THIS VALUE (e.g., '0s', '0.1s', '0.5s')

        const WIDTH_ANIMATION_DURATION_MS = 200; // Duration of the fast width animation (must match below)
        const OPACITY_ANIMATION_DURATION_MS = 500; // Duration of the fade-out (must match below)


        // Fast completion animation to 100%
        loadingBar.style.transition = `width ${WIDTH_ANIMATION_DURATION_MS / 1000}s ease-out, opacity ${OPACITY_ANIMATION_DURATION_MS / 1000}s ease ${FADE_OUT_DELAY}`;
        loadingBar.style.width = '100%';

        // Fade out happens via the transition above.
        // Set a timeout to reset the bar *after* all animations complete.
        // Total time = Width duration + Opacity Delay + Opacity Duration
        const totalAnimationTime = WIDTH_ANIMATION_DURATION_MS + (parseFloat(FADE_OUT_DELAY) * 1000) + OPACITY_ANIMATION_DURATION_MS;

        loadingAnimationTimeout = setTimeout(() => {
            loadingBar.style.transition = 'none'; // Turn off transitions
            loadingBar.style.width = '0%';    // Reset width
            loadingBar.style.opacity = '0';   // Hide it ready for next time
            isBarVisible = false;             // Reset visibility flag
        }, totalAnimationTime);
    }

    function failLoadingAnimation() {
        // Only proceed if the bar was actually made visible
        if (!isBarVisible) {
            isNavigating = false; // Still need to reset navigation flag
            return; // Do nothing visually if the bar never appeared
        }

        clearTimeout(loadingAnimationTimeout);

        // Optionally make it visually distinct on error (e.g., turn red)
        // loadingBar.style.backgroundColor = 'red';

        // Use similar timing as completeLoadingAnimation for consistency
        const FADE_OUT_DELAY = '0.1s'; // Match the delay used in completeLoadingAnimation
        const WIDTH_ANIMATION_DURATION_MS = 200;
        const OPACITY_ANIMATION_DURATION_MS = 500;

        loadingBar.style.transition = `width ${WIDTH_ANIMATION_DURATION_MS / 1000}s ease-out, opacity ${OPACITY_ANIMATION_DURATION_MS / 1000}s ease ${FADE_OUT_DELAY}`;
        loadingBar.style.width = '100%'; // Or set to current width if preferred visually

        const totalAnimationTime = WIDTH_ANIMATION_DURATION_MS + (parseFloat(FADE_OUT_DELAY) * 1000) + OPACITY_ANIMATION_DURATION_MS;

        loadingAnimationTimeout = setTimeout(() => {
            loadingBar.style.transition = 'none';
            loadingBar.style.width = '0%';
            loadingBar.style.opacity = '0';
            isBarVisible = false; // Reset visibility flag
            // loadingBar.style.backgroundColor = 'var(--accent-color)'; // Reset color if changed
        }, totalAnimationTime);
    }

    async function loadPage(url, isPopState = false) {
        if (isNavigating) {
            console.warn("Navigation already in progress for:", url);
            return;
        }
        isNavigating = true;
        isBarVisible = false; // Reset visibility for this navigation
        clearTimeout(showBarTimeout); // Clear any previous visibility timer
        clearTimeout(loadingAnimationTimeout); // Clear any leftover reset timer

        // --- Start Timer for Bar Visibility ---
        // Only call startLoadingAnimation if loading is still happening after VISIBILITY_DELAY_MS
        showBarTimeout = setTimeout(() => {
            if (isNavigating) { // Check if navigation is still ongoing
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

            const newContentElement = doc.querySelector(".ca-maincontent");
            if (newContentElement) {
                mainContent.innerHTML = newContentElement.innerHTML;
            } else {
                mainContent.innerHTML = "<p>Error: Content structure mismatch.</p>";
                console.error("Fetched HTML missing '.ca-maincontent'");
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

            // --- Loading Finished ---
            isNavigating = false; // Mark navigation as complete *before* animation/timeouts
            clearTimeout(showBarTimeout); // Crucial: Prevent the bar from appearing if loading finished quickly

            const newTitle = doc.querySelector("title")?.innerText || "cookiaria website";
            document.title = newTitle;

            const logoText = document.querySelector(".ca-logo-text h2");
            if (logoText) logoText.innerText = newTitle;

            if (!isPopState) {
                const currentFullUrl = window.location.pathname + window.location.search + window.location.hash;
                // Only push state if the target URL is different from the current one
                if (url !== currentFullUrl && url !== window.location.pathname && url !== window.location.pathname + '/') {
                   history.pushState({ url }, newTitle, url);
                }
            }

            updateActiveTab(url);
            completeLoadingAnimation(); // This will now only run animations if isBarVisible is true

        } catch (error) {
            console.error("Error loading page:", error);
            mainContent.innerHTML = `<p>Sorry, could not load the page. Error: ${error.message}</p>`;
            isNavigating = false; // Ensure flag is reset on error
            clearTimeout(showBarTimeout); // Prevent bar from appearing after an error
            failLoadingAnimation(); // Handle visual failure state
        }
        // Note: 'finally' block removed as isNavigating is now set within try/catch
    }

    function updateActiveTab(currentUrl) {
        const normalizedCurrentUrl = currentUrl.split('#')[0].replace(/\/$/, ""); // Remove hash and trailing slash

        const allTabs = document.querySelectorAll(".ca-tablinks, .ca-bottom-tablinks");
        allTabs.forEach(tab => {
            const tabUrl = tab.getAttribute("href");
            if (!tabUrl) return;

            const normalizedTabUrl = tabUrl.split('#')[0].replace(/\/$/, ""); // Normalize tab URL too

            // Improved comparison for root paths
             const isActive = (normalizedTabUrl === normalizedCurrentUrl) ||
                             (normalizedTabUrl === '/index.html' && normalizedCurrentUrl === '') || // Handle /index.html vs /
                             (normalizedTabUrl === '' && normalizedCurrentUrl === '/index.html'); // Handle / vs /index.html


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
                 const targetUrl = new URL(url, window.location.origin); // Resolve relative URLs
                 const currentUrl = new URL(window.location.href);

                 // Compare pathname + search, ignore hash for reload decision
                 if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
                    // If only the hash is different, just scroll or do nothing
                    if (targetUrl.hash !== currentUrl.hash) {
                        // Optional: handle hash changes smoothly if needed, e.g., scrollIntoView
                        // window.location.hash = targetUrl.hash; // Simplest way, causes jump
                    }
                    return; // Don't reload if path and search are the same
                 }


                // if (tab.classList.contains("active")) return; // Removed this - allow reload if URL differs slightly (e.g. query params)

                loadPage(url, false);
            }
            // Allow default behavior for external links or links starting with '#' etc.
        }
    });


    window.addEventListener("popstate", event => {
        const stateUrl = event.state?.url;
        const currentFullUrl = window.location.pathname + window.location.search + window.location.hash;

        if (stateUrl && stateUrl !== currentFullUrl) {
             loadPage(stateUrl, true);
        } else if (!stateUrl && currentFullUrl !== '/') {
             // Handle going back to initial page if it wasn't explicitly pushed with state
             // This might happen if the initial load didn't use replaceState correctly
             // or if navigating back past the first SPA navigation.
             // Check if we are not already at the root to avoid potential loops.
             loadPage('/', true); // Attempt to load the root content
        } else {
            // If state URL is the same as current, just update the tab visually
             updateActiveTab(currentFullUrl);
        }
    });

    // --- Initial Setup ---
    const initialUrl = window.location.pathname + window.location.search + window.location.hash;
    updateActiveTab(initialUrl);

    // Ensure initial state is stored so back button works to the first page view
    if (!history.state || history.state.url !== initialUrl) {
        history.replaceState({ url: initialUrl }, document.title, initialUrl);
    }

}); // End DOMContentLoaded
