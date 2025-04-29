function checkAndInitialize() {
    const wavyElements = document.querySelectorAll('.ca-wavy:not(.ca-initialized)');
    const rainbowElements = document.querySelectorAll('.ca-rainbow:not(.ca-initialized)');

    if (wavyElements.length > 0) {
        initializeWavyText(wavyElements);
    }
    if (rainbowElements.length > 0) {
        initializeRainbowText(rainbowElements);
    }
}

function initializeRainbowText(elements) {
    elements.forEach(parentEl => {
        const text = parentEl.textContent.trim();
        parentEl.innerHTML = '';

        const gradient = getComputedStyle(parentEl)
            .getPropertyValue('rainbow-gradient')

        const colors = getComputedStyle(parentEl)
            .getPropertyValue('--rainbow-color-list')
            .trim()
            .split(',')
            .map(color => color.trim());

        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            parentEl.appendChild(span);
        });

        let startTime = null;

        function interpolateColor(color1, color2, factor) {
            if (factor <= 0) return color1;
            if (factor >= 1) return color2;
            const result = color1.slice();
            for (let i = 0; i < 3; i++) {
                result[i] = Math.round(result[i] + factor * (color2[i] - result[i]));
            }
            return result;
        }

        function hexToRgb(hex) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        }

        function rgbToHex(rgb) {
            return `#${rgb.map(x => x.toString(16).padStart(2, '0')).join('')}`;
        }

        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsedTime = timestamp - startTime;

            Array.from(parentEl.children).forEach((span, index) => {
                const position = ((elapsedTime / 1000) * 0.5 + index * 0.05) % 1;
                const colorCount = colors.length - 1;
                const colorPosition = position * colorCount;
                const colorIndex1 = Math.floor(colorPosition);
                const colorIndex2 = colorIndex1 + 1;
                const factor = colorPosition - colorIndex1;
                
                const rgb1 = hexToRgb(colors[colorIndex1]);
                const rgb2 = hexToRgb(colors[colorIndex2]);
                const interpolatedRgb = interpolateColor(rgb1, rgb2, factor);
                span.style.color = rgbToHex(interpolatedRgb);
            });

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
        parentEl.classList.add('ca-initialized');
    });
}

function initializeWavyText(elements) {
    elements.forEach(parentEl => {
        const text = parentEl.textContent.trim();
        parentEl.innerHTML = '';

        const phases = [];

        text.split('').forEach((char, index) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            parentEl.appendChild(span);
            phases.push((index * Math.PI) / 8); 
        });

        const amplitude = 0.08;
        const frequency = 2;

        function easingFormula(t) {
            const wave = Math.sin(Math.PI * t * 2) * 0.08;
            return -(Math.cos(Math.PI * t) - 1) / 2 + wave;
        }

        let startTime = null;

        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsedTime = timestamp - startTime;
            const angle = (elapsedTime / 1000) * frequency * Math.PI * 2;

            Array.from(parentEl.children).forEach((span, index) => {
                const phase = phases[index];
                const rawWave = Math.sin(angle + phase);
                const easedWave = easingFormula((rawWave + 1) / 2) * 2 - 1;
                const translateY = amplitude * easedWave;
                span.style.transform = `translateY(${translateY}em)`;
            });

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
        parentEl.classList.add('ca-initialized');
    });
}

const observer = new MutationObserver((mutations) => {
    checkAndInitialize();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

checkAndInitialize();

window.initializeRainbowText = initializeRainbowText;
window.initializeWavyText = initializeWavyText;