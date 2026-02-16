// main.js
document.addEventListener('DOMContentLoaded', function() {
    const apiKeyImgBB = '0e598ab24278f062969e6d0ec810d518';
    const nomorWhatsAppTujuan = '6285647709114';
    
    const formContainer = document.getElementById('form-container');
    const successSound = document.getElementById('success-sound');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

    let form, submitBtn, kategoriSelect, lainnyaGroup, keteranganLainnya, ktpInput, fileNameLabel, mapsInput, registerLaterBtn, getLocationBtn, locationStatus, agreeCheckbox, uploadKtpBtn, ktpStatus;
    let uploadedKtpUrl = null;
    let submittedData = null;
    let finalWhatsAppMessage = '';

    function unlockAudio() {
        successSound.play().then(() => {
            successSound.pause();
            successSound.currentTime = 0;
        }).catch(e => console.warn('Audio unlock error:', e));
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
    }
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });

    renderForm();

    function renderForm() {
        formContainer.innerHTML = `
            <form id="registrationForm">
                <div class="form-section">
                    <h3>1. Data Pribadi</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="nama" class="required">Nama (sesuai KTP)</label>
                            <div class="input-group">
                                <span class="input-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/></svg></span>
                                <input type="text" id="nama" name="nama" placeholder="Masukkan nama lengkap" required>
                            </div>
                            <div class="error-message" id="nama-error"></div>
                        </div>
                        <div class="form-group">
                            <label for="nik" class="required">NIK (Nomor KTP)</label>
                             <div class="input-group">
                                <span class="input-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-vcard" viewBox="0 0 16 16"><path d="M5 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm4-2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5ZM9 8a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4A.5.5 0 0 1 9 8Zm1 2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5Z"/><path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2ZM1 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Z"/></svg></span>
                                <input type="text" id="nik" name="nik" placeholder="Masukkan 16 digit NIK" required maxlength="16">
                            </div>
                            <div class="error-message" id="nik-error"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="alamat" class="required">Alamat (sesuai KTP)</label>
                        <textarea id="alamat" name="alamat" rows="2" placeholder="Masukkan alamat lengkap" required></textarea>
                        <div class="error-message" id="alamat-error"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="whatsapp" class="required">Nomor WhatsApp</label>
                            <div class="input-group">
                                <span class="input-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-whatsapp" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.626-2.957 6.584-6.591 6.584zM10.118 8.584c-.197-.1-.8-.396-1.02-.459-.22-.063-.38-.099-.54.099-.16.198-.5.63-.61.751-.12.122-.23.138-.43.038-.2-.099-.84-.31-1.59-1.02-.58-.55-1.01-1.23-1.13-1.43-.12-.2-.02-.3.07-.401.08-.09.19-.23.29-.33.1-.1.13-.17.2-.28.07-.1.03-.18-.02-.28-.05-.1-.54-1.28-.73-1.75-.19-.47-.38-.4-.54-.4-.16-.007-.34-.007-.5-.007-.16 0-.43.063-.66.33-.22.27-.85.83-.85 2.02 0 1.18.87 2.34 1 2.49.12.15 1.7 2.58 4.13 3.63.58.25 1.03.4 1.38.52.36.12.68.1.92.06.27-.05.8-.33.91-.65.12-.32.12-.58.08-.65-.05-.07-.17-.12-.37-.22z"/></svg></span>
                                <input type="tel" id="whatsapp" name="whatsapp" placeholder="Contoh: 081234567890" required>
                            </div>
                            <div class="error-message" id="whatsapp-error"></div>
                        </div>
                        <div class="form-group">
                            <label for="email">Email (Opsional)</label>
                            <div class="input-group">
                                <span class="input-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope" viewBox="0 0 16 16"><path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/></svg></span>
                                <input type="email" id="email" name="email" placeholder="contoh@gmail.com">
                            </div>
                            <div class="error-message" id="email-error"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="foto_ktp" class="required">Foto/Scan KTP</label>
                        <div class="file-input-wrapper">
                            <span class="file-input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-arrow-up" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M7.646 5.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2z"/><path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383zm.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.225 10.328 2.5 8 2.5c-2.414 0-4.382 1.848-4.406 4.101z"/></svg>
                            </span>
                            <span class="file-input-label">Klik untuk memilih gambar KTP</span>
                            <span id="file-name-label">Belum ada file dipilih</span>
                            <input type="file" id="foto_ktp" name="foto_ktp" accept="image/*" required>
                            <span id="file-name"></span>
                        </div>
                        <div class="error-message" id="foto_ktp-error"></div>
                        <div class="status-message" id="foto_ktp-status" style="color: var(--success-color); margin-top: 10px; text-align: center;"></div>
                        
                        <button type="button" class="btn btn-warning" id="uploadKtpBtn" style="display: none; gap: 8px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-cloud-upload-fill" viewBox="0 0 16 16">
                                <path fill-rule="evenodd" d="M8 0a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 4.006 0 5.57 0 7.318 0 9.366 1.708 11 3.781 11H7.5V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11h4.188C14.502 11 16 9.569 16 7.773c0-1.636-1.242-2.969-2.834-3.194C12.923 1.99 10.69 0 8 0zm-.5 14.5a.5.5 0 0 1 1 0V11h-1v3.5z"/>
                            </svg>
                            Unggah KTP Sekarang (Wajib)
                        </button>
                    </div>
                </div>

                <div class="form-section">
                    <h3>2. Data Usaha</h3>
                    <div class="form-group">
                        <label for="nama_usaha" class="required">Nama Usaha / Brand</label>
                        <div class="input-group">
                             <span class="input-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-shop-window" viewBox="0 0 16 16"><path d="M2.97 1.35A1 1 0 0 1 3.73 1h8.54a1 1 0 0 1 .76.35l2.609 3.044A1.5 1.5 0 0 1 16 5.37v.255a2.375 2.375 0 0 1-4.25 1.458A2.371 2.371 0 0 1 9.875 8 2.37 2.37 0 0 1 8 7.083 2.37 2.37 0 0 1 6.125 8a2.37 2.37 0 0 1-1.875-.917A2.375 2.375 0 0 1 0 5.625V5.37a1.5 1.5 0 0 1 .361-.976l2.61-3.045zm1.78 4.275a1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 0 0 2.75 0 .5.5 0 0 1 1 0 1.375 1.375 0 1 0 2.75 0H15.5v2h.5a.5.5 0 0 1 0 1h-.5v.5a.5.5 0 0 1-1 0V11h-1.5v.5a.5.5 0 0 1-1 0V11H11v.5a.5.5 0 0 1-1 0V11H8.5v.5a.5.5 0 0 1-1 0V11H6v.5a.5.5 0 0 1-1 0V11H3.5v.5a.5.5 0 0 1-1 0V11H1v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0-1H2v-2h.5a.5.5 0 0 1 0 1H.5v-2H1a.5.5 0 0 1 0-1h.5V7h1V6.645zM8.5 5.03l-1-1.11L6.36 5.03h2.14zM5 5.03l-1-1.11L2.86 5.03H5zm6 0l-1-1.11L9.86 5.03h2.14z"/></svg></span>
                            <input type="text" id="nama_usaha" name="nama_usaha" placeholder="Contoh: Cafe Chacha" required>
                        </div>
                        <div class="error-message" id="nama_usaha-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="alamat_usaha" class="required">Alamat Usaha</label>
                        <textarea id="alamat_usaha" name="alamat_usaha" rows="2" placeholder="Masukkan alamat lengkap usaha" required></textarea>
                        <div class="error-message" id="alamat_usaha-error"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="lokasi_maps" class="required">URL Titik Lokasi Google Maps</label>
                        <div class="location-warning" id="location-warning">
                            <strong>Penting:</strong> Untuk akurasi, dapatkan titik lokasi saat Anda berada di tempat usaha.
                        </div>
                        <div class="input-group">
                            <span class="input-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt" viewBox="0 0 16 16"><path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/><path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg></span>
                            <input type="url" id="lokasi_maps" name="lokasi_maps" placeholder="Contoh: https://www.google.com/maps?q=..." required>
                        </div>
                        <div class="location-button-group">
                            <button type="button" class="btn btn-location" id="getLocationBtn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
                                Gunakan Lokasi Saat Ini
                            </button>
                            <button type="button" class="btn btn-secondary" id="registerLaterBtn">Daftarkan Lokasi Nanti</button>
                        </div>
                        <div class="status-message" id="location-status"></div>
                        <div class="error-message" id="lokasi_maps-error"></div>
                    </div>

                    <div class="form-group">
                        <label for="kategori_usaha" class="required">Kategori Usaha</label>
                        <select id="kategori_usaha" name="kategori_usaha" required>
                            <option value="">Pilih Kategori Usaha</option>
                            <option value="UMKM">UMKM</option><option value="Jasa Service">Jasa Service</option><option value="Kuliner">Kuliner</option><option value="Warung atau Resto">Warung atau Resto</option><option value="Cafe">Cafe</option><option value="Retail">Retail</option><option value="Pertanian">Pertanian</option><option value="Perikanan">Perikanan</option><option value="Kerajinan">Kerajinan</option><option value="Jasa Transportasi">Jasa Transportasi</option><option value="Wisata">Wisata</option><option value="Hotel">Hotel</option><option value="Lainnya">Lainnya</option>
                        </select>
                        <div class="error-message" id="kategori_usaha-error"></div>
                    </div>
                    <div class="form-group" id="lainnya_keterangan_group" style="display: none;">
                        <label for="keterangan_lainnya" class="required">Keterangan Kategori Lainnya</label>
                        <textarea id="keterangan_lainnya" name="keterangan_lainnya" rows="2" placeholder="Jelaskan kategori usaha Anda"></textarea>
                        <div class="error-message" id="keterangan_lainnya-error"></div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3>3. Konfirmasi</h3>
                    <div class="form-row">
                        <div class="form-group"><label for="id_permohonan">ID Permohonan</label><input type="text" id="id_permohonan" name="id_permohonan" readonly></div>
                        <div class="form-group"><label for="tanggal_pendaftaran">Tanggal Pendaftaran</label><input type="text" id="tanggal_pendaftaran" name="tanggal_pendaftaran" readonly></div>
                    </div>
                    <label class="checkbox-group">
                        <input type="checkbox" id="agree" name="agree"> <span class="checkbox-custom"></span>
                        <span class="checkbox-label">Saya menyatakan data yang diisi adalah benar dan menyetujuinya</span>
                    </label>
                </div>
                
                <button type="submit" class="btn btn-primary" id="submitBtn" disabled>
                    Kirim Pendaftaran
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-send-fill" viewBox="0 0 16 16">
                      <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z"/>
                    </svg>
                </button>
            </form>
        `;

        form = document.getElementById('registrationForm');
        submitBtn = document.getElementById('submitBtn');
        kategoriSelect = document.getElementById('kategori_usaha');
        lainnyaGroup = document.getElementById('lainnya_keterangan_group');
        keteranganLainnya = document.getElementById('keterangan_lainnya');
        ktpInput = document.getElementById('foto_ktp');
        fileNameLabel = document.getElementById('file-name-label');
        mapsInput = document.getElementById('lokasi_maps');
        registerLaterBtn = document.getElementById('registerLaterBtn');
        getLocationBtn = document.getElementById('getLocationBtn');
        locationStatus = document.getElementById('location-status');
        agreeCheckbox = document.getElementById('agree');
        uploadKtpBtn = document.getElementById('uploadKtpBtn');
        ktpStatus = document.getElementById('foto_ktp-status');

        document.getElementById('id_permohonan').value = generateIdPermohonan();
        document.getElementById('tanggal_pendaftaran').value = setTanggalPendaftaran();

        kategoriSelect.addEventListener('change', function() {
            lainnyaGroup.style.display = this.value === 'Lainnya' ? 'block' : 'none';
            if (this.value === 'Lainnya') {
                keteranganLainnya.setAttribute('required', 'required');
            } else {
                keteranganLainnya.removeAttribute('required');
                keteranganLainnya.value = '';
                hideError(keteranganLainnya);
            }
            updateSubmitButtonState();
        });

        ktpInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                const file = this.files[0];
                if (!file.type.startsWith('image/')) {
                    showError(ktpInput, 'File harus berupa gambar (jpg, png, dll).');
                    this.value = '';
                    fileNameLabel.textContent = 'Belum ada file dipilih';
                    uploadKtpBtn.style.display = 'none';
                    return;
                }
                fileNameLabel.textContent = file.name;
                uploadKtpBtn.style.display = 'inline-flex';
                ktpStatus.style.display = 'none';
                ktpStatus.textContent = '';
            } else {
                fileNameLabel.textContent = 'Belum ada file dipilih';
                uploadKtpBtn.style.display = 'none';
                ktpStatus.style.display = 'none';
            }
            uploadedKtpUrl = null;
            agreeCheckbox.checked = false;
            hideError(ktpInput);
            updateSubmitButtonState();
        });

        uploadKtpBtn.addEventListener('click', async function() {
            const ktpFile = ktpInput.files[0];
            if (!ktpFile) {
                showError(ktpInput, 'Mohon pilih file KTP terlebih dahulu.');
                return;
            }
            
            uploadKtpBtn.disabled = true;
            uploadKtpBtn.style.animation = 'none';
            loadingText.textContent = 'Mengunggah KTP... Mohon tunggu...';
            loadingOverlay.classList.add('visible');
            uploadedKtpUrl = null;
            ktpStatus.style.display = 'none';
            hideError(ktpInput);

            try {
                uploadedKtpUrl = await uploadFileToImgBB(ktpFile);
                loadingOverlay.classList.remove('visible');
                ktpStatus.textContent = 'KTP berhasil diunggah!';
                ktpStatus.style.color = 'var(--success-color)';
                ktpStatus.style.display = 'block';
                uploadKtpBtn.style.display = 'none';
                uploadKtpBtn.disabled = false;
            } catch (error) {
                console.error('Proses upload KTP gagal:', error);
                loadingOverlay.classList.remove('visible');
                showError(ktpInput, 'Gagal mengunggah KTP: ' + error.message);
                uploadedKtpUrl = null;
                uploadKtpBtn.disabled = false;
                uploadKtpBtn.style.animation = 'fadeInDown 0.5s ease-out, pulse 2s infinite 0.5s';
            }
            updateSubmitButtonState();
        });

        registerLaterBtn.addEventListener('click', function() {
            mapsInput.removeAttribute('required');
            mapsInput.value = 'Akan diisi nanti';
            document.getElementById('location-warning').style.display = 'none';
            hideError(mapsInput);
            updateSubmitButtonState();
        });

        getLocationBtn.addEventListener('click', function() {
            if (!navigator.geolocation) {
                locationStatus.textContent = 'Geolocation tidak didukung oleh browser Anda.';
                locationStatus.style.display = 'block';
                locationStatus.style.color = 'var(--error-color)';
                return;
            }

            locationStatus.textContent = 'Mendeteksi lokasi Anda...';
            locationStatus.style.display = 'block';
            locationStatus.style.color = 'var(--dark-color)';
            hideError(mapsInput);
            mapsInput.value = '';

            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
                    mapsInput.value = mapsUrl;
                    mapsInput.setAttribute('required', 'required');
                    locationStatus.textContent = 'Lokasi berhasil dideteksi!';
                    locationStatus.style.color = 'var(--success-color)';
                    updateSubmitButtonState();
                },
                function(error) {
                    let errorMessage;
                    switch(error.code) {
                        case error.PERMISSION_DENIED: errorMessage = "Akses lokasi ditolak. Izinkan akses di pengaturan browser."; break;
                        case error.POSITION_UNAVAILABLE: errorMessage = "Informasi lokasi tidak tersedia."; break;
                        case error.TIMEOUT: errorMessage = "Waktu permintaan lokasi habis."; break;
                        default: errorMessage = "Terjadi kesalahan saat mengambil lokasi."; break;
                    }
                    locationStatus.textContent = errorMessage;
                    locationStatus.style.display = 'block';
                    locationStatus.style.color = 'var(--error-color)';
                    updateSubmitButtonState();
                }
            );
        });

        form.addEventListener('input', updateSubmitButtonState);

        agreeCheckbox.addEventListener('change', function(e) {
            if (e.target.checked) {
                const fieldsValid = validateForm();
                if (!fieldsValid) {
                    alert('Mohon lengkapi semua data yang wajib diisi (termasuk KTP) sebelum menyetujui.');
                    e.target.checked = false;
                    updateSubmitButtonState();
                    return;
                }
                if (uploadedKtpUrl === null) {
                    alert('Mohon unggah file KTP Anda terlebih dahulu menggunakan tombol "Unggah KTP Sekarang (Wajib)".');
                    showError(ktpInput, 'Anda belum mengunggah KTP.');
                    e.target.checked = false;
                    updateSubmitButtonState();
                    return;
                }
            }
            updateSubmitButtonState();
        });

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (submitBtn.disabled) return;
            
            submitBtn.disabled = true;
            loadingText.textContent = 'Menyiapkan Data...';
            loadingOverlay.classList.add('visible');

            try {
                submittedData = {
                    nama: document.getElementById('nama').value,
                    nik: document.getElementById('nik').value,
                    alamat: document.getElementById('alamat').value,
                    whatsapp: document.getElementById('whatsapp').value,
                    email: document.getElementById('email').value || 'Tidak diisi',
                    nama_usaha: document.getElementById('nama_usaha').value,
                    alamat_usaha: document.getElementById('alamat_usaha').value,
                    lokasi_maps: document.getElementById('lokasi_maps').value,
                    kategori_usaha: document.getElementById('kategori_usaha').value,
                    keterangan_lainnya: document.getElementById('keterangan_lainnya')?.value || '',
                    id_permohonan: document.getElementById('id_permohonan').value,
                    tanggal_pendaftaran: document.getElementById('tanggal_pendaftaran').value,
                    foto_ktp_url: uploadedKtpUrl
                };

                const params = getTemplateParams(uploadedKtpUrl);
                finalWhatsAppMessage = `*PENDAFTARAN MITRA ANEKAMARKET*\n\n*Data Pribadi:*\n• Nama: ${params.nama}\n• NIK: ${params.nik}\n• Alamat: ${params.alamat}\n• WhatsApp: ${params.whatsapp}\n• Email: ${params.email}\n• Link Foto KTP: ${uploadedKtpUrl}\n\n*Data Usaha:*\n• Nama Usaha: ${params.nama_usaha}\n• Alamat Usaha: ${params.alamat_usaha}\n• Kategori Usaha: ${params.kategori_usaha}\n• Lokasi Maps: ${params.lokasi_maps}\n\n*Data Sistem:*\n• ID Permohonan: ${params.id_permohonan}\n• Tanggal Pendaftaran: ${params.tanggal_pendaftaran}\n\n_Saya menyatakan bahwa semua data di atas adalah benar dan dapat dipertanggungjawabkan._`;
                
                loadingOverlay.classList.remove('visible');
                showSuccessScreen();

            } catch (error) {
                console.error('Proses submit gagal:', error);
                loadingOverlay.classList.remove('visible');
                alert('Gagal menyiapkan data. Mohon coba lagi. Pesan Error: ' + error.message);
                submitBtn.disabled = false;
            }
        });

        updateSubmitButtonState();
    }

    function generateIdPermohonan() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'AM-';
        for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        return result;
    }
    
    function setTanggalPendaftaran() {
        const now = new Date();
        const options = { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return now.toLocaleString('id-ID', options).replace(/\./g, ':');
    }

    function validateForm() {
        let allValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            let isValid = true;
            let errorMessage = '';

            switch(field.type) {
                case 'file':
                    if (ktpInput.files.length === 0) { isValid = false; errorMessage = 'Anda harus memilih file KTP.'; }
                    break;
                case 'url':
                    if (field.value.trim() === '') { isValid = false; errorMessage = 'Field ini wajib diisi.'; }
                    else if (field.value !== 'Akan diisi nanti' && !field.value.includes('google.com/maps') && !field.value.includes('maps.app.goo.gl') && !field.value.includes('goo.gl/maps')) {
                        isValid = false; errorMessage = 'URL Google Maps tidak valid. Coba gunakan tombol lokasi.';
                    }
                    break;
                case 'select-one':
                    if (field.value === '') { isValid = false; errorMessage = 'Anda harus memilih salah satu kategori.'; }
                    break;
                default:
                    if (field.value.trim() === '') { isValid = false; errorMessage = 'Field ini wajib diisi.'; }
                    break;
            }
            
            if (field.id === 'nik' && field.value.trim() !== '' && !/^\d{16}$/.test(field.value)) {
                isValid = false; errorMessage = 'NIK harus terdiri dari 16 digit angka.';
            } else if (field.id === 'whatsapp' && field.value.trim() !== '' && !/^08[0-9]{8,13}$/.test(field.value)) {
               isValid = false; errorMessage = 'Format No. WhatsApp salah. Contoh: 081234567890.';
            }

            if(isValid) hideError(field);
            else {
                if(field.type !== 'file' || ktpInput.files.length === 0) showError(field, errorMessage);
                allValid = false;
            }
        });
        
        const emailField = document.getElementById('email');
        if (emailField.value !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
            showError(emailField, 'Format email tidak valid.');
            allValid = false;
        } else hideError(emailField);
        
        return allValid;
    }

    function updateSubmitButtonState() {
        if (!submitBtn) return;
        const fieldsValid = validateForm();
        const agreeChecked = agreeCheckbox.checked;
        const uploadDone = (uploadedKtpUrl !== null);
        submitBtn.disabled = !(fieldsValid && agreeChecked && uploadDone);
    }
    
    function showError(field, message) {
        const errorElement = document.getElementById(`${field.id}-error`);
        const inputWrapper = field.closest('.input-group') || field;
        if(errorElement && message) {
            inputWrapper.style.borderColor = 'var(--error-color)';
            if (field.type === 'file') field.parentElement.style.borderColor = 'var(--error-color)';
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    function hideError(field) {
        const errorElement = document.getElementById(`${field.id}-error`);
        const inputWrapper = field.closest('.input-group') || field;
        if (errorElement) {
            inputWrapper.style.borderColor = 'var(--border-color)';
            if (field.type === 'file') field.parentElement.style.borderColor = 'var(--border-color)';
            errorElement.style.display = 'none';
        }
    }

    async function uploadFileToImgBB(file) {
        const formData = new FormData();
        formData.append('image', file);
        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKeyImgBB}`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (result.success) return result.data.url;
            else throw new Error(result.error.message || 'Gagal mengunggah gambar ke ImgBB.');
        } catch (error) {
            console.error('Error uploading to ImgBB:', error);
            throw error;
        }
    }

    function getTemplateParams(ktpUrl) {
        let kategoriUsaha = document.getElementById('kategori_usaha').value;
        if (kategoriUsaha === 'Lainnya') {
            const keterangan = document.getElementById('keterangan_lainnya').value;
            kategoriUsaha = `Lainnya (Keterangan: ${keterangan})`;
        }
        return {
            nama: document.getElementById('nama').value,
            nik: document.getElementById('nik').value,
            alamat: document.getElementById('alamat').value,
            whatsapp: document.getElementById('whatsapp').value,
            email: document.getElementById('email').value || 'Tidak diisi',
            nama_usaha: document.getElementById('nama_usaha').value,
            alamat_usaha: document.getElementById('alamat_usaha').value,
            lokasi_maps: document.getElementById('lokasi_maps').value,
            kategori_usaha: kategoriUsaha,
            id_permohonan: document.getElementById('id_permohonan').value,
            tanggal_pendaftaran: document.getElementById('tanggal_pendaftaran').value,
            foto_ktp_url: ktpUrl
        };
    }

    function showSuccessScreen() {
        formContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; animation: fadeInUp 0.5s ease-out;">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="var(--primary-color)" class="bi bi-cloud-check-fill" viewBox="0 0 16 16">
                  <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.99 10.69 2 8 2zm2.354 4.854a.5.5 0 0 0-.708-.708L7 8.793 5.854 7.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3z"/>
                </svg>
                <h2 style="color: var(--dark-color); font-size: 1.8rem; font-family: 'Poppins', sans-serif; margin-top: 20px;">Data Siap Dikirim!</h2>
                <p style="font-size: 1rem; color: var(--gray-color); margin-top: 15px; margin-bottom: 30px; line-height: 1.7;">
                    Data pendaftaran Anda sudah lengkap dan siap dikirim.
                    <br>
                    Klik tombol di bawah untuk menyelesaikan pendaftaran.
                </p>
                <button type="button" class="btn btn-primary" id="finalizeButton">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
                       <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022z"/>
                    </svg>
                    Selesaikan Pendaftaran
                </button>
            </div>
        `;
        
        document.getElementById('finalizeButton').addEventListener('click', function() {
            successSound.currentTime = 0; 
            successSound.play().catch(e => console.error("Pemutaran audio GAGAL:", e));
            showFinalSuccess();
        });
    }

    function showFinalSuccess() {
        formContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; animation: fadeInUp 0.5s ease-out;">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="var(--success-color)" class="bi bi-patch-check-fill" viewBox="0 0 16 16">
                  <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89-.01-.622-.636zm.287 5.964l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708z"/>
                </svg>
                <h2 style="color: var(--dark-color); font-size: 1.8rem; font-family: 'Poppins', sans-serif; margin-top: 20px;">Pendaftaran Berhasil!</h2>
                <p style="font-size: 1rem; color: var(--gray-color); margin-top: 15px; margin-bottom: 30px; line-height: 1.7;">
                    Terima kasih telah bergabung. Data Anda telah kami simpan.
                    <br><br>
                    <strong style="color: var(--error-color); font-size: 1.1rem;">LANGKAH TERAKHIR (WAJIB):</strong>
                    <br>
                    Anda <strong>wajib</strong> mengirimkan salinan data pendaftaran ini kepada kami sebagai konfirmasi. 
                    <br>
                    Silakan klik tombol di bawah untuk mengirim data Anda via WhatsApp.
                </p>
                <button type="button" class="btn btn-primary" id="sendWaButton" style="background: #25D366; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-whatsapp" viewBox="0 0 16 16">
                       <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.626-2.957 6.584-6.591 6.584zM10.118 8.584c-.197-.1-.8-.396-1.02-.459-.22-.063-.38-.099-.54.099-.16.198-.5.63-.61.751-.12.122-.23.138-.43.038-.2-.099-.84-.31-1.59-1.02-.58-.55-1.01-1.23-1.13-1.43-.12-.2-.02-.3.07-.401.08-.09.19-.23.29-.33.1-.1.13-.17.2-.28.07-.1.03-.18-.02-.28-.05-.1-.54-1.28-.73-1.75-.19-.47-.38-.4-.54-.4-.16-.007-.34-.007-.5-.007-.16 0-.43.063-.66.33-.22.27-.85.83-.85 2.02 0 1.18.87 2.34 1 2.49.12.15 1.7 2.58 4.13 3.63.58.25 1.03.4 1.38.52.36.12.68.1.92.06.27-.05.8-.33.91-.65.12-.32.12-.58.08-.65-.05-.07-.17-.12-.37-.22z"/>
                    </svg>
                    Kirim Konfirmasi (WAJIB)
                </button>
                <button type="button" class="btn btn-success" id="downloadAgreementBtn" style="margin-top: 15px; background: #1a3d7c;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-file-earmark-pdf" viewBox="0 0 16 16">
                      <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                      <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.7 19.7 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077.185.04.343.143.46.303.14.19.226.437.258.712.03.264.014.54-.05.813a3.86 3.86 0 0 1-.216.57c-.099.215-.232.43-.396.645a6.42 6.42 0 0 1-.708.77 13.7 13.7 0 0 1 1.284 1.797c.334.567.59 1.128.71 1.636.124.526.124 1.008-.062 1.36-.176.336-.528.565-1.012.565-.448 0-.93-.215-1.363-.565a3.86 3.86 0 0 1-.977-1.265 7.7 7.7 0 0 1-1.162.424c-.265.072-.533.12-.795.145-.262.024-.518.014-.757-.046a1.16 1.16 0 0 1-.548-.287z"/>
                    </svg>
                    Download Surat Perjanjian
                </button>
            </div>
        `;

        document.getElementById('sendWaButton').addEventListener('click', sendWhatsApp);
        document.getElementById('downloadAgreementBtn').addEventListener('click', async function() {
            if (!submittedData) {
                alert('Data pendaftaran tidak ditemukan. Silakan isi form terlebih dahulu.');
                return;
            }
            loadingText.textContent = 'Menyiapkan dokumen perjanjian...';
            loadingOverlay.classList.add('visible');
            try {
                await generateAgreementPDF(submittedData);
            } catch (error) {
                console.error('Gagal membuat dokumen:', error);
                alert('Terjadi kesalahan saat membuat dokumen perjanjian. Silakan coba lagi.');
            } finally {
                loadingOverlay.classList.remove('visible');
            }
        });
    }

    function sendWhatsApp() {
        if (finalWhatsAppMessage) {
            const whatsappURL = `https://wa.me/${nomorWhatsAppTujuan}?text=${encodeURIComponent(finalWhatsAppMessage)}`;
            window.open(whatsappURL, '_blank');
        } else alert('Pesan tidak tersedia. Silakan ulangi pendaftaran.');
    }

    // ==================== FUNGSI GENERATE PDF PERJANJIAN ====================
    async function generateAgreementPDF(data) {
        // Clone template
        const template = document.getElementById('agreement-template');
        const clone = template.cloneNode(true);
        clone.id = 'agreement-clone-' + Date.now();
        clone.style.display = 'block';
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        document.body.appendChild(clone);

        try {
            // Data yang diperlukan
            const idPendaftaran = generateRandomID();
            const fullIdPermohonan = data.id_permohonan; // sudah format AM-xxxxxx
            const tanggalPendaftaran = data.tanggal_pendaftaran; // format string

            // Format tanggal
            const formattedDate = formatDate(tanggalPendaftaran);
            const fullDate = formatFullDate(tanggalPendaftaran);
            const hariTanggal = getHariTanggal(tanggalPendaftaran);
            const nomorSurat = generateNomorSurat(idPendaftaran);

            // Kategori dengan penanganan Lainnya
            let kategoriDisplay = data.kategori_usaha;
            if (data.kategori_usaha === 'Lainnya' && data.keterangan_lainnya) {
                kategoriDisplay = `Lainnya (Keterangan: ${data.keterangan_lainnya})`;
            }

            // Isi elemen clone
            clone.querySelector('#display_nama_pemohon').textContent = data.nama.toUpperCase();
            clone.querySelector('#display_id_permohonan').textContent = fullIdPermohonan;
            clone.querySelector('#display_nik').textContent = data.nik;
            clone.querySelector('#display_alamat').textContent = data.alamat;
            clone.querySelector('#display_nomor_telepon').textContent = data.whatsapp;
            clone.querySelector('#display_id_pendaftaran').textContent = idPendaftaran;
            clone.querySelector('#display_nama_umkm').textContent = data.nama_usaha.toUpperCase();
            clone.querySelector('#display_kategori_layanan').textContent = kategoriDisplay;
            clone.querySelector('#display_tanggal_pendaftaran_full').textContent = fullDate;
            clone.querySelector('#display_nama_pemohon_sign').textContent = data.nama.toUpperCase();
            clone.querySelector('#display_hari_tanggal').textContent = hariTanggal;
            clone.querySelector('#nomor_surat_display').textContent = nomorSurat;

            // Data QR code
            const qrDataPihakKedua = `PEMOHON:${data.nama.toUpperCase()}|NIK:${data.nik}|ID:${fullIdPermohonan}|TGL:${formattedDate}`;
            const qrDataPihakPertama = `PERUSAHAAN:LENTERA KARYA|PENANDATANGAN:MUHAMMAD SALAM|JABATAN:FOUNDER|TGL:07/07/2025`;

            // Generate QR code
            await Promise.all([
                generateQRCodeToElement(clone.querySelector('#qrcode_pihak_kedua'), qrDataPihakKedua),
                generateQRCodeToElement(clone.querySelector('#qrcode_pihak_pertama'), qrDataPihakPertama)
            ]);

            // Beri sedikit waktu untuk render
            await new Promise(resolve => setTimeout(resolve, 300));

            // Opsi PDF
            const opt = {
                margin: [10, 10, 10, 10],
                filename: `Surat_Perjanjian_${data.nama.replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Buat PDF dan simpan
            await html2pdf().set(opt).from(clone).save();

        } finally {
            // Hapus clone dari DOM
            if (clone.parentNode) {
                document.body.removeChild(clone);
            }
        }
    }

    // Fungsi bantu untuk generateRandomID, formatDate, dll.
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
});
