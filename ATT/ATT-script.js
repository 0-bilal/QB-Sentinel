document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyeEakq-kxXanUxNZXwy-ZAixfV_9L9b5j4IKrRPXOS8wnhduBLMBCHcjXoDwv4ulM4sg/exec';

    const branchEmployees = {
        "Muzahmiyah": ["رمان", "محمد"],
        "Dawadimi":   ["شاهين", "دورجا", "نسيم", "بلال"]
    };

    let selectedEmployee = localStorage.getItem('qb_staff_name')   || "";
    let selectedBranch   = localStorage.getItem('qb_staff_branch') || "";
    let html5QrCode = null;

    const els = {
        branchCard:      document.getElementById('branchCard'),
        empSection:      document.getElementById('employeeSection'),
        empGrid:         document.getElementById('employeeGrid'),
        scannerSection:  document.getElementById('scannerSection'),
        savedInfo:       document.getElementById('savedInfo'),
        displayUser:     document.getElementById('displayUser'),
        displayBranch:   document.getElementById('displayBranch'),
        resetBtn:        document.getElementById('resetBtn'),
        modal:           document.getElementById('customModal'),
        modalTitle:      document.getElementById('modalTitle'),
        modalMsg:        document.getElementById('modalMessage'),
        modalClose:      document.getElementById('modalClose'),
        modalLoader:     document.getElementById('modalLoader'),
        modalIcon:       document.getElementById('modalIcon'),
        resetModal:      document.getElementById('resetModal'),
        resetCodeInput:  document.getElementById('resetCodeInput'),
        confirmReset:    document.getElementById('confirmReset'),
        cancelReset:     document.getElementById('cancelReset'),
    };

    // --- إدارة الجلسة ---
    const checkSavedSession = () => {
        if (selectedEmployee && selectedBranch) {
            els.branchCard.classList.add('hidden');
            els.empSection.classList.add('hidden');

            els.savedInfo.classList.remove('hidden');
            els.displayUser.innerText   = selectedEmployee;
            els.displayBranch.innerText = selectedBranch === "Dawadimi" ? "الدوادمي" : "المزاحمية";

            els.scannerSection.classList.remove('hidden');
            startScanner();
        }
    };

    // --- اختيار الفرع ---
    document.querySelectorAll('input[name="branch"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedBranch = e.target.value;
            els.empGrid.innerHTML = "";

            branchEmployees[selectedBranch].forEach(name => {
                const btn = document.createElement('button');
                btn.type      = 'button';
                btn.className = 'emp-btn';
                btn.innerText = name;
                btn.onclick   = () => selectEmployee(name, btn);
                els.empGrid.appendChild(btn);
            });

            els.empSection.classList.remove('hidden');
            els.scannerSection.classList.add('hidden');
            if (html5QrCode) html5QrCode.stop().catch(() => {});
            lucide.createIcons();
        });
    });

    // --- اختيار الموظف ---
    function selectEmployee(name, btnElement) {
        selectedEmployee = name;
        document.querySelectorAll('.emp-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
        els.scannerSection.classList.remove('hidden');
        startScanner();
    }

    // --- تشغيل الماسح ---
    function startScanner() {
        if (html5QrCode) {
            html5QrCode.stop().catch(() => {}).then(() => initCamera());
        } else {
            initCamera();
        }
    }

    function initCamera() {
        html5QrCode = new Html5Qrcode("reader");
        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 250 },
            (decodedText) => {
                html5QrCode.stop().catch(() => {});
                sendAttendance(decodedText);
            }
        ).catch(() => {
            showModal('error', 'خطأ في الكاميرا', 'يرجى السماح بالوصول للكاميرا.');
        });
    }

    // --- إرسال الحضور ---
    function sendAttendance(qrData) {
        showModal('loading', 'جاري التحقق...', 'يتم تسجيل حضورك...');

        const payload = {
            action:       'ATTENDANCE',
            employeeName: selectedEmployee,
            branch:       selectedBranch,
            qrPayload:    qrData,
            fingerprint:  getFingerprint()
        };

        fetch(SCRIPT_URL, {
            method:  'POST',
            mode:    'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body:    JSON.stringify(payload)
        })
        .then(() => {
            localStorage.setItem('qb_staff_name',   selectedEmployee);
            localStorage.setItem('qb_staff_branch', selectedBranch);
            showModal('success', 'تم التسجيل', `شكراً ${selectedEmployee}، تم تسجيل حضورك بنجاح.`);
            setTimeout(() => location.reload(), 3000);
        })
        .catch(() => {
            showModal('error', 'خطأ في الاتصال', 'فشل الإرسال، تحقق من الإنترنت.');
        });
    }

    // --- زر إعادة التعيين ---
    if (els.resetBtn) {
        els.resetBtn.onclick = () => {
            els.resetModal.classList.remove('hidden');
            els.resetCodeInput.value = "";
            els.resetCodeInput.focus();
            lucide.createIcons();
        };
    }

    if (els.cancelReset) {
        els.cancelReset.onclick = () => {
            els.resetModal.classList.add('hidden');
        };
    }

    if (els.confirmReset) {
        els.confirmReset.onclick = () => {
            const code = els.resetCodeInput.value.trim();
            if (!code) return;

            els.resetModal.classList.add('hidden');
            showModal('loading', 'جاري التحقق...', 'يتم التحقق من كود إعادة التعيين');

            fetch(SCRIPT_URL, {
                method: 'POST',
                mode:   'no-cors',
                body:   JSON.stringify({ action: 'VERIFY_RESET', code })
            }).then(() => {
                localStorage.removeItem('qb_staff_name');
                localStorage.removeItem('qb_staff_branch');
                showModal('success', 'تمت إعادة التعيين', 'سيتم تحديث الصفحة الآن...');
                setTimeout(() => location.reload(), 2000);
            }).catch(() => {
                showModal('error', 'خطأ', 'تعذر التحقق من الكود.');
            });
        };
    }

    // --- Modal ---
    function showModal(type, title, msg) {
        els.modal.classList.remove('hidden');
        els.modalTitle.innerText = title;
        els.modalMsg.innerText   = msg;
        els.modalLoader.classList.toggle('hidden', type !== 'loading');
        els.modalClose.classList.toggle('hidden', type === 'loading');

        if (type !== 'loading') {
            const icon = type === 'success' ? 'check-circle' : 'alert-circle';
            els.modalIcon.innerHTML = `<i data-lucide="${icon}" class="${type}-icon"></i>`;
            lucide.createIcons();
        } else {
            els.modalIcon.innerHTML = '';
        }
    }

    els.modalClose.onclick = () => els.modal.classList.add('hidden');

    // --- Fingerprint ---
    const getFingerprint = () =>
        btoa(`${navigator.userAgent}|${window.screen.width}x${window.screen.height}`);

    // --- تشغيل التحقق من الجلسة ---
    checkSavedSession();
});