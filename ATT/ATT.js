const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzi0Abk9g2AtOD5c8ue-ELSCXQxmrN_OKDFeStWs8KRkVFlqPIdplk-FXrOgaJ0EsIhuQ/exec";
let selectedEmployee = "";
let selectedBranch = "";

document.addEventListener('DOMContentLoaded', () => {
    checkLockedStatus(); // فحص إذا كان الجهاز مسجل مسبقاً
    
    // عند تغيير الفرع، نقوم بتحديث المتغير
    document.querySelectorAll('input[name="branch"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedBranch = e.target.value;
        });
    });
});

async function getPublicIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (e) { return "0.0.0.0"; }
}

function checkLockedStatus() {
    const savedName = localStorage.getItem('qb_emp_name');
    const savedBranch = localStorage.getItem('qb_emp_branch');
    const savedCode = localStorage.getItem('qb_emp_code');

    if (savedName && savedBranch) {
        selectedEmployee = savedName;
        selectedBranch = savedBranch;
        document.getElementById('branchCodeInput').value = savedCode || "";
        document.getElementById('branchConfigSection').classList.add('locked');
        document.querySelector('.branch-selector').classList.add('locked');
        document.getElementById('resetBtn').classList.remove('hidden');
        console.log("الواجهة مقفولة للموظف: " + savedName);
    }
}

async function sendAttendance(qrData) {
    showModal('loading', 'جاري التحقق...', 'يتم تسجيل حضورك...');
    const userIp = await getPublicIP();
    const branchCode = document.getElementById('branchCodeInput').value;

    if (!branchCode) {
        showModal('error', 'خطأ', 'يرجى إدخال كود الفرع أولاً');
        return;
    }

    // حفظ البيانات (Session)
    localStorage.setItem('qb_emp_name', selectedEmployee);
    localStorage.setItem('qb_emp_branch', selectedBranch);
    localStorage.setItem('qb_emp_code', branchCode);

    const formData = new URLSearchParams();
    formData.append('action', 'ATTENDANCE');
    formData.append('employeeName', selectedEmployee);
    formData.append('employeeBranch', selectedBranch);
    formData.append('empBranchCode', branchCode);
    formData.append('qrPayload', qrData);
    formData.append('ipAddress', userIp);
    formData.append('fingerprint', getFingerprint());

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
    }).then(() => {
        showModal('success', 'تمت العملية', `شكراً ${selectedEmployee}، تم التسجيل بنجاح.`);
        setTimeout(() => location.reload(), 3000);
    }).catch(() => showModal('error', 'خطأ', 'فشل في الاتصال بالسيرفر'));
}

async function resetEmployeeDevice() {
    const code = prompt("أدخل رمز الوصول لإعادة التهيئة:");
    if (!code) return;

    const response = await fetch(`${SCRIPT_URL}?action=VERIFY_RESET_CODE&code=${code}&type=STAFF`);
    const result = await response.json();

    if (result.status === "success") {
        localStorage.clear();
        alert("تمت إعادة التهيئة بنجاح.");
        location.reload();
    } else {
        alert("رمز الوصول غير صحيح!");
    }
}

function getFingerprint() {
    return btoa(navigator.userAgent + screen.width + "x" + screen.height);
}