# Google Sheet PO Feedback Endpoint

เอกสารนี้ใช้สำหรับต่อ Google Sheet เพื่อรับ feedback/event ของ Purchase Request และ Approval จาก prototype

## แนวทาง

- ใช้ Google Apps Script เป็น Web App endpoint
- React ส่งข้อมูลไปที่ endpoint ผ่าน `VITE_GOOGLE_PO_FEEDBACK_ENDPOINT`
- endpoint ใช้สำหรับรับสำเนา feedback เท่านั้น ข้อมูลหลักยังถูกเก็บใน persistent JSON state ของระบบ
- ห้ามใส่ API key, service account secret หรือ credential ส่วนตัวใน frontend
- ห้ามส่งอีเมลผู้เข้าชม เว้นแต่ผู้ใช้กรอกเองและยินยอม

## ตัวอย่าง Apps Script

สร้าง Google Sheet แล้วไปที่ Extensions → Apps Script จากนั้นวางโค้ดนี้:

```js
const SHEET_NAME = "PO Feedback";

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");

  const headers = [
    "received_at",
    "event_type",
    "action",
    "action_at",
    "actor",
    "request_id",
    "status",
    "sku_id",
    "warehouse_id",
    "supplier_id",
    "ai_suggested_quantity",
    "requested_quantity",
    "approved_quantity",
    "unit",
    "unit_price",
    "estimated_cost",
    "recommended_layer",
    "variance_percent",
    "formula_version",
    "override_reason_category",
    "override_reason_text",
    "approval_note",
    "snapshot_created_at",
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  sheet.appendRow([
    new Date(),
    payload.event_type || "",
    payload.action || "",
    payload.action_at || "",
    payload.actor || "",
    payload.request_id || "",
    payload.status || "",
    payload.sku_id || "",
    payload.warehouse_id || "",
    payload.supplier_id || "",
    payload.ai_suggested_quantity || "",
    payload.requested_quantity || "",
    payload.approved_quantity || "",
    payload.unit || "",
    payload.unit_price || "",
    payload.estimated_cost || "",
    payload.recommended_layer || "",
    payload.variance_percent || "",
    payload.formula_version || "",
    payload.override_reason_category || "",
    payload.override_reason_text || "",
    payload.approval_note || "",
    payload.snapshot_created_at || "",
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

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
