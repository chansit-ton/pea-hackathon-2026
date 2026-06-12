## 2026-06-12 - เพิ่มเอกสาร DEPLOY_VERCEL.md

### Summary
- เพิ่ม `DEPLOY_VERCEL.md` รวม checklist deploy บน Vercel: build settings, env vars (`VITE_GOOGLE_CLIENT_ID`/`VITE_ADMIN_EMAIL`/`VITE_GOOGLE_PO_FEEDBACK_ENDPOINT`), Authorized origins + consent screen ของ Google OAuth, การ deploy Apps Script, จุดที่มักลืม (preview deploy origin, localStorage แยกเครื่อง, redeploy หลังแก้ env)
- เพิ่ม pointer ใน `README.md`

### Why
- ผู้ใช้จะ deploy บน Vercel และถามว่าต้องทำอะไรเพิ่ม จึงรวมขั้นตอนไว้เป็นไฟล์กดทำตามได้

### Changed Files
- `DEPLOY_VERCEL.md` (ใหม่)
- `README.md`
- `PROJECT_UPDATES.md`

### Verification
- เอกสารอย่างเดียว ไม่กระทบ runtime

### Notes / Follow-up
- จุดสำคัญที่สุดบน Vercel: ใส่ env แล้ว redeploy + เพิ่มโดเมน Vercel ใน Google Authorized origins ไม่งั้น Google Sign-In ไม่ทำงาน

## 2026-06-12 - ส่งความเห็น/feedback เข้า Google Sheet (รวมศูนย์)

### Summary
- เพิ่ม `sendGoogleFeedbackComment` ใน `googlePoFeedback.ts` (refactor ใช้ `postRow` ร่วมกับ PO feedback) ส่ง payload `event_type: feedback_comment` พร้อม `actor`, `author_username`, `context_page`, `feedback_text`
- ต่อ `addPoNote` ให้ส่งสำเนาความเห็นเข้า Google Sheet endpoint ทุกครั้งที่บันทึก (ข้อมูลหลักยังอยู่ใน localStorage) และปรับ toast บอกว่าส่งเข้าชีตด้วยเมื่อ endpoint เปิดอยู่
- อัปเดต `GOOGLE_SHEET_ENDPOINT.md` ให้ Apps Script แยกความเห็นไปชีต `Feedback` (คอลัมน์ received_at/action_at/actor/author_username/context_page/feedback_text) และ PO event ไปชีต `PO Feedback` โดย map ค่าตาม header เสมอ

### Why
- ผู้ใช้ตั้ง Google Sign-In + feedback endpoint แล้ว แต่ความเห็นไม่เข้าชีต เพราะ (1) `addPoNote` ยังไม่ได้ส่ง และ (2) Apps Script เดิม map เฉพาะคอลัมน์ PO ทำให้ข้อความ/หน้าตกหาย — แก้ทั้งสองจุด ผู้ใช้ยืนยันว่าได้แล้ว

### Changed Files
- `src/App.tsx`
- `src/utils/googlePoFeedback.ts`
- `GOOGLE_SHEET_ENDPOINT.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน
- ผู้ใช้ยืนยันบนชีตจริง: ความเห็นเข้าชีต `Feedback` พร้อมชื่อ Google (actor), อีเมล, หน้าที่เขียน และข้อความครบ หลังอัปเดต Apps Script + Deploy New version

### Notes / Follow-up
- ต้อง Deploy New version ของ Apps Script ทุกครั้งที่แก้โค้ด ไม่งั้น Web App รันโค้ดเก่า
- `no-cors` ทำให้ frontend อ่าน response ไม่ได้ จึงไม่ confirm สำเร็จฝั่ง client; การอ่าน feedback กลับมาแสดงรวมในแอปยังต้องทำ GET endpoint เพิ่มถ้าต้องการ

## 2026-06-12 - เพิ่ม Google Sign-In (OAuth) เป็นทางเลือก login

### Summary
- เพิ่ม `src/utils/googleAuth.ts` โหลด Google Identity Services, decode id_token เป็นชื่อ/อีเมล (env-gated ด้วย `VITE_GOOGLE_CLIENT_ID`)
- เพิ่มปุ่ม "Sign in with Google" ในหน้า `บัญชีผู้ใช้` (ขึ้นเฉพาะเมื่อตั้ง Client ID) พร้อม fallback เป็น login แบบ local ถ้าไม่ตั้งค่า
- เข้าสู่ระบบด้วย Google → เก็บ identity จริง (ชื่อ+อีเมล) ติดกับความเห็น; ได้สิทธิ์ admin ถ้าอีเมลตรง `VITE_ADMIN_EMAIL`
- เพิ่ม env `VITE_GOOGLE_CLIENT_ID`, `VITE_ADMIN_EMAIL` (ใน `.env.example`, `vite-env.d.ts`) และเอกสาร `GOOGLE_AUTH_SETUP.md`

### Why
- ผู้ใช้เลือกใช้ Google Sign-In (OAuth) เพื่อให้ระบุตัวตนผู้ให้ feedback ได้จริงโดยไม่ต้องจัดการรหัสผ่านเอง และรันบน Vercel ได้โดยไม่ต้องมี backend

### Changed Files
- `src/App.tsx`, `src/utils/googleAuth.ts` (ใหม่), `src/vite-env.d.ts`, `.env.example`
- `GOOGLE_AUTH_SETUP.md` (ใหม่), `DATA_POLICY.md` / `README.md` / `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน
- ตรวจผ่าน DOM (ยังไม่ตั้ง Client ID): หน้า auth แสดงฟอร์ม local ปกติ, ปุ่ม Google ถูกซ่อน (graceful fallback), ไม่มี console error

### Notes / Follow-up
- ยังไม่ได้ทดสอบ popup Google จริงเพราะต้องใช้ Client ID + authorized origin ของผู้ใช้ (มีขั้นตอนใน `GOOGLE_AUTH_SETUP.md`)
- PoC decode id_token ฝั่ง client ไม่ verify ที่ server; feedback ยังเก็บ localStorage ต่อเครื่อง — ถ้าต้องรวมศูนย์ค่อยต่อ Firestore หรือส่งเข้า Google Sheet endpoint

## 2026-06-13 - จัด sidebar 5 หมวด + รวม Usage เป็นแท็บใน คลังพัสดุ + แก้ dead-end (เฟส 1-2)

### Summary
- เปลี่ยน sidebar จากลิสต์เรียบ 16 เมนู เป็น 5 หมวด (ภาพรวม / คลัง & ความเสี่ยง / จัดซื้อ & เคลื่อนย้าย / ข้อมูล & ประวัติ / ระบบ) มีหัวข้อหมวด + เส้นคั่นตอนย่อ
- ยุบหน้า "การใช้ SKU" เป็นแท็บ "การใช้งานรายเดือน" ในหน้า คลังพัสดุ (แท็บ สถานะสต็อก | การใช้งานรายเดือน) — `WarehouseSkuUsagePage` รับ prop `embedded` เพื่อซ่อน PageTitle ซ้ำ
- แก้ dead-end ของหน้า Usage: เพิ่มคอลัมน์ "ดำเนินการ" + ปุ่ม "ดู SKU" ในตาราง usage → กดแล้วเปิด SKU detail ได้ (เดิมเป็น data view ตัน)
- ย้าย "บัญชีผู้ใช้" ออกจาก sidebar (มีปุ่ม chip บน header อยู่แล้ว)

### Why
- จาก audit: 16 เมนูเรียงพรืดไม่มีการจัดกลุ่ม, หน้า "การใช้ SKU" เป็น dead-end (ไม่มีปุ่มไปต่อ), บัญชีผู้ใช้ซ้ำกับ header

### Changed Files
- `src/App.tsx`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน
- ตรวจ build สด (vite preview): sidebar แสดง 5 หัวข้อหมวดครบ, ไม่มีเมนู "การใช้ SKU"/"บัญชีผู้ใช้" แล้ว, หน้าคลังพัสดุมีแท็บ Stock|Usage, แท็บ Usage มี 24 แถว + ปุ่ม "ดู SKU" กดแล้วเปิด SKU detail (1CC0CG0002) ได้ และไม่มี PageTitle ซ้ำ

### Notes / Follow-up
- ยังเหลือเฟส 3 (แยก dashboard เป็นเรื่อง ๆ) และเฟส 4 (เก็บกวาดไอคอน/ชื่อ/modal pattern + ลบ `_legacy*` arrays)

## 2026-06-13 - เก็บกวาด: ลบ legacy arrays + แก้ factory mapping เขต A (เฟส 4)

### Summary
- ลบ `_legacyPea*` arrays 7 ชุด + helper `usageRows` + const `usageYear` ที่ไม่ใช้แล้วออกจาก `peaDataModel.ts` (ลด 370 บรรทัด: 790 → 420) — ของพวกนี้ถูก tree-shake ออกจาก bundle อยู่แล้ว แต่รก source
- เพิ่ม Factory/Plant + WH-Factory mapping ของเขต A (A010/A020/A030) ให้ครบ — เดิม A010 เป็น mapping "unknown" ทำให้ Data Coverage panel ของคลังเขต A แสดงว่าไม่มี stock mapping ทั้งที่ generate ข้อมูลให้แล้ว
- ไอคอนเมนูซ้ำ (dashboard/usage ใช้ BarChart3) แก้ไปแล้วโดยปริยายตั้งแต่เฟส 1 (ยุบ usage ออกจาก nav)

### Why
- เฟส 4 เก็บกวาดหลัง overhaul: ลบ dead code ให้ source สะอาด และทำให้ coverage flag ของ 8 คลังที่ใช้งานจริงถูกต้องครบ

### Changed Files
- `src/data/peaDataModel.ts`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน
- ตรวจ build สด: หน้าวิเคราะห์สต็อกยังมี 73 แถวครบ (ข้อมูลไม่หาย), ไม่มี console error

### Notes / Follow-up
- ยังไม่ได้ทำ: รวม drill-down pattern ให้เป็น modal แบบเดียวทั้งแอป (ตอนนี้ Audit ใช้ modal, SKU detail ใช้ navigate) — เป็น UX refactor ใหญ่กว่า ไว้รอบหน้าถ้าต้องการ

## 2026-06-13 - แยก Dashboard เป็น 3 แท็บตามเรื่อง (เฟส 3)

### Summary
- แยกเนื้อหา Dashboard ที่ยาวมากเป็น 3 แท็บ: **ภาพรวม** / **ความเสี่ยง & ของจม** / **งบประมาณ** (Banner Dead Stock Exchange + ตัวกรองยังอยู่บนสุดเป็น context ร่วม)
- ภาพรวม = Demo Scenario + KPI ภาพรวม (SKU/เสี่ยง/PR/VMI) + แจ้งเตือนสต็อกวิกฤต + สรุป AI
- ความเสี่ยง & ของจม = KPI ความเสี่ยง (Transfer/Dead Stock/Seasonal/Delay) + ปุ่มลัด + สรุป relationship จาก Excel
- งบประมาณ = KPI งบ 3 ชั้น (คลัง/เขต/ส่วนกลาง)
- ทำด้วยการ wrap แต่ละบล็อกด้วย `{dashTab === ... && (...)}` โดยไม่ย้าย logic/คำนวณ

### Why
- จาก audit/feedback: dashboard ยัดทุกเรื่องในหน้าเดียว scroll ยาว ผู้ใช้ใหม่งง — แยกเป็นเรื่อง ๆ ตามที่ผู้ใช้เสนอ

### Changed Files
- `src/App.tsx`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน (JSX balanced)
- ตรวจ build สด: มี 3 แท็บ, สลับแล้วเนื้อหาถูกต้อง (ภาพรวมโชว์ Demo+alert ซ่อน risk/budget KPI; ความเสี่ยงโชว์ KPI ความเสี่ยง+relationship ซ่อน Demo; งบประมาณโชว์งบ 3 ชั้น ซ่อน risk/alert)

### Notes / Follow-up
- เหลือเฟส 4 (เก็บกวาด: ไอคอนซ้ำ/ชื่อ/modal pattern + ลบ `_legacy*` arrays ~500 บรรทัด)

## 2026-06-13 - แก้ dead-end หน้ารับของ/Delay (ลิงก์ไปคำขอ/ประวัติ/SKU)

### Summary
- เพิ่มปุ่ม "เปิดคำขอในประวัติ" ในฟอร์มรับของ/Delay (แสดงเมื่อผูกกับคำขอซื้อ) → ไปหน้าประวัติพร้อมเลือกคำขอนั้น
- เพิ่มคอลัมน์ "ดำเนินการ" ในตาราง Receiving & Delay History: ปุ่ม "ดูคำขอ" (ถ้ามี relatedRequestId) และ "ดู SKU"
- เพิ่มข้อความ "ขั้นต่อไป" อธิบายว่า Impact Demand เป็น feedback ปรับ Lead Time/ความเสี่ยงรอบถัดไป
- เพิ่ม prop `onOpenRequestHistory` / `onOpenSku` ให้ `ReceivingDelayPage` และ wire จาก routing (เลือก request + setView history)

### Why
- หน้ารับของ/Delay เดิมบันทึกแล้วได้แค่ตาราง log ไปต่อไม่ได้ (dead-end) — ตามแผน audit flow

### Changed Files
- `src/App.tsx`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน
- ตรวจ build สด: หน้ารับของ/Delay มีปุ่ม "เปิดคำขอในประวัติ" + ข้อความขั้นต่อไป, กดแล้วนำทางไปหน้าประวัติได้, ตาราง log มีปุ่ม ดูคำขอ/ดู SKU

### Notes / Follow-up
- เหลือเฟส 3 (แยก dashboard) และเฟส 4 (เก็บกวาด + ลบ `_legacy*`)

## 2026-06-13 - Overhaul mock data: catalog 12 SKU × 8 คลัง + เปลี่ยนเป็นรหัส PEA จริง

### Summary
- เพิ่ม `src/data/peaCatalog.ts`: catalog พัสดุไฟฟ้าจริง 12 SKU (สายเคเบิล, หม้อแปลง, เสาคอนกรีต, มิเตอร์, ลูกถ้วย, ดรอพเอาท์, เบรกเกอร์ ฯลฯ) + 8 คลัง 3 เขต (I/K/A) + generator usage 12 เดือน (มี season), stock, risk coverage, lead time, supplier price แบบ deterministic (hash เสถียรทุก render)
- เปลี่ยน `peaDataModel.ts` ให้ array หลัก (skuMaster, monthlyUsage, stockSummary, riskCoverage, leadTime, leadTimeSku, supplierSkuPrice) มาจาก generator แทน hardcode 6 SKU/4 คลัง → ข้อมูลครบ ~73 (คลัง×SKU) แทน ~3
- เปลี่ยน demo จากรหัสสั้น (C01/T01/P01...) เป็นรหัส PEA จริง (1CC0CG0002/1DD0DC0000/1CC0CP0012...) ทั้ง `mockData.ts`, `App.tsx`, `procurementHistory.ts`, transfer seed + อัปเดตชื่อ/หน่วย/ราคาให้สมจริงและสอดคล้องกัน (สายใต้ดิน XLPE 240 = 2,000/ม., หม้อแปลง 100kVA = 165,000/เครื่อง, เสาคอนกรีต 12ม. = 4,500/ต้น)
- ล้าง `prototypeAlias.skuId` (demo ใช้รหัส PEA ตรงแล้ว)

### Why
- ผู้ใช้ต้องการ mock data ที่ "เจ๋งกว่านี้": เดิมดูเยอะ (129 คลัง, ชื่อ "Mock") แต่จริง ๆ มีข้อมูลแค่ 4 คลัง 6 SKU หน้าหลายหน้าจึงโล่ง; เลือกให้ริชเต็มและใช้รหัส PEA จริง

### Changed Files
- `src/data/peaCatalog.ts` (ใหม่)
- `src/data/peaDataModel.ts`, `src/data/mockData.ts`, `src/data/procurementHistory.ts`, `src/App.tsx`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน
- ตรวจ build จริง (vite preview): หน้าคลังพัสดุแสดงรหัส PEA + ชื่อจริง + หน่วยถูก (เครื่อง/ต้น/ชุด/เมตร); หน้าวิเคราะห์สต็อกมี ~73 แถวครบ 8 คลัง 3 เขต + SKU ใหม่ (มิเตอร์/ลูกถ้วย); demo flow ยังทำงาน (1CC0CG0002 20ม. = ฿40,000 → อนุมัติระดับเขต + การ์ดดักของจมยังเด้ง)

### Notes / Follow-up
- สำคัญ: dev server ที่เปิดค้างต้อง restart (`npm run dev`) เพื่อโหลด data ใหม่ — HMR ไม่ได้ apply การเปลี่ยน data module ขนาดใหญ่ในเครื่องที่รันค้างไว้นาน (ผมตรวจด้วย vite preview จาก build สดแทน)
- peaDataModel.ts ยังมี array เดิมเก็บไว้เป็น `_legacy*` (unused, ~500 บรรทัด) — ลบทิ้งได้ถ้าต้องการความสะอาด (ยังไม่ลบเพื่อลดความเสี่ยงตอน migrate)
- inventoryRecords ฝั่ง demo ยังเป็น 7 SKU (ตัวเลขเดิมเพื่อคง demo flow) ส่วนข้อมูล PEA ริชครบ 12 SKU × 8 คลัง

## 2026-06-12 - ปรับหน้า login ให้จริงจัง (Login/Register/ลืมรหัสผ่าน)

### Summary
- รื้อหน้า `บัญชีผู้ใช้` เป็น card เดียวมี tab เข้าสู่ระบบ/สมัครสมาชิก + โหมดลืมรหัสผ่าน, มี logo, ยืนยันรหัสผ่าน, ข้อความ error inline
- เพิ่ม handler `resetPassword(username, newPassword)` (PoC: รีเซ็ตด้วย username เพราะยังไม่มีอีเมลจริง) และลิงก์ "ลืมรหัสผ่าน?" / "ยังไม่มีบัญชี? สมัคร" / "กลับไปเข้าสู่ระบบ"
- เพิ่ม microcopy ว่าเวอร์ชันจริงควรต่อ Firebase/Google เพื่อรองรับรีเซ็ตรหัสผ่านทางอีเมลและเก็บข้อมูลรวมศูนย์

### Why
- ผู้ใช้ต้องการหน้า login ที่จริงจังขึ้น มีปุ่ม Register และ Forgot password

### Changed Files
- `src/App.tsx`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน
- ตรวจผ่าน DOM: หน้า auth มี tab login/register, ลิงก์ลืมรหัสผ่าน, โหมด forgot แสดงช่องรหัสผ่านใหม่+ยืนยัน+ปุ่มกลับ

### Notes / Follow-up
- รีเซ็ตรหัสผ่านแบบ username-only ไม่ปลอดภัยจริง เป็น stand-in รอ backend; การเลือก backend (Firebase/Google Sheets/Google Sign-In) รอผู้ใช้ตัดสินใจ

## 2026-06-12 - ระบบ login/register + ความเห็นเก็บชื่อจริง + ลบต้องเป็น admin + รหัส 99999

### Summary
- เปลี่ยนชื่อจาก "ความเห็น PO" เป็นกลาง ๆ "ความเห็น / Feedback" ทุกจุด (ปุ่มลอย, ศูนย์ความเห็น, microcopy)
- เพิ่มระบบ login/register แบบ PoC (เก็บใน localStorage): หน้า `บัญชีผู้ใช้`, สมัคร (ชื่อ/username/password), เข้าสู่ระบบ, ออกจากระบบ + chip ผู้ใช้บน header
- บัญชี admin ในตัว `admin/admin` (role admin) สำหรับสิทธิ์ลบ; ผู้สมัครทั่วไปเป็น role user
- ความเห็นเก็บ `authorName`/`authorUsername` จากผู้ที่เข้าสู่ระบบ (ไม่ fix เป็น "PO"); ปุ่มลอยต้องเข้าสู่ระบบก่อนจึงให้ความเห็นได้
- ลบความเห็นได้เฉพาะ admin และต้องใส่รหัสยืนยัน `99999` (กันการลบโดยไม่ตั้งใจ) — ผู้ใช้ทั่วไปไม่เห็นปุ่มลบ
- เพิ่ม persistent keys `authUsers`, `currentUser`

### Why
- ผู้ใช้ต้องการให้ระบบเก็บว่าใครเป็นผู้ให้ feedback (มี deploy บน Vercel), ไม่อยากให้ชื่อเป็น "PO" ตายตัว และต้องการกันการลบด้วยรหัส/สิทธิ์ admin

### Changed Files
- `src/App.tsx`
- `DATA_POLICY.md` / `README.md` / `Design.md` / `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน
- ตรวจผ่าน DOM: login admin/admin → currentUser role admin persist, ปุ่มลอยจับชื่อ "ผู้ดูแลระบบ" อัตโนมัติ, บันทึกความเห็นมี authorName/username/context, ศูนย์ความเห็นแสดงผู้เขียน @admin, ลบด้วยรหัสผิดถูกปฏิเสธ (ความเห็นยังอยู่) ลบด้วย 99999 สำเร็จ

### Notes / Follow-up
- ข้อจำกัดสำคัญ: ไม่มี backend → localStorage แยกตามเครื่อง/เบราว์เซอร์ ดังนั้นบน Vercel feedback ของแต่ละผู้เข้าชม "ไม่รวมศูนย์" ถ้าต้องการเก็บรวมจริงต้องต่อ backend/DB หรือส่งผ่าน `googlePoFeedback.ts` (Google Sheet) เพิ่ม
- รหัสผ่านเก็บ plaintext ใน localStorage เป็น PoC เท่านั้น ไม่ใช่ระบบ auth ปลอดภัยจริง (มี microcopy เตือนในหน้า register)

## 2026-06-12 - เพิ่มวิเคราะห์ยืม-โอน-แลก + reconcile ราคา mock data ให้สมจริง

### Summary
- เพิ่มประเภท `Swap` (แลกเปลี่ยน) และ field `dueDate`/`returnedDate`/`counterpartSkuName` ใน `TransferRequest` เพื่อ track การคืนและการแลก
- เพิ่ม seed `initialTransferRequests` (ยืม/โอน/แลก สมจริง 11 รายการ) โหลดเป็นค่าตั้งต้นของ transfer state — K030 เป็นคลังที่ยืมบ่อย คืนช้า และขาดบ่อย (สอดคล้องเคสของจม-ของบ)
- เพิ่มหมวด "วิเคราะห์พฤติกรรมการยืม-โอน-แลก" ในหน้าโอน/ยืม: metric (ยืมค้างคืน/เกินกำหนด, คืนแล้ว, แลกทั้งหมด, แลกอะไรบ่อย) + leaderboard 3 ชุด (คลังยืมบ่อย / ค้างคืน-เกินกำหนด / ของขาดบ่อย)
- เพิ่มคอลัมน์ "การคืน" ในตารางประวัติ (คืนแล้ว/เกินกำหนดคืน/ยืมอยู่/รออนุมัติ + วันกำหนด/วันคืน) และแสดง SKU ที่แลกกลับ; ปุ่ม "ปิดงาน" คำขอยืมบันทึก `returnedDate` อัตโนมัติ
- Review & reconcile ราคา mock data ให้สมจริงและสอดคล้องทุก dataset: หม้อแปลง 100kVA 1,200,000→150,000/ลูก, เสาไฟ 12,000→4,500/ต้น, แก้ราคา/จำนวน C01·T01·B05 ใน procurementHistory/deadStock ให้ตรงกับ supplierOffers (C01 คง 2,000/ม. ไว้เพื่อ demo) และปรับ trend ของจมรายปีให้ coherent
- แก้หน่วยในตารางการถือครอง SKU ให้ normalize จาก BATCH (M→เมตร, EA→หน่วย) แทนการบังคับหน่วย demo ที่ทำให้ตัวเลขเพี้ยน

### Why
- ผู้ใช้ต้องการหน้าประวัติยืม-แลกที่เห็นพฤติกรรม (ใครยืมบ่อย/ไม่คืน/ขาดบ่อย/แลกอะไร) และต้องการให้ mock data สมจริงกว่าเดิม โดยเฉพาะราคาที่ขัดกันระหว่าง seed ใหม่กับของเดิม

### Changed Files
- `src/App.tsx`
- `src/data/mockData.ts`
- `src/data/peaDataModel.ts`
- `src/data/procurementHistory.ts`
- `src/utils/procurementAnalysis.ts`
- `DATA_POLICY.md` / `README.md` / `Design.md` / `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน
- ตรวจผ่าน DOM: หน้าโอน/ยืม แสดง leaderboard K030 ยืมบ่อยสุด 3 ครั้ง / เกินกำหนด 2 / ขาดบ่อย 3, แลกสายไฟบ่อยสุด 2 ครั้ง, มี return badge; หน้า Audit มูลค่าของจมรวม ฿4,560,000 ตรงกับราคาที่ reconcile (P01 4,500 + C01 2,000 + B05 1,800 + T01 150,000)

### Notes / Follow-up
- ผู้ใช้เดิมที่เคย persist transfer state ว่าง [] ไว้แล้วจะไม่เห็น seed ใหม่ (seed เป็น first-run) — ล้างผ่านปุ่ม "ล้างประวัติทดสอบ" หรือ clear localStorage ถ้าต้องการ
- P01 ยังมี semantic mismatch เล็กน้อย (demo เรียก "เสาไฟ/ต้น" แต่ map ไป PEA SKU ที่เป็นเมตร) — ตารางถือครองจึงโชว์ stock เป็น "เมตร" ตามข้อมูลจริง ส่วน dead listing เป็น "ต้น"; ถ้าจะให้ตรงสนิทต้อง remap demo SKU

## 2026-06-12 - ปรับถ้อยคำให้สุภาพ + เพิ่มการถือครอง SKU รายคลังในหน้า SKU

### Summary
- เปลี่ยนถ้อยคำใน UI ให้เป็นทางการ: "จุดที่ควรตบหน้า" → "จุดที่ควรทบทวน", "เคสน่าตรวจ (กวนทีน)" → "เคสที่ควรทบทวน" และเพิ่มกฎใน `DATA_POLICY.md` ว่าห้ามใช้คำกระแทกแดกดัน (ตบหน้า/กวนทีน/ประจาน) ใน UI
- เพิ่ม helper `getSkuHoldingsByWarehouse` ใน `procurementAnalysis.ts` รวมคงคลังราย Factory/Plant (`peaStockSummary`) + usage/cover (`peaRiskCoverageRecords`) + annotate ของจม (`deadStockListings`)
- เพิ่มตาราง "การถือครอง {SKU} รายคลัง" ในหน้า SKU Detail แสดง คลัง/เขต/คงคลัง/ใช้เฉลี่ยต่อเดือน/Stock Cover/สถานะ (ของจม·ไม่ขยับกี่เดือน / เสี่ยงขาด / เหมาะสม) เพื่อให้ตอนกระโดดจาก Audit ไปหน้า SKU เห็นภาพการถือครองรายคลังทันที

### Why
- Feedback ผู้ใช้: เลี่ยงคำแรง ๆ ในทุกหน้า และตอนกระโดดไปหน้า SKU ควรเห็นรายละเอียดการถือครอง SKU นั้นของแต่ละคลัง

### Changed Files
- `src/App.tsx`
- `src/utils/procurementAnalysis.ts`
- `DATA_POLICY.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน
- ตรวจผ่าน DOM: หน้า Audit ไม่มีคำว่า ตบหน้า/กวนทีน แล้ว (เป็น ทบทวน), หน้า SKU C01 แสดงตารางถือครอง 4 คลัง (K030 ของจม, I010/I020/K010 เสี่ยงขาด), flow Audit → ดูใบของบ → ดูหน้า SKU (P01) แสดงถือครอง K030 ของจมไม่ขยับ 9 เดือน

### Notes / Follow-up
- มี unit mismatch เล็กน้อยสำหรับ P01 (seed: คงคลังจาก BATCH เป็น "M" แต่ของจม/ชื่อ demo เป็น "ต้น") เพราะ demo SKU สั้น map ไป long PEA SKU ที่หน่วยต่างกัน — เป็น artifact ของ seed ถ้าต้องการให้ตรงค่อย normalize ภายหลัง

## 2026-06-12 - ปรับ Dead Stock UX ตาม feedback: banner hero, audit drill-down, ศูนย์ความเห็น PO

### Summary
- ย้าย Dead Stock Exchange banner ขึ้นบนสุดของ Dashboard (เหนือ filter) และทำเป็น hero (header gradient, มูลค่าทุนจมตัวใหญ่, ปุ่มยืม/แลกเด่นเมื่อจับคู่คลังได้)
- หน้า Procurement Audit เพิ่ม filter (ปีงบ/เขต/หมวดพัสดุ/เฉพาะที่ติด flag), เพิ่มแถบ % ใช้งบและไอคอนแนวโน้มในตารางเทียบคลัง
- เพิ่ม drill-down: กดแถวหรือปุ่ม "ดูใบของบ" เปิด modal รายละเอียดใบของบ (เหตุผล flag เต็ม, การ์ดสรุป จำนวน/ต้นทุน/มูลค่า/เทียบ peer, ตารางประวัติของบ SKU เดียวกันย้อนหลัง, ของจม SKU นั้นทุกคลัง, ปุ่มไปโอน/ยืม) แทนปุ่ม "ดู SKU" เดิม ลดการกระโดดข้ามหน้า
- เปลี่ยนความเห็น PO เป็นแบบ hybrid: เพิ่ม `FeedbackQuickAdd` ปุ่มลอยทุกหน้า (auto-tag หน้าปัจจุบัน) + หน้าใหม่ `ศูนย์ความเห็น PO` (Feedback Center) รวมความเห็นทุกหน้า กรองตามหน้าได้ และกด tag เพื่อกระโดดไปหน้านั้น
- เพิ่ม View `feedback`, เมนู `ศูนย์ความเห็น PO`, `viewLabels` map สำหรับ tag context และ helper `addPoNote(text, context)` / `deletePoNote`
- เพิ่ม helper ใน `procurementAnalysis.ts`: `getDeadStockForSku`, `getBudgetHistoryForWarehouseSku`, `getPeerAverageForCategory` และ field `peerAverageAmount` ใน flagged record

### Why
- Feedback ผู้ใช้: banner จมอยู่ใต้ filter ไม่สะดุดตา, หน้า Audit แบนไม่มีมิติ (กรองไม่ได้/ดูรายละเอียดใบของบไม่ได้), flow กระโดดไปมา, และความเห็น PO ควรอยู่ทุกหน้า + มีหน้ารวม

### Changed Files
- `src/App.tsx`
- `src/utils/procurementAnalysis.ts`
- `DATA_POLICY.md`
- `README.md`
- `Design.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน
- ตรวจผ่าน DOM บน dev server: banner อยู่บนสุดเหนือ filter, audit มี 3 filter + ปุ่มดูใบของบ 14 ปุ่ม + แถบ % ใช้งบ, เปิด modal ใบของบ BR-K030-69-P01 เห็น flag ครบ 3 + ประวัติของบเสาไฟ 3 ปีติด (2567/2568/2569) + ของจม 320 ต้น, ปุ่มลอยความเห็น PO auto-tag "แดชบอร์ด" บันทึกแล้ว persist + แสดงในศูนย์ความเห็นพร้อม tag

### Notes / Follow-up
- modal ใช้ position:fixed overlay (เป็นแอปจริงไม่ใช่ widget sandbox จึงใช้ได้)
- ความเห็น PO เก่าที่เคยบันทึกก่อนเพิ่ม field `context` จะไม่มี tag หน้า (แสดง undefined) — ของใหม่ tag ครบ

## 2026-06-12 - เพิ่ม Dead Stock Exchange, การ์ดดักก่อนซื้อ และหน้า "ตรวจซื้อซ้ำ-ของจม"

### Summary
- เพิ่ม seed data `src/data/procurementHistory.ts`: ประวัติการของบ/สั่งซื้อย้อนหลัง 3 ปีงบ (2567-2569) ราย คลัง×SKU, งบจัดสรร/ใช้จริง/มูลค่าของจมรายปี และรายการ Dead Stock พร้อมจับคู่คลังที่ขาด
- เพิ่ม util `src/utils/procurementAnalysis.ts` สำหรับคำนวณมูลค่าของจม, % ใช้งบ และ flag "กวนทีน" 3 เกณฑ์ (ซื้อซ้ำทั้งที่ของจม / เร่งใช้งบให้หมด / งบสูงกว่าคลังอื่น) โดยคำนวณจาก seed ไม่ hardcode ผลลัพธ์
- เพิ่ม `Dead Stock Exchange` banner บน Dashboard เพื่อประกาศของจมที่ยืม/แลกได้ พร้อมมูลค่าทุนจมและ aging (ไม่ขยับกี่เดือน) ปุ่มต่อเข้าหน้าโอน/ยืม
- เพิ่มการ์ด `DeadStockBorrowAlert` ดักในหน้า Create Purchase Request: ถ้า SKU ที่กำลังจะซื้อมีของจมที่คลังอื่น ระบบเสนอยืมแทนพร้อมตัวเลขประหยัด (เช่น C01 ที่ I010 → มีของจมที่ K030)
- เพิ่มเมนู/หน้าใหม่ `ตรวจซื้อซ้ำ-ของจม` (Procurement Audit): metric สรุป, ตารางเทียบคลัง (งบ vs ของจม + แนวโน้ม), ตารางประวัติการของบพร้อม flag และกล่องบันทึกความเห็น PO ที่ persist
- เพิ่ม persistent key `procurementNotes` สำหรับเก็บความเห็น PO เป็น JSON state

### Why
- จาก feedback PO ที่ถามว่า Dead Stock monitor ยังไงและเทียบได้ไหม + แนวคิดของผู้ใช้ว่าถ้าจัดซื้อแม่นและตรวจสอบได้ ของจมต้องลดเอง
- เคสจริง: หลายคลังเร่งใช้งบปลายปีให้หมด (กลัวโดนตัดงบปีหน้า) จนสั่งของซ้ำทั้งที่ยังมีของจม ต้องมีหน้าที่เปรียบเทียบย้อนหลังเพื่อจับ pattern นี้และใช้คุยกับเจ้าของโจทย์

### Changed Files
- `src/data/procurementHistory.ts` (ใหม่)
- `src/utils/procurementAnalysis.ts` (ใหม่)
- `src/App.tsx`
- `DATA_POLICY.md`
- `README.md`
- `Design.md`
- `.claude/launch.json` (ใหม่ - สำหรับ dev preview)
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน
- รัน dev server + ตรวจผ่าน DOM: banner แสดงบน Dashboard, การ์ดดักแสดงในหน้า Create PR ของ C01 (กำลังซื้อ 20 เมตร ฿40,000 ↔ ของจม K030 6,200 เมตร), หน้า Audit แสดงมูลค่าของจมรวม ฿5,894,000 และ flag ครบ 3 เกณฑ์, ความเห็น PO persist ใน localStorage แล้วยังอยู่หลังบันทึก

### Notes / Follow-up
- ประวัติการของบและรายการ Dead Stock เป็น seed สำหรับ PoC; ใน production ควร derive จาก movement transaction + งบจัดสรรจริง ตามที่คอมเมนต์ไว้ในไฟล์ seed
- เกณฑ์ flag (95% ใช้งบ, 1.5 เท่า peer) รวมไว้ที่ `procurementThresholds` ปรับได้ที่เดียว

## 2026-06-12 - เพิ่มเอกสาร Design สำหรับสรุปสถานะและแนวทางออกแบบ

### Summary
- เพิ่ม `Design.md` เพื่อสรุปความคืบหน้าปัจจุบัน, product goal, UX flow, data model, calculation design, workflow, audit, VMI และ technical architecture
- เพิ่ม `Design.html` เป็นเวอร์ชัน HTML standalone สำหรับเปิดอ่านหรือส่งต่อเป็นเอกสาร presentation/reference ได้ง่าย
- สรุปกฎสำคัญของระบบ เช่น ต้องใช้ค่าจริงในการอธิบายสูตร, ต้องเก็บ Calculation Snapshot, ห้ามเดาเมื่อ business rule ไม่ชัดเจน และต้อง persist action สำคัญ

### Why
- ผู้ใช้ต้องการสรุปภาพรวมทั้งหมดจนถึงตอนนี้ และต้องการเอกสาร Design ทั้งแบบ Markdown และ HTML เพื่อส่งต่อหรือใช้ประกอบการตรวจ review

### Changed Files
- `Design.md`
- `Design.html`
- `PROJECT_UPDATES.md`

### Verification
- ตรวจไฟล์เอกสารที่เพิ่มใหม่แล้วว่าเป็นเนื้อหา static ไม่กระทบ runtime ของแอป

### Notes / Follow-up
- หากมีการเปลี่ยน design, data model, formula หรือ workflow หลังจากนี้ ควรอัปเดต `Design.md` และ `Design.html` ให้ตรงกับระบบปัจจุบันด้วย

# Project Updates

ไฟล์นี้ใช้บันทึกความคืบหน้าและการแก้ไขของโปรเจกต์ `AI Inventory Planning & Procurement Platform Prototype`

## Update Rule

ทุกครั้งที่มีการแก้ไขโปรเจกต์ ให้เพิ่มรายการใหม่ในไฟล์นี้เสมอ โดยระบุ:

- วันที่แก้ไข
- สรุปสิ่งที่เปลี่ยน
- เหตุผลหรือบริบทของการเปลี่ยน
- ไฟล์หลักที่เกี่ยวข้อง
- วิธีตรวจสอบ เช่น build, test, manual check หรือไม่ได้ตรวจเพราะเหตุใด

## Entry Template

```md
## YYYY-MM-DD - Short Title

### Summary
- ...

### Why
- ...

### Changed Files
- `path/to/file`

### Verification
- ...

### Notes / Follow-up
- ...
```

## 2026-05-31 - แก้ช่องกรอกงบประมาณให้ลบเลข 0 ได้

### Summary
- ปรับ Budget Settings ให้เก็บค่าระหว่างพิมพ์เป็น string ก่อน แล้วค่อยแปลงเป็น number ตอนบันทึก
- แก้ปัญหา input ตัวเลขที่ลบ `0` ไม่ได้ เพราะ `Number("")` ถูกแปลงกลับเป็น `0` ทันที ทำให้พิมพ์แล้วเกิดค่าเช่น `016`
- ค่า summary card ในหน้า Budget ยังแสดงผลเป็นตัวเลขจริงโดยแปลง draft string ชั่วคราวมาคำนวณ
- เพิ่มกฎใน `DATA_POLICY.md` ว่า numeric budget input ต้องยอมให้ลบค่าว่างระหว่างพิมพ์ได้

### Why
- ผู้ใช้พบว่าเวลาพิมพ์งบประมาณใหม่ ไม่สามารถลบเลข 0 เดิมได้ ทำให้ค่าที่กรอกผิดรูปแบบ

### Changed Files
- `src/App.tsx`
- `DATA_POLICY.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- ค่าว่างระหว่างพิมพ์จะถูกตีความเป็น 0 เฉพาะตอนคำนวณ summary และตอนบันทึกเท่านั้น

## 2026-05-31 - เพิ่มหน้าตั้งค่างบประมาณ

### Summary
- เพิ่มหน้า `งบประมาณ` ใน sidebar สำหรับแก้ Local Budget, Regional Budget และ Central Budget
- เพิ่ม persistent state `budgetSettings` เพื่อเก็บงบที่ผู้ใช้แก้ไว้หลัง refresh
- เปลี่ยน Budget Check และ Approval Routing ของ SKU Detail, Calculation Detail และ Create Purchase Request ให้ใช้งบจาก budget settings ล่าสุด
- ปรับ Dashboard Budget Overview ให้แสดงงบจาก budget settings ตามตัวกรองปัจจุบัน พร้อมคำอธิบาย `คำนวณจริงจาก` และ `เปลี่ยนเมื่อ`
- เพิ่ม Budget Change Log แยกจาก Settings/Supplier log
- อัปเดต `DATA_POLICY.md` และ `README.md` ให้ระบุว่าการแก้งบต้อง persist และไม่แก้ snapshot เก่าย้อนหลัง

### Why
- ผู้ใช้ต้องการหน้าสำหรับตั้งค่างบต่าง ๆ และงบที่แก้ต้องกระทบการตรวจงบ/เส้นทางอนุมัติจริง ไม่ใช่แสดงผลอย่างเดียว

### Changed Files
- `src/App.tsx`
- `DATA_POLICY.md`
- `README.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- งบที่แก้มีผลกับคำขอใหม่หรือ preview ใหม่เท่านั้น ส่วน Request History และ Calculation Snapshot เดิมยังคงค่าตามวันที่สร้างคำขอ

## 2026-05-31 - รวม Source ตัวกรอง Dashboard และการใช้ SKU

### Summary
- เพิ่ม helper กลางสำหรับตัวเลือก `เขต`, `WH Id` และ `SKU` จาก `peaWarehouseMaster`, `peaSkuMaster` และ `peaMonthlyUsage`
- ปรับ Dashboard ให้ใช้ตัวกรองชุดเดียวกับหน้า “การใช้ SKU” แทน select แบบ hardcoded
- ปรับ metric บน Dashboard ให้คำนวณตามตัวกรองจาก usage/relationship data ชุดเดียวกัน
- ปรับหน้า “การใช้ SKU” ให้เรียก helper กลางเดียวกัน เพื่อลดความเสี่ยงที่ตัวเลือกของแต่ละหน้าจะไม่ตรงกัน
- อัปเดต `DATA_POLICY.md` และ `README.md` เป็นกฎว่าตัวกรองที่ใช้ซ้ำต้องอ่านจาก source/helper กลาง ห้าม hardcode option แยกหน้า

### Why
- ผู้ใช้พบว่า Dashboard กับหน้าการใช้ SKU มีตัวเลือก filter ไม่ตรงกัน เพราะใช้คนละ data source จึงรวมให้ใช้ master จาก Excel seed ชุดเดียวกัน

### Changed Files
- `src/App.tsx`
- `DATA_POLICY.md`
- `README.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- Flow demo C01 ยังใช้ alias map จาก SKU สั้นไป SKU ใน PEA model เพื่อให้หน้ารายละเอียดเดิมยังเปิดได้

## 2026-05-30 - ย้ายรายละเอียดสูตรเข้าไปใน Metric Card

### Summary
- เพิ่ม props `formula` และ `changes` ให้ `MetricCard` เพื่อแสดงวิธีคำนวณและเงื่อนไขที่ทำให้ค่าเปลี่ยนภายในกรอบเดียวกัน
- ย้ายคำอธิบายของการ์ด Dashboard, Relationship Summary, Usage Summary และ SKU Detail เข้าไปอยู่ในกรอบ metric card แต่ละใบ
- ลบชุดคำอธิบายที่แยกอยู่ใต้ metric cards ในหน้าที่มี metric card แล้ว
- เพิ่มสูตรในกรอบของ Relationship Insight และ Inventory formula cards เพื่อให้ทุก dashboard-style card ใช้ pattern เดียวกัน
- เติมรายละเอียดสูตรในกรอบค่าเฉลี่ยตาม Season ให้แสดงเดือนที่นำมาหารและจำนวนเดือนที่ใช้คำนวณ
- อัปเดต `DATA_POLICY.md` และ `README.md` ว่า dashboard metric ต้องใส่ `คำนวณจริงจาก` และ `เปลี่ยนเมื่อ` ในกรอบเดียวกับตัวเลขเสมอ

### Why
- ผู้ใช้ต้องการให้รายละเอียดวิธีคำนวณอยู่ในกรอบของตัวเลขนั้นเลย เพื่อไม่ต้องเทียบการ์ดกับข้อความอธิบายด้านล่างเอง

### Changed Files
- `src/components/common.tsx`
- `src/App.tsx`
- `DATA_POLICY.md`
- `README.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- `MetricCard` ยังรองรับการใช้งานแบบเดิมได้ หากไม่ส่ง `formula` หรือ `changes` จะไม่แสดงรายละเอียดเพิ่ม

## 2026-05-30 - แก้ Metric Card ไม่ให้ข้อความล้นกรอบ

### Summary
- ปรับ `MetricCard` กลางให้ label, value และ helper wrap อยู่ในกรอบเสมอ
- เปลี่ยน layout จากการวางตัวเลขกับ helper ในบรรทัดเดียว เป็นเรียงลงมาเพื่อรองรับตัวเลขยาวและข้อความช่วยยาว
- เพิ่ม `min-w-0`, `break-words` และ `overflow-wrap:anywhere` เพื่อกันข้อความทะลุออกจาก card

### Why
- หน้า Usage มี metric เช่น `1,916,456` และ helper `หน่วยตาม SKU` ที่เบียดกันจนอ่านเหมือนล้นกรอบ ต้องให้ทุก metric card อยู่ในกรอบและอ่านได้บนทุกขนาดจอ

### Changed Files
- `src/components/common.tsx`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- การแก้นี้กระทบทุกหน้าที่ใช้ `MetricCard` ให้ปลอดภัยขึ้นโดยไม่ต้องแก้ทีละหน้า

## 2026-05-30 - บังคับให้คำอธิบายสูตรใช้ค่าจริงและแยกคำอธิบายราย Metric

### Summary
- ปรับหน้า Calculation Detail ให้การ์ดด้านบนแสดงการคำนวณจริงของ SKU/Request ปัจจุบันแทนการแสดงสูตร generic จาก `formulaList`
- ปรับ `CalculationExplanationPanel` เปลี่ยนคำว่า `ตัวอย่างคำนวณ` เป็น `คำนวณจริงจากข้อมูลนี้` และระบุค่าก่อนปัด/หลังปัดของ Reorder Point
- เพิ่มคำอธิบายแยกราย metric ใน Dashboard, Inventory, SKU Detail, Usage และ Relationship Summary แทนข้อความรวมยาวก้อนเดียว
- อัปเดต `DATA_POLICY.md` และ `README.md` ให้เป็นกฎว่าห้ามใช้สูตรลอย ๆ ต้องใช้ค่าจริงของ record/request/snapshot และถ้าไม่เข้าใจต้องถามก่อน ห้ามเดา

### Why
- ผู้ใช้ต้องการให้ทุกสูตรอธิบายจากค่าจริงบนหน้าจอ เพื่อให้ไม่ต้องตีความเองและลดความเสี่ยงจากการอธิบายผิด
- Dashboard ต้องช่วยให้ผู้ใช้เข้าใจแต่ละตัวเลขได้ทันที โดยแยกคำอธิบายว่าแต่ละค่าเกิดจากข้อมูลอะไรและเปลี่ยนเมื่อไร

### Changed Files
- `src/App.tsx`
- `src/components/CalculationExplanationPanel.tsx`
- `DATA_POLICY.md`
- `README.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- กฎใหม่ระบุชัดว่าถ้าข้อมูลหรือสูตรไม่ชัด ต้องถามผู้ใช้ก่อน ห้ามเดาหรือสร้างข้อมูลสมมติ

## 2026-05-29 - เพิ่มคำอธิบายตัวเลข Dashboard และ AI Feedback Auto-tune

### Summary
- เพิ่มคำอธิบายที่มา/สูตรและ trigger การเปลี่ยนแปลงของตัวเลขใน Dashboard, Inventory, Usage, Approval, History, VMI Candidate และ VMI Simulation
- เพิ่ม AI Feedback loop ใน Request History เพื่อบันทึกค่าจริงเทียบกับ AI Suggested Quantity พร้อม error quantity และ error percent
- ถ้า error สูงกว่าเกณฑ์ส่วนต่างสูงใน Settings ระบบจะ auto-tune สูตรแบบก้าวเล็ก โดยปรับ Service Level / Seasonal Factor และสร้าง formula version ใหม่
- เพิ่มสรุป AI Accuracy Feedback บน Dashboard เพื่อแสดงจำนวน feedback, error เฉลี่ย และ bias ของระบบ
- อัปเดต `DATA_POLICY.md` ให้เป็นกฎว่าหน้า dashboard/metric/AI Suggest ต้องอธิบายที่มาตัวเลข และ feedback ต้องไม่แก้ snapshot เดิมย้อนหลัง

### Why
- ผู้ใช้และ mentor ต้องเห็นว่าตัวเลขบน dashboard คำนวณจากอะไร เปลี่ยนเมื่อไร และหาก AI Suggest ไม่ตรงกับค่าจริง ระบบมีประวัติและ feedback loop สำหรับปรับปรุงสูตร

### Changed Files
- `src/App.tsx`
- `DATA_POLICY.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- Auto-tune ใน PoC เป็นการปรับ policy แบบก้าวเล็กและสร้าง version ใหม่ ไม่ใช่ machine learning backend เต็มรูปแบบ
- Calculation Snapshot เดิมใน Request History ยังถูกเก็บตามเวลาที่สร้างคำขอและไม่เปลี่ยนย้อนหลัง

## 2026-05-29 - ทำให้ Save Settings แบบไม่มีการเปลี่ยนค่าไม่สร้าง Version Log

### Summary
- ปรับการกดบันทึกในหน้า Settings แบบไม่มีการเปลี่ยนค่า policy ให้เป็น no-op
- ถ้าไม่มีค่า policy ที่เปลี่ยน ระบบจะแจ้งเตือนและไม่เพิ่ม Formula Version History
- ไม่สร้าง Settings Change Log ประเภท `savedConfirmation` สำหรับการบันทึกเปล่า ๆ แล้ว
- อัปเดต `DATA_POLICY.md` ให้เป็นกฎว่าการกดบันทึกโดยไม่มีการเปลี่ยนค่า policy ต้องไม่สร้าง version/log เพิ่ม

### Why
- ลด log ซ้ำและทำให้ Formula Version History สื่อความหมายว่ามีการเปลี่ยน policy จริงเท่านั้น

### Changed Files
- `src/App.tsx`
- `DATA_POLICY.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- การ Save Supplier แบบไม่มีการเปลี่ยนค่ายังคงมี confirmation log แยกอยู่ เพราะเป็นการยืนยันข้อมูลติดต่อ ไม่ใช่ formula version

## 2026-05-29 - เปลี่ยน Formula Version ให้อัปเดตอัตโนมัติ

### Summary
- เปลี่ยนช่อง Formula Version ในหน้า Settings เป็น read-only
- เพิ่ม logic ให้ระบบเพิ่มเวอร์ชันอัตโนมัติเมื่อมีการแก้ policy ที่กระทบการคำนวณ เช่น `v1.0` เป็น `v1.1`
- ถ้าแก้ค่าแล้วกลับมาเท่าค่า policy ปัจจุบัน ระบบจะคงเวอร์ชันเดิมก่อนบันทึก
- ตอนกดบันทึก ระบบคำนวณเวอร์ชันซ้ำอีกชั้นเพื่อกันการส่งค่าผิดจาก UI
- อัปเดต `DATA_POLICY.md` ให้เป็นกฎว่า Formula Version ต้อง auto update และไม่ให้ผู้ใช้กรอกเอง

### Why
- ลดความสับสนของผู้ใช้และทำให้ Audit Trail ของสูตรคำนวณมีมาตรฐานมากขึ้น

### Changed Files
- `src/App.tsx`
- `DATA_POLICY.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- Auto version จะเพิ่มเลขชุดสุดท้ายของ string เช่น `v1.9` เป็น `v1.10`

## 2026-05-29 - แก้ Clear History ให้ล้าง Formula Version History ครบ

### Summary
- แก้ปุ่ม `ล้างประวัติทดสอบ` ให้เขียนค่า reset ลง persistent JSON storage โดยตรงสำหรับ Request, Contact Log, Change Log และ Formula Version History
- เพิ่ม helper สำหรับสร้าง baseline ของ Formula Version History จาก policy ปัจจุบันหลังล้างประวัติ
- clone ค่า seed ของ Request และ Contact Log ก่อน setState เพื่อกันการอ้างอิง array เดิม
- แก้ key ของแถว Formula Version History ให้ไม่ซ้ำ แม้มี version และ timestamp เท่ากัน

### Why
- หลังล้างประวัติยังเห็น Formula Version History เก่าค้างอยู่บางรายการ ต้องทำให้ reset ทั้ง state และ persistent storage ชัดเจน

### Changed Files
- `src/App.tsx`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- ปุ่มนี้ล้างเฉพาะข้อมูลใน browser persistent JSON state ไม่สามารถล้าง row ที่ส่งออกไป Google Sheet แล้วได้

## 2026-05-29 - เพิ่มปุ่มล้างประวัติทดสอบ

### Summary
- เพิ่มปุ่ม `ล้างประวัติทดสอบ` ในหน้า Settings
- ปุ่มนี้รีเซ็ต Request History, Approval Timeline, Contact History, Settings Change Log และ Formula Version History ให้เหลือ baseline สำหรับทดสอบต่อ
- ไม่ลบ Supplier, SKU, Supported Items, ราคา, Lead Time, MOQ หรือค่า Formula Policy ปัจจุบัน
- เพิ่ม confirmation ก่อนล้างข้อมูลเพื่อกันกดพลาด

### Why
- ผู้ใช้ต้องการล้าง log ที่เกิดจากการทดสอบซ้ำ ๆ เพื่อให้หน้า History/Log ไม่ยาวเกินไปตอน demo

### Changed Files
- `src/App.tsx`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- ข้อมูลที่ถูกล้างเป็น persistent JSON state ดังนั้นหลังล้างแล้ว refresh หน้าจะยังเห็นสถานะที่ถูกรีเซ็ตแล้ว

## 2026-05-29 - เพิ่มคำอธิบายผลกระทบของ Settings และ Formula Policy

### Summary
- เพิ่มข้อความช่วยใต้ field ในหน้า Settings เพื่ออธิบายว่า Formula Version, Service Level, Z-score, Seasonal Factor, Budget Factor, High Variance Threshold และ Version Note ใช้ทำอะไร
- เพิ่ม callout ในหน้า Settings ว่าการเปลี่ยน policy มีผลหลังบันทึกกับการคำนวณใหม่ใน Dashboard, SKU Detail, Create Request และ VMI แต่ไม่เปลี่ยน Request History / Calculation Snapshot เดิมย้อนหลัง
- เพิ่มข้อความอธิบายในกฎนโยบายอนุมัติและนโยบายการขอแตกต่างจากค่าที่ระบบแนะนำว่าค่าใดถูกคำนวณใหม่เมื่อสร้างคำขอ
- อัปเดต `DATA_POLICY.md` ให้เป็นกฎถาวรว่าทุกงานที่เกี่ยวกับสูตรหรือ Settings ต้องมีข้อความช่วยอธิบายผลกระทบและ snapshot behavior
- เพิ่ม `.env.local` ใน `.gitignore` เพื่อกันไม่ให้ endpoint ส่วนตัวของ Google Web App ถูก commit

### Why
- ผู้ใช้ต้องการให้คนใช้งานเข้าใจว่าค่าตั้งค่าแต่ละตัวใช้คำนวณอะไร และเมื่อแก้ไขจะกระทบค่าหน้าอื่นทันทีหรือเฉพาะคำขอถัดไป

### Changed Files
- `src/App.tsx`
- `DATA_POLICY.md`
- `.gitignore`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- หากเพิ่ม field ตั้งค่าใหม่ในอนาคต ต้องเพิ่ม helper text และระบุผลกระทบต่อ calculation/snapshot เสมอ

## 2026-05-29 - เพิ่ม Troubleshooting สำหรับ Google Sheet Endpoint

### Summary
- ตรวจ `.env.local` พบว่ามี `VITE_GOOGLE_PO_FEEDBACK_ENDPOINT` แล้ว และ URL เป็น Web App `/exec`
- ทดสอบ POST ไป endpoint แล้วได้ `401 Unauthorized` จึงสรุปว่า endpoint ยังไม่เปิดสิทธิ์หรือยังไม่ได้ authorize ฝั่ง Google Apps Script
- อัปเดต `GOOGLE_SHEET_ENDPOINT.md` เพิ่มขั้นตอนแก้ `401 Unauthorized`, การเลือก `Who has access: Anyone`, การใช้ New version และกรณีสร้าง Script จาก `script.google.com/home` ที่ต้องใช้ `SpreadsheetApp.openById`

### Why
- ผู้ใช้แจ้งว่า PO feedback ยังไม่เข้า Google Sheet จึงต้องแยกปัญหาว่าเกิดจาก React หรือ Google Apps Script deployment

### Changed Files
- `GOOGLE_SHEET_ENDPOINT.md`
- `PROJECT_UPDATES.md`

### Verification
- ทดสอบ POST แล้วพบ `401 Unauthorized` จาก Google endpoint

### Notes / Follow-up
- หลังผู้ใช้แก้สิทธิ์ deployment และ restart dev server ให้ทดสอบ Submit/Approve อีกครั้ง

## 2026-05-29 - เพิ่ม Optional Google Sheet PO Feedback Endpoint

### Summary
- เพิ่ม `src/utils/googlePoFeedback.ts` สำหรับส่งสำเนา PO feedback/event ไป Google Apps Script endpoint เมื่อมีการ Save Draft, Submit Request, Escalate, Approve, Reject หรือ Request More Info
- เพิ่ม env `VITE_GOOGLE_PO_FEEDBACK_ENDPOINT` ผ่าน `.env.example` และ type ใน `src/vite-env.d.ts`
- เพิ่ม `GOOGLE_SHEET_ENDPOINT.md` พร้อมตัวอย่าง Google Apps Script สำหรับรับ payload แล้ว append ลงชีท `PO Feedback`
- เพิ่มสถานะ endpoint ในหน้า Settings เพื่อให้ผู้ใช้เห็นว่าเปิดใช้งาน Google feedback แล้วหรือยัง
- ปรับ `README.md` และ `DATA_POLICY.md` ให้ชัดว่า Google Sheet เป็น optional feedback channel ไม่ใช่ source of truth

### Why
- ผู้ใช้ต้องการต่อ endpoint ของ Google เพื่อดู feedback ของ PO/approval ได้ใน Google Sheet ระหว่าง demo
- ต้องเก็บข้อมูลหลักใน persistent JSON state และ Calculation Snapshot เหมือนเดิม เพื่อไม่ให้ external endpoint ทำให้ flow หลักล้ม

### Changed Files
- `src/App.tsx`
- `src/utils/googlePoFeedback.ts`
- `src/vite-env.d.ts`
- `.env.example`
- `GOOGLE_SHEET_ENDPOINT.md`
- `README.md`
- `DATA_POLICY.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- ใช้ `fetch` แบบ `no-cors` สำหรับ Apps Script Web App จึงส่งข้อมูลได้ง่ายใน PoC แต่ frontend จะอ่าน response จริงไม่ได้ หากต้องการ error handling เต็มรูปแบบควรมี backend proxy

## 2026-05-29 - เปลี่ยนจาก Mock-only เป็น Persistent JSON State

### Summary
- เพิ่ม `src/utils/persistentJsonStore.ts` สำหรับโหลด/บันทึกข้อมูลเป็น JSON state ใน browser `localStorage`
- ปรับ App state ให้โหลดจาก persistent JSON ก่อน หากไม่มีจึงใช้ seed data จาก `mockData.ts`
- Persist ข้อมูลสำคัญ ได้แก่ Supplier, SKU, Inventory input, Supplier Offer, Purchase Request, Contact Log, Formula Policy, Formula Version และ Change Log
- เพิ่ม `DATA_POLICY.md` เพื่อกำหนดกฎว่า seed data ใช้เป็นค่าเริ่มต้นเท่านั้น ทุก action ต้อง persist และค่าคำนวณต้องมาจาก data ปัจจุบัน
- อัปเดต `README.md` ให้ระบุ rule ใหม่ และลบแนวคิดว่า workflow เป็น mock-only/in-memory
- เพิ่มข้อความในหน้า Settings เพื่อบอกว่าข้อมูลผู้ใช้ถูกเก็บเป็น JSON state และ snapshot ต้องเก็บตามเวลาที่สร้างคำขอ

### Why
- ผู้ใช้ต้องการให้ระบบไม่ใช่ mock data ชั่วคราว แต่ต้องเก็บข้อมูลที่แก้ไข/เพิ่ม/submit ได้จริงหลัง refresh
- เตรียมโครงสร้างให้เปลี่ยนจาก frontend JSON storage ไปเป็น backend/database ได้ในอนาคตโดยไม่เปลี่ยน business flow

### Changed Files
- `src/App.tsx`
- `src/utils/persistentJsonStore.ts`
- `DATA_POLICY.md`
- `README.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- Frontend-only app ไม่สามารถเขียนกลับไฟล์ `.json` ใน repo ได้โดยตรง จึงใช้ browser localStorage เป็น persistent JSON storage จนกว่าจะมี backend

## 2026-05-29 - แก้เวลา Log และตรวจ Snapshot/Approval Storage

### Summary
- แก้ log ที่เกิดจากการกดบันทึกใน Settings ให้ใช้เวลาปัจจุบันโซน `Asia/Bangkok` แทนวันที่ hardcode `2026-05-05`
- แก้ Formula Version History ให้บันทึก `createdAt` จากเวลาปัจจุบันเมื่อผู้ใช้กดบันทึกสูตรใหม่
- แก้ Supplier Contact Log, Purchase Request, Calculation Snapshot และ Approval Timeline ที่ผู้ใช้สร้างใหม่ให้ใช้เวลาปัจจุบัน
- แก้ Request ID ใหม่ให้หาเลข `REQ-xxx` ที่ว่างถัดไปแทนการใช้ `REQ-001` ซ้ำจนข้อมูลเดิมถูกแทนที่
- แก้ Approval action ให้บันทึก `approvedQuantity` กลับเข้า Calculation Snapshot เมื่ออนุมัติ เพื่อให้ History/Audit Trail แสดงค่าที่อนุมัติจริง
- เพิ่ม log ยืนยันใน Settings กรณีกดบันทึกโดยไม่มี field เปลี่ยน เพื่อให้ผู้ใช้เห็นว่าปุ่มบันทึกทำงานแล้ว

### Why
- ป้องกัน audit log แสดงวันที่เก่าซ้ำ ๆ และไม่ตรงกับวันที่ใช้งานจริง
- ทำให้ข้อมูลที่ผู้ใช้สร้างใหม่ไม่ทับกัน และทำให้ Request History ใช้ snapshot ที่ครบขึ้นหลัง approval

### Changed Files
- `src/App.tsx`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- วันที่ใน `src/data/mockData.ts` ยังเป็นวันที่จำลองสำหรับข้อมูลตัวอย่างเริ่มต้น ไม่ใช่ข้อมูลที่ผู้ใช้สร้างใหม่

## 2026-05-24 - เพิ่ม Relationship Analysis, Lead Time Signal และ % เพิ่มลดรายเดือน

### Summary
- อ่านไฟล์ `inventory_relationship_analysis.xlsx` และเพิ่ม mock data สำหรับ relationship summary, risk stock coverage, VMI score และ lead time signal
- เพิ่ม Dashboard section `ภาพรวมความสัมพันธ์ข้อมูลจาก Excel` เพื่อแสดง stock keys, usage keys, intersection keys, lead time keys และ critical stock coverage
- เพิ่ม `สัญญาณจาก Relationship Analysis` ในหน้า SKU Detail เพื่อแสดง stock cover, average usage, lead time fallback/source และ VMI score
- ปรับตาราง `ปริมาณการใช้ SKU รายเดือน` ให้มีคอลัมน์ `% เพิ่ม/ลด` จากเดือนก่อน พร้อม badge ลูกศรขึ้น/ลง
- ปรับ `DataTable` ให้รองรับ header ซ้ำ เช่น `% เพิ่ม/ลด` หลายเดือน

### Why
- ให้ Dashboard และ SKU Detail สอดคล้องกับไฟล์วิเคราะห์ความสัมพันธ์ที่แยก stock, usage และ lead time ออกมาแล้ว
- ทำให้ผู้ใช้เห็นว่า Lead Time มีข้อมูลครบหรือขาดตรงไหน และเห็นแนวโน้ม usage รายเดือนแบบเพิ่มขึ้น/ลดลงเหมือนตัวอย่าง Excel

### Changed Files
- `src/data/peaDataModel.ts`
- `src/App.tsx`
- `src/components/common.tsx`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- ค่า relationship analysis เป็น mock snapshot จากไฟล์วิเคราะห์ ไม่แทนที่ calculation engine หลักของ demo

## 2026-05-24 - ปรับรหัสคลัง Demo ให้ตรงกับชีต WH

### Summary
- เปลี่ยน mock warehouse หลักจากรหัสเดิม `WH-001` ถึง `WH-005` เป็นรหัส WH Id ที่มีอยู่ในไฟล์ Excel เช่น `I010`, `I020`, `K010`, `K020`, `K030`
- อัปเดต inventory records, request ตัวอย่าง, dashboard copy, VMI subtitle และ override reason ให้แสดงรหัสคลังตามไฟล์จริง
- เอา legacy warehouse alias `WH-001 → I010` ออกจาก PEA data bridge เพราะข้อมูล demo ใช้ WH Id จริงจากชีต `WH` โดยตรงแล้ว

### Why
- ให้รหัสคลังที่ผู้ใช้เห็นใน prototype สอดคล้องกับไฟล์ `PEA Data Summary.xlsx`
- ลดความสับสนระหว่างรหัส mock แบบเก่าและรหัส WH Id จริงที่ใช้เชื่อม data coverage, usage, stock, lead time และ mapping

### Changed Files
- `src/data/mockData.ts`
- `src/data/peaDataModel.ts`
- `src/App.tsx`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- ชีต `WH` มี `WH Name` บางรายการว่าง จึงใช้ชื่อแสดงผลแบบ `คลัง {WH Id}` สำหรับ mock demo

## 2026-05-24 - ปรับ Region เป็นเขตและเพิ่ม Supplier Id ใน Factory Master

### Summary
- ตรวจไฟล์ `PEA Data Summary.xlsx` ล่าสุด พบว่า header ชีต `WH` เป็น `Region (เขต)` และชีต `Supplier Factory` มี column `Supplier Id`
- ปรับ UI หน้า `การใช้ SKU` และ Data Coverage ให้เรียก Region เป็น `เขต`
- เพิ่ม `supplierId` ใน `PeaFactoryMaster` จากชีต `Supplier Factory` เช่น `I010 → I`, `K010 → K`
- เพิ่ม `mappedFactorySupplierId` ใน Data Coverage เพื่อแสดง Supplier Id ที่ผูกกับ Factory/Plant
- อัปเดต `database-setup.md` ให้ `factory_master` มี `supplier_id` และ ETL ใช้ column `Supplier Id` จากชีต `Supplier Factory`

### Why
- ให้ prototype ตรงกับไฟล์ Excel ล่าสุด และลดความสับสนว่า `Region` ในไฟล์หมายถึง `เขต`
- รองรับความสัมพันธ์ใหม่ที่ Factory/Plant มี Supplier Id จาก source sheet โดยยังแยกข้อมูล vendor contact/price mock ไว้ต่างหาก

### Changed Files
- `src/data/peaDataModel.ts`
- `src/App.tsx`
- `database-setup.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- `Supplier Id` ในชีต `Supplier Factory` ตอนนี้เป็น source id ที่ผูกกับ Factory ไม่ใช่ข้อมูล vendor contact/price เต็มรูปแบบ

## 2026-05-24 - เติมคำอธิบายสูตรคำนวณภาษาไทย

### Summary
- ปรับ `CalculationExplanationPanel` ให้รายละเอียดสูตรคำนวณทุกขั้นเป็นภาษาไทยนำหน้า พร้อมแยก `สูตร`, `ค่าที่ใช้คำนวณจริง`, และ `ความหมาย`
- ปรับข้อความประกอบในหน้า SKU Detail, Inventory, VMI, Settings และ Snapshot ให้ใช้คำไทยที่สอดคล้องกัน เช่น ระดับพัสดุสำรองปลอดภัย, จุดสั่งซื้อใหม่, ระยะเวลารอพัสดุ, จำนวนสั่งซื้อขั้นต่ำ
- ปรับ `formulaList` ใน mock data ให้ครอบคลุมสูตรความผันผวนของการใช้ และใช้คำไทยสำหรับสูตรหลัก
- ปรับคอมเมนต์ใน `inventoryCalculations.ts` ให้ไทยนำหน้า เพื่อให้ผู้พัฒนาอ่านที่มาของสูตรได้ง่ายขึ้น

### Why
- ผู้ใช้ต้องเข้าใจว่าค่าที่ระบบแนะนำมาจากข้อมูลและสูตรอะไร โดยเฉพาะ Safety Stock, Reorder Point, Suggested Quantity และ Estimated Cost
- ลดความสับสนจากคำอังกฤษล้วนในหน้าคำอธิบายการคำนวณ และทำให้ UI เหมาะกับผู้ใช้คลังมากขึ้น

### Changed Files
- `src/components/CalculationExplanationPanel.tsx`
- `src/components/CalculationSnapshotView.tsx`
- `src/data/mockData.ts`
- `src/utils/inventoryCalculations.ts`
- `src/App.tsx`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- ยังเก็บคำ technical เช่น Safety Stock, Reorder Point, Lead Time, MOQ ไว้ในวงเล็บ เพื่อให้เทียบกับเอกสารหรือสูตรมาตรฐานได้

## 2026-05-23 - ใช้ Region จากชีต WH เวอร์ชันใหม่

### Summary
- ตรวจไฟล์ `PEA Data Summary.xlsx` เวอร์ชันใหม่ พบว่าในชีต `WH` มี column `Region`
- ปรับ `peaWarehouseMaster` ให้ใช้ `Region` จากชีต WH เป็น source หลัก แทนการ derive จากตัวอักษรแรกของ WH Id
- เพิ่ม WH master mock ตามไฟล์ใหม่ รวม 129 คลัง ครอบคลุม Region `A-L`
- เพิ่ม filter `Region จากชีต WH` ในหน้า `การใช้ SKU`
- เพิ่ม column/metric Region ในตาราง usage และ season average
- เพิ่ม Region ใน Data Coverage panel ของหน้า SKU Detail
- อัปเดต `database-setup.md` ให้ ETL ใช้ `WH.Region` เป็นหลัก และ fallback เฉพาะกรณีว่าง

### Why
- ให้ prototype สอดคล้องกับไฟล์ Excel ล่าสุด และลดความเสี่ยงจากการเดา region จากรหัสคลัง
- ทำให้การดู demand history ตาม WH สามารถกรองและอธิบายตาม Region ได้ตรงกับข้อมูลต้นทาง

### Changed Files
- `src/data/peaDataModel.ts`
- `src/App.tsx`
- `database-setup.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- ตอนนี้ Region ของ Factory / Plant ยัง derive จากตัวอักษรแรกของ `factory_id` เพราะ source sheet ยังไม่มี column Region แยกสำหรับ Factory

## 2026-05-23 - เพิ่ม All Warehouses และ Season Average ในหน้า Usage

### Summary
- เพิ่มตัวเลือก `ทุกคลังที่มีข้อมูล usage` ในหน้า `การใช้ SKU`
- เมื่อเลือกทุกคลัง ระบบจะรวม usage ของ SKU เดียวกันข้าม WH แล้วแสดงแนวโน้มรายเดือน
- เพิ่มการคำนวณค่าเฉลี่ยการใช้ตาม season:
  - ฤดูหนาว: พ.ย.-ก.พ.
  - ฤดูร้อน: มี.ค.-พ.ค.
  - ฤดูฝน: มิ.ย.-ต.ค.
- เพิ่ม summary card สำหรับ `Season ที่ใช้สูงสุด`
- เพิ่ม section `ค่าเฉลี่ยการใช้ตาม Season` และตาราง `ค่าเฉลี่ยตาม Season ราย SKU`

### Why
- ช่วยให้ผู้ใช้เห็น seasonal demand ของ SKU ทั้งแบบรายคลังและรวมทุกคลังก่อนนำไปกำหนด Seasonal Factor หรือวิเคราะห์ VMI
- ทำให้ข้อมูลจาก Excel mock ใช้เล่าเรื่อง demand pattern ได้ดีขึ้น ไม่ใช่ดูแค่ยอดรวมรายเดือน

### Changed Files
- `src/App.tsx`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- Season definition เป็นค่า PoC ตามฤดูกาลไทยทั่วไป หากองค์กรมีปฏิทิน season เฉพาะงานซ่อมบำรุงควรย้ายเป็น setting ในอนาคต

## 2026-05-23 - เพิ่มหน้า Usage ราย WH/SKU จาก Excel Mock

### Summary
- เพิ่มเมนู `การใช้ SKU` สำหรับดูปริมาณการใช้ SKU รายเดือนของแต่ละ WH
- ใช้ข้อมูล `peaMonthlyUsage` ที่จำลองจากชีต `WH Season Data Item` และแสดงกลับเป็นมุมมอง Jan-Dec + Grand Total คล้าย Excel เดิม
- เพิ่ม filter ตาม WH Id, SKU, ปีข้อมูล และ search SKU/ชื่อรายการ/หมวดหมู่
- เพิ่ม summary cards สำหรับคลังที่เลือก, usage รวมทั้งปี, จำนวน SKU ที่มีการใช้ และเดือนที่ใช้สูงสุด
- เพิ่มกราฟแท่งรายเดือนแบบ low-to-mid fidelity เพื่อดูแนวโน้ม demand history ก่อนนำไปใช้คำนวณ Average Demand และ Demand Variability

### Why
- ผู้ใช้ต้องเห็นข้อมูล demand history ตาม WH ก่อนเชื่อผลคำนวณ Safety Stock, Reorder Point และ VMI suitability
- ช่วยแยกมุมมอง “การใช้พัสดุ / demand” ออกจากหน้า Inventory ที่เน้น stock balance และ purchase planning

### Changed Files
- `src/App.tsx`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- ตอนนี้เป็น mock view จากข้อมูลใน `peaDataModel.ts`; เมื่อเชื่อม backend จริงควรอ่านจากตาราง `monthly_usage`

## 2026-05-23 - ปรับ Demo Readiness ตาม Review

### Summary
- เพิ่ม Demo Scenario card บน Dashboard สำหรับเริ่ม flow หลักของ C01 ได้ทันที
- เพิ่ม confirmation modal หลัง submit purchase request เพื่อสรุป Request No, AI Suggested Quantity, Requested Quantity, Variance, Estimated Cost, Approval Layer และสถานะ Snapshot saved
- ปรับ Calculation Explanation ให้เป็น 2 ระดับ โดยเปิด “สรุปแบบเข้าใจง่าย” ก่อน และย้ายสูตรละเอียดไปไว้ใน accordion
- ปรับ Data Coverage panel ให้แสดงสถานะครบ/ไม่ครบชัดขึ้น พร้อม WH Id, Factory/Plant, mapping type และ confidence
- เพิ่มข้อความใน VMI Simulation ว่าเป็นการจำลองผลลัพธ์ ไม่ใช่การให้ Supplier เติมของจริง
- ปรับคำสำคัญใน UI ให้ใช้คู่ไทย-อังกฤษที่อ่านง่ายขึ้น เช่น Safety Stock, Reorder Point, Lead Time, MOQ, Snapshot และส่วนต่างจากค่าที่ระบบแนะนำ
- เพิ่ม schema documentation สำหรับ `formula_policy`, `data_import_batch`, `data_quality_issue`, `unit_conversion` และเพิ่ม `policy_id` ใน `calculation_snapshot`

### Why
- ทำให้ PoC demo เล่าเป็น main story เดียวได้ชัดขึ้น: AI Suggestion → Explainability → Request → Approval → Audit → VMI
- ลดความซับซ้อนของหน้า explainability สำหรับผู้ใช้ทั่วไป แต่ยังคงรายละเอียดสูตรสำหรับผู้อนุมัติและ auditor
- ทำให้ data model และ database doc พร้อมตอบคำถามเรื่อง policy version, data import, data quality และ unit conversion

### Changed Files
- `src/App.tsx`
- `src/components/CalculationExplanationPanel.tsx`
- `src/components/CalculationSnapshotView.tsx`
- `src/components/OverrideExplanation.tsx`
- `src/data/peaDataModel.ts`
- `src/types.ts`
- `database-setup.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- ยังไม่ได้ซ่อน Supplier CRUD หรือ Settings เพราะเป็นข้อมูลรองรับ Q&A แต่เพิ่ม Demo Scenario เพื่อชี้ flow หลักแทน

## 2026-05-23 - ปรับข้อความ UI และคำอธิบายเป็นภาษาไทย

### Summary
- ปรับข้อความหัวข้อ คำอธิบาย ปุ่ม ตาราง badge warning และ helper copy ในหน้าหลักให้เป็นภาษาไทยมากขึ้น
- แปลคำอธิบายสูตรคำนวณ ภาพบันทึกการคำนวณ เส้นทางอนุมัติ และข้อความเตือนการขอต่างจากระบบให้ผู้ใช้ไทยอ่านเข้าใจง่าย
- ปรับ mock data ที่แสดงใน timeline, history, supplier contact log และ VMI ให้ลดข้อความอังกฤษที่ไม่จำเป็น
- ปรับข้อความเตือน data coverage และข้อความเตือนจำนวนขอมาก/น้อยกว่าระบบให้เป็นภาษาไทย

### Why
- ลดความสับสนของผู้ใช้จากข้อความอังกฤษผสมไทย โดยเฉพาะหน้า Settings, Calculation, Supplier, Approval, History และ VMI
- ทำให้ต้นแบบเหมาะกับการ demo กับผู้ใช้ไทยและผู้อนุมัติที่ต้องอ่านเหตุผลของระบบ

### Changed Files
- `src/App.tsx`
- `src/components/common.tsx`
- `src/components/CalculationExplanationPanel.tsx`
- `src/components/CalculationSnapshotView.tsx`
- `src/components/OverrideExplanation.tsx`
- `src/data/mockData.ts`
- `src/data/peaDataModel.ts`
- `src/utils/inventoryCalculations.ts`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- คำ technical ที่เป็นชื่อเฉพาะ เช่น SKU, MOQ, VMI, API, Z-score และ Plant ยังเก็บไว้บางจุดเพื่อให้ตรงกับ data model และ terminology ของระบบ

## 2026-05-23 - เพิ่ม PEA Data Model และ Database Setup

### Summary
- เพิ่ม data model ใหม่ที่แยก `WH Id`, `Factory / Plant Id`, และ `Supplier / Vendor` ออกจากกันชัดเจน
- เพิ่ม mock data จากมุมมอง Excel-derived data สำหรับ SKU, warehouse, factory, mapping, monthly usage, stock, lead time และ supplier mock
- เพิ่ม Data Coverage panel ในหน้า SKU Detail เพื่อแจ้งว่าข้อมูล demand, stock, lead time, supplier และ WH-Factory mapping ครบหรือไม่
- เพิ่มเอกสาร `database-setup.md` สำหรับ schema PostgreSQL, ETL rules, calculation flow และ data coverage flags

### Why
- แก้ความเข้าใจสำคัญว่า `Factory Id` ไม่ใช่ Supplier
- เตรียม prototype ให้รองรับ data model จริงในอนาคต โดยยังคง mock data และ demo flow เดิมไว้
- ป้องกันการคำนวณที่ misleading เมื่อข้อมูลบางส่วนยังไม่ครบ

### Changed Files
- `src/data/peaDataModel.ts`
- `src/App.tsx`
- `database-setup.md`
- `README.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- `src/data/mockData.ts` ยังใช้คุม demo flow เดิม
- `src/data/peaDataModel.ts` เป็น bridge/model ใหม่สำหรับ migration ไปฐานข้อมูลจริงภายหลัง

## 2026-05-23 - เพิ่มไฟล์บันทึกความคืบหน้า

### Summary
- เพิ่มไฟล์ `PROJECT_UPDATES.md` สำหรับบันทึกความคืบหน้าและการแก้ไขในโปรเจกต์
- เพิ่มกติกาใน README ว่าทุกครั้งที่แก้ไขโปรเจกต์ต้องอัปเดตไฟล์นี้ด้วย

### Why
- ให้ทีมตามประวัติการเปลี่ยนแปลงได้ง่ายขึ้น
- ลดความเสี่ยงที่การแก้ UI, data model, calculation หรือ schema จะไม่มี context ย้อนหลัง

### Changed Files
- `PROJECT_UPDATES.md`
- `README.md`

### Verification
- เป็นการแก้เอกสารเท่านั้น ยังไม่ได้รัน build

### Notes / Follow-up
- รอบถัดไปที่แก้ code หรือ mock data ให้เพิ่ม entry ใหม่ด้านบนหรือด้านล่างตามลำดับวันที่

## 2026-05-31 - แก้ช่องกรอกตัวเลขทุกหน้าที่แก้ไขได้

### Summary
- เพิ่ม `EditableNumberInput` เป็น component กลางสำหรับช่องกรอกตัวเลขที่ผู้ใช้แก้ไขได้
- แก้ฟอร์มสร้างคำขอซื้อ, ฟอร์มเพิ่ม SKU ที่รองรับ, แถวแก้ไขข้อเสนอซัพพลายเออร์, AI Feedback และ Settings ให้ลบค่าเดิมจนช่องว่างระหว่างพิมพ์ได้
- ลบ pattern `Number(event.target.value)` ออกจาก controlled number input ที่แก้ไขได้ เพื่อไม่ให้เกิดค่าเช่น `012` หรือ `016`
- เพิ่มกฎใน `DATA_POLICY.md` ว่าทุก numeric input ต้องรองรับค่าว่างระหว่างพิมพ์และห้ามแปลง `Number("")` เป็น `0` ทันที

### Why
- ผู้ใช้พบว่าหน้าอื่นนอกจาก Budget ยังพิมพ์ตัวเลขแล้วมี `0` ติดหน้า เช่น `012` เพราะ controlled input แปลงค่าว่างเป็น 0 ระหว่างพิมพ์

### Changed Files
- `src/App.tsx`
- `DATA_POLICY.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- ช่อง read-only ที่แสดงค่าตัวเลขไม่จำเป็นต้องใช้ component นี้ เพราะผู้ใช้ไม่ได้พิมพ์แก้ไข

## 2026-06-05 - เพิ่ม Transfer, Stock Intelligence และ Receiving Delay

### Summary
- เพิ่มเมนู `โอน/ยืมพัสดุ` สำหรับแนะนำ Transfer/Borrow ก่อนสร้างคำขอซื้อใหม่
- เพิ่ม Transfer Request state พร้อมสถานะ Requested, Approved, Completed, Rejected และ timeline สำหรับ audit
- เพิ่มเมนู `วิเคราะห์สต็อก` สำหรับเทียบ stock รายคลัง, Stock Cover, Dead/Slow Stock Candidate, Stockout Forecast ตาม season และ Forecast Error/Delay
- เพิ่มเมนู `รับของ/Delay` สำหรับบันทึกรับของเข้าคลัง สาเหตุ Delay และ Impact Demand
- ปรับ Dashboard ให้แสดง Transfer Candidate, Dead/Slow Stock, Seasonal Stockout Risk และ Delay Impact
- ปรับ SKU Detail และ Create Purchase Request ให้เตือนทางเลือกโอน/ยืมก่อนซื้อ หากระบบพบ source warehouse ที่ช่วยเติมได้
- เพิ่ม persistence keys สำหรับ `transferRequests` และ `receiptDelayLogs`
- อัปเดต `DATA_POLICY.md` และ `README.md` ให้ระบุกฎของ Transfer, Dead Stock, Forecast และ Delay

### Why
- Product Owner ต้องการให้ prototype รองรับการตัดสินใจ “โอน/ยืมก่อนซื้อ”, เทียบ stock รายคลัง, ดู Dead Stock, คาดการณ์ขาดตาม season และใช้ข้อมูลรับของ/Delay กลับไปปรับความเสี่ยงในรอบถัดไป

### Changed Files
- `src/App.tsx`
- `DATA_POLICY.md`
- `README.md`
- `PROJECT_UPDATES.md`

### Verification
- `npm.cmd run build` ผ่าน

### Notes / Follow-up
- Transfer/Borrow ใน PoC ยังเป็น decision-support workflow และ persistent JSON state ยังไม่ใช่ stock movement จริงใน backend
- Dead Stock แสดงเป็น Dead/Slow Stock Candidate เพื่อไม่ให้ตีความเป็นข้อสรุปบัญชีถาวร
