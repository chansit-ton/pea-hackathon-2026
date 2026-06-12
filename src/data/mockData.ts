import type {
  BudgetContext,
  InventoryRecord,
  PurchaseRequest,
  PurchaseRequestCalculationSnapshot,
  RegionalBudget,
  Sku,
  Supplier,
  SupplierContactLog,
  SupplierOffer,
  SupplierSkuRecord,
  VmiCandidate,
  VmiComparisonMetric,
  Warehouse,
} from "../types";
import {
  calculateInventoryRecommendation,
  calculatePurchaseRequestPreview,
  calculateVmiSuitabilityScore,
} from "../utils/inventoryCalculations";

export const formulaVersion = "v1.0";

export const warehouses: Warehouse[] = [
  // ใช้รหัส WH Id จากชีต WH ในไฟล์ PEA Data Summary เพื่อให้ demo ตรงกับ source data จริง
  { id: "I010", name: "คลัง I010", region: "North", level: "Local", localBudget: 25_000, capacityUsed: 82 },
  { id: "I020", name: "คลัง I020", region: "North", level: "Local", localBudget: 120_000, capacityUsed: 70 },
  { id: "K010", name: "คลัง K010", region: "Northeast", level: "Local", localBudget: 80_000, capacityUsed: 88 },
  { id: "K020", name: "คลัง K020", region: "East", level: "Local", localBudget: 300_000, capacityUsed: 65 },
  { id: "K030", name: "คลัง K030", region: "South", level: "Local", localBudget: 50_000, capacityUsed: 91 },
];

export const regionalBudgets: RegionalBudget[] = [
  { region: "North", remaining: 300_000 },
  { region: "Northeast", remaining: 450_000 },
  { region: "East", remaining: 600_000 },
  { region: "South", remaining: 250_000 },
];

export const centralBudgetRemaining = 5_000_000;

export const skus: Sku[] = [
  { id: "1CC0CG0002", name: "สายเคเบิลใต้ดิน XLPE 240 ตร.มม. 22kV", category: "สายไฟ/เคเบิล", unit: "เมตร", criticality: "High" },
  { id: "1CC0CG0004", name: "สายอะลูมิเนียมหุ้มฉนวน SAC 50 ตร.มม.", category: "สายไฟ/เคเบิล", unit: "เมตร", criticality: "High" },
  { id: "1DD0DC0000", name: "หม้อแปลงจำหน่าย 3 เฟส 100 kVA 22kV", category: "หม้อแปลง", unit: "เครื่อง", criticality: "Critical" },
  { id: "1CC0CP0012", name: "เสาคอนกรีตอัดแรง 12 เมตร", category: "เสาไฟ", unit: "ต้น", criticality: "High" },
  { id: "1CC0CP0014", name: "เสาคอนกรีตอัดแรง 14 เมตร", category: "เสาไฟ", unit: "ต้น", criticality: "Medium" },
  { id: "1CC0BK0050", name: "เบรกเกอร์ 3 เฟส 50 แอมป์", category: "เบรกเกอร์/สวิตช์", unit: "ชุด", criticality: "Medium" },
  { id: "1CC0CH0501", name: "สายเคเบิลอากาศ SAC 185 ตร.มม. 22kV", category: "สายไฟ/เคเบิล", unit: "เมตร", criticality: "High" },
];

export const suppliers: Supplier[] = [
  {
    id: "S001",
    name: "บริษัท อัลฟ่า อิเล็คทริค จำกัด",
    contactPerson: "คุณสมชาย ใจดี",
    phone: "081-111-1111",
    email: "somchai@alpha.co.th",
    lineId: "alpha_electric",
    coverage: "North",
  },
  {
    id: "S002",
    name: "บริษัท เบต้า เคเบิล จำกัด",
    contactPerson: "คุณวิภา",
    phone: "082-222-2222",
    email: "beta@example.com",
    lineId: "beta_cable",
    coverage: "National",
  },
  {
    id: "S003",
    name: "บริษัท เซ็นทรัล ทรานส์ฟอร์ม จำกัด",
    contactPerson: "คุณนที",
    phone: "083-333-3333",
    email: "central@example.com",
    lineId: "central_transform",
    coverage: "National",
  },
];

export const supplierOffers: SupplierOffer[] = [
  { supplierId: "S001", skuId: "1CC0CG0002", unitPrice: 2_000, currency: "THB", leadTimeDays: 25, moq: 10, unit: "เมตร", reliabilityScore: 96 },
  { supplierId: "S002", skuId: "1CC0CG0002", unitPrice: 2_150, currency: "THB", leadTimeDays: 18, moq: 20, unit: "เมตร", reliabilityScore: 92 },
  { supplierId: "S003", skuId: "1CC0CG0002", unitPrice: 1_950, currency: "THB", leadTimeDays: 40, moq: 30, unit: "เมตร", reliabilityScore: 85 },
  { supplierId: "S002", skuId: "1CC0CG0004", unitPrice: 3_500, currency: "THB", leadTimeDays: 30, moq: 10, unit: "เมตร", reliabilityScore: 92 },
  { supplierId: "S003", skuId: "1DD0DC0000", unitPrice: 165_000, currency: "THB", leadTimeDays: 60, moq: 1, unit: "เครื่อง", reliabilityScore: 85 },
  { supplierId: "S001", skuId: "1CC0CP0012", unitPrice: 4_500, currency: "THB", leadTimeDays: 21, moq: 10, unit: "ต้น", reliabilityScore: 88 },
  { supplierId: "S002", skuId: "1CC0BK0050", unitPrice: 1_800, currency: "THB", leadTimeDays: 20, moq: 5, unit: "ชุด", reliabilityScore: 90 },
  { supplierId: "S003", skuId: "1CC0CH0501", unitPrice: 320, currency: "THB", leadTimeDays: 30, moq: 50, unit: "เมตร", reliabilityScore: 87 },
];

/**
 * inventoryRecords เก็บข้อมูลตั้งต้นที่ใช้คำนวณ
 *
 * หมายเหตุ:
 * ค่าอย่างระดับพัสดุสำรองปลอดภัย, จุดสั่งซื้อใหม่ และจำนวนที่ระบบแนะนำ
 * จะไม่ hardcode ใน mock data แล้ว แต่จะคำนวณจาก historicalUsage,
 * currentStock, supplier lead time, factor และ MOQ ผ่าน inventoryCalculations.ts
 */
export const inventoryRecords: InventoryRecord[] = [
  {
    skuId: "1CC0CG0002",
    warehouseId: "I010",
    currentStock: 60,
    // C01 ใช้ข้อมูลย้อนหลัง 6 เดือน รวม 600 เมตร / 180 วัน
    // เพื่อให้ค่าเฉลี่ยการใช้ต่อวัน = 600 / 180 = 3.33 เมตร/วัน
    historicalUsage: [
      { periodLabel: "Month 1", days: 30, quantity: 80 },
      { periodLabel: "Month 2", days: 30, quantity: 100 },
      { periodLabel: "Month 3", days: 30, quantity: 90 },
      { periodLabel: "Month 4", days: 30, quantity: 120 },
      { periodLabel: "Month 5", days: 30, quantity: 110 },
      { periodLabel: "Month 6", days: 30, quantity: 100 },
    ],
    forecastDemandForPlanningPeriod: 48,
    planningPeriodDays: 30,
    serviceLevel: 0.95,
    zScore: 1.65,
    // Seasonal Factor 1.20 หมายถึงเผื่อความเสี่ยงจากฤดูกาลหรือ demand สูง 20%
    seasonalFactor: 1.2,
    // Budget Factor 1.00 หมายถึงยังไม่เพิ่ม buffer จากข้อจำกัดด้านงบประมาณ
    budgetFactor: 1,
    // PoC ใช้ target policy 70 เมตร เพื่อให้ demo scenario อธิบายง่าย:
    // Target 70 - Current 60 = Suggested Quantity 10 เมตร
    targetStockLevelOverride: 70,
    status: "Critical",
  },
  {
    skuId: "1DD0DC0000",
    warehouseId: "K010",
    currentStock: 1,
    historicalUsage: [
      { periodLabel: "Month 1", days: 30, quantity: 0 },
      { periodLabel: "Month 2", days: 30, quantity: 1 },
      { periodLabel: "Month 3", days: 30, quantity: 2 },
      { periodLabel: "Month 4", days: 30, quantity: 1 },
      { periodLabel: "Month 5", days: 30, quantity: 2 },
      { periodLabel: "Month 6", days: 30, quantity: 3 },
    ],
    forecastDemandForPlanningPeriod: 2,
    planningPeriodDays: 30,
    serviceLevel: 0.95,
    zScore: 1.65,
    seasonalFactor: 1.2,
    budgetFactor: 1,
    targetStockLevelOverride: 3,
    status: "Critical",
  },
  {
    skuId: "1CC0CP0012",
    warehouseId: "K030",
    currentStock: 8,
    historicalUsage: [
      { periodLabel: "Month 1", days: 30, quantity: 8 },
      { periodLabel: "Month 2", days: 30, quantity: 10 },
      { periodLabel: "Month 3", days: 30, quantity: 12 },
      { periodLabel: "Month 4", days: 30, quantity: 9 },
      { periodLabel: "Month 5", days: 30, quantity: 11 },
      { periodLabel: "Month 6", days: 30, quantity: 10 },
    ],
    forecastDemandForPlanningPeriod: 12,
    planningPeriodDays: 30,
    serviceLevel: 0.95,
    zScore: 1.65,
    seasonalFactor: 1.2,
    budgetFactor: 1,
    targetStockLevelOverride: 18,
    status: "Critical",
  },
  {
    skuId: "1CC0BK0050",
    warehouseId: "I020",
    currentStock: 5,
    historicalUsage: [
      { periodLabel: "Month 1", days: 30, quantity: 12 },
      { periodLabel: "Month 2", days: 30, quantity: 15 },
      { periodLabel: "Month 3", days: 30, quantity: 10 },
      { periodLabel: "Month 4", days: 30, quantity: 18 },
      { periodLabel: "Month 5", days: 30, quantity: 12 },
      { periodLabel: "Month 6", days: 30, quantity: 13 },
    ],
    forecastDemandForPlanningPeriod: 15,
    planningPeriodDays: 30,
    serviceLevel: 0.95,
    zScore: 1.65,
    seasonalFactor: 1.1,
    budgetFactor: 1,
    targetStockLevelOverride: 10,
    status: "Near Reorder Point",
  },
  {
    skuId: "1CC0CH0501",
    warehouseId: "I010",
    currentStock: 150,
    historicalUsage: [
      { periodLabel: "Month 1", days: 30, quantity: 170 },
      { periodLabel: "Month 2", days: 30, quantity: 190 },
      { periodLabel: "Month 3", days: 30, quantity: 210 },
      { periodLabel: "Month 4", days: 30, quantity: 180 },
      { periodLabel: "Month 5", days: 30, quantity: 200 },
      { periodLabel: "Month 6", days: 30, quantity: 190 },
    ],
    forecastDemandForPlanningPeriod: 180,
    planningPeriodDays: 30,
    serviceLevel: 0.95,
    zScore: 1.65,
    seasonalFactor: 1.1,
    budgetFactor: 1,
    targetStockLevelOverride: 350,
    status: "Near Reorder Point",
  },
];

export const formulaList = [
  "ค่าเฉลี่ยการใช้ต่อวัน = การใช้ย้อนหลังรวม / จำนวนวันย้อนหลัง",
  "ความผันผวนของการใช้ = ส่วนเบี่ยงเบนมาตรฐานของข้อมูลการใช้ย้อนหลัง",
  "ระยะเวลารอพัสดุที่ปรับแล้ว = ระยะเวลารอพัสดุของซัพพลายเออร์ × ตัวคูณฤดูกาล × ตัวคูณงบประมาณ",
  "ระดับพัสดุสำรองปลอดภัย = Z-score × ความผันผวนของการใช้ต่อวัน × √ระยะเวลารอพัสดุที่ปรับแล้ว",
  "ความต้องการใช้ระหว่างรอพัสดุ = ค่าเฉลี่ยการใช้ต่อวัน × ระยะเวลารอพัสดุที่ปรับแล้ว",
  "จุดสั่งซื้อใหม่ = ความต้องการใช้ระหว่างรอพัสดุ + ระดับพัสดุสำรองปลอดภัย",
  "ระดับสต็อกเป้าหมาย = ความต้องการคาดการณ์ในรอบแผน + ระดับพัสดุสำรองปลอดภัย หรือค่าเป้าหมายจากนโยบาย",
  "จำนวนที่ระบบแนะนำ = ระดับสต็อกเป้าหมาย - สต็อกปัจจุบัน แล้วปัดขึ้นตามจำนวนสั่งซื้อขั้นต่ำ (MOQ)",
  "มูลค่าประมาณการ = จำนวนที่ผู้ใช้ขอ × ราคาต่อหน่วยของซัพพลายเออร์",
];

export const initialContactLogs: SupplierContactLog[] = [
  {
    id: "LOG-001",
    supplierId: "S001",
    skuId: "1CC0CG0002",
    requestId: "REQ-001",
    channel: "Phone",
    purpose: "ยืนยันราคาและระยะเวลาส่งมอบ",
    note: "ซัพพลายเออร์ยืนยันราคา 2,000 บาท/เมตร และจัดส่งได้ 25 วัน",
    followUpDate: "2026-05-08",
    createdAt: "2026-05-05 09:15",
  },
  {
    id: "LOG-002",
    supplierId: "S003",
    skuId: "1DD0DC0000",
    requestId: "REQ-002",
    channel: "Email",
    purpose: "ขอใบเสนอราคา",
    note: "ได้รับใบเสนอราคาหม้อแปลง 100 kVA จำนวน 3 ลูก ราคาเดิม ระยะเวลาส่งมอบ 60 วัน",
    followUpDate: "2026-05-10",
    createdAt: "2026-05-05 10:30",
  },
];

// Helper สำหรับหา inventory record จาก SKU เพื่อสร้าง snapshot ตัวอย่าง
function getInventoryRecord(skuId: string) {
  return inventoryRecords.find((record) => record.skuId === skuId) ?? inventoryRecords[0];
}

// Helper สำหรับหา warehouse และงบประมาณที่เกี่ยวข้องกับ inventory record
function getWarehouse(warehouseId: string) {
  return warehouses.find((warehouse) => warehouse.id === warehouseId) ?? warehouses[0];
}

function getRegionalBudget(region: string) {
  return regionalBudgets.find((budget) => budget.region === region)?.remaining ?? 0;
}

/**
 * แปลงข้อมูล Supplier + SupplierOffer ให้เป็น SupplierSkuRecord
 *
 * ทำเพื่อให้ calculation engine รับข้อมูล Supplier ในรูปแบบเดียว
 * ไม่ต้องรู้ว่า mock data แยก supplier profile กับราคา/lead time อยู่คนละ array
 */
function toSupplierSkuRecord(supplierId: string, skuId: string): SupplierSkuRecord {
  const supplier = suppliers.find((item) => item.id === supplierId) ?? suppliers[0];
  const offer = supplierOffers.find((item) => item.supplierId === supplierId && item.skuId === skuId) ?? supplierOffers[0];

  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    sku: offer.skuId,
    unitPrice: offer.unitPrice,
    currency: offer.currency,
    unit: offer.unit,
    leadTimeDays: offer.leadTimeDays,
    moq: offer.moq,
    reliabilityScore: offer.reliabilityScore ?? 85,
    contactPerson: supplier.contactPerson,
    phone: supplier.phone,
    email: supplier.email,
    lineId: supplier.lineId,
  };
}

/**
 * สร้าง BudgetContext สำหรับใช้คำนวณ approval routing
 *
 * BudgetContext คือ snapshot ของงบประมาณ 3 ชั้น:
 * Local, Regional และ Central
 */
function getBudgetContext(inventory: InventoryRecord): BudgetContext {
  const warehouse = getWarehouse(inventory.warehouseId);

  return {
    localBudgetRemaining: warehouse.localBudget,
    regionalBudgetRemaining: getRegionalBudget(warehouse.region),
    centralBudgetRemaining,
  };
}

/**
 * สร้าง Calculation Snapshot ตอนสร้างคำขอ
 *
 * หลักสำคัญ:
 * snapshot ต้องเก็บค่าคำนวณ ณ เวลานั้น เช่น formula version, unit price,
 * supplier lead time, budget และ override reason
 *
 * เวลาเปิด Request History ภายหลัง ต้องอ่านค่าจาก snapshot นี้
 * ไม่ใช่คำนวณใหม่จาก mock data ปัจจุบัน
 */
function createSnapshot(params: {
  requestId: string;
  createdAt: string;
  inventory: InventoryRecord;
  supplier: SupplierSkuRecord;
  requestedQuantity: number;
  approvedQuantity?: number;
  overrideReasonCategory?: string;
  overrideReasonDetail?: string;
}): PurchaseRequestCalculationSnapshot {
  const recommendation = calculateInventoryRecommendation({
    inventory: params.inventory,
    supplier: params.supplier,
    formulaVersion,
  });
  const budget = getBudgetContext(params.inventory);
  const preview = calculatePurchaseRequestPreview({
    recommendation,
    requestedQuantity: params.requestedQuantity,
    unitPrice: params.supplier.unitPrice,
    budget,
  });

  return {
    requestId: params.requestId,
    createdAt: params.createdAt,
    ...recommendation,
    requestedQuantity: params.requestedQuantity,
    approvedQuantity: params.approvedQuantity,
    quantityVariance: preview.variance.variance,
    quantityVariancePercent: preview.variance.variancePercent,
    estimatedCostForRequestedQuantity: preview.estimatedCostForRequestedQuantity,
    selectedSupplierId: params.supplier.supplierId,
    selectedSupplierName: params.supplier.supplierName,
    supplierLeadTimeDaysAtRequestDate: params.supplier.leadTimeDays,
    unitPriceAtRequestDate: params.supplier.unitPrice,
    budgetContextAtRequestDate: budget,
    approvalRoutingAtRequestDate: preview.approvalRouting,
    overrideReasonCategory: params.overrideReasonCategory,
    overrideReasonDetail: params.overrideReasonDetail,
  };
}

const c01Inventory = getInventoryRecord("1CC0CG0002");
const t01Inventory = getInventoryRecord("1DD0DC0000");
const p01Inventory = getInventoryRecord("1CC0CP0012");
const c01Supplier = toSupplierSkuRecord("S001", "1CC0CG0002");
const t01Supplier = toSupplierSkuRecord("S003", "1DD0DC0000");
const p01Supplier = toSupplierSkuRecord("S001", "1CC0CP0012");

// Snapshot ตัวอย่างของ C01 สำหรับอธิบาย demo flow:
// Suggested 10 เมตร แต่ผู้ใช้ขอ 20 เมตร จึงเกิด variance +100%
export const c01CalculationSnapshot = createSnapshot({
  requestId: "C01-PREVIEW",
  createdAt: "2026-05-05 13:55",
  inventory: c01Inventory,
  supplier: c01Supplier,
  requestedQuantity: 20,
  overrideReasonCategory: "มีแผนซ่อมบำรุงเพิ่มเติม",
  overrideReasonDetail: "รวมแผนซ่อมบำรุงเพิ่มเติมของคลัง I010 ในรอบเดียวกัน",
});

// Snapshot ของ T01 ใช้แสดงกรณี escalation:
// มูลค่าประมาณการสูงกว่างบคลังพื้นที่และงบเขต จึงต้องส่งต่อส่วนกลาง
const t01CalculationSnapshot = createSnapshot({
  requestId: "REQ-002",
  createdAt: "2026-05-05 10:42",
  inventory: t01Inventory,
  supplier: t01Supplier,
  requestedQuantity: 3,
  overrideReasonCategory: "มีเหตุฉุกเฉินในพื้นที่",
  overrideReasonDetail: "ต้องรองรับงานซ่อมฉุกเฉินและ backlog ในพื้นที่ภาคตะวันออกเฉียงเหนือ",
});

// Snapshot ของ P01 ใช้เป็นตัวอย่างคำขอที่อนุมัติแล้วในประวัติ
const p01CalculationSnapshot = createSnapshot({
  requestId: "REQ-010",
  createdAt: "2026-04-28 13:10",
  inventory: p01Inventory,
  supplier: p01Supplier,
  requestedQuantity: 10,
  approvedQuantity: 10,
});

export const initialRequests: PurchaseRequest[] = [
  {
    id: "REQ-002",
    skuId: "1DD0DC0000",
    warehouseId: "K010",
    supplierId: "S003",
    aiSuggestedQuantity: t01CalculationSnapshot.suggestedQuantity,
    requestedQuantity: 3,
    unit: "ลูก",
    unitPrice: t01CalculationSnapshot.unitPriceAtRequestDate,
    leadTimeDays: t01CalculationSnapshot.supplierLeadTimeDaysAtRequestDate,
    adjustedLeadTimeDays: t01CalculationSnapshot.adjustedLeadTimeDays,
    moq: t01CalculationSnapshot.moq,
    estimatedCost: t01CalculationSnapshot.estimatedCostForRequestedQuantity,
    localBudgetRemaining: t01CalculationSnapshot.budgetContextAtRequestDate.localBudgetRemaining,
    regionalBudgetRemaining: t01CalculationSnapshot.budgetContextAtRequestDate.regionalBudgetRemaining,
    centralBudgetRemaining,
    recommendedLayer: t01CalculationSnapshot.approvalRoutingAtRequestDate.layer,
    status: "Pending Regional",
    variancePercent: t01CalculationSnapshot.quantityVariancePercent,
    overrideReasonCategory: t01CalculationSnapshot.overrideReasonCategory,
    overrideReasonText: t01CalculationSnapshot.overrideReasonDetail,
    formulaVersion,
    calculationSnapshot: t01CalculationSnapshot,
    supplierContactLogSummary: "อีเมลขอใบเสนอราคาแล้ว ซัพพลายเออร์ยืนยันราคาและระยะเวลาส่งมอบ",
    localReason: "คลัง K010 มีสต็อกต่ำกว่าสต็อกสำรอง และมีความเสี่ยงงานบริการหยุดชะงักสูง",
    regionalEscalationReason: "วงเงินเกินงบเขต ต้องขออนุมัติส่วนกลาง",
    createdAt: "2026-05-05 10:42",
    timeline: [
      { role: "Local Warehouse", action: "Submitted", actor: "คลัง K010", date: "2026-05-05 10:42", note: "งบคลังพื้นที่ไม่เพียงพอ" },
      { role: "Regional", action: "Waiting Review", actor: "เขตภาคตะวันออกเฉียงเหนือ", date: "2026-05-05 10:45" },
    ],
  },
  {
    id: "REQ-003",
    skuId: "1DD0DC0000",
    warehouseId: "K010",
    supplierId: "S003",
    aiSuggestedQuantity: t01CalculationSnapshot.suggestedQuantity,
    requestedQuantity: 3,
    unit: "ลูก",
    unitPrice: t01CalculationSnapshot.unitPriceAtRequestDate,
    leadTimeDays: t01CalculationSnapshot.supplierLeadTimeDaysAtRequestDate,
    adjustedLeadTimeDays: t01CalculationSnapshot.adjustedLeadTimeDays,
    moq: t01CalculationSnapshot.moq,
    estimatedCost: t01CalculationSnapshot.estimatedCostForRequestedQuantity,
    localBudgetRemaining: t01CalculationSnapshot.budgetContextAtRequestDate.localBudgetRemaining,
    regionalBudgetRemaining: t01CalculationSnapshot.budgetContextAtRequestDate.regionalBudgetRemaining,
    centralBudgetRemaining,
    recommendedLayer: t01CalculationSnapshot.approvalRoutingAtRequestDate.layer,
    status: "Pending Central",
    variancePercent: t01CalculationSnapshot.quantityVariancePercent,
    overrideReasonCategory: "มีเหตุฉุกเฉินในพื้นที่",
    overrideReasonText: "ใช้เป็นตัวอย่างคิวส่วนกลางที่ถูกส่งต่อแล้ว",
    formulaVersion,
    calculationSnapshot: {
      ...t01CalculationSnapshot,
      requestId: "REQ-003",
      createdAt: "2026-05-04 15:20",
      overrideReasonDetail: "ใช้เป็นตัวอย่างคิวส่วนกลางที่ถูกส่งต่อแล้ว",
    },
    supplierContactLogSummary: "อีเมลขอใบเสนอราคาแล้ว ซัพพลายเออร์ยืนยันราคาและระยะเวลาส่งมอบ",
    localReason: "คลัง K010 มีสต็อกต่ำกว่าสต็อกสำรอง",
    regionalEscalationReason: "งบระดับเขตขาด 3,150,000 บาท จึงส่งต่อส่วนกลาง",
    createdAt: "2026-05-04 15:20",
    timeline: [
      { role: "Local Warehouse", action: "Submitted", actor: "คลัง K010", date: "2026-05-04 15:20" },
      { role: "Regional", action: "Approve & Pass to Central", actor: "เขตภาคตะวันออกเฉียงเหนือ", date: "2026-05-04 16:05", note: "งบเขตไม่เพียงพอ" },
      { role: "Central", action: "Waiting Review", actor: "จัดซื้อส่วนกลาง", date: "2026-05-04 16:10" },
    ],
  },
  {
    id: "REQ-010",
    skuId: "1CC0CP0012",
    warehouseId: "K030",
    supplierId: "S001",
    aiSuggestedQuantity: p01CalculationSnapshot.suggestedQuantity,
    requestedQuantity: 10,
    approvedQuantity: 10,
    unit: "ต้น",
    unitPrice: p01CalculationSnapshot.unitPriceAtRequestDate,
    leadTimeDays: p01CalculationSnapshot.supplierLeadTimeDaysAtRequestDate,
    adjustedLeadTimeDays: p01CalculationSnapshot.adjustedLeadTimeDays,
    moq: p01CalculationSnapshot.moq,
    estimatedCost: p01CalculationSnapshot.estimatedCostForRequestedQuantity,
    localBudgetRemaining: p01CalculationSnapshot.budgetContextAtRequestDate.localBudgetRemaining,
    regionalBudgetRemaining: p01CalculationSnapshot.budgetContextAtRequestDate.regionalBudgetRemaining,
    centralBudgetRemaining,
    recommendedLayer: p01CalculationSnapshot.approvalRoutingAtRequestDate.layer,
    status: "Approved",
    variancePercent: p01CalculationSnapshot.quantityVariancePercent,
    formulaVersion,
    calculationSnapshot: p01CalculationSnapshot,
    supplierContactLogSummary: "โทรยืนยันวันจัดส่งแล้ว",
    createdAt: "2026-04-28 13:10",
    timeline: [
      { role: "Local Warehouse", action: "Submitted", actor: "คลัง K030", date: "2026-04-28 13:10" },
      { role: "Regional", action: "Approved", actor: "เขตภาคใต้", date: "2026-04-28 16:45" },
    ],
  },
];

export const vmiCandidates: VmiCandidate[] = [
  {
    skuId: "1CC0CG0002",
    demandStability: "High",
    supplierReliability: 96,
    score: calculateVmiSuitabilityScore({
      demandStabilityScore: 24,
      supplierReliabilityScore: 24,
      usageFrequencyScore: 18,
      leadTimeStabilityScore: 14,
      inventoryValueImpactScore: 14,
      procurementComplexityPenalty: 6,
    }),
  },
  {
    skuId: "1CC0CG0004",
    demandStability: "Medium",
    supplierReliability: 92,
    score: calculateVmiSuitabilityScore({
      demandStabilityScore: 18,
      supplierReliabilityScore: 23,
      usageFrequencyScore: 15,
      leadTimeStabilityScore: 12,
      inventoryValueImpactScore: 11,
      procurementComplexityPenalty: 5,
    }),
  },
  {
    skuId: "1DD0DC0000",
    demandStability: "Low",
    supplierReliability: 85,
    score: calculateVmiSuitabilityScore({
      demandStabilityScore: 8,
      supplierReliabilityScore: 21,
      usageFrequencyScore: 8,
      leadTimeStabilityScore: 7,
      inventoryValueImpactScore: 8,
      procurementComplexityPenalty: 7,
    }),
  },
];

export const vmiComparison: VmiComparisonMetric[] = [
  { metric: "สต็อกสำรอง", current: "30 m", vmi: "20 m", impact: "-10 m / -33%" },
  { metric: "จุดสั่งซื้อ", current: "100 m", vmi: "75 m", impact: "-25 m / -25%" },
  { metric: "ระยะเวลาส่งมอบ", current: "30 วัน", vmi: "14 วัน", impact: "-16 วัน / -53%" },
  { metric: "มูลค่าสินค้าคงคลัง", current: "240,000 บาท", vmi: "180,000 บาท", impact: "-60,000 บาท / -25%" },
  { metric: "คำสั่งซื้อที่ทำด้วยมือต่อเดือน", current: "4", vmi: "1", impact: "-3 / -75%" },
];
