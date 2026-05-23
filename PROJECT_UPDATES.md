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
