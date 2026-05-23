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
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">คำอธิบายการคำนวณ</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">ที่มาและเหตุผลของคำแนะนำจากระบบ</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            ระบบคำนวณคำแนะนำจากประวัติการใช้ย้อนหลัง ปริมาณคงเหลือปัจจุบัน ระยะเวลาส่งมอบของซัพพลายเออร์
            ความผันผวนของการใช้ ระดับความมั่นใจที่องค์กรกำหนด และ MOQ ของซัพพลายเออร์
            โดยค่าที่ใช้สร้างคำขอจะถูกบันทึกเป็นภาพบันทึกการคำนวณเพื่อใช้ตรวจสอบย้อนหลัง
          </p>
        </div>
        {onClose ? (
          <Button variant="ghost" onClick={onClose} title="ปิด">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="space-y-3 p-5">
        <Accordion title="1. ข้อมูลที่ใช้คำนวณ" defaultOpen>
          <DataTable columns={["รายการข้อมูล", "ความหมาย / แหล่งที่มา / ค่า"]}>
            <InputDataRow
              field="ประวัติการใช้ย้อนหลัง"
              text={`ข้อมูลการใช้หรือเบิกจ่ายย้อนหลังจากข้อมูลจำลองการเคลื่อนไหวสต็อก: ${formatNumber(recommendation.historicalUsageTotal)} ${unit} / ${recommendation.historicalUsageDays} วัน ใช้คำนวณค่าเฉลี่ยการใช้และความผันผวน`}
            />
            <InputDataRow
              field="ปริมาณคงเหลือปัจจุบัน"
              text={`ข้อมูลสต็อกตั้งต้นในต้นแบบ: ${formatNumber(inventory.currentStock)} ${unit} ใช้หักจากระดับสต็อกเป้าหมายเพื่อหาจำนวนที่ควรเติม`}
            />
            <InputDataRow
              field="ระยะเวลาส่งมอบของซัพพลายเออร์"
              text={`ข้อมูลจากราคาและระยะเวลาส่งมอบของซัพพลายเออร์: ${formatNumber(recommendation.supplierLeadTimeDays)} วัน ใช้คำนวณระยะเวลาส่งมอบที่ปรับแล้ว สต็อกสำรอง และจุดสั่งซื้อ`}
            />
            <InputDataRow
              field="ตัวคูณฤดูกาล"
              text={`ค่ากลางจาก policy: ${formatNumber(recommendation.seasonalFactor)} ใช้เผื่อผลกระทบจากฤดูกาลหรือช่วงความต้องการสูง`}
            />
            <InputDataRow
              field="ตัวคูณข้อจำกัดงบประมาณ"
              text={`ค่ากลางจาก policy: ${formatNumber(recommendation.budgetFactor)} ใช้สะท้อนผลกระทบจากรอบงบประมาณหรือขั้นตอนอนุมัติ`}
            />
            <InputDataRow
              field="ระดับความมั่นใจ / Z-score"
              text={`ระดับความมั่นใจ ${formatNumber(recommendation.serviceLevel * 100)}% แปลงเป็น Z-score ${formatNumber(recommendation.zScore)} เพื่อใช้คำนวณสต็อกสำรอง`}
            />
            <InputDataRow
              field="ปริมาณสั่งขั้นต่ำ / ราคาต่อหน่วย"
              text={`ข้อมูลจากซัพพลายเออร์: ปริมาณสั่งขั้นต่ำ ${formatNumber(recommendation.moq)} ${unit}, ราคาต่อหน่วย ${formatCurrency(recommendation.unitPrice)}/${unit}`}
            />
          </DataTable>
        </Accordion>

        <Accordion title="2. วิธีคำนวณทีละขั้น" defaultOpen>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <FormulaBox
              title="ขั้นที่ 1: ค่าเฉลี่ยการใช้ต่อวัน"
              body={`ค่าเฉลี่ยการใช้ต่อวัน = ${formatNumber(recommendation.historicalUsageTotal)} / ${recommendation.historicalUsageDays} = ${formatNumber(recommendation.averageDailyDemand)} ${unit}/วัน`}
            />
            <FormulaBox
              title="ขั้นที่ 2: ความผันผวนของการใช้"
              body={`ส่วนเบี่ยงเบนมาตรฐานของการใช้ย้อนหลัง = ${formatNumber(recommendation.demandVariabilityPerPeriod)} ${unit}/งวด หรือประมาณ ${formatNumber(recommendation.demandVariabilityPerDay)} ${unit}/วัน`}
            />
            <FormulaBox
              title="ขั้นที่ 3: ระยะเวลาส่งมอบที่ปรับแล้ว"
              body={`${formatNumber(recommendation.supplierLeadTimeDays)} × ${formatNumber(recommendation.seasonalFactor)} × ${formatNumber(recommendation.budgetFactor)} = ${formatNumber(recommendation.adjustedLeadTimeDays)} วัน`}
            />
            <FormulaBox
              title="ขั้นที่ 4: สต็อกสำรอง"
              body={`${formatNumber(recommendation.zScore)} × ${formatNumber(recommendation.demandVariabilityPerDay)} × √${formatNumber(recommendation.adjustedLeadTimeDays)} ≈ ${formatNumber(recommendation.safetyStock)} ${unit}`}
            />
            <FormulaBox
              title="ขั้นที่ 5: ความต้องการระหว่างรอของ"
              body={`${formatNumber(recommendation.averageDailyDemand)} × ${formatNumber(recommendation.adjustedLeadTimeDays)} = ${formatNumber(recommendation.demandDuringLeadTime)} ${unit}`}
            />
            <FormulaBox
              title="ขั้นที่ 6: จุดสั่งซื้อ"
              body={`${formatNumber(recommendation.demandDuringLeadTime)} + ${formatNumber(recommendation.safetyStock)} ≈ ${formatNumber(recommendation.reorderPoint)} ${unit}`}
            />
            <FormulaBox
              title="ขั้นที่ 7: ระดับสต็อกเป้าหมาย"
              body={
                recommendation.targetStockLevelSource === "PolicyOverride"
                  ? `ระดับสต็อกเป้าหมาย = ${formatNumber(recommendation.targetStockLevel)} ${unit} จากนโยบายเป้าหมายจำลอง`
                  : `ความต้องการคาดการณ์ + สต็อกสำรอง = ${formatNumber(recommendation.forecastDemandForPlanningPeriod)} + ${formatNumber(recommendation.safetyStock)} = ${formatNumber(recommendation.targetStockLevel)} ${unit}`
              }
            />
            <FormulaBox
              title="ขั้นที่ 8: จำนวนที่ระบบแนะนำ"
              body={`${formatNumber(recommendation.targetStockLevel)} - ${formatNumber(inventory.currentStock)} = ${formatNumber(recommendation.targetStockLevel - inventory.currentStock)} ${unit}; ปัดขึ้นตามปริมาณสั่งขั้นต่ำเป็น ${formatNumber(recommendation.suggestedQuantity)} ${unit}`}
            />
            <FormulaBox
              title="ขั้นที่ 9: มูลค่าประมาณการ"
              body={`${formatNumber(effectiveRequestedQuantity)} × ${formatCurrency(recommendation.unitPrice)} = ${formatCurrency(effectiveEstimatedCost)}`}
            />
          </div>
        </Accordion>

        <Accordion title="3. ความหมายของค่าที่ได้">
          <div className="grid grid-cols-1 gap-3 text-sm leading-6 text-slate-600 lg:grid-cols-2">
            <MeaningBox title={`สต็อกสำรอง ${formatNumber(recommendation.safetyStock)} ${unit}`} body="ปริมาณสำรองขั้นต่ำเพื่อกันความเสี่ยงจากการใช้จริงที่มากกว่าคาด หรือระยะเวลาส่งมอบที่ยาวกว่าปกติ" />
            <MeaningBox title={`จุดสั่งซื้อ ${formatNumber(recommendation.reorderPoint)} ${unit}`} body="ระดับสต็อกที่ควรเริ่มกระบวนการจัดซื้อหรือเติมของ หากสต็อกต่ำกว่าค่านี้จะมีความเสี่ยงขาดของระหว่างรอส่งมอบ" />
            <MeaningBox title={`ระดับสต็อกเป้าหมาย ${formatNumber(recommendation.targetStockLevel)} ${unit}`} body="ระดับสต็อกหลังเติมของตามนโยบาย หรือการคำนวณจากความต้องการคาดการณ์รวมสต็อกสำรอง" />
            <MeaningBox title={`จำนวนที่ระบบแนะนำ ${formatNumber(recommendation.suggestedQuantity)} ${unit}`} body={`จำนวนที่ควรเติมเพื่อให้สต็อกจาก ${formatNumber(inventory.currentStock)} ${unit} ไปถึงเป้าหมาย ${formatNumber(recommendation.targetStockLevel)} ${unit}`} />
            <MeaningBox title={`มูลค่าประมาณการ ${formatCurrency(effectiveEstimatedCost)}`} body="มูลค่าของคำขอจริง คำนวณจากจำนวนที่ผู้ใช้ขอคูณราคาต่อหน่วยของซัพพลายเออร์" />
          </div>
        </Accordion>

        {budget && (preview || snapshot) ? (
          <Accordion title="4. วิธีตรวจงบประมาณและเส้นทางอนุมัติ">
            <BudgetRoutingExplanation
              estimatedCost={effectiveEstimatedCost}
              budget={budget}
              routing={preview?.approvalRouting ?? snapshot!.approvalRoutingAtRequestDate}
            />
          </Accordion>
        ) : null}

        {preview || snapshot ? (
          <Accordion title="5. เหตุผลที่ต้องกรอกเมื่อขอต่างจากระบบ">
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
          <Accordion title="6. ภาพบันทึกการคำนวณ">
            <CalculationSnapshotView snapshot={snapshot} unit={unit} />
            <p className="mt-3 text-sm leading-6 text-slate-500">
              ภาพบันทึกการคำนวณถูกเก็บเพราะราคา ระยะเวลาส่งมอบ เวอร์ชันสูตร งบประมาณ ความต้องการใช้ หรือระดับความมั่นใจอาจเปลี่ยนในอนาคต
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
