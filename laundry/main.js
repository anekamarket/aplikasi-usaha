moment.locale('id');

// --- STORAGE & CONFIGURATION ---
const STORAGE_KEYS = {
    SERVICES: 'laundry_services', CATEGORIES: 'laundry_categories', ORDERS: 'laundry_orders',
    CUSTOMERS: 'laundry_customers', SETTINGS: 'laundry_settings', USERS: 'laundry_users',
    SHIFTS: 'laundry_shifts', EXPENSES: 'laundry_expenses', USER: 'laundry_user'
};
const ENCRYPTION_KEY = 'LenteraKarya-LaundryApp-2025';
const ORDER_STATUSES = {
    antrian: "Antrian", 'proses-cuci': "Proses Cuci", 'proses-kering': "Proses Kering",
    'proses-setrika': "Proses Setrika", 'siap-diambil': "Siap Diambil", selesai: "Selesai",
    diambil: "Sudah Diambil"
};
const PERMISSIONS = {
    'accessReports': 'Akses Laporan', 'accessSettings': 'Akses Pengaturan',
    'manageServices': 'Kelola Layanan', 'manageExpenses': 'Kelola Pengeluaran',
    'viewHistory': 'Lihat Histori Transaksi', 'accessControlPanel': 'Akses Panel Kontrol'
};

let services, categories, orders, customers, settings, users, shifts, expenses, currentUser, activeShift;
let newTransaction = { items: [], customerId: null, total: 0, note: '', dueDate: null };
let passwordPromptCallback = null;
let captchaCode = '';

// --- INITIALIZATION ---
function initializeData() {
    const defaultSettings = {
        storeName: 'L-K LAUNDRY', storeAddress: 'Jl. Pahlawan No. 1, Situbondo', storePhone: '081234567890',
        receiptTerms: 'Pakaian yang tidak diambil dalam 30 hari bukan tanggung jawab kami.',
        itemSecurityCode: CryptoJS.SHA256('1234').toString(),
        panelSecurityCode: CryptoJS.SHA256('LKS.1945').toString(),
        roles: {
            cashier: {
                accessReports: true, 
                accessSettings: true, 
                manageServices: true,
                manageExpenses: true, 
                viewHistory: true, 
                accessControlPanel: false
            }
        }
    };
    const defaultUsers = [
        { id: 'U001', username: 'admin', password: CryptoJS.SHA256('Admin.1945').toString(), name: 'Administrator', role: 'admin' },
        { id: 'U002', username: 'operator', password: CryptoJS.SHA256('Gratis12345').toString(), name: 'Operator', role: 'cashier' }
    ];

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES) || JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)).length === 0) {
        const defaultCategories = [
            { id: 'CAT' + Date.now(), name: 'Pakaian Kiloan' },
            { id: 'CAT' + (Date.now()+1), name: 'Barang Satuan' }
        ];
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCategories));
    }

    if (!localStorage.getItem(STORAGE_KEYS.SERVICES) || JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES)).length === 0) {
        const defaultServices = [
            { id: 'S' + Date.now(), name: 'Cuci Kering Setrika', category: 'Pakaian Kiloan', unit: 'Kg', price: 7000, duration: 2, durationUnit: 'hari', icon: 'fas fa-tshirt' },
            { id: 'S' + (Date.now()+1), name: 'Setrika Saja', category: 'Pakaian Kiloan', unit: 'Kg', price: 5000, duration: 1, durationUnit: 'hari', icon: 'fas fa-undo-alt' },
            { id: 'S' + (Date.now()+2), name: 'Cuci Kering Cepat', category: 'Pakaian Kiloan', unit: 'Kg', price: 12000, duration: 5, durationUnit: 'jam', icon: 'fas fa-shipping-fast' },
            { id: 'S' + (Date.now()+3), name: 'Selimut Tebal', category: 'Barang Satuan', unit: 'Pcs', price: 15000, duration: 3, durationUnit: 'hari', icon: 'fas fa-bed' },
            { id: 'S' + (Date.now()+4), name: 'Bed Cover', category: 'Barang Satuan', unit: 'Pcs', price: 25000, duration: 3, durationUnit: 'hari', icon: 'fas fa-bed' }
        ];
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(defaultServices));
    }

    Object.values(STORAGE_KEYS).forEach(key => {
        if (!localStorage.getItem(key) && key !== STORAGE_KEYS.USER) {
            localStorage.setItem(key, JSON.stringify([]));
        }
    });
}

function loadDataFromStorage() {
    services = JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES));
    categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES));
    orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS));
    customers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS));
    settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS));
    users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
    shifts = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIFTS));
    expenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES));
    currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
}

$(document).ready(function() {
    initializeData();
    loadDataFromStorage();
    
    $('#currentYear').text(new Date().getFullYear());
    
    if (currentUser) {
        $('#loggedInUser').text(currentUser.name);
        $('#loginModal').hide();
        $('#mainApp').show();
        initializeApp();
    } else {
        generateCaptcha();
    }
    
    // --- EVENT LISTENERS ---
    $('#loginForm').submit(handleLogin);
    $('#refreshCaptcha').click(generateCaptcha);
    $('#logoutBtn').click(handleLogout);
    $('.main-tab').click(function() { switchMainTab($(this).data('tab')); });
    $(document).on('click', '.service-card', addServiceToOrder);
    $(document).on('click', '.remove-order-item', function() { removeServiceFromOrder($(this).data('id')); });
    $(document).on('input', '.qty-input', updateTransactionSummary); 
    $('#orderNote, #customerSelect').on('change', updateTransactionSummary);
    $('#payUpfrontCheckbox').change(function() { $('#paymentMethodContainer').toggle(this.checked); });
    $('#newOrderForm').submit(saveOrder);

    $('#orderSearch, #statusFilter').on('input change', () => loadOrderManagement());
    $(document).on('click', '.update-status-btn', function() { openStatusUpdateModal($(this).data('id')); });
    $(document).on('click', '.process-payment-btn', function() { openPaymentModal($(this).data('id')); });
    $(document).on('click', '.print-nota-btn', function() { printNota($(this).data('id')); });
    $(document).on('click', '.mark-picked-up-btn', function() { markOrderAsPickedUp($(this).data('id')); });
    $(document).on('click', '#saveStatusUpdateBtn', saveStatusUpdate);
    $('#completePaymentBtn').click(completePayment);
    $('#paymentAmount').on('input', calculateChange);
    
    setupAdminButtonListeners();
    setupQuickActionMenu();

    $(document).on('submit', '#customerForm', saveCustomer);
    $('#addCustomerBtn').click(() => openCustomerModal(null, true));

    $('#shiftActionBtn').click(handleShiftAction);
    $('#generateReportBtn').click(generateReport);
    $('#printReceiptBtn').click(() => printElement('#receiptContent'));
    $('#downloadReceiptPdfBtn').click(downloadReceiptAsPdf);
    $('#viewPickedUpHistoryBtn').click(openPickedUpHistoryModal);
    
    $(document).on('click', '.smart-payment-btn', function() {
        const amount = $(this).data('amount');
        $('#paymentAmount').val(amount).trigger('input');
    });
    
    // Prevent body scroll when modal is active
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === "style") {
                const modalIsVisible = Array.from($('.modal')).some(modal => $(modal).css('display') === 'flex');
                $('body').toggleClass('modal-open', modalIsVisible);
            }
        });
    });
    $('.modal').each(function() {
        observer.observe(this, { attributes: true });
    });
});

function initializeApp() {
    updateCurrentDate();
    updateClock();
    setInterval(updateClock, 1000); // Real-time clock update
    updateStoreInfo();
    applyPermissions(); // Terapkan pembatasan UI berdasarkan role
    loadServices();
    loadCustomersForSelect();
    updateTransactionSummary();
    checkActiveShift();
    loadOrderManagement();
}

// --- AUTH, PERMISSIONS & UI ---
function generateCaptcha() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    captchaCode = result;
    $('#captchaText').text(captchaCode);
}

function checkPermission(permissionKey) {
    // Versi premium: semua pengguna memiliki akses penuh ke semua fitur
    return true;
}

function applyPermissions() {
    // Show/hide main tabs
    checkPermission('accessReports') ? $('[data-tab="reportsTab"]').show() : $('[data-tab="reportsTab"]').hide();
    checkPermission('accessSettings') ? $('[data-tab="settingsTab"]').show() : $('[data-tab="settingsTab"]').hide();
    
    // Disable buttons in settings tab based on permissions
    if ($('#settingsTab').length) {
        $('#addServiceBtn, #manageCategoriesBtn').prop('disabled', !checkPermission('manageServices'));
        $('#manageExpensesBtn').prop('disabled', !checkPermission('manageExpenses'));
        $('#historyBtn').prop('disabled', !checkPermission('viewHistory'));
        if(!checkPermission('accessControlPanel')) {
            $('#controlPanelBtn').closest('.admin-grid > button').hide();
            $('#resetDataBtn').closest('div').hide();
        } else {
            $('#controlPanelBtn').closest('.admin-grid > button').show();
             $('#resetDataBtn').closest('div').show();
        }
    }
     // Quick action menu permissions
    checkPermission('manageExpenses') ? $('#quickActionAddExpense').show() : $('#quickActionAddExpense').hide();
    checkPermission('manageServices') ? $('#quickActionAddService').show() : $('#quickActionAddService').hide();
    checkPermission('viewHistory') ? $('#quickActionHistory').show() : $('#quickActionHistory').hide();
    checkPermission('accessControlPanel') ? $('#quickActionControlPanel').show() : $('#quickActionControlPanel').hide();
}

function handleLogin(e) {
    e.preventDefault();
    const username = $('#username').val().trim();
    const password = $('#password').val().trim();
    const captchaInput = $('#captchaInput').val().trim();

    if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
        showToast('Captcha tidak sesuai', 'error');
        generateCaptcha();
        $('#captchaInput').val('');
        return;
    }

    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (user && CryptoJS.SHA256(password).toString() === user.password) {
        currentUser = user;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
        
        $('#loginModal').fadeOut(200, () => {
            $('#welcomeSplashModal').css('display', 'flex');
            setTimeout(() => {
                $('#welcomeSplashModal').fadeOut(400, () => {
                     $('#mainApp').fadeIn(500);
                     initializeApp();
                });
            }, 2500); // PENYEMPURNAAN: Durasi splash screen dikurangi menjadi 2.5 detik
        });

    } else {
        showToast('Username atau password internal salah', 'error');
        generateCaptcha();
    }
}

function handleLogout(e) {
    e.preventDefault();
    if (activeShift) {
        return showToast('Tutup shift kerja terlebih dahulu sebelum logout.', 'warning');
    }
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.USER);
    location.reload();
}

function switchMainTab(tabId) {
    $('.main-tab').removeClass('active');
    $(`[data-tab="${tabId}"]`).addClass('active');
    $('.main-tab-content').removeClass('active');
    $(`#${tabId}`).addClass('active');
    window.scrollTo(0, 0); // Gulir ke atas saat ganti tab
}

function updateClock() {
    $('#realTimeClock').text(moment().format('HH:mm:ss'));
}

function updateCurrentDate() { $('#currentDate').text(moment().format('dddd, D MMMM YYYY')); }
function updateStoreInfo() { $('#storeNameHeader').text(settings.storeName || 'L-K LAUNDRY'); }

// --- SERVICE & CATEGORY ---
function loadServices() {
    const $grid = $('#serviceGrid').empty();
    if(services.length === 0) return $grid.html('<div class="empty-state"><i class="fas fa-box-open"></i><p>Belum ada layanan. Tambahkan di menu Pengaturan.</p></div>');
    
    services.sort((a,b) => a.name.localeCompare(b.name)).forEach(service => {
        const icon = service.icon || 'fas fa-tshirt';
        $grid.append(`
            <div class="service-card" data-id="${service.id}">
                <div class="service-icon"><i class="${icon}"></i></div>
                <div class="service-name">${service.name}</div>
                <div class="service-price">${formatCurrency(service.price)} / ${service.unit}</div>
                <div class="service-duration"><i class="far fa-clock"></i> ${service.duration} ${service.durationUnit}</div>
            </div>
        `);
    });
}

function openServiceModal(service = null) {
    if (!checkPermission('manageServices')) return showToast('Anda tidak memiliki izin.', 'error');
    const modalHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">${service ? 'Edit' : 'Tambah'} Layanan</h3>
                <button type="button" class="modal-close">&times;</button>
            </div>
            <form id="serviceForm">
                <div class="modal-body">
                    <input type="hidden" id="serviceId" value="${service ? service.id : ''}">
                    <div class="form-group"><label class="form-label">Nama Layanan</label><input type="text" id="serviceName" class="form-control" required value="${service ? service.name : ''}"></div>
                    <div class="form-group"><label class="form-label">Kategori</label><select id="serviceCategory" class="form-control" required></select></div>
                    <div class="d-grid-2">
                        <div class="form-group"><label class="form-label">Satuan</label><select id="serviceUnit" class="form-control" required><option value="Kg">Kg</option><option value="Pcs">Pcs</option></select></div>
                        <div class="form-group"><label class="form-label">Harga per Satuan</label><input type="number" id="servicePrice" class="form-control" required min="0" value="${service ? service.price : ''}"></div>
                    </div>
                    <div class="d-grid-2">
                        <div class="form-group"><label class="form-label">Estimasi Selesai</label><input type="number" id="serviceDuration" class="form-control" required min="1" value="${service ? service.duration : '1'}"></div>
                        <div class="form-group"><label class="form-label">Satuan Waktu</label><select id="serviceDurationUnit" class="form-control" required><option value="hari">Hari</option><option value="jam">Jam</option></select></div>
                    </div>
                    <div class="form-group"><label class="form-label">Icon (Font Awesome)</label><input type="text" id="serviceIcon" class="form-control" placeholder="e.g. fas fa-tshirt" value="${service ? (service.icon || '') : ''}"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-warning modal-close-btn">Batal</button>
                    <button type="submit" class="btn btn-success">Simpan</button>
                </div>
            </form>
        </div>`;
    $('#serviceModal').html(modalHTML).css('display', 'flex');
    
    loadCategoriesForSelect('#serviceCategory');
    if (service) {
        $('#serviceCategory').val(service.category);
        $('#serviceUnit').val(service.unit);
        $('#serviceDurationUnit').val(service.durationUnit);
    }
}

function saveService(e) {
    e.preventDefault();
    const id = $('#serviceId').val();
    const serviceData = {
        id: id || 'S' + Date.now(),
        name: $('#serviceName').val().trim(), category: $('#serviceCategory').val(),
        unit: $('#serviceUnit').val(), price: parseFloat($('#servicePrice').val()),
        duration: parseInt($('#serviceDuration').val()), durationUnit: $('#serviceDurationUnit').val(),
        icon: $('#serviceIcon').val().trim()
    };

    if (!serviceData.name || !serviceData.price) return showToast('Nama dan Harga wajib diisi', 'error');

    if (id) {
        const serviceIndex = services.findIndex(s => s.id === id);
        if (serviceIndex > -1) services[serviceIndex] = serviceData;
    } else {
        services.unshift(serviceData);
    }
    saveData(STORAGE_KEYS.SERVICES, services);
    loadServices();
    $('#serviceModal').hide().empty();
    showToast('Layanan berhasil disimpan.', 'success');
}

// --- CUSTOMER MANAGEMENT ---
function loadCustomersForSelect() {
    const $select = $('#customerSelect').empty();
    $select.append('<option value="">-- Pelanggan Umum --</option>');
    customers.sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
        $select.append(`<option value="${c.id}">${c.name} - ${c.phone} (ID: ${c.id})</option>`);
    });
}

function openCustomerModal(customer = null, fromOrderPage = false) {
    const modalHTML = `
        <div class="modal-content">
            <div class="modal-header"><h3 class="modal-title">${customer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h3><button type="button" class="modal-close">&times;</button></div>
            <form id="customerForm">
                <div class="modal-body">
                    <input type="hidden" id="customerId" value="${customer ? customer.id : ''}">
                    ${customer ? `<p><strong>ID Pelanggan:</strong> ${customer.id}</p>` : ''}
                    <div class="form-group"><label class="form-label">Nama</label><input type="text" id="customerName" class="form-control" required value="${customer ? customer.name : ''}"></div>
                    <div class="form-group"><label class="form-label">No. Telepon/WA</label><input type="tel" id="customerPhone" class="form-control" required value="${customer ? customer.phone : ''}"></div>
                    <div class="form-group"><label class="form-label">Alamat</label><textarea id="customerAddress" class="form-control">${customer ? (customer.address || '') : ''}</textarea></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-warning modal-close-btn">Batal</button>
                    <button type="submit" class="btn btn-success">Simpan</button>
                </div>
            </form>
        </div>`;
    const targetModal = fromOrderPage ? '#customerModal' : '#manageCustomersModal';
    $(targetModal).html(modalHTML).css('display', 'flex');
}

function saveCustomer(e) {
    e.preventDefault();
    const id = $('#customerId').val();
    const customerData = {
        id: id || 'C' + Date.now(),
        name: $('#customerName').val().trim(), phone: $('#customerPhone').val().trim(),
        address: $('#customerAddress').val().trim()
    };
    if (!customerData.name || !customerData.phone) {
        showToast('Nama dan Telepon wajib diisi.', 'error');
        return;
    }
    if (id) {
        const custIndex = customers.findIndex(c => c.id === id);
        if(custIndex > -1) customers[custIndex] = customerData;
    } else {
        customers.unshift(customerData);
    }
    saveData(STORAGE_KEYS.CUSTOMERS, customers);
    
    showToast('Pelanggan berhasil disimpan.', 'success');
    
    if ($('#manageCustomersModal').is(':visible')) {
        openManageCustomersModal();
    } else {
        $('#customerModal').hide().empty();
    }

    loadCustomersForSelect();
    if(!id) $('#customerSelect').val(customerData.id).trigger('change');
}

// --- NEW TRANSACTION & ORDER MANAGEMENT ---
function addServiceToOrder() {
    if (!activeShift) return showToast('Mulai shift kerja terlebih dahulu.', 'warning');
    const serviceId = $(this).data('id');
    const service = services.find(s => s.id === serviceId);
    if (newTransaction.items.some(item => item.service.id === serviceId)) {
        return showToast('Layanan sudah ada di order.', 'info');
    }
    newTransaction.items.push({ service: service, quantity: 1 });
    updateTransactionSummary();
}

function removeServiceFromOrder(serviceId) {
    newTransaction.items = newTransaction.items.filter(item => item.service.id !== serviceId);
    // Also remove the element from DOM
    $(`.remove-order-item[data-id="${serviceId}"]`).closest('.order-item').remove();
    updateTransactionSummary();
}

function updateTransactionSummary() {
    const $orderItems = $('#orderItems');
    let total = 0;
    let maxDurationInHours = 0;

    if (newTransaction.items.length === 0) {
         $orderItems.html('<div class="empty-state"><i class="fas fa-file-invoice"></i><p>Pilih layanan untuk memulai</p></div>');
    } else {
        if ($orderItems.find('.empty-state').length > 0) $orderItems.empty();
        
        newTransaction.items.forEach(item => {
            if ($(`#qty-${item.service.id}`).length === 0) {
                 $orderItems.append(`
                    <div class="order-item">
                        <div class="order-item-details">
                            <div class="order-item-name">${item.service.name}</div>
                            <div class="order-item-input">
                                <input type="number" step="0.01" class="qty-input" id="qty-${item.service.id}" value="${item.quantity}" min="0.1">
                                <span class="unit-label">${item.service.unit}</span>
                            </div>
                        </div>
                        <i class="fas fa-trash remove-order-item" data-id="${item.service.id}" style="cursor:pointer; color: var(--danger);"></i>
                    </div>`);
            }
        });
    }

    newTransaction.items.forEach(item => {
        const quantity = parseFloat($(`#qty-${item.service.id}`).val()) || 0;
        item.quantity = quantity;
        total += item.service.price * quantity;
        const durationInHours = item.service.durationUnit === 'hari' ? item.service.duration * 24 : item.service.duration;
        if (durationInHours > maxDurationInHours) maxDurationInHours = durationInHours;
    });
    
    newTransaction.total = total;
    newTransaction.customerId = $('#customerSelect').val();
    newTransaction.note = $('#orderNote').val();

    const dueDate = maxDurationInHours > 0 ? moment().add(maxDurationInHours, 'hours') : null;
    newTransaction.dueDate = dueDate ? dueDate.toISOString() : null;
    
    $('#orderItemCount').text(`(${newTransaction.items.length} item)`);
    $('#orderTotal').text(formatCurrency(total));
    $('#orderDueDate').text(dueDate ? dueDate.format('ddd, D MMM YYYY, HH:mm') : '-');
}

function saveOrder(e) {
    e.preventDefault();
    updateTransactionSummary(); // Ensure quantities are up-to-date
    if (newTransaction.items.length === 0 || newTransaction.total <= 0) {
        return showToast('Pilih layanan dan isi kuantitas dengan benar.', 'error');
    }
    
    const payUpfront = $('#payUpfrontCheckbox').is(':checked');

    const newOrder = {
        id: 'ORD' + Date.now(), date: new Date().toISOString(), ...newTransaction,
        status: 'antrian',
        paymentStatus: payUpfront ? 'lunas' : 'belum-lunas',
        paidAmount: payUpfront ? newTransaction.total : 0,
        paymentMethod: payUpfront ? $('#newOrderPaymentMethod').val() : null,
        operator: { id: currentUser.id, name: currentUser.name },
        shiftId: activeShift ? activeShift.id : null,
        pickedUpAt: null
    };

    orders.unshift(newOrder);
    saveData(STORAGE_KEYS.ORDERS, orders);
    showToast(`Order ${newOrder.id} berhasil disimpan`, 'success');
    printNota(newOrder.id);
    resetNewTransaction();
    loadOrderManagement();
}

function resetNewTransaction() {
    newTransaction = { items: [], customerId: null, total: 0, note: '', dueDate: null };
    $('#newOrderForm')[0].reset();
    $('#customerSelect').val('');
    $('#payUpfrontCheckbox').prop('checked', false).trigger('change');
    updateTransactionSummary();
}

function loadOrderManagement() {
    const $list = $('#orderManagementList').empty();
    const searchTerm = $('#orderSearch').val().toLowerCase();
    const statusFilter = $('#statusFilter').val();

    let filteredOrders = orders.filter(o => o.status !== 'selesai' && o.status !== 'diambil');

    if (searchTerm) {
        filteredOrders = filteredOrders.filter(o => {
            const customer = customers.find(c => c.id === o.customerId);
            return o.id.toLowerCase().includes(searchTerm) || (customer && customer.name.toLowerCase().includes(searchTerm));
        });
    }
    if (statusFilter !== 'all') {
         if (statusFilter === 'proses') {
            filteredOrders = filteredOrders.filter(o => ['proses-cuci', 'proses-kering', 'proses-setrika'].includes(o.status));
        } else {
            filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
        }
    }
    
    if (filteredOrders.length === 0) return $list.html('<div class="empty-state"><i class="fas fa-check-circle"></i><p>Tidak ada order aktif.</p></div>');

    filteredOrders.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(order => {
        const customer = customers.find(c => c.id === order.customerId);
        const paymentStatusClass = order.paymentStatus === 'lunas' ? 'status-lunas' : 'status-belum-lunas';
        const canBePickedUp = order.status === 'siap-diambil' && order.paymentStatus === 'lunas';
        
        $list.append(`
            <div class="order-card">
                <div class="order-card-header">
                    <div>
                        <div class="order-customer-name">${customer ? customer.name : 'Pelanggan Umum'}</div>
                        <div class="order-id">${order.id}</div>
                    </div>
                    <div class="text-center">
                        <span class="order-status-badge status-${order.status} update-status-btn" data-id="${order.id}">${ORDER_STATUSES[order.status]}</span>
                        <div class="mt-2"><span class="payment-status-badge ${paymentStatusClass}">${order.paymentStatus.replace('-', ' ')}</span></div>
                    </div>
                </div>
                <div class="order-card-body">
                    <div><strong>Masuk:</strong> ${moment(order.date).format('D MMM, HH:mm')}</div>
                    <div><strong>Selesai:</strong> ${order.dueDate ? moment(order.dueDate).format('D MMM, HH:mm') : '-'}</div>
                    <div style="grid-column: 1 / -1;"><strong>Total:</strong> ${formatCurrency(order.total)}</div>
                </div>
                <div class="order-card-footer">
                    ${canBePickedUp ? `<button class="btn btn-sm btn-dark mark-picked-up-btn" data-id="${order.id}"><i class="fas fa-check-double"></i> Tandai Diambil</button>` : ''}
                    ${order.paymentStatus !== 'lunas' ? `<button class="btn btn-sm btn-success process-payment-btn" data-id="${order.id}"><i class="fas fa-dollar-sign"></i> Bayar</button>` : ''}
                    <button class="btn btn-sm btn-info print-nota-btn" data-id="${order.id}"><i class="fas fa-print"></i> Cetak Ulang</button>
                </div>
            </div>
        `);
    });
}

function openStatusUpdateModal(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let options = '';
    for (const key in ORDER_STATUSES) {
        if(key !== 'diambil') { // Status 'diambil' tidak bisa dipilih manual
            options += `<option value="${key}">${ORDER_STATUSES[key]}</option>`;
        }
    }
    
    $('#statusUpdateOrderId').val(orderId);
    $('#statusUpdateOrderIdLabel').text(orderId);
    $('#newStatusSelect').html(options).val(order.status);
    $('#statusUpdateModal').css('display', 'flex');
}

function saveStatusUpdate() {
    const orderId = $('#statusUpdateOrderId').val();
    const newStatus = $('#newStatusSelect').val();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex > -1) {
        if ((newStatus === 'selesai' || newStatus === 'diambil') && orders[orderIndex].paymentStatus !== 'lunas') {
            return showToast('Order harus lunas sebelum ditandai selesai/diambil.', 'warning');
        }
        orders[orderIndex].status = newStatus;
        saveData(STORAGE_KEYS.ORDERS, orders);
        loadOrderManagement();
        $('#statusUpdateModal').hide();
        showToast('Status order berhasil diperbarui.', 'success');
    }
}

function markOrderAsPickedUp(orderId) {
    showConfirmation('Konfirmasi Pengambilan', 'Anda yakin ingin menandai order ini sudah diambil oleh pelanggan?', () => {
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex > -1) {
            orders[orderIndex].status = 'diambil';
            orders[orderIndex].pickedUpAt = new Date().toISOString();
            saveData(STORAGE_KEYS.ORDERS, orders);
            loadOrderManagement();
            showToast('Order telah ditandai sebagai "Sudah Diambil".', 'success');
        }
    });
}

// --- PAYMENT ---
function getSuggestedPayments(amount) {
    const suggestions = new Set(); // Gunakan Set untuk menghindari duplikat
    const denominations = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
    
    // Sarankan denominasi tertinggi berikutnya
    for (const denom of denominations) {
        if (denom >= amount) {
            suggestions.add(denom);
        }
    }
    
    // Jika jumlahnya kecil, sarankan lebih banyak opsi
    if(amount < 10000) suggestions.add(10000);
    if(amount < 20000) suggestions.add(20000);
    if(amount < 50000) suggestions.add(50000);

    // Kembalikan saran yang diurutkan, terbatas pada beberapa opsi
    return Array.from(suggestions).sort((a,b) => a-b).slice(0, 4);
}

function openPaymentModal(orderId) {
    const order = orders.find(o => o.id === orderId);
    if(!order) return;
    
    const remaining = order.total - (order.paidAmount || 0);
    $('#paymentOrderId').val(orderId);
    $('#paymentTotal').text(formatCurrency(remaining));
    $('#paymentAmount').val(remaining).attr('min', 0);
    $('#changeContainer').hide();

    // Logika Tombol Pembayaran Cerdas
    const $smartContainer = $('#smartPaymentContainer').empty();
    if ($('#paymentMethod').val() === 'cash') {
        const suggestions = getSuggestedPayments(remaining);
        if (suggestions.length > 0) {
             $smartContainer.append('<label class="form-label" style="width:100%; text-align:center; margin-bottom: 5px;">Uang Pas:</label>');
        }
        suggestions.forEach(value => {
            $smartContainer.append(`<button class="btn btn-sm smart-payment-btn" data-amount="${value}">${formatCurrency(value, '')}</button>`);
        });
    }

    $('#paymentModal').css('display', 'flex');
}


function completePayment() {
    const orderId = $('#paymentOrderId').val();
    const amount = parseFloat($('#paymentAmount').val());
    const method = $('#paymentMethod').val();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if(orderIndex === -1) return;
    
    const order = orders[orderIndex];
    const remaining = order.total - (order.paidAmount || 0);
    if (isNaN(amount) || amount < remaining) return showToast('Jumlah pembayaran kurang', 'error');
    
    order.paidAmount = order.total;
    order.paymentStatus = 'lunas';
    order.paymentMethod = method;
    
    saveData(STORAGE_KEYS.ORDERS, orders);
    loadOrderManagement();
    $('#paymentModal').hide();
    showToast('Pembayaran berhasil.', 'success');
}

function calculateChange() {
    const orderId = $('#paymentOrderId').val();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const remaining = order.total - (order.paidAmount || 0);
    const amount = parseFloat($('#paymentAmount').val()) || 0;
    const change = amount - remaining;

    $('#changeContainer').toggle(change >= 0);
    $('#paymentChange').text(formatCurrency(change));
}

// --- PRINTING & PDF ---
function printNota(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return showToast('Order tidak ditemukan', 'error');
    
    const customer = customers.find(c => c.id === order.customerId);
    let itemsHTML = '';
    order.items.forEach(item => {
        itemsHTML += `
            <div class="receipt-item">
                <div class="item-name">${item.service.name}</div>
                <div class="item-details">
                    <span>${item.quantity} ${item.service.unit} x ${formatCurrency(item.service.price, '')}</span>
                    <span>${formatCurrency(item.quantity * item.service.price, '')}</span>
                </div>
            </div>
        `;
    });
    
    const receiptHTML = `
        <div id="receiptContent">
            <div class="receipt-header">
                <div class="receipt-title">${settings.storeName}</div>
                <div>${settings.storeAddress}</div>
                <div>Telp: ${settings.storePhone}</div>
            </div>
            <div class="receipt-info">
                <div class="info-row"><span>Nota</span> <span>: ${order.id}</span></div>
                <div class="info-row"><span>Tanggal</span> <span>: ${moment(order.date).format('DD/MM/YY HH:mm')}</span></div>
                <div class="info-row"><span>Selesai</span> <span>: ${order.dueDate ? moment(order.dueDate).format('DD/MM/YY HH:mm') : '-'}</span></div>
                <div class="info-row"><span>Operator</span> <span>: ${order.operator.name}</span></div>
                <div class="info-row"><span>Pelanggan</span> <span>: ${customer ? `${customer.name} (ID: ${customer.id})` : 'Umum'}</span></div>
            </div>
            <div id="receiptItemsContainer">${itemsHTML}</div>
            <div class="receipt-total">
                <div class="total-row-item"><span>TOTAL</span> <span>${formatCurrency(order.total)}</span></div>
            </div>
            <div class="payment-status-nota">
                STATUS: ${order.paymentStatus.toUpperCase().replace('-', ' ')}
            </div>
            <div class="receipt-footer">
                <div class="receipt-terms">${settings.receiptTerms}</div>
                <p style="margin-top: 10px;">Terima Kasih</p>
            </div>
        </div>`;

    $('#receiptModalBody').html(receiptHTML);
    $('#receiptModal').css('display', 'flex');
}

function downloadReceiptAsPdf() {
    const element = document.getElementById('receiptContent');
    const orderId = $('#receiptModalBody').find('.info-row:first-child span:last-child').text().replace(': ', '');
    const opt = {
        margin: 5,
        filename: `Nota-${orderId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' } 
    };
    html2pdf().from(element).set(opt).save();
}

// --- EXPENSE MANAGEMENT ---
function openExpenseModal() {
    if (!checkPermission('manageExpenses')) return showToast('Anda tidak memiliki izin.', 'error');
    const modalHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header"><h3 class="modal-title">Manajemen Pengeluaran</h3><button class="modal-close">&times;</button></div>
            <div class="modal-body" style="padding:0 16px 16px 16px">
                <div class="tabs">
                    <div class="tab active" data-tab="addExpenseTab">Tambah Pengeluaran</div>
                    <div class="tab" data-tab="listExpenseTab">Daftar Pengeluaran</div>
                </div>
                <div class="tab-content active" id="addExpenseTab">
                    <form id="expenseForm">
                        <div class="form-group"><label class="form-label">Nama Pengeluaran</label><input type="text" id="expenseName" class="form-control" required></div>
                        <div class="form-group"><label class="form-label">Jumlah (Rp)</label><input type="number" id="expenseAmount" class="form-control" required></div>
                        <div class="form-group"><label class="form-label">Catatan</label><textarea id="expenseNotes" class="form-control"></textarea></div>
                        <button type="submit" class="btn btn-success">Simpan</button>
                    </form>
                </div>
                <div class="tab-content" id="listExpenseTab"><div id="expenseListContainer" class="data-table-wrapper" style="max-height: 50vh; overflow-y: auto;"></div></div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-warning modal-close-btn">Tutup</button></div>
        </div>`;
    $('#expenseModal').html(modalHTML).css('display', 'flex');
    loadExpenses();
}

function saveExpense(e) {
    e.preventDefault();
    const expense = {
        id: 'EXP' + Date.now(), date: new Date().toISOString(),
        name: $('#expenseName').val(), amount: parseFloat($('#expenseAmount').val()), notes: $('#expenseNotes').val()
    };
    if (!expense.name || !expense.amount) return showToast('Nama dan Jumlah wajib diisi', 'error');
    expenses.unshift(expense);
    saveData(STORAGE_KEYS.EXPENSES, expenses);
    showToast('Pengeluaran berhasil disimpan', 'success');
    $('#expenseForm')[0].reset();
    loadExpenses();
}

function loadExpenses() {
    const $list = $('#expenseListContainer').empty();
    if (expenses.length === 0) return $list.html('<div class="empty-state"><p>Belum ada pengeluaran tercatat.</p></div>');
    const table = $('<table class="data-table"><thead><tr><th>Tanggal</th><th>Nama</th><th>Jumlah</th><th>Aksi</th></tr></thead></table>');
    const tbody = $('<tbody></tbody>');
    expenses.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(exp => {
        tbody.append(`
            <tr>
                <td>${moment(exp.date).format('DD/MM/YY')}</td>
                <td>${exp.name}</td>
                <td>${formatCurrency(exp.amount)}</td>
                <td><button class="btn btn-sm btn-danger delete-expense" data-id="${exp.id}"><i class="fas fa-trash"></i></button></td>
            </tr>`);
    });
    table.append(tbody);
    $list.html(table);
}

function deleteExpense(id) {
    showConfirmation('Hapus Pengeluaran', 'Anda yakin ingin menghapus data ini?', () => {
        expenses = expenses.filter(exp => exp.id !== id);
        saveData(STORAGE_KEYS.EXPENSES, expenses);
        loadExpenses();
    }, 'danger');
}


// --- REPORTS & HISTORY ---
function openHistoryModal() {
     if (!checkPermission('viewHistory')) return showToast('Anda tidak memiliki izin.', 'error');
     const modalHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header"><h3 class="modal-title">Histori Transaksi</h3><button class="modal-close">&times;</button></div>
            <div class="modal-body">
                 <div class="search-container"><i class="fas fa-search"></i><input type="text" id="historySearchInput" class="search-input" placeholder="Cari No. Nota atau nama pelanggan..."></div>
                <div id="historyListContainer" class="data-table-wrapper" style="max-height: 60vh; overflow-y: auto;"></div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-warning modal-close-btn">Tutup</button></div>
        </div>`;
    $('#historyModal').html(modalHTML).css('display', 'flex');
    loadHistory();
}

function loadHistory(searchTerm = '') {
    const $list = $('#historyListContainer').empty();
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = orders.filter(o => {
        const customer = customers.find(c => c.id === o.customerId);
        return !searchTerm || o.id.toLowerCase().includes(lowerTerm) || (customer && customer.name.toLowerCase().includes(lowerTerm));
    });

    if (filtered.length === 0) return $list.html('<div class="empty-state"><p>Tidak ada riwayat transaksi.</p></div>');
    
    const table = $('<table class="data-table"><thead><tr><th>Nota</th><th>Tanggal</th><th>Pelanggan</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead></table>');
    const tbody = $('<tbody></tbody>');
    filtered.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(o => { 
        const customer = customers.find(c => c.id === o.customerId);
        tbody.append(`
            <tr>
                <td>${o.id}</td>
                <td>${moment(o.date).format('DD MMM YYYY')}</td>
                <td>${customer ? customer.name : 'Umum'}</td>
                <td>${formatCurrency(o.total)}</td>
                <td><span class="order-status-badge status-${o.status}">${ORDER_STATUSES[o.status] || o.status}</span></td>
                <td><button class="btn btn-sm btn-info print-nota-btn" data-id="${o.id}"><i class="fas fa-print"></i></button></td>
            </tr>`);
    });
    table.append(tbody);
    $list.html(table);
}

function openPickedUpHistoryModal() {
    const modalHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header"><h3 class="modal-title">Riwayat Pengambilan Barang</h3><button class="modal-close">&times;</button></div>
            <div class="modal-body">
                <div class="filter-container">
                     <input type="date" id="pickedUpStartDate" class="form-control">
                     <input type="date" id="pickedUpEndDate" class="form-control">
                     <button id="filterPickedUpBtn" class="btn btn-sm">Filter</button>
                </div>
                <div id="pickedUpHistoryContainer" class="data-table-wrapper" style="max-height: 60vh; overflow-y: auto;"></div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-warning modal-close-btn">Tutup</button></div>
        </div>`;
    $('#pickedUpHistoryModal').html(modalHTML).css('display', 'flex');
    
    const today = moment().format('YYYY-MM-DD');
    $('#pickedUpStartDate').val(today);
    $('#pickedUpEndDate').val(today);

    loadPickedUpHistory();
    $('#filterPickedUpBtn').click(loadPickedUpHistory);
}

function loadPickedUpHistory() {
    const $list = $('#pickedUpHistoryContainer').empty();
    const start = moment($('#pickedUpStartDate').val()).startOf('day');
    const end = moment($('#pickedUpEndDate').val()).endOf('day');

    const filtered = orders.filter(o => o.status === 'diambil' && moment(o.pickedUpAt).isBetween(start, end, undefined, '[]'));

    if (filtered.length === 0) return $list.html('<div class="empty-state"><p>Tidak ada riwayat pengambilan pada periode ini.</p></div>');
    
    const table = $('<table class="data-table"><thead><tr><th>Nota</th><th>Pelanggan</th><th>Tgl Masuk</th><th>Tgl Diambil</th><th>Aksi</th></tr></thead></table>');
    const tbody = $('<tbody></tbody>');
    filtered.sort((a,b) => new Date(b.pickedUpAt) - new Date(a.pickedUpAt)).forEach(o => { 
        const customer = customers.find(c => c.id === o.customerId);
        tbody.append(`
            <tr>
                <td>${o.id}</td>
                <td>${customer ? customer.name : 'Umum'}</td>
                <td>${moment(o.date).format('DD MMM, HH:mm')}</td>
                <td>${moment(o.pickedUpAt).format('DD MMM YYYY, HH:mm')}</td>
                <td><button class="btn btn-sm btn-info print-nota-btn" data-id="${o.id}"><i class="fas fa-print"></i></button></td>
            </tr>`);
    });
    table.append(tbody);
    $list.html(table);
}

function generateReport() {
    if (!checkPermission('accessReports')) return showToast('Anda tidak memiliki izin.', 'error');
    const start = moment($('#reportStartDate').val()).startOf('day');
    const end = moment($('#reportEndDate').val()).endOf('day');
    if (!start.isValid() || !end.isValid()) return showToast('Pilih rentang tanggal yang valid', 'error');

    const revenueOrders = orders.filter(o => o.paymentStatus === 'lunas' && moment(o.date).isBetween(start, end, undefined, '[]'));
    const totalRevenue = revenueOrders.reduce((sum, o) => sum + o.total, 0);

    const periodExpenses = expenses.filter(e => moment(e.date).isBetween(start, end, undefined, '[]'));
    const totalExpense = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    const profit = totalRevenue - totalExpense;

    const reportHTML = `
        <div style="border: 1px solid #ddd; padding: 15px; border-radius: var(--rounded);">
            <h4 class="text-center">Laporan Periode</h4>
            <p class="text-center">${start.format('D MMM YYYY')} - ${end.format('D MMM YYYY')}</p>
            <hr>
            <div class="summary-row"><strong>Total Pendapatan (Lunas):</strong> <span style="color:var(--success)">${formatCurrency(totalRevenue)}</span></div>
            <div class="summary-row"><strong>Total Pengeluaran:</strong> <span style="color:var(--danger)">-${formatCurrency(totalExpense)}</span></div>
            <div class="summary-row total-row" style="font-size: 1.2rem;">
                <strong>Perkiraan Laba Kotor:</strong>
                <span style="color: ${profit >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatCurrency(profit)}</span>
            </div>
        </div>`;
    $('#reportResults').html(reportHTML);
}

// --- OTHER ADMIN FEATURES ---
function openManageStoreInfoModal() {
    const modalHTML = `
        <div class="modal-content">
            <div class="modal-header"><h3 class="modal-title">Info Laundry</h3><button class="modal-close">&times;</button></div>
            <form id="storeInfoForm">
                <div class="modal-body">
                    <div class="form-group"><label class="form-label">Nama Laundry</label><input type="text" id="storeName" class="form-control" value="${settings.storeName}" required></div>
                    <div class="form-group"><label class="form-label">Alamat</label><textarea id="storeAddress" class="form-control" required>${settings.storeAddress}</textarea></div>
                    <div class="form-group"><label class="form-label">No. Telepon</label><input type="text" id="storePhone" class="form-control" value="${settings.storePhone}" required></div>
                    <div class="form-group"><label class="form-label">Syarat & Ketentuan di Nota</label><textarea id="receiptTerms" class="form-control">${settings.receiptTerms}</textarea></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-warning modal-close-btn">Batal</button>
                    <button type="submit" class="btn btn-success">Simpan</button>
                </div>
            </form>
        </div>`;
    $('#manageStoreInfoModal').html(modalHTML).css('display', 'flex');
}

function saveStoreInfo(e) {
    e.preventDefault();
    settings.storeName = $('#storeName').val();
    settings.storeAddress = $('#storeAddress').val();
    settings.storePhone = $('#storePhone').val();
    settings.receiptTerms = $('#receiptTerms').val();
    saveData(STORAGE_KEYS.SETTINGS, settings);
    updateStoreInfo();
    showToast('Info laundry berhasil diperbarui', 'success');
    $('#manageStoreInfoModal').hide().empty();
}

function openControlPanel() {
    if (!checkPermission('accessControlPanel')) return showToast('Anda tidak memiliki izin.', 'error');
    promptForPassword('panel', () => {
        const modalHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header"><h3 class="modal-title">Panel Kontrol</h3><button class="modal-close">&times;</button></div>
            <div class="modal-body" style="padding:0 16px 16px 16px">
                 <div class="tabs">
                    <div class="tab active" data-tab="usersTab">Pengguna</div>
                    <div class="tab" data-tab="rolesTab">Hak Akses</div>
                    <div class="tab" data-tab="securityTab">Keamanan</div>
                </div>
                <div id="usersTab" class="tab-content active">
                    <div id="usersListContainer" class="data-table-wrapper" style="max-height: 50vh; overflow-y: auto;"></div>
                    <button id="addUserBtn" class="btn btn-success btn-sm mt-3">Tambah Pengguna</button>
                </div>
                <div id="rolesTab" class="tab-content">
                    <div id="rolesContainer"></div>
                    <button id="saveRolesBtn" class="btn btn-success mt-3">Simpan Hak Akses</button>
                </div>
                 <div id="securityTab" class="tab-content">
                    <form id="securityForm">
                        <div class="form-group"><label class="form-label">Password Keamanan Edit/Hapus</label><input type="password" id="itemSecurityCode" class="form-control"></div>
                        <div class="form-group"><label class="form-label">Password Keamanan Panel Kontrol</label><input type="password" id="panelSecurityCode" class="form-control"></div>
                        <p class="text-muted"><small>Kosongkan jika tidak ingin mengubah.</small></p>
                        <button type="submit" class="btn btn-info">Simpan Password</button>
                    </form>
                 </div>
            </div>
            <div class="modal-footer"><button class="btn btn-warning modal-close-btn">Tutup</button></div>
        </div>`;
        $('#controlPanelModal').html(modalHTML).css('display', 'flex');
        loadUsersForManagement();
        loadRolesForManagement();
    });
}

function loadRolesForManagement() {
    const $container = $('#rolesContainer').empty();
    const rolesSettings = settings.roles || {};

    Object.keys(rolesSettings).forEach(role => {
        if(role === 'admin') return;
        let checkboxesHTML = '';
        Object.keys(PERMISSIONS).forEach(permKey => {
            const isChecked = rolesSettings[role] && rolesSettings[role][permKey] ? 'checked' : '';
            checkboxesHTML += `
                <div class="form-check">
                   <input type="checkbox" class="form-check-input" id="perm-${role}-${permKey}" data-role="${role}" data-permission="${permKey}" ${isChecked}>
                   <label for="perm-${role}-${permKey}">${PERMISSIONS[permKey]}</label>
                </div>
            `;
        });
        $container.append(`
            <div class="panel mt-2" style="padding:10px;">
                <h4 class="panel-title" style="text-transform:capitalize;">${role}</h4>
                ${checkboxesHTML}
            </div>
        `);
    });
}

function saveRoles() {
    $('#rolesContainer .form-check-input').each(function() {
        const role = $(this).data('role');
        const permission = $(this).data('permission');
        const isChecked = $(this).is(':checked');
        if (settings.roles[role]) {
            settings.roles[role][permission] = isChecked;
        }
    });
    saveData(STORAGE_KEYS.SETTINGS, settings);
    showToast('Hak akses berhasil disimpan. Pengguna lain perlu login ulang untuk menerapkan perubahan.', 'success');
}

function openUserModal(user = null) {
    const modalHTML = `
        <div class="modal-content">
            <div class="modal-header"><h3 class="modal-title">${user ? 'Edit' : 'Tambah'} Pengguna</h3><button class="modal-close">&times;</button></div>
            <form id="userForm">
                <div class="modal-body">
                    <input type="hidden" id="userId" value="${user ? user.id : ''}">
                    <div class="form-group"><label class="form-label">Nama Lengkap</label><input type="text" id="userName" class="form-control" value="${user ? user.name : ''}" required></div>
                    <div class="form-group"><label class="form-label">Username</label><input type="text" id="userUsername" class="form-control" value="${user ? user.username : ''}" required></div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" id="userPassword" class="form-control" placeholder="${user ? 'Kosongkan jika tidak diubah' : ''}" ${user ? '' : 'required'}>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Role</label>
                        <select id="userRole" class="form-control" required>
                            <option value="cashier">Cashier</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-warning modal-close-btn">Batal</button>
                    <button type="submit" class="btn btn-success">Simpan</button>
                </div>
            </form>
        </div>`;
    $('#userModal').html(modalHTML).css('display', 'flex');
    if (user) {
        $('#userRole').val(user.role);
    }
}

function saveUser(e) {
    e.preventDefault();
    const id = $('#userId').val();
    const username = $('#userUsername').val().trim();
    const password = $('#userPassword').val();
    
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase() && u.id !== id)) {
        return showToast('Username sudah digunakan.', 'error');
    }

    const userData = {
        id: id || 'U' + Date.now(),
        name: $('#userName').val().trim(),
        username: username,
        role: $('#userRole').val(),
        password: ''
    };

    if (id) { 
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) return showToast('User tidak ditemukan', 'error');
        
        if (password) {
            userData.password = CryptoJS.SHA256(password).toString();
        } else {
            userData.password = users[userIndex].password;
        }
        users[userIndex] = userData;
    } else {
        userData.password = CryptoJS.SHA256(password).toString();
        users.unshift(userData);
    }
    
    saveData(STORAGE_KEYS.USERS, users);
    showToast('Pengguna berhasil disimpan', 'success');
    $('#userModal').hide().empty();
    loadUsersForManagement();
}

function deleteUser(id) {
    if (id === currentUser.id) return showToast('Anda tidak dapat menghapus akun Anda sendiri.', 'error');
    showConfirmation('Hapus Pengguna', 'Anda yakin ingin menghapus pengguna ini?', () => {
        users = users.filter(u => u.id !== id);
        saveData(STORAGE_KEYS.USERS, users);
        loadUsersForManagement();
    }, 'danger');
}

function loadUsersForManagement() { 
    const $list = $('#usersListContainer').empty();
    if (users.length === 0) return $list.html('<div class="empty-state"><p>Tidak ada data pengguna.</p></div>');
    const table = $('<table class="data-table"><thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Aksi</th></tr></thead></table>');
    const tbody = $('<tbody></tbody>');
    users.forEach(user => {
        tbody.append(`
            <tr>
                <td>${user.name}</td>
                <td>${user.username}</td>
                <td><span style="text-transform: capitalize;">${user.role}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-info edit-user" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-user" data-id="${user.id}" ${user.id === currentUser.id ? 'disabled' : ''}><i class="fas fa-trash"></i></button>
                </td>
            </tr>`);
    });
    table.append(tbody);
    $list.html(table);
}

function saveSecurityPasswords(e) {
    e.preventDefault();
    const itemPass = $('#itemSecurityCode').val();
    const panelPass = $('#panelSecurityCode').val();
    if (itemPass) settings.itemSecurityCode = CryptoJS.SHA256(itemPass).toString();
    if (panelPass) settings.panelSecurityCode = CryptoJS.SHA256(panelPass).toString();
    saveData(STORAGE_KEYS.SETTINGS, settings);
    showToast('Password keamanan berhasil disimpan', 'success');
    $('#securityForm')[0].reset();
}

function promptForPassword(type, callback) {
    passwordPromptCallback = callback;
    const modalHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header"><h3 class="modal-title">Verifikasi Keamanan</h3><button class="modal-close">&times;</button></div>
            <form id="passwordPromptForm">
                <div class="modal-body">
                    <label class="form-label">Masukkan Password ${type === 'panel' ? 'Panel Kontrol' : 'Edit/Hapus'}</label>
                    <input type="password" id="passwordPromptInput" class="form-control" required>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-warning modal-close-btn">Batal</button>
                    <button type="submit" class="btn btn-success">Lanjutkan</button>
                </div>
            </form>
        </div>`;
    $('#passwordPromptModal').html(modalHTML).css('display', 'flex').find('input').focus();
}

function submitPasswordPrompt(e) {
    e.preventDefault();
    const password = $('#passwordPromptInput').val();
    const type = $('#passwordPromptForm label').text().includes('Panel Kontrol') ? 'panel' : 'item';
    const correctHash = type === 'panel' ? settings.panelSecurityCode : settings.itemSecurityCode;
    if (CryptoJS.SHA256(password).toString() === correctHash) {
        if(passwordPromptCallback) passwordPromptCallback();
        $('#passwordPromptModal').hide().empty();
        passwordPromptCallback = null;
    } else {
        showToast('Password salah', 'error');
    }
}

function backupData() {
    const backupData = {};
    Object.values(STORAGE_KEYS).forEach(key => {
        if (key !== STORAGE_KEYS.USER) { 
            backupData[key] = localStorage.getItem(key);
        }
    });
    const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(backupData), ENCRYPTION_KEY).toString();
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(encryptedData);
    link.download = `backup_laundry_${moment().format('YYYYMMDD')}.lkslaundry`;
    link.click();
    showToast('Backup data berhasil diunduh.', 'success');
}

function restoreFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const bytes = CryptoJS.AES.decrypt(e.target.result, ENCRYPTION_KEY);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            if (!decryptedString) throw new Error("Decryption failed.");
            const data = JSON.parse(decryptedString);
            showConfirmation('Restore Data', 'Data saat ini akan diganti oleh file backup. Lanjutkan?', () => {
                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, data[key]);
                });
                showToast('Restore berhasil. Aplikasi akan dimuat ulang.', 'success');
                setTimeout(() => location.reload(), 1500);
            }, 'danger');
        } catch (err) { showToast('Gagal memproses file backup. File mungkin rusak atau bukan file backup yang valid.', 'error'); }
    };
    reader.readAsText(file);
}

function resetAllData() {
    showConfirmation('Reset Semua Data', 'PERINGATAN: SEMUA DATA (layanan, pelanggan, transaksi, dll) akan DIHAPUS PERMANEN! Aksi ini tidak bisa dibatalkan. Anda yakin?', () => {
        Object.values(STORAGE_KEYS).forEach(key => {
            if (key !== STORAGE_KEYS.USER) localStorage.removeItem(key);
        });
        showToast('Semua data berhasil direset. Aplikasi akan dimuat ulang.', 'success');
        setTimeout(() => location.reload(), 1500);
    }, 'danger');
}

// --- EVENT HANDLER BINDING & HELPERS ---
function setupAdminButtonListeners() {
    $('#addServiceBtn').click(() => openServiceModal());
    $('#manageCategoriesBtn').click(openManageCategoriesModal);
    $('#manageCustomersBtn').click(openManageCustomersModal);
    $('#manageExpensesBtn').click(openExpenseModal);
    $('#historyBtn').click(openHistoryModal);
    $('#manageStoreInfoBtn').click(openManageStoreInfoModal);
    $('#controlPanelBtn').click(openControlPanel);
    $('#recapReportBtn').click(openRecapReportModal);
    $('#backupDataBtn').click(backupData);
    $('#restoreFile').change(function() { restoreFromFile(this.files[0]); $(this).val(''); });
    $('#resetDataBtn').click(() => promptForPassword('panel', resetAllData));
    
    // Dynamic bindings
    $(document).on('submit', '#serviceForm', saveService); 
    $(document).on('click', '.modal-close, .modal-close-btn', function() { $(this).closest('.modal').hide().empty(); });
    $(document).on('click', '#addCategoryBtn', addCategory);
    $(document).on('click', '.remove-category', function() { removeCategory($(this).data('id')); });
    $(document).on('click', '#addNewCustomerFromMgmt', () => openCustomerModal());
    $(document).on('keyup', '#customerSearchInput', function() { loadCustomersForManagement($(this).val()); });
    $(document).on('click', '.edit-customer', function() { openCustomerModal(customers.find(c => c.id === $(this).data('id'))); });
    $(document).on('click', '.delete-customer', function() { deleteCustomer($(this).data('id')); });
    $(document).on('click', '.modal .tab', function() {
        const tabId = $(this).data('tab');
        $(this).addClass('active').siblings().removeClass('active');
        $(this).closest('.modal-body').find('.tab-content').removeClass('active');
        $(`#${tabId}`).addClass('active');
    });
    $(document).on('submit', '#expenseForm', saveExpense);
    $(document).on('click', '.delete-expense', function() { deleteExpense($(this).data('id')); });
    $(document).on('keyup', '#historySearchInput', function() { loadHistory($(this).val()); });
    $(document).on('submit', '#storeInfoForm', saveStoreInfo);
    $(document).on('submit', '#securityForm', saveSecurityPasswords);
    $(document).on('submit', '#passwordPromptForm', submitPasswordPrompt);
    $(document).on('click', '#addUserBtn', () => openUserModal());
    $(document).on('submit', '#userForm', saveUser);
    $(document).on('click', '.edit-user', function() { openUserModal(users.find(u => u.id === $(this).data('id'))); });
    $(document).on('click', '.delete-user', function() { deleteUser($(this).data('id')); });
    $(document).on('click', '#saveRolesBtn', saveRoles);
}

// --- NEW - QUICK ACTION MENU ---
function setupQuickActionMenu() {
    const $btn = $('#quickActionBtn');
    const $options = $('#quickActionOptions');
    
    function closeMenu() {
        $btn.removeClass('active');
        $options.removeClass('active');
    }
    
    $btn.on('click', function(e) {
        e.stopPropagation();
        $btn.toggleClass('active');
        $options.toggleClass('active');
    });

    $('#quickActionNewOrder').on('click', () => { switchMainTab('newTransactionTab'); closeMenu(); });
    $('#quickActionAddExpense').on('click', () => { openExpenseModal(); closeMenu(); });
    $('#quickActionAddService').on('click', () => { openServiceModal(); closeMenu(); });
    $('#quickActionManageCustomers').on('click', () => { openManageCustomersModal(); closeMenu(); });
    $('#quickActionHistory').on('click', () => { openHistoryModal(); closeMenu(); });
    $('#quickActionRecap').on('click', () => { openRecapReportModal(); closeMenu(); });
    $('#quickActionControlPanel').on('click', () => { openControlPanel(); closeMenu(); });

    $(document).on('click', function(event) {
        if (!$(event.target).closest('.quick-action-menu').length) {
            closeMenu();
        }
    });
}

function formatCurrency(amount, prefix = 'Rp ') { return prefix + (amount != null ? Math.round(amount) : 0).toLocaleString('id-ID'); }
function saveData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function showToast(message, type = 'info', duration = 3000) {
    const $toast = $('#toast');
    $toast.removeClass('success error warning info').addClass(type);
    $('#toast-message').text(message); $toast.addClass('show');
    setTimeout(() => $toast.removeClass('show'), duration);
}
function printElement(selector) {
    const content = $(selector)[0].outerHTML;
    $('#print-container').html(content).show();
    window.print();
    $('#print-container').hide().empty();
}
function loadCategoriesForSelect(selector) {
    const $select = $(selector).empty();
    if (categories.length === 0) $select.append('<option value="">-- Buat Kategori Dahulu --</option>');
    else categories.forEach(cat => $select.append(`<option value="${cat.name}">${cat.name}</option>`));
}

function formatPhoneNumberForWhatsApp(phone) {
    let formatted = phone.trim().replace(/[-\s]/g, '');
    if (formatted.startsWith('0')) {
        formatted = '62' + formatted.substring(1);
    } else if (!formatted.startsWith('62')) {
        formatted = '62' + formatted;
    }
    return formatted;
}

// --- SHIFT MANAGEMENT & RECAP ---
function checkActiveShift() {
    activeShift = shifts.find(s => s.userId === currentUser.id && s.status === 'active') || null;
    if (activeShift) {
        $('#shiftStatusBadge').text('Shift Aktif').addClass('active');
        $('#shiftActionBtn').text('Tutup Shift').removeClass('btn-warning').addClass('btn-danger');
    } else {
        $('#shiftStatusBadge').text('Shift Non-Aktif').removeClass('active');
        $('#shiftActionBtn').text('Mulai Shift').removeClass('btn-danger').addClass('btn-warning');
    }
}

function handleShiftAction() {
    if (activeShift) {
        showConfirmation('Tutup Shift', 'Anda yakin ingin menutup shift kerja saat ini?', () => {
            const shiftIndex = shifts.findIndex(s => s.id === activeShift.id);
            if(shiftIndex > -1) {
                 shifts[shiftIndex].status = 'closed';
                 shifts[shiftIndex].endTime = new Date().toISOString();
            }
            saveData(STORAGE_KEYS.SHIFTS, shifts);
            openRecapReportModal(activeShift.id);
            activeShift = null;
            checkActiveShift();
            showToast('Shift berhasil ditutup.', 'success');
        });
    } else {
        const newShift = { id: 'SH' + Date.now(), userId: currentUser.id, name: currentUser.name, startTime: new Date().toISOString(), endTime: null, status: 'active' };
        shifts.unshift(newShift);
        saveData(STORAGE_KEYS.SHIFTS, shifts);
        activeShift = newShift;
        checkActiveShift();
        showToast('Shift dimulai.', 'success');
    }
}

function openRecapReportModal(shiftId = null) {
    const modalHTML = `
    <div class="modal-content" style="max-width: 450px;">
        <div class="modal-header"><h3 class="modal-title">Laporan Shift & Rekapitulasi</h3><button class="modal-close">&times;</button></div>
        <div class="modal-body">
            <div class="form-group">
                <label class="form-label">Pilih Shift</label>
                <select id="recapShiftSelect" class="form-control"></select>
            </div>
            <div id="recapResultsContainer"></div>
        </div>
        <div class="modal-footer"><button class="btn btn-warning modal-close-btn">Tutup</button></div>
    </div>`;
    $('#recapReportModal').html(modalHTML).css('display', 'flex');

    const $select = $('#recapShiftSelect').empty().append('<option value="all">Semua Shift Hari Ini</option>');
    const todayShifts = shifts.filter(s => moment(s.startTime).isSame(moment(), 'day'));
    todayShifts.sort((a,b) => new Date(b.startTime) - new Date(a.startTime)).forEach(s => {
        $select.append(`<option value="${s.id}">Shift ${s.name} - ${moment(s.startTime).format('HH:mm')}</option>`);
    });

    if(shiftId) $('#recapShiftSelect').val(shiftId);
    
    generateRecapReport(); 
    $('#recapShiftSelect').change(generateRecapReport);
}

function generateRecapReport() {
    const selectedShiftId = $('#recapShiftSelect').val();
    let shiftOrders, title;
    
    if (selectedShiftId === 'all') {
        const todayShifts = shifts.filter(s => moment(s.startTime).isSame(moment(), 'day'));
        const todayShiftIds = todayShifts.map(s => s.id);
        shiftOrders = orders.filter(o => todayShiftIds.includes(o.shiftId));
        title = `Rekapitulasi Hari Ini (${moment().format('D MMM YYYY')})`;
    } else {
        const selectedShift = shifts.find(s => s.id === selectedShiftId);
        shiftOrders = orders.filter(o => o.shiftId === selectedShiftId);
        title = `Laporan Shift ${selectedShift.name} (${moment(selectedShift.startTime).format('D MMM, HH:mm')})`;
    }
    
    const paidOrders = shiftOrders.filter(o => o.paymentStatus === 'lunas');
    const totalCash = paidOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    const totalTransfer = paidOrders.filter(o => o.paymentMethod === 'transfer').reduce((sum, o) => sum + o.total, 0);
    const totalRevenue = totalCash + totalTransfer;
    
    const resultsHTML = `
        <div style="border: 1px solid #ddd; padding: 15px; border-radius: var(--rounded); margin-top: 1rem;">
            <h4 class="text-center">${title}</h4>
            <hr>
            <div class="summary-row"><strong>Total Transaksi Lunas:</strong> <span>${paidOrders.length}</span></div>
            <div class="summary-row"><strong>Pendapatan Tunai:</strong> <span>${formatCurrency(totalCash)}</span></div>
            <div class="summary-row"><strong>Pendapatan Transfer:</strong> <span>${formatCurrency(totalTransfer)}</span></div>
            <div class="summary-row total-row"><strong>Total Pendapatan Shift:</strong><span>${formatCurrency(totalRevenue)}</span></div>
        </div>`;
    $('#recapResultsContainer').html(resultsHTML);
}

function showConfirmation(title, message, onConfirm, type = 'success') {
    const modalHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header"><h3 class="modal-title">${title}</h3><button class="modal-close">&times;</button></div>
            <div class="modal-body"><p>${message}</p></div>
            <div class="modal-footer">
                <button class="btn btn-warning modal-close-btn">Batal</button>
                <button class="btn ${type === 'danger' ? 'btn-danger' : 'btn-success'}" id="confirmAction">Lanjutkan</button>
            </div>
        </div>`;
    $('#confirmationModal').html(modalHTML).css('display', 'flex');
    $('#confirmAction').off('click').on('click', () => { // Gunakan .off().on() untuk mencegah binding ganda
        onConfirm();
        $('#confirmationModal').hide().empty();
    });
}

function openManageCategoriesModal() {
    if (!checkPermission('manageServices')) return showToast('Anda tidak memiliki izin.', 'error');
    const modalHTML = `
        <div class="modal-content">
            <div class="modal-header"><h3 class="modal-title">Kelola Kategori</h3><button class="modal-close">&times;</button></div>
            <div class="modal-body">
                <div id="categoriesList"></div>
                <div class="form-group mt-3 d-flex gap-2">
                    <input type="text" id="newCategoryName" class="form-control" placeholder="Nama kategori baru" required>
                    <button class="btn btn-success" id="addCategoryBtn" style="width:auto;">Tambah</button>
                </div>
            </div>
            <div class="modal-footer"><button type="button" class="btn btn-warning modal-close-btn">Tutup</button></div>
        </div>`;
    $('#manageCategoriesModal').html(modalHTML).css('display', 'flex');
    loadCategoriesForManagement();
}

function loadCategoriesForManagement() {
    const $list = $('#categoriesList').empty();
    if (categories.length === 0) return $list.html('<div class="empty-state"><p>Belum ada kategori</p></div>');
    categories.forEach(cat => {
        const canDelete = !services.some(s => s.category === cat.name);
        $list.append(`
            <div class="order-item">
                <span>${cat.name}</span>
                <button class="btn btn-danger btn-sm remove-category" data-id="${cat.id}" ${canDelete ? '' : 'disabled'} title="${canDelete ? 'Hapus' : 'Kategori sedang digunakan'}"><i class="fas fa-trash"></i></button>
            </div>`);
    });
}

function addCategory() {
    const name = $('#newCategoryName').val().trim();
    if (!name) return showToast('Nama kategori tidak boleh kosong', 'error');
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) return showToast('Kategori sudah ada', 'warning');
    categories.unshift({ id: 'CAT' + Date.now(), name });
    saveData(STORAGE_KEYS.CATEGORIES, categories);
    loadCategoriesForManagement();
    $('#newCategoryName').val('');
}

function removeCategory(id) {
    showConfirmation('Hapus Kategori', 'Anda yakin ingin menghapus kategori ini?', () => {
        categories = categories.filter(c => c.id !== id);
        saveData(STORAGE_KEYS.CATEGORIES, categories);
        loadCategoriesForManagement();
    }, 'danger');
}

function openManageCustomersModal() {
    const modalHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header"><h3 class="modal-title">Kelola Pelanggan</h3><button class="modal-close">&times;</button></div>
            <div class="modal-body">
                <div class="search-container"><i class="fas fa-search"></i><input type="text" id="customerSearchInput" class="search-input" placeholder="Cari ID, nama, no. telepon, atau alamat..."></div>
                <div id="customersListContainer" class="data-table-wrapper" style="max-height: 50vh; overflow-y: auto;"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-warning modal-close-btn">Tutup</button>
                <button type="button" class="btn btn-success" id="addNewCustomerFromMgmt">Tambah Pelanggan Baru</button>
            </div>
        </div>`;
    $('#manageCustomersModal').html(modalHTML).css('display', 'flex');
    loadCustomersForManagement();
}

function loadCustomersForManagement(searchTerm = '') {
    const $list = $('#customersListContainer').empty();
    const lowerTerm = searchTerm.toLowerCase();
    const filtered = customers.filter(c => 
        !searchTerm || 
        c.name.toLowerCase().includes(lowerTerm) || 
        c.phone.includes(lowerTerm) ||
        c.id.toLowerCase().includes(lowerTerm) || // Cari berdasarkan ID
        (c.address && c.address.toLowerCase().includes(lowerTerm)) // Cari berdasarkan alamat
    );

    if (filtered.length === 0) return $list.html('<div class="empty-state"><p>Tidak ada data pelanggan.</p></div>');
    const table = $('<table class="data-table"><thead><tr><th>ID</th><th>Nama</th><th>Telepon</th><th>Aksi</th></tr></thead></table>');
    const tbody = $('<tbody></tbody>');
    filtered.sort((a,b) => a.name.localeCompare(b.name)).forEach(c => {
        const formattedPhone = formatPhoneNumberForWhatsApp(c.phone);
        tbody.append(`
            <tr>
                <td>${c.id}</td>
                <td>${c.name}</td>
                <td><a href="https://wa.me/${formattedPhone}" target="_blank" class="whatsapp-link">${c.phone} <i class="fab fa-whatsapp"></i></a></td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-info edit-customer" data-id="${c.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger delete-customer" data-id="${c.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`);
    });
    table.append(tbody);
    $list.html(table);
}

function deleteCustomer(id) {
    showConfirmation('Hapus Pelanggan', `Anda yakin ingin menghapus pelanggan ini? Riwayat transaksi tidak akan terhapus.`, () => {
        customers = customers.filter(c => c.id !== id);
        saveData(STORAGE_KEYS.CUSTOMERS, customers);
        loadCustomersForManagement();
        loadCustomersForSelect();
    }, 'danger');
}
