// Catalog พัสดุไฟฟ้า PEA (จำลองให้สมจริง) + generator ข้อมูล usage/stock/risk/lead time
//
// ออกแบบให้ "rich + consistent": 12 SKU จริง × 8 คลัง × 3 เขต โดยทุกตัวเลข usage/stock/risk
// ถูก generate จาก catalog ด้วย hash แบบ deterministic (เปิดกี่ครั้งค่าเท่าเดิม ตาม DATA_POLICY)
// peaDataModel.ts จะ import generator พวกนี้ไปสร้าง array ที่ระบบใช้จริง

import type {
  PeaSkuMaster,
  PeaMonthlyUsage,
  PeaStockSummary,
  PeaRiskCoverageRecord,
  PeaLeadTimeSummary,
  PeaLeadTimeSkuSummary,
  PeaSupplierSkuPrice,
} from "./peaDataModel";

export const usageYear = 2026;

export type DemandTier = "high" | "mid" | "low";
export type SeasonProfile = "work" | "steady"; // work = ใช้มากช่วงหน้าแล้ง (งานก่อสร้าง/ขยายเขต), steady = ค่อนข้างคงที่

export type CatalogSku = {
  skuId: string;
  skuName: string;
  category: string;
  unit: string; // หน่วยจริงของพัสดุ (เมตร/ต้น/เครื่อง/ลูก/ชุด)
  criticality: "Critical" | "High" | "Medium" | "Low";
  basePrice: number; // ราคา/หน่วย (บาท) สมจริง
  demandTier: DemandTier; // ระดับปริมาณการใช้
  season: SeasonProfile;
  leadDays: number; // lead time มาตรฐานโดยประมาณ (วัน)
  suppliers: string[]; // ผู้ขายที่มีราคา
};

// 12 SKU พัสดุไฟฟ้าจริงของระบบจำหน่าย
export const peaCatalog: CatalogSku[] = [
  { skuId: "1CC0CG0002", skuName: "สายเคเบิลใต้ดิน XLPE 240 ตร.มม. 22kV", category: "สายไฟ/เคเบิล", unit: "เมตร", criticality: "High", basePrice: 2000, demandTier: "mid", season: "work", leadDays: 25, suppliers: ["S001", "S002"] },
  { skuId: "1CC0CG0004", skuName: "สายอะลูมิเนียมหุ้มฉนวน SAC 50 ตร.มม.", category: "สายไฟ/เคเบิล", unit: "เมตร", criticality: "High", basePrice: 3500, demandTier: "mid", season: "work", leadDays: 28, suppliers: ["S002", "S001"] },
  { skuId: "1CC0CG0011", skuName: "สายทองแดงหุ้มฉนวน THW 25 ตร.มม.", category: "สายไฟ/เคเบิล", unit: "เมตร", criticality: "Medium", basePrice: 175, demandTier: "mid", season: "steady", leadDays: 20, suppliers: ["S002"] },
  { skuId: "1CC0CH0501", skuName: "สายเคเบิลอากาศ SAC 185 ตร.มม. 22kV", category: "สายไฟ/เคเบิล", unit: "เมตร", criticality: "High", basePrice: 320, demandTier: "mid", season: "work", leadDays: 30, suppliers: ["S002", "S003"] },
  { skuId: "1DD0DC0000", skuName: "หม้อแปลงจำหน่าย 3 เฟส 100 kVA 22kV", category: "หม้อแปลง", unit: "เครื่อง", criticality: "Critical", basePrice: 165000, demandTier: "low", season: "steady", leadDays: 60, suppliers: ["S003"] },
  { skuId: "1DD0DC0050", skuName: "หม้อแปลงจำหน่าย 1 เฟส 30 kVA 22kV", category: "หม้อแปลง", unit: "เครื่อง", criticality: "Critical", basePrice: 78000, demandTier: "low", season: "steady", leadDays: 55, suppliers: ["S003"] },
  { skuId: "1CC0CP0012", skuName: "เสาคอนกรีตอัดแรง 12 เมตร", category: "เสาไฟ", unit: "ต้น", criticality: "High", basePrice: 4500, demandTier: "mid", season: "work", leadDays: 21, suppliers: ["S001"] },
  { skuId: "1CC0CP0014", skuName: "เสาคอนกรีตอัดแรง 14 เมตร", category: "เสาไฟ", unit: "ต้น", criticality: "Medium", basePrice: 6800, demandTier: "low", season: "work", leadDays: 24, suppliers: ["S001"] },
  { skuId: "1EE0MT0001", skuName: "มิเตอร์จานหมุน 1 เฟส 5(15) แอมป์", category: "มิเตอร์", unit: "เครื่อง", criticality: "High", basePrice: 950, demandTier: "high", season: "steady", leadDays: 35, suppliers: ["S003", "S002"] },
  { skuId: "1CC0IN0022", skuName: "ลูกถ้วยแขวน พอร์ซเลน 22kV", category: "ลูกถ้วย/ฉนวน", unit: "ลูก", criticality: "Medium", basePrice: 320, demandTier: "mid", season: "steady", leadDays: 18, suppliers: ["S001", "S002"] },
  { skuId: "1CC0DF0100", skuName: "ดรอพเอาท์ฟิวส์คัตเอาท์ 22kV 100A", category: "อุปกรณ์ป้องกัน", unit: "ชุด", criticality: "Medium", basePrice: 1850, demandTier: "mid", season: "steady", leadDays: 22, suppliers: ["S002"] },
  { skuId: "1CC0BK0050", skuName: "เบรกเกอร์ 3 เฟส 50 แอมป์", category: "เบรกเกอร์/สวิตช์", unit: "ชุด", criticality: "Medium", basePrice: 1800, demandTier: "mid", season: "steady", leadDays: 20, suppliers: ["S002"] },
];

export type ActiveWarehouse = {
  warehouseId: string;
  regionCode: string;
  regionLabel: string;
  sizeFactor: number; // คลังใหญ่ใช้พัสดุมากกว่า
};

// 8 คลังใช้งานจริง ใน 3 เขต
export const activeWarehouses: ActiveWarehouse[] = [
  { warehouseId: "I010", regionCode: "I", regionLabel: "เขต I", sizeFactor: 1.0 },
  { warehouseId: "I020", regionCode: "I", regionLabel: "เขต I", sizeFactor: 1.4 },
  { warehouseId: "I030", regionCode: "I", regionLabel: "เขต I", sizeFactor: 0.7 },
  { warehouseId: "K010", regionCode: "K", regionLabel: "เขต K", sizeFactor: 1.1 },
  { warehouseId: "K020", regionCode: "K", regionLabel: "เขต K", sizeFactor: 0.8 },
  { warehouseId: "K030", regionCode: "K", regionLabel: "เขต K", sizeFactor: 1.2 },
  { warehouseId: "A010", regionCode: "A", regionLabel: "เขต A", sizeFactor: 0.9 },
  { warehouseId: "A020", regionCode: "A", regionLabel: "เขต A", sizeFactor: 0.6 },
];

// ── deterministic pseudo-random (เสถียรทุก render) ───────────────────────────
function hash01(...nums: number[]): number {
  let h = 2166136261;
  for (const n of nums) {
    h ^= Math.round(n * 1000) & 0xffff;
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

const demandBaseByTier: Record<DemandTier, number> = { high: 4200, mid: 380, low: 6 };

// ตัวคูณตามฤดู: งานก่อสร้าง/ขยายเขตสูงช่วงหน้าแล้ง (พ.ย.-พ.ค.) ต่ำช่วงฝน (มิ.ย.-ต.ค.)
function seasonMultiplier(season: SeasonProfile, month: number): number {
  if (season === "steady") return 1 + 0.08 * Math.sin((month / 12) * Math.PI * 2);
  const rainy = month >= 6 && month <= 10;
  return rainy ? 0.78 : 1.18;
}

function skuIndex(skuId: string): number {
  return peaCatalog.findIndex((sku) => sku.skuId === skuId);
}
function whIndex(warehouseId: string): number {
  return activeWarehouses.findIndex((wh) => wh.warehouseId === warehouseId);
}

// คลังไหนเก็บ SKU ไหน: high-demand เก็บทุกคลัง, low-demand เก็บบางคลัง
function stocksSku(wh: ActiveWarehouse, sku: CatalogSku): boolean {
  if (sku.demandTier === "high") return true;
  const threshold = sku.demandTier === "mid" ? 0.18 : 0.42;
  return hash01(whIndex(wh.warehouseId), skuIndex(sku.skuId), 7) > threshold;
}

type StockProfile = "short" | "normal" | "dead";
function stockProfileFor(wh: ActiveWarehouse, sku: CatalogSku): StockProfile {
  const r = hash01(whIndex(wh.warehouseId), skuIndex(sku.skuId), 13);
  if (r < 0.3) return "short";
  if (r > 0.82) return "dead";
  return "normal";
}

function monthlyUsageValues(wh: ActiveWarehouse, sku: CatalogSku): number[] {
  const base = demandBaseByTier[sku.demandTier] * wh.sizeFactor;
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const noise = 0.85 + 0.3 * hash01(whIndex(wh.warehouseId), skuIndex(sku.skuId), month);
    const value = base * seasonMultiplier(sku.season, month) * noise;
    return sku.demandTier === "low" ? Math.max(0, Math.round(value)) : Math.round(value);
  });
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
function stdev(values: number[], avg: number): number {
  return Math.sqrt(values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length);
}

// คู่ (คลัง, SKU) ที่มีของในระบบ
function coveragePairs(): Array<{ wh: ActiveWarehouse; sku: CatalogSku }> {
  const pairs: Array<{ wh: ActiveWarehouse; sku: CatalogSku }> = [];
  activeWarehouses.forEach((wh) => {
    peaCatalog.forEach((sku) => {
      if (stocksSku(wh, sku)) pairs.push({ wh, sku });
    });
  });
  return pairs;
}

// ── generators (return ตามชนิดใน peaDataModel) ───────────────────────────────
export function generateMonthlyUsage(): PeaMonthlyUsage[] {
  const rows: PeaMonthlyUsage[] = [];
  coveragePairs().forEach(({ wh, sku }) => {
    monthlyUsageValues(wh, sku).forEach((usageQty, i) => {
      rows.push({ warehouseId: wh.warehouseId, skuId: sku.skuId, usageYear, usageMonth: i + 1, usageQty, sourceSheet: "WH Season Data Item" });
    });
  });
  return rows;
}

const coverMultByProfile: Record<StockProfile, [number, number]> = {
  short: [0.1, 0.5],
  normal: [1.4, 2.6],
  dead: [6, 11],
};

function stockQtyFor(wh: ActiveWarehouse, sku: CatalogSku, avgMonthly: number): number {
  const [lo, hi] = coverMultByProfile[stockProfileFor(wh, sku)];
  const mult = lo + (hi - lo) * hash01(whIndex(wh.warehouseId), skuIndex(sku.skuId), 29);
  const qty = avgMonthly * mult;
  return sku.demandTier === "low" ? Math.max(0, Math.round(qty)) : Math.round(qty);
}

const unitToBatch: Record<string, string> = { เมตร: "M", เครื่อง: "EA", ต้น: "EA", ลูก: "EA", ชุด: "EA" };

export function generateStockSummary(): PeaStockSummary[] {
  return coveragePairs().map(({ wh, sku }) => {
    const avg = mean(monthlyUsageValues(wh, sku));
    return { factoryId: wh.warehouseId, skuId: sku.skuId, stockQty: stockQtyFor(wh, sku, avg), unit: unitToBatch[sku.unit] ?? "EA", sourceSheet: "BATCH" };
  });
}

export function generateRiskCoverage(): PeaRiskCoverageRecord[] {
  return coveragePairs().map(({ wh, sku }) => {
    const usage = monthlyUsageValues(wh, sku);
    const avg = mean(usage);
    const std = stdev(usage, avg);
    const cv = avg > 0 ? std / avg : 0;
    const stockQty = stockQtyFor(wh, sku, avg);
    const cover = avg > 0 ? stockQty / avg : 0;
    const riskStatus = cover < 1 ? "Critical: <1 period cover" : cover < 3 ? "Risk: <3 periods cover" : cover >= 6 ? "Overstock: dead/slow candidate" : "OK";
    const stability = Math.round((40 - cv * 80) * 100) / 100;
    const vmiScore = Math.round((50 + (1 - cv) * 30 + (sku.demandTier === "high" ? 15 : sku.demandTier === "mid" ? 8 : 2)) * 100) / 100;
    return {
      plantId: wh.warehouseId,
      skuId: sku.skuId,
      stockQty,
      unit: unitToBatch[sku.unit] ?? "EA",
      usageUnit: unitToBatch[sku.unit] ?? "EA",
      totalUsage: Math.round(avg * 12),
      activePeriods: 12,
      avgPeriodUsage: Math.round(avg * 100) / 100,
      stdPeriodUsage: Math.round(std * 100) / 100,
      cv: Math.round(cv * 10000) / 10000,
      regionCode: wh.regionCode,
      stockCoverPeriods: Math.round(cover * 10000) / 10000,
      riskStatus,
      riskRank: cover < 1 ? 0 : cover < 3 ? 2 : 4,
      stabilityScore: stability,
      frequencyScore: 25,
      usageValueScore: 20,
      leadScore: 7.5,
      vmiScore,
      sourceSheet: "inventory_relationship_analysis",
    };
  });
}

export function generateSkuMaster(): PeaSkuMaster[] {
  return peaCatalog.map((sku) => {
    const pairs = coveragePairs().filter((pair) => pair.sku.skuId === sku.skuId);
    const stockTotal = pairs.reduce((sum, { wh }) => sum + stockQtyFor(wh, sku, mean(monthlyUsageValues(wh, sku))), 0);
    const avgUsage = pairs.length > 0 ? mean(pairs.map(({ wh }) => mean(monthlyUsageValues(wh, sku)))) : 0;
    return {
      skuId: sku.skuId,
      skuName: sku.skuName,
      category: sku.category,
      unit: unitToBatch[sku.unit] ?? "EA",
      criticalityLevel: sku.criticality === "Low" ? "Medium" : sku.criticality,
      stockTotal: Math.round(stockTotal * 100) / 100,
      avgUsageOriginal: Math.round(avgUsage * 1000) / 1000,
      sourceSheet: "SKU Data",
    };
  });
}

export function generateLeadTimeSummary(): PeaLeadTimeSummary[] {
  const rows: PeaLeadTimeSummary[] = [];
  activeWarehouses.forEach((wh) => {
    peaCatalog.forEach((sku) => {
      if (!stocksSku(wh, sku)) return;
      const jitter = 0.7 + 0.6 * hash01(whIndex(wh.warehouseId), skuIndex(sku.skuId), 41);
      const sumLt = Math.round(sku.leadDays * jitter);
      rows.push({
        factoryId: wh.warehouseId,
        skuId: sku.skuId,
        transactionCount: 4 + Math.round(20 * hash01(whIndex(wh.warehouseId), skuIndex(sku.skuId), 43)),
        avgDocumentProcessLtDays: Math.round(sumLt * 0.15 * 100) / 100,
        avgProcurementLtDays: Math.round(sumLt * 0.85 * 100) / 100,
        avgSumLtDays: sumLt,
        medianSumLtDays: Math.round(sumLt * 0.92),
        p90SumLtDays: Math.round(sumLt * 1.4),
        p95SumLtDays: Math.round(sumLt * 1.6),
        avgPoToReceiveDays: Math.round(sumLt * 0.85 * 100) / 100,
        sourceSheet: "LT Analyst",
      });
    });
  });
  return rows;
}

export function generateLeadTimeSkuSummary(): PeaLeadTimeSkuSummary[] {
  return peaCatalog.map((sku) => ({
    skuId: sku.skuId,
    leadCountSku: 30 + Math.round(180 * hash01(skuIndex(sku.skuId), 51)),
    avgLeadDaysSku: sku.leadDays,
    medianLeadDaysSku: Math.round(sku.leadDays * 0.9),
    p90LeadDaysSku: Math.round(sku.leadDays * 1.5),
    sourceSheet: "Lead Time Summary",
  }));
}

export function generateSupplierSkuPrice(): PeaSupplierSkuPrice[] {
  const rows: PeaSupplierSkuPrice[] = [];
  peaCatalog.forEach((sku) => {
    sku.suppliers.forEach((supplierId, i) => {
      const variation = 1 + (i === 0 ? 0 : 0.05 + 0.05 * hash01(skuIndex(sku.skuId), i, 61));
      rows.push({
        supplierId,
        skuId: sku.skuId,
        unitPrice: Math.round(sku.basePrice * variation),
        currency: "THB",
        unit: unitToBatch[sku.unit] ?? "EA",
        moq: sku.demandTier === "low" ? 1 : sku.demandTier === "mid" ? 10 : 50,
        standardLeadTimeDays: sku.leadDays + i * 4,
        reliabilityScore: 96 - i * 4,
        priceSource: "mock_supplier_quote",
        status: "active",
      });
    });
  });
  return rows;
}

export function getCatalogSku(skuId: string): CatalogSku | undefined {
  return peaCatalog.find((sku) => sku.skuId === skuId);
}
