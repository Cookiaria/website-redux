// -------------------------------------------------------------
// Wavy Rainbow Text
// -------------------------------------------------------------

function initializeWavyRainbowText() {
    document.querySelectorAll('.ca-wavy-rainbow').forEach(parentEl => {
        const text = parentEl.textContent.trim();
        parentEl.innerHTML = '';

        const phases = [];
        const colors = [
            '#fe7e6f', '#fec46f', '#fffa6f', '#ddff6f', '#91ff6f',
            '#6eff73', '#6fffef', '#6ea9fe', '#dc6eff', '#ff6efa',
            '#fe6fc3', '#fe7e6f' 
        ];

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

        function hexToRgb(hex) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        }

        function rgbToHex(rgb) {
            return `#${rgb.map(x => x.toString(16).padStart(2, '0')).join('')}`;
        }

        function interpolateColor(color1, color2, factor) {
            if (factor <= 0) return color1;
            if (factor >= 1) return color2;
            
            const result = color1.slice();
            for (let i = 0; i < 3; i++) {
                result[i] = Math.round(result[i] + factor * (color2[i] - result[i]));
            }
            return result;
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
    });
}

document.addEventListener('DOMContentLoaded', initializeWavyRainbowText);
window.initializeWavyRainbowText = initializeWavyRainbowText;

// ----------------------------------------------------
// rainbow Text
// ----------------------------------------------------

function initializeRainbowText() {
    document.querySelectorAll('.ca-rainbow').forEach(parentEl => {
        const text = parentEl.textContent.trim();
        parentEl.innerHTML = '';

        const colors = [
            '#fe7e6f', '#fec46f', '#fffa6f', '#ddff6f', '#91ff6f',
            '#6eff73', '#6fffef', '#6ea9fe', '#dc6eff', '#ff6efa',
            '#fe6fc3', '#fe7e6f' 
        ];

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
                
                const colorCount = colors.length - 1; // -1 because last color is literally the same thing
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
    });
}

document.addEventListener('DOMContentLoaded', initializeRainbowText);
window.initializeRainbowText = initializeRainbowText;

// ----------------------------------------------------
// Wavy Text
// ----------------------------------------------------

function initializeWavyText() {
    document.querySelectorAll('.ca-wavy').forEach(parentEl => {
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
    });
}

document.addEventListener('DOMContentLoaded', initializeWavyText);
window.initializeWavyText = initializeWavyText;

// ----------------------------------------------------
// shaky text
// ----------------------------------------------------

// soon...