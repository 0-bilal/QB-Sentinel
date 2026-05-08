const FOLDER_ID = '1oC-wu7dvqASilei8MB6Ml2-m8ePxxqUV'; 

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents); 
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheets()[0];
    
    const lastRow = sheet.getLastRow();
    const reportId = lastRow === 0 ? 1 : lastRow; 
    const timestamp = new Date();
    const dateString = Utilities.formatDate(timestamp, "GMT+3", "yyyy-MM-dd"); 
    
    // تكوين اسم الصورة
    const fileName = `${reportId} - ${data.branch} - ${data.equipmentAr} - ${dateString}.jpg`; 
    
    let fileUrl = "لا توجد صورة";
    if (data.image) { 
      const folder = DriveApp.getFolderById(FOLDER_ID);
      const contentType = data.image.split(',')[0].split(':')[1].split(';')[0];
      const bytes = Utilities.base64Decode(data.image.split(',')[1]);
      
      const blob = Utilities.newBlob(bytes, contentType, fileName); 
      const file = folder.createFile(blob);
      fileUrl = file.getUrl();
    }

// التعديل المطلوب لإظهار اسم الصورة كرابط تشعبي
const imageHyperlink = data.image ? `=HYPERLINK("${fileUrl}", "${fileName}")` : "لا توجد صورة";

sheet.appendRow([
  reportId,
  dateString,
  Utilities.formatDate(timestamp, "GMT+3", "HH:mm:ss"),
  data.branch,
  data.senderName,
  data.cleanerName,
  data.equipmentAr,
  data.equipmentEn,
  data.equipmentId,
  imageHyperlink // سيظهر هنا اسم الصورة وعند النقر عليه يفتح الرابط
]);

    return ContentService.createTextOutput(JSON.stringify({"result": "success"}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"result": "error", "error": error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}