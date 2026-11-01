/**
 * Mai Vàng Bonsai - nhận đơn hàng từ website và ghi vào Google Sheet.
 *
 * Mỗi đơn luôn được thêm vào dòng trống dưới cùng, không ghi đè đơn cũ.
 * Nhiều khách đặt cùng lúc sẽ được xếp hàng lần lượt nhờ LockService.
 */

const SPREADSHEET_ID = '1VaqoLdohKsXJMu4IP8tckmjVMhxf2z_l0_r-GyU-6vA';
const SHEET_GID = 0;
const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const LOCK_TIMEOUT_MS = 30000;
const MAX_TEXT_LENGTH = 500;

const HEADERS = [
  'Thời gian',
  'Họ và tên',
  'Số điện thoại',
  'Địa chỉ nhận hàng',
  'Gói cây',
  'Thuốc kích nụ hoa',
  'Giống mai',
  'Tổng tiền',
];
const TOTAL_COLUMN = HEADERS.indexOf('Tổng tiền') + 1;

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const order = JSON.parse(e.postData.contents);

    // Ô ẩn trên form: người thật không điền, bot điền vào thì bỏ qua
    if (order.website) return jsonResponse_({ ok: true });

    if (!text_(order.name) || !text_(order.phone) || !text_(order.address)) {
      return jsonResponse_({ ok: false, error: 'Thiếu thông tin nhận hàng' });
    }

    lock.waitLock(LOCK_TIMEOUT_MS);
    const sheet = getSheet_();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow(toRow_(order));
    sheet.getRange(sheet.getLastRow(), TOTAL_COLUMN).setNumberFormat('#,##0"₫"');
    SpreadsheetApp.flush();

    return jsonResponse_({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse_({ ok: false, error: 'Không lưu được đơn hàng' });
  } finally {
    lock.releaseLock();
  }
}

// Mở URL Web app trên trình duyệt để kiểm tra đã triển khai thành công chưa
function doGet() {
  return jsonResponse_({ ok: true, message: 'Mai Vàng Bonsai đang nhận đơn' });
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheets().find((item) => item.getSheetId() === SHEET_GID);
  if (!sheet) throw new Error('Không tìm thấy trang tính gid=' + SHEET_GID);
  return sheet;
}

function toRow_(order) {
  return [
    Utilities.formatDate(new Date(), TIME_ZONE, 'dd/MM/yyyy HH:mm:ss'),
    safeText_(order.name),
    // Dấu ' giữ số 0 đầu số điện thoại và dấu + của số quốc tế
    "'" + text_(order.phone),
    safeText_(order.address),
    safeText_(order.pack),
    safeText_(order.bud),
    safeText_(order.variety),
    Number(order.total) || 0,
  ];
}

function text_(value) {
  return String(value === undefined || value === null ? '' : value)
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

// Chặn khách nhập công thức như =IMPORTXML(...) làm Sheet tự chạy
function safeText_(value) {
  const cleaned = text_(value);
  return /^[=+\-@]/.test(cleaned) ? "'" + cleaned : cleaned;
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
