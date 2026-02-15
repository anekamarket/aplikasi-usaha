document.addEventListener('DOMContentLoaded', function() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'), {
        backdrop: 'static',
        keyboard: false
    });
    loginModal.show();
    
    window.app = new TicketSalesApp();
    window.app.init();
});

class TicketSalesApp {
    constructor() {
        this.currentUser = null;
        this.cart = [];
        this.salesChart = null;
        this.reportData = {};

        this.initData();
        this.loadData();
    }
    
    init() {
        this.initUI();
        this.checkAuth();
        this.setupEventListeners();
        
        if(this.currentUser) {
            this.loadDashboardData();
        }
    }
    
    initData() {
        if (!localStorage.getItem('ticketSalesData')) {
            const initialData = {
                settings: {
                    venueName: 'Nama Acara / Organisasi',
                    venueLocation: 'Lokasi Acara, Kota',
                    venueDescription: 'Deskripsi singkat acara atau organisasi Anda',
                    venueLogo: 'https://placehold.co/150x150/7950f2/white?text=Logo',
                    venueWhatsapp: '',
                    venueWebsite: 'www.aplikasiusaha.com',
                    venueEmail: '',
                    currency: 'IDR',
                    dateFormat: 'DD-MM-YYYY',
                    timeFormat: '24',
                    enableTax: false,
                    taxRate: 10,
                    taxName: 'PPN',
                    enableReceiptFooter: true,
                    receiptFooterText: 'Terima kasih atas kunjungan Anda!'
                },
                users: [
                    {
                        id: this.generateId(),
                        username: 'admin',
                        password: this.hashPassword('Admin.13579'),
                        fullName: 'Administrator',
                        role: 'admin',
                        status: 'active',
                        lastLogin: null,
                        createdAt: new Date().toISOString(),
                        permissions: {}
                    }
                ],
                tickets: [],
                transactions: [],
                activities: [],
                deletedTicketsLog: []
            };
            localStorage.setItem('ticketSalesData', JSON.stringify(initialData));
        }
    }
    
    loadData() {
        const data = JSON.parse(localStorage.getItem('ticketSalesData'));
        this.settings = data.settings || {};
        this.users = data.users || [];
        this.tickets = data.tickets || [];
        this.transactions = data.transactions || [];
        this.activities = data.activities || [];
        this.deletedTicketsLog = data.deletedTicketsLog || [];
    }
    
    saveData() {
        const data = {
            settings: this.settings,
            users: this.users,
            tickets: this.tickets,
            transactions: this.transactions,
            activities: this.activities,
            deletedTicketsLog: this.deletedTicketsLog
        };
        localStorage.setItem('ticketSalesData', JSON.stringify(data));
    }
    
    initUI() {
        const today = new Date().toISOString().split('T')[0];
        ['ticketExpiry', 'reportDate', 'reportDateFrom', 'reportDateTo'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if(el.type === 'date') el.min = today;
                el.value = today;
            }
        });
        this.loadSettingsIntoForm();
    }

    loadSettingsIntoForm() {
        Object.keys(this.settings).forEach(key => {
            const el = document.getElementById(this.camelToKebab(key));
            if(el) {
                if(el.type === 'checkbox') {
                    el.checked = this.settings[key];
                } else {
                    el.value = this.settings[key];
                }
            }
        });

        document.getElementById('taxSettings').style.display = this.settings.enableTax ? 'block' : 'none';
        document.getElementById('receiptFooterSettings').style.display = this.settings.enableReceiptFooter !== false ? 'block' : 'none';
    }

    showSection(sectionId) {
        if (this.currentUser.role !== 'admin' && this.currentUser.permissions && !this.currentUser.permissions[sectionId]) {
            this.showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk mengakses menu ini.', 'danger');
            return;
        }

        document.querySelectorAll('.section').forEach(section => section.classList.add('d-none'));
        document.getElementById(sectionId)?.classList.remove('d-none');

        document.querySelectorAll('.sidebar .nav-link').forEach(link => link.classList.remove('active'));
        document.querySelector(`.sidebar .nav-link[data-section="${sectionId}"]`)?.classList.add('active');
        
        // Load data spesifik untuk section yang ditampilkan
        const sectionLoaders = {
            dashboardSection: this.loadDashboardData,
            stockTicketSection: this.loadTicketStock,
            transactionsSection: this.loadTransactions,
            usersSection: this.loadUsers,
            salesSection: this.updateCart,
        };
        
        if (sectionLoaders[sectionId]) {
            sectionLoaders[sectionId].bind(this)();
        }
    }

    checkAuth() {
        const loggedInUser = sessionStorage.getItem('loggedInUser') || localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            this.currentUser = JSON.parse(loggedInUser);
            this.updateUIAfterLogin();
        }
    }

    updateUIAfterLogin() {
        document.getElementById('currentUsername').textContent = this.currentUser.fullName || this.currentUser.username;

        const isAdmin = this.currentUser.role === 'admin';
        document.querySelectorAll('.restricted-link, .restricted, .restricted-section').forEach(el => {
            el.classList.toggle('restricted', !isAdmin);
        });
        
        const userPermissions = this.currentUser.permissions;
        document.querySelectorAll('.sidebar .nav-item').forEach(navItem => {
            const link = navItem.querySelector('.nav-link');
            if (!link || !link.dataset.section) return;

            const sectionId = link.dataset.section;
            const isRestrictedForNonAdmin = navItem.classList.contains('restricted-link');

            let canView = isAdmin || (!isRestrictedForNonAdmin && userPermissions && userPermissions[sectionId]);
            navItem.style.display = canView ? 'block' : 'none';
        });

        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        loginModal?.hide();

        this.populateUserFilters();
    }

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    setupEventListeners() {
        // Menggunakan event delegation untuk efisiensi
        document.body.addEventListener('click', e => {
            const target = e.target;
            const navLink = target.closest('.sidebar .nav-link[data-section]');
            if (navLink) {
                e.preventDefault();
                this.showSection(navLink.dataset.section);
            } else if (target.closest('#logoutBtn')) {
                e.preventDefault();
                this.handleLogout();
            } else if (target.closest('#saveNewUserBtn')) {
                this.addUser();
            } else if (target.closest('#saveEditUserBtn')) {
                this.editUser();
            } else if (target.closest('#savePasswordBtn')) {
                this.changePassword();
            }
        });
        
        // Event listener untuk form
        document.getElementById('loginForm').addEventListener('submit', e => { e.preventDefault(); this.handleLogin(); });
        document.getElementById('generateTicketForm').addEventListener('submit', e => { e.preventDefault(); this.generateTickets(); });
        document.getElementById('paymentForm').addEventListener('submit', e => { e.preventDefault(); this.completePayment(); });
        document.getElementById('venueInfoForm').addEventListener('submit', e => { e.preventDefault(); this.saveVenueInfo(); });
        document.getElementById('systemSettingsForm').addEventListener('submit', e => { e.preventDefault(); this.saveSystemSettings(); });

        // Event listener untuk tombol utama
        const buttonListeners = {
            '#refreshDashboardBtn': () => this.handleDashboardRefresh(),
            '#refreshStockBtn': () => this.loadTicketStock(),
            '#refreshTransactionsBtn': () => this.loadTransactions(),
            '#refreshUsersBtn': () => this.loadUsers(),
            '#printAllGeneratedTicketsBtn': () => this.printAllGeneratedTickets(),
            '#addSelectedToCartBtn': () => this.addSelectedToCart(),
            '#cancelTransactionBtn': () => this.cancelTransaction(),
            '#createBackupBtn': () => this.createBackup(),
            '#restoreDataBtn': () => this.restoreData(),
            '#resetSystemBtn': () => this.resetSystem(),
            '#generateReportBtn': () => this.generateReport(),
            '#clearStockFilterBtn': () => this.clearStockFilters(),
            '#exportReportBtn': () => this.exportReportPDF(),
            '#printReportBtn': () => this.printReport(),
            '#clearStockBtn': () => this.clearAllStock(),
            '#clearTransactionsBtn': () => this.clearTransactions(),
            '#deleteExpiredBtn': () => this.deleteTicketsByStatus('expired'),
            '#deleteSoldBtn': () => this.deleteTicketsByStatus('sold'),
            '#addUserBtn': () => this.promptForAdminPassword(() => bootstrap.Modal.getOrCreateInstance(document.getElementById('addUserModal')).show())
        };

        for(const selector in buttonListeners) {
            document.querySelector(selector)?.addEventListener('click', buttonListeners[selector]);
        }

        // Event listener dinamis (tabel, dll)
        document.getElementById('stockTableBody').addEventListener('click', e => {
            const viewBtn = e.target.closest('.view-ticket-btn');
            const addBtn = e.target.closest('.add-to-cart-btn');
            if(viewBtn) this.viewTicket(viewBtn.dataset.id);
            if(addBtn) this.addToCart(addBtn.dataset.id);
        });
        
        document.getElementById('cartTableBody').addEventListener('click', e => {
            if (e.target.closest('.remove-from-cart-btn')) {
                this.removeFromCart(e.target.closest('.remove-from-cart-btn').dataset.id);
            }
        });
        
        document.getElementById('transactionsTableBody').addEventListener('click', e => {
            const viewBtn = e.target.closest('.view-transaction-btn');
            if(viewBtn) this.viewTransaction(viewBtn.dataset.id);
        });
        
        document.getElementById('usersTableBody').addEventListener('click', e => {
            const editBtn = e.target.closest('.edit-user-btn');
            const deleteBtn = e.target.closest('.delete-user-btn');
            if(editBtn) this.promptForAdminPassword(() => this.openEditUserModal(editBtn.dataset.id));
            if(deleteBtn) this.promptForAdminPassword(() => this.deleteUser(deleteBtn.dataset.id));
        });
        
        // Event listener untuk input
        document.getElementById('amountPaid').addEventListener('input', () => this.calculateChange());
        ['salesTicketSearchInput', 'searchTicketInput', 'searchTransactionInput', 'searchUserInput'].forEach(id => {
            document.getElementById(id).addEventListener('input', e => {
                const value = e.target.value;
                if(id === 'salesTicketSearchInput') this.searchAvailableTickets(value);
                else this.loadDataForSection({ query: value });
            });
        });

        ['filterStatus', 'filterType', 'filterDate'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.loadTicketStock());
        });

        ['selectAllTickets', 'selectAllHeader'].forEach(id => {
             document.getElementById(id).addEventListener('change', e => this.toggleSelectAllTickets(e.target.checked));
        });

        // Pengaturan lainnya
        document.getElementById('reportType').addEventListener('change', e => this.toggleReportDateView(e.target.value));
        document.getElementById('enableTax').addEventListener('change', e => this.toggleSettingsView('taxSettings', e.target.checked));
        document.getElementById('enableReceiptFooter').addEventListener('change', e => this.toggleSettingsView('receiptFooterSettings', e.target.checked));
    }
    
    handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        const user = this.users.find(u => u.username.toLowerCase() === username.toLowerCase());

        if (user && this.hashPassword(password) === user.password) {
            if (user.status !== 'active') {
                this.showToast('Error', 'Akun ini telah dinonaktifkan.', 'danger');
                return;
            }
            this.proceedToApp(user, rememberMe);
        } else {
            this.showToast('Login Gagal', 'Username atau password salah.', 'danger');
        }
    }

    proceedToApp(user, rememberMe) {
        user.lastLogin = new Date().toISOString();
        this.saveData();
        this.currentUser = user;

        if (rememberMe) {
            localStorage.setItem('loggedInUser', JSON.stringify(user));
        } else {
            sessionStorage.setItem('loggedInUser', JSON.stringify(user));
        }

        this.updateUIAfterLogin();
        this.addActivity(`User ${user.username} login`);
        this.showToast('Login Berhasil', `Selamat datang, ${user.fullName || user.username}!`, 'success');
        this.showSection('dashboardSection');
    }

    handleLogout() {
        this.addActivity(`User ${this.currentUser.username} logout`);
        this.currentUser = null;
        sessionStorage.removeItem('loggedInUser');
        localStorage.removeItem('loggedInUser');
        bootstrap.Modal.getOrCreateInstance(document.getElementById('loginModal')).show();
        document.getElementById('loginForm').reset();
        this.showToast('Logout Berhasil', 'Anda telah berhasil keluar.', 'info');
    }

    generateTickets() {
        const type = document.getElementById('ticketType').value;
        const price = parseInt(document.getElementById('ticketPrice').value);
        const quantity = parseInt(document.getElementById('ticketQuantity').value);
        const prefix = (document.getElementById('ticketPrefix').value.trim() || 'STK').toUpperCase();
        const expiry = document.getElementById('ticketExpiry').value;

        if (isNaN(price) || isNaN(quantity) || quantity < 1 || quantity > 1000 || price < 0) {
            this.showToast('Error', 'Input tidak valid. Periksa kembali jumlah (1-1000) dan harga.', 'danger');
            return;
        }
        
        this.showLoading();
        // Timeout untuk memastikan UI loading sempat ditampilkan
        setTimeout(() => {
            const generatedTickets = [];
            const now = new Date().toISOString();
            const existingCodes = new Set(this.tickets.map(t => t.code));

            for (let i = 0; i < quantity; i++) {
                let code;
                do {
                   code = prefix + this.generateRandomString(6);
                } while (existingCodes.has(code));
                existingCodes.add(code);
                
                const ticket = {
                    id: this.generateId(), code, type, price,
                    status: 'available', generatedAt: now,
                    generatedBy: this.currentUser.username,
                    expiryDate: expiry || null, soldAt: null, transactionId: null
                };
                generatedTickets.push(ticket);
            }
            this.tickets.push(...generatedTickets);

            this.saveData();
            this.hideLoading();
            this.showGeneratedTickets(generatedTickets);
            this.addActivity(`Generate ${quantity} tiket jenis ${type}`);
            this.showToast('Sukses', `${quantity} tiket berhasil digenerate.`, 'success');
            document.getElementById('generateTicketForm').reset();
            document.getElementById('ticketPrice').value = "50000";
            document.getElementById('ticketQuantity').value = "10";
        }, 100);
    }

    showGeneratedTickets(tickets) {
        const container = document.getElementById('generatedTicketsContainer');
        const wrapper = document.createElement('div');
        wrapper.className = 'printable-ticket-wrapper';
        
        wrapper.innerHTML = tickets.map(ticket => this.generateTicketHTML(ticket)).join('');
        container.innerHTML = ''; // Clear previous
        container.appendChild(wrapper);
        
        tickets.forEach(ticket => this.generateQRCodeForTicket(ticket));
        
        document.getElementById('generatedTicketsCard').style.display = 'block';
    }
    
    loadTicketStock(options = {}) {
        const statusFilter = document.getElementById('filterStatus').value;
        const typeFilter = document.getElementById('filterType').value;
        const dateFilter = document.getElementById('filterDate').value;
        const query = options.query || '';

        let filteredTickets = this.tickets.filter(t => 
            (statusFilter === 'all' || t.status === statusFilter) &&
            (typeFilter === 'all' || t.type === typeFilter) &&
            (!dateFilter || t.generatedAt.startsWith(dateFilter)) &&
            (!query || t.code.toLowerCase().includes(query.toLowerCase()))
        );
        
        // PERBAIKAN: Mengganti a.date menjadi a.generatedAt untuk sorting yang benar
        filteredTickets.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

        const tableBody = document.getElementById('stockTableBody');
        tableBody.innerHTML = '';
        if (filteredTickets.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center">Tidak ada data tiket ditemukan.</td></tr>`;
            return;
        }

        const statusConfig = {
            available: { badge: 'bg-success', text: 'Tersedia' },
            sold: { badge: 'bg-danger', text: 'Terjual' },
            expired: { badge: 'bg-warning', text: 'Kedaluwarsa' }
        };

        tableBody.innerHTML = filteredTickets.map(ticket => {
            const {badge, text} = statusConfig[ticket.status] || {badge: 'bg-secondary', text: ticket.status};
            return `
                <tr>
                    <td><input type="checkbox" class="ticket-checkbox form-check-input" data-id="${ticket.id}" ${ticket.status !== 'available' ? 'disabled' : ''}></td>
                    <td>${ticket.code}</td>
                    <td>${this.formatTicketType(ticket.type)}</td>
                    <td>${this.formatCurrency(ticket.price)}</td>
                    <td><span class="badge ${badge}">${text}</span></td>
                    <td>${this.formatDateTime(ticket.generatedAt)}</td>
                    <td>${ticket.expiryDate ? this.formatDate(ticket.expiryDate) : '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-info view-ticket-btn" data-id="${ticket.id}" title="Lihat Detail"><i class="fas fa-eye"></i></button>
                        ${ticket.status === 'available' ? `<button class="btn btn-sm btn-outline-success add-to-cart-btn" data-id="${ticket.id}" title="Tambah ke Keranjang"><i class="fas fa-cart-plus"></i></button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    generateTicketHTML(ticket) {
        const expiryInfo = ticket.expiryDate ? `Berlaku s/d: <strong>${this.formatDate(ticket.expiryDate)}</strong>` : 'Berlaku Selamanya';
        const venueName = this.settings.venueName || 'Nama Acara/Organisasi';
        const venueNameShort = venueName.split(' ')[0];

        return `
            <div class="ticket-small-print">
                <div class="ticket-main">
                    <div class="header">
                        <img src="${this.settings.venueLogo}" alt="Logo" class="logo" onerror="this.onerror=null;this.src='https://placehold.co/150x150/7950f2/white?text=Logo';">
                        <div class="venue-info">
                            <div class="venue-name">${venueName}</div>
                            <div class="venue-location">${this.settings.venueLocation}</div>
                        </div>
                    </div>
                    <div class="ticket-body">
                        <div class="ticket-details">
                            <p class="ticket-type">${this.formatTicketType(ticket.type).toUpperCase()}</p>
                            <p class="ticket-code">${ticket.code}</p>
                            <p class="ticket-expiry">${expiryInfo}</p>
                        </div>
                        <div class="ticket-qr" id="qr-${ticket.id}"></div>
                    </div>
                    <div class="ticket-footer">
                        <div>Dicetak: ${this.formatDateTime(ticket.generatedAt)} oleh ${ticket.generatedBy}</div>
                        <!-- PENAMBAHAN: Info developer dan website sesuai permintaan -->
                        <div class="ticket-developer-info">
                            Lentera Karya Situbondo <br>
                            www.aplikasiusaha.com
                        </div>
                    </div>
                </div>
                <div class="ticket-stub">
                    <div class="stub-venue">${venueNameShort}</div>
                    <!-- PERUBAHAN POSISI: Detail ini sekarang di paling bawah stub -->
                    <div class="stub-details">
                        <div class="stub-type">${this.formatTicketType(ticket.type)}</div>
                        <div class="stub-code">${ticket.code}</div>
                        <div class="stub-price">${this.formatCurrency(ticket.price)}</div>
                    </div>
                    <!-- div kosong yang sebelumnya ada di sini telah dihapus -->
                </div>
            </div>
        `;
    }

    generateQRCodeForTicket(ticket) {
        setTimeout(() => {
            const qrElement = document.getElementById(`qr-${ticket.id}`);
            if (qrElement) {
                qrElement.innerHTML = ''; // Hapus QR code sebelumnya
                new QRCode(qrElement, {
                    text: ticket.code, width: 72, height: 72,
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
        }, 0);
    }
    
    promptForAdminPassword(onSuccess) {
        if (this.currentUser.role !== 'admin') {
            this.showToast('Akses Ditolak', 'Fitur ini hanya untuk Administrator.', 'danger');
            return;
        }

        const modalEl = document.getElementById('passwordPromptModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        const passwordInput = document.getElementById('adminPasswordInput');
        const confirmBtn = document.getElementById('passwordPromptConfirmBtn');
        const errorMsg = document.getElementById('passwordPromptError');
        const form = document.getElementById('passwordPromptForm');

        passwordInput.value = '';
        errorMsg.style.display = 'none';

        const confirmHandler = () => {
            if (this.hashPassword(passwordInput.value) === this.currentUser.password) {
                cleanup();
                modal.hide();
                onSuccess();
            } else {
                errorMsg.style.display = 'block';
                passwordInput.focus();
            }
        };
        
        const submitHandler = e => {
            e.preventDefault();
            confirmHandler();
        };

        const cleanup = () => {
            confirmBtn.removeEventListener('click', confirmHandler);
            form.removeEventListener('submit', submitHandler);
        };

        // Re-attach listeners to ensure they are fresh
        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        document.getElementById('passwordPromptConfirmBtn').addEventListener('click', confirmHandler);
        form.addEventListener('submit', submitHandler);
        
        modalEl.addEventListener('hidden.bs.modal', cleanup, { once: true });
        
        modal.show();
        modalEl.addEventListener('shown.bs.modal', () => passwordInput.focus(), { once: true });
    }

    // --- Helper & Utility Functions ---
    showLoading() { document.getElementById('loadingOverlay').classList.add('show'); }
    hideLoading() { document.getElementById('loadingOverlay').classList.remove('show'); }
    camelToKebab(str) { return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase(); }
    generateId() { return Date.now().toString(36) + Math.random().toString(36).substring(2); }
    generateRandomString(length) { return [...Array(length)].map(() => (~~(Math.random()*36)).toString(36)).join('').toUpperCase(); }
    showToast(title, message, type = 'info') {
        const toastEl = document.getElementById('alertToast');
        const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
        document.getElementById('toastTitle').textContent = title;
        document.getElementById('toastMessage').textContent = message;
        toastEl.className = 'toast hide text-white';
        const typeMap = { success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger', info: 'bg-info' };
        toastEl.classList.add(typeMap[type] || 'bg-primary');
        toast.show();
    }
    showConfirmation(title, message, onConfirm) {
        document.getElementById('confirmationModalTitle').textContent = title;
        document.getElementById('confirmationModalBody').innerHTML = message;
        const modalEl = document.getElementById('confirmationModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        const confirmBtn = document.getElementById('confirmActionBtn');
        
        const newConfirmBtn = confirmBtn.cloneNode(true); // Re-clone to remove old listeners
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
            modal.hide();
        }, { once: true });
        
        modal.show();
    }
    addActivity(message) {
        this.activities.unshift({
            id: this.generateId(), message,
            timestamp: new Date().toISOString(),
            user: this.currentUser ? this.currentUser.username : 'System'
        });
        if (this.activities.length > 100) this.activities.pop(); // Trim old activities
        this.saveData();
    }
    printContent(contentHTML, title) {
        const printable = document.getElementById('printable-content');
        printable.innerHTML = `<h3 class="text-center mb-4 no-print">${title}</h3>${contentHTML}`;
        setTimeout(() => window.print(), 100);
    }
    formatCurrency(amount) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount); }
    formatDate(dateStr) { if (!dateStr) return '-'; const d = new Date(dateStr); return new Date(d.getTime() + d.getTimezoneOffset()*60000).toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'}); }
    formatDateTime(dateStr) { return dateStr ? new Date(dateStr).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'; }
    formatTicketType(type) { return { general: 'General (Umum)', vip: 'VIP', presale: 'Presale', onsite: 'On-Site', parking: 'Parkir', other: 'Lainnya' }[type] || type; }
    formatPaymentMethod(method) { return { cash: 'Tunai', debit: 'Kartu Debit', credit: 'Kartu Kredit', transfer: 'Transfer Bank', ewallet: 'E-Wallet' }[method] || method; }
    formatUserRole(role) { return { admin: 'Admin', cashier: 'Kasir', manager: 'Manager' }[role] || role; }

    // Load data functions
    loadDataForSection(options) {
        const activeSection = document.querySelector('.section:not(.d-none)').id;
        const loaders = {
            stockTicketSection: () => this.loadTicketStock(options),
            transactionsSection: () => this.loadTransactions(options),
            usersSection: () => this.loadUsers(options)
        };
        if (loaders[activeSection]) loaders[activeSection]();
    }
    
    toggleSettingsView(elementId, isChecked) {
        document.getElementById(elementId).style.display = isChecked ? 'block' : 'none';
        if(elementId === 'taxSettings') this.updateCart();
    }
    
    toggleReportDateView(reportType) {
        const dateContainer = document.getElementById('reportDateContainer');
        const rangeContainer = document.getElementById('reportDateRangeContainer');
        const standardFilters = document.getElementById('standardReportFilters');
        
        dateContainer.classList.toggle('d-none', reportType === 'custom' || reportType === 'deleted');
        rangeContainer.classList.toggle('d-none', reportType !== 'custom' && reportType !== 'deleted');
        standardFilters.classList.toggle('d-none', reportType === 'deleted');
    }

    // Fungsi lainnya (add to cart, payment, dll)
    printAllGeneratedTickets() { 
        const container = document.getElementById('generatedTicketsContainer'); 
        const wrapper = container.querySelector('.printable-ticket-wrapper'); 
        if (!wrapper || !wrapper.innerHTML.trim()) { 
            this.showToast('Info', 'Tidak ada tiket untuk dicetak.', 'info'); 
            return; 
        } 
        this.printContent(`<div class="printable-ticket-wrapper">${wrapper.innerHTML}</div>`, 'Tiket Masuk'); 
    }
    toggleSelectAllTickets(checked) { 
        document.querySelectorAll('#stockTableBody .ticket-checkbox:not(:disabled)').forEach(checkbox => checkbox.checked = checked); 
        document.getElementById('selectAllTickets').checked = checked; 
        document.getElementById('selectAllHeader').checked = checked; 
    }
    addSelectedToCart() { 
        const selectedCheckboxes = document.querySelectorAll('#stockTableBody .ticket-checkbox:checked'); 
        if (selectedCheckboxes.length === 0) { 
            this.showToast('Peringatan', 'Pilih setidaknya satu tiket untuk ditambahkan.', 'warning'); 
            return; 
        } 
        let addedCount = 0; 
        let alreadyInCartCount = 0; 
        selectedCheckboxes.forEach(checkbox => { 
            const result = this.addToCart(checkbox.dataset.id, false); 
            if (result === 'added') addedCount++; 
            else if (result === 'in_cart') alreadyInCartCount++; 
        }); 
        if (addedCount > 0) this.showToast('Sukses', `${addedCount} tiket berhasil ditambahkan.`, 'success'); 
        if (alreadyInCartCount > 0) this.showToast('Info', `${alreadyInCartCount} tiket sudah ada di keranjang.`, 'info'); 
        this.toggleSelectAllTickets(false); 
        this.showSection('salesSection'); 
        setTimeout(() => document.getElementById('amountPaid').focus(), 100); 
    }
    addToCart(ticketId, showToast = true) { 
        const ticket = this.tickets.find(t => t.id === ticketId); 
        if (!ticket) { 
            if (showToast) this.showToast('Error', 'Tiket tidak ditemukan.', 'danger'); 
            return 'not_found'; 
        } 
        if (ticket.status !== 'available') { 
            if (showToast) this.showToast('Error', `Tiket ${ticket.code} tidak tersedia.`, 'danger'); 
            return 'unavailable'; 
        } 
        if (this.cart.some(item => item.id === ticket.id)) { 
            if (showToast) this.showToast('Info', `Tiket ${ticket.code} sudah ada di keranjang.`, 'info'); 
            return 'in_cart'; 
        } 
        this.cart.push({ id: ticket.id, code: ticket.code, type: ticket.type, price: ticket.price }); 
        this.updateCart(); 
        if (showToast) { 
            this.showToast('Sukses', `Tiket ${ticket.code} ditambahkan.`, 'success'); 
            document.getElementById('salesTicketSearchInput').focus(); 
        } 
        return 'added'; 
    }
    updateCart() { 
        const tableBody = document.getElementById('cartTableBody'); 
        tableBody.innerHTML = ''; 
        if(this.cart.length === 0) { 
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Keranjang kosong</td></tr>`; 
        } else { 
            tableBody.innerHTML = this.cart.map(item => `<tr><td>${item.code}</td><td>${this.formatTicketType(item.type)}</td><td>${this.formatCurrency(item.price)}</td><td><button class="btn btn-sm btn-outline-danger remove-from-cart-btn" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button></td></tr>`).join(''); 
        } 
        const subtotal = this.cart.reduce((sum, item) => sum + item.price, 0); 
        let finalTotal = subtotal; 
        if (this.settings.enableTax && this.settings.taxRate > 0) { 
            finalTotal += subtotal * (this.settings.taxRate / 100); 
        } 
        const formattedTotal = this.formatCurrency(finalTotal); 
        document.getElementById('totalAmount').value = formattedTotal; 
        document.getElementById('cartTotal').textContent = formattedTotal; 
        this.calculateChange(); 
    }
    removeFromCart(ticketId) { 
        this.cart = this.cart.filter(item => item.id !== ticketId); 
        this.updateCart(); 
        this.showToast('Info', 'Tiket dihapus dari keranjang.', 'info'); 
    }
    calculateChange() { 
        const subtotal = this.cart.reduce((sum, item) => sum + item.price, 0); 
        let finalTotal = subtotal; 
        if (this.settings.enableTax && this.settings.taxRate > 0) { 
            finalTotal += subtotal * (this.settings.taxRate / 100); 
        } 
        const paid = parseFloat(document.getElementById('amountPaid').value) || 0; 
        const change = paid - finalTotal; 
        document.getElementById('changeAmount').value = this.formatCurrency(change >= 0 ? change : 0); 
    }
    completePayment() { 
        if (this.cart.length === 0) { 
            this.showToast('Error', 'Keranjang kosong.', 'danger'); 
            return; 
        } 
        const subtotal = this.cart.reduce((sum, item) => sum + item.price, 0); 
        let taxAmount = 0; 
        let finalTotal = subtotal; 
        if (this.settings.enableTax && this.settings.taxRate > 0) { 
            taxAmount = subtotal * (this.settings.taxRate / 100); 
            finalTotal += taxAmount; 
        } 
        const amountPaid = parseFloat(document.getElementById('amountPaid').value); 
        if (isNaN(amountPaid) || amountPaid < finalTotal) { 
            this.showToast('Error', 'Jumlah pembayaran tidak mencukupi.', 'danger'); 
            return; 
        } 
        const now = new Date().toISOString(); 
        const transaction = { 
            id: this.generateId(), 
            transactionId: 'TRX-' + Date.now(), 
            date: now, 
            cashier: this.currentUser.username, 
            customerName: document.getElementById('customerName').value || 'Pelanggan', 
            items: [...this.cart], 
            subtotal, 
            tax: taxAmount, 
            taxInfo: { name: this.settings.taxName, rate: this.settings.taxRate }, 
            total: finalTotal, 
            paymentMethod: document.getElementById('paymentMethod').value, 
            amountPaid, 
            change: amountPaid - finalTotal 
        }; 
        this.cart.forEach(item => { 
            const ticket = this.tickets.find(t => t.id === item.id); 
            if (ticket) { 
                ticket.status = 'sold'; 
                ticket.soldAt = now; 
                ticket.transactionId = transaction.id; 
            } 
        }); 
        this.transactions.push(transaction); 
        this.saveData(); 
        this.cart = []; 
        this.updateCart(); 
        document.getElementById('paymentForm').reset(); 
        this.addActivity(`Transaksi ${transaction.transactionId} selesai`); 
        this.showToast('Sukses', 'Pembayaran berhasil.', 'success'); 
        this.viewTransaction(transaction.id); 
    }
    cancelTransaction() { 
        if (this.cart.length === 0) { 
            this.showToast('Info', 'Keranjang sudah kosong.', 'info'); 
            return; 
        } 
        this.showConfirmation('Batalkan Transaksi', 'Apakah Anda yakin? Semua item di keranjang akan dihapus.', () => { 
            this.cart = []; 
            this.updateCart(); 
            document.getElementById('paymentForm').reset(); 
            this.showToast('Info', 'Transaksi dibatalkan.', 'info'); 
        }); 
    }
    loadTransactions(options = {}) { 
        const query = options.query || ''; 
        let filtered = this.transactions.filter(t => !query || t.transactionId.toLowerCase().includes(query.toLowerCase())); 
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date)); 
        const tableBody = document.getElementById('transactionsTableBody'); 
        tableBody.innerHTML = ''; 
        if(filtered.length === 0) { 
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Tidak ada data transaksi.</td></tr>`; 
            return; 
        } 
        tableBody.innerHTML = filtered.map(t => `<tr><td>${t.transactionId}</td><td>${this.formatDateTime(t.date)}</td><td>${t.cashier}</td><td>${t.items.length}</td><td>${this.formatCurrency(t.total)}</td><td>${this.formatPaymentMethod(t.paymentMethod)}</td><td><button class="btn btn-sm btn-outline-primary view-transaction-btn" data-id="${t.id}"><i class="fas fa-eye"></i> Lihat</button></td></tr>`).join(''); 
    }
    viewTransaction(transactionId) { 
        const transaction = this.transactions.find(t => t.id === transactionId); 
        if (!transaction) return; 
        const receiptHTML = this.generateReceiptHTML(transaction); 
        document.getElementById('transactionModalContent').innerHTML = receiptHTML; 
        const modalEl = document.getElementById('viewTransactionModal'); 
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl); 
        const printBtn = document.getElementById('printTransactionBtn'); 
        printBtn.replaceWith(printBtn.cloneNode(true)); 
        document.getElementById('printTransactionBtn').addEventListener('click', () => { 
            modal.hide(); 
            this.printContent(receiptHTML, `Struk Transaksi ${transaction.transactionId}`); 
        }); 
        modal.show(); 
    }
    generateReceiptHTML(transaction) { 
        const cashierUser = this.users.find(u => u.username === transaction.cashier); 
        const cashierName = cashierUser ? cashierUser.fullName : transaction.cashier; 
        const contactInfo = [this.settings.venueWhatsapp ? `WA: ${this.settings.venueWhatsapp}` : '', this.settings.venueWebsite ? `Web: ${this.settings.venueWebsite}` : '', this.settings.venueEmail ? `Email: ${this.settings.venueEmail}` : ''].filter(Boolean).join(' | '); 
        return `<div class="receipt-container"><div class="receipt-header"><img src="${this.settings.venueLogo || ''}" class="receipt-logo" alt="Logo"><p class="receipt-title">${this.settings.venueName || 'Aplikasi Sistik'}</p><p class="receipt-subtitle">${this.settings.venueLocation || ''}</p></div><div class="receipt-divider"></div><div class="receipt-details"><p>No: ${transaction.transactionId}</p><p>Kasir: ${cashierName} (${transaction.cashier})</p><p>Tanggal: ${this.formatDateTime(transaction.date)}</p><p>Pelanggan: ${transaction.customerName}</p></div><div class="receipt-divider"></div><table class="receipt-items"><thead><tr><th class="col-item">Item</th><th class="col-qty">Jml</th><th class="col-price">Harga</th></tr></thead><tbody>${transaction.items.map(item => `<tr><td class="col-item">${this.formatTicketType(item.type)} (${item.code})</td><td class="col-qty">1</td><td class="col-price">${this.formatCurrency(item.price)}</td></tr>`).join('')}</tbody></table><div class="receipt-divider"></div><table class="receipt-totals"><tr><td class="label">Subtotal</td><td class="value">${this.formatCurrency(transaction.subtotal)}</td></tr>${(transaction.tax > 0 && transaction.taxInfo) ? `<tr><td class="label">${transaction.taxInfo.name} (${transaction.taxInfo.rate}%)</td><td class="value">${this.formatCurrency(transaction.tax)}</td></tr>` : ''}<tr class="total-row"><td class="label">Total</td><td class="value">${this.formatCurrency(transaction.total)}</td></tr><tr><td class="label">Bayar (${this.formatPaymentMethod(transaction.paymentMethod)})</td><td class="value">${this.formatCurrency(transaction.amountPaid)}</td></tr><tr><td class="label">Kembali</td><td class="value">${this.formatCurrency(transaction.change)}</td></tr></table>${this.settings.enableReceiptFooter ? `<div class="receipt-divider"></div><div class="receipt-footer"><p>${this.settings.receiptFooterText || ''}</p><p style="font-size: 0.7rem; margin-top: 5px;">${contactInfo}</p></div>` : ''}</div>`;}
    loadDashboardData() { 
        const today = new Date().toISOString().split('T')[0]; 
        const todaySales = this.transactions.filter(t => t.date.startsWith(today)); 
        document.getElementById('stockCount').textContent = this.tickets.filter(t => t.status === 'available').length; 
        document.getElementById('todaySalesCount').textContent = todaySales.reduce((sum, t) => sum + t.items.length, 0); 
        document.getElementById('todayRevenue').textContent = this.formatCurrency(todaySales.reduce((sum, t) => sum + t.total, 0)); 
        this.loadRecentActivities(); 
        this.loadSalesChart(); 
    }
    handleDashboardRefresh() { 
        this.loadDashboardData(); 
        this.showToast('Info', 'Dashboard telah diperbarui.', 'info'); 
    }
    loadRecentActivities() { 
        const container = document.getElementById('recentActivities'); 
        container.innerHTML = ''; 
        const recent = this.activities.slice(0, 5); 
        if (recent.length === 0) { 
            container.innerHTML = `<div class="list-group-item text-muted">Tidak ada aktivitas terakhir.</div>`; 
            return; 
        } 
        container.innerHTML = recent.map(act => `<div class="list-group-item"><p class="mb-1">${act.message}</p><small class="text-muted">${this.timeSince(act.timestamp)}</small></div>`).join(''); 
    }
    timeSince(dateStr) { 
        const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000); 
        let interval = seconds / 31536000; 
        if (interval > 1) return Math.floor(interval) + " tahun lalu"; 
        interval = seconds / 2592000; 
        if (interval > 1) return Math.floor(interval) + " bulan lalu"; 
        interval = seconds / 86400; 
        if (interval > 1) return Math.floor(interval) + " hari lalu"; 
        interval = seconds / 3600; 
        if (interval > 1) return Math.floor(interval) + " jam lalu"; 
        interval = seconds / 60; 
        if (interval > 1) return Math.floor(interval) + " menit lalu"; 
        return "Baru saja"; 
    }
    loadSalesChart() { 
        if (this.salesChart) this.salesChart.destroy(); 
        const labels = []; 
        const data = []; 
        for (let i = 6; i >= 0; i--) { 
            const d = new Date(); 
            d.setDate(d.getDate() - i); 
            const dateString = d.toISOString().split('T')[0]; 
            labels.push(this.formatDate(dateString).split(' ')[0] + ' ' + this.formatDate(dateString).split(' ')[1].substring(0,3)); 
            const dayRevenue = this.transactions.filter(t => t.date.startsWith(dateString)).reduce((sum, t) => sum + t.total, 0); 
            data.push(dayRevenue); 
        } 
        this.salesChart = new Chart(document.getElementById('salesChart'), { 
            type: 'line', 
            data: { 
                labels, 
                datasets: [{ 
                    label: 'Pendapatan Harian', 
                    data, 
                    backgroundColor: 'rgba(76, 110, 245, 0.1)', 
                    borderColor: 'rgba(76, 110, 245, 1)', 
                    borderWidth: 2, 
                    tension: 0.3, 
                    fill: true 
                }] 
            }, 
            options: { 
                responsive: true, 
                scales: { 
                    y: { 
                        beginAtZero: true 
                    } 
                } 
            } 
        }); 
    }
    loadUsers(options = {}) { 
        if (this.currentUser.role !== 'admin') return; 
        const query = options.query || ''; 
        let filtered = this.users.filter(u => !query || u.username.toLowerCase().includes(query.toLowerCase()) || u.fullName.toLowerCase().includes(query.toLowerCase())); 
        const tableBody = document.getElementById('usersTableBody'); 
        tableBody.innerHTML = ''; 
        filtered.forEach(user => { 
            const statusBadge = user.status === 'active' ? 'bg-success' : 'bg-secondary'; 
            const isDefaultAdmin = user.username === 'admin'; 
            tableBody.insertAdjacentHTML('beforeend', `<tr><td>${user.username}</td><td>${user.fullName}</td><td>${this.formatUserRole(user.role)}</td><td><span class="badge ${statusBadge}">${user.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td><td>${user.lastLogin ? this.formatDateTime(user.lastLogin) : 'N/A'}</td><td><button class="btn btn-sm btn-outline-primary edit-user-btn" data-id="${user.id}"><i class="fas fa-edit"></i></button> ${!isDefaultAdmin ? `<button class="btn btn-sm btn-outline-danger delete-user-btn" data-id="${user.id}"><i class="fas fa-trash-alt"></i></button>` : ''}</td></tr>`); 
        }); 
    }
    populateUserFilters() { 
        ['transactionFilterUser', 'reportUser'].forEach(filterId => { 
            const select = document.getElementById(filterId); 
            if(!select) return; 
            select.innerHTML = '<option value="all">Semua</option>'; 
            this.users.forEach(user => { 
                select.insertAdjacentHTML('beforeend', `<option value="${user.username}">${user.username}</option>`); 
            }); 
        }); 
    }
    addUser() { 
        if (this.currentUser.role !== 'admin') { 
            this.showToast('Akses Ditolak', 'Hanya admin yang dapat menambahkan pengguna.', 'danger'); 
            return; 
        } 
        const username = document.getElementById('newUsername').value; 
        const fullName = document.getElementById('newFullName').value; 
        const role = document.getElementById('newUserRole').value; 
        const password = document.getElementById('newUserPassword').value; 
        const confirmPassword = document.getElementById('confirmUserPassword').value; 
        if (!username || !fullName || !password) { 
            this.showToast('Error', 'Semua field wajib diisi.', 'danger'); 
            return; 
        } 
        if (password !== confirmPassword) { 
            this.showToast('Error', 'Password dan konfirmasi tidak cocok.', 'danger'); 
            return; 
        } 
        if (this.users.some(u => u.username.toLowerCase() === username.toLowerCase())) { 
            this.showToast('Error', 'Username sudah digunakan.', 'danger'); 
            return; 
        } 
        const permissions = {}; 
        if (role !== 'admin') { 
            document.querySelectorAll('#newUserPermissionsContainer .form-check-input').forEach(checkbox => { 
                permissions[checkbox.value] = checkbox.checked; 
            }); 
        } 
        const newUser = { 
            id: this.generateId(), 
            username, 
            password: this.hashPassword(password), 
            fullName, 
            role, 
            status: 'active', 
            lastLogin: null, 
            createdAt: new Date().toISOString(), 
            permissions 
        }; 
        this.users.push(newUser); 
        this.saveData(); 
        bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide(); 
        document.getElementById('addUserForm').reset(); 
        this.loadUsers(); 
        this.addActivity(`Tambah user baru: ${username}`); 
        this.showToast('Sukses', 'Pengguna baru berhasil ditambahkan.', 'success'); 
    }
    openEditUserModal(userId) { 
        if (this.currentUser.role !== 'admin') return; 
        const user = this.users.find(u => u.id === userId); 
        if (!user) return; 
        document.getElementById('editUserId').value = user.id; 
        document.getElementById('editUsername').value = user.username; 
        document.getElementById('editFullName').value = user.fullName; 
        document.getElementById('editUserRole').value = user.role; 
        document.getElementById('editUserStatus').value = user.status; 
        document.getElementById('editUserPassword').value = ''; 
        const permissionsContainer = document.getElementById('editUserPermissionsContainer'); 
        permissionsContainer.style.display = user.role === 'admin' ? 'none' : 'block'; 
        document.querySelectorAll('#editUserPermissionsContainer .form-check-input').forEach(checkbox => { 
            checkbox.checked = user.permissions && user.permissions[checkbox.value]; 
        }); 
        document.getElementById('editUserRole').disabled = (user.username === 'admin'); 
        bootstrap.Modal.getOrCreateInstance(document.getElementById('editUserModal')).show(); 
    }
    editUser() { 
        if (this.currentUser.role !== 'admin') { 
            this.showToast('Akses Ditolak', 'Hanya admin yang dapat mengubah data pengguna.', 'danger'); 
            return; 
        } 
        const userId = document.getElementById('editUserId').value; 
        const userIndex = this.users.findIndex(u => u.id === userId); 
        if (userIndex === -1) return; 
        const newRole = document.getElementById('editUserRole').value; 
        this.users[userIndex].fullName = document.getElementById('editFullName').value; 
        this.users[userIndex].role = newRole; 
        this.users[userIndex].status = document.getElementById('editUserStatus').value; 
        const permissions = {}; 
        if (newRole !== 'admin') { 
            document.querySelectorAll('#editUserPermissionsContainer .form-check-input').forEach(checkbox => { 
                permissions[checkbox.value] = checkbox.checked; 
            }); 
        } 
        this.users[userIndex].permissions = permissions; 
        const newPassword = document.getElementById('editUserPassword').value; 
        if (newPassword) { 
            this.users[userIndex].password = this.hashPassword(newPassword); 
        } 
        this.saveData(); 
        bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide(); 
        this.loadUsers(); 
        this.addActivity(`Update user: ${this.users[userIndex].username}`); 
        this.showToast('Sukses', 'Data pengguna berhasil diperbarui.', 'success'); 
    }
    deleteUser(userId) { 
        if (this.currentUser.role !== 'admin') return; 
        const user = this.users.find(u => u.id === userId); 
        if (!user || user.username === 'admin') { 
            this.showToast('Error', 'Admin utama tidak dapat dihapus.', 'danger'); 
            return; 
        } 
        this.showConfirmation('Hapus Pengguna', `Anda yakin ingin menghapus pengguna "${user.username}"?`, () => { 
            this.users = this.users.filter(u => u.id !== userId); 
            this.saveData(); 
            this.loadUsers(); 
            this.addActivity(`Hapus user: ${user.username}`); 
            this.showToast('Sukses', 'Pengguna berhasil dihapus.', 'success'); 
        }); 
    }
    changePassword() { 
        const currentPassword = document.getElementById('currentPassword').value; 
        const newPassword = document.getElementById('newPassword').value; 
        const confirmNewPassword = document.getElementById('confirmNewPassword').value; 
        if (this.hashPassword(currentPassword) !== this.currentUser.password) { 
            this.showToast('Error', 'Password saat ini salah.', 'danger'); 
            return; 
        } 
        if (!newPassword || newPassword !== confirmNewPassword) { 
            this.showToast('Error', 'Password baru dan konfirmasi tidak cocok.', 'danger'); 
            return; 
        } 
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id); 
        this.users[userIndex].password = this.hashPassword(newPassword); 
        this.currentUser.password = this.users[userIndex].password; 
        if (sessionStorage.getItem('loggedInUser')) sessionStorage.setItem('loggedInUser', JSON.stringify(this.currentUser)); 
        if (localStorage.getItem('loggedInUser')) localStorage.setItem('loggedInUser', JSON.stringify(this.currentUser)); 
        this.saveData(); 
        bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide(); 
        document.getElementById('changePasswordForm').reset(); 
        this.addActivity('User ganti password'); 
        this.showToast('Sukses', 'Password berhasil diubah.', 'success'); 
    }
    saveVenueInfo() { 
        if (this.currentUser.role !== 'admin') return; 
        this.settings.venueName = document.getElementById('venueName').value; 
        this.settings.venueLocation = document.getElementById('venueLocation').value; 
        this.settings.venueDescription = document.getElementById('venueDescription').value; 
        this.settings.venueLogo = document.getElementById('venueLogo').value; 
        this.settings.venueWhatsapp = document.getElementById('venueWhatsapp').value; 
        this.settings.venueWebsite = document.getElementById('venueWebsite').value; 
        this.settings.venueEmail = document.getElementById('venueEmail').value; 
        this.saveData(); 
        this.addActivity('Update info venue'); 
        this.showToast('Sukses', 'Informasi organisasi/acara disimpan.', 'success'); 
    }
    saveSystemSettings() { 
        if (this.currentUser.role !== 'admin') return; 
        this.settings.currency = document.getElementById('currency').value; 
        this.settings.dateFormat = document.getElementById('dateFormat').value; 
        this.settings.timeFormat = document.getElementById('timeFormat').value; 
        this.settings.enableTax = document.getElementById('enableTax').checked; 
        this.settings.taxRate = parseFloat(document.getElementById('taxRate').value); 
        this.settings.taxName = document.getElementById('taxName').value; 
        this.settings.enableReceiptFooter = document.getElementById('enableReceiptFooter').checked; 
        this.settings.receiptFooterText = document.getElementById('receiptFooterText').value; 
        this.saveData(); 
        this.addActivity('Update pengaturan sistem'); 
        this.showToast('Sukses', 'Pengaturan sistem disimpan.', 'success'); 
    }
    createBackup() { 
        if (this.currentUser.role !== 'admin') return; 
        const fileName = document.getElementById('backupFileName').value || 'SistikApp_Backup'; 
        const dataStr = JSON.stringify(JSON.parse(localStorage.getItem('ticketSalesData'))); 
        const blob = new Blob([dataStr], { type: 'application/json' }); 
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = `${fileName}_${new Date().toISOString().split('T')[0]}.json`; 
        a.click(); 
        URL.revokeObjectURL(url); 
        this.addActivity('Membuat backup sistem'); 
        this.showToast('Sukses', 'Backup berhasil diunduh.', 'success'); 
    }
    restoreData() { 
        if (this.currentUser.role !== 'admin') return; 
        const fileInput = document.getElementById('restoreFile'); 
        if (!fileInput.files.length) { 
            this.showToast('Error', 'Pilih file backup terlebih dahulu.', 'danger'); 
            return; 
        } 
        const file = fileInput.files[0]; 
        const reader = new FileReader(); 
        reader.onload = (e) => { 
            try { 
                const data = JSON.parse(e.target.result); 
                if (!data.settings || !data.users || !data.tickets || !data.transactions) throw new Error(); 
                this.showConfirmation('Restore Data', 'Ini akan menimpa semua data saat ini. Lanjutkan?', () => { 
                    localStorage.setItem('ticketSalesData', JSON.stringify(data)); 
                    this.addActivity('Restore sistem dari backup'); 
                    this.showToast('Sukses', 'Data berhasil direstore. Harap logout dan login kembali.', 'success'); 
                }); 
            } catch { 
                this.showToast('Error', 'File backup tidak valid atau rusak.', 'danger'); 
            } 
        }; 
        reader.readAsText(file); 
    }
    resetSystem() { 
        if (this.currentUser.role !== 'admin') return; 
        const password = document.getElementById('resetPassword').value; 
        if (this.hashPassword(password) !== this.currentUser.password) { 
            this.showToast('Error', 'Password admin salah.', 'danger'); 
            return; 
        } 
        this.showConfirmation('Reset Sistem', 'PERINGATAN: SEMUA DATA AKAN DIHAPUS. Tindakan ini tidak dapat diurungkan. Yakin?', () => { 
            localStorage.removeItem('ticketSalesData'); 
            this.showToast('Sukses', 'Sistem telah direset. Harap refresh halaman.', 'success'); 
            setTimeout(() => window.location.reload(), 2000); 
        }); 
    }
    deleteTicketsByStatus(status) { 
        if (this.currentUser.role !== 'admin') return; 
        const ticketsToDelete = this.tickets.filter(t => t.status === status); 
        if (ticketsToDelete.length === 0) { 
            this.showToast('Info', `Tidak ada tiket dengan status '${status}' untuk dihapus.`, 'info'); 
            return; 
        } 
        this.showConfirmation(`Hapus Tiket ${status === 'sold' ? 'Terjual' : 'Kedaluwarsa'}`, `Anda yakin ingin menghapus dan mengarsipkan ${ticketsToDelete.length} tiket? Tindakan ini tidak dapat dibatalkan.`, () => { 
            const now = new Date().toISOString(); 
            const logEntries = ticketsToDelete.map(ticket => ({ ...ticket, deletedAt: now, deletedBy: this.currentUser.username, statusAtDeletion: ticket.status })); 
            this.deletedTicketsLog.push(...logEntries); 
            this.tickets = this.tickets.filter(t => t.status !== status); 
            this.saveData(); 
            this.loadTicketStock(); 
            this.addActivity(`Hapus dan arsipkan ${ticketsToDelete.length} tiket ${status}`); 
            this.showToast('Sukses', `${ticketsToDelete.length} tiket berhasil dihapus dan diarsipkan.`, 'success'); 
        }); 
    }
    clearAllStock() { 
        if (this.currentUser.role !== 'admin') return; 
        this.showConfirmation('Hapus Semua Stok Tiket', 'Anda yakin ingin menghapus SEMUA tiket (tersedia, terjual, dll)? Tindakan ini tidak dapat dibatalkan dan tiket tidak diarsipkan.', () => { 
            this.tickets = []; 
            this.saveData(); 
            this.loadTicketStock(); 
            this.addActivity('Hapus semua stok tiket'); 
            this.showToast('Sukses', 'Semua stok tiket telah dihapus.', 'success'); 
        }); 
    }
    clearTransactions() { 
        if (this.currentUser.role !== 'admin') return; 
        this.showConfirmation('Hapus Riwayat Transaksi', 'Anda yakin ingin menghapus SEMUA riwayat transaksi?', () => { 
            this.transactions = []; 
            this.saveData(); 
            this.loadTransactions(); 
            this.addActivity('Hapus semua riwayat transaksi'); 
            this.showToast('Sukses', 'Semua riwayat transaksi telah dihapus.', 'success'); 
        }); 
    }
    clearStockFilters() { 
        document.getElementById('filterStatus').value = 'all'; 
        document.getElementById('filterType').value = 'all'; 
        document.getElementById('filterDate').value = ''; 
        document.getElementById('searchTicketInput').value = ''; 
        this.loadTicketStock(); 
    }
    viewTicket(ticketId) { 
        const ticket = this.tickets.find(t => t.id === ticketId); 
        if (!ticket) return; 
        const ticketHTML = this.generateTicketHTML(ticket); 
        document.getElementById('ticketModalContent').innerHTML = ticketHTML; 
        this.generateQRCodeForTicket(ticket); 
        const printBtn = document.getElementById('printTicketBtn'); 
        printBtn.replaceWith(printBtn.cloneNode(true)); 
        document.getElementById('printTicketBtn').addEventListener('click', () => { 
            bootstrap.Modal.getInstance(document.getElementById('viewTicketModal')).hide(); 
            this.printContent(`<div class="printable-ticket-wrapper">${ticketHTML}</div>`, `Tiket ${ticket.code}`); 
        }); 
        bootstrap.Modal.getOrCreateInstance(document.getElementById('viewTicketModal')).show(); 
    }
    searchAvailableTickets(query) { 
        const resultsContainer = document.getElementById('ticketSearchResults'); 
        resultsContainer.innerHTML = ''; 
        if (query.length < 2) { 
            resultsContainer.style.display = 'none'; 
            return; 
        } 
        const available = this.tickets.filter(t => t.status === 'available' && t.code.toLowerCase().includes(query.toLowerCase())); 
        if(available.length > 0) { 
            available.slice(0, 10).forEach(ticket => { 
                const item = document.createElement('div'); 
                item.className = 'search-result-item'; 
                item.innerHTML = `${ticket.code} <span class="badge bg-primary">${this.formatTicketType(ticket.type)}</span> <span class="float-end">${this.formatCurrency(ticket.price)}</span>`; 
                item.onclick = () => { 
                    this.addToCart(ticket.id); 
                    resultsContainer.style.display = 'none'; 
                    document.getElementById('salesTicketSearchInput').value = ''; 
                }; 
                resultsContainer.appendChild(item); 
            }); 
        } else { 
            resultsContainer.innerHTML = `<div class="search-result-item text-muted">Tidak ada tiket ditemukan</div>`; 
        } 
        resultsContainer.style.display = 'block'; 
    }
    generateReport() { 
        this.showLoading(); 
        let startDate, endDate; 
        if (document.getElementById('reportType').value === 'custom' || document.getElementById('reportType').value === 'deleted') { 
            startDate = new Date(document.getElementById('reportDateFrom').value); 
            startDate.setHours(0, 0, 0, 0); 
            endDate = new Date(document.getElementById('reportDateTo').value); 
            endDate.setHours(23, 59, 59, 999); 
        } else { 
            /* logic for other dates */ 
        } 
        if (document.getElementById('reportType').value === 'deleted') { 
            const deletedTickets = this.deletedTicketsLog.filter(t => new Date(t.deletedAt) >= startDate && new Date(t.deletedAt) <= endDate); 
            this.reportData = { 
                title: `Laporan Tiket Dihapus (${this.formatDate(startDate)} - ${this.formatDate(endDate)})`, 
                deletedTickets, 
                reportType: 'deleted' 
            }; 
            this.renderDeletedTicketsReport(this.reportData); 
            this.hideLoading(); 
            return; 
        } 
        const ticketType = document.getElementById('reportTicketType').value; 
        const user = document.getElementById('reportUser').value; 
        const paymentMethod = document.getElementById('reportPaymentMethod').value; 
        let filteredTransactions = this.transactions.filter(t => { 
            const transactionDate = new Date(t.date); 
            return transactionDate >= startDate && transactionDate <= endDate && (user === 'all' || t.cashier === user) && (paymentMethod === 'all' || t.paymentMethod === paymentMethod); 
        }); 
        let totalRevenue = 0, totalTickets = 0; 
        const ticketTypeCount = {}; 
        const finalTransactions = filteredTransactions.filter(t => ticketType === 'all' || t.items.some(item => item.type === ticketType)); 
        finalTransactions.forEach(t => { 
            totalRevenue += t.total; 
            t.items.forEach(item => { 
                totalTickets++; 
                ticketTypeCount[item.type] = (ticketTypeCount[item.type] || 0) + 1; 
            }); 
        }); 
        this.reportData = { 
            title: `Laporan Penjualan (${this.formatDate(startDate)} - ${this.formatDate(endDate)})`, 
            transactions: finalTransactions, 
            totalRevenue, 
            totalTickets, 
            ticketTypeCount, 
            reportType: document.getElementById('reportType').value 
        }; 
        this.renderReport(this.reportData); 
        this.hideLoading(); 
    }
    renderReport(data) { 
        const container = document.getElementById('reportResults'); 
        if (data.transactions.length === 0) { 
            container.innerHTML = `<div class="text-center text-muted py-5"><i class="fas fa-info-circle fa-3x mb-3"></i><p>Tidak ada data ditemukan.</p></div>`; 
            return; 
        } 
        let ticketTypeSummary = Object.keys(data.ticketTypeCount).map(type => `<li>${this.formatTicketType(type)}: <strong>${data.ticketTypeCount[type]} tiket</strong></li>`).join(''); 
        container.innerHTML = `<div id="report-content"><h4 class="mb-3">${data.title}</h4><div class="card p-3 mb-4 report-summary-card"><div class="row"><div class="col-md-4"><h5>Total Pendapatan</h5><h3>${this.formatCurrency(data.totalRevenue)}</h3></div><div class="col-md-4"><h5>Total Tiket Terjual</h5><h3>${data.totalTickets}</h3></div><div class="col-md-4"><h5>Rincian Tipe Tiket</h5><ul class="list-unstyled">${ticketTypeSummary}</ul></div></div></div><h5>Detail Transaksi</h5><div class="table-responsive"><table class="table table-sm table-striped"><thead><tr><th>ID Transaksi</th><th>Tanggal</th><th>Kasir</th><th>Jml Tiket</th><th>Total</th></tr></thead><tbody>${data.transactions.map(t => `<tr><td>${t.transactionId}</td><td>${this.formatDateTime(t.date)}</td><td>${t.cashier}</td><td>${t.items.length}</td><td>${this.formatCurrency(t.total)}</td></tr>`).join('')}</tbody></table></div></div>`; 
    }
    renderDeletedTicketsReport(data) { 
        const container = document.getElementById('reportResults'); 
        if (!data.deletedTickets || data.deletedTickets.length === 0) { 
            container.innerHTML = `<div class="text-center text-muted py-5"><i class="fas fa-info-circle fa-3x mb-3"></i><p>Tidak ada tiket yang dihapus ditemukan.</p></div>`; 
            return; 
        } 
        container.innerHTML = `<div id="report-content"><h4 class="mb-3">${data.title}</h4><div class="card p-3 mb-4 report-summary-card"><h5>Total Tiket Dihapus & Diarsipkan: ${data.deletedTickets.length}</h5></div><h5>Detail Tiket yang Dihapus</h5><div class="table-responsive"><table class="table table-sm table-striped"><thead><tr><th>Kode Tiket</th><th>Jenis</th><th>Harga</th><th>Status</th><th>Dihapus Pada</th><th>Dihapus Oleh</th></tr></thead><tbody>${data.deletedTickets.map(t => `<tr><td>${t.code}</td><td>${this.formatTicketType(t.type)}</td><td>${this.formatCurrency(t.price)}</td><td><span class="badge ${t.statusAtDeletion === 'sold' ? 'bg-danger' : 'bg-warning'}">${t.statusAtDeletion}</span></td><td>${this.formatDateTime(t.deletedAt)}</td><td>${t.deletedBy}</td></tr>`).join('')}</tbody></table></div></div>`; 
    }
    exportReportPDF() { 
        if (!this.reportData || (!this.reportData.transactions && !this.reportData.deletedTickets)) { 
            this.showToast('Peringatan', 'Generate laporan terlebih dahulu.', 'warning'); 
            return; 
        } 
        const { jsPDF } = window.jspdf; 
        const doc = new jsPDF(); 
        doc.setFontSize(18); 
        doc.text(this.settings.venueName || 'Laporan Aplikasi Sistik', 14, 22); 
        doc.setFontSize(12); 
        doc.text(this.reportData.title, 14, 30); 
        if (this.reportData.reportType === 'deleted') { 
            doc.setFontSize(11); 
            doc.text(`Total Tiket Dihapus: ${this.reportData.deletedTickets.length}`, 14, 45); 
            doc.autoTable({
                head: [["Kode", "Jenis", "Harga", "Status", "Dihapus Pada", "Dihapus Oleh"]],
                body: this.reportData.deletedTickets.map(t => [t.code, this.formatTicketType(t.type), this.formatCurrency(t.price), t.statusAtDeletion, this.formatDateTime(t.deletedAt), t.deletedBy]),
                startY: 55
            });
        } else { 
            doc.setFontSize(11); 
            doc.text(`Total Pendapatan: ${this.formatCurrency(this.reportData.totalRevenue)}`, 14, 45); 
            doc.text(`Total Tiket Terjual: ${this.reportData.totalTickets}`, 14, 52); 
            doc.autoTable({
                head: [["ID Transaksi", "Tanggal", "Kasir", "Jumlah Tiket", "Total"]],
                body: this.reportData.transactions.map(t => [t.transactionId, this.formatDateTime(t.date), t.cashier, t.items.length, this.formatCurrency(t.total)]),
                startY: 60
            });
        } 
        doc.save(`Laporan - ${new Date().toISOString().split('T')[0]}.pdf`); 
        this.addActivity('Export laporan ke PDF'); 
    }
    printReport() { 
        if (!this.reportData || (!this.reportData.transactions && !this.reportData.deletedTickets)) { 
            this.showToast('Peringatan', 'Generate laporan terlebih dahulu.', 'warning'); 
            return; 
        } 
        const reportContent = document.getElementById('report-content')?.innerHTML; 
        if(reportContent) this.printContent(reportContent, this.settings.venueName); 
    }
}
