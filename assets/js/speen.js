function creatureSpeen() {
    let rotation = 0;
    let speed = 10;
    document.querySelector("#speen").addEventListener("click", function () {
        rotation += 360;

        this.style.transition = `transform ${speed}s cubic-bezier(0.25, 1, 0.5, 1)`;
        this.style.transform = `rotate(${rotation}deg)`;

        speed = Math.min(speed + 0.1, 8)
    })
}

document.addEventListener('DOMContentLoaded', creatureSpeen);
window.creatureSpeen = creatureSpeen;