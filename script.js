document.addEventListener('DOMContentLoaded', () => {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwqScF8nFaYDxxYicsvH53wQ_Irag55ABgycAYgWN7KihYZJyxY9HnBQ6ur6Z7XWPtL/exec';


const employeeDatabase = {
    "1000": "بلال",
    "1101": "رمان",
    "1311": "محمد",
    "1551": "شاهين",
    "1421": "نسيم",
    "1711": "دورجا"
    // أضف بقية الموظفين هنا بنفس التنسيق
};

    // قاعدة بيانات الموظفين (بالعربي والإنجليزي)
    const branchEmployees = {
        "Muzahmiyah": [
            { ar: "رمان", en: "Rumaan" },
            { ar: "محمد", en: "Mohamed" }

        ],
        "Dawadimi": [
            { ar: "شاهين", en: "Shahin" },
            { ar: "دورجا", en: "Dwrja" },
            { ar: "نسيم", en: "Nasim" }
        ]
    };

    const els = {
        branchRadios: document.querySelectorAll('input[name="branch"]'),
        employeeGrid: document.getElementById('employeeGrid'),
        input: document.getElementById('cameraInput'),
        preview: document.getElementById('imagePreview'),
        container: document.getElementById('imagePreviewContainer'),
        drop: document.getElementById('dropArea'),
        remove: document.getElementById('removeImage'),
        form: document.getElementById('cleaningReportForm'),
        modal: document.getElementById('customModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalMsg: document.getElementById('modalMessage'),
        modalIcon: document.getElementById('modalIcon'),
        modalLoader: document.getElementById('modalLoader'),
        modalClose: document.getElementById('modalClose')
    };

    // 1. تحديث قائمة الموظفين عند اختيار الفرع (بنفس مظهر الفروع)
    els.branchRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const selectedBranch = e.target.value;
            const employees = branchEmployees[selectedBranch] || [];
            
            els.employeeGrid.innerHTML = ''; // مسح المحتوى القديم

            employees.forEach((emp, index) => {
                const id = `emp_${index}`;
                const tile = document.createElement('div');
                tile.innerHTML = `
                    <input type="radio" id="${id}" name="employeeName" value="${emp.ar}" required>
                    <label for="${id}" class="branch-tile">
                        <i data-lucide="user"></i>
                        <div class="tile-text">
                            <span>${emp.ar}</span>
                            <small>${emp.en}</small>
                        </div>
                    </label>
                `;
                els.employeeGrid.appendChild(tile.firstElementChild);
                els.employeeGrid.appendChild(tile.lastElementChild);
            });
            lucide.createIcons(); // تفعيل الأيقونات للبطاقات الجديدة
        });
    });

    // وظائف المنبثق والمعاينة (كما في الكود السابق)
    const showModal = (type, title, message) => {
        els.modal.classList.remove('hidden');
        els.modalTitle.innerText = title;
        els.modalMsg.innerText = message;
        els.modalLoader.classList.add('hidden');
        els.modalClose.classList.add('hidden');
        if (type === 'loading') els.modalLoader.classList.remove('hidden');
        else {
            els.modalClose.classList.remove('hidden');
            const icon = type === 'success' ? 'check-circle' : 'alert-circle';
            els.modalIcon.innerHTML = `<i data-lucide="${icon}" class="${type}-icon"></i>`;
            lucide.createIcons();
        }
    };

    els.modalClose.onclick = () => els.modal.classList.add('hidden');

    els.input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            els.preview.src = URL.createObjectURL(file);
            els.container.classList.remove('hidden');
            els.drop.classList.add('hidden');
        }
    });

    els.remove.onclick = () => {
        els.input.value = "";
        els.container.classList.add('hidden');
        els.drop.classList.remove('hidden');
    };

    // إرسال النموذج
    els.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const branch = document.querySelector('input[name="branch"]:checked');
        const empName = document.querySelector('input[name="employeeName"]:checked');
        const equipment = document.querySelector('input[name="equipment"]:checked');
        const empIdInput = document.getElementById('employeeId').value;

        if (!branch || !empName || !equipment || !els.input.files[0]) {
            showModal('error', 'نقص بيانات', 'يرجى اختيار الفرع والموظف والمعدة والتقاط صورة');
            return;
        }

        showModal('loading', 'جاري الإرسال', 'يرجى الانتظار...');

        const equipmentAr = equipment.parentElement.querySelector('span').innerText.split(' (ID:')[0];
        const equipmentEn = equipment.parentElement.querySelector('small').innerText;
        
        const reader = new FileReader();
        reader.readAsDataURL(els.input.files[0]);
        reader.onload = async () => {
const payload = {
    branch: branch.nextElementSibling.querySelector('span').innerText,
    senderName: employeeDatabase[empIdInput] || "موظف غير معروف", // البحث عن الاسم باستخدام الرقم
    cleanerName: empName.value,
    equipmentAr: equipmentAr,
    equipmentEn: equipmentEn,
    equipmentId: equipment.getAttribute('data-id'),
    image: reader.result
};

            try {
                await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
                showModal('success', 'تم الإرسال', 'تم حفظ التقرير وتصفير النموذج بنجاح');
                els.form.reset();
                els.employeeGrid.innerHTML = '<p class="placeholder-text">يرجى اختيار الفرع أولاً...</p>';
                els.remove.click();
            } catch (error) {
                showModal('error', 'خطأ', 'تعذر الاتصال بالخادم');
            }
        };
    });
});