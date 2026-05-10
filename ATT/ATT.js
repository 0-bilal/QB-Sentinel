document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    // ⚠️ استبدل هذا الرابط بالرابط الحقيقي الناتج عن Deploy من Google Apps Script
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw9D0z8pcRAIPACEIB0YE_3st9qjSPc_ZQPSMFYyqtkQWtHSTzcB5lqDZJDg6SkfW8RdA/exec'; 

    const branchEmployees = {
        "Muzahmiyah": ["رمان", "محمد"],
        "Dawadimi": ["شاهين", "دورجا", "نسيم", "بلال"]
    };

    let selectedEmployee = "";
    let html5QrCode = null;

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
            showModal('error', 'خطأ في الكاميرا', 'يرجى السماح بالوصول للكاميرا.');
        });
    }
function sendAttendance(qrData) {
    showModal('loading', 'جاري التحقق...', 'يتم تسجيل حضورك...');

    // 1. تحويل البيانات إلى تنسيق Form لضمان توافقها مع متصفحات الجوال
    const formData = new URLSearchParams();
    formData.append('action', 'ATTENDANCE');
    formData.append('employeeName', selectedEmployee);
    formData.append('qrPayload', qrData);
    formData.append('fingerprint', getFingerprint());

    // 2. إرسال الطلب
    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // ضروري لتجنب مشاكل الـ CORS في Google Apps Script
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
    })
    .then(() => {
        // بما أن mode هو no-cors، سنفترض النجاح إذا لم يحدث Error في الإرسال
        showModal('success', 'تم الإرسال', `شكراً ${selectedEmployee}، تم إرسال الطلب بنجاح.`);
        
        // إعادة التوجيه للصفحة الرئيسية بعد 3 ثوانٍ
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    })
    .catch(err => {
        console.error('Fetch Error:', err);
        showModal('error', 'خطأ في الاتصال', 'فشل الإرسال، يرجى التأكد من تشغيل بيانات الهاتف أو الواي فاي.');
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