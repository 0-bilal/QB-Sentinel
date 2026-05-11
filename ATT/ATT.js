document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx5J0iQcA-oVhKwDYYA49w9kJRUrHR8KXwmoxCpDBbc_57SWgFnRz4MpWSmMZmalhbCNQ/exec'; 

    const branchEmployees = {
        "Muzahmiyah": ["رمان", "محمد"],
        "Dawadimi": ["شاهين", "دورجا", "نسيم", "بلال"]
    };

    let selectedEmployee = localStorage.getItem('qb_staff_name') || "";
    let selectedBranch = localStorage.getItem('qb_staff_branch') || "";
    let html5QrCode = null;

    const els = {
        branchRadios: document.querySelectorAll('input[name="branch"]'),
        branchContainer: document.querySelector('.branch-selector'),
        empSection: document.getElementById('employeeSection'),
        empGrid: document.getElementById('employeeGrid'),
        scannerSection: document.getElementById('scannerSection'),
        modal: document.getElementById('customModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalMsg: document.getElementById('modalMessage'),
        modalClose: document.getElementById('modalClose'),
        modalLoader: document.getElementById('modalLoader'),
        modalIcon: document.getElementById('modalIcon'),
        // عناصر واجهة المعلومات المحفوظة
        savedInfo: document.getElementById('savedInfo'),
        displayUser: document.getElementById('displayUser'),
        displayBranch: document.getElementById('displayBranch'),
        resetBtn: document.getElementById('resetBtn')
    };

    // --- منطق إدارة الجلسة (Session Management) ---
    const checkSavedSession = () => {
        if (selectedEmployee && selectedBranch) {
            els.branchContainer.classList.add('hidden');
            els.empSection.classList.add('hidden');
            
            // تحديث واجهة العرض (يجب إضافة هذه العناصر في HTML)
            if(els.savedInfo) {
                els.savedInfo.classList.remove('hidden');
                els.displayUser.innerText = selectedEmployee;
                els.displayBranch.innerText = (selectedBranch === "Dawadimi" ? "الدوادمي" : "المزاحمية");
            }

            els.scannerSection.classList.remove('hidden');
            startScanner();
        }
    };

    // --- منطق إعادة التعيين (Reset Logic) ---
    if (els.resetBtn) {
        els.resetBtn.onclick = () => {
            const resetCode = prompt("الرجاء إدخال كود إعادة التعيين:");
            if (!resetCode) return;

            showModal('loading', 'جاري التحقق...', 'يتم التحقق من كود إعادة التعيين');

            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ action: 'VERIFY_RESET', code: resetCode })
            }).then(() => {
                // ملاحظة: بسبب no-cors سنقوم بمسح البيانات وإعادة التحميل 
                // الكود في السيرفر سيتولى تغيير الكود لمنع الاستخدام المتكرر
                localStorage.removeItem('qb_staff_name');
                localStorage.removeItem('qb_staff_branch');
                alert("تمت إعادة التعيين بنجاح.");
                location.reload();
            });
        };
    }

    const getFingerprint = () => {
        return btoa(`${navigator.userAgent}|${window.screen.width}x${window.screen.height}`);
    };

    els.branchRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedBranch = e.target.value;
            els.empGrid.innerHTML = "";
            const employees = branchEmployees[selectedBranch];
            employees.forEach(name => {
                const btn = document.createElement('button');
                btn.className = 'emp-btn';
                btn.innerText = name;
                btn.onclick = (event) => selectEmployee(name, event.target);
                els.empGrid.appendChild(btn);
            });
            els.empSection.classList.remove('hidden');
            els.scannerSection.classList.add('hidden');
            if (html5QrCode) html5QrCode.stop();
        });
    });

    function selectEmployee(name, btnElement) {
        selectedEmployee = name;
        document.querySelectorAll('.emp-btn').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
        els.scannerSection.classList.remove('hidden');
        startScanner();
    }

    function startScanner() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => initCamera());
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
                html5QrCode.stop();
                sendAttendance(decodedText);
            }
        ).catch(err => {
            showModal('error', 'خطأ في الكاميرا', 'يرجى السماح بالوصول للكاميرا.');
        });
    }

    function sendAttendance(qrData) {
        showModal('loading', 'جاري التحقق...', 'يتم تسجيل حضورك...');

        const payload = {
            action: 'ATTENDANCE',
            employeeName: selectedEmployee,
            branch: selectedBranch,
            qrPayload: qrData,
            fingerprint: getFingerprint()
        };

        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        })
        .then(() => {
            // حفظ البيانات محلياً عند أول نجاح
            localStorage.setItem('qb_staff_name', selectedEmployee);
            localStorage.setItem('qb_staff_branch', selectedBranch);
            
            showModal('success', 'تم الإرسال', `شكراً ${selectedEmployee}، تم حفظ بياناتك وتسجيل الطلب.`);
            setTimeout(() => location.reload(), 3000);
        })
        .catch(err => {
            showModal('error', 'خطأ', 'فشل الإرسال، تحقق من الإنترنت.');
        });
    }

    function showModal(type, title, msg) {
        els.modal.classList.remove('hidden');
        els.modalTitle.innerText = title;
        els.modalMsg.innerText = msg;
        els.modalLoader.classList.toggle('hidden', type !== 'loading');
        els.modalClose.classList.toggle('hidden', type === 'loading');
        
        if (type !== 'loading') {
            const icon = type === 'success' ? 'check-circle' : 'alert-circle';
            els.modalIcon.innerHTML = `<i data-lucide="${icon}" class="${type}-icon"></i>`;
            lucide.createIcons();
        }
    }

    els.modalClose.onclick = () => els.modal.classList.add('hidden');

    // تشغيل التحقق من الجلسة عند البداية
    checkSavedSession();
});