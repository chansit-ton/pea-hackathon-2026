import { X } from "lucide-react";
import type { ReactNode } from "react";
import { BudgetRoutingExplanation } from "./BudgetRoutingExplanation";
import { Button, Card, DataTable } from "./common";
import { OverrideExplanation } from "./OverrideExplanation";
import { CalculationSnapshotView } from "./CalculationSnapshotView";
import type {
  BudgetContext,
  InventoryCalculationResult,
  InventoryRecord,
  PurchaseRequestCalculationSnapshot,
  PurchaseRequestPreview,
  SupplierSkuRecord,
} from "../types";
import { formatCurrency, formatNumber } from "../utils/formatters";

export function CalculationExplanationPanel({
  inventory,
  supplier,
  recommendation,
  budget,
  preview,
  requestedQuantity,
  snapshot,
  onClose,
}: {
  inventory: InventoryRecord;
  supplier: SupplierSkuRecord;
  recommendation: InventoryCalculationResult;
  budget?: BudgetContext;
  preview?: PurchaseRequestPreview;
  requestedQuantity?: number;
  snapshot?: PurchaseRequestCalculationSnapshot;
  onClose?: () => void;
}) {
  const unit = supplier.unit;
  const effectiveRequestedQuantity = requestedQuantity ?? snapshot?.requestedQuantity ?? recommendation.suggestedQuantity;
  const effectiveEstimatedCost =
    preview?.estimatedCostForRequestedQuantity ??
    snapshot?.estimatedCostForRequestedQuantity ??
    recommendation.estimatedCostForSuggestedQuantity;

  return (
    <Card className="border-blue-200">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Calculation Explainability</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">คำอธิบายวิธีคำนวณและที่มาของคำแนะนำ</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            ระบบคำนวณคำแนะนำนี้จากข้อมูลการใช้ย้อนหลัง ปริมาณคงเหลือปัจจุบัน Lead Time ของ Supplier
            ความผันผวนของ Demand ระดับความปลอดภัยที่องค์กรกำหนด และ MOQ ของ Supplier
            โดยทุกค่าจะถูกบันทึกไว้เป็น Calculation Snapshot เพื่อใช้ตรวจสอบย้อนหลัง
          </p>
        </div>
        {onClose ? (
          <Button variant="ghost" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="space-y-3 p-5">
        <Accordion title="1. ข้อมูลที่ใช้คำนวณ" defaultOpen>
          <DataTable columns={["Field", "Meaning / Source / Value"]}>
            <InputDataRow
              field="Historical Usage"
              text={`ข้อมูลการใช้หรือเบิกจ่ายย้อนหลังจาก Mock stock movement data: ${formatNumber(recommendation.historicalUsageTotal)} ${unit} / ${recommendation.historicalUsageDays} วัน ใช้คำนวณ Average Demand และ Demand Variability`}
            />
            <InputDataRow
              field="Current Stock"
              text={`Mock inventory balance: ${formatNumber(inventory.currentStock)} ${unit} ใช้หักจาก Target Stock Level เพื่อหา Suggested Quantity`}
            />
            <InputDataRow
              field="Supplier Lead Time"
              text={`Supplier price and lead time record: ${formatNumber(recommendation.supplierLeadTimeDays)} วัน ใช้คำนวณ Adjusted Lead Time, Safety Stock และ Reorder Point`}
            />
            <InputDataRow
              field="Seasonal Factor"
              text={`Formula / Policy setting: ${formatNumber(recommendation.seasonalFactor)} หมายถึงเผื่อผลกระทบจากฤดูกาลหรือ demand สูง`}
            />
            <InputDataRow
              field="Budget Factor"
              text={`Formula / Policy setting: ${formatNumber(recommendation.budgetFactor)} ใช้สะท้อนข้อจำกัดด้านงบประมาณหรือระยะเวลาอนุมัติ`}
            />
            <InputDataRow
              field="Service Level / Z-score"
              text={`Policy setting ${formatNumber(recommendation.serviceLevel * 100)}% → Z-score ${formatNumber(recommendation.zScore)} ใช้คำนวณ Safety Stock`}
            />
            <InputDataRow
              field="MOQ / Unit Price"
              text={`Supplier record: MOQ ${formatNumber(recommendation.moq)} ${unit}, Unit Price ${formatCurrency(recommendation.unitPrice)}/${unit}`}
            />
          </DataTable>
        </Accordion>

        <Accordion title="2. วิธีคำนวณทีละขั้น" defaultOpen>
          <div className="grid grid-cols-2 gap-3">
            <FormulaBox
              title="Step 1: Average Daily Demand"
              body={`Average Daily Demand = ${formatNumber(recommendation.historicalUsageTotal)} / ${recommendation.historicalUsageDays} = ${formatNumber(recommendation.averageDailyDemand)} ${unit}/วัน`}
            />
            <FormulaBox
              title="Step 2: Demand Variability"
              body={`Standard Deviation of historical usage = ${formatNumber(recommendation.demandVariabilityPerPeriod)} ${unit}/period ≈ ${formatNumber(recommendation.demandVariabilityPerDay)} ${unit}/วัน`}
            />
            <FormulaBox
              title="Step 3: Adjusted Lead Time"
              body={`${formatNumber(recommendation.supplierLeadTimeDays)} × ${formatNumber(recommendation.seasonalFactor)} × ${formatNumber(recommendation.budgetFactor)} = ${formatNumber(recommendation.adjustedLeadTimeDays)} วัน`}
            />
            <FormulaBox
              title="Step 4: Safety Stock"
              body={`${formatNumber(recommendation.zScore)} × ${formatNumber(recommendation.demandVariabilityPerDay)} × √${formatNumber(recommendation.adjustedLeadTimeDays)} ≈ ${formatNumber(recommendation.safetyStock)} ${unit}`}
            />
            <FormulaBox
              title="Step 5: Demand During Lead Time"
              body={`${formatNumber(recommendation.averageDailyDemand)} × ${formatNumber(recommendation.adjustedLeadTimeDays)} = ${formatNumber(recommendation.demandDuringLeadTime)} ${unit}`}
            />
            <FormulaBox
              title="Step 6: Reorder Point"
              body={`${formatNumber(recommendation.demandDuringLeadTime)} + ${formatNumber(recommendation.safetyStock)} ≈ ${formatNumber(recommendation.reorderPoint)} ${unit}`}
            />
            <FormulaBox
              title="Step 7: Target Stock Level"
              body={
                recommendation.targetStockLevelSource === "PolicyOverride"
                  ? `Target Stock Level = ${formatNumber(recommendation.targetStockLevel)} ${unit} จาก Policy / Mock Min-Max Target`
                  : `Forecast Demand + Safety Stock = ${formatNumber(recommendation.forecastDemandForPlanningPeriod)} + ${formatNumber(recommendation.safetyStock)} = ${formatNumber(recommendation.targetStockLevel)} ${unit}`
              }
            />
            <FormulaBox
              title="Step 8: AI Suggested Quantity"
              body={`${formatNumber(recommendation.targetStockLevel)} - ${formatNumber(inventory.currentStock)} = ${formatNumber(recommendation.targetStockLevel - inventory.currentStock)} ${unit}; ปัดขึ้นตาม MOQ เป็น ${formatNumber(recommendation.suggestedQuantity)} ${unit}`}
            />
            <FormulaBox
              title="Step 9: Estimated Cost"
              body={`${formatNumber(effectiveRequestedQuantity)} × ${formatCurrency(recommendation.unitPrice)} = ${formatCurrency(effectiveEstimatedCost)}`}
            />
          </div>
        </Accordion>

        <Accordion title="3. ความหมายของค่าที่ได้">
          <div className="grid grid-cols-2 gap-3 text-sm leading-6 text-slate-600">
            <MeaningBox title={`Safety Stock ${formatNumber(recommendation.safetyStock)} ${unit}`} body="ปริมาณสำรองขั้นต่ำเพื่อกันความเสี่ยงจากการใช้จริงที่มากกว่าคาด หรือ Lead Time ที่ยาวกว่าปกติ" />
            <MeaningBox title={`Reorder Point ${formatNumber(recommendation.reorderPoint)} ${unit}`} body="จุดที่ควรเริ่มกระบวนการจัดซื้อหรือเติม stock หาก Current Stock ต่ำกว่าค่านี้ ระบบจะถือว่าควรวางแผนจัดซื้อ" />
            <MeaningBox title={`Target Stock Level ${formatNumber(recommendation.targetStockLevel)} ${unit}`} body="ระดับ stock เป้าหมายหลังเติมของ ตาม policy หรือ Min-Max mock setting ของ PoC" />
            <MeaningBox title={`AI Suggested Quantity ${formatNumber(recommendation.suggestedQuantity)} ${unit}`} body={`จำนวนที่ระบบแนะนำให้เติม เพื่อให้ stock จาก ${formatNumber(inventory.currentStock)} ${unit} ไปถึง target ${formatNumber(recommendation.targetStockLevel)} ${unit}`} />
            <MeaningBox title={`Estimated Cost ${formatCurrency(effectiveEstimatedCost)}`} body="มูลค่าประมาณการของคำขอจริง โดยคำนวณจากจำนวนที่ผู้ใช้ขอ × ราคาต่อหน่วยของ Supplier" />
          </div>
        </Accordion>

        {budget && (preview || snapshot) ? (
          <Accordion title="4. วิธีตรวจงบประมาณและกำหนดเส้นทางอนุมัติ">
            <BudgetRoutingExplanation
              estimatedCost={effectiveEstimatedCost}
              budget={budget}
              routing={preview?.approvalRouting ?? snapshot!.approvalRoutingAtRequestDate}
            />
          </Accordion>
        ) : null}

        {preview || snapshot ? (
          <Accordion title="5. เหตุผลที่ต้องกรอก Override Reason">
            <OverrideExplanation
              suggestedQuantity={recommendation.suggestedQuantity}
              requestedQuantity={effectiveRequestedQuantity}
              variance={
                preview?.variance ?? {
                  variance: snapshot?.quantityVariance ?? 0,
                  variancePercent: snapshot?.quantityVariancePercent ?? 0,
                  isOverride: (snapshot?.quantityVariance ?? 0) !== 0,
                  isOverRequest: (snapshot?.quantityVariance ?? 0) > 0,
                  isUnderRequest: (snapshot?.quantityVariance ?? 0) < 0,
                }
              }
              unit={unit}
            />
          </Accordion>
        ) : null}

        {snapshot ? (
          <Accordion title="6. Calculation Snapshot">
            <CalculationSnapshotView snapshot={snapshot} unit={unit} />
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Snapshot ถูกเก็บเพราะราคา Supplier, Lead Time, Formula Version, Budget, Demand หรือ Service Level อาจเปลี่ยนในอนาคต
              ดังนั้นประวัติย้อนหลังต้องใช้ค่าตามวันที่สร้างคำขอ ไม่ใช่คำนวณใหม่จากข้อมูลปัจจุบัน
            </p>
          </Accordion>
        ) : null}
      </div>
    </Card>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="rounded-lg border border-slate-200 bg-white" open={defaultOpen}>
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-900">{title}</summary>
      <div className="border-t border-slate-100 p-4">{children}</div>
    </details>
  );
}

function InputDataRow({ field, text }: { field: string; text: string }) {
  return (
    <tr>
      <td className="px-4 py-3 font-semibold text-slate-900">{field}</td>
      <td className="px-4 py-3 text-slate-600">{text}</td>
    </tr>
  );
}

function FormulaBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function MeaningBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2">{body}</p>
    </div>
  );
}
