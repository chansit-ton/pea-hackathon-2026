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
- ปรับ `CalculationExplanationPanel` ให้รายละเอียดสูตรคำนวณทุกขั้นเป็นภาษาไทยนำหน้า พร้อมแยก `สูตร`, `ตัวอย่างคำนวณ`, และ `ความหมาย`
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
