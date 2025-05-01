// =================== Scale down for small screens ===================

function adjustMainScale() {
    const mainElement = document.querySelector('main');
    const container = document.querySelector('#ca-everything');

    // Dynamically fetch the latest value of --entire-width
    const entireWidth = parseInt(
        getComputedStyle(document.documentElement)
            .getPropertyValue('--entire-width')
            .trim()
    );
    const minWidth = 420;

    const viewportWidth = window.innerWidth;

    // Reset all transformations
    mainElement.style.transform = '';
    mainElement.style.width = '';
    mainElement.style.height = '';

    if (viewportWidth < minWidth) {
        const scale = viewportWidth / minWidth;
        mainElement.style.transform = `scale(${scale})`;
        mainElement.style.width = `${minWidth}px`;
        // Compensate for the scaling by adjusting the height
        mainElement.style.height = `${mainElement.scrollHeight / scale}px`;
        mainElement.style.transformOrigin = 'center top';
    } else if (viewportWidth > entireWidth) {
        mainElement.style.width = `${entireWidth}px`;
    } else {
        mainElement.style.width = '100%';
    }
}

// Attach event listeners for resize and load events
window.addEventListener('resize', adjustMainScale);
window.addEventListener('load', adjustMainScale);

// =================== Header Tabs ===================

document.addEventListener("DOMContentLoaded", () => {
    const headerTabs = document.querySelector(".ca-header-tabs");
    const bottomTabs = document.querySelector(".ca-bottom-header-tabs");
    const allTabs = Array.from(headerTabs.querySelectorAll(".ca-tablinks"));
    const gap = parseInt(getComputedStyle(headerTabs).columnGap) || 0; // Get the column-gap value

    const adjustTabs = () => {
        // Clear the bottom tabs container
        bottomTabs.innerHTML = "";

        // Reset all tabs to the top section with the correct class
        allTabs.forEach(tab => {
            tab.classList.remove("ca-bottom-tablinks");
            tab.classList.add("ca-tablinks");
            headerTabs.appendChild(tab);
        });

        // Calculate the available width for the top tabs
        const headerWidth = headerTabs.offsetWidth;

        // Track the cumulative width of the tabs
        let currentWidth = 0;

        // Iterate through the tabs to check if they fit
        allTabs.forEach((tab, index) => {
            const tabWidth = tab.offsetWidth;
            const marginLeft = index === 0 ? parseInt(getComputedStyle(tab).marginLeft) || 0 : 0; // Get the left margin of the first tab

            // Add the gap only if it's not the first tab
            const effectiveWidth = currentWidth + tabWidth + marginLeft + (index > 0 ? gap : 0);

            if (effectiveWidth > headerWidth) {
                // Move overflowing tabs to the bottom section
                tab.classList.remove("ca-tablinks");
                tab.classList.add("ca-bottom-tablinks");
                bottomTabs.appendChild(tab);
            } else {
                // Keep the tab in the top section
                currentWidth = effectiveWidth;
            }
        });
    };

    // Initial adjustment on page load
    adjustTabs();

    // Re-adjust tabs on window resize
    window.addEventListener("resize", adjustTabs);
});

// =================== Dark/white theme toggle ===================

const toggleButton = document.getElementById('themebutton');
const themeIcon = document.getElementById('themeicon');

// Toggle theme and update icon
function updateThemeIcon() {
    document.documentElement.classList.toggle('ca-light-mode');

    const isLight = document.documentElement.classList.contains('ca-light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark'); // use 'theme' consistently

    toggleThemeIcon();
}

// Update icon based on current theme
function toggleThemeIcon() {
    if (document.documentElement.classList.contains('ca-light-mode')) {
        themeIcon.classList.remove('nf-oct-moon');
        themeIcon.classList.add('nf-oct-sun');
    } else {
        themeIcon.classList.remove('nf-oct-sun');
        themeIcon.classList.add('nf-oct-moon');
    }
}

toggleButton.addEventListener('click', updateThemeIcon);

// On DOM load, apply saved or system theme and update icon
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme'); 
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

    if (savedTheme === 'light' || (!savedTheme && prefersLight)) {
        document.documentElement.classList.add('ca-light-mode');
    } else {
        document.documentElement.classList.remove('ca-light-mode');
    }

    toggleThemeIcon(); // make sure the icon matches the theme
});