moment.locale('id');
const { jsPDF } = window.jspdf;

const STORAGE_KEYS = {
    PRODUCTS: 'supermarket_products',
    CATEGORIES: 'supermarket_categories',
    ORDERS: 'supermarket_orders',
    USER: 'supermarket_user',
    CURRENT_ORDER: 'supermarket_current_order',
    SETTINGS: 'supermarket_settings',
    USERS: 'supermarket_users',
    MEMBERS: 'supermarket_members',
    SUPPLIERS: 'supermarket_suppliers',
    STOCK_HISTORY: 'supermarket_stock_history',
    RETURNS: 'supermarket_returns',
    SHIFTS: 'supermarket_shifts' // [BARU] Kunci penyimpanan data shift
};

const ENCRYPTION_KEY = 'LenteraKaryaSitubondo-Supermarket-2025';

const DEFAULT_ADMIN = { id: 'U001', username: 'Admin', password: CryptoJS.SHA256('Gratis12345').toString(), name: 'Administrator', role: 'admin' };
const DEFAULT_CASHIER = { id: 'U002', username: 'kasir', password: CryptoJS.SHA256('kasir123').toString(), name: 'Kasir', role: 'cashier' };

let products, categories, orders, settings, users, members, suppliers, stockHistory, returns, shifts, currentUser, currentOrder, activeShift;
let passwordPromptCallback = null;
let captchaText = '';

function initializeData() {
    let users_init = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    if (!users_init.find(u => u.username === 'Admin')) users_init.push(DEFAULT_ADMIN);
    if (!users_init.find(u => u.username === 'kasir')) users_init.push(DEFAULT_CASHIER);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users_init));
    
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.STOCK_HISTORY)) localStorage.setItem(STORAGE_KEYS.STOCK_HISTORY, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.RETURNS)) localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    if (!localStorage.getItem(STORAGE_KEYS.SHIFTS)) localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify([])); // [BARU] Inisialisasi shift
    
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        const initialSettings = {
            storeName: 'MITRA ANEKAMARKET', // [DIKUNCI]
            partnerName: 'Chacha Swalayan', // [BARU]
            storeAddress: 'Jl. Harjakasi Gang Naik Kelas No. 1, Kota Situbondo',
            storePhone: '087865614222', storeEmail: 'admin@anekamarket.my.id',
            itemSecurityCode: CryptoJS.SHA256('17081945').toString(), panelSecurityCode: CryptoJS.SHA256('LKS.1945').toString(),
            // [PERBAIKAN] Penambahan Seting Diskon Member
            memberDiscountPercent: 2, 
            isMemberDiscountEnabled: true, 
            memberDiscountMinPurchase: 0, 
            nonMemberDiscountPercent: 0, 
            taxPercent: 0,
            // Akhir [PERBAIKAN]
            roles: {
                admin: { label: "Admin", isEditable: false, permissions: getAllPermissions(true) },
                store_manager: { label: "Kepala Toko", isEditable: true, permissions: { ...getAllPermissions(true), canAccessControlPanel: false } },
                supervisor: { label: "Supervisor", isEditable: true, permissions: { ...getAllPermissions(false), canManageStock: true, canProcessReturn: true, canViewReports: true } },
                cashier: { label: "Kasir", isEditable: true, permissions: getAllPermissions(false) }
            }
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
    }
}

$(document).ready(function() {
    initializeData();
    
    products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || [];
    categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || [];
    orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
    settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
    users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    members = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS)) || [];
    suppliers = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) || [];
    stockHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.STOCK_HISTORY)) || [];
    returns = JSON.parse(localStorage.getItem(STORAGE_KEYS.RETURNS)) || [];
    shifts = JSON.parse(localStorage.getItem(STORAGE_KEYS.SHIFTS)) || []; // [BARU] Load data shift
    currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) || null;
    currentOrder = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_ORDER)) || {
        items: [], subtotal: 0, total: 0, discount: 0, itemDiscount: 0, tax: 0, note: '', memberId: null
    };

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
    
    $('#loginForm').submit(handleLogin);
    $('#reloadCaptchaBtn').click(generateCaptcha);
    $('#logoutBtn').click(handleLogout);
    $('#productSearch').on('input', function() { loadProducts($(this).val(), $('.filter-chip.active').data('category')); });
    $(document).on('click', '.product-card', handleProductClick);
    $(document).on('click', '.edit-product', handleEditProductClick);
    $(document).on('click', '.delete-product', handleDeleteProductClick);
    $(document).on('click', '.remove-item', handleRemoveItemClick);
    $(document).on('input', '.item-qty', handleQtyChange);
    $('#orderNote').on('input', updateOrder);
    
    // Member search events
    $('#memberSearchInput').on('input', handleMemberSearch);
    $(document).on('click', '.member-search-item:not(.disabled)', handleMemberSelect);
    $(document).on('click', (e) => { if (!$(e.target).closest('.member-search-container').length) $('#memberSearchResults').hide(); });

    // Modals & Forms
    $('#processOrderBtn').click(openProcessOrderModal);
    $('.modal-body .tabs .tab').click(function() { switchModalTab($(this).closest('.modal'), $(this).data('tab')); });
    $('#paymentAmount').on('input', calculateChange);
    $(document).on('click', '.quick-cash-btn', function() { $('#paymentAmount').val($(this).data('amount')).trigger('input'); });
    $('#completePaymentBtn').click(completePayment);
    $('.modal-close, .modal-close-btn').click(function() { $(this).closest('.modal').hide(); });

    // Admin Panel Buttons
    $('#addProductBtn').click(() => { if (checkPermission('canAddProduct')) openEditProductModal(null); });
    $('#manageCategoriesBtn').click(() => { if(checkPermission('canManageCategories')) openManageCategoriesModal() });
    $('#viewReportsBtn').click(() => { if(checkPermission('canViewReports')) openReportsModal() });
    $('#historyBtn').click(() => { if(checkPermission('canViewHistory')) openHistoryModal() });
    $('#manageMembersBtn').click(() => { if(checkPermission('canManageMembers')) openManageMembersModal() });
    $('#manageStoreInfoBtn').click(() => { if(checkPermission('canManageStoreInfo')) openManageStoreInfoModal() });
    $('#controlPanelBtn').click(() => { if(checkPermission('canAccessControlPanel')) openControlPanel() });
    $('#manageStockBtn').click(() => { if(checkPermission('canManageStock')) openStockManagementModal() });
    $('#manageSuppliersBtn').click(() => { if(checkPermission('canManageSuppliers')) openManageSuppliersModal() });
    $('#processReturnBtn').click(() => { if(checkPermission('canProcessReturn')) openProcessReturnModal() });
    $('#recapReportBtn').click(openRecapReportModal); // [BARU]
    
    // Save/Update actions
    $('#saveProductBtn').click(saveProduct);
    $('#addCategoryBtn').click(addCategory);
    $(document).on('click', '.remove-category', removeCategory);
    $('#memberForm').submit(saveMember);
    $('#saveStoreInfoBtn').click(saveStoreInfo);
    $('#userForm').submit(saveUser);
    $('#itemSecurityForm, #panelSecurityForm').submit(changeSecurityCode);
    $('#changeOwnPasswordForm').submit(changeOwnPassword);
    $('#taxDiscountSettingsForm').submit(saveTaxDiscountSettings);
    $('#supplierForm').submit(saveSupplier);
    $('#stockInForm').submit(addIncomingStock); // [PENYEMPURNAAN] Fungsi ini diubah
    $('#findOrderForReturnForm').submit(findOrderForReturn);
    $('#completeReturnBtn').click(completeReturn);

    // Backup/Restore
    $('#backupDataBtn').click(() => { if (checkPermission('canBackupRestore')) showConfirmation('Backup Data', 'Data akan di-backup ke file terenkripsi (.lksbackup). Lanjutkan?', backupData); });
    $('#restoreFile').change(function() { if (checkPermission('canBackupRestore')) { promptForPassword('panel', () => { restoreFromFile(this.files[0]); $(this).val(''); }); } });
    $('#resetDataBtn').click(() => { if (checkPermission('canResetData')) promptForPassword('panel', () => showConfirmation('Reset Data', 'Semua data akan dihapus permanen. Lanjutkan?', resetAllData, 'danger')); });
    
    // Other UI interactions
    $(document).on('click', '.filter-chip', function() {
        $('.filter-chip').removeClass('active');
        $(this).addClass('active');
        loadProducts($('#productSearch').val(), $(this).data('category'));
    });
    $('#showAddMemberFormBtn, #cancelMemberFormBtn').click(() => $('#memberFormContainer').slideToggle(resetMemberForm));
    $(document).on('click', '.edit-member', function() { editMember($(this).data('id')); });
    $('#deleteMemberBtn').click(function() { deleteMember($(this).data('id')); });
    $(document).on('click', '.kta-member', function() { openKtaModal($(this).data('id')); });
    $('#downloadKtaPdfBtn').click(downloadKtaAsPdf);
    $('#showAddUserFormBtn, #cancelUserFormBtn').click(() => $('#userFormContainer').slideToggle(resetUserForm));
    $(document).on('click', '.edit-user', function() { editUser($(this).data('id')); });
    $(document).on('click', '.delete-user', function() { deleteUser($(this).data('id')); });
    $('#showAddSupplierFormBtn, #cancelSupplierFormBtn').click(() => $('#supplierFormContainer').slideToggle(resetSupplierForm));
    $(document).on('click', '.edit-supplier', function() { editSupplier($(this).data('id')); });
    $(document).on('click', '.delete-supplier', function() { deleteSupplier($(this).data('id')); });
    $(document).on('click', '.adjust-stock-btn', function() { adjustStock($(this).data('id')); });
    $('#generateLossReportBtn').click(generateLossReport);
    
    // [PERBAIKAN] Smart search for stock management
    $('#stockInProductSearch').on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('#stockInProduct option').each(function() {
            const optionText = $(this).text().toLowerCase();
            $(this).toggle(optionText.includes(searchTerm));
        });
    });

    $('#stockOpnameSearch, #stockHistorySearch').on('input', function() {
        const modalId = $(this).closest('.modal').attr('id');
        if(modalId === 'stockManagementModal') {
            const activeTab = $('#stockManagementModal .tabs .tab.active').data('tab');
            if (activeTab === 'stockOpname') loadProductsForStockOpname($(this).val());
            else if (activeTab === 'stockHistory') loadStockHistory($(this).val());
        }
    });

    // Report, History, Receipt actions
    $('#generateReportBtn').click(generateReport);
    $('#historySearchInput').on('input', function() { loadTransactionHistory($(this).val()); });
    $(document).on('click', '.reprint-receipt', function() {
        const order = orders.find(o => o.id === $(this).data('id'));
        if (order) showReceiptModal(order);
    });
    $('#printReceiptBtn').on('click', () => printElement('#receiptModalBody #receiptContent'));
    $('#downloadReceiptPdfBtn').on('click', downloadReceiptAsPdf);
    $('#printStockReportBtn').click(printStockReport);
    $('#downloadStockReportBtn').click(downloadStockReportAsPdf);

    // Role Management
    $('#manageRolesBtn').click(openRoleManagementModal);
    $('#saveRolePermissionsBtn').click(saveRolePermissions);

    // Password Prompt
    $('#passwordPromptForm').submit(e => e.preventDefault());
    $('#passwordPromptSubmit').click(submitPasswordPrompt);

    // --- [BARU] Event Listeners untuk Fitur Shift & Laporan Cerdas ---
    $('#shiftActionBtn').click(handleShiftAction);
    $('#confirmStartShiftBtn').click(startShift);
    $('#endCash').on('input', previewShiftSummary);
    $('#confirmEndShiftBtn').click(endShift);
    $('#recapReportPeriod').change(function() {
        const isCustom = $(this).val() === 'custom';
        $('#recapCustomDateContainer, #recapCustomDateContainer2').toggle(isCustom);
    });
    $('#generateRecapReportBtn').click(generateRecapReport);
    $('#printRecapBtn').click(() => printElement('#recapReportResults'));
    $('#downloadRecapPdfBtn').click(downloadRecapAsPdf);
   $('#exportRecapExcelBtn').click(exportRecapToExcel);

    // [BARU] Logika Notifikasi Premium
    
    // Atur interval untuk menampilkan notifikasi setiap 1 jam
    setInterval(showPremiumNotification, 3600000); // 3600000 ms = 1 jam
    
    // Tambahkan event listener untuk tombol close notifikasi
    $(document).on('click', '#premiumNotificationModal .premium-notif-close', hidePremiumNotification);

});

// --- CORE APP FLOW ---
function initializeApp() {
    loadProducts(); 
    updateOrder(); 
    loadCategories(); 
    updateCurrentDate();
    updateStoreInfo();
    configureUIAccess();
    checkActiveShift(); // [BARU]

    // [BARU] Tampilkan notifikasi premium saat pertama kali memuat
    showPremiumNotification();
}

function configureUIAccess() {
    const hasAdminFeatures = currentUser.role === 'admin' || Object.values(settings.roles[currentUser.role]?.permissions || {}).some(p => p === true);
    $('#adminPanel').toggle(hasAdminFeatures);
    $('#recapReportBtn').toggle(checkPermission('canViewReports')); // [PENYEMPURNAAN]
    $('#addProductBtn').toggle(checkPermission('canAddProduct'));
    $('#manageCategoriesBtn').toggle(checkPermission('canManageCategories'));
    $('#manageStockBtn').toggle(checkPermission('canManageStock'));
    $('#manageSuppliersBtn').toggle(checkPermission('canManageSuppliers'));
    $('#processReturnBtn').toggle(checkPermission('canProcessReturn'));
    $('#viewReportsBtn').toggle(checkPermission('canViewReports'));
    $('#historyBtn').toggle(checkPermission('canViewHistory'));
    $('#manageMembersBtn').toggle(checkPermission('canManageMembers'));
    $('#manageStoreInfoBtn').toggle(checkPermission('canManageStoreInfo'));
    $('#controlPanelBtn').toggle(checkPermission('canAccessControlPanel'));
    $('#adminPanel [class*="backup-actions"], #adminPanel #resetDataBtn').parent().toggle(checkPermission('canBackupRestore') || checkPermission('canResetData'));
}

function handleLogin(e) {
    e.preventDefault();
    const $loginBtn = $(this).find('button[type="submit"]');
    const originalText = $loginBtn.html();
    setButtonLoading($loginBtn, true);

    setTimeout(() => {
        try {
            if ($('#captchaInput').val().trim().toLowerCase() !== captchaText.toLowerCase()) {
                showToast('Kode verifikasi (CAPTCHA) salah.', 'error');
                generateCaptcha(); $('#captchaInput').val('');
                return setButtonLoading($loginBtn, false, originalText);
            }
            const username = $('#username').val().trim();
            const password = $('#password').val().trim();
            const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
            
            if (user && CryptoJS.SHA256(password).toString() === user.password) {
                currentUser = user;
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
                $('#loggedInUser').text(currentUser.name);
                $('#loginModal').hide();
                $('#mainApp').fadeIn();
                initializeApp();
                showToast(`Selamat datang, ${currentUser.name}!`, 'success');
            } else {
                showToast('Username atau password salah', 'error');
                generateCaptcha(); $('#captchaInput').val('');
            }
        } catch (err) {
            showToast('Error: Gagal memuat library penting. Cek koneksi internet.', 'error');
        } finally {
            if ($loginBtn.prop('disabled')) setButtonLoading($loginBtn, false, originalText);
        }
    }, 500);
}

function handleLogout(e) {
    e.preventDefault();
    if (activeShift) {
        showToast('Anda harus menutup shift kerja terlebih dahulu sebelum logout.', 'warning');
        return;
    }
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.USER);
    $('#mainApp').fadeOut(() => {
        $('#loginModal').css('display', 'flex');
        $('#username, #password, #captchaInput').val('');
        generateCaptcha();
    });
    showToast('Anda telah logout', 'info');
}

function handleProductClick() {
    if (!activeShift) { // [PENYEMPURNAAN]
        return showToast('Harap mulai shift kerja terlebih dahulu untuk transaksi.', 'warning');
    }
    const product = products.find(p => p.id === $(this).data('id'));
    if (!product) return;
    if(product.stock <= 0) return showToast('Stok produk habis.', 'warning');
    
    const existingItem = currentOrder.items.find(item => item.product.id === product.id);
    if (existingItem) {
        if(existingItem.quantity >= product.stock) return showToast('Stok tidak mencukupi untuk menambah jumlah.', 'warning');
        existingItem.quantity++;
    } else {
        currentOrder.items.push({ product: product, quantity: 1 });
    }
    updateOrder();
    showToast(`${product.name} ditambahkan`, 'success');
}

function completePayment() {
    const paymentAmount = parseFloat($('#paymentAmount').val()) || 0;
    if (paymentAmount < currentOrder.total) return showToast('Jumlah pembayaran kurang', 'error');

    for(const item of currentOrder.items) {
        const product = products.find(p => p.id === item.product.id);
        if (!product || product.stock < item.quantity) {
            return showToast(`Stok ${item.product.name} tidak mencukupi (sisa ${product.stock}).`, 'error');
        }
    }
    
    const $btn = $(this), originalText = $btn.html();
    setButtonLoading($btn, true);

    setTimeout(() => {
        try {
            const order = {
                id: 'ORD' + moment().format('YYYYMMDDHHmmss'), date: new Date(), ...currentOrder,
                paymentMethod: $('#paymentMethod').val(), paymentAmount,
                change: paymentAmount - currentOrder.total, cashier: currentUser,
                customerName: $('#customerName').val().trim() || 'Pelanggan',
                shiftId: activeShift ? activeShift.id : null // [PENYEMPURNAAN]
            };
            
            order.items.forEach(item => updateStock(item.product.id, -item.quantity, 'sale', `Penjualan ${order.id}`));
            
            orders.unshift(order);
            saveOrders();
            
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
            showToast('Transaksi berhasil diproses', 'success');
        } finally {
            setButtonLoading($btn, false, originalText);
        }
    }, 500);
}

// [PERBAIKAN] Logika updateOrder dengan Diskon Item 2% dan Kontrol Diskon Member
function updateOrder() {
    currentOrder.subtotal = currentOrder.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    
    // [BARU] Kalkulasi Diskon Item 2%
    currentOrder.itemDiscount = 0;
    currentOrder.items.forEach(item => {
        if (item.product.hasItemDiscount) {
            currentOrder.itemDiscount += (item.product.price * item.quantity) * 0.02; // 2% discount
        }
    });

    // Subtotal untuk diskon member dihitung SETELAH diskon item
    const subtotalForMemberDiscount = currentOrder.subtotal - currentOrder.itemDiscount;
    
    let discountPercent = 0;
    let discountText = 'Diskon (0%)';
    
    // [PERBAIKAN] Logika Diskon Member dengan Pengecekan
    if (currentOrder.memberId && (settings.isMemberDiscountEnabled || false)) {
        // Member logic
        const minPurchase = settings.memberDiscountMinPurchase || 0;
        if (subtotalForMemberDiscount > minPurchase) {
            discountPercent = settings.memberDiscountPercent ?? 0;
            discountText = `Diskon Member (${discountPercent}%)`;
        } else {
            discountText = `Diskon (Min. ${formatCurrency(minPurchase)})`;
        }
    } else if (!currentOrder.memberId && settings.nonMemberDiscountPercent > 0) {
        // Non-member logic (unchanged)
        discountPercent = settings.nonMemberDiscountPercent ?? 0;
        discountText = `Diskon (${discountPercent}%)`;
    }

    // Diskon member/reguler dihitung dari subtotal_setelah_diskon_item
    currentOrder.discount = (discountPercent > 0) ? subtotalForMemberDiscount * (discountPercent / 100) : 0;
    
    const subtotalAfterDiscount = subtotalForMemberDiscount - currentOrder.discount;
    const taxPercent = settings.taxPercent || 0;
    const taxText = `Pajak (${taxPercent}%)`;
    currentOrder.tax = taxPercent > 0 ? subtotalAfterDiscount * (taxPercent / 100) : 0;

    currentOrder.total = subtotalAfterDiscount + currentOrder.tax;
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_ORDER, JSON.stringify(currentOrder));
    
    const $orderItems = $('#orderItems').empty();
    $('#orderCount').text(`(${currentOrder.items.length} item)`);
    
    // [BARU] Update UI Diskon Item
    $('#itemDiscountRow').toggle(currentOrder.itemDiscount > 0);
    $('#orderItemDiscount').text(`-${formatCurrency(currentOrder.itemDiscount)}`);

    // [PERBAIKAN] Update UI Diskon Member
    $('#discountRow').toggle(currentOrder.discount > 0 || (currentOrder.memberId && (settings.isMemberDiscountEnabled || false)))
                       .find('span:first-child').text(discountText);
    $('#orderDiscount').text(`-${formatCurrency(currentOrder.discount)}`);
    
    $('#taxRow').toggle(currentOrder.tax > 0).find('span:first-child').text(taxText);
    $('#orderTax').text(formatCurrency(currentOrder.tax));

    if (currentOrder.items.length === 0) $orderItems.html('<div class="empty-state"><i class="fas fa-shopping-basket"></i><p>Keranjang kosong</p></div>');
    else {
        currentOrder.items.forEach(item => {
            $orderItems.append(`
                <div class="order-item">
                    <div class="order-item-info">
                        <div class="order-item-name">${item.product.name}</div>
                        <div class="order-item-price">${formatCurrency(item.product.price)} x ${item.quantity}</div>
                    </div>
                    <div class="order-item-qty">
                        <input type="number" value="${item.quantity}" min="1" class="item-qty qty-input" data-id="${item.product.id}">
                        <i class="fas fa-trash remove-item" data-id="${item.product.id}" style="cursor:pointer; color: var(--danger); margin-left: 8px;"></i>
                    </div>
                </div>`);
        });
    }
    $('#orderSubtotal').text(formatCurrency(currentOrder.subtotal));
    $('#orderTotal').text(formatCurrency(currentOrder.total));
}

function resetOrder() {
    currentOrder = { items: [], subtotal: 0, total: 0, discount: 0, itemDiscount: 0, tax: 0, note: '', memberId: null };
    localStorage.setItem(STORAGE_KEYS.CURRENT_ORDER, JSON.stringify(currentOrder));
    updateOrder();
    $('#orderNote, #memberSearchInput').val('');
}

// --- [BARU] FUNGSI MANAJEMEN SHIFT ---
function checkActiveShift() {
    activeShift = shifts.find(s => s.userId === currentUser.id && s.status === 'active') || null;
    const $badge = $('#shiftStatusBadge');
    const $button = $('#shiftActionBtn');

    if (activeShift) {
        $badge.text(`Shift Aktif`).addClass('active');
        $button.text('Tutup Shift').removeClass('btn-warning').addClass('btn-danger');
    } else {
        $badge.text('Tidak Ada Shift Aktif').removeClass('active');
        $button.text('Mulai Shift').removeClass('btn-danger').addClass('btn-warning');
    }
}

function handleShiftAction() {
    if (activeShift) {
        // Tutup shift
        $('#endShiftForm')[0].reset();
        $('#shiftSummary').hide();
        $('#endShiftModal').css('display', 'flex');
    } else {
        // Mulai shift
        $('#startShiftForm')[0].reset();
        $('#startShiftModal').css('display', 'flex');
    }
}

function startShift() {
    const startCash = parseFloat($('#startCash').val());
    if (isNaN(startCash) || startCash < 0) {
        return showToast('Jumlah uang kas awal tidak valid.', 'error');
    }
    
    const newShift = {
        id: 'SFT' + moment().format('YYYYMMDDHHmmss'),
        userId: currentUser.id,
        userName: currentUser.name,
        startTime: new Date().toISOString(),
        endTime: null,
        startCash: startCash,
        status: 'active'
    };
    
    shifts.unshift(newShift);
    saveShifts();
    activeShift = newShift;
    checkActiveShift();
    $('#startShiftModal').hide();
    showToast(`Shift dimulai dengan modal ${formatCurrency(startCash)}.`, 'success');
}

function previewShiftSummary() {
    const endCash = parseFloat($('#endCash').val());
    if (isNaN(endCash) || !activeShift) {
        $('#shiftSummary').slideUp();
        return;
    }

    const shiftOrders = orders.filter(o => o.shiftId === activeShift.id);
    const cashSales = shiftOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    
    const expectedCash = activeShift.startCash + cashSales;
    const difference = endCash - expectedCash;
    
    $('#shiftSummary').html(`
        <div class="summary-row"><span>Uang Kas Awal:</span> <span>${formatCurrency(activeShift.startCash)}</span></div>
        <div class="summary-row"><span>Total Penjualan Tunai:</span> <span>${formatCurrency(cashSales)}</span></div>
        <div class="summary-row total-row" style="border-top: 1px solid #ddd;"><span>Harusnya di Laci:</span> <span>${formatCurrency(expectedCash)}</span></div>
        <div class="summary-row"><span>Aktual di Laci:</span> <span>${formatCurrency(endCash)}</span></div>
        <div class="summary-row total-row" style="color: ${difference !== 0 ? 'var(--danger)' : 'var(--success)'}"><span>Selisih:</span> <span>${formatCurrency(difference)}</span></div>
    `).slideDown();
}

function endShift() {
    const endCash = parseFloat($('#endCash').val());
    if (isNaN(endCash) || endCash < 0) {
        return showToast('Jumlah uang kas akhir tidak valid.', 'error');
    }

    const shiftIndex = shifts.findIndex(s => s.id === activeShift.id);
    if (shiftIndex === -1) return showToast('Shift aktif tidak ditemukan.', 'error');

    const shiftOrders = orders.filter(o => o.shiftId === activeShift.id);
    const cashSales = shiftOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    
    const expectedCash = activeShift.startCash + cashSales;
    const difference = endCash - expectedCash;
    
    const closedShift = {
        ...activeShift,
        endTime: new Date().toISOString(),
        endCash: endCash,
        totalCashSales: cashSales,
        expectedCash: expectedCash,
        cashDifference: difference,
        status: 'closed'
    };

    shifts[shiftIndex] = closedShift;
    saveShifts();
    activeShift = null;
    checkActiveShift();
    $('#endShiftModal').hide();
    showToast('Shift berhasil ditutup.', 'success');
}

// --- [BARU] FUNGSI LAPORAN CERDAS ---
function openRecapReportModal() {
    if (!checkPermission('canViewReports')) return;
    $('#recapReportPeriod').val('today').trigger('change');
    $('#recapReportResults').html('<div class="empty-state"><i class="fas fa-file-alt"></i><p>Pilih periode dan generate laporan untuk melihat data.</p></div>');
    $('#downloadRecapPdfBtn, #exportRecapExcelBtn, #printRecapBtn').hide();
    switchModalTab($('#recapReportModal'), 'shiftRecap');
    $('#recapReportModal').css('display', 'flex');
}

// [PENYEMPURNAAN] Tambah Nama Mitra di Laporan
function getReportHeader(title) {
    return `
        <div class="report-header">
            <h3>${settings.storeName}</h3>
            ${settings.partnerName ? `<h4>${settings.partnerName}</h4>` : ''}
            <h5>${title}</h5>
            <p>Dicetak pada: ${moment().format('D MMMM YYYY, HH:mm')}</p>
        </div>`;
}

// [PENYEMPURNAAN] Tambah Nama Mitra di Laporan
function generateRecapReport() {
    let startDate, endDate;
    const period = $('#recapReportPeriod').val();
    if (period === 'today') { startDate = moment().startOf('day'); endDate = moment().endOf('day'); }
    else if (period === 'this_week') { startDate = moment().startOf('week'); endDate = moment().endOf('week'); }
    else if (period === 'this_month') { startDate = moment().startOf('month'); endDate = moment().endOf('month'); }
    else if (period === 'this_year') { startDate = moment().startOf('year'); endDate = moment().endOf('year'); }
    else if (period === 'custom') {
        startDate = moment($('#recapStartDate').val());
        endDate = moment($('#recapEndDate').val()).endOf('day');
        if (!startDate.isValid() || !endDate.isValid() || endDate.isBefore(startDate)) return showToast('Rentang tanggal tidak valid', 'error');
    }

    const activeTab = $('#recapReportModal .tabs .tab.active').data('tab');
    const periodString = `Periode: ${startDate.format('D MMM YYYY')} - ${endDate.format('D MMM YYYY')}`;
    let reportHTML = "";
    
    if (activeTab === 'shiftRecap') {
        reportHTML = getReportHeader(`Laporan Harian (Shift) - ${periodString}`) + generateShiftRecapHTML(startDate, endDate);
    } else if (activeTab === 'profitLossRecap') {
        reportHTML = getReportHeader(`Laporan Laba Rugi - ${periodString}`) + generateProfitLossRecapHTML(startDate, endDate);
    } else if (activeTab === 'inventoryRecap') {
        reportHTML = getReportHeader(`Laporan Inventaris - ${periodString}`) + generateInventoryRecapHTML(startDate, endDate);
    }
    
    $('#recapReportResults').html(reportHTML);
    $('#downloadRecapPdfBtn, #exportRecapExcelBtn, #printRecapBtn').show();
}

function generateShiftRecapHTML(startDate, endDate) {
    const filteredShifts = shifts.filter(s => s.status === 'closed' && moment(s.endTime).isBetween(startDate, endDate));
    if (filteredShifts.length === 0) return '<div class="empty-state"><p>Tidak ada data shift pada periode ini.</p></div>';

    let tableHTML = `<table class="data-table" id="shiftReportTable"><thead><tr>
        <th>Kasir</th><th>Mulai</th><th>Selesai</th><th>Modal</th><th>Penjualan Tunai</th><th>Kas Akhir</th><th>Selisih</th>
    </tr></thead><tbody>`;

    let totalModal = 0, totalSales = 0, totalDiff = 0;
    filteredShifts.forEach(s => {
        totalModal += s.startCash;
        totalSales += s.totalCashSales;
        totalDiff += s.cashDifference;
        tableHTML += `<tr>
            <td>${s.userName}</td>
            <td>${moment(s.startTime).format('DD/MM HH:mm')}</td>
            <td>${moment(s.endTime).format('DD/MM HH:mm')}</td>
            <td>${formatCurrency(s.startCash)}</td>
            <td>${formatCurrency(s.totalCashSales)}</td>
            <td>${formatCurrency(s.endCash)}</td>
            <td class="${s.cashDifference !== 0 ? 'text-danger' : 'text-success'}">${formatCurrency(s.cashDifference)}</td>
        </tr>`;
    });
    tableHTML += `</tbody></table>`;

    return `
        <div class="recap-summary-card">
            <div class="title">Total Pendapatan Tunai (dari semua shift)</div>
            <div class="value">${formatCurrency(totalSales)}</div>
        </div>
        <h5>Rincian Laporan Harian (Shift)</h5>
        ${tableHTML}
    `;
}

function generateProfitLossRecapHTML(startDate, endDate) {
     const filteredOrders = orders.filter(o => moment(o.date).isBetween(startDate, endDate));
     if (filteredOrders.length === 0) return '<div class="empty-state"><p>Tidak ada data penjualan pada periode ini.</p></div>';

    let totalRevenue = 0, totalCost = 0, totalTransactions = filteredOrders.length;
    let totalItemDiscount = 0, totalMemberDiscount = 0; // [BARU]
    filteredOrders.forEach(order => {
        totalRevenue += order.subtotal; // [PERBAIKAN] Mulai dari subtotal kotor
        totalItemDiscount += order.itemDiscount || 0;
        totalMemberDiscount += order.discount || 0;
        // totalRevenue += order.subtotal - (order.discount || 0) - (order.itemDiscount || 0) + (order.tax || 0);
        order.items.forEach(item => {
            const itemCost = item.product.costPrice || 0;
            totalCost += itemCost * item.quantity;
        });
    });

    const totalDiscounts = totalItemDiscount + totalMemberDiscount;
    const netRevenue = totalRevenue - totalDiscounts; // Pendapatan bersih setelah diskon
    const grossProfit = netRevenue - totalCost; // Laba kotor = Pendapatan Bersih - HPP
    
    return `
        <div class="recap-summary-card" style="border-color: var(--success);">
            <div class="title">Total Laba Kotor</div>
            <div class="value" style="color: var(--success);">${formatCurrency(grossProfit)}</div>
        </div>
        <table class="data-table" id="profitLossReportTable">
            <tbody>
                <tr><td>Total Transaksi</td><td>${totalTransactions} Transaksi</td></tr>
                <tr><td>Total Penjualan (Kotor)</td><td class="text-success">${formatCurrency(totalRevenue)}</td></tr>
                <tr><td>Total Diskon Item (2%)</td><td class="text-danger">-${formatCurrency(totalItemDiscount)}</td></tr>
                <tr><td>Total Diskon Member</td><td class="text-danger">-${formatCurrency(totalMemberDiscount)}</td></tr>
                <tr><td style="font-weight:bold;">Total Penjualan (Bersih)</td><td style="font-weight:bold;">${formatCurrency(netRevenue)}</td></tr>
                <tr><td>Total Harga Pokok Penjualan (HPP)</td><td class="text-danger">-${formatCurrency(totalCost)}</td></tr>
                <tr><td style="font-weight:bold;">LABA KOTOR</td><td style="font-weight:bold;">${formatCurrency(grossProfit)}</td></tr>
            </tbody>
        </table>
    `;
}

function generateInventoryRecapHTML(startDate, endDate) {
    const stockIn = stockHistory.filter(s => s.type === 'supplier_in' && moment(s.date).isBetween(startDate, endDate));
    const returnsIn = returns.filter(r => moment(r.date).isBetween(startDate, endDate));

    let totalStockInValue = 0;
    stockIn.forEach(s => {
        const product = products.find(p => p.id === s.productId);
        // [PERBAIKAN] Nilai stok masuk harus berdasarkan harga Beli saat itu, bukan harga rata-rata
        // Kita bisa ekstrak dari notes jika ada, atau estimasi
        let costMatch = s.notes.match(/@Rp ([\d,]+)/);
        let cost = product ? product.costPrice : 0; // fallback ke costPrice saat ini
        if(costMatch && costMatch[1]) {
            cost = parseFloat(costMatch[1].replace(/,/g, ''));
        }
        totalStockInValue += s.quantityChange * cost;
    });

    let totalReturnValue = 0;
    returnsIn.forEach(r => {
        r.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            totalReturnValue += item.quantity * (product?.costPrice || 0); // Estimasi nilai retur
        });
    });
    
    return `
        <h5>Laporan Pasokan / Tambah Stok</h5>
        <div class="recap-summary-card" style="border-color: var(--info);">
            <div class="title">Total Nilai Stok Masuk (Estimasi)</div>
            <div class="value" style="color: var(--info);">${formatCurrency(totalStockInValue)}</div>
        </div>
        <table class="data-table" id="stockInReportTable"><thead><tr><th>Tanggal</th><th>Produk</th><th>Jumlah</th><th>Catatan</th><th>Nilai</th></tr></thead><tbody>
            ${stockIn.length > 0 ? stockIn.map(s => {
                const product = products.find(p => p.id === s.productId);
                let costMatch = s.notes.match(/@Rp ([\d,]+)/);
                let cost = product ? product.costPrice : 0;
                if(costMatch && costMatch[1]) {
                    cost = parseFloat(costMatch[1].replace(/,/g, ''));
                }
                return `<tr><td>${moment(s.date).format('DD/MM/YY')}</td><td>${s.productName}</td><td>+${s.quantityChange}</td><td>${s.notes}</td><td>${formatCurrency(s.quantityChange * cost)}</td></tr>`
            }).join('') : '<tr><td colspan="5" class="text-center">Tidak ada data stok masuk</td></tr>'}
        </tbody></table>
        <h5 class="mt-3">Laporan Retur</h5>
         <div class="recap-summary-card" style="border-color: var(--warning);">
            <div class="title">Total Nilai Barang Retur (Estimasi)</div>
            <div class="value" style="color: var(--warning);">${formatCurrency(totalReturnValue)}</div>
        </div>
        <table class="data-table" id="returnReportTable"><thead><tr><th>Tanggal</th><th>Kode Transaksi Asal</th><th>Alasan</th><th>Nilai Retur</th></tr></thead><tbody>
            ${returnsIn.length > 0 ? returnsIn.map(r => {
                let returnValue = 0;
                r.items.forEach(item => { const p = products.find(prod => prod.id === item.productId); returnValue += item.quantity * (p?.costPrice || 0); });
                return `<tr><td>${moment(r.date).format('DD/MM/YY')}</td><td>${r.originalOrderId}</td><td>${r.reason}</td><td>${formatCurrency(returnValue)}</td></tr>`
            }).join('') : '<tr><td colspan="4" class="text-center">Tidak ada data retur</td></tr>'}
        </tbody></table>
    `;
}

function downloadRecapAsPdf() {
    const element = document.getElementById('recapReportResults');
    const activeTab = $('#recapReportModal .tabs .tab.active').text().trim();
    const filename = `Laporan_${activeTab.replace(' ', '_')}_${moment().format('YYYYMMDD')}.pdf`;
    showToast('Mengunduh PDF...', 'info');

    html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        let heightLeft = pdfHeight;
        let position = 10;
        
        pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
        
        while (heightLeft >= 0) {
            position = heightLeft - pdfHeight + 10;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }
        pdf.save(filename);
    }).catch(err => { showToast('Gagal mengunduh PDF', 'error'); });
}

function exportRecapToExcel() {
    const activeTab = $('#recapReportModal .tabs .tab.active').data('tab');
    let tableId, filename;
    
    if (activeTab === 'shiftRecap') { tableId = 'shiftReportTable'; filename = 'Laporan_Shift.xlsx'; }
    else if (activeTab === 'profitLossRecap') { tableId = 'profitLossReportTable'; filename = 'Laporan_Laba_Rugi.xlsx'; }
    else if (activeTab === 'inventoryRecap') {
        // Export multiple tables to multiple sheets
        const wb = XLSX.utils.book_new();
        const stockInTable = document.getElementById('stockInReportTable');
        const returnTable = document.getElementById('returnReportTable');
        if(stockInTable) {
            const ws1 = XLSX.utils.table_to_sheet(stockInTable);
            XLSX.utils.book_append_sheet(wb, ws1, "Stok Masuk");
        }
         if(returnTable) {
            const ws2 = XLSX.utils.table_to_sheet(returnTable);
            XLSX.utils.book_append_sheet(wb, ws2, "Retur");
        }
        XLSX.writeFile(wb, "Laporan_Inventaris.xlsx");
        showToast('Laporan inventaris berhasil diekspor.', 'success');
        return;
    } else return;
    
    const table = document.getElementById(tableId);
    if (!table) return showToast('Tabel laporan tidak ditemukan.', 'error');
    
    const wb = XLSX.utils.table_to_book(table);
    XLSX.writeFile(wb, filename);
    showToast(`Laporan berhasil diekspor ke ${filename}.`, 'success');
}

// --- PRODUCT & CATEGORY MANAGEMENT ---
function loadProducts(searchTerm = '', category = 'all') {
    const lowerSearchTerm = searchTerm.toLowerCase();
    let filteredProducts = products.filter(p => (category === 'all' || p.category === category) && (!searchTerm || p.name.toLowerCase().includes(lowerSearchTerm)));
    $('#productCount').text(`(${filteredProducts.length} produk)`);
    const $productGrid = $('#productGrid').empty();
    if (filteredProducts.length === 0) {
        $productGrid.html('<div class="empty-state"><i class="fas fa-box-open"></i><p>Belum ada produk. Tambahkan produk melalui Admin Panel.</p></div>');
    } else {
        const canEdit = checkPermission('canEditProduct');
        const canDelete = checkPermission('canDeleteProduct');
        filteredProducts.forEach(product => {
            const stockClass = product.stock <= 0 ? 'out-of-stock' : (product.stock < 10 ? 'low' : '');
            const adminActions = (canEdit || canDelete) ? `
                <div class="product-actions">
                    ${canEdit ? `<div class="action-btn edit-btn edit-product" data-id="${product.id}"><i class="fas fa-edit"></i></div>` : ''}
                    ${canDelete ? `<div class="action-btn delete-btn delete-product" data-id="${product.id}"><i class="fas fa-trash"></i></div>` : ''}
                </div>` : '';
            const unit = product.unit || 'Pcs'; // [PENYEMPURNAAN]

            $productGrid.append(`
                <div class="product-card" data-id="${product.id}">${adminActions}
                    <div class="product-image">${product.image ? `<img src="${product.image}" alt="${product.name}" onerror="this.parentElement.innerHTML = '<i class=\\'fas fa-box\\'></i>';">` : `<i class="fas fa-box"></i>`}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${formatCurrency(product.price)}</div>
                    <div class="product-stock ${stockClass}">Stok: ${product.stock} ${unit}</div>
                    <div class="product-category">${product.category}</div>
                </div>`);
        });
    }
}

function openEditProductModal(product) {
    $('#productModal .modal-title').text(product ? 'Edit Produk' : 'Tambah Produk Baru');
    $('#productForm')[0].reset();
    $('#productId').val(product ? product.id : '');
    $('#productStock').prop('disabled', !!product);
    if (product) {
        $('#productName').val(product.name); 
        $('#productUnit').val(product.unit || 'Pcs'); // [PENYEMPURNAAN]
        $('#productCostPrice').val(product.costPrice || 0);
        $('#productPrice').val(product.price);
        $('#productStock').val(product.stock); 
        $('#productHasItemDiscount').prop('checked', product.hasItemDiscount || false); // [BARU]
        $('#productImage').val(product.image || '');
        $('#productDescription').val(product.description || ''); $('#productCategory').val(product.category);
    } else {
        $('#productHasItemDiscount').prop('checked', false); // [BARU] Default off
    }
    loadCategoriesForSelect();
    $('#productModal').css('display', 'flex');
}

// [PENYEMPURNAAN] saveProduct dengan Diskon 2%
function saveProduct() {
    const id = $('#productId').val(), name = $('#productName').val().trim(), category = $('#productCategory').val(),
          unit = $('#productUnit').val(), // [PENYEMPURNAAN] Mengambil dari select
          costPrice = parseFloat($('#productCostPrice').val()) || 0, price = parseFloat($('#productPrice').val()) || 0, 
          stock = parseInt($('#productStock').val()) || 0, 
          hasItemDiscount = $('#productHasItemDiscount').is(':checked'), // [BARU]
          image = $('#productImage').val().trim(), 
          description = $('#productDescription').val().trim();
    if (!name || !category || !unit || price <= 0) return showToast('Nama, kategori, satuan, dan harga jual harus valid', 'error');
    if(costPrice > price) return showToast('Harga pokok tidak boleh lebih besar dari harga jual', 'warning');
    
    const action = () => {
        if (id) {
            const index = products.findIndex(p => p.id === id);
            if (index > -1) products[index] = { 
                ...products[index], name, category, unit, costPrice, price, image, description, hasItemDiscount // [PENYEMPURNAAN]
            }; 
        } else {
            const newProduct = { 
                id: 'P' + moment().format('x'), name, category, unit, costPrice, price, stock, image, description, hasItemDiscount // [PENYEMPURNAAN]
            }; 
            products.unshift(newProduct);
            updateStock(newProduct.id, stock, 'initial', 'Stok awal produk baru');
        }
        saveProducts(); loadProducts(); $('#productModal').hide();
        showToast(`Produk ${id ? 'diperbarui' : 'disimpan'}`, 'success');
    };
    
    if (id) { 
        if(!checkPermission('canEditProduct')) return; 
        promptForPassword('item', action); 
    } else { 
        if(!checkPermission('canAddProduct')) return;
        action(); 
    }
}

// --- STOCK MANAGEMENT ---

// [PENYEMPURNAAN] Modal Stok
function openStockManagementModal() {
    switchModalTab($('#stockManagementModal'), 'stockIn');
    $('#stockInProductSearch').val(''); // Reset search
    $('#stockDetailsContainer').hide(); // [BARU] Sembunyikan detail
    $('#stockInForm')[0].reset(); // [PENYEMPURNAAN] Reset form
    loadProductsForStockIn();
    loadSuppliersForSelect();
    $('#stockManagementModal').css('display', 'flex');
}

// [PENYEMPURNAAN] Fungsi untuk memuat detail produk di form stok masuk
function loadProductStockDetails() {
    const productId = $('#stockInProduct').val();
    const product = products.find(p => p.id === productId);
    if (product) {
        $('#stockInCurrentStock').val(`${product.stock} ${product.unit || 'Pcs'}`);
        $('#stockInOldCost').val(formatCurrency(product.costPrice || 0));
        $('#stockInOldPrice').val(formatCurrency(product.price));
        $('#stockInNewCost').val(product.costPrice || 0); // Pre-fill new cost with old cost
        $('#stockInNewPrice').val(product.price); // Pre-fill new price with old price

        // [BARU] Tampilkan status diskon 2%
        const discountStatus = product.hasItemDiscount ? 'Aktif (2%)' : 'Non-Aktif';
        $('#stockDetailsContainer').find('#stockInDiscountStatus').remove(); // Hapus jika ada
        $('#stockDetailsContainer .d-flex').append(`
            <div class="form-group mb-0" style="flex: 1;" id="stockInDiscountStatus">
                <label class="form-label" style="font-size: 0.8rem;">Diskon 2%</label>
                <input type="text" class="form-control" value="${discountStatus}" disabled>
            </div>
        `);
        
        $('#stockDetailsContainer').slideDown();
    } else {
        $('#stockDetailsContainer').slideUp();
    }
}

// [REFACTOR] Fungsi updateStock hanya untuk kuantitas dan riwayat
function updateStock(productId, quantityChange, type, notes = '') {
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;

    const product = products[productIndex];
    const oldStock = product.stock;
    product.stock += quantityChange;
    if(product.stock < 0) product.stock = 0; 

    stockHistory.unshift({
        id: 'SH' + moment().format('x'),
        productId, productName: product.name, date: new Date().toISOString(),
        quantityChange, oldStock, newStock: product.stock,
        type, notes, userId: currentUser.id
    });
    
    // Hanya save produk jika dipanggil dari 'sale', 'opname', 'return', 'initial'
    // Pemanggil 'supplier_in' (addIncomingStock) akan save manual setelah update harga
    if (type !== 'supplier_in') {
        saveProducts();
    }
    saveStockHistory();
    loadProducts(); 
}

// [PENYEMPURNAAN] Logika addIncomingStock dengan WAC (Weighted Average Cost)
function addIncomingStock(e) {
    e.preventDefault();
    const productId = $('#stockInProduct').val();
    const quantityIn = parseInt($('#stockInQuantity').val());
    const newCostPrice = parseFloat($('#stockInNewCost').val()); // [BARU]
    const newSellingPrice = parseFloat($('#stockInNewPrice').val()); // [BARU]
    const supplierId = $('#stockInSupplier').val();
    const notes = $('#stockInNotes').val().trim();

    if(!productId || !quantityIn || quantityIn <= 0) return showToast('Produk dan jumlah harus valid.', 'error');
    if(isNaN(newCostPrice) || newCostPrice < 0) return showToast('Harga pokok baru tidak valid.', 'error'); // [BARU]

    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return showToast('Produk tidak ditemukan.', 'error');
    
    const product = products[productIndex];
    const oldStock = product.stock;
    const oldCostPrice = product.costPrice || 0;

    // --- [PENYEMPURNAAN] Kalkulasi Harga Pokok Rata-rata (Weighted Average Cost) ---
    const oldTotalValue = oldStock * oldCostPrice;
    const newTotalValue = quantityIn * newCostPrice;
    const newTotalStock = oldStock + quantityIn;
    // Hindari pembagian dengan nol jika stok awal 0
    const newAverageCost = (newTotalStock > 0) ? (oldTotalValue + newTotalValue) / newTotalStock : newCostPrice;
    
    // Update harga pokok produk
    product.costPrice = newAverageCost;

    // Update harga jual jika diisi dan valid
    if (!isNaN(newSellingPrice) && newSellingPrice > 0 && newSellingPrice !== product.price) {
        if (newSellingPrice < newAverageCost) {
            showToast('Peringatan: Harga Jual Baru lebih rendah dari Harga Pokok Rata-rata.', 'warning');
        }
        product.price = newSellingPrice;
    }
    // --- Akhir [PENYEMPURNAAN] ---

    const supplier = suppliers.find(s => s.id === supplierId);
    const sourceName = supplier ? supplier.name : "Pembelian Mandiri";
    // Catat harga beli baru di notes
    const fullNotes = `Dari: ${sourceName} | @${formatCurrency(newCostPrice)}` + (notes ? ` | ${notes}` : '');
    
    // Panggil updateStock HANYA untuk menambah jumlah & riwayat
    updateStock(productId, quantityIn, 'supplier_in', fullNotes);
    
    // Simpan perubahan harga (costPrice & price) ke produk
    saveProducts();
    loadProducts(); // Refresh product grid untuk harga baru
    
    showToast('Stok berhasil ditambahkan. Harga pokok & jual diperbarui.', 'success');
    $('#stockInForm')[0].reset();
    $('#stockInProductSearch').val('');
    $('#stockDetailsContainer').hide();
    loadProductsForStockIn();
}

function loadProductsForStockOpname(searchTerm = '') {
    $('#stockOpnameSummary').hide().empty();
    $('#printStockReportBtn, #downloadStockReportBtn').hide();
    const $list = $('#stockOpnameList').empty();
    const filtered = products.filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    filtered.forEach(p => {
        $list.append(`
            <tr data-product-id="${p.id}">
                <td>${p.name}</td>
                <td>${formatCurrency(p.costPrice || 0)}</td>
                <td class="system-stock">${p.stock}</td>
                <td><input type="number" class="qty-input physical-stock" value="${p.stock}" style="width: 70px;"></td>
                <td class="stock-diff">0</td>
                <td class="loss-value">Rp 0</td>
                <td><button class="btn btn-sm btn-info adjust-stock-btn" data-id="${p.id}">Sesuaikan</button></td>
            </tr>`);
    });

    $('.physical-stock').on('input', function() {
        const $row = $(this).closest('tr');
        const product = products.find(p => p.id === $row.data('productId'));
        if(!product) return;
        const physical = parseInt($(this).val()) || 0;
        const system = product.stock;
        const diff = physical - system;
        const loss = -diff * (product.costPrice || 0); // Kerugian dihitung dari harga pokok
        $row.find('.stock-diff').text(diff).css('color', diff < 0 ? 'var(--danger)' : 'var(--success)');
        $row.find('.loss-value').text(formatCurrency(loss)).css('color', loss > 0 ? 'var(--danger)' : 'var(--success)');
    });
}

function generateLossReport() {
    let totalDiscrepancyItems = 0;
    let totalLossValue = 0;
    $('#stockOpnameList tr').each(function() {
        const $row = $(this);
        const diff = parseInt($row.find('.stock-diff').text()) || 0;
        if (diff !== 0) {
            const product = products.find(p => p.id === $row.data('productId'));
            totalDiscrepancyItems++;
            totalLossValue -= diff * (product.costPrice || 0);
        }
    });
    const summaryHTML = `
        <h4>Ringkasan Kerugian Stok Opname</h4>
        <div class="summary-row"><span>Total Produk Berselisih:</span> <span>${totalDiscrepancyItems} item</span></div>
        <div class="summary-row total-row" style="color: ${totalLossValue > 0 ? 'var(--danger)' : 'var(--success)'}">
            <span>Total Nilai Kerugian (HPP):</span> <span>${formatCurrency(totalLossValue)}</span>
        </div>
        <small>${totalLossValue > 0 ? 'Nilai positif menunjukkan kerugian finansial.' : 'Nilai negatif menunjukkan kelebihan barang.'}</small>
    `;
    $('#stockOpnameSummary').html(summaryHTML).slideDown();
    $('#printStockReportBtn, #downloadStockReportBtn').show();
}

function adjustStock(productId) {
    const physicalStock = parseInt($(`#stockOpnameList tr[data-product-id="${productId}"] .physical-stock`).val());
    if (isNaN(physicalStock)) return showToast('Stok fisik tidak valid.', 'error');
    
    const product = products.find(p => p.id === productId);
    const difference = physicalStock - product.stock;

    if (difference === 0) return showToast('Tidak ada perubahan stok.', 'info');

    promptForPassword('item', () => {
        updateStock(productId, difference, 'opname_adjustment', `Penyesuaian stok opname`);
        showToast(`Stok ${product.name} berhasil disesuaikan.`, 'success');
        loadProductsForStockOpname($('#stockOpnameSearch').val());
    });
}

function loadStockHistory(searchTerm = '') {
    const $list = $('#stockHistoryList').empty();
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = stockHistory.filter(h => 
        !searchTerm || 
        h.productName.toLowerCase().includes(lowerSearchTerm) ||
        (h.notes && h.notes.toLowerCase().includes(lowerSearchTerm)) ||
        (lowerSearchTerm === 'retur' && h.type === 'return')
    );
    const typeLabels = {
        sale: 'Penjualan', supplier_in: 'Stok Masuk', opname_adjustment: 'Opname', initial: 'Stok Awal', 'return': 'Retur'
    };
    filtered.slice(0, 200).forEach(h => {
        const changeClass = h.quantityChange > 0 ? 'text-success' : 'text-danger';
        const typeClass = h.type === 'return' ? 'text-danger' : '';
        $list.append(`
            <tr class="${typeClass}">
                <td>${moment(h.date).format('DD/MM/YY HH:mm')}</td>
                <td>${h.productName}</td>
                <td class="${changeClass}">${h.quantityChange > 0 ? '+' : ''}${h.quantityChange}</td>
                <td><span class="product-category">${typeLabels[h.type] || h.type}</span></td>
                <td>${h.newStock}</td>
                <td>${h.notes || '-'}</td>
            </tr>
        `);
    });
}

// --- SUPPLIER MANAGEMENT ---
function openManageSuppliersModal() {
    resetSupplierForm();
    loadSuppliersForManagement();
    $('#manageSuppliersModal').css('display', 'flex');
}

// [PERBAIKAN] loadSuppliersForManagement dengan Link WA
function loadSuppliersForManagement() {
    const $list = $('#suppliersList').empty();
    if (suppliers.length === 0) return $list.html('<div class="empty-state"><i class="fas fa-truck"></i><p>Belum ada suplier</p></div>');
    suppliers.forEach(s => {
        const waPhone = formatWaNumber(s.phone);
        const phoneLink = waPhone ? `<a href="https://wa.me/${waPhone}" target="_blank" class="whatsapp-link">${s.phone}</a>` : s.phone;
        const contactDisplay = s.contactPerson || '-';

        $list.append(`
            <div class="order-item">
                <div class="order-item-info">
                    <div class="order-item-name">${s.name}</div>
                    <div class="order-item-price">${contactDisplay} | ${phoneLink}</div>
                </div>
                <div class="order-item-qty gap-2">
                     <i class="fas fa-edit edit-supplier" style="cursor:pointer; color: var(--info);" data-id="${s.id}"></i>
                     <i class="fas fa-trash delete-supplier" style="cursor:pointer; color: var(--danger);" data-id="${s.id}"></i>
                </div>
            </div>
        `);
    });
}

function resetSupplierForm() {
    $('#supplierForm')[0].reset(); $('#supplierIdInput').val('');
    $('#supplierFormTitle').text('Tambah Suplier Baru');
}

function saveSupplier(e) {
    e.preventDefault();
    const id = $('#supplierIdInput').val(), name = $('#supplierName').val().trim(), contact = $('#supplierContactPerson').val().trim(), phone = $('#supplierPhone').val().trim();
    if(!name || !phone) return showToast('Nama dan Telepon suplier wajib diisi.', 'error');

    if(id) {
        const index = suppliers.findIndex(s => s.id === id);
        if(index > -1) suppliers[index] = {...suppliers[index], name, contactPerson: contact, phone};
    } else {
        suppliers.unshift({ id: 'SUP' + moment().format('x'), name, contactPerson: contact, phone });
    }
    saveSuppliers();
    loadSuppliersForManagement();
    $('#supplierFormContainer').slideUp();
    showToast(`Suplier berhasil ${id ? 'diperbarui' : 'disimpan'}.`, 'success');
}
function editSupplier(id) {
    const s = suppliers.find(sup => sup.id === id);
    if(!s) return;
    $('#supplierFormTitle').text('Edit Suplier');
    $('#supplierIdInput').val(s.id); $('#supplierName').val(s.name);
    $('#supplierContactPerson').val(s.contactPerson || ''); $('#supplierPhone').val(s.phone);
    $('#supplierFormContainer').slideDown();
}
function deleteSupplier(id) {
    promptForPassword('item', () => {
        showConfirmation('Hapus Suplier', 'Yakin ingin menghapus suplier ini?', () => {
            suppliers = suppliers.filter(s => s.id !== id);
            saveSuppliers(); loadSuppliersForManagement();
            showToast('Suplier berhasil dihapus.', 'success');
        });
    });
}

// --- RETURN MANAGEMENT ---
function openProcessReturnModal() {
    $('#findOrderForReturnForm')[0].reset();
    $('#returnOrderDetails, #completeReturnBtn').hide();
    $('#processReturnModal').css('display', 'flex');
}

function findOrderForReturn(e) {
    e.preventDefault();
    const orderId = $('#returnOrderIdInput').val().trim();
    const order = orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());
    if(!order) {
        $('#returnOrderDetails, #completeReturnBtn').hide();
        return showToast('Transaksi tidak ditemukan.', 'error');
    }
    
    $('#returnOrderId').text(order.id);
    $('#returnCustomerName').text(order.customerName);
    const $list = $('#returnItemsList').empty();
    order.items.forEach(item => {
        $list.append(`
            <div class="order-item">
                <div class="order-item-info">
                     <div class="order-item-name">${item.product.name}</div>
                     <div class="order-item-price">Dibeli: ${item.quantity}</div>
                </div>
                <div class="d-flex align-center gap-2">
                    <label class="form-label mb-0">Qty Retur:</label>
                    <input type="number" class="qty-input return-qty" style="width:50px" min="0" max="${item.quantity}" value="0" data-product-id="${item.product.id}">
                </div>
            </div>`);
    });
    $('#returnOrderDetails, #completeReturnBtn').show();
}

function completeReturn() {
    const orderId = $('#returnOrderId').text();
    const reason = $('#returnReason').val().trim();
    if(!reason) return showToast('Alasan retur harus diisi.', 'error');

    const returnedItems = [];
    $('.return-qty').each(function() {
        const qty = parseInt($(this).val());
        if (qty > 0) {
            returnedItems.push({ productId: $(this).data('productId'), quantity: qty });
        }
    });

    if (returnedItems.length === 0) return showToast('Tidak ada item yang dipilih untuk diretur.', 'warning');
    
    promptForPassword('item', () => {
        returnedItems.forEach(item => {
            updateStock(item.productId, item.quantity, 'return', `Retur dari ${orderId}. Alasan: ${reason}`);
        });
        
        const returnRecord = {
            id: 'RET' + moment().format('x'), originalOrderId: orderId,
            date: new Date().toISOString(), items: returnedItems, reason,
            processedByUserId: currentUser.id
        };
        returns.unshift(returnRecord);
        saveReturns();

        showToast('Proses retur berhasil.', 'success');
        $('#processReturnModal').hide();
    });
}

// --- OTHER UTILITIES & HELPERS ---

// [PENYEMPURNAAN] Struk dengan Nama Mitra dan Diskon Item
function generateReceiptHTML(order) {
    const member = members.find(m => m.id === order.memberId);
    let itemsHTML = order.items.map(item => `
        <div class="receipt-item">
            <div class="receipt-item-details">
                <div class="item-name">${item.product.name}</div>
                <div class="item-price-calc">${item.quantity} x ${formatCurrency(item.product.price)}</div>
            </div>
            <span>${formatCurrency(item.product.price * item.quantity)}</span>
        </div>`).join('');

    return `
    <div id="receiptContent">
        <div class="receipt-header">
            <div class="receipt-title">${settings.storeName}</div>
            ${settings.partnerName ? `<div class="receipt-partner-name">${settings.partnerName}</div>` : ''} <div>${settings.storeAddress}</div>
            <div>Telp: ${settings.storePhone}</div>
        </div>
        <div class="receipt-info">
            <div><span>Tanggal:</span> <span>${moment(order.date).format('DD/MM/YY HH:mm')}</span></div>
            <div><span>No. Trx:</span> <span>${order.id}</span></div>
            <div><span>Kasir:</span> <span>${order.cashier.name}</span></div>
            <div><span>Pelanggan:</span> <span>${order.customerName}</span></div>
            ${member ? `<div><span>Member:</span> <span>${member.name} (${member.id})</span></div>` : ''}
        </div>
        <div id="receiptItemsContainer">${itemsHTML}</div>
        ${order.note ? `<div style="font-size:10px; font-style:italic; padding: 5px 0; border-top: 1px dashed #000;">Catatan: ${order.note}</div>` : ''}
        <div class="receipt-total">
            <div class="receipt-item"><span>Subtotal</span> <span>${formatCurrency(order.subtotal)}</span></div>
            ${(order.itemDiscount || 0) > 0 ? `<div class="receipt-item"><span>Diskon Item</span> <span>-${formatCurrency(order.itemDiscount)}</span></div>` : ''}
            ${order.discount > 0 ? `<div class="receipt-item"><span>Diskon Member</span> <span>-${formatCurrency(order.discount)}</span></div>` : ''}
            ${order.tax > 0 ? `<div class="receipt-item"><span>Pajak</span> <span>${formatCurrency(order.tax)}</span></div>` : ''}
            <div class="receipt-item" style="font-weight:bold; font-size: 14px;"><span>TOTAL</span> <span>${formatCurrency(order.total)}</span></div>
            <div class="receipt-item"><span>${{ cash: 'Tunai', transfer: 'Transfer', ewallet: 'E-Wallet' }[order.paymentMethod]}</span> <span>${formatCurrency(order.paymentAmount)}</span></div>
            <div class="receipt-item"><span>Kembali</span> <span>${formatCurrency(order.change)}</span></div>
        </div>
        <div class="receipt-footer">
            <p>Terima kasih telah berbelanja</p>
            <p style="margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px;">
                www.aplikasiusaha.com &copy; 2025
            </p>
        </div>
    </div>`;
}

function handleEditProductClick(e) { e.stopPropagation(); if (checkPermission('canEditProduct')) openEditProductModal(products.find(p => p.id === $(this).data('id'))); }
function handleDeleteProductClick(e) {
    e.stopPropagation(); if (!checkPermission('canDeleteProduct')) return;
    const productId = $(this).data('id');
    promptForPassword('item', () => showConfirmation('Hapus Produk', 'Yakin ingin menghapus produk ini?', () => {
        products = products.filter(p => p.id !== productId);
        saveProducts(); loadProducts(); showToast('Produk berhasil dihapus', 'success');
    }));
}
function handleRemoveItemClick() {
    const productId = $(this).data('id');
    const productName = currentOrder.items.find(item => item.product.id === productId)?.product.name;
    currentOrder.items = currentOrder.items.filter(item => item.product.id !== productId);
    updateOrder(); if (productName) showToast(`${productName} dihapus`, 'info');
}
function handleQtyChange() {
    const productId = $(this).data('id');
    let quantity = parseInt($(this).val()) || 1;
    const item = currentOrder.items.find(i => i.product.id === productId);
    if(!item) return;

    const product = products.find(p => p.id === productId);
    if (quantity > product.stock) {
        quantity = product.stock;
        showToast(`Stok ${product.name} hanya tersisa ${product.stock}.`, 'warning');
    }
    if (quantity < 1) quantity = 1;

    $(this).val(quantity);
    item.quantity = quantity;
    updateOrder();
}
function handleMemberSearch() {
    const searchTerm = $(this).val().trim().toLowerCase();
    const $results = $('#memberSearchResults');
    if (searchTerm.length === 0) { $results.hide(); if (currentOrder.memberId) { currentOrder.memberId = null; updateOrder(); } return; }
    const filteredMembers = members.filter(m => m.name.toLowerCase().includes(searchTerm) || m.id.toLowerCase().includes(searchTerm) || m.phone.includes(searchTerm));
    $results.empty().show();
    if (filteredMembers.length > 0) filteredMembers.forEach(m => $results.append(`<div class="member-search-item" data-id="${m.id}">${m.name} (${m.id})</div>`));
    else $results.append('<div class="member-search-item disabled">Member tidak ditemukan</div>');
}
function handleMemberSelect() {
    const member = members.find(m => m.id === $(this).data('id'));
    if (member) { $('#memberSearchInput').val(`${member.name} (${member.id})`); currentOrder.memberId = member.id; updateOrder(); }
    $('#memberSearchResults').hide();
}
function openProcessOrderModal() {
    if (currentOrder.items.length === 0) return showToast('Keranjang kosong', 'warning');
    if (!activeShift) return showToast('Harap mulai shift kerja terlebih dahulu.', 'warning');
    const member = members.find(m => m.id === currentOrder.memberId);
    $('#customerName').val(member ? member.name : '');
    updateOrderSummary(); updatePaymentTab();
    switchModalTab($('#processOrderModal'), 'payment');
    $('#processOrderModal').css('display', 'flex');
}
function calculateChange() {
    const amount = parseFloat($('#paymentAmount').val()) || 0;
    const change = amount - currentOrder.total;
    $('#changeContainer').toggle(change >= 0);
    $('#paymentChange').text(formatCurrency(change));
}

// [PERBAIKAN] updateOrderSummary dengan Diskon Item
function updateOrderSummary() {
    let discountText = '', taxText = '';
    
    if (currentOrder.memberId && (settings.isMemberDiscountEnabled || false)) {
        const minPurchase = settings.memberDiscountMinPurchase || 0;
        const subtotalForMemberDiscount = currentOrder.subtotal - currentOrder.itemDiscount;
        if (subtotalForMemberDiscount > minPurchase) {
            discountText = `Diskon Member (${settings.memberDiscountPercent ?? 0}%)`;
        } else {
            discountText = `Diskon (Min. ${formatCurrency(minPurchase)})`;
        }
    } else if (!currentOrder.memberId && settings.nonMemberDiscountPercent > 0) {
         discountText = `Diskon (${settings.nonMemberDiscountPercent ?? 0}%)`;
    }

    if (currentOrder.tax > 0) {
        taxText = `Pajak (${settings.taxPercent || 0}%)`;
    }
    
    const summaryHTML = currentOrder.items.map(item => `<div class="summary-row"><span>${item.product.name} (${item.quantity}x)</span><span>${formatCurrency(item.product.price * item.quantity)}</span></div>`).join('') +
        `<div class="summary-row" style="border-top: 1px dashed #ddd; margin-top: 8px; padding-top: 8px;"><span>Subtotal:</span><span>${formatCurrency(currentOrder.subtotal)}</span></div>` +
        ((currentOrder.itemDiscount || 0) > 0 ? `<div class="summary-row"><span>Diskon Item (2%):</span><span>-${formatCurrency(currentOrder.itemDiscount)}</span></div>` : '') +
        (currentOrder.discount > 0 ? `<div class="summary-row"><span>${discountText}:</span><span>-${formatCurrency(currentOrder.discount)}</span></div>` : '') +
        (currentOrder.tax > 0 ? `<div class="summary-row"><span>${taxText}:</span><span>${formatCurrency(currentOrder.tax)}</span></div>` : '') +
        `<div class="summary-row total-row"><span>Total:</span><span>${formatCurrency(currentOrder.total)}</span></div>`;
    $('#orderSummary').html(summaryHTML);
}

function updatePaymentTab() {
    $('#paymentTotal').text(formatCurrency(currentOrder.total));
    $('#paymentAmount').val('').trigger('input');
    const $quickCash = $('#quickCashButtons').empty();
    const total = currentOrder.total;
    if (total > 0) {
        const denominations = [...new Set([total, Math.ceil(total / 10000) * 10000, 50000, 100000].filter(d => d >= total))].sort((a,b) => a-b).slice(0,3);
        denominations.forEach(amount => $quickCash.append(`<button class="btn btn-sm btn-outline-primary quick-cash-btn" data-amount="${amount}">${amount === total ? 'Uang Pas' : formatCurrency(amount)}</button>`));
    }
}
function openManageCategoriesModal() { loadCategoriesForManagement(); $('#manageCategoriesModal').css('display', 'flex'); }
function loadCategories() {
    const $filterRow = $('.filter-row').html('<div class="filter-chip active" data-category="all">Semua</div>');
    categories.forEach(category => $filterRow.append(`<div class="filter-chip" data-category="${category.name}">${category.name}</div>`));
}
function loadCategoriesForSelect() {
    const $select = $('#productCategory').empty();
    if (categories.length === 0) $select.append('<option value="" disabled selected>Tidak ada kategori</option>');
    else categories.forEach(category => $select.append(`<option value="${category.name}">${category.name}</option>`));
}
function loadCategoriesForManagement() {
    const $list = $('#categoriesList').empty();
    if (categories.length === 0) $list.html('<div class="empty-state"><i class="fas fa-tags"></i><p>Belum ada kategori</p></div>');
    else {
        categories.forEach(category => {
            const productCount = products.filter(p => p.category === category.name).length;
            $list.append(`<div class="order-item"><div class="order-item-info"><div class="order-item-name">${category.name}</div><div class="order-item-price">${productCount} produk</div></div><div class="order-item-qty"><i class="fas fa-trash remove-item remove-category" data-id="${category.id}" style="cursor:pointer; color: var(--danger);"></i></div></div>`);
        });
    }
}
function addCategory() {
    const name = $('#newCategoryName').val().trim();
    if (!name) return showToast('Nama kategori harus diisi', 'error'); // [PERBAIKAN]
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) return showToast('Kategori sudah ada', 'error');
    categories.unshift({ id: 'C' + moment().format('x'), name }); // [PERBAIKAN]
    saveCategories(); loadCategories(); loadCategoriesForManagement(); $('#newCategoryName').val(''); showToast('Kategori ditambahkan', 'success'); // [PERBAIKAN]
}
function removeCategory() {
    const categoryId = $(this).data('id'), category = categories.find(c => c.id === categoryId);
    if (products.some(p => p.category === category.name)) return showToast('Kategori sedang digunakan', 'error');
    promptForPassword('item', () => {
        categories = categories.filter(c => c.id !== categoryId);
        saveCategories(); loadCategories(); loadCategoriesForManagement(); showToast('Kategori dihapus', 'success');
    });
}
function backupData() {
    try {
        const backup = { products, categories, orders, settings, users, members, suppliers, stockHistory, returns, shifts, backupDate: new Date().toISOString() };
        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(backup), ENCRYPTION_KEY).toString();
        const linkElement = document.createElement('a');
        linkElement.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(encryptedData);
        linkElement.download = `backup_supermarket_${moment().format('YYYYMMDD_HHmmss')}.lksbackup`;
        linkElement.click();
        showToast('Backup data terenkripsi berhasil', 'success');
    } catch (err) { showToast('Gagal membuat backup terenkripsi', 'error'); }
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
            if (data.products && data.categories && data.orders && data.settings) {
                showConfirmation('Restore Data', 'Data saat ini akan diganti oleh file backup. Lanjutkan?', () => restoreData(data));
            } else throw new Error("Invalid backup file.");
        } catch (err) { showToast('Gagal memproses file backup.', 'error'); }
    };
    reader.readAsText(file);
}
function restoreData(data) {
    try {
        Object.keys(STORAGE_KEYS).forEach(key => localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data[key.toLowerCase().replace(/_/g,'')] || [])));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
        showToast('Data berhasil direstore. Aplikasi akan dimuat ulang.', 'success');
        setTimeout(() => location.reload(), 1500);
    } catch (e) { showToast('Gagal melakukan restore data', 'error'); }
}
function resetAllData() { Object.values(STORAGE_KEYS).forEach(key => { if (key !== STORAGE_KEYS.USER) localStorage.removeItem(key); }); showToast('Semua data berhasil direset. Aplikasi akan dimuat ulang.', 'success'); setTimeout(() => location.reload(), 1500); }
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
    const type = $('#passwordPromptTitle').text().includes('Kontrol Panel') ? 'panel' : 'item';
    const correctHash = type === 'panel' ? settings.panelSecurityCode : settings.itemSecurityCode;
    if (CryptoJS.SHA256(password).toString() === correctHash) {
        $('#passwordPromptModal').hide();
        if (passwordPromptCallback) passwordPromptCallback();
        passwordPromptCallback = null;
    } else {
        showToast('Password keamanan salah.', 'error');
    }
}
function switchModalTab(modal, tabName) {
    modal.find('.tabs .tab').removeClass('active');
    modal.find('.tab-content').removeClass('active');
    modal.find(`[data-tab="${tabName}"]`).addClass('active');
    modal.find(`#${tabName}Tab`).addClass('active');
    
    if (modal.attr('id') === 'recapReportModal') {
         $('#recapReportResults').html('<div class="empty-state"><i class="fas fa-file-alt"></i><p>Pilih periode dan generate laporan untuk melihat data.</p></div>');
         $('#downloadRecapPdfBtn, #exportRecapExcelBtn, #printRecapBtn').hide();
    } else if(modal.attr('id') === 'stockManagementModal') {
        if(tabName === 'stockOpname') {
            loadProductsForStockOpname();
            $('#printStockReportBtn, #downloadStockReportBtn').hide();
        } else if(tabName === 'stockHistory') {
            loadStockHistory();
            $('#printStockReportBtn, #downloadStockReportBtn').show();
        } else {
            $('#printStockReportBtn, #downloadStockReportBtn').hide();
        }
    }
}
function showReceiptModal(order) {
    const receiptHTML = generateReceiptHTML(order);
    $('#receiptModalBody').html(receiptHTML);
    $('#downloadReceiptPdfBtn').data('order', order);
    $('#receiptModal').css('display', 'flex');
}
function downloadReceiptAsPdf() {
    const order = $('#downloadReceiptPdfBtn').data('order'); if (!order) return;
    const element = document.getElementById('receiptModalBody').querySelector('#receiptContent');
    const filename = `Struk-${order.id}.pdf`; showToast('Mengunduh PDF...', 'info');
    html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height); pdf.save(filename);
    }).catch(err => { showToast('Gagal mengunduh PDF', 'error'); });
}
function formatCurrency(amount) { return 'Rp ' + (amount != null ? amount : 0).toLocaleString('id-ID'); }

// [BARU] Helper function untuk format nomor WA
function formatWaNumber(phone) {
    if (!phone) return '';
    let num = phone.replace(/[\s-()]/g, ''); // Hapus spasi, strip, kurung
    if (num.startsWith('0')) {
        num = '62' + num.substring(1);
    } else if (num.startsWith('+62')) {
        num = num.substring(1);
    }
    // Hanya return jika sepertinya valid (mulai dgn 62, panjang > 9)
   return /^(628)\d{8,12}$/.test(num) ? num : ''; 
}

// [BARU] Fungsi untuk Notifikasi Premium
let notificationTimer = null; // Timer untuk auto-hide

function showPremiumNotification() {
    const $modal = $('#premiumNotificationModal');
    
    // Hapus timer lama jika ada
    if (notificationTimer) {
        clearTimeout(notificationTimer);
    }
    
    $modal.removeClass('hiding').css('display', 'flex');
    
    // Set timer baru untuk auto-hide setelah 12 detik
    notificationTimer = setTimeout(() => {
        hidePremiumNotification();
    }, 12000); // 12000 ms = 12 detik
}

function hidePremiumNotification() {
    const $modal = $('#premiumNotificationModal');
    
    // Hapus timer auto-hide jika tombol close diklik manual
    if (notificationTimer) {
        clearTimeout(notificationTimer);
        notificationTimer = null;
    }
    
    // Tambahkan kelas animasi hide, lalu sembunyikan setelah animasi selesai
    $modal.addClass('hiding');
    setTimeout(() => {
        $modal.hide().removeClass('hiding');
    }, 500); // 500ms = durasi animasi slideOutToRight
}
// AKHIR DARI [BARU] Fungsi Notifikasi

function showToast(message, type = 'info', duration = 3000) {
    const $toast = $('#toast');
    $toast.removeClass('success error warning info').addClass(type);
    $('#toast-message').text(message); $toast.addClass('show');
    setTimeout(() => $toast.removeClass('show'), duration);
}
function setButtonLoading($button, isLoading, originalText = 'Login') {
    if (isLoading) $button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Memproses...');
    else $button.prop('disabled', false).html(originalText);
}
function showConfirmation(title, message, onConfirm, type = 'success') {
    $('#confirmTitle').text(title); $('#confirmMessage').text(message);
    const $confirmBtn = $('#confirmAction');
    $confirmBtn.off('click').on('click', () => { onConfirm(); $('#confirmationModal').hide(); });
    $confirmBtn.removeClass('btn-success btn-danger').addClass(type === 'danger' ? 'btn-danger' : 'btn-success');
    $('#confirmationModal').css('display', 'flex');
}
function updateCurrentDate() { $('#currentDate').text(moment().format('dddd, D MMMM YYYY'));
}

function openReportsModal() {
    $('#reportPeriod').val('today').trigger('change');
    $('#reportResults').empty();
    $('#reportsModal').css('display', 'flex');
}

// [PENYEMPURNAAN] Laporan dengan Nama Mitra
function generateReport() {
    let startDate, endDate;
    const period = $('#reportPeriod').val();
    if (period === 'today') { startDate = moment().startOf('day'); endDate = moment().endOf('day'); }
    else if (period === 'week') { startDate = moment().startOf('week'); endDate = moment().endOf('week'); }
    else if (period === 'month') { startDate = moment().startOf('month'); endDate = moment().endOf('month'); }
    else if (period === 'custom') {
        startDate = moment($('#reportStartDate').val());
        endDate = moment($('#reportEndDate').val()).endOf('day');
        if (!startDate.isValid() || !endDate.isValid() || endDate.isBefore(startDate)) return showToast('Rentang tanggal tidak valid', 'error');
    }

    const reportType = $('#reportsModal .tabs .tab.active').data('tab');
    const periodString = `Periode: ${startDate.format('D MMM YYYY')} - ${endDate.format('D MMM YYYY')}`;
    let reportHTML = getReportHeader(`Laporan Penjualan - ${periodString}`);
    
    if (reportType === 'salesReport') {
        const filteredOrders = orders.filter(o => moment(o.date).isBetween(startDate, endDate));
        if (filteredOrders.length === 0) return $('#reportResults').html('<div class="empty-state"><p>Tidak ada data penjualan pada periode ini.</p></div>');
        let totalSales = 0, totalDiscount = 0, totalTax = 0, totalTransactions = filteredOrders.length;
        let topProducts = {};
        filteredOrders.forEach(order => {
            totalSales += order.total;
            totalDiscount += (order.discount || 0) + (order.itemDiscount || 0); // [PERBAIKAN] Jumlahkan semua diskon
            totalTax += order.tax || 0;
            order.items.forEach(item => {
                topProducts[item.product.name] = (topProducts[item.product.name] || 0) + item.quantity;
            });
        });
        const sortedProducts = Object.entries(topProducts).sort((a, b) => b[1] - a[1]).slice(0, 5);

        reportHTML += `
            <div class="summary-container mt-3">
                <div class="summary-row"><span>Total Transaksi:</span> <span>${totalTransactions}</span></div>
                <div class="summary-row"><span>Total Penjualan:</span> <span>${formatCurrency(totalSales)}</span></div>
                <div class="summary-row"><span>Total Diskon:</span> <span>${formatCurrency(totalDiscount)}</span></div>
                <div class="summary-row"><span>Total Pajak:</span> <span>${formatCurrency(totalTax)}</span></div>
            </div>
            <h5 class="mt-3">Produk Terlaris</h5>
            <ul class="list-group">${sortedProducts.map(p => `<li class="list-group-item" style="border:none; padding-left: 0;">${p[0]} (${p[1]} terjual)</li>`).join('')}</ul>
        `;
    }
    $('#reportResults').html(reportHTML);
}

function openHistoryModal() {
    loadTransactionHistory();
    $('#historyModal').css('display', 'flex');
}

function loadTransactionHistory(searchTerm = '') {
    const $results = $('#historyResults').empty();
    const filtered = orders.filter(o => !searchTerm || o.id.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filtered.length === 0) return $results.html('<div class="empty-state"><p>Tidak ada transaksi.</p></div>');
    
    let tableHTML = `<table class="data-table"><thead><tr><th>Kode</th><th>Tanggal</th><th>Kasir</th><th>Total</th><th>Aksi</th></tr></thead><tbody>`;
    filtered.slice(0, 100).forEach(order => {
        tableHTML += `
            <tr>
                <td>${order.id}</td>
                <td>${moment(order.date).format('DD/MM/YY HH:mm')}</td>
                <td>${order.cashier.name}</td>
                <td>${formatCurrency(order.total)}</td>
                <td><button class="btn btn-sm reprint-receipt" data-id="${order.id}">Cetak Ulang</button></td>
            </tr>
        `;
    });
    tableHTML += `</tbody></table>`;
    $results.html(tableHTML);
}

function openManageMembersModal() {
    resetMemberForm();
    loadMembersForManagement();
    $('#manageMembersModal').css('display', 'flex');
}

// [PERBAIKAN] loadMembersForManagement dengan Link WA
function loadMembersForManagement(searchTerm = '') {
    const $list = $('#membersList').empty();
    const filtered = members.filter(m => !searchTerm || m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.id.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm));
    if (filtered.length === 0) return $list.html('<div class="empty-state"><p>Belum ada member terdaftar.</p></div>');
    filtered.forEach(m => {
        const waPhone = formatWaNumber(m.phone);
        const phoneLink = waPhone ? `<a href="https://wa.me/${waPhone}" target="_blank" class="whatsapp-link">${m.phone}</a>` : m.phone;
        
        $list.append(`
            <div class="order-item">
                <div class="order-item-info">
                    <div class="order-item-name">${m.name} <span class="member-badge">${m.id}</span></div>
                    <div class="order-item-price">${phoneLink} | Total Belanja: ${formatCurrency(m.totalSpent || 0)}</div>
                </div>
                <div class="order-item-qty gap-2">
                    <i class="fas fa-id-card kta-member" style="cursor:pointer; color: var(--success);" data-id="${m.id}"></i>
                    <i class="fas fa-edit edit-member" style="cursor:pointer; color: var(--info);" data-id="${m.id}"></i>
                </div>
            </div>
        `);
    });
}

function resetMemberForm() {
    $('#memberForm')[0].reset();
    $('#memberIdInput').val('');
    $('#memberFormTitle').text('Tambah Member Baru');
    $('#deleteMemberBtn').hide();
    $('#memberAdminFields').hide();
}

function saveMember(e) {
    e.preventDefault();
    const id = $('#memberIdInput').val();
    const name = $('#memberName').val().trim();
    const phone = $('#memberPhone').val().trim();
    const address = $('#memberAddress').val().trim();
    if (!name || !phone) return showToast('Nama dan No. Telepon wajib diisi.', 'error');
    
    if (id) {
        const index = members.findIndex(m => m.id === id);
        if (index > -1) members[index] = { ...members[index], name, phone, address };
    } else {
        members.unshift({
            id: 'M' + moment().format('YYMMDDHHmmss'), name, phone, address,
            joinDate: new Date().toISOString(), transactions: 0, totalSpent: 0
        });
    }
    saveMembers();
    loadMembersForManagement();
    $('#memberFormContainer').slideUp();
    showToast(`Member berhasil ${id ? 'diperbarui' : 'disimpan'}.`, 'success');
}

function editMember(id) {
    const member = members.find(m => m.id === id);
    if (!member) return;
    resetMemberForm();
    $('#memberFormTitle').text('Edit Member');
    $('#memberIdInput').val(member.id);
    $('#memberName').val(member.name);
    $('#memberPhone').val(member.phone);
    $('#memberAddress').val(member.address || '');
    
    $('#memberTransactions').val(member.transactions || 0);
    $('#memberTotalSpent').val(formatCurrency(member.totalSpent || 0));
    $('#memberAdminFields').show();
    
    $('#deleteMemberBtn').data('id', member.id).toggle(checkPermission('canDeleteMember'));
    $('#memberFormContainer').slideDown();
}

function deleteMember(id) {
    promptForPassword('item', () => {
        showConfirmation('Hapus Member', 'Yakin ingin menghapus member ini?', () => {
            members = members.filter(m => m.id !== id);
            saveMembers();
            loadMembersForManagement();
            resetMemberForm();
            $('#memberFormContainer').slideUp();
            showToast('Member berhasil dihapus.', 'success');
        }, 'danger');
    });
}

function openKtaModal(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    $('#ktaStoreName').text(settings.storeName);
    $('#ktaStoreContact').text(`${settings.storeAddress}, ${settings.storePhone}`);
    $('#ktaMemberName').text(member.name);
    $('#ktaMemberId').text(`ID: ${member.id}`);
    const $qrContainer = $('#ktaQrcodeImg').empty();
    new QRCode($qrContainer[0], { text: member.id, width: 140, height: 140 });
    $('#ktaModal').css('display', 'flex');
}

function downloadKtaAsPdf() {
    const element = document.getElementById('ktaCard');
    const memberName = $('#ktaMemberName').text();
    const filename = `KTA_${memberName.replace(' ', '_')}.pdf`;
    showToast('Mengunduh KTA PDF...', 'info');
    html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height]});
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(filename);
    }).catch(err => { showToast('Gagal mengunduh PDF', 'error'); });
}

// [PENYEMPURNAAN] Modal Info Toko dengan Nama Mitra
function openManageStoreInfoModal() {
    $('#storeName').val(settings.storeName).prop('disabled', true); // [PENYEMPURNAAN] Kunci Nama Toko
    $('#partnerName').val(settings.partnerName || ''); // [BARU]
    $('#storeAddress').val(settings.storeAddress);
    $('#storePhone').val(settings.storePhone);
    $('#storeEmail').val(settings.storeEmail);
    $('#manageStoreInfoModal').css('display', 'flex');
}

function updateStoreInfo() {
    $('#storeNameHeader').text(settings.storeName || 'SUPERMARKET');
}

// [PENYEMPURNAAN] Simpan Info Toko dengan Nama Mitra
function saveStoreInfo() {
    // settings.storeName = $('#storeName').val().trim(); // [DIHAPUS] Tidak bisa diubah
    settings.partnerName = $('#partnerName').val().trim(); // [BARU]
    settings.storeAddress = $('#storeAddress').val().trim();
    settings.storePhone = $('#storePhone').val().trim();
    settings.storeEmail = $('#storeEmail').val().trim();
    saveSettings();
    updateStoreInfo();
    $('#manageStoreInfoModal').hide();
    showToast('Info toko berhasil diperbarui.', 'success');
}

// [PERBAIKAN] openControlPanel dengan Kontrol Diskon Member
function openControlPanel() {
    promptForPassword('panel', () => {
        switchModalTab($('#controlPanelModal'), 'users');
        loadUsers();
        
        // [PERBAIKAN] Load seting diskon baru
        const isDiscountEnabled = settings.isMemberDiscountEnabled || false;
        $('#isMemberDiscountEnabled').prop('checked', isDiscountEnabled);
        $('#memberDiscount').val(settings.memberDiscountPercent ?? 0);
        $('#memberDiscountMinPurchase').val(settings.memberDiscountMinPurchase ?? 0);
        $('#nonMemberDiscount').val(settings.nonMemberDiscountPercent ?? 0);
        $('#taxPercent').val(settings.taxPercent ?? 0);
        
        // [BARU] Tambah event listener untuk toggle
        $('#memberDiscountSettingsContainer').toggle(isDiscountEnabled);
        $('#isMemberDiscountEnabled').off('change').on('change', function() {
            $('#memberDiscountSettingsContainer').slideToggle($(this).is(':checked'));
        });

        $('#controlPanelModal').css('display', 'flex');
    });
}

function loadUsers() {
    const $list = $('#usersList').empty();
    users.forEach(u => {
        $list.append(`
            <div class="order-item">
                <div class="order-item-info">
                    <div class="order-item-name">${u.name}</div>
                    <div class="order-item-price">${u.username} | ${settings.roles[u.role]?.label || u.role}</div>
                </div>
                <div class="order-item-qty gap-2">
                    ${u.username !== 'Admin' ? `
                    <i class="fas fa-edit edit-user" style="cursor:pointer; color: var(--info);" data-id="${u.id}"></i>
                    <i class="fas fa-trash delete-user" style="cursor:pointer; color: var(--danger);" data-id="${u.id}"></i>
                    ` : ''}
                </div>
            </div>
        `);
    });
}

function resetUserForm() {
    $('#userForm')[0].reset();
    $('#userIdInput').val('');
    $('#userFormTitle').text('Tambah Pengguna');
}

function saveUser(e) {
    e.preventDefault();
    const id = $('#userIdInput').val();
    const name = $('#userName').val().trim();
    const username = $('#userUsername').val().trim();
    let password = $('#userPassword').val().trim();
    const role = $('#userRole').val();

    if (!name || !username) return showToast('Nama dan Username wajib diisi.', 'error');
    
    if (id) {
        const index = users.findIndex(u => u.id === id);
        if (index > -1) {
            if (password) users[index].password = CryptoJS.SHA256(password).toString();
            users[index] = {...users[index], name, username, role };
        }
    } else {
        if (!password) return showToast('Password wajib diisi untuk pengguna baru.', 'error');
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) return showToast('Username sudah ada.', 'error');
        users.push({
            id: 'U' + moment().format('x'), name, username,
            password: CryptoJS.SHA256(password).toString(), role
        });
    }
    saveUsers();
    loadUsers();
    $('#userFormContainer').slideUp();
    showToast(`Pengguna berhasil ${id ? 'diperbarui' : 'disimpan'}.`, 'success');
}

function editUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    resetUserForm();
    $('#userFormTitle').text('Edit Pengguna');
    $('#userIdInput').val(user.id);
    $('#userName').val(user.name);
    $('#userUsername').val(user.username);
    $('#userRole').val(user.role);
    $('#userPassword').val('');
    $('#userFormContainer').slideDown();
}

function deleteUser(id) {
    showConfirmation('Hapus Pengguna', 'Yakin ingin menghapus pengguna ini?', () => {
        users = users.filter(u => u.id !== id);
        saveUsers();
        loadUsers();
        showToast('Pengguna berhasil dihapus.', 'success');
    }, 'danger');
}

function changeSecurityCode(e) {
    e.preventDefault();
    const formId = $(this).attr('id');
    const newPassword = formId === 'itemSecurityForm' ? $('#itemSecurityCode').val() : $('#panelSecurityCode').val();
    if (newPassword.length < 4) return showToast('Password minimal 4 karakter.', 'error');
    
    if (formId === 'itemSecurityForm') settings.itemSecurityCode = CryptoJS.SHA256(newPassword).toString();
    else settings.panelSecurityCode = CryptoJS.SHA256(newPassword).toString();
    
    saveSettings();
    $(this)[0].reset();
    showToast('Password keamanan berhasil diubah.', 'success');
}

function changeOwnPassword(e) {
    e.preventDefault();
    const currentPass = $('#currentPassword').val();
    const newPass = $('#newPassword').val();
    if (newPass.length < 6) return showToast('Password baru minimal 6 karakter.', 'error');
    if (CryptoJS.SHA256(currentPass).toString() !== currentUser.password) return showToast('Password saat ini salah.', 'error');
    
    currentUser.password = CryptoJS.SHA256(newPass).toString();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if(userIndex > -1) users[userIndex] = currentUser;
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    saveUsers();
    $(this)[0].reset();
    showToast('Password login Anda berhasil diubah.', 'success');
}

// [PERBAIKAN] saveTaxDiscountSettings dengan Kontrol Diskon Member
function saveTaxDiscountSettings(e) {
    e.preventDefault();
    settings.isMemberDiscountEnabled = $('#isMemberDiscountEnabled').is(':checked');
    settings.memberDiscountPercent = parseFloat($('#memberDiscount').val()) || 0;
    settings.memberDiscountMinPurchase = parseFloat($('#memberDiscountMinPurchase').val()) || 0;
    settings.nonMemberDiscountPercent = parseFloat($('#nonMemberDiscount').val()) || 0;
    settings.taxPercent = parseFloat($('#taxPercent').val()) || 0;
    saveSettings();
    showToast('Pengaturan diskon & pajak berhasil disimpan.', 'success');
}

function openRoleManagementModal() {
    const $tabs = $('#roleTabsContainer').empty();
    Object.keys(settings.roles).forEach((roleId, index) => {
        $tabs.append(`<div class="tab ${index === 0 ? 'active' : ''}" data-tab="${roleId}">${settings.roles[roleId].label}</div>`);
    });
    
    $tabs.find('.tab').click(function() {
        const roleId = $(this).data('tab');
        $tabs.find('.tab').removeClass('active');
        $(this).addClass('active');
        loadPermissionsForRole(roleId);
    });

    loadPermissionsForRole(Object.keys(settings.roles)[0]);
    $('#roleManagementModal').css('display', 'flex');
}

function loadPermissionsForRole(roleId) {
    const $container = $('#rolePermissionsContainer').empty();
    const role = settings.roles[roleId];
    if (!role) return;

    const permissions = getAllPermissions(false);
    const userPermissions = role.permissions || {};
    
    let html = '';
    for (const group in permissions) {
        html += `<div class="permission-group"><div class="permission-group-title">${group.replace(/([A-Z])/g, ' $1').trim()}</div>`;
        for (const perm in permissions[group]) {
            html += `
                <div class="form-check permission-item">
                    <input type="checkbox" id="perm_${perm}" data-perm="${perm}" ${userPermissions[perm] ? 'checked' : ''} ${!role.isEditable ? 'disabled' : ''}>
                    <label for="perm_${perm}">${permissions[group][perm]}</label>
                </div>
            `;
        }
        html += `</div>`;
    }
    $container.html(html);
}

function saveRolePermissions() {
    const activeRole = $('#roleTabsContainer .tab.active').data('tab');
    if (!settings.roles[activeRole] || !settings.roles[activeRole].isEditable) return;
    
    $('#rolePermissionsContainer input[type="checkbox"]').each(function() {
        settings.roles[activeRole].permissions[$(this).data('perm')] = $(this).is(':checked');
    });
    saveSettings();
    showToast(`Hak akses untuk ${settings.roles[activeRole].label} berhasil disimpan.`, 'success');
    $('#roleManagementModal').hide();
}

function getAllPermissions(isFullAccess = false) {
     return {
        "Manajemen Produk": { canAddProduct: "Tambah Produk", canEditProduct: "Edit Produk", canDeleteProduct: "Hapus Produk", canManageCategories: "Kelola Kategori"},
        "Manajemen Inventaris": { canManageStock: "Kelola Stok (Masuk/Opname)", canManageSuppliers: "Kelola Suplier", canProcessReturn: "Proses Retur" },
        "Laporan & Histori": { canViewReports: "Lihat Laporan", canViewHistory: "Lihat Histori Transaksi" },
        "Manajemen Pengguna & Toko": { canManageMembers: "Kelola Member", canDeleteMember: "Hapus Member", canManageStoreInfo: "Kelola Info Toko"},
        "Akses Panel Admin": { canAccessControlPanel: "Akses Kontrol Panel (Pengguna, Keamanan, dll.)" },
        "Data Master": { canBackupRestore: "Backup & Restore Data", canResetData: "Reset Semua Data" }
    };
}

function checkPermission(permissionName) {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return settings.roles[currentUser.role]?.permissions?.[permissionName] || false;
}

function printElement(selector) {
    const content = $(selector).html();
    const $printContainer = $('#print-container');
    $printContainer.html(content).show();
    window.print();
    $printContainer.hide().empty();
}

function printStockReport() {
    const activeTab = $('#stockManagementModal .tabs .tab.active').data('tab');
    if(activeTab === 'stockOpname') printElement('#stockOpnamePrintArea');
    else if (activeTab === 'stockHistory') printElement('#stockHistoryPrintArea');
}

function downloadStockReportAsPdf() {
    const activeTab = $('#stockManagementModal .tabs .tab.active').data('tab');
    const element = document.getElementById(activeTab === 'stockOpname' ? 'stockOpnamePrintArea' : 'stockHistoryPrintArea');
    const filename = `Laporan_Stok_${activeTab}_${moment().format('YYYYMMDD')}.pdf`;
    showToast('Mengunduh PDF...', 'info');
    html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth - 20, pdfHeight - 20);
        pdf.save(filename);
    }).catch(err => { showToast('Gagal mengunduh PDF', 'error'); });
}

function generateCaptcha() {
    const canvas = document.getElementById('captchaCanvas');
    const ctx = canvas.getContext('2d');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    captchaText = '';
    for (let i = 0; i < 6; i++) {
        captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f0f2f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '24px Poppins';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(captchaText, canvas.width / 2, canvas.height / 2);
    
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.strokeStyle = '#ccc';
        ctx.stroke();
    }
}

function loadProductsForStockIn() {
    const $select = $('#stockInProduct').empty();
    products.sort((a,b) => a.name.localeCompare(b.name)).forEach(p => {
        $select.append(`<option value="${p.id}">${p.name} (Stok: ${p.stock})</option>`);
    });
}

function loadSuppliersForSelect() {
    const $select = $('#stockInSupplier').html('<option value="pembelian_mandiri">Pembelian Mandiri (Kulak)</option>');
    suppliers.forEach(s => $select.append(`<option value="${s.id}">${s.name}</option>`));
}

function saveProducts() { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); }
function saveCategories() { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }
function saveOrders() { localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders)); }
function saveSettings() { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }
function saveUsers() { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }
function saveMembers() { localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members)); }
function saveSuppliers() { localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers)); }
function saveStockHistory() { localStorage.setItem(STORAGE_KEYS.STOCK_HISTORY, JSON.stringify(stockHistory)); }
function saveReturns() { localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns)); }
function saveShifts() { localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts)); }
