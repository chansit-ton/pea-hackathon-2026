# Design.md

# เอกสารออกแบบระบบ AI Inventory Planning & Procurement Platform

วันที่อัปเดต: 12 มิถุนายน 2026  
สถานะ: Frontend prototype สำหรับสาธิตแนวคิด, ใช้ seed data และ persistent JSON state ใน browser

## 1. สรุปความคืบหน้าจนถึงปัจจุบัน

โปรเจกต์นี้เริ่มจากต้นแบบ frontend สำหรับวางแผนพัสดุและจัดซื้อ โดยเน้นให้ผู้ใช้เห็นว่า “ระบบแนะนำจำนวนจัดซื้อจากข้อมูลอะไร” และสามารถตรวจสอบย้อนหลังได้ ไม่ใช่แค่แสดงตัวเลข AI Suggest แบบลอย ๆ

สิ่งที่ทำแล้ว:

- สร้าง React + TypeScript + Tailwind CSS prototype
- เพิ่ม dashboard สำหรับดูความเสี่ยง stock, งบประมาณ, pending request, VMI candidate และ scenario สำหรับ demo
- เพิ่มหน้า SKU Detail พร้อมค่า Current Stock, Average Daily Demand, Safety Stock, Reorder Point, Forecast Demand และ AI Suggested Quantity
- แยก calculation engine ออกจาก UI ใน `src/utils/inventoryCalculations.ts`
- เพิ่ม Calculation Explanation เพื่ออธิบายสูตร, ที่มาข้อมูล, ความหมายทางธุรกิจ และ snapshot
- เพิ่ม Purchase Request flow พร้อมตรวจ MOQ, Estimated Cost, Budget Routing และ Override Reason
- เพิ่ม Approval flow ทั้งระดับ Local, Regional และ Central
- เพิ่ม Request History และ Audit Trail ที่ใช้ Calculation Snapshot ไม่คำนวณย้อนหลังจากค่าปัจจุบัน
- เพิ่ม Supplier module สำหรับข้อมูลติดต่อ, ราคา, Lead Time, MOQ, Supported Items, Contact History และ Change Log
- เพิ่ม Settings สำหรับ Formula Policy, Service Level, Z-score, Seasonal Factor, Budget Factor และ formula version history
- เพิ่ม Budget Settings สำหรับ Local, Regional และ Central Budget พร้อม log การแก้งบ
- เพิ่มหน้า Usage SKU รายคลังจากข้อมูล Excel seed เพื่อดู usage รายเดือน, season average และเปอร์เซ็นต์เพิ่ม/ลดจากเดือนก่อน
- เพิ่ม Data Coverage และ Relationship Summary เพื่อแยก WH Id, Factory / Plant Id และ Supplier ให้ถูกต้อง
- เพิ่ม VMI Candidate และ VMI Simulation เพื่อเปรียบเทียบ Current Model กับ VMI
- เพิ่ม Transfer / Borrow Center สำหรับพิจารณาโอนหรือยืม SKU ระหว่างคลังก่อนสร้างคำขอซื้อ
- เพิ่ม Stock Intelligence สำหรับดู Stock Cover, Dead/Slow Stock Candidate, Stockout Forecast และผลกระทบตาม season
- เพิ่ม Receiving / Delay Log สำหรับบันทึกรับของเข้าคลังและเหตุผลที่ส่งช้า
- เพิ่ม Dead Stock Exchange (Dashboard) + การ์ดดักก่อนซื้อ (Create PR) เพื่อเสนอยืม/แลกของจมแทนการซื้อใหม่
- เพิ่มหน้า Procurement Audit (`ตรวจซื้อซ้ำ-ของจม`) เทียบประวัติการของบย้อนหลัง 3 ปีงบ มี filter และ drill-down ใบของบ จับเคสซื้อซ้ำทั้งที่ของจมและเร่งใช้งบให้หมด
- เพิ่มความเห็น PO แบบ hybrid: ปุ่มลอยทุกหน้า + ศูนย์ความเห็น PO รวมความเห็น tag ตามหน้า
- เพิ่ม optional Google Sheet PO Feedback endpoint สำหรับส่ง event เพิ่มเติม แต่ไม่ใช่ source of truth
- เพิ่มกฎใน `DATA_POLICY.md` ว่าห้ามทำ mock-only workflow ที่ข้อมูลหายหลัง refresh และทุก action สำคัญต้อง persist

## 2. เป้าหมายของระบบ

ระบบนี้เป็น AI-assisted decision support สำหรับผู้ใช้คลังและฝ่ายจัดซื้อ โดยมีเป้าหมายหลัก:

- ลดการคำนวณด้วย Excel และการตัดสินใจจากประสบการณ์ส่วนตัวเพียงอย่างเดียว
- ทำให้การวางแผนพัสดุมีสูตรกลางและตรวจสอบได้
- ลดความเสี่ยง stock ขาดและ stock เกิน
- เปรียบเทียบ supplier จากราคา, Lead Time, MOQ และ reliability
- ตรวจงบประมาณ 3 ชั้นก่อนส่งคำขอ
- เก็บเหตุผลเมื่อผู้ใช้ขอจำนวนต่างจากค่าที่ระบบแนะนำ
- เก็บ Calculation Snapshot เพื่อ audit ย้อนหลัง
- สนับสนุนทางเลือกโอน/ยืมพัสดุก่อนซื้อใหม่
- ใช้ข้อมูล delay และ actual result กลับมาวัดความคลาดเคลื่อนของสูตรในรอบถัดไป

## 3. หลักการออกแบบ

### 3.1 ระบบต้องอธิบายได้

ทุกค่าที่เป็นผลคำนวณต้องมีคำอธิบายใกล้ตัวเลข เช่น:

- คำนวณจริงจากอะไร
- ใช้สูตรอะไร
- เปลี่ยนเมื่อข้อมูลหรือ policy ใดเปลี่ยน
- เป็นค่าปัจจุบันหรือค่าจาก Calculation Snapshot

กฎสำคัญ:

- ห้ามแสดงสูตร generic อย่างเดียวในหน้ารายละเอียด
- ต้องใช้ค่าจริงของ SKU, Request หรือ Snapshot ที่ผู้ใช้กำลังดูเสมอ
- ถ้ามีการปัดขึ้น, ปัดตาม MOQ หรือปัดเป็นจำนวนเต็ม ต้องระบุค่าก่อนปัดและหลังปัด

### 3.2 ระบบไม่ตัดสินใจแทนผู้ใช้

AI Suggest ใช้เป็นตัวช่วยตัดสินใจ ผู้ใช้ยัง override ได้ แต่ต้องระบุเหตุผล และระบบต้องเก็บไว้ใน audit trail

### 3.3 ข้อมูลอดีตต้องไม่เปลี่ยนย้อนหลัง

เมื่อสร้างคำขอซื้อ ระบบต้องเก็บ Calculation Snapshot ณ เวลานั้น เพราะภายหลังราคา, Lead Time, สูตร, งบประมาณ และ demand อาจเปลี่ยนได้

### 3.4 ถ้าไม่เข้าใจต้องถาม

ถ้าไม่ชัดเจนว่า field มาจากไหน, สูตรควรใช้แบบใด, หรือ business rule คืออะไร ต้องถามผู้ใช้ก่อน ห้ามเดาและห้ามสร้างข้อมูลเองโดยไม่มีที่มา

## 4. ผู้ใช้หลัก

| ผู้ใช้ | งานหลัก |
|---|---|
| เจ้าหน้าที่คลัง | ตรวจ stock, ดูคำแนะนำ, สร้างคำขอซื้อ, ขอ transfer หรือ borrow |
| ฝ่ายจัดซื้อ | ตรวจ supplier, ราคา, Lead Time, MOQ และ contact log |
| ผู้อนุมัติระดับคลัง | อนุมัติคำขอที่อยู่ในงบคลัง |
| ผู้อนุมัติระดับเขต | อนุมัติคำขอที่เกินงบคลังแต่ยังอยู่ในงบเขต |
| ส่วนกลาง | อนุมัติหรือขอข้อมูลเพิ่มเมื่อคำขอเกินงบเขต |
| Auditor / Mentor | ตรวจสูตร, snapshot, approval timeline และเหตุผล override |

## 5. Information Architecture

เมนูหลักใน prototype:

| หน้า | จุดประสงค์ |
|---|---|
| แดชบอร์ด | ภาพรวม SKU เสี่ยง, งบประมาณ, pending PR, VMI และ relationship insight |
| คลังพัสดุ | รายการ SKU และสถานะ stock |
| การใช้ SKU | ดู usage รายเดือน รายคลัง รายเขต และ season average |
| ซัพพลายเออร์ | จัดการ supplier, supported items, ราคา, Lead Time, MOQ และ contact |
| คำขอซื้อ | สร้าง purchase request จาก AI Suggested Quantity |
| อนุมัติ | Regional และ Central approval queue |
| ประวัติ | Request History, Audit Trail และ Calculation Snapshot |
| VMI | วิเคราะห์ candidate และจำลองผลลัพธ์ VMI |
| โอน/ยืมพัสดุ | ตรวจทางเลือก transfer หรือ borrow ก่อนซื้อใหม่ |
| วิเคราะห์สต็อก | เทียบ stock รายคลัง, Dead/Slow Stock, Stockout Forecast และ forecast error |
| ตรวจซื้อซ้ำ-ของจม | เทียบประวัติการของบ 3 ปีงบ รายคลัง, filter, drill-down ใบของบ, flag ซื้อซ้ำของจม/เร่งใช้งบ และมูลค่าทุนจม |
| ศูนย์ความเห็น PO | รวมความเห็น PO ทุกหน้า (tag ตามหน้า) เพิ่มได้จากปุ่มลอยทุกหน้า |
| รับของ/Delay | บันทึกรับของเข้าคลัง, delay reason และ impact demand |
| งบประมาณ | ตั้งค่า Local, Regional และ Central Budget |
| ตั้งค่า | ตั้งค่า Formula Policy และ version |

## 6. Main Demo Flow

Flow หลักสำหรับสาธิต:

1. เปิด Dashboard และดู SKU เสี่ยง
2. เปิด C01 SKU Detail
3. ดู Current Stock, Safety Stock, Reorder Point และ AI Suggested Quantity
4. กด “ทำไมระบบแนะนำค่านี้?”
5. ดู Calculation Explanation ที่อธิบายด้วยค่าจริง
6. สร้าง Purchase Request โดยกรอก Requested Quantity = 20 เมตร
7. ระบบคำนวณ Estimated Cost = 20 × 2,000 = 40,000 บาท
8. ระบบพบว่า Local Budget ไม่พอ แต่ Regional Budget พอ
9. ระบบบังคับกรอก Override Reason เพราะขอมากกว่า AI Suggest
10. Submit ไป Regional Approval
11. Regional Approve
12. เปิด Request History เพื่อดู snapshot และ audit trail
13. ปิดท้ายด้วย VMI Simulation หรือ Transfer / Borrow alternative

## 7. Data Model Design

### 7.1 ความหมายของข้อมูลสำคัญ

| Concept | ความหมาย | ใช้ทำอะไร |
|---|---|---|
| WH Id | รหัสคลังพื้นที่ที่เกิด demand | usage history, warehouse filter, demand location |
| Factory / Plant Id | รหัสคลังหลักหรือโรงงานในระบบ SAP | stock, batch, movement, lead time |
| Supplier Id | ผู้ขายจริง | contact, price, Lead Time, MOQ |
| SKU Id | รหัสพัสดุ | key หลักสำหรับเชื่อม usage, stock, supplier และ request |
| Warehouse-Factory Mapping | ตารางเชื่อม WH กับ Factory | ใช้เชื่อม demand กับ stock และ lead time |

### 7.2 แหล่งข้อมูลใน prototype

| แหล่งข้อมูล | ไฟล์ / module | บทบาท |
|---|---|---|
| Seed data | `src/data/mockData.ts` | ข้อมูลตั้งต้นสำหรับ demo flow |
| PEA Excel-derived model | `src/data/peaDataModel.ts` | SKU, WH, Region, monthly usage, relationship summary |
| Persistent JSON state | `src/utils/persistentJsonStore.ts` | เก็บข้อมูลที่ผู้ใช้สร้างหรือแก้ไขหลังเปิดระบบ |
| Calculation utilities | `src/utils/inventoryCalculations.ts` | สูตรคำนวณ stock, budget routing, VMI และ variance |
| Optional PO feedback | `src/utils/googlePoFeedback.ts` | ส่งสำเนา event ไป Google Sheet endpoint เมื่อเปิดใช้งาน |

### 7.3 กฎ source of truth

- Seed data ใช้เป็นค่าเริ่มต้นเท่านั้น
- Action ที่ผู้ใช้ทำต้องถูกเก็บใน persistent JSON state
- Google Sheet endpoint เป็น feedback channel เพิ่มเติม ไม่ใช่ฐานข้อมูลหลัก
- Request History ต้องอ่านจาก snapshot เดิม ไม่คำนวณใหม่จาก settings ปัจจุบัน
- Filter ที่ใช้ซ้ำ เช่น Region, WH Id และ SKU ต้องใช้ helper กลางจาก data source เดียวกัน

## 8. Calculation Design

### 8.1 สูตรหลัก

| ค่า | สูตร |
|---|---|
| Average Daily Demand | Historical Usage Total / Historical Usage Days |
| Demand Variability | Standard Deviation ของข้อมูลการใช้ย้อนหลัง |
| Adjusted Lead Time | Supplier Lead Time × Seasonal Factor × Budget Factor |
| Safety Stock | Z-score × Demand Variability × √Adjusted Lead Time |
| Demand During Lead Time | Average Daily Demand × Adjusted Lead Time |
| Reorder Point | Demand During Lead Time + Safety Stock |
| Target Stock Level | Forecast Demand + Safety Stock หรือ Policy Override |
| AI Suggested Quantity | Target Stock Level - Current Stock แล้วปัดขึ้นตาม MOQ |
| Estimated Cost | Requested Quantity × Supplier Unit Price |
| Quantity Variance | Requested Quantity - AI Suggested Quantity |
| Variance Percent | Quantity Variance / AI Suggested Quantity × 100 |

### 8.2 Budget Routing

| เงื่อนไข | เส้นทางอนุมัติ |
|---|---|
| Estimated Cost <= Local Budget Remaining | Local Approval |
| Estimated Cost > Local Budget และ <= Regional Budget | Regional Approval |
| Estimated Cost > Regional Budget | Regional Approve & Pass to Central |

### 8.3 Formula Version

- Service Level เป็น field ที่ user เข้าใจและแก้ได้
- Z-score คำนวณจาก Service Level อัตโนมัติ
- เมื่อแก้ policy ที่กระทบการคำนวณ ต้องสร้าง formula version ใหม่
- ถ้ากดบันทึกโดยไม่มีค่าเปลี่ยน ต้องไม่สร้าง version history ใหม่
- Snapshot เก่าไม่ถูกแก้ย้อนหลัง

## 9. Explainability Design

ทุกหน้าที่มีตัวเลขสำคัญควรมี microcopy ในกรอบเดียวกับตัวเลข:

- คำนวณจริงจาก: ระบุ field และค่าที่ใช้
- เปลี่ยนเมื่อ: ระบุ trigger เช่น import usage ใหม่, แก้ stock, แก้ supplier offer, แก้ formula policy หรือมี approval/request ใหม่

หน้า Calculation Explanation แบ่งเป็น:

1. สรุปแบบเข้าใจง่าย
2. ข้อมูลที่ใช้คำนวณ
3. รายละเอียดสูตรคำนวณ
4. ความหมายของค่าที่ได้
5. เส้นทางการอนุมัติ
6. เหตุผลที่ต้องกรอกเมื่อขอต่างจากระบบ
7. Calculation Snapshot

## 10. UX Design

### 10.1 รูปแบบหน้าจอ

- Enterprise dashboard สะอาด อ่านง่าย
- ใช้ card, table, badge, form และ simple chart
- ใช้ภาษาไทยเป็นหลัก พร้อม technical term ที่จำเป็น เช่น SKU, MOQ, VMI, Lead Time
- รองรับ desktop เป็นหลัก และปรับ responsive สำหรับ mobile
- Sidebar ย่อได้และมี mobile menu

### 10.2 Status Badge

| สี | ความหมาย |
|---|---|
| เขียว | ปกติ |
| เหลือง | ใกล้จุดสั่งซื้อ |
| แดง | วิกฤต / ต่ำกว่า Safety Stock |
| น้ำเงิน | รออนุมัติ |
| ม่วง | เหมาะกับ VMI |
| เทา | Draft / Historical |

### 10.3 Numeric Input

ทุกช่องกรอกตัวเลขที่แก้ได้ต้องรองรับการลบค่าจนช่องว่างระหว่างพิมพ์ได้ ห้ามแปลง `Number("")` เป็น `0` ทันที เพราะจะทำให้ผู้ใช้พิมพ์แล้วเกิดค่าเช่น `012` หรือ `016`

## 11. Workflow Design

### 11.1 Purchase Request

ข้อมูลที่ใช้:

- SKU และ Warehouse
- Supplier ที่เลือก
- AI Suggested Quantity
- Requested Quantity
- Unit Price, Lead Time, MOQ
- Budget Context
- Override Reason

ผลลัพธ์:

- Estimated Cost
- Variance และ Variance Percent
- Recommended Approval Layer
- Calculation Snapshot

### 11.2 Approval

Regional review ต้องเห็น:

- AI Suggested Quantity
- Requested Quantity
- Variance
- Supplier
- Estimated Cost
- Budget Check
- Override Reason
- Supplier Contact Log Summary
- Calculation Snapshot

Central review ต้องเห็น:

- เหตุผลที่ส่งต่อจากเขต
- Budget gap
- Supplier data
- Calculation detail link

### 11.3 Transfer / Borrow

ระบบควรแนะนำ transfer หรือ borrow เมื่อมีคลังต้นทางที่มี stock cover เหลือพอ และคลังปลายทางมี stockout risk

ค่าหลัก:

- Source Excess = Stock ต้นทาง - buffer usage
- Suggested Transfer = min(AI Suggested Quantity, Source Excess)
- Transfer request ต้องมี timeline และ status

### 11.4 Receiving / Delay

ระบบบันทึก:

- วันที่คาดว่าจะรับของ
- วันที่รับจริง
- Delay Days
- Delay Reason
- Impact Demand = Average Daily Demand × Delay Days

ข้อมูลนี้ใช้เป็น feedback สำหรับประเมินความเสี่ยง shortage ตาม season และปรับ lead time ในอนาคต

## 12. Audit และ Feedback Design

### 12.1 Calculation Snapshot

ต้องเก็บ:

- Formula Version
- Historical Usage
- Average Demand
- Demand Variability
- Lead Time
- Safety Stock
- Reorder Point
- Target Stock Level
- Suggested Quantity
- Requested Quantity
- Unit Price
- Estimated Cost
- Budget Context
- Approval Routing
- Override Reason

### 12.2 AI Feedback

เมื่อค่าที่ระบบแนะนำไม่ตรงกับผลจริง:

- เก็บ suggested quantity
- เก็บ actual quantity หรือ actual usage
- คำนวณ error quantity และ error percent
- ผูกกับ request id และ formula version
- ใช้เป็น feedback สำหรับสูตรเวอร์ชันถัดไป
- ห้ามแก้ snapshot เดิมย้อนหลัง

## 13. VMI Design

VMI ใน prototype เป็น simulation ไม่ใช่การให้ supplier เติมของจริง

ตัวชี้วัด:

- Safety Stock ปัจจุบันเทียบกับ VMI
- Reorder Point ปัจจุบันเทียบกับ VMI
- Lead Time ปัจจุบันเทียบกับ VMI
- Inventory Value Impact
- Manual Orders per Month
- VMI Suitability Score

สูตรตัวอย่าง:

- VMI Safety Stock = Z-score × Demand Variability × √VMI Lead Time
- VMI Reorder Point = Average Demand × VMI Lead Time + VMI Safety Stock
- Impact = ค่า VMI - ค่าปัจจุบัน

## 14. Technical Architecture

```text
React UI
  ├─ App.tsx
  ├─ components/
  ├─ data/
  ├─ utils/
  └─ types.ts

Data Flow
  Seed Data
    → Persistent JSON Store
    → Calculation Utilities
    → UI Pages
    → Snapshot / Logs
    → Optional Google Sheet Feedback
```

### 14.1 Frontend

- React 19
- TypeScript
- Tailwind CSS
- Vite
- lucide-react icons

### 14.2 Persistence

ปัจจุบันใช้ browser `localStorage` ผ่าน persistent JSON store เพื่อให้ข้อมูลที่เพิ่มหรือแก้ไขอยู่หลัง refresh

ในอนาคตสามารถแทนที่ด้วย backend API และ database ได้ โดยใช้ schema จาก `database-setup.md`

## 15. Database Direction

เอกสาร `database-setup.md` ออกแบบ schema สำหรับ backend ต่อไป โดยครอบคลุม:

- `sku_master`
- `warehouse_master`
- `factory_master`
- `warehouse_factory_mapping`
- `monthly_usage`
- `stock_batch`
- `stock_summary`
- `lead_time_transaction`
- `lead_time_summary`
- `supplier_master`
- `supplier_sku_price`
- `supplier_contact_log`
- `budget_master`
- `purchase_request`
- `approval_history`
- `calculation_snapshot`
- `formula_policy`
- `data_import_batch`
- `data_quality_issue`
- `unit_conversion`
- `vmi_candidate`
- `vmi_simulation`

## 16. สิ่งที่ยังควรทำต่อ

### ก่อน demo

- ตรวจ main demo flow ให้ลื่นตั้งแต่ Dashboard ถึง History
- ตรวจทุก metric card ว่ามีคำอธิบายอยู่ในกรอบของตัวเอง
- ตรวจ calculation detail ว่าใช้ค่าจริงของ SKU หรือ snapshot ที่กำลังดู
- ตรวจ request submit confirmation ว่าบอก snapshot saved ชัดเจน
- ตรวจว่า filter Dashboard และ Usage ใช้ source กลางชุดเดียวกัน

### หลัง demo

- เพิ่ม backend หรือ lightweight API สำหรับ persistent storage จริง
- เพิ่ม import Excel pipeline
- เพิ่ม authentication และ role-based approval
- เพิ่ม auto-tune formula แบบ versioned จาก AI feedback
- เพิ่ม real supplier integration เฉพาะเมื่อมี policy และ security พร้อม
- เพิ่ม unit test สำหรับ calculation utilities

## 17. Design Decision Summary

| Decision | เหตุผล |
|---|---|
| ใช้ AI-assisted decision support | ลดความเสี่ยงจากการให้ระบบตัดสินใจแทนทั้งหมด |
| เก็บ Calculation Snapshot | ทำให้ audit ย้อนหลังได้แม้สูตรหรือราคาเปลี่ยน |
| แยก WH, Factory และ Supplier | ป้องกันการตีความข้อมูล Excel ผิด |
| ใช้ persistent JSON state | ให้ PoC ใช้งานจริงกว่า mock-only และ refresh แล้วยังมีข้อมูล |
| อธิบายสูตรในทุก metric card | ลดภาระคน demo และเพิ่ม trust |
| เพิ่ม Transfer/Borrow ก่อนซื้อ | รองรับ use case จริงที่ควรย้ายของก่อนสร้าง PR ใหม่ |
| เพิ่ม Delay feedback | ใช้ข้อมูลปฏิบัติจริงกลับมาปรับความเสี่ยงในอนาคต |

## 18. Positioning สำหรับนำเสนอ

ระบบนี้ไม่ได้ให้ AI ตัดสินใจแทนผู้ใช้ แต่ช่วยคำนวณค่าที่ควรเติมจากข้อมูลการใช้ย้อนหลัง, stock ปัจจุบัน, Lead Time, ความผันผวน, MOQ, งบประมาณ และ policy กลาง พร้อมอธิบายวิธีคิด ตรวจเส้นทางอนุมัติ และเก็บ snapshot ทุกครั้ง เพื่อให้การวางแผนพัสดุมีมาตรฐานเดียวกัน ตรวจสอบย้อนหลังได้ และลดความเสี่ยงทั้ง Overstock และ Understock
