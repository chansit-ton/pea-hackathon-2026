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
  const rawSuggestedQuantity = recommendation.targetStockLevel - inventory.currentStock;
  const targetSource =
    recommendation.targetStockLevelSource === "PolicyOverride"
      ? "เกณฑ์เป้าหมายกลาง / Min-Max ของ PoC"
      : "ความต้องการคาดการณ์ (Forecast Demand) + ระดับพัสดุสำรองปลอดภัย";

  return (
    <Card className="border-blue-200">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">คำอธิบายการคำนวณ</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">คำอธิบายวิธีคำนวณและที่มาของคำแนะนำ</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            ระบบคำนวณคำแนะนำนี้จากข้อมูลการใช้ย้อนหลัง, สต็อกปัจจุบัน (Current Stock), ระยะเวลารอพัสดุ (Lead Time),
            ความผันผวนของการใช้งาน, เกณฑ์กลางขององค์กร และจำนวนสั่งซื้อขั้นต่ำ (MOQ) ของซัพพลายเออร์ (Supplier)
            โดยค่าที่ใช้สร้างคำขอจะถูกบันทึกเป็นบันทึกค่าคำนวณ ณ วันที่ขอ (Calculation Snapshot) เพื่อใช้ตรวจสอบย้อนหลัง
          </p>
        </div>
        {onClose ? (
          <Button variant="ghost" onClick={onClose} title="ปิด">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="space-y-3 p-5">
        <Accordion title="1. สรุปแบบเข้าใจง่าย" defaultOpen>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            <p className="font-semibold">ระบบแนะนำให้ขอเพิ่ม {formatNumber(recommendation.suggestedQuantity)} {unit} เพราะ:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>คลังมีสต็อกปัจจุบัน (Current Stock) {formatNumber(inventory.currentStock)} {unit}</li>
              <li>ระดับสต็อกเป้าหมาย (Target Stock Level) คือ {formatNumber(recommendation.targetStockLevel)} {unit} จาก {targetSource}</li>
              <li>ส่วนที่ต้องเติมก่อนปัดตามจำนวนสั่งซื้อขั้นต่ำ (MOQ) คือ {formatNumber(rawSuggestedQuantity)} {unit}</li>
              <li>ซัพพลายเออร์ (Supplier) ที่เลือกมีจำนวนสั่งซื้อขั้นต่ำ (MOQ) {formatNumber(recommendation.moq)} {unit}</li>
              <li>ดังนั้นจำนวนที่ระบบแนะนำคือ {formatNumber(recommendation.suggestedQuantity)} {unit}</li>
            </ol>
            <p className="mt-3">
              ระบบนี้เป็นระบบช่วยตัดสินใจด้วย AI (AI-assisted decision support): ช่วยคำนวณและอธิบายเหตุผล
              แต่ผู้ใช้ยังสามารถขอแตกต่างจากค่าที่ระบบแนะนำได้โดยต้องบันทึกเหตุผล
            </p>
          </div>
        </Accordion>

        <Accordion title="2. ข้อมูลที่ใช้คำนวณ">
          <DataTable columns={["ข้อมูล", "ความหมาย / แหล่งที่มา / ค่าที่ใช้"]}>
            <InputDataRow
              field="ข้อมูลการใช้ย้อนหลัง (Historical Usage)"
              text={`ข้อมูลการเบิกจ่ายย้อนหลังจาก mock stock movement: ${formatNumber(recommendation.historicalUsageTotal)} ${unit} / ${recommendation.historicalUsageDays} วัน ใช้คำนวณค่าเฉลี่ยการใช้ต่อวันและความผันผวนของความต้องการใช้`}
            />
            <InputDataRow
              field="สต็อกปัจจุบัน (Current Stock)"
              text={`ข้อมูลคงเหลือปัจจุบันของคลัง: ${formatNumber(inventory.currentStock)} ${unit} ใช้หักจากระดับสต็อกเป้าหมายเพื่อหาจำนวนที่ควรเติม`}
            />
            <InputDataRow
              field="ระยะเวลารอพัสดุ (Lead Time)"
              text={`ข้อมูลจากราคาและระยะเวลารอพัสดุของซัพพลายเออร์: ${formatNumber(recommendation.supplierLeadTimeDays)} วัน ใช้คำนวณระยะเวลารอพัสดุที่ปรับแล้ว, ระดับพัสดุสำรองปลอดภัย และจุดสั่งซื้อใหม่`}
            />
            <InputDataRow
              field="ตัวคูณฤดูกาล / ตัวคูณงบประมาณ"
              text={`ค่ากลางจากนโยบายสูตรคำนวณ (Formula Policy): ${formatNumber(recommendation.seasonalFactor)} และ ${formatNumber(recommendation.budgetFactor)} ใช้ปรับระยะเวลารอพัสดุให้สะท้อนฤดูกาลและขั้นตอนงบประมาณ`}
            />
            <InputDataRow
              field="ระดับความมั่นใจ / ค่า Z-score"
              text={`ระดับความมั่นใจ (Service Level) ${formatNumber(recommendation.serviceLevel * 100)}% แปลงเป็นค่า Z-score ${formatNumber(recommendation.zScore)} เพื่อคำนวณระดับพัสดุสำรองปลอดภัย`}
            />
            <InputDataRow
              field="จำนวนสั่งซื้อขั้นต่ำ (MOQ) / ราคาต่อหน่วย"
              text={`ข้อมูลจากซัพพลายเออร์: MOQ ${formatNumber(recommendation.moq)} ${unit}, ราคาต่อหน่วย ${formatCurrency(recommendation.unitPrice)}/${unit} ใช้ปัดจำนวนแนะนำและคำนวณมูลค่าประมาณการ`}
            />
          </DataTable>
        </Accordion>

        <Accordion title="3. รายละเอียดสูตรคำนวณ">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {/* แยกสูตร ตัวอย่าง และความหมาย เพื่อให้ผู้ใช้ตรวจที่มาของตัวเลขได้ทีละขั้น */}
            <FormulaBox
              title="ขั้นที่ 1: ค่าเฉลี่ยการใช้ต่อวัน (Average Daily Demand)"
              formula="ค่าเฉลี่ยการใช้ต่อวัน = ปริมาณการใช้ย้อนหลังรวม / จำนวนวันย้อนหลัง"
              calculation={`${formatNumber(recommendation.historicalUsageTotal)} / ${recommendation.historicalUsageDays} = ${formatNumber(recommendation.averageDailyDemand)} ${unit}/วัน`}
              meaning="บอกว่าคลังนี้ใช้พัสดุเฉลี่ยวันละเท่าไร และใช้ต่อในการคำนวณความต้องการระหว่างรอพัสดุ"
            />
            <FormulaBox
              title="ขั้นที่ 2: ความผันผวนของการใช้ (Demand Variability)"
              formula="ความผันผวนของการใช้ = ส่วนเบี่ยงเบนมาตรฐานของข้อมูลการใช้ย้อนหลัง"
              calculation={`${formatNumber(recommendation.demandVariabilityPerPeriod)} ${unit}/งวด หรือประมาณ ${formatNumber(recommendation.demandVariabilityPerDay)} ${unit}/วัน`}
              meaning="ถ้าการใช้พัสดุแกว่งมาก ระบบจะเพิ่มระดับพัสดุสำรองปลอดภัยให้สูงขึ้นเพื่อลดความเสี่ยงขาดสต็อก"
            />
            <FormulaBox
              title="ขั้นที่ 3: ระยะเวลารอพัสดุที่ปรับแล้ว (Adjusted Lead Time)"
              formula="ระยะเวลารอพัสดุที่ปรับแล้ว = ระยะเวลารอพัสดุของซัพพลายเออร์ (Supplier Lead Time) × ตัวคูณฤดูกาล × ตัวคูณงบประมาณ"
              calculation={`${formatNumber(recommendation.supplierLeadTimeDays)} × ${formatNumber(recommendation.seasonalFactor)} × ${formatNumber(recommendation.budgetFactor)} = ${formatNumber(recommendation.adjustedLeadTimeDays)} วัน`}
              meaning="ใช้ประเมินเวลารอพัสดุจริงหลังเผื่อฤดูกาลและข้อจำกัดด้านงบประมาณ"
            />
            <FormulaBox
              title="ขั้นที่ 4: ระดับพัสดุสำรองปลอดภัย (Safety Stock)"
              formula="ระดับพัสดุสำรองปลอดภัย (Safety Stock) = Z-score × ความผันผวนของการใช้ต่อวัน × √ระยะเวลารอพัสดุที่ปรับแล้ว"
              calculation={`${formatNumber(recommendation.zScore)} × ${formatNumber(recommendation.demandVariabilityPerDay)} × √${formatNumber(recommendation.adjustedLeadTimeDays)} ≈ ${formatNumber(recommendation.safetyStock)} ${unit}`}
              meaning="เป็นปริมาณสำรองขั้นต่ำเพื่อรองรับการใช้จริงที่มากกว่าคาดหรือการส่งมอบที่ช้ากว่าปกติ"
            />
            <FormulaBox
              title="ขั้นที่ 5: ความต้องการใช้ระหว่างรอพัสดุ (Demand During Lead Time)"
              formula="ความต้องการใช้ระหว่างรอพัสดุ = ค่าเฉลี่ยการใช้ต่อวัน × ระยะเวลารอพัสดุที่ปรับแล้ว"
              calculation={`${formatNumber(recommendation.averageDailyDemand)} × ${formatNumber(recommendation.adjustedLeadTimeDays)} = ${formatNumber(recommendation.demandDuringLeadTime)} ${unit}`}
              meaning="บอกว่าระหว่างรอของเข้าคลัง คาดว่าจะถูกเบิกใช้ไปกี่หน่วย"
            />
            <FormulaBox
              title="ขั้นที่ 6: จุดสั่งซื้อใหม่ (Reorder Point)"
              formula="จุดสั่งซื้อใหม่ = ความต้องการใช้ระหว่างรอพัสดุ + ระดับพัสดุสำรองปลอดภัย"
              calculation={`${formatNumber(recommendation.demandDuringLeadTime)} + ${formatNumber(recommendation.safetyStock)} ≈ ${formatNumber(recommendation.reorderPoint)} ${unit}`}
              meaning="ถ้าสต็อกต่ำกว่าค่านี้ ระบบควรเตือนให้เริ่มกระบวนการจัดซื้อหรือเติมพัสดุ"
            />
            <FormulaBox
              title="ขั้นที่ 7: ระดับสต็อกเป้าหมาย (Target Stock Level)"
              formula="ระดับสต็อกเป้าหมาย = ความต้องการคาดการณ์ + ระดับพัสดุสำรองปลอดภัย หรือใช้ค่าเป้าหมายจากนโยบาย"
              calculation={`${formatNumber(recommendation.targetStockLevel)} ${unit} จาก ${targetSource}`}
              meaning="เป็นระดับสต็อกที่คลังควรมีหลังเติมของแล้ว เพื่อรองรับรอบวางแผนถัดไป"
            />
            <FormulaBox
              title="ขั้นที่ 8: จำนวนที่ระบบแนะนำ (AI Suggested Quantity)"
              formula="จำนวนที่ระบบแนะนำ = ระดับสต็อกเป้าหมาย - สต็อกปัจจุบัน แล้วปัดขึ้นตามจำนวนสั่งซื้อขั้นต่ำ (MOQ)"
              calculation={`${formatNumber(recommendation.targetStockLevel)} - ${formatNumber(inventory.currentStock)} = ${formatNumber(rawSuggestedQuantity)} ${unit}; ปัดตาม MOQ เป็น ${formatNumber(recommendation.suggestedQuantity)} ${unit}`}
              meaning="เป็นจำนวนตั้งต้นสำหรับสร้างคำขอจัดซื้อ ผู้ใช้แก้ได้ แต่ถ้าขอต่างจากค่านี้ต้องระบุเหตุผล"
            />
            <FormulaBox
              title="ขั้นที่ 9: มูลค่าประมาณการ (Estimated Cost)"
              formula="มูลค่าประมาณการ = จำนวนที่ผู้ใช้ขอจริง × ราคาต่อหน่วยของซัพพลายเออร์"
              calculation={`${formatNumber(effectiveRequestedQuantity)} × ${formatCurrency(recommendation.unitPrice)} = ${formatCurrency(effectiveEstimatedCost)}`}
              meaning="ใช้ตรวจงบประมาณ 3 ชั้น และกำหนดว่าจะส่งคำขอไปอนุมัติระดับใด"
            />
          </div>
        </Accordion>

        <Accordion title="4. ความหมายของค่าที่ได้">
          <div className="grid grid-cols-1 gap-3 text-sm leading-6 text-slate-600 lg:grid-cols-2">
            <MeaningBox title={`ระดับพัสดุสำรองปลอดภัย (Safety Stock) ${formatNumber(recommendation.safetyStock)} ${unit}`} body="ปริมาณสำรองขั้นต่ำเพื่อกันความเสี่ยงจากการใช้จริงที่มากกว่าคาด หรือระยะเวลารอพัสดุที่ยาวกว่าปกติ" />
            <MeaningBox title={`จุดสั่งซื้อใหม่ (Reorder Point) ${formatNumber(recommendation.reorderPoint)} ${unit}`} body="ระดับสต็อกที่ควรเริ่มกระบวนการจัดซื้อ หากต่ำกว่านี้มีความเสี่ยงว่าของจะหมดก่อนพัสดุใหม่มาถึง" />
            <MeaningBox title={`ระดับสต็อกเป้าหมาย (Target Stock Level) ${formatNumber(recommendation.targetStockLevel)} ${unit}`} body="ระดับสต็อกเป้าหมายหลังเติมของ ตามนโยบายกลาง หรือความต้องการคาดการณ์รวมกับระดับพัสดุสำรองปลอดภัย" />
            <MeaningBox title={`จำนวนที่ระบบแนะนำ (AI Suggested Quantity) ${formatNumber(recommendation.suggestedQuantity)} ${unit}`} body={`จำนวนที่ระบบแนะนำให้เติม เพื่อให้สต็อกจาก ${formatNumber(inventory.currentStock)} ${unit} ไปถึงเป้าหมาย ${formatNumber(recommendation.targetStockLevel)} ${unit}`} />
            <MeaningBox title={`มูลค่าประมาณการ (Estimated Cost) ${formatCurrency(effectiveEstimatedCost)}`} body="มูลค่าประมาณการของคำขอจริง ใช้ตรวจงบประมาณและกำหนดเส้นทางการอนุมัติ" />
          </div>
        </Accordion>

        {budget && (preview || snapshot) ? (
          <Accordion title="5. เส้นทางการอนุมัติ">
            <BudgetRoutingExplanation
              estimatedCost={effectiveEstimatedCost}
              budget={budget}
              routing={preview?.approvalRouting ?? snapshot!.approvalRoutingAtRequestDate}
            />
          </Accordion>
        ) : null}

        {preview || snapshot ? (
          <Accordion title="6. เหตุผลที่ต้องกรอกเมื่อขอแตกต่างจากค่าที่ระบบแนะนำ">
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
          <Accordion title="7. บันทึกค่าคำนวณ ณ วันที่ขอ (Calculation Snapshot)">
            <CalculationSnapshotView snapshot={snapshot} unit={unit} />
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Calculation Snapshot คือการเก็บค่าที่ระบบใช้คำนวณ ณ วันที่สร้างคำขอ เพราะราคาซัพพลายเออร์, ระยะเวลารอพัสดุ,
              เวอร์ชันสูตร, ระดับความมั่นใจ, งบประมาณ หรือความต้องการใช้ อาจเปลี่ยนในอนาคต ดังนั้นประวัติย้อนหลังต้องอ่านค่าจาก Snapshot ไม่ใช่คำนวณใหม่
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

function FormulaBox({
  title,
  formula,
  calculation,
  meaning,
}: {
  title: string;
  formula: string;
  calculation: string;
  meaning: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
        <p>
          <span className="font-semibold text-slate-800">สูตร:</span> {formula}
        </p>
        <p>
          <span className="font-semibold text-slate-800">ตัวอย่างคำนวณ:</span> {calculation}
        </p>
        <p>
          <span className="font-semibold text-slate-800">ความหมาย:</span> {meaning}
        </p>
      </div>
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
