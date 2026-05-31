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
- New PEA data model seed lives in `src/data/peaDataModel.ts` and separates `WH Id`, `Factory / Plant Id`, and `Supplier / Vendor`.
- Database setup and future schema notes are in `database-setup.md`.
- Project progress and change history must be recorded in `PROJECT_UPDATES.md`.
- When changing code, mock data, UX, schema docs, or project behavior, always update `PROJECT_UPDATES.md` in the same work session.
- No SAP, database, or backend integration is required. Google Sheet PO feedback is optional and only runs when `VITE_GOOGLE_PO_FEEDBACK_ENDPOINT` is configured.
- Frontend persistence uses browser JSON storage until a real backend/database is added.
- `src/App.tsx` has comments marking where real API integration can be added later.

## Main Demo Flow

Dashboard → C01 SKU Detail → Calculation Detail → Create Purchase Request with 20 เมตร → Submit to Regional → Approve → Request History → VMI Simulation
