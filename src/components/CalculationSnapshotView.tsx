import { Card, DataTable, StatusBadge } from "./common";
import type { PurchaseRequestCalculationSnapshot } from "../types";
import { formatCurrency, formatNumber, formatPercent } from "../utils/formatters";

/**
 * แสดงภาพบันทึกการคำนวณที่ถูกบันทึกไว้ตอนสร้างคำขอ
 *
 * หน้านี้ต้องอ่านค่าจากภาพบันทึกเดิมเท่านั้น ไม่คำนวณใหม่จากข้อมูลจำลองปัจจุบัน
 * เพราะราคา Lead Time งบประมาณ หรือเวอร์ชันสูตรอาจเปลี่ยนในอนาคต
 */
export function CalculationSnapshotView({ snapshot, unit }: { snapshot: PurchaseRequestCalculationSnapshot; unit: string }) {
  const layerLabels: Record<string, string> = {
    Local: "ระดับคลังพื้นที่",
    Regional: "ระดับเขต",
    Central: "ระดับส่วนกลาง",
  };

  const rows = [
    ["เวอร์ชันสูตร", snapshot.formulaVersion],
    ["การใช้ย้อนหลังรวม", `${formatNumber(snapshot.historicalUsageTotal)} ${unit} / ${snapshot.historicalUsageDays} วัน`],
    ["ค่าเฉลี่ยการใช้ต่อวัน", `${formatNumber(snapshot.averageDailyDemand)} ${unit}/วัน`],
    ["ความผันผวนของการใช้", `${formatNumber(snapshot.demandVariabilityPerDay)} ${unit}/วัน`],
    ["ระยะเวลารอพัสดุของ Supplier (Lead Time)", `${formatNumber(snapshot.supplierLeadTimeDaysAtRequestDate)} วัน`],
    ["ระยะเวลารอพัสดุที่ปรับแล้ว (Adjusted Lead Time)", `${formatNumber(snapshot.adjustedLeadTimeDays)} วัน`],
    ["ระดับความมั่นใจ", `${formatNumber(snapshot.serviceLevel * 100)}%`],
    ["ค่า Z-score", formatNumber(snapshot.zScore)],
    ["ระดับพัสดุสำรองปลอดภัย (Safety Stock)", `${formatNumber(snapshot.safetyStock)} ${unit}`],
    ["ความต้องการใช้ระหว่างรอพัสดุ", `${formatNumber(snapshot.demandDuringLeadTime)} ${unit}`],
    ["จุดสั่งซื้อใหม่ (Reorder Point)", `${formatNumber(snapshot.reorderPoint)} ${unit}`],
    ["ระดับสต็อกเป้าหมาย", `${formatNumber(snapshot.targetStockLevel)} ${unit}`],
    ["จำนวนที่ระบบแนะนำ", `${formatNumber(snapshot.suggestedQuantity)} ${unit}`],
    ["จำนวนที่ผู้ใช้ขอจริง", `${formatNumber(snapshot.requestedQuantity)} ${unit}`],
    ["จำนวนที่อนุมัติ", snapshot.approvedQuantity ? `${formatNumber(snapshot.approvedQuantity)} ${unit}` : "-"],
    ["ส่วนต่างจำนวน", `${snapshot.quantityVariance > 0 ? "+" : ""}${formatNumber(snapshot.quantityVariance)} ${unit}`],
    ["ส่วนต่างเป็นเปอร์เซ็นต์", formatPercent(snapshot.quantityVariancePercent)],
    ["ราคาต่อหน่วย ณ วันที่ขอ", `${formatCurrency(snapshot.unitPriceAtRequestDate)}/${unit}`],
    ["มูลค่าประมาณการ", formatCurrency(snapshot.estimatedCostForRequestedQuantity)],
    ["เส้นทางอนุมัติ", layerLabels[snapshot.approvalRoutingAtRequestDate.layer] ?? snapshot.approvalRoutingAtRequestDate.layer],
    ["เหตุผลการขอแตกต่างจากค่าที่ระบบแนะนำ", snapshot.overrideReasonCategory ?? "-"],
  ];

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h3 className="font-semibold text-slate-950">ภาพบันทึกการคำนวณ</h3>
          <p className="mt-1 text-sm text-slate-500">ค่าที่ถูกเก็บ ณ วันที่สร้างคำขอ และไม่คำนวณย้อนหลังใหม่</p>
        </div>
        <StatusBadge status="Draft" />
      </div>
      <DataTable columns={["รายการ", "ค่าที่บันทึกไว้"]}>
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
