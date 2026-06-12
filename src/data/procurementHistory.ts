// ประวัติการของบ/สั่งซื้อย้อนหลัง + รายการ Dead Stock สำหรับฟีเจอร์ "ตรวจซื้อซ้ำ-ของจม"
//
// หมายเหตุ source of truth:
// - ใน production ข้อมูลพวกนี้ควร derive จาก movement transaction + งบจัดสรรจริงราย เขต/คลัง/ปีงบ
// - ใน PoC ใช้เป็น seed data ตั้งต้น (ตาม DATA_POLICY: seed = ค่าเริ่มต้น) เพื่อสาธิต pattern
//   "ของบเท่าเดิมเพื่อซื้อซ้ำทั้งที่ของยังจม" ให้ PO เห็นภาพ
// - ค่า "ตัวเลขสรุป" เช่น มูลค่าของจม, % ใช้งบ, flag ต่าง ๆ ต้องคำนวณจาก record ด้านล่าง
//   ไม่ hardcode ผลลัพธ์ (ดู src/utils/procurementAnalysis.ts)

export type FiscalYear = "2567" | "2568" | "2569";

export const fiscalYears: FiscalYear[] = ["2567", "2568", "2569"];

// 1 รายการ = การของบเพื่อสั่งซื้อ SKU หนึ่งของคลังหนึ่งในปีงบหนึ่ง
export type BudgetRequestRecord = {
  id: string;
  fiscalYear: FiscalYear;
  warehouseId: string;
  regionLabel: string;
  skuId: string; // ใช้รหัส demo สั้น เช่น P01 เพื่อให้เปิดหน้า SKU เดิมได้
  skuName: string;
  category: string;
  unit: string;
  requestedQty: number;
  unitCost: number; // ราคาต่อหน่วยที่ใช้ตั้งงบปีนั้น (amount = requestedQty × unitCost)
  note?: string;
};

// งบจัดสรร + ผลใช้งบรายปีของแต่ละคลัง (ใช้ดู pattern เร่งใช้งบให้หมด + trend ของจม)
export type WarehouseBudgetYear = {
  fiscalYear: FiscalYear;
  warehouseId: string;
  regionLabel: string;
  budgetAllocated: number; // งบที่ได้รับจัดสรรปีนั้น
  budgetUsed: number; // งบที่เบิกใช้จริงปีนั้น
  deadStockValueEndOfYear: number; // มูลค่าของจมสะสม ณ ปลายปีงบ (สำหรับ trend)
};

// รายการของจมปัจจุบัน (ของที่ไม่เคลื่อนไหว/เคลื่อนไหวช้ามาก พร้อมจับคู่คลังที่ขาด)
export type DeadStockListing = {
  id: string;
  skuId: string;
  skuName: string;
  category: string;
  warehouseId: string;
  regionLabel: string;
  qty: number;
  unit: string;
  unitCost: number; // value = qty × unitCost
  monthsIdle: number; // ไม่มีการเบิกจ่ายมากี่เดือน
  lastMovement: string; // เดือนเคลื่อนไหวล่าสุด เช่น "ส.ค. 68"
  matchWarehouseId?: string; // คลังที่ขาด SKU เดียวกัน → ยืม/แลกได้
  matchShortageQty?: number; // จำนวนที่คลังปลายทางขาด (ต่ำกว่า ROP)
};

// ───────────────────────────────────────────────────────────────────────────
// Seed: ของบรายปี รายคลัง × SKU (3 ปีงบ)
// เคส hero: K030 ของบซื้อเสาไฟ (P01) ทุกปีในระดับเท่าเดิม ทั้งที่ของยังจมและพอกขึ้น
// ───────────────────────────────────────────────────────────────────────────
export const budgetRequestHistory: BudgetRequestRecord[] = [
  // เขต K — คลัง K030 (เคสซื้อซ้ำเสาไฟทั้งที่ของจม)
  { id: "BR-K030-67-P01", fiscalYear: "2567", warehouseId: "K030", regionLabel: "เขต K", skuId: "1CC0CP0012", skuName: "เสาคอนกรีตอัดแรง 12 เมตร", category: "เสาไฟ", unit: "ต้น", requestedQty: 400, unitCost: 4_500, note: "ตั้งงบประจำปีตามค่าเฉลี่ยเดิม" },
  { id: "BR-K030-68-P01", fiscalYear: "2568", warehouseId: "K030", regionLabel: "เขต K", skuId: "1CC0CP0012", skuName: "เสาคอนกรีตอัดแรง 12 เมตร", category: "เสาไฟ", unit: "ต้น", requestedQty: 380, unitCost: 4_500, note: "ของเดิมยังเหลือ แต่ตั้งงบใกล้เคียงเดิม" },
  { id: "BR-K030-69-P01", fiscalYear: "2569", warehouseId: "K030", regionLabel: "เขต K", skuId: "1CC0CP0012", skuName: "เสาคอนกรีตอัดแรง 12 เมตร", category: "เสาไฟ", unit: "ต้น", requestedQty: 400, unitCost: 4_500, note: "ของบเท่าเดิมเพื่อสั่งเสาไฟอีกรอบ" },
  { id: "BR-K030-67-C01", fiscalYear: "2567", warehouseId: "K030", regionLabel: "เขต K", skuId: "1CC0CG0002", skuName: "สายเคเบิลใต้ดิน XLPE 240", category: "สายไฟ", unit: "เมตร", requestedQty: 300, unitCost: 2_000 },
  { id: "BR-K030-68-C01", fiscalYear: "2568", warehouseId: "K030", regionLabel: "เขต K", skuId: "1CC0CG0002", skuName: "สายเคเบิลใต้ดิน XLPE 240", category: "สายไฟ", unit: "เมตร", requestedQty: 350, unitCost: 2_000 },
  { id: "BR-K030-69-B05", fiscalYear: "2569", warehouseId: "K030", regionLabel: "เขต K", skuId: "1CC0BK0050", skuName: "เบรกเกอร์ 3P 50A", category: "เบรกเกอร์", unit: "pcs", requestedQty: 250, unitCost: 1_800, note: "ปิดงบปลายปีให้ใช้หมด" },

  // เขต K — คลัง K010 (คลังที่บริหารงบสมเหตุผลกว่า ใช้เทียบ peer)
  { id: "BR-K010-67-P01", fiscalYear: "2567", warehouseId: "K010", regionLabel: "เขต K", skuId: "1CC0CP0012", skuName: "เสาคอนกรีตอัดแรง 12 เมตร", category: "เสาไฟ", unit: "ต้น", requestedQty: 180, unitCost: 4_500 },
  { id: "BR-K010-68-P01", fiscalYear: "2568", warehouseId: "K010", regionLabel: "เขต K", skuId: "1CC0CP0012", skuName: "เสาคอนกรีตอัดแรง 12 เมตร", category: "เสาไฟ", unit: "ต้น", requestedQty: 150, unitCost: 4_500 },
  { id: "BR-K010-69-P01", fiscalYear: "2569", warehouseId: "K010", regionLabel: "เขต K", skuId: "1CC0CP0012", skuName: "เสาคอนกรีตอัดแรง 12 เมตร", category: "เสาไฟ", unit: "ต้น", requestedQty: 200, unitCost: 4_500, note: "เพิ่มตาม demand จริงที่โต" },
  { id: "BR-K010-69-C01", fiscalYear: "2569", warehouseId: "K010", regionLabel: "เขต K", skuId: "1CC0CG0002", skuName: "สายเคเบิลใต้ดิน XLPE 240", category: "สายไฟ", unit: "เมตร", requestedQty: 400, unitCost: 2_000 },

  // เขต I — คลัง I010, I020
  { id: "BR-I010-68-C01", fiscalYear: "2568", warehouseId: "I010", regionLabel: "เขต I", skuId: "1CC0CG0002", skuName: "สายเคเบิลใต้ดิน XLPE 240", category: "สายไฟ", unit: "เมตร", requestedQty: 500, unitCost: 2_000 },
  { id: "BR-I010-69-C01", fiscalYear: "2569", warehouseId: "I010", regionLabel: "เขต I", skuId: "1CC0CG0002", skuName: "สายเคเบิลใต้ดิน XLPE 240", category: "สายไฟ", unit: "เมตร", requestedQty: 550, unitCost: 2_000 },
  { id: "BR-I020-68-T01", fiscalYear: "2568", warehouseId: "I020", regionLabel: "เขต I", skuId: "1DD0DC0000", skuName: "หม้อแปลงจำหน่าย 3 เฟส 100 kVA", category: "หม้อแปลง", unit: "ลูก", requestedQty: 8, unitCost: 165_000 },
  { id: "BR-I020-69-T01", fiscalYear: "2569", warehouseId: "I020", regionLabel: "เขต I", skuId: "1DD0DC0000", skuName: "หม้อแปลงจำหน่าย 3 เฟส 100 kVA", category: "หม้อแปลง", unit: "ลูก", requestedQty: 12, unitCost: 165_000, note: "เผื่อโครงการขยายเขต" },
];

// ───────────────────────────────────────────────────────────────────────────
// Seed: งบจัดสรร + ผลใช้งบ + มูลค่าของจมปลายปี รายคลัง × ปีงบ
// ───────────────────────────────────────────────────────────────────────────
export const warehouseBudgetByYear: WarehouseBudgetYear[] = [
  // K030 — ใช้งบเกือบเต็มทุกปี และของจมพอกขึ้นเรื่อย ๆ (spend-to-keep)
  { fiscalYear: "2567", warehouseId: "K030", regionLabel: "เขต K", budgetAllocated: 2_000_000, budgetUsed: 1_980_000, deadStockValueEndOfYear: 600_000 },
  { fiscalYear: "2568", warehouseId: "K030", regionLabel: "เขต K", budgetAllocated: 2_000_000, budgetUsed: 1_988_000, deadStockValueEndOfYear: 1_200_000 },
  { fiscalYear: "2569", warehouseId: "K030", regionLabel: "เขต K", budgetAllocated: 2_000_000, budgetUsed: 1_975_000, deadStockValueEndOfYear: 2_040_000 },
  // K010 — ใช้งบตาม demand จริง ของจมต่ำและทรงตัว
  { fiscalYear: "2567", warehouseId: "K010", regionLabel: "เขต K", budgetAllocated: 1_500_000, budgetUsed: 980_000, deadStockValueEndOfYear: 120_000 },
  { fiscalYear: "2568", warehouseId: "K010", regionLabel: "เขต K", budgetAllocated: 1_400_000, budgetUsed: 910_000, deadStockValueEndOfYear: 95_000 },
  { fiscalYear: "2569", warehouseId: "K010", regionLabel: "เขต K", budgetAllocated: 1_450_000, budgetUsed: 1_020_000, deadStockValueEndOfYear: 130_000 },
  // I010
  { fiscalYear: "2568", warehouseId: "I010", regionLabel: "เขต I", budgetAllocated: 1_800_000, budgetUsed: 1_450_000, deadStockValueEndOfYear: 210_000 },
  { fiscalYear: "2569", warehouseId: "I010", regionLabel: "เขต I", budgetAllocated: 1_800_000, budgetUsed: 1_520_000, deadStockValueEndOfYear: 180_000 },
  // I020
  { fiscalYear: "2568", warehouseId: "I020", regionLabel: "เขต I", budgetAllocated: 2_200_000, budgetUsed: 1_330_000, deadStockValueEndOfYear: 380_000 },
  { fiscalYear: "2569", warehouseId: "I020", regionLabel: "เขต I", budgetAllocated: 2_400_000, budgetUsed: 1_800_000, deadStockValueEndOfYear: 450_000 },
];

// ───────────────────────────────────────────────────────────────────────────
// Seed: รายการของจมปัจจุบัน + การจับคู่คลังที่ขาด (สำหรับ Dead Stock Exchange)
// ───────────────────────────────────────────────────────────────────────────
export const deadStockListings: DeadStockListing[] = [
  {
    id: "DS-K030-P01",
    skuId: "1CC0CP0012",
    skuName: "เสาคอนกรีตอัดแรง 12 เมตร",
    category: "เสาไฟ",
    warehouseId: "K030",
    regionLabel: "เขต K",
    qty: 320,
    unit: "ต้น",
    unitCost: 4_500,
    monthsIdle: 9,
    lastMovement: "ก.ย. 68",
    matchWarehouseId: "K010",
    matchShortageQty: 60,
  },
  {
    id: "DS-K030-C01",
    skuId: "1CC0CG0002",
    skuName: "สายเคเบิลใต้ดิน XLPE 240",
    category: "สายไฟ",
    warehouseId: "K030",
    regionLabel: "เขต K",
    qty: 300,
    unit: "เมตร",
    unitCost: 2_000,
    monthsIdle: 6,
    lastMovement: "ธ.ค. 68",
    matchWarehouseId: "I010",
    matchShortageQty: 120,
  },
  {
    id: "DS-K020-B05",
    skuId: "1CC0BK0050",
    skuName: "เบรกเกอร์ 3P 50A",
    category: "เบรกเกอร์",
    warehouseId: "K020",
    regionLabel: "เขต K",
    qty: 1_150,
    unit: "pcs",
    unitCost: 1_800,
    monthsIdle: 11,
    lastMovement: "ก.ค. 68",
  },
  {
    id: "DS-I020-T01",
    skuId: "1DD0DC0000",
    skuName: "หม้อแปลงจำหน่าย 3 เฟส 100 kVA",
    category: "หม้อแปลง",
    warehouseId: "I020",
    regionLabel: "เขต I",
    qty: 3,
    unit: "ลูก",
    unitCost: 165_000,
    monthsIdle: 8,
    lastMovement: "ต.ค. 68",
    matchWarehouseId: "I010",
    matchShortageQty: 2,
  },
];
