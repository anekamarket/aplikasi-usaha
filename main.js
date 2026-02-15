// main.js
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi AOS
    AOS.init({ duration: 800, once: true, offset: 100 });

    // --- ELEMEN DOM ---
    const header = document.getElementById('main-header');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const productSelect = document.getElementById('jenis-produk');
    const eventSection = document.getElementById('event-details-section');
    const btnPesanWeb = document.getElementById('btn-pesan-web');
    const productButtons = document.querySelectorAll('.product-card-btn');
    const webDomainSelect = document.getElementById('web-domain-type');
    const webInputName = document.getElementById('web-input-name');
    const btnCheckDomain = document.getElementById('btn-check-domain');
    const undanganTipe = document.getElementById('undangan-tipe');
    const undanganHalaman = document.getElementById('undangan-halaman');
    const undanganTekstur = document.getElementById('undangan-tekstur');
    const fotoUkuran = document.getElementById('foto-ukuran');
    const fotoKertas = document.getElementById('foto-kertas');
    const fotoEdit = document.getElementById('foto-edit');
    const idcardTipe = document.getElementById('idcard-tipe');
    const cdTipe = document.getElementById('cd-tipe');
    const jenisAcara = document.getElementById('jenis-acara');
    const btnGps = document.getElementById('btn-gps');
    const btnProcess = document.getElementById('btn-process');
    const modal = document.getElementById('invoiceModal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnSendWa = document.getElementById('btn-send-wa');
    const btnDownloadPdf = document.getElementById('btn-download-pdf');
    const qtyInput = document.getElementById('qty');
    const previewInvoiceCode = document.getElementById('preview-invoice-code');
    const domainStatusMsg = document.getElementById('domain-status-msg');
    const webFinalLink = document.getElementById('web-final-link');
    const urlPrefix = document.getElementById('url-prefix');
    const urlSuffix = document.getElementById('url-suffix');

    // --- VARIABEL GLOBAL ---
    let currentInvoiceCode = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    previewInvoiceCode.innerText = currentInvoiceCode;

    // --- FUNGSI UTILITAS ---
    const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

    function hideAllSubForms() {
        document.querySelectorAll('.sub-option-container').forEach(el => el.classList.add('hidden'));
    }

    // --- HANDLE PRODUCT CHANGE ---
    function handleProductChange() {
        hideAllSubForms();
        const val = productSelect.value;

        if (val === 'undangan') {
            document.getElementById('form-undangan').classList.remove('hidden');
            eventSection.classList.remove('hidden');
        } else if (val === 'cetak-foto') {
            document.getElementById('form-foto').classList.remove('hidden');
            eventSection.classList.add('hidden');
        } else if (val === 'id-card') {
            document.getElementById('form-idcard').classList.remove('hidden');
            eventSection.classList.add('hidden');
        } else if (val === 'cetak-cd') {
            document.getElementById('form-cd').classList.remove('hidden');
            eventSection.classList.add('hidden');
        } else if (val === 'website') {
            document.getElementById('form-website').classList.remove('hidden');
            eventSection.classList.add('hidden');
            qtyInput.value = 1;
            handleWebDomainUI();
        } else {
            document.getElementById('form-lainnya').classList.remove('hidden');
            eventSection.classList.add('hidden');
        }
        updateCalculator();
    }

    // --- HANDLE EVENT CHANGE (untuk undangan) ---
    function handleEventChange() {
        const eventType = jenisAcara.value;
        document.querySelectorAll('.event-fields').forEach(el => el.classList.add('hidden'));

        if (eventType === 'Pernikahan') {
            document.getElementById('fields-pernikahan').classList.remove('hidden');
        } else if (eventType === 'Khitanan') {
            document.getElementById('fields-khitan').classList.remove('hidden');
        } else {
            document.getElementById('fields-umum').classList.remove('hidden');
        }
    }

    // --- HANDLE WEB DOMAIN UI ---
    function handleWebDomainUI() {
        const selectedOption = webDomainSelect.options[webDomainSelect.selectedIndex];
        const ext = selectedOption.getAttribute('data-ext');

        if (ext === 'subdomain') {
            urlPrefix.textContent = 'www.aplikasiusaha.com/';
            urlSuffix.classList.add('hidden');
            urlSuffix.textContent = '';
        } else {
            urlPrefix.textContent = 'www.';
            urlSuffix.classList.remove('hidden');
            urlSuffix.textContent = ext;
        }
        updateUrlPreview();
        updateCalculator();
        resetDomainStatus();
    }

    function updateUrlPreview() {
        const nameVal = webInputName.value.trim().toLowerCase();
        const prefix = urlPrefix.textContent;
        const suffix = urlSuffix.textContent;
        webFinalLink.value = nameVal ? prefix + nameVal + suffix : '';
    }

    function resetDomainStatus() {
        webInputName.classList.remove('is-valid', 'is-invalid');
        domainStatusMsg.className = 'domain-msg hidden';
        domainStatusMsg.innerHTML = '';
        btnCheckDomain.innerHTML = '🔍 Cek Ketersediaan';
        btnCheckDomain.disabled = false;
        updateUrlPreview();
    }

    function showDomainError(input, msgContainer, btn, finalUrl, customMessage = null) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        msgContainer.classList.remove('hidden', 'success', 'info');
        msgContainer.classList.add('domain-msg', 'error');
        const message = customMessage || `Mohon maaf, domain <b>${finalUrl}</b> tidak tersedia atau sudah digunakan. Silakan pilih variasi nama lain.`;
        msgContainer.innerHTML = `
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
                <strong>Tidak Tersedia</strong><br>
                ${message}
            </div>
        `;
        btn.innerHTML = '❌ Ganti Nama';
        btn.disabled = false;
    }

    function showDomainSuccess(input, msgContainer, btn, finalUrl) {
        input.classList.add('is-valid');
        input.classList.remove('is-invalid');
        webFinalLink.style.backgroundColor = '#ecfdf5';
        webFinalLink.style.color = '#047857';
        webFinalLink.style.borderColor = '#10b981';

        msgContainer.classList.remove('hidden', 'error', 'info');
        msgContainer.classList.add('domain-msg', 'success');
        msgContainer.innerHTML = `
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
                <strong>Domain Tersedia!</strong><br>
                Kabar baik! Domain <b>${finalUrl}</b> tersedia. Segera klaim dan selesaikan pemesanan sekarang sebelum diambil orang lain!
            </div>
        `;
        btn.innerHTML = '✅ Terverifikasi';
    }

    // --- DATABASE SUBDOMAIN TERPAKAI ---
    const usedSubdomains = [
        'admin', 'www', 'mail', 'ftp', 'cpanel', 'webmail', 'blog', 'shop', 'store',
        'support', 'help', 'api', 'dev', 'test', 'staging', 'demo', 'app', 'mobile',
        'login', 'signin', 'register', 'account', 'user', 'dashboard', 'panel',
        'aneka', 'anekadigital', 'anekamarket', 'aplikasiusaha', 'jasa', 'service',
        'info', 'contact', 'about', 'team', 'career', 'jobs', 'news', 'blog',
        'forum', 'community', 'chat', 'support', 'helpdesk', 'docs', 'wiki',
        'files', 'download', 'upload', 'media', 'image', 'video', 'audio',
        'cdn', 'static', 'assets', 'img', 'js', 'css', 'font', 'lib',
        'backup', 'archive', 'old', 'legacy', 'temp', 'tmp', 'cache'
    ];

    async function checkDomainAvailability() {
        const rawName = webInputName.value.trim().toLowerCase();
        const btn = btnCheckDomain;
        const msgContainer = domainStatusMsg;
        const finalUrl = webFinalLink.value;
        const selectedOption = webDomainSelect.options[webDomainSelect.selectedIndex];
        const isSubdomain = selectedOption.getAttribute('data-ext') === 'subdomain';
        const tldExt = selectedOption.getAttribute('data-ext');

        if (rawName === '' || rawName.length < 3) {
            alert('Mohon masukkan nama website minimal 3 karakter.');
            webInputName.focus();
            return;
        }
        if (!/^[a-z0-9-]+$/.test(rawName)) {
            showDomainError(webInputName, msgContainer, btn, finalUrl, 'Nama domain hanya boleh mengandung huruf kecil, angka, dan tanda hubung (-). Tanpa spasi.');
            return;
        }

        btn.innerHTML = '⏳ Mengecek Server...';
        btn.disabled = true;

        const takenDomains = [
            'google', 'facebook', 'youtube', 'twitter', 'instagram', 'tiktok', 'linkedin', 'whatsapp',
            'amazon', 'apple', 'microsoft', 'netflix', 'spotify', 'zoom', 'gojek', 'grab', 'shopee',
            'tokopedia', 'bukalapak', 'lazada', 'blibli', 'traveloka', 'tiket', 'dana', 'ovo', 'gopay',
            'kompas', 'detik', 'tribun', 'cnn', 'bca', 'bri', 'mandiri', 'bni', 'telkomsel', 'indosat',
            'admin', 'administrator', 'root', 'support', 'info', 'contact', 'help', 'api', 'dev', 'test',
            'demo', 'beta', 'staging', 'mail', 'webmail', 'server', 'system', 'cpanel', 'plesk',
            'indonesia', 'jakarta', 'surabaya', 'bandung', 'bali', 'jawa', 'news', 'berita',
            'anekadigital', 'anekamarket', 'aplikasiusaha', 'jember', 'situbondo', 'login', 'signin',
            'shop', 'store', 'market', 'online', 'digital', 'tech', 'net', 'com', 'org', 'gov', 'edu',
            'bank', 'money', 'crypto', 'bitcoin', 'game', 'play', 'movie', 'music', 'video'
        ];

        if (takenDomains.includes(rawName)) {
            setTimeout(() => {
                showDomainError(webInputName, msgContainer, btn, finalUrl, 'Nama ini termasuk "Premium" atau "Reserved Brand" yang tidak dapat digunakan.');
            }, 600);
            return;
        }

        if (isSubdomain) {
            setTimeout(() => {
                if (usedSubdomains.includes(rawName)) {
                    showDomainError(webInputName, msgContainer, btn, finalUrl, 'Subdomain ini sudah digunakan di sistem kami. Silakan pilih nama lain.');
                } else {
                    showDomainSuccess(webInputName, msgContainer, btn, finalUrl);
                }
            }, 800);
        } else {
            try {
                const checkUrlA = `https://dns.google/resolve?name=${rawName}${tldExt}&type=A`;
                const responseA = await fetch(checkUrlA);
                const dataA = await responseA.json();

                const checkUrlNS = `https://dns.google/resolve?name=${rawName}${tldExt}&type=NS`;
                const responseNS = await fetch(checkUrlNS);
                const dataNS = await responseNS.json();

                const isTakenA = (dataA.Status === 0 && dataA.Answer);
                const isTakenNS = (dataNS.Status === 0 && dataNS.Answer);

                if (isTakenA || isTakenNS) {
                    showDomainError(webInputName, msgContainer, btn, finalUrl, `Domain <b>${rawName}${tldExt}</b> sudah terdaftar dan aktif di internet. Milik orang lain.`);
                } else {
                    showDomainSuccess(webInputName, msgContainer, btn, finalUrl);
                }
            } catch (error) {
                console.error('DNS Check Error', error);
                showDomainSuccess(webInputName, msgContainer, btn, finalUrl);
            }
        }
    }

    // --- KALKULATOR HARGA ---
    function updateCalculator() {
        const produk = productSelect.value;
        const qty = parseInt(qtyInput.value) || 0;
        let unitPrice = 0;
        let specText = '';

        if (produk === 'undangan') {
            const tipeHarga = parseInt(undanganTipe.value);
            const teksturHarga = parseInt(undanganTekstur.value);
            const halamanTxt = undanganHalaman.value;
            const tipeTxt = undanganTipe.options[undanganTipe.selectedIndex].text.split('(')[0];
            unitPrice = tipeHarga + teksturHarga;
            specText = `${tipeTxt}, ${halamanTxt}` + (teksturHarga > 0 ? ' + Tekstur' : '');
        } else if (produk === 'cetak-foto') {
            const sizeEl = fotoUkuran;
            const sizeHarga = parseInt(sizeEl.value);
            const sizeName = sizeEl.options[sizeEl.selectedIndex].getAttribute('data-name');
            const editHarga = parseInt(fotoEdit.value);
            const editName = fotoEdit.options[fotoEdit.selectedIndex].text.split('(')[0];
            const kertas = fotoKertas.value;
            unitPrice = sizeHarga + editHarga;
            specText = `Ukuran ${sizeName}, Kertas ${kertas}, ${editName}`;
        } else if (produk === 'id-card') {
            unitPrice = parseInt(idcardTipe.value);
            specText = idcardTipe.options[idcardTipe.selectedIndex].text.split('(')[0];
        } else if (produk === 'cetak-cd') {
            unitPrice = parseInt(cdTipe.value);
            specText = cdTipe.options[cdTipe.selectedIndex].text.split('(')[0];
        } else if (produk === 'website') {
            const jasaPembuatan = 100000;
            const domainPrice = parseInt(webDomainSelect.value);
            const domainTypeTxt = webDomainSelect.options[webDomainSelect.selectedIndex].text.split(' - ')[0];
            unitPrice = jasaPembuatan + domainPrice;
            specText = `Jasa Web Custom + ${domainTypeTxt}`;
        } else {
            unitPrice = 0;
            specText = 'Custom / Other';
        }

        const subtotal = unitPrice * qty;
        let discountAmount = 0;
        if (subtotal >= 100000) {
            discountAmount = Math.floor(subtotal / 100000) * 5000;
        }
        const grandTotal = subtotal - discountAmount;
        const dpValue = Math.floor(grandTotal * 0.5);

        document.getElementById('summary-product').textContent = produk ? produk.toUpperCase().replace('-', ' ') : '-';
        document.getElementById('summary-price').textContent = unitPrice > 0 ? formatRupiah(unitPrice) : 'Chat Admin';
        document.getElementById('summary-qty').textContent = qty;
        document.getElementById('summary-subtotal').textContent = formatRupiah(subtotal);

        const discountRow = document.getElementById('row-discount');
        if (discountAmount > 0) {
            discountRow.style.display = 'flex';
            document.getElementById('summary-discount').textContent = '-' + formatRupiah(discountAmount);
        } else {
            discountRow.style.display = 'none';
        }

        document.getElementById('total-display').textContent = grandTotal > 0 ? formatRupiah(grandTotal) : 'Rp 0';
        document.getElementById('dp-amount').textContent = formatRupiah(dpValue);
        document.getElementById('warning-dp-val').textContent = formatRupiah(dpValue);

        const specRow = document.getElementById('row-detail-specs');
        const specVal = document.getElementById('summary-specs');
        if (specText && produk) {
            specRow.style.display = 'flex';
            specVal.textContent = specText;
        } else {
            specRow.style.display = 'none';
        }
    }

    // --- SELECT PRODUCT (dari tombol) ---
    function selectProduct(value) {
        productSelect.value = value;
        handleProductChange();
        document.getElementById('pesan').scrollIntoView({ behavior: 'smooth' });
    }

    // --- GPS FEATURE ---
    btnGps.addEventListener('click', function() {
        const btn = this;
        btn.textContent = '⏳ Mencari...';
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const lat = position.coords.latitude;
                const long = position.coords.longitude;
                document.getElementById('lokasi').value = `http://maps.google.com/?q=${lat},${long}`;
                btn.textContent = '✅ Lokasi Terisi';
                setTimeout(() => btn.textContent = '📍 Ambil Lokasi', 3000);
            }, function() {
                alert('Gagal mengambil lokasi. Pastikan GPS aktif.');
                btn.textContent = '📍 Ambil Lokasi';
            });
        } else {
            alert('Browser tidak support GPS.');
        }
    });

    // --- PROSES PESANAN & INVOICE ---
    let orderData = {};

    btnProcess.addEventListener('click', function() {
        if (!document.getElementById('nama').value || !document.getElementById('wa').value) {
            alert('Mohon lengkapi Nama dan Nomor HP/WA (Wajib) untuk melanjutkan.');
            document.getElementById('nama').focus();
            return;
        }
        if (productSelect.value === '') {
            alert('Silakan pilih produk terlebih dahulu.');
            productSelect.focus();
            return;
        }

        const produk = productSelect.options[productSelect.selectedIndex].text;
        let specs = document.getElementById('summary-specs').textContent;
        const priceUnit = document.getElementById('summary-price').textContent;
        const qty = qtyInput.value;
        const subtotal = document.getElementById('summary-subtotal').textContent;
        const discount = document.getElementById('summary-discount').textContent;
        const total = document.getElementById('total-display').textContent;
        const dp = document.getElementById('dp-amount').textContent;

        const totalNum = parseInt(total.replace(/[^0-9]/g, ''));
        const dpNum = parseInt(dp.replace(/[^0-9]/g, ''));
        const sisa = totalNum - dpNum;
        const sisaFormatted = formatRupiah(sisa);

        const kode = currentInvoiceCode;
        const nama = document.getElementById('nama').value;
        const wa = document.getElementById('wa').value;
        const email = document.getElementById('email').value || '-';
        const noteRaw = document.getElementById('catatan').value;
        const deadlineVal = document.getElementById('deadline').value || 'Secepatnya';

        let extraDetail = '';
        if (productSelect.value === 'undangan') {
            const jenisAcaraVal = jenisAcara.value;
            if (jenisAcaraVal === 'Pernikahan') {
                extraDetail = `[Acara Nikah: ${document.getElementById('nama-pria').value} & ${document.getElementById('nama-wanita').value}]`;
            } else if (jenisAcaraVal === 'Khitanan') {
                extraDetail = `[Acara Khitan: ${document.getElementById('nama-anak').value}]`;
            } else {
                extraDetail = `[Acara ${jenisAcaraVal}: ${document.getElementById('nama-hajat').value}]`;
            }
        } else if (productSelect.value === 'website') {
            const tema = document.getElementById('web-tema').value || 'Default';
            const warna = document.getElementById('web-warna').value || 'Default';
            const deskripsi = document.getElementById('web-deskripsi').value || '-';
            const finalLink = webFinalLink.value || '(Belum Diisi)';
            const domainTypeLabel = webDomainSelect.options[webDomainSelect.selectedIndex].text.split(' - ')[0];
            extraDetail = `
                • Tema: ${tema}
                • Warna: ${warna}
                • Tipe Domain: ${domainTypeLabel}
                • Link/Nama: ${finalLink}
                • Konten: ${deskripsi}`;
        }

        const fullNote = (extraDetail ? extraDetail + '\n' : '') + (noteRaw ? 'Catatan Lain: ' + noteRaw : '');

        orderData = {
            kode, nama, wa, email, produk, specs, priceUnit, qty,
            subtotal, discount, total, dp, sisa: sisaFormatted,
            fullNote, deadlineVal,
            today: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        };

        document.getElementById('inv-code').textContent = '#' + kode;
        document.getElementById('inv-date').textContent = orderData.today;
        document.getElementById('inv-name').textContent = nama;
        document.getElementById('inv-product').textContent = produk;
        document.getElementById('inv-specs').textContent = specs;
        document.getElementById('inv-price-unit').textContent = priceUnit;
        document.getElementById('inv-qty').textContent = qty;

        if (orderData.discount !== '-Rp 0') {
            document.getElementById('modal-discount-row').style.display = 'flex';
            document.getElementById('inv-discount').textContent = discount;
        } else {
            document.getElementById('modal-discount-row').style.display = 'none';
        }

        document.getElementById('inv-total-final').textContent = total;
        document.getElementById('inv-dp-val').textContent = dp;
        document.getElementById('inv-sisa-val').textContent = sisaFormatted;
        document.getElementById('inv-notes-preview').textContent = fullNote.length > 80 ? fullNote.substring(0, 80) + '...' : fullNote;

        modal.classList.add('active');
    });

    btnCloseModal.addEventListener('click', function() {
        modal.classList.remove('active');
    });

    btnSendWa.addEventListener('click', function() {
        const text = `Halo Admin Aneka Digital,

Saya sudah melakukan pesanan di Website & Transfer DP.
Mohon konfirmasinya.

🧾 *INVOICE: ${orderData.kode}*
👤 Nama: ${orderData.nama}
📱 WA: ${orderData.wa}
📧 Email: ${orderData.email}

📦 *DETAIL ORDER*
Produk: ${orderData.produk}
Specs: ${orderData.specs}
Qty: ${orderData.qty}

📝 *DETAIL KHUSUS / NOTE*
${orderData.fullNote}

💰 *PEMBAYARAN*
Total Tagihan: ${orderData.total}
DP Transfer: ${orderData.dp}
Sisa: ${orderData.sisa}

Terima kasih.`;
        window.open(`https://wa.me/6285647709114?text=${encodeURIComponent(text)}`, '_blank');
    });

    btnDownloadPdf.addEventListener('click', function() {
        const printTime = new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const htmlNote = orderData.fullNote.replace(/\n/g, '<br>');

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice - ${orderData.kode}</title>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
                <style>
                    @page { margin: 0; size: A4; }
                    :root { --i-blue: #0A4D98; --i-red: #EF4444; --i-orange: #F97316; --i-green: #10B981; --i-black: #0f172a; }
                    body { font-family: 'Inter', sans-serif; color: var(--i-black); background: #fff; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 14px; }
                    h1, h2, h3, h4, th { font-family: 'Plus Jakarta Sans', sans-serif; }
                    .invoice-box { max-width: 210mm; margin: 0 auto; padding: 40px; min-height: 297mm; position: relative; box-sizing: border-box; }
                    .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid var(--i-blue); padding-bottom: 20px; margin-bottom: 30px; }
                    .brand-section h1 { font-size: 28px; font-weight: 800; color: var(--i-blue); margin: 0; letter-spacing: -0.5px; }
                    .brand-section span { color: var(--i-orange); }
                    .brand-tagline { font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; font-weight: 600; }
                    .invoice-meta { text-align: right; }
                    .inv-title { font-size: 36px; font-weight: 800; color: #e2e8f0; margin: 0; line-height: 1; letter-spacing: 2px; }
                    .inv-number { font-size: 16px; font-weight: 700; color: var(--i-orange); background: #fff7ed; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-top: 5px; border: 1px solid #ffedd5; }
                    .info-grid { display: flex; justify-content: space-between; margin-bottom: 40px; }
                    .info-box h3 { font-size: 11px; text-transform: uppercase; color: #94a3b8; margin: 0 0 8px 0; letter-spacing: 1px; }
                    .info-value { font-size: 15px; font-weight: 600; color: var(--i-black); }
                    .info-sub { font-size: 12px; color: #64748b; margin-top: 3px; font-weight: 400; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { background: var(--i-blue); color: white; text-align: left; padding: 12px 15px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
                    td { padding: 15px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                    .td-desc { width: 55%; } .td-price { width: 15%; text-align: right; } .td-qty { width: 10%; text-align: center; } .td-total { width: 20%; text-align: right; font-weight: 700; color: var(--i-blue); }
                    .item-title { font-weight: 700; font-size: 14px; display: block; margin-bottom: 4px; color: var(--i-black); }
                    .item-spec { font-size: 11px; color: #64748b; line-height: 1.4; display: block; }
                    .bottom-section { display: flex; gap: 40px; }
                    .notes-box { flex: 1.5; background: #f8fafc; border-left: 4px solid var(--i-orange); padding: 15px; border-radius: 0 8px 8px 0; }
                    .notes-title { font-size: 11px; font-weight: 700; color: var(--i-orange); margin-bottom: 5px; text-transform: uppercase; }
                    .notes-content { font-size: 12px; color: #475569; line-height: 1.5; }
                    .totals-box { flex: 1; }
                    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #475569; }
                    .total-row.discount span:last-child { color: var(--i-red); font-weight: 600; }
                    .grand-total { border-top: 2px dashed #cbd5e1; margin-top: 10px; padding-top: 10px; font-size: 18px; font-weight: 800; color: var(--i-blue); display: flex; justify-content: space-between; align-items: center; }
                    .payment-status { margin-top: 15px; background: #ecfdf5; border: 1px solid #10b981; padding: 10px; border-radius: 6px; }
                    .status-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; }
                    .status-row.paid { color: var(--i-green); font-weight: 700; }
                    .status-row.due { color: var(--i-red); font-weight: 700; border-top: 1px dashed #10b981; padding-top: 5px; margin-top: 5px; }
                    .print-footer { position: absolute; bottom: 40px; left: 40px; right: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                    .thank-you { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; color: var(--i-blue); font-size: 14px; margin-bottom: 5px; letter-spacing: 1px; text-transform: uppercase; }
                    .website-link { color: var(--i-orange); text-decoration: none; font-weight: 600; font-size: 11px; }
                    .contact-info { font-size: 11px; color: #94a3b8; margin-top: 5px; }
                </style>
            </head>
            <body>
                <div class="invoice-box">
                    <div class="header-container">
                        <div class="brand-section">
                            <h1>Aneka<span>Digital</span></h1>
                            <div class="brand-tagline">Web Developer & Printing Solution</div>
                        </div>
                        <div class="invoice-meta">
                            <div class="inv-title">INVOICE</div>
                            <div class="inv-number">${orderData.kode}</div>
                        </div>
                    </div>

                    <div class="info-grid">
                        <div class="info-box">
                            <h3>Ditagihkan Kepada</h3>
                            <div class="info-value">${orderData.nama}</div>
                            <div class="info-sub">${orderData.wa} <br> ${orderData.email}</div>
                        </div>
                        <div class="info-box" style="text-align: right;">
                            <h3>Tanggal Terbit</h3>
                            <div class="info-value">${orderData.today}</div>
                            <div class="info-sub">Waktu Cetak: ${printTime} WIB</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th class="td-desc">Produk & Deskripsi</th>
                                <th class="td-price">Harga Satuan</th>
                                <th class="td-qty">Qty</th>
                                <th class="td-total">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <span class="item-title">${orderData.produk}</span>
                                    <span class="item-spec">${orderData.specs}</span>
                                </td>
                                <td class="td-price">${orderData.priceUnit}</td>
                                <td class="td-qty">${orderData.qty}</td>
                                <td class="td-total">${orderData.subtotal}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="bottom-section">
                        <div class="notes-box">
                            <div class="notes-title">Catatan & Detail Pesanan</div>
                            <div class="notes-content">${htmlNote}</div>
                        </div>

                        <div class="totals-box">
                            <div class="total-row">
                                <span>Subtotal</span>
                                <span>${orderData.subtotal}</span>
                            </div>
                            ${orderData.discount !== '-Rp 0' ? `
                            <div class="total-row discount">
                                <span>Diskon Promo</span>
                                <span>${orderData.discount}</span>
                            </div>
                            ` : ''}
                            <div class="grand-total">
                                <span>TOTAL TAGIHAN</span>
                                <span>${orderData.total}</span>
                            </div>
                            
                            <div class="payment-status">
                                <div class="status-row paid">
                                    <span>DP (Transfer QRIS)</span>
                                    <span>${orderData.dp}</span>
                                </div>
                                <div class="status-row due">
                                    <span>Sisa Pelunasan</span>
                                    <span>${orderData.sisa}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="print-footer">
                        <div class="thank-you">Terima Kasih Telah Berbelanja</div>
                        <div><a href="#" class="website-link">www.anekamarket.my.id/anekadigital</a></div>
                        <div class="contact-info">Jl. Pb. Sudirman, Panarukan, Situbondo • 0856-4770-9114</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printContainer = document.getElementById('print-container');
        printContainer.innerHTML = printContent;
        setTimeout(() => { window.print(); }, 800);
    });

    // --- EVENT LISTENER LAINNYA ---
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });

    hamburger.addEventListener('click', function() {
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('#nav-menu a').forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
        });
    });

    productSelect.addEventListener('change', handleProductChange);
    btnPesanWeb.addEventListener('click', function() { selectProduct('website'); });
    productButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const product = this.dataset.product;
            selectProduct(product);
        });
    });

    webDomainSelect.addEventListener('change', function() {
        handleWebDomainUI();
        updateCalculator();
    });
    webInputName.addEventListener('keyup', resetDomainStatus);
    btnCheckDomain.addEventListener('click', checkDomainAvailability);

    undanganTipe.addEventListener('change', updateCalculator);
    undanganHalaman.addEventListener('change', updateCalculator);
    undanganTekstur.addEventListener('change', updateCalculator);
    fotoUkuran.addEventListener('change', updateCalculator);
    fotoKertas.addEventListener('change', updateCalculator);
    fotoEdit.addEventListener('change', updateCalculator);
    idcardTipe.addEventListener('change', updateCalculator);
    cdTipe.addEventListener('change', updateCalculator);
    qtyInput.addEventListener('input', updateCalculator);
    jenisAcara.addEventListener('change', handleEventChange);

    // Inisialisasi awal
    handleProductChange();
    handleWebDomainUI();
    updateCalculator();
});
