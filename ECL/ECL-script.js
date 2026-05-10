document.addEventListener('DOMContentLoaded', () => {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzpbU--HxS9nZwH5YOEzlpm6CNLrxbspOY0sULaxaQMY5jtmfMg6A2H0h9K5YXh4H8yOg/exec';

    const employeeDatabase = {
        "1000": "بلال الخواجة",
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
        preview: document.getElementById('imagePreview'),
        container: document.getElementById('imagePreviewContainer'),
        drop: document.getElementById('dropArea'),
        remove: document.getElementById('removeImage'),
        form: document.getElementById('cleaningReportForm'),
        submitBtn: document.querySelector('button[type="submit"]'),
        modal: document.getElementById('customModal'),
        modalTitle: document.getElementById('modalTitle'),
        modalMsg: document.getElementById('modalMessage'),
        modalIcon: document.getElementById('modalIcon'),
        modalLoader: document.getElementById('modalLoader'),
        modalClose: document.getElementById('modalClose')
    };

    let compressedImageBase64 = null;

    // ===================================================
    // إنشاء input الكاميرا
    //
    // ✅ بدون capture نهائياً — نفس حل FIL
    //    يمنع كروم من حجز مساحة مؤقتة تسبب خطأ "مساحة منخفضة"
    //
    // ✅ الـ input في document.body وليس داخل label
    //    يمنع فتح نافذة الاختيار مرتين على الكمبيوتر
    // ===================================================
    function recreateCameraInput() {
        const oldInput = document.getElementById('cameraInput');
        if (oldInput) oldInput.remove();

        const newInput = document.createElement('input');
        newInput.type = 'file';
        newInput.id = 'cameraInput';
        newInput.accept = 'image/*';
        // ❌ بدون capture نهائياً
        newInput.style.display = 'none';

        // في body وليس داخل label
        document.body.appendChild(newInput);
        newInput.addEventListener('change', handleImageChange);

        return newInput;
    }

    // فتح نافذة الاختيار عند الضغط على منطقة الرفع
    els.drop.addEventListener('click', (e) => {
        e.preventDefault();
        const input = document.getElementById('cameraInput');
        if (input) input.click();
    });

    // ===================================================
    // معالجة الصورة بعد الاختيار
    // ===================================================
    async function handleImageChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        els.submitBtn.disabled = true;
        els.submitBtn.style.opacity = "0.5";
        els.drop.style.pointerEvents = 'none';

        try {
            compressedImageBase64 = await compressImage(file, 800, 800, 0.7);
            els.preview.src = compressedImageBase64;
            els.container.classList.remove('hidden');
            els.drop.classList.add('hidden');
        } catch (error) {
            console.error("فشل في معالجة الصورة:", error);
            alert("حدث خطأ في معالجة الصورة، حاول مجدداً");
            resetImageState();
        } finally {
            els.submitBtn.disabled = false;
            els.submitBtn.style.opacity = "1";
            els.drop.style.pointerEvents = 'auto';
        }
    }

    // ===================================================
    // إعادة تعيين حالة الصورة
    // ===================================================
    function resetImageState() {
        compressedImageBase64 = null;
        els.preview.src = '';
        els.container.classList.add('hidden');
        els.drop.classList.remove('hidden');
        els.drop.style.display = '';
        recreateCameraInput();
        els.submitBtn.disabled = false;
        els.submitBtn.style.opacity = "1";
    }

    // تهيئة عند البدء
    recreateCameraInput();

    els.remove.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        resetImageState();
    });

    // ===================================================
    // اختيار موظفي الفرع
    // ===================================================
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
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    });

    // ===================================================
    // ضغط الصورة
    // ===================================================
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
                        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
                    } else {
                        if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    };

    // ===================================================
    // Modal
    // ===================================================
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

    // ===================================================
    // إرسال النموذج
    // ===================================================
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
            branch: branch.value === 'Muzahmiyah' ? 'المزاحمية' : 'الدوادمي',
            senderName: employeeDatabase[empId] || 'موظف رقم: ' + empId,
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
            resetImageState();
        })
        .catch(err => {
            showModal('error', 'خطأ في الشبكة', 'تعذر الإرسال: ' + err.message);
        });
    });
});