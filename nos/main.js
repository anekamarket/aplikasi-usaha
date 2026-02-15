'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // --- KONSTANTA & VARIABEL GLOBAL ---
    const WHATSAPP_NUMBER = '6285647709114'; // Nomor WA Driver/Admin
    const bgMusic = document.getElementById('bgMusic');
    const buttonSound = document.getElementById('buttonSound');
    let isMusicPlaying = false;
    let userInteracted = false;
    
    // Variabel untuk menyimpan data lokasi
    let pickupCoords = null;
    let destinationCoords = null;
    let calculatedDistance = null;
    let map, pickupMarker;


    // --- INISIALISASI ---
    initNavbar();
    initMobileMenu();
    initParticles();
    initMap();
    initOrderForm();
    initDriverOrderButtons();
    initRegistrationForm();
    initContactForm();
    initNewsletterForm();
    initAudio();
    initSmoothScroll();

    // --- FUNGSI-FUNGSI ---
    
    function initNavbar() {
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    function initMobileMenu() {
        const menuToggle = document.getElementById('mobileMenuToggle');
        const navLinks = document.getElementById('navLinks');
        const menuIcon = menuToggle.querySelector('i');

        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            menuIcon.className = navLinks.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
            playButtonSound();
        });
        
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target)) {
                 navLinks.classList.remove('active');
                 menuIcon.className = 'fas fa-bars';
            }
        });
        navLinks.addEventListener('click', () => {
             navLinks.classList.remove('active');
             menuIcon.className = 'fas fa-bars';
        });
    }

    function initParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;
        
        const particleCount = window.innerWidth < 768 ? 20 : 40;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            const size = Math.random() * 6 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            const duration = Math.random() * 15 + 15;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${Math.random() * 10}s`;
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            particlesContainer.appendChild(particle);
        }
    }

    function initMap() {
        try {
            const situbondoCoords = [-7.7058, 113.9947];
            map = L.map('map').setView(situbondoCoords, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);
            L.marker(situbondoCoords).addTo(map).bindPopup('Pusat Operasi NOS Situbondo').openPopup();
        } catch (e) {
            console.error("Gagal memuat peta Leaflet:", e);
            document.getElementById('map').innerHTML = '<p style="text-align:center; padding-top: 50px;">Peta tidak dapat dimuat. Mohon masukkan lokasi secara manual.</p>';
        }
    }

    function initOrderForm() {
        const form = document.getElementById('orderForm');
        const steps = form.querySelectorAll('.form-step');
        const progressSteps = document.querySelectorAll('.progress-step');
        const currentLocationBtn = document.getElementById('currentLocationBtn');

        currentLocationBtn.addEventListener('click', getUserLocation);

        form.addEventListener('click', async e => {
            if (e.target.matches('[data-next]')) {
                const nextButton = e.target;
                const currentStep = nextButton.closest('.form-step');
                
                nextButton.disabled = true;
                nextButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

                const validationResult = await validateAndProcessStep1(currentStep);
                if (validationResult) {
                    navigateToStep(parseInt(nextButton.dataset.next));
                }
                
                nextButton.disabled = false;
                nextButton.innerHTML = '<i class="fas fa-arrow-right"></i> Lanjut';

            } else if (e.target.matches('[data-back]')) {
                navigateToStep(parseInt(e.target.dataset.back));
            }
        });
        
        form.querySelectorAll('.vehicle-option').forEach(opt => {
            opt.addEventListener('click', function() {
                form.querySelectorAll('.vehicle-option').forEach(el => el.classList.remove('selected'));
                this.classList.add('selected');
                form.querySelector('#selectedVehicle').value = this.dataset.value;
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateStep(form.querySelector('.form-step[data-step="2"]'))) {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                const pickupCoordsArray = data.pickupCoords.split(',');
                
                const googleMapsLink = `https://maps.google.com/?q=${pickupCoordsArray[0]},${pickupCoordsArray[1]}`;

                let message = `*PESANAN BARU NOS*\n\n` +
                    `*Nama:* ${data.name}\n` +
                    `*No. WhatsApp:* ${data.phone}\n` +
                    `*Lokasi Jemput:* ${data.pickupLocation}\n` +
                    `*Tujuan:* ${data.destination}\n` +
                    `*Kendaraan:* ${data.selectedVehicle}\n\n` +
                    `*Estimasi Jarak:* ${data.distance || 'Tidak terhitung'}\n` +
                    `*Titik Jemput (Google Maps):*\n${googleMapsLink}\n\n` +
                    `*Catatan:* ${data.notes || '-'}`;

                sendWhatsAppMessage(message);
                navigateToStep(3);
            }
        });

        document.getElementById('newOrderBtn').addEventListener('click', () => {
            form.reset();
            pickupCoords = null;
            destinationCoords = null;
            calculatedDistance = null;
            form.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
            navigateToStep(1);
        });

        function navigateToStep(stepNumber) {
            steps.forEach(step => step.classList.toggle('active', parseInt(step.dataset.step) === stepNumber));
            progressSteps.forEach((step, index) => {
                step.classList.remove('active', 'completed');
                if (index < stepNumber - 1) step.classList.add('completed');
                if (index === stepNumber - 1) step.classList.add('active');
            });
            playButtonSound();
        }
    }

    function initDriverOrderButtons() {
        document.querySelectorAll('.order-btn').forEach(button => {
            button.addEventListener('click', function() {
                if (this.disabled) return;
                const driverInfo = this.dataset.driver;
                const message = `Halo NOS, saya ingin memesan ojek dengan driver *${driverInfo}*. Mohon info ketersediaannya.`;
                sendWhatsAppMessage(message);
            });
        });
    }
    
    function initRegistrationForm() {
        const form = document.getElementById('driverRegistrationForm');
        
        form.querySelectorAll('.option-group').forEach(group => {
            group.addEventListener('click', (e) => {
                if(e.target.classList.contains('option-btn')) {
                    const hiddenInputId = group.dataset.for;
                    const hiddenInput = document.getElementById(hiddenInputId);
                    
                    group.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
                    e.target.classList.add('selected');
                    hiddenInput.value = e.target.dataset.value;
                    
                    document.querySelectorAll(`.conditional-field[data-condition="${hiddenInputId}"]`).forEach(field => {
                        field.classList.toggle('active', field.dataset.conditionValue === hiddenInput.value);
                    });
                     playButtonSound();
                }
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateForm(form)) {
                const formData = new FormData(form);
                let message = `*PENDAFTARAN DRIVER BARU NOS*\n\n`;
                formData.forEach((value, key) => {
                    message += `*${key}:* ${value}\n`;
                });
                sendWhatsAppMessage(message);
                alert('Pendaftaran Anda akan diproses. Terima kasih!');
                form.reset();
                form.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
                form.querySelectorAll('.conditional-field.active').forEach(el => el.classList.remove('active'));
            }
        });
    }

    function initContactForm() {
        const form = document.getElementById('contactForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateForm(form)) {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                const message = `*Pesan dari Website NOS*\n\n` +
                                `*Nama:* ${data.Nama}\n` +
                                `*Pesan:* ${data.Pesan}`;
                sendWhatsAppMessage(message);
                 alert('Pesan Anda telah terkirim via WhatsApp. Terima kasih!');
                form.reset();
            }
        });
    }

    function initNewsletterForm() {
         const form = document.getElementById('newsletterForm');
         form.addEventListener('submit', (e) => {
            e.preventDefault();
            if(validateForm(form)) {
                const email = form.querySelector('input[type="email"]').value;
                const message = `*Berlangganan Newsletter NOS*\n\nEmail: ${email}`;
                sendWhatsAppMessage(message);
                alert('Terima kasih telah berlangganan!');
                form.reset();
            }
         });
    }

    function initAudio() {
        bgMusic.volume = 0.3;
        document.body.addEventListener('click', handleFirstInteraction, { once: true });
        document.body.addEventListener('scroll', handleFirstInteraction, { once: true });
    }
    
    function handleFirstInteraction() {
        if (userInteracted) return;
        userInteracted = true;
        if (bgMusic.paused && !isMusicPlaying) {
            bgMusic.play().then(() => { isMusicPlaying = true; }).catch(e => console.log("Autoplay musik dicegah oleh browser."));
        }
    }

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href !== '#' && href.startsWith('#')) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        const offsetTop = target.offsetTop - 80;
                        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                    }
                }
            });
        });
    }

    // --- FUNGSI HELPER & GPS ---

    function getUserLocation() {
        const btn = document.getElementById('currentLocationBtn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mencari...';

        if (!navigator.geolocation) {
            alert('Geolocation tidak didukung oleh browser Anda.');
            btn.disabled = false;
            btn.innerHTML = originalText;
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                pickupCoords = { lat: latitude, lon: longitude };
                
                document.getElementById('pickupCoords').value = `${latitude},${longitude}`;
                
                if(map) {
                    map.setView([latitude, longitude], 16);
                    if (pickupMarker) map.removeLayer(pickupMarker);
                    pickupMarker = L.marker([latitude, longitude]).addTo(map).bindPopup('Lokasi Jemput Anda').openPopup();
                }
                
                try {
                    const address = await reverseGeocode(latitude, longitude);
                    document.getElementById('pickupLocation').value = address;
                } catch (error) {
                    console.error('Error reverse geocoding:', error);
                    alert('Gagal mendapatkan nama alamat dari lokasi Anda. Silakan isi manual.');
                } finally {
                     btn.disabled = false;
                     btn.innerHTML = originalText;
                }
            },
            (error) => {
                let message = 'Gagal mendapatkan lokasi Anda. ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        message += "Anda menolak permintaan izin lokasi.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += "Informasi lokasi tidak tersedia.";
                        break;
                    case error.TIMEOUT:
                        message += "Permintaan lokasi timed out.";
                        break;
                    default:
                        message += "Terjadi kesalahan tidak diketahui.";
                        break;
                }
                alert(message);
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        );
    }

    async function reverseGeocode(lat, lon) {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();
        return data.display_name || 'Alamat tidak ditemukan';
    }

    async function geocodeAddress(address) {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=id`; // Prioritaskan Indonesia
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();
        if (data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        throw new Error('Alamat tidak ditemukan.');
    }
    
    function haversineDistance(coords1, coords2) {
        function toRad(x) {
            return x * Math.PI / 180;
        }

        const R = 6371; // km
        const dLat = toRad(coords2.lat - coords1.lat);
        const dLon = toRad(coords2.lon - coords1.lon);
        const lat1 = toRad(coords1.lat);
        const lat2 = toRad(coords2.lat);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return d.toFixed(2) + ' km'; // Jarak dalam km dengan 2 desimal
    }

    async function validateAndProcessStep1(step) {
        if (!validateStep(step)) return false;

        const pickupInput = document.getElementById('pickupLocation');
        const destinationInput = document.getElementById('destination');

        try {
            // Jika koordinat penjemputan belum ada (pengguna input manual), geocode alamatnya
            if (!pickupCoords || document.getElementById('pickupCoords').value === '') {
                pickupCoords = await geocodeAddress(pickupInput.value);
                 document.getElementById('pickupCoords').value = `${pickupCoords.lat},${pickupCoords.lon}`;
            }
            
            // Geocode alamat tujuan
            destinationCoords = await geocodeAddress(destinationInput.value);

            // Hitung jarak
            calculatedDistance = haversineDistance(pickupCoords, destinationCoords);
            document.getElementById('distance').value = calculatedDistance;
            
            return true; // Semua berhasil
        } catch (error) {
            alert(`Validasi alamat gagal: ${error.message}. Mohon periksa kembali alamat penjemputan dan tujuan.`);
            return false; // Ada yang gagal
        }
    }
    
    function validateStep(step) {
        const fields = step.querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        fields.forEach(field => {
            const associatedLabel = field.closest('.form-group')?.querySelector('label');
            if (!field.value.trim() || (field.type === 'hidden' && !field.value) || (field.type === 'tel' && !field.checkValidity())) {
                field.classList.add('invalid');
                if (associatedLabel) associatedLabel.style.color = 'var(--danger)';
                isValid = false;
            } else {
                field.classList.remove('invalid');
                if (associatedLabel) associatedLabel.style.color = '';
            }
        });
        if (!isValid) alert('Mohon isi semua kolom yang ditandai * dengan benar.');
        return isValid;
    }

    function validateForm(form) {
        const fields = form.querySelectorAll('input[required], textarea[required]');
         let isValid = true;
         fields.forEach(field => {
            field.classList.remove('invalid');
            if (!field.value.trim()) {
                field.classList.add('invalid');
                isValid = false;
            }
        });
         if (!isValid) alert('Mohon isi semua kolom yang ditandai *.');
         return isValid;
    }

    function sendWhatsAppMessage(message) {
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
        window.open(url, '_blank');
        playButtonSound();
    }

    function playButtonSound() {
        buttonSound.currentTime = 0;
        buttonSound.play().catch(e => {});
    }
});
