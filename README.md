# AI Inventory Planning & Procurement Platform Prototype

React + TypeScript + Tailwind CSS frontend prototype for inventory planning, supplier contact, purchase request approval, audit trail, and VMI simulation.

## Run

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Notes

- `src/data/mockData.ts` และ `src/data/peaDataModel.ts` เป็น seed data เท่านั้น ไม่ใช่ mock-only workflow.
- ข้อมูลที่ผู้ใช้เพิ่ม/แก้/submit จะถูกเก็บเป็น persistent JSON state ใน browser `localStorage` ผ่าน `src/utils/persistentJsonStore.ts`.
- กฎข้อมูลหลักอยู่ใน `DATA_POLICY.md`: ห้ามทำ workflow ที่เป็น mock data เฉย ๆ ทุก action ต้อง persist และค่าคำนวณต้องคำนวณจาก data ปัจจุบัน.
- การตั้งค่างบประมาณ Local / Regional / Central อยู่ในหน้า `งบประมาณ` และถูกใช้กับ Budget Check / Approval Routing ของคำขอใหม่ โดย snapshot เก่าจะไม่เปลี่ยนย้อนหลัง.
- Dashboard, metric และ AI Suggest ต้องมีคำอธิบายที่มา/สูตรของตัวเลข รวมถึง trigger ที่ทำให้ค่าเปลี่ยน ตามกฎใน `DATA_POLICY.md`.
- รายละเอียด `คำนวณจริงจาก` และ `เปลี่ยนเมื่อ` ของ dashboard metric ต้องอยู่ในกรอบ metric card เดียวกับตัวเลขนั้นเสมอ.
- ตัวกรองที่ใช้ซ้ำ เช่น เขต, WH Id และ SKU ต้องอ่านจาก source/helper กลางชุดเดียวกัน ห้าม hardcode option แยกกันคนละหน้า.
- หน้ารายละเอียดการคำนวณต้องอธิบายด้วยค่าจริงของ SKU/Request ปัจจุบันเสมอ ไม่ใช้สูตรลอย ๆ หรือข้อมูลสมมติ.
- หากไม่เข้าใจ data source, สูตร หรือ business rule ต้องถามผู้ใช้ก่อน ห้ามเดาหรือสร้างข้อมูลเอง.
- ถ้า AI Suggest ไม่ตรงกับค่าจริง ให้บันทึก feedback ใน Request History เพื่อเก็บ error และใช้ปรับสูตรเวอร์ชันถัดไปโดยไม่แก้ Calculation Snapshot เดิมย้อนหลัง.
- การส่ง PO feedback ไป Google Sheet เป็น optional endpoint ดูวิธีตั้งค่าใน `GOOGLE_SHEET_ENDPOINT.md`.
- เมนู `โอน/ยืมพัสดุ` ใช้ตรวจทางเลือก Transfer/Borrow/Swap ก่อนสร้างคำขอซื้อ โดยเก็บคำขอและ timeline เป็น persistent JSON state. มีการ track การคืน (กำหนดคืน/คืนแล้ว/เกินกำหนด) และหมวดวิเคราะห์พฤติกรรม (คลังยืมบ่อย / ค้างคืน-เกินกำหนด / ของขาดบ่อย / แลกอะไรบ่อย).
- ราคา/หน่วยพัสดุใน seed ถูก reconcile ให้สมจริงและสอดคล้องกันทุก dataset (`mockData`, `peaDataModel`, `procurementHistory`) เช่น หม้อแปลง 100kVA 150,000/ลูก, เสาไฟคอนกรีต 12ม. 4,500/ต้น (C01 คง 2,000/ม. เพื่อรองรับ demo flow).
- เมนู `วิเคราะห์สต็อก` ใช้เทียบ stock รายคลัง, Stock Cover, Dead/Slow Stock Candidate, Stockout Forecast ตาม season และ Forecast Error/Delay.
- เมนู `รับของ/Delay` ใช้บันทึกรับของเข้าคลังและสาเหตุส่งช้า โดยคำนวณ Impact Demand = Average Daily Demand × Delay Days สำหรับ feedback รอบถัดไป.
- เมนู `ตรวจซื้อซ้ำ-ของจม` (Procurement Audit) ใช้เทียบประวัติการของบ/สั่งซื้อย้อนหลัง 3 ปีงบ รายคลัง เพื่อจับเคส "ของบซื้อซ้ำทั้งที่ของยังจม" และ "เร่งใช้งบให้หมด" มี filter (ปีงบ/เขต/หมวด/เฉพาะที่ติด flag) และกดดูรายละเอียด "ใบของบ" แต่ละใบได้ (เหตุผล flag, ประวัติของบ SKU เดิมย้อนหลัง, ของจมที่เกี่ยว, เทียบ peer). ข้อมูล seed อยู่ใน `src/data/procurementHistory.ts` และค่าสรุป/flag คำนวณใน `src/utils/procurementAnalysis.ts` (ไม่ hardcode).
- ความเห็น/Feedback เป็นแบบ hybrid: ปุ่มลอย `ความเห็น` มีทุกหน้า (auto-tag หน้าปัจจุบัน) และเมนู `ศูนย์ความเห็น (Feedback)` รวมความเห็นทุกหน้า กรองตามหน้าได้ เก็บชื่อผู้ให้ความเห็นจากระบบ login.
- มีระบบ login (เมนู `บัญชีผู้ใช้`): รองรับ **Google Sign-In (OAuth)** เมื่อตั้ง `VITE_GOOGLE_CLIENT_ID` (ดู `GOOGLE_AUTH_SETUP.md`) และมี login/register/ลืมรหัสผ่าน แบบ local (PoC, localStorage) เป็น fallback. ต้องเข้าสู่ระบบก่อนให้ความเห็น; admin (`admin/admin` หรืออีเมลตรง `VITE_ADMIN_EMAIL`) ลบความเห็นได้โดยใส่รหัสยืนยัน `99999`. หมายเหตุ: ยังไม่มี backend จึงเก็บข้อมูลแยกตามเครื่อง ไม่รวมศูนย์ — ถ้าต้องรวมต้องต่อ Firestore หรือ Google Sheet endpoint.
- Dashboard มี `Dead Stock Exchange` banner ประกาศของจมที่ยืม/แลกได้ พร้อมมูลค่าทุนจมและ aging และหน้า Create Purchase Request มีการ์ดดักเตือนถ้า SKU ที่จะซื้อมีของจมที่คลังอื่น (เสนอยืมแทนการซื้อ).
- New PEA data model seed lives in `src/data/peaDataModel.ts` and separates `WH Id`, `Factory / Plant Id`, and `Supplier / Vendor`.
- Database setup and future schema notes are in `database-setup.md`.
- Project progress and change history must be recorded in `PROJECT_UPDATES.md`.
- When changing code, mock data, UX, schema docs, or project behavior, always update `PROJECT_UPDATES.md` in the same work session.
- No SAP, database, or backend integration is required. Google Sheet PO feedback is optional and only runs when `VITE_GOOGLE_PO_FEEDBACK_ENDPOINT` is configured.
- Frontend persistence uses browser JSON storage until a real backend/database is added.
- `src/App.tsx` has comments marking where real API integration can be added later.

## Main Demo Flow

Dashboard → C01 SKU Detail → Calculation Detail → Create Purchase Request with 20 เมตร → Submit to Regional → Approve → Request History → VMI Simulation
