let deviceId = localStorage.getItem('QB_DEVICE_ID') || "";
let branchName = localStorage.getItem('QB_BRANCH_NAME') || "";
let branchCode = localStorage.getItem('QB_BRANCH_CODE') || "";
let currentMode = 'IN';

const qrGenerator = new QRCode(document.getElementById("qrContainer"), {
    width: 250,
    height: 250
});

async function getDeviceIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (e) { return "0.0.0.0"; }
}

// إعداد الجهاز (تعديل الـ HTML مطلوب ليشمل الحقول الجديدة)
document.getElementById('saveSetupBtn')?.addEventListener('click', async () => {
    const idInput = document.getElementById('deviceIdInput').value;
    const nameInput = document.getElementById('branchNameInput').value;
    const codeInput = document.getElementById('branchCodeInput').value;

    if (!idInput || !nameInput || !codeInput) return alert("أكمل البيانات!");

    const ip = await getDeviceIP();

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: new URLSearchParams({
            action: 'REGISTER_DEVICE',
            deviceId: idInput,
            branchName: nameInput,
            branchCode: codeInput,
            ipAddress: ip
        })
    }).then(() => {
        localStorage.setItem('QB_DEVICE_ID', idInput);
        localStorage.setItem('QB_BRANCH_NAME', nameInput);
        localStorage.setItem('QB_BRANCH_CODE', codeInput);
        location.reload();
    });
});

function updateQR() {
    if (!deviceId || !branchCode) return;
    const timestamp = Date.now();
    // البيانات المشفرة تشمل اسم الفرع وكوده
    const rawData = `${deviceId}|${branchName}|${currentMode}|${timestamp}|${branchCode}`;
    const encodedData = btoa(unescape(encodeURIComponent(rawData)));
    
    qrGenerator.clear();
    qrGenerator.makeCode(encodedData);
    document.getElementById('timestamp').innerText = new Date().toLocaleTimeString('en-US');
}

setInterval(updateQR, 15000);