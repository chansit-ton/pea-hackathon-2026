import { Card, StatusBadge } from "./common";
import type { ApprovalRoutingResult, BudgetContext } from "../types";
import { formatCurrency } from "../utils/formatters";

export function BudgetRoutingExplanation({
  estimatedCost,
  budget,
  routing,
}: {
  estimatedCost: number;
  budget: BudgetContext;
  routing: ApprovalRoutingResult;
}) {
  const layerLabels: Record<string, string> = {
    Local: "ระดับคลังพื้นที่",
    Regional: "ระดับเขต",
    Central: "ระดับส่วนกลาง",
  };
  const rows = [
    { label: "งบคงเหลือระดับคลังพื้นที่", value: budget.localBudgetRemaining, enough: routing.localEnough },
    { label: "งบคงเหลือระดับเขต", value: budget.regionalBudgetRemaining, enough: routing.regionalEnough },
    { label: "งบคงเหลือส่วนกลาง", value: budget.centralBudgetRemaining, enough: routing.centralEnough },
  ];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-950">เส้นทางการอนุมัติ</h3>
          <p className="mt-1 text-sm text-slate-500">ระบบตรวจมูลค่าประมาณการกับงบประมาณ 3 ชั้น</p>
        </div>
        <StatusBadge status={routing.layer === "Local" ? "Normal" : "Pending Regional"} />
      </div>
      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        มูลค่าประมาณการ = {formatCurrency(estimatedCost)}
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm">
            <span className="text-slate-600">{row.label}</span>
            <span className={row.enough ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>
              {formatCurrency(row.value)} · {row.enough ? "เพียงพอ" : "ไม่เพียงพอ"}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm font-medium text-slate-800">ระดับอนุมัติที่แนะนำ = {layerLabels[routing.layer] ?? routing.layer}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{routing.reason}</p>
    </Card>
  );
}
