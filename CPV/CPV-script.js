    document.addEventListener('DOMContentLoaded', () => {
    // الرابط الخاص بجوجل سكريبت (تأكد من تحديثه بعد النشر)
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxVnvzmLQPvFYS3fS2jZy5tANVhcGbLo9HDpkjnaqNjmZu_VIsJO07Df1G2Un7Plzuu5w/exec';

    // قاعدة بيانات الموظفين
    const employeeDatabase = {
        "1000": "بلال",
        "1101": "رمان",
        "1311": "محمد",
        "1551": "شاهين",
        "1421": "نسيم",
        "1711": "دورجا"
    };

    // تعريف عناصر الواجهة
    const els = {
        form: document.getElementById('paymentVoucherForm'),
        submitBtn: document.getElementById('submitBtn'),
        modal: document.getElementById('customModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalMsg: document.getElementById('modalMessage'),
        modalIcon: document.getElementById('modalIcon'),
        modalLoader: document.getElementById('modalLoader'),
        modalClose: document.getElementById('modalClose')
    };

    // دالة إظهار المودال (الرسائل المنبثقة)
    const showModal = (type, title, message) => {
        els.modal.classList.remove('hidden');
        els.modalTitle.innerText = title;
        els.modalMsg.innerText = message;
        els.modalLoader.classList.add('hidden');
        els.modalClose.classList.add('hidden');
        els.modalIcon.innerHTML = '';

        if (type === 'loading') {
            els.modalLoader.classList.remove('hidden');
        } else {
            els.modalClose.classList.remove('hidden');
            const iconName = type === 'success' ? 'check-circle' : 'alert-circle';
            els.modalIcon.innerHTML = `<i data-lucide="${iconName}" class="${type}-icon"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    };

    els.modalClose.onclick = () => els.modal.classList.add('hidden');

    // معالجة إرسال النموذج
    els.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // جلب القيم من الحقول
        const branchRadio = document.querySelector('input[name="branch"]:checked');
        const empId = document.getElementById('employeeId').value;
        const reason = document.getElementById('paymentReason').value;
        const amount = document.getElementById('amount').value;
        const beneficiary = document.getElementById('beneficiaryPhone').value;

        // 1. التحقق من الحقول الإلزامية
        if (!branchRadio || !empId || !reason || !amount) {
            showModal('error', 'بيانات ناقصة', 'يرجى إكمال جميع الحقول المطلوبة.');
            return;
        }

        // 2. التحقق من اسم الموظف عبر الرقم الوظيفي
        const employeeName = employeeDatabase[empId];
        if (!employeeName) {
            showModal('error', 'خطأ في التحقق', 'رقم الموظف المدخل غير مسجل في النظام.');
            return;
        }

        // إظهار حالة التحميل
        showModal('loading', 'جاري الإرسال', 'يرجى الانتظار، يتم تسجيل سند الصرف...');
        els.submitBtn.disabled = true;
        els.submitBtn.style.opacity = "0.7";

        // 3. تجهيز البيانات (الأرقام والتواريخ يتم التعامل معها في السيرفر لضمان اللغة الإنجليزية)
        const payload = {
            branch: branchRadio.value === 'Muzahmiyah' ? 'المزاحمية' : 'الدوادمي',
            employeeName: employeeName,
            reason: reason,
            amount: amount,
            beneficiary: beneficiary || "None",
            type: "PV"
        };

        try {
            // الإرسال إلى Google Apps Script
            // ملاحظة: نستخدم mode: 'no-cors' لتجنب مشاكل الـ CORS في المتصفح
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            });

            // نجاح العملية
            showModal('success', 'تم الإرسال بنجاح', 'تم تسجيل سند الصرف وإرسال إشعار التليجرام.');
            els.form.reset();
            
        } catch (error) {
            console.error("Submission Error:", error);
            showModal('error', 'فشل في الإرسال', 'حدث خطأ أثناء الاتصال بالسيرفر. يرجى المحاولة لاحقاً.');
        } finally {
            els.submitBtn.disabled = false;
            els.submitBtn.style.opacity = "1";
        }
    });
});
