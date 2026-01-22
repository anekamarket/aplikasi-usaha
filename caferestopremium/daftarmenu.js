// daftarmenu.js
// Script untuk mencetak daftar menu dalam format PDF

const MENU_DATA = {
    categories: [
        { id: 'C001', name: 'Makanan' },
        { id: 'C002', name: 'Minuman' },
        { id: 'C003', name: 'Snack' }
    ],
    menus: [
        { 
            id: 'M001', 
            name: 'Nasi Goreng', 
            category: 'Makanan', 
            price: 15000, 
            available: true,
            description: 'Nasi goreng spesial dengan telur dan ayam'
        },
        { 
            id: 'M002', 
            name: 'Mie Goreng', 
            category: 'Makanan', 
            price: 12000, 
            available: true,
            description: 'Mie goreng dengan sayuran dan telur'
        },
        { 
            id: 'M003', 
            name: 'Ayam Goreng', 
            category: 'Makanan', 
            price: 18000, 
            available: true,
            description: 'Ayam goreng krispi dengan sambal'
        },
        { 
            id: 'M004', 
            name: 'Es Teh', 
            category: 'Minuman', 
            price: 5000, 
            available: true,
            description: 'Es teh manis segar'
        },
        { 
            id: 'M005', 
            name: 'Es Jeruk', 
            category: 'Minuman', 
            price: 7000, 
            available: true,
            description: 'Es jeruk asli'
        },
        { 
            id: 'M006', 
            name: 'Kentang Goreng', 
            category: 'Snack', 
            price: 10000, 
            available: true,
            description: 'Kentang goreng renyah'
        },
        { 
            id: 'M007', 
            name: 'Singkong Keju', 
            category: 'Snack', 
            price: 12000, 
            available: true,
            description: 'Singkong goreng dengan keju'
        }
    ]
};

class DaftarMenuPDF {
    constructor() {
        this.storeInfo = {
            name: 'CAFE & RESTO PREMIUM',
            address: 'Jl. Contoh No. 123, Kota',
            phone: '081234567890',
            email: 'info@cafe-resto.com'
        };
    }

    // Generate HTML untuk daftar menu
    generateMenuListHTML() {
        let html = `
            <div class="menu-list-pdf-container">
                <div class="menu-list-header">
                    <h1>${this.storeInfo.name}</h1>
                    <p>${this.storeInfo.address}</p>
                    <p>Telp: ${this.storeInfo.phone} | Email: ${this.storeInfo.email}</p>
                    <h2>DAFTAR MENU</h2>
                    <p>Tanggal: ${new Date().toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</p>
                </div>`;
        
        // Kelompokkan menu berdasarkan kategori
        const menusByCategory = {};
        MENU_DATA.categories.forEach(category => {
            menusByCategory[category.name] = MENU_DATA.menus.filter(menu => menu.category === category.name);
        });
        
        // Buat tabel untuk setiap kategori
        for (const [categoryName, menus] of Object.entries(menusByCategory)) {
            if (menus.length === 0) continue;
            
            html += `
                <div class="menu-category-section">
                    <h2 class="menu-category-title">${categoryName}</h2>
                    <table class="menu-list-table">
                        <thead>
                            <tr>
                                <th width="40">No</th>
                                <th>Nama Menu</th>
                                <th width="100">Harga</th>
                                <th width="100">Status</th>
                                <th width="200">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            menus.forEach((menu, index) => {
                const status = menu.available ? 
                    '<span class="menu-available">Tersedia</span>' : 
                    '<span class="menu-unavailable">Tidak Tersedia</span>';
                
                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td><strong>${menu.name}</strong></td>
                        <td>Rp ${menu.price.toLocaleString('id-ID')}</td>
                        <td>${status}</td>
                        <td>${menu.description || '-'}</td>
                    </tr>`;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>`;
        }
        
        // Tambahkan QR Code untuk pemesanan online
        html += `
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #28a745;">
                <div style="margin-bottom: 15px;">
                    <h3>Scan untuk Pemesanan Online</h3>
                </div>
                <div id="qrcode-container" style="display: inline-block; padding: 15px; background: white; border-radius: 10px; border: 1px solid #ddd;"></div>
                <div style="margin-top: 15px;">
                    <p><strong>www.aplikasiusaha.com/orderku</strong></p>
                    <p>Atau kunjungi: order-form.html untuk form pemesanan</p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
                <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
                <p>CAFE & RESTO PREMIUM © ${new Date().getFullYear()}</p>
            </div>
        </div>`;
        
        return html;
    }

    // Generate QR Code
    generateQRCode(containerId) {
        const qrCodeData = "www.aplikasiusaha.com/orderku";
        const qrcode = new QRCode(containerId, {
            text: qrCodeData,
            width: 150,
            height: 150,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }

    // Download PDF
    async downloadPDF() {
        try {
            // Buat container sementara
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.innerHTML = this.generateMenuListHTML();
            document.body.appendChild(tempContainer);
            
            // Generate QR Code
            this.generateQRCode(tempContainer.querySelector('#qrcode-container'));
            
            // Tunggu QR Code selesai dibuat
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Gunakan html2canvas untuk konversi ke canvas
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            // Hapus container sementara
            document.body.removeChild(tempContainer);
            
            // Buat PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Daftar_Menu_${this.storeInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
            
            return true;
        } catch (error) {
            console.error('Error generating PDF:', error);
            return false;
        }
    }

    // Print langsung
    async print() {
        try {
            // Buat window baru untuk print
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Daftar Menu - Cafe & Resto</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                        .category { margin-bottom: 25px; page-break-inside: avoid; }
                        .category h2 { color: #28a745; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                        th { background-color: #f8f9fa; padding: 10px; text-align: left; border: 1px solid #ddd; }
                        td { padding: 10px; border: 1px solid #ddd; }
                        .available { color: #28a745; font-weight: bold; }
                        .unavailable { color: #dc3545; font-weight: bold; }
                        .qrcode-container { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #000; }
                        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                        @media print {
                            .no-print { display: none; }
                            @page { margin: 10mm; }
                        }
                    </style>
                </head>
                <body>
                    ${this.generateMenuListHTML()}
                    <div class="footer">
                        <p>CAFE & RESTO PREMIUM © ${new Date().getFullYear()}</p>
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(() => window.close(), 1000);
                        }
                    </script>
                </body>
                </html>
            `);
            printWindow.document.close();
        } catch (error) {
            console.error('Error printing:', error);
        }
    }
}

// Fungsi untuk mengintegrasikan dengan aplikasi utama
function initializeDaftarMenuIntegration() {
    // Cek jika ada tombol cetak daftar menu di aplikasi utama
    const printMenuBtn = document.getElementById('printMenuListBtn');
    if (printMenuBtn) {
        printMenuBtn.addEventListener('click', () => {
            const daftarMenuPDF = new DaftarMenuPDF();
            daftarMenuPDF.downloadPDF().then(success => {
                if (success) {
                    alert('PDF daftar menu berhasil didownload!');
                } else {
                    alert('Gagal membuat PDF daftar menu. Silakan coba lagi.');
                }
            });
        });
    }
}

// Ekspor fungsi untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DaftarMenuPDF,
        initializeDaftarMenuIntegration,
        MENU_DATA
    };
}

// Inisialisasi jika dijalankan langsung
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Cek jika di halaman daftar menu khusus
        if (document.getElementById('daftarMenuPage')) {
            const daftarMenuPDF = new DaftarMenuPDF();
            
            // Setup tombol download
            const downloadBtn = document.getElementById('downloadMenuListBtn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    daftarMenuPDF.downloadPDF();
                });
            }
            
            // Setup tombol print
            const printBtn = document.getElementById('printMenuListBtn');
            if (printBtn) {
                printBtn.addEventListener('click', () => {
                    daftarMenuPDF.print();
                });
            }
            
            // Tampilkan preview
            const previewContainer = document.getElementById('menuListPreview');
            if (previewContainer) {
                previewContainer.innerHTML = daftarMenuPDF.generateMenuListHTML();
                daftarMenuPDF.generateQRCode(previewContainer.querySelector('#qrcode-container'));
            }
        }
        
        // Integrasi dengan aplikasi utama
        initializeDaftarMenuIntegration();
    });
}
