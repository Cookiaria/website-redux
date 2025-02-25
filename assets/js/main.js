let lastRandomLine = '';

async function fetchHeaderLines() {
    try {
        const response = await fetch('/assets/headers.txt');
        const text = await response.text();
        return text.split('\n').map(line => line.trim()).filter(line => line);
    } catch (error) {
        console.error('Error fetching header lines:', error);
        return [];
    }
}

function getRandomHeaderLine(lines) {
    if (lines.length === 0) return null;

    let randomLine;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        randomLine = lines[Math.floor(Math.random() * lines.length)];
        attempts++;
    } while (randomLine === lastRandomLine && attempts < maxAttempts);

    lastRandomLine = randomLine;
    return randomLine;
}

async function randomHeader(prefix = '') {
    const element = document.getElementById('headerrandom');
    if (!element) {
        console.warn('Element with ID "headerrandom" not found.');
        return;
    }

    if (prefix.trim()) {
        // If a prefix is provided, parse it as HTML and replace content
        const parser = new DOMParser();
        const dom = parser.parseFromString(prefix, 'text/html');
        element.innerHTML = ''; // Clear just before replacing
        element.append(...dom.body.childNodes);
        return;
    }

    // Otherwise, fetch a random line from headers.txt
    const lines = await fetchHeaderLines();
    const randomLine = getRandomHeaderLine(lines);

    if (!randomLine) {
        console.warn('No valid header line found.');
        return;
    }

    // Parse the random line as HTML and replace content
    const parser = new DOMParser();
    const dom = parser.parseFromString(randomLine, 'text/html');
    element.innerHTML = ''; // Clear just before replacing
    element.append(...dom.body.childNodes);
}

// Attach to the global object for console access
window.randomHeader = randomHeader;

// Call by default with an empty prefix
randomHeader();

// ------------------------------------------- //

function adjustMainScale() {
    const mainElement = document.querySelector('main');
    const container = document.querySelector('#ca-everything');
    const minWidth = 420; // Matches your CSS min-width
    const maxWidth = 820; // Matches your CSS max-width
    
    // Get the current viewport width
    const viewportWidth = window.innerWidth;
    
    // Reset any previous transforms
    mainElement.style.transform = '';
    mainElement.style.transformOrigin = 'center top';
    
    // If viewport is smaller than minWidth, scale down
    if (viewportWidth < minWidth) {
        const scale = viewportWidth / minWidth;
        mainElement.style.transform = `scale(${scale})`;
    }
    // If viewport is larger than maxWidth, ensure it doesn't exceed maxWidth
    else if (viewportWidth > maxWidth) {
        mainElement.style.width = `${maxWidth}px`;
    }
    // If viewport is between minWidth and maxWidth, use 100% width
    else {
        mainElement.style.width = '100%';
    }
}

// Run on window resize and initial load
window.addEventListener('resize', adjustMainScale);
window.addEventListener('load', adjustMainScale);

// Run once immediately in case page is already loaded
adjustMainScale();