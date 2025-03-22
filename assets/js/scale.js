function adjustMainScale() {
    const mainElement = document.querySelector('main');
    const container = document.querySelector('#ca-everything');
    const minWidth = 420; 
    const maxWidth = 820; 
    
    const viewportWidth = window.innerWidth;
    
    mainElement.style.transform = '';
    mainElement.style.transformOrigin = 'center top';
    
    if (viewportWidth < minWidth) {
        const scale = viewportWidth / minWidth;
        mainElement.style.transform = `scale(${scale})`;
    }
    else if (viewportWidth > maxWidth) {
        mainElement.style.width = `${maxWidth}px`;
    }
    else {
        mainElement.style.width = '100%';
    }
}

window.addEventListener('resize', adjustMainScale);
window.addEventListener('load', adjustMainScale);