document.addEventListener('DOMContentLoaded', () => {

    // ===================================================
    // رابط Google Apps Script (سيتم استبداله لاحقاً عند الربط)
    // ===================================================
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyFPschAXnLhXweuYS_LAQwPQZje3Cj2MbXLWa8q5ZE6JSDdYP0h4ytam8gAJqaT-r4wA/exec';

    // ===================================================
    // قاعدة بيانات الموظفين (نفس النمط المستخدم في FIL)
    // ===================================================
    const employeeDatabase = {
        "1000": "بلال الخواجة",
        "1101": "رمان",
        "1311": "محمد",
        "1551": "شاهين",
        "1421": "نسيم",
        "1711": "دورجا"
    };

    // ===================================================
    // تعريف الحقول المالية موزعة على ثلاثة أقسام
    // key      : اسم العمود المرسل لجوجل شيت
    // ar / en  : التسميات
    // icon     : أيقونة Lucide
    // required : هل الحقل إلزامي
    // inSales  : هل يدخل ضمن حساب إجمالي المبيعات التلقائي
    // group    : القسم الذي ينتمي له الحقل
    // ===================================================
    const fields = [
        // --- قسم المبيعات ---
        { key: 'cashSales',     ar: 'مبيعات الكاش',           en: 'Cash Sales',          icon: 'banknote',     required: true,  inSales: true,  group: 'sales'   },
        { key: 'networkTotal',  ar: 'إجمالي الشبكة',          en: 'Network Total',       icon: 'credit-card',  required: true,  inSales: true,  group: 'sales'   },
        { key: 'jahezTotal',    ar: 'إجمالي تطبيق جاهز',      en: 'Jahez App Total',     icon: 'smartphone',   required: true,  inSales: true,  group: 'sales'   },
        { key: 'hungerTotal',   ar: 'إجمالي تطبيق هنقرستيشن', en: 'HungerStation Total', icon: 'smartphone',   required: true,  inSales: true,  group: 'sales'   },
        { key: 'daySalesTotal', ar: 'إجمالي المبيعات لليوم',  en: 'Total Day Sales',     icon: 'trending-up',  required: true,  inSales: false, group: 'sales'   },

        // --- قسم الكاش ---
        { key: 'fullCashTotal', ar: 'إجمالي الكاش الكامل',    en: 'Full Cash Total',     icon: 'wallet',       required: true,  inSales: false, group: 'cash'    },

        // --- قسم العهدة والمشتريات ---
        { key: 'custodyRemain', ar: 'المتبقي من العهدة',      en: 'Remaining Custody',   icon: 'landmark'  ,   required: true,  inSales: false, group: 'custody' },
        { key: 'purchases',     ar: 'مبلغ المشتريات',         en: 'Purchases Amount',    icon: 'shopping-cart',required: false, inSales: false, group: 'custody' }
    ];

    // حاويات الأقسام
    const grids = {
        sales:   document.getElementById('salesGrid'),
        cash:    document.getElementById('cashGrid'),
        custody: document.getElementById('custodyGrid')
    };

    const els = {
        form:        document.getElementById('edrReportForm'),
        submitBtn:   document.getElementById('submitBtn'),
        employeeId:  document.getElementById('employeeId'),
        calcSales:   document.getElementById('calcSales'),
        calcDiff:    document.getElementById('calcDiff'),
        summaryHint: document.getElementById('summaryHint'),
        modal:        document.getElementById('customModal'),
        modalIcon:    document.getElementById('modalIcon'),
        modalTitle:   document.getElementById('modalTitle'),
        modalMessage: document.getElementById('modalMessage'),
        modalLoader:  document.getElementById('modalLoader'),
        modalClose:   document.getElementById('modalClose')
    };

    // ===================================================
    // بناء الحقول المالية ديناميكياً داخل كل قسم
    // ===================================================
    function buildField(field) {
        const row = document.createElement('div');
        row.className = 'field-row';
        row.setAttribute('data-field', field.key);
        row.innerHTML = `
            <div class="field-head">
                <div class="field-icon">
                    <i data-lucide="${field.icon}"></i>
                </div>
                <div class="field-text">
                    <span class="field-name">
                        ${field.ar}
                        ${field.required
                            ? '<span class="req-star">*</span>'
                            : '<span class="opt-tag">(اختياري)</span>'}
                    </span>
                    <span class="field-en">${field.en}</span>
                </div>
            </div>
            <div class="field-input-wrap">
                <input type="number" inputmode="decimal" step="0.01" min="0"
                       class="field-value" data-field="${field.key}"
                       data-in-sales="${field.inSales}" placeholder="0.00"
                       enterkeyhint="next">
                <span class="currency-tag">ر.س</span>
            </div>
        `;
        return row;
    }

    fields.forEach(field => {
        const target = grids[field.group];
        if (target) target.appendChild(buildField(field));
    });
    lucide.createIcons();

    // ===================================================
    // طي / فتح الأقسام (مفتوحة افتراضياً)
    // ===================================================
    document.querySelectorAll('.section-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.section-card');
            card.classList.toggle('open');
        });
    });

    // ===================================================
    // قائمة الحقول بالترتيب (لمنطق "التالي")
    // employeeId أولاً ثم بقية الحقول المالية بترتيب ظهورها
    // ===================================================
    const allInputs = [
        els.employeeId,
        ...document.querySelectorAll('.field-value')
    ];

    // ===================================================
    // توسيط الحقل في منتصف الشاشة عند التركيز عليه
    // ===================================================
    function centerField(input) {
        const row = input.closest('.field-row') || input.closest('.card');
        if (!row) return;

        // تأخير بسيط حتى يظهر الكيبورد ويُعاد ضبط المقاسات
        setTimeout(() => {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 280);
    }

    // ===================================================
    // التنقل بزر "التالي" في كيبورد الهاتف
    // ينقل للحقل التالي، وفي الأخير يُغلق الكيبورد فقط
    // دون أي تأثير على زر الإرسال
    // ===================================================
    function focusNext(currentInput) {
        const idx = allInputs.indexOf(currentInput);
        if (idx === -1) return;

        const next = allInputs[idx + 1];
        if (next) {
            // فتح القسم الخاص بالحقل التالي إن كان مطوياً
            const nextCard = next.closest('.section-card');
            if (nextCard && !nextCard.classList.contains('open')) {
                nextCard.classList.add('open');
            }
            next.focus();
        } else {
            // آخر حقل: إغلاق الكيبورد فقط دون إرسال
            currentInput.blur();
        }
    }

    allInputs.forEach(input => {
        if (!input) return;

        // توسيط الحقل عند التركيز
        input.addEventListener('focus', () => {
            centerField(input);
            const row = input.closest('.field-row');
            if (row) row.classList.add('is-focused');
        });

        input.addEventListener('blur', () => {
            const row = input.closest('.field-row');
            if (row) row.classList.remove('is-focused');
        });

        // التقاط زر "التالي" / Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // يمنع أي إرسال للنموذج
                focusNext(input);
            }
        });
    });

    // ===================================================
    // الحساب التلقائي للملخص
    // إجمالي المبيعات المحسوب = كاش + شبكة + جاهز + هنقرستيشن
    // فرق المطابقة = إجمالي المبيعات لليوم - الإجمالي المحسوب
    // ===================================================
    function recalcSummary() {
        let calculated = 0;
        document.querySelectorAll('.field-value').forEach(input => {
            if (input.getAttribute('data-in-sales') === 'true') {
                calculated += parseFloat(input.value) || 0;
            }
        });

        const daySales = parseFloat(
            document.querySelector('.field-value[data-field="daySalesTotal"]').value
        ) || 0;

        const diff = daySales - calculated;

        els.calcSales.innerText = calculated.toFixed(2);
        els.calcDiff.innerText  = diff.toFixed(2);

        els.calcDiff.classList.remove('match-ok', 'match-bad');
        if (daySales === 0 && calculated === 0) {
            els.summaryHint.innerText = 'أدخل القيم لمطابقة إجمالي المبيعات تلقائياً.';
        } else if (Math.abs(diff) < 0.01) {
            els.calcDiff.classList.add('match-ok');
            els.summaryHint.innerText = '✓ المبالغ متطابقة تماماً.';
        } else {
            els.calcDiff.classList.add('match-bad');
            els.summaryHint.innerText = diff > 0
                ? 'يوجد زيادة في إجمالي المبيعات لليوم عن مجموع الكاش والشبكة والتطبيقات.'
                : 'يوجد عجز في إجمالي المبيعات لليوم عن مجموع الكاش والشبكة والتطبيقات.';
        }
    }

    document.querySelectorAll('.fields-grid').forEach(grid => {
        grid.addEventListener('input', (e) => {
            if (e.target.classList.contains('field-value')) {
                e.target.closest('.field-row').classList.remove('row-error');
                recalcSummary();
            }
        });
    });

    // ===================================================
    // Modal
    // ===================================================
    function showModal(type, title, message) {
        els.modal.classList.remove('hidden');
        els.modalLoader.classList.toggle('hidden', type !== 'loading');
        els.modalClose.classList.toggle('hidden', type === 'loading');

        if (type !== 'loading') {
            const icon  = type === 'success' ? 'check-circle' : 'alert-circle';
            const color = type === 'success' ? '#4caf50'      : '#f44336';
            els.modalIcon.innerHTML = `<i data-lucide="${icon}" style="width:60px;height:60px;color:${color}"></i>`;
            lucide.createIcons();
        } else {
            els.modalIcon.innerHTML = '';
        }
        els.modalTitle.innerText   = title;
        els.modalMessage.innerText = message;
    }

    els.modalClose.onclick = () => {
        els.modal.classList.add('hidden');
        if (els.modalTitle.innerText === 'تم الإرسال') {
            resetFullForm();
        }
    };

    // ===================================================
    // إعادة تعيين النموذج
    // ===================================================
    function resetFullForm() {
        els.form.reset();
        document.querySelectorAll('.field-row').forEach(r => r.classList.remove('row-error'));
        recalcSummary();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ===================================================
    // إرسال النموذج
    // ===================================================
    els.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const empId  = els.employeeId.value.trim();
        const branch = document.querySelector('input[name="branch"]:checked');

        // التحقق من الفرع وكود الموظف
        if (!branch) {
            showModal('error', 'بيانات ناقصة', 'يرجى اختيار الفرع.');
            return;
        }
        if (!empId || !employeeDatabase[empId]) {
            showModal('error', 'كود غير صحيح', 'يرجى التأكد من إدخال رقم الموظف الصحيح.');
            return;
        }

        // التحقق من الحقول المالية الإلزامية
        let missing = [];
        const values = {};

        fields.forEach(field => {
            const input = document.querySelector(`.field-value[data-field="${field.key}"]`);
            const row   = input.closest('.field-row');
            const raw   = input.value.trim();
            row.classList.remove('row-error');

            if (raw === '') {
                if (field.required) {
                    row.classList.add('row-error');
                    missing.push(field.ar);
                }
                // الحقل الاختياري الفارغ يُسجل صفر
                values[field.key] = field.required ? null : 0;
            } else {
                const num = parseFloat(raw);
                if (isNaN(num) || num < 0) {
                    row.classList.add('row-error');
                    missing.push(field.ar);
                    values[field.key] = null;
                } else {
                    values[field.key] = num;
                }
            }
        });

        if (missing.length > 0) {
            showModal('error', 'تقرير غير مكتمل',
                `يرجى تعبئة الحقول التالية: ${missing.slice(0, 3).join('، ')}`);
            return;
        }

        // إرسال البيانات
        showModal('loading', 'جاري الإرسال', 'يرجى الانتظار، يتم حفظ تقرير نهاية اليوم...');
        els.submitBtn.disabled = true;

        const calculatedSales = (values.cashSales + values.networkTotal +
                                 values.jahezTotal + values.hungerTotal);
        const difference = values.daySalesTotal - calculatedSales;

        const payload = {
            reportType:      "تقرير نهاية اليوم",
            branch:          branch.value === "Muzahmiyah" ? "المزاحمية" : "الدوادمي",
            branchKey:       branch.value,
            employeeName:    employeeDatabase[empId],
            cashSales:       values.cashSales,
            networkTotal:    values.networkTotal,
            jahezTotal:      values.jahezTotal,
            hungerTotal:     values.hungerTotal,
            daySalesTotal:   values.daySalesTotal,
            fullCashTotal:   values.fullCashTotal,
            custodyRemain:   values.custodyRemain,
            purchases:       values.purchases,
            calculatedSales: calculatedSales,
            difference:      difference
        };

        const formData = new URLSearchParams();
        formData.append('payload', JSON.stringify(payload));

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: formData,
                mode: 'cors'
            });

            const result = await response.json();

            if (result.result === 'success') {
                showModal('success', 'تم الإرسال',
                    `تم حفظ تقرير نهاية اليوم بنجاح برقم: ${result.id}`);
                resetFullForm();
            } else {
                throw new Error(result.message || 'فشل السيرفر في معالجة الطلب');
            }
        } catch (error) {
            console.error("Submission Error:", error);
            showModal('error', 'فشل الإرسال',
                'حدث خطأ في الاتصال بالسيرفر. يرجى التأكد من جودة الإنترنت وحاول مجدداً.');
        } finally {
            els.submitBtn.disabled = false;
        }
    });

});