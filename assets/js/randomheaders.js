let lastRandomLine = '';
let cachedHeaderLines = null;

async function fetchHeaderLines() {
    if (cachedHeaderLines !== null) {
        return cachedHeaderLines;
    }
    try {
        const response = await fetch('/assets/headers.txt');
        if (!response.ok) throw new Error('Failed to fetch headers.txt');
        const text = await response.text();
        cachedHeaderLines = text.split('\n').map(line => line.trim()).filter(line => line);
        return cachedHeaderLines;
    } catch (error) {
        console.error('Error fetching header lines:', error);
        return [];
    }
}

function getRandomHeaderLine(lines) {
    if (lines.length === 0) return null;

    // Shuffle the array once and iterate sequentially
    if (!Array.isArray(getRandomHeaderLine.queue)) {
        getRandomHeaderLine.queue = [...lines].sort(() => Math.random() - 0.5);
    }

    const randomLine = getRandomHeaderLine.queue.pop();
    if (!getRandomHeaderLine.queue.length) {
        getRandomHeaderLine.queue = [...lines].sort(() => Math.random() - 0.5);
    }

    return randomLine;
}

function updateElementContent(element, content) {
    if (!content.trim()) return;
    const parser = new DOMParser();
    const dom = parser.parseFromString(content, 'text/html');
    element.innerHTML = '';
    element.append(...dom.body.childNodes);
}

async function randomHeader(prefix = '') {
    const element = document.getElementById('headerrandom');
    if (!element) {
        console.warn('Element with ID "headerrandom" not found.');
        return;
    }

    if (prefix.trim()) {
        updateElementContent(element, prefix);
        return;
    }

    const lines = await fetchHeaderLines();
    const randomLine = getRandomHeaderLine(lines);

    if (!randomLine) {
        console.warn('No valid header line found.');
        return;
    }

    updateElementContent(element, randomLine);
}

// Attach to the global object for console access
window.randomHeader = randomHeader;

// Call by default with an empty prefix
randomHeader();