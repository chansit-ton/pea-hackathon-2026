import { Card, DataTable, StatusBadge } from "./common";
import type { PurchaseRequestCalculationSnapshot } from "../types";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatters";

/**
 * แสดง Calculation Snapshot ที่ถูกบันทึกไว้ตอนสร้างคำขอ
 *
 * หลักสำคัญ:
 * หน้านี้ต้องอ่านค่าจาก snapshot เท่านั้น ไม่คำนวณใหม่จาก mock data ปัจจุบัน
 * เพราะข้อมูลในอนาคตอาจเปลี่ยนได้ เช่น ราคา Supplier, Lead Time, Budget หรือ Formula Version
 */
export function CalculationSnapshotView({ snapshot, unit }: { snapshot: PurchaseRequestCalculationSnapshot; unit: string }) {
  // rows คือรายการค่าคำนวณสำคัญที่ใช้สำหรับ audit ย้อนหลัง
  // ใช้ label ภาษาไทยพร้อม technical term เพื่อให้ทั้ง user และทีม dev อ่านตรงกัน
  const rows = [
    ["เวอร์ชันสูตร (Formula Version)", snapshot.formulaVersion],
    ["การใช้ย้อนหลังรวม (Historical Usage Total)", `${formatNumber(snapshot.historicalUsageTotal)} ${unit} / ${snapshot.historicalUsageDays} วัน`],
    ["ค่าเฉลี่ยการใช้ต่อวัน (Average Daily Demand)", `${formatNumber(snapshot.averageDailyDemand)} ${unit}/วัน`],
    ["ความผันผวนของ Demand", `${formatNumber(snapshot.demandVariabilityPerDay)} ${unit}/วัน`],
    ["Lead Time ของ Supplier", `${formatNumber(snapshot.supplierLeadTimeDaysAtRequestDate)} วัน`],
    ["Lead Time ที่ปรับแล้ว (Adjusted Lead Time)", `${formatNumber(snapshot.adjustedLeadTimeDays)} วัน`],
    ["Stock สำรอง (Safety Stock)", `${formatNumber(snapshot.safetyStock)} ${unit}`],
    ["Demand ระหว่างรอของ", `${formatNumber(snapshot.demandDuringLeadTime)} ${unit}`],
    ["จุดสั่งซื้อ (Reorder Point)", `${formatNumber(snapshot.reorderPoint)} ${unit}`],
    ["ระดับ Stock เป้าหมาย", `${formatNumber(snapshot.targetStockLevel)} ${unit}`],
    ["จำนวนที่ AI แนะนำ", `${formatNumber(snapshot.suggestedQuantity)} ${unit}`],
    ["จำนวนที่ผู้ใช้ขอจริง", `${formatNumber(snapshot.requestedQuantity)} ${unit}`],
    ["จำนวนที่อนุมัติ", snapshot.approvedQuantity ? `${formatNumber(snapshot.approvedQuantity)} ${unit}` : "-"],
    ["ส่วนต่างจำนวน", `${snapshot.quantityVariance > 0 ? "+" : ""}${formatNumber(snapshot.quantityVariance)} ${unit}`],
    ["ส่วนต่างเป็นเปอร์เซ็นต์", formatPercent(snapshot.quantityVariancePercent)],
    ["ราคาต่อหน่วย", `${formatCurrency(snapshot.unitPriceAtRequestDate)}/${unit}`],
    ["มูลค่าประมาณการ", formatCurrency(snapshot.estimatedCostForRequestedQuantity)],
    ["เส้นทางอนุมัติ", snapshot.approvalRoutingAtRequestDate.layer],
    ["เหตุผล Override", snapshot.overrideReasonCategory ?? "-"],
  ];

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="font-semibold text-slate-950">Calculation Snapshot</h3>
          <p className="mt-1 text-sm text-slate-500">ค่าที่ถูกเก็บ ณ วันที่สร้างคำขอ ไม่คำนวณย้อนหลังใหม่</p>
        </div>
        <StatusBadge status="Draft" />
      </div>
      <DataTable columns={["Field", "Snapshot Value"]}>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td className="px-4 py-3 font-medium text-slate-700">{label}</td>
            <td className="px-4 py-3 text-slate-600">{value}</td>
          </tr>
        ))}
      </DataTable>
    </Card>
  );
}
