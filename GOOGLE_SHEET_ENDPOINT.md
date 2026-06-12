# Google Sheet PO Feedback Endpoint

เอกสารนี้ใช้สำหรับต่อ Google Sheet เพื่อรับ feedback/event ของ Purchase Request และ Approval จาก prototype

## แนวทาง

- ใช้ Google Apps Script เป็น Web App endpoint
- React ส่งข้อมูลไปที่ endpoint ผ่าน `VITE_GOOGLE_PO_FEEDBACK_ENDPOINT`
- endpoint ใช้สำหรับรับสำเนา feedback เท่านั้น ข้อมูลหลักยังถูกเก็บใน persistent JSON state ของระบบ
- ห้ามใส่ API key, service account secret หรือ credential ส่วนตัวใน frontend
- ห้ามส่งอีเมลผู้เข้าชม เว้นแต่ผู้ใช้กรอกเองและยินยอม

## ตัวอย่าง Apps Script

สร้าง Google Sheet แล้วไปที่ Extensions → Apps Script จากนั้นวางโค้ดนี้
(เวอร์ชันนี้แยกความเห็น/feedback ไปชีต `Feedback` และ PO event ไปชีต `PO Feedback` โดยจัดคอลัมน์ตรงเสมอ):

```js
function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");

  if (payload.event_type === "feedback_comment") {
    writeRow(ss, "Feedback",
      ["received_at", "action_at", "actor", "author_username", "context_page", "feedback_text"],
      {
        received_at: new Date(),
        action_at: payload.action_at,
        actor: payload.actor,
        author_username: payload.author_username,
        context_page: payload.context_page,
        feedback_text: payload.feedback_text,
      });
  } else {
    writeRow(ss, "PO Feedback",
      ["received_at", "event_type", "action", "action_at", "actor", "request_id", "status",
       "sku_id", "warehouse_id", "supplier_id", "ai_suggested_quantity", "requested_quantity",
       "approved_quantity", "unit", "unit_price", "estimated_cost", "recommended_layer",
       "variance_percent", "formula_version", "override_reason_category", "override_reason_text",
       "approval_note", "snapshot_created_at"],
      Object.assign({ received_at: new Date() }, payload));
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// เขียนแถวโดยจับคู่ค่ากับ header ตามชื่อคีย์ — คอลัมน์ตรงเสมอแม้ payload มีคีย์ไม่ครบ
function writeRow(ss, sheetName, headers, data) {
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  sheet.appendRow(headers.map(function (key) { return data[key] != null ? data[key] : ""; }));
}
```

> สำคัญมาก: หลังแก้โค้ด ต้อง **Deploy → Manage deployments → ดินสอแก้ deployment เดิม → Version: New version → Deploy** เสมอ ไม่งั้น Web App ยังรันโค้ดเก่า ความเห็นจะลงผิดคอลัมน์เหมือนเดิม

## Deploy

1. กด Deploy → New deployment
2. เลือก Web app
3. Execute as: Me
4. Who has access: Anyone
5. Copy Web app URL
6. สร้างไฟล์ `.env.local` ในโปรเจกต์:

```bash
VITE_GOOGLE_PO_FEEDBACK_ENDPOINT=https://script.google.com/macros/s/xxxxx/exec
```

7. restart dev server:

```bash
npm run dev
```

## ถ้าสร้าง Script จากหน้า script.google.com/home

ถ้าสร้างโปรเจกต์จากหน้า Apps Script โดยตรง ไม่ได้เปิดจาก Google Sheet ผ่าน Extensions → Apps Script,
`SpreadsheetApp.getActiveSpreadsheet()` อาจหา Sheet ไม่เจอ ให้ใช้ `SpreadsheetApp.openById()` แทน:

```js
const SPREADSHEET_ID = "ใส่ Spreadsheet ID จาก URL ของ Google Sheet";
const SHEET_NAME = "PO Feedback";

function getTargetSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}
```

แล้วเปลี่ยนบรรทัดนี้ใน `doPost`:

```js
const ss = SpreadsheetApp.getActiveSpreadsheet();
```

เป็น:

```js
const ss = getTargetSpreadsheet();
```

## เช็คสิทธิ์และ authorize

ถ้า endpoint ไม่รับข้อมูล ให้ตรวจตามนี้:

1. ใช้ URL ที่ลงท้ายด้วย `/exec` ไม่ใช่ `/dev`
2. Deploy → Manage deployments → กดไอคอนดินสอแก้ deployment เดิม
3. เลือก Version เป็น New version ทุกครั้งหลังแก้โค้ด
4. Execute as ต้องเป็น Me
5. Who has access ต้องเป็น Anyone
6. กด Deploy แล้ว authorize permission ให้ครบ
7. นำ Web app URL ใหม่มาใส่ใน `.env.local`
8. restart dev server

ถ้าได้ error `401 Unauthorized` แปลว่า Apps Script ยังไม่เปิดสิทธิ์ public web app หรือยังไม่ได้ authorize deployment

## Event ที่ส่ง

- `draft_saved`
- `request_submitted`
- `regional_escalated`
- `approved`
- `rejected`
- `more_info_requested`

## หมายเหตุ

ระบบใช้ `fetch` แบบ `no-cors` เพื่อให้ Apps Script รับข้อมูลจาก frontend ได้ง่ายใน PoC ดังนั้น frontend จะตรวจ response จริงไม่ได้ หากต้องการ error handling เต็มรูปแบบควรมี backend proxy ภายหลัง
