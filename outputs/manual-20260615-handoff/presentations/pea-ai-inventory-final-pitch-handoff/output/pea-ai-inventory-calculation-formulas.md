# PEA Inventory AI - Calculation Formula Reference

เอกสารนี้สรุปสูตรคำนวณทั้งหมดที่ใช้ใน prototype โดยอ้างอิงจากโค้ดหลัก:

- `src/utils/inventoryCalculations.ts`
- `src/utils/procurementAnalysis.ts`
- `src/App.tsx`

เป้าหมายคือให้ทีม pitch, ทีมทำสไลด์, หรือทีม demo อธิบายได้ว่าแต่ละตัวเลขมาจากอะไร ไม่ใช่ AI กล่องดำ

## 1. ตัวแปรหลัก

| ตัวแปร | ความหมาย |
| --- | --- |
| `historicalUsage` | ประวัติการใช้พัสดุย้อนหลังเป็นราย period เช่น รายเดือน |
| `quantity` | จำนวนพัสดุที่ใช้ในแต่ละ period |
| `days` | จำนวนวันของ period นั้น |
| `currentStock` | สต็อกปัจจุบันของ SKU ในคลัง |
| `serviceLevel` | ระดับความมั่นใจที่องค์กรต้องการ เช่น 0.95 หรือ 95% |
| `zScore` | ค่า Z ที่แปลงจาก Service Level |
| `supplierLeadTimeDays` | ระยะเวลารอพัสดุตามซัพพลายเออร์ |
| `seasonalFactor` | ตัวคูณฤดูกาลหรือช่วงงาน |
| `budgetFactor` | ตัวคูณเผื่อรอบงบประมาณ/ความล่าช้าภายใน |
| `adjustedLeadTimeDays` | Lead Time ที่ปรับด้วยปัจจัยฤดูกาลและงบแล้ว |
| `demandVariabilityPerPeriod` | ความผันผวนการใช้ราย period |
| `demandVariabilityPerDay` | ความผันผวนการใช้ต่อวัน |
| `safetyStock` | ระดับพัสดุสำรองปลอดภัย |
| `demandDuringLeadTime` | ความต้องการใช้ระหว่างรอพัสดุ |
| `reorderPoint` | จุดสั่งซื้อใหม่ |
| `forecastDemandForPlanningPeriod` | Demand คาดการณ์ในรอบวางแผน |
| `targetStockLevel` | ระดับสต็อกเป้าหมายหลังเติม |
| `moq` | Minimum Order Quantity |
| `suggestedQuantity` | จำนวนที่ระบบแนะนำให้ซื้อ |
| `requestedQuantity` | จำนวนที่ผู้ใช้ขอซื้อจริง |
| `unitPrice` | ราคาต่อหน่วย |

## 2. สูตรคำนวณ Demand

### 2.1 Historical Usage Total

ใช้หาปริมาณการใช้รวมจากข้อมูลย้อนหลังทั้งหมด

```text
Historical Usage Total = SUM(quantity ของทุก period)
```

ตัวอย่าง:

```text
80 + 100 + 90 + 120 + 110 + 100 = 600 หน่วย
```

ใช้ต่อในสูตร Average Daily Demand

### 2.2 Historical Usage Days

ใช้หาจำนวนวันรวมของข้อมูลย้อนหลัง

```text
Historical Usage Days = SUM(days ของทุก period)
```

ตัวอย่าง:

```text
6 เดือน x 30 วัน = 180 วัน
```

### 2.3 Average Daily Demand

ค่าเฉลี่ยการใช้ต่อวัน

```text
Average Daily Demand = Historical Usage Total / Historical Usage Days
```

เงื่อนไขในโค้ด:

```text
ถ้า Historical Usage Days <= 0 ให้ผลลัพธ์เป็น 0
```

ตัวอย่าง:

```text
600 / 180 = 3.33 หน่วย/วัน
```

ใช้ต่อในสูตร Demand During Lead Time และ Reorder Point

## 3. สูตรความผันผวนของ Demand

### 3.1 Mean

ค่าเฉลี่ยของปริมาณการใช้ราย period

```text
Mean = SUM(quantity) / จำนวน period
```

### 3.2 Standard Deviation ราย Period

โค้ดใช้ population standard deviation

```text
Variance = SUM((quantity_i - Mean)^2) / จำนวน period
Demand Variability per Period = SQRT(Variance)
```

ถ้าไม่มีข้อมูล:

```text
Demand Variability per Period = 0
```

ความหมาย:

- ค่าน้อย = ใช้สม่ำเสมอ
- ค่าสูง = demand แกว่งมาก ต้องเผื่อ safety stock มากขึ้น

### 3.3 Average Days per Period

```text
Average Days per Period = SUM(days) / จำนวน period
```

ถ้าไม่มีข้อมูล:

```text
Average Days per Period = 0
```

### 3.4 Demand Variability per Day

แปลงความผันผวนราย period ให้เป็นรายวัน

```text
Demand Variability per Day = Demand Variability per Period / SQRT(Average Days per Period)
```

เงื่อนไขในโค้ด:

```text
ถ้า Average Days per Period <= 0 ให้ผลลัพธ์เป็น 0
```

## 4. สูตร Service Level และ Z-score

ระบบให้ผู้ใช้เลือก Service Level แล้ว derive ค่า Z-score อัตโนมัติ เพื่อไม่ให้ Service Level กับ Z-score ขัดกัน

### 4.1 Normalize Service Level

```text
ถ้า input > 1 ให้ตีความเป็นเปอร์เซ็นต์
Service Level = input / 100

ถ้า input <= 1 ใช้ค่านั้นตรง ๆ
Service Level = input
```

ตัวอย่าง:

```text
95 -> 0.95
0.95 -> 0.95
```

### 4.2 ตาราง Z-score

| Service Level | Z-score |
| ---: | ---: |
| 0.800 | 0.84 |
| 0.850 | 1.04 |
| 0.900 | 1.28 |
| 0.950 | 1.65 |
| 0.975 | 1.96 |
| 0.990 | 2.33 |
| 0.995 | 2.58 |

### 4.3 กติกาเลือก Z-score

```text
ถ้า Service Level <= 0.80 ใช้ Z = 0.84
ถ้า Service Level >= 0.995 ใช้ Z = 2.58
ถ้าอยู่ระหว่างค่าในตาราง ใช้ linear interpolation
```

สูตร interpolation:

```text
Ratio = (Service Level - Lower Service Level) / (Upper Service Level - Lower Service Level)
Z = Lower Z + Ratio x (Upper Z - Lower Z)
```

จากนั้นปัดเป็นทศนิยม 2 ตำแหน่ง:

```text
Z-score = ROUND(Z x 100) / 100
```

## 5. สูตร Lead Time

### 5.1 Adjusted Lead Time

Lead Time จริงที่ระบบใช้คำนวณ จะไม่ใช้ lead time จาก supplier อย่างเดียว แต่คูณปัจจัยฤดูกาลและงบประมาณด้วย

```text
Adjusted Lead Time Days = Supplier Lead Time Days x Seasonal Factor x Budget Factor
```

ตัวอย่าง:

```text
25 วัน x 1.20 x 1.00 = 30 วัน
```

ความหมายของ factor:

- `seasonalFactor` เพิ่ม/ลดตามช่วงงาน งานเร่ง ฤดูกาลก่อสร้าง หรือช่วง demand สูง
- `budgetFactor` เผื่อรอบงบประมาณหรือความล่าช้าจากกระบวนการภายใน

## 6. สูตร Safety Stock

### 6.1 Safety Stock ดิบ

```text
Safety Stock Raw = Z-score x Demand Variability per Day x SQRT(Adjusted Lead Time Days)
```

เงื่อนไขในโค้ด:

```text
ถ้า Adjusted Lead Time Days <= 0 ให้ Safety Stock = 0
```

### 6.2 Safety Stock ที่ใช้จริง

ใน orchestrator ระบบปัดขึ้นเป็นจำนวนเต็ม เพราะพัสดุใช้งานจริงไม่ควรเป็นเศษ

```text
Safety Stock = CEIL(Safety Stock Raw)
```

ตัวอย่าง:

```text
Z = 1.65
Demand Variability per Day = 2.4
Adjusted Lead Time = 30

Safety Stock Raw = 1.65 x 2.4 x SQRT(30)
                 ≈ 21.69

Safety Stock = CEIL(21.69) = 22 หน่วย
```

## 7. สูตร Demand During Lead Time

ปริมาณที่คาดว่าจะถูกใช้ระหว่างรอ supplier ส่งของ

```text
Demand During Lead Time = Average Daily Demand x Adjusted Lead Time Days
```

ตัวอย่าง:

```text
3.33 หน่วย/วัน x 30 วัน = 99.9 หน่วย
```

ค่านี้ยังไม่ปัดทันที แต่จะถูกรวมกับ Safety Stock ใน Reorder Point

## 8. สูตร Reorder Point

จุดที่ถ้าสต็อกลดลงมาถึงระดับนี้ ควรเริ่มเติมของหรือเริ่มกระบวนการจัดซื้อ

### 8.1 Reorder Point ดิบ

```text
Reorder Point Raw = Demand During Lead Time + Safety Stock
```

### 8.2 Reorder Point ที่ใช้จริง

```text
Reorder Point = CEIL(Reorder Point Raw)
```

ตัวอย่าง:

```text
Demand During Lead Time = 99.9
Safety Stock = 22

Reorder Point Raw = 99.9 + 22 = 121.9
Reorder Point = CEIL(121.9) = 122 หน่วย
```

## 9. สูตรสถานะสต็อก

ใช้จัด label ของ SKU ว่า Critical, Near Reorder Point หรือ Normal

```text
ถ้า Current Stock <= Safety Stock
  Status = Critical

ถ้า Current Stock <= Reorder Point
  Status = Near Reorder Point

นอกนั้น
  Status = Normal
```

ความหมาย:

- `Critical` = ต่ำกว่าระดับสำรองปลอดภัยแล้ว เสี่ยงขาดจริง
- `Near Reorder Point` = ถึงจุดที่ควรวางแผนเติมของ
- `Normal` = ยังมี buffer เพียงพอ

## 10. สูตร Target Stock Level

ระบบเลือกได้ 2 วิธี

### 10.1 ใช้ Policy Override

ถ้า inventory record มี `targetStockLevelOverride` และค่า >= 0:

```text
Target Stock Level = Target Stock Level Override
Target Stock Level Source = PolicyOverride
```

ใช้กับกรณีองค์กรมี Min-Max policy หรือค่ามาตรฐานกลางที่กำหนดไว้แล้ว

### 10.2 ใช้ Forecast + Safety Stock

ถ้าไม่มี policy override:

```text
Target Stock Level = Forecast Demand for Planning Period + Safety Stock
Target Stock Level Source = ForecastPlusSafetyStock
```

## 11. สูตรปัดตาม MOQ

### 11.1 Round Up to MOQ

```text
ถ้า Quantity <= 0
  Result = 0

ถ้า MOQ <= 0
  Result = CEIL(Quantity)

ถ้า MOQ > 0
  Result = CEIL(Quantity / MOQ) x MOQ
```

ตัวอย่าง:

```text
Quantity = 13
MOQ = 10

Result = CEIL(13 / 10) x 10
       = 2 x 10
       = 20 หน่วย
```

## 12. สูตร Suggested Quantity

จำนวนที่ระบบแนะนำให้ซื้อ

### 12.1 Raw Suggested Quantity

```text
Raw Suggested Quantity = Target Stock Level - Current Stock
```

### 12.2 Suggested Quantity ที่ใช้จริง

```text
ถ้า Raw Suggested Quantity <= 0
  Suggested Quantity = 0

ถ้า Raw Suggested Quantity > 0
  Suggested Quantity = Round Up to MOQ(Raw Suggested Quantity, MOQ)
```

ตัวอย่าง:

```text
Target Stock Level = 70
Current Stock = 60
MOQ = 10

Raw Suggested Quantity = 70 - 60 = 10
Suggested Quantity = 10 หน่วย
```

## 13. สูตรมูลค่าประมาณการ

ใช้ทั้งกับจำนวนที่ระบบแนะนำและจำนวนที่ผู้ใช้ขอจริง

```text
Estimated Cost = Quantity x Unit Price
```

กรณีคำขอซื้อ:

```text
Estimated Cost for Requested Quantity = Requested Quantity x Unit Price
```

ตัวอย่าง:

```text
20 หน่วย x 2,000 บาท = 40,000 บาท
```

## 14. สูตร Variance ระหว่าง AI Suggest กับคำขอจริง

ใช้ดูว่าผู้ใช้ขอซื้อเท่ากับ AI แนะนำหรือไม่ ถ้าไม่เท่ากันต้องใส่เหตุผล override

### 14.1 Quantity Variance

```text
Variance = Requested Quantity - Suggested Quantity
```

### 14.2 Variance Percent

```text
ถ้า Suggested Quantity = 0 และ Requested Quantity > 0
  Variance Percent = 100

ถ้า Suggested Quantity = 0 และ Requested Quantity = 0
  Variance Percent = 0

ถ้า Suggested Quantity > 0
  Variance Percent = (Variance / Suggested Quantity) x 100
```

### 14.3 Override Flags

```text
Is Override = Variance != 0
Is Over Request = Variance > 0
Is Under Request = Variance < 0
```

ตัวอย่าง:

```text
Suggested Quantity = 10
Requested Quantity = 20

Variance = 20 - 10 = 10
Variance Percent = 10 / 10 x 100 = 100%
Is Override = true
Is Over Request = true
```

## 15. สูตร High Variance

ในหน้า Create Purchase Request ระบบใช้ threshold จาก formula policy

ค่าเริ่มต้น:

```text
High Variance Threshold = 50%
```

กติกา:

```text
High Variance = ABS(Variance Percent) >= High Variance Threshold
```

ใช้เพื่อเน้นว่าคำขอซื้อเบี่ยงจาก AI Suggest มากเป็นพิเศษ

## 16. สูตร Budget Routing

ระบบ route คำขอซื้อไปยังชั้นอนุมัติ Local / Regional / Central จากมูลค่าคำขอซื้อจริง

ตัวแปร:

```text
Estimated Cost = Requested Quantity x Unit Price
Local Budget Remaining
Regional Budget Remaining
Central Budget Remaining
```

### 16.1 Budget Enough Flags

```text
Local Enough = Estimated Cost <= Local Budget Remaining
Regional Enough = Estimated Cost <= Regional Budget Remaining
Central Enough = Estimated Cost <= Central Budget Remaining
```

### 16.2 Approval Layer

```text
ถ้า Local Enough = true
  Approval Layer = Local

ถ้า Local Enough = false และ Regional Enough = true
  Approval Layer = Regional

ถ้า Local Enough = false และ Regional Enough = false
  Approval Layer = Central
```

ตัวอย่าง:

```text
Estimated Cost = 40,000
Local Remaining = 25,000
Regional Remaining = 300,000

Local Enough = false
Regional Enough = true
Approval Layer = Regional
```

## 17. สูตร Purchase Request Preview

เมื่อผู้ใช้กรอกจำนวนที่ต้องการซื้อ ระบบคำนวณ preview ทั้งหมดดังนี้

```text
Variance = calculateQuantityVariance(Suggested Quantity, Requested Quantity)

Estimated Cost for Requested Quantity = Requested Quantity x Unit Price

Approval Routing = determineApprovalLayer(Estimated Cost for Requested Quantity, Budget Context)

Requires Override Reason = Variance Is Override
```

ดังนั้นคำขอซื้อ 1 ใบจะมีทั้ง:

- จำนวนที่ AI แนะนำ
- จำนวนที่ผู้ใช้ขอจริง
- ส่วนต่างและเปอร์เซ็นต์ส่วนต่าง
- มูลค่าคำขอซื้อ
- ชั้นอนุมัติที่ควรไป
- flag ว่าต้องใส่เหตุผล override หรือไม่

## 18. สูตร Calculation Snapshot

เมื่อสร้างคำขอซื้อ ระบบเก็บ snapshot ของค่าคำนวณ ณ เวลานั้น ไม่ recalculate ย้อนหลัง

ค่าที่ควรถูก lock ไว้ใน snapshot:

```text
Formula Version
Historical Usage Total
Historical Usage Days
Average Daily Demand
Demand Variability per Period
Demand Variability per Day
Supplier Lead Time Days
Seasonal Factor
Budget Factor
Adjusted Lead Time Days
Service Level
Z-score
Safety Stock
Demand During Lead Time
Reorder Point
Forecast Demand for Planning Period
Planning Period Days
Target Stock Level
Target Stock Level Source
MOQ
Suggested Quantity
Requested Quantity
Unit Price
Estimated Cost for Requested Quantity
Budget Context at Request Date
Approval Routing
Variance
Variance Percent
Override Reason
```

เหตุผล: ถ้าราคา, lead time, budget, policy หรือสูตรเปลี่ยนในอนาคต auditor ยังเห็นได้ว่าตอนอนุมัติใช้ข้อมูลชุดไหน

## 19. สูตร Dead Stock และ Procurement Audit

อ้างอิงจาก `src/utils/procurementAnalysis.ts`

### 19.1 Dead Stock Value

```text
Dead Stock Value = Dead Stock Quantity x Unit Cost
```

### 19.2 Total Dead Stock Value

```text
Total Dead Stock Value = SUM(Dead Stock Value ของทุกรายการ)
```

### 19.3 Budget Request Amount

```text
Budget Request Amount = Requested Quantity x Unit Cost
```

### 19.4 Peer Average Amount

ใช้เปรียบเทียบคำของบของคลังหนึ่งกับคลังอื่นใน category และปีงบเดียวกัน

```text
Peers = Budget Requests ที่มี Category เดียวกัน
        และ Fiscal Year เดียวกัน
        และ Warehouse ID ไม่ใช่คลังปัจจุบัน

Peer Average Amount = SUM(Budget Request Amount ของ Peers) / จำนวน Peers
```

ถ้าไม่มี peer:

```text
Peer Average Amount = 0
```

### 19.5 Repeat-buy Flag

ตรวจว่าขอซื้อทั้งที่มีของจม SKU เดียวกันหรือไม่

```text
ถ้ามี Dead Stock ที่ skuId เดียวกัน และ warehouseId เดียวกัน
  Flag = repeat-buy

ถ้าไม่มีในคลังเดียวกัน แต่มี Dead Stock ที่ skuId เดียวกัน และ regionLabel เดียวกัน
  Flag = repeat-buy
```

ความหมาย:

- คลังเดียวกันมีของจมแล้วยังของบซื้อเพิ่ม = ชัดที่สุด
- เขตเดียวกันมีของจม = ควรพิจารณาโอนก่อนซื้อใหม่

### 19.6 Spend-to-keep Flag

เกณฑ์ threshold:

```text
Spend to Keep Usage Ratio Threshold = 0.95
```

คำนวณ:

```text
Usage Ratio = Budget Used / Budget Allocated

Dead Stock Rising = Dead Stock Value ปีล่าสุด > Dead Stock Value ปีแรกที่มีข้อมูล
```

กติกา:

```text
ถ้า Usage Ratio >= 0.95 และ Dead Stock Rising = true
  Flag = spend-to-keep
```

ความหมาย: ใช้งบเกือบหมดทุกปี แต่ของจมเพิ่มขึ้น อาจเป็น pattern ใช้งบเพื่อรักษางบมากกว่าตาม demand จริง

### 19.7 Over-peer Flag

เกณฑ์ threshold:

```text
Over Peer Ratio Threshold = 1.5
```

กติกา:

```text
ถ้า Peer Average Amount > 0
และ Budget Request Amount >= Peer Average Amount x 1.5
  Flag = over-peer
```

ความหมาย: ขอวงเงินใน category เดียวกันสูงกว่าคลังอื่นอย่างมีนัยสำคัญ

### 19.8 จำนวน Gotcha Case

```text
Gotcha Case Count = COUNT(Budget Requests ที่ flags.length > 0)
```

### 19.9 Warehouse Budget Used Percent

```text
Budget Used Percent = (Budget Used / Budget Allocated) x 100
```

ถ้า Budget Allocated <= 0:

```text
Budget Used Percent = 0
```

### 19.10 Dead Stock Trend Percent

```text
Dead Stock Trend Percent =
  ((Dead Stock Value Latest - Dead Stock Value First) / Dead Stock Value First) x 100
```

ถ้า Dead Stock Value First <= 0:

```text
Dead Stock Trend Percent = 0
```

## 20. สูตร Stock Holding Status รายคลัง

ใช้ในภาพรวมว่า SKU เดียวกันอยู่ที่คลังไหนบ้าง และคลังไหน short/dead/balanced

ตัวแปร:

```text
Stock Cover Periods = จำนวน period ที่สต็อกปัจจุบันพอครอบคลุม demand
Dead Stock Listing = รายการของจมที่ seed ระบุไว้
```

กติกา:

```text
ถ้ามี Dead Stock Listing ของ SKU/คลังนั้น
  Status = dead

ถ้าไม่มี Dead Stock Listing แต่ Stock Cover Periods >= 1.5
  Status = dead

ถ้า Stock Cover Periods < 1
  Status = short

นอกนั้น
  Status = balanced
```

มูลค่าของจมรายคลัง:

```text
Dead Value = Dead Stock Quantity x Unit Cost
```

การเรียงผลลัพธ์:

```text
เรียงจาก Dead Value มากไปน้อย
ถ้า Dead Value เท่ากัน เรียงจาก Stock Quantity มากไปน้อย
```

## 21. สูตร Transfer / Borrow Savings

ในหน้า Create Purchase Request ถ้าพบของจม SKU เดียวกันที่คลังอื่น ระบบประเมินเงินที่อาจประหยัดได้จากการยืม/โอนก่อนซื้อใหม่

```text
Borrow Savings = MIN(Requested Quantity, Dead Stock Quantity Elsewhere) x Unit Price
```

ตัวอย่าง:

```text
Requested Quantity = 20
Dead Stock Elsewhere = 12
Unit Price = 2,000

Borrow Savings = MIN(20, 12) x 2,000
               = 12 x 2,000
               = 24,000 บาท
```

## 22. สูตร VMI Simulation

อ้างอิงจาก `calculateVmiSafetyStock`, `calculateVmiReorderPoint`, `calculateInventoryValue`, `calculateImpact`

### 22.1 VMI Safety Stock

```text
VMI Safety Stock = CEIL(Z-score x Demand Variability per Day x SQRT(VMI Lead Time Days))
```

เงื่อนไข:

```text
ถ้า VMI Lead Time Days <= 0 ให้ VMI Safety Stock = 0
```

### 22.2 VMI Reorder Point

```text
VMI Reorder Point = CEIL(Average Daily Demand x VMI Lead Time Days + VMI Safety Stock)
```

### 22.3 Inventory Value

```text
Inventory Value = Quantity x Unit Price
```

### 22.4 Impact Difference

```text
Difference = New Value - Current Value
```

ถ้าค่าเป็นลบ แปลว่าลดลง เช่น lead time ลดลง หรือมูลค่าสต็อกลดลง

### 22.5 Impact Percent

```text
ถ้า Current Value = 0
  Percent = 0

ถ้า Current Value > 0
  Percent = (Difference / Current Value) x 100
```

ตัวอย่าง:

```text
Current Inventory Value = 240,000
VMI Inventory Value = 180,000

Difference = 180,000 - 240,000 = -60,000
Percent = -60,000 / 240,000 x 100 = -25%
```

### 22.6 VMI Suitability Score

คะแนนความเหมาะสมในการทดลอง VMI

```text
Raw Score =
  Demand Stability Score
  + Supplier Reliability Score
  + Usage Frequency Score
  + Lead Time Stability Score
  + Inventory Value Impact Score
  - Procurement Complexity Penalty
```

จากนั้นปัดและ clamp ให้อยู่ในช่วง 0-100

```text
VMI Suitability Score = MIN(100, MAX(0, ROUND(Raw Score)))
```

### 22.7 VMI Recommendation Label

```text
Score >= 80  -> เหมาะมากกับการทดลอง VMI
Score >= 60  -> สามารถทดลอง VMI ได้
Score >= 40  -> ควรศึกษาเพิ่มเติมก่อนใช้ VMI
Score < 40   -> ยังไม่เหมาะกับ VMI
```

## 23. สูตร AI Feedback Loop

อ้างอิงจาก `src/App.tsx`

### 23.1 AI Suggestion Error

ใช้เทียบจำนวนที่ AI แนะนำกับจำนวนจริงที่เกิดขึ้นหรือที่ผู้ใช้บันทึก feedback

```text
Error Quantity = Actual Quantity - AI Suggested Quantity
```

### 23.2 AI Suggestion Error Percent

```text
ถ้า AI Suggested Quantity = 0 และ Actual Quantity > 0
  Error Percent = 100

ถ้า AI Suggested Quantity = 0 และ Actual Quantity = 0
  Error Percent = 0

ถ้า AI Suggested Quantity > 0
  Error Percent = (Error Quantity / AI Suggested Quantity) x 100
```

ความหมาย:

- `Error Percent > 0` = AI แนะนำน้อยกว่าค่าจริง ควร conservative ขึ้น
- `Error Percent < 0` = AI แนะนำมากกว่าค่าจริง อาจลด buffer ได้

### 23.3 Mean Absolute Error Percent

```text
Mean Absolute Error Percent =
  SUM(ABS(Error Percent ของทุก feedback log)) / จำนวน feedback log
```

ถ้าไม่มี feedback:

```text
Mean Absolute Error Percent = 0
```

### 23.4 Average Bias Percent

```text
Average Bias Percent =
  SUM(Error Percent ของทุก feedback log) / จำนวน feedback log
```

ถ้าไม่มี feedback:

```text
Average Bias Percent = 0
```

ความหมาย:

- ค่าเป็นบวก = ระบบมีแนวโน้มแนะนำน้อยไป
- ค่าเป็นลบ = ระบบมีแนวโน้มแนะนำมากไป

### 23.5 Auto-tuned Policy Direction

```text
ถ้า Error Percent > 0
  Direction = +1

ถ้า Error Percent <= 0
  Direction = -1
```

### 23.6 Auto-tuned Service Level

```text
New Service Level =
  ROUND_TO(
    CLAMP(Base Service Level + Direction x 0.005, 0.8, 0.995),
    3 decimals
  )
```

### 23.7 Auto-tuned Seasonal Factor

```text
New Seasonal Factor =
  ROUND_TO(
    CLAMP(Base Seasonal Factor + Direction x 0.02, 0.8, 1.8),
    2 decimals
  )
```

### 23.8 Auto-tuned Z-score

```text
New Z-score = calculateZScoreFromServiceLevel(New Service Level)
```

### 23.9 Formula Version

เมื่อ policy เปลี่ยน ระบบเพิ่ม formula version ใหม่

Policy ที่ถือว่าเปลี่ยน:

```text
Service Level
Seasonal Factor
Budget Factor
High Variance Threshold
```

กติกา version:

```text
ถ้า version เดิมมีตัวเลข เช่น v1.0
  เพิ่มเลขชุดสุดท้ายขึ้น 1 โดยรักษา padding เดิม

ถ้า version เดิมไม่มีตัวเลข
  เติม suffix "-next"
```

ตัวอย่าง:

```text
v1.0 -> v1.1
formula-009 -> formula-010
policy -> policy-next
```

## 24. สูตร Default Formula Policy

ค่าเริ่มต้นของสูตรใน prototype:

```text
Formula Version = v1.0
Service Level = 0.95
Z-score = calculateZScoreFromServiceLevel(0.95) = 1.65
Seasonal Factor = 1.2
Budget Factor = 1
High Variance Threshold = 50
```

## 25. ลำดับการคำนวณหลักแบบ End-to-End

เมื่อต้องอธิบายกรรมการ ให้เล่าเป็น chain นี้:

```text
1. Historical Usage Total
   = SUM(quantity)

2. Historical Usage Days
   = SUM(days)

3. Average Daily Demand
   = Historical Usage Total / Historical Usage Days

4. Demand Variability per Period
   = Standard Deviation(quantity)

5. Demand Variability per Day
   = Demand Variability per Period / SQRT(Average Days per Period)

6. Adjusted Lead Time
   = Supplier Lead Time x Seasonal Factor x Budget Factor

7. Safety Stock
   = CEIL(Z-score x Demand Variability per Day x SQRT(Adjusted Lead Time))

8. Demand During Lead Time
   = Average Daily Demand x Adjusted Lead Time

9. Reorder Point
   = CEIL(Demand During Lead Time + Safety Stock)

10. Target Stock Level
    = Policy Override
    หรือ Forecast Demand for Planning Period + Safety Stock

11. Raw Suggested Quantity
    = Target Stock Level - Current Stock

12. Suggested Quantity
    = Round Up to MOQ(Raw Suggested Quantity)

13. Estimated Cost
    = Requested Quantity x Unit Price

14. Approval Layer
    = Local / Regional / Central ตามงบคงเหลือ

15. Calculation Snapshot
    = เก็บทุกค่าข้างบน ณ วันที่สร้างคำขอซื้อ
```

## 26. ประโยคอธิบายสั้นสำหรับ Pitch

ถ้าต้องพูดบนเวทีแบบเข้าใจง่าย:

> ระบบไม่ได้บอกแค่ว่าควรซื้อกี่ชิ้น แต่เริ่มจากการดู usage ย้อนหลัง คำนวณค่าเฉลี่ยต่อวัน วัดความผันผวน ปรับ lead time ด้วยฤดูกาลและรอบงบ แล้วคำนวณ Safety Stock กับ Reorder Point จากนั้นจึงหาจำนวนที่ควรเติมให้ถึงระดับเป้าหมายและปัดตาม MOQ ของ supplier ก่อนตรวจงบ Local/Regional/Central และเก็บ Calculation Snapshot เพื่อ audit ทุกขั้น

