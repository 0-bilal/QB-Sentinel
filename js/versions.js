const APP_VERSIONS = {
    "ECL": "v1.2.7",
    "FIL": "v1.2.8",
    "PV": "v1.2.0",
    "EOD": "v1.2.0",
    "PR": "v1.2.0",
    "IS": "v1.2.0",
    "GLOBAL": "v1.12.31" 
    // التاريخ 2026/05/09
};

// دالة لتحديث الإصدارات في الصفحة تلقائياً
function updateDisplayedVersions() {
    // تحديث الإصدار في الفوتر (لجميع الملفات)
    const versionElement = document.querySelector('.version-number');
    if (versionElement) {
        // إذا كنا في صفحة معينة، نأخذ إصدارها، وإلا نضع الإصدار العام
        const path = window.location.pathname;
        if (path.includes('ECL')) versionElement.innerText = APP_VERSIONS.ECL;
        else if (path.includes('FIL')) versionElement.innerText = APP_VERSIONS.FIL;
        else if (path.includes('PV')) versionElement.innerText = APP_VERSIONS.PV;
        else if (path.includes('EOD')) versionElement.innerText = APP_VERSIONS.EOD;
        else if (path.includes('PR')) versionElement.innerText = APP_VERSIONS.PR;
        else if (path.includes('IS')) versionElement.innerText = APP_VERSIONS.IS;
        else versionElement.innerText = APP_VERSIONS.GLOBAL;
    }

    // تحديث البطاقات في الصفحة الرئيسية (index.html)
    const reportTags = document.querySelectorAll('.report-card');
    reportTags.forEach(card => {
        const href = card.getAttribute('href');
        const tag = card.querySelector('.report-tag:last-child');
        if (tag) {
            if (href.includes('ECL')) tag.innerText = APP_VERSIONS.ECL;
            if (href.includes('FIL')) tag.innerText = APP_VERSIONS.FIL;
            if (href.includes('EOD')) tag.innerText = APP_VERSIONS.EOD;
            if (href.includes('PR')) tag.innerText = APP_VERSIONS.PR;
            if (href.includes('PR')) tag.innerText = APP_VERSIONS.PR;
            if (href.includes('IS')) tag.innerText = APP_VERSIONS.IS;
        }
    });
}

// تشغيل الدالة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', updateDisplayedVersions);