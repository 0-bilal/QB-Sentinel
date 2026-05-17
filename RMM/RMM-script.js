'use strict';

/* =============================================
   CONFIGURATION
   ============================================= */

// 🔑 ضع هنا رابط Web App بعد نشر RMM.gs من Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx8Y6u3MyZ647BXc0tyUb76mbcg72a4JuyFVeo548dl8utW1UKm8k0kK6rzIIC81or8/exec';

// قاعدة بيانات الموظفين — تحويل رقم الموظف إلى الاسم
const employeeDatabase = {
    "1000": "بلال الخواجة",
    "1101": "رمان",
    "1311": "محمد",
    "1551": "شاهين",
    "1421": "نسيم",
    "1711": "دورجا"
};

// تحويل اسم الفرع من الإنجليزي للعربي
const branchNameMap = {
    "Dawadimi":   "الدوادمي",
    "Muzahmiyah": "المزاحمية"
};

const OPERATIONS = {
    dough: {
        ar: 'تصنيع عجين ميني بان كيك',
        en: 'Mini Pancake Dough',
        summaryClass: 'si-dough',
        icon: 'cookie',
        resultTpl: (qty) => `تم تسجيل تصنيع ${formatGrams(qty)} من عجين ميني بان كيك`,
    },
    berry: {
        ar: 'تحويل الفراولة الطبيعي ← مجمد',
        en: 'Fresh Strawberry → Frozen',
        summaryClass: 'si-berry',
        icon: 'snowflake',
        resultTpl: (qty) => `تحويل ${formatGrams(qty)} فراولة طبيعي ← فراولة مجمد`,
    },
    red: {
        ar: 'تحويل التوت الأحمر الطبيعي ← مجمد',
        en: 'Fresh Red Raspberry → Frozen',
        summaryClass: 'si-red',
        icon: 'snowflake',
        resultTpl: (qty) => `تحويل ${formatGrams(qty)} توت أحمر طبيعي ← توت أحمر مجمد`,
    },
    black: {
        ar: 'تحويل التوت الأسود الطبيعي ← مجمد',
        en: 'Fresh Blackberry → Frozen',
        summaryClass: 'si-black',
        icon: 'snowflake',
        resultTpl: (qty) => `تحويل ${formatGrams(qty)} توت أسود طبيعي ← توت أسود مجمد`,
    },
};


/** Format grams: show as grams or convert to kg if ≥ 1000 */
function formatGrams(g) {
    const n = parseInt(g) || 0;
    if (n >= 1000) {
        const kg = (n / 1000).toFixed(n % 1000 === 0 ? 0 : 2);
        return `kg ${kg} (${n} g)`;
    }
    return `${n} g`;
}

function setHidden(el, hide) {
    if (!el) return;
    el.classList.toggle('hidden', hide);
}

/* =============================================
   TOGGLE — open/close operation panel
   ============================================= */

document.querySelectorAll('.mfg-toggle input[type="checkbox"]').forEach(chk => {
    chk.addEventListener('change', function () {
        const opKey = this.dataset.op;
        const opEl  = document.getElementById(`op-${opKey}`);
        const body  = document.getElementById(`det-${opKey}`);
        const input = document.getElementById(`qty-${opKey}`);
        const res   = document.getElementById(`res-${opKey}`);

        if (this.checked) {
            opEl.classList.add('is-active');
            body.classList.add('is-open');
            setTimeout(() => {
                const firstInput = body.querySelector('input');
                if (firstInput) {
                    firstInput.focus({ preventScroll: true });
                    opEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 430);
        } else {
            opEl.classList.remove('is-active');
            body.classList.remove('is-open');
            if (input) input.value = '';
            if (res)   res.classList.add('hidden');
        }

        refreshSummary();
        lucide.createIcons();
    });
});

/* =============================================
   DOUGH INGREDIENTS — ingredient inputs config
   ============================================= */

const DOUGH_INGREDIENTS = [
    { id: 'ing-egg',       ar: 'بيض',           unit: 'حبة', isCount: true  },
    { id: 'ing-sugar',     ar: 'سكر',           unit: 'g',   isCount: false },
    { id: 'ing-vanilla',   ar: 'فانيليا باودر', unit: 'g',   isCount: false },
    { id: 'ing-baking',    ar: 'بيكنج باودر',   unit: 'g',   isCount: false },
    { id: 'ing-sweetener', ar: 'محلي',          unit: 'g',   isCount: false },
    { id: 'ing-butter',    ar: 'زبدة',          unit: 'g',   isCount: false },
    { id: 'ing-flour',     ar: 'طحين',          unit: 'g',   isCount: false },
    { id: 'ing-milk',      ar: 'حليب',          unit: 'g',   isCount: false },
];

function getDoughIngredientsFilled() {
    return DOUGH_INGREDIENTS.map(ing => {
        const el  = document.getElementById(ing.id);
        const val = parseFloat(el?.value) || 0;
        return { ...ing, val };
    }).filter(i => i.val > 0);
}

function formatIngVal(ing) {
    if (ing.isCount) return `${ing.val} ${ing.unit}`;
    const n = ing.val;
    if (n >= 1000) {
        const kg = (n / 1000).toFixed(n % 1000 === 0 ? 0 : 2);
        return `kg ${kg} (${n}g)`;
    }
    return `${n} ${ing.unit}`;
}

function refreshDoughResult() {
    const totalInput = document.getElementById('qty-dough');
    const res        = document.getElementById('res-dough');
    const txt        = document.getElementById('res-dough-text');
    const totalVal   = parseInt(totalInput?.value) || 0;

    if (totalVal > 0 && res && txt) {
        txt.textContent = `تم تسجيل تصنيع ${formatGrams(totalVal)} من عجين ميني بان كيك`;
        res.classList.remove('hidden');
    } else if (res) {
        res.classList.add('hidden');
    }
}

function bindIngredientInputs() {
    document.querySelectorAll('.ing-input').forEach(input => {
        input.addEventListener('input', () => {
            refreshDoughResult();
            refreshSummary();
        });
        input.addEventListener('focus', function () {
            setTimeout(() => {
                this.closest('.ing-row')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 350);
        });
    });
}

/* =============================================
   QUANTITY INPUT — live result feedback
   ============================================= */

document.querySelectorAll('.qty-input').forEach(input => {
    if (input.classList.contains('ing-input')) return;

    input.addEventListener('input', function () {
        const opKey = this.dataset.op;

        if (opKey === 'dough') {
            refreshDoughResult();
            refreshSummary();
            return;
        }

        const val = parseInt(this.value);
        const res = document.getElementById(`res-${opKey}`);
        const txt = document.getElementById(`res-${opKey}-text`);

        if (val > 0 && txt && res) {
            txt.textContent = OPERATIONS[opKey].resultTpl(val);
            res.classList.remove('hidden');
        } else if (res) {
            res.classList.add('hidden');
        }

        refreshSummary();
    });
});

/* =============================================
   SUMMARY BANNER — active operations overview
   ============================================= */

function refreshSummary() {
    const banner = document.getElementById('mfgSummaryBanner');
    const list   = document.getElementById('summaryList');
    const count  = document.getElementById('summaryCount');

    const activeOps = [];

    Object.keys(OPERATIONS).forEach(opKey => {
        const chk = document.getElementById(`toggle-${opKey}`);
        const qty = parseInt(document.getElementById(`qty-${opKey}`)?.value) || 0;
        if (chk && chk.checked) {
            activeOps.push({ opKey, qty });
        }
    });

    if (activeOps.length === 0) {
        setHidden(banner, true);
        return;
    }

    setHidden(banner, false);
    count.textContent = `${activeOps.length} ${activeOps.length === 1 ? 'عملية' : 'عمليات'}`;

    list.innerHTML = activeOps.map(({ opKey, qty }) => {
        const op      = OPERATIONS[opKey];
        const qtyText = qty > 0 ? formatGrams(qty) : 'لم تُدخل كمية';
        return `
            <div class="summary-item ${op.summaryClass}">
                <i data-lucide="${op.icon}"></i>
                <span>${op.ar}</span>
                <span class="summary-item-qty">${qtyText}</span>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

/* =============================================
   MODAL
   ============================================= */

function showModal(type, title, message) {
    const overlay  = document.getElementById('customModal');
    const iconWrap = document.getElementById('modalIcon');
    const loader   = document.getElementById('modalLoader');
    const closeBtn = document.getElementById('modalClose');

    document.getElementById('modalTitle').textContent   = title;
    document.getElementById('modalMessage').textContent = message;

    setHidden(overlay, false);
    setHidden(loader, true);
    setHidden(closeBtn, true);
    iconWrap.innerHTML = '';

    if (type === 'loading') {
        setHidden(loader, false);
    } else if (type === 'success') {
        iconWrap.innerHTML = '<i data-lucide="check-circle" class="success-icon"></i>';
        setHidden(closeBtn, false);
        lucide.createIcons();
    } else {
        iconWrap.innerHTML = '<i data-lucide="alert-circle" class="error-icon"></i>';
        setHidden(closeBtn, false);
        lucide.createIcons();
    }
}

document.getElementById('modalClose').addEventListener('click', () => {
    setHidden(document.getElementById('customModal'), true);

    // إذا كان آخر إرسال ناجحاً → إعادة ضبط الفورم بالكامل
    if (pendingReset) {
        pendingReset = false;
        resetForm();
    }
});

/* =============================================
   RESET FORM — إعادة كل شيء لحالته الافتراضية
   ============================================= */

let pendingReset = false;

function resetForm() {
    // 1) إلغاء اختيار الفرع
    document.querySelectorAll('input[name="branch"]').forEach(r => r.checked = false);

    // 2) مسح رقم الموظف
    const empEl = document.getElementById('employeeId');
    if (empEl) empEl.value = '';

    // 3) إغلاق جميع عمليات التصنيع + مسح كمياتها + إخفاء نتائجها
    Object.keys(OPERATIONS).forEach(opKey => {
        const chk   = document.getElementById(`toggle-${opKey}`);
        const opEl  = document.getElementById(`op-${opKey}`);
        const body  = document.getElementById(`det-${opKey}`);
        const input = document.getElementById(`qty-${opKey}`);
        const res   = document.getElementById(`res-${opKey}`);

        if (chk)   chk.checked = false;
        if (opEl)  opEl.classList.remove('is-active');
        if (body)  body.classList.remove('is-open');
        if (input) input.value = '';
        if (res)   res.classList.add('hidden');
    });

    // 4) مسح مكونات العجين
    DOUGH_INGREDIENTS.forEach(ing => {
        const el = document.getElementById(ing.id);
        if (el) el.value = '';
    });

    // 5) إخفاء شريط الملخص
    refreshSummary();

    // 6) إعادة التمرير لأعلى الصفحة
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 7) إعادة رسم أيقونات Lucide
    lucide.createIcons();
}

/* =============================================
   FORM SUBMIT — validate & send to Google Sheet
   ============================================= */

document.getElementById('mfgForm').addEventListener('submit', function (e) {
    e.preventDefault();

    // ===== التحقق من الفرع =====
    const branchEl = document.querySelector('input[name="branch"]:checked');
    if (!branchEl) {
        showModal('error', 'خطأ في الإدخال', 'يرجى اختيار الفرع أولاً');
        return;
    }
    // تحويل اسم الفرع للعربي
    const branchAr = branchNameMap[branchEl.value] || branchEl.value;

    // ===== التحقق من رقم الموظف =====
    const empId = document.getElementById('employeeId').value.trim();
    if (!empId) {
        showModal('error', 'خطأ في الإدخال', 'يرجى إدخال رقم الموظف للتحقق');
        return;
    }

    // البحث عن اسم الموظف من قاعدة البيانات
    const employeeName = employeeDatabase[empId];
    if (!employeeName) {
        showModal('error', 'رقم موظف غير صحيح', `لا يوجد موظف برقم: ${empId}\nيرجى التحقق من الرقم وإعادة المحاولة`);
        return;
    }

    // ===== جمع العمليات النشطة =====
    const activeOps = [];
    Object.keys(OPERATIONS).forEach(opKey => {
        const chk = document.getElementById(`toggle-${opKey}`);
        if (chk && chk.checked) {
            const qty = parseInt(document.getElementById(`qty-${opKey}`)?.value) || 0;
            activeOps.push({ opKey, qty });
        }
    });

    if (activeOps.length === 0) {
        showModal('error', 'خطأ في الإدخال', 'يرجى تفعيل عملية تصنيع واحدة على الأقل');
        return;
    }

    const missingQty = activeOps.find(o => o.qty < 1);
    if (missingQty) {
        const opName = OPERATIONS[missingQty.opKey].ar;
        showModal('error', 'كمية مفقودة', `يرجى إدخال الكمية الإجمالية لعملية:\n${opName}`);
        return;
    }

    // ===== بناء حقول البيانات لكل عملية =====
    let doughField  = '';
    let doughIngs   = '';
    let berryField  = '';
    let redField    = '';
    let blackField  = '';

    activeOps.forEach(({ opKey, qty }) => {
        const formatted = formatGrams(qty);
        if (opKey === 'dough') {
            doughField = formatted;
            const ings = getDoughIngredientsFilled();
            if (ings.length > 0) {
                doughIngs = ings.map(i => `${i.ar}: ${formatIngVal(i)}`).join('، ');
            }
        } else if (opKey === 'berry') {
            berryField = formatted;
        } else if (opKey === 'red') {
            redField = formatted;
        } else if (opKey === 'black') {
            blackField = formatted;
        }
    });

    // ===== تجهيز الـ payload =====
    const payload = {
        branch:           branchAr,
        employeeName:     employeeName,
        dough:            doughField,
        doughIngredients: doughIngs,
        berry:            berryField,
        red:              redField,
        black:            blackField
    };

    // ===== الإرسال =====
    showModal('loading', 'جارٍ الإرسال...', 'يتم رفع بيانات التصنيع إلى السجل');

    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.result === 'success') {
            pendingReset = true;  // ✅ سيتم إعادة الضبط عند ضغط "موافق"
            showModal(
                'success',
                'تم الإرسال بنجاح',
                `تم تسجيل التقرير رقم #${result.id}\nفرع ${branchAr} — ${employeeName}`
            );
        } else {
            showModal('error', 'فشل الإرسال', result.message || 'حدث خطأ غير معروف');
        }
    })
    .catch(err => {
        showModal('error', 'فشل الاتصال', `تعذر الاتصال بالخادم:\n${err.message}`);
    });
});

/* =============================================
   HEADER BUTTONS
   ============================================= */

if (refreshBtn) {
    refreshBtn.addEventListener('click', () => location.reload());
}

/* =============================================
   INIT
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    bindIngredientInputs();
});