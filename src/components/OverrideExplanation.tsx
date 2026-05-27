import { AlertTriangle } from "lucide-react";
import { Card } from "./common";
import type { QuantityVarianceResult } from "../types";
import { formatNumber, formatPercent } from "../utils/formatters";

export function OverrideExplanation({
  suggestedQuantity,
  requestedQuantity,
  variance,
  unit,
}: {
  suggestedQuantity: number;
  requestedQuantity: number;
  variance: QuantityVarianceResult;
  unit: string;
}) {
  if (!variance.isOverride) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold text-slate-950">เหตุผลที่ต้องกรอกเมื่อขอแตกต่างจากค่าที่ระบบแนะนำ</h3>
        <p className="mt-2 text-sm text-slate-600">จำนวนที่ขอตรงกับจำนวนที่ระบบแนะนำ จึงไม่ต้องกรอกเหตุผลเพิ่มเติม</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-950">เหตุผลที่ต้องกรอกเมื่อขอแตกต่างจากค่าที่ระบบแนะนำ</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            จำนวนที่ระบบแนะนำ = {formatNumber(suggestedQuantity)} {unit}, จำนวนที่ผู้ใช้ขอ = {formatNumber(requestedQuantity)} {unit}
          </p>
          <p className="text-sm leading-6 text-slate-600">
            ส่วนต่าง = {formatNumber(requestedQuantity)} - {formatNumber(suggestedQuantity)} ={" "}
            {variance.variance > 0 ? "+" : ""}
            {formatNumber(variance.variance)} {unit} ({formatPercent(variance.variancePercent)})
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {variance.isOverRequest
              ? "คุณกำลังขอจำนวนมากกว่าค่าที่ระบบแนะนำ ระบบจึงต้องการเหตุผลประกอบ เพื่อให้ผู้อนุมัติพิจารณาผลกระทบด้านงบประมาณ พื้นที่จัดเก็บ และความเสี่ยงสต็อกเกิน"
              : "คุณกำลังขอจำนวนน้อยกว่าค่าที่ระบบแนะนำ ซึ่งอาจทำให้ Stock ต่ำกว่าระดับพัสดุสำรองปลอดภัย หรือเกิดความเสี่ยงขาดแคลนในรอบถัดไป จึงต้องระบุเหตุผลประกอบ"}
          </p>
        </div>
      </div>
    </Card>
  );
}
