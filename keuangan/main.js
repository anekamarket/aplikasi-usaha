// ============================================
// KOPERASI DIGITAL - SISTEM KEUANGAN PREMIUM
// Versi Final - Semua Fitur Berfungsi
// ============================================

moment.locale('id');
const { jsPDF } = window.jspdf;

// ================= KONSTANTA =================
const STORAGE_KEYS = {
    USERS: 'coop_users',
    MEMBERS: 'coop_members',
    SETTINGS: 'coop_settings',
    SAVINGS: 'coop_savings_transactions',
    LOANS: 'coop_loans',
    PAWNS: 'coop_pawns',
    TRANSACTIONS: 'coop_transactions_history'
};

const ENCRYPTION_KEY = 'LenteraKaryaSitubondo-Koperasi-2025';

const DEFAULT_ADMIN = {
    id: 'U001',
    username: 'Admin',
    password: CryptoJS.SHA256('Gratis12345').toString(),
    name: 'Administrator',
    role: 'admin'
};

const DEFAULT_TELLER = {
    id: 'U002',
    username: 'teller',
    password: CryptoJS.SHA256('teller123').toString(),
    name: 'Teller',
    role: 'teller'
};

// ============= STATE GLOBAL =============
let users = [];
let members = [];
let settings = {};
let savings = [];
let loans = [];
let pawns = [];
let transactions = [];
let currentUser = null;
let passwordPromptCallback = null;
let captchaText = '';

// ============= INISIALISASI DATA =============
function initializeData() {
    // Users
    let storedUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    if (!storedUsers.find(u => u.username === 'Admin')) storedUsers.push(DEFAULT_ADMIN);
    if (!storedUsers.find(u => u.username === 'teller')) storedUsers.push(DEFAULT_TELLER);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(storedUsers));

    // Data lainnya jika kosong
    if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.SAVINGS)) localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.LOANS)) localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.PAWNS)) localStorage.setItem(STORAGE_KEYS.PAWNS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));

    // Settings default
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        const initialSettings = {
            koperasiName: 'KOPERASI DIGITAL',
            koperasiAddress: 'Jl. Digital No. 1, Kota Maya',
            koperasiPhone: '081234567890',
            koperasiEmail: 'info@koperasi.com',
            panelSecurityCode: CryptoJS.SHA256('LKS.1945').toString(),
            roles: {
                admin: { label: 'Admin', isEditable: false, permissions: getPermissionKeys(true) },
                manager: {
                    label: 'Manajer',
                    isEditable: true,
                    permissions: {
                        ...getPermissionKeys(false),
                        canManageLoans: true,
                        canManagePawns: true,
                        canViewReports: true,
                        canAccessControlPanel: true
                    }
                },
                teller: {
                    label: 'Teller',
                    isEditable: true,
                    permissions: {
                        ...getPermissionKeys(false),
                        canManageSavings: true,
                        canManageMembers: true,
                        canReceiveInstallments: true
                    }
                }
            }
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
    }
}

// ============= LOAD DATA DARI STORAGE =============
function loadAllData() {
    users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    members = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS)) || [];
    settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
    savings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVINGS)) || [];
    loans = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOANS)) || [];
    pawns = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAWNS)) || [];
    transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
}

// ============= SAVE DATA KE STORAGE =============
function saveData(key) {
    const dataMap = { users, members, settings, savings, loans, pawns, transactions };
    localStorage.setItem(STORAGE_KEYS[key.toUpperCase()], JSON.stringify(dataMap[key]));
}

// ============= UTILITAS =============
const formatCurrency = (amount) => 'Rp ' + (amount || 0).toLocaleString('id-ID');

const showToast = (message, type = 'info', duration = 3000) => {
    const $toast = $('#toast');
    $toast.removeClass('success error warning info').addClass(type);
    $('#toast-message').text(message);
    $toast.addClass('show');
    setTimeout(() => $toast.removeClass('show'), duration);
};

const showConfirmation = (title, message, type = 'success', onConfirm) => {
    $('#confirmTitle').text(title);
    $('#confirmMessage').text(message);
    $('#confirmAction')
        .off('click')
        .on('click', () => {
            onConfirm();
            $('#confirmationModal').hide();
        })
        .removeClass('btn-success btn-danger btn-warning')
        .addClass(`btn-${type}`);
    $('#confirmationModal').css('display', 'flex');
};

const switchModalTab = ($modal, tabId) => {
    $modal.find('.tabs .tab').removeClass('active');
    $modal.find(`.tabs .tab[data-tab="${tabId}"]`).addClass('active');
    $modal.find('.tab-content').removeClass('active').hide();
    $modal.find(`#${tabId}Tab, #${tabId}`).addClass('active').show();
};

const logTransaction = (memberId, description, amount, refId = '') => {
    transactions.unshift({
        id: 'TRX' + moment().format('x'),
        date: new Date().toISOString(),
        memberId,
        description,
        amount,
        refId
    });
    saveData('transactions');
};

const updateCurrentDate = () => {
    $('#currentDate').text(moment().format('dddd, D MMMM YYYY'));
};

// ============= PERMISSIONS =============
function getPermissionStructure() {
    return {
        'Manajemen Keuangan': {
            canManageSavings: 'Kelola Simpanan (Setor/Tarik)',
            canManageLoans: 'Kelola Pinjaman (Buat/Lihat)',
            canReceiveInstallments: 'Menerima Angsuran',
            canManagePawns: 'Kelola Agunan (Gadai)'
        },
        'Manajemen Data': {
            canManageMembers: 'Kelola Anggota',
            canManageKoperasiInfo: 'Kelola Info Koperasi',
            canViewReports: 'Lihat Laporan Keuangan'
        },
        'Administrasi Sistem': {
            canAccessControlPanel: 'Akses Kontrol Panel (Pengguna, Keamanan)',
            canBackupRestore: 'Backup & Restore Data',
            canResetData: 'Reset Semua Data'
        }
    };
}

function getPermissionKeys(isFullAccess = false) {
    const permissions = {};
    Object.values(getPermissionStructure()).forEach(group =>
        Object.keys(group).forEach(key => (permissions[key] = isFullAccess))
    );
    return permissions;
}

function checkPermission(permissionName) {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return settings.roles[currentUser.role]?.permissions?.[permissionName] || false;
}

// ============= LOGIN & LOGOUT =============
function generateCaptcha() {
    const canvas = document.getElementById('captchaCanvas');
    const ctx = canvas.getContext('2d');
    captchaText = Math.random().toString(36).substring(2, 8).toUpperCase();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f0f2f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(0,0,0,${Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
    }

    ctx.font = 'bold 24px Poppins';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(captchaText, canvas.width / 2, canvas.height / 2);
}

function handleLogin(e) {
    e.preventDefault();

    if ($('#captchaInput').val().trim().toLowerCase() !== captchaText.toLowerCase()) {
        showToast('Kode verifikasi (CAPTCHA) salah.', 'error');
        generateCaptcha();
        $('#captchaInput').val('');
        return;
    }

    const username = $('#username').val().trim();
    const password = $('#password').val().trim();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (user && CryptoJS.SHA256(password).toString() === user.password) {
        currentUser = user;
        sessionStorage.setItem('coop_current_user', JSON.stringify(currentUser));
        $('#loggedInUser').text(currentUser.name);
        $('#loginModal').hide();
        $('#mainApp').fadeIn();
        initializeApp();
        showToast(`Selamat datang, ${currentUser.name}!`, 'success');
    } else {
        showToast('Username atau password salah', 'error');
        generateCaptcha();
        $('#captchaInput').val('');
    }
}

function handleLogout(e) {
    e.preventDefault();
    showConfirmation('Logout', 'Anda yakin ingin keluar dari aplikasi?', 'warning', () => {
        currentUser = null;
        sessionStorage.removeItem('coop_current_user');
        $('#mainApp').fadeOut(() => {
            $('#loginModal').css('display', 'flex');
            $('#username, #password, #captchaInput').val('');
            $('#username').val('Admin');
            $('#password').val('Gratis12345');
            generateCaptcha();
        });
        showToast('Anda telah logout', 'info');
    });
}

// ============= INIT APP =============
function initializeApp() {
    updateKoperasiInfo();
    configureUIAccess();
    updateLoanStatuses();
    loadDashboard();
    updateCurrentDate();
}

function configureUIAccess() {
    const hasAdminFeatures = Object.values(settings.roles[currentUser.role]?.permissions || {}).some(p => p === true);
    $('#adminPanel').toggle(hasAdminFeatures || currentUser.role === 'admin');

    // Main actions
    $('#savingsMenuBtn').toggle(checkPermission('canManageSavings'));
    $('#loansMenuBtn').toggle(checkPermission('canManageLoans'));
    $('#pawnMenuBtn').toggle(checkPermission('canManagePawns'));
    $('#manageMembersBtn').toggle(checkPermission('canManageMembers'));

    // Admin panel
    $('#recapReportBtn').toggle(checkPermission('canViewReports'));
    $('#manageKoperasiInfoBtn').toggle(checkPermission('canManageKoperasiInfo'));
    $('#controlPanelBtn').toggle(checkPermission('canAccessControlPanel'));

    const canManageData = checkPermission('canBackupRestore') || checkPermission('canResetData');
    $('#adminPanel .backup-actions').parent().toggle(canManageData);
    $('#backupDataBtn').toggle(checkPermission('canBackupRestore'));
    $('.file-label').toggle(checkPermission('canBackupRestore'));
    $('#resetDataBtn').toggle(checkPermission('canResetData'));
}

function loadDashboard() {
    const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);
    const totalActiveLoans = loans
        .filter(l => l.status === 'active' || l.status === 'overdue')
        .reduce((sum, l) => sum + l.outstandingPrincipal, 0);
    const totalAssets = totalSavings;
    const totalMembers = members.length;

    $('#dashboardGrid').html(`
        <div class="summary-card savings">
            <div class="summary-card-icon"><i class="fas fa-wallet"></i></div>
            <div class="summary-card-info"><div class="title">Total Simpanan</div><div class="value">${formatCurrency(totalSavings)}</div></div>
        </div>
        <div class="summary-card loans">
            <div class="summary-card-icon"><i class="fas fa-hand-holding-usd"></i></div>
            <div class="summary-card-info"><div class="title">Pinjaman Aktif</div><div class="value">${formatCurrency(totalActiveLoans)}</div></div>
        </div>
        <div class="summary-card assets">
            <div class="summary-card-icon"><i class="fas fa-chart-line"></i></div>
            <div class="summary-card-info"><div class="title">Total Aset</div><div class="value">${formatCurrency(totalAssets)}</div></div>
        </div>
        <div class="summary-card members">
            <div class="summary-card-icon"><i class="fas fa-users"></i></div>
            <div class="summary-card-info"><div class="title">Jumlah Anggota</div><div class="value">${totalMembers}</div></div>
        </div>
    `);
}

// ============= MANAJEMEN ANGGOTA =============
function handleMemberSearch(inputElement, resultsElement, callback) {
    const searchTerm = $(inputElement).val().trim().toLowerCase();
    const $results = $(resultsElement);
    if (searchTerm.length === 0) return $results.hide();

    const filtered = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm) || m.id.toLowerCase().includes(searchTerm)
    );
    $results.empty().show();

    if (filtered.length > 0) {
        filtered.forEach(m =>
            $results.append(`<div class="member-search-item" data-id="${m.id}">${m.name} (${m.id})</div>`)
        );
        $results.off('click').on('click', '.member-search-item', function () {
            const memberId = $(this).data('id');
            const memberName = $(this).text();
            $(inputElement).val(memberName).data('selected-id', memberId);
            $results.hide();
            if (callback) callback(memberId);
        });
    } else {
        $results.append('<div class="member-search-item disabled">Anggota tidak ditemukan</div>');
    }
}

function openManageMembersModal() {
    loadMembersList();
    $('#memberFormContainer').hide();
    $('#manageMembersModal').css('display', 'flex');
}

function loadMembersList(searchTerm = '') {
    const $list = $('#membersList').empty();
    const term = searchTerm.toLowerCase();
    const filtered = members.filter(m =>
        m.name.toLowerCase().includes(term) || m.id.toLowerCase().includes(term) || (m.phone && m.phone.includes(term))
    );

    if (filtered.length === 0) {
        $list.html('<div class="empty-state"><p>Anggota tidak ditemukan.</p></div>');
        return;
    }

    const table = $('<table class="data-table"><thead><tr><th>ID</th><th>Nama</th><th>Telepon</th><th>Aksi</th></tr></thead><tbody></tbody></table>');
    const tbody = table.find('tbody');
    filtered.forEach(m => {
        tbody.append(`
            <tr>
                <td>${m.id}</td>
                <td>${m.name}</td>
                <td>${m.phone || '-'}</td>
                <td class="d-flex gap-2">
                    <button class="btn btn-sm btn-info edit-member" data-id="${m.id}"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn btn-sm profile-member" style="background-color: #6c757d;" data-id="${m.id}"><i class="fas fa-address-book"></i></button>
                    <button class="btn btn-sm kta-member" style="background-color: var(--loan-color);" data-id="${m.id}"><i class="fas fa-id-card"></i></button>
                </td>
            </tr>
        `);
    });
    $list.append(table);
}

function resetMemberForm() {
    $('#memberForm')[0].reset();
    $('#memberIdInput').val('');
    $('#memberFormTitle').text('Tambah Anggota Baru');
}

function editMember(id) {
    const member = members.find(m => m.id === id);
    if (!member) return;
    resetMemberForm();
    $('#memberFormTitle').text('Edit Anggota');
    $('#memberIdInput').val(member.id);
    $('#memberName').val(member.name);
    $('#memberPhone').val(member.phone);
    $('#memberAddress').val(member.address);
    $('#memberFormContainer').slideDown();
}

function saveMember(e) {
    e.preventDefault();
    const id = $('#memberIdInput').val() || 'M' + moment().format('YYMMDDHHmmss');
    const newData = {
        id,
        name: $('#memberName').val(),
        phone: $('#memberPhone').val(),
        address: $('#memberAddress').val()
    };

    const idx = members.findIndex(m => m.id === id);
    if (idx > -1) {
        members[idx] = { ...members[idx], ...newData };
        showToast('Data anggota berhasil diperbarui', 'success');
    } else {
        newData.joinDate = new Date().toISOString();
        members.push(newData);
        showToast('Anggota baru berhasil ditambahkan', 'success');
    }

    saveData('members');
    loadMembersList();
    loadDashboard();
    resetMemberForm();
    $('#memberFormContainer').slideUp();
}

// ============= SIMPANAN =============
function openSavingsModal() {
    $('#savingsMemberSearch').val('').removeData('selected-id');
    $('#savingsMemberDetails').hide();
    $('#savingsModal').css('display', 'flex');
}

function selectMemberForSavings(memberId) {
    loadMemberSavingsSummary(memberId);
    $('#savingsMemberDetails').data('member-id', memberId).slideDown();
}

function loadMemberSavingsSummary(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    $('#savingsMemberName').text(`Ringkasan untuk: ${member.name} (${member.id})`);

    const memberSavings = savings.filter(s => s.memberId === memberId);
    const pokok = memberSavings.filter(s => s.category === 'pokok').reduce((sum, s) => sum + s.amount, 0);
    const wajib = memberSavings.filter(s => s.category === 'wajib').reduce((sum, s) => sum + s.amount, 0);
    const sukarela = memberSavings.filter(s => s.category === 'sukarela').reduce((sum, s) => sum + s.amount, 0);

    $('#summaryPokok').text(formatCurrency(pokok));
    $('#summaryWajib').text(formatCurrency(wajib));
    $('#summarySukarela').text(formatCurrency(sukarela));
    $('#summaryTotalSimpanan').text(formatCurrency(pokok + wajib + sukarela));
}

function processSavingsTransaction(e) {
    e.preventDefault();
    const memberId = $('#savingsMemberDetails').data('member-id');
    const type = $('#savingsType').val();
    const category = $('#savingsCategory').val();
    let amount = parseFloat($('#savingsAmount').val());

    if (!memberId || !amount || amount <= 0) return showToast('Data tidak valid', 'error');

    const currentBalance = savings
        .filter(s => s.memberId === memberId && s.category === category)
        .reduce((sum, s) => sum + s.amount, 0);

    if (type === 'withdrawal' && amount > currentBalance) {
        return showToast(`Saldo ${category} tidak mencukupi untuk penarikan.`, 'error');
    }

    if (type === 'withdrawal') amount = -amount;

    const newTransaction = {
        id: 'SAV' + moment().format('x'),
        memberId,
        type,
        category,
        amount,
        date: new Date().toISOString(),
        processedBy: currentUser.name
    };
    savings.unshift(newTransaction);
    logTransaction(memberId, type === 'deposit' ? 'Setor Simpanan' : 'Tarik Simpanan', amount, newTransaction.id);
    saveData('savings');
    showToast('Transaksi simpanan berhasil diproses.', 'success');
    loadMemberSavingsSummary(memberId);
    loadDashboard();
    $('#savingsTransactionForm')[0].reset();
}

// ============= PINJAMAN =============
function updateLoanStatuses() {
    let changed = false;
    const today = moment();
    loans.forEach(loan => {
        if (loan.status !== 'active') return;
        const expectedPaymentsCount = loan.payments.length + 1;
        if (expectedPaymentsCount > loan.tenor) return;
        const nextDueDate = moment(loan.applicationDate).add(expectedPaymentsCount, 'months');
        if (today.isAfter(nextDueDate)) {
            loan.status = 'overdue';
            changed = true;
        }
    });
    if (changed) saveData('loans');
}

function openLoansModal() {
    updateLoanStatuses();
    loadLoansList();
    $('#loansModal').css('display', 'flex');
}

function loadLoansList() {
    const $list = $('#loansListContainer').empty();
    if (loans.length === 0) {
        $list.html('<div class="empty-state"><p>Belum ada data pinjaman.</p></div>');
        return;
    }

    const sorted = [...loans].sort((a, b) => {
        const order = { overdue: 1, active: 2, paid_off: 3 };
        return (order[a.status] || 99) - (order[b.status] || 99);
    });

    const table = $('<table class="data-table"><thead><tr><th>ID Pinjaman</th><th>Anggota</th><th>Jumlah</th><th>Sisa Pokok</th><th>Status</th><th>Aksi</th></tr></thead><tbody></tbody></table>');
    const tbody = table.find('tbody');
    sorted.forEach(loan => {
        const member = members.find(m => m.id === loan.memberId);
        const statusClass = loan.status === 'paid_off' ? 'text-success' : (loan.status === 'overdue' ? 'text-danger' : '');
        tbody.append(`
            <tr class="view-loan-details" data-id="${loan.id}" style="cursor:pointer;">
                <td>${loan.id}</td>
                <td>${member ? member.name : 'N/A'}</td>
                <td>${formatCurrency(loan.amount)}</td>
                <td>${formatCurrency(loan.outstandingPrincipal)}</td>
                <td><strong class="${statusClass}">${loan.status.replace('_', ' ').toUpperCase()}</strong></td>
                <td><button class="btn btn-sm btn-info view-loan-details" data-id="${loan.id}">Detail</button></td>
            </tr>
        `);
    });
    $list.append(table);
}

function resetLoanForm() {
    $('#addLoanForm')[0].reset();
    $('#loanMemberSearch').val('').removeData('selected-id');
    $('#loanCalculationPreview').hide();
}

function calculateLoanPreview() {
    const amount = parseFloat($('#loanAmount').val()) || 0;
    const tenor = parseInt($('#loanTenor').val()) || 0;
    const interestRate = parseFloat($('#loanInterest').val()) || 0;
    if (amount <= 0 || tenor <= 0 || interestRate < 0) return $('#loanCalculationPreview').hide();

    const monthlyInterest = amount * (interestRate / 100);
    const monthlyPrincipal = amount / tenor;
    const monthlyInstallment = monthlyPrincipal + monthlyInterest;
    const totalPayment = monthlyInstallment * tenor;
    const totalInterest = totalPayment - amount;

    $('#loanCalculationPreview').html(`
        <div class="summary-row"><span>Angsuran / Bulan:</span> <strong>${formatCurrency(monthlyInstallment)}</strong></div>
        <div class="summary-row"><span>Total Bunga:</span> <span>${formatCurrency(totalInterest)}</span></div>
        <div class="summary-row total-row"><span>Total Pengembalian:</span> <span>${formatCurrency(totalPayment)}</span></div>
    `).show();
}

function saveLoan() {
    const memberId = $('#loanMemberSearch').data('selected-id');
    const amount = parseFloat($('#loanAmount').val());
    const tenor = parseInt($('#loanTenor').val());
    const interestRate = parseFloat($('#loanInterest').val());
    const collateral = $('#loanCollateral').val();

    if (!memberId || !(amount > 0) || !(tenor > 0) || isNaN(interestRate)) {
        return showToast('Harap lengkapi semua data pinjaman dengan benar.', 'error');
    }

    const monthlyInterest = amount * (interestRate / 100);
    const monthlyPrincipal = amount / tenor;
    const monthlyInstallment = monthlyPrincipal + monthlyInterest;

    const newLoan = {
        id: 'LOAN' + moment().format('x'),
        memberId,
        amount,
        tenor,
        interestRate,
        collateral,
        monthlyInstallment,
        outstandingPrincipal: amount,
        payments: [],
        status: 'active',
        applicationDate: new Date().toISOString()
    };
    loans.unshift(newLoan);
    logTransaction(memberId, 'Pencairan Pinjaman', -amount, newLoan.id);
    saveData('loans');
    showToast('Pinjaman baru berhasil dibuat.', 'success');
    loadLoansList();
    loadDashboard();
    $('#addLoanModal').hide();
}

function openLoanDetailsModal(loanId) {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    const member = members.find(m => m.id === loan.memberId);

    let paymentsHtml = '<tr><td colspan="4" class="text-center">Belum ada pembayaran.</td></tr>';
    if (loan.payments.length > 0) {
        paymentsHtml = loan.payments.map((p, i) => `
            <tr><td>Angsuran ke-${i + 1}</td><td>${moment(p.date).format('DD MMM YYYY')}</td><td>${formatCurrency(p.amount)}</td><td>${p.paidBy || '-'}</td></tr>
        `).join('');
    }

    const isPaidOff = loan.status === 'paid_off';
    $('#payInstallmentBtn').data('id', loanId).toggle(!isPaidOff).prop('disabled', !checkPermission('canReceiveInstallments'));

    $('#loanDetailsBody').html(`
        <h4>Pinjaman: ${loan.id}</h4>
        <p><strong>Anggota:</strong> ${member.name} (${member.id})</p>
        <div class="member-financial-summary">
            <div class="summary-row"><span>Jumlah Pinjaman:</span><span>${formatCurrency(loan.amount)}</span></div>
            <div class="summary-row"><span>Angsuran per Bulan:</span><span>${formatCurrency(loan.monthlyInstallment)}</span></div>
            <div class="summary-row"><span>Sisa Pokok:</span><strong>${formatCurrency(loan.outstandingPrincipal)}</strong></div>
            <div class="summary-row"><span>Angsuran Terbayar:</span><span>${loan.payments.length} / ${loan.tenor}</span></div>
        </div>
        <h5 class="mt-3">Riwayat Pembayaran</h5>
        <div class="data-table-container" style="max-height: 25vh;">
            <table class="data-table amortization-table">
                <thead><tr><th>Deskripsi</th><th>Tanggal Bayar</th><th>Jumlah</th><th>Petugas</th></tr></thead>
                <tbody>${paymentsHtml}</tbody>
            </table>
        </div>
    `);
    $('#loanDetailsModal').css('display', 'flex');
}

function payInstallment() {
    if (!checkPermission('canReceiveInstallments')) {
        return showToast('Anda tidak memiliki hak akses untuk menerima angsuran.', 'error');
    }

    const loanId = $(this).data('id');
    const loanIndex = loans.findIndex(l => l.id === loanId);
    if (loanIndex === -1) return;

    const loan = loans[loanIndex];
    if (loan.status === 'paid_off') return showToast('Pinjaman ini sudah lunas.', 'info');

    const paymentAmount = loan.monthlyInstallment;

    showConfirmation('Konfirmasi Pembayaran', `Bayar angsuran sebesar ${formatCurrency(paymentAmount)} untuk pinjaman ${loan.id}?`, 'success', () => {
        loan.payments.push({
            date: new Date().toISOString(),
            amount: paymentAmount,
            paidBy: currentUser.name
        });

        const principalPayment = loan.amount / loan.tenor;
        loan.outstandingPrincipal -= principalPayment;
        if (loan.outstandingPrincipal < 1) loan.outstandingPrincipal = 0;

        if (loan.payments.length >= loan.tenor) {
            loan.status = 'paid_off';
            loan.outstandingPrincipal = 0;
        } else {
            loan.status = 'active';
        }

        loans[loanIndex] = loan;
        logTransaction(loan.memberId, 'Bayar Angsuran', paymentAmount, loan.id);
        saveData('loans');
        showToast('Pembayaran angsuran berhasil.', 'success');
        openLoanDetailsModal(loanId);
        loadLoansList();
        loadDashboard();
    });
}

// ============= GADAI =============
function openPawnModal() {
    loadPawnList();
    $('#pawnModal').css('display', 'flex');
}

function loadPawnList() {
    const $list = $('#pawnListContainer').empty();
    if (pawns.length === 0) {
        $list.html('<div class="empty-state"><p>Belum ada data agunan/gadai.</p></div>');
        return;
    }

    const table = $('<table class="data-table"><thead><tr><th>Anggota</th><th>Barang</th><th>Pinjaman</th><th>Jatuh Tempo</th><th>Status</th><th>Aksi</th></tr></thead><tbody></tbody></table>');
    const tbody = table.find('tbody');
    pawns.forEach(pawn => {
        const member = members.find(m => m.id === pawn.memberId);
        const isOverdue = moment(pawn.dueDate).isBefore(moment(), 'day') && pawn.status === 'active';
        const statusClass = pawn.status === 'redeemed' ? 'text-success' : (isOverdue ? 'text-danger' : '');
        const statusText = isOverdue ? 'JATUH TEMPO' : pawn.status.toUpperCase();

        tbody.append(`
            <tr>
                <td>${member ? member.name : 'N/A'}</td>
                <td>${pawn.itemName}</td>
                <td>${formatCurrency(pawn.loanAmount)}</td>
                <td>${moment(pawn.dueDate).format('DD MMM YYYY')}</td>
                <td><strong class="${statusClass}">${statusText}</strong></td>
                <td>
                    ${pawn.status === 'active'
                        ? `<button class="btn btn-sm btn-success redeem-pawn-btn" data-id="${pawn.id}">Tebus</button>`
                        : '-'
                    }
                </td>
            </tr>
        `);
    });
    $list.append(table);
}

function resetPawnForm() {
    $('#addPawnForm')[0].reset();
    $('#pawnMemberSearch').val('').removeData('selected-id');
}

function savePawn() {
    const memberId = $('#pawnMemberSearch').data('selected-id');
    const itemName = $('#pawnItemName').val();
    const itemValue = parseFloat($('#pawnItemValue').val());
    const loanAmount = parseFloat($('#pawnLoanAmount').val());
    const dueDate = $('#pawnDueDate').val();

    if (!memberId || !itemName || !(itemValue > 0) || !(loanAmount > 0) || !dueDate) {
        return showToast('Harap lengkapi semua data agunan.', 'error');
    }

    const newPawn = {
        id: 'PAWN' + moment().format('x'),
        memberId,
        itemName,
        itemValue,
        loanAmount,
        dueDate,
        notes: $('#pawnNotes').val(),
        status: 'active',
        pawnDate: new Date().toISOString()
    };
    pawns.unshift(newPawn);
    logTransaction(memberId, 'Gadai Barang', -loanAmount, newPawn.id);
    saveData('pawns');
    showToast('Data agunan berhasil disimpan.', 'success');
    loadPawnList();
    $('#addPawnModal').hide();
}

function redeemPawn(pawnId) {
    const idx = pawns.findIndex(p => p.id === pawnId);
    if (idx === -1) return;
    const pawn = pawns[idx];

    showConfirmation('Konfirmasi Penebusan', `Tebus barang "${pawn.itemName}" dengan membayar ${formatCurrency(pawn.loanAmount)}?`, 'success', () => {
        pawn.status = 'redeemed';
        pawn.redeemDate = new Date().toISOString();
        pawns[idx] = pawn;
        logTransaction(pawn.memberId, 'Tebus Gadai', pawn.loanAmount, pawn.id);
        saveData('pawns');
        showToast('Barang berhasil ditebus.', 'success');
        loadPawnList();
    });
}

// ============= LAPORAN & HISTORI =============
function openHistoryModal() {
    loadTransactionHistory();
    $('#historySearchInput').val('');
    $('#historyModal').css('display', 'flex');
}

function loadTransactionHistory(searchTerm = '') {
    const $results = $('#historyResultsContainer').empty();
    const term = searchTerm.toLowerCase();
    let filtered = transactions;

    if (term) {
        filtered = transactions.filter(t => {
            const member = members.find(m => m.id === t.memberId);
            return t.id.toLowerCase().includes(term) ||
                t.description.toLowerCase().includes(term) ||
                (member && member.name.toLowerCase().includes(term));
        });
    }

    if (filtered.length === 0) {
        $results.html('<div class="empty-state"><p>Tidak ada transaksi ditemukan.</p></div>');
        return;
    }

    const table = $('<table class="data-table"><thead><tr><th>Tanggal</th><th>Anggota</th><th>Deskripsi</th><th>Jumlah</th><th>Ref ID</th></tr></thead><tbody></tbody></table>');
    const tbody = table.find('tbody');
    filtered.slice(0, 200).forEach(t => {
        const member = members.find(m => m.id === t.memberId);
        const amountClass = t.amount > 0 ? 'text-success' : 'text-danger';
        tbody.append(`
            <tr>
                <td>${moment(t.date).format('DD MMM YY, HH:mm')}</td>
                <td>${member ? member.name : 'N/A'}</td>
                <td>${t.description}</td>
                <td><strong class="${amountClass}">${formatCurrency(t.amount)}</strong></td>
                <td>${t.refId}</td>
            </tr>
        `);
    });
    $results.append(table);
}

function openRecapReportModal() {
    $('#recapReportModal').css('display', 'flex');
    $('#recapReportResults').html('<div class="printable-area"><div class="empty-state"><i class="fas fa-file-alt"></i><p>Pilih periode dan generate laporan untuk melihat data.</p></div></div>');
    $('#downloadRecapPdfBtn, #printRecapBtn').hide();
}

function generateRecapReport() {
    let startDate, endDate;
    const period = $('#recapReportPeriod').val();

    if (period === 'this_month') {
        startDate = moment().startOf('month');
        endDate = moment().endOf('month');
    } else if (period === 'last_month') {
        startDate = moment().subtract(1, 'months').startOf('month');
        endDate = moment().subtract(1, 'months').endOf('month');
    } else if (period === 'this_year') {
        startDate = moment().startOf('year');
        endDate = moment().endOf('month');
    } else {
        startDate = moment($('#recapStartDate').val());
        endDate = moment($('#recapEndDate').val()).endOf('day');
    }

    if (!startDate.isValid() || !endDate.isValid() || endDate.isBefore(startDate)) {
        return showToast('Rentang tanggal tidak valid', 'error');
    }

    updateLoanStatuses();

    const activeTab = $('#recapReportModal .tabs .tab.active').data('tab');
    const filteredTransactions = transactions.filter(t =>
        moment(t.date).isBetween(startDate, endDate, null, '[]')
    );
    const loansInPeriod = loans.filter(l =>
        moment(l.applicationDate).isBetween(startDate, endDate, null, '[]')
    );

    let html = `<div class="printable-area"><div class="text-center mb-3"><h3>${settings.koperasiName}</h3><h4>Laporan ${activeTab === 'profitLossRecap' ? 'Laba Rugi' : (activeTab === 'cashFlowRecap' ? 'Arus Kas' : 'Portofolio Pinjaman')}</h4><p>Periode: ${startDate.format('D MMM YYYY')} - ${endDate.format('D MMM YYYY')}</p></div>`;

    if (activeTab === 'profitLossRecap') {
        let interestIncome = 0;
        loans.forEach(loan => {
            const paymentsInPeriod = loan.payments.filter(p =>
                moment(p.date).isBetween(startDate, endDate, null, '[]')
            );
            if (paymentsInPeriod.length > 0) {
                const monthlyInterest = loan.amount * (loan.interestRate / 100);
                interestIncome += monthlyInterest * paymentsInPeriod.length;
            }
        });
        const operationalCost = 0;
        const netProfit = interestIncome - operationalCost;
        html += `
            <div class="recap-summary-card"><div class="title">Total Pendapatan Bunga (Realisasi)</div><div class="value">${formatCurrency(interestIncome)}</div></div>
            <div class="recap-summary-card" style="border-color: var(--danger);"><div class="title">Biaya Operasional</div><div class="value">${formatCurrency(operationalCost)}</div></div>
            <div class="recap-summary-card" style="border-color: var(--success);"><div class="title">Laba Bersih</div><div class="value">${formatCurrency(netProfit)}</div></div>
        `;
    } else if (activeTab === 'cashFlowRecap') {
        const cashIn = filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const cashOut = filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);
        const netCashFlow = cashIn + cashOut;
        html += `
            <div class="recap-summary-card" style="border-color: var(--success);"><div class="title">Total Kas Masuk</div><div class="value">${formatCurrency(cashIn)}</div></div>
            <div class="recap-summary-card" style="border-color: var(--danger);"><div class="title">Total Kas Keluar</div><div class="value">${formatCurrency(Math.abs(cashOut))}</div></div>
            <div class="recap-summary-card"><div class="title">Arus Kas Bersih</div><div class="value ${netCashFlow < 0 ? 'text-danger' : 'text-success'}">${formatCurrency(netCashFlow)}</div></div>
        `;
    } else {
        const totalDisbursedInPeriod = loansInPeriod.reduce((sum, l) => sum + l.amount, 0);
        const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');
        const nplLoans = loans.filter(l => l.status === 'overdue');
        const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
        const nplAmount = nplLoans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
        const nplRatio = totalOutstanding > 0 ? (nplAmount / totalOutstanding) * 100 : 0;
        html += `
            <div class="recap-summary-card"><div class="title">Pinjaman Disalurkan (Periode Ini)</div><div class="value">${formatCurrency(totalDisbursedInPeriod)}</div></div>
            <div class="recap-summary-card"><div class="title">Total Pinjaman Aktif (Outstanding)</div><div class="value">${formatCurrency(totalOutstanding)}</div></div>
            <div class="recap-summary-card" style="border-color: var(--danger);"><div class="title">NPL (Non-Performing Loan)</div><div class="value">${nplRatio.toFixed(2)} % (${formatCurrency(nplAmount)})</div></div>
        `;
    }
    html += '</div>';
    $('#recapReportResults').html(html);
    $('#downloadRecapPdfBtn, #printRecapBtn').show();
}

// ============= INFO KOPERASI =============
function updateKoperasiInfo() {
    $('#koperasiNameHeader').text(settings.koperasiName);
    document.title = `${settings.koperasiName} - Sistem Keuangan Digital`;
}

function openManageKoperasiInfoModal() {
    $('#koperasiName').val(settings.koperasiName);
    $('#koperasiAddress').val(settings.koperasiAddress);
    $('#koperasiPhone').val(settings.koperasiPhone);
    $('#koperasiEmail').val(settings.koperasiEmail);
    $('#manageKoperasiInfoModal').css('display', 'flex');
}

function saveKoperasiInfo() {
    settings.koperasiName = $('#koperasiName').val();
    settings.koperasiAddress = $('#koperasiAddress').val();
    settings.koperasiPhone = $('#koperasiPhone').val();
    settings.koperasiEmail = $('#koperasiEmail').val();
    saveData('settings');
    updateKoperasiInfo();
    showToast('Informasi koperasi berhasil disimpan', 'success');
    $('#manageKoperasiInfoModal').hide();
}

// ============= KONTROL PANEL (USER & ROLES) =============
function openControlPanel() {
    loadUsersList();
    $('#userFormContainer').hide();
    $('#panelSecurityCode, #currentPassword, #newPassword').val('');
    populateRolesDropdown('#userRole');
    switchModalTab($('#controlPanelModal'), 'users');
    $('#controlPanelModal').css('display', 'flex');
}

function loadUsersList() {
    const $list = $('#usersList').empty();
    const table = $('<table class="data-table"><thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Aksi</th></tr></thead><tbody></tbody></table>');
    const tbody = table.find('tbody');
    users.forEach(user => {
        const roleLabel = settings.roles[user.role]?.label || user.role;
        tbody.append(`
            <tr>
                <td>${user.name}</td>
                <td>${user.username}</td>
                <td>${roleLabel}</td>
                <td>
                    ${user.id !== DEFAULT_ADMIN.id
                        ? `<button class="btn btn-sm btn-info edit-user" data-id="${user.id}">Edit</button>
                           <button class="btn btn-sm btn-danger delete-user" data-id="${user.id}">Hapus</button>`
                        : 'Default Admin'
                    }
                </td>
            </tr>
        `);
    });
    $list.append(table);
}

function resetUserForm() {
    $('#userForm')[0].reset();
    $('#userIdInput').val('');
    $('#userFormTitle').text('Tambah Pengguna');
    $('#userUsername').prop('disabled', false);
}

function editUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    resetUserForm();
    $('#userFormTitle').text('Edit Pengguna');
    $('#userIdInput').val(user.id);
    $('#userName').val(user.name);
    $('#userUsername').val(user.username).prop('disabled', true);
    $('#userRole').val(user.role);
    $('#userFormContainer').slideDown();
}

function saveUser(e) {
    e.preventDefault();
    const id = $('#userIdInput').val() || 'U' + Date.now();
    const password = $('#userPassword').val();
    const existingIdx = users.findIndex(u => u.id === id);

    if (existingIdx > -1) {
        if (password) users[existingIdx].password = CryptoJS.SHA256(password).toString();
        users[existingIdx].name = $('#userName').val();
        users[existingIdx].role = $('#userRole').val();
        showToast('Data pengguna diperbarui', 'success');
    } else {
        if (!password) return showToast('Password wajib diisi untuk pengguna baru.', 'error');
        const newUser = {
            id,
            name: $('#userName').val(),
            username: $('#userUsername').val(),
            role: $('#userRole').val(),
            password: CryptoJS.SHA256(password).toString()
        };
        users.push(newUser);
        showToast('Pengguna baru ditambahkan', 'success');
    }
    saveData('users');
    loadUsersList();
    resetUserForm();
    $('#userFormContainer').slideUp();
}

function deleteUser(id) {
    if (users.length <= 1) return showToast('Tidak dapat menghapus satu-satunya pengguna.', 'error');
    if (id === currentUser.id) return showToast('Tidak dapat menghapus akun Anda sendiri.', 'error');
    promptForPassword('panel', () => {
        showConfirmation('Hapus Pengguna', 'Yakin ingin menghapus pengguna ini?', 'danger', () => {
            users = users.filter(u => u.id !== id);
            saveData('users');
            loadUsersList();
            showToast('Pengguna dihapus', 'success');
        });
    });
}

function changeSecurityCode(e) {
    e.preventDefault();
    const newCode = $('#panelSecurityCode').val();
    if (newCode.length < 6) return showToast('Password keamanan minimal 6 karakter.', 'error');
    settings.panelSecurityCode = CryptoJS.SHA256(newCode).toString();
    saveData('settings');
    showToast('Password keamanan berhasil diubah.', 'success');
    $('#panelSecurityCode').val('');
}

function changeOwnPassword(e) {
    e.preventDefault();
    const currentPwd = $('#currentPassword').val();
    const newPwd = $('#newPassword').val();
    if (newPwd.length < 6) return showToast('Password baru minimal 6 karakter.', 'error');
    if (CryptoJS.SHA256(currentPwd).toString() !== currentUser.password) {
        return showToast('Password saat ini salah.', 'error');
    }
    const userIdx = users.findIndex(u => u.id === currentUser.id);
    users[userIdx].password = CryptoJS.SHA256(newPwd).toString();
    currentUser.password = users[userIdx].password;
    sessionStorage.setItem('coop_current_user', JSON.stringify(currentUser));
    saveData('users');
    showToast('Password Anda berhasil diubah.', 'success');
    $('#changeOwnPasswordForm')[0].reset();
}

function populateRolesDropdown(selector) {
    const $select = $(selector).empty();
    Object.entries(settings.roles).forEach(([key, val]) =>
        $select.append(`<option value="${key}">${val.label}</option>`)
    );
}

function openRoleManagementModal() {
    const $tabs = $('#roleTabsContainer').empty();
    const $permissions = $('#rolePermissionsContainer').empty();
    Object.entries(settings.roles).forEach(([role, data], index) => {
        $tabs.append(`<div class="tab ${index === 0 ? 'active' : ''}" data-tab="${role}">${data.label}</div>`);
    });
    loadRolePermissions(Object.keys(settings.roles)[0]);
    $('#roleTabsContainer').off('click').on('click', '.tab', function () {
        $('#roleTabsContainer .tab').removeClass('active');
        $(this).addClass('active');
        loadRolePermissions($(this).data('tab'));
    });
    $('#roleManagementModal').css('display', 'flex');
}

function loadRolePermissions(role) {
    const $container = $('#rolePermissionsContainer').empty().data('current-role', role);
    const roleData = settings.roles[role];
    if (!roleData) return;
    const structure = getPermissionStructure();
    Object.entries(structure).forEach(([groupName, permissions]) => {
        let groupHtml = `<div class="permission-group"><div class="permission-group-title">${groupName}</div>`;
        Object.entries(permissions).forEach(([key, label]) => {
            const isChecked = roleData.permissions[key] ? 'checked' : '';
            const isDisabled = !roleData.isEditable ? 'disabled' : '';
            groupHtml += `<div class="permission-item"><label><input type="checkbox" class="permission-checkbox" data-key="${key}" ${isChecked} ${isDisabled}> ${label}</label></div>`;
        });
        groupHtml += '</div>';
        $container.append(groupHtml);
    });
}

function saveRolePermissions() {
    const role = $('#rolePermissionsContainer').data('current-role');
    if (!settings.roles[role] || !settings.roles[role].isEditable) {
        return showToast('Role ini tidak dapat diubah.', 'error');
    }
    $('.permission-checkbox').each(function () {
        const key = $(this).data('key');
        settings.roles[role].permissions[key] = $(this).is(':checked');
    });
    saveData('settings');
    showToast(`Hak akses untuk ${settings.roles[role].label} berhasil disimpan.`, 'success');
}

// ============= PASSWORD PROMPT =============
function promptForPassword(type, callback) {
    passwordPromptCallback = callback;
    $('#passwordPromptTitle').text(type === 'panel' ? 'Akses Terbatas' : '');
    $('#passwordPromptMessage').text('Masukkan password keamanan untuk melanjutkan.');
    $('#passwordPromptInput').val('').focus();
    $('#passwordPromptModal').css('display', 'flex');
}

function submitPasswordPrompt() {
    const password = $('#passwordPromptInput').val();
    const correctHash = settings.panelSecurityCode;
    if (CryptoJS.SHA256(password).toString() === correctHash) {
        if (passwordPromptCallback) passwordPromptCallback();
        passwordPromptCallback = null;
        $('#passwordPromptModal').hide();
    } else {
        showToast('Password keamanan salah.', 'error');
    }
}

// ============= BACKUP, RESTORE, RESET =============
function backupData() {
    try {
        const dataToBackup = {};
        Object.keys(STORAGE_KEYS).forEach(key => {
            dataToBackup[STORAGE_KEYS[key]] = JSON.parse(localStorage.getItem(STORAGE_KEYS[key]));
        });
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(dataToBackup), ENCRYPTION_KEY).toString();
        const blob = new Blob([encrypted], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup-koperasi-${moment().format('YYYYMMDD')}.lkscoop`;
        link.click();
        showToast('Backup berhasil dibuat.', 'success');
    } catch (e) {
        showToast('Gagal membuat backup. ' + e.message, 'error');
    }
}

function restoreFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        showConfirmation('Restore Data', 'Ini akan menimpa semua data saat ini. Lanjutkan?', 'danger', () => {
            try {
                const decrypted = CryptoJS.AES.decrypt(e.target.result, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
                if (!decrypted) throw new Error('Decryption failed');
                const restored = JSON.parse(decrypted);
                Object.keys(restored).forEach(key => localStorage.setItem(key, JSON.stringify(restored[key])));
                showToast('Data berhasil dipulihkan. Aplikasi akan dimulai ulang.', 'success');
                setTimeout(() => location.reload(), 2000);
            } catch (err) {
                showToast('File backup tidak valid atau rusak.', 'error');
            }
        });
    };
    reader.readAsText(file);
}

function resetAllData() {
    showConfirmation('RESET SEMUA DATA', 'ANDA YAKIN? Tindakan ini tidak dapat diurungkan dan akan menghapus semua data anggota, transaksi, dan pengaturan.', 'danger', () => {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
        sessionStorage.clear();
        showToast('Semua data telah direset. Aplikasi akan dimulai ulang.', 'success');
        setTimeout(() => location.reload(), 2000);
    });
}

// ============= PDF, PRINT, EXCEL =============
async function downloadPdf(elementId, fileName) {
    const element = document.querySelector(elementId);
    if (!element) return;
    showToast('Mempersiapkan PDF...', 'info');
    try {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: null });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(fileName);
    } catch (e) {
        showToast('Gagal membuat PDF: ' + e.message, 'error');
    }
}

function printElement(elementId) {
    const content = $(elementId).clone();
    $('#print-container').html(content).show();
    setTimeout(() => {
        window.print();
        $('#print-container').empty().hide();
    }, 250);
}

function openKtaModal(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    $('#ktaKoperasiName').text(settings.koperasiName);
    $('#ktaKoperasiContact').text(`${settings.koperasiAddress}, ${settings.koperasiPhone}`);
    $('#ktaMemberName').text(member.name);
    $('#ktaMemberId').text(`ID: ${member.id}`);
    const qrContainer = document.getElementById('ktaQrcodeImg');
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
        text: JSON.stringify({ id: member.id, name: member.name }),
        width: 150,
        height: 150,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    $('#ktaModal').css('display', 'flex');
}

function downloadKtaAsPdf() {
    downloadPdf('#ktaCard', `KTA-${$('#ktaMemberName').text().replace(/ /g, '_')}.pdf`);
}

function downloadRecapAsPdf() {
    downloadPdf('#recapReportResults .printable-area', `Laporan-Keuangan-${moment().format('YYYY-MM-DD')}.pdf`);
}

function exportToExcel(data, fileName) {
    try {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        XLSX.writeFile(workbook, `${fileName}_${moment().format('YYYYMMDD')}.xlsx`);
        showToast('Ekspor Excel berhasil.', 'success');
    } catch (e) {
        showToast('Gagal mengekspor Excel: ' + e.message, 'error');
    }
}

function exportMembersToExcel() {
    const data = members.map(m => ({
        'ID Anggota': m.id,
        'Nama': m.name,
        'Telepon': m.phone,
        'Alamat': m.address,
        'Tanggal Bergabung': m.joinDate ? moment(m.joinDate).format('YYYY-MM-DD') : ''
    }));
    exportToExcel(data, 'Daftar_Anggota');
}

function exportLoansToExcel() {
    const data = loans.map(l => {
        const member = members.find(m => m.id === l.memberId);
        return {
            'ID Pinjaman': l.id,
            'Nama Anggota': member ? member.name : 'N/A',
            'Jumlah Pinjaman': l.amount,
            'Sisa Pokok': l.outstandingPrincipal,
            'Tenor (Bulan)': l.tenor,
            'Bunga (%)': l.interestRate,
            'Angsuran / Bulan': l.monthlyInstallment,
            'Status': l.status.toUpperCase(),
            'Tanggal Pengajuan': moment(l.applicationDate).format('YYYY-MM-DD')
        };
    });
    exportToExcel(data, 'Daftar_Pinjaman');
}

function exportPawnsToExcel() {
    const data = pawns.map(p => {
        const member = members.find(m => m.id === p.memberId);
        return {
            'ID Gadai': p.id,
            'Nama Anggota': member ? member.name : 'N/A',
            'Nama Barang': p.itemName,
            'Nilai Taksiran': p.itemValue,
            'Jumlah Pinjaman': p.loanAmount,
            'Status': p.status.toUpperCase(),
            'Tanggal Gadai': moment(p.pawnDate).format('YYYY-MM-DD'),
            'Jatuh Tempo': moment(p.dueDate).format('YYYY-MM-DD'),
            'Tanggal Tebus': p.redeemDate ? moment(p.redeemDate).format('YYYY-MM-DD') : ''
        };
    });
    exportToExcel(data, 'Daftar_Agunan_Gadai');
}

function exportHistoryToExcel() {
    const data = transactions.map(t => {
        const member = members.find(m => m.id === t.memberId);
        return {
            'ID Transaksi': t.id,
            'Tanggal': moment(t.date).format('YYYY-MM-DD HH:mm:ss'),
            'Nama Anggota': member ? member.name : 'N/A',
            'ID Anggota': t.memberId,
            'Deskripsi': t.description,
            'Jumlah': t.amount,
            'ID Referensi': t.refId
        };
    });
    exportToExcel(data, 'Histori_Transaksi');
}

// ============= PROFIL ANGGOTA =============
function openMemberProfileModal(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const memberLoans = loans.filter(l => l.memberId === memberId);
    const loansHtml = memberLoans.length > 0
        ? memberLoans.map(l => `
            <div class="summary-row">
                <span>${l.id} (<strong class="${l.status === 'overdue' ? 'text-danger' : (l.status === 'paid_off' ? 'text-success' : '')}">${l.status.toUpperCase()}</strong>)</span>
                <span>Sisa: ${formatCurrency(l.outstandingPrincipal)}</span>
            </div>
        `).join('')
        : '<p>Tidak ada pinjaman aktif.</p>';

    $('#memberProfileBody').html(`
        <h3>${member.name}</h3>
        <p>${member.phone || 'No phone'} | ${member.address || 'No address'}</p>
        <hr>
        <h4 class="mt-3">Ringkasan Simpanan</h4>
        <div class="member-financial-summary">
            <div class="summary-row"><span>Simpanan Pokok:</span> <span id="profilePokok">Rp 0</span></div>
            <div class="summary-row"><span>Simpanan Wajib:</span> <span id="profileWajib">Rp 0</span></div>
            <div class="summary-row"><span>Simpanan Sukarela:</span> <span id="profileSukarela">Rp 0</span></div>
            <div class="summary-row total-row"><span>Total Simpanan:</span> <span id="profileTotalSimpanan">Rp 0</span></div>
        </div>
        <h4 class="mt-3">Ringkasan Pinjaman</h4>
        <div class="member-financial-summary" style="border-color:var(--loan-color);">
            ${loansHtml}
        </div>
    `);

    const memberSavings = savings.filter(s => s.memberId === memberId);
    $('#profilePokok').text(formatCurrency(memberSavings.filter(s => s.category === 'pokok').reduce((sum, s) => sum + s.amount, 0)));
    $('#profileWajib').text(formatCurrency(memberSavings.filter(s => s.category === 'wajib').reduce((sum, s) => sum + s.amount, 0)));
    $('#profileSukarela').text(formatCurrency(memberSavings.filter(s => s.category === 'sukarela').reduce((sum, s) => sum + s.amount, 0)));
    $('#profileTotalSimpanan').text(formatCurrency(memberSavings.reduce((sum, s) => sum + s.amount, 0)));

    $('#memberProfileModal').css('display', 'flex');
}

// ============= FUNGSI TAMBAHAN UNTUK SEARCH =============
function selectMemberForLoan(memberId) {
    // Fungsi ini dipanggil setelah memilih anggota di modal pinjaman
    $('#loanMemberSearch').data('selected-id', memberId);
    // Bisa ditambahkan info singkat jika diperlukan
}

function selectMemberForPawn(memberId) {
    $('#pawnMemberSearch').data('selected-id', memberId);
}

// ============= EVENT LISTENERS & INIT =============
$(document).ready(function () {
    initializeData();
    loadAllData();

    currentUser = JSON.parse(sessionStorage.getItem('coop_current_user')) || null;

    $('#currentYear').text(new Date().getFullYear());

    if (currentUser) {
        $('#loggedInUser').text(currentUser.name);
        $('#loginModal').hide();
        $('#mainApp').show();
        initializeApp();
    } else {
        generateCaptcha();
    }

    setInterval(updateCurrentDate, 60000);

    // Login
    $('#loginForm').submit(handleLogin);
    $('#reloadCaptchaBtn').click(generateCaptcha);
    $('#logoutBtn').click(handleLogout);

    // Menu utama
    $('#savingsMenuBtn').click(() => { if (checkPermission('canManageSavings')) openSavingsModal(); });
    $('#loansMenuBtn').click(() => { if (checkPermission('canManageLoans')) openLoansModal(); });
    $('#pawnMenuBtn').click(() => { if (checkPermission('canManagePawns')) openPawnModal(); });
    $('#manageMembersBtn').click(() => { if (checkPermission('canManageMembers')) openManageMembersModal(); });

    // Admin Panel
    $('#recapReportBtn').click(() => { if (checkPermission('canViewReports')) openRecapReportModal(); });
    $('#historyBtn').click(openHistoryModal);
    $('#manageKoperasiInfoBtn').click(() => { if (checkPermission('canManageKoperasiInfo')) openManageKoperasiInfoModal(); });
    $('#controlPanelBtn').click(() => { if (checkPermission('canAccessControlPanel')) promptForPassword('panel', openControlPanel); });

    // Modal close
    $('.modal-close, .modal-close-btn').click(function () {
        $(this).closest('.modal').hide();
    });

    // Tab dalam modal
    $(document).on('click', '.modal-body .tabs .tab', function () {
        switchModalTab($(this).closest('.modal'), $(this).data('tab'));
    });

    // Simpanan
    $('#savingsMemberSearch').on('input', function () {
        handleMemberSearch(this, '#savingsMemberResults', selectMemberForSavings);
    });
    $('#savingsTransactionForm').submit(processSavingsTransaction);

    // Pinjaman
    $('#showAddLoanFormBtn').click(() => { resetLoanForm(); $('#addLoanModal').css('display', 'flex'); });
    $('#loanMemberSearch').on('input', function () {
        handleMemberSearch(this, '#loanMemberResults', selectMemberForLoan);
    });
    $('#loanAmount, #loanTenor, #loanInterest').on('input', calculateLoanPreview);
    $('#saveLoanBtn').click(saveLoan);
    $(document).on('click', '.view-loan-details', function () {
        openLoanDetailsModal($(this).data('id'));
    });
    $('#payInstallmentBtn').click(payInstallment);
    $('#exportLoansExcelBtn').click(exportLoansToExcel);

    // Gadai
    $('#showAddPawnFormBtn').click(() => { resetPawnForm(); $('#addPawnModal').css('display', 'flex'); });
    $('#pawnMemberSearch').on('input', function () {
        handleMemberSearch(this, '#pawnMemberResults', selectMemberForPawn);
    });
    $('#savePawnBtn').click(savePawn);
    $(document).on('click', '.redeem-pawn-btn', function (e) {
        e.stopPropagation();
        redeemPawn($(this).data('id'));
    });
    $('#exportPawnsExcelBtn').click(exportPawnsToExcel);

    // Anggota
    $('#showAddMemberFormBtn, #cancelMemberFormBtn').click(() => {
        $('#memberFormContainer').slideToggle();
        resetMemberForm();
    });
    $('#memberForm').submit(saveMember);
    $('#manageMemberSearchInput').on('input', function () {
        loadMembersList($(this).val());
    });
    $(document).on('click', '.edit-member', function () {
        editMember($(this).data('id'));
    });
    $(document).on('click', '.kta-member', function () {
        openKtaModal($(this).data('id'));
    });
    $(document).on('click', '.profile-member', function () {
        openMemberProfileModal($(this).data('id'));
    });
    $('#downloadKtaPdfBtn').click(downloadKtaAsPdf);
    $('#exportMembersExcelBtn').click(exportMembersToExcel);

    // Kontrol Panel
    $('#saveKoperasiInfoBtn').click(saveKoperasiInfo);
    $('#userForm').submit(saveUser);
    $('#panelSecurityForm').submit(changeSecurityCode);
    $('#changeOwnPasswordForm').submit(changeOwnPassword);
    $('#showAddUserFormBtn, #cancelUserFormBtn').click(() => {
        $('#userFormContainer').slideToggle();
        resetUserForm();
    });
    $(document).on('click', '.edit-user', function () {
        editUser($(this).data('id'));
    });
    $(document).on('click', '.delete-user', function () {
        deleteUser($(this).data('id'));
    });
    $('#manageRolesBtn').click(openRoleManagementModal);
    $('#saveRolePermissionsBtn').click(saveRolePermissions);

    // Laporan & Histori
    $('#historySearchInput').on('input', function () {
        loadTransactionHistory($(this).val());
    });
    $('#exportHistoryExcelBtn').click(exportHistoryToExcel);
    $('#recapReportPeriod').change(function () {
        const isCustom = $(this).val() === 'custom';
        $('#recapCustomDateContainer, #recapCustomDateContainer2').toggle(isCustom);
    });
    $('#generateRecapReportBtn').click(generateRecapReport);
    $('#printRecapBtn').click(() => printElement('#recapReportResults .printable-area'));
    $('#downloadRecapPdfBtn').click(downloadRecapAsPdf);

    // Manajemen Data
    $('#backupDataBtn').click(() =>
        showConfirmation('Backup Data', 'Data akan di-backup ke file terenkripsi (.lkscoop). Lanjutkan?', 'success', backupData)
    );
    $('#restoreFile').change(function () {
        promptForPassword('panel', () => {
            restoreFromFile(this.files[0]);
            $(this).val('');
        });
    });
    $('#resetDataBtn').click(() =>
        promptForPassword('panel', () =>
            showConfirmation('Reset Data', 'Semua data akan dihapus permanen. Lanjutkan?', 'danger', resetAllData)
        )
    );

    // Password Prompt
    $('#passwordPromptForm').submit(e => {
        e.preventDefault();
        submitPasswordPrompt();
    });
    $('#passwordPromptSubmit').click(submitPasswordPrompt);
});
