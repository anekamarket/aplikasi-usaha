// Prevent flash of unstyled content
document.body.style.display = 'none';

document.addEventListener('DOMContentLoaded', function() {
    document.body.style.display = 'block';

    // =================================================================================
    // DATABASE & STATE MANAGEMENT
    // =================================================================================
    let db;
    let charts = {};
    const defaultDb = {
        employees: [],
        departments: ['Teknologi', 'Produk', 'Manajemen', 'SDM', 'Pemasaran', 'Keuangan'],
        attendance: {}, // Key is YYYY-MM-DD
        activities: [],
        leaves: [], // {id, employeeNip, startDate, endDate, reason, status: 'Menunggu'}
        settings: {
            jamMasuk: '08:00',
            jamPulang: '17:00',
            toleransi: 15, // in minutes
            passwords: {
                leaveApproval: '17081945',
                settings: '12091988',
                securityPanel: 'LKS.1945'
            }
        }
    };

    function seedData() {
        addActivity('Aplikasi siap digunakan. Silakan tambahkan data karyawan.', true);
        saveDb();
    }

    function loadDb() {
        const data = localStorage.getItem('simpegUltimateDb');
        if (data) {
            db = JSON.parse(data);
            // Ensure settings and passwords object exists for backward compatibility
            if (!db.settings) {
                db.settings = JSON.parse(JSON.stringify(defaultDb.settings));
            }
            if (!db.settings.passwords) {
                db.settings.passwords = JSON.parse(JSON.stringify(defaultDb.settings.passwords));
            }
        } else {
            db = JSON.parse(JSON.stringify(defaultDb));
            seedData();
        }
    }

    function saveDb() {
        localStorage.setItem('simpegUltimateDb', JSON.stringify(db));
    }

    function addActivity(text, silent = false) {
        db.activities.unshift({ text, time: new Date() });
        if (db.activities.length > 20) db.activities.pop();
        if (!silent) saveDb();
        if (document.getElementById('dashboardPage').classList.contains('active')) render.activityLog();
    }

    // =================================================================================
    // UI UTILITIES
    // =================================================================================
    const uiUtils = {
        showToast: (message, type = 'success') => {
            const toast = document.getElementById('notificationToast');
            toast.textContent = message;
            toast.style.backgroundColor = `var(--${type}-color)`;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        },
        showConfirm: (title, body, onConfirm, confirmClass = 'btn-danger') => {
            document.getElementById('confirmModalTitle').textContent = title;
            document.getElementById('confirmModalBody').innerHTML = `<p>${body}</p>`;
            const confirmBtn = document.getElementById('confirmModalBtn');
            confirmBtn.className = `btn ${confirmClass}`;
            confirmBtn.onclick = () => {
                onConfirm();
                document.getElementById('confirmModal').classList.remove('show');
            };
            document.getElementById('confirmModal').classList.add('show');
        },
        showPasswordPrompt: (title, text, onConfirm) => {
            const modal = document.getElementById('passwordPromptModal');
            document.getElementById('passwordPromptTitle').textContent = title;
            document.getElementById('passwordPromptText').textContent = text;
            const input = document.getElementById('passwordPromptInput');
            const confirmBtn = document.getElementById('passwordPromptBtn');
            input.value = '';

            const confirmHandler = () => {
                onConfirm(input.value);
                modal.classList.remove('show');
                confirmBtn.removeEventListener('click', confirmHandler);
                input.removeEventListener('keydown', keydownHandler);
            };

            const keydownHandler = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmHandler();
                }
            };

            confirmBtn.addEventListener('click', confirmHandler);
            input.addEventListener('keydown', keydownHandler);

            modal.classList.add('show');
            setTimeout(() => input.focus(), 100);
        },
        getTodayString: () => new Date().toISOString().slice(0, 10),
        populateDeptFilter: (elementId, withAllOption = true) => {
            const selectEl = document.getElementById(elementId);
            const currentVal = selectEl.value;
            selectEl.innerHTML = withAllOption ? '<option value="">Semua Departemen</option>' : '';
            db.departments.forEach(d => selectEl.add(new Option(d, d)));
            selectEl.value = currentVal;
        }
    };

    // =================================================================================
    // RENDER FUNCTIONS
    // =================================================================================
    const render = {
        page: (pageId) => {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(pageId)?.classList.add('active');

            document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
            const activeLink = document.querySelector(`.sidebar-menu a[data-page="${pageId}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
                document.getElementById('headerTitle').textContent = activeLink.textContent.trim();
            }
            if (window.innerWidth <= 768) document.getElementById('appContainer').classList.remove('sidebar-open');

            const renderMap = {
                dashboardPage: render.dashboard,
                karyawanPage: render.karyawan,
                departemenPage: render.departemen,
                absensiPage: render.absensi,
                cutiPage: render.cuti,
                laporanPage: render.laporan,
                pengaturanPage: render.pengaturan
            };
            renderMap[pageId]?.();
        },
        dashboard: () => {
            render.kpi();
            render.activityLog();
            render.charts.department();
        },
        karyawan: () => {
            const grid = document.getElementById('employeeGrid');
            const search = document.getElementById('employeeSearch').value.toLowerCase();
            const deptFilter = document.getElementById('departmentFilter').value;
            const statusFilter = document.getElementById('statusFilter').value;

            const filtered = db.employees.filter(e =>
                (e.name.toLowerCase().includes(search) || e.nip.toLowerCase().includes(search)) &&
                (!deptFilter || e.department === deptFilter) &&
                (!statusFilter || e.status === statusFilter)
            );

            grid.innerHTML = filtered.length === 0
                ? `<div class="empty-state"><i class="fas fa-users"></i><p>Belum ada data karyawan. Silakan tambahkan karyawan baru.</p></div>`
                : filtered.map(emp => {
                    const photoSrc = emp.photoUrl || `https://i.pravatar.cc/150?u=${emp.nip}`;
                    return `
                    <div class="employee-card" data-nip="${emp.nip}">
                        <div class="employee-photo"><img src="${photoSrc}" alt="${emp.name}" onerror="this.src='https://i.pravatar.cc/150?u=placeholder'"></div>
                        <div class="employee-name">${emp.name}</div>
                        <div class="employee-position">${emp.position}</div>
                    </div>`;
                }).join('');

            document.getElementById('employeeCount').textContent = `(${db.employees.length})`;
            uiUtils.populateDeptFilter('departmentFilter');
        },
        departemen: () => {
            const tableBody = document.querySelector('#departmentTable tbody');
            tableBody.innerHTML = db.departments.length === 0
                ? `<tr><td colspan="2" class="empty-state" style="padding: 2rem;">Belum ada departemen.</td></tr>`
                : db.departments.map(dept => `
                    <tr>
                        <td>${dept}</td>
                        <td><button class="btn btn-danger btn-sm" onclick="actions.deleteDepartment('${dept}')"><i class="fas fa-trash"></i></button></td>
                    </tr>
                `).join('');
        },
        absensi: () => {
            const date = document.getElementById('attendanceDateFilter').value;
            const dept = document.getElementById('attendanceDeptFilter').value;
            const tableBody = document.querySelector('#attendanceTable tbody');

            const filteredEmployees = db.employees.filter(emp => !dept || emp.department === dept);

            if (filteredEmployees.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="8" class="empty-state" style="padding: 2rem;">Belum ada karyawan untuk diabsen.</td></tr>`;
                return;
            }

            tableBody.innerHTML = filteredEmployees.map(emp => {
                const record = db.attendance[date]?.find(a => a.nip === emp.nip);
                let status = 'Belum Hadir';
                let statusClass = 'belum-hadir';
                let actionButton = `<button class="btn btn-success" onclick="actions.clockIn('${emp.nip}')">Clock In</button>`;
                let duration = '-';
                let clockInTimeStr = '-';
                let clockOutTimeStr = '-';
                let clockInClass = '';
                let clockOutClass = '';

                if (record) {
                    const clockInTime = new Date(record.clockIn);
                    const standardMasuk = new Date(`${date}T${db.settings.jamMasuk}`);
                    standardMasuk.setMinutes(standardMasuk.getMinutes() + db.settings.toleransi);

                    clockInTimeStr = clockInTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                    if (clockInTime > standardMasuk) {
                        status = 'Terlambat'; statusClass = 'terlambat'; clockInClass = 'text-danger';
                    } else {
                        status = 'Hadir'; statusClass = 'hadir';
                    }

                    if (record.clockIn && !record.clockOut) {
                        actionButton = `<button class="btn btn-primary" onclick="actions.clockOut('${emp.nip}')">Clock Out</button>`;
                    } else if (record.clockIn && record.clockOut) {
                        status = 'Selesai'; statusClass = 'selesai';
                        actionButton = `-`;
                        const clockOutTime = new Date(record.clockOut);
                        const standardPulang = new Date(`${date}T${db.settings.jamPulang}`);

                        clockOutTimeStr = clockOutTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                        if (clockOutTime < standardPulang) {
                            clockOutClass = 'text-danger';
                        }

                        const diff = clockOutTime - clockInTime;
                        const hours = Math.floor(diff / 3600000);
                        const mins = Math.floor((diff % 3600000) / 60000);
                        duration = `${hours} jam ${mins} mnt`;
                    }
                }

                return `<tr>
                    <td>${emp.name}</td><td>${emp.nip}</td><td>${emp.department}</td>
                    <td class="${clockInClass}">${clockInTimeStr}</td>
                    <td class="${clockOutClass}">${clockOutTimeStr}</td>
                    <td>${duration}</td>
                    <td><span class="status-badge status-${statusClass}">${status}</span></td>
                    <td>${actionButton}</td>
                </tr>`;
            }).join('');
        },
        cuti: () => {
            const tableBody = document.querySelector('#leaveTable tbody');
            if (db.leaves.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="6" class="empty-state" style="padding: 2rem;">Belum ada pengajuan cuti.</td></tr>`;
                return;
            }
            // Sort by most recent
            const sortedLeaves = [...db.leaves].sort((a, b) => new Date(b.id) - new Date(a.id));

            tableBody.innerHTML = sortedLeaves.map(leave => {
                const employee = db.employees.find(e => e.nip === leave.employeeNip);
                return `<tr>
                    <td>${employee?.name || 'N/A'}</td>
                    <td>${new Date(leave.startDate).toLocaleDateString('id-ID')}</td>
                    <td>${new Date(leave.endDate).toLocaleDateString('id-ID')}</td>
                    <td>${leave.reason}</td>
                    <td><span class="status-badge status-${leave.status.toLowerCase()}">${leave.status}</span></td>
                    <td>
                        ${leave.status === 'Menunggu' ? `
                        <button class="btn btn-success btn-sm" title="Setujui" onclick="actions.updateLeaveStatus(${leave.id}, 'Disetujui')"><i class="fas fa-check"></i></button>
                        <button class="btn btn-danger btn-sm" title="Tolak" onclick="actions.updateLeaveStatus(${leave.id}, 'Ditolak')"><i class="fas fa-times"></i></button>
                        ` : ''}
                        <button class="btn btn-danger btn-sm" title="Hapus" onclick="actions.deleteLeave(${leave.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
            }).join('');
        },
        laporan: () => {
            uiUtils.populateDeptFilter('reportDeptFilter');
            document.getElementById('reportOutput').innerHTML = '<p style="text-align: center; color: var(--gray-color);">Pilih filter di atas dan klik "Buat Laporan" untuk melihat hasil.</p>';
        },
        pengaturan: () => {
            document.getElementById('settingJamMasuk').value = db.settings.jamMasuk;
            document.getElementById('settingJamPulang').value = db.settings.jamPulang;
            document.getElementById('settingToleransi').value = db.settings.toleransi;
            document.getElementById('securityPanel').style.display = 'none'; // Ensure panel is closed on page load
        },
        kpi: () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const onLeave = db.leaves.filter(l => l.status === 'Disetujui' && new Date(l.startDate) <= today && new Date(l.endDate) >= today).length;
            const total = db.employees.length;
            const men = db.employees.filter(e => e.gender === 'Pria').length;
            document.getElementById('kpiGrid').innerHTML = `
                <div class="kpi-card"><i class="fas fa-users"></i><div class="value">${total}</div><div class="label">Total Karyawan</div></div>
                <div class="kpi-card"><i class="fas fa-user-check"></i><div class="value">${total - onLeave}</div><div class="label">Karyawan Aktif</div></div>
                <div class="kpi-card"><i class="fas fa-user-clock"></i><div class="value">${onLeave}</div><div class="label">Sedang Cuti</div></div>
                <div class="kpi-card"><i class="fas fa-venus-mars"></i><div class="value">${men} P / ${total - men} W</div><div class="label">Rasio Gender</div></div>`;
        },
        activityLog: () => {
            const logUl = document.getElementById('activityLog');
            logUl.innerHTML = db.activities.length === 0
                ? '<li>Tidak ada aktivitas.</li>'
                : db.activities.map(act => `<li style="padding: 4px 0; border-bottom: 1px solid var(--border-color);">${act.text} <small style="display:block; color: var(--gray-color)">${new Date(act.time).toLocaleString('id-ID')}</small></li>`).join('');
        },
        charts: {
            destroy: (chartId) => { if (charts[chartId]) { charts[chartId].destroy(); delete charts[chartId]; } },
            department: () => {
                render.charts.destroy('dept');
                const ctx = document.getElementById('departmentChart')?.getContext('2d');
                if (!ctx) return;
                const data = db.departments.map(dept => ({ dept, count: db.employees.filter(e => e.department === dept).length }));
                charts['dept'] = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: data.map(d => d.dept),
                        datasets: [{
                            data: data.map(d => d.count),
                            backgroundColor: ['#0052cc', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6c757d', '#343a40']
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            },
        },
        employeeForm: (nip = null) => {
            const form = document.getElementById('employeeForm');
            const emp = nip ? db.employees.find(e => e.nip === nip) : {};
            form.innerHTML = `
                <input type="hidden" id="employeeNipOriginal" value="${nip || ''}">
                <div class="form-group">
                    <label class="form-label">NIP / ID Karyawan</label>
                    <input type="text" id="employeeNip" class="form-control" required value="${emp.nip || ''}" ${nip ? 'readonly' : ''} placeholder="Contoh: 112233">
                </div>
                <div class="form-group"><label class="form-label">Nama Lengkap</label><input type="text" id="employeeName" class="form-control" required value="${emp.name || ''}"></div>
                <div class="form-group"><label class="form-label">Email</label><input type="email" id="employeeEmail" class="form-control" required value="${emp.email || ''}"></div>
                <div class="form-group"><label class="form-label">No. WhatsApp</label><input type="tel" id="employeeWhatsapp" class="form-control" value="${emp.whatsapp || ''}" placeholder="Contoh: 081234567890"></div>
                <div class="form-group"><label class="form-label">URL Foto (Opsional)</label><input type="url" id="employeePhotoUrl" class="form-control" value="${emp.photoUrl || ''}" placeholder="https://example.com/foto.jpg"></div>
                <div class="form-group"><label class="form-label">Departemen</label><select id="employeeDepartment" class="form-control" required>${db.departments.length === 0 ? '<option value="">--Buat departemen dulu--</option>' : db.departments.map(d => `<option value="${d}" ${emp.department === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
                <div class="form-group"><label class="form-label">Jabatan</label><input type="text" id="employeePosition" class="form-control" required value="${emp.position || ''}"></div>
                <div class="form-group"><label class="form-label">Gender</label><select id="employeeGender" class="form-control" required><option value="Pria" ${emp.gender === 'Pria' ? 'selected' : ''}>Pria</option><option value="Wanita" ${emp.gender === 'Wanita' ? 'selected' : ''}>Wanita</option></select></div>
                <div class="form-group"><label class="form-label">Status</label><select id="employeeStatus" class="form-control" required><option value="Permanen" ${emp.status === 'Permanen' ? 'selected' : ''}>Permanen</option><option value="Kontrak" ${emp.status === 'Kontrak' ? 'selected' : ''}>Kontrak</option><option value="Magang" ${emp.status === 'Magang' ? 'selected' : ''}>Magang</option></select></div>
            `;
            document.getElementById('employeeModalTitle').textContent = nip ? 'Edit Karyawan' : 'Tambah Karyawan Baru';
            document.getElementById('employeeFormModal').classList.add('show');
        },
        employeeDetail: (nip) => {
            const emp = db.employees.find(e => e.nip === nip);
            if (!emp) return;
            const formatWhatsappLink = (number) => {
                if (!number) return null;
                let cleanNumber = String(number).replace(/\D/g, '');
                if (cleanNumber.startsWith('0')) {
                    cleanNumber = '62' + cleanNumber.substring(1);
                } else if (!cleanNumber.startsWith('62')) {
                    cleanNumber = '62' + cleanNumber;
                }
                return `https://wa.me/${cleanNumber}`;
            };
            const photoSrc = emp.photoUrl || `https://i.pravatar.cc/150?u=${emp.nip}`;
            document.getElementById('employeeDetailBody').innerHTML = `
                <div style="display:flex; align-items:center; gap:1.5rem; margin-bottom:1.5rem;">
                    <img src="${photoSrc}" alt="${emp.name}" style="width:100px; height:100px; border-radius:50%; object-fit:cover;" onerror="this.src='https://i.pravatar.cc/150?u=placeholder'">
                    <div><h3 style="margin:0;">${emp.name}</h3><p style="color:var(--primary-color);">${emp.position}</p></div>
                </div>
                <dl class="detail-grid">
                    <dt>NIP</dt><dd>${emp.nip}</dd>
                    <dt>Email</dt><dd>${emp.email}</dd>
                    <dt>No. WhatsApp</dt><dd>${emp.whatsapp ? `<a href="${formatWhatsappLink(emp.whatsapp)}" target="_blank" style="text-decoration:none; color:inherit;">${emp.whatsapp} <i class="fab fa-whatsapp" style="color:var(--success-color)"></i></a>` : '-'}</dd>
                    <dt>Departemen</dt><dd>${emp.department}</dd>
                    <dt>Gender</dt><dd>${emp.gender}</dd>
                    <dt>Status</dt><dd>${emp.status}</dd>
                </dl>`;
            document.getElementById('employeeDetailFooter').innerHTML = `
                <button class="btn btn-danger" onclick="actions.deleteEmployee('${emp.nip}')"><i class="fas fa-trash"></i> Hapus</button>
                <button class="btn btn-primary" onclick="render.employeeForm('${emp.nip}')"><i class="fas fa-edit"></i> Edit</button>`;
            document.getElementById('employeeDetailModal').classList.add('show');
        },
        leaveForm: () => {
            const form = document.getElementById('leaveForm');
            if (db.employees.length === 0) {
                uiUtils.showToast('Tidak bisa mengajukan cuti, belum ada data karyawan.', 'danger');
                return;
            }
            form.innerHTML = `
                <div class="form-group">
                    <label class="form-label" for="leaveEmployee">Pilih Karyawan</label>
                    <select id="leaveEmployee" class="form-control" required>
                        ${db.employees.map(e => `<option value="${e.nip}">${e.name} (${e.nip})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="leaveStartDate">Tanggal Mulai</label>
                    <input type="date" id="leaveStartDate" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="leaveEndDate">Tanggal Selesai</label>
                    <input type="date" id="leaveEndDate" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="leaveReason">Alasan Cuti</label>
                    <textarea id="leaveReason" class="form-control" rows="3" required></textarea>
                </div>
            `;
            document.getElementById('leaveFormModal').classList.add('show');
        }
    };

    // =================================================================================
    // ACTIONS
    // =================================================================================
    window.actions = { // Make it globally accessible for inline onclick
        _verifyPassword: (passwordType, onSuccess) => {
            const passwordMap = {
                leaveApproval: { title: 'Persetujuan Cuti', text: 'Masukkan kata sandi untuk menyetujui cuti.', pass: db.settings.passwords.leaveApproval },
                settings: { title: 'Aksi Dilindungi', text: 'Masukkan kata sandi pengaturan untuk melanjutkan.', pass: db.settings.passwords.settings },
                securityPanel: { title: 'Panel Keamanan', text: 'Masukkan kata sandi untuk membuka panel keamanan.', pass: db.settings.passwords.securityPanel }
            };
            const promptInfo = passwordMap[passwordType];
            uiUtils.showPasswordPrompt(promptInfo.title, promptInfo.text, (enteredPassword) => {
                if (enteredPassword === promptInfo.pass) {
                    onSuccess();
                } else if (enteredPassword) {
                    uiUtils.showToast('Kata sandi salah.', 'danger');
                }
            });
        },
        saveEmployee: () => {
            const originalNip = document.getElementById('employeeNipOriginal').value;
            const isEditing = !!originalNip;
            const nip = document.getElementById('employeeNip').value.trim();

            if (!nip) { uiUtils.showToast('NIP / ID Karyawan wajib diisi.', 'danger'); return; }
            if (!isEditing && db.employees.some(e => e.nip === nip)) { uiUtils.showToast('NIP / ID Karyawan sudah digunakan.', 'danger'); return; }
            if (db.departments.length === 0) { uiUtils.showToast('Anda harus membuat departemen terlebih dahulu.', 'danger'); return; }

            const data = {
                nip: nip, name: document.getElementById('employeeName').value, email: document.getElementById('employeeEmail').value,
                whatsapp: document.getElementById('employeeWhatsapp').value,
                photoUrl: document.getElementById('employeePhotoUrl').value, department: document.getElementById('employeeDepartment').value,
                position: document.getElementById('employeePosition').value, gender: document.getElementById('employeeGender').value,
                status: document.getElementById('employeeStatus').value
            };

            if (isEditing) {
                const index = db.employees.findIndex(e => e.nip === originalNip);
                db.employees[index] = { ...db.employees[index], ...data };
                addActivity(`Data ${data.name} diperbarui.`);
            } else {
                db.employees.push(data);
                addActivity(`${data.name} ditambahkan sebagai karyawan baru.`);
            }
            saveDb();
            render.karyawan();
            uiUtils.showToast(`Data karyawan berhasil ${isEditing ? 'diperbarui' : 'disimpan'}.`);
            document.getElementById('employeeFormModal').classList.remove('show');
        },
        deleteEmployee: (nip) => {
            const emp = db.employees.find(e => e.nip === nip);
            uiUtils.showConfirm('Hapus Karyawan', `Apakah Anda yakin ingin menghapus data <strong>${emp.name}</strong>? Tindakan ini tidak dapat diurungkan.`, () => {
                db.employees = db.employees.filter(e => e.nip !== nip);
                saveDb();
                addActivity(`Data ${emp.name} telah dihapus.`);
                uiUtils.showToast('Data karyawan berhasil dihapus.', 'danger');
                document.getElementById('employeeDetailModal').classList.remove('show');
                render.karyawan();
            });
        },
        addDepartment: () => {
            const input = document.getElementById('newDepartmentInput');
            const newDept = input.value.trim();
            if (newDept && !db.departments.some(d => d.toLowerCase() === newDept.toLowerCase())) {
                db.departments.push(newDept);
                saveDb();
                addActivity(`Departemen baru '${newDept}' ditambahkan.`);
                uiUtils.showToast('Departemen berhasil ditambahkan.');
                render.departemen();
                input.value = '';
            } else if (!newDept) {
                uiUtils.showToast('Nama departemen tidak boleh kosong.', 'warning');
            } else {
                uiUtils.showToast('Nama departemen sudah ada.', 'warning');
            }
        },
        deleteDepartment: (deptName) => {
            const isUsed = db.employees.some(emp => emp.department === deptName);
            if (isUsed) {
                uiUtils.showToast('Departemen tidak bisa dihapus karena masih digunakan oleh karyawan.', 'danger');
                return;
            }
            uiUtils.showConfirm('Hapus Departemen', `Yakin ingin menghapus departemen <strong>${deptName}</strong>?`, () => {
                db.departments = db.departments.filter(d => d !== deptName);
                saveDb();
                addActivity(`Departemen '${deptName}' telah dihapus.`);
                uiUtils.showToast('Departemen berhasil dihapus.', 'danger');
                render.departemen();
            });
        },
        clockIn: (nip) => {
            const date = document.getElementById('attendanceDateFilter').value;
            if (!db.attendance[date]) db.attendance[date] = [];
            db.attendance[date].push({ nip: nip, clockIn: new Date(), clockOut: null });
            const emp = db.employees.find(e => e.nip === nip);
            addActivity(`${emp.name} melakukan clock in.`);
            saveDb();
            render.absensi();
        },
        clockOut: (nip) => {
            const date = document.getElementById('attendanceDateFilter').value;
            const recordIndex = db.attendance[date].findIndex(a => a.nip === nip);
            if (recordIndex > -1) {
                const clockOutTime = new Date();
                db.attendance[date][recordIndex].clockOut = clockOutTime;

                const standardPulang = new Date(`${date}T${db.settings.jamPulang}`);
                if (clockOutTime < standardPulang) {
                    uiUtils.showToast('Absensi pulang tidak sesuai (lebih awal).', 'warning');
                }

                const emp = db.employees.find(e => e.nip === nip);
                addActivity(`${emp.name} melakukan clock out.`);
                saveDb();
                render.absensi();
            }
        },
        saveLeave: () => {
            const employeeNip = document.getElementById('leaveEmployee').value;
            const startDate = document.getElementById('leaveStartDate').value;
            const endDate = document.getElementById('leaveEndDate').value;
            const reason = document.getElementById('leaveReason').value.trim();
            if (!employeeNip || !startDate || !endDate || !reason) {
                uiUtils.showToast('Semua field wajib diisi.', 'danger');
                return;
            }
            if (new Date(endDate) < new Date(startDate)) {
                uiUtils.showToast('Tanggal selesai tidak boleh sebelum tanggal mulai.', 'danger');
                return;
            }
            const newLeave = {
                id: Date.now(), employeeNip, startDate, endDate, reason, status: 'Menunggu'
            };
            db.leaves.push(newLeave);
            const emp = db.employees.find(e => e.nip === employeeNip);
            addActivity(`Pengajuan cuti baru dari ${emp.name}.`);
            saveDb();
            render.cuti();
            document.getElementById('leaveFormModal').classList.remove('show');
            uiUtils.showToast('Pengajuan cuti berhasil disimpan.');
        },
        updateLeaveStatus: (leaveId, newStatus) => {
            const doUpdate = () => {
                const leaveIndex = db.leaves.findIndex(l => l.id === leaveId);
                if (leaveIndex > -1) {
                    db.leaves[leaveIndex].status = newStatus;
                    const emp = db.employees.find(e => e.nip === db.leaves[leaveIndex].employeeNip);
                    addActivity(`Pengajuan cuti ${emp.name} telah ${newStatus.toLowerCase()}.`);
                    saveDb();
                    render.cuti();
                    uiUtils.showToast('Status cuti berhasil diperbarui.');
                }
            };
            if (newStatus === 'Disetujui') {
                actions._verifyPassword('leaveApproval', doUpdate);
            } else {
                doUpdate();
            }
        },
        deleteLeave: (leaveId) => {
            uiUtils.showConfirm('Hapus Pengajuan Cuti', `Yakin ingin menghapus data pengajuan cuti ini?`, () => {
                db.leaves = db.leaves.filter(l => l.id !== leaveId);
                saveDb();
                addActivity(`Satu data pengajuan cuti telah dihapus.`);
                uiUtils.showToast('Data cuti berhasil dihapus.', 'danger');
                render.cuti();
            });
        },
        saveWorkHours: () => {
            actions._verifyPassword('settings', () => {
                db.settings.jamMasuk = document.getElementById('settingJamMasuk').value;
                db.settings.jamPulang = document.getElementById('settingJamPulang').value;
                db.settings.toleransi = parseInt(document.getElementById('settingToleransi').value, 10) || 0;
                saveDb();
                addActivity('Pengaturan jam kerja telah diperbarui.');
                uiUtils.showToast('Pengaturan jam kerja berhasil disimpan.');
            });
        },
        openSecurityPanel: () => {
            const panel = document.getElementById('securityPanel');
            if (panel.style.display === 'block') {
                panel.style.display = 'none';
                return;
            }
            actions._verifyPassword('securityPanel', () => {
                panel.innerHTML = `
                    <h5 style="margin-bottom: 1rem; font-weight: 600;">Ubah Kata Sandi</h5>
                    <div class="form-group">
                        <label for="passLeaveApproval" class="form-label">Kata Sandi Persetujuan Cuti</label>
                        <input type="password" id="passLeaveApproval" class="form-control" placeholder="Biarkan kosong jika tidak diubah">
                    </div>
                    <div class="form-group">
                        <label for="passSettings" class="form-label">Kata Sandi Pengaturan & Reset Data</label>
                        <input type="password" id="passSettings" class="form-control" placeholder="Biarkan kosong jika tidak diubah">
                    </div>
                    <div class="form-group">
                        <label for="passSecurityPanel" class="form-label">Kata Sandi Panel Keamanan</label>
                        <input type="password" id="passSecurityPanel" class="form-control" placeholder="Biarkan kosong jika tidak diubah">
                    </div>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1.5rem;">
                        <button onclick="actions.savePasswords()" class="btn btn-primary"><i class="fas fa-save"></i> Simpan Kata Sandi</button>
                        <button onclick="actions.resetPasswords()" class="btn btn-warning" style="margin-left: auto;"><i class="fas fa-undo"></i> Reset ke Default</button>
                    </div>
                `;
                panel.style.display = 'block';
            });
        },
        savePasswords: () => {
            const passLeave = document.getElementById('passLeaveApproval').value;
            const passSettings = document.getElementById('passSettings').value;
            const passSecurity = document.getElementById('passSecurityPanel').value;
            let changed = false;

            if (passLeave) { db.settings.passwords.leaveApproval = passLeave; changed = true; }
            if (passSettings) { db.settings.passwords.settings = passSettings; changed = true; }
            if (passSecurity) { db.settings.passwords.securityPanel = passSecurity; changed = true; }

            if (changed) {
                saveDb();
                addActivity('Kata sandi keamanan telah diperbarui.');
                uiUtils.showToast('Kata sandi berhasil disimpan.');
                document.getElementById('securityPanel').style.display = 'none';
            } else {
                uiUtils.showToast('Tidak ada perubahan kata sandi.', 'info');
            }
        },
        resetPasswords: () => {
            uiUtils.showConfirm('Reset Kata Sandi', 'Anda yakin ingin mengembalikan semua kata sandi ke pengaturan awal?', () => {
                db.settings.passwords = JSON.parse(JSON.stringify(defaultDb.settings.passwords));
                saveDb();
                addActivity('Semua kata sandi telah di-reset ke default.');
                uiUtils.showToast('Kata sandi berhasil di-reset.', 'warning');
                document.getElementById('securityPanel').style.display = 'none';
            }, 'btn-warning');
        },
        generateReport: () => {
            const type = document.getElementById('reportType').value;
            const startDate = document.getElementById('reportStartDate').value;
            const endDate = document.getElementById('reportEndDate').value;
            const dept = document.getElementById('reportDeptFilter').value;
            const output = document.getElementById('reportOutput');

            if (!startDate || !endDate) {
                uiUtils.showToast('Silakan tentukan rentang tanggal laporan.', 'warning');
                return;
            }
            if (new Date(endDate) < new Date(startDate)) {
                uiUtils.showToast('Tanggal selesai tidak boleh sebelum tanggal mulai.', 'warning');
                return;
            }

            let html = '';
            if (type === 'attendance') {
                html = actions.generateAttendanceReport(startDate, endDate, dept);
            } else if (type === 'employee_status') {
                html = actions.generateEmployeeStatusReport(dept);
            }
            output.innerHTML = html;

            setTimeout(() => {
                if (html.includes("Tidak ada data")) {
                    uiUtils.showToast('Tidak ada data untuk dilaporkan pada filter yang dipilih.', 'info');
                } else {
                    window.print();
                }
            }, 100);
        },
        generateAttendanceReport: (start, end, dept) => {
            let rows = '';
            const filteredEmployees = db.employees.filter(e => !dept || e.department === dept);

            for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().slice(0, 10);
                const attendanceRecords = db.attendance[dateStr] || [];

                filteredEmployees.forEach(emp => {
                    const record = attendanceRecords.find(r => r.nip === emp.nip);
                    let status = 'Alpha';
                    let statusClass = 'print-status-alpha';
                    let clockIn = '-';
                    let clockOut = '-';
                    let duration = '-';

                    if (record) {
                        const clockInTime = new Date(record.clockIn);
                        const standardMasuk = new Date(`${dateStr}T${db.settings.jamMasuk}`);
                        standardMasuk.setMinutes(standardMasuk.getMinutes() + db.settings.toleransi);

                        if (clockInTime > standardMasuk) {
                            status = 'Terlambat';
                            statusClass = 'print-status-terlambat';
                        } else {
                            status = 'Hadir';
                            statusClass = 'print-status-hadir';
                        }
                        clockIn = clockInTime.toLocaleTimeString('id-ID');

                        if (record.clockOut) {
                            const clockOutTime = new Date(record.clockOut);
                            clockOut = clockOutTime.toLocaleTimeString('id-ID');
                            const diff = clockOutTime - clockInTime;
                            const hours = Math.floor(diff / 3600000);
                            const mins = Math.floor((diff % 3600000) / 60000);
                            duration = `${hours} jam ${mins} mnt`;
                        }
                    }
                    rows += `<tr><td>${dateStr}</td><td>${emp.name}</td><td>${emp.nip}</td><td>${emp.department}</td><td>${clockIn}</td><td>${clockOut}</td><td>${duration}</td><td class="${statusClass}">${status}</td></tr>`;
                });
            }

            if (!rows) return '<p class="empty-state" style="grid-column: 1 / -1;">Tidak ada data absensi pada rentang tanggal dan departemen yang dipilih.</p>';

            return `<h3 id="reportTitle">Laporan Absensi Karyawan</h3>
                    <p style="text-align:center; margin-bottom:1.5rem;">Periode: ${start} s/d ${end} | Departemen: ${dept || 'Semua'}</p>
                    <table><thead><tr><th>Tanggal</th><th>Nama</th><th>NIP</th><th>Departemen</th><th>Masuk</th><th>Pulang</th><th>Durasi</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
        },
        generateEmployeeStatusReport: (dept) => {
            const filteredEmployees = db.employees.filter(e => !dept || e.department === dept);
            if (filteredEmployees.length === 0) return '<p class="empty-state">Tidak ada data karyawan pada departemen yang dipilih.</p>';

            const rows = filteredEmployees.map(emp => `
                <tr><td>${emp.name}</td><td>${emp.nip}</td><td>${emp.department}</td><td>${emp.position}</td><td>${emp.gender}</td><td>${emp.status}</td></tr>
            `).join('');

            return `<h3 id="reportTitle">Laporan Status Karyawan</h3>
                    <p style="text-align:center; margin-bottom:1.5rem;">Departemen: ${dept || 'Semua'}</p>
                    <table><thead><tr><th>Nama</th><th>NIP</th><th>Departemen</th><th>Jabatan</th><th>Gender</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
        },
        backupData: () => {
            const dataStr = JSON.stringify(db, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = `simpeg_backup_${uiUtils.getTodayString()}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            addActivity('Backup data berhasil dibuat.');
            uiUtils.showToast('Data berhasil di-backup.');
        },
        restoreData: (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const restoredDb = JSON.parse(e.target.result);
                    if (restoredDb.employees && restoredDb.departments) {
                        db = restoredDb;
                        saveDb();
                        addActivity('Data berhasil dipulihkan dari backup.');
                        uiUtils.showToast('Data berhasil di-restore. Halaman akan dimuat ulang.');
                        setTimeout(() => location.reload(), 1500);
                    } else { throw new Error('Invalid file structure'); }
                } catch (error) {
                    uiUtils.showToast('Gagal me-restore data. File tidak valid.', 'danger');
                } finally {
                    event.target.value = '';
                }
            };
            reader.readAsText(file);
        },
        resetData: () => {
            uiUtils.showConfirm('Reset Semua Data', 'Anda yakin ingin menghapus SEMUA data dan mengembalikan aplikasi ke keadaan awal? Tindakan ini akan meminta kata sandi.', () => {
                actions._verifyPassword('settings', () => {
                    localStorage.removeItem('simpegUltimateDb');
                    uiUtils.showToast('Data berhasil di-reset. Halaman akan dimuat ulang.', 'danger');
                    setTimeout(() => location.reload(), 1500);
                });
            });
        }
    };

    // =================================================================================
    // EVENT LISTENERS
    // =================================================================================
    document.querySelector('.sidebar-menu').addEventListener('click', e => {
        const link = e.target.closest('a');
        if (link?.dataset.page) { e.preventDefault(); render.page(link.dataset.page); }
    });
    document.getElementById('themeSwitcher').addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        this.classList.toggle('fa-sun'); this.classList.toggle('fa-moon');
    });
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('appContainer').classList.toggle('sidebar-open');
    });
    // Karyawan Page
    document.getElementById('addEmployeeBtn').addEventListener('click', () => render.employeeForm());
    document.getElementById('employeeGrid').addEventListener('click', (e) => {
        const card = e.target.closest('.employee-card');
        if (card) render.employeeDetail(card.dataset.nip);
    });
    ['employeeSearch', 'departmentFilter', 'statusFilter'].forEach(id => {
        document.getElementById(id).addEventListener('input', render.karyawan);
    });
    // Departemen Page
    document.getElementById('addDepartmentBtn').addEventListener('click', actions.addDepartment);
    // Absensi Page
    document.getElementById('attendanceDateFilter').addEventListener('change', render.absensi);
    document.getElementById('attendanceDeptFilter').addEventListener('change', render.absensi);
    // Cuti Page
    document.getElementById('addLeaveBtn').addEventListener('click', render.leaveForm);
    // Laporan Page
    document.getElementById('generateReportBtn').addEventListener('click', actions.generateReport);
    // Pengaturan Page
    document.getElementById('saveWorkHoursBtn').addEventListener('click', actions.saveWorkHours);
    document.getElementById('openSecurityPanelBtn').addEventListener('click', actions.openSecurityPanel);
    document.getElementById('backupDataBtn').addEventListener('click', actions.backupData);
    document.getElementById('restoreDataInput').addEventListener('change', actions.restoreData);
    document.getElementById('resetDataBtn').addEventListener('click', actions.resetData);

    // General Modal Close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal') || e.target.classList.contains('modal-close')) {
                this.classList.remove('show');
            }
        });
    });
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.modal').classList.remove('show'));
    });

    // =================================================================================
    // INITIALIZATION
    // =================================================================================
    function init() {
        loadDb();
        // Setup initial values
        document.getElementById('attendanceDateFilter').value = uiUtils.getTodayString();
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
        document.getElementById('reportStartDate').value = firstDayOfMonth;
        document.getElementById('reportEndDate').value = uiUtils.getTodayString();

        render.page('dashboardPage');
    }
    init();
});
