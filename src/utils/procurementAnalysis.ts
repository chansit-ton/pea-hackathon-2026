// คำนวณค่าสรุปและ flag "ตรวจซื้อซ้ำ-ของจม" จาก seed ใน procurementHistory.ts
//
// ตาม DATA_POLICY: ทุกค่าสรุป (มูลค่าของจม, % ใช้งบ, flag) ต้องคำนวณจาก record ปัจจุบัน
// ไม่ hardcode ผลลัพธ์ เพื่อให้ถ้า seed/ข้อมูลเปลี่ยน ค่าทุกตัวเปลี่ยนตาม

import {
  budgetRequestHistory,
  warehouseBudgetByYear,
  deadStockListings,
  fiscalYears,
  type BudgetRequestRecord,
  type DeadStockListing,
  type FiscalYear,
  type WarehouseBudgetYear,
} from "../data/procurementHistory";
import { peaRiskCoverageRecords, peaStockSummary, resolvePeaSkuId } from "../data/peaDataModel";

// เกณฑ์ที่ใช้ตัดสิน flag (รวมไว้ที่เดียวเพื่ออธิบาย "ค่านี้คำนวณจากอะไร")
export const procurementThresholds = {
  spendToKeepUsageRatio: 0.95, // ใช้งบ ≥ 95% ของที่จัดสรร = เร่งใช้งบให้หมด
  overPeerRatio: 1.5, // ตั้งงบ category สูงกว่าค่าเฉลี่ยคลังอื่น ≥ 1.5 เท่า
};

export type GotchaFlag = "repeat-buy" | "spend-to-keep" | "over-peer";

export const gotchaFlagLabel: Record<GotchaFlag, string> = {
  "repeat-buy": "ซื้อซ้ำทั้งที่ของจม",
  "spend-to-keep": "เร่งใช้งบให้หมด",
  "over-peer": "งบสูงกว่าคลังอื่น",
};

export function deadStockValue(item: DeadStockListing): number {
  return item.qty * item.unitCost;
}

export function budgetRequestAmount(record: BudgetRequestRecord): number {
  return record.requestedQty * record.unitCost;
}

export function formatFiscalYear(year: FiscalYear): string {
  return `ปีงบ ${year}`;
}

// รายการของจมพร้อมมูลค่า เรียงจากจมแพงสุด
export type DeadStockView = DeadStockListing & { value: number };

export function getDeadStockListings(): DeadStockView[] {
  return deadStockListings
    .map((item) => ({ ...item, value: deadStockValue(item) }))
    .sort((a, b) => b.value - a.value);
}

export function getTotalDeadStockValue(): number {
  return deadStockListings.reduce((sum, item) => sum + deadStockValue(item), 0);
}

// หาของจมของ SKU เดียวกันที่ "คลังอื่น" เพื่อเสนอยืม/แลกแทนการซื้อใหม่ (ใช้ในการ์ดดักตอนจะซื้อ)
export function findDeadStockForSkuElsewhere(skuId: string, excludeWarehouseId?: string): DeadStockView | undefined {
  return getDeadStockListings().find((item) => item.skuId === skuId && item.warehouseId !== excludeWarehouseId);
}

// หาของจมของ SKU เดียวกัน (ทุกคลัง) สำหรับ detail panel
export function getDeadStockForSku(skuId: string): DeadStockView[] {
  return getDeadStockListings().filter((item) => item.skuId === skuId);
}

// ประวัติการของบ SKU เดียวกันของคลังเดียวกัน เรียงตามปีงบ (ดูว่าซื้อซ้ำกี่ปี)
export function getBudgetHistoryForWarehouseSku(warehouseId: string, skuId: string): Array<BudgetRequestRecord & { amount: number }> {
  return budgetRequestHistory
    .filter((record) => record.warehouseId === warehouseId && record.skuId === skuId)
    .map((record) => ({ ...record, amount: budgetRequestAmount(record) }))
    .sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));
}

export function getPeerAverageForCategory(category: string, fiscalYear: FiscalYear, excludeWarehouseId: string): number {
  return peerAverageAmountForCategory(category, fiscalYear, excludeWarehouseId);
}

// การถือครอง SKU หนึ่งรายคลัง: รวม stock จริง (peaStockSummary) + usage/cover (peaRiskCoverageRecords)
// + annotate ของจม (deadStockListings) เพื่อให้หน้า SKU เห็นว่าคลังไหนถือเท่าไร และคลังไหนจม
export type SkuWarehouseHolding = {
  warehouseId: string;
  regionLabel: string;
  stockQty: number;
  unit: string;
  avgMonthlyUsage: number | null;
  stockCoverPeriods: number | null;
  monthsIdle: number | null;
  status: "dead" | "short" | "balanced";
  deadValue: number | null;
};

// แปลงหน่วยดิบจาก BATCH ให้อ่านง่ายเป็นไทย (M = เมตร, EA = หน่วย)
function normalizeStockUnit(unit: string): string {
  if (unit === "M") return "เมตร";
  if (unit === "EA") return "หน่วย";
  return unit;
}

export function getSkuHoldingsByWarehouse(shortSkuId: string): SkuWarehouseHolding[] {
  const peaSkuId = resolvePeaSkuId(shortSkuId);

  const fromStock: SkuWarehouseHolding[] = peaStockSummary
    .filter((row) => row.skuId === peaSkuId)
    .map((row) => {
      const coverage = peaRiskCoverageRecords.find((record) => record.plantId === row.factoryId && record.skuId === peaSkuId);
      const dead = deadStockListings.find((item) => item.warehouseId === row.factoryId && item.skuId === shortSkuId);
      const cover = coverage?.stockCoverPeriods ?? null;
      const status: SkuWarehouseHolding["status"] = dead || (cover !== null && cover >= 1.5) ? "dead" : cover !== null && cover < 1 ? "short" : "balanced";
      return {
        warehouseId: row.factoryId,
        regionLabel: `เขต ${row.factoryId.charAt(0)}`,
        stockQty: row.stockQty,
        unit: normalizeStockUnit(row.unit),
        avgMonthlyUsage: coverage?.avgPeriodUsage ?? null,
        stockCoverPeriods: cover,
        monthsIdle: dead?.monthsIdle ?? null,
        status,
        deadValue: dead ? dead.qty * dead.unitCost : null,
      };
    });

  const seen = new Set(fromStock.map((holding) => holding.warehouseId));
  const fromDeadOnly: SkuWarehouseHolding[] = deadStockListings
    .filter((item) => item.skuId === shortSkuId && !seen.has(item.warehouseId))
    .map((item) => ({
      warehouseId: item.warehouseId,
      regionLabel: item.regionLabel,
      stockQty: item.qty,
      unit: item.unit,
      avgMonthlyUsage: null,
      stockCoverPeriods: null,
      monthsIdle: item.monthsIdle,
      status: "dead" as const,
      deadValue: item.qty * item.unitCost,
    }));

  return [...fromStock, ...fromDeadOnly].sort((a, b) => (b.deadValue ?? 0) - (a.deadValue ?? 0) || b.stockQty - a.stockQty);
}

// ── การ flag รายการของบ ──────────────────────────────────────────────────────
export type BudgetRequestWithFlags = BudgetRequestRecord & {
  amount: number;
  peerAverageAmount: number;
  flags: GotchaFlag[];
  flagNotes: string[];
};

function isWarehouseSpendToKeep(warehouseId: string): boolean {
  const rows = warehouseBudgetByYear
    .filter((row) => row.warehouseId === warehouseId)
    .sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));
  if (rows.length === 0) return false;

  const latest = rows[rows.length - 1];
  const usageRatio = latest.budgetAllocated > 0 ? latest.budgetUsed / latest.budgetAllocated : 0;
  const deadStockRising = rows.length >= 2 ? latest.deadStockValueEndOfYear > rows[0].deadStockValueEndOfYear : false;

  return usageRatio >= procurementThresholds.spendToKeepUsageRatio && deadStockRising;
}

function peerAverageAmountForCategory(category: string, fiscalYear: FiscalYear, excludeWarehouseId: string): number {
  const peers = budgetRequestHistory.filter(
    (record) => record.category === category && record.fiscalYear === fiscalYear && record.warehouseId !== excludeWarehouseId,
  );
  if (peers.length === 0) return 0;
  const total = peers.reduce((sum, record) => sum + budgetRequestAmount(record), 0);
  return total / peers.length;
}

export function analyzeBudgetRequests(): BudgetRequestWithFlags[] {
  return budgetRequestHistory
    .map((record) => {
      const amount = budgetRequestAmount(record);
      const flags: GotchaFlag[] = [];
      const flagNotes: string[] = [];

      // Flag 1: ของบซื้อ SKU ที่ยังมี Dead Stock ค้างอยู่ (จมที่คลังเดียวกัน = ชัดสุด, จมในเขตเดียวกัน = น่าสงสัย)
      const deadSameWarehouse = deadStockListings.find((item) => item.skuId === record.skuId && item.warehouseId === record.warehouseId);
      const deadSameRegion = deadStockListings.find((item) => item.skuId === record.skuId && item.regionLabel === record.regionLabel);
      if (deadSameWarehouse) {
        flags.push("repeat-buy");
        flagNotes.push(`คลังนี้มี ${record.skuName} จมอยู่ ${formatQty(deadSameWarehouse.qty)} ${deadSameWarehouse.unit} (ไม่ขยับ ${deadSameWarehouse.monthsIdle} เดือน) แต่ยังของบซื้อเพิ่ม`);
      } else if (deadSameRegion) {
        flags.push("repeat-buy");
        flagNotes.push(`ในเขตเดียวกันมี ${record.skuName} จมอยู่ที่ ${deadSameRegion.warehouseId} ${formatQty(deadSameRegion.qty)} ${deadSameRegion.unit} ควรโอนก่อนซื้อใหม่`);
      }

      // Flag 2: คลังเร่งใช้งบให้หมด + ของจมเพิ่มขึ้น
      if (isWarehouseSpendToKeep(record.warehouseId)) {
        flags.push("spend-to-keep");
        flagNotes.push("คลังนี้ใช้งบเกือบเต็มทุกปีและมูลค่าของจมเพิ่มขึ้น เข้าข่ายเร่งใช้งบให้หมด");
      }

      // Flag 3: ตั้งงบ category นี้สูงกว่าค่าเฉลี่ยคลังอื่นในปีเดียวกัน
      const peerAvg = peerAverageAmountForCategory(record.category, record.fiscalYear, record.warehouseId);
      if (peerAvg > 0 && amount >= peerAvg * procurementThresholds.overPeerRatio) {
        flags.push("over-peer");
        flagNotes.push(`ตั้งงบ ${formatBaht(amount)} สูงกว่าค่าเฉลี่ยคลังอื่น (${formatBaht(peerAvg)}) ราว ${(amount / peerAvg).toFixed(1)} เท่า`);
      }

      return { ...record, amount, peerAverageAmount: peerAvg, flags, flagNotes };
    })
    .sort((a, b) => (b.flags.length - a.flags.length) || b.fiscalYear.localeCompare(a.fiscalYear) || b.amount - a.amount);
}

// ── สรุปราย "คลัง" สำหรับการเทียบคลัง (feature เทียบคลัง) ──────────────────────
export type WarehouseProcurementSummary = {
  warehouseId: string;
  regionLabel: string;
  latestYear: FiscalYear;
  budgetAllocated: number;
  budgetUsed: number;
  budgetUsedPercent: number;
  deadStockValueLatest: number;
  deadStockValueFirst: number;
  deadStockTrendPercent: number; // เทียบปีแรกที่มีข้อมูล
  spendToKeep: boolean;
  yearly: WarehouseBudgetYear[];
};

export function getWarehouseProcurementSummaries(): WarehouseProcurementSummary[] {
  const warehouseIds = Array.from(new Set(warehouseBudgetByYear.map((row) => row.warehouseId)));

  return warehouseIds
    .map((warehouseId) => {
      const yearly = warehouseBudgetByYear
        .filter((row) => row.warehouseId === warehouseId)
        .sort((a, b) => a.fiscalYear.localeCompare(b.fiscalYear));
      const latest = yearly[yearly.length - 1];
      const first = yearly[0];
      const budgetUsedPercent = latest.budgetAllocated > 0 ? (latest.budgetUsed / latest.budgetAllocated) * 100 : 0;
      const deadStockTrendPercent =
        first.deadStockValueEndOfYear > 0
          ? ((latest.deadStockValueEndOfYear - first.deadStockValueEndOfYear) / first.deadStockValueEndOfYear) * 100
          : 0;

      return {
        warehouseId,
        regionLabel: latest.regionLabel,
        latestYear: latest.fiscalYear,
        budgetAllocated: latest.budgetAllocated,
        budgetUsed: latest.budgetUsed,
        budgetUsedPercent,
        deadStockValueLatest: latest.deadStockValueEndOfYear,
        deadStockValueFirst: first.deadStockValueEndOfYear,
        deadStockTrendPercent,
        spendToKeep: isWarehouseSpendToKeep(warehouseId),
        yearly,
      };
    })
    .sort((a, b) => b.deadStockValueLatest - a.deadStockValueLatest);
}

export function getGotchaCaseCount(): number {
  return analyzeBudgetRequests().filter((record) => record.flags.length > 0).length;
}

export { fiscalYears };

// helper format ภายในไฟล์ (หน้าจอใช้ formatNumber กลางของ App อยู่แล้ว)
function formatQty(value: number): string {
  return value.toLocaleString("th-TH");
}
function formatBaht(value: number): string {
  return `฿${Math.round(value).toLocaleString("th-TH")}`;
}
