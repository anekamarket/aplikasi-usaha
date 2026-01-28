// theme.js - Fitur Pengaturan Tema Warna (PERBAIKAN)

// Konstanta untuk tema
const THEME_KEY = 'umkmcash_theme';
const AVAILABLE_THEMES = {
    'default': {
        name: 'Biru Default',
        colors: {
            '--primary': '#4a6bff',
            '--primary-light': '#6a8aff',
            '--primary-dark': '#3a5af9',
            '--secondary': '#6c757d',
            '--success': '#28a745',
            '--danger': '#dc3545',
            '--warning': '#ffc107',
            '--info': '#17a2b8',
            '--light': '#f8f9fa',
            '--dark': '#343a40',
            '--gray': '#6c757d',
            '--body-bg': '#f5f7ff',
            '--card-bg': '#ffffff',
            '--text-color': '#333333',
            '--border-color': '#dee2e6',
            '--modal-bg': '#ffffff',
            '--shadow-color': 'rgba(0, 0, 0, 0.1)'
        }
    },
    'green': {
        name: 'Hijau Segar',
        colors: {
            '--primary': '#10b981',
            '--primary-light': '#34d399',
            '--primary-dark': '#059669',
            '--secondary': '#6b7280',
            '--success': '#10b981',
            '--danger': '#ef4444',
            '--warning': '#f59e0b',
            '--info': '#0ea5e9',
            '--light': '#f9fafb',
            '--dark': '#111827',
            '--gray': '#6b7280',
            '--body-bg': '#f0fdf4',
            '--card-bg': '#ffffff',
            '--text-color': '#1f2937',
            '--border-color': '#d1d5db',
            '--modal-bg': '#ffffff',
            '--shadow-color': 'rgba(16, 185, 129, 0.1)'
        }
    },
    'purple': {
        name: 'Ungu Royal',
        colors: {
            '--primary': '#8b5cf6',
            '--primary-light': '#a78bfa',
            '--primary-dark': '#7c3aed',
            '--secondary': '#6b7280',
            '--success': '#10b981',
            '--danger': '#ef4444',
            '--warning': '#f59e0b',
            '--info': '#0ea5e9',
            '--light': '#faf5ff',
            '--dark': '#1e1b4b',
            '--gray': '#6b7280',
            '--body-bg': '#faf5ff',
            '--card-bg': '#ffffff',
            '--text-color': '#1e1b4b',
            '--border-color': '#ddd6fe',
            '--modal-bg': '#ffffff',
            '--shadow-color': 'rgba(139, 92, 246, 0.1)'
        }
    },
    'dark': {
        name: 'Gelap Elegan',
        colors: {
            '--primary': '#3b82f6',
            '--primary-light': '#60a5fa',
            '--primary-dark': '#2563eb',
            '--secondary': '#6b7280',
            '--success': '#10b981',
            '--danger': '#ef4444',
            '--warning': '#f59e0b',
            '--info': '#0ea5e9',
            '--light': '#374151',
            '--dark': '#111827',
            '--gray': '#6b7280',
            '--body-bg': '#111827',
            '--card-bg': '#1f2937',
            '--text-color': '#f9fafb',
            '--border-color': '#374151',
            '--modal-bg': '#1f2937',
            '--shadow-color': 'rgba(0, 0, 0, 0.3)'
        }
    },
    'red': {
        name: 'Merah Energik',
        colors: {
            '--primary': '#ef4444',
            '--primary-light': '#f87171',
            '--primary-dark': '#dc2626',
            '--secondary': '#6b7280',
            '--success': '#10b981',
            '--danger': '#ef4444',
            '--warning': '#f59e0b',
            '--info': '#0ea5e9',
            '--light': '#fef2f2',
            '--dark': '#7f1d1d',
            '--gray': '#6b7280',
            '--body-bg': '#fef2f2',
            '--card-bg': '#ffffff',
            '--text-color': '#1f2937',
            '--border-color': '#fecaca',
            '--modal-bg': '#ffffff',
            '--shadow-color': 'rgba(239, 68, 68, 0.1)'
        }
    },
    'orange': {
        name: 'Oranye Cerah',
        colors: {
            '--primary': '#f97316',
            '--primary-light': '#fb923c',
            '--primary-dark': '#ea580c',
            '--secondary': '#6b7280',
            '--success': '#10b981',
            '--danger': '#ef4444',
            '--warning': '#f59e0b',
            '--info': '#0ea5e9',
            '--light': '#fff7ed',
            '--dark': '#7c2d12',
            '--gray': '#6b7280',
            '--body-bg': '#fff7ed',
            '--card-bg': '#ffffff',
            '--text-color': '#1f2937',
            '--border-color': '#fed7aa',
            '--modal-bg': '#ffffff',
            '--shadow-color': 'rgba(249, 115, 22, 0.1)'
        }
    },
    'teal': {
        name: 'Teal Modern',
        colors: {
            '--primary': '#14b8a6',
            '--primary-light': '#2dd4bf',
            '--primary-dark': '#0d9488',
            '--secondary': '#6b7280',
            '--success': '#10b981',
            '--danger': '#ef4444',
            '--warning': '#f59e0b',
            '--info': '#0ea5e9',
            '--light': '#f0fdfa',
            '--dark': '#134e4a',
            '--gray': '#6b7280',
            '--body-bg': '#f0fdfa',
            '--card-bg': '#ffffff',
            '--text-color': '#1f2937',
            '--border-color': '#99f6e4',
            '--modal-bg': '#ffffff',
            '--shadow-color': 'rgba(20, 184, 166, 0.1)'
        }
    }
};

// Fungsi untuk mengaplikasikan tema
function applyTheme(themeName) {
    const theme = AVAILABLE_THEMES[themeName] || AVAILABLE_THEMES['default'];
    const root = document.documentElement;
    
    // Terapkan semua variabel warna
    Object.entries(theme.colors).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });
    
    // Simpan ke localStorage
    localStorage.setItem(THEME_KEY, themeName);
    
    // Update UI theme selector
    updateThemeSelector(themeName);
    
    // Tampilkan notifikasi
    showToast(`Tema "${theme.name}" diterapkan`, 'success');
}

// Fungsi untuk memuat tema yang disimpan
function loadSavedTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'default';
    applyTheme(savedTheme);
    return savedTheme;
}

// Fungsi untuk update tema selector di UI
function updateThemeSelector(selectedTheme) {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        const themeName = option.getAttribute('data-theme');
        if (themeName === selectedTheme) {
            option.classList.add('active');
            option.querySelector('.theme-check').style.display = 'block';
        } else {
            option.classList.remove('active');
            option.querySelector('.theme-check').style.display = 'none';
        }
    });
}

// Fungsi untuk membuka modal tema - PERBAIKAN: Ditambahkan parameter fallback
function openThemeModal() {
    // Coba muat tema yang disimpan
    const savedTheme = loadSavedTheme();
    
    // Buat modal tema jika belum ada
    if (!$('#themeModal').length) {
        createThemeModal();
    }
    
    // Update selector tema
    updateThemeSelector(savedTheme);
    
    // Tampilkan modal
    $('#themeModal').css('display', 'flex');
}

// Fungsi untuk membuat modal tema
function createThemeModal() {
    const themeModalHTML = `
        <div id="themeModal" class="modal">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 class="modal-title"><i class="fas fa-palette"></i> Pengaturan Tema Aplikasi</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="theme-options-container">
                        <p class="modal-subtitle">Pilih tema warna untuk antarmuka aplikasi:</p>
                        <div class="theme-options-grid" id="themeOptionsGrid">
                            <!-- Options akan diisi oleh JavaScript -->
                        </div>
                        <div class="theme-preview-section mt-3">
                            <h5>Pratinjau Warna:</h5>
                            <div class="theme-preview-colors">
                                <div class="color-preview" style="background-color: var(--primary);">
                                    <span>Primary</span>
                                </div>
                                <div class="color-preview" style="background-color: var(--success);">
                                    <span>Success</span>
                                </div>
                                <div class="color-preview" style="background-color: var(--danger);">
                                    <span>Danger</span>
                                </div>
                                <div class="color-preview" style="background-color: var(--warning);">
                                    <span>Warning</span>
                                </div>
                                <div class="color-preview" style="background-color: var(--info);">
                                    <span>Info</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-close-btn">Tutup</button>
                </div>
            </div>
        </div>
    `;
    
    // Tambahkan modal ke body
    $('body').append(themeModalHTML);
    
    // Buat tema selector
    createThemeSelector();
    
    // Event untuk memilih tema
    $(document).on('click', '.theme-option', function() {
        const themeKey = $(this).data('theme');
        applyTheme(themeKey);
    });
    
    // Event untuk menutup modal
    $('#themeModal .modal-close, #themeModal .modal-close-btn').click(function() {
        $('#themeModal').hide();
    });
}

// Fungsi untuk membuat tema selector di modal
function createThemeSelector() {
    const themeOptionsContainer = document.getElementById('themeOptionsGrid');
    if (!themeOptionsContainer) return;
    
    themeOptionsContainer.innerHTML = '';
    
    Object.entries(AVAILABLE_THEMES).forEach(([key, theme]) => {
        const themeOption = document.createElement('div');
        themeOption.className = 'theme-option';
        themeOption.setAttribute('data-theme', key);
        
        // Periksa apakah tema ini aktif
        const isActive = localStorage.getItem(THEME_KEY) === key;
        
        themeOption.innerHTML = `
            <div class="theme-preview" style="background: ${theme.colors['--primary']}"></div>
            <div class="theme-name">${theme.name}</div>
            <div class="theme-check" style="display: ${isActive ? 'block' : 'none'}">
                <i class="fas fa-check"></i>
            </div>
        `;
        
        themeOptionsContainer.appendChild(themeOption);
    });
}

// Fungsi untuk update preview warna tema
function updateThemePreview() {
    const root = getComputedStyle(document.documentElement);
    const colors = ['primary', 'success', 'danger', 'warning', 'info'];
    
    colors.forEach(color => {
        const value = root.getPropertyValue(`--${color}`).trim();
        $(`.color-preview[style*="${color}"]`).css('background-color', value);
    });
}

// Inisialisasi tema saat halaman dimuat
$(document).ready(function() {
    // Muat tema yang disimpan
    loadSavedTheme();
    
    // Update preview tema
    updateThemePreview();
    
    // Buat modal tema (jika belum ada)
    createThemeModal();
    
    // Event listener untuk tab tema di kontrol panel
    $(document).on('click', '[data-tab="theme"]', function() {
        const savedTheme = loadSavedTheme();
        updateThemeSelector(savedTheme);
    });
});

// Fungsi bantu untuk showToast (jika belum ada)
function showToast(message, type = 'success') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        // Fallback toast sederhana
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
            color: white;
            border-radius: 4px;
            z-index: 9999;
            font-family: 'Poppins', sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Ekspor fungsi untuk digunakan di main.js jika diperlukan
window.ThemeManager = {
    applyTheme,
    loadSavedTheme,
    openThemeModal,
    updateThemePreview,
    getAvailableThemes: () => AVAILABLE_THEMES
};
