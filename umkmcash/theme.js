// theme.js - Fitur Pengaturan Tema Warna

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

// Fungsi untuk membuka modal tema
function openThemeModal() {
    const savedTheme = loadSavedTheme();
    updateThemeSelector(savedTheme);
    $('#themeModal').css('display', 'flex');
}

// Fungsi untuk membuat tema selector di modal kontrol panel
function createThemeSelector() {
    const themeOptionsContainer = document.querySelector('.theme-options');
    if (!themeOptionsContainer) return;
    
    themeOptionsContainer.innerHTML = '';
    
    Object.entries(AVAILABLE_THEMES).forEach(([key, theme]) => {
        const themeOption = document.createElement('div');
        themeOption.className = 'theme-option';
        themeOption.setAttribute('data-theme', key);
        
        themeOption.innerHTML = `
            <div class="theme-preview" style="background: ${theme.colors['--primary']}"></div>
            <div class="theme-name">${theme.name}</div>
            <div class="theme-check" style="display: none;">
                <i class="fas fa-check"></i>
            </div>
        `;
        
        themeOption.addEventListener('click', () => {
            applyTheme(key);
        });
        
        themeOptionsContainer.appendChild(themeOption);
    });
}

// Inisialisasi tema saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Muat tema yang disimpan
    loadSavedTheme();
    
    // Buat tema selector
    createThemeSelector();
    
    // Event listener untuk tombol tema di admin panel
    $(document).on('click', '#themeSettingsBtn', function() {
        openThemeModal();
    });
    
    // Event listener untuk tab tema di kontrol panel
    $(document).on('click', '[data-tab="theme"]', function() {
        const savedTheme = loadSavedTheme();
        updateThemeSelector(savedTheme);
    });
});

// Ekspor fungsi untuk digunakan di main.js jika diperlukan
window.ThemeManager = {
    applyTheme,
    loadSavedTheme,
    openThemeModal,
    getAvailableThemes: () => AVAILABLE_THEMES
};
