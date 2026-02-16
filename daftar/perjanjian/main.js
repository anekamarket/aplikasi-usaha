// ===================== INISIALISASI =====================
document.addEventListener('DOMContentLoaded', function() {
    // Set default tanggal hari ini
    const today = new Date();
    const formattedDate = today.toISOString().substr(0, 10);
    document.getElementById('tanggal_pendaftaran').value = formattedDate;

    // Pasang validasi real-time
    setupValidation();

    // Pastikan input ID permohonan hanya alfanumerik
    document.getElementById('id_permohonan_input').addEventListener('input', function(e) {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });

    // Uppercase untuk field tertentu
    document.getElementById('nama_pemohon').addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
    document.getElementById('nama_umkm').addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
});

// ===================== VALIDASI FORM =====================
function setupValidation() {
    const inputs = document.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
}

function validateField(field) {
    const errorElement = document.getElementById(field.id + '_error');
    if (!errorElement) return true; // Elemen error tidak ditemukan, anggap valid

    // Reset tampilan error
    hideError(field, errorElement);

    // Cek required
    if (!field.value.trim()) {
        showError(field, errorElement, 'Field harus diisi');
        return false;
    }

    // Validasi khusus berdasarkan id
    const value = field.value.trim();

    switch (field.id) {
        case 'nik':
            if (!/^\d{16}$/.test(value)) {
                showError(field, errorElement, 'NIK harus 16 digit angka');
                return false;
            }
            break;
        case 'id_permohonan_input':
            if (value.length !== 6 || !/^[A-Z0-9]+$/.test(value)) {
                showError(field, errorElement, 'ID Permohonan harus 6 karakter (huruf/angka)');
                return false;
            }
            break;
        case 'nomor_telepon':
            if (!/^08\d{8,11}$/.test(value) || value.length < 10 || value.length > 13) {
                showError(field, errorElement, 'Nomor harus diawali 08 dan 10-13 digit');
                return false;
            }
            break;
        case 'tanggal_pendaftaran':
            if (!value) {
                showError(field, errorElement, 'Tanggal harus diisi');
                return false;
            }
            break;
        default:
            // Untuk teks biasa, sudah dicek required
            break;
    }

    return true;
}

function showError(field, errorElement, message) {
    field.classList.add('input-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError(field, errorElement) {
    field.classList.remove('input-error');
    errorElement.style.display = 'none';
}

// ===================== GENERATE ID PENDAFTARAN =====================
function generateRandomID() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = 'LKS/JK-';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ===================== GENERATE QR CODE (PROMISE) =====================
function generateQRCodePromise(elementId, data) {
    return new Promise((resolve, reject) => {
        const element = document.getElementById(elementId);
        if (!element) {
            reject(`Elemen ${elementId} tidak ditemukan`);
            return;
        }
        element.innerHTML = ''; // Kosongkan konten sebelumnya

        if (!data) {
            resolve(); // Tidak ada data, tetap selesaikan
            return;
        }

        const canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, data, {
            width: 90,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' }
        }, function(error) {
            if (error) {
                console.error('QR Code error:', error);
                element.innerHTML = '<div style="text-align:center;padding:10px;color:#666;font-size:11px;">QR Code Error</div>';
                reject(error);
            } else {
                element.appendChild(canvas);
                resolve();
            }
        });
    });
}

// ===================== GENERATE DOKUMEN (ASYNC) =====================
async function generateAgreement() {
    // Ambil data form
    const namaPemohon = document.getElementById('nama_pemohon').value.toUpperCase();
    const idPermohonanInput = document.getElementById('id_permohonan_input').value.toUpperCase();
    const nik = document.getElementById('nik').value;
    const alamat = document.getElementById('alamat').value;
    const nomorTelepon = document.getElementById('nomor_telepon').value;
    const tanggalPendaftaran = document.getElementById('tanggal_pendaftaran').value;
    const idPendaftaran = document.getElementById('id_pendaftaran').value; // sudah diisi saat validasi
    const namaUmkm = document.getElementById('nama_umkm').value.toUpperCase();
    const kategoriLayanan = document.getElementById('kategori_layanan').value;

    const fullIdPermohonan = 'AM-' + idPermohonanInput;

    // Format tanggal
    const formattedDate = formatDate(tanggalPendaftaran);
    const fullDate = formatFullDate(tanggalPendaftaran);
    const hariTanggal = getHariTanggal(tanggalPendaftaran);
    const nomorSurat = generateNomorSurat(idPendaftaran);

    // Tampilkan di dokumen
    document.getElementById('display_nama_pemohon').textContent = namaPemohon;
    document.getElementById('display_id_permohonan').textContent = fullIdPermohonan;
    document.getElementById('display_nik').textContent = nik;
    document.getElementById('display_alamat').textContent = alamat;
    document.getElementById('display_nomor_telepon').textContent = nomorTelepon;
    document.getElementById('display_id_pendaftaran').textContent = idPendaftaran;
    document.getElementById('display_nama_umkm').textContent = namaUmkm;
    document.getElementById('display_kategori_layanan').textContent = kategoriLayanan;
    document.getElementById('display_tanggal_pendaftaran_full').textContent = fullDate;
    document.getElementById('display_nama_pemohon_sign').textContent = namaPemohon;
    document.getElementById('display_hari_tanggal').textContent = hariTanggal;
    document.getElementById('nomor_surat_display').textContent = nomorSurat;
    // Isi tanggal pihak pertama juga (sama dengan tanggal pendaftaran)
    document.getElementById('display_tanggal_pihak_pertama').textContent = fullDate;

    // Data untuk QR code
    const qrDataPihakKedua = `PEMOHON:${namaPemohon}|NIK:${nik}|ID:${fullIdPermohonan}|TGL:${formattedDate}`;
    const qrDataPihakPertama = `PERUSAHAAN:LENTERA KARYA|PENANDATANGAN:MUHAMMAD SALAM|JABATAN:FOUNDER|TGL:${formattedDate}`;

    // Tunggu kedua QR code selesai
    try {
        await Promise.all([
            generateQRCodePromise('qrcode_pihak_kedua', qrDataPihakKedua),
            generateQRCodePromise('qrcode_pihak_pertama', qrDataPihakPertama)
        ]);
    } catch (err) {
        console.warn('QR code generation warning:', err);
        // Tetap lanjutkan walau QR code gagal
    }
}

// ===================== VALIDASI DAN GENERATE (ASYNC) =====================
async function validateAndGenerate() {
    // Validasi semua field wajib
    const requiredFields = [
        'nama_pemohon', 'id_permohonan_input', 'nik', 'alamat', 'nomor_telepon',
        'tanggal_pendaftaran', 'nama_umkm', 'kategori_layanan'
    ];

    let isValid = true;
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!validateField(field)) {
            isValid = false;
        }
    });

    if (!isValid) {
        alert('Silakan periksa kembali form Anda. Ada data yang belum valid.');
        return;
    }

    // Generate ID Pendaftaran jika belum ada
    const idPendaftaranField = document.getElementById('id_pendaftaran');
    if (!idPendaftaranField.value) {
        idPendaftaranField.value = generateRandomID();
    }

    // Tampilkan loading
    document.getElementById('loading-indicator').style.display = 'block';

    // Generate dokumen dan tunggu QR code selesai
    await generateAgreement();

    // Tampilkan dokumen yang sudah digenerate
    document.getElementById('agreement-document').style.display = 'block';

    // Sembunyikan loading
    document.getElementById('loading-indicator').style.display = 'none';
    alert('Surat perjanjian telah dibuat. Silakan cetak, download PDF, atau kirim via WhatsApp.');
}

// ===================== FUNGSI BANTU FORMAT =====================
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatFullDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
}

function getHariTanggal(dateString) {
    if (!dateString) return 'Senin Tanggal 07 Bulan Juli Tahun 2025';
    const date = new Date(dateString);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName} Tanggal ${day} Bulan ${monthName} Tahun ${year}`;
}

function generateNomorSurat(idPendaftaran) {
    if (!idPendaftaran) return '......../......../SP3LA-LKS/VII/2025';
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const idParts = idPendaftaran.split('-');
    const uniqueId = idParts.length > 1 ? idParts[1] : idPendaftaran.substr(-6);
    return `${uniqueId}/SP3LA-LKS/${month}/${year}`;
}

// ===================== FUNGSI TOMBOL =====================
function printDocument() {
    if (!isDocumentGenerated()) {
        // Jika dokumen belum digenerate, jalankan validateAndGenerate dulu
        validateAndGenerate().then(() => {
            setTimeout(() => window.print(), 500);
        });
    } else {
        window.print();
    }
}

function downloadDocument() {
    if (!isDocumentGenerated()) {
        validateAndGenerate().then(() => {
            generatePDF();
        });
    } else {
        generatePDF();
    }
}

function sendViaWhatsApp() {
    if (!isDocumentGenerated()) {
        validateAndGenerate().then(() => {
            openWhatsApp();
        });
    } else {
        openWhatsApp();
    }
}

// Helper: cek apakah dokumen sudah pernah digenerate
function isDocumentGenerated() {
    const namaDisplay = document.getElementById('display_nama_pemohon').textContent;
    return namaDisplay && namaDisplay.trim() !== '';
}

function generatePDF() {
    const element = document.getElementById('agreement-document');
    const opt = {
        margin: [10, 10, 10, 10],
        filename: 'surat_perjanjian_lks.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    document.getElementById('loading-indicator').style.display = 'block';
    html2pdf().set(opt).from(element).save()
        .then(() => {
            document.getElementById('loading-indicator').style.display = 'none';
        })
        .catch(err => {
            console.error('PDF error:', err);
            document.getElementById('loading-indicator').style.display = 'none';
            alert('Terjadi kesalahan saat membuat PDF. Silakan coba lagi.');
        });
}

function openWhatsApp() {
    const namaPemohon = document.getElementById('nama_pemohon').value || 'Nama Pemohon';
    const idPermohonan = 'AM-' + (document.getElementById('id_permohonan_input').value.toUpperCase() || 'ID');
    const message = `Berikut tanda bukti pendaftaran saya dan bukti perjanjiannya:\n\nNama: ${namaPemohon}\nID Permohonan: ${idPermohonan}\n\nSilakan lihat dokumen terlampir.`;
    const whatsappUrl = `https://wa.me/6287865614222?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}
