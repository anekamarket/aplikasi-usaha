// --- GLOBAL VARIABLES & CONSTANTS ---
let appData = [];
let appSettings = {
    securityCode: 'Gratis12345',
    itemsPerPage: 25,
    notifications: true,
    appName: 'BARJAS',
    appSubtitle: 'Sistem Bantuan Terpadu',
    defaultTahun: new Date().getFullYear(),
    lastBackupDate: '-'
};
let currentPage = 1;
let filteredData = [];
let isFilterActive = false;
let loginAttempts = 0;
let isBlocked = false;
let blockTimeout;
let generatedCodes = {};

const kecamatanList = [
    "Arjasa", "Asembagus", "Banyuglugur", "Banyuputih", "Besuki", 
    "Bungatan", "Jangkar", "Jatibanteng", "Kapongan", "Kendit", 
    "Mangaran", "Mlandingan", "Panarukan", "Panji", "Situbondo", 
    "Suboh", "Sumbermalang"
];

const desaList = [
    "Agel", "Alas Bayur", "Alasmalang", "Alastengah", "Arjasa", "Ardirejo", "Asembagus", 
    "Awar-awar", "Awang-awang", "Baderan", "Balung", "Bantal", "Battal", "Bayeman", "Besuki", "Bletok", "Blimbing", "Bloro", "Buduan", "Bugeman", "Bungatan", 
    "Campoan", "Cemara", "Curah Cottok", "Curah Jeru", "Curah Kalak", "Curah Suri", "Curah Tatal", "Dawuhan", "Demung", "Duwet", "Gadingan", "Gebangan", 
    "Gelung", "Gudang", "Gunung Malang", "Gunung Putri", "Jangkar", "Jatisari", "Jatibanteng", "Jetis", "Juglangan", "Kalianget", "Kalibagor", "Kalimas", 
    "Kalirejo", "Kalisari", "Kandang", "Kayu Putih", "Kayumas", "Kedungdowo", "Kedunglo", "Kembangsari", "Ketah", "Ketawan", "Kilensari", "Klampokan", 
    "Klatakan", "Kotakan", "Kumbangsari", "Kukusan", "Lamongan", "Landangan", "Langkap", "Lebeng", "Lubawang", "Mangaran", "Mimbaan", "Mlandingan Kulon", 
    "Mlandingan Wetan", "Mojodungkol", "Mojosari", "Olean", "Palangan", "Panarukan", "Panji Kidul", "Panji Lor", "Parante", "Pasir Putih", "Patemon", 
    "Patokan", "Paowan", "Peleyan", "Pesisir", "Pesanggrahan", "Pategalan", "Plalangan", "Pokaan", "Rajekwesi", "Seletreng", "Selobanteng", 
    "Selomukti", "Selowogo", "Semambung", "Semiring", "Sliwung", "Sopet", "Sumber Pinang", "Sumberanyar", "Sumberargo", "Sumberkolak", "Sumberejo", 
    "Sumbertengah", "Sumberwaru", "Tamankursi", "Tamansari", "Taman", "Talkandang", "Tanjung Glugur", "Tanjung Kamal", "Tanjung Pecinan", "Tambak Ukir", 
    "Telempong", "Tenggir", "Tepos", "Tokelan", "Tlogosari", "Trigonco", "Trebungan", "Widoropayung", "Wonokoyo", "Wonorejo", "Wringinanom"
].sort();

// --- APPLICATION LIFECYCLE ---
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
});

function initializeApp() {
    loadSettings();
    loadData();
    
    fillYearDropdowns();
    fillKecamatanDropdown();
    fillDesaDropdown();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggalTerima').value = today;
    
    initializeCharts();
    setupBrowserInfo();
    updateDashboard();
    applySettingsToUI();
}

// --- SETUP & INITIALIZATION ---
function setupEventListeners() {
    // Login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.querySelector('.toggle-password').addEventListener('click', togglePasswordVisibility);
    
    // Main Input Form
    document.getElementById('inputForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('inputForm').addEventListener('reset', resetForm);
    document.getElementById('btnBukanKelompok').addEventListener('click', setBukanKelompok);
    document.getElementById('generateKodeBtn').addEventListener('click', generateKodeValidasi);
    document.getElementById('jabatan').addEventListener('change', handleJabatanChange);
    document.getElementById('nik').addEventListener('input', () => {
        document.getElementById('kodeValidasi').value = ''; // Reset kode jika NIK diubah
    });

    // Form Live Validation
    ['nama', 'nik', 'whatsapp', 'namaPetugas', 'namaBantuan', 'jumlahBantuan', 'driveLink', 'kodeValidasi', 'kecamatan', 'desa', 'tanggalTerima'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => clearError(id));
    });
    
    // Data Table
    document.getElementById('searchData').addEventListener('input', handleSearch);
    document.getElementById('clearSearchBtn').addEventListener('click', clearSearch);
    
    // Filter
    document.getElementById('applyFilterBtn').addEventListener('click', applyFilter);
    document.getElementById('resetFilterBtn').addEventListener('click', resetFilter);
    
    // Print & Export
    document.getElementById('printPdfBtn').addEventListener('click', printToPdf);
    document.getElementById('previewBtn').addEventListener('click', showPreview);
    document.getElementById('exportExcelBtn').addEventListener('click', () => exportData('excel'));
    document.getElementById('exportCsvBtn').addEventListener('click', () => exportData('csv'));
    document.getElementById('exportJsonBtn').addEventListener('click', () => exportData('json'));
    document.getElementById('exportPdfBtn').addEventListener('click', () => exportData('pdf'));
    
    // Backup, Restore, Reset
    document.getElementById('backupDataBtn').addEventListener('click', backupData);
    document.getElementById('restoreFileInput').addEventListener('change', enableRestoreButton);
    document.getElementById('restoreDataBtn').addEventListener('click', restoreData);
    document.getElementById('resetConfirmationInput').addEventListener('input', enableResetButton);
    document.getElementById('confirmResetBtn').addEventListener('click', resetData);
    
    // Settings
    document.getElementById('settingsForm').addEventListener('submit', handleSaveSettings);
    
    // UI/UX Helpers
    document.getElementById('mobileMenuBtn').addEventListener('click', toggleMobileMenu);
    document.getElementById('sidebarOverlay').addEventListener('click', toggleMobileMenu);
    document.getElementById('fabBtn').addEventListener('click', () => document.getElementById('v-pills-input-tab').click());
    document.getElementById('jenisBantuan').addEventListener('change', updateSatuanBantuan);
    document.getElementById('printFromPreviewBtn').addEventListener('click', () => window.print());
    document.getElementById('v-pills-logout-tab').addEventListener('click', logout);
    
    // REVISI BARU: Event listener untuk reload data dari repo
    document.getElementById('btn-reload-repo').addEventListener('click', handleReloadFromRepo);

    // Listener untuk backup otomatis saat menutup/merefresh halaman
    window.addEventListener('beforeunload', autoBackupData);
}

function fillYearDropdowns() {
    const yearSelects = ['tahunAnggaran', 'filterTahun', 'printTahun', 'exportTahun', 'defaultTahun'];
    const currentYear = new Date().getFullYear();

    yearSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '';
        
        if (!['tahunAnggaran', 'defaultTahun'].includes(selectId)) {
            select.add(new Option('Semua Tahun', ''));
        }
        
        for (let year = 2020; year <= 2090; year++) {
            select.add(new Option(year, year));
        }
        
        select.value = (selectId === 'tahunAnggaran') ? currentYear : (selectId === 'defaultTahun' ? appSettings.defaultTahun : '');
    });
}

function fillKecamatanDropdown() {
    ['kecamatan', 'filterKecamatan', 'printKecamatan', 'exportKecamatan'].forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '';
        const defaultText = selectId === 'kecamatan' ? 'Pilih Kecamatan' : 'Semua Kecamatan';
        select.add(new Option(defaultText, ''));
        kecamatanList.forEach(kec => select.add(new Option(kec, kec)));
    });
}

function fillDesaDropdown() {
    ['desa', 'filterDesa'].forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '';
        const defaultText = selectId === 'desa' ? 'Pilih Desa' : 'Semua Desa';
        select.add(new Option(defaultText, ''));
        desaList.forEach(desa => select.add(new Option(desa, desa)));
    });
}

// --- AUTHENTICATION ---
function handleLogin(e) {
    e.preventDefault();
    if (isBlocked) return showNotification('Akses diblokir sementara karena terlalu banyak percobaan.', 'error');
    
    const securityCodeInput = document.getElementById('securityCode').value;
    const loginButton = document.getElementById('loginButton');
    
    loginButton.disabled = true;
    document.getElementById('loginSpinner').classList.remove('d-none');
    document.querySelector('.login-button-text').textContent = 'Memverifikasi...';
    
    setTimeout(() => {
        if (securityCodeInput === appSettings.securityCode) {
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (loginModal) loginModal.hide();
            
            document.getElementById('appContent').style.display = 'block';
            loginAttempts = 0;
            updateAttemptsCount();
            showNotification('Login berhasil! Selamat datang.', 'success');
        } else {
            loginAttempts++;
            updateAttemptsCount();
            
            const loginForm = document.getElementById('loginForm');
            loginForm.classList.add('login-shake');
            setTimeout(() => loginForm.classList.remove('login-shake'), 600);
            
            if (loginAttempts >= 3) {
                blockAccess();
            } else {
                showNotification(`Kode keamanan salah. Sisa percobaan: ${3 - loginAttempts}.`, 'error');
            }
        }

        loginButton.disabled = false;
        document.getElementById('loginSpinner').classList.add('d-none');
        document.querySelector('.login-button-text').textContent = 'Masuk ke Aplikasi';
    }, 500);
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('securityCode');
    const icon = this.querySelector('i');
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    icon.classList.toggle('fa-eye', !isPassword);
    icon.classList.toggle('fa-eye-slash', isPassword);
}

function updateAttemptsCount() {
    const attemptsEl = document.getElementById('attemptsCount');
    const blockedMessage = document.getElementById('blockedMessage');
    
    attemptsEl.style.display = loginAttempts > 0 && !isBlocked ? 'block' : 'none';
    attemptsEl.textContent = `Percobaan gagal: ${loginAttempts}/3`;
    blockedMessage.classList.toggle('d-none', !isBlocked);
}

function blockAccess() {
    isBlocked = true;
    updateAttemptsCount();
    showNotification('Akses diblokir selama 30 detik.', 'error');
    
    let countdown = 30;
    const countdownElement = document.getElementById('countdown');
    countdownElement.textContent = countdown;
    
    blockTimeout = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(blockTimeout);
            isBlocked = false;
            loginAttempts = 0;
            updateAttemptsCount();
        }
    }, 1000);
}

function logout() {
    autoBackupData();
    
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        document.getElementById('appContent').style.display = 'none';
        document.getElementById('securityCode').value = '';
        new bootstrap.Modal(document.getElementById('loginModal')).show();
        showNotification('Anda telah berhasil logout.', 'info');
    }
}

// --- FORM HANDLING & VALIDATION ---
function handleFormSubmit(e) {
    e.preventDefault();
    if (!validateForm()) {
        showNotification('Harap perbaiki data yang salah pada formulir.', 'error');
        return;
    }
    
    const editId = document.getElementById('inputForm').getAttribute('data-edit-id');
    const isEditing = !!editId;

    const formData = {
        id: isEditing ? parseInt(editId) : Date.now(),
        nama: document.getElementById('nama').value.trim(),
        nik: document.getElementById('nik').value.trim(),
        whatsapp: document.getElementById('whatsapp').value.replace(/\D/g, ''),
        namaKelompok: document.getElementById('namaKelompok').value.trim() || 'Individu',
        jabatan: document.getElementById('jabatan').value,
        tahunAnggaran: document.getElementById('tahunAnggaran').value,
        kecamatan: document.getElementById('kecamatan').value,
        desa: document.getElementById('desa').value,
        alamat: document.getElementById('alamat').value.trim(),
        jenisBantuan: document.getElementById('jenisBantuan').value,
        namaBantuan: document.getElementById('namaBantuan').value.trim(),
        jumlahBantuan: document.getElementById('jumlahBantuan').value,
        satuanBantuan: document.getElementById('satuanBantuan').value,
        tanggalTerima: document.getElementById('tanggalTerima').value,
        namaPetugas: document.getElementById('namaPetugas').value.trim(),
        driveLink: document.getElementById('driveLink').value.trim(),
        kodeValidasi: document.getElementById('kodeValidasi').value,
        keterangan: document.getElementById('keterangan').value.trim(),
        tanggalInput: isEditing 
            ? appData.find(item => item.id === parseInt(editId)).tanggalInput 
            : new Date().toISOString()
    };
    
    if (isEditing) {
        const index = appData.findIndex(item => item.id === parseInt(editId));
        if (index > -1) {
            appData[index] = formData;
            showNotification('Data berhasil diperbarui!', 'success');
        }
    } else {
        appData.push(formData);
        showNotification('Data berhasil disimpan!', 'success');
    }
    
    saveData();
    resetForm();
    updateDashboard();
    renderDataTable();

    // Pindah ke tab data setelah berhasil menyimpan
    new bootstrap.Tab(document.getElementById('v-pills-data-tab')).show();
}

function resetForm() {
    document.getElementById('inputForm').reset();
    document.getElementById('inputForm').removeAttribute('data-edit-id');
    document.getElementById('jabatan').value = 'Individu';
    document.getElementById('namaKelompok').value = '';
    document.getElementById('tahunAnggaran').value = appSettings.defaultTahun;
    document.getElementById('tanggalTerima').value = new Date().toISOString().split('T')[0];
    document.getElementById('kodeValidasi').value = '';
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
}

function setError(id, message) {
    document.getElementById(id).classList.add('input-error');
    const errorEl = document.getElementById(`${id}Error`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function clearError(id) {
    document.getElementById(id).classList.remove('input-error');
    const errorEl = document.getElementById(`${id}Error`);
    if (errorEl) errorEl.style.display = 'none';
}

function validateForm() {
    let isValid = true;
    const requiredFields = ['nama', 'nik', 'whatsapp', 'namaPetugas', 'namaBantuan', 'jumlahBantuan', 'kodeValidasi', 'kecamatan', 'desa', 'tanggalTerima'];
    requiredFields.forEach(id => {
        if (!document.getElementById(id).value.trim()) {
            setError(id, 'Kolom ini wajib diisi.');
            isValid = false;
        }
    });

    // NIK validation
    const nik = document.getElementById('nik').value.trim();
    if (nik && !/^\d{16}$/.test(nik)) {
        setError('nik', 'NIK harus terdiri dari 16 digit angka.');
        isValid = false;
    } else if (isNikExists(nik)) {
        setError('nik', 'NIK ini sudah terdaftar di sistem.');
        isValid = false;
    }

    // WhatsApp validation
    const whatsapp = document.getElementById('whatsapp').value.replace(/\D/g, '');
    if (whatsapp && !/^\d{9,13}$/.test(whatsapp)) {
        setError('whatsapp', 'Nomor WhatsApp tidak valid (9-13 digit).');
        isValid = false;
    }

    // Drive Link validation
    const driveLink = document.getElementById('driveLink').value.trim();
    if (driveLink && !/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(driveLink)) {
        setError('driveLink', 'Format URL Google Drive tidak valid.');
        isValid = false;
    }

    return isValid;
}

function isNikExists(nik) {
    const editId = document.getElementById('inputForm').getAttribute('data-edit-id');
    return appData.some(data => data.nik === nik && data.id !== (editId ? parseInt(editId) : null));
}

function setBukanKelompok() {
    document.getElementById('namaKelompok').value = 'Individu';
    document.getElementById('jabatan').value = 'Individu';
}

function handleJabatanChange() {
    const jabatan = document.getElementById('jabatan').value;
    const namaKelompok = document.getElementById('namaKelompok');
    if (jabatan === 'Individu') {
        namaKelompok.value = 'Individu';
    } else if (namaKelompok.value.toLowerCase() === 'individu') {
        namaKelompok.value = ''; // Kosongkan jika bukan individu
    }
}

function generateKodeValidasi() {
    const nikInput = document.getElementById('nik');
    const nik = nikInput.value.trim();
    clearError('nik');

    if (!/^\d{16}$/.test(nik)) {
        setError('nik', 'Isi NIK dengan 16 digit angka sebelum generate kode.');
        showNotification('NIK tidak valid untuk generate kode.', 'error');
        return;
    }
    if (isNikExists(nik)) {
        setError('nik', 'NIK ini sudah terdaftar, tidak bisa generate kode baru.');
        showNotification('NIK sudah terdaftar.', 'error');
        return;
    }

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    document.getElementById('kodeValidasi').value = result;
    clearError('kodeValidasi');
    showNotification('Kode validasi berhasil digenerate.', 'success');
}

function updateSatuanBantuan() {
    const jenis = document.getElementById('jenisBantuan').value;
    const satuanSelect = document.getElementById('satuanBantuan');
    const options = {
        'Uang': ['Rupiah'],
        'Barang': ['Unit', 'Paket', 'Set', 'Buah', 'Ekor'],
        'Jasa': ['Jam', 'Hari', 'Paket', 'Kegiatan']
    };
    satuanSelect.innerHTML = (options[jenis] || []).map(opt => `<option value="${opt}">${opt}</option>`).join('');
}

// --- DATA PERSISTENCE (LocalStorage) ---
function loadData() {
    try {
        const savedData = localStorage.getItem('barjasData');
        appData = savedData ? JSON.parse(savedData) : [];
        const savedCodes = localStorage.getItem('barjasGeneratedCodes');
        generatedCodes = savedCodes ? JSON.parse(savedCodes) : {};
    } catch (e) {
        console.error("Gagal memuat data:", e);
        appData = [];
        generatedCodes = {};
    }
    renderDataTable();
}

function saveData() {
    localStorage.setItem('barjasData', JSON.stringify(appData));
    localStorage.setItem('barjasGeneratedCodes', JSON.stringify(generatedCodes));
}

function loadSettings() {
    const savedSettings = localStorage.getItem('barjasSettings');
    if (savedSettings) {
        Object.assign(appSettings, JSON.parse(savedSettings));
    }
}

function saveSettings() {
    localStorage.setItem('barjasSettings', JSON.stringify(appSettings));
}

function applySettingsToUI() {
    document.getElementById('itemsPerPage').value = appSettings.itemsPerPage;
    document.getElementById('notifications').checked = appSettings.notifications;
    document.getElementById('appName').value = appSettings.appName;
    document.getElementById('appSubtitle').value = appSettings.appSubtitle;
    document.getElementById('defaultTahun').value = appSettings.defaultTahun;
    document.getElementById('lastBackupDate').textContent = appSettings.lastBackupDate;

    document.querySelector('.app-title').textContent = appSettings.appName;
    document.querySelectorAll('.app-subtitle')[0].textContent = appSettings.appSubtitle;
}

function handleSaveSettings(e) {
    e.preventDefault();
    const newSecurityCode = document.getElementById('settingSecurityCode').value;
    if (newSecurityCode) appSettings.securityCode = newSecurityCode;
    
    appSettings.itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    appSettings.notifications = document.getElementById('notifications').checked;
    appSettings.appName = document.getElementById('appName').value;
    appSettings.appSubtitle = document.getElementById('appSubtitle').value;
    appSettings.defaultTahun = document.getElementById('defaultTahun').value;

    saveSettings();
    applySettingsToUI();
    showNotification('Pengaturan berhasil disimpan.', 'success');
    renderDataTable();
}

// --- DATA TABLE, PAGINATION, SEARCH, FILTER ---
function renderDataTable() {
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = '';
    
    const dataToRender = isFilterActive ? filteredData : appData;
    const itemsPerPage = parseInt(appSettings.itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, dataToRender.length);
    
    if (dataToRender.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="17" class="text-center py-4">Tidak ada data</td></tr>`;
        document.getElementById('tableInfo').textContent = 'Menampilkan 0 dari 0 data';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    for (let i = startIndex; i < endIndex; i++) {
        const data = dataToRender[i];
        const row = document.createElement('tr');
        const whatsappDisplay = data.whatsapp ? `0${data.whatsapp}` : '-';
        
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${data.nama}</td>
            <td>${data.nik}</td>
            <td><a href="https://wa.me/62${data.whatsapp}" target="_blank" class="whatsapp-number">${whatsappDisplay}</a></td>
            <td>${data.namaKelompok || '-'}</td>
            <td>${data.jabatan || '-'}</td>
            <td>${data.tahunAnggaran}</td>
            <td>${data.kecamatan}</td>
            <td>${data.desa}</td>
            <td>${data.jenisBantuan}</td>
            <td>${data.namaBantuan || '-'}</td>
            <td>${formatNumber(data.jumlahBantuan)} ${data.satuanBantuan}</td>
            <td>${formatDate(data.tanggalTerima)}</td>
            <td>${data.namaPetugas || '-'}</td>
            <td>${data.driveLink ? `<a href="${data.driveLink}" class="drive-link" target="_blank"><i class="fas fa-external-link-alt"></i> Buka</a>` : '-'}</td>
            <td>${data.kodeValidasi}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-primary" onclick="editData(${data.id})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger" onclick="deleteData(${data.id})" title="Hapus"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    }
    
    document.getElementById('tableInfo').textContent = `Menampilkan ${startIndex + 1} - ${endIndex} dari ${dataToRender.length} data`;
    updatePagination(dataToRender.length);
}

function updatePagination(totalItems) {
    const itemsPerPage = parseInt(appSettings.itemsPerPage);
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginationEl = document.getElementById('pagination');
    paginationEl.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    const createPageItem = (page, text, disabled = false, active = false) => {
        const li = document.createElement('li');
        li.className = `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${page}); return false;">${text}</a>`;
        return li;
    };

    paginationEl.appendChild(createPageItem(currentPage - 1, '<i class="fas fa-chevron-left"></i>', currentPage === 1));

    // Logic to show limited page numbers
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationEl.appendChild(createPageItem(i, i, false, i === currentPage));
    }

    paginationEl.appendChild(createPageItem(currentPage + 1, '<i class="fas fa-chevron-right"></i>', currentPage === totalPages));
}

function changePage(page) {
    const dataToRender = isFilterActive ? filteredData : appData;
    const totalPages = Math.ceil(dataToRender.length / parseInt(appSettings.itemsPerPage));
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderDataTable();
    }
}

function handleSearch() {
    const searchTerm = document.getElementById('searchData').value.toLowerCase();
    isFilterActive = !!searchTerm;
    filteredData = isFilterActive ? appData.filter(d => Object.values(d).some(v => String(v).toLowerCase().includes(searchTerm))) : [];
    currentPage = 1;
    renderDataTable();
}

function clearSearch() {
    document.getElementById('searchData').value = '';
    handleSearch();
}

function applyFilter() {
    const filters = {
        tahun: document.getElementById('filterTahun').value,
        kecamatan: document.getElementById('filterKecamatan').value,
        desa: document.getElementById('filterDesa').value,
        jenis: document.getElementById('filterJenis').value,
    };
    
    filteredData = appData.filter(d => 
        (!filters.tahun || d.tahunAnggaran == filters.tahun) &&
        (!filters.kecamatan || d.kecamatan === filters.kecamatan) &&
        (!filters.desa || d.desa === filters.desa) &&
        (!filters.jenis || d.jenisBantuan === filters.jenis)
    );
    
    renderFilterTable();
    document.getElementById('filterResultCount').textContent = `${filteredData.length} Data`;
    showNotification(`Filter diterapkan. Ditemukan ${filteredData.length} data.`, 'success');
}

function resetFilter() {
    ['filterTahun', 'filterKecamatan', 'filterDesa', 'filterJenis'].forEach(id => document.getElementById(id).value = '');
    filteredData = [];
    renderFilterTable();
    document.getElementById('filterResultCount').textContent = '0 Data';
    showNotification('Filter direset.', 'info');
}

function renderFilterTable() {
    const tableBody = document.getElementById('filterTableBody');
    tableBody.innerHTML = '';
    
    if (filteredData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="16" class="text-center py-4">Tidak ada data yang sesuai</td></tr>`;
        return;
    }
    
    filteredData.forEach((data, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${i + 1}</td> <td>${data.nama}</td> <td>${data.nik}</td> <td>0${data.whatsapp}</td>
            <td>${data.namaKelompok || '-'}</td> <td>${data.jabatan || '-'}</td> <td>${data.tahunAnggaran}</td>
            <td>${data.kecamatan}</td> <td>${data.desa}</td> <td>${data.jenisBantuan}</td>
            <td>${data.namaBantuan || '-'}</td> <td>${formatNumber(data.jumlahBantuan)} ${data.satuanBantuan}</td>
            <td>${formatDate(data.tanggalTerima)}</td> <td>${data.namaPetugas || '-'}</td>
            <td>${data.driveLink ? 'Ya' : 'Tidak'}</td> <td>${data.kodeValidasi}</td>
        `;
        tableBody.appendChild(row);
    });
}

// --- CRUD ACTIONS ---
window.editData = function(id) {
    const data = appData.find(item => item.id === id);
    if (!data) return;
    
    Object.keys(data).forEach(key => {
        const el = document.getElementById(key);
        if (el) el.value = data[key];
    });

    // Trigger input event for correct formatting
    const whatsappInput = document.getElementById('whatsapp');
    whatsappInput.value = data.whatsapp; // Set the raw number
    
    document.getElementById('inputForm').setAttribute('data-edit-id', id);
    new bootstrap.Tab(document.getElementById('v-pills-input-tab')).show();
    window.scrollTo(0, 0);
    showNotification('Mode edit aktif. Klik "Simpan Data" setelah selesai.', 'info');
};

window.deleteData = function(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini secara permanen?')) {
        appData = appData.filter(item => item.id !== id);
        saveData();
        showNotification('Data berhasil dihapus.', 'success');
        updateDashboard();
        renderDataTable();
    }
};

// --- DASHBOARD & CHARTS ---
function updateDashboard() {
    document.getElementById('totalPenerima').textContent = formatNumber(appData.length);
    
    const uangData = appData.filter(d => d.jenisBantuan === 'Uang');
    const totalBantuan = uangData.reduce((sum, d) => sum + (parseFloat(d.jumlahBantuan) || 0), 0);
    document.getElementById('totalBantuan').textContent = `Rp ${formatNumber(totalBantuan)}`;
    
    const tahunCount = appData.reduce((acc, d) => ({...acc, [d.tahunAnggaran]: (acc[d.tahunAnggaran] || 0) + 1}), {});
    const tahunAktif = Object.keys(tahunCount).reduce((a, b) => tahunCount[a] > tahunCount[b] ? a : b, appSettings.defaultTahun);
    document.getElementById('tahunAktif').textContent = tahunAktif;
    
    const rataBantuan = uangData.length > 0 ? totalBantuan / uangData.length : 0;
    document.getElementById('rataBantuan').textContent = `Rp ${formatNumber(rataBantuan.toFixed(0))}`;
    
    updateCharts();
    updateRecentData();
    document.getElementById('settingsDataCount').textContent = appData.length;
}

function updateRecentData() {
    const recentDataContainer = document.getElementById('recentData');
    recentDataContainer.innerHTML = '';
    
    const recent = [...appData].sort((a, b) => new Date(b.tanggalInput) - new Date(a.tanggalInput)).slice(0, 5);
    
    if (recent.length === 0) {
        recentDataContainer.innerHTML = `<tr><td colspan="5" class="text-center">Tidak ada data</td></tr>`;
        return;
    }
    
    recent.forEach(d => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(d.tanggalInput)}</td> <td>${d.nama}</td> <td>${d.desa}</td>
            <td>${d.namaBantuan}</td> <td>${formatNumber(d.jumlahBantuan)} ${d.satuanBantuan}</td>
        `;
        recentDataContainer.appendChild(row);
    });
}

function initializeCharts() {
    Chart.defaults.font.family = "'Poppins', 'Segoe UI', sans-serif";
    const pieCtx = document.getElementById('kecamatanChart')?.getContext('2d');
    if (pieCtx) {
        window.kecamatanChart = new Chart(pieCtx, { type: 'pie', options: { responsive: true, plugins: { legend: { position: 'right' } } } });
    }
    
    const barCtx = document.getElementById('tahunChart')?.getContext('2d');
    if (barCtx) {
        window.tahunChart = new Chart(barCtx, { type: 'bar', options: { responsive: true, scales: { y: { beginAtZero: true } } } });
    }
}

function updateCharts() {
    if (!appData || appData.length === 0) return;

    const kecamatanData = appData.reduce((acc, d) => ({...acc, [d.kecamatan]: (acc[d.kecamatan] || 0) + 1}), {});
    if (window.kecamatanChart) {
        window.kecamatanChart.data = {
            labels: Object.keys(kecamatanData),
            datasets: [{ data: Object.values(kecamatanData), backgroundColor: ['#0d47a1', '#1976d2', '#2196f3', '#64b5f6', '#90caf9', '#00695c', '#00897b', '#26a69a', '#80cbc4', '#b2dfdb', '#ff8f00', '#ffa000', '#ffb300', '#ffca28', '#ffecb3'] }]
        };
        window.kecamatanChart.update();
    }
    
    const tahunData = appData.reduce((acc, d) => ({...acc, [d.tahunAnggaran]: (acc[d.tahunAnggaran] || 0) + 1}), {});
    const sortedYears = Object.keys(tahunData).sort();
    if (window.tahunChart) {
        window.tahunChart.data = {
            labels: sortedYears,
            datasets: [{ label: 'Jumlah Penerima', data: sortedYears.map(year => tahunData[year]), backgroundColor: '#00695c' }]
        };
        window.tahunChart.update();
    }
}

// --- PRINT, PREVIEW & EXPORT ---
function getFilteredDataForExport(prefix) {
    const filters = {
        tahun: document.getElementById(`${prefix}Tahun`).value,
        kecamatan: document.getElementById(`${prefix}Kecamatan`).value,
        jenis: document.getElementById(`${prefix}Jenis`).value,
    };
    
    if (!filters.tahun && !filters.kecamatan && !filters.jenis) return appData;

    return appData.filter(d => 
        (!filters.tahun || d.tahunAnggaran == filters.tahun) &&
        (!filters.kecamatan || d.kecamatan === filters.kecamatan) &&
        (!filters.jenis || d.jenisBantuan === filters.jenis)
    );
}

function printToPdf() {
    const dataToPrint = getFilteredDataForExport('print');
    if (dataToPrint.length === 0) return showNotification('Tidak ada data untuk dicetak sesuai filter.', 'warning');
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'pt', 'a4');
    
    doc.setFontSize(18);
    doc.text('LAPORAN DATA BANTUAN', doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    
    const cols = ["No", "Nama", "NIK", "Desa", "Kecamatan", "Nama Bantuan", "Jumlah", "Tanggal"];
    const rows = dataToPrint.map((d, i) => [
        i + 1, d.nama, d.nik, d.desa, d.kecamatan, d.namaBantuan || '-',
        `${formatNumber(d.jumlahBantuan)} ${d.satuanBantuan}`, formatDate(d.tanggalTerima)
    ]);
    
    doc.autoTable({ head: [cols], body: rows, startY: 60, theme: 'grid', headStyles: { fillColor: [13, 71, 161] } });
    doc.save(`laporan_bantuan_${new Date().toISOString().slice(0,10)}.pdf`);
    showNotification('Laporan PDF berhasil diunduh.', 'success');
}

function showPreview() {
    const dataToPreview = getFilteredDataForExport('print');
    if (dataToPreview.length === 0) return showNotification('Tidak ada data untuk pratinjau sesuai filter.', 'warning');

    document.getElementById('previewModalTitle').textContent = `Pratinjau Laporan (${dataToPreview.length} data)`;
    let content = `
        <div class="print-header text-center mb-4">
            <h4>LAPORAN DATA BANTUAN</h4>
            <p class="mb-1">Sistem Bantuan Terpadu (BARJAS)</p>
            <p class="text-muted">Tanggal: ${formatDate(new Date().toISOString())}</p>
        </div>
        <table class="preview-table"><thead><tr>
            <th>No</th><th>Nama</th><th>NIK</th><th>Desa</th><th>Nama Bantuan</th><th>Jumlah</th><th>Tanggal</th>
        </tr></thead><tbody>`;

    dataToPreview.forEach((d, i) => {
        content += `<tr>
            <td>${i + 1}</td><td>${d.nama}</td><td>${d.nik}</td><td>${d.desa}</td>
            <td>${d.namaBantuan}</td><td>${formatNumber(d.jumlahBantuan)} ${d.satuanBantuan}</td><td>${formatDate(d.tanggalTerima)}</td>
        </tr>`;
    });

    content += `</tbody></table>`;
    document.getElementById('previewContent').innerHTML = content;
    new bootstrap.Modal(document.getElementById('previewModal')).show();
}

function exportData(format) {
    const dataToExport = getFilteredDataForExport('export');
    if (dataToExport.length === 0) return showNotification('Tidak ada data untuk diekspor sesuai filter.', 'warning');

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `data_bantuan_${timestamp}`;

    switch(format) {
        case 'excel':
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Data');
            XLSX.writeFile(wb, `${filename}.xlsx`);
            break;
        case 'csv':
            const csvWs = XLSX.utils.json_to_sheet(dataToExport);
            const csv = XLSX.utils.sheet_to_csv(csvWs);
            downloadFile(csv, 'text/csv', `${filename}.csv`);
            break;
        case 'json':
            downloadFile(JSON.stringify(dataToExport, null, 2), 'application/json', `${filename}.json`);
            break;
        case 'pdf':
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape', 'pt', 'a4');
            doc.text('DATA BANTUAN', doc.internal.pageSize.getWidth()/2, 40, {align: 'center'});
            doc.autoTable({ body: dataToExport, startY: 60, theme: 'grid', headStyles: { fillColor: [13, 71, 161] } });
            doc.save(`${filename}.pdf`);
            break;
    }
    showNotification(`Data berhasil diekspor ke format ${format.toUpperCase()}.`, 'success');
}

function downloadFile(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- BACKUP, RESTORE, RESET & RELOAD FROM REPO ---

function autoBackupData() {
    if (appData.length === 0) {
        return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${appSettings.appName} - auto-backup-${timestamp}`;
    const dataToBackup = { appData, appSettings, generatedCodes };
    
    const dataStr = btoa(unescape(encodeURIComponent(JSON.stringify(dataToBackup))));
    downloadFile(dataStr, 'application/json', `${filename}.json`);
    
    appSettings.lastBackupDate = new Date().toLocaleDateString('id-ID');
    saveSettings();
    applySettingsToUI();
}

function backupData() {
    if (appData.length === 0) return showNotification('Tidak ada data untuk dibackup.', 'warning');
    
    const filename = document.getElementById('backupFileName').value || 'backup-barjas-secure';
    const dataToBackup = { appData, appSettings, generatedCodes };
    const dataStr = btoa(unescape(encodeURIComponent(JSON.stringify(dataToBackup))));
    
    downloadFile(dataStr, 'application/json', `${filename}-${new Date().toISOString().slice(0,10)}.json`);
    
    appSettings.lastBackupDate = new Date().toLocaleDateString('id-ID');
    saveSettings();
    applySettingsToUI();
    showNotification('Backup data terenkripsi berhasil diunduh.', 'success');
}

// --- NEW FUNCTION: Reload Data From Repo (reload.js) ---
// VERSI DIPERBARUI: Mendukung data terenkripsi (Base64)
function handleReloadFromRepo() {
    if(!confirm("Apakah Anda yakin ingin me-reload data dari repository? Data lokal saat ini akan ditimpa dengan data dari file reload.js.")) return;

    // Tampilkan loading di tombol
    const btn = document.getElementById('btn-reload-repo');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin feature-icon"></i> Loading...';
    btn.disabled = true;

    // Hapus script lama jika ada
    const oldScript = document.getElementById('reload-script');
    if(oldScript) oldScript.remove();

    // Buat element script baru
    const script = document.createElement('script');
    script.id = 'reload-script';
    script.src = './reload.js?v=' + new Date().getTime(); // Cache busting

    script.onload = function() {
        try {
            // 1. Ambil konten raw dari global variable di reload.js
            if (window.BARJAS_BACKUP_ENCRYPTED) {
                const rawContent = window.BARJAS_BACKUP_ENCRYPTED;
                let restored;

                // 2. Coba DEKRIPSI (Sama seperti fitur Restore)
                try {
                    // Jika formatnya string (terenkripsi/base64)
                    if (typeof rawContent === 'string') {
                        restored = JSON.parse(decodeURIComponent(escape(atob(rawContent))));
                    } else {
                        // Fallback jika user paste JSON mentah (bukan kode acak)
                        restored = rawContent;
                    }
                } catch (decryptionError) {
                    throw new Error("Data belum tersedia di database admin atau format tidak valid.");
                }
                
                // 3. Validasi & Terapkan Data
                if(restored && restored.appData && Array.isArray(restored.appData)) {
                    // Update data aplikasi
                    appData = restored.appData;
                    if(restored.appSettings) Object.assign(appSettings, restored.appSettings);
                    if(restored.generatedCodes) generatedCodes = restored.generatedCodes;

                    // Simpan ke localStorage
                    saveData();
                    saveSettings();
                    
                    // Update UI
                    applySettingsToUI();
                    updateDashboard();
                    renderDataTable();
                    
                    showNotification('Data berhasil di-reload & didekripsi dari Repository!', 'success');
                } else {
                    throw new Error('Format data hasil dekripsi tidak valid.');
                }
            } else {
                throw new Error('Variabel window.BARJAS_BACKUP_ENCRYPTED tidak ditemukan di reload.js.');
            }
        } catch (e) {
            showNotification('Error: ' + e.message, 'error');
            console.error(e);
        } finally {
            // Reset tombol
            btn.innerHTML = originalText;
            btn.disabled = false;
            
            // Bersihkan variable global agar memori bersih
            delete window.BARJAS_BACKUP_ENCRYPTED;
        }
    };

    script.onerror = function() {
        showNotification('Gagal memuat file reload.js. Pastikan file sudah ada di repository.', 'error');
        btn.innerHTML = originalText;
        btn.disabled = false;
    };

    // Tambahkan ke body untuk eksekusi
    document.body.appendChild(script);
}

function enableRestoreButton() {
    document.getElementById('restoreDataBtn').disabled = !this.files.length;
}

function restoreData() {
    const file = document.getElementById('restoreFileInput').files[0];
    if (!file || !confirm('PENTING: Restore akan menimpa semua data dan pengaturan yang ada saat ini. Lanjutkan?')) return;
    
    const reader = new FileReader();
    reader.onload = e => {
        try {
            let restored;
            const content = e.target.result;
            try {
                restored = JSON.parse(decodeURIComponent(escape(atob(content))));
            } catch (err) {
                restored = JSON.parse(content);
            }

            if (restored.appData && restored.appSettings) {
                appData = restored.appData;
                Object.assign(appSettings, restored.appSettings);
                generatedCodes = restored.generatedCodes || {};

                saveData();
                saveSettings();
                applySettingsToUI();
                document.getElementById('restoreFileInput').value = '';
                document.getElementById('restoreDataBtn').disabled = true;
                updateDashboard();
                renderDataTable();
                showNotification('Data dan pengaturan berhasil direstore.', 'success');
            } else {
                throw new Error("Format file backup tidak valid.");
            }
        } catch (error) {
            showNotification('Gagal merestore data. File mungkin rusak atau tidak valid.', 'error');
            console.error('Restore error:', error);
        }
    };
    reader.readAsText(file);
}

function enableResetButton() {
    document.getElementById('confirmResetBtn').disabled = this.value !== 'RESET';
}

function resetData() {
    appData = [];
    generatedCodes = {};
    saveData();
    
    const resetModal = bootstrap.Modal.getInstance(document.getElementById('confirmResetModal'));
    if(resetModal) resetModal.hide();
    
    document.getElementById('resetConfirmationInput').value = '';
    updateDashboard();
    renderDataTable();
    showNotification('PERHATIAN: Semua data telah direset!', 'warning');
}

// --- UTILITY & HELPER FUNCTIONS ---
function setupBrowserInfo() {
    const agent = navigator.userAgent;
    let browserName = "Unknown";
    if (agent.indexOf("Firefox") > -1) browserName = "Firefox";
    else if (agent.indexOf("Chrome") > -1) browserName = "Chrome";
    else if (agent.indexOf("Safari") > -1) browserName = "Safari";
    document.getElementById('browserInfo').textContent = browserName;
    
    try {
        const usedStorage = (JSON.stringify(localStorage).length / 1024).toFixed(2);
        document.getElementById('storageInfo').textContent = `${usedStorage} KB`;
    } catch (e) {
        document.getElementById('storageInfo').textContent = 'Error';
    }
}

function toggleMobileMenu() {
    document.getElementById('sidebarMenu').classList.toggle('mobile-show');
    document.getElementById('sidebarOverlay').classList.toggle('mobile-show');
}

function showNotification(message, type = 'info') {
    if (!appSettings.notifications) return;

    const toastEl = document.querySelector('.notification-toast');
    const toastHeader = toastEl.querySelector('.toast-header');
    const toastTitle = document.getElementById('toastTitle');
    document.getElementById('toastMessage').textContent = message;
    
    const styles = {
        success: { bg: 'bg-success-subtle', text: 'text-success-emphasis', title: 'Berhasil' },
        error: { bg: 'bg-danger-subtle', text: 'text-danger-emphasis', title: 'Gagal' },
        warning: { bg: 'bg-warning-subtle', text: 'text-warning-emphasis', title: 'Peringatan' },
        info: { bg: 'bg-primary-subtle', text: 'text-primary-emphasis', title: 'Informasi' }
    };
    
    toastHeader.className = `toast-header ${styles[type].bg} ${styles[type].text}`;
    toastTitle.textContent = styles[type].title;
    
    new bootstrap.Toast(toastEl).show();
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatNumber(num) {
    if (isNaN(num)) return num; // Return original if not a number
    return new Intl.NumberFormat('id-ID').format(num);
}
