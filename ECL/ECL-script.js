document.addEventListener('DOMContentLoaded', () => {
    // رابط النشر الخاص بـ Google Apps Script
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyS1LaTdS9ejR7vPOP-pNsOukEJiyUIA-WjS6sZZQydYUKdz1aYxINRfHKdsoWKYTTO5A/exec';

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

    // العناصر
    const els = {
        branchRadios: document.querySelectorAll('input[name="branch"]'),
        employeeGrid: document.getElementById('employeeGrid'),
        input: document.getElementById('cameraInput'),
        preview: document.getElementById('imagePreview'),
        container: document.getElementById('imagePreviewContainer'),
        drop: document.getElementById('dropArea'),
        remove: document.getElementById('removeImage'),
        form: document.getElementById('cleaningReportForm'),
        submitBtn: document.querySelector('button[type="submit"]'), // زر الإرسال
        modal: document.getElementById('customModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalMsg: document.getElementById('modalMessage'),
        modalIcon: document.getElementById('modalIcon'),
        modalLoader: document.getElementById('modalLoader'),
        modalClose: document.getElementById('modalClose')
    };

    // متغير لتخزين الصورة المضغوطة
    let compressedImageBase64 = null;

    // تغيير الموظفين بناءً على الفرع
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

    // وظيفة ضغط الصورة
    const compressImage = (file, maxWidth, maxHeight, quality) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    // معالجة اختيار الصورة
    els.input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            // 1. تعطيل زر الإرسال وتغيير شكل منطقة الرفع
            els.submitBtn.disabled = true;
            els.submitBtn.style.opacity = "0.5";
            els.drop.innerHTML = `<div class="loader-spinner"></div> <p>جاري ضغط الصورة... انتظر من فضلك</p>`;
            
            try {
                // 2. ضغط الصورة (800px جودة 0.7)
                compressedImageBase64 = await compressImage(file, 800, 800, 0.7);
                
                // 3. عرض المعاينة
                els.preview.src = compressedImageBase64;
                els.container.classList.remove('hidden');
                els.drop.classList.add('hidden');

                // 4. إعادة تفعيل الزر
                els.submitBtn.disabled = false;
                els.submitBtn.style.opacity = "1";
            } catch (error) {
                alert("خطأ في معالجة الصورة، يرجى المحاولة مرة أخرى.");
                els.remove.click();
            }
        }
    });

    // إزالة الصورة
    els.remove.onclick = () => {
        els.input.value = "";
        compressedImageBase64 = null;
        els.container.classList.add('hidden');
        els.drop.classList.remove('hidden');
        els.drop.innerHTML = `<i data-lucide="camera"></i> <span>اضغط لتصوير المعدة</span>`;
        els.submitBtn.disabled = false;
        els.submitBtn.style.opacity = "1";
        lucide.createIcons();
    };

    // إظهار المودال
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

    // إرسال النموذج
    els.form.addEventListener('submit', (e) => {
        e.preventDefault();

        const branch = document.querySelector('input[name="branch"]:checked');
        const empName = document.querySelector('input[name="employeeName"]:checked');
        const equipment = document.querySelector('input[name="equipment"]:checked');
        const empId = document.getElementById('employeeId').value;

        if (!branch || !empName || !equipment || !compressedImageBase64) {
            showModal('error', 'بيانات ناقصة', 'يرجى إكمال جميع الحقول وتصوير المعدة.');
            return;
        }

        showModal('loading', 'جاري الإرسال', 'يرجى الانتظار...');

        const payload = {
            branch: branch.value === "Muzahmiyah" ? "المزاحمية" : "الدوادمي",
            senderName: employeeDatabase[empId] || "موظف رقم: " + empId,
            cleanerName: empName.value,
            equipmentAr: equipment.parentElement.querySelector('span').innerText,
            equipmentEn: equipment.parentElement.querySelector('small').innerText,
            equipmentId: equipment.getAttribute('data-id'),
            image: compressedImageBase64
        };

        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        })
        .then(() => {
            showModal('success', 'تم الإرسال', 'تم إرسال تقرير النظافة بنجاح.');
            els.form.reset();
            els.remove.click();
        })
        .catch(err => {
            showModal('error', 'خطأ في الشبكة', 'تعذر الإرسال: ' + err.message);
        });
    });
});
