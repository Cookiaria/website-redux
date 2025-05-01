document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const mainContent = document.querySelector('.ca-maincontent');
    const loadingBar = document.getElementById('loadingbar');
    const tabLinks = document.querySelectorAll('.ca-tablinks');
    const themeButton = document.getElementById('themebutton');
    const pageTitleElement = document.querySelector('title');
    const headerTitleElement = document.querySelector('.ca-logo-text h2');
    
    // Function to check if URL is a top-level route
    function isTopLevelRoute(url) {
        const path = new URL(url).pathname;
        // Count the number of slashes (excluding the first one)
        return (path.match(/\//g) || []).length <= 1;
    }
    
    // Function to update active tab
    function updateActiveTab() {
        const currentPath = window.location.pathname;
        tabLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            // Check if current path starts with link path (for nested routes)
            if (currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath))) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    // Function to update page title and header
    function updateTitleAndHeader(doc) {
        const newTitle = doc.querySelector('title').textContent;
        const newHeaderTitle = doc.querySelector('.ca-logo-text h2').textContent;
        
        pageTitleElement.textContent = newTitle;
        headerTitleElement.textContent = newHeaderTitle;
    }
    
    async function handleLoadingBar(progress, forceShow = false) {
        return new Promise(resolve => {
            // Only show loading bar if forced or if it's already visible
            const shouldShow = forceShow || loadingBar.style.opacity === '1';
            
            if (progress === 0) {
                // Fade out
                loadingBar.style.opacity = '0';
                
                // After fade out completes
                setTimeout(() => {
                    // Reset width without animation
                    loadingBar.style.transition = 'none';
                    loadingBar.style.width = '0%';
                    
                    // Force a reflow to ensure width is applied
                    void loadingBar.offsetWidth;
                    
                    // Restore transitions
                    loadingBar.style.transition = 'opacity 300ms ease, width 300ms ease';
                    resolve();
                }, 300);
            } else {
                if (shouldShow) {
                    loadingBar.style.opacity = '1';
                    loadingBar.style.width = `${progress}%`;
                }
                resolve();
            }
        });
    }
    
    // Function to fetch and load content
    async function loadContent(url, isPopState = false) {
        // Check if we should do SPA navigation or full page load
        const currentIsTopLevel = isTopLevelRoute(window.location.href);
        const targetIsTopLevel = isTopLevelRoute(url);
        
        // If navigating to a nested route from a top-level route, do full page load
        if (!isPopState && currentIsTopLevel && !targetIsTopLevel) {
            window.location.href = url;
            return;
        }
        
        // Set up loading timeout
        let loadingTimeout = setTimeout(async () => {
            await handleLoadingBar(30, true); // Force show loading bar after 1s
        }, 1000);
        
        try {
            // Fetch the page content
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            
            // Extract the content from the fetched page
            const newContent = doc.querySelector('.ca-maincontent').innerHTML;
            
            // Update loading progress if loading bar is visible
            await handleLoadingBar(70);
            
            // Replace content
            mainContent.innerHTML = newContent;
            
            // Update title and header
            updateTitleAndHeader(doc);
            
            // Update URL without reload
            window.history.pushState({}, '', url);
            
            // Update active tab
            updateActiveTab();
            
            // Load images and complete loading
            await loadImages();
            await handleLoadingBar(100);
            
            // Reset loading bar with fade out/in effect
            setTimeout(async () => {
                await handleLoadingBar(0);
            }, 300);
            
        } catch (error) {
            console.error('Error loading content:', error);
            await handleLoadingBar(0);
            // Fallback to traditional navigation if fetch fails
            window.location.href = url;
        } finally {
            // Clear the timeout if loading completed before it triggered
            clearTimeout(loadingTimeout);
        }
    }
    
    // Function to ensure images are loaded
    function loadImages() {
        return new Promise((resolve) => {
            const images = mainContent.querySelectorAll('img');
            let loadedCount = 0;
            
            if (images.length === 0) {
                resolve();
                return;
            }
            
            images.forEach(img => {
                if (img.complete) {
                    incrementLoaded();
                } else {
                    img.addEventListener('load', incrementLoaded);
                    img.addEventListener('error', incrementLoaded);
                }
            });
            
            function incrementLoaded() {
                loadedCount++;
                if (loadedCount === images.length) {
                    resolve();
                }
            }
        });
    }
    
    // Handle navigation clicks
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        
        // Ignore if not a link or if it's an external link
        if (!link || link.hostname !== window.location.hostname || link.hasAttribute('download') || link.getAttribute('target') === '_blank') {
            return;
        }
        
        // Ignore if it's the theme button
        if (link === themeButton || themeButton.contains(link)) {
            return;
        }
        
        e.preventDefault();
        loadContent(link.href);
    });
    
    // Handle popstate (back/forward navigation)
    window.addEventListener('popstate', function() {
        loadContent(window.location.href, true);
    });
    
    // Initialize active tab
    updateActiveTab();
});