document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyt67iXI1eh4iH97UrMkV7SLjC5hTD60kTcSdlFnTo1taKqFJZKr8mRAUhveuLZR3Qd/exec'; 
    let currentMode = 'IN'; 
    let deviceId = localStorage.getItem('QB_DEVICE_ID');
    let branchName = localStorage.getItem('QB_BRANCH_NAME');
    
    const qrContainer = document.getElementById("qrContainer");
    let qrGenerator = new QRCode(qrContainer, {
        width: 256, height: 256, correctLevel: QRCode.CorrectLevel.H
    });

    // التحقق من الجلسة المحفوظة
    if (!deviceId || !branchName) {
        document.getElementById('setupScreen').classList.remove('hidden');
    } else {
        showMainSystem();
    }

    document.getElementById('saveSetupBtn').onclick = () => {
        const input = document.getElementById('deviceIdInput').value.trim();
        const btn = document.getElementById('saveSetupBtn');
        
        if (input) {
            btn.disabled = true;
            btn.innerText = "جاري التحقق...";

            const registrationData = {
                action: 'REGISTER_DEVICE',
                deviceId: input,
                userAgent: navigator.userAgent,
                screenRes: `${window.screen.width}x${window.screen.height}`
            };

            // استخدام Fetch مع معالجة الرد (لأننا نحتاج اسم الفرع)
            // ملاحظة: تم تغيير POST ليدعم استقبال بيانات
            fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(registrationData)
            })
            .then(res => res.text())
            .then(response => {
                if (response.startsWith("SUCCESS|")) {
                    const name = response.split("|")[1];
                    localStorage.setItem('QB_DEVICE_ID', input);
                    localStorage.setItem('QB_BRANCH_NAME', name);
                    location.reload();
                } else {
                    alert("عذراً: كود الفرع غير صحيح أو غير مسجل بالنظام.");
                    btn.disabled = false;
                    btn.innerText = "حفظ وإعداد الجهاز";
                }
            })
            .catch(err => {
                console.error(err);
                btn.disabled = false;
            });
        }
    };

    function showMainSystem() {
        document.getElementById('deviceDisplay').innerText = `فرع: ${branchName}`;
        startSystem();
    }

    function startSystem() {
        updateQR();
        setInterval(updateQR, 30000); 
        setInterval(updateTime, 1000);
    }

    function updateQR() {
        const timestamp = Date.now();
        const rawData = `${deviceId}|${currentMode}|${timestamp}`;
        const encodedData = btoa(rawData); 
        qrGenerator.clear();
        qrGenerator.makeCode(encodedData);
        
        // Timer Bar Logic
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
        // عرض الأرقام بالإنجليزية بناءً على توجيهاتك السابقة
        const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
        document.getElementById('timestamp').innerText = timeStr;
    }

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
