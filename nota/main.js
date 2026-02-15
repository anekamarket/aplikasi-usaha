// Local storage keys
const STORAGE_KEYS = {
    PRODUCTS: 'online_store_products',
    TRANSACTIONS: 'online_store_transactions',
    STORE_INFO: 'online_store_info',
    CURRENT_CART: 'online_store_current_cart',
    SETTINGS: 'online_store_settings'
};

// Initialize data
let products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || [];
let transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
let storeInfo = JSON.parse(localStorage.getItem(STORAGE_KEYS.STORE_INFO)) || null;
let settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {
    taxRate: 10,
    discountType: 'percentage',
    discountValue: 0
};

// Current transaction
let currentCart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_CART)) || {
    items: [],
    discount: 0,
    tax: 0,
    additionalFee: 0,
    additionalFeeDescription: '',
    subtotal: 0,
    total: 0
};

// Toast notification function
function showToast(message, type = 'info', duration = 3000) {
    const toast = $('#toast');
    const toastMessage = $('#toast-message');
    
    toast.removeClass('success error warning info').addClass(type);
    toastMessage.text(message);
    toast.addClass('show');
    
    setTimeout(() => {
        toast.removeClass('show');
    }, duration);
}

// Show loading overlay
function showLoading(message = 'Memproses...') {
    $('#loadingText').text(message);
    $('#loadingOverlay').fadeIn();
}

// Hide loading overlay
function hideLoading() {
    $('#loadingOverlay').fadeOut();
}

// Confirmation dialog
function showConfirmation(message, callback) {
    $('#confirmationMessage').text(message);
    $('#confirmationDialog').show();
    
    $('#confirmOk').off('click').on('click', function() {
        $('#confirmationDialog').hide();
        if (typeof callback === 'function') {
            callback(true);
        }
    });
    
    $('#confirmCancel').off('click').on('click', function() {
        $('#confirmationDialog').hide();
        if (typeof callback === 'function') {
            callback(false);
        }
    });
}

// Format currency
function formatCurrency(amount) {
    return 'Rp ' + (amount || 0).toLocaleString('id-ID');
}

// Generate PDF from receipt
function generatePDF(elementId, filename) {
    const element = document.getElementById(elementId);
    const opt = {
        margin: 10,
        filename: filename || 'receipt.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    return html2pdf().set(opt).from(element).save();
}

// Calculate discount
function calculateDiscount(subtotal) {
    if (settings.discountType === 'percentage') {
        return subtotal * (settings.discountValue / 100);
    } else {
        return Math.min(settings.discountValue, subtotal);
    }
}

// Create backup data
function createBackupData() {
    return {
        products: JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || [],
        transactions: JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [],
        storeInfo: JSON.parse(localStorage.getItem(STORAGE_KEYS.STORE_INFO)) || null,
        settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {
            taxRate: 10,
            discountType: 'percentage',
            discountValue: 0
        }
    };
}

// Download backup file
function downloadBackup() {
    const backupData = createBackupData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `backup_${moment().format('YYYYMMDD_HHmmss')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Restore from backup
function restoreFromBackup(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const backupData = JSON.parse(e.target.result);
                resolve(backupData);
            } catch (error) {
                reject('Format file backup tidak valid');
            }
        };
        
        reader.onerror = function() {
            reject('Gagal membaca file');
        };
        
        reader.readAsText(file);
    });
}

$(document).ready(function() {
    // Set current date
    updateCurrentDate();
    
    // Update date every minute
    setInterval(updateCurrentDate, 60000);
    
    // Load settings
    loadSettings();
    
    // Show setup modal if store info not set
    if (!storeInfo) {
        $('#setupModal').show();
    } else {
        initializeApp();
    }
    
    // Settings button click
    $('#settingsButton').click(function() {
        $('#settingsModal').show();
    });
    
    // Close settings modal
    $('.close-settings-modal').click(function() {
        $('#settingsModal').hide();
    });
    
    // Save settings
    $('.save-settings').click(function() {
        const taxRate = parseFloat($('#taxRate').val()) || 0;
        const discountType = $('#discountType').val();
        const discountValue = parseFloat($('#discountValue').val()) || 0;
        
        // Validate inputs
        if (taxRate < 0 || taxRate > 100) {
            showToast('Persentase pajak harus antara 0-100%', 'error');
            return;
        }
        
        if (discountValue < 0) {
            showToast('Nilai diskon tidak boleh negatif', 'error');
            return;
        }
        
        // Update settings
        settings = {
            taxRate: taxRate,
            discountType: discountType,
            discountValue: discountValue
        };
        
        // Save to local storage
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        
        // Update UI
        $('#taxPercentage').text(taxRate);
        
        // Update cart calculations
        updateCart();
        
        // Show success message
        showToast('Pengaturan berhasil disimpan', 'success');
        
        // Close modal
        $('#settingsModal').hide();
    });
    
    // Discount type change
    $('#discountType').change(function() {
        if ($(this).val() === 'percentage') {
            $('#discountValueType').val('percentage');
        } else {
            $('#discountValueType').val('fixed');
        }
    });
    
    // Backup data button
    $('#backupDataBtn').click(function() {
        showLoading('Menyiapkan backup data...');
        
        setTimeout(() => {
            downloadBackup();
            hideLoading();
            showToast('Backup data berhasil diunduh', 'success');
        }, 500);
    });
    
    // Restore data from file
    $('#restoreFile').change(function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        showConfirmation('Restore data akan menggantikan semua data saat ini. Lanjutkan?', (confirmed) => {
            if (confirmed) {
                showLoading('Memproses file backup...');
                
                restoreFromBackup(file)
                    .then(backupData => {
                        // Validate backup data
                        if (!backupData.products || !backupData.transactions || !backupData.settings) {
                            throw new Error('Format backup tidak valid');
                        }
                        
                        // Save backup data to local storage
                        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(backupData.products));
                        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(backupData.transactions));
                        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(backupData.settings));
                        
                        if (backupData.storeInfo) {
                            localStorage.setItem(STORAGE_KEYS.STORE_INFO, JSON.stringify(backupData.storeInfo));
                        }
                        
                        // Reload data
                        products = backupData.products;
                        transactions = backupData.transactions;
                        settings = backupData.settings;
                        if (backupData.storeInfo) storeInfo = backupData.storeInfo;
                        
                        // Reset cart
                        resetCart();
                        
                        // Reload UI
                        loadProducts();
                        loadSettings();
                        
                        // Show success message
                        showToast('Data berhasil di-restore', 'success');
                    })
                    .catch(error => {
                        showToast(error.message || 'Gagal memproses backup', 'error');
                    })
                    .finally(() => {
                        hideLoading();
                        $('#restoreFile').val('');
                    });
            } else {
                $('#restoreFile').val('');
            }
        });
    });
    
    // Store setup form handler
    $('#setupForm').submit(function(e) {
        e.preventDefault();
        const storeName = $('#storeName').val().trim();
        const userRole = $('input[name="userRole"]:checked').val();
        const userPosition = $('#userPosition').val();
        const storeAddress = $('#storeAddress').val().trim();
        const storePhone = $('#storePhone').val().trim();
        
        // Reset error messages
        $('.error-message').hide().text('');
        
        // Validate inputs
        let isValid = true;
        
        if (!storeName) {
            $('#storeNameError').text('Nama toko harus diisi').show();
            isValid = false;
        }
        
        if (!storeAddress) {
            $('#storeAddressError').text('Alamat toko harus diisi').show();
            isValid = false;
        }
        
        if (!storePhone) {
            $('#storePhoneError').text('Nomor HP harus diisi').show();
            isValid = false;
        } else if (!/^[0-9]{10,13}$/.test(storePhone)) {
            $('#storePhoneError').text('Nomor HP harus 10-13 digit angka').show();
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Show loading
        showLoading('Menyimpan setup toko...');
        
        // Simulate async operation
        setTimeout(() => {
            // Save store info
            storeInfo = {
                storeName: storeName,
                userRole: userRole,
                userPosition: userPosition,
                storeAddress: storeAddress,
                storePhone: storePhone,
                setupDate: new Date()
            };
            
            localStorage.setItem(STORAGE_KEYS.STORE_INFO, JSON.stringify(storeInfo));
            
            // Initialize app
            initializeApp();
            
            // Hide setup modal
            $('#setupModal').hide();
            
            // Hide loading
            hideLoading();
            
            // Show success toast
            showToast('Setup toko berhasil disimpan', 'success');
        }, 1000);
    });
    
    // Role radio button change
    $('input[name="userRole"]').change(function() {
        if ($(this).val() === 'owner') {
            $('#userPosition').val('owner');
        } else {
            $('#userPosition').val('kasir');
        }
    });
    
    // Add product button
    $('#addProductBtn').click(function() {
        $('#productModalTitle').text('Tambah Produk');
        $('#productId').val('');
        $('#productName').val('');
        $('#productCategory').val('');
        $('#productPrice').val('');
        $('#productStock').val('');
        $('.error-message').hide();
        $('#productModal').show();
    });
    
    // Save product
    $('.save-product').click(function() {
        const productId = $('#productId').val();
        const productName = $('#productName').val().trim();
        const productCategory = $('#productCategory').val().trim();
        const productPrice = parseFloat($('#productPrice').val()) || 0;
        const productStock = parseInt($('#productStock').val()) || 0;
        
        // Reset error messages
        $('.error-message').hide().text('');
        
        // Validate inputs
        let isValid = true;
        
        if (!productName) {
            $('#productNameError').text('Nama produk harus diisi').show();
            isValid = false;
        }
        
        if (!productCategory) {
            $('#productCategoryError').text('Kategori harus diisi').show();
            isValid = false;
        }
        
        if (productPrice <= 0) {
            $('#productPriceError').text('Harga harus lebih dari 0').show();
            isValid = false;
        }
        
        if (productStock < 0) {
            $('#productStockError').text('Stok tidak boleh negatif').show();
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Show loading
        showLoading('Menyimpan produk...');
        
        // Simulate async operation
        setTimeout(() => {
            if (productId) {
                // Edit existing product
                const productIndex = products.findIndex(p => p.id === productId);
                if (productIndex !== -1) {
                    products[productIndex] = {
                        ...products[productIndex],
                        name: productName,
                        category: productCategory,
                        price: productPrice,
                        stock: productStock
                    };
                    
                    showToast('Produk berhasil diperbarui', 'success');
                }
            } else {
                // Add new product
                const newProduct = {
                    id: 'P' + moment().format('YYYYMMDDHHmmss'),
                    name: productName,
                    category: productCategory,
                    price: productPrice,
                    stock: productStock
                };
                
                products.push(newProduct);
                showToast('Produk berhasil ditambahkan', 'success');
            }
            
            // Save products
            saveProducts();
            
            // Refresh product list
            loadProducts();
            
            // Close modal
            $('#productModal').hide();
            
            // Hide loading
            hideLoading();
        }, 800);
    });
    
    // Edit product (delegated event)
    $(document).on('click', '.edit-product', function() {
        const productId = $(this).data('id');
        const product = products.find(p => p.id === productId);
        
        if (product) {
            $('#productModalTitle').text('Edit Produk');
            $('#productId').val(product.id);
            $('#productName').val(product.name);
            $('#productCategory').val(product.category);
            $('#productPrice').val(product.price);
            $('#productStock').val(product.stock);
            $('.error-message').hide();
            $('#productModal').show();
        }
    });
    
    // Delete product (delegated event)
    $(document).on('click', '.delete-product', function() {
        const productId = $(this).data('id');
        const product = products.find(p => p.id === productId);
        
        showConfirmation(`Apakah Anda yakin ingin menghapus produk "${product?.name || 'ini'}"?`, (confirmed) => {
            if (confirmed) {
                showLoading('Menghapus produk...');
                
                setTimeout(() => {
                    products = products.filter(p => p.id !== productId);
                    saveProducts();
                    loadProducts();
                    
                    hideLoading();
                    showToast('Produk berhasil dihapus', 'success');
                }, 800);
            }
        });
    });
    
    // Add product to cart (delegated event)
    $(document).on('click', '.add-to-cart', function() {
        const productId = $(this).data('id');
        const product = products.find(p => p.id === productId);
        
        if (product) {
            // Check if product is out of stock
            if (product.stock <= 0) {
                showToast('Stok produk habis', 'error');
                return;
            }
            
            // Check if product already in cart
            const existingItem = currentCart.items.find(item => item.product.id === productId);
            
            if (existingItem) {
                // Check if quantity exceeds stock
                if (existingItem.quantity + 1 > product.stock) {
                    showToast('Jumlah melebihi stok yang tersedia', 'error');
                    return;
                }
                existingItem.quantity += 1;
            } else {
                currentCart.items.push({
                    product: product,
                    quantity: 1
                });
            }
            
            updateCart();
            showToast(`${product.name} ditambahkan ke keranjang`, 'success');
        }
    });
    
    // Remove item from cart (delegated event)
    $(document).on('click', '.remove-from-cart', function() {
        const productId = $(this).data('id');
        const product = products.find(p => p.id === productId);
        currentCart.items = currentCart.items.filter(item => item.product.id !== productId);
        updateCart();
        
        if (product) {
            showToast(`${product.name} dihapus dari keranjang`, 'info');
        }
    });
    
    // Update item quantity in cart (delegated event)
    $(document).on('change', '.cart-item-quantity', function() {
        const productId = $(this).data('id');
        const quantity = parseInt($(this).val()) || 1;
        
        const item = currentCart.items.find(item => item.product.id === productId);
        if (item) {
            // Check if quantity exceeds stock
            const product = products.find(p => p.id === productId);
            if (product && quantity > product.stock) {
                showToast('Jumlah melebihi stok yang tersedia', 'error');
                $(this).val(item.quantity); // Reset to previous value
                return;
            }
            
            item.quantity = quantity;
            updateCart();
        }
    });
    
    // Additional fee button
    $('#addAdditionalFeeBtn').click(function() {
        // Reset additional fee form
        $('#feeNone').prop('checked', true);
        $('#shippingFeeAmount').val('');
        $('#otherFeeAmount').val('');
        $('#otherFeeDescription').val('');
        $('#charCount').text('0');
        $('#shippingFeeDetails').hide();
        $('#otherFeeDetails').hide();
        
        $('#additionalFeeModal').show();
    });
    
    // Additional fee option change
    $('input[name="additionalFee"]').change(function() {
        const selectedOption = $(this).val();
        
        $('#shippingFeeDetails').hide();
        $('#otherFeeDetails').hide();
        
        if (selectedOption === 'shipping') {
            $('#shippingFeeDetails').show();
        } else if (selectedOption === 'other') {
            $('#otherFeeDetails').show();
        }
    });
    
    // Character count for description
    $('#otherFeeDescription').on('input', function() {
        const charCount = $(this).val().length;
        $('#charCount').text(charCount);
    });
    
    // Save additional fee
    $('.save-additional-fee').click(function() {
        const selectedOption = $('input[name="additionalFee"]:checked').val();
        
        if (selectedOption === 'shipping') {
            const shippingFee = parseFloat($('#shippingFeeAmount').val()) || 0;
            if (shippingFee < 0) {
                showToast('Biaya kirim tidak boleh negatif', 'error');
                return;
            }
            
            currentCart.additionalFee = shippingFee;
            currentCart.additionalFeeDescription = 'Biaya Kirim/Antar';
        } else if (selectedOption === 'other') {
            const otherFee = parseFloat($('#otherFeeAmount').val()) || 0;
            const description = $('#otherFeeDescription').val().trim();
            
            if (otherFee < 0) {
                showToast('Biaya tidak boleh negatif', 'error');
                return;
            }
            
            if (description === '') {
                showToast('Keterangan biaya harus diisi', 'error');
                return;
            }
            
            currentCart.additionalFee = otherFee;
            currentCart.additionalFeeDescription = description;
        } else {
            currentCart.additionalFee = 0;
            currentCart.additionalFeeDescription = '';
        }
        
        updateCart();
        $('#additionalFeeModal').hide();
        showToast('Biaya tambahan berhasil disimpan', 'success');
    });
    
    // Close additional fee modal
    $('.close-additional-fee-modal').click(function() {
        $('#additionalFeeModal').hide();
    });
    
    // Complete payment
    $('#completePayment').click(function() {
        const paymentAmount = parseFloat($('#paymentAmount').val()) || 0;
        
        if (currentCart.items.length === 0) {
            showToast('Keranjang belanja kosong', 'warning');
            return;
        }
        
        if (paymentAmount < currentCart.total) {
            showToast('Jumlah pembayaran kurang dari total', 'error');
            return;
        }
        
        showConfirmation('Selesaikan transaksi ini dan cetak struk?', (confirmed) => {
            if (confirmed) {
                showLoading('Menyelesaikan transaksi...');
                
                setTimeout(() => {
                    // Create transaction
                    const transaction = {
                        id: 'T' + moment().format('YYYYMMDDHHmmss'),
                        date: new Date(),
                        items: currentCart.items,
                        subtotal: currentCart.subtotal,
                        discount: currentCart.discount,
                        tax: currentCart.tax,
                        additionalFee: currentCart.additionalFee,
                        additionalFeeDescription: currentCart.additionalFeeDescription,
                        total: currentCart.total,
                        paymentMethod: $('input[name="paymentMethod"]:checked').val(),
                        paymentAmount: paymentAmount,
                        change: paymentAmount - currentCart.total,
                        cashier: storeInfo.userPosition === 'owner' ? 'Owner' : 'Kasir'
                    };
                    
                    // Update product stock
                    transaction.items.forEach(item => {
                        const productIndex = products.findIndex(p => p.id === item.product.id);
                        if (productIndex !== -1) {
                            products[productIndex].stock -= item.quantity;
                            if (products[productIndex].stock < 0) products[productIndex].stock = 0;
                        }
                    });
                    
                    // Save products with updated stock
                    saveProducts();
                    
                    // Add to transactions
                    transactions.unshift(transaction);
                    saveTransactions();
                    
                    // Generate receipt
                    generateReceipt(transaction);
                    
                    // Show receipt for printing
                    $('#receiptPrint').show();
                    
                    // Print receipt automatically after a short delay
                    setTimeout(() => {
                        window.print();
                        $('#receiptPrint').hide();
                    }, 500);
                    
                    // Reset cart
                    resetCart();
                    
                    // Hide loading
                    hideLoading();
                    
                    // Show success message
                    showToast('Transaksi berhasil disimpan!', 'success');
                }, 1000);
            }
        });
    });
    
    // Print receipt button
    $(document).on('click', '#printReceiptBtn', function() {
        window.print();
    });
    
    // Download receipt as PDF
    $(document).on('click', '#downloadReceiptBtn', function() {
        showLoading('Membuat PDF...');
        const transactionId = $('#receiptTransactionId').text().replace('No. Transaksi: ', '');
        generatePDF('receiptPrint', `Struk_${transactionId}.pdf`).then(() => {
            hideLoading();
            showToast('PDF berhasil diunduh', 'success');
        });
    });
    
    // Close receipt
    $(document).on('click', '#closeReceiptBtn, .close-receipt', function() {
        $('#receiptPrint').hide();
    });
    
    // Close modals
    $('.modal-close, .close-product-modal').click(function() {
        $(this).closest('.modal').hide();
    });
    
    // Search products
    $('#productSearch').on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        loadProducts(searchTerm);
    });
});

// Update current date
function updateCurrentDate() {
    $('#currentDate').text(moment().format('dddd, D MMMM YYYY, HH:mm'));
}

// Load settings
function loadSettings() {
    $('#taxRate').val(settings.taxRate);
    $('#discountType').val(settings.discountType);
    $('#discountValue').val(settings.discountValue);
    $('#discountValueType').val(settings.discountType === 'percentage' ? 'percentage' : 'fixed');
    
    // Update UI
    $('#taxPercentage').text(settings.taxRate);
}

// Initialize app after setup
function initializeApp() {
    // Update header with store info
    $('#storeNameHeader').text(storeInfo.storeName);
    $('#loggedInUser').text(storeInfo.userPosition === 'owner' ? 'Owner' : 'Kasir');
    
    // Load products
    loadProducts();
    
    // Update cart
    updateCart();
    
    // Show main app
    $('#mainApp').fadeIn();
}

// Save data to local storage
function saveProducts() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

function saveTransactions() {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

function saveCurrentCart() {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CART, JSON.stringify(currentCart));
}

// Load products to UI
function loadProducts(searchTerm = '') {
    let filteredProducts = [...products];
    
    // Apply search filter
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Display products
    $('#productListBody').empty();
    
    if (filteredProducts.length === 0) {
        $('#productListBody').html(`
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <p>Tidak ada produk ditemukan</p>
                    </div>
                </td>
            </tr>
        `);
    } else {
        filteredProducts.forEach(product => {
            const stockClass = product.stock > 5 ? 'text-success' : product.stock > 0 ? 'text-warning' : 'text-danger';
            
            $('#productListBody').append(`
                <tr>
                    <td>${product.name}</td>
                    <td>${formatCurrency(product.price)}</td>
                    <td class="${stockClass}">${product.stock}</td>
                    <td>
                        <button class="btn btn-success btn-sm add-to-cart" data-id="${product.id}" 
                            ${product.stock <= 0 ? 'disabled title="Stok habis"' : ''}>
                            <i class="fas fa-cart-plus"></i> Tambah
                        </button>
                        <button class="btn btn-info btn-sm edit-product" data-id="${product.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm delete-product" data-id="${product.id}" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `);
        });
    }
}

// Update cart UI
function updateCart() {
    // Calculate subtotal
    currentCart.subtotal = currentCart.items.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
    }, 0);
    
    // Calculate discount
    currentCart.discount = calculateDiscount(currentCart.subtotal);
    
    // Calculate tax
    const taxableAmount = currentCart.subtotal - currentCart.discount;
    currentCart.tax = taxableAmount * (settings.taxRate / 100);
    
    // Calculate total
    currentCart.total = taxableAmount + currentCart.tax + currentCart.additionalFee;
    
    // Save cart
    saveCurrentCart();
    
    // Update cart UI
    $('#cartItems').empty();
    
    if (currentCart.items.length === 0) {
        $('#cartItems').html(`
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <p>Keranjang belanja kosong</p>
            </div>
        `);
    } else {
        currentCart.items.forEach(item => {
            const itemTotal = item.product.price * item.quantity;
            $('#cartItems').append(`
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.product.name}</div>
                        <div class="cart-item-price">${formatCurrency(item.product.price)}</div>
                    </div>
                    <div class="cart-item-qty">
                        <input type="number" value="${item.quantity}" min="1" max="${item.product.stock}" 
                            class="cart-item-quantity" data-id="${item.product.id}">
                        <button class="btn btn-danger btn-sm ml-2 remove-from-cart" data-id="${item.product.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `);
        });
    }
    
    // Update summary
    $('#cartSubtotal').text(formatCurrency(currentCart.subtotal));
    $('#cartDiscount').text(formatCurrency(currentCart.discount));
    $('#cartTax').text(formatCurrency(currentCart.tax));
    $('#cartAdditionalFee').text(formatCurrency(currentCart.additionalFee));
    $('#cartTotal').text(formatCurrency(currentCart.total));
    
    // Update additional fee description
    if (currentCart.additionalFee > 0) {
        $('#additionalFeeDescription').text(currentCart.additionalFeeDescription).show();
    } else {
        $('#additionalFeeDescription').text('').hide();
    }
}

// Reset cart
function resetCart() {
    currentCart = {
        items: [],
        discount: 0,
        tax: 0,
        additionalFee: 0,
        additionalFeeDescription: '',
        subtotal: 0,
        total: 0
    };
    
    saveCurrentCart();
    updateCart();
    
    // Reset payment form
    $('#paymentAmount').val('');
    $('#cash').prop('checked', true);
}

// Generate receipt
function generateReceipt(transaction) {
    const receiptDate = moment(transaction.date).format('DD/MM/YYYY HH:mm:ss');
    const paymentMethod = transaction.paymentMethod === 'cash' ? 'Tunai' : 
                        transaction.paymentMethod === 'transfer' ? 'Transfer Bank' : 'E-Wallet';
    
    // Update receipt header
    $('#receiptStoreName').text(storeInfo.storeName);
    $('#receiptStoreAddress').text(storeInfo.storeAddress);
    $('#receiptStorePhone').text('Telp: ' + storeInfo.storePhone);
    $('#receiptDate').text(receiptDate);
    $('#receiptTransactionId').text('No. Transaksi: ' + transaction.id);
    
    // Create items HTML
    let itemsHTML = '';
    transaction.items.forEach(item => {
        const itemTotal = item.product.price * item.quantity;
        itemsHTML += `
            <div class="receipt-item">
                <div class="receipt-item-name">${item.quantity}x ${item.product.name}</div>
                <div class="receipt-item-price">${formatCurrency(itemTotal)}</div>
            </div>
        `;
    });
    
    // Update receipt items
    $('#receiptItems').html(itemsHTML);
    
    // Update receipt summary
    $('#receiptSubtotal').text(formatCurrency(transaction.subtotal));
    $('#receiptDiscount').text(formatCurrency(transaction.discount));
    $('#receiptTaxPercentage').text(settings.taxRate);
    $('#receiptTax').text(formatCurrency(transaction.tax));
    $('#receiptTotal').text(formatCurrency(transaction.total));
    $('#receiptPaymentMethod').text(paymentMethod);
    $('#receiptPaymentAmount').text(formatCurrency(transaction.paymentAmount));
    $('#receiptChange').text(formatCurrency(transaction.change));
    $('#receiptCashier').text(transaction.cashier);
    
    // Update additional fee if exists
    if (transaction.additionalFee > 0) {
        $('#receiptAdditionalFeeItem').show();
        $('#receiptAdditionalFeeLabel').text(transaction.additionalFeeDescription);
        $('#receiptAdditionalFeeValue').text(formatCurrency(transaction.additionalFee));
    } else {
        $('#receiptAdditionalFeeItem').hide();
    }
    
    // Fixed footer text
    const footerHTML = `
        <div>Terima kasih telah berbelanja</div>
        <div class="receipt-order-info">Order Aplikasi Payment Pro</div>
        <div class="receipt-order-info">kirim email: lenterakaryasitubondo@gmail.com</div>
        <div>Kasir: <span id="receiptCashier">${transaction.cashier}</span></div>
    `;
    
    $('.receipt-footer').html(footerHTML);
}
