const TRIGGER_WORDS = ["barrelroll"]; // Add your specific words here

document.addEventListener('keyup', function(e) {
    if (e.target.isContentEditable || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const typedText = e.target.value || e.target.textContent;
        if (TRIGGER_WORDS.some(word => typedText.toLowerCase().includes(word.toLowerCase()))) {
            const style = document.createElement('style');
            style.id = 'hell-animation-style';
            style.textContent = `
                #ca-everything {
                    animation: hell 1.5s ease-in-out;
                }
                
                @keyframes hell {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
});