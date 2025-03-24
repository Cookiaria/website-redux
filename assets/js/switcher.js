document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".ca-tablinks");
    const mainContent = document.querySelector(".ca-maincontent");

    async function loadPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to load page");
            const html = await response.text();
 
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = html;

            const newContent = tempDiv.querySelector(".ca-maincontent").innerHTML;
            document.querySelector(".ca-maincontent").innerHTML = newContent;
    
            const newTitle = tempDiv.querySelector("title")?.innerText || "cookiaria website";
            document.querySelector(".ca-logo-text h2").innerText = newTitle;
    
            // Update browser history
            history.pushState({ url }, null, url);
    
            // Update active tab
            updateActiveTab(url);
    
            // Clean up previous page-specific elements (e.g., gallery overlay)
            if (typeof window.cleanupGallery === "function") {
                window.cleanupGallery();
            }
    
            // Reinitialize any page-specific JavaScript
            initializePageScripts();
    
            // Reinitialize global scripts (e.g., wavy text)
            if (typeof window.initializeWavyText === "function") {
                window.initializeWavyText();
            }
        } catch (error) {
            console.error("Error loading page:", error);
        }
    }

    // Function to update the active tab
    function updateActiveTab(url) {
        tabs.forEach(tab => {
            const tabUrl = tab.getAttribute("href");
            if (tabUrl === url) {
                tab.classList.add("active");
            } else {
                tab.classList.remove("active");
            }
        });
    }

    // Event listener for tab clicks
    tabs.forEach(tab => {
        tab.addEventListener("click", event => {
            event.preventDefault();
            const url = tab.getAttribute("href");
            loadPage(url);
        });
    });

    // Handle back/forward navigation
    window.addEventListener("popstate", event => {
        if (event.state && event.state.url) {
            loadPage(event.state.url);
        }
    });

    // Initialize active tab based on current URL
    const currentUrl = window.location.pathname || "/";
    updateActiveTab(currentUrl);

    // Function to load scripts asynchronously
    async function loadScript(src) {
        return new Promise((resolve, reject) => {
            const scriptElement = document.createElement("script");
            scriptElement.src = src;
            scriptElement.onload = resolve;
            scriptElement.onerror = reject;
            document.body.appendChild(scriptElement);
        });
    }

    async function initializePageScripts() {
        // Remove previously loaded scripts to avoid duplicates
        document.querySelectorAll("script[data-dynamic]").forEach(script => script.remove());

        // Find all script tags in the newly loaded content
        const scripts = document.querySelectorAll(".ca-maincontent script");

        for (const script of scripts) {
            if (script.src) {
                // Load external scripts sequentially
                await loadScript(script.src);
                console.log(`Script loaded: ${script.src}`);
            } else {
                // Execute inline scripts immediately
                const inlineScript = document.createElement("script");
                inlineScript.textContent = script.innerHTML;
                inlineScript.setAttribute("data-dynamic", "true");
                document.body.appendChild(inlineScript);
            }
        }

        // Check if the current page is the gallery page
        if (window.location.pathname === "/gallery") {
            // Explicitly initialize the gallery
            if (typeof window.initializeGallery === "function") {
                window.initializeGallery();
            }
        }
    }
});