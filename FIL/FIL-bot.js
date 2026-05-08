/**
 * نظام إشعارات تيليجرام - مشروع QB-Flow
 * وظيفة الملف: إرسال تقارير الفحص للإدارة وإشعارات المواعيد للموظفين (نص فقط)
 */

const TELEGRAM_CONFIG = {
    admin: {
        token: '7869366657:AAF-tek66MyPVHbUoXOn6WmvKaP-8rWUHJk', // توكن بوت الإدارة
        chatId: '-1002518674809'   // معرف مجموعة الإدارة
    },
    staff: {
        token: '7869366657:AAF-tek66MyPVHbUoXOn6WmvKaP-8rWUHJk', // توكن بوت الموظفين
        chatId: '-1002681257692' // معرف قناة الموظفين
    },
    reportViewUrl: 'https://0-bilal.github.io/QB-Sentinel/' // رابط عرض التقارير
};

/**
 * الدالة الرئيسية لإرسال الإشعارات
 * @param {Object} payload - البيانات المستلمة من النموذج
 */
async function handleTelegramNotifications(payload) {
    const now = new Date();
    
    // 1. إرسال التقرير النصي للإدارة
    await sendAdminReport(payload, now);
    
    // 2. إرسال إشعار التذكير للموظفين
    await sendStaffReminder(payload, now);
}

/**
 * إرسال تقرير نصي للإدارة
 */
async function sendAdminReport(payload, timestamp) {
    const timeStr = formatDateTime(timestamp);
    
    let message = `📦 *تقرير فحص جودة الفواكه الجديد*\n\n`;
    message += `🏪 *الفرع:* ${payload.branch}\n`;
    message += `👤 *الموظف:* ${payload.employeeName} (${payload.employeeId})\n`;
    message += `📅 *التاريخ:* ${timeStr}\n\n`;
    
    message += `✅ *سليم:* \n${payload.inspectedList || 'لا يوجد'}\n\n`;
    message += `❌ *غير متوفر:* \n${payload.naList || 'لا يوجد'}\n\n`;
    message += `⚠️ *يوجد تالف:* \n${payload.damagedList || 'لا يوجد'}\n`;

    try {
        await postToTelegram(TELEGRAM_CONFIG.admin.token, {
            chat_id: TELEGRAM_CONFIG.admin.chatId,
            text: message,
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('Admin Report Error:', error);
    }
}

/**
 * إرسال إشعار للموظفين بموعد الفحص القادم
 */
async function sendStaffReminder(payload, timestamp) {
    // حساب موعد الفحص القادم بعد 4 ساعات
    const nextCheck = new Date(timestamp.getTime() + (4 * 60 * 60 * 1000));
    const timeStr = formatDateTime(timestamp);
    const timeNext = formatTimeOnly(nextCheck);

    let message = `✅ *تم تسجيل فحص الفواكه بنجاح*\n\n`;
    message += `👤 *الموظف:* ${payload.employeeName}\n`;
    message += `⏰ *وقت الفحص:* ${timeStr}\n\n`;
    message += `📅 *موعد الفحص القادم:* ${timeNext} _(بعد 4 ساعات)_\n\n`;
    message += `🔗 [استعراض تفاصيل الفحص](${TELEGRAM_CONFIG.reportViewUrl}?id=${payload.employeeId})`;

    try {
        await postToTelegram(TELEGRAM_CONFIG.staff.token, {
            chat_id: TELEGRAM_CONFIG.staff.chatId,
            text: message,
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('Staff Notification Error:', error);
    }
}

/**
 * دالة مساعدة للإرسال عبر API التيليجرام
 */
async function postToTelegram(token, body) {
    return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

/**
 * تنسيق الوقت والتاريخ بالأرقام الإنجليزية
 * استخدام 'en-GB' يضمن ظهور الأرقام 123 بدلاً من ١٢٣
 */
function formatDateTime(date) {
    return date.toLocaleString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

function formatTimeOnly(date) {
    return date.toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}