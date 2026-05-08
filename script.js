document.addEventListener('DOMContentLoaded', () => {
    // ⚠️ رابط النشر الخاص بك
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytKqA0y-YWMiy_VOAdd6GQrhcNprzpSUCRDcjAlsrx6NN4-WKWCOV9d1KfdiSdQL8W/exec';

    const employeeDatabase = {
        "1000": "بلال",
        "1101": "رمان",
        "1311": "محمد",
        "1551": "شاهين",
        "1421": "نسيم",
        "1711": "دورجا"
    };

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

    els.branchRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const selectedBranch = e.target.value;
            const employees = branchEmployees[selectedBranch] || [];
            els.employeeGrid.innerHTML = ''; 
            employees.forEach((emp, index) => {
                const id = `emp_${index}`;
                els.employeeGrid.innerHTML += `
                    <div class="employee-option">
                        <input type="radio" id="${id}" name="employeeName" value="${emp.ar}" required>
                        <label for="${id}" class="branch-tile">
                            <i data-lucide="user"></i>
                            <div class="tile-text">
                                <span>${emp.ar}</span>
                                <small>${emp.en}</small>
                            </div>
                        </label>
                    </div>`;
            });
            lucide.createIcons();
        });
    });

    const showModal = (type, title, message) => {
        els.modal.classList.remove('hidden');
        els.modalTitle.innerText = title;
        els.modalMsg.innerText = message;
        els.modalLoader.classList.add('hidden');
        els.modalClose.classList.add('hidden');
        if (type === 'loading') { els.modalLoader.classList.remove('hidden'); }
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
            const reader = new FileReader();
            reader.onload = (ev) => {
                els.preview.src = ev.target.result;
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
    };

    els.form.addEventListener('submit', (e) => {
        e.preventDefault();

        const branch = document.querySelector('input[name="branch"]:checked');
        const empName = document.querySelector('input[name="employeeName"]:checked');
        const equipment = document.querySelector('input[name="equipment"]:checked');
        const empId = document.getElementById('employeeId').value;
        const file = els.input.files[0];

        if (!branch || !empName || !equipment || !file) {
            showModal('error', 'بيانات ناقصة', 'يرجى إكمال جميع الحقول والتقاط الصورة.');
            return;
        }

        showModal('loading', 'جاري الإرسال', 'يرجى الانتظار، يتم الآن رفع البيانات والصورة إلى السجل...');

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function() {
            const base64Data = reader.result;
            
            const payload = {
                branch: branch.value === "Muzahmiyah" ? "المزاحمية" : "الدوادمي",
                senderName: employeeDatabase[empId] || "موظف رقم: " + empId,
                cleanerName: empName.value,
                equipmentAr: equipment.parentElement.querySelector('span').innerText,
                equipmentEn: equipment.parentElement.querySelector('small').innerText,
                equipmentId: equipment.getAttribute('data-id'),
                image: base64Data
            };

            // حل مشكلة CORS عبر إرسال البيانات كـ text/plain
            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // نتجنب فحص CORS
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload)
            })
            .then(() => {
                // في وضع no-cors لا يمكن قراءة الرد، لذا نفترض النجاح إذا لم يحدث خطأ شبكة
                showModal('success', 'تم بنجاح', 'تم تسجيل البيانات في شيت جوجل وحفظ الصورة بنجاح.');
                els.form.reset();
                els.remove.click();
            })
            .catch(err => {
                showModal('error', 'خطأ في الشبكة', 'تعذر الوصول للسيرفر: ' + err.message);
            });
        };
    });
});
