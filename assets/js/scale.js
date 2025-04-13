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

    mainElement.style.transform = '';
    mainElement.style.transformOrigin = 'center top';

    if (viewportWidth < minWidth) {
        const scale = viewportWidth / minWidth;
        mainElement.style.transform = `scale(${scale})`;
        mainElement.style.width = `${minWidth}px`; // Ensure we're scaling from minWidth
    } else if (viewportWidth > entireWidth) {
        mainElement.style.width = `${entireWidth}px`;
    } else {
        mainElement.style.width = '100%';
    }
}

// Attach event listeners for resize and load events
window.addEventListener('resize', adjustMainScale);
window.addEventListener('load', adjustMainScale);