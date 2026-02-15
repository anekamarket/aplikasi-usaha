$(document).ready(function() {
    const STORAGE_KEYS = {
        NOTES: 'umkm_pro_notes',
        DEBTS: 'umkm_pro_debts',
        SETTINGS: 'umkm_pro_settings',
        CURRENT_USER: 'umkm_pro_current_user'
    };

    let notes = [];
    let debts = [];
    let settings = {};
    let currentUser = null;
    let captchaText = '';

    function showToast(message, type = 'info') {
        const toast = $('#toast');
        toast.find('#toast-message').text(message);
        toast.removeClass('success error warning info').addClass(type);
        toast.addClass('show');
        setTimeout(() => toast.removeClass('show'), 3000);
    }

    function showConfirmation(message, onConfirm) {
        $('#confirmationMessage').text(message);
        $('#confirmationDialog').show();
        $('#confirmOk').off('click').on('click', function() {
            $('#confirmationDialog').hide();
            onConfirm(true);
        });
        $('#confirmCancel').off('click').on('click', function() {
            $('#confirmationDialog').hide();
            onConfirm(false);
        });
    }

    function formatCurrency(amount) {
        return 'Rp ' + (amount || 0).toLocaleString('id-ID');
    }

    function formatDate(dateString) {
        return moment(dateString).format('DD MMMM YYYY');
    }

    function generateCaptcha() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        captchaText = '';
        for (let i = 0; i < 6; i++) {
            captchaText += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        $('#captchaBox').text(captchaText);
    }

    function loadData() {
        notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES)) || [];
        debts = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEBTS)) || [];
        settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || { businessName: "UMKM Saya" };
        currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
        localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    }
    
    function renderNotes(filter = '') {
        const filteredNotes = notes.filter(n => n.title.toLowerCase().includes(filter) || n.content.toLowerCase().includes(filter));
        const notesList = $('#notesList');
        notesList.empty();
        if (filteredNotes.length > 0) {
            filteredNotes.forEach(note => {
                const card = `
                    <div class="note-card">
                        <div class="note-title">${note.title}</div>
                        <div class="note-content">${note.content}</div>
                        <div class="note-actions">
                            <button class="btn btn-sm btn-info edit-note" data-id="${note.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger delete-note" data-id="${note.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`;
                notesList.append(card);
            });
        } else {
            notesList.html('<div class="empty-state"><i class="fas fa-sticky-note"></i><p>Tidak ada catatan</p></div>');
        }
    }

    function renderDebts(filter = '') {
        const filteredDebts = debts.filter(d => d.person.toLowerCase().includes(filter));
        const debtsList = $('#debtsList');
        debtsList.empty();
         if (filteredDebts.length > 0) {
            filteredDebts.forEach(debt => {
                const card = `
                    <div class="debt-card ${debt.status}">
                        <div class="debt-title">${debt.type === 'debt' ? 'Hutang ke' : 'Piutang dari'} ${debt.person}</div>
                        <div>Jumlah: ${formatCurrency(debt.amount)}</div>
                        <div class="debt-due-date">Jatuh Tempo: ${formatDate(debt.dueDate)}</div>
                        <div class="debt-status ${debt.status}">${debt.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}</div>
                        <div class="debt-actions">
                            <button class="btn btn-sm btn-info edit-debt" data-id="${debt.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger delete-debt" data-id="${debt.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`;
                debtsList.append(card);
            });
        } else {
            debtsList.html('<div class="empty-state"><i class="fas fa-hand-holding-usd"></i><p>Tidak ada data hutang/piutang</p></div>');
        }
    }
    
    function updateSummary() {
        $('#totalNotes').text(notes.length);
        const unpaidDebts = debts.filter(d => d.type === 'debt' && d.status === 'unpaid').reduce((sum, d) => sum + d.amount, 0);
        $('#totalDebts').text(formatCurrency(unpaidDebts));
        const unpaidReceivables = debts.filter(d => d.type === 'receivable' && d.status === 'unpaid').reduce((sum, d) => sum + d.amount, 0);
        $('#totalReceivables').text(formatCurrency(unpaidReceivables));
        
        const recentNotesList = $('#recentNotes');
        recentNotesList.empty();
        if(notes.length > 0) {
            notes.slice(0, 3).forEach(note => {
                 recentNotesList.append(`<div class="note-card"><b>${note.title}</b><p>${note.content.substring(0,50)}...</p></div>`);
            });
        } else {
            recentNotesList.html('<div class="empty-state"><i class="fas fa-clock"></i><p>Belum ada catatan terbaru</p></div>');
        }
    }
    
    function refreshUI() {
        renderNotes($('#noteSearch').val().toLowerCase());
        renderDebts($('#debtSearch').val().toLowerCase());
        updateSummary();
        $('#businessName').text(settings.businessName);
        $('#loggedInUser').text(currentUser.username);
         $('#currentDate').text(moment().format('dddd, D MMMM YYYY'));
    }

    // App Initialization
    loadData();

    if (!currentUser) {
        $('#loginModal').css('display', 'flex');
        generateCaptcha();
    } else {
        $('#mainApp').show();
        refreshUI();
    }
    
    setTimeout(() => $('#splashScreen').fadeOut(500), 2000);

    // Event Handlers
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        if ($('#captchaInput').val().toUpperCase() !== captchaText) {
            $('#captchaError').text('Captcha tidak sesuai').show();
            generateCaptcha();
            return;
        }
        currentUser = { username: 'Admin' };
        saveData();
        $('#loginModal').hide();
        $('#mainApp').show();
        refreshUI();
        showToast('Login berhasil!', 'success');
    });

    $('#refreshCaptcha').on('click', function() {
        generateCaptcha();
    });

    $('#logoutBtn').on('click', function(e) {
        e.preventDefault();
        currentUser = null;
        saveData();
        window.location.reload();
    });

    $('.tab').on('click', function() {
        const tab = $(this).data('tab');
        $('.tab').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').removeClass('active');
        $(`#${tab}Tab`).addClass('active');
    });

    // Notes
    $('#addNoteBtn').on('click', () => {
        $('#noteModalTitle').text('Tambah Catatan');
        $('#noteId').val('');
        $('#noteTitle').val('');
        $('#noteContent').val('');
        $('#noteModal').css('display', 'flex');
    });

    $(document).on('click', '.edit-note', function() {
        const note = notes.find(n => n.id === $(this).data('id'));
        $('#noteModalTitle').text('Edit Catatan');
        $('#noteId').val(note.id);
        $('#noteTitle').val(note.title);
        $('#noteContent').val(note.content);
        $('#noteModal').css('display', 'flex');
    });

    $('#saveNoteBtn').on('click', function() {
        const id = $('#noteId').val();
        const noteData = { title: $('#noteTitle').val(), content: $('#noteContent').val() };
        if (id) {
            const index = notes.findIndex(n => n.id === id);
            notes[index] = { ...notes[index], ...noteData };
        } else {
            notes.unshift({ id: 'N' + Date.now(), ...noteData });
        }
        saveData();
        refreshUI();
        $('#noteModal').hide();
        showToast('Catatan disimpan!', 'success');
    });

    $(document).on('click', '.delete-note', function() {
        const id = $(this).data('id');
        showConfirmation('Anda yakin ingin menghapus catatan ini?', (confirm) => {
            if (confirm) {
                notes = notes.filter(n => n.id !== id);
                saveData();
                refreshUI();
                showToast('Catatan dihapus!', 'success');
            }
        });
    });
    
    // Debts
    $('#addDebtBtn').on('click', () => {
        $('#debtModalTitle').text('Tambah Hutang/Piutang');
        $('#debtId').val('');
        $('#debtType').val('debt');
        $('#debtPerson').val('');
        $('#debtAmount').val('');
        $('#debtDueDate').val('');
        $('#debtStatus').val('unpaid');
        $('#debtModal').css('display', 'flex');
    });
    
     $(document).on('click', '.edit-debt', function() {
        const debt = debts.find(d => d.id === $(this).data('id'));
        $('#debtModalTitle').text('Edit Hutang/Piutang');
        $('#debtId').val(debt.id);
        $('#debtType').val(debt.type);
        $('#debtPerson').val(debt.person);
        $('#debtAmount').val(debt.amount);
        $('#debtDueDate').val(debt.dueDate);
        $('#debtStatus').val(debt.status);
        $('#debtModal').css('display', 'flex');
    });

    $('#saveDebtBtn').on('click', function() {
        const id = $('#debtId').val();
        const debtData = { 
            type: $('#debtType').val(), 
            person: $('#debtPerson').val(), 
            amount: parseFloat($('#debtAmount').val()),
            dueDate: $('#debtDueDate').val(),
            status: $('#debtStatus').val()
        };
        if (id) {
            const index = debts.findIndex(d => d.id === id);
            debts[index] = { ...debts[index], ...debtData };
        } else {
            debts.unshift({ id: 'D' + Date.now(), ...debtData });
        }
        saveData();
        refreshUI();
        $('#debtModal').hide();
         showToast('Data hutang/piutang disimpan!', 'success');
    });
    
    $(document).on('click', '.delete-debt', function() {
        const id = $(this).data('id');
        showConfirmation('Anda yakin ingin menghapus data ini?', (confirm) => {
            if (confirm) {
                debts = debts.filter(d => d.id !== id);
                saveData();
                refreshUI();
                showToast('Data dihapus!', 'success');
            }
        });
    });

    // Settings
    $('#settingsBtn').on('click', () => {
        $('#businessNameSetting').val(settings.businessName);
        $('#settingsModal').css('display', 'flex');
    });
    
    $('#saveSettingsBtn').on('click', () => {
        settings.businessName = $('#businessNameSetting').val();
        saveData();
        refreshUI();
        showToast('Pengaturan disimpan!', 'success');
    });

    $('#backupDataBtn').on('click', () => {
        const data = btoa(JSON.stringify({ notes, debts, settings }));
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `UMKM_Pro_Backup_${moment().format('YYYYMMDD')}.prodata`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Backup data berhasil diunduh.', 'success');
    });

    $('#restoreDataBtn').on('click', () => $('#restoreFileInput').click());
    
    $('#restoreFileInput').on('change', function(e) {
        const file = e.target.files[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const restoredData = JSON.parse(atob(event.target.result));
                    if(restoredData.notes && restoredData.debts && restoredData.settings) {
                        notes = restoredData.notes;
                        debts = restoredData.debts;
                        settings = restoredData.settings;
                        saveData();
                        refreshUI();
                        showToast('Data berhasil dipulihkan!', 'success');
                    } else {
                        showToast('File backup tidak valid.', 'error');
                    }
                } catch (err) {
                    showToast('Gagal membaca file backup.', 'error');
                }
            };
            reader.readAsText(file);
        }
    });
    
    $('#clearDataBtn').on('click', () => {
         showConfirmation('PERINGATAN: Semua data akan dihapus permanen. Lanjutkan?', (confirm) => {
            if (confirm) {
                notes = [];
                debts = [];
                saveData();
                refreshUI();
                showToast('Semua data telah dihapus.', 'success');
            }
        });
    });

    // Real-time Search
    $('#noteSearch').on('input', function() { renderNotes($(this).val().toLowerCase()); });
    $('#debtSearch').on('input', function() { renderDebts($(this).val().toLowerCase()); });
    
    // Modal Closing
    $('.modal-close, .close-modal').on('click', function() {
        $('.modal').hide();
    });

    // Click outside modal to close (optional)
    $(window).on('click', function(e) {
        if ($(e.target).hasClass('modal')) {
            $('.modal').hide();
        }
    });
});
