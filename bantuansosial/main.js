// Script untuk membuat partikel bercahaya secara dinamis
document.addEventListener('DOMContentLoaded', function() {
    const particleContainer = document.getElementById('particle-container');
    if (particleContainer) {
        const particleCount = 60; // Jumlah partikel bisa disesuaikan
        for (let i = 0; i < particleCount; i++) {
            let particle = document.createElement('div');
            particle.classList.add('particle');
            
            const size = Math.random() * 4 + 1; // Ukuran partikel lebih kecil
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            
            const duration = Math.random() * 20 + 10; // Durasi animasi
            particle.style.animationDuration = `${duration}s`;
            
            const delay = Math.random() * 15; // Delay agar tidak mulai bersamaan
            particle.style.animationDelay = `${delay}s`;
            
            particleContainer.appendChild(particle);
        }
    }
});
