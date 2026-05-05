import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  Mail,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  Workflow,
} from "lucide-react";
import {
  centralBudgetRemaining,
  c01CalculationSnapshot,
  formulaList,
  formulaVersion,
  initialContactLogs,
  initialRequests,
  inventoryRecords,
  regionalBudgets,
  skus,
  supplierOffers,
  suppliers,
  vmiCandidates,
  vmiComparison,
  warehouses,
} from "./data/mockData";
import {
  ApprovalTimeline,
  BudgetCheckCard,
  Button,
  CalculationStepCard,
  Card,
  DataTable,
  Field,
  InlineAlert,
  MetricCard,
  SectionHeader,
  StatusBadge,
  SupplierContactCard,
  formatNumber,
  formatTHB,
  inputClass,
  textareaClass,
} from "./components/common";
import type {
  ApprovalLayer,
  ContactChannel,
  PurchaseRequest,
  SupplierContactLog,
} from "./types";

type View =
  | "dashboard"
  | "inventory"
  | "sku-detail"
  | "calculation"
  | "supplier"
  | "supplier-detail"
  | "contact-log"
  | "request"
  | "approval"
  | "history"
  | "vmi"
  | "vmi-simulation"
  | "settings";

type ApprovalTab = "regional" | "central";

const regionLabels: Record<string, string> = {
  North: "ภาคเหนือ",
  Northeast: "ภาคตะวันออกเฉียงเหนือ",
  East: "ภาคตะวันออก",
  South: "ภาคใต้",
  National: "ทั่วประเทศ",
};

const moreReasons = [
  "มีแผนซ่อมบำรุงเพิ่มเติม",
  "มีเหตุฉุกเฉินในพื้นที่",
  "ต้องสำรองสำหรับพื้นที่ห่างไกล",
  "คาดการณ์ Demand เพิ่มขึ้น",
  "ต้องการรวมรอบการจัดซื้อ",
  "อื่น ๆ",
];

const lessReasons = [
  "งบประมาณไม่เพียงพอ",
  "พื้นที่จัดเก็บไม่พอ",
  "มีแผนโอนย้ายจากคลังอื่น",
  "ความต้องการใช้งานลดลง",
  "รอรอบจัดซื้อถัดไป",
  "อื่น ๆ",
];

function App() {
  const [view, setView] = useState<View>("dashboard");
  const [selectedSkuId, setSelectedSkuId] = useState("C01");
  const [selectedSupplierId, setSelectedSupplierId] = useState("S001");
  const [selectedRequestId, setSelectedRequestId] = useState("REQ-002");
  const [approvalTab, setApprovalTab] = useState<ApprovalTab>("regional");
  const [toast, setToast] = useState("");

  // Later API integration point: replace these in-memory stores with service calls
  // to SAP/procurement/budget systems while keeping request snapshots immutable.
  const [requests, setRequests] = useState<PurchaseRequest[]>(initialRequests);
  const [contactLogs, setContactLogs] = useState<SupplierContactLog[]>(initialContactLogs);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const copyToClipboard = (value: string) => {
    void navigator.clipboard?.writeText(value);
    notify("คัดลอกข้อมูลแล้ว");
  };

  const openSku = (skuId: string) => {
    setSelectedSkuId(skuId);
    setView("sku-detail");
  };

  const submitRequest = (request: PurchaseRequest) => {
    setRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
    setSelectedRequestId(request.id);
    setApprovalTab(request.status === "Pending Central" ? "central" : "regional");
    setView(request.status === "Draft" ? "history" : "approval");
    notify(request.status === "Draft" ? `${request.id} ถูกบันทึกเป็น Draft แล้ว` : `${request.id} ถูกส่งเข้าคิวอนุมัติแล้ว`);
  };

  const addContactLog = (log: SupplierContactLog) => {
    setContactLogs((current) => [log, ...current]);
    setSelectedSupplierId(log.supplierId);
    setView("supplier-detail");
    notify("บันทึก Contact Log แล้ว");
  };

  const updateRequest = (id: string, status: PurchaseRequest["status"], action: string, note?: string) => {
    setRequests((current) =>
      current.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
              approvedQuantity: status === "Approved" ? request.requestedQuantity : request.approvedQuantity,
              timeline: [
                ...request.timeline,
                {
                  role: status === "Pending Central" ? "Regional" : approvalTab === "central" ? "Central" : "Regional",
                  action,
                  actor: status === "Pending Central" ? "Regional Review" : approvalTab === "central" ? "Central Procurement" : "Regional Review",
                  date: "2026-05-05 14:00",
                  note,
                },
              ],
            }
          : request,
      ),
    );
    if (status === "Pending Central") {
      setSelectedRequestId(id);
      setApprovalTab("central");
    }
    notify(`${id}: ${action}`);
  };

  const page = (() => {
    switch (view) {
      case "dashboard":
        return <DashboardPage openSku={openSku} requests={requests} />;
      case "inventory":
        return <InventoryPage openSku={openSku} />;
      case "sku-detail":
        return (
          <SkuDetailPage
            skuId={selectedSkuId}
            onBack={() => setView("inventory")}
            onCalculation={() => setView("calculation")}
            onCreateRequest={(supplierId) => {
              setSelectedSupplierId(supplierId);
              setView("request");
            }}
            onSupplier={(supplierId) => {
              setSelectedSupplierId(supplierId);
              setView("supplier-detail");
            }}
            onVmi={() => setView("vmi-simulation")}
          />
        );
      case "calculation":
        return (
          <CalculationDetailPage
            skuId={selectedSkuId}
            request={requests.find((item) => item.id === selectedRequestId)}
            onBack={() => setView("sku-detail")}
          />
        );
      case "supplier":
        return (
          <SupplierDirectoryPage
            selectedSupplierId={selectedSupplierId}
            contactLogs={contactLogs}
            onSelectSupplier={setSelectedSupplierId}
            onOpenDetail={() => setView("supplier-detail")}
            onCopy={copyToClipboard}
            onContactLog={() => setView("contact-log")}
          />
        );
      case "supplier-detail":
        return (
          <SupplierDetailPage
            supplierId={selectedSupplierId}
            contactLogs={contactLogs}
            onBack={() => setView("supplier")}
            onCopy={copyToClipboard}
            onContactLog={() => setView("contact-log")}
          />
        );
      case "contact-log":
        return (
          <ContactLogForm
            supplierId={selectedSupplierId}
            skuId={selectedSkuId}
            requestId={selectedRequestId}
            onBack={() => setView("supplier-detail")}
            onSave={addContactLog}
          />
        );
      case "request":
        return (
          <CreatePurchaseRequestPage
            skuId={selectedSkuId}
            supplierId={selectedSupplierId}
            onBack={() => setView("sku-detail")}
            onContactSupplier={(supplierId) => {
              setSelectedSupplierId(supplierId);
              setView("supplier-detail");
            }}
            onSubmit={submitRequest}
          />
        );
      case "approval":
        return (
          <ApprovalQueuePage
            requests={requests}
            contactLogs={contactLogs}
            selectedRequestId={selectedRequestId}
            approvalTab={approvalTab}
            onSelectRequest={setSelectedRequestId}
            onSetTab={setApprovalTab}
            onAction={updateRequest}
            onContactSupplier={(supplierId) => {
              setSelectedSupplierId(supplierId);
              setView("supplier-detail");
            }}
            onCalculation={(request) => {
              setSelectedSkuId(request.skuId);
              setSelectedRequestId(request.id);
              setView("calculation");
            }}
          />
        );
      case "history":
        return (
          <RequestHistoryPage
            requests={requests}
            contactLogs={contactLogs}
            selectedRequestId={selectedRequestId}
            onSelectRequest={setSelectedRequestId}
          />
        );
      case "vmi":
        return <VmiCandidatePage onSimulation={() => setView("vmi-simulation")} openSku={openSku} />;
      case "vmi-simulation":
        return <VmiSimulationPage onBack={() => setView("vmi")} onCreateProposal={() => notify("สร้าง VMI Proposal แบบร่างแล้ว")} />;
      case "settings":
        return <SettingsPage />;
      default:
        return null;
    }
  })();

  return (
    <AppLayout view={view} onNavigate={setView}>
      {toast ? (
        <div className="fixed right-6 top-5 z-30 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-soft">
          {toast}
        </div>
      ) : null}
      {page}
    </AppLayout>
  );
}

function AppLayout({
  view,
  onNavigate,
  children,
}: {
  view: View;
  onNavigate: (view: View) => void;
  children: ReactNode;
}) {
  const nav = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "inventory", label: "Inventory", icon: Boxes },
    { id: "supplier", label: "Supplier", icon: Truck },
    { id: "request", label: "Request", icon: FileText },
    { id: "approval", label: "Approval", icon: ClipboardCheck },
    { id: "history", label: "History", icon: History },
    { id: "vmi", label: "VMI", icon: Workflow },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  const activeRoot = view === "sku-detail" || view === "calculation" ? "inventory" : view === "supplier-detail" || view === "contact-log" ? "supplier" : view === "vmi-simulation" ? "vmi" : view;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-slate-950 text-white">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">PEA AI Inventory</p>
              <p className="text-xs text-slate-400">Procurement Platform</p>
            </div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = activeRoot === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
                  active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-7 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mock Prototype · No real API connections</p>
              <h1 className="mt-1 text-xl font-semibold text-slate-950">AI Inventory Planning & Procurement Platform</h1>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Formula {formulaVersion} · Service Level 95%
            </div>
          </div>
        </header>
        <div className="p-7">{children}</div>
      </main>
    </div>
  );
}

function PageTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function DashboardPage({ openSku, requests }: { openSku: (skuId: string) => void; requests: PurchaseRequest[] }) {
  const pendingCount = requests.filter((request) => request.status.startsWith("Pending")).length;
  const riskCount = inventoryRecords.filter((record) => record.status !== "Normal").length;

  return (
    <>
      <PageTitle
        eyebrow="Dashboard"
        title="ภาพรวมความเสี่ยง Stock และคำแนะนำจัดซื้อ"
        subtitle="หน้าหลักสำหรับผู้ใช้งานคลังและฝ่ายจัดซื้อ ตรวจสอบความเสี่ยง งบประมาณ และงานที่รออนุมัติ"
      />
      <Card className="mb-5 p-4">
        <div className="grid grid-cols-5 gap-3">
          {["Fiscal Year 2026", "Region: North", "Warehouse: WH-001", "Category: All"].map((value) => (
            <select key={value} className={inputClass} defaultValue={value}>
              <option>{value}</option>
            </select>
          ))}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className={`${inputClass} pl-9`} placeholder="Search SKU / Warehouse" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total SKU" value={String(skus.length)} helper="รายการ" tone="slate" />
        <MetricCard label="Risk SKU" value={String(riskCount)} helper="ต้องติดตาม" tone="red" />
        <MetricCard label="Pending PR" value={String(pendingCount)} helper="รออนุมัติ" tone="blue" />
        <MetricCard label="VMI Candidate" value="1" helper="แนะนำ C01" tone="purple" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-600">Local Budget</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{formatTHB(25_000)}</p>
          <p className="mt-2 text-sm text-slate-500">WH-001 คลังเชียงใหม่ 1</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-600">Regional Budget</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{formatTHB(300_000)}</p>
          <p className="mt-2 text-sm text-slate-500">Regional North</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-600">Central Budget</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{formatTHB(centralBudgetRemaining)}</p>
          <p className="mt-2 text-sm text-slate-500">Central National</p>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_360px] gap-5">
        <Card>
          <SectionHeader title="Critical Stock Alert" subtitle="รายการที่ Stock ต่ำกว่า ROP หรือ Safety Stock" />
          <DataTable columns={["SKU", "Item", "Warehouse", "Stock", "ROP", "Status", "Action"]}>
            {inventoryRecords.map((record) => {
              const sku = getSku(record.skuId);
              const warehouse = getWarehouse(record.warehouseId);
              return (
                <tr key={`${record.skuId}-${record.warehouseId}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{sku.id}</td>
                  <td className="px-4 py-3 text-slate-700">{sku.name}</td>
                  <td className="px-4 py-3 text-slate-600">{warehouse.name}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNumber(record.currentStock)} {sku.unit}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNumber(record.reorderPoint)} {sku.unit}</td>
                  <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                  <td className="px-4 py-3">
                    <Button variant="secondary" onClick={() => openSku(record.skuId)}>เปิด Detail</Button>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-700" />
            <h3 className="font-semibold text-slate-950">AI Summary</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>C01 ที่ WH-001 อยู่ต่ำกว่า Reorder Point 122 เมตร และมี Local Budget เพียง 25,000 THB</p>
            <p>หากขอซื้อ 20 เมตรจาก S001 จะใช้เงิน 40,000 THB ต้องส่ง Regional Approval</p>
            <p>C01 มี Demand Stability สูงและ Supplier Reliability 96% เหมาะสำหรับทดลอง VMI ระดับเขต</p>
          </div>
          <Button className="mt-5 w-full" onClick={() => openSku("C01")}>
            <Boxes className="h-4 w-4" />
            เปิด C01 SKU Detail
          </Button>
        </Card>
      </div>
    </>
  );
}

function InventoryPage({ openSku }: { openSku: (skuId: string) => void }) {
  return (
    <>
      <PageTitle
        eyebrow="Inventory"
        title="รายการ Stock ตามคลัง"
        subtitle="ตรวจสอบ Current Stock, Safety Stock, Reorder Point และ AI Suggested Quantity"
      />
      <Card>
        <SectionHeader title="Inventory Risk List" subtitle="คลิกเปิด SKU Detail เพื่อดู Supplier options และ Calculation" />
        <DataTable columns={["SKU", "Item", "Warehouse", "Current Stock", "Safety Stock", "ROP", "AI Suggested", "Status", "Action"]}>
          {inventoryRecords.map((record) => {
            const sku = getSku(record.skuId);
            const warehouse = getWarehouse(record.warehouseId);
            return (
              <tr key={`${record.skuId}-${record.warehouseId}`} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{sku.id}</td>
                <td className="px-4 py-3">{sku.name}</td>
                <td className="px-4 py-3">{warehouse.id} · {warehouse.name}</td>
                <td className="px-4 py-3">{formatNumber(record.currentStock)} {sku.unit}</td>
                <td className="px-4 py-3">{record.safetyStock ?? "-"} {record.safetyStock ? sku.unit : ""}</td>
                <td className="px-4 py-3">{formatNumber(record.reorderPoint)} {sku.unit}</td>
                <td className="px-4 py-3 font-semibold text-blue-700">{formatNumber(record.aiSuggestedQuantity)} {sku.unit}</td>
                <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                <td className="px-4 py-3"><Button variant="secondary" onClick={() => openSku(record.skuId)}>Detail</Button></td>
              </tr>
            );
          })}
        </DataTable>
      </Card>
    </>
  );
}

function SkuDetailPage({
  skuId,
  onBack,
  onCalculation,
  onCreateRequest,
  onSupplier,
  onVmi,
}: {
  skuId: string;
  onBack: () => void;
  onCalculation: () => void;
  onCreateRequest: (supplierId: string) => void;
  onSupplier: (supplierId: string) => void;
  onVmi: () => void;
}) {
  const sku = getSku(skuId);
  const record = inventoryRecords.find((item) => item.skuId === skuId) ?? inventoryRecords[0];
  const warehouse = getWarehouse(record.warehouseId);
  const offers = supplierOffers.filter((offer) => offer.skuId === skuId);
  const primaryOffer = offers[0];
  const primarySupplier = getSupplier(primaryOffer?.supplierId ?? "S001");

  return (
    <>
      <PageTitle
        eyebrow="Inventory / SKU Detail"
        title={`${sku.id} ${sku.name}`}
        subtitle={`${warehouse.id} ${warehouse.name} · ${regionLabels[warehouse.region]} · Capacity Used ${warehouse.capacityUsed}%`}
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>}
      />

      <div className="grid grid-cols-6 gap-4">
        <MetricCard label="Current Stock" value={`${formatNumber(record.currentStock)} ${sku.unit}`} helper="คงเหลือ" />
        <MetricCard label="Average Daily Demand" value={`${record.averageDailyDemand ?? "-"} ${sku.unit}`} helper="ต่อวัน" />
        <MetricCard label="Safety Stock" value={`${record.safetyStock ?? "-"} ${sku.unit}`} helper="กันขาด" tone="green" />
        <MetricCard label="Reorder Point" value={`${formatNumber(record.reorderPoint)} ${sku.unit}`} helper="ROP" tone="red" />
        <MetricCard label="Forecast Demand" value={`${record.forecastDemand ?? "-"} ${sku.unit}`} helper="Planning" />
        <MetricCard label="AI Suggested Quantity" value={`${formatNumber(record.aiSuggestedQuantity)} ${sku.unit}`} helper="AI" tone="blue" />
      </div>

      <div className="mt-5 grid grid-cols-[1fr_360px] gap-5">
        <Card>
          <SectionHeader
            title="Supplier Price & Lead Time Comparison"
            subtitle="เปรียบเทียบราคาต่อหน่วย Lead Time และ MOQ"
            action={<StatusBadge status={record.status} />}
          />
          <DataTable columns={["Supplier", "Contact", "Unit Price", "Lead Time", "MOQ", "Coverage", "Action"]} empty={offers.length === 0}>
            {offers.map((offer) => {
              const supplier = getSupplier(offer.supplierId);
              return (
                <tr key={`${offer.supplierId}-${offer.skuId}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{supplier.name}</td>
                  <td className="px-4 py-3 text-slate-600">{supplier.contactPerson}<br /><span className="text-xs">{supplier.phone}</span></td>
                  <td className="px-4 py-3">{formatTHB(offer.unitPrice)}/{offer.unit}</td>
                  <td className="px-4 py-3">{offer.leadTimeDays} days</td>
                  <td className="px-4 py-3">{offer.moq} {offer.unit}</td>
                  <td className="px-4 py-3">{regionLabels[supplier.coverage]}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => onSupplier(supplier.id)}>Contact</Button>
                      <Button onClick={() => onCreateRequest(supplier.id)}>Create PR</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </Card>

        <div className="space-y-4">
          <SupplierContactCard supplier={primarySupplier} />
          <Card className="p-4">
            <h3 className="font-semibold text-slate-950">Demo Actions</h3>
            <div className="mt-4 grid gap-2">
              <Button variant="secondary" onClick={onCalculation}><Calculator className="h-4 w-4" /> View Calculation Detail</Button>
              <Button onClick={() => onCreateRequest(primarySupplier.id)}><Plus className="h-4 w-4" /> Create Purchase Request</Button>
              <Button variant="secondary" onClick={onVmi}><Workflow className="h-4 w-4" /> VMI Sim</Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function CalculationDetailPage({
  skuId,
  request,
  onBack,
}: {
  skuId: string;
  request?: PurchaseRequest;
  onBack: () => void;
}) {
  const sku = getSku(skuId);
  const snapshot = skuId === "C01" ? c01CalculationSnapshot : request?.calculationSnapshot ?? c01CalculationSnapshot;

  return (
    <>
      <PageTitle
        eyebrow="Calculation Detail"
        title={`${sku.id} ${sku.name} · Formula Version ${snapshot.formulaVersion}`}
        subtitle="Calculation snapshot อธิบายวิธีคำนวณ Safety Stock, Reorder Point และ Suggested Quantity"
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back to SKU Detail</Button>}
      />
      <div className="mb-5 grid grid-cols-4 gap-3">
        {formulaList.map((formula, index) => (
          <Card key={formula} className="p-3">
            <p className="text-xs font-semibold text-slate-500">Formula {index + 1}</p>
            <p className="mt-2 text-sm text-slate-700">{formula}</p>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <CalculationStepCard step="Step 1" title="Average Demand" formula="Average Daily Demand = Historical Usage / Number of Days" result={`${snapshot.historicalUsage} · ${snapshot.averageDailyDemand}`} />
        <CalculationStepCard step="Step 2" title="Adjusted Lead Time" formula="Supplier Lead Time × Seasonal Factor × Budget Factor" result={`Lead Time ${snapshot.supplierLeadTime}, Seasonal ${snapshot.seasonalFactor}, Budget ${snapshot.budgetFactor} → ${snapshot.adjustedLeadTime}`} tone="green" />
        <CalculationStepCard step="Step 3" title="Safety Stock" formula="Z-score × Demand Variability × √Adjusted Lead Time" result={`Z-score ${snapshot.zScore}, Variability ${snapshot.demandVariability} → ${snapshot.safetyStock}`} tone="amber" />
        <CalculationStepCard step="Step 4" title="Reorder Point" formula="Demand During Lead Time + Safety Stock" result={`${snapshot.demandDuringLeadTime} · ${snapshot.reorderPoint}`} tone="purple" />
        <CalculationStepCard step="Step 5" title="Suggested Quantity" formula="Target Stock Level - Current Stock" result={`Target ${snapshot.targetStockLevel}, Current ${snapshot.currentStock} → ${snapshot.suggestedQuantity}`} />
      </div>
    </>
  );
}

function SupplierDirectoryPage({
  selectedSupplierId,
  contactLogs,
  onSelectSupplier,
  onOpenDetail,
  onCopy,
  onContactLog,
}: {
  selectedSupplierId: string;
  contactLogs: SupplierContactLog[];
  onSelectSupplier: (id: string) => void;
  onOpenDetail: () => void;
  onCopy: (value: string) => void;
  onContactLog: () => void;
}) {
  const [search, setSearch] = useState("");
  const filteredSuppliers = suppliers.filter((supplier) => {
    const supportedSkuText = supplierOffers
      .filter((offer) => offer.supplierId === supplier.id)
      .map((offer) => {
        const sku = getSku(offer.skuId);
        return `${sku.id} ${sku.name} ${sku.category}`;
      })
      .join(" ");
    return `${supplier.name} ${supplier.contactPerson} ${supplier.email} ${supportedSkuText}`.toLowerCase().includes(search.toLowerCase());
  });
  const selectedSupplier = getSupplier(selectedSupplierId);

  return (
    <>
      <PageTitle eyebrow="Supplier" title="Supplier Directory" subtitle="ค้นหา Supplier, SKU, Category และดูช่องทางติดต่อ" />
      <div className="grid grid-cols-[1fr_360px] gap-5">
        <Card>
          <SectionHeader
            title="Supplier List"
            subtitle="รองรับการค้นหาด้วยชื่อ Supplier / SKU / Category"
            action={
              <div className="relative w-72">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search supplier / SKU / category" />
              </div>
            }
          />
          <DataTable columns={["Supplier", "Contact", "Phone", "Email", "Coverage", "Action"]} empty={filteredSuppliers.length === 0}>
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{supplier.name}</td>
                <td className="px-4 py-3">{supplier.contactPerson}</td>
                <td className="px-4 py-3">{supplier.phone}</td>
                <td className="px-4 py-3">{supplier.email}</td>
                <td className="px-4 py-3">{regionLabels[supplier.coverage]}</td>
                <td className="px-4 py-3">
                  <Button variant="secondary" onClick={() => { onSelectSupplier(supplier.id); onOpenDetail(); }}>Detail</Button>
                </td>
              </tr>
            ))}
          </DataTable>
        </Card>

        <SupplierSummaryPanel supplier={selectedSupplier} contactLogs={contactLogs} onCopy={onCopy} onContactLog={onContactLog} />
      </div>
    </>
  );
}

function SupplierDetailPage({
  supplierId,
  contactLogs,
  onBack,
  onCopy,
  onContactLog,
}: {
  supplierId: string;
  contactLogs: SupplierContactLog[];
  onBack: () => void;
  onCopy: (value: string) => void;
  onContactLog: () => void;
}) {
  const supplier = getSupplier(supplierId);
  const offers = supplierOffers.filter((offer) => offer.supplierId === supplier.id);
  const logs = contactLogs.filter((log) => log.supplierId === supplier.id);

  return (
    <>
      <PageTitle
        eyebrow="Supplier Detail"
        title={supplier.name}
        subtitle={`${supplier.contactPerson} · ${regionLabels[supplier.coverage]}`}
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>}
      />
      <div className="grid grid-cols-[360px_1fr] gap-5">
        <SupplierSummaryPanel supplier={supplier} contactLogs={contactLogs} onCopy={onCopy} onContactLog={onContactLog} />
        <div className="space-y-5">
          <Card>
            <SectionHeader title="Supported Items" subtitle="SKU ที่ Supplier เสนอราคาและ Lead Time" />
            <DataTable columns={["SKU", "Item", "Category", "Unit Price", "Lead Time", "MOQ"]}>
              {offers.map((offer) => {
                const sku = getSku(offer.skuId);
                return (
                  <tr key={`${offer.skuId}-${offer.supplierId}`}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{sku.id}</td>
                    <td className="px-4 py-3">{sku.name}</td>
                    <td className="px-4 py-3">{sku.category}</td>
                    <td className="px-4 py-3">{formatTHB(offer.unitPrice)}/{offer.unit}</td>
                    <td className="px-4 py-3">{offer.leadTimeDays} days</td>
                    <td className="px-4 py-3">{offer.moq} {offer.unit}</td>
                  </tr>
                );
              })}
            </DataTable>
          </Card>
          <Card>
            <SectionHeader title="Contact History" subtitle="ประวัติการติดต่อ Supplier" />
            <DataTable columns={["Date", "Related SKU", "Request ID", "Channel", "Purpose", "Result / Note"]} empty={logs.length === 0}>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">{log.createdAt}</td>
                  <td className="px-4 py-3">{log.skuId ?? "-"}</td>
                  <td className="px-4 py-3">{log.requestId ?? "-"}</td>
                  <td className="px-4 py-3">{log.channel}</td>
                  <td className="px-4 py-3">{log.purpose}</td>
                  <td className="px-4 py-3">{log.note}</td>
                </tr>
              ))}
            </DataTable>
          </Card>
        </div>
      </div>
    </>
  );
}

function SupplierSummaryPanel({
  supplier,
  contactLogs,
  onCopy,
  onContactLog,
}: {
  supplier: ReturnType<typeof getSupplier>;
  contactLogs: SupplierContactLog[];
  onCopy: (value: string) => void;
  onContactLog: () => void;
}) {
  const logs = contactLogs.filter((log) => log.supplierId === supplier.id).slice(0, 3);
  return (
    <div className="space-y-4">
      <SupplierContactCard supplier={supplier} onCopy={onCopy} />
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary"><Phone className="h-4 w-4" /> Call</Button>
          <Button variant="secondary"><Mail className="h-4 w-4" /> Email</Button>
          <Button variant="secondary" onClick={() => onCopy(supplier.phone)}>Copy Phone</Button>
          <Button variant="secondary" onClick={() => onCopy(supplier.email)}>Copy Email</Button>
        </div>
        <Button className="mt-3 w-full" onClick={onContactLog}><Plus className="h-4 w-4" /> Add Contact Log</Button>
      </Card>
      <Card className="p-4">
        <h3 className="font-semibold text-slate-950">Recent Contact</h3>
        <div className="mt-3 space-y-3">
          {logs.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มีประวัติการติดต่อ</p> : null}
          {logs.map((log) => (
            <div key={log.id} className="rounded-md bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-800">{log.channel} · {log.purpose}</p>
              <p className="mt-1 text-slate-500">{log.note}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ContactLogForm({
  supplierId,
  skuId,
  requestId,
  onBack,
  onSave,
}: {
  supplierId: string;
  skuId: string;
  requestId: string;
  onBack: () => void;
  onSave: (log: SupplierContactLog) => void;
}) {
  const [form, setForm] = useState({
    supplierId,
    skuId,
    requestId,
    channel: "Phone" as ContactChannel,
    purpose: "ยืนยันราคาและ Lead Time",
    note: "",
    followUpDate: "2026-05-08",
  });
  const supplier = getSupplier(form.supplierId);

  return (
    <>
      <PageTitle
        eyebrow="Supplier Contact Log"
        title="บันทึกการติดต่อ Supplier"
        subtitle="เก็บหลักฐานการติดต่อและ Follow-up เพื่อแสดงใน Approval Review และ Audit Trail"
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>}
      />
      <Card className="max-w-4xl p-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Supplier name">
            <select className={inputClass} value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
              {suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="Related SKU">
            <select className={inputClass} value={form.skuId} onChange={(event) => setForm({ ...form, skuId: event.target.value })}>
              {skus.map((sku) => <option key={sku.id} value={sku.id}>{sku.id} · {sku.name}</option>)}
            </select>
          </Field>
          <Field label="Related Request ID">
            <input className={inputClass} value={form.requestId} onChange={(event) => setForm({ ...form, requestId: event.target.value })} />
          </Field>
          <Field label="Contact Channel">
            <select className={inputClass} value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value as ContactChannel })}>
              {["Phone", "Email", "Line", "Meeting", "Other"].map((channel) => <option key={channel}>{channel}</option>)}
            </select>
          </Field>
          <Field label="Contact Purpose">
            <input className={inputClass} value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} />
          </Field>
          <Field label="Follow-up Date">
            <input type="date" className={inputClass} value={form.followUpDate} onChange={(event) => setForm({ ...form, followUpDate: event.target.value })} />
          </Field>
          <div className="col-span-2">
            <Field label="Result / Note">
              <textarea className={textareaClass} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="เช่น Supplier ยืนยันราคาเดิม และสามารถส่งมอบภายใน 25 วัน" />
            </Field>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-slate-500">Supplier contact: {supplier.contactPerson} · {supplier.phone}</p>
          <Button
            onClick={() =>
              onSave({
                id: `LOG-${String(Date.now()).slice(-4)}`,
                supplierId: form.supplierId,
                skuId: form.skuId,
                requestId: form.requestId,
                channel: form.channel,
                purpose: form.purpose,
                note: form.note || "บันทึกผลการติดต่อสำหรับใช้ใน Approval Review",
                followUpDate: form.followUpDate,
                createdAt: "2026-05-05 14:05",
              })
            }
          >
            <CheckCircle2 className="h-4 w-4" /> Save Contact Log
          </Button>
        </div>
      </Card>
    </>
  );
}

function CreatePurchaseRequestPage({
  skuId,
  supplierId,
  onBack,
  onContactSupplier,
  onSubmit,
}: {
  skuId: string;
  supplierId: string;
  onBack: () => void;
  onContactSupplier: (supplierId: string) => void;
  onSubmit: (request: PurchaseRequest) => void;
}) {
  const sku = getSku(skuId);
  const record = inventoryRecords.find((item) => item.skuId === skuId) ?? inventoryRecords[0];
  const warehouse = getWarehouse(record.warehouseId);
  const firstSupportedOffer = getOffer(supplierId, skuId) ?? supplierOffers.find((item) => item.skuId === skuId);
  const [chosenSupplierId, setChosenSupplierId] = useState(firstSupportedOffer?.supplierId ?? supplierId);
  const offer = getOffer(chosenSupplierId, skuId) ?? supplierOffers.find((item) => item.skuId === skuId) ?? supplierOffers[0];
  const supplier = getSupplier(offer.supplierId);
  const [requestedQuantity, setRequestedQuantity] = useState(skuId === "C01" ? 20 : record.aiSuggestedQuantity);
  const [reasonCategory, setReasonCategory] = useState(skuId === "C01" ? "มีแผนซ่อมบำรุงเพิ่มเติม" : "");
  const [reasonText, setReasonText] = useState(skuId === "C01" ? "รวมแผนซ่อมบำรุงเพิ่มเติมของคลังเชียงใหม่ 1 ในรอบเดียวกัน" : "");

  const estimatedCost = requestedQuantity * offer.unitPrice;
  const regionalBudget = getRegionalBudget(warehouse.region);
  const adjustedLeadTime = Math.round(offer.leadTimeDays * 1.2);
  const recommendedLayer = getRecommendedLayer(estimatedCost, warehouse.localBudget, regionalBudget);
  const variance = ((requestedQuantity - record.aiSuggestedQuantity) / record.aiSuggestedQuantity) * 100;
  const quantityDiffers = requestedQuantity !== record.aiSuggestedQuantity;
  const reasonOptions = requestedQuantity > record.aiSuggestedQuantity ? moreReasons : lessReasons;
  const canSubmit = !quantityDiffers || Boolean(reasonCategory && reasonText.trim());
  const submitLabel = recommendedLayer === "Local" ? "Submit to Local" : recommendedLayer === "Regional" ? "Submit to Regional" : "Submit to Central";

  const buildRequest = (status: PurchaseRequest["status"]): PurchaseRequest => ({
    id: "REQ-001",
    skuId,
    warehouseId: warehouse.id,
    supplierId: offer.supplierId,
    aiSuggestedQuantity: record.aiSuggestedQuantity,
    requestedQuantity,
    unit: sku.unit,
    unitPrice: offer.unitPrice,
    leadTimeDays: offer.leadTimeDays,
    adjustedLeadTimeDays: adjustedLeadTime,
    moq: offer.moq,
    estimatedCost,
    localBudgetRemaining: warehouse.localBudget,
    regionalBudgetRemaining: regionalBudget,
    centralBudgetRemaining,
    recommendedLayer,
    status,
    variancePercent: variance,
    overrideReasonCategory: quantityDiffers ? reasonCategory : undefined,
    overrideReasonText: quantityDiffers ? reasonText : undefined,
    formulaVersion,
    calculationSnapshot: c01CalculationSnapshot,
    supplierContactLogSummary: "Phone ยืนยันราคาและ Lead Time กับ Supplier แล้ว",
    localReason: "Current Stock ต่ำกว่า Reorder Point และ Local Budget ไม่เพียงพอสำหรับปริมาณที่ขอ",
    regionalEscalationReason: recommendedLayer === "Central" ? "Regional budget ไม่เพียงพอ ต้องส่งต่อ Central" : undefined,
    createdAt: "2026-05-05 14:00",
    timeline: [
      { role: "Local Warehouse", action: "Draft Created", actor: warehouse.name, date: "2026-05-05 13:55" },
      { role: "Local Warehouse", action: "Submitted", actor: warehouse.name, date: "2026-05-05 14:00", note: `Recommended Layer: ${recommendedLayer}` },
    ],
  });

  return (
    <>
      <PageTitle
        eyebrow="Create Purchase Request"
        title={`สร้างคำขอซื้อ ${sku.id} ${sku.name}`}
        subtitle="ฟอร์มสร้าง PR จาก AI Suggested Quantity และข้อมูล Supplier โดยตรวจสอบงบประมาณ 3 ชั้น"
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>}
      />

      <div className="grid grid-cols-[1fr_360px] gap-5">
        <Card className="p-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU">
              <input className={inputClass} value={`${sku.id} · ${sku.name}`} readOnly />
            </Field>
            <Field label="Selected Supplier">
              <select className={inputClass} value={chosenSupplierId} onChange={(event) => setChosenSupplierId(event.target.value)}>
                {supplierOffers.filter((item) => item.skuId === skuId).map((item) => {
                  const itemSupplier = getSupplier(item.supplierId);
                  return <option key={item.supplierId} value={item.supplierId}>{itemSupplier.name}</option>;
                })}
              </select>
            </Field>
            <Field label="AI Suggested Quantity">
              <input className={inputClass} value={`${record.aiSuggestedQuantity} ${sku.unit}`} readOnly />
            </Field>
            <Field label="Supplier Unit Price">
              <input className={inputClass} value={`${formatTHB(offer.unitPrice)}/${offer.unit}`} readOnly />
            </Field>
            <Field label="Supplier Lead Time">
              <input className={inputClass} value={`${offer.leadTimeDays} days`} readOnly />
            </Field>
            <Field label="Adjusted Lead Time">
              <input className={inputClass} value={`${adjustedLeadTime} days`} readOnly />
            </Field>
            <Field label="MOQ">
              <input className={inputClass} value={`${offer.moq} ${offer.unit}`} readOnly />
            </Field>
            <Field label="Requested Quantity" hint={`หน่วย: ${sku.unit}`}>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={requestedQuantity}
                onChange={(event) => setRequestedQuantity(Number(event.target.value))}
              />
            </Field>
            <Field label="Estimated Cost">
              <input className={inputClass} value={formatTHB(estimatedCost)} readOnly />
            </Field>
            <Field label="Recommended Approval Layer">
              <input className={inputClass} value={recommendedLayer} readOnly />
            </Field>
          </div>

          <div className="mt-5 space-y-3">
            {quantityDiffers ? (
              requestedQuantity > record.aiSuggestedQuantity ? (
                <InlineAlert>จำนวนที่ขอมากกว่าค่าที่ระบบแนะนำ · Variance +{formatNumber(variance)}%</InlineAlert>
              ) : (
                <InlineAlert tone="danger">จำนวนที่ขอน้อยกว่าค่าที่ระบบแนะนำ อาจเสี่ยงต่อการขาดสต็อก · Variance {formatNumber(variance)}%</InlineAlert>
              )
            ) : (
              <InlineAlert tone="success">Requested Quantity ตรงกับ AI Suggested Quantity</InlineAlert>
            )}

            {quantityDiffers ? (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Override Reason Category">
                  <select className={inputClass} value={reasonCategory} onChange={(event) => setReasonCategory(event.target.value)}>
                    <option value="">เลือกเหตุผล</option>
                    {reasonOptions.map((reason) => <option key={reason}>{reason}</option>)}
                  </select>
                </Field>
                <Field label="Override Reason Detail">
                  <textarea className={textareaClass} value={reasonText} onChange={(event) => setReasonText(event.target.value)} />
                </Field>
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onContactSupplier(supplier.id)}><Phone className="h-4 w-4" /> Contact Supplier</Button>
            <Button variant="secondary" onClick={() => onSubmit(buildRequest("Draft"))}>Save Draft</Button>
            <Button
              disabled={!canSubmit}
              onClick={() => {
                const status = recommendedLayer === "Local" ? "Pending Local" : recommendedLayer === "Regional" ? "Pending Regional" : "Pending Regional";
                onSubmit(buildRequest(status));
              }}
            >
              <Send className="h-4 w-4" />
              {submitLabel}
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <SupplierContactCard supplier={supplier} />
          <BudgetCheckCard label={`Local · ${warehouse.name}`} remaining={warehouse.localBudget} required={estimatedCost} />
          <BudgetCheckCard label={`Regional · ${regionLabels[warehouse.region]}`} remaining={regionalBudget} required={estimatedCost} />
          <BudgetCheckCard label="Central National" remaining={centralBudgetRemaining} required={estimatedCost} />
        </div>
      </div>
    </>
  );
}

function ApprovalQueuePage({
  requests,
  contactLogs,
  selectedRequestId,
  approvalTab,
  onSelectRequest,
  onSetTab,
  onAction,
  onContactSupplier,
  onCalculation,
}: {
  requests: PurchaseRequest[];
  contactLogs: SupplierContactLog[];
  selectedRequestId: string;
  approvalTab: ApprovalTab;
  onSelectRequest: (id: string) => void;
  onSetTab: (tab: ApprovalTab) => void;
  onAction: (id: string, status: PurchaseRequest["status"], action: string, note?: string) => void;
  onContactSupplier: (supplierId: string) => void;
  onCalculation: (request: PurchaseRequest) => void;
}) {
  const regionalQueue = requests.filter((request) => request.status === "Pending Regional");
  const centralQueue = requests.filter((request) => request.status === "Pending Central");
  const queue = approvalTab === "regional" ? regionalQueue : centralQueue;
  const selected = queue.find((request) => request.id === selectedRequestId) ?? queue[0];

  return (
    <>
      <PageTitle
        eyebrow="Approval Center"
        title="ศูนย์อนุมัติคำขอซื้อ"
        subtitle="Regional Review และ Central Approval Queue พร้อมข้อมูล AI, Budget และ Supplier Contact Log"
      />
      <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1">
        <button className={`rounded-md px-4 py-2 text-sm font-semibold ${approvalTab === "regional" ? "bg-blue-700 text-white" : "text-slate-600"}`} onClick={() => onSetTab("regional")}>Regional Approval Queue</button>
        <button className={`rounded-md px-4 py-2 text-sm font-semibold ${approvalTab === "central" ? "bg-blue-700 text-white" : "text-slate-600"}`} onClick={() => onSetTab("central")}>Central Approval Queue</button>
      </div>
      <div className="grid grid-cols-[420px_1fr] gap-5">
        <Card>
          <SectionHeader title={approvalTab === "regional" ? "Regional Queue" : "Central Queue"} subtitle={`${queue.length} pending request(s)`} />
          <DataTable columns={["Request", "Item", "Cost", "Status"]} empty={queue.length === 0}>
            {queue.map((request) => {
              const sku = getSku(request.skuId);
              return (
                <tr
                  key={request.id}
                  className={`cursor-pointer hover:bg-slate-50 ${selected?.id === request.id ? "bg-blue-50" : ""}`}
                  onClick={() => onSelectRequest(request.id)}
                >
                  <td className="px-4 py-3 font-semibold text-slate-900">{request.id}</td>
                  <td className="px-4 py-3">{sku.name}</td>
                  <td className="px-4 py-3">{formatTHB(request.estimatedCost)}</td>
                  <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
                </tr>
              );
            })}
          </DataTable>
        </Card>

        {selected ? (
          approvalTab === "regional" ? (
            <RegionalReviewDetail request={selected} contactLogs={contactLogs} onAction={onAction} onContactSupplier={onContactSupplier} />
          ) : (
            <CentralReviewDetail request={selected} contactLogs={contactLogs} onAction={onAction} onContactSupplier={onContactSupplier} onCalculation={onCalculation} />
          )
        ) : (
          <Card className="flex min-h-80 items-center justify-center p-8 text-center text-slate-500">
            ไม่มีรายการรออนุมัติในคิวนี้
          </Card>
        )}
      </div>
    </>
  );
}

function RegionalReviewDetail({
  request,
  contactLogs,
  onAction,
  onContactSupplier,
}: {
  request: PurchaseRequest;
  contactLogs: SupplierContactLog[];
  onAction: (id: string, status: PurchaseRequest["status"], action: string, note?: string) => void;
  onContactSupplier: (supplierId: string) => void;
}) {
  const sku = getSku(request.skuId);
  const supplier = getSupplier(request.supplierId);
  const warehouse = getWarehouse(request.warehouseId);
  const mustPassCentral = request.estimatedCost > request.regionalBudgetRemaining;
  const logs = contactLogs.filter((log) => log.requestId === request.id || log.supplierId === request.supplierId);

  return (
    <Card>
      <SectionHeader title={`Regional Review Detail · ${request.id}`} subtitle={`${sku.id} ${sku.name} · ${warehouse.name}`} action={<StatusBadge status={request.status} />} />
      <div className="grid grid-cols-3 gap-4 p-5">
        <ReviewMetric label="AI Suggested" value={`${request.aiSuggestedQuantity} ${request.unit}`} />
        <ReviewMetric label="Requested" value={`${request.requestedQuantity} ${request.unit}`} />
        <ReviewMetric label="Variance" value={`${request.variancePercent > 0 ? "+" : ""}${formatNumber(request.variancePercent)}%`} />
        <ReviewMetric label="Supplier" value={supplier.name} />
        <ReviewMetric label="Estimated Cost" value={formatTHB(request.estimatedCost)} />
        <ReviewMetric label="Lead Time" value={`${request.leadTimeDays} days`} />
      </div>
      <div className="grid grid-cols-3 gap-4 px-5 pb-5">
        <BudgetCheckCard label="Local Budget" remaining={request.localBudgetRemaining} required={request.estimatedCost} />
        <BudgetCheckCard label="Regional Budget" remaining={request.regionalBudgetRemaining} required={request.estimatedCost} />
        <BudgetCheckCard label="Central Budget" remaining={request.centralBudgetRemaining} required={request.estimatedCost} />
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-slate-200 p-5">
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">Override Reason</h3>
          <p className="mt-2 text-sm font-medium text-slate-700">{request.overrideReasonCategory ?? "ไม่พบ Override"}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{request.overrideReasonText ?? "Requested Quantity ตรงกับ AI Suggested Quantity"}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">Supplier Contact Log Summary</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{request.supplierContactLogSummary}</p>
          <p className="mt-2 text-xs text-slate-400">Related logs: {logs.length}</p>
        </Card>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
        <Button variant="secondary" onClick={() => onContactSupplier(supplier.id)}><Phone className="h-4 w-4" /> Contact Supplier</Button>
        <Button variant="secondary" onClick={() => onAction(request.id, "More Info", "Request More Info", "ขอข้อมูลเพิ่มเติมจากคลัง")}>Request More Info</Button>
        <Button variant="danger" onClick={() => onAction(request.id, "Rejected", "Rejected", "ไม่อนุมัติคำขอ")}>Reject</Button>
        {mustPassCentral ? (
          <Button onClick={() => onAction(request.id, "Pending Central", "Approve & Pass to Central", "Regional budget ไม่เพียงพอ ส่งต่อ Central")}>Approve & Pass to Central</Button>
        ) : (
          <Button variant="success" onClick={() => onAction(request.id, "Approved", "Approved", "อนุมัติตามปริมาณที่ขอ")}>Approve</Button>
        )}
      </div>
    </Card>
  );
}

function CentralReviewDetail({
  request,
  contactLogs,
  onAction,
  onContactSupplier,
  onCalculation,
}: {
  request: PurchaseRequest;
  contactLogs: SupplierContactLog[];
  onAction: (id: string, status: PurchaseRequest["status"], action: string, note?: string) => void;
  onContactSupplier: (supplierId: string) => void;
  onCalculation: (request: PurchaseRequest) => void;
}) {
  const sku = getSku(request.skuId);
  const supplier = getSupplier(request.supplierId);
  const budgetGap = Math.max(request.estimatedCost - request.regionalBudgetRemaining, 0);
  const logs = contactLogs.filter((log) => log.requestId === request.id || log.supplierId === request.supplierId);

  return (
    <Card>
      <SectionHeader title={`Central Review Detail · ${request.id}`} subtitle={`${sku.id} ${sku.name} · Escalated Request`} action={<StatusBadge status={request.status} />} />
      <div className="grid grid-cols-4 gap-4 p-5">
        <ReviewMetric label="Cost" value={formatTHB(request.estimatedCost)} />
        <ReviewMetric label="Budget Gap" value={formatTHB(budgetGap)} />
        <ReviewMetric label="Supplier" value={supplier.name} />
        <ReviewMetric label="Unit Price at Request Date" value={`${formatTHB(request.unitPrice)}/${request.unit}`} />
      </div>
      <div className="grid grid-cols-2 gap-4 px-5 pb-5">
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">Local Reason</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{request.localReason}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">Regional Escalation Reason</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{request.regionalEscalationReason}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">Supplier Data</h3>
          <p className="mt-2 text-sm text-slate-600">{supplier.contactPerson} · {supplier.phone} · {supplier.email}</p>
          <p className="mt-2 text-sm text-slate-600">Lead Time {request.leadTimeDays} days · MOQ {request.moq} {request.unit}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">Supplier Contact History</h3>
          <p className="mt-2 text-sm text-slate-600">{request.supplierContactLogSummary}</p>
          <p className="mt-2 text-xs text-slate-400">Related logs: {logs.length}</p>
        </Card>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
        <Button variant="secondary" onClick={() => onCalculation(request)}><Calculator className="h-4 w-4" /> Calculation Detail</Button>
        <Button variant="secondary" onClick={() => onContactSupplier(supplier.id)}><Phone className="h-4 w-4" /> Contact Supplier</Button>
        <Button variant="secondary" onClick={() => onAction(request.id, "More Info", "Request More Info", "Central ขอข้อมูลเพิ่มเติม")}>Request More Info</Button>
        <Button variant="danger" onClick={() => onAction(request.id, "Rejected", "Central Reject", "Central ไม่อนุมัติ")}>Central Reject</Button>
        <Button variant="success" onClick={() => onAction(request.id, "Approved", "Central Approve", "อนุมัติโดย Central")}>Central Approve</Button>
      </div>
    </Card>
  );
}

function ReviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function RequestHistoryPage({
  requests,
  contactLogs,
  selectedRequestId,
  onSelectRequest,
}: {
  requests: PurchaseRequest[];
  contactLogs: SupplierContactLog[];
  selectedRequestId: string;
  onSelectRequest: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = requests.filter((request) => {
    const sku = getSku(request.skuId);
    const supplier = getSupplier(request.supplierId);
    return `${request.id} ${sku.id} ${sku.name} ${supplier.name} ${request.status}`.toLowerCase().includes(search.toLowerCase());
  });
  const selected = requests.find((request) => request.id === selectedRequestId) ?? requests[0];
  const logs = selected ? contactLogs.filter((log) => log.requestId === selected.id || log.supplierId === selected.supplierId) : [];

  return (
    <>
      <PageTitle eyebrow="History" title="Request History & Audit Trail" subtitle="แสดงคำขอซื้อย้อนหลังและ Snapshot ที่ถูกเก็บ ณ วันที่ส่งคำขอ" />
      <Card className="mb-5 p-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="relative col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Request ID / Item / Supplier / Status" />
          </div>
          <select className={inputClass} defaultValue="All Status"><option>All Status</option><option>Approved</option><option>Pending</option><option>Rejected</option></select>
          <select className={inputClass} defaultValue="Formula v1.0"><option>Formula v1.0</option></select>
        </div>
      </Card>
      <div className="grid grid-cols-[1fr_430px] gap-5">
        <Card>
          <SectionHeader title="History Table" subtitle="เลือก Request เพื่อดู Audit Trail" />
          <DataTable columns={["Request ID", "Item", "Supplier", "AI Suggest", "Requested", "Approved", "Status"]} empty={filtered.length === 0}>
            {filtered.map((request) => {
              const sku = getSku(request.skuId);
              const supplier = getSupplier(request.supplierId);
              return (
                <tr key={request.id} onClick={() => onSelectRequest(request.id)} className={`cursor-pointer hover:bg-slate-50 ${selected?.id === request.id ? "bg-blue-50" : ""}`}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{request.id}</td>
                  <td className="px-4 py-3">{sku.name}</td>
                  <td className="px-4 py-3">{supplier.name}</td>
                  <td className="px-4 py-3">{request.aiSuggestedQuantity} {request.unit}</td>
                  <td className="px-4 py-3">{request.requestedQuantity} {request.unit}</td>
                  <td className="px-4 py-3">{request.approvedQuantity ?? "-"} {request.approvedQuantity ? request.unit : ""}</td>
                  <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
                </tr>
              );
            })}
          </DataTable>
        </Card>
        {selected ? <HistoryDetail request={selected} logs={logs} /> : null}
      </div>
    </>
  );
}

function HistoryDetail({ request, logs }: { request: PurchaseRequest; logs: SupplierContactLog[] }) {
  const sku = getSku(request.skuId);
  const supplier = getSupplier(request.supplierId);
  return (
    <Card>
      <SectionHeader title={`Audit Detail · ${request.id}`} subtitle={`${sku.id} ${sku.name}`} action={<StatusBadge status={request.status} />} />
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <ReviewMetric label="AI Suggested Quantity" value={`${request.aiSuggestedQuantity} ${request.unit}`} />
          <ReviewMetric label="Requested Quantity" value={`${request.requestedQuantity} ${request.unit}`} />
          <ReviewMetric label="Approved Quantity" value={`${request.approvedQuantity ?? "-"} ${request.approvedQuantity ? request.unit : ""}`} />
          <ReviewMetric label="Variance" value={`${request.variancePercent > 0 ? "+" : ""}${formatNumber(request.variancePercent)}%`} />
          <ReviewMetric label="Formula Version" value={request.formulaVersion} />
          <ReviewMetric label="Supplier Lead Time" value={`${request.leadTimeDays} days`} />
          <ReviewMetric label="Unit Price at Request Date" value={`${formatTHB(request.unitPrice)}/${request.unit}`} />
          <ReviewMetric label="Supplier" value={supplier.name} />
        </div>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">Override Reason</h3>
          <p className="mt-2 text-sm text-slate-600">{request.overrideReasonCategory ?? "ไม่มี Override"}</p>
          <p className="mt-1 text-sm text-slate-500">{request.overrideReasonText ?? "-"}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">Calculation Snapshot</h3>
          <p className="mt-2 text-sm text-slate-600">Safety Stock: {request.calculationSnapshot.safetyStock}</p>
          <p className="mt-1 text-sm text-slate-600">Reorder Point: {request.calculationSnapshot.reorderPoint}</p>
          <p className="mt-1 text-sm text-slate-600">Suggested Quantity: {request.calculationSnapshot.suggestedQuantity}</p>
          <p className="mt-2 text-xs text-slate-400">Snapshot ถูกเก็บ ณ วันที่ส่งคำขอ ไม่ recalculated</p>
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 font-semibold text-slate-950">Approval Timeline</h3>
          <ApprovalTimeline items={request.timeline} />
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">Supplier Contact History</h3>
          <div className="mt-3 space-y-2">
            {logs.map((log) => (
              <p key={log.id} className="rounded-md bg-slate-50 p-2 text-sm text-slate-600">{log.createdAt} · {log.channel} · {log.note}</p>
            ))}
          </div>
        </Card>
      </div>
    </Card>
  );
}

function VmiCandidatePage({ onSimulation, openSku }: { onSimulation: () => void; openSku: (skuId: string) => void }) {
  return (
    <>
      <PageTitle eyebrow="VMI" title="VMI Candidate Analysis" subtitle="AI วิเคราะห์ SKU ที่เหมาะสมสำหรับ Vendor Managed Inventory" />
      <div className="grid grid-cols-[1fr_360px] gap-5">
        <Card>
          <SectionHeader title="Candidate Table" subtitle="จัดลำดับจาก Demand Stability, Supplier Reliability และ Score" />
          <DataTable columns={["SKU", "Item", "Demand Stability", "Supplier Reliability", "Score", "Action"]}>
            {vmiCandidates.map((candidate) => {
              const sku = getSku(candidate.skuId);
              return (
                <tr key={candidate.skuId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{sku.id}</td>
                  <td className="px-4 py-3">{sku.name}</td>
                  <td className="px-4 py-3">{candidate.demandStability}</td>
                  <td className="px-4 py-3">{candidate.supplierReliability}%</td>
                  <td className="px-4 py-3 font-semibold text-blue-700">{candidate.score}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => openSku(candidate.skuId)}>SKU Detail</Button>
                      <Button onClick={onSimulation}>Sim</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-700" />
            <h3 className="font-semibold text-slate-950">AI Summary</h3>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            AI แนะนำ C01 สายไฟแรงต่ำเป็น VMI Candidate อันดับหนึ่ง เพราะ Demand Stability สูง Supplier Reliability 96% และมี Score 88
          </p>
          <StatusBadge status="VMI Candidate" />
          <Button className="mt-5 w-full" onClick={onSimulation}><Workflow className="h-4 w-4" /> เปิด VMI Simulation</Button>
        </Card>
      </div>
    </>
  );
}

function VmiSimulationPage({
  onBack,
  onCreateProposal,
}: {
  onBack: () => void;
  onCreateProposal: () => void;
}) {
  return (
    <>
      <PageTitle
        eyebrow="VMI Simulation"
        title="เปรียบเทียบ Current Inventory Model vs VMI"
        subtitle="จำลองผลกระทบด้าน Safety Stock, ROP, Lead Time, Inventory Value และ Manual Orders"
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>}
      />
      <div className="grid grid-cols-[1fr_360px] gap-5">
        <Card>
          <SectionHeader title="Comparison Table" subtitle="C01 สายไฟแรงต่ำ · WH-001" />
          <DataTable columns={["Metric", "Current", "VMI", "Impact"]}>
            {vmiComparison.map((row) => (
              <tr key={row.metric}>
                <td className="px-4 py-3 font-semibold text-slate-900">{row.metric}</td>
                <td className="px-4 py-3">{row.current}</td>
                <td className="px-4 py-3 text-blue-700">{row.vmi}</td>
                <td className="px-4 py-3 font-semibold text-emerald-700">{row.impact}</td>
              </tr>
            ))}
          </DataTable>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-slate-950">AI Recommendation</h3>
          <p className="mt-4 rounded-lg bg-violet-50 p-4 text-sm font-medium leading-6 text-violet-800">
            ควรทดลอง VMI กับ SKU นี้ในระดับเขต
          </p>
          <div className="mt-5 grid gap-2">
            <Button onClick={onCreateProposal}><Plus className="h-4 w-4" /> Create VMI Proposal</Button>
            <Button variant="secondary"><FileText className="h-4 w-4" /> Compare Normal Purchase</Button>
          </div>
        </Card>
      </div>
    </>
  );
}

function SettingsPage() {
  return (
    <>
      <PageTitle eyebrow="Settings" title="Formula & Policy" subtitle="ตั้งค่า Formula version และ Approval / Override policy สำหรับ Prototype" />
      <div className="grid grid-cols-[1fr_380px] gap-5">
        <Card>
          <SectionHeader title="Formula Version v1.0" subtitle="ค่าตั้งต้นสำหรับ Inventory Planning" />
          <div className="grid grid-cols-2 gap-4 p-5">
            <ReviewMetric label="Service Level" value="95%" />
            <ReviewMetric label="Z-score" value="1.65" />
            <ReviewMetric label="Seasonal Factor Default" value="1.20" />
            <ReviewMetric label="Budget Factor Default" value="1.00" />
          </div>
          <div className="border-t border-slate-200 p-5">
            <h3 className="font-semibold text-slate-950">Calculation Formulas</h3>
            <div className="mt-3 grid gap-2">
              {formulaList.map((formula, index) => (
                <p key={formula} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">{index + 1}. {formula}</p>
              ))}
            </div>
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-950">Approval Policy Rules</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>Estimated Cost ≤ Local Budget Remaining → Local approval</p>
              <p>Estimated Cost &gt; Local และ ≤ Regional → Regional approval</p>
              <p>Estimated Cost &gt; Regional → Regional Approve & Pass to Central</p>
              <p>Central can approve, reject, or request more information</p>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-950">Override Policy</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>Require reason if Requested Quantity differs from AI Suggested Quantity</p>
              <p>High variance threshold = 50%</p>
              <p>Show warning for request greater or less than AI suggestion</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function getSku(id: string) {
  return skus.find((sku) => sku.id === id) ?? skus[0];
}

function getWarehouse(id: string) {
  return warehouses.find((warehouse) => warehouse.id === id) ?? warehouses[0];
}

function getSupplier(id: string) {
  return suppliers.find((supplier) => supplier.id === id) ?? suppliers[0];
}

function getOffer(supplierId: string, skuId: string) {
  return supplierOffers.find((offer) => offer.supplierId === supplierId && offer.skuId === skuId);
}

function getRegionalBudget(region: string) {
  return regionalBudgets.find((budget) => budget.region === region)?.remaining ?? 0;
}

function getRecommendedLayer(cost: number, localBudget: number, regionalBudget: number): ApprovalLayer {
  if (cost <= localBudget) {
    return "Local";
  }
  if (cost <= regionalBudget) {
    return "Regional";
  }
  return "Central";
}

export default App;
