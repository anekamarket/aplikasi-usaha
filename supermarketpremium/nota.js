// nota.js
document.addEventListener('DOMContentLoaded', function() {
    // Elemen DOM
    const btnCekOrder = document.getElementById('btn-cek-order');
    const modal = document.getElementById('cekOrderModal');
    const inputKode = document.getElementById('input-kode-order');
    const btnCek = document.getElementById('btn-cek-kode');
    const hasilContainer = document.getElementById('hasil-cek-order');
    const downloadBtn = document.getElementById('btn-download-struk');
    const btnClose = document.getElementById('btn-close-cek-modal');

    // Daftar kode order yang dianggap valid (fallback)
    const validCodes = ['ORD20260501161911'];

    // Reset tampilan modal
    function resetCekOrder() {
        inputKode.value = '';
        hasilContainer.innerHTML = '';
        downloadBtn.classList.add('hidden');
        downloadBtn.style.display = 'none';
        inputKode.classList.remove('is-valid', 'is-invalid');
    }

    // Buka modal
    btnCekOrder.addEventListener('click', function(e) {
        e.preventDefault();
        modal.classList.add('active');
        resetCekOrder();
        setTimeout(() => inputKode.focus(), 100);
    });

    // Tutup modal
    btnClose.addEventListener('click', function() {
        modal.classList.remove('active');
    });

    // Tutup jika klik di luar card
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Proses verifikasi
    btnCek.addEventListener('click', function() {
        const kode = inputKode.value.trim().toUpperCase();

        if (!kode) {
            alert('Silakan masukkan kode order terlebih dahulu.');
            inputKode.focus();
            return;
        }

        // Validasi format: ORD + 14 digit angka (YYYYMMDDHHMMSS)
        const formatRegex = /^ORD\d{14}$/;
        if (!formatRegex.test(kode)) {
            hasilContainer.innerHTML = `
                <div class="domain-msg error">
                    <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                        <strong>Format Kode Salah</strong><br>
                        Kode harus diawali <b>ORD</b> diikuti 14 digit angka (tahun, bulan, tanggal, jam, menit, detik).<br>
                        Contoh: <b>ORD20260501153430</b>
                    </div>
                </div>`;
            inputKode.classList.add('is-invalid');
            inputKode.classList.remove('is-valid');
            downloadBtn.classList.add('hidden');
            downloadBtn.style.display = 'none';
            return;
        }

        // Tampilkan loading
        hasilContainer.innerHTML = `
            <div class="domain-msg info">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="spinner" style="width:20px; height:20px; border:3px solid #60a5fa; border-top-color:transparent; border-radius:50%; animation: spin 0.8s linear infinite;"></div>
                    <span>Memeriksa kode order...</span>
                </div>
            </div>`;
        inputKode.classList.remove('is-valid', 'is-invalid');

        const urlNota = `https://aplikasiusaha.com/supermarketpremium/cek-kode/nota/Struk-${kode}.pdf`;

        // Coba verifikasi dengan HEAD request ke server
        fetch(urlNota, { method: 'HEAD', mode: 'cors' })
            .then(response => {
                if (response.ok) {
                    tampilkanValid(kode, urlNota, 'Server terverifikasi.');
                } else {
                    throw new Error('Not found');
                }
            })
            .catch(() => {
                // Fallback ke daftar kode lokal
                if (validCodes.includes(kode)) {
                    tampilkanValid(kode, urlNota, 'Validasi lokal berhasil (server tidak terjangkau).');
                } else {
                    tampilkanTidakValid(kode);
                }
            });
    });

    function tampilkanValid(kode, url, catatan = '') {
        hasilContainer.innerHTML = `
            <div class="domain-msg success">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                    <strong>Nota Valid & Asli!</strong><br>
                    Kode <b>${kode}</b> terverifikasi. ${catatan}<br>
                    Klik tombol di bawah untuk mengunduh struk PDF.
                </div>
            </div>`;
        inputKode.classList.add('is-valid');
        inputKode.classList.remove('is-invalid');
        downloadBtn.href = url;
        downloadBtn.classList.remove('hidden');
        downloadBtn.style.display = 'block';
    }

    function tampilkanTidakValid(kode) {
        hasilContainer.innerHTML = `
            <div class="domain-msg error">
                <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                    <strong>Kode Tidak Ditemukan</strong><br>
                    Kode <b>${kode}</b> tidak terdaftar atau nota belum tersedia.<br>
                    Pastikan kode benar dan coba lagi.
                </div>
            </div>`;
        inputKode.classList.add('is-invalid');
        inputKode.classList.remove('is-valid');
        downloadBtn.classList.add('hidden');
        downloadBtn.style.display = 'none';
    }
});
