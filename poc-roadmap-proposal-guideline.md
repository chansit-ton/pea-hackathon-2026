# PoC Roadmap Proposal Guideline

## Project

**AI Inventory Planning & Procurement Platform**  
แพลตฟอร์มช่วยวางแผนพัสดุคงคลังและจัดซื้อ ด้วย AI Suggestion, Budget Routing, Approval Workflow, Audit Trail และ VMI Simulation

## Executive Summary

PoC นี้มีเป้าหมายเพื่อพิสูจน์ว่าองค์กรสามารถใช้ข้อมูลคลัง, การใช้พัสดุย้อนหลัง, Lead Time ของ Supplier, งบประมาณ 3 ชั้น และนโยบายกลางขององค์กร เพื่อช่วยแนะนำปริมาณจัดซื้อที่เหมาะสม ลดความเสี่ยง Stock ขาด ลดการใช้ Excel แบบ manual และเพิ่มความโปร่งใสในการอนุมัติคำขอซื้อ

ระบบต้นแบบจะใช้ mock data เท่านั้น ไม่เชื่อมต่อ SAP, API จริง, Database จริง หรือระบบภายนอก เพื่อให้สามารถสาธิตแนวคิด end-to-end ได้ภายในระยะเวลา PoC

---

# 1. POC Scope

## 1.1 Business Scope

PoC ครอบคลุมกระบวนการหลักดังนี้

- ตรวจสอบสถานะ Stock ราย SKU และรายคลัง
- คำนวณ Safety Stock, Reorder Point และ AI Suggested Quantity
- เปรียบเทียบ Supplier ตามราคา, Lead Time, MOQ และ Reliability
- สร้าง Purchase Request จากคำแนะนำของระบบ
- บังคับกรอกเหตุผลเมื่อ Requested Quantity ต่างจาก AI Suggested Quantity
- ตรวจสอบงบประมาณ 3 ชั้น: Local, Regional, Central
- Route คำขออนุมัติไป Local / Regional / Central ตามวงเงิน
- แสดง Approval Queue และ Review Detail
- เก็บ Calculation Snapshot และ Audit Trail ตอนสร้างคำขอ
- บันทึก Supplier Contact Log
- จำลอง VMI Candidate และ VMI Impact

## 1.2 User Scope

กลุ่มผู้ใช้ที่ PoC รองรับ

- เจ้าหน้าที่คลังพื้นที่
- เจ้าหน้าที่จัดซื้อ
- ผู้อนุมัติระดับเขต
- ผู้อนุมัติส่วนกลาง
- Auditor / ผู้ตรวจสอบย้อนหลัง

## 1.3 Technical Scope

เทคโนโลยีที่ใช้ใน PoC

- React + TypeScript
- Tailwind CSS
- Mock data arrays / local state
- No backend
- No real SAP connection
- No real database
- No external API

## 1.4 Key Screens

หน้าจอหลักใน PoC

- Dashboard
- Inventory / SKU Detail
- Calculation Explanation
- Supplier Directory
- Supplier Detail
- Create Purchase Request
- Approval Center
- Request History & Audit Trail
- VMI Candidate Analysis
- VMI Simulation
- Settings / Formula & Policy

## 1.5 Main Demo Flow

ลำดับการสาธิตหลัก

1. Dashboard → เห็น Critical Stock Alert
2. เปิด SKU C01 → ดู Stock Status และ Supplier Options
3. กด “ทำไมระบบแนะนำค่านี้?” → ดู Calculation Explainability
4. Create Purchase Request → ขอ 20 เมตร จาก AI Suggested 10 เมตร
5. ระบบคำนวณ Estimated Cost = 40,000 THB
6. Local Budget ไม่พอ แต่ Regional Budget พอ
7. Submit to Regional Approval
8. Regional Review → Approve
9. Request History → ดู Calculation Snapshot และ Audit Trail
10. VMI Simulation → เทียบ Current Model vs VMI

## 1.6 Out of Scope

สิ่งที่ไม่รวมใน PoC นี้

- ไม่เชื่อมต่อ SAP จริง
- ไม่สร้าง Purchase Order จริง
- ไม่ส่งอีเมล / Line จริง
- ไม่เชื่อมต่อ Supplier Portal จริง
- ไม่ทำ authentication / authorization เต็มรูปแบบ
- ไม่ persist data ลง database จริง
- ไม่ใช้ AI model production จริง

---

# 2. 20-Day Execution Plan

## Phase 1: Discovery & Design Alignment

**Day 1-3**

เป้าหมาย

- ยืนยัน use case หลัก
- กำหนด demo scenario
- กำหนด mock data และสูตรคำนวณ
- ออกแบบ UX flow ระดับ wireframe

Deliverables

- PoC scope confirmation
- Mock data structure
- Calculation formula definition
- Screen flow / navigation map

## Phase 2: Core Prototype Development

**Day 4-9**

เป้าหมาย

- สร้าง frontend prototype
- ทำหน้า Dashboard, Inventory, SKU Detail
- ทำ calculation utility สำหรับ Safety Stock, ROP, Suggested Quantity
- ทำ Supplier Directory และ Supplier Detail

Deliverables

- Working React prototype
- Mock inventory and supplier data
- Reusable calculation engine
- Supplier and inventory screens

## Phase 3: Procurement & Approval Workflow

**Day 10-14**

เป้าหมาย

- สร้าง Create Purchase Request
- เพิ่ม override reason validation
- เพิ่ม budget routing 3 ชั้น
- สร้าง Regional และ Central Approval Queue
- เก็บ Calculation Snapshot ตอนสร้างคำขอ

Deliverables

- Purchase request workflow
- Budget check and approval routing
- Approval review detail
- Calculation snapshot stored in request state

## Phase 4: Explainability, Audit Trail & VMI

**Day 15-18**

เป้าหมาย

- เพิ่ม Calculation Explainability
- เพิ่ม Request History & Audit Trail
- เพิ่ม Supplier Contact Log
- เพิ่ม VMI Candidate และ VMI Simulation
- ปรับ Settings สำหรับ Formula & Policy

Deliverables

- Calculation explanation panel
- Audit trail and history screen
- VMI simulation screen
- Editable formula policy and change log

## Phase 5: Testing, Polish & Demo Preparation

**Day 19-20**

เป้าหมาย

- ทดสอบ demo flow end-to-end
- ตรวจ responsive layout
- ตรวจความถูกต้องของตัวเลขคำนวณ
- เตรียมสคริปต์นำเสนอ

Deliverables

- Final working PoC
- Demo script
- Known limitation list
- Recommendation for next phase

---

# 3. Success Metrics & KPI

## 3.1 Business KPIs

| KPI | Target | วิธีวัดผล |
|---|---:|---|
| ลดเวลาวิเคราะห์ Stock ก่อนสร้าง PR | 50% | เทียบเวลาทำงาน manual กับ prototype flow |
| ลดการใช้ Excel/manual calculation | 60% | นับขั้นตอนที่ระบบคำนวณแทนผู้ใช้ |
| เพิ่มความโปร่งใสของ AI Suggestion | 100% ของ PR มี calculation explanation | ตรวจทุก request มี formula และ snapshot |
| เพิ่มความครบถ้วนของเหตุผล override | 100% เมื่อ requested quantity ต่างจาก AI | ตรวจ validation และ audit trail |
| ระบุ SKU ที่เหมาะกับ VMI ได้ | อย่างน้อย 1 SKU | C01 ถูกแนะนำเป็น VMI Candidate |

## 3.2 Operational KPIs

| KPI | Target | วิธีวัดผล |
|---|---:|---|
| ระบบแสดง Critical Stock Alert ได้ | 100% ของ mock risk SKU | ตรวจ Dashboard และ Inventory |
| ระบบคำนวณ ROP / Safety Stock / Suggested Quantity ได้ | 100% ของ inventory records | ตรวจ calculation result |
| ระบบ route approval ตาม budget ได้ | 100% ของ test cases | ทดสอบ Local / Regional / Central route |
| ระบบเก็บ Calculation Snapshot ได้ | 100% ของ submitted PR | ตรวจ Request History |
| ระบบบันทึก Supplier Contact Log ได้ | 100% ของ test logs | ตรวจ Supplier Detail และ Approval Review |

## 3.3 Technical KPIs

| KPI | Target | วิธีวัดผล |
|---|---:|---|
| Prototype build ผ่าน | 100% | npm build success |
| ใช้ mock data เท่านั้น | 100% | ไม่มี API / DB / SAP integration |
| Component reusable | มี shared components หลัก | ตรวจ MetricCard, DataTable, StatusBadge, BudgetCheckCard |
| Calculation logic แยกจาก UI | 100% | มี utility module สำหรับสูตรคำนวณ |
| Responsive desktop/mobile | ผ่าน smoke test | ทดสอบ sidebar collapse และ mobile layout |

## 3.4 Demo Acceptance Criteria

PoC ถือว่าสำเร็จเมื่อสาธิตได้ครบ

- C01 แสดงเป็น SKU เสี่ยงใน Dashboard
- เปิด SKU Detail แล้วเห็น Supplier options
- กดดู Calculation Explanation ได้
- สร้าง PR โดยขอ 20 เมตร จาก AI แนะนำ 10 เมตร
- ระบบคำนวณ variance +100%
- ระบบบังคับกรอก override reason
- ระบบคำนวณ Estimated Cost = 40,000 THB
- ระบบ route ไป Regional Approval
- Regional Approve ได้
- Request History แสดง Snapshot ไม่ใช่ค่าคำนวณใหม่
- VMI Simulation แสดง impact ได้

---

# 4. POC Financial Plan

## Budget Limit

**งบประมาณรวม: 25,000 THB**

## Budget Allocation

| รายการ | งบประมาณ | รายละเอียด |
|---|---:|---|
| UX/UI Prototype Development | 9,000 THB | ออกแบบและพัฒนา React prototype |
| Calculation Logic & Mock Data | 5,000 THB | สูตร Safety Stock, ROP, Suggested Quantity, Budget Routing |
| Approval Workflow & Audit Trail | 4,000 THB | PR workflow, Approval queue, Snapshot, History |
| VMI Simulation & Dashboard Polish | 3,000 THB | VMI candidate, simulation, dashboard polish |
| Testing & Demo Preparation | 2,000 THB | ทดสอบ demo flow, responsive, build |
| Contingency | 2,000 THB | เผื่อปรับ requirement ระหว่าง PoC |
| **Total** | **25,000 THB** |  |

## Cost Control Assumptions

- ใช้ mock data เท่านั้น
- ไม่ใช้ paid API
- ไม่ใช้ cloud database
- ไม่ต้อง deploy production
- ไม่ทำ integration กับ SAP จริง
- ใช้ frontend local state สำหรับ PoC
- ใช้ existing open-source frontend stack

## Resource Plan

| Role | Effort | Responsibility |
|---|---:|---|
| Product / UX Engineer | 12 days | UX flow, frontend prototype, demo script |
| Full-stack / Calculation Engineer | 5 days | calculation logic, workflow state, validation |
| Tester / Demo Support | 3 days | test scenarios, demo rehearsal, issue fixing |

## Expected Value After PoC

ผลลัพธ์ที่องค์กรจะได้จาก PoC

- เห็นภาพ end-to-end ของ AI-assisted inventory planning
- พิสูจน์ usability ของ Calculation Explainability
- พิสูจน์ feasibility ของ approval routing ตามงบ 3 ชั้น
- พิสูจน์ว่า Calculation Snapshot ช่วย audit ได้จริง
- ได้ prototype สำหรับคุยต่อกับ business owner และ IT integration team
- ได้ roadmap สำหรับต่อยอดสู่ pilot ที่เชื่อมต่อ SAP / database จริง

---

# Next Phase Recommendation

หาก PoC ผ่านเกณฑ์ ควรต่อยอดเป็น Pilot Phase โดยเพิ่ม

- เชื่อมต่อ SAP / stock movement data
- เชื่อมต่อ supplier master และ price history
- ทำ database สำหรับ request, snapshot, approval, audit log
- เพิ่ม role-based access control
- ทำ notification workflow
- ทดลองกับคลังจริง 1 เขต และ 5-10 SKU
- วัดผลจริงเรื่อง stockout risk, approval time และ manual workload

