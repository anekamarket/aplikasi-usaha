// Set locale to Indonesian
moment.locale('id');

// Initialize jsPDF
const { jsPDF } = window.jspdf;

// Data storage
const STORAGE_KEYS = {
    MENUS: 'warungmakan_menus',
    CATEGORIES: 'warungmakan_categories',
    ORDERS: 'warungmakan_orders',
    USER: 'warungmakan_user',
    CURRENT_ORDER: 'warungmakan_current_order',
    SETTINGS: 'warungmakan_settings',
    USERS: 'warungmakan_users',
    MEMBERS: 'warungmakan_members',
    SHIFT_DATA: 'warungmakan_shift_data',
    PROFIT_SETTINGS: 'warungmakan_profit_settings',
    KITCHEN_HISTORY: 'warungmakan_kitchen_history',
    THEME: 'warungmakan_theme' // Key baru untuk tema
};

// Kunci rahasia untuk enkripsi dan dekripsi file backup.
const ENCRYPTION_KEY = 'LenteraKaryaSitubondo-SecretKey-2025';

const DEFAULT_TRIAL_USER = {
    id: 'U-PREMIUM-001',
    username: 'admin',
    password: CryptoJS.SHA256('Situbondo-Naik-Kelas').toString(),
    name: 'Administrator Premium',
    role: 'admin',
    permissions: {
        add_menu: true,
        edit_menu: true,
        delete_menu: true,
        manage_categories: true,
        manage_members: true,
        manage_store_info: true,
        view_reports: true,
        transaction_history: true,
        kitchen_display: true,
        control_panel: true,
        backup_restore: true,
        reset_data: true,
        shift_management: true,
        profit_calculation: true,
        delete_kitchen_history: true,
        reprint_receipt: true // PERBAIKAN: Tambah permission cetak ulang struk
    }
};

const DEFAULT_CASHIER_USER = {
    id: 'U-CASHIER-001',
    username: 'kasir',
    password: CryptoJS.SHA256('kasir123').toString(),
    name: 'Kasir Premium',
    role: 'cashier',
    permissions: {
        add_menu: false,
        edit_menu: false,
        delete_menu: false,
        manage_categories: false,
        manage_members: true,
        manage_store_info: false,
        view_reports: true,
        transaction_history: true,
        kitchen_display: true,
        control_panel: false,
        backup_restore: false,
        reset_data: false,
        shift_management: true,
        profit_calculation: false,
        delete_kitchen_history: false,
        reprint_receipt: true // PERBAIKAN: Tambah permission cetak ulang struk
    }
};

const DEFAULT_MENU_IMAGES = {
    'Makanan': {
        'Nasi Goreng': 'https://raw.githubusercontent.com/LKS-88/aplikasi-transaksi-cafe-resto/refs/heads/main/nasi%20goreng.jpeg',
        'Mie Goreng': 'https://raw.githubusercontent.com/LKS-88/aplikasi-transaksi-cafe-resto/refs/heads/main/mie%20goreng.jpeg',
        'Ayam Goreng': 'https://raw.githubusercontent.com/LKS-88/aplikasi-transaksi-cafe-resto/refs/heads/main/ayam%20goreng.jpeg'
    },
    'Minuman': {
        'Es Teh': 'https://raw.githubusercontent.com/LKS-88/aplikasi-transaksi-cafe-resto/refs/heads/main/minuman%20segar.jpeg',
        'Es Jeruk': 'https://raw.githubusercontent.com/LKS-88/aplikasi-transaksi-cafe-resto/refs/heads/main/minuman%20segar.jpeg'
    }
};

// Default permissions berdasarkan role
const DEFAULT_PERMISSIONS = {
    admin: {
        add_menu: true,
        edit_menu: true,
        delete_menu: true,
        manage_categories: true,
        manage_members: true,
        manage_store_info: true,
        view_reports: true,
        transaction_history: true,
        kitchen_display: true,
        control_panel: true,
        backup_restore: true,
        reset_data: true,
        shift_management: true,
        profit_calculation: true,
        delete_kitchen_history: true,
        reprint_receipt: true // PERBAIKAN: Tambah permission cetak ulang struk
    },
    cashier: {
        add_menu: false,
        edit_menu: false,
        delete_menu: false,
        manage_categories: false,
        manage_members: true,
        manage_store_info: false,
        view_reports: true,
        transaction_history: true,
        kitchen_display: true,
        control_panel: false,
        backup_restore: false,
        reset_data: false,
        shift_management: true,
        profit_calculation: false,
        delete_kitchen_history: false,
        reprint_receipt: true // PERBAIKAN: Tambah permission cetak ulang struk
    }
};

// Tema warna yang tersedia
const THEMES = {
    default: {
        name: 'Default (Hijau)',
        primary: '#28a745',
        primaryLight: '#86e29b',
        primaryDark: '#1e7e34',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
        light: '#f8f9fa',
        dark: '#343a40',
        gray: '#6c757d',
        white: '#ffffff',
        black: '#000000'
    },
    blue: {
        name: 'Biru',
        primary: '#2196F3',
        primaryLight: '#64B5F6',
        primaryDark: '#0D47A1',
        secondary: '#6c757d',
        success: '#4CAF50',
        danger: '#F44336',
        warning: '#FF9800',
        info: '#00BCD4',
        light: '#f8f9fa',
        dark: '#343a40',
        gray: '#6c757d',
        white: '#ffffff',
        black: '#000000'
    },
    purple: {
        name: 'Ungu',
        primary: '#9C27B0',
        primaryLight: '#BA68C8',
        primaryDark: '#6A1B9A',
        secondary: '#6c757d',
        success: '#4CAF50',
        danger: '#F44336',
        warning: '#FF9800',
        info: '#00BCD4',
        light: '#f8f9fa',
        dark: '#343a40',
        gray: '#6c757d',
        white: '#ffffff',
        black: '#000000'
    },
    orange: {
        name: 'Oranye',
        primary: '#FF9800',
        primaryLight: '#FFB74D',
        primaryDark: '#EF6C00',
        secondary: '#6c757d',
        success: '#4CAF50',
        danger: '#F44336',
        warning: '#FF9800',
        info: '#00BCD4',
        light: '#f8f9fa',
        dark: '#343a40',
        gray: '#6c757d',
        white: '#ffffff',
        black: '#000000'
    },
    red: {
        name: 'Merah',
        primary: '#F44336',
        primaryLight: '#EF9A9A',
        primaryDark: '#C62828',
        secondary: '#6c757d',
        success: '#4CAF50',
        danger: '#F44336',
        warning: '#FF9800',
        info: '#00BCD4',
        light: '#f8f9fa',
        dark: '#343a40',
        gray: '#6c757d',
        white: '#ffffff',
        black: '#000000'
    },
    dark: {
        name: 'Gelap',
        primary: '#343a40',
        primaryLight: '#6c757d',
        primaryDark: '#212529',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
        light: '#f8f9fa',
        dark: '#343a40',
        gray: '#6c757d',
        white: '#ffffff',
        black: '#000000'
    },
    teal: {
        name: 'Teal',
        primary: '#009688',
        primaryLight: '#4DB6AC',
        primaryDark: '#00695C',
        secondary: '#6c757d',
        success: '#4CAF50',
        danger: '#F44336',
        warning: '#FF9800',
        info: '#00BCD4',
        light: '#f8f9fa',
        dark: '#343a40',
        gray: '#6c757d',
        white: '#ffffff',
        black: '#000000'
    }
};

let menus, categories, orders, settings, users, members, currentUser, currentOrder;
let shiftData, profitSettings, kitchenHistory;
let kitchenInterval;
let passwordPromptCallback = null;
let captchaText = '';
let welcomeToastTimeout = null;
let countdownInterval = null;
let currentShift = null;
let currentTheme = 'default'; // Variabel untuk tema saat ini

// PERBAIKAN: Variabel untuk mengontrol interval kitchen
let kitchenRefreshInterval = null;
let kitchenLastRefreshTime = null;

// FUNGSI BARU: Tampilkan loading overlay
function showLoading(message = 'Memproses...') {
    $('#loadingMessage').text(message);
    $('#globalLoading').css('display', 'flex');
}

// FUNGSI BARU: Sembunyikan loading overlay
function hideLoading() {
    $('#globalLoading').hide();
}

// FUNGSI BARU: Tampilkan modal loading
function showModalLoading(message = 'Memproses...') {
    $('#modalLoadingMessage').text(message);
    $('#modalLoading').css('display', 'flex');
}

// FUNGSI BARU: Sembunyikan modal loading
function hideModalLoading() {
    $('#modalLoading').hide();
}

// FUNGSI BARU: Toggle password visibility
function togglePasswordVisibility(inputId, toggleBtn) {
    const input = $(inputId);
    const type = input.attr('type') === 'password' ? 'text' : 'password';
    input.attr('type', type);
    
    // Ubah ikon
    const icon = toggleBtn.find('i');
    if (type === 'text') {
        icon.removeClass('fa-eye').addClass('fa-eye-slash');
    } else {
        icon.removeClass('fa-eye-slash').addClass('fa-eye');
    }
}

// FUNGSI BARU: Terapkan tema
function applyTheme(themeName) {
    // Validasi tema
    if (!THEMES[themeName]) {
        themeName = 'default';
    }
    
    currentTheme = themeName;
    const theme = THEMES[themeName];
    
    // Simpan tema ke localStorage
    localStorage.setItem(STORAGE_KEYS.THEME, themeName);
    
    // Update CSS variables
    const root = document.documentElement;
    Object.keys(theme).forEach(key => {
        if (key !== 'name') {
            root.style.setProperty(`--${key}`, theme[key]);
        }
    });
    
    // Update nama tema di modal
    $('#currentThemeName').text(theme.name);
    
    // Update tombol tema aktif
    $('.theme-option').removeClass('active');
    $(`.theme-option[data-theme="${themeName}"]`).addClass('active');
    
    // Update loading spinner color
    $('.loading-spinner').css('border-top-color', theme.primary);
    $('.modal-loading-spinner').css('border-top-color', theme.primary);
    
    // Update warna badge premium
    $('.premium-badge').css('background', `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryLight} 100%)`);
}

// FUNGSI BARU: Load tema saat inisialisasi
function loadTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'default';
    applyTheme(savedTheme);
}

// FUNGSI BARU: Buka modal pengaturan tema
function openThemeSettingsModal() {
    $('#themeSettingsModal').css('display', 'flex');
    
    // Tandai tema yang aktif
    $('.theme-option').removeClass('active');
    $(`.theme-option[data-theme="${currentTheme}"]`).addClass('active');
    
    // Update nama tema
    $('#currentThemeName').text(THEMES[currentTheme].name);
}

// FUNGSI BARU: Terapkan tema yang dipilih
function applySelectedTheme() {
    const selectedTheme = $('.theme-option.active').data('theme');
    if (selectedTheme) {
        applyTheme(selectedTheme);
        showToast(`Tema "${THEMES[selectedTheme].name}" berhasil diterapkan`, 'success');
    }
}

function initializeData() {
    let users_init = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    
    // Tambahkan user default jika belum ada
    if (!users_init.find(u => u.username === 'admin')) {
        users_init.push(DEFAULT_TRIAL_USER);
    }
    if (!users_init.find(u => u.username === 'kasir')) {
        users_init.push(DEFAULT_CASHIER_USER);
    }
    
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users_init));
    
    if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.MENUS)) {
        const sampleMenus = [
            { id: 'M001', name: 'Nasi Goreng', category: 'Makanan', price: 15000, image: DEFAULT_MENU_IMAGES['Makanan']['Nasi Goreng'], description: 'Nasi goreng spesial dengan telur dan ayam' },
            { id: 'M002', name: 'Mie Goreng', category: 'Makanan', price: 12000, image: DEFAULT_MENU_IMAGES['Makanan']['Mie Goreng'], description: 'Mie goreng dengan sayuran dan telur' },
            { id: 'M003', name: 'Ayam Goreng', category: 'Makanan', price: 18000, image: DEFAULT_MENU_IMAGES['Makanan']['Ayam Goreng'], description: 'Ayam goreng krispi dengan sambal' },
            { id: 'M004', name: 'Es Teh', category: 'Minuman', price: 5000, image: DEFAULT_MENU_IMAGES['Minuman']['Es Teh'], description: 'Es teh manis segar' },
            { id: 'M005', name: 'Es Jeruk', category: 'Minuman', price: 7000, image: DEFAULT_MENU_IMAGES['Minuman']['Es Jeruk'], description: 'Es jeruk asli' }
        ];
        localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(sampleMenus));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
        const sampleCategories = [ { id: 'C001', name: 'Makanan' }, { id: 'C002', name: 'Minuman' }, { id: 'C003', name: 'Snack' } ];
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(sampleCategories));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
            storeName: 'MITRA ANEKAMARKET',
            umkmName: 'Cafe Virgo',
            storeAddress: 'Jl. Cinta No. 8899, Kota Abadi', 
            storePhone: '081234567890', 
            storeEmail: 'admin@resto.com', 
            tableCount: 10,
            itemSecurityCode: CryptoJS.SHA256('01234567').toString(), 
            panelSecurityCode: CryptoJS.SHA256('11223344').toString(), 
            memberDiscountPercent: 2, 
            nonMemberDiscountPercent: 0,
            profitAccessCode: CryptoJS.SHA256('labarugi2025').toString(),
            defaultCOGS: 60,
            defaultShiftHours: 8
        }));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.SHIFT_DATA)) {
        localStorage.setItem(STORAGE_KEYS.SHIFT_DATA, JSON.stringify({
            currentShift: null,
            shiftHistory: []
        }));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.PROFIT_SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.PROFIT_SETTINGS, JSON.stringify({
            defaultCOGS: 60,
            monthlyFixedCost: 0,
            profitAccessCode: CryptoJS.SHA256('labarugi2025').toString()
        }));
    }
    
    // FITUR BARU: Inisialisasi kitchen history jika belum ada
    if (!localStorage.getItem(STORAGE_KEYS.KITCHEN_HISTORY)) {
        localStorage.setItem(STORAGE_KEYS.KITCHEN_HISTORY, JSON.stringify([]));
    }
    
    // Inisialisasi tema jika belum ada
    if (!localStorage.getItem(STORAGE_KEYS.THEME)) {
        localStorage.setItem(STORAGE_KEYS.THEME, 'default');
    }
}

$(document).ready(function() {
    initializeData();
    
    menus = JSON.parse(localStorage.getItem(STORAGE_KEYS.MENUS)) || [];
    categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || [];
    orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
    settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
    users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    members = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS)) || [];
    currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) || null;
    currentOrder = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_ORDER)) || {
        items: [], subtotal: 0, total: 0, discount: 0, type: 'dinein', tableNumber: '1', note: '', memberId: null
    };
    
    shiftData = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIFT_DATA)) || { currentShift: null, shiftHistory: [] };
    profitSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFIT_SETTINGS)) || { defaultCOGS: 60, monthlyFixedCost: 0, profitAccessCode: CryptoJS.SHA256('labarugi2025').toString() };
    kitchenHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.KITCHEN_HISTORY)) || [];

    $('#currentYear').text(new Date().getFullYear());
    $('#currentYear3').text(new Date().getFullYear());
    
    // Load tema saat aplikasi dimulai
    loadTheme();
    
    // PERBAIKAN: Cek apakah shift sudah dibuka
    currentShift = shiftData.currentShift;
    
    if (currentUser) {
        $('#loggedInUser').text(currentUser.name);
        $('#loginModal').hide();
        
        // PERBAIKAN: Logika baru - Admin boleh mengabaikan shift
        if (currentUser.role === 'admin') {
            // Admin langsung bisa masuk tanpa harus buka shift
            $('#mainApp').show();
            initializeApp();
            setTimeout(showWelcomeToast, 500);
        } else {
            // Untuk kasir/non-admin, cek apakah shift sudah dibuka
            if (!currentShift && checkPermission('shift_management')) {
                // Tampilkan modal input uang kas awal
                showCashStartModal();
            } else if (currentShift) {
                // Tampilkan aplikasi utama
                $('#mainApp').show();
                initializeApp();
                // Tampilkan welcome toast setelah login
                setTimeout(showWelcomeToast, 500);
            } else {
                // User tidak punya permission untuk shift management, langsung tampilkan app
                $('#mainApp').show();
                initializeApp();
                setTimeout(showWelcomeToast, 500);
            }
        }
    } else {
        generateCaptcha();
    }
    
    // Inisialisasi jam real-time
    updateLiveClock();
    setInterval(updateLiveClock, 1000);
    
    setInterval(updateCurrentDate, 60000);
    
    // FUNGSI BARU: Event handler untuk toggle password visibility
    $('#passwordToggle').click(function() {
        togglePasswordVisibility('#password', $(this));
    });
    
    // FUNGSI BARU: Event handler untuk toggle password di kontrol panel
    $(document).on('click', '.user-password-toggle', function() {
        togglePasswordVisibility('#userPassword', $(this));
    });
    
    $(document).on('click', '.security-password-toggle', function() {
        const input = $(this).closest('.form-group').find('input[type="password"]');
        const type = input.attr('type') === 'password' ? 'text' : 'password';
        input.attr('type', type);
        
        // Ubah ikon
        const icon = $(this).find('i');
        if (type === 'text') {
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });
    
    $(document).on('click', '.current-password-toggle', function() {
        togglePasswordVisibility('#currentPassword', $(this));
    });
    
    $(document).on('click', '.new-password-toggle', function() {
        togglePasswordVisibility('#newPassword', $(this));
    });
    
    $(document).on('click', '.profit-password-toggle', function() {
        togglePasswordVisibility('#profitAccessCode', $(this));
    });
    
    $(document).on('click', '.profit-confirm-toggle', function() {
        togglePasswordVisibility('#profitAccessCodeConfirm', $(this));
    });
    
    $(document).on('click', '.prompt-password-toggle', function() {
        togglePasswordVisibility('#passwordPromptInput', $(this));
    });
    
    // FITUR BARU: Event handler untuk pengaturan tema
    $('#themeSettingsBtn').click(function() {
        openThemeSettingsModal();
    });
    
    $(document).on('click', '.theme-option', function() {
        $('.theme-option').removeClass('active');
        $(this).addClass('active');
    });
    
    $('#applyThemeBtn').click(function() {
        applySelectedTheme();
        $('#themeSettingsModal').hide();
    });
    
    // Login form submission
    $('#loginForm').submit(function(e) {
        e.preventDefault();
        const $loginBtn = $(this).find('button[type="submit"]');
        const originalText = $loginBtn.html();
        setButtonLoading($loginBtn, true);
        
        // Tampilkan loading
        showModalLoading('Memverifikasi login...');

        setTimeout(() => {
            try {
                const enteredCaptcha = $('#captchaInput').val().trim();
                if (enteredCaptcha.toLowerCase() !== captchaText.toLowerCase()) {
                    showToast('Kode verifikasi (CAPTCHA) salah.', 'error');
                    generateCaptcha();
                    $('#captchaInput').val('');
                    setButtonLoading($loginBtn, false, originalText);
                    hideModalLoading();
                    return; 
                }
                
                const username = $('#username').val();
                const password = $('#password').val();
                const passwordHash = CryptoJS.SHA256(password).toString();
                
                // Cari user berdasarkan username
                const user = users.find(u => u.username === username);
                
                if (user && user.password === passwordHash) {
                    // Set permissions default jika tidak ada
                    if (!user.permissions) {
                        user.permissions = DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.cashier;
                    }
                    
                    currentUser = user;
                    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
                    $('#loggedInUser').text(currentUser.name);
                    $('#loginModal').hide();
                    
                    // PERBAIKAN: Logika baru - Admin boleh mengabaikan shift
                    if (currentUser.role === 'admin') {
                        // Admin langsung bisa masuk tanpa harus buka shift
                        $('#mainApp').fadeIn();
                        initializeApp();
                        setTimeout(showWelcomeToast, 300);
                    } else {
                        // Untuk kasir/non-admin, cek apakah shift sudah dibuka
                        currentShift = shiftData.currentShift;
                        
                        if (!currentShift && checkPermission('shift_management')) {
                            // Tampilkan modal input uang kas awal
                            showCashStartModal();
                        } else if (currentShift) {
                            // Tampilkan aplikasi utama
                            $('#mainApp').fadeIn();
                            initializeApp();
                            setTimeout(showWelcomeToast, 300);
                        } else {
                            // User tidak punya permission untuk shift management, langsung tampilkan app
                            $('#mainApp').fadeIn();
                            initializeApp();
                            setTimeout(showWelcomeToast, 300);
                        }
                    }
                } else {
                    showToast('Username atau password salah', 'error');
                    generateCaptcha();
                    $('#captchaInput').val('');
                }
            } catch (err) {
                showToast('Error: Gagal memuat library penting. Cek koneksi internet.', 'error');
                console.error("Login error:", err);
            } finally {
                if ($loginBtn.prop('disabled')) {
                   setButtonLoading($loginBtn, false, originalText);
                }
                hideModalLoading();
            }
        }, 800);
    });
    
    // PERBAIKAN: Event handler untuk tombol skip shift (hanya admin)
    $('#skipShiftBtn').click(function() {
        $('#cashStartModal').hide();
        $('#mainApp').fadeIn();
        initializeApp();
        showToast('Admin login tanpa membuka shift', 'info');
    });
    
    // Event handlers untuk fitur shift baru
    $('#startShiftBtn').click(function() {
        const initialCash = parseFloat($('#initialCashAmount').val()) || 0;
        const cashNote = $('#cashNote').val().trim();
        
        if (initialCash <= 0) {
            showToast('Masukkan jumlah uang kas yang valid', 'error');
            return;
        }
        
        // Tampilkan loading
        showModalLoading('Membuka shift...');
        
        // Buat shift baru
        currentShift = {
            id: 'SHIFT' + moment().format('YYYYMMDDHHmmss'),
            startTime: new Date(),
            cashier: {
                id: currentUser.id,
                name: currentUser.name,
                username: currentUser.username
            },
            initialCash: initialCash,
            initialNote: cashNote,
            status: 'open',
            orders: [],
            totalSales: 0,
            totalTransactions: 0
        };
        
        // Simpan shift data
        shiftData.currentShift = currentShift;
        localStorage.setItem(STORAGE_KEYS.SHIFT_DATA, JSON.stringify(shiftData));
        
        // Update UI
        $('#shiftStatus').text('Aktif').removeClass('shift-closed').addClass('shift-open');
        
        // Tampilkan aplikasi utama
        $('#cashStartModal').hide();
        $('#mainApp').fadeIn();
        initializeApp();
        
        hideModalLoading();
        showToast('Shift berhasil dimulai dengan uang kas awal: ' + formatCurrency(initialCash), 'success');
    });
    
    $('#cancelShiftBtn').click(function() {
        $('#cashStartModal').hide();
        $('#loginModal').css('display', 'flex');
        showToast('Pembukaan shift dibatalkan', 'info');
    });
    
    // PERBAIKAN: Event handler untuk tombol Buka Shift di admin panel
    $('#openShiftBtn').click(function() {
        if (!checkPermission('shift_management')) {
            showToast('Anda tidak memiliki izin untuk membuka shift', 'error');
            return;
        }
        
        if (currentShift) {
            showToast('Shift sudah berjalan', 'warning');
            return;
        }
        
        showCashStartModal();
    });
    
    $('#closeShiftBtn').click(function() {
        if (!checkPermission('shift_management')) {
            showToast('Anda tidak memiliki izin untuk menutup shift', 'error');
            return;
        }
        
        if (!currentShift) {
            showToast('Tidak ada shift yang aktif', 'error');
            return;
        }
        
        // Hitung total penjualan dari shift ini
        const shiftStartTime = new Date(currentShift.startTime);
        const shiftOrders = orders.filter(order => {
            const orderTime = new Date(order.date);
            return orderTime >= shiftStartTime;
        });
        
        const totalSales = shiftOrders.reduce((sum, order) => sum + order.total, 0);
        const totalTransactions = shiftOrders.length;
        
        // Update data shift
        currentShift.orders = shiftOrders;
        currentShift.totalSales = totalSales;
        currentShift.totalTransactions = totalTransactions;
        
        // Update UI modal
        $('#initialCashDisplay').text(formatCurrency(currentShift.initialCash));
        $('#totalSalesAmount').val(totalSales);
        $('#actualCashCount').val('');
        $('#dailyExpenses').val(0);
        $('#otherIncome').val(0);
        $('#shiftCloseNote').val('');
        
        // Hitung expected cash
        const expectedCash = currentShift.initialCash + totalSales;
        $('#expectedCash').text(formatCurrency(expectedCash));
        
        // Tampilkan modal tutup shift
        $('#closeShiftModal').css('display', 'flex');
    });
    
    $('#actualCashCount').on('input', function() {
        calculateCashDifference();
    });
    
    $('#dailyExpenses').on('input', function() {
        calculateCashDifference();
    });
    
    $('#otherIncome').on('input', function() {
        calculateCashDifference();
    });
    
    function calculateCashDifference() {
        const initialCash = currentShift.initialCash || 0;
        const totalSales = currentShift.totalSales || 0;
        const expenses = parseFloat($('#dailyExpenses').val()) || 0;
        const otherIncome = parseFloat($('#otherIncome').val()) || 0;
        const actualCash = parseFloat($('#actualCashCount').val()) || 0;
        
        const expectedCash = initialCash + totalSales - expenses + otherIncome;
        const difference = actualCash - expectedCash;
        
        $('#expectedCash').text(formatCurrency(expectedCash));
        $('#actualCash').text(formatCurrency(actualCash));
        $('#cashDifference').text(formatCurrency(difference));
        
        // Warna berdasarkan selisih
        const $differenceElement = $('#cashDifference');
        if (difference > 0) {
            $differenceElement.css('color', 'var(--success)');
        } else if (difference < 0) {
            $differenceElement.css('color', 'var(--danger)');
        } else {
            $differenceElement.css('color', 'var(--dark)');
        }
    }
    
    $('#confirmCloseShiftBtn').click(function() {
        const actualCash = parseFloat($('#actualCashCount').val()) || 0;
        const expenses = parseFloat($('#dailyExpenses').val()) || 0;
        const otherIncome = parseFloat($('#otherIncome').val()) || 0;
        const closeNote = $('#shiftCloseNote').val().trim();
        
        if (actualCash <= 0) {
            showToast('Masukkan jumlah uang kas fisik yang valid', 'error');
            return;
        }
        
        // Tampilkan loading
        showModalLoading('Menutup shift...');
        
        // Hitung expected cash
        const initialCash = currentShift.initialCash || 0;
        const totalSales = currentShift.totalSales || 0;
        const expectedCash = initialCash + totalSales - expenses + otherIncome;
        const difference = actualCash - expectedCash;
        
        // Tutup shift
        currentShift.endTime = new Date();
        currentShift.status = 'closed';
        currentShift.actualCash = actualCash;
        currentShift.expenses = expenses;
        currentShift.otherIncome = otherIncome;
        currentShift.cashDifference = difference;
        currentShift.closeNote = closeNote;
        
        // Tambahkan ke history
        if (!shiftData.shiftHistory) {
            shiftData.shiftHistory = [];
        }
        shiftData.shiftHistory.unshift(currentShift);
        
        // Reset current shift
        shiftData.currentShift = null;
        currentShift = null;
        
        // Simpan data
        localStorage.setItem(STORAGE_KEYS.SHIFT_DATA, JSON.stringify(shiftData));
        
        // Update UI
        $('#shiftStatus').text('Tutup').removeClass('shift-open').addClass('shift-closed');
        $('#closeShiftModal').hide();
        
        hideModalLoading();
        
        // Tampilkan laporan shift
        generateShiftReport(currentShift);
        
        showToast('Shift berhasil ditutup', 'success');
    });
    
    // Event handler untuk fitur perhitungan laba
    $('#profitCalculationBtn').click(function() {
        if (!checkPermission('profit_calculation')) {
            showToast('Anda tidak memiliki izin untuk mengakses fitur perhitungan laba', 'error');
            return;
        }
        
        // Minta kode keamanan
        promptForProfitAccess(() => {
            $('#profitCalculationModal').css('display', 'flex');
            $('#profitPeriod').val('today');
            $('#profitResults').empty();
            $('#downloadProfitReportBtn').hide();
        });
    });
    
    $('#calculateProfitBtn').click(function() {
        showModalLoading('Menghitung laba...');
        setTimeout(() => {
            calculateProfit();
            hideModalLoading();
        }, 800);
    });
    
    $('#profitPeriod').change(function() {
        $('#profitCustomDateRange').toggle($(this).val() === 'custom');
    });
    
    $('#saveProfitSettingsBtn').click(function() {
        const defaultCOGS = parseFloat($('#defaultCOGS').val()) || 60;
        const monthlyFixedCost = parseFloat($('#monthlyFixedCost').val()) || 0;
        const profitSecurityCode = $('#profitSecurityCode').val();
        
        if (profitSecurityCode) {
            profitSettings.profitAccessCode = CryptoJS.SHA256(profitSecurityCode).toString();
        }
        
        profitSettings.defaultCOGS = defaultCOGS;
        profitSettings.monthlyFixedCost = monthlyFixedCost;
        
        localStorage.setItem(STORAGE_KEYS.PROFIT_SETTINGS, JSON.stringify(profitSettings));
        showToast('Pengaturan perhitungan laba berhasil disimpan', 'success');
    });
    
    $('#downloadProfitReportBtn').click(function() {
        showLoading('Menyiapkan laporan laba PDF...');
        setTimeout(() => {
            downloadProfitReportAsPdf();
        }, 500);
    });
    
    // Pengaturan shift dan laba di kontrol panel
    $('#saveShiftProfitSettingsBtn').click(function() {
        const defaultShiftHours = parseFloat($('#defaultShiftHours').val()) || 8;
        const autoCloseShift = $('#autoCloseShift').is(':checked');
        const profitAccessCode = $('#profitAccessCode').val();
        const profitAccessCodeConfirm = $('#profitAccessCodeConfirm').val();
        const defaultProfitCOGS = parseFloat($('#defaultProfitCOGS').val()) || 60;
        
        if (profitAccessCode) {
            if (profitAccessCode !== profitAccessCodeConfirm) {
                showToast('Kode keamanan tidak cocok', 'error');
                return;
            }
            settings.profitAccessCode = CryptoJS.SHA256(profitAccessCode).toString();
            profitSettings.profitAccessCode = CryptoJS.SHA256(profitAccessCode).toString();
        }
        
        settings.defaultShiftHours = defaultShiftHours;
        settings.autoCloseShift = autoCloseShift;
        settings.defaultCOGS = defaultProfitCOGS;
        profitSettings.defaultCOGS = defaultProfitCOGS;
        
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        localStorage.setItem(STORAGE_KEYS.PROFIT_SETTINGS, JSON.stringify(profitSettings));
        
        showToast('Pengaturan shift dan laba berhasil disimpan', 'success');
    });
    
    // PERBAIKAN: Event handler untuk tombol Refresh
    $('#refreshBtn').click(function() {
        showModalLoading('Merefresh halaman...');
        setTimeout(() => {
            location.reload();
        }, 500);
    });
    
    // PERBAIKAN: Event handler untuk tombol Info Aplikasi
    $('#appInfoBtn').click(function() {
        $('#appInfoModal').css('display', 'flex');
    });
    
    $('#reloadCaptchaBtn').click(generateCaptcha);
    $('#logoutBtn').click(function(e) {
        e.preventDefault();
        
        // Cek apakah shift masih terbuka
        if (currentShift && currentShift.status === 'open') {
            showConfirmation('Shift Masih Aktif', 'Shift penjualan masih aktif. Apakah Anda yakin ingin logout?', () => {
                performLogout();
            });
        } else {
            performLogout();
        }
    });
    
    function performLogout() {
        currentUser = null;
        localStorage.removeItem(STORAGE_KEYS.USER);
        $('#mainApp').fadeOut(() => {
            $('#loginModal').css('display', 'flex');
            $('#username').val('');
            $('#password').val('');
            $('#captchaInput').val('');
            generateCaptcha();
        });
        showToast('Anda telah logout', 'info');
    }
    
    $('#menuSearch').on('input', function() { loadMenus($(this).val(), $('.filter-chip.active').data('category')); });
    $(document).on('click', '.menu-card', function() {
        const menu = menus.find(m => m.id === $(this).data('id'));
        if (menu) {
            const existingItem = currentOrder.items.find(item => item.menu.id === menu.id);
            if (existingItem) {
                existingItem.quantity++; 
            } else {
                currentOrder.items.push({ menu: menu, quantity: 1, status: 'pending' });
            }
            updateOrder();
            showToast(`${menu.name} ditambahkan`, 'success');
        }
    });
    
    // Cek permission untuk edit menu
    $(document).on('click', '.edit-menu', function(e) { 
        e.stopPropagation(); 
        if (checkPermission('edit_menu')) {
            openEditMenuModal(menus.find(m => m.id === $(this).data('id'))); 
        } else {
            showToast('Anda tidak memiliki izin untuk mengedit menu', 'error');
        }
    });
    
    // Cek permission untuk delete menu
    $(document).on('click', '.delete-menu', function(e) {
        e.stopPropagation();
        if (!checkPermission('delete_menu')) {
            showToast('Anda tidak memiliki izin untuk menghapus menu', 'error');
            return;
        }
        
        const menuId = $(this).data('id');
        promptForPassword('item', () => {
            showConfirmation('Hapus Menu', 'Yakin ingin menghapus menu ini?', () => {
                menus = menus.filter(m => m.id !== menuId);
                saveMenus(); loadMenus(); showToast('Menu berhasil dihapus', 'success');
            });
        });
    });
    
    $(document).on('click', '.remove-item', function() {
        const menuId = $(this).data('id');
        const menuName = currentOrder.items.find(item => item.menu.id === menuId)?.menu.name;
        currentOrder.items = currentOrder.items.filter(item => item.menu.id !== menuId);
        updateOrder();
        if (menuName) showToast(`${menuName} dihapus`, 'info');
    });
    
    $(document).on('input', '.item-qty', function() {
        const menuId = $(this).data('id'), quantity = parseInt($(this).val()) || 1;
        $(this).val(quantity < 1 ? 1 : quantity);
        const item = currentOrder.items.find(i => i.menu.id === menuId);
        if (item) { item.quantity = quantity < 1 ? 1 : quantity; updateOrder(); }
    });
    
    $('.order-type-btn').click(function() {
        $('.order-type-btn').removeClass('active');
        $(this).addClass('active');
        currentOrder.type = $(this).data('type');
        $('#tableNumberContainer').toggle(currentOrder.type === 'dinein');
        updateOrder();
    });
    
    $('#tableNumber').change(function() { currentOrder.tableNumber = $(this).val(); });
    $('#orderNote').on('input', function() { currentOrder.note = $(this).val(); });
    
    $('#memberSearchInput').on('input', function() {
        const searchTerm = $(this).val().trim().toLowerCase();
        const $results = $('#memberSearchResults');
        if (searchTerm.length === 0) {
            $results.hide();
            if (currentOrder.memberId) { currentOrder.memberId = null; updateOrder(); }
            return;
        }
        const filteredMembers = members.filter(member => member.name.toLowerCase().includes(searchTerm) || member.id.toLowerCase().includes(searchTerm) || member.phone.includes(searchTerm));
        $results.empty().show();
        if (filteredMembers.length > 0) {
            filteredMembers.forEach(member => $results.append(`<div class="member-search-item" data-id="${member.id}">${member.name} (${member.id})</div>`));
        } else {
            $results.append('<div class="member-search-item disabled">Member tidak ditemukan</div>');
        }
    });
    
    $(document).on('click', '.member-search-item:not(.disabled)', function() {
        const member = members.find(m => m.id === $(this).data('id'));
        if (member) {
            $('#memberSearchInput').val(`${member.name} (${member.id})`);
            currentOrder.memberId = member.id;
            updateOrder();
        }
        $('#memberSearchResults').hide();
    });

    $(document).on('click', function(e) { if (!$(e.target).closest('.member-search-container').length) $('#memberSearchResults').hide(); });
    
    // PROSES ORDER FIX: Perbaikan event handler untuk tombol proses pesanan
    $('#processOrderBtn').click(function() {
        if (currentOrder.items.length === 0) { 
            showToast('Pesanan kosong', 'warning'); 
            return; 
        }
        
        const member = members.find(m => m.id === currentOrder.memberId);
        $('#customerName').val(member ? member.name : '');
        updateOrderSummary(); 
        updatePaymentTab(); 
        switchPaymentModalTab('payment');
        
        // Reset payment method ke tunai setiap kali modal dibuka
        $('#paymentMethod').val('cash').trigger('change');
        $('#paymentAmount').val('').trigger('input');
        
        $('#processOrderModal').css('display', 'flex');
    });
    
    // Fix: Tambahkan event handler untuk tabs di modal pembayaran
    $('#processOrderModal .tabs .tab').click(function() { 
        switchPaymentModalTab($(this).data('tab')); 
    });
    
    // Handle payment method change
    $('#paymentMethod').change(function() {
        togglePaymentMethod();
        if ($(this).val() === 'cash') {
            generateQuickCashButtons(currentOrder.total);
        }
    });
    
    $('#paymentAmount').on('input', calculateChange);
    $(document).on('click', '.quick-cash-btn', function() { 
        $('#paymentAmount').val($(this).data('amount')).trigger('input'); 
    });
    
    // FIX: Perbaikan fungsi completePaymentBtn untuk menangani semua metode pembayaran
    $('#completePaymentBtn').click(function() {
        if ($(this).prop('disabled')) return;
        
        const paymentMethod = $('#paymentMethod').val();
        let paymentAmount;
        
        if (paymentMethod === 'qris') {
            // Untuk QRIS, payment amount sama dengan total
            paymentAmount = currentOrder.total;
        } else {
            paymentAmount = parseFloat($('#paymentAmount').val()) || 0;
            if (paymentAmount < currentOrder.total) { 
                showToast('Jumlah pembayaran kurang', 'error'); 
                return; 
            }
        }
        
        const $btn = $(this), originalText = $btn.html();
        setButtonLoading($btn, true);
        
        // Tampilkan loading
        showModalLoading('Memproses pembayaran...');

        setTimeout(() => {
            try {
                const order = {
                    id: 'ORD' + moment().format('YYYYMMDDHHmmss'), 
                    date: new Date(), 
                    ...currentOrder, 
                    paymentMethod: paymentMethod,
                    paymentAmount: paymentAmount,
                    change: paymentMethod === 'qris' ? 0 : paymentAmount - currentOrder.total, 
                    cashier: currentUser, 
                    customerName: $('#customerName').val().trim() || 'Pelanggan',
                    status: currentOrder.type === 'dinein' ? 'preparing' : 'completed', 
                    statusLocked: false,
                    shiftId: currentShift ? currentShift.id : null,
                    // FITUR BARU: Tambahkan flag untuk history dapur
                    kitchenArchived: false
                };
                orders.unshift(order); 
                saveOrders();
                
                // FITUR BARU: Update notifikasi pesanan dapur
                updateKitchenNotification();
                
                if (order.memberId) {
                    const member = members.find(m => m.id === order.memberId);
                    if (member) { 
                        member.transactions = (member.transactions || 0) + 1; 
                        member.totalSpent = (member.totalSpent || 0) + order.total; 
                        saveMembers(); 
                    }
                }
                showReceiptModal(order); 
                resetOrder();
                $('#processOrderModal').hide();
                showToast('Pesanan berhasil diproses', 'success');
            } catch(error) {
                console.error("Error processing order:", error);
                showToast('Terjadi kesalahan saat memproses pesanan', 'error');
            } finally {
                setButtonLoading($btn, false, originalText);
                hideModalLoading();
            }
        }, 800);
    });
    
    $(document).on('click', '.filter-chip', function() { 
        $('.filter-chip').removeClass('active'); 
        $(this).addClass('active'); 
        loadMenus($('#menuSearch').val(), $(this).data('category')); 
    });
    
    // Cek permission untuk add menu
    $('#addMenuBtn').click(() => { 
        if (checkPermission('add_menu')) {
            openEditMenuModal(null); 
        } else {
            showToast('Anda tidak memiliki izin untuk menambah menu', 'error');
        }
    });
    
    // Cek permission untuk manage categories
    $('#manageCategoriesBtn').click(() => { 
        if (checkPermission('manage_categories')) { 
            loadCategoriesForManagement(); 
            $('#manageCategoriesModal').css('display', 'flex'); 
        } else {
            showToast('Anda tidak memiliki izin untuk mengelola kategori', 'error');
        }
    });
    
    // PERBAIKAN: Event handler untuk tombol Generate Laporan yang diperbaiki
    $('#viewReportsBtn').click(() => { 
        if (checkPermission('view_reports')) { 
            $('#reportsModal .tabs .tab').removeClass('active').first().addClass('active');
            $('#reportsModal .tab-content').removeClass('active').first().addClass('active');
            $('#reportPeriod').val('today').trigger('change');
            $('#reportResults, #donationReportResults').empty();
            $('#printReportBtn, #downloadReportBtn').hide();
            $('#reportsModal').css('display', 'flex');
        } else {
            showToast('Anda tidak memiliki izin untuk melihat laporan', 'error');
        }
    });
    
    // Cek permission untuk history
    $('#historyBtn').click(() => { 
        if (checkPermission('transaction_history')) { 
            loadTransactionHistory(); 
            $('#historyModal').css('display', 'flex'); 
        } else {
            showToast('Anda tidak memiliki izin untuk melihat histori transaksi', 'error');
        }
    });
    
    // FITUR BARU: Event handler untuk tombol Info Pesanan Dapur tanpa history
    $('#kitchenDisplayBtn').click(() => { 
        if (checkPermission('kitchen_display')) { 
            loadKitchenOrders(); 
            // PERBAIKAN: Hapus interval sebelumnya jika ada untuk menghindari duplikasi
            if (kitchenRefreshInterval) {
                clearInterval(kitchenRefreshInterval);
            }
            // PERBAIKAN: Set interval yang lebih stabil
            kitchenRefreshInterval = setInterval(loadKitchenOrders, 30000);
            kitchenLastRefreshTime = new Date();
            
            $('#kitchenDisplayModal').css('display', 'flex'); 
        } else {
            showToast('Anda tidak memiliki izin untuk melihat info pesanan dapur', 'error');
        }
    });
    
    // Cek permission untuk manage members
    $('#manageMembersBtn').click(() => { 
        if (checkPermission('manage_members')) { 
            resetMemberForm(); 
            loadMembersForManagement(); 
            $('#memberAdminFields').toggle(currentUser.role === 'admin'); 
            $('#manageMembersModal').css('display', 'flex'); 
        } else {
            showToast('Anda tidak memiliki izin untuk mengelola member', 'error');
        }
    });
    
    $('#manageMemberSearchInput').on('input', function() { loadMembersForManagement($(this).val()); });
    
    // Cek permission untuk manage store info
    $('#manageStoreInfoBtn').click(() => { 
        if (checkPermission('manage_store_info')) { 
            loadStoreInfo(); 
            $('#manageStoreInfoModal').css('display', 'flex'); 
        } else {
            showToast('Anda tidak memiliki izin untuk mengelola info restoran', 'error');
        }
    });
    
    // Cek permission untuk control panel
    $('#controlPanelBtn').click(() => {
        if (!checkPermission('control_panel')) {
            showToast('Anda tidak memiliki izin untuk mengakses kontrol panel', 'error');
            return;
        }
        
        promptForPassword('panel', () => {
            $('#controlPanelModal .tabs .tab').removeClass('active').first().addClass('active');
            $('#controlPanelModal .tab-content').removeClass('active').first().addClass('active');
            loadUsersForManagement();
            loadPermissionsUserSelect();
            $('#memberDiscount').val(settings.memberDiscountPercent || 2);
            $('#nonMemberDiscount').val(settings.nonMemberDiscountPercent || 0);
            
            // Load shift settings
            $('#defaultShiftHours').val(settings.defaultShiftHours || 8);
            $('#autoCloseShift').prop('checked', settings.autoCloseShift || false);
            $('#defaultProfitCOGS').val(settings.defaultCOGS || 60);
            
            $('#controlPanelModal').css('display', 'flex');
        });
    });
    
    // Cek permission untuk backup data
    $('#backupDataBtn').click(() => { 
        if (checkPermission('backup_restore')) { 
            showConfirmation('Backup Data', 'Data akan di-backup ke file terenkripsi (.lksbackup). Lanjutkan?', backupData); 
        } else {
            showToast('Anda tidak memiliki izin untuk melakukan backup data', 'error');
        }
    });
    
    $('#restoreFile').change(function() { 
        if (checkPermission('backup_restore')) { 
            showModalLoading('Memproses restore data...');
            restoreFromFile(this.files[0]); 
            $(this).val(''); 
        } else {
            showToast('Anda tidak memiliki izin untuk melakukan restore data', 'error');
            $(this).val('');
        }
    });
    
    // Cek permission untuk reset data
    $('#resetDataBtn').click(() => { 
        if (checkPermission('reset_data')) { 
            promptForPassword('item', () => showConfirmation('Reset Data', 'Semua data akan dihapus permanen. Lanjutkan?', resetAllData, 'danger')); 
        } else {
            showToast('Anda tidak memiliki izin untuk mereset data', 'error');
        }
    });
    
    // TOMBOL BARU: Generate Daftar Menu PDF
    $('#generateMenuPdfBtn').click(function() {
        if (menus.length === 0) {
            showToast('Tidak ada menu untuk digenerate', 'warning');
            return;
        }
        
        if (!checkPermission('view_reports')) {
            showToast('Anda tidak memiliki izin untuk generate daftar menu', 'error');
            return;
        }
        
        showModalLoading('Mempersiapkan daftar menu...');
        setTimeout(() => {
            generateMenuPdfPreview();
            hideModalLoading();
        }, 800);
    });
    
    $('#downloadMenuPdfBtn').click(function() {
        showLoading('Menyiapkan PDF untuk diunduh...');
        setTimeout(() => {
            downloadMenuPdf();
        }, 500);
    });
    
    // PERBAIKAN: Tombol reset info pesanan dapur - FUNGSI DIPERBAIKI
    $('#resetKitchenInfoBtn').click(function() {
        if (!checkPermission('delete_kitchen_history')) {
            showToast('Anda tidak memiliki izin untuk mereset info pesanan dapur', 'error');
            return;
        }
        
        // PERBAIKAN: Hitung hanya pesanan yang masih aktif di dapur (status preparing atau ready)
        const activeKitchenOrders = orders.filter(order => 
            order.type === 'dinein' && 
            (order.status === 'preparing' || order.status === 'ready') &&
            !order.kitchenArchived
        );
        
        if (activeKitchenOrders.length === 0) {
            showToast('Tidak ada info pesanan dapur yang aktif untuk direset', 'info');
            return;
        }
        
        promptForPassword('item', () => {
            showConfirmation('Reset Info Pesanan Dapur', 
                `Apakah Anda yakin ingin mereset ${activeKitchenOrders.length} info pesanan dapur yang masih aktif? Tindakan ini hanya akan mereset tampilan dapur dan notifikasi, tidak menghapus histori transaksi.`, 
                () => {
                    showModalLoading('Mer reset info pesanan dapur...');
                    
                    setTimeout(() => {
                        // Reset flag kitchenArchived untuk pesanan aktif di dapur
                        // PERBAIKAN: Hanya set kitchenArchived = true, jangan ubah status atau data transaksi
                        activeKitchenOrders.forEach(order => {
                            order.kitchenArchived = true;
                            // Status transaksi tetap utuh (preparing/ready), hanya tidak ditampilkan di dapur
                        });
                        
                        // Simpan perubahan
                        saveOrders();
                        
                        // Update notifikasi
                        updateKitchenNotification();
                        
                        // Refresh tampilan jika modal sedang terbuka
                        if ($('#kitchenDisplayModal').is(':visible')) {
                            loadKitchenOrders();
                        }
                        
                        hideModalLoading();
                        showToast(`${activeKitchenOrders.length} info pesanan dapur berhasil direset`, 'success');
                    }, 1000);
                }, 'warning');
        });
    });
    
    $('#saveMenuBtn').click(function() {
        const id = $('#menuId').val(), name = $('#menuName').val().trim(), category = $('#menuCategory').val(), price = parseFloat($('#menuPrice').val()) || 0, image = $('#menuImage').val().trim(), description = $('#menuDescription').val().trim();
        if (!name || !category || price <= 0) { showToast('Nama, kategori, dan harga harus valid', 'error'); return; }
        const action = () => {
            if (id) {
                // Cek permission untuk edit menu
                if (!checkPermission('edit_menu')) {
                    showToast('Anda tidak memiliki izin untuk mengedit menu', 'error');
                    return;
                }
                
                const menuIndex = menus.findIndex(m => m.id === id);
                if (menuIndex > -1) menus[menuIndex] = { ...menus[menuIndex], name, category, price, image, description };
            } else {
                // Cek permission untuk add menu
                if (!checkPermission('add_menu')) {
                    showToast('Anda tidak memiliki izin untuk menambah menu', 'error');
                    return;
                }
                
                menus.unshift({ id: 'M' + moment().format('x'), name, category, price, image, description });
            }
            saveMenus(); loadMenus(); $('#menuModal').hide(); showToast(`Menu ${id ? 'diperbarui' : 'disimpan'}`, 'success');
        };
        if (id) promptForPassword('item', action); else action();
    });
    
    $('#addCategoryBtn').click(function() {
        const name = $('#newCategoryName').val().trim();
        if (!name) return showToast('Nama kategori harus diisi', 'error');
        if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) return showToast('Kategori sudah ada', 'error');
        categories.unshift({ id: 'C' + moment().format('x'), name });
        saveCategories(); loadCategories(); loadCategoriesForManagement(); $('#newCategoryName').val(''); showToast('Kategori ditambahkan', 'success');
    });
    
    $(document).on('click', '.remove-category', function() {
        const categoryId = $(this).data('id'), category = categories.find(c => c.id === categoryId);
        if (menus.some(m => m.category === category.name)) return showToast('Kategori sedang digunakan', 'error');
        promptForPassword('item', () => {
            categories = categories.filter(c => c.id !== categoryId);
            saveCategories(); loadCategories(); loadCategoriesForManagement(); showToast('Kategori dihapus', 'success');
        });
    });
    
    $('#showAddMemberFormBtn').click(() => { resetMemberForm(); $('#memberFormContainer').slideDown(); });
    $('#cancelMemberFormBtn').click(() => $('#memberFormContainer').slideUp(resetMemberForm));
    
    $('#memberForm').submit(function(e) {
        e.preventDefault();
        const id = $('#memberIdInput').val(), name = $('#memberName').val().trim(), phone = $('#memberPhone').val().trim(), address = $('#memberAddress').val().trim();
        if (!name || !phone) return showToast('Nama dan nomor telepon harus diisi', 'error');
        if (id) {
            const memberIndex = members.findIndex(m => m.id === id);
            if (memberIndex > -1) members[memberIndex] = { ...members[memberIndex], name, phone, address };
        } else {
            members.unshift({ id: generateMemberId(), name, phone, address, joinDate: new Date().toISOString(), transactions: 0, totalSpent: 0 });
        }
        saveMembers(); loadMembersForManagement(); $('#memberFormContainer').slideUp(resetMemberForm); showToast(`Member ${id ? 'diperbarui' : 'ditambahkan'}`, 'success');
    });
    
    $(document).on('click', '.edit-member', function() {
        const member = members.find(m => m.id === $(this).data('id'));
        if (!member) return;
        $('#memberFormTitle').text('Edit Member'); $('#memberIdInput').val(member.id); $('#memberName').val(member.name); $('#memberPhone').val(member.phone); $('#memberAddress').val(member.address || ''); $('#memberTransactions').val(member.transactions || 0); $('#memberTotalSpent').val(formatCurrency(member.totalSpent || 0)); $('#saveMemberBtn').text('Simpan Perubahan'); $('#deleteMemberBtn').show().data('id', member.id); $('#memberFormContainer').slideDown();
    });
    
    $('#deleteMemberBtn').click(function() {
        const memberId = $(this).data('id');
        promptForPassword('item', () => showConfirmation('Hapus Member', 'Yakin ingin menghapus member ini?', () => {
            members = members.filter(m => m.id !== memberId);
            saveMembers(); loadMembersForManagement(); $('#memberFormContainer').slideUp(resetMemberForm); showToast('Member dihapus', 'success');
        }, 'danger'));
    });
    
    $(document).on('click', '.kta-member', function() { openKtaModal($(this).data('id')); });
    $('#downloadKtaPdfBtn').click(downloadKtaAsPdf);
    
    // PERBAIKAN: Event handler untuk tombol Generate Laporan yang diperbaiki
    $('#generateReportBtn').click(function() {
        showModalLoading('Membuat laporan...');
        setTimeout(() => {
            generateReport();
            hideModalLoading();
        }, 800);
    });
    
    $('#printReportBtn').click(printReport);
    $('#downloadReportBtn').click(function() {
        showLoading('Mengunduh laporan PDF...');
        setTimeout(() => {
            downloadReportAsPdf();
        }, 500);
    });
    $('#reportsModal .tabs .tab').click(function() { switchReportsModalTab($(this).data('tab')); });
    
    // PERBAIKAN: Fix event handler untuk pencarian histori transaksi
    $('#historySearchInput').on('input', function() { 
        loadTransactionHistory($(this).val()); 
    });
    
    $('#printHistoryBtn').click(() => printElement('#historyResultsContainer .printable-area'));
    $('#downloadHistoryBtn').click(function() {
        showLoading('Mengunduh histori PDF...');
        setTimeout(() => {
            downloadHistoryAsPdf();
        }, 500);
    });
    
    // PERBAIKAN: Event handler untuk tombol cetak ulang struk dari histori
    $(document).on('click', '.btn-history-print', function() {
        const orderId = $(this).data('id');
        reprintReceipt(orderId);
    });
    
    // PERBAIKAN: Event handler untuk tombol detail transaksi dari histori
    $(document).on('click', '.btn-history-detail', function() {
        const orderId = $(this).data('id');
        toggleOrderDetails(orderId);
    });
    
    // PERBAIKAN: Event handler untuk status-item dengan konfirmasi yang benar
    $(document).on('click', '.status-item', function() {
        const order = orders.find(o => o.id === $(this).data('id'));
        if (!order || order.statusLocked) return;
        
        const newStatus = order.status === 'preparing' ? 'ready' : 'preparing';
        const statusText = newStatus === 'ready' ? 'Siap Disajikan' : 'Proses';
        
        showConfirmation('Ubah Status Pesanan', `Apakah Anda yakin ingin mengubah status pesanan ${order.id} menjadi "${statusText}"?`, () => {
            order.status = newStatus;
            if (order.status === 'ready') order.statusLocked = true;
            saveOrders(); 
            loadKitchenOrders(); 
            updateKitchenNotification();
            showToast(`Status pesanan ${order.id} diperbarui`, 'success');
        });
    });
    
    $('#refreshKitchenBtn').click(loadKitchenOrders);
    $('#saveStoreInfoBtn').click(saveStoreInfo);
    $('#controlPanelModal .tabs .tab').click(function() { switchControlPanelTab($(this).data('tab')); });
    $('#showAddUserFormBtn').click(() => { resetUserForm(); $('#userFormContainer').slideDown(); });
    $('#cancelUserFormBtn').click(() => $('#userFormContainer').slideUp(resetUserForm));
    $('#userForm').submit(saveUser);
    $(document).on('click', '.edit-user', function() { const user = users.find(u => u.id === $(this).data('id')); if (user) { populateUserForm(user); $('#userFormContainer').slideDown(); } });
    $(document).on('click', '.delete-user', function() {
        const userId = $(this).data('id');
        if (users.length <= 1) return showToast('Tidak dapat menghapus satu-satunya pengguna.', 'error');
        if (userId === currentUser.id) return showToast('Anda tidak dapat menghapus akun Anda sendiri.', 'error');
        showConfirmation('Hapus Pengguna', 'Yakin ingin menghapus pengguna ini?', () => {
            users = users.filter(u => u.id !== userId);
            saveUsers(); loadUsersForManagement(); showToast('Pengguna dihapus', 'success');
        }, 'danger');
    });
    
    $('#itemSecurityForm').submit(changeSecurityCode);
    $('#panelSecurityForm').submit(changeSecurityCode);
    $('#changeOwnPasswordForm').submit(changeOwnPassword);
    $('#discountSettingsForm').submit(function(e) {
        e.preventDefault();
        const memberDiscount = parseFloat($('#memberDiscount').val()), nonMemberDiscount = parseFloat($('#nonMemberDiscount').val());
        if (isNaN(memberDiscount) || isNaN(nonMemberDiscount) || memberDiscount < 0 || nonMemberDiscount < 0) return showToast('Nilai diskon tidak valid.', 'error');
        settings.memberDiscountPercent = memberDiscount; settings.nonMemberDiscountPercent = nonMemberDiscount;
        saveSettings(); showToast('Pengaturan diskon berhasil disimpan.', 'success');
    });
    
    // Event untuk permissions
    $('#permissionUserSelect').change(function() {
        const userId = $(this).val();
        if (userId) {
            loadUserPermissions(userId);
            $('#permissionsContainer').show();
            $('#permissionsActions').show();
        } else {
            $('#permissionsContainer').hide();
            $('#permissionsActions').hide();
        }
    });
    
    $('#savePermissionsBtn').click(saveUserPermissions);
    $('#resetPermissionsBtn').click(resetUserPermissions);
    
    $('#passwordPromptForm').submit(e => e.preventDefault());
    $('#passwordPromptSubmit').click(submitPasswordPrompt);
    $('.modal-close, .modal-close-btn').click(function() {
        const modal = $(this).closest('.modal');
        modal.hide();
        // PERBAIKAN: Hapus interval kitchen saat modal ditutup
        if (modal.attr('id') === 'kitchenDisplayModal') {
            if (kitchenRefreshInterval) {
                clearInterval(kitchenRefreshInterval);
                kitchenRefreshInterval = null;
            }
        }
        if (modal.attr('id') === 'profitCalculationModal') {
            $('#profitResults').empty();
            $('#downloadProfitReportBtn').hide();
        }
        if (modal.attr('id') === 'historyReceiptModal') {
            $('#historyReceiptModalBody').empty();
        }
        if (modal.attr('id') === 'themeSettingsModal') {
            // Reset ke tema yang sedang aktif
            $('.theme-option').removeClass('active');
            $(`.theme-option[data-theme="${currentTheme}"]`).addClass('active');
        }
    });
    $('#reportPeriod').change(() => $('#customDateRange').toggle($('#reportPeriod').val() === 'custom'));
    $('#printReceiptBtn').on('click', () => printElement('#receiptModalBody #receiptContent'));
    $('#downloadReceiptPdfBtn').on('click', function() {
        showLoading('Mengunduh struk PDF...');
        setTimeout(() => {
            downloadReceiptAsPdf();
        }, 500);
    });
    
    // PERBAIKAN: Event handler untuk tombol cetak ulang struk dari histori
    $('#printHistoryReceiptBtn').on('click', function() {
        printElement('#historyReceiptModalBody #receiptContent');
    });
    
    $('#downloadHistoryReceiptPdfBtn').on('click', function() {
        showLoading('Mengunduh struk PDF...');
        setTimeout(() => {
            downloadHistoryReceiptAsPdf();
        }, 500);
    });
    
    // PERBAIKAN: Event handler untuk tombol "Tandai Selesai" dengan konfirmasi
    $(document).on('click', '.mark-kitchen-done', function() {
        const orderId = $(this).data('id');
        const order = orders.find(o => o.id === orderId);
        
        if (!order) return;
        
        showConfirmation('Tandai Selesai', `Apakah Anda yakin ingin menandai pesanan ${orderId} sebagai selesai?`, () => {
            // Tandai sebagai selesai (archive)
            order.kitchenArchived = true;
            saveOrders();
            
            // Update tampilan
            loadKitchenOrders();
            
            // Update notifikasi
            updateKitchenNotification();
            
            showToast(`Pesanan ${orderId} telah ditandai selesai dari dapur`, 'success');
        });
    });
    
    // FIX: Inisialisasi button status berdasarkan isi pesanan
    updateOrder();
    
    // Event untuk tombol close welcome toast
    $('.welcome-toast-close').click(function() {
        hideWelcomeToast();
    });
});

// PERBAIKAN UTAMA: Fungsi loadTransactionHistory yang diperbaiki dengan tombol cetak ulang struk
function loadTransactionHistory(searchTerm = '') {
    const $historyResults = $('#historyResults');
    
    if (orders.length === 0) {
        $historyResults.html('<div class="empty-state"><i class="fas fa-history"></i><p>Tidak ada histori transaksi</p></div>');
        return;
    }
    
    // Filter transaksi berdasarkan searchTerm
    let filteredOrders = orders;
    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredOrders = orders.filter(order => 
            order.id.toLowerCase().includes(lowerSearchTerm) ||
            (order.customerName && order.customerName.toLowerCase().includes(lowerSearchTerm)) ||
            (order.memberId && order.memberId.toLowerCase().includes(lowerSearchTerm)) ||
            (order.cashier && order.cashier.name && order.cashier.name.toLowerCase().includes(lowerSearchTerm))
        );
    }
    
    if (filteredOrders.length === 0) {
        $historyResults.html('<div class="empty-state"><i class="fas fa-search"></i><p>Tidak ada transaksi yang sesuai dengan pencarian</p></div>');
        return;
    }
    
    // PERBAIKAN: Hilangkan filter kategori yang tidak perlu
    // Buat HTML untuk histori transaksi
    let html = `
        <div class="professional-pdf">
            <div class="pdf-report-header">
                <h2>HISTORI TRANSAKSI</h2>
                <h3>${settings.umkmName || 'UMKM LINK'} <span class="premium-badge">PREMIUM</span></h3>
                <div class="pdf-subtitle"><strong>Tanggal Cetak:</strong> ${moment().format('DD/MM/YYYY HH:mm')}</div>
                <div class="pdf-subtitle"><strong>Total Transaksi:</strong> ${filteredOrders.length}</div>
            </div>
            
            <div class="pdf-table-container">
                <table class="pdf-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>ID Transaksi</th>
                            <th>Tanggal/Waktu</th>
                            <th>Pelanggan</th>
                            <th>Total</th>
                            <th>Metode Bayar</th>
                            <th>Kasir</th>
                            <th class="no-print">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Tambahkan setiap transaksi ke tabel
    filteredOrders.forEach((order, index) => {
        const member = order.memberId ? members.find(m => m.id === order.memberId) : null;
        const customerName = member ? member.name : (order.customerName || 'Pelanggan');
        const paymentMethodText = order.paymentMethod === 'cash' ? 'Tunai' : 
                                  order.paymentMethod === 'qris' ? 'QRIS' : 
                                  order.paymentMethod === 'transfer' ? 'Transfer' : 
                                  order.paymentMethod === 'ewallet' ? 'E-Wallet' : order.paymentMethod;
        
        // PERBAIKAN: Tambahkan tombol aksi untuk cetak ulang struk
        const canReprint = checkPermission('reprint_receipt');
        const actionButtons = canReprint ? `
            <div class="history-actions">
                <button class="btn-history-detail" data-id="${order.id}">
                    <i class="fas fa-eye"></i> Detail
                </button>
                <button class="btn-history-print" data-id="${order.id}">
                    <i class="fas fa-print"></i> Cetak Ulang
                </button>
            </div>
            <div class="history-order-details" id="order-details-${order.id}">
                <div class="history-order-items">
                    ${order.items.map(item => `
                        <div class="history-order-item">
                            <span>${item.menu.name} (${item.quantity}x)</span>
                            <span>${formatCurrency(item.menu.price * item.quantity)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>${formatCurrency(order.subtotal)}</span>
                </div>
                ${order.discount > 0 ? `
                <div class="summary-row">
                    <span>Diskon:</span>
                    <span>-${formatCurrency(order.discount)}</span>
                </div>
                ` : ''}
                <div class="summary-row total-row">
                    <span>Total:</span>
                    <span>${formatCurrency(order.total)}</span>
                </div>
                ${order.note ? `
                <div class="summary-row">
                    <span>Catatan:</span>
                    <span>${order.note}</span>
                </div>
                ` : ''}
            </div>
        ` : '';
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${order.id}</strong></td>
                <td>${moment(order.date).format('DD/MM/YY HH:mm')}</td>
                <td>${customerName}</td>
                <td>${formatCurrency(order.total)}</td>
                <td>${paymentMethodText}</td>
                <td>${order.cashier ? order.cashier.name : 'System'}</td>
                <td class="no-print">
                    ${canReprint ? actionButtons : 'Tidak ada aksi'}
                </td>
            </tr>
        `;
    });
    
    // Hitung total dari semua transaksi yang difilter
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    
    html += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" style="text-align: right; font-weight: bold;">TOTAL PENDAPATAN:</td>
                            <td colspan="3" style="font-weight: bold; color: var(--success);">${formatCurrency(totalRevenue)}</td>
                            <td class="no-print"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div class="pdf-footer">
                <p><strong>&copy; ${new Date().getFullYear()} UMKM LINK - Lentera Karya Situbondo</strong></p>
                <p class="fishery-support">Supported by Dinas Perikanan Situbondo - Bidang Pemberdayaan Nelayan</p>
            </div>
        </div>
    `;
    
    $historyResults.html(html);
}

// PERBAIKAN: Fungsi untuk toggle detail pesanan
function toggleOrderDetails(orderId) {
    const $details = $(`#order-details-${orderId}`);
    if ($details.length) {
        $details.toggleClass('show');
    }
}

// PERBAIKAN: Fungsi untuk cetak ulang struk dari histori transaksi
function reprintReceipt(orderId) {
    if (!checkPermission('reprint_receipt')) {
        showToast('Anda tidak memiliki izin untuk mencetak ulang struk', 'error');
        return;
    }
    
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showToast('Transaksi tidak ditemukan', 'error');
        return;
    }
    
    // Tampilkan loading
    showModalLoading('Mempersiapkan struk...');
    
    setTimeout(() => {
        // Generate struk untuk transaksi yang dipilih
        generateHistoryReceiptHTML(order);
        
        // Tampilkan modal struk
        $('#historyReceiptModal').css('display', 'flex');
        
        // Simpan data order untuk keperluan download PDF
        $('#downloadHistoryReceiptPdfBtn').data('order', order);
        
        hideModalLoading();
    }, 500);
}

// PERBAIKAN: Fungsi untuk generate struk dari histori transaksi
function generateHistoryReceiptHTML(order) {
    const member = members.find(m => m.id === order.memberId);
    const receiptHTML = `
        <div id="receiptContent">
            <div class="receipt-header">
                <div class="receipt-title">${settings.umkmName} <span class="premium-badge">PREMIUM</span></div>
                <div>${settings.storeAddress}</div>
                <div>Telp: ${settings.storePhone}</div>
                <div style="font-size: 10px; margin-top: 5px; color: #666;">
                    <strong>STRUK CETAK ULANG</strong>
                </div>
            </div>
            <div class="receipt-info">
                <div><span>Tanggal:</span> <span>${moment(order.date).format('DD/MM/YY HH:mm')}</span></div>
                <div><span>No. Trx:</span> <span>${order.id}</span></div>
                <div><span>Kasir:</span> <span>${order.cashier.name}</span></div>
                <div><span>Pelanggan:</span> <span>${order.customerName}</span></div>
                ${member ? `<div><span>Member:</span> <span>${member.name} (${member.id})</span></div>` : ''}
                <div><span>Tipe:</span> <span>${order.type === 'dinein' ? `Makan di Tempat (Meja ${order.tableNumber})` : 'Bungkus'}</span></div>
                <div><span>Metode:</span> <span>${order.paymentMethod === 'qris' ? 'QRIS' : order.paymentMethod === 'cash' ? 'Tunai' : order.paymentMethod === 'transfer' ? 'Transfer Bank' : 'E-Wallet'}</span></div>
            </div>
            <div id="receiptItemsContainer">
                ${order.items.map(item => `<div class="receipt-item"><div class="receipt-item-details"><div class="item-name">${item.menu.name}</div><div class="item-price-calc">${item.quantity} x ${formatCurrency(item.menu.price)}</div></div><span>${formatCurrency(item.menu.price * item.quantity)}</span></div>`).join('')}
            </div>
            ${order.note ? `<div style="font-size:10px; font-style:italic; padding: 5px 0; border-top: 1px dashed #000;">Catatan: ${order.note}</div>` : ''}
            <div class="receipt-total">
                <div class="receipt-item"><span>Subtotal</span> <span>${formatCurrency(order.subtotal)}</span></div>
                ${order.discount > 0 ? `<div class="receipt-item"><span>Diskon</span> <span>-${formatCurrency(order.discount)}</span></div>` : ''}
                <div class="receipt-item" style="font-weight:bold; font-size: 14px;"><span>TOTAL</span> <span>${formatCurrency(order.total)}</span></div>
                <div class="receipt-item"><span>${order.paymentMethod === 'qris' ? 'QRIS' : order.paymentMethod === 'cash' ? 'Tunai' : order.paymentMethod === 'transfer' ? 'Transfer' : 'E-Wallet'}</span> <span>${formatCurrency(order.paymentAmount)}</span></div>
                ${order.paymentMethod === 'cash' ? `<div class="receipt-item"><span>Kembali</span> <span>${formatCurrency(order.change)}</span></div>` : ''}
            </div>
            <div class="receipt-footer">
                <p>*** STRUK CETAK ULANG ***</p>
                <div id="historyReceiptQrcode" style="display: flex; justify-content: center; margin: 10px 0;"></div>
                <p style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px;">
                    Aplikasi Kasir UMKM LINK - Cetak Ulang<br>
                    <strong>Supported by Dinas Perikanan Situbondo - Bidang Pemberdayaan Nelayan</strong><br>
                    Lentera Karya Situbondo &copy; 2025<br>
                    www.anekamarket.my.id | WA: 087865614222
                </p>
            </div>
        </div>
    `;
    
    $('#historyReceiptModalBody').html(receiptHTML);
    
    // Generate QR Code untuk struk cetak ulang
    const qrCodeData = JSON.stringify({ 
        trxId: order.id, 
        store: settings.umkmName, 
        date: moment(order.date).toISOString(), 
        total: order.total,
        reprint: true,
        reprintDate: new Date().toISOString()
    });
    $('#historyReceiptQrcode').empty();
    new QRCode(document.getElementById("historyReceiptQrcode"), { 
        text: qrCodeData, 
        width: 80, 
        height: 80, 
        correctLevel: QRCode.CorrectLevel.M 
    });
}

// PERBAIKAN: Fungsi untuk download struk cetak ulang sebagai PDF
function downloadHistoryReceiptAsPdf() {
    const order = $('#downloadHistoryReceiptPdfBtn').data('order');
    if (!order) return;
    
    const element = document.getElementById('historyReceiptModalBody').querySelector('#receiptContent');
    
    html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#eeeeee'
    }).then(canvas => {
        const pdf = new jsPDF({ 
            orientation: 'portrait', 
            unit: 'px', 
            format: [canvas.width, canvas.height] 
        });
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`Struk-Cetak-Ulang-${order.id}-${moment().format('DD-MM-YYYY-HHmm')}.pdf`);
        hideLoading();
        showToast('Struk cetak ulang berhasil diunduh', 'success');
    }).catch(err => { 
        hideLoading();
        showToast('Gagal mengunduh PDF struk cetak ulang', 'error'); 
        console.error("PDF download error:", err); 
    });
}

// PERBAIKAN: Fungsi untuk download histori transaksi sebagai PDF
function downloadHistoryAsPdf() {
    const element = document.querySelector('#historyResults .professional-pdf');
    if (!element) {
        showToast('Tidak ada histori transaksi untuk diunduh', 'warning');
        hideLoading();
        return;
    }
    
    // Clone elemen untuk menghapus kolom aksi sebelum konversi ke PDF
    const clonedElement = element.cloneNode(true);
    
    // Hapus kolom aksi (kolom terakhir) dari header dan body
    clonedElement.querySelectorAll('thead tr, tbody tr').forEach(row => {
        const cells = row.querySelectorAll('th, td');
        if (cells.length > 0) {
            // Hapus sel terakhir (kolom aksi)
            cells[cells.length - 1].remove();
        }
    });
    
    // Hapus kolom aksi dari footer jika ada
    clonedElement.querySelectorAll('tfoot tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            // Hapus sel terakhir (kolom aksi)
            cells[cells.length - 1].remove();
        }
    });
    
    // Sembunyikan detail pesanan di PDF
    clonedElement.querySelectorAll('.history-order-details').forEach(detail => {
        detail.remove();
    });
    
    // Sembunyikan tombol aksi di PDF
    clonedElement.querySelectorAll('.history-actions').forEach(action => {
        action.remove();
    });
    
    html2canvas(clonedElement, { 
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Histori_Transaksi_${settings.umkmName || 'UMKM LINK'}_${moment().format('YYYY-MM-DD')}.pdf`);
        hideLoading();
        showToast('Histori transaksi PDF berhasil diunduh', 'success');
    }).catch(err => { 
        hideLoading();
        showToast('Gagal mengunduh PDF histori transaksi', 'error'); 
        console.error("PDF history download error:", err); 
    });
}

// Fungsi untuk menampilkan modal input uang kas awal
function showCashStartModal() {
    $('#shiftDateDisplay').text(moment().format('dddd, DD MMMM YYYY'));
    $('#shiftCashierName').text(currentUser.name);
    $('#initialCashAmount').val('');
    $('#cashNote').val('');
    
    // PERBAIKAN: Tampilkan tombol Skip hanya untuk admin
    if (currentUser.role === 'admin') {
        $('#skipShiftBtn').show();
    } else {
        $('#skipShiftBtn').hide();
    }
    
    $('#cashStartModal').css('display', 'flex');
}

// Fungsi untuk menampilkan jam real-time
function updateLiveClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour12: false });
    $('#liveClock').text(timeString);
}

// Fungsi untuk menampilkan welcome toast setelah login
function showWelcomeToast() {
    const $welcomeToast = $('#welcomeToast');
    $welcomeToast.addClass('show');
    
    // Reset countdown
    let countdown = 15;
    $('#countdown').text(countdown);
    
    // Clear existing intervals/timeouts
    if (countdownInterval) clearInterval(countdownInterval);
    if (welcomeToastTimeout) clearTimeout(welcomeToastTimeout);
    
    // Start countdown
    countdownInterval = setInterval(function() {
        countdown--;
        $('#countdown').text(countdown);
        if (countdown <= 0) {
            hideWelcomeToast();
        }
    }, 1000);
    
    // Set timeout untuk auto-hide setelah 15 detik
    welcomeToastTimeout = setTimeout(() => {
        hideWelcomeToast();
    }, 15000);
}
                
// Fungsi untuk menyembunyikan welcome toast
function hideWelcomeToast() {
    const $welcomeToast = $('#welcomeToast');
    $welcomeToast.removeClass('show');
    
    // Clear intervals/timeouts
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    if (welcomeToastTimeout) {
        clearTimeout(welcomeToastTimeout);
        welcomeToastTimeout = null;
    }
}

function initializeApp() { 
    loadMenus(); 
    updateOrder(); 
    loadCategories(); 
    updateCurrentDate(); 
    updateStoreInfo(); 
    updateTableNumbers(); 
    
    // Update shift status
    if (currentShift) {
        $('#shiftStatus').text('Aktif').removeClass('shift-closed').addClass('shift-open');
    } else {
        $('#shiftStatus').text('Tutup').removeClass('shift-open').addClass('shift-closed');
    }
    
    // PERBAIKAN: Update tampilan tombol shift berdasarkan status shift
    updateShiftButtons();
    
    // Tampilkan/hide admin panel berdasarkan permission
    const showAdminPanel = checkPermission('add_menu') || checkPermission('edit_menu') || 
                          checkPermission('delete_menu') || checkPermission('manage_categories') ||
                          checkPermission('manage_members') || checkPermission('manage_store_info') ||
                          checkPermission('view_reports') || checkPermission('transaction_history') ||
                          checkPermission('kitchen_display') || checkPermission('control_panel') ||
                          checkPermission('backup_restore') || checkPermission('reset_data') ||
                          checkPermission('shift_management') || checkPermission('profit_calculation') ||
                          checkPermission('delete_kitchen_history') || checkPermission('reprint_receipt');
    
    $('#adminPanel').toggle(showAdminPanel);
    
    // FITUR BARU: Update notifikasi pesanan dapur saat inisialisasi
    updateKitchenNotification();
}

// PERBAIKAN: Fungsi untuk update tampilan tombol shift
function updateShiftButtons() {
    if (currentShift) {
        // Shift sedang berjalan
        $('#openShiftBtn').prop('disabled', true).html('<i class="fas fa-cash-register"></i> Shift Berjalan');
        $('#closeShiftBtn').prop('disabled', false);
    } else {
        // Tidak ada shift
        $('#openShiftBtn').prop('disabled', false).html('<i class="fas fa-cash-register"></i> Buka Shift');
        $('#closeShiftBtn').prop('disabled', true);
    }
}

// PERBAIKAN: Fungsi untuk update notifikasi pesanan dapur - LOGIKA DIPERBAIKI
function updateKitchenNotification() {
    // Hitung pesanan aktif (dine-in dengan status preparing atau ready dan belum di-archive)
    const activeOrders = orders.filter(order => 
        order.type === 'dinein' && 
        (order.status === 'preparing' || order.status === 'ready') &&
        !order.kitchenArchived
    );
    
    const orderCount = activeOrders.length;
    const $badge = $('#kitchenNotificationBadge');
    
    if (orderCount > 0) {
        $badge.text(orderCount).show();
    } else {
        $badge.hide();
    }
    
    // Juga update badge di tab jika modal kitchen sedang terbuka
    if ($('#kitchenDisplayModal').is(':visible')) {
        loadKitchenOrders();
    }
}

// PERBAIKAN UTAMA: Fungsi loadKitchenOrders yang diperbaiki
function loadKitchenOrders() {
    const $kitchenOrders = $('#kitchenOrders');
    
    // PERBAIKAN: Tampilkan loading indicator jika belum ada data
    if (orders.length === 0) {
        $kitchenOrders.html('<div class="kitchen-loading"><div class="kitchen-loading-spinner"></div><p>Memuat pesanan...</p></div>');
        return;
    }
    
    const kitchenOrders = orders.filter(o => o.type === 'dinein' && o.status !== 'completed' && !o.kitchenArchived);
    
    $kitchenOrders.empty();
    
    if (kitchenOrders.length === 0) {
        $kitchenOrders.html('<div class="empty-state"><i class="fas fa-check-circle"></i><p>Tidak ada pesanan aktif</p></div>');
    } else {
        kitchenOrders.forEach(order => {
            const statusClass = order.status === 'ready' ? (order.statusLocked ? 'status-locked' : 'status-ready') : 'status-preparing';
            const itemsSummary = order.items.slice(0, 2).map(item => `${item.menu.name} (${item.quantity}x)`).join(', ') + (order.items.length > 2 ? ` + ${order.items.length - 2} lainnya` : '');
            
            // PERBAIKAN: Tombol "Tandai Selesai" hanya muncul jika status sudah 'ready'
            let actionButton = '';
            if (order.status === 'ready') {
                actionButton = `<button class="btn btn-sm btn-success mark-kitchen-done" data-id="${order.id}" style="font-size: 0.7rem; padding: 3px 8px;"><i class="fas fa-check"></i> Tandai Selesai</button>`;
            }
            
            $kitchenOrders.append(`
                <div class="status-item ${statusClass}" data-id="${order.id}">
                    <div>
                        <strong>${order.id} (Meja ${order.tableNumber})</strong>
                        <div style="font-size:0.8rem;">${itemsSummary}</div>
                        <div style="font-size:0.8rem; color: #666; margin-top: 3px;">
                            <i class="fas fa-user"></i> ${order.customerName || 'Tidak ada nama'} | 
                            <i class="fas fa-clock"></i> ${moment(order.date).format('HH:mm')}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
                        <div style="font-weight:600;">${order.status === 'ready' ? 'Siap' : 'Proses'}</div>
                        ${actionButton}
                    </div>
                </div>
            `);
        });
    }
    
    // PERBAIKAN: Update waktu refresh terakhir
    kitchenLastRefreshTime = new Date();
    
    // FITUR BARU: Update notifikasi setelah load
    updateKitchenNotification();
}


function promptForProfitAccess(callback) {
    const title = 'Kode Keamanan Akses Laba';
    $('#passwordPromptTitle').text(title);
    $('#passwordPromptMessage').text(`Masukkan kode keamanan untuk mengakses fitur perhitungan laba.`);
    passwordPromptCallback = callback;
    $('#passwordPromptInput').val('');
    $('#passwordPromptModal').css('display', 'flex').find('input').focus();
}

function generateCaptcha() {
    const canvas = document.getElementById('captchaCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const chars = 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789';
    let text = '';
    for (let i = 0; i < 5; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    captchaText = text;

    ctx.fillStyle = '#f0f2f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < text.length; i++) {
        ctx.save();
        ctx.translate(20 + i * 25, canvas.height / 2 + (Math.random() - 0.5) * 10);
        ctx.rotate((Math.random() - 0.5) * 0.4);
        ctx.font = 'bold 24px Poppins';
        ctx.fillStyle = `rgba(0,0,0,${0.7 + Math.random() * 0.3})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text[i], 0, 0);
        ctx.restore();
    }

    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

// Fungsi untuk mengecek permission user
function checkPermission(permission) {
    if (!currentUser || !currentUser.permissions) {
        return false;
    }
    
    // Admin memiliki semua permission
    if (currentUser.role === 'admin') {
        return true;
    }
    
    return currentUser.permissions[permission] === true;
}

// Fungsi untuk menghasilkan laporan shift
function generateShiftReport(shift) {
    const shiftDuration = moment.duration(moment(shift.endTime).diff(moment(shift.startTime)));
    const hours = Math.floor(shiftDuration.asHours());
    const minutes = Math.floor(shiftDuration.asMinutes()) - (hours * 60);
    
    let reportHtml = `
        <div class="professional-pdf">
            <div class="pdf-report-header">
                <h1>LAPORAN PENUTUPAN SHIFT</h1>
                <h2>${settings.umkmName || 'UMKM LINK'} <span class="premium-badge">PREMIUM</span></h2>
            </div>
            
            <div class="pdf-report-info">
                <div><strong>ID Shift:</strong> ${shift.id}</div>
                <div><strong>Tanggal:</strong> ${moment(shift.startTime).format('DD/MM/YYYY')}</div>
                <div><strong>Kasir:</strong> ${shift.cashier.name}</div>
                <div><strong>Durasi Shift:</strong> ${hours} jam ${minutes} menit</div>
                <div><strong>Waktu Mulai:</strong> ${moment(shift.startTime).format('HH:mm')}</div>
                <div><strong>Waktu Selesai:</strong> ${moment(shift.endTime).format('HH:mm')}</div>
            </div>
            
            <div class="pdf-report-summary">
                <div class="pdf-summary-card">
                    <h3>Uang Kas Awal</h3>
                    <p>${formatCurrency(shift.initialCash)}</p>
                </div>
                <div class="pdf-summary-card">
                    <h3>Total Penjualan</h3>
                    <p>${formatCurrency(shift.totalSales)}</p>
                </div>
                <div class="pdf-summary-card">
                    <h3>Total Transaksi</h3>
                    <p>${shift.totalTransactions}</p>
                </div>
                <div class="pdf-summary-card">
                    <h3>Uang Kas Aktual</h3>
                    <p>${formatCurrency(shift.actualCash)}</p>
                </div>
            </div>
            
            <div class="pdf-table-container">
                <h4>Rincian Transaksi</h4>
                <table class="pdf-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>ID Transaksi</th>
                            <th>Waktu</th>
                            <th>Total</th>
                            <th>Metode Bayar</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    shift.orders.forEach((order, index) => {
        reportHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${order.id}</td>
                <td>${moment(order.date).format('HH:mm')}</td>
                <td>${formatCurrency(order.total)}</td>
                <td>${order.paymentMethod === 'cash' ? 'Tunai' : order.paymentMethod === 'qris' ? 'QRIS' : order.paymentMethod}</td>
            </tr>
        `;
    });
    
    reportHtml += `
                    </tbody>
                </table>
            </div>
            
            <div class="pdf-chart-container">
                <h4>Ringkasan Keuangan</h4>
                <div class="profit-breakdown">
                    <div class="breakdown-item">
                        <label>Uang Kas Awal</label>
                        <span>${formatCurrency(shift.initialCash)}</span>
                    </div>
                    <div class="breakdown-item">
                        <label>Total Penjualan</label>
                        <span>${formatCurrency(shift.totalSales)}</span>
                    </div>
                    <div class="breakdown-item">
                        <label>Pengeluaran</label>
                        <span>${formatCurrency(shift.expenses || 0)}</span>
                    </div>
                    <div class="breakdown-item">
                        <label>Pendapatan Lain</label>
                        <span>${formatCurrency(shift.otherIncome || 0)}</span>
                    </div>
                    <div class="breakdown-item">
                        <label>Uang Kas Seharusnya</label>
                        <span>${formatCurrency(shift.initialCash + shift.totalSales - (shift.expenses || 0) + (shift.otherIncome || 0))}</span>
                    </div>
                    <div class="breakdown-item">
                        <label>Uang Kas Aktual</label>
                        <span>${formatCurrency(shift.actualCash)}</span>
                    </div>
                    <div class="breakdown-item">
                        <label>Selisih Kas</label>
                        <span style="color: ${shift.cashDifference > 0 ? 'var(--success)' : shift.cashDifference < 0 ? 'var(--danger)' : 'var(--dark)'}">
                            ${formatCurrency(shift.cashDifference)}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="pdf-footer-signature">
                <div class="pdf-signature-box">
                    <p>Kasir</p>
                    <div class="pdf-signature-line"></div>
                    <p><strong>${shift.cashier.name}</strong></p>
                </div>
                <div class="pdf-signature-box">
                    <p>Manager/Pemilik</p>
                    <div class="pdf-signature-line"></div>
                    <p><strong>____________________</strong></p>
                </div>
            </div>
            
            <div class="pdf-footer">
                <p><strong>&copy; ${new Date().getFullYear()} UMKM LINK - Lentera Karya Situbondo</strong></p>
                <p class="fishery-support">Supported by Dinas Perikanan Situbondo - Bidang Pemberdayaan Nelayan</p>
            </div>
        </div>
    `;
    
    // Tampilkan report dalam modal
    const modalContent = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3 class="modal-title">Laporan Penutupan Shift</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                ${reportHtml}
            </div>
            <div class="modal-footer">
                <button class="btn btn-warning modal-close-btn">Tutup</button>
                <button class="btn btn-info" id="downloadShiftReportBtn"><i class="fas fa-file-pdf"></i> Unduh PDF</button>
                <button class="btn btn-primary" id="printShiftReportBtn"><i class="fas fa-print"></i> Cetak Laporan</button>
            </div>
        </div>
    `;
    
    // Buat modal sementara
    const tempModal = $('<div class="modal" style="display: flex;">' + modalContent + '</div>');
    $('body').append(tempModal);
    
    // Event handlers untuk tombol di modal
    tempModal.find('.modal-close, .modal-close-btn').click(function() {
        tempModal.remove();
    });
    
    tempModal.find('#downloadShiftReportBtn').click(function() {
        showLoading('Mengunduh laporan shift PDF...');
        setTimeout(() => {
            downloadShiftReportAsPdf(shift);
            tempModal.remove();
        }, 500);
    });
    
    tempModal.find('#printShiftReportBtn').click(function() {
        printElement(tempModal.find('.professional-pdf'));
    });
}

// PERBAIKAN: Fungsi untuk menghitung laba yang diperbaiki
function calculateProfit() {
    let startDate, endDate;
    const period = $('#profitPeriod').val();
    
    if (period === 'today') { 
        startDate = moment().startOf('day'); 
        endDate = moment().endOf('day'); 
    }
    else if (period === 'week') { 
        startDate = moment().startOf('week'); 
        endDate = moment().endOf('week'); 
    }
    else if (period === 'month') { 
        startDate = moment().startOf('month'); 
        endDate = moment().endOf('month'); 
    }
    else if (period === 'custom') {
        startDate = moment($('#profitStartDate').val()); 
        endDate = moment($('#profitEndDate').val()).endOf('day');
        if (!startDate.isValid() || !endDate.isValid() || endDate.isBefore(startDate)) {
            showToast('Rentang tanggal tidak valid', 'error');
            return;
        }
    } else {
        showToast('Periode tidak valid', 'error');
        return;
    }
    
    const filteredOrders = orders.filter(o => moment(o.date).isBetween(startDate, endDate));
    
    if (filteredOrders.length === 0) {
        $('#profitResults').html('<div class="empty-state"><i class="fas fa-chart-line"></i><p>Tidak ada data penjualan pada periode ini</p></div>');
        $('#downloadProfitReportBtn').hide();
        return;
    }
    
    // Hitung total penjualan
    const totalSales = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalTransactions = filteredOrders.length;
    const totalItemsSold = filteredOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    
    // Hitung HPP (Harga Pokok Penjualan)
    const defaultCOGS = profitSettings.defaultCOGS || 60;
    const cogsPercentage = defaultCOGS / 100;
    const totalCOGS = totalSales * cogsPercentage;
    
    // Hitung laba kotor
    const grossProfit = totalSales - totalCOGS;
    const grossProfitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
    
    // Hitung biaya operasional (estimasi dari fixed cost bulanan)
    const monthlyFixedCost = profitSettings.monthlyFixedCost || 0;
    const daysInMonth = moment().daysInMonth();
    const dailyFixedCost = monthlyFixedCost / daysInMonth;
    const periodDays = Math.ceil(moment.duration(endDate.diff(startDate)).asDays()) || 1;
    const operationalCost = dailyFixedCost * periodDays;
    
    // Hitung laba bersih
    const netProfit = grossProfit - operationalCost;
    const netProfitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
    
    // Generate report HTML
    let reportHtml = `
        <div class="profit-calculation-container">
            <h4 class="panel-title">Laporan Laba ${period === 'today' ? 'Hari Ini' : period === 'week' ? 'Minggu Ini' : period === 'month' ? 'Bulan Ini' : 'Custom'}</h4>
            <p>Periode: ${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}</p>
            
            <div class="profit-result-card" style="margin-top: 15px;">
                <h4>LABA BERSIH</h4>
                <p style="color: ${netProfit >= 0 ? 'var(--success)' : 'var(--danger)'};">
                    ${formatCurrency(netProfit)}
                </p>
                <p>Margin: ${netProfitMargin.toFixed(2)}%</p>
            </div>
            
            <div class="profit-breakdown" style="grid-template-columns: repeat(3, 1fr); margin-top: 20px;">
                <div class="breakdown-item">
                    <label>Total Penjualan</label>
                    <span>${formatCurrency(totalSales)}</span>
                </div>
                <div class="breakdown-item">
                    <label>Total Transaksi</label>
                    <span>${totalTransactions}</span>
                </div>
                <div class="breakdown-item">
                    <label>Total Item Terjual</label>
                    <span>${totalItemsSold}</span>
                </div>
                <div class="breakdown-item">
                    <label>HPP (${defaultCOGS}%)</label>
                    <span>${formatCurrency(totalCOGS)}</span>
                </div>
                <div class="breakdown-item">
                    <label>Laba Kotor</label>
                    <span style="color: ${grossProfit >= 0 ? 'var(--success)' : 'var(--danger)'}">
                        ${formatCurrency(grossProfit)}
                    </span>
                </div>
                <div class="breakdown-item">
                    <label>Margin Laba Kotor</label>
                    <span>${grossProfitMargin.toFixed(2)}%</span>
                </div>
                <div class="breakdown-item">
                    <label>Biaya Operasional</label>
                    <span>${formatCurrency(operationalCost)}</span>
                </div>
                <div class="breakdown-item">
                    <label>Laba Bersih</label>
                    <span style="color: ${netProfit >= 0 ? 'var(--success)' : 'var(--danger)'}">
                        ${formatCurrency(netProfit)}
                    </span>
                </div>
                <div class="breakdown-item">
                    <label>Margin Laba Bersih</label>
                    <span>${netProfitMargin.toFixed(2)}%</span>
                </div>
            </div>
            
            <div class="mt-3" style="background: #f8f9fa; padding: 15px; border-radius: var(--rounded);">
                <h5>Analisis Profitabilitas</h5>
                <p>Rata-rata transaksi: ${formatCurrency(totalSales / (totalTransactions || 1))}</p>
                <p>Rata-rata item per transaksi: ${(totalItemsSold / (totalTransactions || 1)).toFixed(1)} item</p>
                <p>Persentase HPP: ${defaultCOGS}%</p>
                <p>Biaya operasional harian: ${formatCurrency(dailyFixedCost)}</p>
            </div>
        </div>
    `;
    
    $('#profitResults').html(reportHtml);
    $('#downloadProfitReportBtn').show().data('reportData', {
        startDate: startDate,
        endDate: endDate,
        period: period,
        totalSales: totalSales,
        totalTransactions: totalTransactions,
        totalItemsSold: totalItemsSold,
        totalCOGS: totalCOGS,
        grossProfit: grossProfit,
        grossProfitMargin: grossProfitMargin,
        operationalCost: operationalCost,
        netProfit: netProfit,
        netProfitMargin: netProfitMargin,
        defaultCOGS: defaultCOGS
    });
    
    showToast('Perhitungan laba selesai', 'success');
}

// PERBAIKAN: Fungsi untuk generate laporan yang diperbaiki
function generateReport() {
    let startDate, endDate;
    const period = $('#reportPeriod').val();
    
    if (period === 'today') { 
        startDate = moment().startOf('day'); 
        endDate = moment().endOf('day'); 
    }
    else if (period === 'week') { 
        startDate = moment().startOf('week'); 
        endDate = moment().endOf('week'); 
    }
    else if (period === 'month') { 
        startDate = moment().startOf('month'); 
        endDate = moment().endOf('month'); 
    }
    else if (period === 'custom') {
        startDate = moment($('#reportStartDate').val()); 
        endDate = moment($('#reportEndDate').val()).endOf('day');
        if (!startDate.isValid() || !endDate.isValid() || endDate.isBefore(startDate)) {
            showToast('Rentang tanggal tidak valid', 'error');
            return;
        }
    } else {
        showToast('Periode tidak valid', 'error');
        return;
    }
    
    const filteredOrders = orders.filter(o => moment(o.date).isBetween(startDate, endDate));
    
    // Gunakan fungsi baru untuk generate laporan PDF yang profesional
    generateProfessionalSalesReport(filteredOrders, startDate, endDate, period);
}

// FUNGSI BARU: Generate laporan PDF yang lebih profesional
function generateProfessionalSalesReport(filteredOrders, startDate, endDate, period) {
    const $resultsContainer = $('#reportResults');
    if (filteredOrders.length === 0) { 
        $resultsContainer.html('<div class="empty-state"><i class="fas fa-chart-bar"></i><p>Tidak ada data penjualan</p></div>'); 
        $('#printReportBtn, #downloadReportBtn').hide(); 
        return; 
    }
    
    const totalRevenue = filteredOrders.reduce((s, o) => s + (o.subtotal - o.discount), 0);
    const totalItemsSold = filteredOrders.reduce((s, o) => s + o.items.reduce((i, item) => i + item.quantity, 0), 0);
    const totalTransactions = filteredOrders.length;
    
    // Hitung per metode pembayaran
    const paymentMethods = {};
    filteredOrders.forEach(o => {
        const method = o.paymentMethod === 'cash' ? 'Tunai' : 
                      o.paymentMethod === 'qris' ? 'QRIS' : 
                      o.paymentMethod === 'transfer' ? 'Transfer Bank' : 'E-Wallet';
        paymentMethods[method] = (paymentMethods[method] || 0) + o.total;
    });
    
    // Hitung menu terlaris
    const menuSales = {};
    filteredOrders.forEach(o => o.items.forEach(item => { 
        menuSales[item.menu.id] = menuSales[item.menu.id] || { 
            name: item.menu.name, 
            quantity: 0, 
            total: 0 
        }; 
        menuSales[item.menu.id].quantity += item.quantity; 
        menuSales[item.menu.id].total += item.quantity * item.menu.price; 
    }));
    const topMenus = Object.values(menuSales).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    
    // PERBAIKAN: Pastikan periodText didefinisikan
    const periodText = period === 'today' ? 'Hari Ini' : 
                     period === 'week' ? 'Minggu Ini' : 
                     period === 'month' ? 'Bulan Ini' : 'Custom';
    
    // Generate HTML laporan profesional
    let reportHtml = `
        <div class="professional-pdf">
            <div class="pdf-report-header">
                <h1>LAPORAN PENJUALAN PROFESIONAL</h1>
                <h2>${settings.umkmName || 'UMKM LINK'} <span class="premium-badge">PREMIUM</span></h2>
            </div>
            
            <div class="pdf-report-info">
                <div><strong>Periode Laporan:</strong> ${periodText}</div>
                <div><strong>Tanggal:</strong> ${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}</div>
                <div><strong>Dibuat Oleh:</strong> ${currentUser.name}</div>
                <div><strong>Tanggal Cetak:</strong> ${moment().format('DD/MM/YYYY HH:mm')}</div>
                <div><strong>Total Transaksi:</strong> ${totalTransactions}</div>
                <div><strong>Total Pendapatan:</strong> ${formatCurrency(totalRevenue)}</div>
            </div>
            
            <div class="pdf-report-summary">
                <div class="pdf-summary-card">
                    <h3>Total Pendapatan</h3>
                    <p>${formatCurrency(totalRevenue)}</p>
                </div>
                <div class="pdf-summary-card">
                    <h3>Total Transaksi</h3>
                    <p>${totalTransactions}</p>
                </div>
                <div class="pdf-summary-card">
                    <h3>Total Item Terjual</h3>
                    <p>${totalItemsSold}</p>
                </div>
                <div class="pdf-summary-card">
                    <h3>Rata-rata/Transaksi</h3>
                    <p>${formatCurrency(totalRevenue / (totalTransactions || 1))}</p>
                </div>
            </div>
            
            <div class="pdf-table-container">
                <h4>Distribusi Metode Pembayaran</h4>
                <table class="pdf-table">
                    <thead>
                        <tr>
                            <th>Metode Pembayaran</th>
                            <th>Jumlah Transaksi</th>
                            <th>Total Nilai</th>
                            <th>Persentase</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Tampilkan data metode pembayaran
    Object.keys(paymentMethods).forEach(method => {
        const methodOrders = filteredOrders.filter(o => {
            const oMethod = o.paymentMethod === 'cash' ? 'Tunai' : 
                           o.paymentMethod === 'qris' ? 'QRIS' : 
                           o.paymentMethod === 'transfer' ? 'Transfer Bank' : 'E-Wallet';
            return oMethod === method;
        });
        const methodCount = methodOrders.length;
        const methodTotal = paymentMethods[method];
        const methodPercentage = totalRevenue > 0 ? (methodTotal / totalRevenue * 100).toFixed(2) : 0;
        
        reportHtml += `
            <tr>
                <td>${method}</td>
                <td>${methodCount}</td>
                <td>${formatCurrency(methodTotal)}</td>
                <td>${methodPercentage}%</td>
            </tr>
        `;
    });
    
    reportHtml += `
                    </tbody>
                </table>
            </div>
            
            <div class="pdf-table-container">
                <h4>10 Menu Terlaris</h4>
                <table class="pdf-table">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama Menu</th>
                            <th>Jumlah Terjual</th>
                            <th>Total Pendapatan</th>
                            <th>Persentase</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Tampilkan menu terlaris
    topMenus.forEach((menu, index) => {
        const menuPercentage = totalRevenue > 0 ? (menu.total / totalRevenue * 100).toFixed(2) : 0;
        reportHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${menu.name}</td>
                <td>${menu.quantity}</td>
                <td>${formatCurrency(menu.total)}</td>
                <td>${menuPercentage}%</td>
            </tr>
        `;
    });
    
    reportHtml += `
                    </tbody>
                </table>
            </div>
            
            <div class="pdf-chart-container">
                <h4>Analisis Performa Penjualan</h4>
                <div class="profit-breakdown">
                    <div class="breakdown-item">
                        <label>Rata-rata Item/Transaksi</label>
                        <span>${(totalItemsSold / (totalTransactions || 1)).toFixed(1)} item</span>
                    </div>
                    <div class="breakdown-item">
                        <label>Rata-rata Nilai/Transaksi</label>
                        <span>${formatCurrency(totalRevenue / (totalTransactions || 1))}</span>
                    </div>
                    <div class="breakdown-item">
                        <label>Rata-rata Nilai/Item</label>
                        <span>${formatCurrency(totalRevenue / (totalItemsSold || 1))}</span>
                    </div>
                    <div class="breakdown-item">
                        <label>Periode Laporan</label>
                        <span>${Math.ceil(moment.duration(endDate.diff(startDate)).asDays())} hari</span>
                    </div>
                </div>
            </div>
            
            <div class="pdf-footer-signature">
                <div class="pdf-signature-box">
                    <p>Dibuat Oleh</p>
                    <div class="pdf-signature-line"></div>
                    <p><strong>${currentUser.name}</strong></p>
                </div>
                <div class="pdf-signature-box">
                    <p>Disetujui Oleh</p>
                    <div class="pdf-signature-line"></div>
                    <p><strong>____________________</strong></p>
                </div>
            </div>
            
            <div class="pdf-footer">
                <p><strong>&copy; ${new Date().getFullYear()} UMKM LINK - Lentera Karya Situbondo</strong></p>
                <p class="fishery-support">Supported by Dinas Perikanan Situbondo - Bidang Pemberdayaan Nelayan</p>
            </div>
        </div>
    `;
    
    $resultsContainer.html(reportHtml);
    $('#printReportBtn, #downloadReportBtn').show();
}

// Fungsi untuk download laporan laba sebagai PDF
function downloadProfitReportAsPdf() {
    const reportData = $('#downloadProfitReportBtn').data('reportData');
    if (!reportData) return;
    
    // Buat HTML untuk PDF
    const periodText = reportData.period === 'today' ? 'Hari Ini' : 
                     reportData.period === 'week' ? 'Minggu Ini' : 
                     reportData.period === 'month' ? 'Bulan Ini' : 'Custom';
    
    const htmlContent = `
        <div class="professional-pdf">
            <div class="pdf-report-header">
                <h1>LAPORAN PERHITUNGAN LABA</h1>
                <h2>${settings.umkmName || 'UMKM LINK'} <span class="premium-badge">PREMIUM</span></h2>
            </div>
            
            <div class="pdf-report-info">
                <div><strong>Periode:</strong> ${periodText}</div>
                <div><strong>Tanggal:</strong> ${reportData.startDate.format('DD/MM/YYYY')} - ${reportData.endDate.format('DD/MM/YYYY')}</div>
                <div><strong>Kasir:</strong> ${currentUser.name}</div>
                <div><strong>Tanggal Cetak:</strong> ${moment().format('DD/MM/YYYY HH:mm')}</div>
            </div>
            
            <div class="pdf-report-summary">
                <div class="pdf-summary-card">
                    <h3>Total Penjualan</h3>
                    <p>${formatCurrency(reportData.totalSales)}</p>
                </div>
                <div class="pdf-summary-card">
                    <h3>Total Transaksi</h3>
                    <p>${reportData.totalTransactions}</p>
                </div>
                <div class="pdf-summary-card">
                    <h3>Laba Kotor</h3>
                    <p style="color: ${reportData.grossProfit >= 0 ? '#28a745' : '#dc3545'}">
                        ${formatCurrency(reportData.grossProfit)}
                    </p>
                </div>
                <div class="pdf-summary-card">
                    <h3>Laba Bersih</h3>
                    <p style="color: ${reportData.netProfit >= 0 ? '#28a745' : '#dc3545'}">
                        ${formatCurrency(reportData.netProfit)}
                    </p>
                </div>
            </div>
            
            <div class="pdf-chart-container">
                <h4>Rincian Perhitungan Laba</h4>
                <table class="pdf-table">
                    <thead>
                        <tr>
                            <th>Keterangan</th>
                            <th>Jumlah</th>
                            <th>Persentase</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Total Penjualan</td>
                            <td>${formatCurrency(reportData.totalSales)}</td>
                            <td>100%</td>
                        </tr>
                        <tr>
                            <td>HPP (${reportData.defaultCOGS}%)</td>
                            <td>${formatCurrency(reportData.totalCOGS)}</td>
                            <td>${reportData.defaultCOGS}%</td>
                        </tr>
                        <tr>
                            <td><strong>Laba Kotor</strong></td>
                            <td style="color: ${reportData.grossProfit >= 0 ? '#28a745' : '#dc3545'}">
                                ${formatCurrency(reportData.grossProfit)}
                            </td>
                            <td>${reportData.grossProfitMargin.toFixed(2)}%</td>
                        </tr>
                        <tr>
                            <td>Biaya Operasional</td>
                            <td>${formatCurrency(reportData.operationalCost)}</td>
                            <td>${(reportData.operationalCost / reportData.totalSales * 100).toFixed(2)}%</td>
                        </tr>
                        <tr>
                            <td><strong>Laba Bersih</strong></td>
                            <td style="color: ${reportData.netProfit >= 0 ? '#28a745' : '#dc3545'}">
                                ${formatCurrency(reportData.netProfit)}
                            </td>
                            <td>${reportData.netProfitMargin.toFixed(2)}%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="pdf-chart-container">
                <h4>Statistik Tambahan</h4>
                <div class="profit-breakdown">
                    <div class="breakdown-item">
                        <label>Total Item Terjual</label>
                        <span>${reportData.totalItemsSold}</span>
                    </div>
                    <div class="breakdown-item">
                        <label>Rata-rata Transaksi</label>
                        <span>${formatCurrency(reportData.totalSales / (reportData.totalTransactions || 1))}</span>
                    </div>
                    <div class="breakdown-item">
                        <label>Rata-rata Item/Transaksi</label>
                        <span>${(reportData.totalItemsSold / (reportData.totalTransactions || 1)).toFixed(1)}</span>
                    </div>
                    <div class="breakdown-item">
                        <label>Persentase HPP</label>
                        <span>${reportData.defaultCOGS}%</span>
                    </div>
                </div>
            </div>
            
            <div class="pdf-footer-signature">
                <div class="pdf-signature-box">
                    <p>Dibuat Oleh</p>
                    <div class="pdf-signature-line"></div>
                    <p><strong>${currentUser.name}</strong></p>
                </div>
                <div class="pdf-signature-box">
                    <p>Disetujui Oleh</p>
                    <div class="pdf-signature-line"></div>
                    <p><strong>____________________</strong></p>
                </div>
            </div>
            
            <div class="pdf-footer">
                <p><strong>&copy; ${new Date().getFullYear()} UMKM LINK - Lentera Karya Situbondo</strong></p>
                <p class="fishery-support">Supported by Dinas Perikanan Situbondo - Bidang Pemberdayaan Nelayan</p>
            </div>
        </div>
    `;
    
    // Buat elemen sementara untuk render PDF
    const tempElement = document.createElement('div');
    tempElement.innerHTML = htmlContent;
    document.body.appendChild(tempElement);
    
    // Konversi ke PDF
    setTimeout(() => {
        html2canvas(tempElement.querySelector('.professional-pdf'), {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Laporan_Laba_${settings.umkmName || 'UMKM LINK'}_${moment().format('YYYYMMDD_HHmm')}.pdf`);
            
            document.body.removeChild(tempElement);
            hideLoading();
            showToast('Laporan laba berhasil diunduh', 'success');
        }).catch(err => {
            console.error('Error generating PDF:', err);
            document.body.removeChild(tempElement);
            hideLoading();
            showToast('Gagal membuat PDF', 'error');
        });
    }, 1000);
}

// Fungsi untuk download laporan shift sebagai PDF
function downloadShiftReportAsPdf(shift) {
    // Generate HTML untuk laporan shift (sama seperti di generateShiftReport)
    const shiftDuration = moment.duration(moment(shift.endTime).diff(moment(shift.startTime)));
    const hours = Math.floor(shiftDuration.asHours());
    const minutes = Math.floor(shiftDuration.asMinutes()) - (hours * 60);
    
    const htmlContent = generateShiftReportHTML(shift, hours, minutes);
    
    // Buat elemen sementara untuk render PDF
    const tempElement = document.createElement('div');
    tempElement.innerHTML = `<div class="professional-pdf">${htmlContent}</div>`;
    document.body.appendChild(tempElement);
    
    // Konversi ke PDF
    setTimeout(() => {
        html2canvas(tempElement.querySelector('.professional-pdf'), {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Laporan_Shift_${shift.id}_${moment(shift.endTime).format('YYYYMMDD')}.pdf`);
            
            document.body.removeChild(tempElement);
            hideLoading();
            showToast('Laporan shift berhasil diunduh', 'success');
        }).catch(err => {
            console.error('Error generating PDF:', err);
            document.body.removeChild(tempElement);
            hideLoading();
            showToast('Gagal membuat PDF', 'error');
        });
    }, 1000);
}

// Helper function untuk generate HTML laporan shift
function generateShiftReportHTML(shift, hours, minutes) {
    return `
        <div class="pdf-report-header">
            <h1>LAPORAN PENUTUPAN SHIFT</h1>
            <h2>${settings.umkmName || 'UMKM LINK'} <span class="premium-badge">PREMIUM</span></h2>
        </div>
        
        <div class="pdf-report-info">
            <div><strong>ID Shift:</strong> ${shift.id}</div>
            <div><strong>Tanggal:</strong> ${moment(shift.startTime).format('DD/MM/YYYY')}</div>
            <div><strong>Kasir:</strong> ${shift.cashier.name}</div>
            <div><strong>Durasi Shift:</strong> ${hours} jam ${minutes} menit</div>
            <div><strong>Waktu Mulai:</strong> ${moment(shift.startTime).format('HH:mm')}</div>
            <div><strong>Waktu Selesai:</strong> ${moment(shift.endTime).format('HH:mm')}</div>
        </div>
        
        <div class="pdf-report-summary">
            <div class="pdf-summary-card">
                <h3>Uang Kas Awal</h3>
                <p>${formatCurrency(shift.initialCash)}</p>
            </div>
            <div class="pdf-summary-card">
                <h3>Total Penjualan</h3>
                <p>${formatCurrency(shift.totalSales)}</p>
            </div>
            <div class="pdf-summary-card">
                <h3>Total Transaksi</h3>
                <p>${shift.totalTransactions}</p>
            </div>
            <div class="pdf-summary-card">
                <h3>Uang Kas Aktual</h3>
                <p>${formatCurrency(shift.actualCash)}</p>
            </div>
        </div>
        
        <div class="pdf-table-container">
            <h4>Rincian Transaksi (${shift.orders.length} transaksi)</h4>
            <table class="pdf-table">
                <thead>
                    <tr>
                        <th>No</th>
                        <th>ID Transaksi</th>
                        <th>Waktu</th>
                        <th>Total</th>
                        <th>Metode Bayar</th>
                    </tr>
                </thead>
                <tbody>
                    ${shift.orders.map((order, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${order.id}</td>
                            <td>${moment(order.date).format('HH:mm')}</td>
                            <td>${formatCurrency(order.total)}</td>
                            <td>${order.paymentMethod === 'cash' ? 'Tunai' : order.paymentMethod === 'qris' ? 'QRIS' : order.paymentMethod}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="pdf-chart-container">
            <h4>Ringkasan Keuangan</h4>
            <div class="profit-breakdown">
                <div class="breakdown-item">
                    <label>Uang Kas Awal</label>
                    <span>${formatCurrency(shift.initialCash)}</span>
                </div>
                <div class="breakdown-item">
                    <label>Total Penjualan</label>
                    <span>${formatCurrency(shift.totalSales)}</span>
                </div>
                <div class="breakdown-item">
                    <label>Pengeluaran</label>
                    <span>${formatCurrency(shift.expenses || 0)}</span>
                </div>
                <div class="breakdown-item">
                    <label>Pendapatan Lain</label>
                    <span>${formatCurrency(shift.otherIncome || 0)}</span>
                </div>
                <div class="breakdown-item">
                    <label>Uang Kas Seharusnya</label>
                    <span>${formatCurrency(shift.initialCash + shift.totalSales - (shift.expenses || 0) + (shift.otherIncome || 0))}</span>
                </div>
                <div class="breakdown-item">
                    <label>Uang Kas Aktual</label>
                    <span>${formatCurrency(shift.actualCash)}</span>
                </div>
                <div class="breakdown-item">
                    <label>Selisih Kas</label>
                    <span style="color: ${shift.cashDifference > 0 ? '#28a745' : shift.cashDifference < 0 ? '#dc3545' : '#343a40'}">
                        ${formatCurrency(shift.cashDifference)}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="pdf-footer-signature">
            <div class="pdf-signature-box">
                <p>Kasir</p>
                <div class="pdf-signature-line"></div>
                <p><strong>${shift.cashier.name}</strong></p>
            </div>
            <div class="pdf-signature-box">
                <p>Manager/Pemilik</p>
                <div class="pdf-signature-line"></div>
                <p><strong>____________________</strong></p>
            </div>
        </div>
        
        <div class="pdf-footer">
            <p><strong>&copy; ${new Date().getFullYear()} UMKM LINK - Lentera Karya Situbondo</strong></p>
            <p class="fishery-support">Supported by Dinas Perikanan Situbondo - Bidang Pemberdayaan Nelayan</p>
        </div>
    `;
}

// PERBAIKAN UTAMA: Fungsi Generate Menu PDF Preview dengan layout 4x4
function generateMenuPdfPreview() {
    // Kelompokkan menu berdasarkan kategori
    const menuByCategory = {};
    menus.forEach(menu => {
        if (!menuByCategory[menu.category]) {
            menuByCategory[menu.category] = [];
        }
        menuByCategory[menu.category].push(menu);
    });
    
    // Hitung total menu
    let totalMenus = 0;
    Object.keys(menuByCategory).forEach(category => {
        totalMenus += menuByCategory[category].length;
    });
    
    // Buat HTML untuk preview dengan grid 4x4
    let html = `
        <div id="menuPdfContainer">
            <div class="pdf-a4-wrapper">
                <div class="pdf-header">
                    <h1>DAFTAR MENU LENGKAP</h1>
                    <h2>${settings.umkmName || 'UMKM LINK'} <span class="premium-badge">PREMIUM</span></h2>
                    <div class="pdf-subtitle"><strong>Alamat:</strong> ${settings.storeAddress || ''}</div>
                    <div class="pdf-subtitle"><strong>Telepon/WA:</strong> ${settings.storePhone || ''}</div>
                    <div class="pdf-subtitle"><strong>Email:</strong> ${settings.storeEmail || ''}</div>
                    <div class="pdf-subtitle"><strong>Tanggal Cetak:</strong> ${moment().format('DD/MM/YYYY HH:mm')}</div>
                    <div class="pdf-subtitle"><strong>Total Menu:</strong> ${totalMenus} menu dalam ${Object.keys(menuByCategory).length} kategori</div>
                    <div class="pdf-support-info">
                        <i class="fas fa-hands-helping"></i> Supported by Dinas Perikanan Situbondo - Bidang Pemberdayaan Nelayan
                    </div>
                </div>
                
                <div class="pdf-qr-section">
                    <h3><i class="fas fa-qrcode"></i> Scan QRCode untuk Memesan</h3>
                    <p>Gunakan kamera smartphone Anda untuk scan QRCode di bawah ini:</p>
                    <div class="pdf-qr-code" id="qrOrderPdf"></div>
                    <p class="pdf-qr-label">www.aplikasiusaha.com/orderform</p>
                </div>
    `;
    
    // Loop melalui setiap kategori
    let categoryIndex = 0;
    Object.keys(menuByCategory).forEach(category => {
        const categoryMenus = menuByCategory[category];
        
        // Hitung berapa halaman yang diperlukan untuk kategori ini (maks 16 menu per halaman)
        const menusPerPage = 16; // 4x4 grid
        const pages = Math.ceil(categoryMenus.length / menusPerPage);
        
        for (let page = 0; page < pages; page++) {
            const startIndex = page * menusPerPage;
            const endIndex = Math.min(startIndex + menusPerPage, categoryMenus.length);
            const pageMenus = categoryMenus.slice(startIndex, endIndex);
            
            // Tambahkan page break jika bukan halaman pertama dari kategori
            if (page > 0 || categoryIndex > 0) {
                html += `<div class="pdf-page-break"></div>`;
            }
            
            html += `
                <div class="pdf-category-section ${page > 0 ? 'pdf-page' : ''}">
                    <div class="pdf-category-title">
                        <i class="fas fa-tag"></i> ${category} <span class="pdf-menu-category">${pageMenus.length} menu (halaman ${page + 1}/${pages})</span>
                    </div>
                    <div class="pdf-menu-grid">
            `;
            
            // Loop melalui setiap menu dalam halaman ini
            pageMenus.forEach(menu => {
                html += `
                    <div class="pdf-menu-item">
                        <div class="pdf-menu-image-container">
                            ${menu.image ? `<img src="${menu.image}" alt="${menu.name}" class="pdf-menu-image" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';">` : 
                            '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f0f0f0;color:#999;font-size:12px;"><i class="fas fa-utensils"></i></div>'}
                        </div>
                        <div class="pdf-menu-info">
                            <div class="pdf-menu-name">${menu.name}</div>
                            <div class="pdf-menu-price">${formatCurrency(menu.price)}</div>
                            ${menu.description ? `<div class="pdf-menu-description">${menu.description}</div>` : ''}
                            <div class="pdf-menu-category" style="background-color: var(--primary);">${menu.category}</div>
                        </div>
                    </div>
                `;
            });
            
            // Tambahkan item kosong jika kurang dari 16 untuk menjaga grid
            const emptyItems = menusPerPage - pageMenus.length;
            for (let i = 0; i < emptyItems; i++) {
                html += `<div class="pdf-menu-item" style="visibility: hidden;"></div>`;
            }
            
            html += `
                    </div>
                </div>
            `;
        }
        
        categoryIndex++;
    });
    
    // Footer dengan QRCode untuk website
    html += `
            <div class="pdf-footer">
                <h4><i class="fas fa-info-circle"></i> Informasi Restoran</h4>
                <p><strong>Aplikasi Kasir UMKM LINK - ${settings.storeName || 'Lentera Karya Situbondo'}</strong></p>
                <p>Dikembangkan untuk mendukung UMKM Indonesia</p>
                <div class="pdf-support-info" style="max-width: 100%; margin: 15px auto;">
                    <i class="fas fa-hands-helping"></i> Supported by Dinas Perikanan Situbondo - Bidang Pemberdayaan Nelayan
                </div>
                <p><strong>&copy; ${new Date().getFullYear()} - Hak Cipta Dilindungi Undang-Undang</strong></p>
                
                <div class="pdf-qr-footer">
                    <div class="pdf-qr-item">
                        <div class="pdf-qr-code" id="qrWebsitePdf"></div>
                        <p class="pdf-qr-label">www.aplikasiusaha.com</p>
                    </div>
                    <div class="pdf-qr-item">
                        <div class="pdf-qr-code" id="qrContactPdf"></div>
                        <p class="pdf-qr-label">Hubungi Kami</p>
                    </div>
                </div>
            </div>
            </div> <!-- tutup pdf-a4-wrapper -->
        </div> <!-- tutup menuPdfContainer -->
        `;
    
    // Set HTML ke modal
    $('#menuPdfContainer').html(html);
    
    // Generate QRCode setelah HTML dimuat
    setTimeout(() => {
        // QRCode untuk pemesanan
        const qrOrderContainer = document.getElementById('qrOrderPdf');
        if (qrOrderContainer) {
            $(qrOrderContainer).empty();
            new QRCode(qrOrderContainer, {
                text: `https://www.aplikasiusaha.com/orderform?resto=${encodeURIComponent(settings.umkmName || 'UMKM LINK')}`,
                width: 100,
                height: 100,
                correctLevel: QRCode.CorrectLevel.H
            });
        }
        
        // QRCode untuk website
        const qrWebsiteContainer = document.getElementById('qrWebsitePdf');
        if (qrWebsiteContainer) {
            $(qrWebsiteContainer).empty();
            new QRCode(qrWebsiteContainer, {
                text: 'https://www.aplikasiusaha.com',
                width: 100,
                height: 100,
                correctLevel: QRCode.CorrectLevel.H
            });
        }
        
        // QRCode untuk kontak
        const qrContactContainer = document.getElementById('qrContactPdf');
        if (qrContactContainer) {
            $(qrContactContainer).empty();
            const contactInfo = `Nama: ${settings.umkmName || 'UMKM LINK'}\nAlamat: ${settings.storeAddress || ''}\nTelepon: ${settings.storePhone || ''}\nEmail: ${settings.storeEmail || ''}`;
            new QRCode(qrContactContainer, {
                text: contactInfo,
                width: 100,
                height: 100,
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, 100);
    
    // Tampilkan modal
    $('#menuPdfModal').css('display', 'flex');
}

// PERBAIKAN UTAMA: Download Menu PDF dengan layout 4x4
function downloadMenuPdf() {
    const element = document.getElementById('menuPdfContainer');
    
    // Pastikan QRCode sudah tergenerate
    setTimeout(() => {
        // Pastikan semua gambar dimuat sebelum konversi
        const images = element.getElementsByTagName('img');
        let loadedImages = 0;
        const totalImages = images.length;
        
        if (totalImages === 0) {
            generatePdfFromElement(element);
            return;
        }
        
        // Tunggu semua gambar dimuat
        Array.from(images).forEach(img => {
            if (img.complete) {
                loadedImages++;
            } else {
                img.onload = () => {
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        generatePdfFromElement(element);
                    }
                };
                img.onerror = () => {
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        generatePdfFromElement(element);
                    }
                };
            }
        });
        
        // Jika semua gambar sudah dimuat
        if (loadedImages === totalImages) {
            generatePdfFromElement(element);
        } else {
            // Timeout untuk kasus gambar gagal dimuat
            setTimeout(() => {
                generatePdfFromElement(element);
            }, 2000);
        }
    }, 1000);
}

// Fungsi bantu untuk generate PDF dari element dengan layout 4x4
function generatePdfFromElement(element) {
    html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 210 * 3.78, // Convert mm to pixels (210mm * 3.78px/mm)
        height: element.scrollHeight,
        windowWidth: 210 * 3.78,
        onclone: function(clonedDoc) {
            // Pastikan QRCode terlihat di clone
            const qrCodes = clonedDoc.querySelectorAll('.pdf-qr-code');
            qrCodes.forEach(qrCode => {
                if (qrCode.children.length > 0) {
                    qrCode.style.display = 'block';
                }
            });
            
            // Pastikan grid 4x4 tetap terjaga
            const menuGrids = clonedDoc.querySelectorAll('.pdf-menu-grid');
            menuGrids.forEach(grid => {
                grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
                grid.style.display = 'grid';
            });
        }
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Hitung rasio untuk menyesuaikan gambar dengan halaman PDF
        const imgWidth = pdfWidth - 15; // Margin 7.5mm kiri-kanan
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        
        // Halaman pertama
        pdf.addImage(imgData, 'PNG', 7.5, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        
        // Halaman tambahan jika konten lebih panjang
        let pageCount = 1;
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 7.5, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
            pageCount++;
        }
        
        // Simpan PDF
        const fileName = `Daftar_Menu_${settings.umkmName || 'UMKM LINK'}_${moment().format('YYYYMMDD_HHmm')}.pdf`;
        pdf.save(fileName);
        hideLoading();
        showToast(`PDF berhasil diunduh: ${fileName} (${pageCount} halaman)`, 'success');
    }).catch(error => {
        console.error('Error generating PDF:', error);
        hideLoading();
        showToast('Gagal membuat PDF', 'error');
    });
}

function promptForPassword(type, callback) {
    const title = type === 'item' ? 'Password Edit/Hapus' : 'Password Kontrol Panel';
    $('#passwordPromptTitle').text(title);
    $('#passwordPromptMessage').text(`Masukkan ${title} untuk melanjutkan.`);
    passwordPromptCallback = callback;
    $('#passwordPromptInput').val('');
    $('#passwordPromptModal').css('display', 'flex').find('input').focus();
}

function submitPasswordPrompt() {
    const password = $('#passwordPromptInput').val();
    const type = $('#passwordPromptTitle').text().includes('Kontrol Panel') ? 'panel' : 
                 $('#passwordPromptTitle').text().includes('Akses Laba') ? 'profit' : 'item';
    
    let correctHash;
    if (type === 'panel') {
        correctHash = settings.panelSecurityCode;
    } else if (type === 'profit') {
        correctHash = settings.profitAccessCode || profitSettings.profitAccessCode;
    } else {
        correctHash = settings.itemSecurityCode;
    }
    
    if (CryptoJS.SHA256(password).toString() === correctHash) {
        $('#passwordPromptModal').hide();
        if (passwordPromptCallback) passwordPromptCallback();
        passwordPromptCallback = null;
    } else {
        showToast('Password/kode keamanan salah.', 'error');
    }
}

function changeSecurityCode(e) {
    e.preventDefault();
    const formId = $(this).attr('id'), newPassword = formId === 'itemSecurityForm' ? $('#itemSecurityCode').val() : $('#panelSecurityCode').val();
    if (newPassword.length < 4) { showToast('Password minimal 4 karakter', 'error'); return; }
    if (formId === 'itemSecurityForm') {
        settings.itemSecurityCode = CryptoJS.SHA256(newPassword).toString();
        showToast('Password keamanan item berhasil diubah.', 'success');
    } else {
        settings.panelSecurityCode = CryptoJS.SHA256(newPassword).toString();
        showToast('Password keamanan kontrol panel berhasil diubah.', 'success');
    }
    saveSettings(); $(this)[0].reset();
}

function changeOwnPassword(e) {
    e.preventDefault();
    const currentPass = $('#currentPassword').val(), newPass = $('#newPassword').val();
    if (CryptoJS.SHA256(currentPass).toString() !== currentUser.password) { showToast('Password saat ini salah.', 'error'); return; }
    if (newPass.length < 6) { showToast('Password baru minimal 6 karakter', 'error'); return; }
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].password = CryptoJS.SHA256(newPass).toString();
        currentUser.password = users[userIndex].password;
        saveUsers(); localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
        showToast('Password login Anda berhasil diubah.', 'success');
        $(this)[0].reset();
    }
}

function loadUsersForManagement() {
    const $list = $('#usersList').empty();
    if (users.length === 0) { $list.html('<div class="empty-state"><i class="fas fa-users"></i><p>Tidak ada pengguna</p></div>'); }
    else {
        users.forEach(user => {
            $list.append(`<div class="order-item"><div class="order-item-info"><div class="order-item-name">${user.name} <span class="member-badge">${user.role}</span></div><div class="order-item-price">${user.username}</div></div><div class="order-item-qty gap-2"><i class="fas fa-edit edit-user" data-id="${user.id}" style="cursor:pointer; color: var(--info);"></i><i class="fas fa-trash delete-user" data-id="${user.id}" style="cursor:pointer; color: var(--danger);"></i></div></div>`);
        });
    }
}

function loadPermissionsUserSelect() {
    const $select = $('#permissionUserSelect').empty();
    $select.append('<option value="">-- Pilih Pengguna --</option>');
    users.forEach(user => {
        $select.append(`<option value="${user.id}">${user.name} (${user.username} - ${user.role})</option>`);
    });
}

function loadUserPermissions(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Inisialisasi permissions jika belum ada
    if (!user.permissions) {
        user.permissions = DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.cashier;
    }
    
    // Set semua checkbox berdasarkan permissions user
    $('.permission-checkbox').each(function() {
        const permission = $(this).data('permission');
        $(this).prop('checked', user.permissions[permission] === true);
    });
}

function saveUserPermissions() {
    const userId = $('#permissionUserSelect').val();
    if (!userId) return;
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;
    
    // Kumpulkan semua permission dari checkbox
    const permissions = {};
    $('.permission-checkbox').each(function() {
        const permission = $(this).data('permission');
        permissions[permission] = $(this).prop('checked');
    });
    
    // Update user permissions
    users[userIndex].permissions = permissions;
    saveUsers();
    
    // Update currentUser jika yang diubah adalah user yang sedang login
    if (currentUser.id === userId) {
        currentUser.permissions = permissions;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
        initializeApp(); // Refresh tampilan untuk update permission
    }
    
    showToast('Hak akses berhasil disimpan', 'success');
}

function resetUserPermissions() {
    const userId = $('#permissionUserSelect').val();
    if (!userId) return;
    
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Reset ke default permissions berdasarkan role
    user.permissions = DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.cashier;
    saveUsers();
    
    // Update currentUser jika yang diubah adalah user yang sedang login
    if (currentUser.id === userId) {
        currentUser.permissions = user.permissions;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
        initializeApp(); // Refresh tampilan untuk update permission
    }
    
    loadUserPermissions(userId);
    showToast('Hak akses berhasil direset ke default', 'success');
}

function resetUserForm() { $('#userForm')[0].reset(); $('#userIdInput').val(''); $('#userFormTitle').text('Tambah Pengguna'); $('#userUsername').prop('disabled', false); }

function populateUserForm(user) { $('#userFormTitle').text('Edit Pengguna'); $('#userIdInput').val(user.id); $('#userName').val(user.name); $('#userUsername').val(user.username).prop('disabled', true); $('#userRole').val(user.role); }

function saveUser(e) {
    e.preventDefault();
    const id = $('#userIdInput').val(), name = $('#userName').val().trim(), username = $('#userUsername').val().trim(), password = $('#userPassword').val(), role = $('#userRole').val();
    if (!name || !username) { showToast('Nama dan username harus diisi.', 'error'); return; }
    if (id) {
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex !== -1) { 
            users[userIndex].name = name; 
            users[userIndex].role = role; 
            if (password) users[userIndex].password = CryptoJS.SHA256(password).toString(); 
            
            // Reset permissions jika role berubah
            if (role !== users[userIndex].role) {
                users[userIndex].permissions = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.cashier;
            }
        }
    } else {
        if (!password) { showToast('Password harus diisi untuk pengguna baru.', 'error'); return; }
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) { showToast('Username sudah digunakan.', 'error'); return; }
        
        // Set default permissions berdasarkan role
        const permissions = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.cashier;
        
        users.push({ 
            id: 'U' + moment().format('x'), 
            name, 
            username, 
            password: CryptoJS.SHA256(password).toString(), 
            role,
            permissions
        });
    }
    saveUsers(); 
    loadUsersForManagement(); 
    loadPermissionsUserSelect();
    $('#userFormContainer').slideUp(resetUserForm);
    showToast(`Pengguna berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`, 'success');
}

function backupData() {
    showLoading('Membackup data...');
    setTimeout(() => {
        try {
            const backup = { menus, categories, orders, settings, users, members, shiftData, profitSettings, kitchenHistory, backupDate: new Date().toISOString() };
            const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(backup), ENCRYPTION_KEY).toString();
            const linkElement = document.createElement('a');
            linkElement.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(encryptedData);
            linkElement.download = `backup_umkm_link_${moment().format('YYYYMMDD_HHmmss')}.lksbackup`;
            linkElement.click();
            hideLoading();
            showToast('Backup data terenkripsi berhasil', 'success');
        } catch (err) { 
            hideLoading();
            showToast('Gagal membuat backup terenkripsi', 'error'); 
            console.error("Backup encryption error:", err); 
        }
    }, 800);
}

function restoreFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const decryptedString = CryptoJS.AES.decrypt(e.target.result, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
            if (!decryptedString) throw new Error("Decryption failed.");
            const data = JSON.parse(decryptedString);
            if (data.menus && data.categories && data.orders && data.settings && data.users && data.members) {
                showConfirmation('Restore Data', 'Data saat ini akan diganti oleh file backup. Lanjutkan?', () => restoreData(data));
            } else { 
                showToast('File backup tidak valid atau rusak.', 'error'); 
            }
        } catch (err) { 
            showToast('Gagal memproses file backup. File mungkin rusak atau bukan file backup yang valid.', 'error'); 
            console.error("Restore error:", err); 
        } finally {
            hideModalLoading();
        }
    };
    reader.readAsText(file);
}

function restoreData(data) { 
    try { 
        Object.keys(STORAGE_KEYS).forEach(key => {
            const dataKey = key.toLowerCase().slice(0, -1) + 's';
            if (data[dataKey]) {
                localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data[dataKey]));
            }
        }); 
        location.reload(); 
    } catch (e) { 
        showToast('Gagal melakukan restore data', 'error'); 
        console.error("Restore error:", e);
    } 
}

function resetAllData() { 
    Object.values(STORAGE_KEYS).forEach(key => { 
        if (key !== STORAGE_KEYS.USER && key !== STORAGE_KEYS.THEME) localStorage.removeItem(key); 
    }); 
    location.reload(); 
}

function openEditMenuModal(menu) {
    $('#menuModal .modal-title').text(menu ? 'Edit Menu' : 'Tambah Menu Baru');
    $('#menuForm')[0].reset(); $('#menuId').val(menu ? menu.id : '');
    if (menu) { $('#menuName').val(menu.name); $('#menuPrice').val(menu.price); $('#menuImage').val(menu.image || ''); $('#menuDescription').val(menu.description || ''); $('#menuCategory').val(menu.category); }
    loadCategoriesForSelect(); $('#menuModal').css('display', 'flex');
}

function loadMenus(searchTerm = '', category = 'all') {
    const lowerSearchTerm = searchTerm.toLowerCase();
    let filteredMenus = menus.filter(m => (category === 'all' || m.category === category) && (!searchTerm || m.name.toLowerCase().includes(lowerSearchTerm)));
    $('#menuCount').text(`(${filteredMenus.length} menu)`);
    const $menuGrid = $('#menuGrid').empty();
    if (filteredMenus.length === 0) { $menuGrid.html('<div class="empty-state"><i class="fas fa-utensils"></i><p>Tidak ada menu ditemukan</p></div>'); }
    else {
        filteredMenus.forEach(menu => {
            // Tampilkan tombol edit/hapus hanya jika user memiliki permission
            const canEdit = checkPermission('edit_menu');
            const canDelete = checkPermission('delete_menu');
            
            let adminActions = '';
            if (canEdit || canDelete) {
                adminActions = '<div class="menu-actions">';
                if (canEdit) {
                    adminActions += `<div class="action-btn edit-btn edit-menu" data-id="${menu.id}"><i class="fas fa-edit"></i></div>`;
                }
                if (canDelete) {
                    adminActions += `<div class="action-btn delete-btn delete-menu" data-id="${menu.id}"><i class="fas fa-trash"></i></div>`;
                }
                adminActions += '</div>';
            }
            
            $menuGrid.append(`<div class="menu-card" data-id="${menu.id}">${adminActions}<div class="menu-image">${menu.image ? `<img src="${menu.image}" alt="${menu.name}" onerror="this.parentElement.innerHTML = '<i class=\\'fas fa-utensils\\'></i>';">` : `<i class="fas fa-utensils"></i>`}</div><div class="menu-name">${menu.name}</div><div class="menu-price">${formatCurrency(menu.price)}</div><div class="menu-category">${menu.category}</div></div>`);
        });
    }
}

function loadCategories() { 
    const $filterRow = $('.filter-row').html('<div class="filter-chip active" data-category="all">Semua</div>'); 
    categories.forEach(category => $filterRow.append(`<div class="filter-chip" data-category="${category.name}">${category.name}</div>`)); 
}

function loadCategoriesForSelect() {
    const $select = $('#menuCategory').empty();
    if (categories.length === 0) $select.append('<option value="" disabled selected>Tidak ada kategori</option>');
    else categories.forEach(category => $select.append(`<option value="${category.name}">${category.name}</option>`));
}

function loadCategoriesForManagement() {
    const $list = $('#categoriesList').empty();
    if (categories.length === 0) $list.html('<div class="empty-state"><i class="fas fa-tags"></i><p>Tidak ada kategori</p></div>');
    else {
        categories.forEach(category => {
            const menuCount = menus.filter(m => m.category === category.name).length;
            $list.append(`<div class="order-item"><div class="order-item-info"><div class="order-item-name">${category.name}</div><div class="order-item-price">${menuCount} menu</div></div><div class="order-item-qty"><i class="fas fa-trash remove-item remove-category" data-id="${category.id}" style="cursor:pointer; color: var(--danger);"></i></div></div>`);
        });
    }
}

function resetMemberForm() { 
    $('#memberForm')[0].reset(); 
    $('#memberIdInput').val(''); 
    $('#memberFormTitle').text('Tambah Member Baru'); 
    $('#saveMemberBtn').text('Tambah Member'); 
    $('#deleteMemberBtn').hide(); 
}

function generateMemberId() { 
    let id = 'M' + moment().format('YYMMDDHHmmss'); 
    return members.some(m => m.id === id) ? generateMemberId() : id; 
}

function formatPhoneNumberForWhatsApp(phone) { 
    let p = phone.replace(/[^0-9]/g, ''); 
    return `https://wa.me/${p.startsWith('0') ? '62' + p.substring(1) : (p.startsWith('62') ? p : '62' + p)}`; 
}

function loadMembersForManagement(searchTerm = '') {
    const $list = $('#membersList').empty(), lowerSearchTerm = searchTerm.toLowerCase();
    const filteredMembers = members.filter(m => !searchTerm || m.name.toLowerCase().includes(lowerSearchTerm) || m.id.toLowerCase().includes(lowerSearchTerm) || m.phone.includes(searchTerm));
    if (filteredMembers.length === 0) { $list.html('<div class="empty-state"><i class="fas fa-users"></i><p>Member tidak ditemukan</p></div>'); }
    else {
        filteredMembers.forEach(member => {
            $list.append(`<div class="order-item"><div class="order-item-info"><div class="order-item-name">${member.name}</div><div class="order-item-price"><a href="${formatPhoneNumberForWhatsApp(member.phone)}" target="_blank" class="whatsapp-link">${member.phone} <i class="fab fa-whatsapp"></i></a><span class="member-badge">${member.id}</span></div></div><div class="order-item-qty gap-2"><i class="fas fa-id-card kta-member" data-id="${member.id}" style="cursor:pointer; color: var(--success);"></i><i class="fas fa-edit edit-member" data-id="${member.id}" style="cursor:pointer; color: var(--info);"></i></div></div>`);
        });
    }
}

function updateOrder() {
    currentOrder.subtotal = currentOrder.items.reduce((total, item) => total + (item.menu.price * item.quantity), 0);
    const memberDiscount = settings.memberDiscountPercent ?? 2, nonMemberDiscount = settings.nonMemberDiscountPercent ?? 0;
    let discountPercent = currentOrder.memberId && memberDiscount > 0 ? memberDiscount : (!currentOrder.memberId && nonMemberDiscount > 0 ? nonMemberDiscount : 0);
    let discountText = discountPercent > 0 ? (currentOrder.memberId ? `Diskon Member (${discountPercent}%)` : `Diskon Pelanggan (${discountPercent}%)`) : '';
    currentOrder.discount = currentOrder.subtotal * (discountPercent / 100);
    currentOrder.total = currentOrder.subtotal - currentOrder.discount;
    localStorage.setItem(STORAGE_KEYS.CURRENT_ORDER, JSON.stringify(currentOrder));
    const $orderItems = $('#orderItems').empty();
    $('#orderCount').text(`(${currentOrder.items.length} item)`);
    $('#discountRow').toggle(currentOrder.discount > 0).find('span:first-child').text(discountText);
    $('#orderDiscount').text(`-${formatCurrency(currentOrder.discount)}`);
    if (currentOrder.items.length === 0) {
        $orderItems.html('<div class="empty-state"><i class="fas fa-shopping-basket"></i><p>Pesanan kosong</p></div>');
        $('#processOrderBtn').prop('disabled', true);
    } else {
        currentOrder.items.forEach(item => { $orderItems.append(`<div class="order-item"><div class="order-item-info"><div class="order-item-name">${item.menu.name}</div><div class="order-item-price">${formatCurrency(item.menu.price)} x ${item.quantity}</div></div><div class="order-item-qty"><input type="number" value="${item.quantity}" min="1" class="item-qty qty-input" data-id="${item.menu.id}"><i class="fas fa-trash remove-item" data-id="${item.menu.id}" style="cursor:pointer; color: var(--danger); margin-left: 8px;"></i></div></div>`); });
        $('#processOrderBtn').prop('disabled', false);
    }
    $('#orderSubtotal').text(formatCurrency(currentOrder.subtotal));
    $('#orderTotal').text(formatCurrency(currentOrder.total));
}

function updateOrderSummary() {
    let discountText = '';
    if (currentOrder.discount > 0) { 
        let percent = currentOrder.memberId ? (settings.memberDiscountPercent ?? 2) : (settings.nonMemberDiscountPercent ?? 0); 
        discountText = `Diskon (${percent}%):`; 
    }
    $('#orderSummary').html(currentOrder.items.map(item => `<div class="summary-row"><span>${item.menu.name} (${item.quantity}x)</span><span>${formatCurrency(item.menu.price * item.quantity)}</span></div>`).join('') + `<div class="summary-row" style="border-top: 1px dashed #ddd; margin-top: 8px; padding-top: 8px;"><span>Subtotal:</span><span>${formatCurrency(currentOrder.subtotal)}</span></div>` + (currentOrder.discount > 0 ? `<div class="summary-row"><span>${discountText}</span><span>-${formatCurrency(currentOrder.discount)}</span></div>` : '') + `<div class="summary-row total-row"><span>Total:</span><span>${formatCurrency(currentOrder.total)}</span></div>`);
}

function updatePaymentTab() {
    $('#paymentTotal').text(formatCurrency(currentOrder.total));
    $('#paymentAmount').val('').trigger('input');
    $('#qrisTotal').text(formatCurrency(currentOrder.total));
    
    // Generate quick cash buttons untuk tunai
    generateQuickCashButtons(currentOrder.total);
    
    // Tampilkan metode pembayaran yang sesuai
    togglePaymentMethod();
}

function togglePaymentMethod() {
    const method = $('#paymentMethod').val();
    const isCash = method === 'cash';
    const isQris = method === 'qris';
    
    if (isCash) {
        $('#cashPaymentContainer').show();
        $('#qrisContainer').hide();
        $('#paymentAmount').prop('disabled', false).val('').trigger('input');
        generateQuickCashButtons(currentOrder.total);
        $('#completePaymentBtn').prop('disabled', true);
    } else if (isQris) {
        $('#cashPaymentContainer').hide();
        $('#qrisContainer').show();
        $('#paymentAmount').val(currentOrder.total).prop('disabled', true);
        $('#changeContainer').hide();
        $('#completePaymentBtn').prop('disabled', false);
    } else {
        $('#cashPaymentContainer').show();
        $('#qrisContainer').hide();
        $('#quickCashButtons').hide();
        $('#paymentAmount').prop('disabled', false).val('').trigger('input');
        $('#completePaymentBtn').prop('disabled', true);
    }
    
    // Hitung kembalian untuk metode yang memerlukan
    calculateChange();
}

function generateQuickCashButtons(total) {
    const $quickCash = $('#quickCashButtons').empty();
    let buttons = [];
    
    // PERBAIKAN: Logika tombol cerdas yang responsif untuk mobile
    if (total <= 12000) {
        buttons = [15000, 20000, 50000, 100000];
    } else if (total <= 15000) {
        buttons = [15000, 20000, 50000, 100000];
    } else if (total <= 20000) {
        buttons = [20000, 50000, 100000];
    } else if (total <= 25000) {
        buttons = [25000, 30000, 50000, 100000];
    } else {
        // Untuk total di atas 25000, buat tombol dengan nilai yang logis
        const next = Math.ceil(total / 5000) * 5000;
        buttons = [next, next + 5000, next + 10000, next + 20000];
    }
    
    // Hapus duplikat dan urutkan
    buttons = [...new Set(buttons)].sort((a, b) => a - b);
    
    // Batasi hanya 4 tombol
    buttons.slice(0, 4).forEach(amount => {
        $quickCash.append(`<button class="btn btn-sm btn-outline-primary quick-cash-btn" data-amount="${amount}">${formatCurrency(amount)}</button>`);
    });
}

// FIX: Perbaikan fungsi calculateChange untuk mengaktifkan/menonaktifkan tombol pembayaran
function calculateChange() { 
    const method = $('#paymentMethod').val();
    if (method === 'qris') {
        // Untuk QRIS, tidak perlu menghitung kembalian
        $('#changeContainer').hide();
        // Untuk QRIS, tombol selalu aktif
        $('#completePaymentBtn').prop('disabled', false);
        return;
    }
    
    // Untuk metode tunai, transfer, dan e-wallet
    const amount = parseFloat($('#paymentAmount').val()) || 0; 
    const change = amount - currentOrder.total; 
    
    // Tampilkan/sembunyikan container kembalian
    if (change >= 0) {
        $('#changeContainer').show();
        $('#paymentChange').text(formatCurrency(change));
    } else {
        $('#changeContainer').hide();
    }
    
    // Aktifkan/nonaktifkan tombol pembayaran
    if (amount >= currentOrder.total) {
        $('#completePaymentBtn').prop('disabled', false);
    } else {
        $('#completePaymentBtn').prop('disabled', true);
    }
}

function switchPaymentModalTab(tabName) { 
    $('#processOrderModal .tabs .tab, #processOrderModal .tab-content').removeClass('active'); 
    $(`[data-tab="${tabName}"], #${tabName}Tab`).addClass('active'); 
}

function switchReportsModalTab(tabName) { 
    $('#reportsModal .tabs .tab, #reportsModal .tab-content').removeClass('active'); 
    $(`#reportsModal [data-tab="${tabName}"], #${tabName}Tab`).addClass('active'); 
}

function switchControlPanelTab(tabName) { 
    $('#controlPanelModal .tabs .tab, #controlPanelModal .tab-content').removeClass('active'); 
    $(`#controlPanelModal [data-tab="${tabName}"], #${tabName}Tab`).addClass('active'); 
}

function resetOrder() {
    currentOrder = { items: [], subtotal: 0, total: 0, discount: 0, type: 'dinein', tableNumber: '1', note: '', memberId: null };
    localStorage.setItem(STORAGE_KEYS.CURRENT_ORDER, JSON.stringify(currentOrder));
    updateOrder(); 
    $('.order-type-btn').removeClass('active'); 
    $('[data-type="dinein"]').addClass('active');
    $('#orderNote, #memberSearchInput').val(''); 
    $('#tableNumberContainer').show();
}

function generateReceiptHTML(order) {
    const member = members.find(m => m.id === order.memberId);
    return `<div id="receiptContent">
        <div class="receipt-header">
            <img src="https://raw.githubusercontent.com/anekamarket/aplikasi-usaha/refs/heads/main/umkm/umkm-link.png" alt="Logo" style="width: 80px; margin-bottom: 5px;">
            <div class="receipt-title">${settings.umkmName} <span class="premium-badge">PREMIUM</span></div>
            <div>${settings.storeAddress}</div>
            <div>Telp: ${settings.storePhone}</div>
        </div>
        <div class="receipt-info">
            <div><span>Tanggal:</span> <span>${moment(order.date).format('DD/MM/YY HH:mm')}</span></div>
            <div><span>No. Trx:</span> <span>${order.id}</span></div>
            <div><span>Kasir:</span> <span>${order.cashier.name}</span></div>
            <div><span>Pelanggan:</span> <span>${order.customerName}</span></div>
            ${member ? `<div><span>Member:</span> <span>${member.name} (${member.id})</span></div>` : ''}
            <div><span>Tipe:</span> <span>${order.type === 'dinein' ? `Makan di Tempat (Meja ${order.tableNumber})` : 'Bungkus'}</span></div>
            <div><span>Metode:</span> <span>${order.paymentMethod === 'qris' ? 'QRIS' : order.paymentMethod === 'cash' ? 'Tunai' : order.paymentMethod === 'transfer' ? 'Transfer Bank' : 'E-Wallet'}</span></div>
        </div>
        <div id="receiptItemsContainer">
            ${order.items.map(item => `<div class="receipt-item"><div class="receipt-item-details"><div class="item-name">${item.menu.name}</div><div class="item-price-calc">${item.quantity} x ${formatCurrency(item.menu.price)}</div></div><span>${formatCurrency(item.menu.price * item.quantity)}</span></div>`).join('')}
        </div>
        ${order.note ? `<div style="font-size:10px; font-style:italic; padding: 5px 0; border-top: 1px dashed #000;">Catatan: ${order.note}</div>` : ''}
        <div class="receipt-total">
            <div class="receipt-item"><span>Subtotal</span> <span>${formatCurrency(order.subtotal)}</span></div>
            ${order.discount > 0 ? `<div class="receipt-item"><span>Diskon</span> <span>-${formatCurrency(order.discount)}</span></div>` : ''}
            <div class="receipt-item" style="font-weight:bold; font-size: 14px;"><span>TOTAL</span> <span>${formatCurrency(order.total)}</span></div>
            <div class="receipt-item"><span>${order.paymentMethod === 'qris' ? 'QRIS' : order.paymentMethod === 'cash' ? 'Tunai' : order.paymentMethod === 'transfer' ? 'Transfer' : 'E-Wallet'}</span> <span>${formatCurrency(order.paymentAmount)}</span></div>
            ${order.paymentMethod === 'cash' ? `<div class="receipt-item"><span>Kembali</span> <span>${formatCurrency(order.change)}</span></div>` : ''}
        </div>
        <div class="receipt-footer">
            <p>Terima kasih telah berkunjung</p>
            <div id="receiptQrcode" style="display: flex; justify-content: center; margin: 10px 0;"></div>
            <p style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px;">
                Aplikasi Kasir UMKM LINK<br>
                <strong>Supported by Dinas Perikanan Situbondo - Bidang Pemberdayaan Nelayan</strong><br>
                Lentera Karya Situbondo &copy; 2025<br>
                www.anekamarket.my.id | WA: 087865614222
            </p>
        </div>
    </div>`;
}

function showReceiptModal(order) {
    showToast('Membuat struk...', 'info');
    $('#receiptModalBody').html(generateReceiptHTML(order));
    const qrCodeData = JSON.stringify({ trxId: order.id, store: settings.umkmName, date: moment(order.date).toISOString(), total: order.total });
    $('#receiptQrcode').empty();
    new QRCode(document.getElementById("receiptQrcode"), { text: qrCodeData, width: 80, height: 80, correctLevel: QRCode.CorrectLevel.M });
    $('#downloadReceiptPdfBtn').data('order', order);
    $('#receiptModal').css('display', 'flex');
}

function downloadReceiptAsPdf() {
    const order = $('#downloadReceiptPdfBtn').data('order');
    if (!order) return;
    const element = document.getElementById('receiptModalBody').querySelector('#receiptContent');
    
    html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`Struk-${order.id}-${moment(order.date).format('DD-MM-YYYY')}.pdf`);
        hideLoading();
        showToast('Struk berhasil diunduh', 'success');
    }).catch(err => { 
        hideLoading();
        showToast('Gagal mengunduh PDF', 'error'); 
        console.error("PDF download error:", err); 
    });
}

function openKtaModal(memberId) {
    const member = members.find(m => m.id === memberId); if (!member) return;
    $('#ktaStoreName').text(settings.umkmName);
    $('#ktaStoreContact').text(`${settings.storeAddress} • ${settings.storePhone}`);
    $('#ktaMemberName').text(member.name); $('#ktaMemberId').text(`ID: ${member.id}`);
    showToast('Membuat kartu...', 'info');
    const qrContainer = document.getElementById("ktaQrcodeImg");
    $(qrContainer).empty();
    const qrCodeData = JSON.stringify({ memberId: member.id, name: member.name, phone: member.phone, store: settings.umkmName, joinDate: member.joinDate });
    new QRCode(qrContainer, { text: qrCodeData, width: 160, height: 160, correctLevel : QRCode.CorrectLevel.H });
    $('#downloadKtaPdfBtn').data('member', member);
    $('#ktaModal').css('display', 'flex');
}

function downloadKtaAsPdf() {
    const member = $('#downloadKtaPdfBtn').data('member'); if (!member) return;
    const element = document.getElementById('ktaCard');
    
    html2canvas(element, { scale: 2, useCORS: true, allowTaint: true }).then(canvas => {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`KTA-${member.name.replace(/\s/g, '_')}-${member.id}.pdf`);
        hideLoading();
        showToast('KTA berhasil diunduh', 'success');
    }).catch(err => { 
        hideLoading();
        showToast('Gagal mengunduh PDF KTA', 'error'); 
        console.error("KTA PDF error:", err); 
    });
}

function printElement(selector) {
    const printContainer = $('#print-container').empty().append($(selector).clone());
    setTimeout(() => { try { window.print(); } catch (e) { showToast('Gagal membuka dialog cetak.', 'error'); console.error("Print error:", e); } }, 300);
}

function printReport() {
    printElement('#reportResults .professional-pdf');
}

// PERBAIKAN: Fungsi download report PDF yang lebih profesional
function downloadReportAsPdf() {
    const element = document.querySelector('#reportResults .professional-pdf');
    if (!element) {
        showToast('Tidak ada laporan untuk diunduh', 'warning');
        hideLoading();
        return;
    }
    
    html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Laporan_Penjualan_Profesional_${settings.umkmName || 'UMKM LINK'}_${moment().format('YYYY-MM-DD')}.pdf`);
        hideLoading();
        showToast('Laporan PDF berhasil diunduh', 'success');
    }).catch(err => { 
        hideLoading();
        showToast('Gagal mengunduh PDF', 'error'); 
        console.error("PDF report download error:", err); 
    });
}

function updateStoreInfo() { 
    $('#storeNameHeader').text(settings.umkmName || 'UMKM LINK'); 
    document.title = settings.umkmName + ' - UMKM LINK' || 'UMKM LINK - Aplikasi Kasir Digital'; 
}

function loadStoreInfo() { 
    $('#storeName').val(settings.storeName || ''); 
    $('#umkmName').val(settings.umkmName || '');
    $('#storeAddress').val(settings.storeAddress || ''); 
    $('#storePhone').val(settings.storePhone || ''); 
    $('#storeEmail').val(settings.storeEmail || ''); 
    $('#tableCount').val(settings.tableCount || 5); 
}

function saveStoreInfo(e) {
    e.preventDefault();
    settings.umkmName = $('#umkmName').val().trim();
    settings.storeAddress = $('#storeAddress').val().trim();
    settings.storePhone = $('#storePhone').val().trim();
    settings.storeEmail = $('#storeEmail').val().trim();
    settings.tableCount = parseInt($('#tableCount').val()) || 5;
    saveSettings(); updateStoreInfo(); updateTableNumbers();
    $('#manageStoreInfoModal').hide();
    showToast('Info restoran berhasil disimpan', 'success');
}

function updateTableNumbers() {
    const $select = $('#tableNumber').empty(), count = settings.tableCount || 5;
    for (let i = 1; i <= count; i++) $select.append(`<option value="${i}">Meja ${i}</option>`);
}

function formatCurrency(amount) { 
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount); 
}

function showToast(message, type = 'info') {
    const $toast = $('#toast').removeClass('success error warning').addClass(type);
    $('#toast-message').text(message);
    $toast.addClass('show');
    setTimeout(() => $toast.removeClass('show'), 3000);
}

function setButtonLoading($button, isLoading, originalText = 'Loading...') {
    if (isLoading) $button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Loading...');
    else $button.prop('disabled', false).html(originalText);
}

// PERBAIKAN: Fungsi showConfirmation yang benar-benar menutup modal setelah aksi
function showConfirmation(title, message, callback, btnClass = 'btn-success') {
    $('#confirmTitle').text(title);
    $('#confirmMessage').html(message);
    const $confirmBtn = $('#confirmAction');
    // PERBAIKAN: Hapus semua event listener sebelumnya untuk menghindari duplikasi
    $confirmBtn.off('click');
    // PERBAIKAN: Pastikan modal ditutup setelah callback dijalankan
    $confirmBtn.on('click', function() {
        try {
            callback();
        } catch (error) {
            console.error('Error in confirmation callback:', error);
        } finally {
            $('#confirmationModal').hide();
        }
    });
    $confirmBtn.removeClass('btn-success btn-danger btn-info').addClass(btnClass);
    $('#confirmationModal').css('display', 'flex');
}

function updateCurrentDate() { 
    $('#currentDate').text(moment().format('dddd, DD MMMM YYYY')); 
}

function saveMenus() { 
    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(menus)); 
}

function saveCategories() { 
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); 
}

function saveOrders() { 
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders)); 
}

function saveSettings() { 
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); 
}

function saveUsers() { 
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); 
}

function saveMembers() { 
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members)); 
}

function saveShiftData() {
    localStorage.setItem(STORAGE_KEYS.SHIFT_DATA, JSON.stringify(shiftData));
}

function saveProfitSettings() {
    localStorage.setItem(STORAGE_KEYS.PROFIT_SETTINGS, JSON.stringify(profitSettings));
}

function saveKitchenHistory() {
    localStorage.setItem(STORAGE_KEYS.KITCHEN_HISTORY, JSON.stringify(kitchenHistory));
}
