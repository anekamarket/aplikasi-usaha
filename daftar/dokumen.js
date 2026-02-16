// dokumen.js
(function(global) {
    'use strict';

    function generateRandomID() {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = 'LKS/JK-';
        for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function formatFullDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    }

    function getHariTanggal(dateString) {
        if (!dateString) return 'Senin Tanggal 07 Bulan Juli Tahun 2025';
        const date = new Date(dateString);
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const dayName = days[date.getDay()];
        const day = date.getDate();
        const monthName = months[date.getMonth()];
        const year = date.getFullYear();
        return `${dayName} Tanggal ${day} Bulan ${monthName} Tahun ${year}`;
    }

    function generateNomorSurat(idPendaftaran) {
        if (!idPendaftaran) return '......../......../SP3LA-LKS/VII/2025';
        const date = new Date();
        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        const monthRoman = romanMonths[date.getMonth()];
        const idParts = idPendaftaran.split('-');
        const uniqueId = idParts.length > 1 ? idParts[1] : idPendaftaran.substr(-6);
        return `${uniqueId}/SP3LA-LKS/${monthRoman}/${date.getFullYear()}`;
    }

    function generateQRCodeToElement(element, data) {
        return new Promise((resolve, reject) => {
            if (!element) {
                reject('Elemen QR code tidak ditemukan');
                return;
            }
            element.innerHTML = '';
            if (!data) {
                resolve();
                return;
            }
            const canvas = document.createElement('canvas');
            QRCode.toCanvas(canvas, data, { width: 90, margin: 1, color: { dark: '#000000', light: '#ffffff' } }, function(error) {
                if (error) {
                    console.error('QR Code error:', error);
                    element.innerHTML = '<div style="text-align:center;padding:10px;color:#666;font-size:11px;">QR Code Error</div>';
                    reject(error);
                } else {
                    element.appendChild(canvas);
                    resolve();
                }
            });
        });
    }

    async function buatPerjanjian(data) {
        if (!data) {
            throw new Error('Data pendaftaran tidak ditemukan.');
        }

        const containerId = 'agreement-print-' + Date.now();
        const agreementContainer = document.createElement('div');
        agreementContainer.id = containerId;
        agreementContainer.style.position = 'absolute';
        agreementContainer.style.left = '0';
        agreementContainer.style.top = '0';
        agreementContainer.style.width = '210mm';
        agreementContainer.style.backgroundColor = 'white';
        agreementContainer.style.padding = '20px';
        agreementContainer.style.fontFamily = 'Times New Roman, serif';
        agreementContainer.style.lineHeight = '1.5';
        agreementContainer.style.zIndex = '-1000';
        agreementContainer.style.opacity = '0';
        agreementContainer.style.pointerEvents = 'none';
        agreementContainer.style.overflow = 'visible';
        document.body.appendChild(agreementContainer);

        try {
            const idPendaftaran = generateRandomID();
            const fullIdPermohonan = data.id_permohonan;
            const formattedDate = formatDate(data.tanggal_pendaftaran);
            const fullDate = formatFullDate(data.tanggal_pendaftaran);
            const hariTanggal = getHariTanggal(data.tanggal_pendaftaran);
            const nomorSurat = generateNomorSurat(idPendaftaran);

            let kategoriDisplay = data.kategori_usaha;
            if (data.kategori_usaha === 'Lainnya' && data.keterangan_lainnya) {
                kategoriDisplay = `Lainnya (Keterangan: ${data.keterangan_lainnya})`;
            }

            const suratHtml = `
                <div style="color: #000000; font-size: 12pt;">
                    <h2 style="text-align:center; font-size:18pt; margin-bottom:10px;">SURAT PERJANJIAN KERJASAMA<br>MITRA ANEKAMARKET</h2>
                    <p style="text-align:center; margin-bottom:20px;">Nomor: <span style="font-weight:bold;">${nomorSurat}</span></p>
                    
                    <p>Pada hari ini, <span style="font-weight:bold;">${hariTanggal}</span>, yang bertanda tangan di bawah ini:</p>
                    
                    <table style="width:100%; border-collapse:collapse; margin:20px 0; font-size:12pt;">
                        <tr><td style="width:200px;">Nama</td><td>: <span style="font-weight:bold;">${data.nama.toUpperCase()}</span></td></tr>
                        <tr><td>NIK</td><td>: <span style="font-weight:bold;">${data.nik}</span></td></tr>
                        <tr><td>Alamat</td><td>: <span style="font-weight:bold;">${data.alamat}</span></td></tr>
                        <tr><td>No. Telepon</td><td>: <span style="font-weight:bold;">${data.whatsapp}</span></td></tr>
                        <tr><td>ID Permohonan</td><td>: <span style="font-weight:bold;">${fullIdPermohonan}</span></td></tr>
                    </table>
                    
                    <p>Selanjutnya disebut <strong>PIHAK KEDUA</strong>.</p>
                    
                    <p>Nama Perusahaan : <strong>LENTERA KARYA SINERGI</strong></p>
                    <p>Alamat : Jl. Raya Situbondo No. 123, Situbondo</p>
                    <p>Diwakili oleh : <strong>MUHAMMAD SALAM</strong>, selaku Founder, yang bertindak untuk dan atas nama perusahaan, selanjutnya disebut <strong>PIHAK PERTAMA</strong>.</p>
                    
                    <p>PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama disebut PARA PIHAK. Dengan ini menyatakan telah sepakat untuk mengadakan Perjanjian Kerjasama dengan ketentuan sebagai berikut:</p>
                    
                    <h3 style="font-size:14pt; margin-top:25px;">Pasal 1<br>MAKSUD DAN TUJUAN</h3>
                    <p>PIHAK KEDUA terdaftar sebagai mitra ANEKAMARKET (Kelompok Usaha Bersama ANEKAMARKET) dengan data sebagai berikut:</p>
                    <table style="width:100%; border-collapse:collapse; margin:20px 0; font-size:12pt;">
                        <tr><td style="width:200px;">Nama Usaha</td><td>: <span style="font-weight:bold;">${data.nama_usaha.toUpperCase()}</span></td></tr>
                        <tr><td>Kategori Layanan</td><td>: <span style="font-weight:bold;">${kategoriDisplay}</span></td></tr>
                        <tr><td>Tanggal Pendaftaran</td><td>: <span style="font-weight:bold;">${fullDate}</span></td></tr>
                        <tr><td>ID Pendaftaran</td><td>: <span style="font-weight:bold;">${idPendaftaran}</span></td></tr>
                    </table>
                    
                    <p>Bahwa dengan ditandatanganinya perjanjian ini, PIHAK KEDUA terdaftar secara resmi sebagai mitra ANEKAMARKET dan akan mendapatkan hak serta menjalankan kewajiban sesuai dengan ketentuan yang berlaku.</p>
                    
                    <h3 style="font-size:14pt; margin-top:25px;">Pasal 2<br>JANGKA WAKTU</h3>
                    <p>Perjanjian ini berlaku sejak tanggal ditandatangani dan akan dievaluasi setiap 1 (satu) tahun sekali.</p>
                    
                    <h3 style="font-size:14pt; margin-top:25px;">Pasal 3<br>PENUTUP</h3>
                    <p>Demikian perjanjian ini dibuat dengan sebenarnya dan ditandatangani oleh PARA PIHAK dalam rangkap 2 (dua) bermeterai cukup serta mempunyai kekuatan hukum yang sama.</p>
                    
                    <div style="margin-top:50px; display:flex; justify-content:space-between;">
                        <div style="text-align:center; width:45%;">
                            <p>PIHAK PERTAMA,<br>LENTERA KARYA SINERGI</p>
                            <div id="qr_pihak_pertama_${containerId}" style="width:90px; height:90px; margin:15px auto;"></div>
                            <p><strong>MUHAMMAD SALAM</strong><br>Founder</p>
                        </div>
                        <div style="text-align:center; width:45%;">
                            <p>PIHAK KEDUA,<br>${data.nama.toUpperCase()}</p>
                            <div id="qr_pihak_kedua_${containerId}" style="width:90px; height:90px; margin:15px auto;"></div>
                            <p>Pemohon</p>
                        </div>
                    </div>
                </div>
            `;

            agreementContainer.innerHTML = suratHtml;

            const qrPertama = document.getElementById(`qr_pihak_pertama_${containerId}`);
            const qrKedua = document.getElementById(`qr_pihak_kedua_${containerId}`);

            const qrDataPihakKedua = `PEMOHON:${data.nama.toUpperCase()}|NIK:${data.nik}|ID:${fullIdPermohonan}|TGL:${formattedDate}`;
            const qrDataPihakPertama = `PERUSAHAAN:LENTERA KARYA|PENANDATANGAN:MUHAMMAD SALAM|JABATAN:FOUNDER|TGL:07/07/2025`;

            await Promise.all([
                generateQRCodeToElement(qrPertama, qrDataPihakPertama),
                generateQRCodeToElement(qrKedua, qrDataPihakKedua)
            ]);

            await new Promise(resolve => setTimeout(resolve, 300));

            const opt = {
                margin: [15, 15, 15, 15],
                filename: `Surat_Perjanjian_${data.nama.replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(agreementContainer).save();

        } finally {
            if (agreementContainer.parentNode) {
                document.body.removeChild(agreementContainer);
            }
        }
    }

    global.Dokumen = {
        buatPerjanjian: buatPerjanjian
    };

})(window);
