document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    // --- الإعدادات ---
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx5J0iQcA-oVhKwDYYA49w9kJRUrHR8KXwmoxCpDBbc_57SWgFnRz4MpWSmMZmalhbCNQ/exec'; 
    let currentMode = 'IN'; 
    let deviceId = localStorage.getItem('QB_DEVICE_ID');
    
    const qrContainer = document.getElementById("qrContainer");
    let qrGenerator = new QRCode(qrContainer, {
        width: 256,
        height: 256,
        correctLevel: QRCode.CorrectLevel.H
    });

    // --- التحقق من تسجيل الجهاز ---
    if (!deviceId) {
        document.getElementById('setupScreen').classList.remove('hidden');
    } else {
        document.getElementById('deviceDisplay').innerText = `جهاز: ${deviceId}`;
        startSystem();
    }

    // --- وظيفة تسجيل الجهاز لأول مرة ---
    document.getElementById('saveSetupBtn').onclick = () => {
        const input = document.getElementById('deviceIdInput').value.trim();
        if (input) {
            deviceId = input;
            localStorage.setItem('QB_DEVICE_ID', deviceId);
            
            // إرسال بيانات البصمة الأمنية للآيباد للتسجيل في الشيت
            const registrationData = {
                action: 'REGISTER_DEVICE',
                deviceId: deviceId,
                userAgent: navigator.userAgent,
                screenRes: `${window.screen.width}x${window.screen.height}`,
                platform: navigator.platform
            };

            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(registrationData)
            }).then(() => {
                location.reload();
            });
        }
    };

    function startSystem() {
        updateQR();
        setInterval(updateQR, 30000); // تحديث الكود كل 30 ثانية للأمان
        setInterval(updateTime, 1000);
    }

    function updateQR() {
        const timestamp = Date.now();
        // تشفير: معرف الجهاز | العملية | الوقت
        const rawData = `${deviceId}|${currentMode}|${timestamp}`;
        const encodedData = btoa(rawData); 
        
        qrGenerator.clear();
        qrGenerator.makeCode(encodedData);
        
        // تحديث شريط الوقت المرئي
        const bar = document.getElementById('timerBar');
        if (bar) {
            bar.style.transition = 'none';
            bar.style.width = '100%';
            setTimeout(() => {
                bar.style.transition = 'width 30s linear';
                bar.style.width = '0%';
            }, 100);
        }
    }

    function updateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
        document.getElementById('timestamp').innerText = timeStr;
    }

    // --- التحكم في الأزرار ---
    document.getElementById('btnIn').onclick = () => {
        currentMode = 'IN';
        document.getElementById('processTitle').innerText = 'تسجيل حضور';
        document.getElementById('processTitle').style.color = '#2e7d32';
        updateQR();
    };

    document.getElementById('btnOut').onclick = () => {
        currentMode = 'OUT';
        document.getElementById('processTitle').innerText = 'تسجيل انصراف';
        document.getElementById('processTitle').style.color = '#c62828';
        updateQR();
    };
});
