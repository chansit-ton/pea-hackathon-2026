# Data Policy

กฎนี้ใช้กับโปรเจกต์ `AI Inventory Planning & Procurement Platform Prototype`

## หลักการ

- ห้ามทำ workflow แบบ mock-only ที่ข้อมูลหายหลัง refresh
- ใช้ seed data ได้เฉพาะเป็นข้อมูลตั้งต้นครั้งแรกของ prototype
- ทุก action ที่ผู้ใช้สร้างหรือแก้ไข ต้องถูกเก็บเป็น JSON state ผ่าน `src/utils/persistentJsonStore.ts`
- ทุกค่าที่เป็นผลคำนวณ เช่น Safety Stock, Reorder Point, Suggested Quantity, Estimated Cost และ Approval Route ต้องคำนวณจาก data ปัจจุบัน ไม่ hardcode ผลลัพธ์
- เมื่อสร้าง Purchase Request ต้องเก็บ Calculation Snapshot ณ เวลานั้น เพื่อให้ประวัติย้อนหลังไม่ถูกคำนวณใหม่จาก policy/price/lead time ที่เปลี่ยนภายหลัง
- ห้าม hardcode วันที่สำหรับข้อมูลที่ผู้ใช้สร้างใหม่ ต้องใช้เวลาปัจจุบันของระบบ
- ทุกหน้า dashboard, metric card, AI summary หรือหน้าที่แสดงตัวเลขคำนวณ ต้องมีข้อความอธิบายที่มา/สูตรแบบสั้น และบอกว่าค่านั้นจะเปลี่ยนเมื่อข้อมูลหรือ policy ใดเปลี่ยน
- ถ้าเป็น `MetricCard` หรือกรอบตัวเลขสรุปบน dashboard ต้องใส่ `คำนวณจริงจาก` และ `เปลี่ยนเมื่อ` ไว้ในกรอบเดียวกันกับตัวเลขนั้น ห้ามแยกคำอธิบายไปไว้ใต้ชุดการ์ดจนผู้ใช้ต้องเทียบเอง
- ตัวกรองที่ใช้ซ้ำในหลายหน้า เช่น เขต, WH Id, SKU และปีข้อมูล ต้องอ่านจาก source/helper กลางชุดเดียวกัน ห้าม hardcode option แยกกันคนละหน้า
- หน้ารายละเอียดการคำนวณต้องใช้ค่าจริงของ record/request/snapshot ปัจจุบันเสมอ ห้ามแสดงสูตรลอย ๆ หรือใช้คำว่า "ตัวอย่างคำนวณ" ที่ไม่ผูกกับค่าจริงบนหน้านั้น
- ถ้า AI Suggested Quantity ไม่ตรงกับค่าจริง ต้องมีที่ให้บันทึกค่าจริงเพื่อเทียบกับ snapshot เดิม เก็บ error และใช้เป็น feedback สำหรับปรับปรุงสูตร
- การปรับสูตรจาก feedback ต้องสร้าง formula version ใหม่เสมอ ห้ามแก้ค่าใน Calculation Snapshot เดิมย้อนหลัง
- ถ้าไม่เข้าใจ data source, business rule, สูตร หรือความหมายของ field ใด ต้องถามผู้ใช้ก่อน ห้ามเดา ห้ามสร้างข้อมูลสมมติ และห้ามอธิบายแบบมั่ว

## Data Layers

1. Seed data
   - อยู่ใน `src/data/mockData.ts` และ `src/data/peaDataModel.ts`
   - ใช้เป็นค่าเริ่มต้นเท่านั้น

2. Persistent JSON state
   - อยู่ใน browser `localStorage`
   - ใช้ key prefix `pea-ai-inventory:*`
   - เก็บข้อมูลที่ผู้ใช้แก้ไข เช่น supplier, SKU, inventory, supplier offer, request, contact log, settings และ change log

3. Future backend
   - หากต่อ backend จริง ให้แทนที่ `persistentJsonStore.ts` ด้วย API/database service
   - ห้ามย้อนกลับไปใช้ state ชั่วคราวที่ไม่ persist

4. Optional external feedback endpoint
   - Google Sheet PO feedback เป็นช่องทางส่งสำเนา event เพิ่มเติม ไม่ใช่ source of truth ของระบบ
   - ข้อมูลหลักของ prototype ยังต้องถูกเก็บใน persistent JSON state ก่อนเสมอ
   - ห้ามใส่ API key, service account secret หรือ credential ส่วนตัวใน frontend
   - ห้ามส่งอีเมลหรือข้อมูลส่วนบุคคลของผู้เข้าชมไป endpoint ภายนอก เว้นแต่ผู้ใช้กรอกเองและยินยอมชัดเจน

## Required Persistence

ต้อง persist ทุกข้อมูลต่อไปนี้:

- Supplier profile
- SKU master
- Inventory calculation input
- Supplier offer: price, Lead Time, MOQ, reliability
- Supplier contact log
- Purchase request
- Approval action and timeline
- Calculation snapshot
- Budget settings: Local, Regional และ Central budget
- Formula policy and formula version
- Change log / audit log
- AI suggestion feedback: suggested quantity, actual quantity, error quantity, error percent, formula version และ request id
- Optional PO feedback event ที่ส่งไป Google endpoint ต้องอ้างอิงจาก request/snapshot ที่บันทึกแล้ว

## Developer Rule

เมื่อแก้ code ที่มีผลต่อ data, calculation, request, approval, supplier หรือ settings:

- ต้องตรวจว่า state นั้นถูกบันทึกผ่าน `persistentJsonStore.ts`
- ต้องตรวจว่า refresh หน้าแล้วข้อมูลที่ผู้ใช้สร้างยังอยู่
- ต้องอัปเดต `PROJECT_UPDATES.md`

เมื่อแก้ code ที่เกี่ยวกับงบประมาณ:

- ต้องให้ Local / Regional / Central budget ถูกเก็บใน persistent JSON state ไม่ใช่แก้เฉพาะค่าบนหน้าจอ
- Budget Check และ Approval Routing ต้องอ่านจาก budget settings ล่าสุดสำหรับคำขอใหม่หรือ preview ใหม่
- ช่องกรอกตัวเลขงบประมาณต้องยอมให้ผู้ใช้ลบค่าว่างระหว่างพิมพ์ได้ ห้ามใช้ pattern ที่แปลง `Number("")` กลับเป็น `0` ทันทีจนพิมพ์แล้วเกิดค่าเช่น `016`
- Request History และ Calculation Snapshot เดิมต้องใช้งบ ณ วันที่สร้างคำขอ ห้ามคำนวณย้อนหลังจากงบใหม่
- ต้องมี Budget Change Log แยก field เพื่อเห็นว่าแก้งบคลัง งบเขต หรืองบส่วนกลางตรงไหน
- ต้องมีข้อความช่วยอธิบายว่าค่างบแต่ละระดับใช้ตัดสินใจ approval layer อย่างไร

เมื่อแก้ code ที่เกี่ยวกับสูตรคำนวณหรือหน้าตั้งค่า:

- ต้องมีข้อความช่วยอธิบายใต้ field หรือใกล้ค่าตั้งค่านั้นว่าค่านี้ใช้คำนวณอะไร
- ต้องระบุให้ผู้ใช้เข้าใจว่าหลังแก้ไขแล้วจะกระทบหน้าไหนทันทีหลังบันทึก เช่น Dashboard, SKU Detail, Create Request, VMI
- ต้องระบุชัดเจนว่าคำขอเก่าใน Request History และ Calculation Snapshot เดิมจะไม่เปลี่ยนย้อนหลัง
- ต้องบันทึกการเปลี่ยนแปลงเป็น formula version และ change log ถ้าค่านั้นมีผลต่อการคำนวณหรือ validation
- Formula Version ต้องเปลี่ยนอัตโนมัติเมื่อ policy ที่มีผลต่อการคำนวณถูกแก้ไข ไม่ให้ผู้ใช้กรอกเวอร์ชันเองใน UI
- การกดบันทึกโดยไม่มีการเปลี่ยนค่า policy ต้องไม่สร้าง Formula Version History หรือ Change Log เพิ่ม

เมื่อแก้ code ที่เกี่ยวกับ dashboard, metric หรือ AI Suggest:

- ต้องแสดง microcopy ใกล้ตัวเลขว่า `ค่านี้คำนวณจากอะไร`
- ถ้ามีตัวกรองบน dashboard ต้องใช้ option จาก master/source เดียวกับหน้ารายละเอียดที่เกี่ยวข้อง เช่น Dashboard และหน้าการใช้ SKU ต้องใช้ `peaWarehouseMaster`, `peaSkuMaster` และ `peaMonthlyUsage` ชุดเดียวกัน
- ต้องแยกคำอธิบายราย metric/รายค่า ไม่รวมทุกสูตรเป็นข้อความยาวก้อนเดียวจนผู้ใช้แยกไม่ออกว่าค่าไหนมาจากอะไร
- รายละเอียดของ metric card ต้องอยู่ในกรอบ metric card นั้นโดยตรง ไม่ใช้กล่องอธิบายรวมแยกด้านล่าง
- ต้องบอก trigger ที่ทำให้ค่าตัวเลขเปลี่ยน เช่น import ข้อมูลใหม่, แก้ Supplier Lead Time/MOQ/ราคา, แก้สูตรใน Settings หรือมี request/approval ใหม่
- ต้องทำให้ผู้ใช้เห็นว่า AI Suggest เป็น decision support ที่ใช้ได้จริง โดยสามารถสร้างคำขอ ซื้อ ส่งอนุมัติ เก็บ snapshot และบันทึก feedback เทียบค่าจริงได้
- ถ้าเพิ่ม auto-tune ให้สูตร ต้องปรับแบบก้าวเล็ก สร้าง formula version ใหม่ และบันทึก change log ทุกครั้ง

เมื่อต้องอธิบายสูตรคำนวณ:

- ให้เขียนเป็น `คำนวณจริงจากข้อมูลนี้: ค่า A + ค่า B = ผลลัพธ์จริง` พร้อมหน่วย
- ถ้ามีการปัดขึ้น/ปัดตาม MOQ/ปัดเป็นจำนวนเต็ม ต้องระบุค่าก่อนปัดและค่าหลังปัด
- ถ้าเป็นค่า snapshot ให้ระบุว่าอ่านจาก snapshot ของคำขอนั้น ไม่ใช่คำนวณใหม่
- ห้ามใช้สูตร generic เพียงอย่างเดียวในหน้าที่ผู้ใช้กำลังดูข้อมูลของ SKU/Request เฉพาะรายการ

## กฎเพิ่มเติม: ช่องกรอกตัวเลข

- ทุกช่องกรอกตัวเลขที่ผู้ใช้แก้ไขได้ เช่น จำนวนที่ต้องการขอ, ราคาต่อหน่วย, Lead Time, MOQ, Reliability, ค่าจริงสำหรับ AI Feedback และค่าตั้งค่าสูตร ต้องยอมให้ผู้ใช้ลบค่าระหว่างพิมพ์จนช่องว่างได้
- ห้ามใช้ pattern `Number(event.target.value)` กับ controlled input โดยตรง เพราะ `Number("")` จะกลายเป็น `0` และทำให้เกิดค่าผิดรูปแบบ เช่น `016`
- หากต้องใช้ค่าตัวเลขระหว่างพิมพ์ ให้เก็บ draft เป็น string หรือใช้ component กลางที่รองรับค่าว่าง แล้วค่อยส่งค่าตัวเลขกลับเมื่อ input เป็นตัวเลขที่ถูกต้อง

## กฎเพิ่มเติม: Transfer, Dead Stock, Stockout Forecast และ Delay

- ก่อนสร้างคำขอซื้อใหม่ ระบบควรตรวจทางเลือกโอนย้ายหรือยืม SKU จากคลังอื่นก่อนเสมอ หากมีข้อมูล stock/usage เพียงพอ
- Transfer/Borrow workflow ต้องเก็บ `Transfer Request`, สถานะ, จำนวน, คลังต้นทาง, คลังปลายทาง, เหตุผลการตัดสินใจ และ timeline เป็น persistent JSON state
- การเทียบ stock รายคลังต้องแสดงสูตรใกล้ตัวเลข เช่น `Stock Cover = Stock ปัจจุบัน / Average Monthly Usage` และบอกว่าเปลี่ยนเมื่อ stock หรือ usage เปลี่ยน
- Dead Stock ใน PoC ให้ใช้เป็น Dead/Slow Stock Candidate ไม่ใช่ข้อสรุปทางบัญชีถาวร ต้องแสดงเกณฑ์ที่ใช้ เช่น stock cover สูงกว่า threshold หรือ usage ต่ำมาก
- Stockout Forecast ตาม Season ต้องคำนวณจาก stock ปัจจุบันเทียบกับ seasonal demand และต้องบอกผลกระทบว่าเหลือติดลบหรือเหลือเหนือ safety buffer เท่าไร
- Receiving/Delay log ต้องเก็บวันที่คาดว่าจะได้รับ, วันที่รับจริง, delay days, สาเหตุ delay, note และ impact demand
- Impact Demand จาก Delay ใช้สูตร `Average Daily Demand × Delay Days` และใช้เป็น feedback สำหรับปรับ lead time / seasonal shortage risk ในการคำนวณครั้งถัดไป
- ห้ามแก้ Calculation Snapshot เดิมย้อนหลังจาก Transfer, Receiving หรือ Delay log ใหม่ ให้ใช้ log ใหม่กับ preview หรือคำขอใหม่เท่านั้น
- คำขอยืม (Borrow) ต้องเก็บกำหนดคืน (`dueDate`) และวันคืนจริง (`returnedDate`); สถานะการคืน (คืนแล้ว/เกินกำหนด/ยืมอยู่) ต้องคำนวณจากวันที่ปัจจุบันเทียบ dueDate ไม่ hardcode · การแลก (Swap) ต้องเก็บ SKU ที่แลกกลับ
- หน้าวิเคราะห์ยืม-โอน-แลก (ใครยืมบ่อย/ค้างคืน/ขาดบ่อย/แลกอะไรบ่อย) ต้องคำนวณจาก transfer history ปัจจุบัน ไม่ hardcode อันดับ
- ราคา/หน่วยพัสดุใน seed ต้องสมจริงและสอดคล้องกันทุก dataset (mockData, peaDataModel, procurementHistory) — ห้ามให้ SKU เดียวกันมีราคาต่างกันคนละไฟล์; ถ้าต้องคงค่าเพื่อ demo (เช่น C01 = 2,000/ม.) ให้คงค่าเดียวกันทุกที่

## กฎเพิ่มเติม: Dead Stock Exchange และ Procurement Audit

- รายการของจม (Dead Stock) และประวัติการของบ/สั่งซื้อย้อนหลัง อยู่ใน seed `src/data/procurementHistory.ts` ใช้เป็นค่าตั้งต้นได้ แต่ค่าสรุปทุกตัว (มูลค่าของจม, % ใช้งบ, flag) ต้องคำนวณจาก record ปัจจุบันใน `src/utils/procurementAnalysis.ts` ห้าม hardcode ผลลัพธ์
- มูลค่าของจม = จำนวนของจม × ต้นทุนต่อหน่วย และต้องแสดง aging (ไม่ขยับกี่เดือน) เพื่อให้ monitor ได้ ไม่ใช่ดูแค่ stock cover ณ จุดเดียว
- Dead Stock Exchange ต้องเล็งที่ "ของพร้อมแบ่งปัน/เคลียร์ก่อนซื้อใหม่" ไม่ใช่ประจานบุคคล/คลัง เพื่อไม่ให้คลังซ่อนข้อมูลของจม
- การ์ดดักก่อนสร้างคำขอซื้อต้องเทียบค่าจริง: จำนวน/มูลค่าที่กำลังจะซื้อ เทียบกับของจม SKU เดียวกันที่คลังอื่น และต้องให้ผู้ใช้เลือกยืมแทนหรือซื้อต่อได้ (decision support ไม่บังคับ)
- flag "จุดที่ควรทบทวน" ในหน้า Procurement Audit ต้องอธิบายเกณฑ์ที่ใช้ใกล้ตาราง (และใช้ถ้อยคำสุภาพเป็นทางการในทุกหน้า ไม่ใช้คำกระแทกแดกดัน เช่น ตบหน้า/กวนทีน/ประจาน ใน UI) เช่น ใช้งบ ≥ 95% + ของจมเพิ่ม, ของบ SKU ที่ยังมีของจมค้าง, งบ category สูงกว่าค่าเฉลี่ยคลังอื่น ≥ 1.5 เท่า โดยเกณฑ์รวมไว้ที่ `procurementThresholds`
- หน้า Procurement Audit ต้องมีตัวกรอง (ปีงบ/เขต/หมวด/เฉพาะที่ติด flag) และต้องกดเข้าไปดูรายละเอียด "ใบของบ" แต่ละใบได้ โดยรายละเอียดต้องใช้ค่าจริงของใบนั้น (เหตุผล flag, ประวัติของบ SKU เดียวกันย้อนหลัง, ของจม SKU นั้น, เทียบ peer) ไม่ใช่แค่ลิงก์ออกไปหน้า SKU ลอย ๆ
- ความเห็น/Feedback ใช้โมเดล hybrid: เพิ่มได้จากทุกหน้าผ่านปุ่มลอย (auto-tag หน้าปัจจุบันด้วย `viewLabels`) และรวมแสดงที่หน้า `ศูนย์ความเห็น (Feedback)` ทุกความเห็นต้อง persist เป็น JSON state (`procurementNotes`) พร้อม field `context`, `authorName`, `authorUsername` และใช้เวลาปัจจุบัน ห้าม hardcode วันที่หรือชื่อผู้เขียน (เช่น ห้าม fix เป็น "PO")
- การให้ความเห็นต้องเข้าสู่ระบบก่อน เพื่อเก็บว่าใครเป็นผู้ให้ feedback; การลบความเห็นต้องเป็น role `admin` และใส่รหัสยืนยัน `99999` เท่านั้น
- ระบบ login รองรับ Google Sign-In (OAuth) ผ่าน `VITE_GOOGLE_CLIENT_ID` (เก็บ identity จริงชื่อ/อีเมล) และ login/register/ลืมรหัสผ่าน แบบ local (localStorage: `authUsers`, `currentUser`) เป็น fallback — local ยังไม่ใช่ auth จริง ห้ามใส่ credential จริง
- Google Client ID / endpoint ต้องอ่านจาก env (`VITE_*`) เท่านั้น ห้าม hardcode ในโค้ด; ปุ่ม Google ต้อง env-gated (ไม่ตั้ง = ซ่อน ใช้ local fallback)
- ถ้าต้องเก็บ feedback/user รวมศูนย์จากผู้เข้าชมหลายคนบน Vercel ต้องต่อ datastore (Firestore) หรือส่งผ่าน Google Sheet endpoint — localStorage เก็บแยกตามเครื่องเท่านั้น
