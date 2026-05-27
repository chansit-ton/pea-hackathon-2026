import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Boxes,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  Mail,
  Menu,
  Minus,
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
import {
  getPeaDataCoverage,
  getPeaDataCoverageWarnings,
  getPeaLeadTimeSkuSummary,
  getPeaRiskCoverageRecord,
  peaMonthlyUsage,
  peaRelationshipSummary,
  peaRiskCoverageRecords,
  peaSkuMaster,
  peaWarehouseMaster,
} from "./data/peaDataModel";
import type { PeaDataCoverage, PeaLeadTimeSkuSummary, PeaRiskCoverageRecord } from "./data/peaDataModel";
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
  | "usage"
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
  "คาดการณ์ความต้องการใช้เพิ่มขึ้น",
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

const usageMonthLabels = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const usageMonthTrendColumns = usageMonthLabels.flatMap((label, index) => (index === 0 ? [label] : [label, "% เพิ่ม/ลด"]));
const usageSeasons = [
  { id: "cool", label: "ฤดูหนาว", helper: "พ.ย.-ก.พ.", months: [11, 12, 1, 2] },
  { id: "summer", label: "ฤดูร้อน", helper: "มี.ค.-พ.ค.", months: [3, 4, 5] },
  { id: "rainy", label: "ฤดูฝน", helper: "มิ.ย.-ต.ค.", months: [6, 7, 8, 9, 10] },
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
      note: "นโยบายสูตรเริ่มต้นของต้นแบบจำลอง",
    },
  ]);

  // จุดต่อ API ในอนาคต: เปลี่ยน in-memory store เหล่านี้เป็น service call
  // ไปยังระบบ SAP/procurement/budget โดยยังคง snapshot ของคำขอให้แก้ย้อนหลังไม่ได้
  const [requests, setRequests] = useState<PurchaseRequest[]>(initialRequests);
  const [contactLogs, setContactLogs] = useState<SupplierContactLog[]>(initialContactLogs);
  const [submittedConfirmation, setSubmittedConfirmation] = useState<PurchaseRequest | null>(null);

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
        field: "savedConfirmation",
        oldValue: "ไม่มีการเปลี่ยนค่า",
        newValue: "ยืนยันข้อเสนอซัพพลายเออร์ปัจจุบัน",
        note: note || "ผู้ใช้กดยืนยันข้อเสนอซัพพลายเออร์โดยไม่มีการเปลี่ยนตัวเลข",
      });
    }
    notify("บันทึกข้อมูลซัพพลายเออร์แล้ว");
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
      field: "โปรไฟล์ซัพพลายเออร์",
      oldValue: existingIndex >= 0 ? "ซัพพลายเออร์เดิม" : "-",
      newValue: `${supplier.name} / ${supplier.contactPerson}`,
      note: profile.note || "เพิ่มซัพพลายเออร์ใหม่จากหน้าทะเบียนซัพพลายเออร์",
    });
    setSelectedSupplierId(supplier.id);
    notify(existingIndex >= 0 ? "อัปเดตข้อมูลซัพพลายเออร์แล้ว" : "เพิ่มซัพพลายเออร์ใหม่แล้ว");
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
    notify("บันทึกข้อมูลติดต่อซัพพลายเออร์แล้ว");
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
      field: "รายการ SKU ที่รองรับ",
      oldValue: "-",
      newValue: `${catalog.supplier.name} / ${catalog.sku.id} ${catalog.sku.name}`,
      note: catalog.note,
    });
    addChangeLog({
      area: "Supplier",
      target: `${catalog.supplier.id}-${catalog.sku.id}`,
      field: "ข้อมูลตั้งต้นการคำนวณ",
      oldValue: "-",
      newValue: `Stock ${catalog.inventory.currentStock}, คาดการณ์ ${catalog.inventory.forecastDemandForPlanningPeriod}, ระยะเวลารอพัสดุ ${catalog.offer.leadTimeDays} วัน, จำนวนสั่งซื้อขั้นต่ำ ${catalog.offer.moq}`,
      note: "เพิ่มข้อมูลที่จำเป็นสำหรับระดับพัสดุสำรองปลอดภัย จุดสั่งซื้อใหม่ จำนวนที่ระบบแนะนำ และมูลค่าประมาณการ",
    });

    setSelectedSupplierId(catalog.supplier.id);
    setSelectedSkuId(catalog.sku.id);
    setView("supplier-detail");
    notify(`เพิ่ม SKU ${catalog.sku.id} สำหรับ ${catalog.supplier.name} แล้ว`);
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
    notify(`บันทึกสูตรคำนวณ ${policyWithDerivedZScore.formulaVersion} แล้ว`);
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
    // แสดงสรุปหลัง submit เพื่อย้ำว่า request, route และ Calculation Snapshot ถูกบันทึกแล้ว
    if (request.status !== "Draft") {
      setSubmittedConfirmation(request);
    }
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
    notify("บันทึกประวัติการติดต่อแล้ว");
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
                  actor: status === "Pending Central" ? "ผู้ตรวจระดับเขต" : approvalTab === "central" ? "จัดซื้อส่วนกลาง" : "ผู้ตรวจระดับเขต",
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
      case "usage":
        return <WarehouseSkuUsagePage />;
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
        return <VmiSimulationPage supplierOfferData={editableSupplierOffers} formulaPolicy={formulaPolicy} onBack={() => setView("vmi")} onCreateProposal={() => notify("สร้างข้อเสนอ VMI แบบร่างแล้ว")} />;
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
      {submittedConfirmation ? (
        <SubmitConfirmationModal
          request={submittedConfirmation}
          onClose={() => setSubmittedConfirmation(null)}
          onViewHistory={() => {
            setSelectedRequestId(submittedConfirmation.id);
            setView("history");
            setSubmittedConfirmation(null);
          }}
        />
      ) : null}
    </AppLayout>
  );
}

function SubmitConfirmationModal({
  request,
  onClose,
  onViewHistory,
}: {
  request: PurchaseRequest;
  onClose: () => void;
  onViewHistory: () => void;
}) {
  const sku = getSku(request.skuId);
  const supplier = getSupplier(request.supplierId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <Card className="w-full max-w-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">ส่งคำขอสำเร็จ</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-950">บันทึกคำขอและบันทึกค่าคำนวณแล้ว</h3>
              <p className="mt-1 text-sm text-slate-500">
                คำขอถูกส่งเข้าสู่คิวอนุมัติ พร้อมเก็บค่าคำนวณ ณ วันที่ขอไว้สำหรับตรวจสอบย้อนหลัง
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} title="ปิด">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span className="font-semibold">บันทึกค่าคำนวณ:</span> บันทึกค่าคำนวณ ณ วันที่ขอแล้ว จะไม่คำนวณย้อนหลังจากราคา ระยะเวลารอพัสดุ หรือนโยบายสูตรที่เปลี่ยนในอนาคต
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ReviewMetric label="Request No" value={request.id} />
            <ReviewMetric label="รายการพัสดุ" value={`${sku.id} · ${sku.name}`} />
            <ReviewMetric label="ซัพพลายเออร์" value={supplier.name} />
            <ReviewMetric label="จำนวนที่ระบบแนะนำ" value={`${formatNumber(request.aiSuggestedQuantity)} ${request.unit}`} />
            <ReviewMetric label="จำนวนที่ขอจริง" value={`${formatNumber(request.requestedQuantity)} ${request.unit}`} />
            <ReviewMetric label="ส่วนต่างจากค่าที่ระบบแนะนำ" value={formatPercent(request.variancePercent)} />
            <ReviewMetric label="มูลค่าประมาณการ" value={formatTHB(request.estimatedCost)} />
            <ReviewMetric label="เส้นทางการอนุมัติ" value={getApprovalLayerLabel(request.recommendedLayer)} />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>ปิด</Button>
            <Button onClick={onViewHistory}>
              <History className="h-4 w-4" />
              ดูประวัติคำขอ
            </Button>
          </div>
        </div>
      </Card>
    </div>
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
    { id: "dashboard", label: "แดชบอร์ด", icon: BarChart3 },
    { id: "inventory", label: "คลังพัสดุ", icon: Boxes },
    { id: "usage", label: "การใช้ SKU", icon: BarChart3 },
    { id: "supplier", label: "ซัพพลายเออร์", icon: Truck },
    { id: "request", label: "คำขอซื้อ", icon: FileText },
    { id: "approval", label: "อนุมัติ", icon: ClipboardCheck },
    { id: "history", label: "ประวัติ", icon: History },
    { id: "vmi", label: "VMI", icon: Workflow },
    { id: "settings", label: "ตั้งค่า", icon: Settings },
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
                  <p className="truncate text-xs text-slate-400">แพลตฟอร์มจัดซื้อ</p>
                </div>
              ) : null}
            </div>
            {mode === "mobile" ? (
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="ปิดเมนู"
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
          aria-label="ปิดแถบเมนู"
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
                aria-label="เปิดเมนู"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:inline-flex"
                onClick={() => setSidebarCollapsed((current) => !current)}
                aria-label={sidebarCollapsed ? "ขยายเมนูด้านซ้าย" : "ย่อเมนูด้านซ้าย"}
                title={sidebarCollapsed ? "ขยายเมนูด้านซ้าย" : "ย่อเมนูด้านซ้าย"}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ต้นแบบจำลอง · ไม่มีการเชื่อมต่อ API จริง</p>
                <h1 className="mt-1 text-lg font-semibold text-slate-950 sm:text-xl">แพลตฟอร์มวางแผนพัสดุคงคลังและจัดซื้อด้วย AI</h1>
              </div>
            </div>
            <div className="flex w-full items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 sm:w-auto">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="truncate">สูตร {formulaPolicy.formulaVersion} · ระดับความมั่นใจ {formatPercent(formulaPolicy.serviceLevel * 100).replace("+", "")}</span>
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
  const relationshipCoveragePercent =
    peaRelationshipSummary.mergedSkuPlantKeys > 0
      ? (peaRelationshipSummary.stockUsageIntersectionKeys / peaRelationshipSummary.mergedSkuPlantKeys) * 100
      : 0;
  const criticalRelationshipCount = peaRiskCoverageRecords.filter((record) => record.riskStatus.startsWith("Critical")).length;
  const topRelationshipRisk = [...peaRiskCoverageRecords].sort((a, b) => a.stockCoverPeriods - b.stockCoverPeriods)[0];

  return (
    <>
      <PageTitle
        eyebrow="แดชบอร์ด"
        title="ภาพรวมความเสี่ยงสต็อกและคำแนะนำจัดซื้อ"
        subtitle="หน้าหลักสำหรับผู้ใช้งานคลังและฝ่ายจัดซื้อ ตรวจสอบความเสี่ยง งบประมาณ และงานที่รออนุมัติ"
      />
      <Card className="mb-5 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {["ปีงบประมาณ 2026", "ภูมิภาค: ภาคเหนือ", "คลัง: I010", "หมวดหมู่: ทั้งหมด"].map((value) => (
            <select key={value} className={inputClass} defaultValue={value}>
              <option>{value}</option>
            </select>
          ))}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className={`${inputClass} pl-9`} placeholder="ค้นหา SKU / คลัง" />
          </div>
        </div>
      </Card>

      <Card className="mb-5 overflow-hidden border-blue-200">
        <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">Demo Scenario</span>
              <span className="text-sm font-medium text-slate-500">AI-assisted decision support</span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-950">เริ่ม Demo Flow: สายไฟแรงต่ำ C01</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              ระบบแนะนำให้เติม 10 เมตร แต่ผู้ใช้ลองขอ 20 เมตร ระบบจะบังคับกรอกเหตุผล ตรวจงบ 3 ชั้น ส่งอนุมัติระดับเขต และเก็บบันทึกค่าคำนวณสำหรับตรวจสอบย้อนหลัง
            </p>
          </div>
          <div className="grid gap-2">
            <Button onClick={() => openSku("C01")}>
              <Sparkles className="h-4 w-4" />
              เริ่ม Demo Flow
            </Button>
            <p className="text-xs leading-5 text-slate-500">Dashboard → SKU Detail → Request → Approval → History → VMI</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="จำนวน SKU ทั้งหมด" value={String(skus.length)} helper="รายการ" tone="slate" />
        <MetricCard label="SKU เสี่ยง" value={String(riskCount)} helper="ต้องติดตาม" tone="red" />
        <MetricCard label="PR รออนุมัติ" value={String(pendingCount)} helper="รออนุมัติ" tone="blue" />
        <MetricCard label="SKU เหมาะกับ VMI" value="1" helper="แนะนำ C01" tone="purple" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-600">งบคลังพื้นที่</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{formatTHB(25_000)}</p>
          <p className="mt-2 text-sm text-slate-500">I010 คลัง I010</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-600">งบระดับเขต</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{formatTHB(300_000)}</p>
          <p className="mt-2 text-sm text-slate-500">เขตภาคเหนือ</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-600">งบส่วนกลาง</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{formatTHB(centralBudgetRemaining)}</p>
          <p className="mt-2 text-sm text-slate-500">ส่วนกลางทั่วประเทศ</p>
        </Card>
      </div>

      <Card className="mt-5">
        <SectionHeader
          title="ภาพรวมความสัมพันธ์ข้อมูลจาก Excel"
          subtitle="สรุปจากไฟล์ inventory_relationship_analysis.xlsx เพื่อบอกว่า stock, usage และ lead time เชื่อมกันได้มากน้อยแค่ไหน"
        />
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Stock SKU/Plant" value={formatNumber(peaRelationshipSummary.stockSkuPlantKeys, 0)} helper={`${formatNumber(peaRelationshipSummary.stockRows, 0)} rows`} tone="slate" />
          <MetricCard label="Usage SKU/คลัง" value={formatNumber(peaRelationshipSummary.movingSkuPlantKeys, 0)} helper={`${formatNumber(peaRelationshipSummary.movingRows, 0)} rows`} tone="blue" />
          <MetricCard label="เชื่อม Stock+Usage ได้" value={`${formatNumber(relationshipCoveragePercent, 1)}%`} helper={`${formatNumber(peaRelationshipSummary.stockUsageIntersectionKeys, 0)} keys จาก ${formatNumber(peaRelationshipSummary.mergedSkuPlantKeys, 0)}`} tone="green" />
          <MetricCard label="Lead Time SKU" value={formatNumber(peaRelationshipSummary.leadTimeSkuKeys, 0)} helper={`${formatNumber(peaRelationshipSummary.leadTimeRows, 0)} rows`} tone="purple" />
          <MetricCard label="Critical coverage" value={String(criticalRelationshipCount)} helper="stock cover < 1 รอบ" tone="red" />
        </div>
        <div className="border-t border-slate-200 px-5 py-4 text-sm leading-6 text-slate-600">
          {topRelationshipRisk ? (
            <p>
              ตัวอย่างความเสี่ยงสูงจากไฟล์ relationship: {topRelationshipRisk.skuId} ที่ {topRelationshipRisk.plantId} มี stock cover เพียง {formatNumber(topRelationshipRisk.stockCoverPeriods, 2)} รอบ
              และใช้เฉลี่ย {formatNumber(topRelationshipRisk.avgPeriodUsage, 0)} {topRelationshipRisk.usageUnit}/เดือน
            </p>
          ) : (
            <p>ยังไม่มี relationship risk record สำหรับแสดงผล</p>
          )}
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <SectionHeader title="แจ้งเตือนสต็อกวิกฤต" subtitle="รายการที่สต็อกต่ำกว่าจุดสั่งซื้อใหม่ (Reorder Point) หรือระดับพัสดุสำรองปลอดภัย (Safety Stock)" />
          <DataTable columns={["SKU", "รายการ", "คลัง", "Stock", "จุดสั่งซื้อใหม่", "สถานะ", "ดำเนินการ"]}>
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
                    <Button variant="secondary" onClick={() => openSku(record.skuId)}>เปิดรายละเอียด</Button>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-700" />
            <h3 className="font-semibold text-slate-950">สรุปจากระบบ AI</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>C01 ที่คลัง I010 อยู่ต่ำกว่าจุดสั่งซื้อใหม่ (Reorder Point) 122 เมตร และมีงบคลังพื้นที่เพียง 25,000 บาท</p>
            <p>จาก relationship analysis พบว่า C01 ที่ I010 มี stock cover ประมาณ 0.09 รอบ และยังไม่พบ Lead Time เฉพาะ Factory/SKU จึงควรใช้ Lead Time จากซัพพลายเออร์เป็นค่าตั้งต้นใน PoC</p>
            <p>หากขอซื้อ 20 เมตรจาก S001 จะใช้เงิน 40,000 บาท จึงต้องส่งอนุมัติระดับเขต</p>
            <p>C01 มีความต้องการค่อนข้างสม่ำเสมอและซัพพลายเออร์มีความน่าเชื่อถือ 96% เหมาะสำหรับทดลอง VMI ระดับเขต</p>
          </div>
          <Button className="mt-5 w-full" onClick={() => openSku("C01")}>
            <Boxes className="h-4 w-4" />
            เปิดรายละเอียด SKU C01
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
        eyebrow="คลังพัสดุ"
        title="รายการสต็อกตามคลัง"
        subtitle="ตรวจสอบ Stock ปัจจุบัน ระดับพัสดุสำรองปลอดภัย จุดสั่งซื้อใหม่ และจำนวนที่ระบบแนะนำ"
      />
      <Card>
        <SectionHeader title="รายการความเสี่ยงในคลัง" subtitle="คลิกเปิดรายละเอียด SKU เพื่อดูตัวเลือกซัพพลายเออร์และวิธีคำนวณ" />
        <DataTable columns={["SKU", "รายการ", "คลัง", "สต็อกปัจจุบัน", "พัสดุสำรองปลอดภัย", "จุดสั่งซื้อใหม่", "จำนวนที่แนะนำ", "สถานะ", "ดำเนินการ"]}>
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
                <td className="px-4 py-3"><Button variant="secondary" onClick={() => openSku(record.skuId)}>รายละเอียด</Button></td>
              </tr>
            );
          })}
        </DataTable>
      </Card>
    </>
  );
}

function WarehouseSkuUsagePage() {
  const usageWarehouseOptions = peaWarehouseMaster.filter((warehouse) =>
    peaMonthlyUsage.some((usage) => usage.warehouseId === warehouse.warehouseId),
  );
  const regionOptions = Array.from(new Set(peaWarehouseMaster.map((warehouse) => warehouse.regionCode))).sort();
  const skuOptions = peaSkuMaster.filter((sku) => peaMonthlyUsage.some((usage) => usage.skuId === sku.skuId));
  const [selectedRegionCode, setSelectedRegionCode] = useState("all");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("all");
  const [selectedSkuId, setSelectedSkuId] = useState("all");
  const [search, setSearch] = useState("");
  const warehouseOptions = usageWarehouseOptions.filter((warehouse) => selectedRegionCode === "all" || warehouse.regionCode === selectedRegionCode);
  const selectedWarehouseIds = selectedWarehouseId === "all" ? warehouseOptions.map((warehouse) => warehouse.warehouseId) : [selectedWarehouseId];

  const rows = buildWarehouseUsageRows(selectedWarehouseIds)
    .filter((row) => selectedSkuId === "all" || row.skuId === selectedSkuId)
    .filter((row) => {
      const keyword = search.trim().toLowerCase();
      if (!keyword) return true;
      return `${row.skuId} ${row.skuName} ${row.category}`.toLowerCase().includes(keyword);
    });

  const selectedWarehouse = peaWarehouseMaster.find((warehouse) => warehouse.warehouseId === selectedWarehouseId);
  const monthlyTotals = usageMonthLabels.map((_, index) => rows.reduce((sum, row) => sum + row.monthly[index], 0));
  const seasonTotals = buildSeasonAverages(monthlyTotals);
  const annualTotal = rows.reduce((sum, row) => sum + row.total, 0);
  const activeSkuCount = rows.length;
  const activeWarehouseCount = selectedWarehouseId === "all" ? selectedWarehouseIds.length : 1;
  const peakMonthIndex = monthlyTotals.reduce((bestIndex, value, index) => (value > monthlyTotals[bestIndex] ? index : bestIndex), 0);
  const peakSeason = usageSeasons.reduce((best, season) => (seasonTotals[season.id] > seasonTotals[best.id] ? season : best), usageSeasons[0]);
  const topSku = rows.reduce<WarehouseUsageRow | undefined>((best, row) => (!best || row.total > best.total ? row : best), undefined);
  const warehouseScopeLabel = selectedWarehouseId === "all" ? "ทุกคลัง" : selectedWarehouseId;
  const warehouseScopeHelper = selectedWarehouseId === "all" ? `${selectedWarehouseIds.length} คลังที่มีข้อมูล usage` : selectedWarehouse?.warehouseName ?? "Warehouse";
  const regionScopeLabel = selectedRegionCode === "all" ? "ทุกเขต" : formatPeaRegionCode(selectedRegionCode);

  return (
    <>
      <PageTitle
        eyebrow="ข้อมูลการใช้จาก Excel"
        title="ปริมาณการใช้ SKU รายคลัง"
        subtitle="ดูประวัติการใช้รายเดือนจากชีต WH Season Data Item โดยแปลงข้อมูล Jan-Dec เป็น long format สำหรับคำนวณ demand"
      />

      <Card className="mb-5 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Field label="เขตจากชีต WH">
            <select
              className={inputClass}
              value={selectedRegionCode}
              onChange={(event) => {
                setSelectedRegionCode(event.target.value);
                setSelectedWarehouseId("all");
              }}
            >
              <option value="all">ทุกเขต</option>
              {regionOptions.map((regionCode) => (
                <option key={regionCode} value={regionCode}>
                  {formatPeaRegionCode(regionCode)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="รหัสคลังพื้นที่ (WH Id)">
            <select className={inputClass} value={selectedWarehouseId} onChange={(event) => setSelectedWarehouseId(event.target.value)}>
              <option value="all">{selectedRegionCode === "all" ? "ทุกคลังที่มีข้อมูล usage" : `ทุกคลังใน ${formatPeaRegionCode(selectedRegionCode)}`}</option>
              {warehouseOptions.map((warehouse) => (
                <option key={warehouse.warehouseId} value={warehouse.warehouseId}>
                  {warehouse.warehouseId} · {warehouse.warehouseName} · {formatPeaRegionCode(warehouse.regionCode)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="SKU">
            <select className={inputClass} value={selectedSkuId} onChange={(event) => setSelectedSkuId(event.target.value)}>
              <option value="all">{selectedWarehouseId === "all" ? "ทุก SKU ในทุกคลัง" : "ทุก SKU ในคลังนี้"}</option>
              {skuOptions.map((sku) => (
                <option key={sku.skuId} value={sku.skuId}>
                  {sku.skuId} · {sku.skuName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ปีข้อมูล">
            <input className={inputClass} value="2026" readOnly />
          </Field>
          <Field label="ค้นหา">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหา SKU / รายการ / หมวดหมู่" />
            </div>
          </Field>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="เขต" value={regionScopeLabel} helper="จากชีต WH" tone="slate" />
        <MetricCard label="ขอบเขตคลัง" value={warehouseScopeLabel} helper={warehouseScopeHelper} tone="slate" />
        <MetricCard label="Usage รวมทั้งปี" value={formatNumber(annualTotal)} helper="หน่วยตาม SKU" tone="blue" />
        <MetricCard label="SKU ที่มีการใช้" value={String(activeSkuCount)} helper={`${activeWarehouseCount} คลัง`} tone="green" />
        <MetricCard label="Season ที่ใช้สูงสุด" value={peakSeason.label} helper={`${peakSeason.helper} · เฉลี่ย ${formatNumber(seasonTotals[peakSeason.id])}`} tone="purple" />
      </div>

      <Card className="mt-5">
        <SectionHeader
          title="ค่าเฉลี่ยการใช้ตาม Season"
          subtitle="ค่าเฉลี่ยต่อเดือนของช่วงฤดูกาล ใช้ช่วยดู seasonal demand ก่อนนำไปตั้ง Seasonal Factor หรือวิเคราะห์ VMI"
        />
        <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
          {usageSeasons.map((season) => (
            <div key={season.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">{season.label}</p>
              <p className="mt-1 text-xs text-slate-500">{season.helper}</p>
              <p className="mt-3 text-2xl font-semibold text-blue-700">{formatNumber(seasonTotals[season.id])}</p>
              <p className="mt-1 text-xs text-slate-500">ค่าเฉลี่ยต่อเดือนใน season นี้</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <SectionHeader
            title="แนวโน้มการใช้รายเดือน"
            subtitle={selectedSkuId === "all" ? "รวมทุก SKU ที่ผ่านตัวกรองในคลังนี้" : "แสดงเฉพาะ SKU ที่เลือก"}
          />
          <div className="p-5">
            <MonthlyUsageBars monthlyTotals={monthlyTotals} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-700" />
            <h3 className="font-semibold text-slate-950">สรุปการใช้งาน</h3>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>ข้อมูลหน้านี้มาจาก mock data ที่จำลองจากชีต WH Season Data Item และใช้เขตจากชีต WH เวอร์ชันใหม่</p>
            <p>ระบบใช้ข้อมูลนี้เป็นประวัติความต้องการใช้ เพื่อคำนวณค่าเฉลี่ยการใช้ ความผันผวนของการใช้ ระดับพัสดุสำรองปลอดภัย และความเหมาะสมสำหรับ VMI</p>
            <p>หากเลือก “ทุกคลัง” ระบบจะรวม usage ของ SKU เดียวกันทุก WH แล้วคำนวณค่าเฉลี่ย season จากยอดรวมรายเดือน</p>
            {topSku ? (
              <p>
                SKU ที่ใช้สูงสุดในตัวกรองนี้คือ {topSku.skuId} · {topSku.skuName} รวม {formatNumber(topSku.total)} {topSku.unit}
              </p>
            ) : (
              <p>ไม่พบข้อมูล usage ตามตัวกรองปัจจุบัน</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <SectionHeader
          title="ตารางปริมาณการใช้ SKU รายเดือน"
          subtitle="แสดงยอดรายเดือนพร้อม % เพิ่ม/ลดจากเดือนก่อน คล้ายมุมมอง Excel wide view"
        />
        <DataTable columns={["เขต", "ขอบเขตคลัง", "SKU", "รายการ", "หมวดหมู่", "หน่วย", ...usageMonthTrendColumns, "รวม", "เฉลี่ย/เดือน", "เดือนสูงสุด"]} empty={rows.length === 0}>
          {rows.map((row) => (
            <tr key={`${row.warehouseId}-${row.skuId}`} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-900">{row.regionLabel}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{row.warehouseLabel}</td>
              <td className="px-4 py-3 font-semibold text-blue-700">{row.skuId}</td>
              <td className="min-w-52 px-4 py-3 text-slate-700">{row.skuName}</td>
              <td className="px-4 py-3 text-slate-600">{row.category}</td>
              <td className="px-4 py-3 text-slate-600">{row.unit}</td>
              {row.monthly.flatMap((value, index) => {
                const cells = [
                  <td key={`${row.skuId}-${index}-value`} className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatNumber(value, 0)}
                  </td>,
                ];

                if (index > 0) {
                  cells.push(
                    <td key={`${row.skuId}-${index}-change`} className="px-4 py-3 text-right">
                      <UsageChangeBadge change={row.monthlyChanges[index]} />
                    </td>,
                  );
                }

                return cells;
              })}
              <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-950">{formatNumber(row.total)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatNumber(row.averageMonthly)}</td>
              <td className="px-4 py-3 text-slate-700">{row.peakMonth}</td>
            </tr>
          ))}
        </DataTable>
      </Card>

      <Card className="mt-5">
        <SectionHeader
          title="ค่าเฉลี่ยตาม Season ราย SKU"
          subtitle="เปรียบเทียบค่าเฉลี่ยต่อเดือนของแต่ละ SKU ระหว่างฤดูหนาว ฤดูร้อน และฤดูฝน"
        />
        <DataTable columns={["เขต", "ขอบเขตคลัง", "SKU", "รายการ", "หน่วย", ...usageSeasons.map((season) => `${season.label} (${season.helper})`), "Season สูงสุด"]} empty={rows.length === 0}>
          {rows.map((row) => (
            <tr key={`${row.warehouseId}-${row.skuId}-season`} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-900">{row.regionLabel}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{row.warehouseLabel}</td>
              <td className="px-4 py-3 font-semibold text-blue-700">{row.skuId}</td>
              <td className="min-w-52 px-4 py-3 text-slate-700">{row.skuName}</td>
              <td className="px-4 py-3 text-slate-600">{row.unit}</td>
              {usageSeasons.map((season) => (
                <td key={`${row.skuId}-${season.id}`} className="px-4 py-3 text-right tabular-nums text-slate-700">
                  {formatNumber(row.seasonAverages[season.id])}
                </td>
              ))}
              <td className="px-4 py-3 font-semibold text-slate-900">{row.peakSeason}</td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </>
  );
}

type WarehouseUsageRow = {
  warehouseId: string;
  warehouseLabel: string;
  warehouseCount: number;
  regionLabel: string;
  skuId: string;
  skuName: string;
  category: string;
  unit: string;
  monthly: number[];
  monthlyChanges: UsageMonthlyChange[];
  total: number;
  averageMonthly: number;
  peakMonth: string;
  seasonAverages: Record<string, number>;
  peakSeason: string;
};

type UsageMonthlyChange = {
  previousValue: number;
  currentValue: number;
  difference: number;
  percent: number;
  trend: "up" | "down" | "flat";
};

function buildWarehouseUsageRows(warehouseIds: string[]): WarehouseUsageRow[] {
  const usageForWarehouse = peaMonthlyUsage.filter((usage) => warehouseIds.includes(usage.warehouseId));
  const skuIds = Array.from(new Set(usageForWarehouse.map((usage) => usage.skuId)));
  const warehouseLabel = warehouseIds.length === 1 ? warehouseIds[0] : `ทุกคลัง (${warehouseIds.length})`;

  // แปลงข้อมูล usage long format กลับเป็นมุมมองรายเดือน Jan-Dec เพื่อให้ผู้ใช้เทียบกับ Excel เดิมได้ง่าย
  return skuIds
    .map((skuId) => {
      const sku = peaSkuMaster.find((item) => item.skuId === skuId);
      const monthly = Array.from({ length: 12 }, (_, index) =>
        usageForWarehouse
          .filter((usage) => usage.skuId === skuId && usage.usageMonth === index + 1)
          .reduce((sum, usage) => sum + usage.usageQty, 0),
      );
      const total = monthly.reduce((sum, value) => sum + value, 0);
      const monthlyChanges = buildMonthlyChanges(monthly);
      const peakMonthIndex = monthly.reduce((bestIndex, value, index) => (value > monthly[bestIndex] ? index : bestIndex), 0);
      const seasonAverages = buildSeasonAverages(monthly);
      const peakSeason = usageSeasons.reduce((best, season) => (seasonAverages[season.id] > seasonAverages[best.id] ? season : best), usageSeasons[0]);
      const rowWarehouseIds = Array.from(new Set(usageForWarehouse.filter((usage) => usage.skuId === skuId).map((usage) => usage.warehouseId)));
      const warehouseCount = rowWarehouseIds.length;
      const rowRegionCodes = Array.from(
        new Set(
          rowWarehouseIds
            .map((warehouseId) => peaWarehouseMaster.find((warehouse) => warehouse.warehouseId === warehouseId)?.regionCode)
            .filter(Boolean),
        ),
      ) as string[];

      return {
        warehouseId: warehouseIds.length === 1 ? warehouseIds[0] : "all",
        warehouseLabel: warehouseIds.length === 1 ? warehouseLabel : `ทุกคลัง (${warehouseCount})`,
        warehouseCount,
        regionLabel: rowRegionCodes.length === 1 ? formatPeaRegionCode(rowRegionCodes[0]) : `หลายเขต (${rowRegionCodes.length})`,
        skuId,
        skuName: sku?.skuName ?? "ไม่พบชื่อ SKU",
        category: sku?.category ?? "-",
        unit: sku?.unit ?? "-",
        monthly,
        monthlyChanges,
        total,
        averageMonthly: total / 12,
        peakMonth: `${usageMonthLabels[peakMonthIndex]} (${formatNumber(monthly[peakMonthIndex])})`,
        seasonAverages,
        peakSeason: `${peakSeason.label} (${formatNumber(seasonAverages[peakSeason.id])})`,
      };
    })
    .sort((a, b) => b.total - a.total);
}

function buildMonthlyChanges(monthly: number[]): UsageMonthlyChange[] {
  // % เพิ่ม/ลด = (เดือนปัจจุบัน - เดือนก่อนหน้า) / เดือนก่อนหน้า × 100
  // ถ้าเดือนก่อนหน้าเป็น 0 และเดือนปัจจุบันมากกว่า 0 ให้แสดง +100% เพื่อสื่อว่าเริ่มมีการใช้
  return monthly.map((currentValue, index) => {
    const previousValue = index === 0 ? currentValue : monthly[index - 1] ?? 0;
    const difference = index === 0 ? 0 : currentValue - previousValue;
    const percent = index === 0 ? 0 : previousValue === 0 ? (currentValue > 0 ? 100 : 0) : (difference / previousValue) * 100;
    const trend = difference > 0 ? "up" : difference < 0 ? "down" : "flat";

    return {
      previousValue,
      currentValue,
      difference,
      percent,
      trend,
    };
  });
}

function UsageChangeBadge({ change }: { change: UsageMonthlyChange }) {
  const isUp = change.trend === "up";
  const isDown = change.trend === "down";
  const className = isUp
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : isDown
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : "bg-slate-50 text-slate-500 ring-slate-200";
  const Icon = isUp ? ArrowUp : isDown ? ArrowDown : Minus;

  return (
    <span className={`inline-flex items-center justify-end gap-1 rounded-full px-2 py-1 text-xs font-semibold tabular-nums ring-1 ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {change.percent > 0 ? "+" : ""}
      {formatNumber(change.percent, 0)}%
    </span>
  );
}

function buildSeasonAverages(monthly: number[]): Record<string, number> {
  // ค่าเฉลี่ย season = ผลรวม usage ของเดือนใน season / จำนวนเดือนใน season
  // สำหรับ "ทุกคลัง" monthly จะเป็นยอดรวมข้าม WH ก่อน แล้วค่อยเฉลี่ยตาม season
  return usageSeasons.reduce<Record<string, number>>((result, season) => {
    const total = season.months.reduce((sum, monthNumber) => sum + (monthly[monthNumber - 1] ?? 0), 0);
    result[season.id] = total / season.months.length;
    return result;
  }, {});
}

function MonthlyUsageBars({ monthlyTotals }: { monthlyTotals: number[] }) {
  const maxValue = Math.max(...monthlyTotals, 1);

  return (
    <div className="grid grid-cols-12 items-end gap-2 overflow-x-auto pb-2">
      {monthlyTotals.map((value, index) => {
        const height = Math.max((value / maxValue) * 180, value > 0 ? 18 : 4);
        return (
          <div key={usageMonthLabels[index]} className="flex min-w-14 flex-col items-center gap-2">
            <div className="flex h-48 w-full items-end rounded-md bg-slate-100 px-1">
              <div
                className="w-full rounded-t-md bg-blue-600 transition-all"
                style={{ height }}
                title={`${usageMonthLabels[index]}: ${formatNumber(value)}`}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-700">{usageMonthLabels[index]}</p>
              <p className="mt-1 text-[11px] text-slate-500">{formatNumber(value)}</p>
            </div>
          </div>
        );
      })}
    </div>
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
  const dataCoverage = getPeaDataCoverage({ warehouseId: record.warehouseId, skuId: sku.id, supplierId: primarySupplier.id });
  const coverageWarnings = getPeaDataCoverageWarnings(dataCoverage);
  const relationshipRecord = getPeaRiskCoverageRecord(record.warehouseId, sku.id);
  const skuLeadTimeSummary = getPeaLeadTimeSkuSummary(sku.id);
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <>
      <PageTitle
        eyebrow="คลังพัสดุ / รายละเอียด SKU"
        title={`${sku.id} ${sku.name}`}
        subtitle={`${warehouse.id} ${warehouse.name} · ${regionLabels[warehouse.region]} · ใช้พื้นที่คลัง ${warehouse.capacityUsed}%`}
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> ย้อนกลับ</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <MetricCard label="สต็อกปัจจุบัน" value={`${formatNumber(record.currentStock)} ${sku.unit}`} helper="คงเหลือ" />
        <MetricCard label="ค่าเฉลี่ยการใช้ต่อวัน" value={`${formatNumber(recommendation.averageDailyDemand)} ${sku.unit}`} helper="ต่อวัน" />
        <MetricCard label="ระดับพัสดุสำรองปลอดภัย" value={`${formatNumber(recommendation.safetyStock)} ${sku.unit}`} helper="กันความเสี่ยงขาดสต็อก" tone="green" />
        <MetricCard label="จุดสั่งซื้อใหม่" value={`${formatNumber(recommendation.reorderPoint)} ${sku.unit}`} helper="จุดเริ่มจัดซื้อ" tone="red" />
        <MetricCard label="ความต้องการคาดการณ์" value={`${formatNumber(recommendation.forecastDemandForPlanningPeriod)} ${sku.unit}`} helper="รอบแผน" />
        <MetricCard label="จำนวนที่ระบบแนะนำ" value={`${formatNumber(recommendation.suggestedQuantity)} ${sku.unit}`} helper="AI" tone="blue" />
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
      <div className="mt-4">
        <DataCoverageCard coverage={dataCoverage} warnings={coverageWarnings} />
      </div>
      <div className="mt-4">
        <PeaRelationshipInsightCard
          coverage={dataCoverage}
          relationshipRecord={relationshipRecord}
          skuLeadTimeSummary={skuLeadTimeSummary}
          supplierLeadTimeDays={primarySupplierRecord.leadTimeDays}
        />
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <SectionHeader
            title="เปรียบเทียบราคาและระยะเวลารอพัสดุของซัพพลายเออร์"
            subtitle="เปรียบเทียบราคาต่อหน่วย ระยะเวลารอพัสดุ (Lead Time) และจำนวนสั่งซื้อขั้นต่ำ (MOQ)"
            action={<StatusBadge status={record.status} />}
          />
          <DataTable columns={["ซัพพลายเออร์", "ผู้ติดต่อ", "ราคาต่อหน่วย", "ระยะเวลารอพัสดุ", "จำนวนสั่งซื้อขั้นต่ำ", "พื้นที่ให้บริการ", "ดำเนินการ"]} empty={offers.length === 0}>
            {offers.map((offer) => {
              const supplier = getSupplier(offer.supplierId);
              return (
                <tr key={`${offer.supplierId}-${offer.skuId}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{supplier.name}</td>
                  <td className="px-4 py-3 text-slate-600">{supplier.contactPerson}<br /><span className="text-xs">{supplier.phone}</span></td>
                  <td className="px-4 py-3">{formatTHB(offer.unitPrice)}/{offer.unit}</td>
                  <td className="px-4 py-3">{offer.leadTimeDays} วัน</td>
                  <td className="px-4 py-3">{offer.moq} {offer.unit}</td>
                  <td className="px-4 py-3">{regionLabels[supplier.coverage]}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => onSupplier(supplier.id)}>ติดต่อ</Button>
                      <Button onClick={() => onCreateRequest(supplier.id)}>สร้างคำขอซื้อ</Button>
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
            <h3 className="font-semibold text-slate-950">ขั้นตอนสาธิต</h3>
            <div className="mt-4 grid gap-2">
              <Button variant="secondary" onClick={onCalculation}><Calculator className="h-4 w-4" /> ดูรายละเอียดการคำนวณ</Button>
              <Button onClick={() => onCreateRequest(primarySupplier.id)}><Plus className="h-4 w-4" /> สร้างคำขอซื้อ</Button>
              <Button variant="secondary" onClick={onVmi}><Workflow className="h-4 w-4" /> จำลอง VMI</Button>
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
        eyebrow="รายละเอียดการคำนวณ"
        title={`${sku.id} ${sku.name} · เวอร์ชันสูตร ${recommendation.formulaVersion}`}
        subtitle="คำอธิบายวิธีคำนวณระดับพัสดุสำรองปลอดภัย จุดสั่งซื้อใหม่ จำนวนที่แนะนำ และเส้นทางอนุมัติ"
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> กลับไปหน้ารายละเอียด SKU</Button>}
      />
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {formulaList.map((formula, index) => (
          <Card key={formula} className="p-3">
            <p className="text-xs font-semibold text-slate-500">สูตรที่ {index + 1}</p>
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

function DataCoverageCard({ coverage, warnings }: { coverage: PeaDataCoverage; warnings: string[] }) {
  const allComplete = Object.values(coverage.flags).every(Boolean);
  const mappingTypeLabels: Record<string, string> = {
    exact_code_match: "รหัสตรงกัน",
    manual_mapping: "จับคู่ด้วยผู้ใช้",
    inferred_region: "อนุมานจากเขต",
    unknown: "ยังไม่ทราบ",
  };
  const confidenceLabels: Record<string, string> = {
    high: "ความมั่นใจสูง",
    medium: "ความมั่นใจปานกลาง",
    low: "ความมั่นใจต่ำ",
  };
  const coverageItems = [
    { label: "ข้อมูลการใช้ย้อนหลัง", available: coverage.flags.hasUsageData, source: "Monthly Usage ของรหัสคลังพื้นที่ (WH Id)" },
    { label: "ข้อมูล Stock ปัจจุบัน", available: coverage.flags.hasStockData, source: "Batch / Stock Summary ของ Factory/Plant" },
    { label: "ข้อมูลระยะเวลารอพัสดุ (Lead Time)", available: coverage.flags.hasLeadTimeData, source: "Lead Time Summary ของ Factory/Plant" },
    { label: "ข้อมูลราคา Supplier", available: coverage.flags.hasSupplierData, source: "Supplier mock price, MOQ และ Lead Time" },
    { label: "WH-Factory Mapping", available: coverage.flags.hasWarehouseFactoryMapping, source: "ตารางจับคู่ WH Id กับ Factory/Plant" },
  ];

  return (
    <Card>
      <SectionHeader
        title="ความครบถ้วนของข้อมูลสำหรับการคำนวณ"
        subtitle="แยกให้ชัดว่า WH Id คือพื้นที่เกิด demand, Factory/Plant คือจุดที่ผูก stock และ lead time, Supplier คือผู้ขายจริง"
      />
      <div className="px-5 pt-4">
        <InlineAlert tone={allComplete ? "success" : "warning"}>
          {allComplete ? "ข้อมูลครบสำหรับการคำนวณเต็มรูปแบบ" : "ข้อมูลยังไม่ครบสำหรับการคำนวณเต็มรูปแบบ โปรดตรวจรายการที่ขาดก่อนใช้ผลลัพธ์ตัดสินใจจริง"}
        </InlineAlert>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 px-5 sm:grid-cols-2 xl:grid-cols-5">
        {coverageItems.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  item.available ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                }`}
              >
                {item.available ? "มีข้อมูล" : "ขาดข้อมูล"}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{item.source}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 px-5 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">รหัสคลังพื้นที่ (WH Id)</p>
          <p className="mt-1 font-semibold text-slate-900">{coverage.requestedWarehouseId} → {coverage.resolvedWarehouseId}</p>
          <p className="mt-1 text-xs">พื้นที่ที่เกิดความต้องการใช้และใช้ดึงประวัติการเบิกจ่าย</p>
        </div>
        <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">เขตจากชีต WH</p>
          <p className="mt-1 font-semibold text-slate-900">{formatPeaRegionCode(coverage.warehouseRegionCode)}</p>
          <p className="mt-1 text-xs">ใช้ข้อมูล Region (เขต) จาก column ในชีต WH ไม่เดาจากรหัสคลัง</p>
        </div>
        <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">รหัสคลังหลัก/โรงงานใน SAP (Factory/Plant)</p>
          <p className="mt-1 font-semibold text-slate-900">{coverage.mappedFactoryId ?? "ยังไม่มีการจับคู่"}</p>
          <p className="mt-1 text-xs">จุดที่ผูก Stock, batch, movement และ Lead Time ในข้อมูลลักษณะ SAP</p>
        </div>
        <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Supplier Id จาก Factory</p>
          <p className="mt-1 font-semibold text-slate-900">{coverage.mappedFactorySupplierId ?? "ยังไม่มีข้อมูล"}</p>
          <p className="mt-1 text-xs">มาจากชีต Supplier Factory ใช้บอก source id ที่ผูกกับ Factory/Plant</p>
        </div>
        <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ประเภทการจับคู่</p>
          <p className="mt-1 font-semibold text-slate-900">{coverage.mappingType ? mappingTypeLabels[coverage.mappingType] : "ยังไม่มีข้อมูล"}</p>
          <p className="mt-1 text-xs">{coverage.mappingConfidence ? confidenceLabels[coverage.mappingConfidence] : "ต้องยืนยัน mapping เพิ่ม"}{coverage.mappingRemark ? ` · ${coverage.mappingRemark}` : ""}</p>
        </div>
        <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ซัพพลายเออร์</p>
          <p className="mt-1 font-semibold text-slate-900">{coverage.requestedSupplierId ?? "ซัพพลายเออร์จำลองใดก็ได้"}</p>
          <p className="mt-1 text-xs">ผู้ขายจริงสำหรับราคา จำนวนสั่งซื้อขั้นต่ำ (MOQ) ผู้ติดต่อ และ Lead Time มาตรฐาน</p>
        </div>
      </div>
      <div className="mt-4 px-5 pb-5">
        {warnings.length > 0 ? (
          <InlineAlert tone="warning">
            <p className="font-semibold">ข้อมูลไม่ครบสำหรับการคำนวณเต็มรูปแบบ</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </InlineAlert>
        ) : (
          <InlineAlert tone="success">ข้อมูลครบสำหรับเชื่อมความต้องการใช้ Stock ปัจจุบัน ระยะเวลารอพัสดุ และราคา Supplier จำลอง</InlineAlert>
        )}
      </div>
    </Card>
  );
}

function PeaRelationshipInsightCard({
  coverage,
  relationshipRecord,
  skuLeadTimeSummary,
  supplierLeadTimeDays,
}: {
  coverage: PeaDataCoverage;
  relationshipRecord?: PeaRiskCoverageRecord;
  skuLeadTimeSummary?: PeaLeadTimeSkuSummary;
  supplierLeadTimeDays: number;
}) {
  const leadTimeValue = relationshipRecord?.leadDaysBest ?? skuLeadTimeSummary?.avgLeadDaysSku ?? supplierLeadTimeDays;
  const leadTimeSource = relationshipRecord?.leadDaysBest
    ? "Factory/SKU จาก relationship file"
    : skuLeadTimeSummary
      ? "ค่าเฉลี่ยระดับ SKU จาก Lead Time Summary"
      : "ค่า Lead Time มาตรฐานจาก Supplier mock";
  const missingPlantLeadTime = !relationshipRecord?.leadDaysBest;

  return (
    <Card>
      <SectionHeader
        title="สัญญาณจาก Relationship Analysis"
        subtitle="อ่านค่าประกอบจาก inventory_relationship_analysis.xlsx เพื่อเทียบ stock, usage, lead time และความเหมาะสม VMI"
      />
      <div className="p-5">
        {relationshipRecord ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Stock cover"
                value={`${formatNumber(relationshipRecord.stockCoverPeriods, 2)} รอบ`}
                helper={relationshipRecord.riskStatus.replace("Critical:", "Critical ·").replace("Risk:", "Risk ·")}
                tone={relationshipRecord.riskStatus.startsWith("Critical") ? "red" : "yellow"}
              />
              <MetricCard
                label="ใช้เฉลี่ยต่อเดือน"
                value={`${formatNumber(relationshipRecord.avgPeriodUsage, 0)} ${relationshipRecord.usageUnit}`}
                helper={`CV ${formatNumber(relationshipRecord.cv, 2)} · ${relationshipRecord.activePeriods} เดือนที่มีข้อมูล`}
                tone="blue"
              />
              <MetricCard
                label="Lead Time ที่ใช้ประกอบ"
                value={`${formatNumber(leadTimeValue, 1)} วัน`}
                helper={leadTimeSource}
                tone={missingPlantLeadTime ? "yellow" : "green"}
              />
              <MetricCard
                label="VMI score"
                value={formatNumber(relationshipRecord.vmiScore, 1)}
                helper={`Stability ${formatNumber(relationshipRecord.stabilityScore, 1)} · Lead ${formatNumber(relationshipRecord.leadScore, 1)}`}
                tone="purple"
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">รหัสที่ใช้เทียบ</p>
                <p className="mt-1">WH/Factory: {coverage.resolvedWarehouseId} → {coverage.mappedFactoryId ?? "ยังไม่มี mapping"}</p>
                <p>SKU จริง: {coverage.resolvedSkuId}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Lead Time จากไฟล์</p>
                {relationshipRecord.leadCount ? (
                  <p className="mt-1">
                    มี {relationshipRecord.leadCount} transaction · เฉลี่ย {formatNumber(relationshipRecord.avgLeadDays ?? 0, 1)} วัน · P90 {formatNumber(relationshipRecord.p90LeadDays ?? 0, 1)} วัน
                  </p>
                ) : (
                  <p className="mt-1">ยังไม่พบ Lead Time เฉพาะ Factory/SKU นี้ใน relationship file</p>
                )}
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">ความหมาย</p>
                <p className="mt-1">
                  Stock cover ต่ำกว่า 1 รอบหมายถึงสต็อกปัจจุบันต่ำกว่าการใช้เฉลี่ยหนึ่งรอบ จึงควรตรวจแผนเติมของและงบประมาณก่อนอนุมัติ
                </p>
              </div>
            </div>
            {missingPlantLeadTime ? (
              <div className="mt-4">
                <InlineAlert tone="warning">
                  ไม่พบ Lead Time เฉพาะ Factory/SKU นี้จากไฟล์ relationship ระบบจึงแสดงค่า fallback จาก {skuLeadTimeSummary ? "ค่าเฉลี่ยระดับ SKU" : "Supplier mock"} เพื่อไม่ให้ผู้ใช้เข้าใจว่าข้อมูลครบทั้งหมด
                </InlineAlert>
              </div>
            ) : null}
          </>
        ) : (
          <InlineAlert tone="warning">
            ยังไม่มี relationship record สำหรับ {coverage.resolvedWarehouseId} / {coverage.resolvedSkuId} จึงยังไม่สามารถแสดง stock cover, VMI score และ lead time จากไฟล์วิเคราะห์ได้
          </InlineAlert>
        )}
      </div>
    </Card>
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
      <PageTitle eyebrow="ซัพพลายเออร์" title="ทะเบียนซัพพลายเออร์" subtitle="ค้นหาซัพพลายเออร์, SKU, หมวดหมู่ และดูช่องทางติดต่อ" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <SectionHeader
            title="รายชื่อซัพพลายเออร์"
            subtitle="รองรับการค้นหาด้วยชื่อซัพพลายเออร์ / SKU / หมวดหมู่"
            action={
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาซัพพลายเออร์ / SKU / หมวดหมู่" />
                </div>
                <Button onClick={() => setShowAddSupplier((current) => !current)}>
                  <Plus className="h-4 w-4" />
                  เพิ่มซัพพลายเออร์
                </Button>
              </div>
            }
          />
          {showAddSupplier ? (
            <div className="border-b border-slate-200 p-5">
              <SupplierProfileForm mode="create" onSave={saveSupplier} />
            </div>
          ) : null}
          <DataTable columns={["รหัส", "ซัพพลายเออร์", "สถานะ", "ผู้ติดต่อ", "โทรศัพท์", "อีเมล", "พื้นที่ให้บริการ", "ดำเนินการ"]} empty={filteredSuppliers.length === 0}>
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
                  <Button variant="secondary" onClick={() => { onSelectSupplier(supplier.id); onOpenDetail(); }}>รายละเอียด</Button>
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

  // หน้า Supplier Detail ใช้ปุ่มเพิ่ม SKU ที่รองรับเพื่อเปิดฟอร์มเพิ่ม SKU และข้อมูลตั้งต้นสำหรับคำนวณ
  // แทนปุ่มบันทึกการติดต่อ เพราะประวัติการติดต่อถูกแยกไว้ตามบริบทคำขอ/การตรวจอนุมัติ
  const saveSupportedItem = (catalog: SupplierCatalogInput) => {
    onAddCatalog(catalog);
    setShowAddSupportedItems(false);
  };

  return (
    <>
      <PageTitle
        eyebrow="รายละเอียดซัพพลายเออร์"
        title={supplier.name}
        subtitle={`${supplier.contactPerson} · ${regionLabels[supplier.coverage]}`}
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> ย้อนกลับ</Button>}
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
            <SectionHeader title="รายการ SKU ที่รองรับ" subtitle="SKU ที่ซัพพลายเออร์เสนอราคา ระยะเวลารอพัสดุ (Lead Time) และจำนวนสั่งซื้อขั้นต่ำ (MOQ)" />
            <DataTable columns={["SKU", "รายการ", "หมวดหมู่", "ราคาต่อหน่วย", "Lead Time", "MOQ", "ความน่าเชื่อถือ", "ดำเนินการ"]}>
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
            <SectionHeader title="ประวัติการแก้ไขซัพพลายเออร์" subtitle="ประวัติการแก้ไข Lead Time, MOQ, ราคา และความน่าเชื่อถือ" />
            <DataTable columns={["วันที่", "เป้าหมาย", "ฟิลด์", "ค่าเดิม", "ค่าใหม่", "หมายเหตุ"]} empty={supplierChangeLogs.length === 0}>
              {supplierChangeLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">{log.createdAt}</td>
                  <td className="px-4 py-3">{log.target}</td>
                  <td className="px-4 py-3">{getChangeLogFieldLabel(log.field)}</td>
                  <td className="px-4 py-3">{log.oldValue}</td>
                  <td className="px-4 py-3">{log.newValue}</td>
                  <td className="px-4 py-3">{log.note}</td>
                </tr>
              ))}
            </DataTable>
          </Card>
          <Card>
            <SectionHeader title="ประวัติการติดต่อ" subtitle="ประวัติการติดต่อซัพพลายเออร์" />
            <DataTable columns={["วันที่", "SKU ที่เกี่ยวข้อง", "รหัสคำขอ", "ช่องทาง", "วัตถุประสงค์", "ผลลัพธ์ / หมายเหตุ"]} empty={logs.length === 0}>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">{log.createdAt}</td>
                  <td className="px-4 py-3">{log.skuId ?? "-"}</td>
                  <td className="px-4 py-3">{log.requestId ?? "-"}</td>
                  <td className="px-4 py-3">{getContactChannelLabel(log.channel)}</td>
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
          <Button variant="secondary"><Phone className="h-4 w-4" /> โทร</Button>
          <Button variant="secondary"><Mail className="h-4 w-4" /> อีเมล</Button>
          <Button variant="secondary" onClick={() => onCopy(supplier.phone)}>คัดลอกเบอร์</Button>
          <Button variant="secondary" onClick={() => onCopy(supplier.email)}>คัดลอกอีเมล</Button>
        </div>
        {onAddSupportedItems ? (
          <Button className="mt-3 w-full" variant={addSupportedItemsOpen ? "secondary" : "primary"} onClick={onAddSupportedItems}>
            <Plus className="h-4 w-4" />
            {addSupportedItemsOpen ? "ซ่อนฟอร์มเพิ่ม SKU" : "เพิ่ม SKU ที่รองรับ"}
          </Button>
        ) : null}
      </Card>
      <Card className="p-4">
        <h3 className="font-semibold text-slate-950">การติดต่อล่าสุด</h3>
        <div className="mt-3 space-y-3">
          {logs.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มีประวัติการติดต่อ</p> : null}
          {logs.map((log) => (
            <div key={log.id} className="rounded-md bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-800">{getContactChannelLabel(log.channel)} · {log.purpose}</p>
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
    note: mode === "create" ? "เพิ่มซัพพลายเออร์ใหม่" : "แก้ไขข้อมูลติดต่อซัพพลายเออร์",
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
        title={mode === "create" ? "เพิ่มซัพพลายเออร์" : "ข้อมูลติดต่อและโปรไฟล์ซัพพลายเออร์"}
        subtitle={mode === "create" ? "เพิ่มโปรไฟล์ซัพพลายเออร์ก่อน แล้วค่อยเพิ่ม SKU ที่รองรับในหน้ารายละเอียด" : "แก้ไขข้อมูลติดต่อซัพพลายเออร์จากหน้ารายละเอียด"}
      />
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="รหัสซัพพลายเออร์">
            <input className={inputClass} value={form.id} readOnly={mode === "edit"} onChange={(event) => setForm({ ...form, id: event.target.value })} />
          </Field>
          <Field label="ชื่อซัพพลายเออร์">
            <input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="ผู้ติดต่อ">
            <input className={inputClass} value={form.contactPerson} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} />
          </Field>
          <Field label="โทรศัพท์">
            <input className={inputClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Field>
          <Field label="อีเมล">
            <input className={inputClass} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </Field>
          <Field label="รหัส Line">
            <input className={inputClass} value={form.lineId} onChange={(event) => setForm({ ...form, lineId: event.target.value })} />
          </Field>
          <Field label="พื้นที่ให้บริการ">
            <select className={inputClass} value={form.coverage} onChange={(event) => setForm({ ...form, coverage: event.target.value as Region })}>
              {regionOptions.map((region) => <option key={region} value={region}>{regionLabels[region]}</option>)}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="หมายเหตุการแก้ไข">
              <input className={inputClass} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
            </Field>
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-200 pt-4">
          <Button type="submit" disabled={!canSave}>
            <CheckCircle2 className="h-4 w-4" />
            {mode === "create" ? "บันทึกซัพพลายเออร์" : "บันทึกโปรไฟล์ซัพพลายเออร์"}
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
    note: "เพิ่ม SKU ที่ซัพพลายเออร์รองรับ พร้อมราคา Lead Time และ MOQ",
  });
  const regionOptions: Region[] = ["North", "Northeast", "East", "South", "National"];
  const criticalityOptions: Array<Sku["criticality"]> = ["Critical", "High", "Medium"];
  const canSave = Boolean(form.supplierId.trim() && form.supplierName.trim() && form.skuId.trim() && form.skuName.trim()) && form.unitPrice > 0 && form.leadTimeDays > 0 && form.moq > 0;
  const systemInventory = getSystemInventoryDefaults(form.skuId.trim().toUpperCase(), formulaPolicy);
  const systemReliability = getSystemSupplierReliability(form.supplierId.trim(), supplierOfferData);

  // ฟอร์มนี้ตั้งใจให้ตรงกับตารางรายการ SKU ที่รองรับ:
  // ผู้ใช้กรอกเฉพาะข้อมูลหลักของ SKU และข้อเสนอซัพพลายเออร์ เช่น ราคา Lead Time และ MOQ
  // ส่วนสต็อกปัจจุบัน ประวัติความต้องการ ระดับความมั่นใจ ตัวคูณฤดูกาล/งบประมาณ และความน่าเชื่อถือ
  // เป็นข้อมูลจากระบบหรือหน้าตั้งค่ากลาง จึงดึงมาแสดงด้านล่างแทนการให้กรอกเอง
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
        title={fixedSupplier ? "เพิ่ม SKU ที่รองรับ" : "เพิ่มซัพพลายเออร์ / SKU ที่รองรับ"}
        subtitle="เพิ่ม SKU ที่ซัพพลายเออร์รองรับ พร้อมราคา Lead Time และ MOQ"
      />
      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        {!fixedSupplier ? (
          <div>
            <h3 className="mb-3 font-semibold text-slate-950">โปรไฟล์ซัพพลายเออร์</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="รหัสซัพพลายเออร์">
                <input className={inputClass} value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })} />
              </Field>
              <Field label="ชื่อซัพพลายเออร์">
                <input className={inputClass} value={form.supplierName} onChange={(event) => setForm({ ...form, supplierName: event.target.value })} />
              </Field>
              <Field label="ผู้ติดต่อ">
                <input className={inputClass} value={form.contactPerson} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} />
              </Field>
              <Field label="โทรศัพท์">
                <input className={inputClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </Field>
              <Field label="อีเมล">
                <input className={inputClass} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </Field>
              <Field label="พื้นที่ให้บริการ">
                <select className={inputClass} value={form.coverage} onChange={(event) => setForm({ ...form, coverage: event.target.value as Region })}>
                  {regionOptions.map((region) => <option key={region} value={region}>{regionLabels[region]}</option>)}
                </select>
              </Field>
              <Field label="รหัส Line">
                <input className={inputClass} value={form.lineId} onChange={(event) => setForm({ ...form, lineId: event.target.value })} />
              </Field>
            </div>
          </div>
        ) : (
          <InlineAlert tone="info">SKU ใหม่นี้จะถูกเพิ่มให้ซัพพลายเออร์ปัจจุบัน: {fixedSupplier.name}</InlineAlert>
        )}

        <div>
          <h3 className="mb-3 font-semibold text-slate-950">ข้อมูลหลักของ SKU</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="SKU ID">
              <input className={inputClass} value={form.skuId} onChange={(event) => setForm({ ...form, skuId: event.target.value })} />
            </Field>
            <Field label="ชื่อรายการ">
              <input className={inputClass} value={form.skuName} onChange={(event) => setForm({ ...form, skuName: event.target.value })} />
            </Field>
            <Field label="หมวดหมู่">
              <input className={inputClass} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
            </Field>
            <Field label="หน่วยนับ">
              <input className={inputClass} value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
            </Field>
            <Field label="ระดับความสำคัญ">
              <select className={inputClass} value={form.criticality} onChange={(event) => setForm({ ...form, criticality: event.target.value as Sku["criticality"] })}>
                {criticalityOptions.map((criticality) => <option key={criticality}>{criticality}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-slate-950">ข้อเสนอจากซัพพลายเออร์</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="ราคาต่อหน่วย">
              <input className={inputClass} type="number" min="0" value={form.unitPrice} onChange={(event) => updateNumber("unitPrice", Number(event.target.value))} />
            </Field>
            <Field label="ระยะเวลารอพัสดุ (Lead Time / วัน)">
              <input className={inputClass} type="number" min="1" value={form.leadTimeDays} onChange={(event) => updateNumber("leadTimeDays", Number(event.target.value))} />
            </Field>
            <Field label="จำนวนสั่งซื้อขั้นต่ำ (MOQ)">
              <input className={inputClass} type="number" min="1" value={form.moq} onChange={(event) => updateNumber("moq", Number(event.target.value))} />
            </Field>
          </div>
        </div>

        <Card className="border-blue-100 bg-blue-50 p-4">
          <h3 className="font-semibold text-blue-950">ค่าที่ระบบคำนวณหรือดึงจากค่ากลาง</h3>
          <p className="mt-1 text-sm text-blue-700">ค่าด้านล่างมาจากข้อมูลจำลองของคลังและการตั้งค่ากลาง ไม่ใช่ข้อมูลที่ซัพพลายเออร์กรอก</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ReviewMetric label="สต็อกปัจจุบัน" value={`${formatNumber(systemInventory.currentStock)} ${form.unit}`} />
            <ReviewMetric label="ความต้องการคาดการณ์" value={`${formatNumber(systemInventory.forecastDemandForPlanningPeriod)} ${form.unit}`} />
            <ReviewMetric label="ความน่าเชื่อถือซัพพลายเออร์" value={`${systemReliability}%`} />
            <ReviewMetric label="ระดับความมั่นใจ" value={formatPercent(systemInventory.serviceLevel * 100).replace("+", "")} />
            <ReviewMetric label="Z-score" value={String(systemInventory.zScore)} />
            <ReviewMetric label="ตัวคูณฤดูกาล" value={String(systemInventory.seasonalFactor)} />
            <ReviewMetric label="ตัวคูณงบประมาณ" value={String(systemInventory.budgetFactor)} />
            <ReviewMetric label="จำนวนวันในรอบแผน" value={`${systemInventory.planningPeriodDays} วัน`} />
          </div>
        </Card>

        <Field label="หมายเหตุการแก้ไข">
          <textarea className={textareaClass} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">ข้อมูลที่เพิ่มจะอยู่ในสถานะจำลองของหน้าจอ และจะกลับค่าเริ่มต้นเมื่อรีเฟรชหน้า</p>
          <Button type="submit" disabled={!canSave}>
            <Plus className="h-4 w-4" />
            เพิ่ม SKU ที่รองรับ
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
  const [note, setNote] = useState("ปรับข้อมูลซัพพลายเออร์สำหรับคำนวณ Lead Time และต้นทุน");
  const numericInputClass = `${inputClass} !w-28 text-right tabular-nums`;

  // แถวนี้เป็นตัวแก้ไขเฉพาะข้อเสนอซัพพลายเออร์
  // ผู้ใช้แก้ Lead Time, MOQ, ราคาต่อหน่วย หรือความน่าเชื่อถือ แล้วกดบันทึก
  // เพื่ออัปเดต mock state และสร้างประวัติการแก้ไขกลับไปที่ App
  // ใช้ !w-28 เพื่อทับ w-full จาก inputClass ไม่ให้ช่อง MOQ/ตัวเลขถูกบีบจนอ่านค่าไม่เห็น
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
          <input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} placeholder="หมายเหตุการแก้ไข" />
          <Button variant="secondary" onClick={() => onSave(draft, note)}>บันทึกการแก้ไข</Button>
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
        eyebrow="บันทึกการติดต่อซัพพลายเออร์"
        title="บันทึกการติดต่อซัพพลายเออร์"
        subtitle="เก็บหลักฐานการติดต่อและการติดตามผล เพื่อแสดงในหน้าตรวจอนุมัติและบันทึกตรวจสอบย้อนหลัง"
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> ย้อนกลับ</Button>}
      />
      <Card className="max-w-4xl p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="ชื่อซัพพลายเออร์">
            <select className={inputClass} value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
              {suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="SKU ที่เกี่ยวข้อง">
            <select className={inputClass} value={form.skuId} onChange={(event) => setForm({ ...form, skuId: event.target.value })}>
              {skus.map((sku) => <option key={sku.id} value={sku.id}>{sku.id} · {sku.name}</option>)}
            </select>
          </Field>
          <Field label="รหัสคำขอที่เกี่ยวข้อง">
            <input className={inputClass} value={form.requestId} onChange={(event) => setForm({ ...form, requestId: event.target.value })} />
          </Field>
          <Field label="ช่องทางติดต่อ">
            <select className={inputClass} value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value as ContactChannel })}>
              {(["Phone", "Email", "Line", "Meeting", "Other"] as ContactChannel[]).map((channel) => <option key={channel} value={channel}>{getContactChannelLabel(channel)}</option>)}
            </select>
          </Field>
          <Field label="วัตถุประสงค์การติดต่อ">
            <input className={inputClass} value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} />
          </Field>
          <Field label="วันที่ติดตามผล">
            <input type="date" className={inputClass} value={form.followUpDate} onChange={(event) => setForm({ ...form, followUpDate: event.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <Field label="ผลลัพธ์ / หมายเหตุ">
              <textarea className={textareaClass} value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="เช่น ซัพพลายเออร์ยืนยันราคาเดิม และสามารถส่งมอบภายใน 25 วัน" />
            </Field>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-slate-500">ผู้ติดต่อซัพพลายเออร์: {supplier.contactPerson} · {supplier.phone}</p>
          <Button
            onClick={() =>
              onSave({
                id: `LOG-${String(Date.now()).slice(-4)}`,
                supplierId: form.supplierId,
                skuId: form.skuId,
                requestId: form.requestId,
                channel: form.channel,
                purpose: form.purpose,
                note: form.note || "บันทึกผลการติดต่อสำหรับใช้ในหน้าตรวจอนุมัติ",
                followUpDate: form.followUpDate,
                createdAt: "2026-05-05 14:05",
              })
            }
          >
            <CheckCircle2 className="h-4 w-4" /> บันทึกการติดต่อ
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
  const [reasonText, setReasonText] = useState(skuId === "C01" ? "รวมแผนซ่อมบำรุงเพิ่มเติมของคลัง I010 ในรอบเดียวกัน" : "");
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
  const submitLabel = recommendedLayer === "Local" ? "ส่งอนุมัติระดับคลัง" : recommendedLayer === "Regional" ? "ส่งอนุมัติระดับเขต" : "ส่งอนุมัติส่วนกลาง";

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
      supplierContactLogSummary: "โทรศัพท์ยืนยันราคาและ Lead Time กับซัพพลายเออร์แล้ว",
      localReason: "Stock ปัจจุบันต่ำกว่าจุดสั่งซื้อใหม่ และงบคลังพื้นที่ไม่เพียงพอสำหรับปริมาณที่ขอ",
      regionalEscalationReason: recommendedLayer === "Central" ? "งบระดับเขตไม่เพียงพอ ต้องส่งต่อส่วนกลาง" : undefined,
      createdAt: "2026-05-05 14:00",
      timeline: [
        { role: "Local Warehouse", action: "Draft Created", actor: warehouse.name, date: "2026-05-05 13:55" },
        { role: "Local Warehouse", action: "Submitted", actor: warehouse.name, date: "2026-05-05 14:00", note: `ระบบแนะนำให้อนุมัติที่${getApprovalLayerLabel(recommendedLayer)}` },
      ],
    };
  };

  return (
    <>
      <PageTitle
        eyebrow="สร้างคำขอซื้อ"
        title={`สร้างคำขอซื้อ ${sku.id} ${sku.name}`}
        subtitle="ฟอร์มสร้างคำขอซื้อจากจำนวนที่ระบบแนะนำและข้อมูลซัพพลายเออร์ โดยตรวจสอบงบประมาณ 3 ชั้น"
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> ย้อนกลับ</Button>}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="SKU">
              <input className={inputClass} value={`${sku.id} · ${sku.name}`} readOnly />
            </Field>
            <Field label="ซัพพลายเออร์ที่เลือก">
              <select className={inputClass} value={chosenSupplierId} onChange={(event) => setChosenSupplierId(event.target.value)}>
                {supplierOfferData.filter((item) => item.skuId === skuId).map((item) => {
                  const itemSupplier = getSupplier(item.supplierId);
                  return <option key={item.supplierId} value={item.supplierId}>{itemSupplier.name}</option>;
                })}
              </select>
            </Field>
            <Field label="จำนวนที่ระบบแนะนำ">
              <div className="flex gap-2">
                <input className={inputClass} value={`${formatNumber(recommendation.suggestedQuantity)} ${sku.unit}`} readOnly />
                <Button type="button" variant="secondary" onClick={() => setShowExplanation((current) => !current)}>ทำไม?</Button>
              </div>
            </Field>
            <Field label="ราคาต่อหน่วยจากซัพพลายเออร์">
              <input className={inputClass} value={`${formatTHB(offer.unitPrice)}/${offer.unit}`} readOnly />
            </Field>
            <Field label="ระยะเวลารอพัสดุของ Supplier (Lead Time)">
              <input className={inputClass} value={`${offer.leadTimeDays} วัน`} readOnly />
            </Field>
            <Field label="ระยะเวลารอพัสดุที่ปรับแล้ว (Adjusted Lead Time)">
              <input className={inputClass} value={`${formatNumber(recommendation.adjustedLeadTimeDays)} วัน`} readOnly />
            </Field>
            <Field label="จำนวนสั่งซื้อขั้นต่ำ (MOQ)">
              <input className={inputClass} value={`${offer.moq} ${offer.unit}`} readOnly />
            </Field>
            <Field label="จำนวนที่ต้องการขอ" hint={`หน่วย: ${sku.unit}`}>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={requestedQuantity}
                onChange={(event) => setRequestedQuantity(Number(event.target.value))}
              />
            </Field>
            <Field label="ส่วนต่างจากค่าที่ระบบแนะนำ">
              <input className={inputClass} value={`${variance.variance > 0 ? "+" : ""}${formatNumber(variance.variance)} ${sku.unit} (${formatPercent(variance.variancePercent)})`} readOnly />
            </Field>
            <Field label="มูลค่าประมาณการ">
              <input className={inputClass} value={formatTHB(estimatedCost)} readOnly />
            </Field>
            <Field label="ระดับอนุมัติที่แนะนำ">
              <input className={inputClass} value={getApprovalLayerLabel(recommendedLayer)} readOnly />
            </Field>
          </div>

          <div className="mt-5 space-y-3">
            {overrideWarning ? <InlineAlert tone={variance.isUnderRequest ? "danger" : "warning"}>{overrideWarning}</InlineAlert> : <InlineAlert tone="success">จำนวนที่ขอตรงกับจำนวนที่ระบบแนะนำ</InlineAlert>}
            {!moqAligned ? <InlineAlert>จำนวนที่ขอยังไม่ตรงกับ MOQ {offer.moq} {offer.unit} ระบบยังให้ส่งได้ใน PoC แต่ควรตรวจสอบกับซัพพลายเออร์</InlineAlert> : null}
            <InlineAlert tone="info">{preview.approvalRouting.reason}</InlineAlert>

            {quantityDiffers ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="หมวดเหตุผลการขอแตกต่างจากค่าที่ระบบแนะนำ">
                  <select className={inputClass} value={reasonCategory} onChange={(event) => setReasonCategory(event.target.value)}>
                    <option value="">เลือกเหตุผล</option>
                    {reasonOptions.map((reason) => <option key={reason}>{reason}</option>)}
                  </select>
                </Field>
                <Field label="รายละเอียดเหตุผลการขอแตกต่างจากค่าที่ระบบแนะนำ" hint={highVariance ? "จำเป็นเมื่อส่วนต่างตั้งแต่ ±50%" : "ระบุรายละเอียดเพิ่มเติมเพื่อช่วยผู้อนุมัติ"}>
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
            <Button variant="secondary" onClick={() => onContactSupplier(supplier.id)}><Phone className="h-4 w-4" /> ติดต่อซัพพลายเออร์</Button>
            <Button variant="secondary" onClick={() => onSubmit(buildRequest("Draft"))}>บันทึกแบบร่าง</Button>
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
          <BudgetCheckCard label={`ระดับคลัง · ${warehouse.name}`} remaining={budget.localBudgetRemaining} required={estimatedCost} />
          <BudgetCheckCard label={`ระดับเขต · ${regionLabels[warehouse.region]}`} remaining={budget.regionalBudgetRemaining} required={estimatedCost} />
          <BudgetCheckCard label="ส่วนกลางทั่วประเทศ" remaining={budget.centralBudgetRemaining} required={estimatedCost} />
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
        eyebrow="ศูนย์อนุมัติ"
        title="ศูนย์อนุมัติคำขอซื้อ"
        subtitle="คิวตรวจระดับเขตและคิวอนุมัติส่วนกลาง พร้อมข้อมูล AI งบประมาณ และประวัติการติดต่อซัพพลายเออร์"
      />
      <div className="mb-4 flex w-full overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 sm:inline-flex sm:w-auto">
        <button className={`rounded-md px-4 py-2 text-sm font-semibold ${approvalTab === "regional" ? "bg-blue-700 text-white" : "text-slate-600"}`} onClick={() => onSetTab("regional")}>คิวอนุมัติระดับเขต</button>
        <button className={`rounded-md px-4 py-2 text-sm font-semibold ${approvalTab === "central" ? "bg-blue-700 text-white" : "text-slate-600"}`} onClick={() => onSetTab("central")}>คิวอนุมัติส่วนกลาง</button>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <SectionHeader title={approvalTab === "regional" ? "คิวระดับเขต" : "คิวส่วนกลาง"} subtitle={`มีคำขอรอตรวจ ${queue.length} รายการ`} />
          <DataTable columns={["คำขอ", "รายการ", "มูลค่า", "สถานะ"]} empty={queue.length === 0}>
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
      <SectionHeader title={`รายละเอียดตรวจระดับเขต · ${request.id}`} subtitle={`${sku.id} ${sku.name} · ${warehouse.name}`} action={<StatusBadge status={request.status} />} />
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
        <ReviewMetric label="จำนวนที่ระบบแนะนำ" value={`${request.aiSuggestedQuantity} ${request.unit}`} />
        <ReviewMetric label="จำนวนที่ขอ" value={`${request.requestedQuantity} ${request.unit}`} />
        <ReviewMetric label="ส่วนต่างจากค่าที่ระบบแนะนำ" value={`${request.variancePercent > 0 ? "+" : ""}${formatNumber(request.variancePercent)}%`} />
        <ReviewMetric label="ซัพพลายเออร์" value={supplier.name} />
        <ReviewMetric label="มูลค่าประมาณการ" value={formatTHB(request.estimatedCost)} />
        <ReviewMetric label="ระยะเวลารอพัสดุ (Lead Time)" value={`${request.leadTimeDays} วัน`} />
        <ReviewMetric label="ระดับพัสดุสำรองปลอดภัย (Safety Stock)" value={`${formatNumber(request.calculationSnapshot.safetyStock)} ${request.unit}`} />
        <ReviewMetric label="จุดสั่งซื้อใหม่ (Reorder Point)" value={`${formatNumber(request.calculationSnapshot.reorderPoint)} ${request.unit}`} />
        <ReviewMetric label="ราคาต่อหน่วย ณ วันที่ขอ" value={`${formatTHB(request.calculationSnapshot.unitPriceAtRequestDate)}/${request.unit}`} />
      </div>
      <div className="grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-3">
        <BudgetCheckCard label="งบคลังพื้นที่" remaining={request.localBudgetRemaining} required={request.estimatedCost} />
        <BudgetCheckCard label="งบระดับเขต" remaining={request.regionalBudgetRemaining} required={request.estimatedCost} />
        <BudgetCheckCard label="งบส่วนกลาง" remaining={request.centralBudgetRemaining} required={request.estimatedCost} />
      </div>
      <div className="grid grid-cols-1 gap-4 border-t border-slate-200 p-5 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">เหตุผลการขอแตกต่างจากค่าที่ระบบแนะนำ</h3>
          <p className="mt-2 text-sm font-medium text-slate-700">{request.overrideReasonCategory ?? "ไม่พบการขอแตกต่างจากค่าที่ระบบแนะนำ"}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{request.overrideReasonText ?? "จำนวนที่ขอตรงกับจำนวนที่ระบบแนะนำ"}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">สรุปการติดต่อซัพพลายเออร์</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{request.supplierContactLogSummary}</p>
          <p className="mt-2 text-xs text-slate-400">จำนวนบันทึกที่เกี่ยวข้อง: {logs.length}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">เหตุผลการกำหนดเส้นทางอนุมัติ</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{request.calculationSnapshot.approvalRoutingAtRequestDate.reason}</p>
        </Card>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4">
        <Button variant="secondary" onClick={() => onCalculation(request)}><Calculator className="h-4 w-4" /> ดูภาพบันทึกการคำนวณ</Button>
        <Button variant="secondary" onClick={() => onContactSupplier(supplier.id)}><Phone className="h-4 w-4" /> ติดต่อซัพพลายเออร์</Button>
        <Button variant="secondary" onClick={() => onAction(request.id, "More Info", "Request More Info", "ขอข้อมูลเพิ่มเติมจากคลัง")}>ขอข้อมูลเพิ่มเติม</Button>
        <Button variant="danger" onClick={() => onAction(request.id, "Rejected", "Rejected", "ไม่อนุมัติคำขอ")}>ไม่อนุมัติ</Button>
        {mustPassCentral ? (
          <Button onClick={() => onAction(request.id, "Pending Central", "Approve & Pass to Central", "งบระดับเขตไม่เพียงพอ ส่งต่อส่วนกลาง")}>อนุมัติและส่งต่อส่วนกลาง</Button>
        ) : (
          <Button variant="success" onClick={() => onAction(request.id, "Approved", "Approved", "อนุมัติตามปริมาณที่ขอ")}>อนุมัติ</Button>
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
      <SectionHeader title={`รายละเอียดตรวจส่วนกลาง · ${request.id}`} subtitle={`${sku.id} ${sku.name} · คำขอที่ส่งต่อจากเขต`} action={<StatusBadge status={request.status} />} />
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <ReviewMetric label="มูลค่า" value={formatTHB(request.estimatedCost)} />
        <ReviewMetric label="ส่วนต่างงบประมาณ" value={formatTHB(budgetGap)} />
        <ReviewMetric label="ซัพพลายเออร์" value={supplier.name} />
        <ReviewMetric label="ราคาต่อหน่วย ณ วันที่ขอ" value={`${formatTHB(request.unitPrice)}/${request.unit}`} />
        <ReviewMetric label="ระดับพัสดุสำรองปลอดภัย (Safety Stock)" value={`${formatNumber(request.calculationSnapshot.safetyStock)} ${request.unit}`} />
        <ReviewMetric label="จุดสั่งซื้อใหม่ (Reorder Point)" value={`${formatNumber(request.calculationSnapshot.reorderPoint)} ${request.unit}`} />
        <ReviewMetric label="ส่วนต่างจากค่าที่ระบบแนะนำ" value={formatPercent(request.calculationSnapshot.quantityVariancePercent)} />
        <ReviewMetric label="เส้นทางอนุมัติ" value={getApprovalLayerLabel(request.calculationSnapshot.approvalRoutingAtRequestDate.layer)} />
      </div>
      <div className="grid grid-cols-1 gap-4 px-5 pb-5 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">เหตุผลจากคลังพื้นที่</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{request.localReason}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">เหตุผลที่เขตส่งต่อส่วนกลาง</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{request.regionalEscalationReason}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">ข้อมูลซัพพลายเออร์</h3>
          <p className="mt-2 text-sm text-slate-600">{supplier.contactPerson} · {supplier.phone} · {supplier.email}</p>
          <p className="mt-2 text-sm text-slate-600">ระยะเวลารอพัสดุ (Lead Time) {request.leadTimeDays} วัน · จำนวนสั่งซื้อขั้นต่ำ (MOQ) {request.moq} {request.unit}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">ประวัติการติดต่อซัพพลายเออร์</h3>
          <p className="mt-2 text-sm text-slate-600">{request.supplierContactLogSummary}</p>
          <p className="mt-2 text-xs text-slate-400">จำนวนบันทึกที่เกี่ยวข้อง: {logs.length}</p>
        </Card>
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4">
        <Button variant="secondary" onClick={() => onCalculation(request)}><Calculator className="h-4 w-4" /> รายละเอียดการคำนวณ</Button>
        <Button variant="secondary" onClick={() => onContactSupplier(supplier.id)}><Phone className="h-4 w-4" /> ติดต่อซัพพลายเออร์</Button>
        <Button variant="secondary" onClick={() => onAction(request.id, "More Info", "Request More Info", "ส่วนกลางขอข้อมูลเพิ่มเติม")}>ขอข้อมูลเพิ่มเติม</Button>
        <Button variant="danger" onClick={() => onAction(request.id, "Rejected", "Central Reject", "ส่วนกลางไม่อนุมัติ")}>ส่วนกลางไม่อนุมัติ</Button>
        <Button variant="success" onClick={() => onAction(request.id, "Approved", "Central Approve", "อนุมัติโดยส่วนกลาง")}>ส่วนกลางอนุมัติ</Button>
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
      <PageTitle eyebrow="ประวัติ" title="ประวัติคำขอซื้อและบันทึกตรวจสอบย้อนหลัง" subtitle="แสดงคำขอซื้อย้อนหลังและภาพบันทึกการคำนวณที่ถูกเก็บ ณ วันที่ส่งคำขอ" />
      <Card className="mb-5 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหารหัสคำขอ / รายการ / ซัพพลายเออร์ / สถานะ" />
          </div>
          <select className={inputClass} defaultValue="ทุกสถานะ"><option>ทุกสถานะ</option><option>อนุมัติแล้ว</option><option>รออนุมัติ</option><option>ไม่อนุมัติ</option></select>
          <select className={inputClass} defaultValue="สูตร v1.0"><option>สูตร v1.0</option></select>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <Card>
          <SectionHeader title="ตารางประวัติคำขอ" subtitle="เลือกคำขอเพื่อดูบันทึกตรวจสอบย้อนหลัง" />
          <DataTable columns={["รหัสคำขอ", "รายการ", "ซัพพลายเออร์", "ระบบแนะนำ", "จำนวนที่ขอ", "จำนวนที่อนุมัติ", "สถานะ"]} empty={filtered.length === 0}>
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
      <SectionHeader title={`รายละเอียดการตรวจสอบย้อนหลัง · ${request.id}`} subtitle={`${sku.id} ${sku.name}`} action={<StatusBadge status={request.status} />} />
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReviewMetric label="จำนวนที่ระบบแนะนำ" value={`${request.aiSuggestedQuantity} ${request.unit}`} />
          <ReviewMetric label="จำนวนที่ขอ" value={`${request.requestedQuantity} ${request.unit}`} />
          <ReviewMetric label="จำนวนที่อนุมัติ" value={`${request.approvedQuantity ?? "-"} ${request.approvedQuantity ? request.unit : ""}`} />
          <ReviewMetric label="ส่วนต่างจากค่าที่ระบบแนะนำ" value={`${request.variancePercent > 0 ? "+" : ""}${formatNumber(request.variancePercent)}%`} />
          <ReviewMetric label="เวอร์ชันสูตร" value={request.formulaVersion} />
          <ReviewMetric label="ระยะเวลารอพัสดุของ Supplier (Lead Time)" value={`${request.leadTimeDays} วัน`} />
          <ReviewMetric label="ราคาต่อหน่วย ณ วันที่ขอ" value={`${formatTHB(request.unitPrice)}/${request.unit}`} />
          <ReviewMetric label="ซัพพลายเออร์" value={supplier.name} />
        </div>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">เหตุผลการขอแตกต่างจากค่าที่ระบบแนะนำ</h3>
          <p className="mt-2 text-sm text-slate-600">{request.overrideReasonCategory ?? "ไม่มีการขอแตกต่างจากค่าที่ระบบแนะนำ"}</p>
          <p className="mt-1 text-sm text-slate-500">{request.overrideReasonText ?? "-"}</p>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">ภาพบันทึกการคำนวณ</h3>
          <p className="mt-2 text-sm text-slate-600">ระดับพัสดุสำรองปลอดภัย (Safety Stock): {request.calculationSnapshot.safetyStock}</p>
          <p className="mt-1 text-sm text-slate-600">จุดสั่งซื้อใหม่ (Reorder Point): {request.calculationSnapshot.reorderPoint}</p>
          <p className="mt-1 text-sm text-slate-600">จำนวนที่ระบบแนะนำ: {request.calculationSnapshot.suggestedQuantity}</p>
          <p className="mt-2 text-xs text-slate-400">ภาพบันทึกนี้ถูกเก็บ ณ วันที่ส่งคำขอ และไม่คำนวณย้อนหลังใหม่</p>
        </Card>
        <CalculationSnapshotView snapshot={request.calculationSnapshot} unit={request.unit} />
        <Card className="p-4">
          <h3 className="mb-3 font-semibold text-slate-950">ไทม์ไลน์การอนุมัติ</h3>
          <ApprovalTimeline items={request.timeline} />
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold text-slate-950">ประวัติการติดต่อซัพพลายเออร์</h3>
          <div className="mt-3 space-y-2">
            {logs.map((log) => (
              <p key={log.id} className="rounded-md bg-slate-50 p-2 text-sm text-slate-600">{log.createdAt} · {getContactChannelLabel(log.channel)} · {log.note}</p>
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
      <PageTitle eyebrow="VMI" title="วิเคราะห์ SKU ที่เหมาะกับ VMI" subtitle="AI วิเคราะห์ SKU ที่เหมาะสมสำหรับการให้ซัพพลายเออร์ช่วยบริหารสินค้าคงคลัง" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <SectionHeader title="ตารางผู้สมัคร VMI" subtitle="จัดลำดับจากเสถียรภาพความต้องการ ความน่าเชื่อถือซัพพลายเออร์ และคะแนนรวม" />
          <DataTable columns={["SKU", "รายการ", "เสถียรภาพความต้องการใช้", "ความน่าเชื่อถือซัพพลายเออร์", "คะแนน", "ดำเนินการ"]}>
            {vmiCandidates.map((candidate) => {
              const sku = getSku(candidate.skuId);
              return (
                <tr key={candidate.skuId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{sku.id}</td>
                  <td className="px-4 py-3">{sku.name}</td>
                  <td className="px-4 py-3">{getDemandStabilityLabel(candidate.demandStability)}</td>
                  <td className="px-4 py-3">{candidate.supplierReliability}%</td>
                  <td className="px-4 py-3 font-semibold text-blue-700">{candidate.score}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => openSku(candidate.skuId)}>รายละเอียด SKU</Button>
                      <Button onClick={onSimulation}>จำลอง</Button>
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
            <h3 className="font-semibold text-slate-950">สรุปจากระบบ AI</h3>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            ระบบแนะนำ C01 สายไฟแรงต่ำเป็นรายการเหมาะกับ VMI อันดับหนึ่ง เพราะความต้องการใช้มีเสถียรภาพสูง ซัพพลายเออร์มีความน่าเชื่อถือ 96% และได้คะแนน 88
          </p>
          <StatusBadge status="VMI Candidate" />
          <Button className="mt-5 w-full" onClick={onSimulation}><Workflow className="h-4 w-4" /> เปิดการจำลอง VMI</Button>
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
    buildVmiRow("ระดับพัสดุสำรองปลอดภัย (Safety Stock)", currentSafetyStock, vmiSafetyStock, "m"),
    buildVmiRow("จุดสั่งซื้อใหม่ (Reorder Point)", currentReorderPoint, vmiReorderPoint, "m"),
    buildVmiRow("ระยะเวลารอพัสดุ (Lead Time)", currentLeadTime, vmiLeadTime, "วัน"),
    buildVmiRow("มูลค่าสินค้าคงคลัง", currentInventoryValue, vmiInventoryValue, "THB"),
    buildVmiRow("คำสั่งซื้อที่ทำด้วยมือต่อเดือน", currentManualOrders, vmiManualOrders, ""),
  ];

  return (
    <>
      <PageTitle
        eyebrow="จำลอง VMI"
        title="เปรียบเทียบโมเดลคลังปัจจุบันกับ VMI"
        subtitle="จำลองผลกระทบด้านระดับพัสดุสำรองปลอดภัย จุดสั่งซื้อใหม่ ระยะเวลารอพัสดุ มูลค่าสินค้าคงคลัง และจำนวนคำสั่งซื้อที่ทำด้วยมือ"
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> ย้อนกลับ</Button>}
      />
      <div className="mb-5">
        <InlineAlert tone="info">
          VMI ใน PoC นี้เป็นการจำลองผลลัพธ์ ไม่ใช่การให้ Supplier เติมของจริง ใช้เพื่อเปรียบเทียบผลกระทบก่อนตัดสินใจทดลองในระดับเขต
        </InlineAlert>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <SectionHeader title="ตารางเปรียบเทียบ" subtitle="C01 สายไฟแรงต่ำ · I010" />
          <DataTable columns={["ตัวชี้วัด", "ปัจจุบัน", "VMI", "ผลกระทบ"]}>
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
          <h3 className="font-semibold text-slate-950">คำแนะนำจากระบบ AI</h3>
          <p className="mt-4 rounded-lg bg-violet-50 p-4 text-sm font-medium leading-6 text-violet-800">
            ควรทดลอง VMI กับ SKU นี้ในระดับเขต
          </p>
          <p className="mt-3 text-sm text-slate-600">{getVmiRecommendation(vmiCandidates[0].score)} · คะแนน {vmiCandidates[0].score}</p>
          <div className="mt-5 grid gap-2">
            <Button onClick={onCreateProposal}><Plus className="h-4 w-4" /> สร้างข้อเสนอ VMI</Button>
            <Button variant="secondary"><FileText className="h-4 w-4" /> เปรียบเทียบกับการจัดซื้อปกติ</Button>
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
  const [versionNote, setVersionNote] = useState("ปรับค่านโยบายสำหรับการวางแผนพัสดุคงคลัง");
  const settingsLogs = changeLogs.filter((log) => log.area === "Settings").slice(0, 10);

  // หน้าตั้งค่าแก้ค่านโยบายสูตรได้ใน local state ก่อน
  // เมื่อกดบันทึกเป็นเวอร์ชันใหม่ จึงบันทึกเป็นเวอร์ชันสูตรใหม่และสร้างประวัติการตรวจสอบ
  const updateDraftNumber = (field: keyof Omit<FormulaPolicyState, "formulaVersion">, value: number) => {
    setDraftPolicy((current) => ({ ...current, [field]: value }));
  };
  const updateDraftServiceLevel = (value: number) => {
    // ให้ผู้ใช้ปรับระดับความมั่นใจอย่างเดียว แล้วคำนวณ Z-score จากความสัมพันธ์ทางสถิติ
    // ลดความสับสนและป้องกันระดับความมั่นใจกับ Z-score ไม่ตรงกัน
    setDraftPolicy((current) => ({
      ...current,
      serviceLevel: value,
      zScore: calculateZScoreFromServiceLevel(value),
    }));
  };

  return (
    <>
      <PageTitle eyebrow="ตั้งค่า" title="สูตรคำนวณและนโยบาย" subtitle="ตั้งค่าเวอร์ชันสูตร นโยบายอนุมัติ และนโยบายการขอแตกต่างจากค่าที่ระบบแนะนำสำหรับต้นแบบ" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <SectionHeader title={`เวอร์ชันสูตร ${draftPolicy.formulaVersion}`} subtitle="แก้ไขค่านโยบายแล้วบันทึกเป็นเวอร์ชันใหม่เพื่อใช้ตรวจสอบย้อนหลัง" />
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            <Field label="เวอร์ชันสูตร">
              <input className={inputClass} value={draftPolicy.formulaVersion} onChange={(event) => setDraftPolicy({ ...draftPolicy, formulaVersion: event.target.value })} />
            </Field>
            <Field label="ระดับความมั่นใจ" hint="เช่น 0.95 = 95%">
              <input className={inputClass} type="number" step="0.005" min="0.8" max="0.995" value={draftPolicy.serviceLevel} onChange={(event) => updateDraftServiceLevel(Number(event.target.value))} />
            </Field>
            <Field label="Z-score ที่ระบบคำนวณ" hint="คำนวณอัตโนมัติจากระดับความมั่นใจ">
              <input className={inputClass} type="number" value={draftPolicy.zScore} readOnly />
            </Field>
            <Field label="ค่าตั้งต้นตัวคูณฤดูกาล">
              <input className={inputClass} type="number" step="0.01" value={draftPolicy.seasonalFactor} onChange={(event) => updateDraftNumber("seasonalFactor", Number(event.target.value))} />
            </Field>
            <Field label="ค่าตั้งต้นตัวคูณงบประมาณ">
              <input className={inputClass} type="number" step="0.01" value={draftPolicy.budgetFactor} onChange={(event) => updateDraftNumber("budgetFactor", Number(event.target.value))} />
            </Field>
            <Field label="เกณฑ์ส่วนต่างสูง (%)">
              <input className={inputClass} type="number" step="1" value={draftPolicy.highVarianceThreshold} onChange={(event) => updateDraftNumber("highVarianceThreshold", Number(event.target.value))} />
            </Field>
            <div className="md:col-span-2">
              <Field label="หมายเหตุเวอร์ชัน">
                <textarea className={textareaClass} value={versionNote} onChange={(event) => setVersionNote(event.target.value)} />
              </Field>
            </div>
          </div>
          <div className="flex justify-end border-t border-slate-200 px-5 py-4">
            <Button onClick={() => onSaveFormulaPolicy(draftPolicy, versionNote)}>บันทึกเป็นเวอร์ชันสูตรใหม่</Button>
          </div>
          <div className="border-t border-slate-200 p-5">
            <h3 className="font-semibold text-slate-950">สูตรการคำนวณ</h3>
            <div className="mt-3 grid gap-2">
              {formulaList.map((formula, index) => (
                <p key={formula} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">{index + 1}. {formula}</p>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-200 p-5">
            <h3 className="font-semibold text-slate-950">ประวัติเวอร์ชันสูตร</h3>
            <DataTable columns={["วันที่", "เวอร์ชัน", "ระดับความมั่นใจ", "Z", "ฤดูกาล", "งบประมาณ", "หมายเหตุ"]} empty={formulaVersions.length === 0}>
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
            <h3 className="font-semibold text-slate-950">กฎนโยบายอนุมัติ</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>มูลค่าประมาณการ ≤ งบคงเหลือคลังพื้นที่ → อนุมัติระดับคลัง</p>
              <p>มูลค่าประมาณการ &gt; งบคลังพื้นที่ และ ≤ งบเขต → อนุมัติระดับเขต</p>
              <p>มูลค่าประมาณการ &gt; งบเขต → เขตอนุมัติส่งต่อส่วนกลาง</p>
              <p>ส่วนกลางสามารถอนุมัติ ไม่อนุมัติ หรือขอข้อมูลเพิ่มเติมได้</p>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-950">นโยบายการขอแตกต่างจากค่าที่ระบบแนะนำ</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>ต้องระบุเหตุผลเมื่อจำนวนที่ขอต่างจากจำนวนที่ระบบแนะนำ</p>
              <p>เกณฑ์ส่วนต่างสูง = {draftPolicy.highVarianceThreshold}%</p>
              <p>แสดงคำเตือนเมื่อขอมากกว่าหรือน้อยกว่าคำแนะนำของระบบ</p>
            </div>
          </Card>
          <Card>
            <SectionHeader title="ประวัติการแก้ไขการตั้งค่า" subtitle="ประวัติการแก้ไขนโยบายสูตรคำนวณ" />
            <DataTable columns={["วันที่", "ฟิลด์", "ค่าเดิม", "ค่าใหม่", "หมายเหตุ"]} empty={settingsLogs.length === 0}>
              {settingsLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">{log.createdAt}</td>
                  <td className="px-4 py-3">{getChangeLogFieldLabel(log.field)}</td>
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

function formatPeaRegionCode(regionCode?: string) {
  if (!regionCode) return "ไม่พบเขต";
  return `เขต ${regionCode}`;
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
  const label = status === "Active" ? "ใช้งานอยู่" : "ยังไม่มี SKU";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}>{label}</span>;
}

function getContactChannelLabel(channel: ContactChannel) {
  const labels: Record<ContactChannel, string> = {
    Phone: "โทรศัพท์",
    Email: "อีเมล",
    Line: "Line",
    Meeting: "ประชุม",
    Other: "อื่น ๆ",
  };

  return labels[channel];
}

function getDemandStabilityLabel(stability: "High" | "Medium" | "Low") {
  const labels = {
    High: "สูง",
    Medium: "ปานกลาง",
    Low: "ต่ำ",
  };

  return labels[stability];
}

function getChangeLogFieldLabel(field: string) {
  const labels: Record<string, string> = {
    unitPrice: "ราคาต่อหน่วย",
    leadTimeDays: "ระยะเวลารอพัสดุ",
    moq: "จำนวนสั่งซื้อขั้นต่ำ",
    reliabilityScore: "ความน่าเชื่อถือ",
    name: "ชื่อซัพพลายเออร์",
    contactPerson: "ผู้ติดต่อ",
    phone: "โทรศัพท์",
    email: "อีเมล",
    lineId: "รหัส Line",
    coverage: "พื้นที่ให้บริการ",
    formulaVersion: "เวอร์ชันสูตร",
    serviceLevel: "ระดับความมั่นใจ",
    zScore: "ค่า Z-score",
    seasonalFactor: "ตัวคูณฤดูกาล",
    budgetFactor: "ตัวคูณงบประมาณ",
    highVarianceThreshold: "เกณฑ์ส่วนต่างสูง",
    savedConfirmation: "บันทึกยืนยัน",
    "รายการ SKU ที่รองรับ": "รายการ SKU ที่รองรับ",
    "ข้อมูลตั้งต้นการคำนวณ": "ข้อมูลตั้งต้นการคำนวณ",
    "โปรไฟล์ซัพพลายเออร์": "โปรไฟล์ซัพพลายเออร์",
  };

  return labels[field] ?? field;
}

function getApprovalLayerLabel(layer: string) {
  const labels: Record<string, string> = {
    Local: "ระดับคลังพื้นที่",
    Regional: "ระดับเขต",
    Central: "ระดับส่วนกลาง",
  };

  return labels[layer] ?? layer;
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
      field: "โปรไฟล์ซัพพลายเออร์",
      oldValue: "ไม่มีการเปลี่ยนค่า",
      newValue: "ยืนยันโปรไฟล์ซัพพลายเออร์ปัจจุบัน",
      note: note || "ผู้ใช้กดยืนยันข้อมูลติดต่อซัพพลายเออร์โดยไม่มีการเปลี่ยนค่า",
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





