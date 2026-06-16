# PEA Inventory AI - Final Pitch Handoff

เอกสารนี้ใช้ส่งต่อให้ทีมทำสไลด์/ซ้อม pitch ต่อจาก prototype ใน repo `pea-hackathon-2026` โดยจัดเนื้อหาให้ตรงกับ PEA Hackathon 2026 Track #2: Inventory & Safety Stock Optimization และเกณฑ์กรรมการที่เน้น Impact 40% และ Feasibility 35%

## 1. Executive Summary

**ชื่อโซลูชัน:** Inventory AI - ระบบวางแผนพัสดุและจัดซื้ออัจฉริยะสำหรับ PEA

**One-liner:** ระบบที่ถามก่อนว่า “จำเป็นต้องซื้อจริงไหม” โดยคำนวณ Safety Stock / Reorder Point / AI Suggested Quantity จากข้อมูลจริง พร้อมตรวจของจมข้ามคลังก่อนเปิดคำขอซื้อ และเก็บหลักฐานการตัดสินใจย้อนหลังได้ทุกขั้น

**Core thesis:** PEA ไม่ได้มีแค่ปัญหา “ของขาด” หรือ “ของเกิน” แยกกัน แต่มีปัญหาเชิงระบบคือข้อมูลสต็อก งบ และการจัดซื้ออยู่คนละมุม ทำให้บางพื้นที่ซื้อเพิ่มทั้งที่อีกคลังมีของจม ระบบนี้เชื่อมข้อมูลให้เห็นก่อนตัดสินใจ ลด understock, overstock, dead stock และเวลาการอนุมัติ

**สิ่งที่ prototype ทำได้แล้ว:**
- Dashboard วิเคราะห์ SKU เสี่ยง, Dead/Slow Stock, งบประมาณ และคำขอรออนุมัติ
- SKU Detail แสดง Current Stock, Safety Stock, ROP, AI Suggested Quantity และคำอธิบายสูตร
- Create Purchase Request พร้อม Budget Check 3 ชั้น: Local / Regional / Central
- บังคับเหตุผลเมื่อผู้ใช้ขอจำนวนต่างจาก AI Suggestion
- Calculation Snapshot เก็บค่าที่ใช้คำนวณ ณ วันที่สร้างคำขอ เพื่อ audit ย้อนหลัง
- Dead Stock Exchange แสดงของจมที่ยืม/แลก/โอนได้ก่อนซื้อใหม่
- Procurement Audit ตรวจ “ซื้อซ้ำทั้งที่ของยังจม”, “เร่งใช้งบให้หมด”, “งบสูงกว่า peer”
- Transfer/Borrow/Swap workflow พร้อม timeline
- Receiving Delay log คำนวณ Impact Demand เพื่อป้อนกลับรอบถัดไป
- VMI Simulation เปรียบเทียบ Current Model vs Vendor Managed Inventory
- Feedback / Google Sign-In / Optional Google Sheet endpoint สำหรับรวม event บางส่วน

## 2. Problem Context

### ปัญหาหลักที่ต้องเล่า

1. **ไม่มีมาตรฐานกลางในการคำนวณ Safety Stock / ROP**
   เจ้าหน้าที่ต้องใช้ประสบการณ์ส่วนตัวและ Excel ทำให้แต่ละคลังตัดสินใจไม่เท่ากัน

2. **Human Error จากงาน manual**
   การรวบรวม usage, stock, supplier lead time, MOQ, price และ budget ใช้แรงมากและเสี่ยงผิด

3. **ข้อมูลของขาดและของจมไม่เชื่อมกัน**
   คลังหนึ่งขาดและขอซื้อใหม่ ขณะที่อีกคลังมีของ SKU เดียวกันจมอยู่

4. **การอนุมัติและ audit ใช้เวลามาก**
   ผู้อนุมัติต้องถามย้อนว่า “ทำไมขอจำนวนนี้” และ auditor ต้องไล่ดูประวัติย้อนหลัง

5. **การใช้งบปลายปีอาจสร้าง dead stock เพิ่ม**
   ระบบ Procurement Audit ใน prototype ตั้งใจจับ pattern การของบซ้ำหรือใช้งบเกือบหมดทั้งที่ของจมเพิ่มขึ้น

### Persona หลัก

**คุณสมมุติ - General Information**
- ตำแหน่ง: เจ้าหน้าที่พัสดุ ระดับ 5 แผนกพัสดุ
- ประสบการณ์: ทำงาน PEA มากกว่า 5 ปี
- งานหลัก: ดูแลพัสดุคงคลังของเขตพื้นที่ วิเคราะห์ข้อมูล และส่งคำขอซื้อ
- ความต้องการ: เครื่องมือช่วยสร้าง Safety Stock และ ROP อัตโนมัติที่เป็นมาตรฐานเดียวกันทั่วประเทศ

### Pain Point ที่ใช้บนสไลด์

- ใช้ Tacit Knowledge + Excel ทำให้มาตรฐานต่างกัน
- ข้อมูล usage/stock/lead time/budget กระจายหลายแหล่ง
- มีความเสี่ยง Overstock และ Understock พร้อมกัน
- เสียเวลาทำเอกสาร อธิบายเหตุผล และตรวจย้อนหลัง

## 3. Product Narrative

### Before

เจ้าหน้าที่เห็นว่าสต็อกใกล้หมด จึงเปิดคำขอซื้อจากประสบการณ์หรือ Excel ผู้อนุมัติเห็นแค่จำนวนที่ขอและงบประมาณ แต่ไม่เห็นว่าคำนวณจาก usage จริงหรือไม่ ไม่เห็นว่าคลังอื่นมีของจมหรือเปล่า และเมื่อเวลาผ่านไป ราคาหรือสูตรเปลี่ยน การตรวจย้อนหลังยิ่งยาก

### After

เจ้าหน้าที่เปิด Dashboard เห็น SKU เสี่ยง เข้า SKU Detail ดู AI Suggested Quantity พร้อมสูตร กดสร้าง PR ระบบตรวจทันทีว่ามี dead stock ที่คลังอื่นหรือไม่ ถ้ามีเสนอให้ยืม/โอนแทนซื้อใหม่ ถ้าจะขอเกิน AI ต้องใส่เหตุผล ระบบคำนวณงบและ routing ไป Local/Regional/Central แล้วเก็บ Calculation Snapshot ให้ตรวจย้อนหลัง

### Key differentiator

ไม่ใช่แค่ dashboard และไม่ใช่แค่ AI forecast แต่เป็น **decision workflow** ที่รวม:
- Predict: คำนวณต้องเติมเท่าไร
- Prevent: ดักซื้อซ้ำ/ของจมก่อนเปิด PR
- Approve: route งบ 3 ชั้นพร้อมเหตุผล
- Audit: เก็บ snapshot และ timeline
- Improve: ใช้ feedback/delay/actual usage ปรับสูตรเวอร์ชันถัดไป

## 4. Solution Architecture

### Input Layer

- SKU catalog: 12 SKU พัสดุไฟฟ้า เช่น สายเคเบิล, เสาไฟ, หม้อแปลง, breaker, capacitor, voltage regulator
- Warehouse / Plant: 8 คลังใน 3 เขต
- Usage history: การใช้งานรายเดือน/ตาม season
- Stock summary: stock quantity, stock cover, risk status
- Supplier data: price, lead time, MOQ, reliability
- Budget settings: Local / Regional / Central
- Procurement history: ประวัติของบ/สั่งซื้อย้อนหลัง 3 ปีงบ
- Dead stock listings: รายการของจมพร้อม aging และ match warehouse ที่ขาด
- User feedback / receiving delay logs

### Calculation Layer

สูตรหลักใน `src/utils/inventoryCalculations.ts`

- Historical Usage Total
- Average Daily Demand
- Demand Variability
- Adjusted Lead Time = Supplier Lead Time x Seasonal Factor x Budget Factor
- Safety Stock = Z-score x Demand Variability x sqrt(Adjusted Lead Time)
- Demand During Lead Time
- Reorder Point = Demand During Lead Time + Safety Stock
- Target Stock Level
- Suggested Quantity = Target Stock - Current Stock, ปัดตาม MOQ
- Estimated Cost = Requested Quantity x Unit Price
- Approval Routing = ตรวจงบ Local / Regional / Central

### Decision Layer

- ถ้า current stock <= safety stock: Critical
- ถ้า current stock <= reorder point: Near Reorder Point
- ถ้าขอจำนวนต่างจาก AI Suggested: บังคับใส่ override reason
- ถ้ามี dead stock SKU เดียวกันที่คลังอื่น: เสนอ transfer/borrow/swap ก่อนซื้อ
- ถ้า budget local ไม่พอแต่ regional พอ: route ไป Regional
- ถ้า regional ไม่พอ: route ไป Central

### Audit Layer

- Calculation Snapshot ล็อกค่า ณ เวลาสร้างคำขอ
- Approval Timeline บันทึก action/actor/note
- Change Log สำหรับ supplier, formula policy, budget
- Feedback log บันทึก actual quantity เทียบ AI suggestion
- Formula versioning ปรับสูตรรอบถัดไปโดยไม่แก้ snapshot เก่า

## 5. Demo Storyboard

ใช้ flow นี้สำหรับ live demo หรือ screenshot sequence:

1. **Intro / Landing**
   เปิดด้วยคำถาม: “ก่อนซื้อพัสดุ เรารู้หรือยังว่าคลังอื่นมีของจมหรือไม่?”

2. **Dashboard**
   ชี้ KPI: ทุนจมที่ตรวจพบ, SKU เสี่ยง, PR รออนุมัติ, Dead Stock Exchange

3. **SKU Detail**
   เลือก SKU สายเคเบิลหรือเสาไฟ แสดง Current Stock, Safety Stock, ROP, AI Suggested Quantity

4. **Calculation Detail**
   กดดู “ทำไมระบบแนะนำค่านี้?” แล้วอธิบายสูตร 3-4 step พอ:
   - usage ย้อนหลัง -> average daily demand
   - lead time x season factor -> adjusted lead time
   - safety stock + demand during lead time -> ROP
   - target stock - current stock -> suggested quantity

5. **Create Purchase Request**
   ตั้ง requested qty เช่น 20 เมตร ระบบคำนวณ cost และ route ไป Regional เพราะ local budget ไม่พอ

6. **Dead Stock Guard**
   ชี้ว่าถ้า SKU นี้มีของจมที่คลังอื่น ระบบเสนอ “ยืม/โอนแทน”

7. **Approval Queue**
   ผู้อนุมัติเห็น AI vs Requested, variance, reason, budget check, supplier และ snapshot

8. **History / Audit**
   เปิด request history ให้เห็น Calculation Snapshot ที่ล็อกค่าเดิม

9. **Procurement Audit**
   แสดง flag ซื้อซ้ำทั้งที่ของจม / เร่งใช้งบ / งบสูงกว่า peer

10. **VMI Simulation**
   ปิดด้วยการต่อยอด: SKU ที่ demand เสถียรและ supplier reliable สามารถจำลอง VMI เพื่อลด lead time และ inventory value

## 6. Impact Logic

### Hard Return

- ลดการซื้อใหม่ที่ไม่จำเป็นโดยตรวจ dead stock ก่อนเปิด PR
- ลดทุนจมจาก overstock/dead stock
- ลด cost จาก repeated procurement
- ลด stockout cost / opportunity loss จากการคำนวณ ROP และ safety stock ที่ชัดขึ้น

### Soft Return

- ลดเวลารวบรวม Excel และอธิบายตัวเลข
- เพิ่มความมั่นใจให้ผู้อนุมัติ เพราะเห็นสูตรและ snapshot
- ลด human error จาก manual calculation
- ทำให้ feedback จากหน้างานย้อนกลับมาปรับสูตรได้

### Strategic Return

- สร้างมาตรฐานกลางสำหรับ safety stock / ROP ทั่วประเทศ
- รองรับ audit/governance เพราะตรวจย้อนหลังได้
- เตรียมต่อยอดกับ SAP-MM, GFMIS, Firestore, Google Sheet endpoint หรือ data warehouse
- เปิดทางสู่ VMI สำหรับ SKU ที่เหมาะสม

## 7. Feasibility

### สิ่งที่ทำได้แล้วใน prototype

- React + TypeScript + Tailwind frontend
- Formula engine แยกอยู่ใน utility functions
- Persistent JSON state ผ่าน localStorage
- Seed data model แยก SKU / Warehouse / Plant / Supplier
- Deterministic generated data สำหรับ 12 SKU x 8 คลัง x 3 เขต
- Budget setting และ approval routing ใช้ค่าปัจจุบันจริง ไม่ hardcode
- Snapshot เก่าไม่ถูกคำนวณย้อนหลังเมื่อ policy หรือ budget เปลี่ยน
- Optional Google OAuth และ Google Sheet event endpoint

### Integration path

Phase 1 - PoC / Sandbox:
- ใช้ CSV/Excel export จากระบบเดิม
- ใช้ localStorage หรือ Google Sheet endpoint เพื่อเก็บ feedback
- โชว์ flow end-to-end ให้ PO และ mentor validate

Phase 2 - Pilot เขต:
- เชื่อม datastore กลาง เช่น Firestore/PostgreSQL
- นำเข้าข้อมูล stock movement, PR/PO, lead time, supplier reliability
- ตั้ง rule สำหรับ transfer/borrow และ approval role จริง

Phase 3 - Enterprise:
- เชื่อม SAP-MM สำหรับ stock movement/PO
- เชื่อม GFMIS หรือระบบงบประมาณที่เกี่ยวข้อง
- เพิ่ม role-based access control, audit log, SLA tracking, notification
- ใช้ model retraining/feedback loop อย่างเป็นระบบ

## 8. Judge-Specific Strategy

### 1. Engineering & Tech Judge

Focus: Technical feasibility, architecture, infrastructure security

สิ่งที่ต้องเน้น:
- สูตรแยกเป็น deterministic calculation engine ไม่ใช่ AI black box
- Calculation Snapshot ป้องกัน audit drift
- Formula versioning ปรับสูตรได้โดยไม่ทำลายประวัติ
- Data model แยก WH Id, Factory/Plant Id, Supplier/Vendor ชัดเจน
- Production path ต่อ SAP/database ได้ ไม่ผูกกับ mock data

คำตอบสั้นถ้าถามเรื่อง security:
- PoC ยังเป็น frontend/localStorage สำหรับ hackathon
- production ต้องย้าย state ไป backend, เพิ่ม RBAC, audit log, encryption, SSO, API boundary
- Google OAuth/Sheet endpoint ใน PoC เป็น optional และ env-gated

### 2. Operations & Implementation Judge

Focus: practicality, regional scaling, user impact

สิ่งที่ต้องเน้น:
- Flow เริ่มจากงานจริงของเจ้าหน้าที่พัสดุ ไม่ใช่ feature ลอย ๆ
- ใช้ภาษาไทยและคำที่เจ้าหน้าที่เข้าใจ เช่น คลัง, เขต, งบ, คำขอซื้อ
- ระบบไม่ได้บังคับ AI ตัดสินใจ แต่ช่วยเสนอและบันทึกเหตุผลเมื่อคน override
- รองรับ Local / Regional / Central approval
- Pilot ได้ทีละเขต เพราะ data model แยก warehouse/region อยู่แล้ว

### 3. Corporate Strategy Judge

Focus: governance, executive impact, strategic alignment

สิ่งที่ต้องเน้น:
- ลดทุนจมและลดการใช้งบที่ไม่สะท้อน demand
- ทำให้การจัดซื้อโปร่งใส ตรวจสอบย้อนหลังได้
- ช่วย governance โดยมี evidence trail ตั้งแต่คำนวณถึงอนุมัติ
- ขยายเป็นมาตรฐานกลางทั้งองค์กรได้

### 4. Business Innovation Judge

Focus: scalability, business model, startup-style growth

สิ่งที่ต้องเน้น:
- แตกต่างจาก dashboard ทั่วไป เพราะมี “ซื้อหรือไม่ซื้อ” decision workflow
- Dead Stock Exchange เปลี่ยนของจมเป็นสินทรัพย์ที่หมุนเวียนได้
- VMI simulation เป็น pathway ไปสู่ supplier collaboration
- Scalable จาก PEA ไปองค์กร utility/logistics/maintenance ที่มี distributed inventory ได้

## 9. Pitch Deck Outline

แนะนำ 12 สไลด์ สำหรับเวลา 5-7 นาที + Q&A

1. **Cover - Stop Buying Blind**
   Claim: ก่อนซื้อ เราควรรู้ก่อนว่าของขาดจริง หรือแค่กระจายผิดคลัง

2. **Problem - PEA Has Both Stockout and Dead Stock**
   Claim: ปัญหาไม่ใช่แค่ forecast แต่คือข้อมูลตัดสินใจไม่เชื่อมกัน

3. **Persona & Pain - เจ้าหน้าที่พัสดุไม่ได้ขาดความรู้ แต่ขาดระบบช่วยตัดสินใจ**
   Proof: Persona คุณสมมุติ + 3 pain points

4. **Insight - The Real Question Is “Buy, Transfer, Borrow, or Wait?”**
   Proof: decision tree

5. **Solution - Inventory AI Decision Workflow**
   Proof: Dashboard -> SKU Detail -> Calculation -> Guard -> PR -> Approval -> Audit

6. **Core Engine - Explainable Safety Stock and ROP**
   Proof: formula chain from usage to suggested quantity

7. **Dead Stock Guard - ดักซื้อซ้ำก่อนเปิด PR**
   Proof: dead stock exchange + procurement audit flags

8. **Impact - Hard / Soft / Strategic Return**
   Proof: impact vs cost framework aligned with judging guideline

9. **Implementation - Built as a Pilotable Architecture**
   Proof: data layer / calculation layer / workflow layer / audit layer

10. **Demo Path - What Judges Will See**
   Proof: step-by-step live demo route

11. **Roadmap - Sandbox to Regional Pilot to Enterprise**
   Proof: 3 phase deployment plan

12. **Close - AI Does Not Replace Approval; It Makes Every Decision Explainable**
   Claim: ลดของขาด ลดของจม ลดเวลา และเพิ่มความโปร่งใส

## 10. 3-Minute Pitch Script

สวัสดีครับ/ค่ะ วันนี้เรานำเสนอ Inventory AI ระบบช่วยวางแผนพัสดุและจัดซื้ออัจฉริยะสำหรับ PEA

Pain point ของงานพัสดุไม่ใช่แค่ของขาดหรือของเกินอย่างใดอย่างหนึ่ง แต่คือทั้งสองอย่างเกิดพร้อมกัน บางคลังขาดจนต้องรีบเปิดคำขอซื้อ ขณะที่อีกคลังมีของ SKU เดียวกันจมอยู่ ข้อมูล usage, stock, lead time, supplier และงบประมาณอยู่กระจายกัน ทำให้เจ้าหน้าที่ต้องใช้ Excel และประสบการณ์ส่วนตัวในการตัดสินใจ

ระบบของเราจึงเริ่มจากคำถามง่าย ๆ ก่อนซื้อว่า “จำเป็นต้องซื้อจริงไหม” Inventory AI จะคำนวณ Safety Stock, Reorder Point และจำนวนที่ควรซื้อจากข้อมูลจริง เช่น usage ย้อนหลัง ความผันผวน demand ระยะเวลารอพัสดุ MOQ ราคา และงบประมาณ จากนั้นแสดงเหตุผลทุกตัวเลขได้ ไม่ใช่ AI กล่องดำ

เมื่อเจ้าหน้าที่สร้างคำขอซื้อ ระบบจะตรวจทันทีว่ามีของจมที่คลังอื่นหรือไม่ ถ้ามีจะเสนอให้โอน ยืม หรือแลกก่อนซื้อใหม่ ถ้าผู้ใช้ขอจำนวนต่างจาก AI Suggestion ระบบบังคับให้ใส่เหตุผล override และคำนวณเส้นทางอนุมัติ 3 ชั้น Local, Regional, Central ตามงบจริง

จุดสำคัญคือทุกคำขอถูกเก็บเป็น Calculation Snapshot ล็อกสูตร ราคา lead time งบ และเหตุผล ณ วันที่สร้างคำขอ ทำให้ผู้อนุมัติและ auditor ตรวจย้อนหลังได้ แม้สูตรหรือราคาจะเปลี่ยนภายหลัง

Impact ที่ได้คือ Hard Return จากการลดซื้อซ้ำและลดทุนจม Soft Return จากการลดเวลา manual และ human error และ Strategic Return จากการสร้างมาตรฐานกลางให้ PEA ทั้งองค์กร

Prototype นี้ทำ flow หลักแล้ว ตั้งแต่ Dashboard, SKU Detail, Create PR, Approval, Audit, Dead Stock Exchange, Procurement Audit, Receiving Delay และ VMI Simulation โดยสามารถเริ่ม pilot ทีละเขตจากข้อมูล export/Excel ก่อน แล้วต่อยอดเป็น SAP-MM หรือฐานข้อมูลกลางใน production

สรุปคือ เราไม่ได้ให้ AI ตัดสินใจแทนคน แต่ให้ AI ทำให้ทุกการตัดสินใจซื้อพัสดุมีข้อมูล มีเหตุผล และตรวจสอบได้

## 11. Q&A Prep

**Q: AI แม่นแค่ไหน?**
A: Prototype ใช้ deterministic formula engine ก่อน ไม่ขายเป็น black-box prediction จุดแข็งคืออธิบายสูตรได้และมี feedback loop เทียบ actual vs suggested เพื่อปรับ formula version ถัดไป

**Q: ถ้าไม่มีข้อมูลครบจะทำอย่างไร?**
A: ระบบมี Data Coverage panel แจ้งว่าข้อมูล demand, stock, lead time, supplier หรือ mapping ครบหรือไม่ ถ้าไม่ครบจะไม่แสดงผลแบบ misleading

**Q: ทำไมต้องมี Calculation Snapshot?**
A: เพราะราคา lead time budget และ policy เปลี่ยนได้ ถ้าเรา re-calculate ประวัติย้อนหลัง auditor จะไม่รู้ว่าตอนอนุมัติใช้ข้อมูลอะไร Snapshot จึงล็อกหลักฐาน ณ วันนั้น

**Q: ต่อ production ยากไหม?**
A: โครงสร้างแยก layer ชัดเจน calculation engine ไม่ผูก UI และ data model แยก warehouse/plant/supplier แล้ว ขั้น production คือเปลี่ยน source จาก seed/localStorage เป็น API/database/SAP connector

**Q: จะป้องกันคลังซ่อนของจมอย่างไร?**
A: UI ใช้แนวคิด “ของพร้อมแบ่งปัน/เคลียร์ก่อนซื้อใหม่” ไม่ใช่ประจาน และทำให้คลังที่แบ่งปันช่วยลดคำขอซื้อใหม่ของทั้งเขตได้ เป็น incentive เชิงองค์กร

**Q: ถ้าคน override AI บ่อย ๆ ล่ะ?**
A: ระบบไม่ห้าม แต่บังคับใส่เหตุผล เก็บ variance และ actual feedback เพื่อดูว่า AI conservative ไป หรือ user ขอเกินโดยไม่มี evidence

## 12. Handoff Checklist

ก่อนขึ้น pitch:
- เลือก 1 hero SKU สำหรับ demo เช่น สายเคเบิล XLPE หรือเสาคอนกรีต 12 เมตร
- เตรียม screenshot สำรองทุกหน้าสำคัญ เผื่อ live demo ล่ม
- ซ้อม path ไม่เกิน 5 นาที: Dashboard -> SKU Detail -> Calculation -> Create PR -> Approval -> History -> Procurement Audit
- หลีกเลี่ยงคำว่า “กฟภ.” แบบไม่เป็นทางการบนสไลด์ ใช้ “PEA” หรือ “การไฟฟ้าส่วนภูมิภาค”
- เน้น Impact และ Feasibility ก่อน feature list
- ระบุชัดว่า PoC ยังไม่มี backend จริง แต่มี architecture path สำหรับ production

## 13. Calculation Formula Reference

รายละเอียดสูตรคำนวณทั้งหมดแยกไว้ที่ `pea-ai-inventory-calculation-formulas.md` ในโฟลเดอร์ output เดียวกัน ครอบคลุมสูตร Safety Stock, ROP, Suggested Quantity, MOQ, Budget Routing, Procurement Audit, Dead Stock, VMI Simulation และ AI Feedback Loop
