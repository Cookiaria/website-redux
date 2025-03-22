document.querySelectorAll('.ca-text-wavy').forEach(el => {
    let text = el.textContent;
    el.innerHTML = ''; 

    text.split('').forEach((char, index) => {
        let span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char; 
        span.style.animationDelay = `${index * 0.05}s`;
        el.appendChild(span);
    });
});
