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
