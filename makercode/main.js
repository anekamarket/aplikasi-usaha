document.addEventListener('DOMContentLoaded', () => {
    let qrCodeInstance = null;
    let uploadedLogo = null;
    let activeTab = 'url';
    const defaultLogo = "https://raw.githubusercontent.com/anekamarket/my.id/refs/heads/main/logo-anekamarket.png";

    // Inisialisasi tsParticles
    tsParticles.load("particles-js", {
        fpsLimit: 60,
        interactivity: {
            events: {
                onHover: { enable: true, mode: "repulse" },
                resize: true
            },
            modes: { repulse: { distance: 100, duration: 0.4 } }
        },
        particles: {
            color: { value: "#ffffff" },
            links: {
                color: "#ffffff",
                distance: 150,
                enable: true,
                opacity: 0.2,
                width: 1
            },
            move: {
                direction: "none",
                enable: true,
                outModes: { default: "bounce" },
                random: false,
                speed: 2,
                straight: false
            },
            number: { density: { enable: true, area: 800 }, value: 80 },
            opacity: { value: 0.3 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 5 } }
        },
        detectRetina: true
    });

    // Helper untuk mengambil elemen
    const getEl = (id) => document.getElementById(id);

    // Elemen UI
    const generateBtn = getEl('generate-btn');
    const downloadBtn = getEl('download-btn');
    const messageBox = getEl('message-box');
    const presentationFrame = getEl('presentation-frame');
    const qrCodeDisplayFrame = getEl('qr-code-display-frame');
    const frameFooterUrl = getEl('frame-footer-url');
    const dotStyleSelector = getEl('dot-style-select');
    const cornerSquareStyleSelector = getEl('corner-square-style-select');
    const cornerDotStyleSelector = getEl('corner-dot-style-select');
    const frameDesignSelector = getEl('frame-design-select');
    const logoUploadInput = getEl('logo-upload');
    const colorModeSelector = getEl('color-mode-select');
    const colorStartInput = getEl('color-start');
    const colorStartHexInput = getEl('color-start-hex');
    const colorStartLabel = getEl('color-start-label');
    const colorEndInput = getEl('color-end');
    const colorEndHexInput = getEl('color-end-hex');
    const colorEndGroup = getEl('color-end-group');
    const gradientOptions = getEl('gradient-options');
    const gradientTypeSelector = getEl('gradient-type-select');
    const gradientRotationInput = getEl('gradient-rotation');
    const frameStyleSelector = getEl('frame-style-select');
    const frameColorControl = getEl('frame-color-control');
    const frameColorInput = getEl('frame-color');
    const frameColorHexInput = getEl('frame-color-hex');
    const frameColorLabel = getEl('frame-color-label');
    const frameColor2Control = getEl('frame-color-2-control');
    const frameColor2Input = getEl('frame-color-2');
    const frameColor2HexInput = getEl('frame-color-2-hex');
    const frameColor2Label = getEl('frame-color-2-label');
    const frameColorInnerControl = getEl('frame-color-inner-control');
    const frameColorInnerInput = getEl('frame-color-inner');
    const frameColorInnerHexInput = getEl('frame-color-inner-hex');
    const frameCtaControl = getEl('frame-cta-control');
    const frameCtaTextInput = getEl('frame-cta-text');
    const frameWidthControl = getEl('frame-width-control');
    const frameWidthInput = getEl('frame-width');
    const frameWidthValue = getEl('frame-width-value');
    const qrSizeControl = getEl('qr-size-control');
    const qrSizeInput = getEl('qr-size');
    const qrSizeValue = getEl('qr-size-value');
    const logoSizeInput = getEl('logo-size');
    const logoSizeValue = getEl('logo-size-value');

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        activeTab = button.dataset.tab;
        document.querySelectorAll('.data-input-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${activeTab}`);
        });
    }));

    // Daftar hitam URL
    const forbiddenCategories = {
        "Konten Judi Online": ['judi', 'slot', 'poker', 'casino', 'togel', 'sbo', 'bet', 'sbobet'],
        "Konten Dewasa/Pornografi": ['porn', 'sex', 'xxx', 'bokep', 'adult', 'nude', 'bugil'],
        "Penipuan (Scam/Phishing)": ['scam', 'phishing', 'tipu', 'penipuan', 'giveaway', 'hadiah gratis'],
        "Malware/Virus Berbahaya": ['malware', 'virus', 'trojan', 'ransomware', 'spyware']
    };

    const checkUrlSafety = url => {
        const lowerCaseUrl = url.toLowerCase();
        for (const category in forbiddenCategories) {
            for (const keyword of forbiddenCategories[category]) {
                if (lowerCaseUrl.includes(keyword)) return { safe: false, category, keyword };
            }
        }
        return { safe: true };
    };

    const displayMessage = (type, title, text) => {
        messageBox.style.display = 'block';
        messageBox.className = `message-box ${type}`;
        messageBox.innerHTML = `<strong>${title}</strong><br>${text}`;
    };

    // Sinkronisasi input color & text
    const syncColorInputs = (colorPicker, hexInput) => {
        hexInput.addEventListener('input', e => {
            let hex = e.target.value.toUpperCase();
            if (!hex.startsWith('#')) hex = '#' + hex;
            if (/^#([0-9A-F]{3}){1,2}$/i.test(hex)) colorPicker.value = hex;
        });
        colorPicker.addEventListener('input', e => {
            hexInput.value = e.target.value.toUpperCase();
        });
    };

    syncColorInputs(colorStartInput, colorStartHexInput);
    syncColorInputs(colorEndInput, colorEndHexInput);
    syncColorInputs(frameColorInput, frameColorHexInput);
    syncColorInputs(frameColor2Input, frameColor2HexInput);
    syncColorInputs(frameColorInnerInput, frameColorInnerHexInput);

    // Smart warning untuk dot style
    const checkSmartWarning = () => {
        getEl('dot-style-warning').style.display = (dotStyleSelector.value === 'dots' && colorModeSelector.value === 'gradient') ? 'block' : 'none';
    };

    colorModeSelector.addEventListener('change', () => {
        const isGradient = colorModeSelector.value === 'gradient';
        gradientOptions.classList.toggle('is-hidden', !isGradient);
        colorEndGroup.classList.toggle('is-hidden', !isGradient);
        colorStartLabel.textContent = isGradient ? 'Warna Awal Gradien' : 'Warna Titik';
        checkSmartWarning();
    });

    dotStyleSelector.addEventListener('change', checkSmartWarning);

    // Slider display
    frameWidthInput.addEventListener('input', e => frameWidthValue.textContent = e.target.value);
    qrSizeInput.addEventListener('input', e => qrSizeValue.textContent = e.target.value);
    logoSizeInput.addEventListener('input', e => logoSizeValue.textContent = e.target.value);

    // Upload logo
    logoUploadInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => uploadedLogo = e.target.result;
            reader.readAsDataURL(e.target.files[0]);
        } else {
            uploadedLogo = null;
        }
    });

    // Update kontrol frame sesuai gaya
    const updateFrameControls = () => {
        const style = frameStyleSelector.value;
        const controls = { frameColorControl, frameColor2Control, frameColorInnerControl, frameCtaControl, frameWidthControl, qrSizeControl };
        Object.values(controls).forEach(c => c.classList.add('is-hidden'));

        const showCommonControls = () => {
            controls.frameWidthControl.classList.remove('is-hidden');
            controls.qrSizeControl.classList.remove('is-hidden');
        };

        if (style === 'plain' || style === 'rounded-square' || style === 'cutout-circle') {
            frameColorLabel.textContent = 'Warna Bingkai';
            controls.frameColorControl.classList.remove('is-hidden');
            showCommonControls();
        } else if (style === 'gradient-text' || style === 'badge') {
            frameColorLabel.textContent = 'Warna Gradien 1';
            controls.frameColorControl.classList.remove('is-hidden');
            controls.frameColor2Control.classList.remove('is-hidden');
            controls.frameCtaControl.classList.remove('is-hidden');
            showCommonControls();
        } else if (style === 'circle-elegant') {
            frameColorLabel.textContent = 'Warna Lingkaran';
            controls.frameColorControl.classList.remove('is-hidden');
            controls.frameColorInnerControl.classList.remove('is-hidden');
            showCommonControls();
        } else if (style === 'gradient-ring') {
            frameColorLabel.textContent = 'Warna Cincin 1';
            controls.frameColorControl.classList.remove('is-hidden');
            controls.frameColor2Control.classList.remove('is-hidden');
            controls.frameColorInnerControl.classList.remove('is-hidden');
            showCommonControls();
        } else if (style === 'double-border') {
            frameColorLabel.textContent = 'Warna Batas Luar';
            frameColor2Label.textContent = 'Warna Batas Dalam';
            controls.frameColorControl.classList.remove('is-hidden');
            controls.frameColor2Control.classList.remove('is-hidden');
            controls.frameColorInnerControl.classList.remove('is-hidden');
            showCommonControls();
        } else if (style === 'brushed-metal') {
            showCommonControls();
        } else if (style === 'ribbon-corner') {
            frameColorLabel.textContent = 'Warna Latar';
            frameColor2Label.textContent = 'Warna Pita';
            controls.frameColorControl.classList.remove('is-hidden');
            controls.frameColor2Control.classList.remove('is-hidden');
            controls.frameCtaControl.classList.remove('is-hidden');
            showCommonControls();
        }
    };

    frameStyleSelector.addEventListener('change', updateFrameControls);
    updateFrameControls();

    // Membangun struktur frame
    const buildFrameStructure = (targetElement, isDownload = false) => {
        targetElement.innerHTML = '';
        const style = frameStyleSelector.value;
        targetElement.className = `frame-style-${style}`;

        targetElement.style.setProperty('--frame-color', frameColorInput.value);
        targetElement.style.setProperty('--frame-color-2', frameColor2Input.value);
        targetElement.style.setProperty('--frame-color-inner', frameColorInnerInput.value);
        targetElement.style.setProperty('--frame-width', `${frameWidthInput.value}px`);

        if (style === 'ribbon-corner') {
            targetElement.setAttribute('data-cta-text', frameCtaTextInput.value);
        }

        let qrHolder;

        if (style.includes('circle') || style.includes('ring')) {
            const innerBg = document.createElement('div');
            innerBg.className = 'qr-inner-background';
            qrHolder = document.createElement('div');
            qrHolder.id = 'qr-code-holder';
            innerBg.appendChild(qrHolder);
            targetElement.appendChild(innerBg);
            if (isDownload) {
                targetElement.style.width = '1200px';
                targetElement.style.height = '1200px';
            }
        } else if (style === 'gradient-text' || style === 'badge') {
            qrHolder = document.createElement('div');
            qrHolder.id = 'qr-code-holder';
            const cta = document.createElement('div');
            cta.className = 'frame-call-to-action';
            cta.textContent = frameCtaTextInput.value;
            targetElement.appendChild(qrHolder);
            targetElement.appendChild(cta);
        } else {
            qrHolder = document.createElement('div');
            qrHolder.id = 'qr-code-holder';
            targetElement.appendChild(qrHolder);
        }

        return qrHolder;
    };

    // Mengambil data dari tab aktif
    const getQrData = () => {
        let data = '', displayData = '', isValid = true;
        const url = getEl('url-input').value.trim();
        const text = getEl('text-input').value;
        const ssid = getEl('wifi-ssid').value;
        const pass = getEl('wifi-pass').value;
        const enc = getEl('wifi-encryption').value;
        const to = getEl('email-to').value;
        const subj = encodeURIComponent(getEl('email-subject').value);
        const body = encodeURIComponent(getEl('email-body').value);

        switch (activeTab) {
            case 'url':
                if (!url) { isValid = false; break; }
                let finalUrl = !/^https?:\/\//i.test(url) ? 'https://' + url : url;
                const safetyCheck = checkUrlSafety(finalUrl);
                if (!safetyCheck.safe) {
                    displayMessage('error', `URL Ditolak: Terdeteksi ${safetyCheck.category}`, `Kata kunci: '${safetyCheck.keyword}'.`);
                    return null;
                }
                data = finalUrl;
                displayData = finalUrl;
                break;
            case 'text':
                if (!text) isValid = false;
                data = text;
                displayData = text.length > 50 ? text.substring(0, 47) + '...' : text;
                break;
            case 'wifi':
                if (!ssid) isValid = false;
                data = `WIFI:T:${enc};S:${ssid};P:${pass};;`;
                displayData = `Wi-Fi: ${ssid}`;
                break;
            case 'email':
                if (!to) isValid = false;
                data = `mailto:${to}?subject=${subj}&body=${body}`;
                displayData = `Email ke: ${to}`;
                break;
        }
        if (!isValid) {
            displayMessage('error', 'Input Kosong!', 'Mohon isi data yang diperlukan.');
            return null;
        }
        return { data, displayData };
    };

    // Event generate
    generateBtn.addEventListener('click', () => {
        presentationFrame.style.display = 'none';
        messageBox.style.display = 'none';
        downloadBtn.style.display = 'none';

        const qrInput = getQrData();
        if (!qrInput) return;

        const colorOptions = colorModeSelector.value === 'solid'
            ? { color: colorStartInput.value }
            : {
                gradient: {
                    type: gradientTypeSelector.value,
                    rotation: gradientRotationInput.value * (Math.PI / 180),
                    colorStops: [
                        { offset: 0, color: colorStartInput.value },
                        { offset: 1, color: colorEndInput.value }
                    ]
                }
            };

        const logoSize = parseInt(logoSizeInput.value, 10) / 100;

        try {
            const sharedOptions = {
                data: qrInput.data,
                image: uploadedLogo || defaultLogo,
                backgroundOptions: { color: "transparent" },
                imageOptions: { crossOrigin: "anonymous", imageSize: logoSize, margin: 5 },
                dotsOptions: { type: dotStyleSelector.value, ...colorOptions },
                cornersSquareOptions: { type: cornerSquareStyleSelector.value, ...colorOptions },
                cornersDotOptions: { type: cornerDotStyleSelector.value, ...colorOptions }
            };

            const qrHolder = buildFrameStructure(qrCodeDisplayFrame, false);

            // Hitung ukuran QR dinamis dengan skala
            let baseQrSize;
            const selectedStyle = frameStyleSelector.value;
            const framePadding = parseInt(frameWidthInput.value, 10);
            const qrScale = parseInt(qrSizeInput.value, 10) / 100;
            const containerSize = 350;

            if (selectedStyle.includes('circle') || selectedStyle.includes('ring')) {
                const innerPadding = 15;
                baseQrSize = containerSize - (framePadding * 2) - (innerPadding * 2);
            } else {
                baseQrSize = containerSize - (framePadding * 2);
            }

            let qrSize = baseQrSize * qrScale;
            qrSize = Math.max(qrSize, 50);

            const displayQrInstance = new QRCodeStyling({ ...sharedOptions, width: qrSize, height: qrSize, margin: 0 });
            displayQrInstance.append(qrHolder);

            // Instance untuk download ukuran besar
            qrCodeInstance = new QRCodeStyling({ ...sharedOptions, width: 900, height: 900, margin: 0 });

            presentationFrame.className = frameDesignSelector.value;
            frameFooterUrl.textContent = qrInput.displayData;
            presentationFrame.style.display = 'block';
            downloadBtn.style.display = 'inline-flex';

        } catch (error) {
            displayMessage('error', 'Terjadi Kesalahan', 'Gagal membuat QR Code. Pastikan format input benar.');
            console.error("QR Code Generation Error:", error);
        }
    });

    // Event download
    downloadBtn.addEventListener('click', () => {
        if (!qrCodeInstance) return;

        const downloadWrapper = document.createElement('div');
        downloadWrapper.style.position = 'absolute';
        downloadWrapper.style.left = '-9999px';

        const downloadFrameSize = 1000;
        downloadWrapper.style.width = `${downloadFrameSize}px`;
        if (frameStyleSelector.value.includes('circle') || frameStyleSelector.value.includes('ring')) {
            downloadWrapper.style.height = `${downloadFrameSize}px`;
        }

        const qrHolder = buildFrameStructure(downloadWrapper, true);
        qrCodeInstance.append(qrHolder);
        document.body.appendChild(downloadWrapper);

        setTimeout(() => {
            html2canvas(downloadWrapper, { backgroundColor: null, scale: 2 }).then(canvas => {
                const link = document.createElement('a');
                link.download = `qr-code-pro-${Date.now()}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
                document.body.removeChild(downloadWrapper);
            }).catch(error => {
                displayMessage('error', 'Gagal Mengunduh', 'Terjadi kesalahan saat membuat file gambar.');
                console.error("Download Error:", error);
                document.body.removeChild(downloadWrapper);
            });
        }, 500);
    });
});
