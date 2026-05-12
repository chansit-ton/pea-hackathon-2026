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
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  Workflow,
  X,
} from "lucide-react";
import {
  centralBudgetRemaining,
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
  warehouses,
} from "./data/mockData";
import { CalculationExplanationPanel } from "./components/CalculationExplanationPanel";
import { CalculationSnapshotView } from "./components/CalculationSnapshotView";
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
import {
  calculateImpact,
  calculateInventoryRecommendation,
  calculateInventoryValue,
  calculatePurchaseRequestPreview,
  calculateVmiReorderPoint,
  calculateVmiSafetyStock,
  calculateZScoreFromServiceLevel,
  getOverrideWarningMessage,
  getVmiRecommendation,
} from "./utils/inventoryCalculations";
import { formatCurrency, formatPercent } from "./utils/formatters";
import type {
  BudgetContext,
  ContactChannel,
  InventoryRecord,
  PurchaseRequest,
  PurchaseRequestCalculationSnapshot,
  Region,
  Sku,
  Supplier,
  SupplierOffer,
  SupplierSkuRecord,
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

type FormulaPolicyState = {
  formulaVersion: string;
  serviceLevel: number;
  zScore: number;
  seasonalFactor: number;
  budgetFactor: number;
  highVarianceThreshold: number;
};

type ChangeLogEntry = {
  id: string;
  area: "Settings" | "Supplier";
  target: string;
  field: string;
  oldValue: string;
  newValue: string;
  actor: string;
  createdAt: string;
  note: string;
};

type FormulaVersionRecord = FormulaPolicyState & {
  createdAt: string;
  note: string;
};

type SupplierCatalogInput = {
  supplier: Supplier;
  sku: Sku;
  offer: SupplierOffer;
  inventory: InventoryRecord;
  note: string;
};

type SupplierProfileInput = Supplier & {
  note: string;
};

type SupplierStatus = "Active" | "No Catalog";

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
  const [editableSupplierOffers, setEditableSupplierOffers] = useState<SupplierOffer[]>(supplierOffers);
  const [formulaPolicy, setFormulaPolicy] = useState<FormulaPolicyState>({
    formulaVersion,
    serviceLevel: 0.95,
    zScore: calculateZScoreFromServiceLevel(0.95),
    seasonalFactor: 1.2,
    budgetFactor: 1,
    highVarianceThreshold: 50,
  });
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>([]);
  const [formulaVersions, setFormulaVersions] = useState<FormulaVersionRecord[]>([
    {
      formulaVersion: formulaPolicy.formulaVersion,
      serviceLevel: 0.95,
      zScore: calculateZScoreFromServiceLevel(0.95),
      seasonalFactor: 1.2,
      budgetFactor: 1,
      highVarianceThreshold: 50,
      createdAt: "2026-05-05 09:00",
      note: "Initial mock formula policy",
    },
  ]);

  // Later API integration point: replace these in-memory stores with service calls
  // to SAP/procurement/budget systems while keeping request snapshots immutable.
  const [requests, setRequests] = useState<PurchaseRequest[]>(initialRequests);
  const [contactLogs, setContactLogs] = useState<SupplierContactLog[]>(initialContactLogs);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  // เก็บ audit log ของการแก้ไขค่าตั้งต้นใน prototype
  // ถ้าต่อ API จริง จุดนี้สามารถเปลี่ยนเป็น service call เพื่อบันทึกลงฐานข้อมูลได้
  const addChangeLog = (entry: Omit<ChangeLogEntry, "id" | "actor" | "createdAt">) => {
    setChangeLogs((current) => [
      {
        ...entry,
        id: `CHG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        actor: "Demo Admin",
        createdAt: "2026-05-05 14:30",
      },
      ...current,
    ]);
  };

  const updateSupplierOffer = (updatedOffer: SupplierOffer, note: string) => {
    const oldOffer = editableSupplierOffers.find(
      (offer) => offer.supplierId === updatedOffer.supplierId && offer.skuId === updatedOffer.skuId,
    );
    const trackedFields: Array<keyof Pick<SupplierOffer, "unitPrice" | "leadTimeDays" | "moq" | "reliabilityScore">> = [
      "unitPrice",
      "leadTimeDays",
      "moq",
      "reliabilityScore",
    ];
    const hasChangedValue = oldOffer ? trackedFields.some((field) => oldOffer[field] !== updatedOffer[field]) : true;

    setEditableSupplierOffers((current) =>
      current.map((offer) =>
        offer.supplierId === updatedOffer.supplierId && offer.skuId === updatedOffer.skuId ? updatedOffer : offer,
      ),
    );

    if (oldOffer && hasChangedValue) {
      addSupplierOfferChangeLogs(oldOffer, updatedOffer, note, addChangeLog);
    } else if (oldOffer) {
      // ถ้าผู้ใช้กด Save แต่ตัวเลขยังไม่เปลี่ยน ให้บันทึก audit entry ไว้ชัดเจน
      // เพื่อไม่ให้ดูเหมือนปุ่ม Save ไม่ทำงานหรือ Change Log ไม่ตอบสนอง
      addChangeLog({
        area: "Supplier",
        target: `${updatedOffer.supplierId}-${updatedOffer.skuId}`,
        field: "Saved",
        oldValue: "No value change",
        newValue: "Confirmed current supplier offer",
        note: note || "ผู้ใช้กดยืนยันข้อมูล Supplier Offer โดยไม่มีการเปลี่ยนตัวเลข",
      });
    }
    notify("บันทึกข้อมูล Supplier แล้ว");
  };

  const addSupplierProfile = (profile: SupplierProfileInput) => {
    const supplier: Supplier = {
      id: profile.id.trim(),
      name: profile.name.trim(),
      contactPerson: profile.contactPerson.trim(),
      phone: profile.phone.trim(),
      email: profile.email.trim(),
      lineId: profile.lineId.trim(),
      coverage: profile.coverage,
    };
    const existingIndex = suppliers.findIndex((item) => item.id === supplier.id);

    // หน้า Supplier Directory ใช้เพิ่มเฉพาะ Supplier profile
    // ส่วน SKU/Lead Time/MOQ จะไปเพิ่มต่อใน Supplier Detail ผ่าน Add Supported Items
    if (existingIndex >= 0) {
      suppliers[existingIndex] = supplier;
    } else {
      suppliers.push(supplier);
    }

    addChangeLog({
      area: "Supplier",
      target: supplier.id,
      field: "Supplier Profile",
      oldValue: existingIndex >= 0 ? "Existing supplier" : "-",
      newValue: `${supplier.name} / ${supplier.contactPerson}`,
      note: profile.note || "เพิ่ม Supplier ใหม่จาก Supplier Directory",
    });
    setSelectedSupplierId(supplier.id);
    notify(existingIndex >= 0 ? "อัปเดตข้อมูล Supplier แล้ว" : "เพิ่ม Supplier ใหม่แล้ว");
  };

  const updateSupplierProfile = (profile: SupplierProfileInput) => {
    const previous = suppliers.find((supplier) => supplier.id === profile.id);
    const updated: Supplier = {
      id: profile.id.trim(),
      name: profile.name.trim(),
      contactPerson: profile.contactPerson.trim(),
      phone: profile.phone.trim(),
      email: profile.email.trim(),
      lineId: profile.lineId.trim(),
      coverage: profile.coverage,
    };
    const existingIndex = suppliers.findIndex((supplier) => supplier.id === updated.id);

    if (existingIndex >= 0) {
      suppliers[existingIndex] = updated;
    }

    // Contact/profile edit ถูกย้ายมาไว้ใน Supplier Detail
    // บันทึก log ราย field เพื่อให้ audit เห็นว่าแก้เบอร์ อีเมล หรือ coverage ตรงไหน
    if (previous) {
      addSupplierProfileChangeLogs(previous, updated, profile.note, addChangeLog);
    }
    setSelectedSupplierId(updated.id);
    notify("บันทึกข้อมูลติดต่อ Supplier แล้ว");
  };

  const addSupplierCatalog = (catalog: SupplierCatalogInput) => {
    const existingSupplierIndex = suppliers.findIndex((supplier) => supplier.id === catalog.supplier.id);
    const existingSkuIndex = skus.findIndex((sku) => sku.id === catalog.sku.id);
    const existingInventoryIndex = inventoryRecords.findIndex(
      (record) => record.skuId === catalog.inventory.skuId && record.warehouseId === catalog.inventory.warehouseId,
    );

    const supplierSkuRecord: SupplierSkuRecord = {
      supplierId: catalog.supplier.id,
      supplierName: catalog.supplier.name,
      sku: catalog.sku.id,
      unitPrice: catalog.offer.unitPrice,
      currency: catalog.offer.currency,
      unit: catalog.offer.unit,
      leadTimeDays: catalog.offer.leadTimeDays,
      moq: catalog.offer.moq,
      reliabilityScore: catalog.offer.reliabilityScore ?? 85,
      contactPerson: catalog.supplier.contactPerson,
      phone: catalog.supplier.phone,
      email: catalog.supplier.email,
      lineId: catalog.supplier.lineId,
    };
    const recommendation = calculateInventoryRecommendation({
      inventory: catalog.inventory,
      supplier: supplierSkuRecord,
      formulaVersion: formulaPolicy.formulaVersion,
    });
    const inventoryWithStatus: InventoryRecord = {
      ...catalog.inventory,
      status:
        catalog.inventory.currentStock <= recommendation.safetyStock
          ? "Critical"
          : catalog.inventory.currentStock <= recommendation.reorderPoint
            ? "Near Reorder Point"
            : "Normal",
    };

    // ส่วนนี้ยังเป็น PoC frontend state: helper เดิมในไฟล์นี้อ่าน mock arrays โดยตรง
    // จึง mirror รายการใหม่เข้า mock arrays ด้วย เพื่อให้หน้า Dashboard/Inventory/SKU Detail เห็นข้อมูลใหม่ทันที
    if (existingSupplierIndex >= 0) {
      suppliers[existingSupplierIndex] = catalog.supplier;
    } else {
      suppliers.push(catalog.supplier);
    }

    if (existingSkuIndex >= 0) {
      skus[existingSkuIndex] = catalog.sku;
    } else {
      skus.push(catalog.sku);
    }

    if (existingInventoryIndex >= 0) {
      inventoryRecords[existingInventoryIndex] = inventoryWithStatus;
    } else {
      inventoryRecords.push(inventoryWithStatus);
    }

    // Supplier Offer เป็น state อยู่แล้ว เพราะผู้ใช้แก้ราคา/Lead Time/MOQ ได้ในหน้า Supplier Detail
    // เมื่อเพิ่ม catalog ใหม่จึง upsert เข้า state นี้เพื่อให้ calculation engine ใช้ราคากับ MOQ ล่าสุด
    setEditableSupplierOffers((current) => [
      catalog.offer,
      ...current.filter((offer) => !(offer.supplierId === catalog.offer.supplierId && offer.skuId === catalog.offer.skuId)),
    ]);

    addChangeLog({
      area: "Supplier",
      target: `${catalog.supplier.id}-${catalog.sku.id}`,
      field: "Catalog",
      oldValue: "-",
      newValue: `${catalog.supplier.name} / ${catalog.sku.id} ${catalog.sku.name}`,
      note: catalog.note,
    });
    addChangeLog({
      area: "Supplier",
      target: `${catalog.supplier.id}-${catalog.sku.id}`,
      field: "Calculation Inputs",
      oldValue: "-",
      newValue: `Stock ${catalog.inventory.currentStock}, Forecast ${catalog.inventory.forecastDemandForPlanningPeriod}, LT ${catalog.offer.leadTimeDays}, MOQ ${catalog.offer.moq}`,
      note: "เพิ่มข้อมูลที่จำเป็นสำหรับ Safety Stock, ROP, Suggested Quantity และ Estimated Cost",
    });

    setSelectedSupplierId(catalog.supplier.id);
    setSelectedSkuId(catalog.sku.id);
    setView("supplier-detail");
    notify(`เพิ่ม Catalog ${catalog.sku.id} สำหรับ ${catalog.supplier.name} แล้ว`);
  };

  const saveFormulaPolicy = (nextPolicy: FormulaPolicyState, note: string) => {
    const previous = formulaPolicy;
    const policyWithDerivedZScore = {
      ...nextPolicy,
      zScore: calculateZScoreFromServiceLevel(nextPolicy.serviceLevel),
    };
    setFormulaPolicy(policyWithDerivedZScore);
    setFormulaVersions((current) => [{ ...policyWithDerivedZScore, createdAt: "2026-05-05 14:30", note }, ...current]);

    addFormulaPolicyChangeLogs(previous, policyWithDerivedZScore, note, addChangeLog);
    notify(`บันทึก Formula ${policyWithDerivedZScore.formulaVersion} แล้ว`);
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
    // ถ้าบันทึกจาก Supplier Directory ให้คงอยู่หน้าแรกของ Supplier
    // แต่ยังรองรับหน้า Contact Log เดิม: ถ้าเข้าหน้านั้นโดยตรงแล้ว save จะกลับ Supplier Detail
    if (view === "contact-log") {
      setView("supplier-detail");
    }
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
        return <DashboardPage openSku={openSku} requests={requests} supplierOfferData={editableSupplierOffers} formulaPolicy={formulaPolicy} />;
      case "inventory":
        return <InventoryPage openSku={openSku} supplierOfferData={editableSupplierOffers} formulaPolicy={formulaPolicy} />;
      case "sku-detail":
        return (
          <SkuDetailPage
            skuId={selectedSkuId}
            supplierOfferData={editableSupplierOffers}
            formulaPolicy={formulaPolicy}
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
            supplierOfferData={editableSupplierOffers}
            formulaPolicy={formulaPolicy}
            request={requests.find((item) => item.id === selectedRequestId)}
            onBack={() => setView("sku-detail")}
          />
        );
      case "supplier":
        return (
          <SupplierDirectoryPage
            selectedSupplierId={selectedSupplierId}
            supplierOfferData={editableSupplierOffers}
            contactLogs={contactLogs}
            onSelectSupplier={setSelectedSupplierId}
            onOpenDetail={() => setView("supplier-detail")}
            onCopy={copyToClipboard}
            onAddSupplier={addSupplierProfile}
          />
        );
      case "supplier-detail":
        return (
          <SupplierDetailPage
            supplierId={selectedSupplierId}
            supplierOfferData={editableSupplierOffers}
            changeLogs={changeLogs}
            onUpdateOffer={updateSupplierOffer}
            contactLogs={contactLogs}
            onBack={() => setView("supplier")}
            onCopy={copyToClipboard}
            onUpdateSupplier={updateSupplierProfile}
            formulaPolicy={formulaPolicy}
            onAddCatalog={addSupplierCatalog}
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
            supplierOfferData={editableSupplierOffers}
            formulaPolicy={formulaPolicy}
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
        return <VmiSimulationPage supplierOfferData={editableSupplierOffers} formulaPolicy={formulaPolicy} onBack={() => setView("vmi")} onCreateProposal={() => notify("สร้าง VMI Proposal แบบร่างแล้ว")} />;
      case "settings":
        return <SettingsPage formulaPolicy={formulaPolicy} formulaVersions={formulaVersions} changeLogs={changeLogs} onSaveFormulaPolicy={saveFormulaPolicy} />;
      default:
        return null;
    }
  })();

  return (
    <AppLayout view={view} formulaPolicy={formulaPolicy} onNavigate={setView}>
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
  formulaPolicy,
  onNavigate,
  children,
}: {
  view: View;
  formulaPolicy: FormulaPolicyState;
  onNavigate: (view: View) => void;
  children: ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
  const handleNavigate = (nextView: View) => {
    onNavigate(nextView);
    setMobileMenuOpen(false);
  };

  const renderSidebar = (mode: "desktop" | "mobile") => {
    const collapsed = mode === "desktop" && sidebarCollapsed;

    return (
      <>
        <div className={`border-b border-white/10 ${collapsed ? "px-3 py-5" : "px-5 py-5"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between gap-3"}`}>
            <div className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-3"}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500">
                <Sparkles className="h-5 w-5" />
              </div>
              {!collapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">PEA AI Inventory</p>
                  <p className="truncate text-xs text-slate-400">Procurement Platform</p>
                </div>
              ) : null}
            </div>
            {mode === "mobile" ? (
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>

        <nav className={`space-y-1 ${collapsed ? "p-2" : "p-3"}`}>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = activeRoot === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                title={collapsed ? item.label : undefined}
                className={`flex h-10 w-full items-center rounded-md text-sm font-medium transition ${
                  collapsed ? "justify-center px-0" : "gap-3 px-3 text-left"
                } ${active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
              </button>
            );
          })}
        </nav>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      {mobileMenuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close sidebar overlay"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-800 bg-slate-950 text-white shadow-2xl transition-transform duration-200 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebar("mobile")}
      </aside>

      <aside
        className={`hidden shrink-0 border-r border-slate-900 bg-slate-950 text-white transition-[width] duration-200 lg:block ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {renderSidebar("desktop")}
      </aside>

      <main className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:inline-flex"
                onClick={() => setSidebarCollapsed((current) => !current)}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mock Prototype · No real API connections</p>
                <h1 className="mt-1 text-lg font-semibold text-slate-950 sm:text-xl">AI Inventory Planning & Procurement Platform</h1>
              </div>
            </div>
            <div className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 sm:w-auto">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="truncate">Formula {formulaPolicy.formulaVersion} · Service Level {formatPercent(formulaPolicy.serviceLevel * 100).replace("+", "")}</span>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-7">{children}</div>
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
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function DashboardPage({
  openSku,
  requests,
  supplierOfferData,
  formulaPolicy,
}: {
  openSku: (skuId: string) => void;
  requests: PurchaseRequest[];
  supplierOfferData: SupplierOffer[];
  formulaPolicy: FormulaPolicyState;
}) {
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total SKU" value={String(skus.length)} helper="รายการ" tone="slate" />
        <MetricCard label="Risk SKU" value={String(riskCount)} helper="ต้องติดตาม" tone="red" />
        <MetricCard label="Pending PR" value={String(pendingCount)} helper="รออนุมัติ" tone="blue" />
        <MetricCard label="VMI Candidate" value="1" helper="แนะนำ C01" tone="purple" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
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

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <SectionHeader title="Critical Stock Alert" subtitle="รายการที่ Stock ต่ำกว่า ROP หรือ Safety Stock" />
          <DataTable columns={["SKU", "Item", "Warehouse", "Stock", "ROP", "Status", "Action"]}>
            {inventoryRecords.map((record) => {
              const sku = getSku(record.skuId);
              const warehouse = getWarehouse(record.warehouseId);
              const recommendation = getDefaultRecommendation(record, supplierOfferData, formulaPolicy);
              return (
                <tr key={`${record.skuId}-${record.warehouseId}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{sku.id}</td>
                  <td className="px-4 py-3 text-slate-700">{sku.name}</td>
                  <td className="px-4 py-3 text-slate-600">{warehouse.name}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNumber(record.currentStock)} {sku.unit}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNumber(recommendation.reorderPoint)} {sku.unit}</td>
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

function InventoryPage({
  openSku,
  supplierOfferData,
  formulaPolicy,
}: {
  openSku: (skuId: string) => void;
  supplierOfferData: SupplierOffer[];
  formulaPolicy: FormulaPolicyState;
}) {
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
            const recommendation = getDefaultRecommendation(record, supplierOfferData, formulaPolicy);
            return (
              <tr key={`${record.skuId}-${record.warehouseId}`} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{sku.id}</td>
                <td className="px-4 py-3">{sku.name}</td>
                <td className="px-4 py-3">{warehouse.id} · {warehouse.name}</td>
                <td className="px-4 py-3">{formatNumber(record.currentStock)} {sku.unit}</td>
                <td className="px-4 py-3">{formatNumber(recommendation.safetyStock)} {sku.unit}</td>
                <td className="px-4 py-3">{formatNumber(recommendation.reorderPoint)} {sku.unit}</td>
                <td className="px-4 py-3 font-semibold text-blue-700">{formatNumber(recommendation.suggestedQuantity)} {sku.unit}</td>
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
  supplierOfferData,
  formulaPolicy,
  onBack,
  onCalculation,
  onCreateRequest,
  onSupplier,
  onVmi,
}: {
  skuId: string;
  supplierOfferData: SupplierOffer[];
  formulaPolicy: FormulaPolicyState;
  onBack: () => void;
  onCalculation: () => void;
  onCreateRequest: (supplierId: string) => void;
  onSupplier: (supplierId: string) => void;
  onVmi: () => void;
}) {
  const sku = getSku(skuId);
  const record = applyFormulaPolicy(inventoryRecords.find((item) => item.skuId === skuId) ?? inventoryRecords[0], formulaPolicy);
  const warehouse = getWarehouse(record.warehouseId);
  const offers = supplierOfferData.filter((offer) => offer.skuId === skuId);
  const primaryOffer = offers[0];
  const primarySupplier = getSupplier(primaryOffer?.supplierId ?? "S001");
  const primarySupplierRecord = getSupplierSkuRecord(primaryOffer?.supplierId ?? "S001", skuId, supplierOfferData);
  const recommendation = calculateInventoryRecommendation({ inventory: record, supplier: primarySupplierRecord, formulaVersion: formulaPolicy.formulaVersion });
  const budget = getBudgetContextForInventory(record);
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <>
      <PageTitle
        eyebrow="Inventory / SKU Detail"
        title={`${sku.id} ${sku.name}`}
        subtitle={`${warehouse.id} ${warehouse.name} · ${regionLabels[warehouse.region]} · Capacity Used ${warehouse.capacityUsed}%`}
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <MetricCard label="Current Stock" value={`${formatNumber(record.currentStock)} ${sku.unit}`} helper="คงเหลือ" />
        <MetricCard label="Average Daily Demand" value={`${formatNumber(recommendation.averageDailyDemand)} ${sku.unit}`} helper="ต่อวัน" />
        <MetricCard label="Safety Stock" value={`${formatNumber(recommendation.safetyStock)} ${sku.unit}`} helper="กันขาด" tone="green" />
        <MetricCard label="Reorder Point" value={`${formatNumber(recommendation.reorderPoint)} ${sku.unit}`} helper="ROP" tone="red" />
        <MetricCard label="Forecast Demand" value={`${formatNumber(recommendation.forecastDemandForPlanningPeriod)} ${sku.unit}`} helper="Planning" />
        <MetricCard label="AI Suggested Quantity" value={`${formatNumber(recommendation.suggestedQuantity)} ${sku.unit}`} helper="AI" tone="blue" />
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="secondary" onClick={() => setShowExplanation((current) => !current)}>
          <Calculator className="h-4 w-4" />
          ทำไมระบบแนะนำค่านี้?
        </Button>
      </div>
      {showExplanation ? (
        <div className="mt-4">
          <CalculationExplanationPanel
            inventory={record}
            supplier={primarySupplierRecord}
            recommendation={recommendation}
            budget={budget}
            onClose={() => setShowExplanation(false)}
          />
        </div>
      ) : null}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
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
  supplierOfferData,
  formulaPolicy,
  request,
  onBack,
}: {
  skuId: string;
  supplierOfferData: SupplierOffer[];
  formulaPolicy: FormulaPolicyState;
  request?: PurchaseRequest;
  onBack: () => void;
}) {
  const sku = getSku(skuId);
  const record = applyFormulaPolicy(inventoryRecords.find((item) => item.skuId === skuId) ?? inventoryRecords[0], formulaPolicy);
  const supplierId = request?.supplierId ?? getDefaultOffer(record.skuId, supplierOfferData).supplierId;
  const supplierRecord = getSupplierSkuRecord(supplierId, skuId, supplierOfferData);
  const recommendation = request?.calculationSnapshot ?? calculateInventoryRecommendation({ inventory: record, supplier: supplierRecord, formulaVersion: formulaPolicy.formulaVersion });
  const snapshot = request?.calculationSnapshot;
  const budget = snapshot?.budgetContextAtRequestDate ?? getBudgetContextForInventory(record);
  const preview = snapshot
    ? undefined
    : calculatePurchaseRequestPreview({
        recommendation,
        requestedQuantity: recommendation.suggestedQuantity,
        unitPrice: supplierRecord.unitPrice,
        budget,
      });

  return (
    <>
      <PageTitle
        eyebrow="Calculation Detail"
        title={`${sku.id} ${sku.name} · Formula Version ${recommendation.formulaVersion}`}
        subtitle="คำอธิบายวิธีคำนวณ Safety Stock, Reorder Point, Suggested Quantity และ Approval Routing"
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back to SKU Detail</Button>}
      />
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {formulaList.map((formula, index) => (
          <Card key={formula} className="p-3">
            <p className="text-xs font-semibold text-slate-500">Formula {index + 1}</p>
            <p className="mt-2 text-sm text-slate-700">{formula}</p>
          </Card>
        ))}
      </div>
      <CalculationExplanationPanel
        inventory={record}
        supplier={supplierRecord}
        recommendation={recommendation}
        budget={budget}
        preview={preview}
        requestedQuantity={snapshot?.requestedQuantity ?? recommendation.suggestedQuantity}
        snapshot={snapshot}
      />
    </>
  );
}
function SupplierDirectoryPage({
  selectedSupplierId,
  supplierOfferData,
  contactLogs,
  onSelectSupplier,
  onOpenDetail,
  onCopy,
  onAddSupplier,
}: {
  selectedSupplierId: string;
  supplierOfferData: SupplierOffer[];
  contactLogs: SupplierContactLog[];
  onSelectSupplier: (id: string) => void;
  onOpenDetail: () => void;
  onCopy: (value: string) => void;
  onAddSupplier: (profile: SupplierProfileInput) => void;
}) {
  const [search, setSearch] = useState("");
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const filteredSuppliers = suppliers.filter((supplier) => {
    const supportedSkuText = supplierOfferData
      .filter((offer) => offer.supplierId === supplier.id)
      .map((offer) => {
        const sku = getSku(offer.skuId);
        return `${sku.id} ${sku.name} ${sku.category}`;
      })
      .join(" ");
    return `${supplier.name} ${supplier.contactPerson} ${supplier.email} ${supportedSkuText}`.toLowerCase().includes(search.toLowerCase());
  });
  const selectedSupplier = getSupplier(selectedSupplierId);
  const saveSupplier = (profile: SupplierProfileInput) => {
    onAddSupplier(profile);
    setShowAddSupplier(false);
  };

  return (
    <>
      <PageTitle eyebrow="Supplier" title="Supplier Directory" subtitle="ค้นหา Supplier, SKU, Category และดูช่องทางติดต่อ" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <SectionHeader
            title="Supplier List"
            subtitle="รองรับการค้นหาด้วยชื่อ Supplier / SKU / Category"
            action={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search supplier / SKU / category" />
                </div>
                <Button onClick={() => setShowAddSupplier((current) => !current)}>
                  <Plus className="h-4 w-4" />
                  Add Supplier
                </Button>
              </div>
            }
          />
          {showAddSupplier ? (
            <div className="border-b border-slate-200 p-5">
              <SupplierProfileForm mode="create" onSave={saveSupplier} />
            </div>
          ) : null}
          <DataTable columns={["ID", "Supplier", "Status", "Contact", "Phone", "Email", "Coverage", "Action"]} empty={filteredSuppliers.length === 0}>
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-700">{supplier.id}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{supplier.name}</td>
                <td className="px-4 py-3"><SupplierStatusBadge status={getSupplierStatus(supplier.id, supplierOfferData)} /></td>
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

        <div className="space-y-5">
          <SupplierSummaryPanel supplier={selectedSupplier} contactLogs={contactLogs} onCopy={onCopy} />
        </div>
      </div>
    </>
  );
}

function SupplierDetailPage({
  supplierId,
  supplierOfferData,
  changeLogs,
  onUpdateOffer,
  contactLogs,
  onBack,
  onCopy,
  onUpdateSupplier,
  formulaPolicy,
  onAddCatalog,
}: {
  supplierId: string;
  supplierOfferData: SupplierOffer[];
  changeLogs: ChangeLogEntry[];
  onUpdateOffer: (offer: SupplierOffer, note: string) => void;
  contactLogs: SupplierContactLog[];
  onBack: () => void;
  onCopy: (value: string) => void;
  onUpdateSupplier: (profile: SupplierProfileInput) => void;
  formulaPolicy: FormulaPolicyState;
  onAddCatalog: (catalog: SupplierCatalogInput) => void;
}) {
  const supplier = getSupplier(supplierId);
  const offers = supplierOfferData.filter((offer) => offer.supplierId === supplier.id);
  const logs = contactLogs.filter((log) => log.supplierId === supplier.id);
  const supplierChangeLogs = changeLogs.filter((log) => log.area === "Supplier" && log.target.startsWith(supplier.id)).slice(0, 8);
  const [showAddSupportedItems, setShowAddSupportedItems] = useState(false);

  // หน้า Supplier Detail ใช้ปุ่ม Add Supported Items เพื่อเปิดฟอร์มเพิ่ม SKU/Calculation Inputs
  // แทน Add Contact Log เพราะ contact log ถูกย้ายไปอยู่หน้า Supplier Directory แล้ว
  const saveSupportedItem = (catalog: SupplierCatalogInput) => {
    onAddCatalog(catalog);
    setShowAddSupportedItems(false);
  };

  return (
    <>
      <PageTitle
        eyebrow="Supplier Detail"
        title={supplier.name}
        subtitle={`${supplier.contactPerson} · ${regionLabels[supplier.coverage]}`}
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>}
      />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SupplierSummaryPanel
          supplier={supplier}
          contactLogs={contactLogs}
          onCopy={onCopy}
          onAddSupportedItems={() => setShowAddSupportedItems((current) => !current)}
          addSupportedItemsOpen={showAddSupportedItems}
        />
        <div className="space-y-5">
          <SupplierProfileForm mode="edit" supplier={supplier} onSave={onUpdateSupplier} />
          <Card>
            <SectionHeader title="Supported Items" subtitle="SKU ที่ Supplier เสนอราคาและ Lead Time" />
            <DataTable columns={["SKU", "Item", "Category", "Unit Price", "Lead Time", "MOQ", "Reliability", "Action"]}>
              {offers.map((offer) => {
                const sku = getSku(offer.skuId);
                return (
                  <SupplierOfferEditorRow key={`${offer.skuId}-${offer.supplierId}`} offer={offer} skuName={sku.name} category={sku.category} onSave={onUpdateOffer} />
                );
              })}
            </DataTable>
          </Card>
          {showAddSupportedItems ? <SupplierCatalogForm fixedSupplier={supplier} supplierOfferData={supplierOfferData} formulaPolicy={formulaPolicy} onSave={saveSupportedItem} /> : null}
          <Card>
            <SectionHeader title="Supplier Change Log" subtitle="ประวัติการแก้ไข Lead Time, MOQ, ราคา และ Reliability" />
            <DataTable columns={["Date", "Target", "Field", "Old", "New", "Note"]} empty={supplierChangeLogs.length === 0}>
              {supplierChangeLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">{log.createdAt}</td>
                  <td className="px-4 py-3">{log.target}</td>
                  <td className="px-4 py-3">{log.field}</td>
                  <td className="px-4 py-3">{log.oldValue}</td>
                  <td className="px-4 py-3">{log.newValue}</td>
                  <td className="px-4 py-3">{log.note}</td>
                </tr>
              ))}
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
  onAddSupportedItems,
  addSupportedItemsOpen = false,
}: {
  supplier: ReturnType<typeof getSupplier>;
  contactLogs: SupplierContactLog[];
  onCopy: (value: string) => void;
  onAddSupportedItems?: () => void;
  addSupportedItemsOpen?: boolean;
}) {
  const logs = contactLogs.filter((log) => log.supplierId === supplier.id).slice(0, 3);
  return (
    <div className="space-y-4">
      <SupplierContactCard supplier={supplier} onCopy={onCopy} />
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button variant="secondary"><Phone className="h-4 w-4" /> Call</Button>
          <Button variant="secondary"><Mail className="h-4 w-4" /> Email</Button>
          <Button variant="secondary" onClick={() => onCopy(supplier.phone)}>Copy Phone</Button>
          <Button variant="secondary" onClick={() => onCopy(supplier.email)}>Copy Email</Button>
        </div>
        {onAddSupportedItems ? (
          <Button className="mt-3 w-full" variant={addSupportedItemsOpen ? "secondary" : "primary"} onClick={onAddSupportedItems}>
            <Plus className="h-4 w-4" />
            {addSupportedItemsOpen ? "Hide Supported Items Form" : "Add Supported Items"}
          </Button>
        ) : null}
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

function SupplierProfileForm({
  mode,
  supplier,
  onSave,
}: {
  mode: "create" | "edit";
  supplier?: Supplier;
  onSave: (profile: SupplierProfileInput) => void;
}) {
  const [form, setForm] = useState({
    id: supplier?.id ?? getNextSupplierId(),
    name: supplier?.name ?? "บริษัท ตัวอย่าง ซัพพลาย จำกัด",
    contactPerson: supplier?.contactPerson ?? "คุณผู้ติดต่อ",
    phone: supplier?.phone ?? "089-000-0000",
    email: supplier?.email ?? "supplier@example.com",
    lineId: supplier?.lineId ?? "supplier_line",
    coverage: (supplier?.coverage ?? "North") as Region,
    note: mode === "create" ? "เพิ่ม Supplier ใหม่" : "แก้ไขข้อมูลติดต่อ Supplier",
  });
  const regionOptions: Region[] = ["North", "Northeast", "East", "South", "National"];
  const canSave = Boolean(form.id.trim() && form.name.trim() && form.contactPerson.trim() && form.phone.trim() && form.email.trim());

  // ใช้ form เดียวกันสำหรับ Add Supplier ใน Directory และแก้ข้อมูลติดต่อใน Supplier Detail
  // เพื่อให้ contact profile ถูกแก้จากหน้ารายละเอียด ไม่ปนกับ contact log/audit communication
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      id: form.id.trim(),
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      lineId: form.lineId.trim(),
      coverage: form.coverage,
      note: form.note,
    });
  };

  return (
    <Card>
      <SectionHeader
        title={mode === "create" ? "Add Supplier" : "Supplier Contact & Profile"}
        subtitle={mode === "create" ? "เพิ่ม Supplier profile ก่อน แล้วค่อยเพิ่ม Supported Items ในหน้า Detail" : "แก้ไขข้อมูลติดต่อ Supplier จากหน้ารายละเอียด"}
      />
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Supplier ID">
            <input className={inputClass} value={form.id} readOnly={mode === "edit"} onChange={(event) => setForm({ ...form, id: event.target.value })} />
          </Field>
          <Field label="Supplier Name">
            <input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="Contact Person">
            <input className={inputClass} value={form.contactPerson} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Field>
          <Field label="Email">
            <input className={inputClass} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </Field>
          <Field label="Line ID">
            <input className={inputClass} value={form.lineId} onChange={(event) => setForm({ ...form, lineId: event.target.value })} />
          </Field>
          <Field label="Coverage">
            <select className={inputClass} value={form.coverage} onChange={(event) => setForm({ ...form, coverage: event.target.value as Region })}>
              {regionOptions.map((region) => <option key={region} value={region}>{regionLabels[region]}</option>)}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Change Note">
              <input className={inputClass} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
            </Field>
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-200 pt-4">
          <Button type="submit" disabled={!canSave}>
            <CheckCircle2 className="h-4 w-4" />
            {mode === "create" ? "Save Supplier" : "Save Supplier Profile"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SupplierCatalogForm({
  fixedSupplier,
  supplierOfferData,
  formulaPolicy,
  onSave,
}: {
  fixedSupplier?: Supplier;
  supplierOfferData: SupplierOffer[];
  formulaPolicy: FormulaPolicyState;
  onSave: (catalog: SupplierCatalogInput) => void;
}) {
  const [form, setForm] = useState({
    supplierId: fixedSupplier?.id ?? getNextSupplierId(),
    supplierName: fixedSupplier?.name ?? "บริษัท ตัวอย่าง ซัพพลาย จำกัด",
    contactPerson: fixedSupplier?.contactPerson ?? "คุณผู้ติดต่อ",
    phone: fixedSupplier?.phone ?? "089-000-0000",
    email: fixedSupplier?.email ?? "supplier@example.com",
    lineId: fixedSupplier?.lineId ?? "supplier_line",
    coverage: (fixedSupplier?.coverage ?? "North") as Region,
    skuId: getNextSkuId(),
    skuName: "อุปกรณ์ตัวอย่าง",
    category: "อุปกรณ์",
    unit: "pcs",
    criticality: "Medium" as Sku["criticality"],
    unitPrice: 1_000,
    leadTimeDays: 20,
    moq: 10,
    note: "เพิ่ม SKU ที่ Supplier รองรับ พร้อมราคา Lead Time และ MOQ",
  });
  const regionOptions: Region[] = ["North", "Northeast", "East", "South", "National"];
  const criticalityOptions: Array<Sku["criticality"]> = ["Critical", "High", "Medium"];
  const canSave = Boolean(form.supplierId.trim() && form.supplierName.trim() && form.skuId.trim() && form.skuName.trim()) && form.unitPrice > 0 && form.leadTimeDays > 0 && form.moq > 0;
  const systemInventory = getSystemInventoryDefaults(form.skuId.trim().toUpperCase(), formulaPolicy);
  const systemReliability = getSystemSupplierReliability(form.supplierId.trim(), supplierOfferData);

  // ฟอร์มนี้ตั้งใจให้ตรงกับตาราง Supported Items:
  // user กรอกเฉพาะ SKU master และ supplier offer เช่น ราคา Lead Time และ MOQ
  // ส่วน Current Stock, historical demand, Service Level, Seasonal/Budget Factor และ Reliability
  // เป็นข้อมูลจากระบบ/Settings จึงถูก derive ด้านล่าง ไม่เปิดให้กรอกในฟอร์มนี้
  const updateNumber = (field: keyof typeof form, value: number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const supplier: Supplier = fixedSupplier
      ? fixedSupplier
      : {
          id: form.supplierId.trim(),
          name: form.supplierName.trim(),
          contactPerson: form.contactPerson.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          lineId: form.lineId.trim(),
          coverage: form.coverage,
        };
    const sku: Sku = {
      id: form.skuId.trim().toUpperCase(),
      name: form.skuName.trim(),
      category: form.category.trim(),
      unit: form.unit.trim(),
      criticality: form.criticality,
    };
    const inventoryDefaults = getSystemInventoryDefaults(sku.id, formulaPolicy);

    onSave({
      supplier,
      sku,
      offer: {
        supplierId: supplier.id,
        skuId: sku.id,
        unitPrice: form.unitPrice,
        currency: "THB",
        leadTimeDays: form.leadTimeDays,
        moq: form.moq,
        unit: sku.unit,
        reliabilityScore: systemReliability,
      },
      inventory: {
        skuId: sku.id,
        warehouseId: inventoryDefaults.warehouseId,
        currentStock: inventoryDefaults.currentStock,
        historicalUsage: inventoryDefaults.historicalUsage,
        forecastDemandForPlanningPeriod: inventoryDefaults.forecastDemandForPlanningPeriod,
        planningPeriodDays: inventoryDefaults.planningPeriodDays,
        serviceLevel: inventoryDefaults.serviceLevel,
        zScore: inventoryDefaults.zScore,
        seasonalFactor: inventoryDefaults.seasonalFactor,
        budgetFactor: inventoryDefaults.budgetFactor,
        targetStockLevelOverride: inventoryDefaults.targetStockLevelOverride,
        status: "Normal",
      },
      note: form.note,
    });
  };

  return (
    <Card>
      <SectionHeader
        title={fixedSupplier ? "Add Supported Item" : "Add Supplier / Supported Item"}
        subtitle="เพิ่ม SKU ที่ Supplier รองรับ พร้อมราคา Lead Time และ MOQ"
      />
      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        {!fixedSupplier ? (
          <div>
            <h3 className="mb-3 font-semibold text-slate-950">Supplier Profile</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Supplier ID">
                <input className={inputClass} value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })} />
              </Field>
              <Field label="Supplier Name">
                <input className={inputClass} value={form.supplierName} onChange={(event) => setForm({ ...form, supplierName: event.target.value })} />
              </Field>
              <Field label="Contact Person">
                <input className={inputClass} value={form.contactPerson} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} />
              </Field>
              <Field label="Phone">
                <input className={inputClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </Field>
              <Field label="Email">
                <input className={inputClass} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </Field>
              <Field label="Coverage">
                <select className={inputClass} value={form.coverage} onChange={(event) => setForm({ ...form, coverage: event.target.value as Region })}>
                  {regionOptions.map((region) => <option key={region} value={region}>{regionLabels[region]}</option>)}
                </select>
              </Field>
              <Field label="Line ID">
                <input className={inputClass} value={form.lineId} onChange={(event) => setForm({ ...form, lineId: event.target.value })} />
              </Field>
            </div>
          </div>
        ) : (
          <InlineAlert tone="info">Catalog ใหม่นี้จะถูกเพิ่มให้ Supplier ปัจจุบัน: {fixedSupplier.name}</InlineAlert>
        )}

        <div>
          <h3 className="mb-3 font-semibold text-slate-950">SKU Master</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="SKU ID">
              <input className={inputClass} value={form.skuId} onChange={(event) => setForm({ ...form, skuId: event.target.value })} />
            </Field>
            <Field label="Item Name">
              <input className={inputClass} value={form.skuName} onChange={(event) => setForm({ ...form, skuName: event.target.value })} />
            </Field>
            <Field label="Category">
              <input className={inputClass} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
            </Field>
            <Field label="Unit">
              <input className={inputClass} value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
            </Field>
            <Field label="Criticality">
              <select className={inputClass} value={form.criticality} onChange={(event) => setForm({ ...form, criticality: event.target.value as Sku["criticality"] })}>
                {criticalityOptions.map((criticality) => <option key={criticality}>{criticality}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-slate-950">Supplier Offer</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Unit Price">
              <input className={inputClass} type="number" min="0" value={form.unitPrice} onChange={(event) => updateNumber("unitPrice", Number(event.target.value))} />
            </Field>
            <Field label="Lead Time (days)">
              <input className={inputClass} type="number" min="1" value={form.leadTimeDays} onChange={(event) => updateNumber("leadTimeDays", Number(event.target.value))} />
            </Field>
            <Field label="MOQ">
              <input className={inputClass} type="number" min="1" value={form.moq} onChange={(event) => updateNumber("moq", Number(event.target.value))} />
            </Field>
          </div>
        </div>

        <Card className="border-blue-100 bg-blue-50 p-4">
          <h3 className="font-semibold text-blue-950">System-derived values</h3>
          <p className="mt-1 text-sm text-blue-700">ค่าด้านล่างมาจาก Inventory mock data และ Settings กลาง ไม่ใช่ข้อมูลที่ Supplier กรอก</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ReviewMetric label="Current Stock" value={`${formatNumber(systemInventory.currentStock)} ${form.unit}`} />
            <ReviewMetric label="Forecast Demand" value={`${formatNumber(systemInventory.forecastDemandForPlanningPeriod)} ${form.unit}`} />
            <ReviewMetric label="Supplier Reliability" value={`${systemReliability}%`} />
            <ReviewMetric label="Service Level" value={formatPercent(systemInventory.serviceLevel * 100).replace("+", "")} />
            <ReviewMetric label="Z-score" value={String(systemInventory.zScore)} />
            <ReviewMetric label="Seasonal Factor" value={String(systemInventory.seasonalFactor)} />
            <ReviewMetric label="Budget Factor" value={String(systemInventory.budgetFactor)} />
            <ReviewMetric label="Planning Days" value={`${systemInventory.planningPeriodDays} days`} />
          </div>
        </Card>

        <Field label="Change Note">
          <textarea className={textareaClass} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">ข้อมูลที่เพิ่มจะอยู่ใน mock state และ reset ได้เมื่อ refresh หน้า</p>
          <Button type="submit" disabled={!canSave}>
            <Plus className="h-4 w-4" />
            Add Supported Item
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SupplierOfferEditorRow({
  offer,
  skuName,
  category,
  onSave,
}: {
  offer: SupplierOffer;
  skuName: string;
  category: string;
  onSave: (offer: SupplierOffer, note: string) => void;
}) {
  const [draft, setDraft] = useState(offer);
  const [note, setNote] = useState("ปรับข้อมูล Supplier สำหรับการคำนวณ Lead Time / Cost");
  const numericInputClass = `${inputClass} !w-28 text-right tabular-nums`;

  // แถวนี้เป็น editor เฉพาะ Supplier Offer
  // ผู้ใช้แก้ Lead Time, MOQ, Unit Price หรือ Reliability แล้วกด Save
  // เพื่อ update mock state และสร้าง change log กลับไปที่ App
  // ใช้ !w-28 เพื่อ override w-full จาก inputClass ไม่ให้ช่อง MOQ/ตัวเลขถูกบีบจนอ่านค่าไม่เห็น
  const updateNumber = (field: keyof Pick<SupplierOffer, "unitPrice" | "leadTimeDays" | "moq" | "reliabilityScore">, value: number) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  return (
    <tr>
      <td className="px-4 py-3 font-semibold text-slate-900">{offer.skuId}</td>
      <td className="px-4 py-3">{skuName}</td>
      <td className="px-4 py-3">{category}</td>
      <td className="min-w-32 px-4 py-3">
        <input className={numericInputClass} type="number" value={draft.unitPrice} onChange={(event) => updateNumber("unitPrice", Number(event.target.value))} />
      </td>
      <td className="min-w-32 px-4 py-3">
        <input className={numericInputClass} type="number" value={draft.leadTimeDays} onChange={(event) => updateNumber("leadTimeDays", Number(event.target.value))} />
      </td>
      <td className="min-w-32 px-4 py-3">
        <input className={numericInputClass} type="number" value={draft.moq} onChange={(event) => updateNumber("moq", Number(event.target.value))} />
      </td>
      <td className="min-w-32 px-4 py-3">
        <input className={numericInputClass} type="number" value={draft.reliabilityScore ?? 0} onChange={(event) => updateNumber("reliabilityScore", Number(event.target.value))} />
      </td>
      <td className="px-4 py-3">
        <div className="flex min-w-60 gap-2">
          <input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Change note" />
          <Button variant="secondary" onClick={() => onSave(draft, note)}>Save Changes</Button>
        </div>
      </td>
    </tr>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <div className="md:col-span-2">
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
  supplierOfferData,
  formulaPolicy,
  onBack,
  onContactSupplier,
  onSubmit,
}: {
  skuId: string;
  supplierId: string;
  supplierOfferData: SupplierOffer[];
  formulaPolicy: FormulaPolicyState;
  onBack: () => void;
  onContactSupplier: (supplierId: string) => void;
  onSubmit: (request: PurchaseRequest) => void;
}) {
  const sku = getSku(skuId);
  const record = applyFormulaPolicy(inventoryRecords.find((item) => item.skuId === skuId) ?? inventoryRecords[0], formulaPolicy);
  const warehouse = getWarehouse(record.warehouseId);
  const firstSupportedOffer = getOffer(supplierId, skuId, supplierOfferData) ?? supplierOfferData.find((item) => item.skuId === skuId) ?? supplierOfferData[0];
  const [chosenSupplierId, setChosenSupplierId] = useState(firstSupportedOffer.supplierId);
  const offer = getOffer(chosenSupplierId, skuId, supplierOfferData) ?? firstSupportedOffer;
  const supplier = getSupplier(offer.supplierId);
  const supplierRecord = getSupplierSkuRecord(offer.supplierId, skuId, supplierOfferData);
  const recommendation = calculateInventoryRecommendation({ inventory: record, supplier: supplierRecord, formulaVersion: formulaPolicy.formulaVersion });
  const budget = getBudgetContextForInventory(record);
  const [requestedQuantity, setRequestedQuantity] = useState(skuId === "C01" ? 20 : recommendation.suggestedQuantity);
  const [reasonCategory, setReasonCategory] = useState(skuId === "C01" ? "มีแผนซ่อมบำรุงเพิ่มเติม" : "");
  const [reasonText, setReasonText] = useState(skuId === "C01" ? "รวมแผนซ่อมบำรุงเพิ่มเติมของคลังเชียงใหม่ 1 ในรอบเดียวกัน" : "");
  const [showExplanation, setShowExplanation] = useState(false);

  const preview = calculatePurchaseRequestPreview({
    recommendation,
    requestedQuantity,
    unitPrice: offer.unitPrice,
    budget,
  });
  const estimatedCost = preview.estimatedCostForRequestedQuantity;
  const recommendedLayer = preview.approvalRouting.layer;
  const variance = preview.variance;
  const quantityDiffers = preview.requiresOverrideReason;
  const highVariance = Math.abs(variance.variancePercent) >= formulaPolicy.highVarianceThreshold;
  const moqAligned = offer.moq <= 0 || requestedQuantity % offer.moq === 0;
  const reasonOptions = variance.isOverRequest ? moreReasons : lessReasons;
  const overrideWarning = getOverrideWarningMessage({
    suggestedQuantity: recommendation.suggestedQuantity,
    requestedQuantity,
    unit: sku.unit,
  });
  const canSubmit =
    Boolean(offer.supplierId) &&
    requestedQuantity > 0 &&
    (!quantityDiffers || Boolean(reasonCategory)) &&
    (!quantityDiffers || !highVariance || Boolean(reasonText.trim()));
  const submitLabel = recommendedLayer === "Local" ? "Submit to Local" : recommendedLayer === "Regional" ? "Submit to Regional" : "Submit to Central";

  const buildSnapshot = (requestId: string): PurchaseRequestCalculationSnapshot => ({
    requestId,
    createdAt: "2026-05-05 14:00",
    ...recommendation,
    requestedQuantity,
    approvedQuantity: undefined,
    quantityVariance: variance.variance,
    quantityVariancePercent: variance.variancePercent,
    estimatedCostForRequestedQuantity: estimatedCost,
    selectedSupplierId: supplier.id,
    selectedSupplierName: supplier.name,
    supplierLeadTimeDaysAtRequestDate: offer.leadTimeDays,
    unitPriceAtRequestDate: offer.unitPrice,
    budgetContextAtRequestDate: budget,
    approvalRoutingAtRequestDate: preview.approvalRouting,
    overrideReasonCategory: quantityDiffers ? reasonCategory : undefined,
    overrideReasonDetail: quantityDiffers ? reasonText : undefined,
  });

  const buildRequest = (status: PurchaseRequest["status"]): PurchaseRequest => {
    const requestId = "REQ-001";
    const snapshot = buildSnapshot(requestId);

    return {
      id: requestId,
      skuId,
      warehouseId: warehouse.id,
      supplierId: offer.supplierId,
      aiSuggestedQuantity: recommendation.suggestedQuantity,
      requestedQuantity,
      unit: sku.unit,
      unitPrice: offer.unitPrice,
      leadTimeDays: offer.leadTimeDays,
      adjustedLeadTimeDays: recommendation.adjustedLeadTimeDays,
      moq: offer.moq,
      estimatedCost,
      localBudgetRemaining: budget.localBudgetRemaining,
      regionalBudgetRemaining: budget.regionalBudgetRemaining,
      centralBudgetRemaining: budget.centralBudgetRemaining,
      recommendedLayer,
      status,
      variancePercent: variance.variancePercent,
      overrideReasonCategory: quantityDiffers ? reasonCategory : undefined,
      overrideReasonText: quantityDiffers ? reasonText : undefined,
      formulaVersion,
      calculationSnapshot: snapshot,
      supplierContactLogSummary: "Phone ยืนยันราคาและ Lead Time กับ Supplier แล้ว",
      localReason: "Current Stock ต่ำกว่า Reorder Point และ Local Budget ไม่เพียงพอสำหรับปริมาณที่ขอ",
      regionalEscalationReason: recommendedLayer === "Central" ? "Regional budget ไม่เพียงพอ ต้องส่งต่อ Central" : undefined,
      createdAt: "2026-05-05 14:00",
      timeline: [
        { role: "Local Warehouse", action: "Draft Created", actor: warehouse.name, date: "2026-05-05 13:55" },
        { role: "Local Warehouse", action: "Submitted", actor: warehouse.name, date: "2026-05-05 14:00", note: `Recommended Layer: ${recommendedLayer}` },
      ],
    };
  };

  return (
    <>
      <PageTitle
        eyebrow="Create Purchase Request"
        title={`สร้างคำขอซื้อ ${sku.id} ${sku.name}`}
        subtitle="ฟอร์มสร้าง PR จาก AI Suggested Quantity และข้อมูล Supplier โดยตรวจสอบงบประมาณ 3 ชั้น"
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="SKU">
              <input className={inputClass} value={`${sku.id} · ${sku.name}`} readOnly />
            </Field>
            <Field label="Selected Supplier">
              <select className={inputClass} value={chosenSupplierId} onChange={(event) => setChosenSupplierId(event.target.value)}>
                {supplierOfferData.filter((item) => item.skuId === skuId).map((item) => {
                  const itemSupplier = getSupplier(item.supplierId);
                  return <option key={item.supplierId} value={item.supplierId}>{itemSupplier.name}</option>;
                })}
              </select>
            </Field>
            <Field label="AI Suggested Quantity">
              <div className="flex gap-2">
                <input className={inputClass} value={`${formatNumber(recommendation.suggestedQuantity)} ${sku.unit}`} readOnly />
                <Button type="button" variant="secondary" onClick={() => setShowExplanation((current) => !current)}>ทำไม?</Button>
              </div>
            </Field>
            <Field label="Supplier Unit Price">
              <input className={inputClass} value={`${formatTHB(offer.unitPrice)}/${offer.unit}`} readOnly />
            </Field>
            <Field label="Supplier Lead Time">
              <input className={inputClass} value={`${offer.leadTimeDays} days`} readOnly />
            </Field>
            <Field label="Adjusted Lead Time">
              <input className={inputClass} value={`${formatNumber(recommendation.adjustedLeadTimeDays)} days`} readOnly />
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
            <Field label="Quantity Variance">
              <input className={inputClass} value={`${variance.variance > 0 ? "+" : ""}${formatNumber(variance.variance)} ${sku.unit} (${formatPercent(variance.variancePercent)})`} readOnly />
            </Field>
            <Field label="Estimated Cost">
              <input className={inputClass} value={formatTHB(estimatedCost)} readOnly />
            </Field>
            <Field label="Recommended Approval Layer">
              <input className={inputClass} value={recommendedLayer} readOnly />
            </Field>
          </div>

          <div className="mt-5 space-y-3">
            {overrideWarning ? <InlineAlert tone={variance.isUnderRequest ? "danger" : "warning"}>{overrideWarning}</InlineAlert> : <InlineAlert tone="success">Requested Quantity ตรงกับ AI Suggested Quantity</InlineAlert>}
            {!moqAligned ? <InlineAlert>Requested Quantity ยังไม่ตรงกับ MOQ {offer.moq} {offer.unit} ระบบยังให้ส่งได้ใน PoC แต่ควรตรวจสอบกับ Supplier</InlineAlert> : null}
            <InlineAlert tone="info">{preview.approvalRouting.reason}</InlineAlert>

            {quantityDiffers ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Override Reason Category">
                  <select className={inputClass} value={reasonCategory} onChange={(event) => setReasonCategory(event.target.value)}>
                    <option value="">เลือกเหตุผล</option>
                    {reasonOptions.map((reason) => <option key={reason}>{reason}</option>)}
                  </select>
                </Field>
                <Field label="Override Reason Detail" hint={highVariance ? "จำเป็นเมื่อ variance ตั้งแต่ ±50%" : "ระบุรายละเอียดเพิ่มเติมเพื่อช่วยผู้อนุมัติ"}>
                  <textarea className={textareaClass} value={reasonText} onChange={(event) => setReasonText(event.target.value)} />
                </Field>
              </div>
            ) : null}
          </div>

          {showExplanation ? (
            <div className="mt-5">
              <CalculationExplanationPanel
                inventory={record}
                supplier={supplierRecord}
                recommendation={recommendation}
                budget={budget}
                preview={preview}
                requestedQuantity={requestedQuantity}
                onClose={() => setShowExplanation(false)}
              />
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => onContactSupplier(supplier.id)}><Phone className="h-4 w-4" /> Contact Supplier</Button>
            <Button variant="secondary" onClick={() => onSubmit(buildRequest("Draft"))}>Save Draft</Button>
            <Button
              disabled={!canSubmit}
              onClick={() => {
                const status = recommendedLayer === "Local" ? "Pending Local" : "Pending Regional";
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
          <BudgetCheckCard label={`Local · ${warehouse.name}`} remaining={budget.localBudgetRemaining} required={estimatedCost} />
          <BudgetCheckCard label={`Regional · ${regionLabels[warehouse.region]}`} remaining={budget.regionalBudgetRemaining} required={estimatedCost} />
          <BudgetCheckCard label="Central National" remaining={budget.centralBudgetRemaining} required={estimatedCost} />
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
      <div className="mb-4 flex w-full overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 sm:inline-flex sm:w-auto">
        <button className={`rounded-md px-4 py-2 text-sm font-semibold ${approvalTab === "regional" ? "bg-blue-700 text-white" : "text-slate-600"}`} onClick={() => onSetTab("regional")}>Regional Approval Queue</button>
        <button className={`rounded-md px-4 py-2 text-sm font-semibold ${approvalTab === "central" ? "bg-blue-700 text-white" : "text-slate-600"}`} onClick={() => onSetTab("central")}>Central Approval Queue</button>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
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
            <RegionalReviewDetail request={selected} contactLogs={contactLogs} onAction={onAction} onContactSupplier={onContactSupplier} onCalculation={onCalculation} />
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
  const warehouse = getWarehouse(request.warehouseId);
  const mustPassCentral = request.estimatedCost > request.regionalBudgetRemaining;
  const logs = contactLogs.filter((log) => log.requestId === request.id || log.supplierId === request.supplierId);

  return (
    <Card>
      <SectionHeader title={`Regional Review Detail · ${request.id}`} subtitle={`${sku.id} ${sku.name} · ${warehouse.name}`} action={<StatusBadge status={request.status} />} />
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
        <ReviewMetric label="AI Suggested" value={`${request.aiSuggestedQuantity} ${request.unit}`} />
        <ReviewMetric label="Requested" value={`${request.requestedQuantity} ${request.unit}`} />
        <ReviewMetric label="Variance" value={`${request.variancePercent > 0 ? "+" : ""}${formatNumber(request.variancePercent)}%`} />
        <ReviewMetric label="Supplier" value={supplier.name} />
        <ReviewMetric label="Estimated Cost" value={formatTHB(request.estimatedCost)} />
        <ReviewMetric label="Lead Time" value={`${request.leadTimeDays} days`} />
        <ReviewMetric label="Safety Stock" value={`${formatNumber(request.calculationSnapshot.safetyStock)} ${request.unit}`} />
        <ReviewMetric label="Reorder Point" value={`${formatNumber(request.calculationSnapshot.reorderPoint)} ${request.unit}`} />
        <ReviewMetric label="Unit Price at Request Date" value={`${formatTHB(request.calculationSnapshot.unitPriceAtRequestDate)}/${request.unit}`} />
      </div>
      <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-3">
        <BudgetCheckCard label="Local Budget" remaining={request.localBudgetRemaining} required={request.estimatedCost} />
        <BudgetCheckCard label="Regional Budget" remaining={request.regionalBudgetRemaining} required={request.estimatedCost} />
        <BudgetCheckCard label="Central Budget" remaining={request.centralBudgetRemaining} required={request.estimatedCost} />
      </div>
      <div className="grid grid-cols-1 gap-4 border-t border-slate-200 p-5 lg:grid-cols-2">
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
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">Approval Routing Reason</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{request.calculationSnapshot.approvalRoutingAtRequestDate.reason}</p>
        </Card>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4">
        <Button variant="secondary" onClick={() => onCalculation(request)}><Calculator className="h-4 w-4" /> View Calculation Snapshot</Button>
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
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <ReviewMetric label="Cost" value={formatTHB(request.estimatedCost)} />
        <ReviewMetric label="Budget Gap" value={formatTHB(budgetGap)} />
        <ReviewMetric label="Supplier" value={supplier.name} />
        <ReviewMetric label="Unit Price at Request Date" value={`${formatTHB(request.unitPrice)}/${request.unit}`} />
        <ReviewMetric label="Safety Stock" value={`${formatNumber(request.calculationSnapshot.safetyStock)} ${request.unit}`} />
        <ReviewMetric label="Reorder Point" value={`${formatNumber(request.calculationSnapshot.reorderPoint)} ${request.unit}`} />
        <ReviewMetric label="Variance" value={formatPercent(request.calculationSnapshot.quantityVariancePercent)} />
        <ReviewMetric label="Routing" value={request.calculationSnapshot.approvalRoutingAtRequestDate.layer} />
      </div>
      <div className="grid grid-cols-1 gap-4 px-5 pb-5 lg:grid-cols-2">
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
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4">
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Request ID / Item / Supplier / Status" />
          </div>
          <select className={inputClass} defaultValue="All Status"><option>All Status</option><option>Approved</option><option>Pending</option><option>Rejected</option></select>
          <select className={inputClass} defaultValue="Formula v1.0"><option>Formula v1.0</option></select>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <CalculationSnapshotView snapshot={request.calculationSnapshot} unit={request.unit} />
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
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
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
  supplierOfferData,
  formulaPolicy,
  onBack,
  onCreateProposal,
}: {
  supplierOfferData: SupplierOffer[];
  formulaPolicy: FormulaPolicyState;
  onBack: () => void;
  onCreateProposal: () => void;
}) {
  const record = applyFormulaPolicy(inventoryRecords.find((item) => item.skuId === "C01") ?? inventoryRecords[0], formulaPolicy);
  const supplierRecord = getSupplierSkuRecord("S001", "C01", supplierOfferData);
  const recommendation = calculateInventoryRecommendation({ inventory: record, supplier: supplierRecord, formulaVersion: formulaPolicy.formulaVersion });
  const currentSafetyStock = 30;
  const currentReorderPoint = 100;
  const currentLeadTime = recommendation.adjustedLeadTimeDays;
  const vmiLeadTime = 14;
  const vmiSafetyStock = calculateVmiSafetyStock(record.zScore, 3.2, vmiLeadTime);
  const vmiReorderPoint = calculateVmiReorderPoint(3.93, vmiLeadTime, vmiSafetyStock);
  const currentInventoryValue = calculateInventoryValue(120, supplierRecord.unitPrice);
  const vmiInventoryValue = calculateInventoryValue(90, supplierRecord.unitPrice);
  const currentManualOrders = 4;
  const vmiManualOrders = 1;
  const rows = [
    buildVmiRow("Safety Stock", currentSafetyStock, vmiSafetyStock, "m"),
    buildVmiRow("Reorder Point", currentReorderPoint, vmiReorderPoint, "m"),
    buildVmiRow("Lead Time", currentLeadTime, vmiLeadTime, "days"),
    buildVmiRow("Inventory Value", currentInventoryValue, vmiInventoryValue, "THB"),
    buildVmiRow("Manual Orders/Month", currentManualOrders, vmiManualOrders, ""),
  ];

  return (
    <>
      <PageTitle
        eyebrow="VMI Simulation"
        title="เปรียบเทียบ Current Inventory Model vs VMI"
        subtitle="จำลองผลกระทบด้าน Safety Stock, ROP, Lead Time, Inventory Value และ Manual Orders จาก calculation utilities"
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back</Button>}
      />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <SectionHeader title="Comparison Table" subtitle="C01 สายไฟแรงต่ำ · WH-001" />
          <DataTable columns={["Metric", "Current", "VMI", "Impact"]}>
            {rows.map((row) => (
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
          <p className="mt-3 text-sm text-slate-600">{getVmiRecommendation(vmiCandidates[0].score)} · Score {vmiCandidates[0].score}</p>
          <div className="mt-5 grid gap-2">
            <Button onClick={onCreateProposal}><Plus className="h-4 w-4" /> Create VMI Proposal</Button>
            <Button variant="secondary"><FileText className="h-4 w-4" /> Compare Normal Purchase</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
function SettingsPage({
  formulaPolicy,
  formulaVersions,
  changeLogs,
  onSaveFormulaPolicy,
}: {
  formulaPolicy: FormulaPolicyState;
  formulaVersions: FormulaVersionRecord[];
  changeLogs: ChangeLogEntry[];
  onSaveFormulaPolicy: (policy: FormulaPolicyState, note: string) => void;
}) {
  const [draftPolicy, setDraftPolicy] = useState(formulaPolicy);
  const [versionNote, setVersionNote] = useState("ปรับค่า policy สำหรับการคำนวณ inventory planning");
  const settingsLogs = changeLogs.filter((log) => log.area === "Settings").slice(0, 10);

  // หน้า Settings แก้ค่า formula policy ได้ใน local state ก่อน
  // เมื่อกด Save as New Version จึงบันทึกเป็น formula version ใหม่และสร้าง audit log
  const updateDraftNumber = (field: keyof Omit<FormulaPolicyState, "formulaVersion">, value: number) => {
    setDraftPolicy((current) => ({ ...current, [field]: value }));
  };
  const updateDraftServiceLevel = (value: number) => {
    // ให้ user ปรับ Service Level อย่างเดียว แล้ว derive Z-score ตามความสัมพันธ์ทางสถิติ
    // ลดความสับสนและป้องกัน Service Level กับ Z-score ไม่ตรงกัน
    setDraftPolicy((current) => ({
      ...current,
      serviceLevel: value,
      zScore: calculateZScoreFromServiceLevel(value),
    }));
  };

  return (
    <>
      <PageTitle eyebrow="Settings" title="Formula & Policy" subtitle="ตั้งค่า Formula version และ Approval / Override policy สำหรับ Prototype" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <SectionHeader title={`Formula Version ${draftPolicy.formulaVersion}`} subtitle="แก้ไขค่า Policy แล้วบันทึกเป็น version ใหม่เพื่อ audit ได้" />
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            <Field label="Formula Version">
              <input className={inputClass} value={draftPolicy.formulaVersion} onChange={(event) => setDraftPolicy({ ...draftPolicy, formulaVersion: event.target.value })} />
            </Field>
            <Field label="Service Level" hint="เช่น 0.95 = 95%">
              <input className={inputClass} type="number" step="0.005" min="0.8" max="0.995" value={draftPolicy.serviceLevel} onChange={(event) => updateDraftServiceLevel(Number(event.target.value))} />
            </Field>
            <Field label="Calculated Z-score" hint="คำนวณอัตโนมัติจาก Service Level">
              <input className={inputClass} type="number" value={draftPolicy.zScore} readOnly />
            </Field>
            <Field label="Seasonal Factor Default">
              <input className={inputClass} type="number" step="0.01" value={draftPolicy.seasonalFactor} onChange={(event) => updateDraftNumber("seasonalFactor", Number(event.target.value))} />
            </Field>
            <Field label="Budget Factor Default">
              <input className={inputClass} type="number" step="0.01" value={draftPolicy.budgetFactor} onChange={(event) => updateDraftNumber("budgetFactor", Number(event.target.value))} />
            </Field>
            <Field label="High Variance Threshold (%)">
              <input className={inputClass} type="number" step="1" value={draftPolicy.highVarianceThreshold} onChange={(event) => updateDraftNumber("highVarianceThreshold", Number(event.target.value))} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Version Note">
                <textarea className={textareaClass} value={versionNote} onChange={(event) => setVersionNote(event.target.value)} />
              </Field>
            </div>
          </div>
          <div className="flex justify-end border-t border-slate-200 px-5 py-4">
            <Button onClick={() => onSaveFormulaPolicy(draftPolicy, versionNote)}>Save as New Formula Version</Button>
          </div>
          <div className="border-t border-slate-200 p-5">
            <h3 className="font-semibold text-slate-950">Calculation Formulas</h3>
            <div className="mt-3 grid gap-2">
              {formulaList.map((formula, index) => (
                <p key={formula} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">{index + 1}. {formula}</p>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-200 p-5">
            <h3 className="font-semibold text-slate-950">Formula Version History</h3>
            <DataTable columns={["Date", "Version", "Service", "Z", "Seasonal", "Budget", "Note"]} empty={formulaVersions.length === 0}>
              {formulaVersions.map((version) => (
                <tr key={`${version.formulaVersion}-${version.createdAt}`}>
                  <td className="px-4 py-3">{version.createdAt}</td>
                  <td className="px-4 py-3 font-semibold">{version.formulaVersion}</td>
                  <td className="px-4 py-3">{formatPercent(version.serviceLevel * 100).replace("+", "")}</td>
                  <td className="px-4 py-3">{version.zScore}</td>
                  <td className="px-4 py-3">{version.seasonalFactor}</td>
                  <td className="px-4 py-3">{version.budgetFactor}</td>
                  <td className="px-4 py-3">{version.note}</td>
                </tr>
              ))}
            </DataTable>
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
              <p>High variance threshold = {draftPolicy.highVarianceThreshold}%</p>
              <p>Show warning for request greater or less than AI suggestion</p>
            </div>
          </Card>
          <Card>
            <SectionHeader title="Settings Change Log" subtitle="ประวัติการแก้ไข formula policy" />
            <DataTable columns={["Date", "Field", "Old", "New", "Note"]} empty={settingsLogs.length === 0}>
              {settingsLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">{log.createdAt}</td>
                  <td className="px-4 py-3">{log.field}</td>
                  <td className="px-4 py-3">{log.oldValue}</td>
                  <td className="px-4 py-3">{log.newValue}</td>
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

function getNextSupplierId() {
  const maxNumber = suppliers.reduce((max, supplier) => {
    const parsed = Number(supplier.id.replace(/\D/g, ""));
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);

  return `S${String(maxNumber + 1).padStart(3, "0")}`;
}

function getNextSkuId() {
  const maxNumber = skus.reduce((max, sku) => {
    const parsed = Number(sku.id.replace(/\D/g, ""));
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);

  return `NEW-${String(maxNumber + 1).padStart(2, "0")}`;
}

function getSupplierStatus(supplierId: string, offers: SupplierOffer[]): SupplierStatus {
  return offers.some((offer) => offer.supplierId === supplierId) ? "Active" : "No Catalog";
}

function getSystemSupplierReliability(supplierId: string, offers: SupplierOffer[]): number {
  const scores = offers
    .filter((offer) => offer.supplierId === supplierId && typeof offer.reliabilityScore === "number")
    .map((offer) => offer.reliabilityScore ?? 0);

  if (scores.length === 0) return 90;

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function getSystemInventoryDefaults(skuId: string, policy: FormulaPolicyState) {
  const existing = inventoryRecords.find((record) => record.skuId === skuId);

  // Add Supported Item ไม่ควรถาม Current Stock, demand history หรือ policy factor จาก Supplier
  // ถ้ามี SKU อยู่แล้วให้อ่านจาก inventory mock data เดิม ถ้าเป็น SKU ใหม่ให้เริ่มเป็น 0
  // และใช้ Service Level / Seasonal Factor / Budget Factor จาก Settings กลางเสมอ
  return {
    warehouseId: existing?.warehouseId ?? warehouses[0].id,
    currentStock: existing?.currentStock ?? 0,
    historicalUsage:
      existing?.historicalUsage ??
      [1, 2, 3, 4, 5, 6].map((month) => ({
        periodLabel: `Month ${month}`,
        days: 30,
        quantity: 0,
      })),
    forecastDemandForPlanningPeriod: existing?.forecastDemandForPlanningPeriod ?? 0,
    planningPeriodDays: existing?.planningPeriodDays ?? 30,
    serviceLevel: policy.serviceLevel,
    zScore: calculateZScoreFromServiceLevel(policy.serviceLevel),
    seasonalFactor: policy.seasonalFactor,
    budgetFactor: policy.budgetFactor,
    targetStockLevelOverride: existing?.targetStockLevelOverride,
  };
}

function SupplierStatusBadge({ status }: { status: SupplierStatus }) {
  const className =
    status === "Active"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-amber-50 text-amber-700 ring-amber-200";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}>{status}</span>;
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

function getOffer(supplierId: string, skuId: string, offers: SupplierOffer[] = supplierOffers) {
  return offers.find((offer) => offer.supplierId === supplierId && offer.skuId === skuId);
}

function getDefaultOffer(skuId: string, offers: SupplierOffer[] = supplierOffers): SupplierOffer {
  return offers.find((offer) => offer.skuId === skuId) ?? offers[0];
}

function getRegionalBudget(region: string) {
  return regionalBudgets.find((budget) => budget.region === region)?.remaining ?? 0;
}

function getBudgetContextForInventory(inventory: InventoryRecord): BudgetContext {
  const warehouse = getWarehouse(inventory.warehouseId);

  return {
    localBudgetRemaining: warehouse.localBudget,
    regionalBudgetRemaining: getRegionalBudget(warehouse.region),
    centralBudgetRemaining,
  };
}

function getSupplierSkuRecord(supplierId: string, skuId: string, offers: SupplierOffer[] = supplierOffers): SupplierSkuRecord {
  const supplier = getSupplier(supplierId);
  const offer = getOffer(supplierId, skuId, offers) ?? getDefaultOffer(skuId, offers);

  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    sku: offer.skuId,
    unitPrice: offer.unitPrice,
    currency: offer.currency,
    unit: offer.unit,
    leadTimeDays: offer.leadTimeDays,
    moq: offer.moq,
    reliabilityScore: offer.reliabilityScore ?? 85,
    contactPerson: supplier.contactPerson,
    phone: supplier.phone,
    email: supplier.email,
    lineId: supplier.lineId,
  };
}

function getDefaultRecommendation(inventory: InventoryRecord, offers: SupplierOffer[] = supplierOffers, policy?: FormulaPolicyState) {
  const effectiveInventory = policy ? applyFormulaPolicy(inventory, policy) : inventory;
  const offer = getDefaultOffer(effectiveInventory.skuId, offers);
  const supplier = getSupplierSkuRecord(offer.supplierId, effectiveInventory.skuId, offers);

  return calculateInventoryRecommendation({ inventory: effectiveInventory, supplier, formulaVersion: policy?.formulaVersion ?? formulaVersion });
}

function applyFormulaPolicy(inventory: InventoryRecord, policy: FormulaPolicyState): InventoryRecord {
  // ใช้ค่า formula policy ล่าสุดจากหน้า Settings ทับค่าตั้งต้นของ mock inventory
  // เพื่อให้การคำนวณ Safety Stock / ROP / Suggested Quantity สะท้อน version ที่เลือก
  // Z-score derive จาก Service Level เสมอ เพื่อป้องกัน policy สองค่านี้ไม่สัมพันธ์กัน
  return {
    ...inventory,
    serviceLevel: policy.serviceLevel,
    zScore: calculateZScoreFromServiceLevel(policy.serviceLevel),
    seasonalFactor: policy.seasonalFactor,
    budgetFactor: policy.budgetFactor,
  };
}

function addSupplierOfferChangeLogs(
  oldOffer: SupplierOffer,
  newOffer: SupplierOffer,
  note: string,
  addLog: (entry: Omit<ChangeLogEntry, "id" | "actor" | "createdAt">) => void,
) {
  // บันทึกเฉพาะ field ที่เปลี่ยนจริง เพื่อลด noise ใน audit trail
  const fields: Array<keyof Pick<SupplierOffer, "unitPrice" | "leadTimeDays" | "moq" | "reliabilityScore">> = [
    "unitPrice",
    "leadTimeDays",
    "moq",
    "reliabilityScore",
  ];

  fields.forEach((field) => {
    if (oldOffer[field] !== newOffer[field]) {
      addLog({
        area: "Supplier",
        target: `${newOffer.supplierId}-${newOffer.skuId}`,
        field,
        oldValue: String(oldOffer[field] ?? "-"),
        newValue: String(newOffer[field] ?? "-"),
        note,
      });
    }
  });
}

function addSupplierProfileChangeLogs(
  oldSupplier: Supplier,
  newSupplier: Supplier,
  note: string,
  addLog: (entry: Omit<ChangeLogEntry, "id" | "actor" | "createdAt">) => void,
) {
  // บันทึก log ของข้อมูลติดต่อจาก Supplier Detail
  // แยก field เพื่อให้เห็นชัดว่าแก้ชื่อผู้ติดต่อ เบอร์ อีเมล Line ID หรือ coverage
  const fields: Array<keyof Pick<Supplier, "name" | "contactPerson" | "phone" | "email" | "lineId" | "coverage">> = [
    "name",
    "contactPerson",
    "phone",
    "email",
    "lineId",
    "coverage",
  ];

  fields.forEach((field) => {
    if (oldSupplier[field] !== newSupplier[field]) {
      addLog({
        area: "Supplier",
        target: newSupplier.id,
        field,
        oldValue: String(oldSupplier[field] ?? "-"),
        newValue: String(newSupplier[field] ?? "-"),
        note,
      });
    }
  });

  if (fields.every((field) => oldSupplier[field] === newSupplier[field])) {
    addLog({
      area: "Supplier",
      target: newSupplier.id,
      field: "Supplier Profile",
      oldValue: "No value change",
      newValue: "Confirmed current supplier profile",
      note: note || "ผู้ใช้กดยืนยันข้อมูลติดต่อ Supplier โดยไม่มีการเปลี่ยนค่า",
    });
  }
}

function addFormulaPolicyChangeLogs(
  oldPolicy: FormulaPolicyState,
  newPolicy: FormulaPolicyState,
  note: string,
  addLog: (entry: Omit<ChangeLogEntry, "id" | "actor" | "createdAt">) => void,
) {
  // Formula policy ถูกเก็บเป็น version ทุกครั้งที่กด Save
  // และ log ราย field เพื่อให้ตรวจสอบย้อนหลังได้ว่า version ใหม่ต่างจากเดิมตรงไหน
  (Object.keys(newPolicy) as Array<keyof FormulaPolicyState>).forEach((field) => {
    if (oldPolicy[field] !== newPolicy[field]) {
      addLog({
        area: "Settings",
        target: newPolicy.formulaVersion,
        field,
        oldValue: String(oldPolicy[field]),
        newValue: String(newPolicy[field]),
        note,
      });
    }
  });
}

function buildVmiRow(metric: string, currentValue: number, vmiValue: number, unit: string) {
  const impact = calculateImpact(currentValue, vmiValue);
  const formatValue = (value: number) => {
    if (unit === "THB") return formatCurrency(value);
    return `${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
  };
  const difference =
    unit === "THB"
      ? formatCurrency(impact.difference)
      : `${impact.difference > 0 ? "+" : ""}${formatNumber(impact.difference)}${unit ? ` ${unit}` : ""}`;

  return {
    metric,
    current: formatValue(currentValue),
    vmi: formatValue(vmiValue),
    impact: `${difference} / ${formatPercent(impact.percent)}`,
  };
}

export default App;





