# PEA Inventory Planning Database Setup

เอกสารนี้ใช้เป็นแนวทางตั้งฐานข้อมูลจริงต่อจาก prototype โดยอ้างอิงไฟล์ `PEA Data Summary.xlsx` เป็น data mart ตั้งต้น และเพิ่ม mock supplier แยกเองเพราะไฟล์ Excel ยังไม่มีข้อมูลผู้ขายจริง

## หลักการตั้งชื่อ

- `WH Id` = Warehouse / คลัง / พื้นที่ที่เกิด demand และประวัติการเบิกจ่าย
- `Factory Id` = Factory / Plant / รหัสคลังหลักหรือโรงงานใน SAP ที่ผูก stock, batch, movement และ lead time
- `Supplier Id` = Vendor / ผู้ขายจริง ใช้กับ contact, price, MOQ และ supplier lead time
- ห้ามใช้ `Factory Id` เป็น `Supplier Id`
- ชีต `Supplier Factory` ใน Excel ต้องนำเข้าเป็น `factory_master`

## Source Sheets

| Excel sheet | ใช้เป็นข้อมูล |
| --- | --- |
| `SKU Data` | SKU master, stock total, avg usage เดิม |
| `WH` | Warehouse master |
| `WH Season Data Item` | Monthly usage by WH + SKU ต้องแปลง wide เป็น long |
| `Item Season Data` | SKU-level monthly usage summary |
| `Supplier Factory` | Factory / Plant master ไม่ใช่ supplier |
| `BATCH` | Stock by Factory + SKU + Batch |
| `LT Data` | Lead time transaction |
| `LT Analyst` | Aggregated lead time by Factory + SKU |
| `SKU MOvement` | Stock movement by Factory + SKU + Location |
| `Docment Transaction` | Document workload summary |

## PostgreSQL Schema

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Master Data

```sql
CREATE TABLE sku_master (
  sku_id VARCHAR(50) PRIMARY KEY,
  sku_name TEXT,
  category TEXT,
  unit VARCHAR(20),
  criticality_level VARCHAR(20),
  stock_total NUMERIC(18, 3),
  avg_usage_original NUMERIC(18, 3),
  source_file TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warehouse_master (
  warehouse_id VARCHAR(50) PRIMARY KEY,
  warehouse_name TEXT,
  region_code VARCHAR(10),
  warehouse_type VARCHAR(50),
  province TEXT,
  status VARCHAR(20) DEFAULT 'active',
  source_file TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE factory_master (
  factory_id VARCHAR(50) PRIMARY KEY,
  factory_name TEXT,
  region_code VARCHAR(10),
  factory_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  source_file TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warehouse_factory_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_id VARCHAR(50) REFERENCES warehouse_master(warehouse_id),
  factory_id VARCHAR(50) REFERENCES factory_master(factory_id),
  mapping_type VARCHAR(50),
  confidence_level VARCHAR(20),
  remark TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Demand, Stock, Lead Time

```sql
CREATE TABLE monthly_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_id VARCHAR(50) REFERENCES warehouse_master(warehouse_id),
  sku_id VARCHAR(50) REFERENCES sku_master(sku_id),
  usage_year INT,
  usage_month INT,
  usage_qty NUMERIC(18, 3),
  source_sheet TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sku_monthly_usage_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku_id VARCHAR(50) REFERENCES sku_master(sku_id),
  usage_year INT,
  usage_month INT,
  total_usage_qty NUMERIC(18, 3),
  warehouse_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_batch (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factory_id VARCHAR(50) REFERENCES factory_master(factory_id),
  sku_id VARCHAR(50) REFERENCES sku_master(sku_id),
  batch_no VARCHAR(100),
  stock_qty NUMERIC(18, 3),
  unit VARCHAR(20),
  source_sheet TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factory_id VARCHAR(50) REFERENCES factory_master(factory_id),
  sku_id VARCHAR(50) REFERENCES sku_master(sku_id),
  stock_qty NUMERIC(18, 3),
  unit VARCHAR(20),
  last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (factory_id, sku_id)
);

CREATE TABLE lead_time_transaction (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factory_id VARCHAR(50) REFERENCES factory_master(factory_id),
  sku_id VARCHAR(50) REFERENCES sku_master(sku_id),
  request_po_date DATE,
  approve_po_date DATE,
  deposit_receive_date DATE,
  receive_po_item_date DATE,
  document_process_lt_days NUMERIC(10, 2),
  procurement_lt_days NUMERIC(10, 2),
  sum_lt_days NUMERIC(10, 2),
  delay_days NUMERIC(10, 2),
  source_sheet TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lead_time_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factory_id VARCHAR(50) REFERENCES factory_master(factory_id),
  sku_id VARCHAR(50) REFERENCES sku_master(sku_id),
  transaction_count INT,
  avg_document_process_lt_days NUMERIC(10, 2),
  median_document_process_lt_days NUMERIC(10, 2),
  p90_document_process_lt_days NUMERIC(10, 2),
  p95_document_process_lt_days NUMERIC(10, 2),
  avg_procurement_lt_days NUMERIC(10, 2),
  median_procurement_lt_days NUMERIC(10, 2),
  p90_procurement_lt_days NUMERIC(10, 2),
  p95_procurement_lt_days NUMERIC(10, 2),
  avg_sum_lt_days NUMERIC(10, 2),
  median_sum_lt_days NUMERIC(10, 2),
  p90_sum_lt_days NUMERIC(10, 2),
  p95_sum_lt_days NUMERIC(10, 2),
  last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (factory_id, sku_id)
);
```

### Movement and Workload

```sql
CREATE TABLE sku_movement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factory_id VARCHAR(50) REFERENCES factory_master(factory_id),
  sku_id VARCHAR(50) REFERENCES sku_master(sku_id),
  location_code VARCHAR(100),
  movement_type VARCHAR(50),
  movement_qty NUMERIC(18, 3),
  movement_date DATE,
  source_sheet TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_transaction_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_date DATE,
  document_count INT,
  document_item_count INT,
  avg_item_per_document NUMERIC(10, 2),
  source_sheet TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Supplier Data

ข้อมูล supplier ต้อง mock หรือเชื่อม vendor master ภายหลัง เพราะไม่มีใน Excel ชุดนี้

```sql
CREATE TABLE supplier_master (
  supplier_id VARCHAR(50) PRIMARY KEY,
  supplier_name TEXT NOT NULL,
  contact_person TEXT,
  phone VARCHAR(50),
  email TEXT,
  line_id TEXT,
  address TEXT,
  region_supported TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supplier_sku_price (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id VARCHAR(50) REFERENCES supplier_master(supplier_id),
  sku_id VARCHAR(50) REFERENCES sku_master(sku_id),
  unit_price NUMERIC(18, 2),
  currency VARCHAR(10) DEFAULT 'THB',
  unit VARCHAR(20),
  moq NUMERIC(18, 3),
  standard_lead_time_days NUMERIC(10, 2),
  effective_date DATE,
  expiration_date DATE,
  price_source VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (supplier_id, sku_id, effective_date)
);

CREATE TABLE supplier_contact_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id VARCHAR(50) REFERENCES supplier_master(supplier_id),
  sku_id VARCHAR(50) REFERENCES sku_master(sku_id),
  purchase_request_id UUID,
  contact_date TIMESTAMP,
  contact_by TEXT,
  contact_channel VARCHAR(50),
  contact_purpose TEXT,
  contact_result TEXT,
  follow_up_date DATE,
  attachment_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Budget, Request, Approval, Snapshot

```sql
CREATE TABLE budget_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fiscal_year INT,
  budget_layer VARCHAR(20),
  warehouse_id VARCHAR(50),
  region_code VARCHAR(10),
  allocated_budget NUMERIC(18, 2),
  used_budget NUMERIC(18, 2),
  remaining_budget NUMERIC(18, 2),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_request (
  request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_no VARCHAR(50) UNIQUE,
  warehouse_id VARCHAR(50) REFERENCES warehouse_master(warehouse_id),
  factory_id VARCHAR(50) REFERENCES factory_master(factory_id),
  sku_id VARCHAR(50) REFERENCES sku_master(sku_id),
  supplier_id VARCHAR(50) REFERENCES supplier_master(supplier_id),
  requested_quantity NUMERIC(18, 3),
  approved_quantity NUMERIC(18, 3),
  unit VARCHAR(20),
  ai_suggested_quantity NUMERIC(18, 3),
  quantity_variance NUMERIC(18, 3),
  quantity_variance_percent NUMERIC(10, 2),
  unit_price_at_request NUMERIC(18, 2),
  estimated_cost NUMERIC(18, 2),
  urgency_level VARCHAR(20),
  override_reason_category TEXT,
  override_reason_detail TEXT,
  recommended_approval_layer VARCHAR(20),
  current_approval_layer VARCHAR(20),
  status VARCHAR(50),
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approval_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES purchase_request(request_id),
  action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  action_by TEXT,
  action_role VARCHAR(50),
  action_layer VARCHAR(20),
  action_type VARCHAR(50),
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  approved_quantity NUMERIC(18, 3),
  approved_budget NUMERIC(18, 2),
  comment TEXT,
  escalation_reason TEXT
);

CREATE TABLE calculation_snapshot (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES purchase_request(request_id),
  formula_version VARCHAR(20),
  historical_usage_total NUMERIC(18, 3),
  historical_usage_days INT,
  average_daily_demand NUMERIC(18, 6),
  demand_variability_per_day NUMERIC(18, 6),
  supplier_lead_time_days NUMERIC(10, 2),
  document_process_lt_days NUMERIC(10, 2),
  procurement_lt_days NUMERIC(10, 2),
  adjusted_lead_time_days NUMERIC(10, 2),
  seasonal_factor NUMERIC(10, 4),
  budget_factor NUMERIC(10, 4),
  service_level NUMERIC(10, 4),
  z_score NUMERIC(10, 4),
  safety_stock NUMERIC(18, 3),
  demand_during_lead_time NUMERIC(18, 3),
  reorder_point NUMERIC(18, 3),
  forecast_demand NUMERIC(18, 3),
  target_stock_level NUMERIC(18, 3),
  target_stock_level_source VARCHAR(50),
  moq NUMERIC(18, 3),
  ai_suggested_quantity NUMERIC(18, 3),
  requested_quantity NUMERIC(18, 3),
  unit_price NUMERIC(18, 2),
  estimated_cost NUMERIC(18, 2),
  local_budget_remaining NUMERIC(18, 2),
  regional_budget_remaining NUMERIC(18, 2),
  central_budget_remaining NUMERIC(18, 2),
  approval_routing_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### VMI

```sql
CREATE TABLE vmi_candidate (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_id VARCHAR(50) REFERENCES warehouse_master(warehouse_id),
  factory_id VARCHAR(50) REFERENCES factory_master(factory_id),
  sku_id VARCHAR(50) REFERENCES sku_master(sku_id),
  supplier_id VARCHAR(50) REFERENCES supplier_master(supplier_id),
  demand_stability_score NUMERIC(10, 2),
  supplier_reliability_score NUMERIC(10, 2),
  usage_frequency_score NUMERIC(10, 2),
  lead_time_stability_score NUMERIC(10, 2),
  inventory_value_impact_score NUMERIC(10, 2),
  procurement_complexity_penalty NUMERIC(10, 2),
  total_vmi_score NUMERIC(10, 2),
  recommendation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vmi_simulation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warehouse_id VARCHAR(50) REFERENCES warehouse_master(warehouse_id),
  factory_id VARCHAR(50) REFERENCES factory_master(factory_id),
  sku_id VARCHAR(50) REFERENCES sku_master(sku_id),
  supplier_id VARCHAR(50) REFERENCES supplier_master(supplier_id),
  current_safety_stock NUMERIC(18, 3),
  vmi_safety_stock NUMERIC(18, 3),
  safety_stock_impact NUMERIC(18, 3),
  safety_stock_impact_percent NUMERIC(10, 2),
  current_reorder_point NUMERIC(18, 3),
  vmi_reorder_point NUMERIC(18, 3),
  reorder_point_impact NUMERIC(18, 3),
  reorder_point_impact_percent NUMERIC(10, 2),
  current_lead_time_days NUMERIC(10, 2),
  vmi_lead_time_days NUMERIC(10, 2),
  lead_time_impact_days NUMERIC(10, 2),
  lead_time_impact_percent NUMERIC(10, 2),
  current_inventory_value NUMERIC(18, 2),
  vmi_inventory_value NUMERIC(18, 2),
  inventory_value_impact NUMERIC(18, 2),
  inventory_value_impact_percent NUMERIC(10, 2),
  current_manual_orders_per_month NUMERIC(10, 2),
  vmi_manual_orders_per_month NUMERIC(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## ETL Rules

1. ลบ row ที่ `SKU Id`, `WH Id`, หรือ `Factory Id` เป็น blank, `NaN`, `NULL`, หรือ `Grand Total`
2. แปลง `WH Season Data Item` จาก wide format เป็น long format

```text
WH Id | SKU Id | Jan | Feb | ... | Dec
```

เป็น

```text
warehouse_id | sku_id | usage_year | usage_month | usage_qty
```

3. สร้าง `region_code` จากตัวอักษรแรกของ `warehouse_id` หรือ `factory_id`
4. สร้าง mapping แบบ `exact_code_match` เมื่อ `WH Id = Factory Id`
5. หากไม่มี mapping ให้บันทึก `mapping_type = unknown` และห้ามคำนวณเหมือนข้อมูลครบ
6. สร้าง `stock_summary` จาก `SUM(stock_qty) GROUP BY factory_id, sku_id`
7. สร้าง `lead_time_summary` จาก `LT Data` โดยเก็บ average, median, p90, p95
8. Supplier, price, MOQ, contact และ supplier standard lead time ให้ seed จาก mock supplier หรือ vendor master ในอนาคต

## Calculation Data Flow

```text
warehouse_id + sku_id
→ monthly_usage
→ warehouse_factory_mapping
→ factory_id + sku_id
→ stock_summary + lead_time_summary
→ supplier_id + sku_id
→ supplier_sku_price
→ calculation_snapshot ตอน submit purchase request
```

## Data Coverage Flags

ทุกหน้า SKU Detail ควรแสดง coverage เหล่านี้:

- `hasUsageData`: มี demand history จาก `monthly_usage`
- `hasStockData`: มี stock จาก `stock_summary`
- `hasLeadTimeData`: มี lead time จาก `lead_time_summary`
- `hasSupplierData`: มี supplier price/MOQ/contact จาก `supplier_sku_price`
- `hasWarehouseFactoryMapping`: เชื่อม WH กับ Factory ได้

ข้อความ warning มาตรฐาน:

```text
ข้อมูลไม่ครบสำหรับการคำนวณเต็มรูปแบบ
ไม่พบ mapping ระหว่าง WH Id และ Factory Id จึงไม่สามารถเชื่อม demand กับ stock/lead time ได้อย่างสมบูรณ์
ขาดข้อมูลการใช้ย้อนหลัง
ขาดข้อมูล stock ปัจจุบัน
ใช้ default lead time เนื่องจากไม่พบ lead time เฉพาะรายการ
ขาดข้อมูลราคา Supplier
```

## Prototype Seed Recommendation

ใช้กลุ่ม `I/K` เป็น demo หลักเพราะมีโอกาสเชื่อม WH และ Factory ได้มากที่สุด:

- Warehouses / Factories: `I010`, `I020`, `I030`, `I040`, `I050`, `I070`, `K010`, `K020`, `K030`, `K040`, `K050`, `K060`, `K070`, `K080`, `K090`
- SKU examples: `1CC0CG0002`, `1CC0CG0004`, `1CC0CE0004`, `1CC0CE0000`, `1DD0DC0000`, `1CC0CH0501`

## App Integration Notes

- `src/data/peaDataModel.ts` เป็น mock data model ใหม่ที่แยก WH, Factory และ Supplier ชัดเจน
- `src/data/mockData.ts` ยังเก็บ demo flow เดิมไว้เพื่อไม่ให้ PoC แตก แต่มี bridge mapping ไปยัง PEA model ใหม่
- เมื่อทำ backend จริง ให้แทนที่ arrays ใน `peaDataModel.ts` ด้วย API/DB repository layer
- Request History ต้องอ่านจาก `calculation_snapshot` เท่านั้น ไม่คำนวณย้อนหลังจากค่าปัจจุบัน

