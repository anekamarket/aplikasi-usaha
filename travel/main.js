$(document).ready(function() {
    moment.locale('id');
    const { jsPDF } = window.jspdf;
    
    const STORAGE_KEYS = {
        VEHICLES: 'travel_vehicles',
        CATEGORIES: 'travel_vehicle_types',
        BOOKINGS: 'travel_bookings',
        USER: 'travel_user',
        CURRENT_BOOKING: 'travel_current_booking',
        SETTINGS: 'travel_settings',
        USERS: 'travel_users',
        DRIVERS: 'travel_drivers',
        SHIFT: 'travel_shift',
        MAINTENANCE: 'travel_maintenance' // Tambahan untuk catatan servis
    };

    const ENCRYPTION_KEY = 'LenteraKaryaSitubondo-Travel-2025';

    const DEFAULT_ADMIN = { id: 'U001', username: 'Admin', password: CryptoJS.SHA256('Admin.12345').toString(), name: 'Administrator', role: 'admin' };
    const DEFAULT_OPERATOR = { id: 'U002', username: 'Operator', password: CryptoJS.SHA256('Gratis12345').toString(), name: 'Operator', role: 'operator' };
    
    let vehicles, categories, bookings, settings, users, drivers, maintenanceRecords, currentUser, currentBooking;
    let passwordPromptCallback = null;
    let captchaText = '';
    let shiftActive = localStorage.getItem(STORAGE_KEYS.SHIFT) === 'true';
    
    function initializeData() {
        let users_init = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
        if (!users_init.find(u => u.username === 'Admin')) users_init.push(DEFAULT_ADMIN);
        if (!users_init.find(u => u.username === 'operator')) users_init.push(DEFAULT_OPERATOR);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users_init));
        
        if (!localStorage.getItem(STORAGE_KEYS.VEHICLES)) localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_KEYS.DRIVERS)) localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
        if (!localStorage.getItem(STORAGE_KEYS.MAINTENANCE)) localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify([]));
        
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            const initialSettings = {
                storeName: 'TRAVEL JAYA', storeAddress: 'Jl. Raya No. 1, Kota Maju',
                storePhone: '081234567890', storeEmail: 'www.traveljaya.com',
                itemSecurityCode: CryptoJS.SHA256('17081945').toString(), panelSecurityCode: CryptoJS.SHA256('LKS.1945').toString(),
            };
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
        }
    }
    
    initializeData();
    
    vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES)) || [];
    categories = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || [];
    bookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS)) || [];
    settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {};
    users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    drivers = JSON.parse(localStorage.getItem(STORAGE_KEYS.DRIVERS)) || [];
    maintenanceRecords = JSON.parse(localStorage.getItem(STORAGE_KEYS.MAINTENANCE)) || [];
    currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) || null;
    
    resetBooking();

    $('#currentYear').text(new Date().getFullYear());
    
    if (currentUser) {
        $('#loggedInUser').text(currentUser.name);
        $('#loginModal').hide();
        $('#mainApp').show();
        initializeApp();
    } else {
        generateCaptcha();
    }
    
    // --- Fungsi Toggle Password (Mata) ---
    function initPasswordToggles() {
        $('.password-wrapper').each(function() {
            const $wrapper = $(this);
            const $input = $wrapper.find('input[type="password"], input[type="text"]');
            const $toggle = $wrapper.find('.password-toggle');
            $toggle.off('click').on('click', function() {
                const type = $input.attr('type') === 'password' ? 'text' : 'password';
                $input.attr('type', type);
                $(this).toggleClass('fa-eye fa-eye-slash');
            });
        });
    }
    // Panggil setiap kali modal baru muncul atau form direset
    $(document).on('shown', function() { initPasswordToggles(); });
    
    // Event Listeners
    setInterval(updateCurrentDate, 60000);
    
    $('#loginForm').submit(handleLogin);
    $('#reloadCaptchaBtn').click(generateCaptcha);
    $('#logoutBtn').click(handleLogout);
    $('#vehicleSearch').on('input', function() { loadVehicles($(this).val(), $('.filter-chip.active').data('category')); });
    $(document).on('click', '.vehicle-card:not(.disabled)', handleVehicleSelect);
    $(document).on('click', '.edit-vehicle', handleEditVehicleClick);
    $(document).on('click', '.delete-vehicle', handleDeleteVehicleClick);
    $('#tripFare').on('input', updateBookingSummary);
    $('#shiftActionBtn').click(toggleShift);

    // Modals & Forms
    $('#createBookingBtn').click(openBookingConfirmationModal);
    $(document).on('input', '#paymentAmount', calculateChange);
    $('#completePaymentBtn').click(confirmBooking);
    $('.modal-close, .modal-close-btn').click(function() { $(this).closest('.modal').hide(); });

    // Admin Panel Buttons
    $('#addVehicleBtn').click(() => openEditVehicleModal());
    $('#manageCategoriesBtn').click(openManageCategoriesModal);
    $('#viewReportsBtn').click(openReportsModal);
    $('#historyBtn').click(openHistoryModal);
    $('#manageDriversBtn').click(openManageDriversModal);
    $('#manageStoreInfoBtn').click(openManageStoreInfoModal);
    $('#controlPanelBtn').click(openControlPanel);
    $('#manageMaintenanceBtn').click(openMaintenanceModal); // Sekarang berfungsi
    $('#cancelBookingBtn').click(() => showToast('Fitur dalam pengembangan', 'info'));
    
    // Save/Update actions
    $('#saveVehicleBtn').click(saveVehicle);
    $('#addCategoryBtn').click(addCategory);
    $(document).on('click', '.remove-category', removeCategory);
    $('#driverForm').submit(saveDriver);
    $('#saveStoreInfoBtn').click(saveStoreInfo);
    $('#userForm').submit(saveUser);
    $('#itemSecurityForm, #panelSecurityForm').submit(changeSecurityCode);
    $('#changeOwnPasswordForm').submit(changeOwnPassword);

    // Backup/Restore
    $('#backupDataBtn').click(() => showConfirmation('Backup Data', 'Data akan di-backup ke file terenkripsi (.travelbackup). Lanjutkan?', backupData));
    $('#restoreFile').change(function() { promptForPassword('panel', () => { restoreFromFile(this.files[0]); $(this).val(''); }); });
    $('#resetDataBtn').click(() => promptForPassword('panel', () => showConfirmation('Reset Data', 'Semua data akan dihapus permanen. Lanjutkan?', resetAllData, 'danger')));
    
    // Maintenance actions
    $('#addMaintenanceBtn').click(() => openEditMaintenanceModal());
    $(document).on('click', '.edit-maintenance', function() {
        const id = $(this).data('id');
        const record = maintenanceRecords.find(r => r.id === id);
        if (record) openEditMaintenanceModal(record);
    });
    $(document).on('click', '.delete-maintenance', function() {
        const id = $(this).data('id');
        promptForPassword('item', () => {
            showConfirmation('Hapus Catatan Servis', 'Yakin ingin menghapus catatan ini?', () => {
                maintenanceRecords = maintenanceRecords.filter(r => r.id !== id);
                saveMaintenance();
                loadMaintenanceRecords();
                showToast('Catatan servis dihapus', 'success');
            }, 'danger');
        });
    });
    $('#saveMaintenanceBtn').click(saveMaintenanceRecord);
    
    // Other UI interactions
    $(document).on('click', '.filter-chip', function() {
        $('.filter-chip').removeClass('active');
        $(this).addClass('active');
        loadVehicles($('#vehicleSearch').val(), $(this).data('category'));
    });
    $('#showAddDriverFormBtn, #cancelDriverFormBtn').click(() => $('#driverFormContainer').slideToggle(resetDriverForm));
    $(document).on('click', '.edit-driver', function() { editDriver($(this).data('id')); });
    $('#deleteDriverBtn').click(function() { deleteDriver($(this).data('id')); });
    $(document).on('click', '.kta-driver', function() { openDriverIdCardModal($(this).data('id')); });
    $('#downloadKtaPdfBtn').click(downloadKtaAsPdf);
    $('#showAddUserFormBtn, #cancelUserFormBtn').click(() => $('#userFormContainer').slideToggle(resetUserForm));
    $(document).on('click', '.edit-user', function() { editUser($(this).data('id')); });
    $(document).on('click', '.delete-user', function() { deleteUser($(this).data('id')); });
    
    // Report, History, Ticket actions
    $('#generateReportBtn').click(generateReport);
    $('#historySearchInput').on('input', function() { loadBookingHistory($(this).val()); });
    $(document).on('click', '.reprint-ticket', function() {
        const booking = bookings.find(b => b.id === $(this).data('id'));
        if (booking) showTicketModal(booking);
    });
    $('#printTicketBtn').on('click', () => printElement('#ticketModalBody #ticketContent'));
    $('#downloadTicketPdfBtn').on('click', downloadTicketAsPdf);

    // Password Prompt
    $('#passwordPromptForm').submit(e => e.preventDefault());
    $('#passwordPromptSubmit').click(submitPasswordPrompt);

    // Tabs in Control Panel
    $('.tab').click(function() {
        $('.tab').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').removeClass('active');
        $('#tab-' + $(this).data('tab')).addClass('active');
    });

    // Custom date range toggle
    $('#reportPeriod').change(function() {
        $('#customDateRange').toggle($(this).val() === 'custom');
    });

    // --- CORE APP FLOW ---
    function initializeApp() {
        loadVehicles(); 
        loadCategories(); 
        updateCurrentDate();
        updateStoreInfo();
        updateShiftUI();
        configureUIAccess();
        resetBookingUI();
        initPasswordToggles(); // Inisialisasi toggle untuk field yang sudah ada
    }
    
    function configureUIAccess() {
        $('#adminPanel').show();
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
                    setButtonLoading($loginBtn, false, originalText);
                    return;
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
                setButtonLoading($loginBtn, false, originalText);
            }
        }, 500);
    }

    function handleLogout(e) {
        e.preventDefault();
        currentUser = null;
        localStorage.removeItem(STORAGE_KEYS.USER);
        $('#mainApp').fadeOut(() => {
            $('#loginModal').css('display', 'flex');
            $('#username, #password, #captchaInput').val('');
            generateCaptcha();
        });
        showToast('Anda telah logout', 'info');
    }

    function handleVehicleSelect() {
        const vehicle = vehicles.find(v => v.id === $(this).data('id'));
        if (!vehicle) return;

        currentBooking.vehicle = vehicle;
        $('#selectedVehicle').val(`${vehicle.name} (${vehicle.licensePlate})`);
        $('#createBookingBtn').prop('disabled', false);
        showToast(`${vehicle.name} dipilih.`, 'info');
    }

    function confirmBooking() {
        const paymentAmount = parseFloat($('#paymentAmount').val()) || 0;
        if (paymentAmount < currentBooking.total) return showToast('Jumlah pembayaran kurang', 'error');

        const vehicle = vehicles.find(v => v.id === currentBooking.vehicle.id);
        if (!vehicle || vehicle.status !== 'available') {
            return showToast(`Kendaraan ${vehicle.name} tidak tersedia.`, 'error');
        }
        const availableDrivers = drivers.filter(d => true);

        if (availableDrivers.length === 0) {
            return showToast('Tidak ada pengemudi yang tersedia saat ini.', 'error');
        }
        
        const $btn = $(this), originalText = $btn.html();
        setButtonLoading($btn, true);

        setTimeout(() => {
            try {
                const booking = {
                    id: 'BOOK' + moment().format('YYYYMMDDHHmmss'),
                    creationDate: new Date().toISOString(),
                    ...currentBooking,
                    paymentMethod: $('#paymentMethod').val(),
                    paymentAmount,
                    change: paymentAmount - currentBooking.total,
                    operator: currentUser.name,
                    status: 'booked',
                    driver: availableDrivers[0]
                };
                
                const vehicleIndex = vehicles.findIndex(v => v.id === booking.vehicle.id);
                if(vehicleIndex > -1) {
                    vehicles[vehicleIndex].status = 'in_use';
                    saveVehicles();
                    loadVehicles();
                }
                
                bookings.unshift(booking);
                saveBookings();
                
                showTicketModal(booking);
                resetBookingUI();
                $('#bookingConfirmationModal').hide();
                showToast('Booking berhasil dikonfirmasi', 'success');
            } finally {
                setButtonLoading($btn, false, originalText);
            }
        }, 500);
    }

    function updateBookingSummary() {
        currentBooking.passengerName = $('#passengerName').val();
        currentBooking.passengerPhone = $('#passengerPhone').val();
        currentBooking.pickupLocation = $('#pickupLocation').val();
        currentBooking.destination = $('#destination').val();
        currentBooking.departureDate = $('#departureDate').val();
        currentBooking.total = parseFloat($('#tripFare').val()) || 0;
        
        $('#bookingTotal').text(formatCurrency(currentBooking.total));
    }
    
    function resetBooking() {
        currentBooking = {
            vehicle: null, passengerName: '', passengerPhone: '', 
            pickupLocation: '', destination: '', departureDate: '', 
            total: 0
        };
    }

    function resetBookingUI() {
        resetBooking();
        $('#bookingForm')[0].reset();
        $('#selectedVehicle').val('');
        $('#bookingTotal').text('Rp 0');
        $('#createBookingBtn').prop('disabled', true);
    }

    // --- SHIFT MANAGEMENT ---
    function toggleShift() {
        shiftActive = !shiftActive;
        localStorage.setItem(STORAGE_KEYS.SHIFT, shiftActive);
        updateShiftUI();
        showToast(shiftActive ? 'Shift dimulai' : 'Shift diakhiri', 'info');
    }

    function updateShiftUI() {
        if (shiftActive) {
            $('#shiftStatusBadge').text('Shift Aktif').addClass('active');
            $('#shiftActionBtn').text('Akhiri Shift').removeClass('btn-warning').addClass('btn-danger');
        } else {
            $('#shiftStatusBadge').text('Tidak Ada Shift Aktif').removeClass('active');
            $('#shiftActionBtn').text('Mulai Shift').removeClass('btn-danger').addClass('btn-warning');
        }
    }

    // --- VEHICLE & CATEGORY MANAGEMENT ---
    function loadVehicles(searchTerm = '', category = 'all') {
        const lowerSearchTerm = searchTerm.toLowerCase();
        let filteredVehicles = vehicles.filter(v => 
            (category === 'all' || v.category === category) && 
            (!searchTerm || v.name.toLowerCase().includes(lowerSearchTerm) || v.licensePlate.toLowerCase().includes(lowerSearchTerm))
        );
        $('#vehicleCount').text(`(${filteredVehicles.length} kendaraan)`);
        const $vehicleGrid = $('#vehicleGrid').empty();
        if (filteredVehicles.length === 0) {
            $vehicleGrid.html('<div class="empty-state"><i class="fas fa-car"></i><p>Belum ada kendaraan. Tambahkan melalui Admin Panel.</p></div>');
        } else {
            const isAdmin = true;
            filteredVehicles.forEach(vehicle => {
                const statusText = { available: 'Tersedia', in_use: 'Sedang Jalan', maintenance: 'Perbaikan' };
                const adminActions = isAdmin ? `
                    <div class="vehicle-actions">
                        <div class="action-btn edit-btn edit-vehicle" data-id="${vehicle.id}"><i class="fas fa-edit"></i></div>
                        <div class="action-btn delete-btn delete-vehicle" data-id="${vehicle.id}"><i class="fas fa-trash"></i></div>
                    </div>` : '';
                
                $vehicleGrid.append(`
                    <div class="vehicle-card ${vehicle.status !== 'available' ? 'disabled' : ''}" data-id="${vehicle.id}">
                        ${adminActions}
                        <div class="vehicle-image">
                            ${vehicle.image ? `<img src="${vehicle.image}" alt="${vehicle.name}" onerror="this.parentElement.innerHTML = '<i class=\\'fas fa-car-crash\\'></i>';">` : `<i class="fas fa-car"></i>`}
                        </div>
                        <div class="vehicle-details">
                            <div class="vehicle-name">${vehicle.name}</div>
                            <div class="vehicle-plate">${vehicle.licensePlate}</div>
                            <div class="vehicle-info"><i class="fas fa-users"></i> Kapasitas: ${vehicle.capacity} orang</div>
                            <div class="vehicle-type">${vehicle.category}</div>
                        </div>
                        <div class="vehicle-status ${vehicle.status}">${statusText[vehicle.status]}</div>
                    </div>`);
            });
        }
    }
    
    function openEditVehicleModal(vehicle = null) {
        $('#vehicleModal .modal-title').text(vehicle ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru');
        $('#vehicleForm')[0].reset();
        $('#vehicleId').val(vehicle ? vehicle.id : '');
        if (vehicle) {
            $('#vehicleName').val(vehicle.name); 
            $('#vehiclePlate').val(vehicle.licensePlate);
            $('#vehicleCapacity').val(vehicle.capacity);
            $('#vehicleImage').val(vehicle.image || '');
            $('#vehicleCategory').val(vehicle.category);
            $('#vehicleStatus').val(vehicle.status);
        }
        loadCategoriesForSelect();
        $('#vehicleModal').css('display', 'flex');
        initPasswordToggles(); // jika ada password di modal ini (tidak ada, tapi aman)
    }
    
    function saveVehicle() {
        const id = $('#vehicleId').val(), name = $('#vehicleName').val().trim(), category = $('#vehicleCategory').val(),
              plate = $('#vehiclePlate').val().trim().toUpperCase(), capacity = parseInt($('#vehicleCapacity').val()) || 0, 
              image = $('#vehicleImage').val().trim(), status = $('#vehicleStatus').val();
        if (!name || !category || !plate || capacity <= 0) return showToast('Semua kolom wajib diisi dengan valid', 'error');
        
        const action = () => {
            if (id) {
                const index = vehicles.findIndex(v => v.id === id);
                if (index > -1) vehicles[index] = { ...vehicles[index], name, category, licensePlate: plate, capacity, image, status };
            } else {
                const newVehicle = { id: 'V' + moment().format('x'), name, category, licensePlate: plate, capacity, image, status };
                vehicles.unshift(newVehicle);
            }
            saveVehicles(); loadVehicles(); $('#vehicleModal').hide();
            showToast(`Kendaraan ${id ? 'diperbarui' : 'disimpan'}`, 'success');
        };
        
        promptForPassword('item', action);
    }

    function handleEditVehicleClick(e) { e.stopPropagation(); openEditVehicleModal(vehicles.find(v => v.id === $(this).data('id'))); }
    function handleDeleteVehicleClick(e) {
        e.stopPropagation();
        const vehicleId = $(this).data('id');
        promptForPassword('item', () => showConfirmation('Hapus Kendaraan', 'Yakin ingin menghapus kendaraan ini?', () => {
            vehicles = vehicles.filter(v => v.id !== vehicleId);
            saveVehicles(); loadVehicles(); showToast('Kendaraan berhasil dihapus', 'success');
        }));
    }

    // DRIVER MANAGEMENT
    function openManageDriversModal() {
        resetDriverForm();
        loadDriversForManagement();
        $('#manageDriversModal').css('display', 'flex');
        initPasswordToggles();
    }

    function loadDriversForManagement(searchTerm = '') {
        const $list = $('#driversList').empty();
        const filtered = drivers.filter(d => !searchTerm || d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.id.toLowerCase().includes(searchTerm.toLowerCase()) || d.nik.includes(searchTerm));
        if (filtered.length === 0) return $list.html('<div class="empty-state"><p>Belum ada pengemudi terdaftar.</p></div>');
        filtered.forEach(d => {
            $list.append(`
                <div class="order-item" style="display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
                    <img src="${d.photoUrl}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 12px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/40'">
                    <div style="flex:1;">
                        <div style="font-weight: 600;">${d.name} <span style="font-size: 0.7rem; color: var(--gray);">(${d.id})</span></div>
                        <div style="font-size: 0.8rem;">${d.phone} | SIM: ${d.simType}</div>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <i class="fas fa-id-card kta-driver" style="cursor:pointer; color: var(--success); font-size: 1.2rem;" data-id="${d.id}" title="Cetak KTA"></i>
                        <i class="fas fa-edit edit-driver" style="cursor:pointer; color: var(--info); font-size: 1.2rem;" data-id="${d.id}" title="Edit Data"></i>
                    </div>
                </div>
            `);
        });
    }

    function resetDriverForm() {
        $('#driverForm')[0].reset();
        $('#driverIdInput').val('');
        $('#driverFormTitle').text('Tambah Pengemudi Baru');
        $('#deleteDriverBtn').hide();
    }

    function saveDriver(e) {
        e.preventDefault();
        const id = $('#driverIdInput').val();
        const driverData = {
            name: $('#driverName').val().trim(),
            nik: $('#driverNik').val().trim(),
            simId: $('#driverSimId').val().trim(),
            simType: $('#driverSimType').val(),
            phone: $('#driverPhone').val().trim(),
            address: $('#driverAddress').val().trim(),
            photoUrl: $('#driverPhotoUrl').val().trim()
        };
        if (!driverData.name || !driverData.nik || !driverData.simId || !driverData.phone || !driverData.photoUrl) return showToast('Semua kolom wajib diisi.', 'error');
        
        if (id) {
            const index = drivers.findIndex(d => d.id === id);
            if (index > -1) drivers[index] = { ...drivers[index], ...driverData };
        } else {
            drivers.unshift({
                id: 'DRV' + moment().format('YYMMDDHHmmss'),
                ...driverData,
                joinDate: new Date().toISOString()
            });
        }
        saveDrivers();
        loadDriversForManagement();
        $('#driverFormContainer').slideUp();
        showToast(`Data pengemudi berhasil ${id ? 'diperbarui' : 'disimpan'}.`, 'success');
    }

    function editDriver(id) {
        const driver = drivers.find(d => d.id === id);
        if (!driver) return;
        resetDriverForm();
        $('#driverFormTitle').text('Edit Data Pengemudi');
        $('#driverIdInput').val(driver.id);
        $('#driverName').val(driver.name);
        $('#driverNik').val(driver.nik);
        $('#driverSimId').val(driver.simId);
        $('#driverSimType').val(driver.simType);
        $('#driverPhone').val(driver.phone);
        $('#driverAddress').val(driver.address || '');
        $('#driverPhotoUrl').val(driver.photoUrl || '');
        
        $('#deleteDriverBtn').data('id', driver.id).show();
        $('#driverFormContainer').slideDown();
    }

    function deleteDriver(id) {
        promptForPassword('item', () => {
            showConfirmation('Hapus Pengemudi', 'Yakin ingin menghapus data pengemudi ini?', () => {
                drivers = drivers.filter(d => d.id !== id);
                saveDrivers();
                loadDriversForManagement();
                resetDriverForm();
                $('#driverFormContainer').slideUp();
                showToast('Data pengemudi berhasil dihapus.', 'success');
            }, 'danger');
        });
    }

    // KTA (ID Card) Generation
    function openDriverIdCardModal(driverId) {
        const driver = drivers.find(d => d.id === driverId);
        if (!driver) return;
        $('#ktaStoreName').text(settings.storeName);
        $('#ktaStoreContact').text(`${settings.storeAddress} | ${settings.storePhone} | ${settings.storeEmail}`);
        $('#ktaDriverPhoto').attr('src', driver.photoUrl).on('error', function() { $(this).attr('src', 'https://via.placeholder.com/120'); });
        $('#ktaDriverName').text(driver.name);
        $('#ktaDriverId').text(`ID: ${driver.id}`);
        $('#ktaDriverNik').text(driver.nik);
        $('#ktaDriverSim').text(`${driver.simId} (${driver.simType})`);
        $('#ktaDriverWhatsapp').text(driver.phone);

        const qrData = JSON.stringify({id: driver.id, name: driver.name, sim: driver.simType, phone: driver.phone});
        const $qrContainer = $('#ktaQrcodeImg').empty();
        new QRCode($qrContainer[0], { text: qrData, width: 80, height: 80 });
        $('#ktaModal').css('display', 'flex');
        initPasswordToggles();
    }
    
    function downloadKtaAsPdf() {
        const element = document.getElementById('ktaCard');
        const driverName = $('#ktaDriverName').text();
        const filename = `KTA_${driverName.replace(/ /g, '_')}.pdf`;
        showToast('Mengunduh KTA PDF...', 'info');
        html2canvas(element, { scale: 2, useCORS: true, backgroundColor: null }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height]});
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(filename);
        }).catch(err => { showToast('Gagal mengunduh PDF: ' + err, 'error'); });
    }
    
    // --- MAINTENANCE MANAGEMENT (Fitur Baru) ---
    function openMaintenanceModal() {
        loadMaintenanceRecords();
        $('#maintenanceModal').css('display', 'flex');
        initPasswordToggles();
    }

    function loadMaintenanceRecords() {
        const $list = $('#maintenanceRecordsList').empty();
        if (maintenanceRecords.length === 0) {
            $list.html('<div class="empty-state"><i class="fas fa-tools"></i><p>Belum ada catatan servis.</p></div>');
            return;
        }
        // Urutkan dari yang terbaru
        maintenanceRecords.sort((a,b) => new Date(b.date) - new Date(a.date));
        maintenanceRecords.forEach(record => {
            const vehicle = vehicles.find(v => v.id === record.vehicleId) || { name: 'Unknown', licensePlate: '-' };
            $list.append(`
                <div class="maintenance-item">
                    <div class="header">
                        <span class="vehicle-info">${vehicle.name} (${vehicle.licensePlate})</span>
                        <span class="date">${moment(record.date).format('DD/MM/YYYY')}</span>
                    </div>
                    <div class="description">${record.description}</div>
                    <div class="cost">Biaya: ${formatCurrency(record.cost)}</div>
                    <div class="maintenance-actions" style="text-align:right;">
                        <i class="fas fa-edit edit-maintenance" data-id="${record.id}" title="Edit"></i>
                        <i class="fas fa-trash delete-maintenance" data-id="${record.id}" title="Hapus" style="margin-left:10px;"></i>
                    </div>
                </div>
            `);
        });
    }

    function openEditMaintenanceModal(record = null) {
        $('#maintenanceForm')[0].reset();
        $('#maintenanceId').val(record ? record.id : '');
        if (record) {
            $('#maintenanceVehicleId').val(record.vehicleId);
            $('#maintenanceDate').val(moment(record.date).format('YYYY-MM-DD'));
            $('#maintenanceDescription').val(record.description);
            $('#maintenanceCost').val(record.cost);
        } else {
            // Set default date to today
            $('#maintenanceDate').val(moment().format('YYYY-MM-DD'));
        }
        // Populate vehicle dropdown
        const $select = $('#maintenanceVehicleId').empty();
        vehicles.forEach(v => {
            $select.append(`<option value="${v.id}">${v.name} (${v.licensePlate})</option>`);
        });
        $('#editMaintenanceModal').css('display', 'flex');
        initPasswordToggles();
    }

    function saveMaintenanceRecord() {
        const id = $('#maintenanceId').val();
        const vehicleId = $('#maintenanceVehicleId').val();
        const date = $('#maintenanceDate').val();
        const description = $('#maintenanceDescription').val().trim();
        const cost = parseFloat($('#maintenanceCost').val()) || 0;

        if (!vehicleId || !date || !description || cost <= 0) {
            return showToast('Semua kolom harus diisi dengan valid', 'error');
        }

        const action = () => {
            if (id) {
                const index = maintenanceRecords.findIndex(r => r.id === id);
                if (index > -1) {
                    maintenanceRecords[index] = { ...maintenanceRecords[index], vehicleId, date, description, cost };
                }
            } else {
                const newRecord = {
                    id: 'MNT' + moment().format('x'),
                    vehicleId,
                    date,
                    description,
                    cost,
                    createdBy: currentUser.name,
                    createdAt: new Date().toISOString()
                };
                maintenanceRecords.unshift(newRecord);
            }
            saveMaintenance();
            loadMaintenanceRecords();
            $('#editMaintenanceModal').hide();
            showToast(`Catatan servis ${id ? 'diperbarui' : 'ditambahkan'}`, 'success');
        };

        promptForPassword('item', action);
    }

    // --- OTHER UTILITIES & HELPERS ---
    function generateTicketHTML(booking) {
        const vehicle = booking.vehicle;
        const driver = booking.driver || { name: 'Belum ditugaskan' };
        return `
        <div id="ticketContent">
            <div class="ticket-header">
                <div class="ticket-title">${settings.storeName}</div>
                <div>${settings.storeAddress}</div>
                <div>Telp: ${settings.storePhone}</div>
            </div>
            <div class="ticket-info">
                <div><span>Tanggal:</span> <span>${moment(booking.creationDate).format('DD/MM/YY HH:mm')}</span></div>
                <div><span>No. Booking:</span> <span>${booking.id}</span></div>
                <div><span>Operator:</span> <span>${booking.operator}</span></div>
            </div>
            
            <div class="ticket-section-title">DETAIL PENUMPANG</div>
            <div class="ticket-details">
                <p><strong>Nama</strong>: <span>${booking.passengerName}</span></p>
                <p><strong>Kontak</strong>: <span>${booking.passengerPhone}</span></p>
            </div>

            <div class="ticket-section-title">DETAIL PERJALANAN</div>
            <div class="ticket-details">
                <p><strong>Berangkat</strong>: <span>${moment(booking.departureDate).format('dddd, D MMM YYYY, HH:mm')}</span></p>
                <p><strong>Dari</strong>: <span>${booking.pickupLocation}</span></p>
                <p><strong>Tujuan</strong>: <span>${booking.destination}</span></p>
                <p><strong>Armada</strong>: <span>${vehicle.name} (${vehicle.licensePlate})</span></p>
                <p><strong>Pengemudi</strong>: <span>${driver.name}</span></p>
            </div>

            <div class="ticket-total">
                <div class="ticket-details">
                    <p style="font-size: 14px;"><strong>TOTAL BIAYA</strong>: <span>${formatCurrency(booking.total)}</span></p>
                    <p><span>${booking.paymentMethod === 'cash' ? 'Tunai' : 'Transfer'}</span> <span>${formatCurrency(booking.paymentAmount)}</span></p>
                    <p><span>Kembali</span> <span>${formatCurrency(booking.change)}</span></p>
                </div>
            </div>
            <div class="ticket-footer">
                <p>Terima kasih telah menggunakan jasa kami. Hati-hati di jalan.</p>
                <p style="margin-top: 5px;">${settings.storeEmail}</p>
            </div>
        </div>`;
    }
    
    function openBookingConfirmationModal() {
        if (!currentBooking.vehicle) return showToast('Pilih kendaraan terlebih dahulu', 'warning');
        const { passengerName, passengerPhone, pickupLocation, destination, departureDate, total } = currentBooking;
        if(!passengerName || !passengerPhone || !pickupLocation || !destination || !departureDate || total <= 0) {
            return showToast('Lengkapi semua detail booking dan biaya perjalanan.', 'error');
        }
        updateBookingSummary();
        
        $('#paymentTotal').text(formatCurrency(currentBooking.total));
        $('#paymentAmount').val(currentBooking.total).trigger('input');
        $('#bookingConfirmationModal').css('display', 'flex');
        initPasswordToggles();
    }

    function calculateChange() {
        const amount = parseFloat($('#paymentAmount').val()) || 0;
        const change = amount - currentBooking.total;
        $('#changeContainer').toggle(change >= 0);
        $('#paymentChange').text(formatCurrency(change));
    }

    function openManageCategoriesModal() { loadCategoriesForManagement(); $('#manageCategoriesModal').css('display', 'flex'); initPasswordToggles(); }
    function loadCategories() {
        const $filterRow = $('.filter-row').html('<div class="filter-chip active" data-category="all">Semua</div>');
        categories.forEach(category => $filterRow.append(`<div class="filter-chip" data-category="${category.name}">${category.name}</div>`));
    }
    function loadCategoriesForSelect() {
        const $select = $('#vehicleCategory').empty();
        if (categories.length === 0) $select.append('<option value="" disabled selected>Tidak ada tipe</option>');
        else categories.forEach(category => $select.append(`<option value="${category.name}">${category.name}</option>`));
    }
    function loadCategoriesForManagement() {
        const $list = $('#categoriesList').empty();
        if (categories.length === 0) $list.html('<div class="empty-state"><i class="fas fa-tags"></i><p>Belum ada tipe</p></div>');
        else {
            categories.forEach(category => {
                const vehicleCount = vehicles.filter(v => v.category === category.name).length;
                $list.append(`<div class="order-item" style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee;"><span>${category.name}</span><span><i class="fas fa-trash remove-category" data-id="${category.id}" style="cursor:pointer; color: var(--danger);"></i> (${vehicleCount} kendaraan)</span></div>`);
            });
        }
    }
    function addCategory() {
        const name = $('#newCategoryName').val().trim();
        if (!name) return showToast('Nama tipe harus diisi', 'error');
        if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) return showToast('Tipe sudah ada', 'error');
        categories.unshift({ id: 'C' + moment().format('x'), name });
        saveCategories(); loadCategories(); loadCategoriesForManagement(); $('#newCategoryName').val(''); showToast('Tipe ditambahkan', 'success');
    }
    function removeCategory() {
        const categoryId = $(this).data('id'), category = categories.find(c => c.id === categoryId);
        if (vehicles.some(v => v.category === category.name)) return showToast('Tipe sedang digunakan', 'error');
        promptForPassword('item', () => {
            categories = categories.filter(c => c.id !== categoryId);
            saveCategories(); loadCategories(); loadCategoriesForManagement(); showToast('Tipe dihapus', 'success');
        });
    }
    function backupData() {
        try {
            const backup = { vehicles, categories, bookings, settings, users, drivers, maintenanceRecords, backupDate: new Date().toISOString() };
            const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(backup), ENCRYPTION_KEY).toString();
            const linkElement = document.createElement('a');
            linkElement.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(encryptedData);
            linkElement.download = `backup_travel_${moment().format('YYYYMMDD_HHmmss')}.travelbackup`;
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
                if (data.vehicles && data.categories && data.bookings && data.settings) {
                    showConfirmation('Restore Data', 'Data saat ini akan diganti oleh file backup. Lanjutkan?', () => restoreData(data));
                } else throw new Error("Invalid backup file.");
            } catch (err) { showToast('Gagal memproses file backup.', 'error'); }
        };
        reader.readAsText(file);
    }
    function restoreData(data) {
        try {
            localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(data.vehicles || []));
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories || []));
            localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(data.bookings || []));
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users || []));
            localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(data.drivers || []));
            localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(data.maintenanceRecords || []));
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
        initPasswordToggles();
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

    function showTicketModal(booking) {
        const ticketHTML = generateTicketHTML(booking);
        $('#ticketModalBody').html(ticketHTML);
        $('#downloadTicketPdfBtn').data('booking', booking);
        $('#ticketModal').css('display', 'flex');
        initPasswordToggles();
    }
    function downloadTicketAsPdf() {
        const booking = $('#downloadTicketPdfBtn').data('booking'); if (!booking) return;
        const element = document.getElementById('ticketModalBody').querySelector('#ticketContent');
        const filename = `Tiket-${booking.id}-${booking.passengerName.replace(/ /g, '_')}.pdf`; showToast('Mengunduh PDF...', 'info');
        html2canvas(element, { scale: 2, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height); pdf.save(filename);
        }).catch(err => { showToast('Gagal mengunduh PDF', 'error'); });
    }
    function formatCurrency(amount) { return 'Rp ' + (amount != null ? amount : 0).toLocaleString('id-ID'); }
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
        initPasswordToggles();
    }

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

        const filteredBookings = bookings.filter(b => moment(b.creationDate).isBetween(startDate, endDate));
        if (filteredBookings.length === 0) return $('#reportResults').html('<div class="empty-state"><p>Tidak ada data booking pada periode ini.</p></div>');
        
        let totalRevenue = 0, totalBookings = filteredBookings.length;
        let topVehicles = {};
        filteredBookings.forEach(booking => {
            totalRevenue += booking.total;
            topVehicles[booking.vehicle.name] = (topVehicles[booking.vehicle.name] || 0) + 1;
        });
        const sortedVehicles = Object.entries(topVehicles).sort((a, b) => b[1] - a[1]).slice(0, 5);

        let reportHTML = `
            <div style="text-align:center;"><h4>Laporan Periode: ${startDate.format('D MMM YYYY')} - ${endDate.format('D MMM YYYY')}</h4></div>
            <div class="summary-container mt-3">
                <div class="summary-row"><span>Total Booking:</span> <span>${totalBookings}</span></div>
                <div class="summary-row total-row"><span>Total Pendapatan:</span> <span>${formatCurrency(totalRevenue)}</span></div>
            </div>
            <h5 class="mt-3">Armada Paling Sering Dipesan</h5>
            <ul class="list-group">${sortedVehicles.map(v => `<li class="list-group-item">${v[0]} (${v[1]} kali)</li>`).join('') || '<li>Tidak ada data</li>'}</ul>
        `;
        $('#reportResults').html(reportHTML);
    }
    
    function openHistoryModal() {
        loadBookingHistory();
        $('#historyModal').css('display', 'flex');
        initPasswordToggles();
    }

    function loadBookingHistory(searchTerm = '') {
        const $results = $('#historyResults').empty();
        const filtered = bookings.filter(b => !searchTerm || b.id.toLowerCase().includes(searchTerm.toLowerCase()) || b.passengerName.toLowerCase().includes(searchTerm.toLowerCase()));
        if (filtered.length === 0) return $results.html('<div class="empty-state"><p>Tidak ada histori booking.</p></div>');
        
        let tableHTML = `<table class="data-table"><thead><tr><th>Kode</th><th>Tanggal</th><th>Penumpang</th><th>Tujuan</th><th>Total</th><th>Aksi</th></tr></thead><tbody>`;
        filtered.slice(0, 100).forEach(booking => {
            tableHTML += `
                <tr>
                    <td>${booking.id}</td>
                    <td>${moment(booking.creationDate).format('DD/MM/YY HH:mm')}</td>
                    <td>${booking.passengerName}</td>
                    <td>${booking.destination}</td>
                    <td>${formatCurrency(booking.total)}</td>
                    <td><button class="btn btn-sm reprint-ticket" data-id="${booking.id}">Cetak Ulang</button></td>
                </tr>
            `;
        });
        tableHTML += `</tbody></table>`;
        $results.html(tableHTML);
    }
    
    function openManageStoreInfoModal() {
        $('#storeName').val(settings.storeName);
        $('#storeAddress').val(settings.storeAddress);
        $('#storePhone').val(settings.storePhone);
        $('#storeEmail').val(settings.storeEmail);
        $('#manageStoreInfoModal').css('display', 'flex');
        initPasswordToggles();
    }
    
    function updateStoreInfo() {
        $('#storeNameHeader').text(settings.storeName || 'TRAVEL');
    }

    function saveStoreInfo() {
        settings.storeName = $('#storeName').val().trim();
        settings.storeAddress = $('#storeAddress').val().trim();
        settings.storePhone = $('#storePhone').val().trim();
        settings.storeEmail = $('#storeEmail').val().trim();
        saveSettings();
        updateStoreInfo();
        $('#manageStoreInfoModal').hide();
        showToast('Info perusahaan berhasil diperbarui.', 'success');
    }

    function openControlPanel() {
        promptForPassword('panel', () => {
            loadUsers();
            $('#controlPanelModal').css('display', 'flex');
            initPasswordToggles();
        });
    }
    
    function loadUsers() {
        const $list = $('#usersList').empty();
        users.forEach(u => {
            $list.append(`
                <div class="order-item" style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #eee;">
                    <div><strong>${u.name}</strong><br><small>${u.username} | ${u.role}</small></div>
                    <div style="display: flex; gap: 8px;">
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

    function printElement(selector) {
        const content = $(selector).html();
        const $printContainer = $('#print-container');
        $printContainer.html(content).show();
        window.print();
        $printContainer.hide().empty();
    }
    
    function generateCaptcha() {
        const canvas = document.getElementById('captchaCanvas');
        const ctx = canvas.getContext('2d');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        captchaText = '';
        for (let i = 0; i < 6; i++) captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
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
    
    // --- DATA SAVING FUNCTIONS ---
    function saveVehicles() { localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles)); }
    function saveCategories() { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }
    function saveBookings() { localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings)); }
    function saveSettings() { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }
    function saveUsers() { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }
    function saveDrivers() { localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers)); }
    function saveMaintenance() { localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(maintenanceRecords)); }
});
