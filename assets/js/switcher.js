document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".ca-tablinks");
    const mainContent = document.querySelector(".ca-maincontent");

    async function loadPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to load page");
            const html = await response.text();

            // Parse the fetched HTML into a temporary div
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = html;

            // Extract and update the main content
            const newContent = tempDiv.querySelector(".ca-maincontent").innerHTML;
            mainContent.innerHTML = newContent;

            // Extract and update the title
            const newTitle = tempDiv.querySelector("title")?.innerText || "cookiaria website";
            document.title = newTitle; // Update the browser's title
            document.querySelector(".ca-logo-text h2").innerText = newTitle;

            // Update browser history
            history.pushState({ url }, null, url);

            // Update active tab
            updateActiveTab(url);
        } catch (error) {
            console.error("Error loading page:", error);
        }
    }

    // Function to update the active tab
    function updateActiveTab(url) {
        // Get all tabs from both top and bottom sections
        const allTabs = document.querySelectorAll(".ca-tablinks, .ca-bottom-tablinks");

        allTabs.forEach(tab => {
            const tabUrl = tab.getAttribute("href");
            if (tabUrl === url) {
                tab.classList.add("active");
            } else {
                tab.classList.remove("active");
            }
        });
    }

    // Event listener for tab clicks
    // Modify the click event listener for tabs
    tabs.forEach(tab => {
        tab.addEventListener("click", event => {
            event.preventDefault();

            // Skip if this tab is already active
            if (tab.classList.contains("active")) {
                return; // Do nothing
            }

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
});