import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  History,
  Mail,
  Phone,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { ApprovalTimelineItem, RequestStatus, StockStatus, Supplier } from "../types";
import { formatCurrency, formatNumber as formatThaiNumber } from "../utils/formatters";

export function formatTHB(value: number) {
  return formatCurrency(value);
}

export function formatNumber(value: number) {
  return formatThaiNumber(value);
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>;
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: "bg-blue-700 text-white hover:bg-blue-800 border-blue-700",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border-slate-300",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border-transparent",
    danger: "bg-red-600 text-white hover:bg-red-700 border-red-600",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600",
  };

  return (
    <button
      {...props}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function MetricCard({
  label,
  value,
  helper,
  tone = "slate",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "slate" | "red" | "blue" | "purple" | "green";
}) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-950",
    red: "border-red-200 bg-red-50 text-red-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    purple: "border-violet-200 bg-violet-50 text-violet-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${tones[tone]}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="text-3xl font-semibold tracking-normal">{value}</p>
        <span className="text-xs font-medium text-slate-500">{helper}</span>
      </div>
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: StockStatus | RequestStatus | "VMI Candidate" | "Normal" | "Budget OK" | "Budget Gap";
}) {
  const styles: Record<string, string> = {
    Normal: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Near Reorder Point": "bg-amber-50 text-amber-700 ring-amber-200",
    Critical: "bg-red-50 text-red-700 ring-red-200",
    "Pending Local": "bg-blue-50 text-blue-700 ring-blue-200",
    "Pending Regional": "bg-blue-50 text-blue-700 ring-blue-200",
    "Pending Central": "bg-blue-50 text-blue-700 ring-blue-200",
    "More Info": "bg-amber-50 text-amber-700 ring-amber-200",
    Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Rejected: "bg-red-50 text-red-700 ring-red-200",
    Draft: "bg-slate-100 text-slate-600 ring-slate-200",
    "VMI Candidate": "bg-violet-50 text-violet-700 ring-violet-200",
    "Budget OK": "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Budget Gap": "bg-red-50 text-red-700 ring-red-200",
  };
  const labels: Record<string, string> = {
    Normal: "ปกติ",
    "Near Reorder Point": "ใกล้จุดสั่งซื้อ",
    Critical: "วิกฤต",
    "Pending Local": "รออนุมัติคลัง",
    "Pending Regional": "รออนุมัติเขต",
    "Pending Central": "รออนุมัติส่วนกลาง",
    "More Info": "ขอข้อมูลเพิ่ม",
    Approved: "อนุมัติแล้ว",
    Rejected: "ไม่อนุมัติ",
    Draft: "แบบร่าง",
    "VMI Candidate": "เหมาะกับ VMI",
    "Budget OK": "งบเพียงพอ",
    "Budget Gap": "งบไม่พอ",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status]}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function DataTable({
  columns,
  children,
  empty,
}: {
  columns: string[];
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="table-scroll overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">{empty ? <EmptyRow colSpan={columns.length} /> : children}</tbody>
      </table>
    </div>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
        ไม่มีข้อมูลสำหรับเงื่อนไขนี้
      </td>
    </tr>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600";

export const textareaClass =
  "min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600";

export function BudgetCheckCard({
  label,
  remaining,
  required,
}: {
  label: string;
  remaining: number;
  required: number;
}) {
  const ok = required <= remaining;
  const percent = remaining > 0 ? Math.min((required / remaining) * 100, 100) : 100;
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="mt-1 text-xs text-slate-500">งบคงเหลือ {formatTHB(remaining)}</p>
        </div>
        <StatusBadge status={ok ? "Budget OK" : "Budget Gap"} />
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-200">
        <div className={`h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">มูลค่าที่ต้องใช้ {formatTHB(required)}</p>
    </div>
  );
}

export function SupplierContactCard({
  supplier,
  onCopy,
}: {
  supplier: Supplier;
  onCopy?: (value: string) => void;
}) {
  const regionLabels: Record<string, string> = {
    North: "ภาคเหนือ",
    Northeast: "ภาคตะวันออกเฉียงเหนือ",
    East: "ภาคตะวันออก",
    South: "ภาคใต้",
    National: "ทั่วประเทศ",
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-950">{supplier.name}</p>
          <p className="mt-1 text-sm text-slate-500">{supplier.contactPerson} · {regionLabels[supplier.coverage] ?? supplier.coverage}</p>
        </div>
        <StatusBadge status="Normal" />
      </div>
      <div className="mt-4 grid gap-2 text-sm text-slate-700">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-slate-400" />
          <span>{supplier.phone}</span>
          <button className="ml-auto text-slate-400 hover:text-slate-700" title="คัดลอกเบอร์โทร" onClick={() => onCopy?.(supplier.phone)}>
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          <span>{supplier.email}</span>
          <button className="ml-auto text-slate-400 hover:text-slate-700" title="คัดลอกอีเมล" onClick={() => onCopy?.(supplier.email)}>
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">รหัส Line: {supplier.lineId}</p>
    </Card>
  );
}

export function ApprovalTimeline({ items }: { items: ApprovalTimelineItem[] }) {
  const roleLabels: Record<string, string> = {
    "Local Warehouse": "คลังพื้นที่",
    Regional: "ระดับเขต",
    "Regional Review": "ผู้ตรวจระดับเขต",
    Central: "ส่วนกลาง",
    "Central Procurement": "จัดซื้อส่วนกลาง",
  };
  const actionLabels: Record<string, string> = {
    Submitted: "ส่งคำขอ",
    "Draft Created": "สร้างแบบร่าง",
    "Waiting Review": "รอตรวจสอบ",
    Approved: "อนุมัติ",
    Approve: "อนุมัติ",
    Rejected: "ไม่อนุมัติ",
    "Request More Info": "ขอข้อมูลเพิ่มเติม",
    "Approve & Pass to Central": "อนุมัติส่งต่อส่วนกลาง",
    "Central Approve": "ส่วนกลางอนุมัติ",
    "Central Reject": "ส่วนกลางไม่อนุมัติ",
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.role}-${item.date}-${index}`} className="flex gap-3">
          <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            {item.action.includes("Approved") || item.action.includes("Approve") ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : item.action.includes("Reject") ? (
              <XCircle className="h-4 w-4 text-red-600" />
            ) : item.action.includes("Submitted") ? (
              <History className="h-4 w-4 text-blue-600" />
            ) : (
              <Clock3 className="h-4 w-4 text-slate-500" />
            )}
          </div>
          <div className="min-w-0 border-b border-slate-100 pb-3">
            <p className="text-sm font-semibold text-slate-900">{roleLabels[item.role] ?? item.role} · {actionLabels[item.action] ?? item.action}</p>
            <p className="mt-1 text-xs text-slate-500">{item.actor} · {item.date}</p>
            {item.note ? <p className="mt-1 text-sm text-slate-600">{item.note}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalculationStepCard({
  step,
  title,
  formula,
  result,
  tone = "blue",
}: {
  step: string;
  title: string;
  formula: string;
  result: string;
  tone?: "blue" | "green" | "amber" | "purple";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-violet-50 text-violet-700",
  };
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{step}</span>
        <div>
          <h3 className="font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm text-slate-500">{formula}</p>
          <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">{result}</p>
        </div>
      </div>
    </Card>
  );
}

export function InlineAlert({
  children,
  tone = "warning",
}: {
  children: ReactNode;
  tone?: "warning" | "danger" | "info" | "success";
}) {
  const tones = {
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    danger: "border-red-200 bg-red-50 text-red-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}>
      {tone === "success" ? <ShieldCheck className="mt-0.5 h-4 w-4" /> : <AlertTriangle className="mt-0.5 h-4 w-4" />}
      <div>{children}</div>
    </div>
  );
}
