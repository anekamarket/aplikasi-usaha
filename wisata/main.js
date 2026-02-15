// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Show login modal immediately
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'), {
        backdrop: 'static',
        keyboard: false
    });
    loginModal.show();
    
    // Initialize the app
    window.app = new TicketSalesApp();
    window.app.init();
});

// Main Application Class
class TicketSalesApp {
    constructor() {
        // Initialize properties
        this.currentUser = null;
        this.cart = [];
        this.salesChart = null; // To keep track of the sales chart instance
        this.reportData = {}; // To store generated report data
        this.pendingLogin = null; // To hold user data during captcha verification
        this.currentCaptcha = ''; // To hold the current captcha string

        // Initialize data if not exists
        this.initData();
        
        // Load data from localStorage
        this.loadData();
    }
    
    init() {
        // Initialize UI components
        this.initUI();
        
        // Check if user is logged in from session
        this.checkAuth();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load dashboard data if logged in
        if(this.currentUser) {
            this.loadDashboardData();
        }
    }
    
    initData() {
        // Initialize data structure if not exists in localStorage
        if (!localStorage.getItem('ticketSalesData')) {
            const initialData = {
                settings: {
                    venueName: 'KAMPUNGKERAPU',
                    venueLocation: 'Jl.Raya Gundil Desa klatakan Kecamatan Kendit, Situbondo - Jawa Timur',
                    venueDescription: 'Tempat wisata keluarga dengan berbagai wahana menarik',
                    venueLogo: 'https://raw.githubusercontent.com/LKS-88/wisata/refs/heads/main/logo-wisata.png',
                    venueWhatsapp: '0878-6561-4222',
                    venueWebsite: 'www.anekamarket.my.id',
                    venueEmail: 'admin@anekamarket.my.id',
                    currency: 'IDR',
                    dateFormat: 'DD-MM-YYYY',
                    timeFormat: '24',
                    enableTax: false,
                    taxRate: 10,
                    taxName: 'PPN',
                    enableReceiptFooter: true,
                    receiptFooterText: 'Terima Kasih Telah Berkunjung Di Wisata Kampung Kerapu Situbondo'
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
                        permissions: {} // Permissions for admin are always true
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
        // Load all data from localStorage
        const data = JSON.parse(localStorage.getItem('ticketSalesData'));
        
        this.settings = data.settings || {};
        this.users = data.users || [];
        this.tickets = data.tickets || [];
        this.transactions = data.transactions || [];
        this.activities = data.activities || [];
        this.deletedTicketsLog = data.deletedTicketsLog || [];
    }
    
    saveData() {
        // Save all data to localStorage
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
        // Initialize date pickers with current date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('ticketExpiry').min = today;
        document.getElementById('reportDate').value = today;
        document.getElementById('reportDateFrom').value = today;
        document.getElementById('reportDateTo').value = today;
        
        // Load settings into form
        this.loadSettingsIntoForm();
    }

    loadSettingsIntoForm() {
        // Load venue info
        document.getElementById('venueName').value = this.settings.venueName || '';
        document.getElementById('venueLocation').value = this.settings.venueLocation || '';
        document.getElementById('venueDescription').value = this.settings.venueDescription || '';
        document.getElementById('venueLogo').value = this.settings.venueLogo || '';
        document.getElementById('venueWhatsapp').value = this.settings.venueWhatsapp || '';
        document.getElementById('venueWebsite').value = this.settings.venueWebsite || '';
        document.getElementById('venueEmail').value = this.settings.venueEmail || '';

        // Load system settings
        document.getElementById('currency').value = this.settings.currency || 'IDR';
        document.getElementById('dateFormat').value = this.settings.dateFormat || 'DD-MM-YYYY';
        document.getElementById('timeFormat').value = this.settings.timeFormat || '24';
        document.getElementById('enableTax').checked = this.settings.enableTax || false;
        document.getElementById('taxRate').value = this.settings.taxRate || 10;
        document.getElementById('taxName').value = this.settings.taxName || 'PPN';
        document.getElementById('enableReceiptFooter').checked = this.settings.enableReceiptFooter !== false;
        document.getElementById('receiptFooterText').value = this.settings.receiptFooterText || 'Terima kasih telah berkunjung!';

        // Show/hide tax and footer settings based on current value
        document.getElementById('taxSettings').style.display = this.settings.enableTax ? 'block' : 'none';
        document.getElementById('receiptFooterSettings').style.display = this.settings.enableReceiptFooter !== false ? 'block' : 'none';
    }

    showSection(sectionId) {
        // == START: Cek Hak Akses ==
        if (this.currentUser.role !== 'admin' && this.currentUser.permissions && !this.currentUser.permissions[sectionId]) {
            this.showToast('Akses Ditolak', 'Anda tidak memiliki izin untuk mengakses menu ini.', 'danger');
            return;
        }
        // == END: Cek Hak Akses ==

        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('d-none');
        });

        // Show the selected section
        const sectionToShow = document.getElementById(sectionId);
        if(sectionToShow) {
            sectionToShow.classList.remove('d-none');
        }

        // Update active nav link
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const navLink = document.querySelector(`.sidebar .nav-link[data-section="${sectionId}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }

        // Load section-specific data
        switch(sectionId) {
            case 'dashboardSection':
                this.loadDashboardData();
                break;
            case 'stockTicketSection':
                this.loadTicketStock();
                break;
            case 'transactionsSection':
                this.loadTransactions();
                break;
            case 'usersSection':
                this.loadUsers();
                break;
            case 'salesSection':
                this.updateCart();
                break;
        }
    }

    checkAuth() {
        // Check if user is logged in
        const loggedInUser = sessionStorage.getItem('loggedInUser') || localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            this.currentUser = JSON.parse(loggedInUser);
            this.updateUIAfterLogin();
        }
    }

    updateUIAfterLogin() {
        // Update UI based on logged in user
        document.getElementById('currentUsername').textContent = this.currentUser.fullName || this.currentUser.username;

        // Show/hide restricted sections based on role
        const is_admin = this.currentUser.role === 'admin';
        document.querySelectorAll('.restricted-link, .restricted, .restricted-section').forEach(el => {
            if (is_admin) {
                el.classList.remove('restricted');
            } else {
                el.classList.add('restricted');
            }
        });
        
        // == START: Terapkan Hak Akses Menu ==
        const userPermissions = this.currentUser.permissions;
        document.querySelectorAll('.sidebar .nav-item').forEach(navItem => {
            const link = navItem.querySelector('.nav-link');
            if(link && link.dataset.section) {
                const sectionId = link.dataset.section;
                const isRestrictedForAdmin = navItem.classList.contains('restricted-link');

                if (is_admin) {
                     navItem.style.display = 'block';
                } else {
                    if (isRestrictedForAdmin) {
                        navItem.style.display = 'none';
                    } else {
                        if (userPermissions && userPermissions[sectionId]) {
                             navItem.style.display = 'block';
                        } else {
                             navItem.style.display = 'none';
                        }
                    }
                }
            }
        });
        // == END: Terapkan Hak Akses Menu ==

        // Hide login modal
        const loginModalEl = document.getElementById('loginModal');
        const loginModal = bootstrap.Modal.getInstance(loginModalEl);
        if (loginModal) {
            loginModal.hide();
        }

        // Populate user filters in dropdowns
        this.populateUserFilters();
    }

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    setupEventListeners() {
        // --- Event Delegation for main containers ---
        document.body.addEventListener('click', (e) => {
            const navLink = e.target.closest('.sidebar .nav-link');
            if (navLink && navLink.dataset.section) {
                e.preventDefault();
                this.showSection(navLink.dataset.section);
            }
            if (e.target.closest('#logoutBtn')) {
                e.preventDefault();
                this.handleLogout();
            }
            if (e.target.closest('#saveNewUserBtn')) this.addUser();
            if (e.target.closest('#saveEditUserBtn')) this.editUser();
            if (e.target.closest('#savePasswordBtn')) this.changePassword();
        });

        document.getElementById('loginForm').addEventListener('submit', (e) => { e.preventDefault(); this.handleLogin(); });
        document.getElementById('generateTicketForm').addEventListener('submit', (e) => { e.preventDefault(); this.generateTickets(); });
        document.getElementById('paymentForm').addEventListener('submit', (e) => { e.preventDefault(); this.completePayment(); });
        document.getElementById('venueInfoForm').addEventListener('submit', (e) => { e.preventDefault(); this.saveVenueInfo(); });
        document.getElementById('systemSettingsForm').addEventListener('submit', (e) => { e.preventDefault(); this.saveSystemSettings(); });

        document.getElementById('refreshDashboardBtn').addEventListener('click', (e) => this.handleDashboardRefresh(e.currentTarget));
        document.getElementById('refreshStockBtn').addEventListener('click', () => this.loadTicketStock());
        document.getElementById('refreshTransactionsBtn').addEventListener('click', () => this.loadTransactions());
        document.getElementById('refreshUsersBtn').addEventListener('click', () => this.loadUsers());
        document.getElementById('printAllGeneratedTicketsBtn').addEventListener('click', () => this.printAllGeneratedTickets());
        document.getElementById('addSelectedToCartBtn').addEventListener('click', () => this.addSelectedToCart());
        document.getElementById('cancelTransactionBtn').addEventListener('click', () => this.cancelTransaction());
        document.getElementById('createBackupBtn').addEventListener('click', () => this.createBackup());
        document.getElementById('restoreDataBtn').addEventListener('click', () => this.restoreData());
        document.getElementById('resetSystemBtn').addEventListener('click', () => this.resetSystem());
        document.getElementById('generateReportBtn').addEventListener('click', () => this.generateReport());
        document.getElementById('clearStockFilterBtn').addEventListener('click', () => this.clearStockFilters());
        document.getElementById('exportReportBtn').addEventListener('click', () => this.exportReportPDF());
        document.getElementById('printReportBtn').addEventListener('click', () => this.printReport());
        
        // == START: Event Listener untuk Proteksi Password Tambah Pengguna ==
        document.getElementById('addUserBtn').addEventListener('click', () => {
            this.promptForAdminPassword(() => {
                const addUserModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('addUserModal'));
                addUserModal.show();
            });
        });
        // == END: Event Listener untuk Proteksi Password Tambah Pengguna ==

        // == START: Event Listener untuk Hak Akses ==
        document.getElementById('newUserRole').addEventListener('change', (e) => {
            const permissionsContainer = document.getElementById('newUserPermissionsContainer');
            permissionsContainer.style.display = e.target.value === 'admin' ? 'none' : 'block';
        });
        
        document.getElementById('editUserRole').addEventListener('change', (e) => {
            const permissionsContainer = document.getElementById('editUserPermissionsContainer');
            permissionsContainer.style.display = e.target.value === 'admin' ? 'none' : 'block';
        });
        // == END: Event Listener untuk Hak Akses ==

        document.getElementById('stockTableBody').addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.view-ticket-btn');
            const addBtn = e.target.closest('.add-to-cart-btn');
            if(viewBtn) this.viewTicket(viewBtn.dataset.id);
            if(addBtn) this.addToCart(addBtn.dataset.id);
        });
        
        document.getElementById('cartTableBody').addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-from-cart-btn');
            if(removeBtn) this.removeFromCart(removeBtn.dataset.id);
        });
        
        document.getElementById('transactionsTableBody').addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.view-transaction-btn');
            if(viewBtn) this.viewTransaction(viewBtn.dataset.id);
        });
        
        document.getElementById('usersTableBody').addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-user-btn');
            const deleteBtn = e.target.closest('.delete-user-btn');
            // == START: Perbaikan Proteksi Password Edit Pengguna ==
            if(editBtn) {
                this.promptForAdminPassword(() => {
                    this.openEditUserModal(editBtn.dataset.id);
                });
            }
            // == END: Perbaikan Proteksi Password Edit Pengguna ==
            if(deleteBtn) this.deleteUser(deleteBtn.dataset.id);
        });

        document.getElementById('amountPaid').addEventListener('input', () => this.calculateChange());
        document.getElementById('salesTicketSearchInput').addEventListener('input', (e) => this.searchAvailableTickets(e.target.value));
        document.getElementById('searchTicketInput').addEventListener('input', (e) => this.loadTicketStock({ query: e.target.value }));
        document.getElementById('searchTransactionInput').addEventListener('input', (e) => this.loadTransactions({ query: e.target.value }));
        document.getElementById('searchUserInput').addEventListener('input', (e) => this.loadUsers({ query: e.target.value }));

        ['filterStatus', 'filterType', 'filterDate'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.loadTicketStock());
        });

        ['selectAllTickets', 'selectAllHeader'].forEach(id => {
             document.getElementById(id).addEventListener('change', (e) => this.toggleSelectAllTickets(e.target.checked));
        });

        document.getElementById('reportType').addEventListener('change', (e) => {
            const reportDateContainer = document.getElementById('reportDateContainer');
            const reportDateRangeContainer = document.getElementById('reportDateRangeContainer');
            const standardReportFilters = document.getElementById('standardReportFilters');

            // Reset visibility
            reportDateContainer.classList.remove('d-none');
            reportDateRangeContainer.classList.add('d-none');
            standardReportFilters.classList.remove('d-none');

            if (e.target.value === 'custom' || e.target.value === 'deleted') {
                reportDateContainer.classList.add('d-none');
                reportDateRangeContainer.classList.remove('d-none');
            }
            
            if (e.target.value === 'deleted') {
                standardReportFilters.classList.add('d-none');
            }
        });
        document.getElementById('enableTax').addEventListener('change', (e) => {
            document.getElementById('taxSettings').style.display = e.target.checked ? 'block' : 'none';
            this.updateCart(); // Recalculate cart total when tax is toggled
        });
        document.getElementById('enableReceiptFooter').addEventListener('change', (e) => {
            document.getElementById('receiptFooterSettings').style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('clearStockBtn').addEventListener('click', () => this.clearAllStock());
        document.getElementById('clearTransactionsBtn').addEventListener('click', () => this.clearTransactions());
        document.getElementById('deleteExpiredBtn').addEventListener('click', () => this.deleteExpiredTickets());
        document.getElementById('deleteSoldBtn').addEventListener('click', () => this.deleteSoldTickets());

        // == START: Event Listener untuk Notifikasi & Captcha ==
        document.getElementById('getPremiumBtn').addEventListener('click', this.handleGetPremium);
        document.getElementById('otherAppsBtn').addEventListener('click', () => window.open('https://www.anekamarket.my.id', '_blank'));
        document.getElementById('tryFreeBtn').addEventListener('click', () => this.showCaptchaModal());
        document.getElementById('captchaForm').addEventListener('submit', (e) => { e.preventDefault(); this.verifyCaptcha(); });
        document.getElementById('refreshCaptchaBtn').addEventListener('click', () => this.generateCaptcha());
        // == END: Event Listener untuk Notifikasi & Captcha ==
    }

    // --- FUNGSI BARU UNTUK ALUR LOGIN ---

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
        this.addActivity(`User ${user.username} logged in`);
        this.showToast('Login Berhasil', `Selamat datang, ${user.fullName || user.username}!`, 'success');
        this.showSection('dashboardSection');
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

            // Simpan data login sementara untuk digunakan setelah verifikasi captcha
            this.pendingLogin = { user, rememberMe }; 

            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (loginModal) loginModal.hide();

            // Cek apakah notifikasi sudah pernah ditampilkan
            if (!localStorage.getItem('hasSeenVentraAppNotice')) {
                const premiumModal = new bootstrap.Modal(document.getElementById('premiumNotificationModal'));
                premiumModal.show();
            } else {
                // Jika sudah, langsung masuk ke aplikasi
                this.proceedToApp(user, rememberMe);
            }
        } else {
            this.showToast('Login Gagal', 'Username atau password salah.', 'danger');
        }
    }

    handleGetPremium() {
        const phoneNumber = '6287865614222';
        const message = `Halo Admin, saya tertarik dengan Ventra App. Mohon informasinya mengenai cara untuk mendapatkan dan menikmati fitur versi premiumnya. Terima kasih.`;
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }

    showCaptchaModal() {
        const premiumModal = bootstrap.Modal.getInstance(document.getElementById('premiumNotificationModal'));
        if (premiumModal) premiumModal.hide();

        const captchaModal = new bootstrap.Modal(document.getElementById('captchaModal'));
        captchaModal.show();
        this.generateCaptcha();
        // Fokus pada input setelah modal muncul
        document.getElementById('captchaModal').addEventListener('shown.bs.modal', () => {
             document.getElementById('captchaInput').focus();
        });
    }

    generateCaptcha() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.currentCaptcha = captcha;
        document.getElementById('captcha-display').textContent = this.currentCaptcha;
    }

    verifyCaptcha() {
        const userInput = document.getElementById('captchaInput').value;
        if (userInput && userInput.toLowerCase() === this.currentCaptcha.toLowerCase()) {
            // Tandai bahwa pengguna telah melihat notifikasi dan menyelesaikan captcha
            localStorage.setItem('hasSeenVentraAppNotice', 'true');
            
            const captchaModal = bootstrap.Modal.getInstance(document.getElementById('captchaModal'));
            if(captchaModal) captchaModal.hide();

            // Lanjutkan ke aplikasi dengan data login yang tersimpan
            if (this.pendingLogin) {
                this.proceedToApp(this.pendingLogin.user, this.pendingLogin.rememberMe);
                this.pendingLogin = null; // Hapus data sementara
            }
        } else {
            this.showToast('Error', 'Kode Captcha salah. Coba lagi.', 'danger');
            document.getElementById('captchaInput').value = '';
            this.generateCaptcha();
        }
    }
    
    // --- AKHIR FUNGSI BARU UNTUK ALUR LOGIN ---

    handleLogout() {
        const user = this.currentUser;
        this.addActivity(`User ${user.username} logged out`);

        this.currentUser = null;
        this.pendingLogin = null;
        sessionStorage.removeItem('loggedInUser');
        localStorage.removeItem('loggedInUser');

        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
        
        document.getElementById('loginForm').reset();
        this.showToast('Logout Berhasil', 'Anda telah berhasil keluar.', 'info');
    }

    async generateTickets() {
        const type = document.getElementById('ticketType').value;
        const price = parseInt(document.getElementById('ticketPrice').value);
        const quantity = parseInt(document.getElementById('ticketQuantity').value);
        const prefix = document.getElementById('ticketPrefix').value.trim().toUpperCase() || 'VT';
        const expiry = document.getElementById('ticketExpiry').value;

        if (quantity < 1 || quantity > 1000) {
            this.showToast('Error', 'Jumlah tiket harus antara 1 dan 1000.', 'danger');
            return;
        }
        if (price < 1000) {
            this.showToast('Error', 'Harga tiket minimal Rp 1.000.', 'danger');
            return;
        }
        
        this.showLoading();
        await new Promise(resolve => setTimeout(resolve, 100));

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
                id: this.generateId(),
                code: code,
                type: type,
                price: price,
                status: 'available',
                generatedAt: now,
                generatedBy: this.currentUser.username,
                expiryDate: expiry || null,
                soldAt: null,
                transactionId: null
            };
            generatedTickets.push(ticket);
            this.tickets.push(ticket);
        }

        this.saveData();
        this.hideLoading();
        this.showGeneratedTickets(generatedTickets);
        this.addActivity(`Generated ${quantity} ${type} tickets`);
        this.showToast('Sukses', `${quantity} tiket berhasil digenerate.`, 'success');
        document.getElementById('generateTicketForm').reset();
    }

    showGeneratedTickets(tickets) {
        const container = document.getElementById('generatedTicketsContainer');
        container.innerHTML = ''; // Clear previous content

        // Create a wrapper for flex layout
        const wrapper = document.createElement('div');
        wrapper.className = 'printable-ticket-wrapper';

        tickets.forEach(ticket => {
            wrapper.innerHTML += this.generateTicketHTML(ticket);
        });

        container.appendChild(wrapper);
        
        // START: Generate QR Codes after HTML is in DOM
        tickets.forEach(ticket => {
            this.generateQRCodeForTicket(ticket);
        });
        // END: Generate QR Codes
        
        document.getElementById('generatedTicketsCard').style.display = 'block';
    }
    
    printAllGeneratedTickets() {
        const container = document.getElementById('generatedTicketsContainer');
        const ticketsHTML = container.querySelector('.printable-ticket-wrapper')?.innerHTML;
        
        if (!ticketsHTML || ticketsHTML.trim() === '') {
            this.showToast('Info', 'Tidak ada tiket untuk dicetak.', 'info');
            return;
        }

        const printableContent = `<div class="printable-ticket-wrapper">${ticketsHTML}</div>`;
        this.printContent(printableContent, 'Tiket Masuk');
    }

    loadTicketStock(options = {}) {
        const statusFilter = document.getElementById('filterStatus').value;
        const typeFilter = document.getElementById('filterType').value;
        const dateFilter = document.getElementById('filterDate').value;
        const query = options.query || '';

        let filteredTickets = [...this.tickets];
        if (statusFilter !== 'all') filteredTickets = filteredTickets.filter(t => t.status === statusFilter);
        if (typeFilter !== 'all') filteredTickets = filteredTickets.filter(t => t.type === typeFilter);
        if (dateFilter) filteredTickets = filteredTickets.filter(t => t.generatedAt.startsWith(dateFilter));
        if (query) filteredTickets = filteredTickets.filter(t => t.code.toLowerCase().includes(query.toLowerCase()));
        
        filteredTickets.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

        const tableBody = document.getElementById('stockTableBody');
        tableBody.innerHTML = '';
        if (filteredTickets.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center">Tidak ada data tiket ditemukan.</td></tr>`;
            return;
        }

        filteredTickets.forEach(ticket => {
            const statusConfig = {
                available: { badge: 'bg-success', text: 'Tersedia' },
                sold: { badge: 'bg-danger', text: 'Terjual' },
                expired: { badge: 'bg-warning', text: 'Kedaluwarsa' }
            };
            const {badge, text} = statusConfig[ticket.status] || {badge: 'bg-secondary', text: ticket.status};

            tableBody.insertAdjacentHTML('beforeend', `
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
            `);
        });
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
            this.cart.forEach(item => {
                tableBody.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td>${item.code}</td>
                        <td>${this.formatTicketType(item.type)}</td>
                        <td>${this.formatCurrency(item.price)}</td>
                        <td><button class="btn btn-sm btn-outline-danger remove-from-cart-btn" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button></td>
                    </tr>
                `);
            });
        }
        
        const subtotal = this.cart.reduce((sum, item) => sum + item.price, 0);
        let finalTotal = subtotal;

        if (this.settings.enableTax && this.settings.taxRate > 0) {
            const taxAmount = subtotal * (this.settings.taxRate / 100);
            finalTotal = subtotal + taxAmount;
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
            const taxAmount = subtotal * (this.settings.taxRate / 100);
            finalTotal = subtotal + taxAmount;
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
            finalTotal = subtotal + taxAmount;
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
            subtotal: subtotal,
            tax: taxAmount,
            taxInfo: { name: this.settings.taxName, rate: this.settings.taxRate },
            total: finalTotal,
            paymentMethod: document.getElementById('paymentMethod').value,
            amountPaid: amountPaid,
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
        this.addActivity(`Completed transaction ${transaction.transactionId}`);
        this.showToast('Sukses', 'Pembayaran berhasil.', 'success');
        this.viewTransaction(transaction.id);
    }

    cancelTransaction() {
        if (this.cart.length === 0) {
            this.showToast('Info', 'Keranjang sudah kosong.', 'info');
            return;
        }
        this.showConfirmation(
            'Batalkan Transaksi',
            'Apakah Anda yakin? Semua item di keranjang akan dihapus.',
            () => {
                this.cart = [];
                this.updateCart();
                document.getElementById('paymentForm').reset();
                this.showToast('Info', 'Transaksi dibatalkan.', 'info');
            }
        );
    }

    loadTransactions(options = {}) {
        const query = options.query || '';
        let filtered = [...this.transactions];
        if (query) {
            filtered = filtered.filter(t => t.transactionId.toLowerCase().includes(query.toLowerCase()));
        }
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const tableBody = document.getElementById('transactionsTableBody');
        tableBody.innerHTML = '';
        if(filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Tidak ada data transaksi.</td></tr>`;
            return;
        }
        filtered.forEach(t => {
            tableBody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td>${t.transactionId}</td>
                    <td>${this.formatDateTime(t.date)}</td>
                    <td>${t.cashier}</td>
                    <td>${t.items.length}</td>
                    <td>${this.formatCurrency(t.total)}</td>
                    <td>${this.formatPaymentMethod(t.paymentMethod)}</td>
                    <td><button class="btn btn-sm btn-outline-primary view-transaction-btn" data-id="${t.id}"><i class="fas fa-eye"></i> Lihat</button></td>
                </tr>
            `);
        });
    }

    viewTransaction(transactionId) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (!transaction) return;
        
        const receiptHTML = this.generateReceiptHTML(transaction);
        document.getElementById('transactionModalContent').innerHTML = receiptHTML;
        
        const modalEl = document.getElementById('viewTransactionModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        
        const printBtn = document.getElementById('printTransactionBtn');
        const newPrintBtn = printBtn.cloneNode(true);
        printBtn.parentNode.replaceChild(newPrintBtn, printBtn);
        newPrintBtn.addEventListener('click', () => {
            modal.hide();
            this.printContent(receiptHTML, `Struk Transaksi ${transaction.transactionId}`);
        });
        
        modal.show();
    }
    
    generateReceiptHTML(transaction) {
         // == START: PENYEMPURNAAN NAMA KASIR DI STRUK ==
         const cashierUser = this.users.find(u => u.username === transaction.cashier);
         const cashierName = cashierUser ? cashierUser.fullName : transaction.cashier;
         // == END: PENYEMPURNAAN NAMA KASIR DI STRUK ==

         const contactInfo = [
            this.settings.venueWhatsapp ? `WA: ${this.settings.venueWhatsapp}` : '',
            this.settings.venueWebsite ? `Web: ${this.settings.venueWebsite}` : '',
            this.settings.venueEmail ? `Email: ${this.settings.venueEmail}` : ''
        ].filter(Boolean).join(' | ');

         return `
            <div class="receipt-container">
                <div class="receipt-header">
                    <img src="${this.settings.venueLogo || ''}" class="receipt-logo" alt="Logo">
                    <p class="receipt-title">${this.settings.venueName || 'Ventra App'}</p>
                    <p class="receipt-subtitle">${this.settings.venueLocation || ''}</p>
                </div>
                <div class="receipt-divider"></div>
                <div class="receipt-details">
                    <p>No: ${transaction.transactionId}</p>
                    <p>Kasir: ${cashierName} (${transaction.cashier})</p>
                    <p>Tanggal: ${this.formatDateTime(transaction.date)}</p>
                    <p>Pelanggan: ${transaction.customerName}</p>
                </div>
                <div class="receipt-divider"></div>
                <table class="receipt-items">
                    <thead>
                        <tr>
                            <th class="col-item">Item</th>
                            <th class="col-qty">Jml</th>
                            <th class="col-price">Harga</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transaction.items.map(item => `
                            <tr>
                                <td class="col-item">${this.formatTicketType(item.type)} (${item.code})</td>
                                <td class="col-qty">1</td>
                                <td class="col-price">${this.formatCurrency(item.price)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="receipt-divider"></div>
                <table class="receipt-totals">
                    <tr>
                        <td class="label">Subtotal</td>
                        <td class="value">${this.formatCurrency(transaction.subtotal)}</td>
                    </tr>
                    ${(transaction.tax > 0 && transaction.taxInfo) ? `
                        <tr>
                            <td class="label">${transaction.taxInfo.name} (${transaction.taxInfo.rate}%)</td>
                            <td class="value">${this.formatCurrency(transaction.tax)}</td>
                        </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td class="label">Total</td>
                        <td class="value">${this.formatCurrency(transaction.total)}</td>
                    </tr>
                    <tr>
                        <td class="label">Bayar (${this.formatPaymentMethod(transaction.paymentMethod)})</td>
                        <td class="value">${this.formatCurrency(transaction.amountPaid)}</td>
                    </tr>
                    <tr>
                        <td class="label">Kembali</td>
                        <td class="value">${this.formatCurrency(transaction.change)}</td>
                    </tr>
                </table>
                ${this.settings.enableReceiptFooter ? `
                    <div class="receipt-divider"></div>
                    <div class="receipt-footer">
                        <p>${this.settings.receiptFooterText || ''}</p>
                        <p style="font-size: 0.7rem; margin-top: 5px;">${contactInfo}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    loadDashboardData() {
        const today = new Date().toISOString().split('T')[0];
        const todaySales = this.transactions.filter(t => t.date.startsWith(today));
        
        document.getElementById('stockCount').textContent = this.tickets.filter(t => t.status === 'available').length;
        document.getElementById('todaySalesCount').textContent = todaySales.reduce((sum, t) => sum + t.items.length, 0);
        document.getElementById('todayRevenue').textContent = this.formatCurrency(todaySales.reduce((sum, t) => sum + t.total, 0));

        this.loadRecentActivities();
        this.loadSalesChart();
    }
    
    handleDashboardRefresh(btn) {
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin me-1"></i>Memuat...`;
        
        setTimeout(() => {
            this.loadDashboardData();
            btn.disabled = false;
            btn.innerHTML = originalContent;
            this.showToast('Info', 'Dashboard telah diperbarui.', 'info');
        }, 500);
    }

    loadRecentActivities() {
        const container = document.getElementById('recentActivities');
        container.innerHTML = '';
        const recent = [...this.activities].reverse().slice(0, 5);
        if (recent.length === 0) {
            container.innerHTML = `<div class="list-group-item text-muted">Tidak ada aktivitas terakhir.</div>`;
            return;
        }
        recent.forEach(act => {
            container.insertAdjacentHTML('beforeend', `
                <div class="list-group-item">
                    <p class="mb-1">${act.message}</p>
                    <small class="text-muted">${this.timeSince(act.timestamp)}</small>
                </div>
            `);
        });
    }

    loadSalesChart() {
        if (this.salesChart) this.salesChart.destroy();
        
        const labels = [];
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateString = d.toISOString().split('T')[0];
            labels.push(this.formatDate(dateString));
            const dayRevenue = this.transactions
                .filter(t => t.date.startsWith(dateString))
                .reduce((sum, t) => sum + t.total, 0);
            data.push(dayRevenue);
        }

        this.salesChart = new Chart(document.getElementById('salesChart'), {
            type: 'line',
            data: { labels, datasets: [{
                label: 'Pendapatan Harian',
                data,
                backgroundColor: 'rgba(76, 110, 245, 0.1)',
                borderColor: 'rgba(76, 110, 245, 1)',
                borderWidth: 2, tension: 0.3, fill: true
            }]},
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    }

    loadUsers(options = {}) {
        if (this.currentUser.role !== 'admin') return;

        const query = options.query || '';
        let filtered = [...this.users];
        if (query) {
            const qLower = query.toLowerCase();
            filtered = filtered.filter(u => u.username.toLowerCase().includes(qLower) || u.fullName.toLowerCase().includes(qLower));
        }

        const tableBody = document.getElementById('usersTableBody');
        tableBody.innerHTML = '';
        filtered.forEach(user => {
            const statusBadge = user.status === 'active' ? 'bg-success' : 'bg-secondary';
            const isDefaultAdmin = user.username === 'admin';

            tableBody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.fullName}</td>
                    <td>${this.formatUserRole(user.role)}</td>
                    <td><span class="badge ${statusBadge}">${user.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td>
                    <td>${user.lastLogin ? this.formatDateTime(user.lastLogin) : 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-user-btn" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                        ${!isDefaultAdmin ? `<button class="btn btn-sm btn-outline-danger delete-user-btn" data-id="${user.id}"><i class="fas fa-trash-alt"></i></button>` : ''}
                    </td>
                </tr>
            `);
        });
    }

    populateUserFilters() {
        const userFilters = ['transactionFilterUser', 'reportUser'];
        userFilters.forEach(filterId => {
            const select = document.getElementById(filterId);
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
            this.showToast('Error', 'Semua field wajib diisi.', 'danger'); return;
        }
        if (password !== confirmPassword) {
            this.showToast('Error', 'Password dan konfirmasi tidak cocok.', 'danger'); return;
        }
        if (this.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            this.showToast('Error', 'Username sudah digunakan.', 'danger'); return;
        }

        // == START: Simpan Hak Akses ==
        const permissions = {};
        if (role !== 'admin') {
            document.querySelectorAll('#newUserPermissionsContainer .form-check-input').forEach(checkbox => {
                permissions[checkbox.value] = checkbox.checked;
            });
        }
        // == END: Simpan Hak Akses ==

        const newUser = {
            id: this.generateId(),
            username, password: this.hashPassword(password), fullName, role,
            status: 'active', lastLogin: null, createdAt: new Date().toISOString(),
            permissions // Add permissions object
        };
        this.users.push(newUser);
        this.saveData();
        bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
        document.getElementById('addUserForm').reset();
        this.loadUsers();
        this.addActivity(`Added new user: ${username}`);
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

        // == START: Muat dan Tampilkan Hak Akses ==
        const permissionsContainer = document.getElementById('editUserPermissionsContainer');
        permissionsContainer.style.display = user.role === 'admin' ? 'none' : 'block';
        
        document.querySelectorAll('#editUserPermissionsContainer .form-check-input').forEach(checkbox => {
            checkbox.checked = user.permissions && user.permissions[checkbox.value];
        });
        // == END: Muat dan Tampilkan Hak Akses ==

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
        
        // == START: Update Hak Akses ==
        const permissions = {};
        if (newRole !== 'admin') {
            document.querySelectorAll('#editUserPermissionsContainer .form-check-input').forEach(checkbox => {
                permissions[checkbox.value] = checkbox.checked;
            });
        }
        this.users[userIndex].permissions = permissions;
        // == END: Update Hak Akses ==

        const newPassword = document.getElementById('editUserPassword').value;
        if (newPassword) {
            this.users[userIndex].password = this.hashPassword(newPassword);
        }

        this.saveData();
        bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
        this.loadUsers();
        this.addActivity(`Updated user: ${this.users[userIndex].username}`);
        this.showToast('Sukses', 'Data pengguna berhasil diperbarui.', 'success');
    }

    deleteUser(userId) {
        if (this.currentUser.role !== 'admin') {
            this.showToast('Akses Ditolak', 'Hanya admin yang dapat menghapus pengguna.', 'danger');
            return;
        }
        const user = this.users.find(u => u.id === userId);
        if (!user || user.username === 'admin') {
            this.showToast('Error', 'Admin utama tidak dapat dihapus.', 'danger');
            return;
        }
        this.showConfirmation('Hapus Pengguna', `Anda yakin ingin menghapus pengguna "${user.username}"?`, () => {
            this.users = this.users.filter(u => u.id !== userId);
            this.saveData();
            this.loadUsers();
            this.addActivity(`Deleted user: ${user.username}`);
            this.showToast('Sukses', 'Pengguna berhasil dihapus.', 'success');
        });
    }

    changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (this.hashPassword(currentPassword) !== this.currentUser.password) {
            this.showToast('Error', 'Password saat ini salah.', 'danger'); return;
        }
        if (!newPassword || newPassword !== confirmNewPassword) {
            this.showToast('Error', 'Password baru dan konfirmasi tidak cocok.', 'danger'); return;
        }

        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        this.users[userIndex].password = this.hashPassword(newPassword);
        this.currentUser.password = this.users[userIndex].password;
        
        if (sessionStorage.getItem('loggedInUser')) sessionStorage.setItem('loggedInUser', JSON.stringify(this.currentUser));
        if (localStorage.getItem('loggedInUser')) localStorage.setItem('loggedInUser', JSON.stringify(this.currentUser));

        this.saveData();
        bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
        document.getElementById('changePasswordForm').reset();
        this.addActivity('User changed their password');
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
         this.addActivity('Updated venue information');
         this.showToast('Sukses', 'Informasi tempat wisata disimpan.', 'success');
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
        this.addActivity('Updated system settings');
        this.showToast('Sukses', 'Pengaturan sistem disimpan.', 'success');
    }

    createBackup() {
        if (this.currentUser.role !== 'admin') return;
        const fileName = document.getElementById('backupFileName').value || 'VentraApp_Backup';
        const dataStr = JSON.stringify(JSON.parse(localStorage.getItem('ticketSalesData')));
        
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.addActivity('Created a system backup');
        this.showToast('Sukses', 'Backup berhasil diunduh.', 'success');
    }

    restoreData() {
        if (this.currentUser.role !== 'admin') return;
        const fileInput = document.getElementById('restoreFile');
        if (!fileInput.files.length) {
            this.showToast('Error', 'Pilih file backup terlebih dahulu.', 'danger'); return;
        }
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.settings || !data.users || !data.tickets || !data.transactions) throw new Error();
                
                this.showConfirmation('Restore Data', 'Ini akan menimpa semua data saat ini. Lanjutkan?', () => {
                    localStorage.setItem('ticketSalesData', JSON.stringify(data));
                    this.addActivity('Restored system from backup');
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
            this.showToast('Error', 'Password admin salah.', 'danger'); return;
        }
        this.showConfirmation('Reset Sistem', 'PERINGATAN: SEMUA DATA AKAN DIHAPUS. Tindakan ini tidak dapat diurungkan. Yakin?', () => {
            localStorage.removeItem('ticketSalesData');
            this.showToast('Sukses', 'Sistem telah direset. Harap refresh halaman.', 'success');
            setTimeout(() => window.location.reload(), 2000);
        });
    }

    deleteExpiredTickets() {
        if (this.currentUser.role !== 'admin') return;
        this.deleteTicketsByStatus('expired');
    }

    deleteSoldTickets() {
        if (this.currentUser.role !== 'admin') return;
        this.deleteTicketsByStatus('sold');
    }

    deleteTicketsByStatus(status) {
        const ticketsToDelete = this.tickets.filter(t => t.status === status);
        if (ticketsToDelete.length === 0) {
            this.showToast('Info', `Tidak ada tiket dengan status '${status}' untuk dihapus.`, 'info');
            return;
        }

        this.showConfirmation(
            `Hapus Tiket ${status === 'sold' ? 'Terjual' : 'Kedaluwarsa'}`,
            `Anda yakin ingin menghapus dan mengarsipkan ${ticketsToDelete.length} tiket? Tindakan ini tidak dapat dibatalkan.`,
            () => {
                const now = new Date().toISOString();
                const logEntries = ticketsToDelete.map(ticket => ({
                    ...ticket,
                    deletedAt: now,
                    deletedBy: this.currentUser.username,
                    statusAtDeletion: ticket.status
                }));
                
                this.deletedTicketsLog.push(...logEntries);
                this.tickets = this.tickets.filter(t => t.status !== status);
                
                this.saveData();
                this.loadTicketStock();
                this.addActivity(`Deleted and archived ${ticketsToDelete.length} ${status} tickets`);
                this.showToast('Sukses', `${ticketsToDelete.length} tiket berhasil dihapus dan diarsipkan.`, 'success');
            }
        );
    }

    clearAllStock() {
        if (this.currentUser.role !== 'admin') return;
         this.showConfirmation('Hapus Semua Stok Tiket', 'Anda yakin ingin menghapus SEMUA tiket (tersedia, terjual, dll)? Tindakan ini tidak dapat dibatalkan dan tiket tidak diarsipkan.', () => {
            this.tickets = [];
            this.saveData();
            this.loadTicketStock();
            this.addActivity('Cleared all ticket stock');
            this.showToast('Sukses', 'Semua stok tiket telah dihapus.', 'success');
        });
    }

    clearTransactions() {
        if (this.currentUser.role !== 'admin') return;
         this.showConfirmation('Hapus Riwayat Transaksi', 'Anda yakin ingin menghapus SEMUA riwayat transaksi?', () => {
            this.transactions = [];
            this.saveData();
            this.loadTransactions();
            this.addActivity('Cleared all transaction history');
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

    showLoading() { document.getElementById('loadingOverlay').classList.add('show'); }
    hideLoading() { document.getElementById('loadingOverlay').classList.remove('show'); }

    generateId() { return Date.now().toString(36) + Math.random().toString(36).substring(2); }
    generateRandomString(length) {
        return [...Array(length)].map(() => (~~(Math.random()*36)).toString(36)).join('').toUpperCase();
    }

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
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', () => {
            onConfirm();
            modal.hide();
        }, { once: true });
        
        modal.show();
    }
    
    addActivity(message) {
        this.activities.push({
            id: this.generateId(),
            message: message,
            timestamp: new Date().toISOString(),
            user: this.currentUser ? this.currentUser.username : 'System'
        });
        if (this.activities.length > 100) this.activities.shift();
        this.saveData();
    }

    printContent(contentHTML, title) {
        const printable = document.getElementById('printable-content');
        printable.innerHTML = `<h3 class="text-center mb-4 no-print">${title}</h3>${contentHTML}`;
        setTimeout(() => {
            window.print();
            printable.innerHTML = '';
        }, 100);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    }
    formatDate(dateStr) { 
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        // Adjust for timezone offset to prevent date from shifting
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const correctedDate = new Date(date.getTime() + userTimezoneOffset);
        return correctedDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric'});
    }
    formatDateTime(dateStr) { return dateStr ? new Date(dateStr).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'; }
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
    
    formatTicketType(type) { return { regular: 'Regular', vip: 'VIP', family: 'Paket Keluarga', group: 'Grup' }[type] || type; }
    formatPaymentMethod(method) { return { cash: 'Tunai', debit: 'Kartu Debit', credit: 'Kartu Kredit', transfer: 'Transfer Bank', ewallet: 'E-Wallet' }[method] || method; }
    formatUserRole(role) { return { admin: 'Admin', cashier: 'Kasir', manager: 'Manager' }[role] || role; }

    // == START: Perbaikan Proteksi Password (Fungsi Baru) ==
    promptForAdminPassword(onSuccess) {
        if (this.currentUser.role !== 'admin') {
            this.showToast('Akses Ditolak', 'Fitur ini hanya untuk Administrator.', 'danger');
            return;
        }
        const password = prompt("Masukkan password admin untuk melanjutkan:");
        if (password === "LKS.1945") {
            onSuccess();
        } else if (password !== null) { // Hanya tampilkan error jika user salah input, bukan saat klik cancel
            this.showToast('Akses Ditolak', 'Password yang Anda masukkan salah.', 'danger');
        }
    }
    // == END: Perbaikan Proteksi Password (Fungsi Baru) ==
    
    // START: Fungsi baru untuk generate QR Code
    generateQRCodeForTicket(ticket) {
        // Timeout untuk memastikan elemen sudah ada di dalam DOM
        setTimeout(() => {
            const qrElement = document.getElementById(`qr-${ticket.id}`);
            if (qrElement) {
                qrElement.innerHTML = ''; // Hapus QR code sebelumnya jika ada
                new QRCode(qrElement, {
                    text: ticket.code,
                    width: 72, // Sekitar 18mm
                    height: 72,
                    correctLevel: QRCode.CorrectLevel.H // Toleransi error yang tinggi
                });
            }
        }, 0);
    }
    // END: Fungsi baru untuk generate QR Code
    
    // == START: FUNGSI DIPERBARUI - Perbaikan Tampilan Tiket Sesuai Desain Baru ==
    generateTicketHTML(ticket) {
        const expiryInfo = ticket.expiryDate ? `Berlaku s/d: <strong>${this.formatDate(ticket.expiryDate)}</strong>` : 'Berlaku Selamanya';
        const venueNameShort = this.settings.venueName.split(' ')[0];

        return `
            <div class="ticket-small-print">
                <div class="ticket-main">
                    <div class="header">
                        <img src="${this.settings.venueLogo}" alt="Logo" class="logo">
                        <div class="venue-info">
                            <div class="venue-name">${this.settings.venueName}</div>
                            <div class="venue-location">${this.settings.venueLocation}</div>
                        </div>
                    </div>
                    <div class="ticket-body">
                        <div class="ticket-details">
                            <p class="ticket-type">${this.formatTicketType(ticket.type).toUpperCase()}</p>
                            <p class="ticket-code">${ticket.code}</p>
                            <p class="ticket-expiry">${expiryInfo}</p>
                        </div>
                        <div class="ticket-qr" id="qr-${ticket.id}">
                            </div>
                        </div>
                    <div class="ticket-footer">
                        Dicetak: ${this.formatDateTime(ticket.generatedAt)} oleh ${ticket.generatedBy}
                    </div>
                </div>
                <div class="ticket-stub">
                    <div class="stub-venue">${venueNameShort}</div>
                    <div class="stub-details">
                        <div class="stub-type">${this.formatTicketType(ticket.type)}</div>
                        <div class="stub-code">${ticket.code}</div>
                        <div class="stub-price">${this.formatCurrency(ticket.price)}</div>
                    </div>
                    <div></div>
                </div>
            </div>
        `;
    }
    // == END: FUNGSI DIPERBARUI ==
    
    viewTicket(ticketId) {
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        const ticketHTML = this.generateTicketHTML(ticket);
        document.getElementById('ticketModalContent').innerHTML = ticketHTML;
        
        // START: Generate QR Code untuk modal view
        this.generateQRCodeForTicket(ticket);
        // END: Generate QR Code
        
        const printBtn = document.getElementById('printTicketBtn');
        const newPrintBtn = printBtn.cloneNode(true);
        printBtn.parentNode.replaceChild(newPrintBtn, printBtn);
        newPrintBtn.addEventListener('click', () => {
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
        
        const reportType = document.getElementById('reportType').value;
        let startDate, endDate;
        const now = new Date();
        
        if (reportType === 'custom' || reportType === 'deleted') {
            startDate = new Date(document.getElementById('reportDateFrom').value);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(document.getElementById('reportDateTo').value);
            endDate.setHours(23, 59, 59, 999);
        } else {
            switch (reportType) {
                case 'daily':
                    startDate = new Date(document.getElementById('reportDate').value);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(startDate);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                case 'weekly':
                    const day = now.getDay();
                    startDate = new Date(now.setDate(now.getDate() - day));
                    startDate.setHours(0,0,0,0);
                    endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + 6);
                    endDate.setHours(23,59,59,999);
                    break;
                case 'monthly':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    break;
                case 'yearly':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                    break;
            }
        }
        
        if (reportType === 'deleted') {
            const deletedTickets = this.deletedTicketsLog.filter(t => {
                const deletedDate = new Date(t.deletedAt);
                return deletedDate >= startDate && deletedDate <= endDate;
            });
            
            this.reportData = {
                title: `Laporan Tiket Dihapus (${this.formatDate(startDate)} - ${this.formatDate(endDate)})`,
                deletedTickets: deletedTickets.sort((a,b) => new Date(b.deletedAt) - new Date(a.deletedAt)),
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
            return transactionDate >= startDate && transactionDate <= endDate;
        });

        if (user !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.cashier === user);
        }
        if (paymentMethod !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => t.paymentMethod === paymentMethod);
        }

        let totalRevenue = 0;
        let totalTickets = 0;
        const ticketTypeCount = {};
        
        const finalTransactions = [];

        filteredTransactions.forEach(t => {
            let transactionContainsFilteredTicket = false;
            if (ticketType === 'all') {
                transactionContainsFilteredTicket = true;
            } else {
                if (t.items.some(item => item.type === ticketType)) {
                    transactionContainsFilteredTicket = true;
                }
            }

            if (transactionContainsFilteredTicket) {
                finalTransactions.push(t);
                totalRevenue += t.total;
                t.items.forEach(item => {
                    totalTickets++;
                    ticketTypeCount[item.type] = (ticketTypeCount[item.type] || 0) + 1;
                });
            }
        });

        this.reportData = {
            title: `Laporan Penjualan (${this.formatDate(startDate)} - ${this.formatDate(endDate)})`,
            transactions: finalTransactions,
            totalRevenue, totalTickets, ticketTypeCount,
            reportType: reportType
        };
        
        this.renderReport(this.reportData);
        this.hideLoading();
    }

    renderReport(data) {
        const container = document.getElementById('reportResults');
        if (data.transactions.length === 0) {
            container.innerHTML = `<div class="text-center text-muted py-5"><i class="fas fa-info-circle fa-3x mb-3"></i><p>Tidak ada data ditemukan untuk filter yang dipilih.</p></div>`;
            return;
        }

        let ticketTypeSummary = Object.keys(data.ticketTypeCount).map(type => 
            `<li>${this.formatTicketType(type)}: <strong>${data.ticketTypeCount[type]} tiket</strong></li>`
        ).join('');

        const reportHTML = `
            <div id="report-content">
                <h4 class="mb-3">${data.title}</h4>
                <div class="card p-3 mb-4 report-summary-card">
                    <div class="row">
                        <div class="col-md-4">
                            <h5>Total Pendapatan</h5>
                            <h3>${this.formatCurrency(data.totalRevenue)}</h3>
                        </div>
                        <div class="col-md-4">
                            <h5>Total Tiket Terjual</h5>
                            <h3>${data.totalTickets}</h3>
                        </div>
                        <div class="col-md-4">
                            <h5>Rincian Tipe Tiket</h5>
                            <ul class="list-unstyled">${ticketTypeSummary}</ul>
                        </div>
                    </div>
                </div>
                <h5>Detail Transaksi</h5>
                <div class="table-responsive">
                    <table class="table table-sm table-striped">
                        <thead>
                            <tr><th>ID Transaksi</th><th>Tanggal</th><th>Kasir</th><th>Jml Tiket</th><th>Total</th></tr>
                        </thead>
                        <tbody>
                            ${data.transactions.map(t => `
                                <tr>
                                    <td>${t.transactionId}</td>
                                    <td>${this.formatDateTime(t.date)}</td>
                                    <td>${t.cashier}</td>
                                    <td>${t.items.length}</td>
                                    <td>${this.formatCurrency(t.total)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        container.innerHTML = reportHTML;
    }

    renderDeletedTicketsReport(data) {
        const container = document.getElementById('reportResults');
        if (!data.deletedTickets || data.deletedTickets.length === 0) {
            container.innerHTML = `<div class="text-center text-muted py-5"><i class="fas fa-info-circle fa-3x mb-3"></i><p>Tidak ada data tiket yang dihapus ditemukan untuk filter yang dipilih.</p></div>`;
            return;
        }

        const reportHTML = `
            <div id="report-content">
                <h4 class="mb-3">${data.title}</h4>
                <div class="card p-3 mb-4 report-summary-card">
                    <h5>Total Tiket Dihapus & Diarsipkan: ${data.deletedTickets.length}</h5>
                </div>
                <h5>Detail Tiket yang Dihapus</h5>
                <div class="table-responsive">
                    <table class="table table-sm table-striped">
                        <thead>
                            <tr><th>Kode Tiket</th><th>Jenis</th><th>Harga</th><th>Status</th><th>Dihapus Pada</th><th>Dihapus Oleh</th></tr>
                        </thead>
                        <tbody>
                            ${data.deletedTickets.map(t => `
                                <tr>
                                    <td>${t.code}</td>
                                    <td>${this.formatTicketType(t.type)}</td>
                                    <td>${this.formatCurrency(t.price)}</td>
                                    <td><span class="badge ${t.statusAtDeletion === 'sold' ? 'bg-danger' : 'bg-warning'}">${t.statusAtDeletion}</span></td>
                                    <td>${this.formatDateTime(t.deletedAt)}</td>
                                    <td>${t.deletedBy}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        container.innerHTML = reportHTML;
    }

    exportReportPDF() {
        if (!this.reportData || (!this.reportData.transactions && !this.reportData.deletedTickets)) {
            this.showToast('Peringatan', 'Generate laporan terlebih dahulu sebelum export.', 'warning');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const data = this.reportData;
        
        doc.setFontSize(18);
        doc.text(this.settings.venueName || 'Laporan Ventra App', 14, 22);
        doc.setFontSize(12);
        doc.text(data.title, 14, 30);
        
        if (data.reportType === 'deleted') {
            doc.setFontSize(11);
            doc.text(`Total Tiket Dihapus: ${data.deletedTickets.length}`, 14, 45);
            
            const tableColumn = ["Kode", "Jenis", "Harga", "Status", "Dihapus Pada", "Dihapus Oleh"];
            const tableRows = [];

            data.deletedTickets.forEach(t => {
                tableRows.push([
                    t.code, this.formatTicketType(t.type), this.formatCurrency(t.price),
                    t.statusAtDeletion, this.formatDateTime(t.deletedAt), t.deletedBy
                ]);
            });
            doc.autoTable(tableColumn, tableRows, { startY: 55 });
        } else {
            doc.setFontSize(11);
            doc.text(`Total Pendapatan: ${this.formatCurrency(data.totalRevenue)}`, 14, 45);
            doc.text(`Total Tiket Terjual: ${data.totalTickets}`, 14, 52);
            
            const tableColumn = ["ID Transaksi", "Tanggal", "Kasir", "Jumlah Tiket", "Total"];
            const tableRows = [];

            data.transactions.forEach(t => {
                tableRows.push([
                    t.transactionId, this.formatDateTime(t.date), t.cashier,
                    t.items.length, this.formatCurrency(t.total)
                ]);
            });
            doc.autoTable(tableColumn, tableRows, { startY: 60 });
        }

        doc.save(`Laporan - ${new Date().toISOString().split('T')[0]}.pdf`);
        this.addActivity('Exported a report to PDF');
    }
    
    printReport() {
         if (!this.reportData || (!this.reportData.transactions && !this.reportData.deletedTickets)) {
            this.showToast('Peringatan', 'Generate laporan terlebih dahulu sebelum mencetak.', 'warning');
            return;
        }
        const reportContent = document.getElementById('report-content')?.innerHTML;
        if(reportContent) {
            this.printContent(reportContent, this.settings.venueName);
        }
    }
}
