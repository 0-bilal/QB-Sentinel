document.addEventListener('DOMContentLoaded', () => {
    // رابط Google Apps Script الخاص بك
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxU2Qg-0qTFh8foxZ9lZDEKwM6oAJfBbO4N8tRn8XKitjXvu8mh3u4ph7dqcFyzA8I/exec';

    // قاعدة بيانات الموظفين للتحقق من الرقم الوظيفي
    const employeeDatabase = {
        "1000": "بلال",
        "1101": "رمان",
        "1311": "محمد",
        "1551": "شاهين",
        "1421": "نسيم",
        "1711": "دورجا"
    };

    // قائمة الموظفين حسب الفرع
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

    // العناصر البرمجية (DOM Elements)
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

    // 1. تحديث قائمة الموظفين عند تغيير الفرع
    els.branchRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const selectedBranch = e.target.value;
            const employees = branchEmployees[selectedBranch] || [];
            
            els.employeeGrid.innerHTML = ''; // مسح المحتوى القديم

            employees.forEach((emp, index) => {
                const id = `emp_${index}`;
                const tile = document.createElement('div');
                tile.className = "employee-option"; // كلاس اختياري للتنسيق
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
                els.employeeGrid.appendChild(tile);
            });
            lucide.createIcons(); 
        });
    });

    // 2. وظائف الرسائل المنبثقة (Modal)
    const showModal = (type, title, message) => {
        els.modal.classList.remove('hidden');
        els.modalTitle.innerText = title;
        els.modalMsg.innerText = message;
        els.modalLoader.classList.add('hidden');
        els.modalClose.classList.add('hidden');
        
        if (type === 'loading') {
            els.modalLoader.classList.remove('hidden');
        } else {
            els.modalClose.classList.remove('hidden');
            const icon = type === 'success' ? 'check-circle' : 'alert-circle';
            els.modalIcon.innerHTML = `<i data-lucide="${icon}" class="${type}-icon"></i>`;
            lucide.createIcons();
        }
    };

    els.modalClose.onclick = () => els.modal.classList.add('hidden');

    // 3. معاينة الصورة الملتقطة
    els.input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                els.preview.src = event.target.result;
                els.container.classList.remove('hidden');
                els.drop.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    els.remove.onclick = () => {
        els.input.value = "";
        els.container.classList.add('hidden');
        els.drop.classList.remove('hidden');
        els.preview.src = "";
    };

    // 4. إرسال النموذج ومعالجة البيانات
    els.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // تجميع عناصر التحقق
        const branchInput = document.querySelector('input[name="branch"]:checked');
        const empNameInput = document.querySelector('input[name="employeeName"]:checked');
        const equipmentInput = document.querySelector('input[name="equipment"]:checked');
        const empIdValue = document.getElementById('employeeId').value.trim();
        const photoFile = els.input.files[0];

        // فحص البيانات المطلوبة قبل الإرسال
        if (!branchInput || !empNameInput || !equipmentInput || !photoFile || !empIdValue) {
            showModal('error', 'بيانات ناقصة', 'يرجى إكمال جميع الحقول والتقاط صورة الجهاز.');
            return;
        }

        showModal('loading', 'جاري إرسال التقرير', 'يرجى الانتظار حتى اكتمال رفع البيانات والصورة...');

        // استخراج نصوص المعدة
        const equipmentAr = equipmentInput.parentElement.querySelector('span').innerText;
        const equipmentEn = equipmentInput.parentElement.querySelector('small').innerText;
        const equipmentId = equipmentInput.getAttribute('data-id');

        // قراءة الصورة كـ Base64 وإرسال الطلب
        const reader = new FileReader();
        reader.readAsDataURL(photoFile);
        reader.onload = async () => {
            const payload = {
                branch: branchInput.nextElementSibling.querySelector('span').innerText,
                senderName: employeeDatabase[empIdValue] || "موظف غير معروف (" + empIdValue + ")",
                cleanerName: empNameInput.value,
                equipmentAr: equipmentAr,
                equipmentEn: equipmentEn,
                equipmentId: equipmentId,
                image: reader.result // ملف الـ Base64
            };

            try {
                // إرسال البيانات باستخدام fetch بصيغة POST
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors', // ضروري لطلبات Apps Script من متصفح خارجي
                    body: JSON.stringify(payload)
                });

                // ملاحظة: مع no-cors لن نتمكن من قراءة الـ JSON العائد، سنفترض النجاح إذا لم يحدث Error
                showModal('success', 'تم بنجاح', 'تم تسجيل عملية التنظيف ورفع الصورة بنجاح.');
                
                // إعادة ضبط النموذج
                els.form.reset();
                els.employeeGrid.innerHTML = '<span>يرجى اختيار الفرع</span><small>Please select the branch</small>';
                els.remove.click();

            } catch (error) {
                console.error("Submission error:", error);
                showModal('error', 'فشل الإرسال', 'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت.');
            }
        };

        reader.onerror = () => {
            showModal('error', 'خطأ في الصورة', 'فشل في معالجة ملف الصورة.');
        };
    });
});
