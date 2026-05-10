document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    // تأكد من استخدام نفس رابط النشر الخاص بجوجل سكريبت هنا
    const SCRIPT_URL = 'رابط_النشر_الخاص_بك_هنا'; 

    const branchEmployees = {
        "Muzahmiyah": ["رمان", "محمد"],
        "Dawadimi": ["شاهين", "دورجا", "نسيم", "بلال"]
    };

    let selectedEmployee = "";
    let html5QrCode = null;

    // توليد بصمة الجهاز الفريدة لهاتف الموظف
    const getFingerprint = () => {
        return btoa(`${navigator.userAgent}|${window.screen.width}x${window.screen.height}`);
    };

    const els = {
        branchRadios: document.querySelectorAll('input[name="branch"]'),
        empSection: document.getElementById('employeeSection'),
        empGrid: document.getElementById('employeeGrid'),
        scannerSection: document.getElementById('scannerSection'),
        modal: document.getElementById('customModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalMsg: document.getElementById('modalMessage'),
        modalClose: document.getElementById('modalClose'),
        modalLoader: document.getElementById('modalLoader'),
        modalIcon: document.getElementById('modalIcon')
    };

    // معالجة اختيار الفرع
    els.branchRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            els.empGrid.innerHTML = "";
            const employees = branchEmployees[e.target.value];
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
            console.error("Camera Error", err);
            showModal('error', 'خطأ في الكاميرا', 'يرجى السماح بالوصول للكاميرا.');
        });
    }

    function sendAttendance(qrData) {
        showModal('loading', 'جاري التحقق...', 'يتم الآن مطابقة البيانات مع الآيباد...');

        const payload = {
            action: 'ATTENDANCE', // ليعرف السكريبت أن هذا طلب حضور
            employeeName: selectedEmployee,
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
            showModal('success', 'تم تسجيل الحضور', `شكراً ${selectedEmployee}، تم تسجيل العملية بنجاح.`);
            setTimeout(() => location.href = 'index.html', 3000);
        })
        .catch(err => {
            showModal('error', 'فشل في الإرسال', 'يرجى التأكد من اتصال الإنترنت والمحاولة مرة أخرى.');
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
});