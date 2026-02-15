// Inisialisasi variabel global
let suratData = [];
let archivedData = [];
let currentPage = 1;
let itemsPerPage = 100;
let currentFilter = {};
let currentEditId = null;
let loginAttempts = 0;
let isBlocked = false;
let blockTime = 0;
let validationCode = "Gratis12345";
let charts = {};

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
    
    // Setup event listeners
    setupEventListeners();
    
    // Show login modal on first load
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
});

// Initialize the application
function initApp() {
    // Load data from localStorage
    loadData();
    
    // Generate validation code if not exists
    if (!localStorage.getItem('validationCode')) {
        localStorage.setItem('validationCode', validationCode);
    } else {
        validationCode = localStorage.getItem('validationCode');
    }
    
    // Update validation code field
    document.getElementById('validationCode').value = validationCode;
    
    // Setup charts
    initCharts();
    
    // Update stats
    updateStats();
    
    // Update browser info
    updateBrowserInfo();
    
    // Check if welcome modal should be shown
    const welcomeShown = localStorage.getItem('welcomeShown');
    if (!welcomeShown) {
        const welcomeModal = new bootstrap.Modal(document.getElementById('welcomeModal'));
        welcomeModal.show();
        
        // Start countdown
        let countdown = 5;
        const countdownElement = document.getElementById('welcomeCountdown');
        const countdownInterval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                welcomeModal.hide();
            }
        }, 1000);
        
        localStorage.setItem('welcomeShown', 'true');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Menu navigation
    document.querySelectorAll('#menuList .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-bs-target');
            showSection(target);
            
            // Close mobile menu after selection
            if (window.innerWidth < 992) {
                document.getElementById('sidebarMenu').classList.remove('mobile-show');
                document.getElementById('sidebarOverlay').classList.remove('mobile-show');
            }
        });
    });
    
    // Mobile menu toggle
    document.getElementById('mobileMenuBtn').addEventListener('click', function() {
        document.getElementById('sidebarMenu').classList.add('mobile-show');
        document.getElementById('sidebarOverlay').classList.add('mobile-show');
    });
    
    // Sidebar overlay click
    document.getElementById('sidebarOverlay').addEventListener('click', function() {
        this.classList.remove('mobile-show');
        document.getElementById('sidebarMenu').classList.remove('mobile-show');
    });
    
    // Form submission
    document.getElementById('inputSuratForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmit();
    });
    
    // Filter events
    document.getElementById('filterJenis').addEventListener('change', applyFilters);
    document.getElementById('filterKategori').addEventListener('change', applyFilters);
    document.getElementById('filterPrioritas').addEventListener('change', applyFilters);
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('clearSearch').addEventListener('click', function() {
        document.getElementById('searchInput').value = '';
        applyFilters();
    });
    
    // Export and print buttons
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
    document.getElementById('exportPDF').addEventListener('click', exportToPDF);
    document.getElementById('printData').addEventListener('click', printData);
    
    // Backup and restore
    document.getElementById('backupData').addEventListener('click', backupData);
    document.getElementById('restoreFile').addEventListener('change', function() {
        document.getElementById('restoreData').disabled = !this.files.length;
    });
    document.getElementById('restoreData').addEventListener('click', restoreData);
    
    // Settings forms
    document.getElementById('generalSettingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveGeneralSettings();
    });
    
    document.getElementById('securitySettingsForm').addEventListener('submit', function(e) {
        e.preventDefault();
        changePassword();
    });
    
    // Generate validation code
    document.getElementById('generateValidationCode').addEventListener('click', generateValidationCode);
    
    // Reset app
    document.getElementById('resetAppBtn').addEventListener('click', resetApplication);
    
    // Floating action button
    document.getElementById('fabButton').addEventListener('click', function() {
        showSection('inputSurat');
        document.getElementById('inputSuratForm').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });
    
    // Toggle password visibility
    document.querySelector('.toggle-password').addEventListener('click', function() {
        const passwordInput = document.getElementById('securityCode');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
    
    // Report generation
    document.getElementById('generateReport').addEventListener('click', generateReport);
    document.getElementById('reportFilterForm').addEventListener('submit', function(e) {
        e.preventDefault();
        applyReportFilters();
    });
    
    // Export report buttons
    document.getElementById('exportReportExcel').addEventListener('click', function() {
        exportToExcel('report');
    });
    document.getElementById('exportReportPDF').addEventListener('click', function() {
        exportToPDF('report');
    });
    document.getElementById('printReport').addEventListener('click', function() {
        printData('report');
    });
    
    // Export arsip buttons
    document.getElementById('exportArsipExcel').addEventListener('click', function() {
        exportToExcel('arsip');
    });
    document.getElementById('exportArsipPDF').addEventListener('click', function() {
        exportToPDF('arsip');
    });
    
    // Print single data
    document.getElementById('printSingleData').addEventListener('click', function() {
        printSingleData();
    });
    
    // Save edit data
    document.getElementById('saveEditData').addEventListener('click', saveEditedData);
    
    // Confirm action
    document.getElementById('confirmAction').addEventListener('click', executeConfirmedAction);

    // Pagination: single event listener to the pagination container
    document.getElementById('pagination').addEventListener('click', function(e) {
        e.preventDefault();
        const target = e.target.closest('.page-link');
        
        if (!target || target.parentElement.classList.contains('disabled')) {
            return;
        }
        
        const page = parseInt(target.getAttribute('data-page'));
        
        if (!isNaN(page) && page !== currentPage) {
            currentPage = page;
            renderSuratTable();
        }
    });

    // Auto backup on exit
    window.addEventListener('beforeunload', function(e) {
        if (!document.getElementById('mainContent').classList.contains('app-content-unauthenticated')) {
             autoBackupOnExit();
        }
    });
}

// Show specific section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('d-none');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.remove('d-none');
    
    // Update active menu
    document.querySelectorAll('#menuList .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.querySelector(`#menuList .nav-link[data-bs-target="${sectionId}"]`).classList.add('active');
    
    // Section-specific initializations
    if (sectionId === 'dataSurat') {
        renderSuratTable();
    } else if (sectionId === 'arsipSurat') {
        renderArsipTable();
    } else if (sectionId === 'dashboard') {
        updateDashboard();
    } else if (sectionId === 'laporan') {
        updateReportCharts();
    }
}

// Handle form submission
function handleFormSubmit() {
    if (validateForm()) {
        const formData = {
            id: Date.now().toString(),
            jenis: document.getElementById('jenisSurat').value,
            tanggal: document.getElementById('tanggalSurat').value,
            nomor: document.getElementById('nomorSurat').value,
            tanggalTerima: document.getElementById('tanggalTerima').value,
            pengirim: document.getElementById('pengirim').value,
            penerima: document.getElementById('penerima').value,
            perihal: document.getElementById('perihal').value,
            kategori: document.getElementById('kategori').value,
            prioritas: document.getElementById('prioritas').value,
            keterangan: document.getElementById('keterangan').value,
            linkDrive: document.getElementById('linkDrive').value,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active'
        };
        
        suratData.push(formData);
        saveData();
        
        showNotification('Data surat berhasil disimpan!', 'success');
        
        // Reset form
        document.getElementById('inputSuratForm').reset();
        
        // Update stats and dashboard
        updateStats();
        
        // If on dashboard, update it
        if (!document.getElementById('dashboard').classList.contains('d-none')) {
            updateDashboard();
        }
    }
}

// Validate form
function validateForm() {
    let isValid = true;
    
    // Reset error states
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.form-control, .form-select').forEach(el => {
        el.classList.remove('input-error');
    });
    
    // Validate required fields
    const requiredFields = [
        'jenisSurat', 'tanggalSurat', 'nomorSurat', 'tanggalTerima', 
        'pengirim', 'penerima', 'perihal', 'kategori', 'prioritas'
    ];
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            element.classList.add('input-error');
            document.getElementById(`${field}Error`).style.display = 'block';
            isValid = false;
        }
    });
    
    // Validate URL format if provided
    const linkDrive = document.getElementById('linkDrive').value;
    if (linkDrive && !isValidUrl(linkDrive)) {
        document.getElementById('linkDrive').classList.add('input-error');
        document.getElementById('linkDriveError').style.display = 'block';
        isValid = false;
    }
    
    return isValid;
}

// Check if URL is valid
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Render surat table with pagination
function renderSuratTable() {
    const tableBody = document.getElementById('dataSuratTable');
    const paginationElement = document.getElementById('pagination');
    const paginationInfoElement = document.getElementById('paginationInfo');
    
    // Apply filters
    let filteredData = suratData.filter(item => item.status !== 'archived');
    
    if (currentFilter.jenis) {
        filteredData = filteredData.filter(item => item.jenis === currentFilter.jenis);
    }
    
    if (currentFilter.kategori) {
        filteredData = filteredData.filter(item => item.kategori === currentFilter.kategori);
    }
    
    if (currentFilter.prioritas) {
        filteredData = filteredData.filter(item => item.prioritas === currentFilter.prioritas);
    }
    
    if (currentFilter.search) {
        const searchTerm = currentFilter.search.toLowerCase();
        filteredData = filteredData.filter(item => 
            item.nomor.toLowerCase().includes(searchTerm) ||
            item.pengirim.toLowerCase().includes(searchTerm) ||
            item.penerima.toLowerCase().includes(searchTerm) ||
            item.perihal.toLowerCase().includes(searchTerm)
        );
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // Update pagination info
    if (filteredData.length > 0) {
        paginationInfoElement.textContent = `Menampilkan ${startIndex + 1} - ${endIndex} dari ${filteredData.length} data`;
    } else {
        paginationInfoElement.textContent = 'Menampilkan 0 dari 0 data';
    }

    // Clear table
    tableBody.innerHTML = '';
    
    // Populate table
    if (pageData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center">Tidak ada data</td></tr>`;
    } else {
        pageData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${startIndex + index + 1}</td>
                <td>${formatDate(item.tanggal)}</td>
                <td><span class="badge ${item.jenis === 'masuk' ? 'bg-success' : 'bg-warning'}">${item.jenis === 'masuk' ? 'Masuk' : 'Keluar'}</span></td>
                <td>${item.nomor}</td>
                <td>${item.jenis === 'masuk' ? item.pengirim : item.penerima}</td>
                <td>${item.perihal}</td>
                <td><span class="badge badge-kategori kategori-${item.kategori}">${capitalizeFirstLetter(item.kategori)}</span></td>
                <td><span class="prioritas-indicator prioritas-${item.prioritas}"></span>${capitalizeFirstLetter(item.prioritas)}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-info view-btn" data-id="${item.id}" title="Lihat Detail">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-primary edit-btn" data-id="${item.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-warning archive-btn" data-id="${item.id}" title="Arsipkan">
                            <i class="fas fa-archive"></i>
                        </button>
                        <button type="button" class="btn btn-danger delete-btn" data-id="${item.id}" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Update pagination controls
    updatePaginationControls(paginationElement, currentPage, totalPages);
    
    // Add event listeners to action buttons
    attachTableActionListeners();
}

// Render arsip table
function renderArsipTable() {
    const tableBody = document.getElementById('arsipSuratTable');
    
    // Get archived data
    const archived = suratData.filter(item => item.status === 'archived');
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Populate table
    if (archived.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center">Tidak ada data arsip</td></tr>`;
    } else {
        archived.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatDate(item.tanggal)}</td>
                <td><span class="badge ${item.jenis === 'masuk' ? 'bg-success' : 'bg-warning'}">${item.jenis === 'masuk' ? 'Masuk' : 'Keluar'}</span></td>
                <td>${item.nomor}</td>
                <td>${item.jenis === 'masuk' ? item.pengirim : item.penerima}</td>
                <td>${item.perihal}</td>
                <td><span class="badge badge-kategori kategori-${item.kategori}">${capitalizeFirstLetter(item.kategori)}</span></td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-info view-btn" data-id="${item.id}" title="Lihat Detail">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-success restore-btn" data-id="${item.id}" title="Pulihkan">
                            <i class="fas fa-undo"></i>
                        </button>
                        <button type="button" class="btn btn-danger delete-btn" data-id="${item.id}" title="Hapus Permanen">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Add event listeners to action buttons
    attachTableActionListeners();
}

// Attach event listeners to table action buttons
function attachTableActionListeners() {
    // View buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewData(id);
        });
    });
    
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editData(id);
        });
    });
    
    // Archive buttons
    document.querySelectorAll('.archive-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            confirmAction('Apakah Anda yakin ingin mengarsipkan surat ini?', () => {
                archiveData(id);
            });
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const isArchived = this.closest('tr').querySelector('.restore-btn') !== null;
            const message = isArchived 
                ? 'Apakah Anda yakin ingin menghapus permanen surat ini?' 
                : 'Apakah Anda yakin ingin menghapus surat ini?';
            
            confirmAction(message, () => {
                deleteData(id);
            });
        });
    });
    
    // Restore buttons (for archived items)
    document.querySelectorAll('.restore-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            confirmAction('Apakah Anda yakin ingin memulihkan surat ini?', () => {
                restoreArchivedData(id);
            });
        });
    });
}

// Update pagination controls
function updatePaginationControls(paginationElement, currentPage, totalPages) {
    paginationElement.innerHTML = '';
    
    if (totalPages <= 1) return; // Don't render pagination if only one page

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Sebelumnya</a>`;
    paginationElement.appendChild(prevLi);
    
    // Page numbers logic
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
        // Show all pages
        startPage = 1;
        endPage = totalPages;
    } else {
        // Calculate start and end pages with ellipsis logic
        const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
        const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
        if (currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }

    // Always show the first page
    if (startPage > 1) {
        const firstPageLi = document.createElement('li');
        firstPageLi.className = 'page-item';
        firstPageLi.innerHTML = `<a class="page-link" href="#" data-page="1">1</a>`;
        paginationElement.appendChild(firstPageLi);
        if (startPage > 2) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
            paginationElement.appendChild(ellipsisLi);
        }
    }

    // Render page numbers
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        paginationElement.appendChild(pageLi);
    }

    // Always show the last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = `<span class="page-link">...</span>`;
            paginationElement.appendChild(ellipsisLi);
        }
        const lastPageLi = document.createElement('li');
        lastPageLi.className = 'page-item';
        lastPageLi.innerHTML = `<a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>`;
        paginationElement.appendChild(lastPageLi);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">Selanjutnya</a>`;
    paginationElement.appendChild(nextLi);
}

// Apply filters to data table
function applyFilters() {
    currentFilter = {
        jenis: document.getElementById('filterJenis').value,
        kategori: document.getElementById('filterKategori').value,
        prioritas: document.getElementById('filterPrioritas').value,
        search: document.getElementById('searchInput').value
    };
    
    currentPage = 1;
    renderSuratTable();
}

// Apply report filters
function applyReportFilters() {
    updateReportTable();
}

// Update report table based on filters
function updateReportTable() {
    const tableBody = document.getElementById('reportTable');
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const jenis = document.getElementById('reportJenis').value;
    const kategori = document.getElementById('reportKategori').value;
    
    // Filter data based on report criteria
    let filteredData = [...suratData];
    
    if (startDate) {
        filteredData = filteredData.filter(item => item.tanggal >= startDate);
    }
    
    if (endDate) {
        filteredData = filteredData.filter(item => item.tanggal <= endDate);
    }
    
    if (jenis) {
        filteredData = filteredData.filter(item => item.jenis === jenis);
    }
    
    if (kategori) {
        filteredData = filteredData.filter(item => item.kategori === kategori);
    }
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Populate table
    if (filteredData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center">Tidak ada data yang sesuai dengan filter</td></tr>`;
    } else {
        filteredData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatDate(item.tanggal)}</td>
                <td><span class="badge ${item.jenis === 'masuk' ? 'bg-success' : 'bg-warning'}">${item.jenis === 'masuk' ? 'Masuk' : 'Keluar'}</span></td>
                <td>${item.nomor}</td>
                <td>${item.jenis === 'masuk' ? item.pengirim : item.penerima}</td>
                <td>${item.perihal}</td>
                <td><span class="badge badge-kategori kategori-${item.kategori}">${capitalizeFirstLetter(item.kategori)}</span></td>
                <td><span class="prioritas-indicator prioritas-${item.prioritas}"></span>${capitalizeFirstLetter(item.prioritas)}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

// View data details
function viewData(id) {
    const data = suratData.find(item => item.id === id);
    if (!data) return;
    
    const modalBody = document.getElementById('viewModalBody');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Jenis Surat</label>
                    <p>${data.jenis === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Tanggal Surat</label>
                    <p>${formatDate(data.tanggal)}</p>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Nomor Surat</label>
                    <p>${data.nomor}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Tanggal ${data.jenis === 'masuk' ? 'Diterima' : 'Dikirim'}</label>
                    <p>${formatDate(data.tanggalTerima)}</p>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">${data.jenis === 'masuk' ? 'Pengirim' : 'Penerima'}</label>
                    <p>${data.jenis === 'masuk' ? data.pengirim : data.penerima}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Kategori</label>
                    <p><span class="badge badge-kategori kategori-${data.kategori}">${capitalizeFirstLetter(data.kategori)}</span></p>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Prioritas</label>
                    <p><span class="prioritas-indicator prioritas-${data.prioritas}"></span> ${capitalizeFirstLetter(data.prioritas)}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Status</label>
                    <p>${data.status === 'archived' ? 'Diarsipkan' : 'Aktif'}</p>
                </div>
            </div>
        </div>
        
        <div class="mb-3">
            <label class="form-label fw-bold">Perihal</label>
            <p>${data.perihal}</p>
        </div>
        
        <div class="mb-3">
            <label class="form-label fw-bold">Keterangan</label>
            <p>${data.keterangan || '-'}</p>
        </div>
        
        ${data.linkDrive ? `
        <div class="mb-3">
            <label class="form-label fw-bold">Link Google Drive</label>
            <p><a href="${data.linkDrive}" target="_blank" class="drive-link">${data.linkDrive}</a></p>
        </div>
        ` : ''}
        
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Dibuat Pada</label>
                    <p>${formatDateTime(data.createdAt)}</p>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label fw-bold">Diupdate Pada</label>
                    <p>${formatDateTime(data.updatedAt)}</p>
                </div>
            </div>
        </div>
    `;
    
    // Store current view ID for printing
    modalBody.setAttribute('data-current-id', id);
    
    const viewModal = new bootstrap.Modal(document.getElementById('viewModal'));
    viewModal.show();
}

// Edit data
function editData(id) {
    const data = suratData.find(item => item.id === id);
    if (!data) return;
    
    currentEditId = id;
    
    const modalBody = document.getElementById('editModalBody');
    modalBody.innerHTML = `
        <form id="editSuratForm">
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label" for="editJenisSurat">
                        <i class="fas fa-envelope"></i> Jenis Surat
                    </label>
                    <select class="form-select" id="editJenisSurat" required>
                        <option value="">Pilih Jenis Surat</option>
                        <option value="masuk" ${data.jenis === 'masuk' ? 'selected' : ''}>Surat Masuk</option>
                        <option value="keluar" ${data.jenis === 'keluar' ? 'selected' : ''}>Surat Keluar</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label" for="editTanggalSurat">
                        <i class="fas fa-calendar"></i> Tanggal Surat
                    </label>
                    <input type="date" class="form-control" id="editTanggalSurat" value="${data.tanggal}" required>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label" for="editNomorSurat">
                        <i class="fas fa-hashtag"></i> Nomor Surat
                    </label>
                    <input type="text" class="form-control" id="editNomorSurat" value="${data.nomor}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label" for="editTanggalTerima">
                        <i class="fas fa-calendar-check"></i> Tanggal ${data.jenis === 'masuk' ? 'Diterima' : 'Dikirim'}
                    </label>
                    <input type="date" class="form-control" id="editTanggalTerima" value="${data.tanggalTerima}" required>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label" for="editPengirim">
                        <i class="fas fa-user"></i> Pengirim
                    </label>
                    <input type="text" class="form-control" id="editPengirim" value="${data.pengirim}" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label" for="editPenerima">
                        <i class="fas fa-user-check"></i> Penerima
                    </label>
                    <input type="text" class="form-control" id="editPenerima" value="${data.penerima}" required>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-12">
                    <label class="form-label" for="editPerihal">
                        <i class="fas fa-file-alt"></i> Perihal
                    </label>
                    <textarea class="form-control" id="editPerihal" rows="2" required>${data.perihal}</textarea>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label" for="editKategori">
                        <i class="fas fa-tag"></i> Kategori
                    </label>
                    <select class="form-select" id="editKategori" required>
                        <option value="">Pilih Kategori</option>
                        <option value="pemerintah" ${data.kategori === 'pemerintah' ? 'selected' : ''}>Pemerintah</option>
                        <option value="perusahaan" ${data.kategori === 'perusahaan' ? 'selected' : ''}>Perusahaan</option>
                        <option value="lembaga" ${data.kategori === 'lembaga' ? 'selected' : ''}>Lembaga</option>
                        <option value="opd" ${data.kategori === 'opd' ? 'selected' : ''}>OPD</option>
                        <option value="upt" ${data.kategori === 'upt' ? 'selected' : ''}>UPT</option>
                        <option value="perorangan" ${data.kategori === 'perorangan' ? 'selected' : ''}>Perorangan</option>
                        <option value="lainnya" ${data.kategori === 'lainnya' ? 'selected' : ''}>Lainnya</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label" for="editPrioritas">
                        <i class="fas fa-exclamation-circle"></i> Prioritas
                    </label>
                    <select class="form-select" id="editPrioritas" required>
                        <option value="">Pilih Prioritas</option>
                        <option value="tinggi" ${data.prioritas === 'tinggi' ? 'selected' : ''}>Tinggi</option>
                        <option value="sedang" ${data.prioritas === 'sedang' ? 'selected' : ''}>Sedang</option>
                        <option value="rendah" ${data.prioritas === 'rendah' ? 'selected' : ''}>Rendah</option>
                    </select>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-12">
                    <label class="form-label" for="editKeterangan">
                        <i class="fas fa-sticky-note"></i> Keterangan
                    </label>
                    <textarea class="form-control" id="editKeterangan" rows="2">${data.keterangan || ''}</textarea>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-12">
                    <label class="form-label" for="editLinkDrive">
                        <i class="fab fa-google-drive"></i> Link Google Drive
                    </label>
                    <input type="url" class="form-control" id="editLinkDrive" value="${data.linkDrive || ''}">
                </div>
            </div>
        </form>
    `;
    
    const editModal = new bootstrap.Modal(document.getElementById('editModal'));
    editModal.show();
}

// Save edited data
function saveEditedData() {
    if (!currentEditId) return;
    
    const dataIndex = suratData.findIndex(item => item.id === currentEditId);
    if (dataIndex === -1) return;
    
    // Validate form
    const requiredFields = [
        'editJenisSurat', 'editTanggalSurat', 'editNomorSurat', 'editTanggalTerima', 
        'editPengirim', 'editPenerima', 'editPerihal', 'editKategori', 'editPrioritas'
    ];
    
    let isValid = true;
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            element.classList.add('input-error');
            isValid = false;
        }
    });
    
    const linkDrive = document.getElementById('editLinkDrive').value;
    if (linkDrive && !isValidUrl(linkDrive)) {
        document.getElementById('editLinkDrive').classList.add('input-error');
        isValid = false;
    }
    
    if (!isValid) {
        showNotification('Harap isi semua field yang required dengan benar', 'error');
        return;
    }
    
    // Update data
    suratData[dataIndex] = {
        ...suratData[dataIndex],
        jenis: document.getElementById('editJenisSurat').value,
        tanggal: document.getElementById('editTanggalSurat').value,
        nomor: document.getElementById('editNomorSurat').value,
        tanggalTerima: document.getElementById('editTanggalTerima').value,
        pengirim: document.getElementById('editPengirim').value,
        penerima: document.getElementById('editPenerima').value,
        perihal: document.getElementById('editPerihal').value,
        kategori: document.getElementById('editKategori').value,
        prioritas: document.getElementById('editPrioritas').value,
        keterangan: document.getElementById('editKeterangan').value,
        linkDrive: document.getElementById('editLinkDrive').value,
        updatedAt: new Date().toISOString()
    };
    
    saveData();
    
    showNotification('Data berhasil diperbarui', 'success');
    
    // Close modal
    const editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
    editModal.hide();
    
    // Refresh tables
    renderSuratTable();
    updateStats();
}

// Archive data
function archiveData(id) {
    const dataIndex = suratData.findIndex(item => item.id === id);
    if (dataIndex === -1) return;
    
    suratData[dataIndex].status = 'archived';
    suratData[dataIndex].updatedAt = new Date().toISOString();
    
    saveData();
    
    showNotification('Surat berhasil diarsipkan', 'success');
    
    // Refresh tables
    renderSuratTable();
    updateStats();
}

// Delete data
function deleteData(id) {
    const dataIndex = suratData.findIndex(item => item.id === id);
    if (dataIndex === -1) return;
    
    suratData.splice(dataIndex, 1);
    
    saveData();
    
    showNotification('Data berhasil dihapus', 'success');
    
    // Refresh tables
    renderSuratTable();
    renderArsipTable();
    updateStats();
}

// Restore archived data
function restoreArchivedData(id) {
    const dataIndex = suratData.findIndex(item => item.id === id);
    if (dataIndex === -1) return;
    
    suratData[dataIndex].status = 'active';
    suratData[dataIndex].updatedAt = new Date().toISOString();
    
    saveData();
    
    showNotification('Surat berhasil dipulihkan', 'success');
    
    // Refresh tables
    renderSuratTable();
    renderArsipTable();
    updateStats();
}

// Confirm action
function confirmAction(message, callback) {
    const modalBody = document.getElementById('confirmationModalBody');
    modalBody.textContent = message;
    
    const confirmBtn = document.getElementById('confirmAction');
    
    // Remove previous event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Add new event listener
    newConfirmBtn.addEventListener('click', function() {
        callback();
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
        modal.hide();
    });
    
    const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    modal.show();
}

// Execute confirmed action
function executeConfirmedAction() {
    // This is handled by the confirmAction function
    // The actual action is passed as a callback
}

// Export to Excel
function exportToExcel(type = 'data') {
    let dataToExport = [];
    let filename = '';
    
    if (type === 'data') {
        dataToExport = suratData.filter(item => item.status !== 'archived');
        filename = 'data_surat.xlsx';
    } else if (type === 'arsip') {
        dataToExport = suratData.filter(item => item.status === 'archived');
        filename = 'arsip_surat.xlsx';
    } else if (type === 'report') {
        // Get filtered report data
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        const jenis = document.getElementById('reportJenis').value;
        const kategori = document.getElementById('reportKategori').value;
        
        dataToExport = [...suratData];
        
        if (startDate) {
            dataToExport = dataToExport.filter(item => item.tanggal >= startDate);
        }
        
        if (endDate) {
            dataToExport = dataToExport.filter(item => item.tanggal <= endDate);
        }
        
        if (jenis) {
            dataToExport = dataToExport.filter(item => item.jenis === jenis);
        }
        
        if (kategori) {
            dataToExport = dataToExport.filter(item => item.kategori === kategori);
        }
        
        filename = 'laporan_surat.xlsx';
    }
    
    if (dataToExport.length === 0) {
        showNotification('Tidak ada data untuk diexport', 'warning');
        return;
    }
    
    // Prepare data for Excel
    const excelData = dataToExport.map(item => ({
        'Jenis Surat': item.jenis === 'masuk' ? 'Surat Masuk' : 'Surat Keluar',
        'Tanggal Surat': formatDate(item.tanggal),
        'Nomor Surat': item.nomor,
        'Tanggal Diterima/Dikirim': formatDate(item.tanggalTerima),
        'Pengirim': item.pengirim,
        'Penerima': item.penerima,
        'Perihal': item.perihal,
        'Kategori': capitalizeFirstLetter(item.kategori),
        'Prioritas': capitalizeFirstLetter(item.prioritas),
        'Keterangan': item.keterangan || '',
        'Link Google Drive': item.linkDrive || '',
        'Status': item.status === 'archived' ? 'Diarsipkan' : 'Aktif'
    }));
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Surat');
    
    // Export to file
    XLSX.writeFile(wb, filename);
    
    showNotification('Data berhasil diexport ke Excel', 'success');
}

// Export to PDF
function exportToPDF(type = 'data') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    let dataToExport = [];
    let title = '';
    
    if (type === 'data') {
        dataToExport = suratData.filter(item => item.status !== 'archived');
        title = 'DATA SURAT';
    } else if (type === 'arsip') {
        dataToExport = suratData.filter(item => item.status === 'archived');
        title = 'ARSIP SURAT';
    } else if (type === 'report') {
        // Get filtered report data
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        const jenis = document.getElementById('reportJenis').value;
        const kategori = document.getElementById('reportKategori').value;
        
        dataToExport = [...suratData];
        
        if (startDate) {
            dataToExport = dataToExport.filter(item => item.tanggal >= startDate);
        }
        
        if (endDate) {
            dataToExport = dataToExport.filter(item => item.tanggal <= endDate);
        }
        
        if (jenis) {
            dataToExport = dataToExport.filter(item => item.jenis === jenis);
        }
        
        if (kategori) {
            dataToExport = dataToExport.filter(item => item.kategori === kategori);
        }
        
        title = 'LAPORAN SURAT';
    }
    
    if (dataToExport.length === 0) {
        showNotification('Tidak ada data untuk diexport', 'warning');
        return;
    }
    
    // Prepare data for PDF
    const tableData = dataToExport.map(item => [
        item.jenis === 'masuk' ? 'Masuk' : 'Keluar',
        formatDate(item.tanggal),
        item.nomor,
        item.jenis === 'masuk' ? item.pengirim : item.penerima,
        item.perihal,
        capitalizeFirstLetter(item.kategori),
        capitalizeFirstLetter(item.prioritas)
    ]);
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${formatDateTime(new Date())}`, 14, 22);
    
    // Add table
    doc.autoTable({
        startY: 30,
        head: [['Jenis', 'Tanggal', 'Nomor', 'Pengirim/Penerima', 'Perihal', 'Kategori', 'Prioritas']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [13, 71, 161]
        }
    });
    
    // Save PDF
    doc.save(`${title.toLowerCase().replace(/\s/g, '_')}.pdf`);
    
    showNotification('Data berhasil diexport ke PDF', 'success');
}

// Print data
function printData(type = 'data') {
    let dataToPrint = [];
    let title = '';
    
    if (type === 'data') {
        dataToPrint = suratData.filter(item => item.status !== 'archived');
        title = 'DATA SURAT';
    } else if (type === 'report') {
        // Get filtered report data
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        const jenis = document.getElementById('reportJenis').value;
        const kategori = document.getElementById('reportKategori').value;
        
        dataToPrint = [...suratData];
        
        if (startDate) {
            dataToPrint = dataToPrint.filter(item => item.tanggal >= startDate);
        }
        
        if (endDate) {
            dataToPrint = dataToPrint.filter(item => item.tanggal <= endDate);
        }
        
        if (jenis) {
            dataToPrint = dataToPrint.filter(item => item.jenis === jenis);
        }
        
        if (kategori) {
            dataToPrint = dataToPrint.filter(item => item.kategori === kategori);
        }
        
        title = 'LAPORAN SURAT';
    }
    
    if (dataToPrint.length === 0) {
        showNotification('Tidak ada data untuk dicetak', 'warning');
        return;
    }
    
    // Create print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cetak ${title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .print-header { text-align: center; margin-bottom: 20px; }
                .print-title { font-size: 18px; font-weight: bold; }
                .print-subtitle { font-size: 14px; margin-bottom: 10px; }
                .print-date { text-align: right; font-size: 12px; margin-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
                th { background-color: #f2f2f2; }
                @media print {
                    @page { size: landscape; margin: 0.5cm; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <div class="print-title">${title}</div>
                <div class="print-subtitle">SISMAT - Sistem Manajemen Surat</div>
            </div>
            <div class="print-date">Dicetak pada: ${formatDateTime(new Date())}</div>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Jenis</th>
                        <th>Tanggal</th>
                        <th>Nomor</th>
                        <th>Pengirim/Penerima</th>
                        <th>Perihal</th>
                        <th>Kategori</th>
                        <th>Prioritas</th>
                    </tr>
                </thead>
                <tbody>
                    ${dataToPrint.map((item, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.jenis === 'masuk' ? 'Masuk' : 'Keluar'}</td>
                            <td>${formatDate(item.tanggal)}</td>
                            <td>${item.nomor}</td>
                            <td>${item.jenis === 'masuk' ? item.pengirim : item.penerima}</td>
                            <td>${item.perihal}</td>
                            <td>${capitalizeFirstLetter(item.kategori)}</td>
                            <td>${capitalizeFirstLetter(item.prioritas)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load before printing
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

// Print single data
function printSingleData() {
    const modalBody = document.getElementById('viewModalBody');
    const id = modalBody.getAttribute('data-current-id');
    const data = suratData.find(item => item.id === id);
    
    if (!data) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cetak Detail Surat</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .print-header { text-align: center; margin-bottom: 20px; }
                .print-title { font-size: 18px; font-weight: bold; }
                .print-subtitle { font-size: 14px; margin-bottom: 10px; }
                .print-date { text-align: right; font-size: 12px; margin-bottom: 10px; }
                .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .detail-table td { padding: 8px; border-bottom: 1px solid #eee; }
                .detail-table td:first-child { font-weight: bold; width: 30%; vertical-align: top; }
                @media print {
                    @page { margin: 1cm; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <div class="print-title">DETAIL SURAT</div>
                <div class="print-subtitle">SISMAT - Sistem Manajemen Surat</div>
            </div>
            <div class="print-date">Dicetak pada: ${formatDateTime(new Date())}</div>
            
            <table class="detail-table">
                <tr>
                    <td>Jenis Surat</td>
                    <td>${data.jenis === 'masuk' ? 'Surat Masuk' : 'Surat Keluar'}</td>
                </tr>
                <tr>
                    <td>Tanggal Surat</td>
                    <td>${formatDate(data.tanggal)}</td>
                </tr>
                <tr>
                    <td>Nomor Surat</td>
                    <td>${data.nomor}</td>
                </tr>
                <tr>
                    <td>Tanggal ${data.jenis === 'masuk' ? 'Diterima' : 'Dikirim'}</td>
                    <td>${formatDate(data.tanggalTerima)}</td>
                </tr>
                <tr>
                    <td>${data.jenis === 'masuk' ? 'Pengirim' : 'Penerima'}</td>
                    <td>${data.jenis === 'masuk' ? data.pengirim : data.penerima}</td>
                </tr>
                <tr>
                    <td>Perihal</td>
                    <td>${data.perihal}</td>
                </tr>
                <tr>
                    <td>Kategori</td>
                    <td>${capitalizeFirstLetter(data.kategori)}</td>
                </tr>
                <tr>
                    <td>Prioritas</td>
                    <td>${capitalizeFirstLetter(data.prioritas)}</td>
                </tr>
                <tr>
                    <td>Keterangan</td>
                    <td>${data.keterangan || '-'}</td>
                </tr>
                ${data.linkDrive ? `
                <tr>
                    <td>Link Google Drive</td>
                    <td>${data.linkDrive}</td>
                </tr>
                ` : ''}
                <tr>
                    <td>Status</td>
                    <td>${data.status === 'archived' ? 'Diarsipkan' : 'Aktif'}</td>
                </tr>
                <tr>
                    <td>Dibuat Pada</td>
                    <td>${formatDateTime(data.createdAt)}</td>
                </tr>
                <tr>
                    <td>Diupdate Pada</td>
                    <td>${formatDateTime(data.updatedAt)}</td>
                </tr>
            </table>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load before printing
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

// Backup data
function backupData() {
    const backupNotes = document.getElementById('backupNotes').value;
    const backup = {
        data: suratData,
        metadata: {
            exportedAt: new Date().toISOString(),
            version: '2.0.0',
            totalRecords: suratData.length,
            notes: backupNotes
        }
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `sismat_backup_${formatDate(new Date(), 'YYYY-MM-DD')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    // Add to backup history
    addToBackupHistory(backup);
    
    showNotification('Backup data berhasil dilakukan', 'success');
}

// Add to backup history
function addToBackupHistory(backup) {
    let backupHistory = JSON.parse(localStorage.getItem('backupHistory') || '[]');
    
    backupHistory.push({
        date: new Date().toISOString(),
        totalRecords: backup.metadata.totalRecords,
        notes: backup.metadata.notes
    });
    
    // Keep only last 10 backups in history
    if (backupHistory.length > 10) {
        backupHistory = backupHistory.slice(-10);
    }
    
    localStorage.setItem('backupHistory', JSON.stringify(backupHistory));
    
    // Update backup history table
    updateBackupHistory();
}

// Update backup history table
function updateBackupHistory() {
    const tableBody = document.getElementById('backupHistory');
    const backupHistory = JSON.parse(localStorage.getItem('backupHistory') || '[]');
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Populate table
    if (backupHistory.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center">Belum ada riwayat backup</td></tr>`;
    } else {
        backupHistory.reverse().forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatDateTime(item.date)}</td>
                <td>${item.totalRecords} data</td>
                <td>${item.notes || '-'}</td>
                <td>
                    <button type="button" class="btn btn-sm btn-outline-primary view-backup-btn" data-date="${item.date}">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

// Restore data
function restoreData() {
    const fileInput = document.getElementById('restoreFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Pilih file backup terlebih dahulu', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            // Validate backup structure
            if (!backup.data || !Array.isArray(backup.data)) {
                throw new Error('Format file backup tidak valid');
            }
            
            const overwrite = document.getElementById('overwriteData').checked;
            
            if (overwrite) {
                // Replace all data
                suratData = backup.data;
            } else {
                // Merge data, avoid duplicates by ID
                backup.data.forEach(newItem => {
                    const existingIndex = suratData.findIndex(item => item.id === newItem.id);
                    if (existingIndex === -1) {
                        suratData.push(newItem);
                    }
                });
            }
            
            saveData();
            
            showNotification('Data berhasil direstore', 'success');
            
            // Refresh UI
            renderSuratTable();
            renderArsipTable();
            updateStats();
            
            // Reset file input
            fileInput.value = '';
            document.getElementById('restoreData').disabled = true;
            
        } catch (error) {
            console.error('Restore error:', error);
            showNotification('Gagal memproses file backup: ' + error.message, 'error');
        }
    };
    
    reader.onerror = function() {
        showNotification('Gagal membaca file', 'error');
    };
    
    reader.readAsText(file);
}

// Save general settings
function saveGeneralSettings() {
    const appName = document.getElementById('appName').value;
    itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    const dateFormat = document.getElementById('dateFormat').value;
    const notificationsEnabled = document.getElementById('notificationsEnabled').checked;
    const autoBackupEnabled = document.getElementById('autoBackupEnabled').checked;
    
    // Save settings to localStorage
    localStorage.setItem('appName', appName);
    localStorage.setItem('itemsPerPage', itemsPerPage);
    localStorage.setItem('dateFormat', dateFormat);
    localStorage.setItem('notificationsEnabled', notificationsEnabled);
    localStorage.setItem('autoBackupEnabled', autoBackupEnabled);
    
    // Update app title
    document.querySelector('.app-title').textContent = appName;
    document.title = appName + ' - Sistem Manajemen Surat';
    
    showNotification('Pengaturan berhasil disimpan', 'success');
    
    // Refresh table with new items per page
    renderSuratTable();
}

// Change password
function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate
    if (currentPassword !== validationCode) {
        showNotification('Kode keamanan saat ini salah', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('Konfirmasi kode keamanan tidak cocok', 'error');
        return;
    }
    
    if (newPassword.length < 4) {
        showNotification('Kode keamanan minimal 4 karakter', 'error');
        return;
    }
    
    // Update validation code
    validationCode = newPassword;
    localStorage.setItem('validationCode', newPassword);
    document.getElementById('validationCode').value = newPassword;
    
    // Clear form
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    showNotification('Kode keamanan berhasil diperbarui', 'success');
}

// Generate validation code
function generateValidationCode() {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    validationCode = newCode;
    localStorage.setItem('validationCode', newCode);
    document.getElementById('validationCode').value = newCode;
    
    showNotification('Kode validasi baru telah digenerate', 'success');
}

// Reset application
function resetApplication() {
    confirmAction('Apakah Anda yakin ingin mereset aplikasi? Semua data akan dihapus permanen.', () => {
        localStorage.clear();
        suratData = [];
        saveData();
        
        // Reload the page
        window.location.reload();
    });
}

// Handle login
function handleLogin() {
    if (isBlocked) {
        showNotification('Anda telah diblokir sementara. Silakan coba lagi nanti.', 'error');
        return;
    }
    
    const securityCode = document.getElementById('securityCode').value;
    const loginButton = document.getElementById('loginButton');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginButtonText = document.querySelector('.login-button-text');
    
    // Show loading state
    loginButton.disabled = true;
    loginSpinner.classList.remove('d-none');
    loginButtonText.textContent = 'Memproses...';
    
    // Simulate network delay
    setTimeout(() => {
        if (securityCode === validationCode) {
            // Successful login
            loginAttempts = 0;
            localStorage.setItem('loginAttempts', loginAttempts);
            
            // Hide login modal
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();
            
            // Show app content
            document.getElementById('mainContent').classList.remove('app-content-unauthenticated');
            
            showNotification('Login berhasil. Selamat datang!', 'success');
            
        } else {
            // Failed login
            loginAttempts++;
            localStorage.setItem('loginAttempts', loginAttempts);
            
            if (loginAttempts >= 5) {
                isBlocked = true;
                blockTime = Date.now();
                localStorage.setItem('blockTime', blockTime);
                
                document.getElementById('attemptsCount').style.display = 'none';
                document.getElementById('blockedMessage').style.display = 'block';
                
                // Start countdown
                let countdown = 30;
                const countdownElement = document.getElementById('countdown');
                const countdownInterval = setInterval(() => {
                    countdown--;
                    countdownElement.textContent = countdown;
                    
                    if (countdown <= 0) {
                        clearInterval(countdownInterval);
                        isBlocked = false;
                        loginAttempts = 0;
                        localStorage.removeItem('blockTime');
                        localStorage.setItem('loginAttempts', loginAttempts);
                        
                        document.getElementById('blockedMessage').style.display = 'none';
                    }
                }, 1000);
                
                showNotification('Terlalu banyak percobaan gagal. Coba lagi dalam 30 detik.', 'error');
            } else {
                document.getElementById('attemptsCount').textContent = `Percobaan login gagal: ${loginAttempts} dari 5`;
                document.getElementById('attemptsCount').style.display = 'block';
                
                // Shake animation for wrong password
                document.getElementById('loginForm').classList.add('login-shake');
                setTimeout(() => {
                    document.getElementById('loginForm').classList.remove('login-shake');
                }, 600);
                
                showNotification('Kode keamanan salah', 'error');
            }
        }
        
        // Reset login button
        loginButton.disabled = false;
        loginSpinner.classList.add('d-none');
        loginButtonText.textContent = 'Masuk ke Aplikasi';
        
    }, 1000);
}

// Logout
function logout() {
    confirmAction('Apakah Anda yakin ingin keluar dari aplikasi?', () => {
        
        // Auto backup on exit
        autoBackupOnExit();

        // Show login modal
        const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
        loginModal.show();
        
        // Hide app content
        document.getElementById('mainContent').classList.add('app-content-unauthenticated');
        
        // Clear password field
        document.getElementById('securityCode').value = '';
        
        showNotification('Anda telah logout dari aplikasi', 'info');
    });
}

// Generate report
function generateReport() {
    // This would generate a comprehensive report
    // For now, we'll just update the report table and charts
    updateReportTable();
    updateReportCharts();
    
    showNotification('Laporan berhasil digenerate', 'success');
}

// Initialize charts
function initCharts() {
    // Jenis Surat Chart (Pie)
    const jenisSuratCtx = document.getElementById('jenisSuratChart').getContext('2d');
    charts.jenisSurat = new Chart(jenisSuratCtx, {
        type: 'pie',
        data: {
            labels: ['Surat Masuk', 'Surat Keluar'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#28a745', '#ffc107'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Distribusi Jenis Surat'
                }
            }
        }
    });
    
    // Monthly Stats Chart (Bar)
    const monthlyStatsCtx = document.getElementById('monthlyStatsChart').getContext('2d');
    charts.monthlyStats = new Chart(monthlyStatsCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
            datasets: [
                {
                    label: 'Surat Masuk',
                    data: Array(12).fill(0),
                    backgroundColor: '#28a745',
                    borderWidth: 1
                },
                {
                    label: 'Surat Keluar',
                    data: Array(12).fill(0),
                    backgroundColor: '#ffc107',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Statistik Bulanan'
                }
            }
        }
    });
    
    // Report Chart (for laporan section)
    const reportCtx = document.getElementById('reportChart').getContext('2d');
    charts.report = new Chart(reportCtx, {
        type: 'bar',
        data: {
            labels: ['Pemerintah', 'Perusahaan', 'Lembaga', 'OPD', 'UPT', 'Perorangan', 'Lainnya'],
            datasets: [
                {
                    label: 'Surat Masuk',
                    data: Array(7).fill(0),
                    backgroundColor: '#28a745',
                    borderWidth: 1
                },
                {
                    label: 'Surat Keluar',
                    data: Array(7).fill(0),
                    backgroundColor: '#ffc107',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Distribusi Surat per Kategori'
                }
            }
        }
    });
}

// Update dashboard charts and stats
function updateDashboard() {
    updateStats();
    updateCharts();
    updateRecentActivities();
}

// Update stats
function updateStats() {
    const totalSurat = suratData.length;
    const suratMasuk = suratData.filter(item => item.jenis === 'masuk' && item.status !== 'archived').length;
    const suratKeluar = suratData.filter(item => item.jenis === 'keluar' && item.status !== 'archived').length;
    const suratArsip = suratData.filter(item => item.status === 'archived').length;
    
    document.getElementById('totalSurat').textContent = totalSurat;
    document.getElementById('suratMasuk').textContent = suratMasuk;
    document.getElementById('suratKeluar').textContent = suratKeluar;
    document.getElementById('suratArsip').textContent = suratArsip;
    
    // Update settings page
    document.getElementById('settingsTotalSurat').textContent = totalSurat;
    document.getElementById('lastUpdated').textContent = formatDateTime(new Date());
}

// Update charts
function updateCharts() {
    // Update jenis surat chart
    const suratMasuk = suratData.filter(item => item.jenis === 'masuk' && item.status !== 'archived').length;
    const suratKeluar = suratData.filter(item => item.jenis === 'keluar' && item.status !== 'archived').length;
    
    if (charts.jenisSurat) {
        charts.jenisSurat.data.datasets[0].data = [suratMasuk, suratKeluar];
        charts.jenisSurat.update();
    }
    
    // Update monthly stats chart
    const monthlyDataMasuk = Array(12).fill(0);
    const monthlyDataKeluar = Array(12).fill(0);
    
    suratData.forEach(item => {
        if (item.status !== 'archived') {
            const month = new Date(item.tanggal).getMonth();
            if (item.jenis === 'masuk') {
                monthlyDataMasuk[month]++;
            } else {
                monthlyDataKeluar[month]++;
            }
        }
    });
    
    if (charts.monthlyStats) {
        charts.monthlyStats.data.datasets[0].data = monthlyDataMasuk;
        charts.monthlyStats.data.datasets[1].data = monthlyDataKeluar;
        charts.monthlyStats.update();
    }
}

// Update recent activities
function updateRecentActivities() {
    const activitiesBody = document.getElementById('recentActivities');
    
    // Get recent activities (last 5)
    const recentData = [...suratData]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    // Clear table
    activitiesBody.innerHTML = '';
    
    // Populate table
    if (recentData.length === 0) {
        activitiesBody.innerHTML = `<tr><td colspan="6" class="text-center">Tidak ada data</td></tr>`;
    } else {
        recentData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatDate(item.tanggal)}</td>
                <td><span class="badge ${item.jenis === 'masuk' ? 'bg-success' : 'bg-warning'}">${item.jenis === 'masuk' ? 'Masuk' : 'Keluar'}</span></td>
                <td>${item.jenis === 'masuk' ? item.pengirim : item.penerima}</td>
                <td>${item.perihal}</td>
                <td><span class="badge ${item.status === 'archived' ? 'bg-secondary' : 'bg-success'}">${item.status === 'archived' ? 'Diarsipkan' : 'Aktif'}</span></td>
            `;
            activitiesBody.appendChild(row);
        });
    }
}

// Update report charts
function updateReportCharts() {
    // Get filtered data for report
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const jenis = document.getElementById('reportJenis').value;
    const kategori = document.getElementById('reportKategori').value;
    
    let filteredData = [...suratData];
    
    if (startDate) {
        filteredData = filteredData.filter(item => item.tanggal >= startDate);
    }
    
    if (endDate) {
        filteredData = filteredData.filter(item => item.tanggal <= endDate);
    }
    
    if (jenis) {
        filteredData = filteredData.filter(item => item.jenis === jenis);
    }
    
    if (kategori) {
        filteredData = filteredData.filter(item => item.kategori === kategori);
    }
    
    // Update report chart
    const categories = ['pemerintah', 'perusahaan', 'lembaga', 'opd', 'upt', 'perorangan', 'lainnya'];
    const dataMasuk = Array(7).fill(0);
    const dataKeluar = Array(7).fill(0);
    
    filteredData.forEach(item => {
        const categoryIndex = categories.indexOf(item.kategori);
        if (categoryIndex !== -1) {
            if (item.jenis === 'masuk') {
                dataMasuk[categoryIndex]++;
            } else {
                dataKeluar[categoryIndex]++;
            }
        }
    });
    
    if (charts.report) {
        charts.report.data.datasets[0].data = dataMasuk;
        charts.report.data.datasets[1].data = dataKeluar;
        charts.report.update();
    }
}

// Update browser info
function updateBrowserInfo() {
    const browserInfo = navigator.userAgent;
    let storageUsage = 0;
    try {
        storageUsage = (JSON.stringify(localStorage).length / 1024).toFixed(2);
    } catch (e) {
        // Could be a security error in some browsers
    }
    const storageInfo = `${storageUsage} KB digunakan`;

    document.getElementById('browserInfo').textContent = navigator.platform;
    document.getElementById('storageInfo').textContent = storageInfo;
}

// Show notification
function showNotification(message, type = 'info') {
    const toast = document.querySelector('.notification-toast');
    const toastBody = toast.querySelector('.toast-body');
    const toastHeader = toast.querySelector('.toast-header');
    
    // Set message
    toastBody.textContent = message;
    
    // Set icon and color based on type
    let iconClass = 'fa-info-circle';
    let bgClass = 'text-primary';
    
    switch (type) {
        case 'success':
            iconClass = 'fa-check-circle';
            bgClass = 'text-success';
            break;
        case 'error':
            iconClass = 'fa-exclamation-circle';
            bgClass = 'text-danger';
            break;
        case 'warning':
            iconClass = 'fa-exclamation-triangle';
            bgClass = 'text-warning';
            break;
    }
    
    toastHeader.querySelector('i').className = `fas ${iconClass} me-2 ${bgClass}`;
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('suratData');
    if (savedData) {
        suratData = JSON.parse(savedData);
    }
    
    // Load settings
    const savedAppName = localStorage.getItem('appName');
    if (savedAppName) {
        document.getElementById('appName').value = savedAppName;
        document.querySelector('.app-title').textContent = savedAppName;
        document.title = savedAppName + ' - Sistem Manajemen Surat';
    }
    
    const savedItemsPerPage = localStorage.getItem('itemsPerPage');
    if (savedItemsPerPage) {
        itemsPerPage = parseInt(savedItemsPerPage);
        document.getElementById('itemsPerPage').value = itemsPerPage;
    }
    
    const savedDateFormat = localStorage.getItem('dateFormat');
    if (savedDateFormat) {
        document.getElementById('dateFormat').value = savedDateFormat;
    }
    
    const savedNotificationsEnabled = localStorage.getItem('notificationsEnabled');
    if (savedNotificationsEnabled) {
        document.getElementById('notificationsEnabled').checked = savedNotificationsEnabled === 'true';
    }
    
    const savedAutoBackupEnabled = localStorage.getItem('autoBackupEnabled');
    if (savedAutoBackupEnabled) {
        document.getElementById('autoBackupEnabled').checked = savedAutoBackupEnabled === 'true';
    }
    
    // Load login attempts and block status
    const savedLoginAttempts = localStorage.getItem('loginAttempts');
    if (savedLoginAttempts) {
        loginAttempts = parseInt(savedLoginAttempts);
    }
    
    const savedBlockTime = localStorage.getItem('blockTime');
    if (savedBlockTime) {
        const blockTimeDiff = Date.now() - parseInt(savedBlockTime);
        if (blockTimeDiff < 30000) { // 30 seconds block
            isBlocked = true;
            blockTime = parseInt(savedBlockTime);
            
            document.getElementById('attemptsCount').style.display = 'none';
            document.getElementById('blockedMessage').style.display = 'block';
            
            // Start countdown
            let countdown = Math.ceil((30000 - blockTimeDiff) / 1000);
            const countdownElement = document.getElementById('countdown');
            countdownElement.textContent = countdown;
            const countdownInterval = setInterval(() => {
                countdown--;
                countdownElement.textContent = countdown;
                
                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    isBlocked = false;
                    loginAttempts = 0;
                    localStorage.removeItem('blockTime');
                    localStorage.setItem('loginAttempts', loginAttempts);
                    
                    document.getElementById('blockedMessage').style.display = 'none';
                }
            }, 1000);
        }
    }
    
    // Update backup history
    updateBackupHistory();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('suratData', JSON.stringify(suratData));
}

/**
 * Creates a formatted timestamp string for filenames.
 * @returns {string} Formatted timestamp (e.g., "20250922_143005")
 */
function getFormattedTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Handles the automatic backup process on exit, refresh, or logout.
 */
function autoBackupOnExit() {
    // Only backup if there is data to prevent empty downloads
    if (suratData.length === 0) {
        return;
    }

    const appName = localStorage.getItem('appName') || 'SISMAT';
    const timestamp = getFormattedTimestamp();
    const filename = `${appName}_AUTOBACKUP_${timestamp}.json`;

    const backup = {
        data: suratData,
        metadata: {
            exportedAt: new Date().toISOString(),
            version: '2.0.0',
            totalRecords: suratData.length,
            notes: `Backup otomatis saat keluar/refresh pada ${formatDateTime(new Date())}`
        }
    };

    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    linkElement.click(); // This will trigger the download automatically
}

// Format date
function formatDate(dateString, format = 'DD/MM/YYYY') {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';

    // Adjust for timezone offset to prevent date from changing
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    
    const day = adjustedDate.getDate().toString().padStart(2, '0');
    const month = (adjustedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = adjustedDate.getFullYear();
    
    if (format === 'YYYY-MM-DD') {
        return `${year}-${month}-${day}`;
    }
    
    return `${day}/${month}/${year}`;
}

// Format date and time
function formatDateTime(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Capitalize first letter
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}
