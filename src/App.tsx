import { useState, useRef, type ReactNode } from "react";
import { useEffect, type InputHTMLAttributes } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowRightLeft,
  Archive,
  BarChart3,
  Boxes,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  Landmark,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  Minus,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Plus,
  Recycle,
  Scale,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
  LogOut,
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
  resolvePeaSkuId,
} from "./data/peaDataModel";
import type { PeaDataCoverage, PeaLeadTimeSkuSummary, PeaRiskCoverageRecord } from "./data/peaDataModel";
import { fiscalYears } from "./data/procurementHistory";
import { getCatalogSku } from "./data/peaCatalog";
import {
  analyzeBudgetRequests,
  findDeadStockForSkuElsewhere,
  getBudgetHistoryForWarehouseSku,
  getDeadStockForSku,
  getDeadStockListings,
  getGotchaCaseCount,
  getSkuHoldingsByWarehouse,
  getTotalDeadStockValue,
  getWarehouseProcurementSummaries,
  gotchaFlagLabel,
  procurementThresholds,
  type BudgetRequestWithFlags,
  type GotchaFlag,
} from "./utils/procurementAnalysis";
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
import { isGooglePoFeedbackEnabled, sendGoogleFeedbackComment, sendGooglePoFeedback, type GooglePoFeedbackAction } from "./utils/googlePoFeedback";
import { getGoogleClientId, isAdminEmail, isGoogleAuthEnabled, loadGoogleIdentityScript, parseGoogleCredential, type GoogleProfile } from "./utils/googleAuth";
import { loadPersistentJson, savePersistentJson, ensureSeedVersion } from "./utils/persistentJsonStore";
import type {
  ApprovalTimelineItem,
  BudgetContext,
  ContactChannel,
  InventoryCalculationResult,
  InventoryRecord,
  PurchaseRequest,
  PurchaseRequestCalculationSnapshot,
  Region,
  Sku,
  StockStatus,
  Supplier,
  SupplierOffer,
  SupplierSkuRecord,
  SupplierContactLog,
} from "./types";

type View =
  | "dashboard"
  | "inventory"
  | "usage"
  | "transfer"
  | "stock-intelligence"
  | "procurement-audit"
  | "feedback"
  | "auth"
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
  | "receiving-delay"
  | "budget-settings"
  | "settings";

// ป้ายชื่อหน้าใช้ tag ความเห็น PO ว่าเขียนจากหน้าไหน (hybrid feedback)
const viewLabels: Record<View, string> = {
  dashboard: "แดชบอร์ด",
  inventory: "คลังพัสดุ",
  usage: "การใช้ SKU",
  transfer: "โอน/ยืมพัสดุ",
  "stock-intelligence": "วิเคราะห์สต็อก",
  "procurement-audit": "ตรวจซื้อซ้ำ-ของจม",
  feedback: "ศูนย์ความเห็น (Feedback)",
  auth: "บัญชีผู้ใช้",
  "sku-detail": "รายละเอียด SKU",
  calculation: "รายละเอียดการคำนวณ",
  supplier: "ซัพพลายเออร์",
  "supplier-detail": "รายละเอียดซัพพลายเออร์",
  "contact-log": "ประวัติติดต่อซัพพลายเออร์",
  request: "คำขอซื้อ",
  approval: "อนุมัติ",
  history: "ประวัติ",
  vmi: "VMI",
  "vmi-simulation": "จำลอง VMI",
  "receiving-delay": "รับของ/Delay",
  "budget-settings": "งบประมาณ",
  settings: "ตั้งค่า",
};

type ApprovalTab = "regional" | "central";

type FormulaPolicyState = {
  formulaVersion: string;
  serviceLevel: number;
  zScore: number;
  seasonalFactor: number;
  budgetFactor: number;
  highVarianceThreshold: number;
};

type BudgetRegion = Exclude<Region, "National">;

type BudgetSettingsState = {
  localBudgets: Record<string, number>;
  regionalBudgets: Record<BudgetRegion, number>;
  centralBudgetRemaining: number;
  updatedAt: string;
};

type BudgetInputDraftState = {
  localBudgets: Record<string, string>;
  regionalBudgets: Record<BudgetRegion, string>;
  centralBudgetRemaining: string;
  updatedAt: string;
};

type ChangeLogEntry = {
  id: string;
  area: "Settings" | "Supplier" | "Budget";
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

type AiSuggestionFeedback = {
  id: string;
  requestId: string;
  skuId: string;
  warehouseId: string;
  formulaVersion: string;
  aiSuggestedQuantity: number;
  actualQuantity: number;
  errorQuantity: number;
  errorPercent: number;
  note: string;
  createdAt: string;
};

type AiFeedbackStats = {
  count: number;
  meanAbsoluteErrorPercent: number;
  averageBiasPercent: number;
  latest?: AiSuggestionFeedback;
};

type TransferType = "Transfer" | "Borrow" | "Swap";

type TransferStatus = "Requested" | "Approved" | "Completed" | "Rejected";

type TransferTimelineItem = {
  role: string;
  action: string;
  actor: string;
  date: string;
  note?: string;
};

type TransferRequest = {
  id: string;
  type: TransferType;
  skuId: string;
  skuName: string;
  unit: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  quantity: number;
  sourceStockBefore: number;
  destinationStockBefore: number;
  destinationShortage: number;
  decisionBasis: string;
  seasonImpact: string;
  status: TransferStatus;
  createdAt: string;
  timeline: TransferTimelineItem[];
  dueDate?: string; // กำหนดคืน (สำหรับ Borrow)
  returnedDate?: string; // วันที่คืนจริง (Borrow) — ถ้ายังไม่คืน = undefined
  counterpartSkuName?: string; // ของที่แลกกลับ (สำหรับ Swap)
};

type TransferSuggestion = {
  skuId: string;
  skuName: string;
  unit: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  sourceStock: number;
  destinationStock: number;
  destinationReorderPoint: number;
  destinationShortage: number;
  sourceExcess: number;
  suggestedQuantity: number;
  sourceStockCoverPeriods: number;
  destinationStockCoverPeriods: number;
  peakSeasonLabel: string;
  decisionBasis: string;
};

type StockIntelligenceRow = {
  skuId: string;
  skuName: string;
  category: string;
  warehouseId: string;
  regionLabel: string;
  unit: string;
  stockQty: number;
  averageMonthlyUsage: number;
  stockCoverPeriods: number;
  peakSeasonLabel: string;
  peakSeasonDemand: number;
  projectedAfterPeakSeason: number;
  status: "Stockout Risk" | "Transfer Source" | "Dead Stock Candidate" | "Balanced";
};

type ReceiptDelayLog = {
  id: string;
  skuId: string;
  warehouseId: string;
  supplierId: string;
  relatedRequestId?: string;
  plannedReceiveDate: string;
  actualReceiveDate: string;
  delayDays: number;
  reasonCategory: string;
  note: string;
  impactDemand: number;
  createdAt: string;
  inspection?: boolean[]; // ผลตรวจรับ 7 ขั้น (true=ผ่าน)
  inspectionResult?: "ผ่าน" | "ไม่ผ่าน";
};

// 7 ขั้นตรวจรับตามระเบียบ พ.ร.บ. จัดซื้อจัดจ้างฯ 2560 (คณะกรรมการตรวจรับ)
const inspectionSteps = [
  "ตรวจเอกสาร (ใบส่งของ/ใบกำกับภาษี/PO/Packing List)",
  "ตรวจนับจำนวน (ทั้งหมด/สุ่มตามเกณฑ์)",
  "ตรวจหีบห่อ & สภาพภายนอก",
  "ตรวจคุณลักษณะเฉพาะ (ชื่อ/รุ่น/ยี่ห้อ/สเปก)",
  "ตรวจผลทดสอบ/ใบรับรอง (มอก./Type Test/PPA)",
  "จัดทำใบตรวจรับ + รายงานผล",
  "ยืนยันรับเข้าคลัง → เบิกจ่าย",
];

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

const delayReasonOptions = [
  "Supplier ส่งช้ากว่ากำหนด",
  "เอกสาร PO/อนุมัติล่าช้า",
  "ขนส่งติดขัด",
  "รอ QC / ตรวจรับ",
  "งบประมาณหรือรอบจัดซื้อเลื่อน",
  "อื่น ๆ",
];

type ProcurementNote = {
  id: string;
  text: string;
  authorName: string;
  authorUsername: string;
  context: string;
  createdAt: string;
};

// ระบบ login/register แบบ PoC (เก็บใน localStorage ต่อเครื่อง ยังไม่ใช่ backend จริง)
type UserRole = "user" | "admin";
type AuthUser = {
  name: string;
  username: string;
  password: string;
  role: UserRole;
};
type SessionUser = {
  name: string;
  username: string;
  role: UserRole;
};

// บัญชี admin ในตัวสำหรับสิทธิ์ลบ (admin/admin) — รหัสยืนยันการลบ
const BUILT_IN_ADMIN = { username: "admin", password: "admin" };
const DELETE_GUARD_CODE = "99999";

const persistentKeys = {
  suppliers: "suppliers",
  skus: "skus",
  inventoryRecords: "inventoryRecords",
  supplierOffers: "supplierOffers",
  requests: "purchaseRequests",
  contactLogs: "supplierContactLogs",
  changeLogs: "changeLogs",
  formulaPolicy: "formulaPolicy",
  formulaVersions: "formulaVersions",
  aiFeedbackLogs: "aiFeedbackLogs",
  budgetSettings: "budgetSettings",
  transferRequests: "transferRequests",
  receiptDelayLogs: "receiptDelayLogs",
  procurementNotes: "procurementNotes",
  authUsers: "authUsers",
  currentUser: "currentUser",
};

const defaultFormulaPolicy: FormulaPolicyState = {
  formulaVersion,
  serviceLevel: 0.95,
  zScore: calculateZScoreFromServiceLevel(0.95),
  seasonalFactor: 1.2,
  budgetFactor: 1,
  highVarianceThreshold: 50,
};

const defaultFormulaVersions: FormulaVersionRecord[] = [
  {
    ...defaultFormulaPolicy,
    createdAt: "2026-05-05 09:00",
    note: "นโยบายสูตรเริ่มต้นของข้อมูล seed",
  },
];

function buildDefaultBudgetSettings(): BudgetSettingsState {
  return {
    localBudgets: Object.fromEntries(warehouses.map((warehouse) => [warehouse.id, warehouse.localBudget])),
    regionalBudgets: Object.fromEntries(regionalBudgets.map((budget) => [budget.region, budget.remaining])) as Record<BudgetRegion, number>,
    centralBudgetRemaining,
    updatedAt: "2026-05-05 09:00:00",
  };
}

const defaultBudgetSettings = buildDefaultBudgetSettings();

function normalizeBudgetSettings(settings: BudgetSettingsState): BudgetSettingsState {
  // เผื่อกรณี user เคยมี localStorage version เก่าที่ไม่มีคลังหรือเขตใหม่
  // ระบบจะเติมค่าตั้งต้นจาก seed โดยไม่ทับค่าที่ผู้ใช้เคยแก้ไว้
  return {
    localBudgets: {
      ...defaultBudgetSettings.localBudgets,
      ...settings.localBudgets,
    },
    regionalBudgets: {
      ...defaultBudgetSettings.regionalBudgets,
      ...settings.regionalBudgets,
    },
    centralBudgetRemaining: settings.centralBudgetRemaining ?? defaultBudgetSettings.centralBudgetRemaining,
    updatedAt: settings.updatedAt ?? defaultBudgetSettings.updatedAt,
  };
}

function budgetSettingsToInputDraft(settings: BudgetSettingsState): BudgetInputDraftState {
  return {
    localBudgets: Object.fromEntries(
      warehouses.map((warehouse) => [warehouse.id, String(settings.localBudgets[warehouse.id] ?? warehouse.localBudget)]),
    ),
    regionalBudgets: Object.fromEntries(
      regionalBudgets.map((budget) => [budget.region, String(settings.regionalBudgets[budget.region] ?? budget.remaining)]),
    ) as Record<BudgetRegion, string>,
    centralBudgetRemaining: String(settings.centralBudgetRemaining),
    updatedAt: settings.updatedAt,
  };
}

function parseBudgetInput(value: string, fallback = 0) {
  const trimmedValue = value.trim();

  if (trimmedValue === "") return 0;

  const parsedValue = Number(trimmedValue);

  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : fallback;
}

function budgetInputDraftToSettings(draft: BudgetInputDraftState, fallback: BudgetSettingsState = defaultBudgetSettings): BudgetSettingsState {
  return {
    localBudgets: Object.fromEntries(
      warehouses.map((warehouse) => [
        warehouse.id,
        parseBudgetInput(draft.localBudgets[warehouse.id] ?? "", fallback.localBudgets[warehouse.id] ?? warehouse.localBudget),
      ]),
    ),
    regionalBudgets: Object.fromEntries(
      regionalBudgets.map((budget) => [
        budget.region,
        parseBudgetInput(draft.regionalBudgets[budget.region] ?? "", fallback.regionalBudgets[budget.region] ?? budget.remaining),
      ]),
    ) as Record<BudgetRegion, number>,
    centralBudgetRemaining: parseBudgetInput(draft.centralBudgetRemaining, fallback.centralBudgetRemaining),
    updatedAt: draft.updatedAt || fallback.updatedAt,
  };
}

function replaceArrayContents<T>(target: T[], source: T[]) {
  target.splice(0, target.length, ...source);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildFormulaHistoryBaseline(policy: FormulaPolicyState, createdAt: string): FormulaVersionRecord {
  return {
    ...policy,
    createdAt,
    note: "ตั้งเป็น baseline หลังล้างประวัติทดสอบ",
  };
}

function getNextFormulaVersion(currentVersion: string) {
  const fallbackVersion = currentVersion.trim() || "v1.0";
  const match = fallbackVersion.match(/^(.*?)(\d+)(?!.*\d)(.*)$/);

  if (!match) return `${fallbackVersion}-next`;

  const [, prefix, numberPart, suffix] = match;
  const nextNumber = String(Number(numberPart) + 1).padStart(numberPart.length, "0");

  return `${prefix}${nextNumber}${suffix}`;
}

function calculateAiSuggestionError(aiSuggestedQuantity: number, actualQuantity: number) {
  const errorQuantity = actualQuantity - aiSuggestedQuantity;
  const errorPercent = aiSuggestedQuantity === 0 ? (actualQuantity > 0 ? 100 : 0) : (errorQuantity / aiSuggestedQuantity) * 100;

  return { errorQuantity, errorPercent };
}

function buildAiFeedbackStats(logs: AiSuggestionFeedback[]): AiFeedbackStats {
  if (logs.length === 0) {
    return {
      count: 0,
      meanAbsoluteErrorPercent: 0,
      averageBiasPercent: 0,
    };
  }

  const meanAbsoluteErrorPercent = logs.reduce((sum, log) => sum + Math.abs(log.errorPercent), 0) / logs.length;
  const averageBiasPercent = logs.reduce((sum, log) => sum + log.errorPercent, 0) / logs.length;

  return {
    count: logs.length,
    meanAbsoluteErrorPercent,
    averageBiasPercent,
    latest: logs[0],
  };
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundTo(value: number, decimals: number) {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

function buildAutoTunedFormulaPolicy(basePolicy: FormulaPolicyState, errorPercent: number): FormulaPolicyState {
  // AI Feedback loop สำหรับ PoC:
  // error เป็นบวก = ระบบแนะนำน้อยกว่าค่าจริง จึงเพิ่มความ conservative ทีละน้อย
  // error เป็นลบ = ระบบแนะนำมากกว่าค่าจริง จึงลด buffer ทีละน้อย
  // ทุกครั้งที่ปรับต้องออกเป็น formula version ใหม่ ไม่แก้ snapshot เดิมย้อนหลัง
  const direction = errorPercent > 0 ? 1 : -1;
  const serviceLevel = roundTo(clampNumber(basePolicy.serviceLevel + direction * 0.005, 0.8, 0.995), 3);
  const seasonalFactor = roundTo(clampNumber(basePolicy.seasonalFactor + direction * 0.02, 0.8, 1.8), 2);

  return applyAutoFormulaVersion(basePolicy, {
    ...basePolicy,
    serviceLevel,
    zScore: calculateZScoreFromServiceLevel(serviceLevel),
    seasonalFactor,
  });
}

function hasFormulaPolicyValueChange(basePolicy: FormulaPolicyState, nextPolicy: FormulaPolicyState) {
  return (
    basePolicy.serviceLevel !== nextPolicy.serviceLevel ||
    basePolicy.seasonalFactor !== nextPolicy.seasonalFactor ||
    basePolicy.budgetFactor !== nextPolicy.budgetFactor ||
    basePolicy.highVarianceThreshold !== nextPolicy.highVarianceThreshold
  );
}

function applyAutoFormulaVersion(basePolicy: FormulaPolicyState, nextPolicy: FormulaPolicyState): FormulaPolicyState {
  const policyWithDerivedZScore = {
    ...nextPolicy,
    zScore: calculateZScoreFromServiceLevel(nextPolicy.serviceLevel),
  };
  const formulaVersion = hasFormulaPolicyValueChange(basePolicy, policyWithDerivedZScore)
    ? getNextFormulaVersion(basePolicy.formulaVersion)
    : basePolicy.formulaVersion;

  return {
    ...policyWithDerivedZScore,
    formulaVersion,
  };
}

// bump เมื่อชุดข้อมูลตั้งต้น (SKU/inventory/supplier) เปลี่ยน เพื่อล้าง cache เก่าใน localStorage
const SEED_DATA_VERSION = 2;

function hydratePersistentSeedData() {
  // ล้าง cache ของ seed/master เก่าก่อน ถ้า seed version เปลี่ยน (กันข้อมูลใหม่ถูก overwrite ด้วยของเก่า)
  ensureSeedVersion(SEED_DATA_VERSION, [
    persistentKeys.suppliers,
    persistentKeys.skus,
    persistentKeys.inventoryRecords,
    persistentKeys.supplierOffers,
  ]);
  // Seed data ใช้เฉพาะตอนเปิดระบบครั้งแรก หลังจากนั้นข้อมูล master ที่ผู้ใช้แก้จะถูกโหลดจาก JSON storage
  replaceArrayContents(suppliers, loadPersistentJson(persistentKeys.suppliers, suppliers));
  replaceArrayContents(skus, loadPersistentJson(persistentKeys.skus, skus));
  replaceArrayContents(inventoryRecords, loadPersistentJson(persistentKeys.inventoryRecords, inventoryRecords));
}

function getBangkokDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
    second: getPart("second"),
  };
}

function getCurrentDateTimeLabel(date = new Date()) {
  const parts = getBangkokDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function getDateInputValue(date = new Date()) {
  const parts = getBangkokDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getNextRequestId(requests: PurchaseRequest[]) {
  const usedNumbers = new Set(
    requests
      .map((request) => Number(request.id.replace(/^REQ-/, "")))
      .filter((value) => Number.isInteger(value) && value > 0),
  );
  let nextNumber = 1;

  while (usedNumbers.has(nextNumber)) {
    nextNumber += 1;
  }

  return `REQ-${String(nextNumber).padStart(3, "0")}`;
}

function getNextTransferRequestId(requests: TransferRequest[]) {
  const usedNumbers = new Set(
    requests
      .map((request) => Number(request.id.replace(/^TRF-/, "")))
      .filter((value) => Number.isInteger(value) && value > 0),
  );
  let nextNumber = 1;

  while (usedNumbers.has(nextNumber)) {
    nextNumber += 1;
  }

  return `TRF-${String(nextNumber).padStart(3, "0")}`;
}

// seed ประวัติการยืม/โอน/แลก สมจริง เพื่อให้หน้าวิเคราะห์มีข้อมูลตั้งต้น (วันนี้อ้างอิง 2026-06-12)
// K030 = คลังที่ยืมบ่อย คืนช้า และขาดบ่อย (สอดคล้องกับเคสของจม-ของบในหน้า Audit)
function seedTransfer(p: Partial<TransferRequest> & { id: string; type: TransferType; skuId: string; skuName: string; unit: string; sourceWarehouseId: string; destinationWarehouseId: string; quantity: number; status: TransferStatus; createdAt: string }): TransferRequest {
  return {
    sourceStockBefore: 0,
    destinationStockBefore: 0,
    destinationShortage: p.quantity,
    decisionBasis: "",
    seasonImpact: "-",
    timeline: [{ role: "ระบบ", action: "สร้างรายการ", actor: "Demo", date: p.createdAt }],
    ...p,
  };
}

const initialTransferRequests: TransferRequest[] = [
  seedTransfer({ id: "TRF-101", type: "Borrow", skuId: "1CC0CG0002", skuName: "สายเคเบิลใต้ดิน XLPE 240", unit: "เมตร", sourceWarehouseId: "I020", destinationWarehouseId: "I010", quantity: 120, status: "Completed", createdAt: "2026-02-18 09:20:00", dueDate: "2026-03-15", returnedDate: "2026-03-10", decisionBasis: "I010 ต่ำกว่า ROP ช่วงปลายฤดูหนาว ยืมจาก I020 ที่มี stock เหลือ" }),
  seedTransfer({ id: "TRF-102", type: "Borrow", skuId: "1CC0CP0012", skuName: "เสาคอนกรีตอัดแรง 12 เมตร", unit: "ต้น", sourceWarehouseId: "K010", destinationWarehouseId: "K030", quantity: 40, status: "Approved", createdAt: "2026-04-22 13:05:00", dueDate: "2026-05-20", decisionBasis: "K030 ขาดเสาไฟงานขยายเขต ยืมจาก K010" }),
  seedTransfer({ id: "TRF-103", type: "Borrow", skuId: "1CC0BK0050", skuName: "เบรกเกอร์ 3 เฟส 50 แอมป์", unit: "pcs", sourceWarehouseId: "I010", destinationWarehouseId: "I020", quantity: 30, status: "Approved", createdAt: "2026-05-30 10:40:00", dueDate: "2026-06-30", decisionBasis: "I020 รองาน MOQ ซื้อไม่ทัน ยืมก่อน" }),
  seedTransfer({ id: "TRF-104", type: "Borrow", skuId: "1CC0CG0002", skuName: "สายเคเบิลใต้ดิน XLPE 240", unit: "เมตร", sourceWarehouseId: "K010", destinationWarehouseId: "K030", quantity: 80, status: "Approved", createdAt: "2026-03-28 15:10:00", dueDate: "2026-04-30", decisionBasis: "K030 สายไฟไม่พอ ยืมจาก K010" }),
  seedTransfer({ id: "TRF-105", type: "Borrow", skuId: "1DD0DC0000", skuName: "หม้อแปลงจำหน่าย 3 เฟส 100 kVA", unit: "ลูก", sourceWarehouseId: "I010", destinationWarehouseId: "I020", quantity: 2, status: "Completed", createdAt: "2026-01-20 11:00:00", dueDate: "2026-02-28", returnedDate: "2026-02-24", decisionBasis: "งานเร่งด่วน I020 ยืมหม้อแปลงจาก I010" }),
  seedTransfer({ id: "TRF-106", type: "Borrow", skuId: "1CC0CG0002", skuName: "สายเคเบิลใต้ดิน XLPE 240", unit: "เมตร", sourceWarehouseId: "I020", destinationWarehouseId: "K030", quantity: 100, status: "Requested", createdAt: "2026-06-09 09:15:00", dueDate: "2026-07-10", decisionBasis: "K030 ขอยืมสายไฟอีกรอบก่อนตั้งงบซื้อ" }),
  seedTransfer({ id: "TRF-201", type: "Transfer", skuId: "1CC0CP0012", skuName: "เสาคอนกรีตอัดแรง 12 เมตร", unit: "ต้น", sourceWarehouseId: "K030", destinationWarehouseId: "K010", quantity: 60, status: "Completed", createdAt: "2026-05-12 14:30:00", decisionBasis: "ย้ายเสาไฟที่จมที่ K030 ไปเติม K010 ที่กำลังขาด" }),
  seedTransfer({ id: "TRF-202", type: "Transfer", skuId: "1CC0CG0002", skuName: "สายเคเบิลใต้ดิน XLPE 240", unit: "เมตร", sourceWarehouseId: "K030", destinationWarehouseId: "I010", quantity: 120, status: "Approved", createdAt: "2026-06-05 16:00:00", decisionBasis: "เคลียร์สายไฟจมที่ K030 ส่งให้ I010 ที่ต่ำกว่า ROP" }),
  seedTransfer({ id: "TRF-301", type: "Swap", skuId: "1CC0CG0002", skuName: "สายเคเบิลใต้ดิน XLPE 240", unit: "เมตร", sourceWarehouseId: "I010", destinationWarehouseId: "I020", quantity: 50, status: "Completed", createdAt: "2026-03-05 10:10:00", counterpartSkuName: "สายอะลูมิเนียม SAC 50", decisionBasis: "แลกสายเคเบิลใต้ดิน XLPE 240กับแรงสูงระหว่างคลังให้ตรงงาน" }),
  seedTransfer({ id: "TRF-302", type: "Swap", skuId: "1CC0BK0050", skuName: "เบรกเกอร์ 3 เฟส 50 แอมป์", unit: "pcs", sourceWarehouseId: "K010", destinationWarehouseId: "K030", quantity: 20, status: "Completed", createdAt: "2026-04-15 11:45:00", counterpartSkuName: "สายเคเบิลอากาศ SAC 185", decisionBasis: "แลกเบรกเกอร์กับท่อ PVC ให้ตรงงานซ่อม" }),
  seedTransfer({ id: "TRF-303", type: "Swap", skuId: "1CC0CG0002", skuName: "สายเคเบิลใต้ดิน XLPE 240", unit: "เมตร", sourceWarehouseId: "I020", destinationWarehouseId: "I010", quantity: 40, status: "Completed", createdAt: "2026-05-25 13:20:00", counterpartSkuName: "สายอะลูมิเนียม SAC 50", decisionBasis: "แลกสายไฟให้ตรง spec งานติดตั้ง" }),
];

function App() {
  const [masterDataVersion, setMasterDataVersion] = useState(() => {
    hydratePersistentSeedData();
    return 0;
  });
  const [view, setView] = useState<View>("dashboard");
  const [showLanding, setShowLanding] = useState(true);
  const [selectedSkuId, setSelectedSkuId] = useState("1CC0CG0002");
  const [selectedSupplierId, setSelectedSupplierId] = useState("S001");
  const [selectedRequestId, setSelectedRequestId] = useState("REQ-002");
  const [approvalTab, setApprovalTab] = useState<ApprovalTab>("regional");
  const [toast, setToast] = useState("");
  const [editableSupplierOffers, setEditableSupplierOffers] = useState<SupplierOffer[]>(() =>
    loadPersistentJson(persistentKeys.supplierOffers, supplierOffers),
  );
  const [formulaPolicy, setFormulaPolicy] = useState<FormulaPolicyState>(() =>
    loadPersistentJson(persistentKeys.formulaPolicy, defaultFormulaPolicy),
  );
  const [changeLogs, setChangeLogs] = useState<ChangeLogEntry[]>(() => loadPersistentJson(persistentKeys.changeLogs, []));
  const [formulaVersions, setFormulaVersions] = useState<FormulaVersionRecord[]>(() =>
    loadPersistentJson(persistentKeys.formulaVersions, defaultFormulaVersions),
  );
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettingsState>(() =>
    normalizeBudgetSettings(loadPersistentJson(persistentKeys.budgetSettings, defaultBudgetSettings)),
  );

  // จุดต่อ API ในอนาคต: ตอนนี้ state เหล่านี้ persist เป็น JSON ใน browser storage
  // เมื่อมี backend ให้เปลี่ยนเป็น service call โดยยังคง snapshot ของคำขอให้แก้ย้อนหลังไม่ได้
  const [requests, setRequests] = useState<PurchaseRequest[]>(() => loadPersistentJson(persistentKeys.requests, initialRequests));
  const [contactLogs, setContactLogs] = useState<SupplierContactLog[]>(() =>
    loadPersistentJson(persistentKeys.contactLogs, initialContactLogs),
  );
  const [aiFeedbackLogs, setAiFeedbackLogs] = useState<AiSuggestionFeedback[]>(() => loadPersistentJson(persistentKeys.aiFeedbackLogs, []));
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>(() => loadPersistentJson(persistentKeys.transferRequests, initialTransferRequests));
  const [receiptDelayLogs, setReceiptDelayLogs] = useState<ReceiptDelayLog[]>(() => loadPersistentJson(persistentKeys.receiptDelayLogs, []));
  const [procurementNotes, setProcurementNotes] = useState<ProcurementNote[]>(() => loadPersistentJson(persistentKeys.procurementNotes, []));
  const [authUsers, setAuthUsers] = useState<AuthUser[]>(() => loadPersistentJson(persistentKeys.authUsers, []));
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(() => loadPersistentJson(persistentKeys.currentUser, null));
  const [submittedConfirmation, setSubmittedConfirmation] = useState<PurchaseRequest | null>(null);

  useEffect(() => {
    savePersistentJson(persistentKeys.suppliers, suppliers);
    savePersistentJson(persistentKeys.skus, skus);
    savePersistentJson(persistentKeys.inventoryRecords, inventoryRecords);
  }, [masterDataVersion]);

  useEffect(() => savePersistentJson(persistentKeys.supplierOffers, editableSupplierOffers), [editableSupplierOffers]);
  useEffect(() => savePersistentJson(persistentKeys.formulaPolicy, formulaPolicy), [formulaPolicy]);
  useEffect(() => savePersistentJson(persistentKeys.changeLogs, changeLogs), [changeLogs]);
  useEffect(() => savePersistentJson(persistentKeys.formulaVersions, formulaVersions), [formulaVersions]);
  useEffect(() => savePersistentJson(persistentKeys.budgetSettings, budgetSettings), [budgetSettings]);
  useEffect(() => savePersistentJson(persistentKeys.requests, requests), [requests]);
  useEffect(() => savePersistentJson(persistentKeys.contactLogs, contactLogs), [contactLogs]);
  useEffect(() => savePersistentJson(persistentKeys.aiFeedbackLogs, aiFeedbackLogs), [aiFeedbackLogs]);
  useEffect(() => savePersistentJson(persistentKeys.transferRequests, transferRequests), [transferRequests]);
  useEffect(() => savePersistentJson(persistentKeys.receiptDelayLogs, receiptDelayLogs), [receiptDelayLogs]);
  useEffect(() => savePersistentJson(persistentKeys.procurementNotes, procurementNotes), [procurementNotes]);
  useEffect(() => savePersistentJson(persistentKeys.authUsers, authUsers), [authUsers]);
  useEffect(() => savePersistentJson(persistentKeys.currentUser, currentUser), [currentUser]);

  const markMasterDataChanged = () => setMasterDataVersion((version) => version + 1);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  // ความเห็น/Feedback แบบ hybrid: เพิ่มได้จากทุกหน้า (auto-tag context) เก็บชื่อผู้ให้ความเห็นจาก session
  const addPoNote = (text: string, context: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!currentUser) {
      notify("กรุณาเข้าสู่ระบบก่อนให้ความเห็น");
      return;
    }
    const createdAt = getCurrentDateTimeLabel();
    setProcurementNotes((current) => [
      { id: `NOTE-${Date.now()}`, text: trimmed, authorName: currentUser.name, authorUsername: currentUser.username, context, createdAt },
      ...current,
    ]);
    // ส่งสำเนาความเห็นไป Google Sheet (ถ้าตั้ง endpoint) เพื่อเก็บรวมศูนย์
    void sendGoogleFeedbackComment({ authorName: currentUser.name, authorUsername: currentUser.username, context, text: trimmed, createdAt });
    notify(isGooglePoFeedbackEnabled() ? "บันทึกความเห็นแล้ว (ส่งเข้าชีตด้วย)" : "บันทึกความเห็นแล้ว");
  };
  // ลบได้เฉพาะ admin และต้องใส่รหัสยืนยัน 99999 เพื่อกันการลบโดยไม่ตั้งใจ
  const deletePoNote = (id: string, code: string) => {
    if (currentUser?.role !== "admin") {
      notify("เฉพาะผู้ดูแลระบบ (admin) เท่านั้นที่ลบได้");
      return;
    }
    if (code !== DELETE_GUARD_CODE) {
      notify("รหัสยืนยันการลบไม่ถูกต้อง");
      return;
    }
    setProcurementNotes((current) => current.filter((note) => note.id !== id));
    notify("ลบความเห็นแล้ว");
  };

  // ── Auth (PoC localStorage) ────────────────────────────────────────────────
  const registerUser = (name: string, username: string, password: string): boolean => {
    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanName || !cleanUsername || !password) {
      notify("กรอกชื่อ, username และรหัสผ่านให้ครบ");
      return false;
    }
    if (cleanUsername === BUILT_IN_ADMIN.username || authUsers.some((user) => user.username === cleanUsername)) {
      notify("username นี้ถูกใช้แล้ว");
      return false;
    }
    const newUser: AuthUser = { name: cleanName, username: cleanUsername, password, role: "user" };
    setAuthUsers((current) => [...current, newUser]);
    setCurrentUser({ name: cleanName, username: cleanUsername, role: "user" });
    notify(`สมัครและเข้าสู่ระบบเป็น ${cleanName} แล้ว`);
    return true;
  };
  // เข้าสู่ระบบด้วย Google (OAuth) — ได้ identity จริง ชื่อ/อีเมล สิทธิ์ admin ถ้าอีเมลตรง VITE_ADMIN_EMAIL
  const loginWithGoogle = (profile: GoogleProfile) => {
    setCurrentUser({ name: profile.name, username: profile.email, role: isAdminEmail(profile.email) ? "admin" : "user" });
    notify(`เข้าสู่ระบบด้วย Google เป็น ${profile.name}`);
  };
  const loginUser = (username: string, password: string): boolean => {
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername === BUILT_IN_ADMIN.username && password === BUILT_IN_ADMIN.password) {
      setCurrentUser({ name: "ผู้ดูแลระบบ", username: "admin", role: "admin" });
      notify("เข้าสู่ระบบเป็น admin แล้ว");
      return true;
    }
    const found = authUsers.find((user) => user.username === cleanUsername && user.password === password);
    if (!found) {
      notify("username หรือรหัสผ่านไม่ถูกต้อง");
      return false;
    }
    setCurrentUser({ name: found.name, username: found.username, role: found.role });
    notify(`เข้าสู่ระบบเป็น ${found.name} แล้ว`);
    return true;
  };
  const logoutUser = () => {
    setCurrentUser(null);
    notify("ออกจากระบบแล้ว");
  };
  // PoC: รีเซ็ตรหัสผ่านด้วย username (ไม่มีอีเมลจริง) — ของจริงควรใช้ Firebase/Supabase ที่ส่งลิงก์รีเซ็ตทางอีเมล
  const resetPassword = (username: string, newPassword: string): boolean => {
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername === BUILT_IN_ADMIN.username) {
      notify("บัญชี admin ในตัวรีเซ็ตไม่ได้");
      return false;
    }
    if (!authUsers.some((user) => user.username === cleanUsername)) {
      notify("ไม่พบบัญชีผู้ใช้นี้");
      return false;
    }
    if (!newPassword) {
      notify("กรอกรหัสผ่านใหม่");
      return false;
    }
    setAuthUsers((current) => current.map((user) => (user.username === cleanUsername ? { ...user, password: newPassword } : user)));
    notify("ตั้งรหัสผ่านใหม่แล้ว เข้าสู่ระบบได้เลย");
    return true;
  };

  // เก็บ audit log ของการแก้ไขค่าตั้งต้นใน prototype
  // ถ้าต่อ API จริง จุดนี้สามารถเปลี่ยนเป็น service call เพื่อบันทึกลงฐานข้อมูลได้
  const addChangeLog = (entry: Omit<ChangeLogEntry, "id" | "actor" | "createdAt">) => {
    setChangeLogs((current) => [
      {
        ...entry,
        id: `CHG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        actor: "Demo Admin",
        createdAt: getCurrentDateTimeLabel(),
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
    markMasterDataChanged();

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
      markMasterDataChanged();
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
    markMasterDataChanged();

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
    const policyWithDerivedZScore = applyAutoFormulaVersion(previous, nextPolicy);

    if (!hasFormulaPolicyValueChange(previous, policyWithDerivedZScore)) {
      notify("ยังไม่มีการเปลี่ยนค่านโยบาย สูตรจึงยังไม่สร้างเวอร์ชันใหม่");
      return;
    }

    setFormulaPolicy(policyWithDerivedZScore);
    setFormulaVersions((current) => [{ ...policyWithDerivedZScore, createdAt: getCurrentDateTimeLabel(), note }, ...current]);

    addFormulaPolicyChangeLogs(previous, policyWithDerivedZScore, note, addChangeLog);
    notify(`บันทึกสูตรคำนวณ ${policyWithDerivedZScore.formulaVersion} แล้ว`);
  };

  const saveBudgetSettings = (nextSettings: BudgetSettingsState, note: string) => {
    const previous = budgetSettings;
    const normalizedSettings = normalizeBudgetSettings({
      ...nextSettings,
      updatedAt: getCurrentDateTimeLabel(),
    });

    if (!hasBudgetSettingsChange(previous, normalizedSettings)) {
      notify("ยังไม่มีการเปลี่ยนค่างบประมาณ");
      return;
    }

    // งบประมาณเป็น source สำหรับ Budget Check และ Approval Routing ครั้งถัดไป
    // Request/Snapshot เดิมต้องไม่ถูกแก้ย้อนหลัง จึงเก็บเป็น state ปัจจุบันแยกจาก snapshot
    setBudgetSettings(normalizedSettings);
    addBudgetChangeLogs(previous, normalizedSettings, note, addChangeLog);
    notify("บันทึกค่างบประมาณแล้ว");
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
    const feedbackAction: GooglePoFeedbackAction = request.status === "Draft" ? "draft_saved" : "request_submitted";

    setRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
    setSelectedRequestId(request.id);
    setApprovalTab(request.status === "Pending Central" ? "central" : "regional");
    setView(request.status === "Draft" ? "history" : "approval");
    void sendGooglePoFeedback({
      action: feedbackAction,
      request,
      actionAt: getCurrentDateTimeLabel(),
      note: request.status === "Draft" ? "บันทึกแบบร่าง" : "ส่งคำขอซื้อเข้าคิวอนุมัติ",
    });
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

  const createTransferRequest = (suggestion: TransferSuggestion, type: TransferType) => {
    const createdAt = getCurrentDateTimeLabel();
    const request: TransferRequest = {
      id: getNextTransferRequestId(transferRequests),
      type,
      skuId: suggestion.skuId,
      skuName: suggestion.skuName,
      unit: suggestion.unit,
      sourceWarehouseId: suggestion.sourceWarehouseId,
      destinationWarehouseId: suggestion.destinationWarehouseId,
      quantity: suggestion.suggestedQuantity,
      sourceStockBefore: suggestion.sourceStock,
      destinationStockBefore: suggestion.destinationStock,
      destinationShortage: suggestion.destinationShortage,
      decisionBasis: suggestion.decisionBasis,
      seasonImpact: suggestion.peakSeasonLabel,
      status: "Requested",
      createdAt,
      timeline: [
        {
          role: "Warehouse Planner",
          action: type === "Borrow" ? "สร้างคำขอยืมพัสดุ" : "สร้างคำขอโอนย้ายพัสดุ",
          actor: "Demo Planner",
          date: createdAt,
          note: `ระบบแนะนำจาก stock cover และ shortage: ${suggestion.decisionBasis}`,
        },
      ],
    };

    // Transfer/Borrow เป็น workflow ก่อนซื้อ: เก็บเป็น persistent JSON state เพื่อให้ผู้อนุมัติเห็นหลักฐานการตัดสินใจ
    setTransferRequests((current) => [request, ...current]);
    notify(`${request.id}: สร้าง${type === "Borrow" ? "คำขอยืม" : "คำขอโอนย้าย"}แล้ว`);
  };

  const updateTransferRequestStatus = (id: string, status: TransferStatus, action: string, note?: string) => {
    const actionAt = getCurrentDateTimeLabel();

    setTransferRequests((current) =>
      current.map((request) =>
        request.id === id
          ? {
              ...request,
              status,
              // ปิดงานคำขอยืม = บันทึกการคืนของ เพื่อให้สถานะการคืนอัปเดตเป็น "คืนแล้ว"
              returnedDate: request.type === "Borrow" && status === "Completed" ? getDateInputValue() : request.returnedDate,
              timeline: [
                ...request.timeline,
                {
                  role: status === "Completed" ? "Receiving Warehouse" : "Transfer Approver",
                  action,
                  actor: status === "Completed" ? "เจ้าหน้าที่คลังปลายทาง" : "ผู้อนุมัติคลัง",
                  date: actionAt,
                  note,
                },
              ],
            }
          : request,
      ),
    );
    notify(`${id}: ${action}`);
  };

  const addReceiptDelayLog = (log: ReceiptDelayLog) => {
    // Receiving/Delay log ใช้เป็น feedback ให้ lead time และ seasonal shortage risk ในรอบคำนวณถัดไป
    setReceiptDelayLogs((current) => [log, ...current]);
    notify(`บันทึกรับของและ Delay ${log.id} แล้ว`);
  };

  const saveAiSuggestionFeedback = (request: PurchaseRequest, actualQuantity: number, note: string) => {
    const { errorQuantity, errorPercent } = calculateAiSuggestionError(request.aiSuggestedQuantity, actualQuantity);
    const shouldAutoTune = Math.abs(errorPercent) >= formulaPolicy.highVarianceThreshold;
    const feedback: AiSuggestionFeedback = {
      id: `AIFB-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      requestId: request.id,
      skuId: request.skuId,
      warehouseId: request.warehouseId,
      formulaVersion: request.formulaVersion,
      aiSuggestedQuantity: request.aiSuggestedQuantity,
      actualQuantity,
      errorQuantity,
      errorPercent,
      note: note || "บันทึกผลจริงเพื่อเทียบกับ AI Suggest",
      createdAt: getCurrentDateTimeLabel(),
    };

    // เก็บ feedback loop เพื่อวัด error ของ AI Suggest และใช้เป็นหลักฐานสำหรับปรับสูตรเวอร์ชันถัดไป
    setAiFeedbackLogs((current) => [feedback, ...current]);

    if (shouldAutoTune) {
      const previousPolicy = formulaPolicy;
      const tunedPolicy = buildAutoTunedFormulaPolicy(previousPolicy, errorPercent);

      if (hasFormulaPolicyValueChange(previousPolicy, tunedPolicy)) {
        const autoTuneNote = `Auto-tune จาก AI Feedback ${request.id}: error ${formatPercent(errorPercent)} เทียบค่าที่ระบบแนะนำกับค่าจริง`;

        // ถ้า error เกินเกณฑ์ ระบบปรับ policy แบบก้าวเล็กและสร้าง version ใหม่ทันที
        // เพื่อให้คำแนะนำครั้งถัดไปเรียนรู้จากค่าจริง แต่ยังรักษา snapshot เก่าตามเดิม
        setFormulaPolicy(tunedPolicy);
        setFormulaVersions((current) => [{ ...tunedPolicy, createdAt: getCurrentDateTimeLabel(), note: autoTuneNote }, ...current]);
        addFormulaPolicyChangeLogs(previousPolicy, tunedPolicy, autoTuneNote, addChangeLog);
        notify(`บันทึก AI feedback แล้ว · error ${formatPercent(errorPercent)} · ปรับสูตรเป็น ${tunedPolicy.formulaVersion}`);
        return;
      }
    }

    notify(`บันทึก AI feedback แล้ว · error ${formatPercent(errorPercent)}`);
  };

  const updateRequest = (id: string, status: PurchaseRequest["status"], action: string, note?: string) => {
    const actionAt = getCurrentDateTimeLabel();
    const getFeedbackAction = (): GooglePoFeedbackAction => {
      if (status === "Pending Central") return "regional_escalated";
      if (status === "Approved") return "approved";
      if (status === "Rejected") return "rejected";
      if (status === "More Info") return "more_info_requested";
      return "approval_action";
    };
    const buildUpdatedRequest = (request: PurchaseRequest): PurchaseRequest => ({
      ...request,
      status,
      approvedQuantity: status === "Approved" ? request.requestedQuantity : request.approvedQuantity,
      calculationSnapshot:
        status === "Approved"
          ? {
              ...request.calculationSnapshot,
              approvedQuantity: request.requestedQuantity,
            }
          : request.calculationSnapshot,
      timeline: [
        ...request.timeline,
        {
          role: status === "Pending Central" ? "Regional" : approvalTab === "central" ? "Central" : "Regional",
          action,
          actor: status === "Pending Central" ? "ผู้ตรวจระดับเขต" : approvalTab === "central" ? "จัดซื้อส่วนกลาง" : "ผู้ตรวจระดับเขต",
          date: actionAt,
          note,
        },
      ],
    });
    const feedbackRequest = requests.find((request) => request.id === id);

    setRequests((current) =>
      current.map((request) =>
        request.id === id ? buildUpdatedRequest(request) : request,
      ),
    );
    if (feedbackRequest) {
      void sendGooglePoFeedback({
        action: getFeedbackAction(),
        request: buildUpdatedRequest(feedbackRequest),
        actionAt,
        note,
        actor: approvalTab === "central" ? "จัดซื้อส่วนกลาง" : "ผู้ตรวจระดับเขต",
      });
    }
    if (status === "Pending Central") {
      setSelectedRequestId(id);
      setApprovalTab("central");
    }
    notify(`${id}: ${action}`);
  };

  const clearDemoHistory = () => {
    const confirmed = window.confirm("ต้องการล้างประวัติทดสอบและ log กลับเป็นค่าเริ่มต้นหรือไม่? ข้อมูล Supplier, SKU, งบประมาณ และค่าตั้งค่าปัจจุบันจะไม่ถูกลบ");

    if (!confirmed) return;

    // ใช้สำหรับช่วง demo/test ที่สร้าง request และ log จำนวนมาก
    // รีเซ็ตเฉพาะ history/audit-like data โดยไม่แตะ master data หรือ policy ปัจจุบัน
    const resetAt = getCurrentDateTimeLabel();
    const resetRequests = cloneJson(initialRequests);
    const resetContactLogs = cloneJson(initialContactLogs);
    const resetChangeLogs: ChangeLogEntry[] = [];
    const resetFormulaVersions = [buildFormulaHistoryBaseline(formulaPolicy, resetAt)];
    const resetAiFeedbackLogs: AiSuggestionFeedback[] = [];
    const resetTransferRequests: TransferRequest[] = [];
    const resetReceiptDelayLogs: ReceiptDelayLog[] = [];

    // เขียนลง persistent JSON โดยตรงก่อน setState เพื่อกันข้อมูลเก่าค้างหลัง refresh
    savePersistentJson(persistentKeys.requests, resetRequests);
    savePersistentJson(persistentKeys.contactLogs, resetContactLogs);
    savePersistentJson(persistentKeys.changeLogs, resetChangeLogs);
    savePersistentJson(persistentKeys.formulaVersions, resetFormulaVersions);
    savePersistentJson(persistentKeys.aiFeedbackLogs, resetAiFeedbackLogs);
    savePersistentJson(persistentKeys.transferRequests, resetTransferRequests);
    savePersistentJson(persistentKeys.receiptDelayLogs, resetReceiptDelayLogs);

    setRequests(resetRequests);
    setContactLogs(resetContactLogs);
    setChangeLogs(resetChangeLogs);
    setFormulaVersions(resetFormulaVersions);
    setAiFeedbackLogs(resetAiFeedbackLogs);
    setTransferRequests(resetTransferRequests);
    setReceiptDelayLogs(resetReceiptDelayLogs);
    setSubmittedConfirmation(null);
    setSelectedRequestId(resetRequests[0]?.id ?? "");
    setApprovalTab("regional");
    notify("ล้างประวัติทดสอบและรีเซ็ต log แล้ว");
  };

  const page = (() => {
    switch (view) {
      case "dashboard":
        return (
          <DashboardPage
            openSku={openSku}
            requests={requests}
            transferRequests={transferRequests}
            receiptDelayLogs={receiptDelayLogs}
            supplierOfferData={editableSupplierOffers}
            formulaPolicy={formulaPolicy}
            aiFeedbackLogs={aiFeedbackLogs}
            budgetSettings={budgetSettings}
            onOpenTransfer={() => setView("transfer")}
            onOpenTransferSku={(skuId) => {
              setSelectedSkuId(skuId);
              setView("transfer");
            }}
            onOpenStockIntelligence={() => setView("stock-intelligence")}
            onOpenAudit={() => setView("procurement-audit")}
          />
        );
      case "inventory":
        return <InventoryPage openSku={openSku} supplierOfferData={editableSupplierOffers} formulaPolicy={formulaPolicy} />;
      case "usage":
        return <WarehouseSkuUsagePage onOpenSku={openSku} />;
      case "transfer":
        return (
          <TransferCenterPage
            selectedSkuId={selectedSkuId}
            transferRequests={transferRequests}
            supplierOfferData={editableSupplierOffers}
            formulaPolicy={formulaPolicy}
            onOpenSku={openSku}
            onCreateTransfer={createTransferRequest}
            onUpdateTransfer={updateTransferRequestStatus}
          />
        );
      case "stock-intelligence":
        return (
          <StockIntelligencePage
            aiFeedbackLogs={aiFeedbackLogs}
            receiptDelayLogs={receiptDelayLogs}
            onOpenSku={openSku}
          />
        );
      case "procurement-audit":
        return (
          <ProcurementAuditPage
            onOpenSku={openSku}
            onOpenTransfer={(skuId) => {
              setSelectedSkuId(skuId);
              setView("transfer");
            }}
          />
        );
      case "feedback":
        return (
          <FeedbackCenterPage
            notes={procurementNotes}
            currentUser={currentUser}
            onDeleteNote={deletePoNote}
            onOpenView={(target) => setView(target)}
          />
        );
      case "auth":
        return (
          <AuthPage
            currentUser={currentUser}
            onLogin={loginUser}
            onRegister={registerUser}
            onResetPassword={resetPassword}
            onGoogleLogin={loginWithGoogle}
            onLogout={logoutUser}
            onOpenFeedback={() => setView("feedback")}
          />
        );
      case "sku-detail":
        return (
          <SkuDetailPage
            skuId={selectedSkuId}
            supplierOfferData={editableSupplierOffers}
            formulaPolicy={formulaPolicy}
            budgetSettings={budgetSettings}
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
            onTransfer={() => setView("transfer")}
            onVmi={() => setView("vmi-simulation")}
          />
        );
      case "calculation":
        return (
          <CalculationDetailPage
            skuId={selectedSkuId}
            supplierOfferData={editableSupplierOffers}
            formulaPolicy={formulaPolicy}
            budgetSettings={budgetSettings}
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
            budgetSettings={budgetSettings}
            existingRequests={requests}
            onBack={() => setView("sku-detail")}
            onContactSupplier={(supplierId) => {
              setSelectedSupplierId(supplierId);
              setView("supplier-detail");
            }}
            onOpenTransfer={(skuId) => {
              setSelectedSkuId(skuId);
              setView("transfer");
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
            aiFeedbackLogs={aiFeedbackLogs}
            selectedRequestId={selectedRequestId}
            onSelectRequest={setSelectedRequestId}
            onSaveFeedback={saveAiSuggestionFeedback}
          />
        );
      case "vmi":
        return <VmiCandidatePage onSimulation={() => setView("vmi-simulation")} openSku={openSku} />;
      case "vmi-simulation":
        return <VmiSimulationPage supplierOfferData={editableSupplierOffers} formulaPolicy={formulaPolicy} onBack={() => setView("vmi")} onCreateProposal={() => notify("สร้างข้อเสนอ VMI แบบร่างแล้ว")} />;
      case "receiving-delay":
        return (
          <ReceivingDelayPage
            requests={requests}
            receiptDelayLogs={receiptDelayLogs}
            supplierOfferData={editableSupplierOffers}
            onSave={addReceiptDelayLog}
            onOpenRequestHistory={(requestId) => {
              if (requestId) setSelectedRequestId(requestId);
              setView("history");
            }}
            onOpenSku={openSku}
          />
        );
      case "budget-settings":
        return (
          <BudgetSettingsPage
            budgetSettings={budgetSettings}
            changeLogs={changeLogs}
            onSave={saveBudgetSettings}
          />
        );
      case "settings":
        return (
          <SettingsPage
            formulaPolicy={formulaPolicy}
            formulaVersions={formulaVersions}
            changeLogs={changeLogs}
            onSaveFormulaPolicy={saveFormulaPolicy}
            onClearDemoHistory={clearDemoHistory}
          />
        );
      default:
        return null;
    }
  })();

  if (showLanding) {
    return (
      <LandingPage
        currentUser={currentUser}
        onEnter={() => setShowLanding(false)}
        onLogin={() => {
          setShowLanding(false);
          setView("auth");
        }}
      />
    );
  }

  return (
    <AppLayout view={view} formulaPolicy={formulaPolicy} onNavigate={setView} noteCount={procurementNotes.length} onAddNote={addPoNote} currentUser={currentUser}>
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

function LandingPage({ currentUser, onEnter, onLogin }: { currentUser: SessionUser | null; onEnter: () => void; onLogin: () => void }) {
  const features = [
    { icon: Calculator, title: "AI แนะนำ + อธิบายได้", desc: "ทุกตัวเลขบอก ‘คำนวณจริงจาก’ และ ‘เปลี่ยนเมื่อ’ ตรวจสอบย้อนหลังได้ ไม่ใช่ตัวเลขลอย ๆ" },
    { icon: Megaphone, title: "ตลาดนัดเคลียร์ของจม", desc: "ประกาศของจมที่ยืม/แลกได้ พร้อมมูลค่าทุนจมและ aging — ลด overstock" },
    { icon: Scale, title: "ตรวจซื้อซ้ำ-ของจม", desc: "จับเคสของบซื้อทั้งที่ของยังจม และเร่งใช้งบให้หมดปลายปี" },
    { icon: ArrowRightLeft, title: "โอน/ยืม/แลกก่อนซื้อ", desc: "เติมคลังที่ขาดจากคลังที่เหลือ มีเกณฑ์กันคลังต้นทางขาดเอง" },
    { icon: ShieldCheck, title: "อนุมัติงบ 3 ชั้น", desc: "คลัง → เขต → ส่วนกลาง พร้อม Budget Check และ Calculation Snapshot" },
    { icon: PackageCheck, title: "ตรวจรับ + Feedback loop", desc: "บันทึก delay/ค่าจริง → ปรับสูตรเวอร์ชันใหม่ให้แม่นขึ้นรอบถัดไป" },
  ];
  const problems = [
    { p: "Forecast ไม่แม่น โดยเฉพาะงานซ่อมฉุกเฉิน", s: "AI Suggest + Demand Forecast + บันทึก damage history" },
    { p: "จัดซื้อช้า / ตรวจรับช้า", s: "ตรวจรับ 7 ขั้น + Delay log + คะแนน reliability ของ supplier" },
    { p: "ไม่มีเกณฑ์ยืมพัสดุข้ามคลัง", s: "Transfer/Borrow พร้อม buffer กันคลังต้นทางขาด" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white"><Sparkles className="h-5 w-5" /></span>
            <div className="leading-tight">
              <p className="text-sm font-bold">PEA AI Inventory</p>
              <p className="text-[11px] text-slate-500">แพลตฟอร์มวางแผนพัสดุ & จัดซื้อด้วย AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onLogin}><User className="h-4 w-4" /> {currentUser ? currentUser.name : "เข้าสู่ระบบ"}</Button>
            <Button onClick={onEnter}>เริ่มใช้งาน <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" /> AI-assisted decision support สำหรับการไฟฟ้า (PEA)
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            วางแผนพัสดุคงคลังและจัดซื้อ<span className="text-blue-700">ด้วย AI</span><br />ที่อธิบายได้ ตรวจสอบย้อนหลังได้
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            AI แนะนำจำนวนที่ควรซื้อจากข้อมูลจริง ผ่านอนุมัติงบ 3 ชั้น เก็บ snapshot ทุกครั้ง
            ลดทั้งของขาดและของจม — “สต็อกพอดี ใช้งานทัน ลดทุนจม”
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={onEnter} className="h-11 px-6 text-base">เข้าใช้งานระบบ (เดโม) <ArrowRight className="h-4 w-4" /></Button>
            <Button variant="secondary" onClick={onLogin} className="h-11 px-6 text-base"><User className="h-4 w-4" /> เข้าสู่ระบบ</Button>
          </div>
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[["12", "SKU พัสดุไฟฟ้า"], ["8", "คลัง · 3 เขต"], ["3 ชั้น", "อนุมัติงบ"], ["100%", "Snapshot ตรวจย้อนหลัง"]].map(([v, l]) => (
              <div key={l} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xl font-bold text-blue-700">{v}</p>
                <p className="mt-0.5 text-xs text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-950">ความสามารถหลัก</h2>
          <p className="mt-2 text-sm text-slate-500">ครบตั้งแต่วางแผน → จัดซื้อ → ตรวจรับ → ลดของจม</p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-3 font-semibold text-slate-950">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-950">ปัญหาจริงของ PEA → ระบบนี้แก้ตรงจุด</h2>
            <p className="mt-2 text-sm text-slate-500">อ้างอิงงานวิจัยการจัดการโลจิสติกส์ PEA (ม.ธรรมศาสตร์ 2561)</p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {problems.map((row, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">ปัญหา {index + 1}</p>
                <p className="mt-2 font-semibold text-slate-900">{row.p}</p>
                <div className="mt-3 flex items-start gap-2 border-t border-slate-100 pt-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-6 text-slate-600">{row.s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + credibility */}
      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-950">พร้อมลองใช้งานแล้ว</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          เริ่มจาก Demo Flow: แดชบอร์ด → SKU Detail → คำขอซื้อ → อนุมัติ → ประวัติ
        </p>
        <div className="mt-6">
          <Button onClick={onEnter} className="h-11 px-7 text-base">เข้าใช้งานระบบ <ArrowRight className="h-4 w-4" /></Button>
        </div>
        <p className="mt-8 text-xs text-slate-400">
          อ้างอิงระเบียบ พ.ร.บ. การจัดซื้อจัดจ้างฯ พ.ศ. 2560 · ต้นแบบจำลอง ไม่มีการเชื่อมต่อ API จริง
        </p>
      </section>
    </div>
  );
}

function AppLayout({
  view,
  formulaPolicy,
  onNavigate,
  noteCount,
  onAddNote,
  currentUser,
  children,
}: {
  view: View;
  formulaPolicy: FormulaPolicyState;
  onNavigate: (view: View) => void;
  noteCount: number;
  onAddNote: (text: string, context: string) => void;
  currentUser: SessionUser | null;
  children: ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // เมนูจัดเป็น 5 หมวดตามลำดับงานจริง (ดูภาพรวม → วิเคราะห์ความเสี่ยง → ลงมือจัดซื้อ → อ้างอิง → ตั้งค่า)
  // หน้า "การใช้ SKU" ยุบเป็นแท็บใน "คลังพัสดุ" และ "บัญชีผู้ใช้" ย้ายไปปุ่มบน header
  const navSections = [
    { title: "ภาพรวม", items: [{ id: "dashboard", label: "แดชบอร์ด", icon: BarChart3 }] },
    {
      title: "คลัง & ความเสี่ยง",
      items: [
        { id: "inventory", label: "คลังพัสดุ", icon: Boxes },
        { id: "stock-intelligence", label: "วิเคราะห์สต็อก", icon: Archive },
        { id: "procurement-audit", label: "ตรวจซื้อซ้ำ-ของจม", icon: Scale },
      ],
    },
    {
      title: "จัดซื้อ & เคลื่อนย้าย",
      items: [
        { id: "request", label: "คำขอซื้อ", icon: FileText },
        { id: "approval", label: "อนุมัติ", icon: ClipboardCheck },
        { id: "transfer", label: "โอน/ยืม/แลก", icon: ArrowRightLeft },
        { id: "receiving-delay", label: "รับของ/ตรวจรับ", icon: PackageCheck },
      ],
    },
    {
      title: "ข้อมูล & ประวัติ",
      items: [
        { id: "supplier", label: "ซัพพลายเออร์", icon: Truck },
        { id: "vmi", label: "VMI", icon: Workflow },
        { id: "history", label: "ประวัติ", icon: History },
      ],
    },
    {
      title: "ระบบ",
      items: [
        { id: "budget-settings", label: "งบประมาณ", icon: Landmark },
        { id: "settings", label: "ตั้งค่าสูตร", icon: Settings },
        { id: "feedback", label: "ศูนย์ความเห็น", icon: MessageSquare },
      ],
    },
  ] as const;

  const activeRoot =
    view === "sku-detail" || view === "calculation" || view === "usage"
      ? "inventory"
      : view === "supplier-detail" || view === "contact-log"
        ? "supplier"
        : view === "vmi-simulation"
          ? "vmi"
          : view;
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
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-violet shadow-soft">
                <Sparkles className="h-5 w-5 text-white" />
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#330C66] bg-[#FFD057]" />
              </div>
              {!collapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold tracking-tight">วางแผนพัสดุ &amp; จัดซื้อ</p>
                  <p className="truncate text-xs text-white/45">Hackathon 2026 · by ThaiCloud</p>
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

        <nav className={`${collapsed ? "space-y-1 p-2" : "p-3"}`}>
          {navSections.map((section, sectionIndex) => (
            <div key={section.title} className={collapsed ? "" : sectionIndex > 0 ? "mt-4" : ""}>
              {!collapsed ? (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">{section.title}</p>
              ) : sectionIndex > 0 ? (
                <div className="mx-2 my-2 border-t border-white/10" />
              ) : null}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeRoot === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`flex h-10 w-full items-center rounded-[10px] text-sm transition ${
                        collapsed ? "justify-center px-0" : "gap-3 px-3 text-left"
                      } ${active ? "bg-white/15 font-semibold text-white shadow-soft" : "font-normal text-white/65 hover:bg-white/10 hover:text-white"}`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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
        className={`sidebar-violet fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/10 text-white shadow-2xl transition-transform duration-200 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebar("mobile")}
      </aside>

      <aside
        className={`sidebar-violet hidden shrink-0 border-r border-white/10 text-white transition-[width] duration-200 lg:block lg:sticky lg:top-0 lg:h-screen lg:self-start ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {renderSidebar("desktop")}
      </aside>

      <main className="min-w-0 flex-1">
        <header className="app-header sticky top-0 z-30 border-b border-slate-200 px-4 py-4 md:px-7">
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
            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="truncate">สูตร {formulaPolicy.formulaVersion} · ระดับความมั่นใจ {formatPercent(formulaPolicy.serviceLevel * 100).replace("+", "")}</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("auth")}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <User className="h-4 w-4 text-slate-500" />
                {currentUser ? (
                  <span className="truncate">{currentUser.name}{currentUser.role === "admin" ? " (admin)" : ""}</span>
                ) : (
                  <span>เข้าสู่ระบบ</span>
                )}
              </button>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-7">{children}</div>
      </main>
      <FeedbackQuickAdd
        contextLabel={viewLabels[view]}
        noteCount={noteCount}
        currentUser={currentUser}
        onAddNote={onAddNote}
        onOpenCenter={() => onNavigate("feedback")}
        onOpenAuth={() => onNavigate("auth")}
      />
    </div>
  );
}

// ปุ่มลอย "+ ความเห็น" บนทุกหน้า — ต้องเข้าสู่ระบบก่อน เพื่อเก็บชื่อผู้ให้ความเห็น auto-tag หน้าปัจจุบัน
function FeedbackQuickAdd({
  contextLabel,
  noteCount,
  currentUser,
  onAddNote,
  onOpenCenter,
  onOpenAuth,
}: {
  contextLabel: string;
  noteCount: number;
  currentUser: SessionUser | null;
  onAddNote: (text: string, context: string) => void;
  onOpenCenter: () => void;
  onOpenAuth: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="w-80 rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">ความเห็น / Feedback</p>
            <button type="button" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => setOpen(false)} aria-label="ปิด"><X className="h-4 w-4" /></button>
          </div>
          {currentUser ? (
            <div className="space-y-2 p-4">
              <p className="text-xs text-slate-500">โดย <span className="font-medium text-slate-700">{currentUser.name}</span> · หน้านี้: <span className="font-medium text-slate-700">{contextLabel}</span></p>
              <textarea className={textareaClass} placeholder="พิมพ์ความเห็น/feedback ที่หน้านี้..." value={draft} onChange={(event) => setDraft(event.target.value)} />
              <div className="flex items-center justify-between">
                <button type="button" className="text-xs text-blue-700 hover:underline" onClick={onOpenCenter}>ดูทั้งหมด ({noteCount})</button>
                <Button
                  disabled={!draft.trim()}
                  onClick={() => {
                    onAddNote(draft, contextLabel);
                    setDraft("");
                    setOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4" /> บันทึก
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              <p className="text-sm text-slate-600">เข้าสู่ระบบก่อนเพื่อให้ความเห็น ระบบจะเก็บชื่อผู้ให้ feedback ไว้</p>
              <Button onClick={() => { setOpen(false); onOpenAuth(); }}><User className="h-4 w-4" /> เข้าสู่ระบบ / สมัคร</Button>
            </div>
          )}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-12 items-center gap-2 rounded-full bg-blue-700 px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-800"
      >
        <MessageSquare className="h-5 w-5" /> ความเห็น
        {noteCount > 0 ? <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-blue-700">{noteCount}</span> : null}
      </button>
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

type EditableNumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  value: number;
  onValueChange: (value: number) => void;
};

function EditableNumberInput({
  value,
  onValueChange,
  className = inputClass,
  onBlur,
  onFocus,
  ...props
}: EditableNumberInputProps) {
  const [draftValue, setDraftValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  // เก็บค่าระหว่างพิมพ์เป็น string เพื่อให้ผู้ใช้ลบ 0 ออกจนช่องว่างได้
  // แล้วค่อยส่งค่าตัวเลขกลับไปคำนวณเมื่อกรอกเป็นตัวเลขที่ถูกต้อง
  useEffect(() => {
    if (!isFocused) {
      setDraftValue(String(value));
    }
  }, [isFocused, value]);

  return (
    <input
      {...props}
      className={className}
      type="number"
      value={draftValue}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        const parsed = Number(draftValue);

        if (draftValue.trim() === "" || !Number.isFinite(parsed)) {
          setDraftValue(String(value));
        }

        onBlur?.(event);
      }}
      onChange={(event) => {
        const nextValue = event.target.value;
        setDraftValue(nextValue);

        if (nextValue.trim() === "") return;

        const parsed = Number(nextValue);
        if (Number.isFinite(parsed)) {
          onValueChange(parsed);
        }
      }}
    />
  );
}

function getSharedUsageWarehouseOptions() {
  const warehouseIdsWithUsage = new Set(peaMonthlyUsage.map((usage) => usage.warehouseId));

  // ใช้ WH master + monthly usage เป็น source กลางของตัวเลือกคลัง
  // เพื่อให้ Dashboard และหน้าการใช้ SKU เห็นรายการคลังชุดเดียวกันเสมอ
  return peaWarehouseMaster.filter((warehouse) => warehouseIdsWithUsage.has(warehouse.warehouseId));
}

function getSharedUsageRegionOptions() {
  const usageWarehouseOptions = getSharedUsageWarehouseOptions();

  // Region/เขต ต้องมาจาก WH master ชุดเดียวกับ usage ไม่ใช้ค่าคงที่คนละหน้า
  return Array.from(new Set(usageWarehouseOptions.map((warehouse) => warehouse.regionCode))).sort();
}

function getSharedUsageSkuOptions() {
  const skuIdsWithUsage = new Set(peaMonthlyUsage.map((usage) => usage.skuId));

  // SKU filter ใช้ SKU master ที่มี usage จริงเท่านั้น เพื่อป้องกันเลือกแล้วตารางว่างโดยไม่จำเป็น
  return peaSkuMaster.filter((sku) => skuIdsWithUsage.has(sku.skuId));
}

function getFilteredUsageWarehouseOptions(selectedRegionCode: string) {
  return getSharedUsageWarehouseOptions().filter((warehouse) => selectedRegionCode === "all" || warehouse.regionCode === selectedRegionCode);
}

function getSelectedUsageWarehouseIds(selectedRegionCode: string, selectedWarehouseId: string) {
  if (selectedWarehouseId !== "all") return [selectedWarehouseId];

  return getFilteredUsageWarehouseOptions(selectedRegionCode).map((warehouse) => warehouse.warehouseId);
}

function filterWarehouseUsageRows(rows: WarehouseUsageRow[], selectedSkuId: string, search: string) {
  const keyword = search.trim().toLowerCase();

  return rows
    .filter((row) => selectedSkuId === "all" || row.skuId === selectedSkuId)
    .filter((row) => {
      if (!keyword) return true;
      return `${row.skuId} ${row.skuName} ${row.category} ${row.warehouseLabel} ${row.regionLabel}`.toLowerCase().includes(keyword);
    });
}

function DashboardPage({
  openSku,
  requests,
  transferRequests,
  receiptDelayLogs,
  supplierOfferData,
  formulaPolicy,
  aiFeedbackLogs,
  budgetSettings,
  onOpenTransfer,
  onOpenTransferSku,
  onOpenStockIntelligence,
  onOpenAudit,
}: {
  openSku: (skuId: string) => void;
  requests: PurchaseRequest[];
  transferRequests: TransferRequest[];
  receiptDelayLogs: ReceiptDelayLog[];
  supplierOfferData: SupplierOffer[];
  formulaPolicy: FormulaPolicyState;
  aiFeedbackLogs: AiSuggestionFeedback[];
  budgetSettings: BudgetSettingsState;
  onOpenTransfer: () => void;
  onOpenTransferSku: (skuId: string) => void;
  onOpenStockIntelligence: () => void;
  onOpenAudit: () => void;
}) {
  const [selectedRegionCode, setSelectedRegionCode] = useState("all");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("all");
  const [selectedSkuId, setSelectedSkuId] = useState("all");
  const [dashboardSearch, setDashboardSearch] = useState("");
  const pendingCount = requests.filter((request) => request.status.startsWith("Pending")).length;
  const regionOptions = getSharedUsageRegionOptions();
  const warehouseOptions = getFilteredUsageWarehouseOptions(selectedRegionCode);
  const skuOptions = getSharedUsageSkuOptions();
  const selectedWarehouseIds = getSelectedUsageWarehouseIds(selectedRegionCode, selectedWarehouseId);
  const selectedWarehouseIdSet = new Set(selectedWarehouseIds);
  const dashboardUsageRows = filterWarehouseUsageRows(buildWarehouseUsageRows(selectedWarehouseIds), selectedSkuId, dashboardSearch);
  const dashboardSkuCount = dashboardUsageRows.length;
  const dashboardAnnualUsage = dashboardUsageRows.reduce((sum, row) => sum + row.total, 0);
  const dashboardKeyword = dashboardSearch.trim().toLowerCase();
  const filteredRelationshipRecords = peaRiskCoverageRecords.filter((record) => {
    const sku = peaSkuMaster.find((item) => item.skuId === record.skuId);
    const matchesWarehouse = selectedWarehouseIdSet.has(record.plantId);
    const matchesSku = selectedSkuId === "all" || record.skuId === selectedSkuId;
    const matchesSearch =
      !dashboardKeyword ||
      `${record.skuId} ${sku?.skuName ?? ""} ${sku?.category ?? ""} ${record.plantId} ${formatPeaRegionCode(record.regionCode)}`.toLowerCase().includes(dashboardKeyword);

    return matchesWarehouse && matchesSku && matchesSearch;
  });
  const filteredInventoryRecords = inventoryRecords.filter((record) => {
    const sku = getSku(record.skuId);
    const matchesWarehouse = selectedWarehouseIdSet.has(record.warehouseId);
    const matchesSku = selectedSkuId === "all" || resolvePeaSkuId(record.skuId) === selectedSkuId;
    const matchesSearch =
      !dashboardKeyword || `${record.skuId} ${resolvePeaSkuId(record.skuId)} ${sku.name} ${sku.category} ${record.warehouseId}`.toLowerCase().includes(dashboardKeyword);

    return matchesWarehouse && matchesSku && matchesSearch;
  });
  const riskCount = filteredRelationshipRecords.filter((record) => record.riskStatus.startsWith("Critical") || record.stockCoverPeriods < 1).length;
  const vmiCandidateCount = filteredRelationshipRecords.filter((record) => record.vmiScore >= 80).length;
  const aiFeedbackStats = buildAiFeedbackStats(aiFeedbackLogs);
  const relationshipCoveragePercent =
    peaRelationshipSummary.mergedSkuPlantKeys > 0
      ? (peaRelationshipSummary.stockUsageIntersectionKeys / peaRelationshipSummary.mergedSkuPlantKeys) * 100
      : 0;
  const topRelationshipRisk = [...filteredRelationshipRecords].sort((a, b) => a.stockCoverPeriods - b.stockCoverPeriods)[0];
  const selectedBudgetWarehouses = warehouses.filter((warehouse) => selectedWarehouseIdSet.has(warehouse.id));
  const localBudgetTotal = selectedBudgetWarehouses.reduce((sum, warehouse) => sum + (budgetSettings.localBudgets[warehouse.id] ?? warehouse.localBudget), 0);
  const budgetRegionKeys = Array.from(new Set(selectedBudgetWarehouses.map((warehouse) => warehouse.region))).filter(
    (region): region is BudgetRegion => region !== "National",
  );
  const regionalBudgetTotal = budgetRegionKeys.reduce((sum, region) => sum + (budgetSettings.regionalBudgets[region] ?? 0), 0);
  const regionalBudgetHelper = budgetRegionKeys.length > 0 ? budgetRegionKeys.map((region) => regionLabels[region]).join(", ") : "ไม่มีเขตงบประมาณในตัวกรอง";
  const transferSuggestions = buildTransferSuggestions(supplierOfferData, formulaPolicy);
  const stockIntelligenceRows = buildStockIntelligenceRows();
  const dashboardDeadStockCount = stockIntelligenceRows.filter((row) => row.status === "Dead Stock Candidate").length;
  const dashboardStockoutForecastCount = stockIntelligenceRows.filter((row) => row.status === "Stockout Risk").length;
  const openTransferCount = transferRequests.filter((request) => request.status === "Requested" || request.status === "Approved").length;
  const delayImpactTotal = receiptDelayLogs.reduce((sum, log) => sum + log.impactDemand, 0);
  const [dashTab, setDashTab] = useState<"overview" | "risk" | "budget">("overview");

  return (
    <>
      <PageTitle
        eyebrow="แดชบอร์ด"
        title="ภาพรวมความเสี่ยงสต็อกและคำแนะนำจัดซื้อ"
        subtitle="หน้าหลักสำหรับผู้ใช้งานคลังและฝ่ายจัดซื้อ ตรวจสอบความเสี่ยง งบประมาณ และงานที่รออนุมัติ"
      />

      <div className="mb-5">
        <DeadStockExchangeBanner onOpenTransfer={onOpenTransferSku} onOpenAudit={onOpenAudit} />
      </div>

      <Card className="mb-5 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Field label="ปีข้อมูล">
            <select className={inputClass} value="2026" onChange={() => undefined}>
              <option value="2026">ปีข้อมูล 2026</option>
            </select>
          </Field>
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
              <option value="all">ทุก SKU ที่มีข้อมูล usage</option>
              {skuOptions.map((sku) => (
                <option key={sku.skuId} value={sku.skuId}>
                  {sku.skuId} · {sku.skuName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="ค้นหา">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                className={`${inputClass} pl-9`}
                value={dashboardSearch}
                onChange={(event) => setDashboardSearch(event.target.value)}
                placeholder="ค้นหา SKU / คลัง"
              />
            </div>
          </Field>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          ตัวกรองชุดนี้ใช้ source กลางเดียวกับหน้า “การใช้ SKU”: `peaWarehouseMaster`, `peaSkuMaster` และ `peaMonthlyUsage` จาก Excel seed เพื่อให้ตัวเลือกเขต คลัง และ SKU ตรงกันทุกหน้า
        </p>
      </Card>

      <div className="mb-5 flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
        <button type="button" onClick={() => setDashTab("overview")} className={`rounded-md px-4 py-2 text-sm font-medium transition ${dashTab === "overview" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>ภาพรวม</button>
        <button type="button" onClick={() => setDashTab("risk")} className={`rounded-md px-4 py-2 text-sm font-medium transition ${dashTab === "risk" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>ความเสี่ยง &amp; ของจม</button>
        <button type="button" onClick={() => setDashTab("budget")} className={`rounded-md px-4 py-2 text-sm font-medium transition ${dashTab === "budget" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>งบประมาณ</button>
      </div>

      {dashTab === "overview" && (
      <>
      <Card className="mb-5 overflow-hidden border-blue-200">
        <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">Demo Scenario</span>
              <span className="text-sm font-medium text-slate-500">AI-assisted decision support</span>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-950">เริ่ม Demo Flow: สายเคเบิลใต้ดิน XLPE 240 ตร.มม. (1CC0CG0002)</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              ระบบแนะนำให้เติม 10 เมตร แต่ผู้ใช้ลองขอ 20 เมตร ระบบจะบังคับกรอกเหตุผล ตรวจงบ 3 ชั้น ส่งอนุมัติระดับเขต และเก็บบันทึกค่าคำนวณสำหรับตรวจสอบย้อนหลัง
            </p>
          </div>
          <div className="grid gap-2">
            <Button onClick={() => openSku("1CC0CG0002")}>
              <Sparkles className="h-4 w-4" />
              เริ่ม Demo Flow
            </Button>
            <p className="text-xs leading-5 text-slate-500">Dashboard → SKU Detail → Request → Approval → History → VMI</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="SKU ในตัวกรอง"
          value={String(dashboardSkuCount)}
          helper={`Usage รวม ${formatNumber(dashboardAnnualUsage, 0)}`}
          tone="slate"
          formula={`นับ SKU จาก monthly usage ที่ผ่านตัวกรอง = ${dashboardSkuCount} รายการ`}
          changes="เลือกเขต/คลัง/SKU ใหม่ หรือ import WH Season Data Item / SKU master ใหม่"
        />
        <MetricCard
          label="SKU/Plant เสี่ยง"
          value={String(riskCount)}
          helper="ต้องติดตาม"
          tone="red"
          formula={`นับ relationship record ที่ stock cover < 1 รอบ ตามตัวกรอง = ${riskCount} รายการ`}
          changes="เลือก filter ใหม่, import relationship analysis ใหม่ หรือข้อมูล stock/usage เปลี่ยน"
        />
        <MetricCard
          label="PR รออนุมัติ"
          value={String(pendingCount)}
          helper="รออนุมัติ"
          tone="blue"
          formula={`นับคำขอที่สถานะขึ้นต้นด้วย Pending = ${pendingCount} รายการ`}
          changes="ส่งคำขอใหม่ อนุมัติ ไม่อนุมัติ หรือส่งต่อส่วนกลาง"
        />
        <MetricCard
          label="SKU เหมาะกับ VMI"
          value={String(vmiCandidateCount)}
          helper="VMI score ≥ 80"
          tone="purple"
          formula={`นับ relationship record ที่ VMI Score ≥ 80 ตามตัวกรอง = ${vmiCandidateCount} รายการ`}
          changes="เลือก filter ใหม่ หรือข้อมูล demand stability, lead time และ stock coverage เปลี่ยน"
        />
      </div>

      </>
      )}

      {dashTab === "risk" && (
      <>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Transfer Candidate"
          value={String(transferSuggestions.length)}
          helper={`${openTransferCount} คำขอเปิดอยู่`}
          tone="blue"
          formula={`นับ SKU/คลังที่ปลายทางต่ำกว่า ROP และมีคลังต้นทางเหลือเกิน buffer 0.25 รอบ = ${transferSuggestions.length}`}
          changes="Stock, ROP, usage, Transfer request หรือ relationship analysis เปลี่ยน"
        />
        <MetricCard
          label="Dead/Slow Stock"
          value={String(dashboardDeadStockCount)}
          helper="stock cover ≥ 1.5 รอบ"
          tone="purple"
          formula={`นับ stock intelligence row ที่ stock cover ≥ 1.5 รอบ หรือ active period ต่ำ = ${dashboardDeadStockCount}`}
          changes="ข้อมูล stock/usage หรือ threshold dead stock เปลี่ยน"
        />
        <MetricCard
          label="เสี่ยงขาดตาม Season"
          value={String(dashboardStockoutForecastCount)}
          helper="seasonal stockout risk"
          tone="red"
          formula={`นับรายการที่ stock cover ต่ำกว่า 0.25 รอบ หรือ forecast หลัง season สูงสุดติดลบ = ${dashboardStockoutForecastCount}`}
          changes="usage ตาม season, stock หรือ filter เปลี่ยน"
        />
        <MetricCard
          label="Delay Impact"
          value={formatNumber(delayImpactTotal, 0)}
          helper={`${receiptDelayLogs.length} receiving logs`}
          tone="yellow"
          formula={`รวม impact demand จาก Delay Logs = Σ(Average Daily Demand × Delay Days) = ${formatNumber(delayImpactTotal, 0)}`}
          changes="บันทึกข้อมูลรับของเข้าคลังหรือสาเหตุ Delay ใหม่"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onOpenTransfer}><ArrowRightLeft className="h-4 w-4" /> ดูคำแนะนำโอน/ยืมก่อนซื้อ</Button>
        <Button variant="secondary" onClick={onOpenStockIntelligence}><Archive className="h-4 w-4" /> วิเคราะห์สต็อกและ Dead Stock</Button>
      </div>

      </>
      )}

      {dashTab === "budget" && (
      <>
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="งบคลังพื้นที่"
          value={formatTHB(localBudgetTotal)}
          helper={selectedBudgetWarehouses.length > 0 ? `${selectedBudgetWarehouses.length} คลังตามตัวกรอง` : "ไม่มีคลัง demo ในตัวกรอง"}
          formula={`รวมงบ Local ของคลัง demo ที่อยู่ในตัวกรอง = ${formatTHB(localBudgetTotal)}`}
          changes="แก้หน้า งบประมาณ หรือเลือกเขต/คลังบน Dashboard ใหม่"
        />
        <MetricCard
          label="งบระดับเขต"
          value={formatTHB(regionalBudgetTotal)}
          helper={regionalBudgetHelper}
          formula={`รวมงบ Regional ของเขตที่สัมพันธ์กับคลังในตัวกรอง = ${formatTHB(regionalBudgetTotal)}`}
          changes="แก้หน้า งบประมาณ หรือเลือกเขต/คลังบน Dashboard ใหม่"
        />
        <MetricCard
          label="งบส่วนกลาง"
          value={formatTHB(budgetSettings.centralBudgetRemaining)}
          helper="ส่วนกลางทั่วประเทศ"
          formula={`อ่านจาก Budget Settings: Central National = ${formatTHB(budgetSettings.centralBudgetRemaining)}`}
          changes="แก้หน้า งบประมาณ"
        />
      </div>

      </>
      )}

      {dashTab === "risk" && (
      <>
      <Card className="mt-5">
        <SectionHeader
          title="ภาพรวมความสัมพันธ์ข้อมูลจาก Excel"
          subtitle="สรุปจากไฟล์ inventory_relationship_analysis.xlsx เพื่อบอกว่า stock, usage และ lead time เชื่อมกันได้มากน้อยแค่ไหน"
        />
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Stock SKU/Plant"
            value={formatNumber(peaRelationshipSummary.stockSkuPlantKeys, 0)}
            helper={`${formatNumber(peaRelationshipSummary.stockRows, 0)} rows`}
            tone="slate"
            formula={`นับ SKU+Factory/Plant key ที่มี stock = ${formatNumber(peaRelationshipSummary.stockSkuPlantKeys, 0)} key จาก ${formatNumber(peaRelationshipSummary.stockRows, 0)} rows`}
            changes="import stock/batch data รอบใหม่ หรือแก้ mapping Factory/Plant"
          />
          <MetricCard
            label="Usage SKU/คลัง"
            value={formatNumber(peaRelationshipSummary.movingSkuPlantKeys, 0)}
            helper={`${formatNumber(peaRelationshipSummary.movingRows, 0)} rows`}
            tone="blue"
            formula={`นับ SKU+WH key ที่มี usage = ${formatNumber(peaRelationshipSummary.movingSkuPlantKeys, 0)} key จาก ${formatNumber(peaRelationshipSummary.movingRows, 0)} rows`}
            changes="import WH Season Data Item หรือปรับรหัสคลังพื้นที่"
          />
          <MetricCard
            label="เชื่อม Stock+Usage ได้"
            value={`${formatNumber(relationshipCoveragePercent, 1)}%`}
            helper={`${formatNumber(peaRelationshipSummary.stockUsageIntersectionKeys, 0)} keys จาก ${formatNumber(peaRelationshipSummary.mergedSkuPlantKeys, 0)}`}
            tone="green"
            formula={`${formatNumber(peaRelationshipSummary.stockUsageIntersectionKeys, 0)} / ${formatNumber(peaRelationshipSummary.mergedSkuPlantKeys, 0)} × 100 = ${formatNumber(relationshipCoveragePercent, 1)}%`}
            changes="มี mapping WH-Factory เพิ่ม หรือข้อมูล stock/usage ครบขึ้น"
          />
          <MetricCard
            label="Lead Time SKU"
            value={formatNumber(peaRelationshipSummary.leadTimeSkuKeys, 0)}
            helper={`${formatNumber(peaRelationshipSummary.leadTimeRows, 0)} rows`}
            tone="purple"
            formula={`นับ SKU+Factory/Plant key ที่มี Lead Time = ${formatNumber(peaRelationshipSummary.leadTimeSkuKeys, 0)} key จาก ${formatNumber(peaRelationshipSummary.leadTimeRows, 0)} rows`}
            changes="import LT Data/LT Analyst รอบใหม่"
          />
          <MetricCard
            label="Critical coverage"
            value={String(riskCount)}
            helper="stock cover < 1 รอบ"
            tone="red"
            formula={`นับรายการ relationship ที่ stock cover < 1 รอบ จากตัวกรองปัจจุบัน = ${riskCount} รายการ`}
            changes="filter, stock, usage เฉลี่ย หรือ relationship analysis ถูกอัปเดต"
          />
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

      </>
      )}

      {dashTab === "overview" && (
      <>
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <SectionHeader title="แจ้งเตือนสต็อกวิกฤต" subtitle="รายการที่สต็อกต่ำกว่าจุดสั่งซื้อใหม่ (Reorder Point) หรือระดับพัสดุสำรองปลอดภัย (Safety Stock)" />
          <DataTable columns={["SKU", "รายการ", "คลัง", "Stock", "จุดสั่งซื้อใหม่", "สถานะ", "ดำเนินการ"]} empty={filteredInventoryRecords.length === 0}>
            {filteredInventoryRecords.map((record) => {
              const sku = getSku(record.skuId);
              const warehouse = getWarehouse(record.warehouseId);
              const recommendation = getDefaultRecommendation(record, supplierOfferData, formulaPolicy);
              const calculatedStatus = getInventoryStatusFromRecommendation(record, recommendation);
              return (
                <tr key={`${record.skuId}-${record.warehouseId}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{sku.id}</td>
                  <td className="px-4 py-3 text-slate-700">{sku.name}</td>
                  <td className="px-4 py-3 text-slate-600">{warehouse.name}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNumber(record.currentStock)} {sku.unit}</td>
                  <td className="px-4 py-3 text-slate-700">{formatNumber(recommendation.reorderPoint)} {sku.unit}</td>
                  <td className="px-4 py-3"><StatusBadge status={calculatedStatus} /></td>
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
            <p>1CC0CG0002 (สายเคเบิล XLPE 240) ที่คลัง I010 อยู่ต่ำกว่าจุดสั่งซื้อใหม่ (Reorder Point) และมีงบคลังพื้นที่เพียง 25,000 บาท</p>
            <p>จาก relationship analysis พบว่า 1CC0CG0002 ที่ I010 มี stock cover ต่ำ และยังไม่พบ Lead Time เฉพาะ Factory/SKU จึงควรใช้ Lead Time จากซัพพลายเออร์เป็นค่าตั้งต้นใน PoC</p>
            <p>หากขอซื้อ 20 เมตรจาก S001 จะใช้เงิน 40,000 บาท จึงต้องส่งอนุมัติระดับเขต</p>
            <p>1CC0CG0002 มีความต้องการค่อนข้างสม่ำเสมอและซัพพลายเออร์มีความน่าเชื่อถือ 96% เหมาะสำหรับทดลอง VMI ระดับเขต</p>
          </div>
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="font-semibold text-slate-950">AI Accuracy Feedback</h4>
            {aiFeedbackStats.count > 0 ? (
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <p>มี feedback จริงแล้ว {aiFeedbackStats.count} รายการ · ค่า error เฉลี่ยแบบ absolute {formatNumber(aiFeedbackStats.meanAbsoluteErrorPercent, 1)}%</p>
                <p>Bias เฉลี่ย {formatPercent(aiFeedbackStats.averageBiasPercent)}: ค่าเป็นบวกหมายถึง AI แนะนำต่ำกว่าค่าจริง ค่าเป็นลบหมายถึง AI แนะนำสูงกว่าค่าจริง</p>
                <p className="text-xs text-slate-500">ถ้า error สูงกว่าเกณฑ์ใน Settings ระบบจะ auto-tune policy แบบก้าวเล็กและสร้างสูตรเวอร์ชันใหม่ โดยไม่แก้ snapshot เดิมย้อนหลัง</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                ยังไม่มี feedback ค่าจริง หลังอนุมัติหรือใช้งานจริงให้ไปที่หน้า History แล้วบันทึกจำนวนจริง ระบบจะเทียบกับ AI Suggested Quantity และใช้ error เพื่อ auto-tune สูตรเมื่อเกินเกณฑ์
              </p>
            )}
          </div>
          <Button className="mt-5 w-full" onClick={() => openSku("1CC0CG0002")}>
            <Boxes className="h-4 w-4" />
            เปิดรายละเอียด SKU C01
          </Button>
        </Card>
      </div>
      </>
      )}
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
  const [tab, setTab] = useState<"stock" | "usage">("stock");
  return (
    <>
      <PageTitle
        eyebrow="คลังพัสดุ"
        title="คลังพัสดุ & การใช้งาน SKU"
        subtitle="ดูสถานะสต็อก/คำแนะนำจัดซื้อ และประวัติการใช้รายเดือนของแต่ละคลังในที่เดียว"
      />
      <div className="mb-5 inline-flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
        <button type="button" onClick={() => setTab("stock")} className={`rounded-md px-4 py-2 text-sm font-medium transition ${tab === "stock" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>สถานะสต็อก</button>
        <button type="button" onClick={() => setTab("usage")} className={`rounded-md px-4 py-2 text-sm font-medium transition ${tab === "usage" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>การใช้งานรายเดือน</button>
      </div>
      {tab === "usage" ? (
        <WarehouseSkuUsagePage onOpenSku={openSku} embedded />
      ) : (
      <>
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="สต็อกปัจจุบัน"
          value="Stock"
          helper="คอลัมน์ในตาราง"
          formula="อ่านจาก Inventory/Stock balance ของคลังและ SKU นั้นโดยตรง"
          changes="มี stock movement, import stock ใหม่ หรือแก้ข้อมูลตั้งต้นของ SKU"
        />
        <MetricCard
          label="พัสดุสำรองปลอดภัย"
          value="Safety Stock"
          helper="สูตรความเสี่ยง"
          tone="green"
          formula="Safety Stock = Z-score × Demand Variability × √Adjusted Lead Time"
          changes="แก้ Service Level, Demand History, Lead Time, Seasonal Factor หรือ Budget Factor"
        />
        <MetricCard
          label="จุดสั่งซื้อใหม่"
          value="ROP"
          helper="จุดเริ่มจัดซื้อ"
          tone="red"
          formula="Reorder Point = Demand During Lead Time + Safety Stock"
          changes="Average Demand, Adjusted Lead Time หรือ Safety Stock เปลี่ยน"
        />
        <MetricCard
          label="จำนวนที่ระบบแนะนำ"
          value="AI Suggest"
          helper="ปัดตาม MOQ"
          tone="blue"
          formula="Suggested Quantity = Target Stock Level - Current Stock แล้วปัดขึ้นตาม MOQ"
          changes="Target Stock, Current Stock, MOQ หรือสูตรกลางใน Settings เปลี่ยน"
        />
      </div>
      <Card>
        <SectionHeader title="รายการความเสี่ยงในคลัง" subtitle="คลิกเปิดรายละเอียด SKU เพื่อดูตัวเลือกซัพพลายเออร์และวิธีคำนวณ" />
        <DataTable columns={["SKU", "รายการ", "คลัง", "สต็อกปัจจุบัน", "พัสดุสำรองปลอดภัย", "จุดสั่งซื้อใหม่", "จำนวนที่แนะนำ", "สถานะ", "ดำเนินการ"]}>
          {inventoryRecords.map((record) => {
            const sku = getSku(record.skuId);
            const warehouse = getWarehouse(record.warehouseId);
            const recommendation = getDefaultRecommendation(record, supplierOfferData, formulaPolicy);
            const calculatedStatus = getInventoryStatusFromRecommendation(record, recommendation);
            return (
              <tr key={`${record.skuId}-${record.warehouseId}`} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{sku.id}</td>
                <td className="px-4 py-3">{sku.name}</td>
                <td className="px-4 py-3">{warehouse.id} · {warehouse.name}</td>
                <td className="px-4 py-3">{formatNumber(record.currentStock)} {sku.unit}</td>
                <td className="px-4 py-3">{formatNumber(recommendation.safetyStock)} {sku.unit}</td>
                <td className="px-4 py-3">{formatNumber(recommendation.reorderPoint)} {sku.unit}</td>
                <td className="px-4 py-3 font-semibold text-blue-700">{formatNumber(recommendation.suggestedQuantity)} {sku.unit}</td>
                <td className="px-4 py-3"><StatusBadge status={calculatedStatus} /></td>
                <td className="px-4 py-3"><Button variant="secondary" onClick={() => openSku(record.skuId)}>รายละเอียด</Button></td>
              </tr>
            );
          })}
        </DataTable>
      </Card>
      </>
      )}
    </>
  );
}

function WarehouseSkuUsagePage({ onOpenSku, embedded = false }: { onOpenSku: (skuId: string) => void; embedded?: boolean }) {
  const regionOptions = getSharedUsageRegionOptions();
  const skuOptions = getSharedUsageSkuOptions();
  const [selectedRegionCode, setSelectedRegionCode] = useState("all");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("all");
  const [selectedSkuId, setSelectedSkuId] = useState("all");
  const [search, setSearch] = useState("");
  const warehouseOptions = getFilteredUsageWarehouseOptions(selectedRegionCode);
  const selectedWarehouseIds = getSelectedUsageWarehouseIds(selectedRegionCode, selectedWarehouseId);

  const rows = filterWarehouseUsageRows(buildWarehouseUsageRows(selectedWarehouseIds), selectedSkuId, search);

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
      {embedded ? null : (
        <PageTitle
          eyebrow="ข้อมูลการใช้จาก Excel"
          title="ปริมาณการใช้ SKU รายคลัง"
          subtitle="ดูประวัติการใช้รายเดือนจากชีต WH Season Data Item โดยแปลงข้อมูล Jan-Dec เป็น long format สำหรับคำนวณ demand"
        />
      )}
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
        <MetricCard
          label="เขต"
          value={regionScopeLabel}
          helper="จากชีต WH"
          tone="slate"
          formula={selectedRegionCode === "all" ? "แสดงทุก Region จากชีต WH" : `อ่าน Region จากชีต WH = ${regionScopeLabel}`}
          changes="เลือกเขตใหม่ หรือ import WH master ที่มี Region ใหม่"
        />
        <MetricCard
          label="ขอบเขตคลัง"
          value={warehouseScopeLabel}
          helper={warehouseScopeHelper}
          tone="slate"
          formula={selectedWarehouseId === "all" ? `นับคลังที่มี usage ตามตัวกรอง = ${selectedWarehouseIds.length} คลัง` : `เลือก WH Id = ${warehouseScopeLabel}`}
          changes="เลือกคลัง เปลี่ยนเขต หรือมี usage data ของคลังใหม่"
        />
        <MetricCard
          label="Usage รวมทั้งปี"
          value={formatNumber(annualTotal)}
          helper="หน่วยตาม SKU"
          tone="blue"
          formula={`ผลรวม Jan-Dec ของแถวที่ผ่านตัวกรอง = ${formatNumber(annualTotal)} หน่วยตาม SKU`}
          changes="เลือกเขต/คลัง/SKU หรือ import WH Season Data Item ใหม่"
        />
        <MetricCard
          label="SKU ที่มีการใช้"
          value={String(activeSkuCount)}
          helper={`${activeWarehouseCount} คลัง`}
          tone="green"
          formula={`นับ SKU ที่มี usage หลังกรอง = ${activeSkuCount} SKU ใน ${activeWarehouseCount} คลัง`}
          changes="filter หรือข้อมูล usage ราย SKU เปลี่ยน"
        />
        <MetricCard
          label="Season ที่ใช้สูงสุด"
          value={peakSeason.label}
          helper={`${peakSeason.helper} · เฉลี่ย ${formatNumber(seasonTotals[peakSeason.id])}`}
          tone="purple"
          formula={`เปรียบเทียบค่าเฉลี่ยแต่ละ season แล้วเลือกค่าสูงสุด = ${peakSeason.label} (${formatNumber(seasonTotals[peakSeason.id])})`}
          changes="usage รายเดือนหรือการเลือกคลัง/SKU เปลี่ยน"
        />
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
              <div className="mt-3 border-t border-slate-200 pt-3 text-xs leading-5 text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">คำนวณจริงจาก:</span> ผลรวมเดือน {season.months.map((month) => usageMonthLabels[month - 1]).join(", ")} / {season.months.length} = {formatNumber(seasonTotals[season.id])}
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-slate-800">เปลี่ยนเมื่อ:</span> เลือกเขต/คลัง/SKU ใหม่ หรือมี usage รายเดือนใหม่
                </p>
              </div>
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
        <DataTable columns={["เขต", "ขอบเขตคลัง", "SKU", "รายการ", "หมวดหมู่", "หน่วย", ...usageMonthTrendColumns, "รวม", "เฉลี่ย/เดือน", "เดือนสูงสุด", "ดำเนินการ"]} empty={rows.length === 0}>
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
              <td className="px-4 py-3"><Button variant="secondary" onClick={() => onOpenSku(row.skuId)}>ดู SKU</Button></td>
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

function TransferCenterPage({
  selectedSkuId,
  transferRequests,
  supplierOfferData,
  formulaPolicy,
  onOpenSku,
  onCreateTransfer,
  onUpdateTransfer,
}: {
  selectedSkuId: string;
  transferRequests: TransferRequest[];
  supplierOfferData: SupplierOffer[];
  formulaPolicy: FormulaPolicyState;
  onOpenSku: (skuId: string) => void;
  onCreateTransfer: (suggestion: TransferSuggestion, type: TransferType) => void;
  onUpdateTransfer: (id: string, status: TransferStatus, action: string, note?: string) => void;
}) {
  const [selectedPeaSkuId, setSelectedPeaSkuId] = useState(resolvePeaSkuId(selectedSkuId));
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("all");
  const [search, setSearch] = useState("");
  const keyword = search.trim().toLowerCase();
  const suggestions = buildTransferSuggestions(supplierOfferData, formulaPolicy)
    .filter((item) => selectedPeaSkuId === "all" || resolvePeaSkuId(item.skuId) === selectedPeaSkuId || item.skuId === selectedPeaSkuId)
    .filter((item) => selectedWarehouseId === "all" || item.destinationWarehouseId === selectedWarehouseId || item.sourceWarehouseId === selectedWarehouseId)
    .filter((item) => !keyword || `${item.skuId} ${item.skuName} ${item.sourceWarehouseId} ${item.destinationWarehouseId}`.toLowerCase().includes(keyword));
  const openTransfers = transferRequests.filter((request) => request.status === "Requested" || request.status === "Approved");
  const transferQuantityTotal = transferRequests.reduce((sum, request) => sum + request.quantity, 0);
  const topSuggestion = suggestions[0];
  const today = getDateInputValue();
  const analytics = analyzeTransfers(transferRequests, today);

  return (
    <>
      <PageTitle
        eyebrow="โอนย้าย / ยืมพัสดุ"
        title="Transfer & Borrow Center"
        subtitle="ตรวจว่าควรโอนหรือยืมจากคลังอื่นก่อนสร้างคำขอซื้อใหม่ ลด overstock และลดความเสี่ยงขาดสต็อกตาม season"
      />

      <Card className="mb-5 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="SKU">
            <select className={inputClass} value={selectedPeaSkuId} onChange={(event) => setSelectedPeaSkuId(event.target.value)}>
              <option value="all">ทุก SKU ที่มีข้อมูลเปรียบเทียบ</option>
              {getSharedUsageSkuOptions().map((sku) => (
                <option key={sku.skuId} value={sku.skuId}>{sku.skuId} · {sku.skuName}</option>
              ))}
            </select>
          </Field>
          <Field label="คลังต้นทาง/ปลายทาง">
            <select className={inputClass} value={selectedWarehouseId} onChange={(event) => setSelectedWarehouseId(event.target.value)}>
              <option value="all">ทุกคลัง</option>
              {getSharedUsageWarehouseOptions().map((warehouse) => (
                <option key={warehouse.warehouseId} value={warehouse.warehouseId}>{warehouse.warehouseId} · {warehouse.warehouseName}</option>
              ))}
            </select>
          </Field>
          <Field label="ค้นหา">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input className={`${inputClass} pl-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหา SKU / คลัง" />
            </div>
          </Field>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          label="Transfer Candidate"
          value={String(suggestions.length)}
          helper="รายการที่ควรตรวจ"
          tone="blue"
          formula={`นับรายการที่ปลายทางต่ำกว่า Reorder Point และมีคลังอื่นที่มี stock เหลือมากกว่า buffer ขั้นต่ำ = ${suggestions.length}`}
          changes="Stock, usage, Reorder Point, filter หรือ relationship analysis เปลี่ยน"
        />
        <MetricCard
          label="คำขอโอน/ยืมที่เปิดอยู่"
          value={String(openTransfers.length)}
          helper="Requested/Approved"
          tone="yellow"
          formula={`นับ transfer request ที่สถานะ Requested หรือ Approved = ${openTransfers.length}`}
          changes="สร้างคำขอโอนใหม่ อนุมัติ ปิดงาน หรือไม่อนุมัติ"
        />
        <MetricCard
          label="ปริมาณใน Transfer Log"
          value={formatNumber(transferQuantityTotal, 0)}
          helper="รวมทุกคำขอ"
          tone="green"
          formula={`ผลรวมจำนวนใน transfer history = ${formatNumber(transferQuantityTotal, 0)}`}
          changes="สร้างหรือแก้สถานะคำขอโอน/ยืม"
        />
        <MetricCard
          label="คำแนะนำหลัก"
          value={topSuggestion ? `${topSuggestion.sourceWarehouseId} → ${topSuggestion.destinationWarehouseId}` : "-"}
          helper={topSuggestion ? `${formatNumber(topSuggestion.suggestedQuantity)} ${topSuggestion.unit}` : "ยังไม่มี candidate"}
          tone="purple"
          formula={topSuggestion ? `เลือก candidate แรกจาก shortage ${formatNumber(topSuggestion.destinationShortage)} และ source excess ${formatNumber(topSuggestion.sourceExcess)} = ${formatNumber(topSuggestion.suggestedQuantity)} ${topSuggestion.unit}` : "ไม่มีรายการที่ผ่านเงื่อนไข"}
          changes="filter หรือข้อมูล stock/usage/ROP เปลี่ยน"
        />
      </div>

      <Card className="mt-5">
        <SectionHeader
          title="คำแนะนำโอนหรือยืมก่อนซื้อ"
          subtitle="Suggested Transfer = min(จำนวนที่ระบบแนะนำเติม, source excess) โดย source excess คำนวณจาก stock ต้นทางหลังกัน buffer usage อย่างน้อย 0.25 รอบ"
        />
        <DataTable columns={["SKU", "คลังปลายทาง", "ขาดเทียบ ROP", "คลังต้นทาง", "Stock ต้นทาง", "แนะนำโอน/ยืม", "Season", "เหตุผล", "ดำเนินการ"]} empty={suggestions.length === 0}>
          {suggestions.map((suggestion) => (
            <tr key={`${suggestion.skuId}-${suggestion.sourceWarehouseId}-${suggestion.destinationWarehouseId}`} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-900">{suggestion.skuId}<br /><span className="text-xs font-normal text-slate-500">{suggestion.skuName}</span></td>
              <td className="px-4 py-3">{suggestion.destinationWarehouseId}<br /><span className="text-xs text-slate-500">Stock {formatNumber(suggestion.destinationStock)} / ROP {formatNumber(suggestion.destinationReorderPoint)}</span></td>
              <td className="px-4 py-3 text-red-700">{formatNumber(suggestion.destinationShortage)} {suggestion.unit}</td>
              <td className="px-4 py-3">{suggestion.sourceWarehouseId}<br /><span className="text-xs text-slate-500">Cover {formatNumber(suggestion.sourceStockCoverPeriods, 2)} รอบ</span></td>
              <td className="px-4 py-3">{formatNumber(suggestion.sourceStock)} {suggestion.unit}</td>
              <td className="px-4 py-3 font-semibold text-blue-700">{formatNumber(suggestion.suggestedQuantity)} {suggestion.unit}</td>
              <td className="px-4 py-3">{suggestion.peakSeasonLabel}</td>
              <td className="min-w-80 px-4 py-3 text-sm leading-6 text-slate-600">{suggestion.decisionBasis}</td>
              <td className="px-4 py-3">
                <div className="grid min-w-36 gap-2">
                  <Button onClick={() => onCreateTransfer(suggestion, "Transfer")}>สร้างคำขอโอน</Button>
                  <Button variant="secondary" onClick={() => onCreateTransfer(suggestion, "Borrow")}>สร้างคำขอยืม</Button>
                  <Button variant="ghost" onClick={() => onOpenSku(suggestion.skuId)}>ดู SKU</Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>

      <Card className="mt-5">
        <SectionHeader
          title="วิเคราะห์พฤติกรรมการยืม-โอน-แลก"
          subtitle="ดูจากประวัติว่าใครยืมบ่อย ใครคืนช้า/เกินกำหนด ใครของขาดบ่อย และแลกอะไรบ่อย เพื่อวางแผนกระจายพัสดุให้ดีขึ้น"
        />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="ยืมที่ยังไม่คืน"
            value={String(analytics.outstandingCount)}
            helper={`เกินกำหนด ${analytics.overdueCount} รายการ`}
            tone={analytics.overdueCount > 0 ? "red" : "yellow"}
            formula={`นับคำขอยืมที่อนุมัติแล้วและยังไม่มีวันคืน = ${analytics.outstandingCount} (เกินกำหนด = วันนี้เลย dueDate แล้ว = ${analytics.overdueCount})`}
            changes="มีการยืมใหม่ คืนของ หรือเลยกำหนดคืน"
          />
          <MetricCard
            label="คืนแล้ว"
            value={String(analytics.returnedCount)}
            helper="คำขอยืมที่บันทึกวันคืน"
            tone="green"
            formula={`นับคำขอยืมที่มี returnedDate = ${analytics.returnedCount}`}
            changes="บันทึกการคืนของที่ยืม"
          />
          <MetricCard
            label="แลกเปลี่ยนทั้งหมด"
            value={String(analytics.swapCount)}
            helper="ครั้งที่แลกพัสดุข้ามคลัง"
            tone="purple"
            formula={`นับรายการประเภทแลกเปลี่ยน = ${analytics.swapCount}`}
            changes="สร้างรายการแลกเปลี่ยนใหม่"
          />
          <MetricCard
            label="แลกอะไรบ่อยสุด"
            value={analytics.topSwapName ?? "-"}
            helper={analytics.topSwapName ? `${analytics.topSwapCount} ครั้ง` : "ยังไม่มีการแลก"}
            tone="blue"
            formula={analytics.topSwapName ? `SKU ที่ถูกแลกบ่อยสุด = ${analytics.topSwapName} (${analytics.topSwapCount} ครั้ง)` : "ยังไม่มีข้อมูลการแลก"}
            changes="มีการแลกเปลี่ยน SKU ใหม่"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 p-4 lg:grid-cols-3">
          <TransferLeaderList title="คลังที่ยืมบ่อยสุด" unit="ครั้งที่ยืม" rows={analytics.borrowLeaders} tone="amber" emptyText="ยังไม่มีการยืม" />
          <TransferLeaderList title="คลังที่ค้างคืน/เกินกำหนด" unit="รายการเกินกำหนด" rows={analytics.overdueLeaders} tone="red" emptyText="ไม่มีรายการเกินกำหนด" />
          <TransferLeaderList title="คลังที่ของขาดบ่อย" unit="ครั้งที่ต้องยืม/รับโอน" rows={analytics.shortageLeaders} tone="blue" emptyText="ยังไม่มีข้อมูล" />
        </div>
      </Card>

      <Card className="mt-5">
        <SectionHeader title="ประวัติคำขอโอน/ยืม/แลก" subtitle="ทุกคำขอถูกเก็บเป็น persistent JSON state เพื่อใช้ตรวจสอบย้อนหลังใน PoC พร้อมสถานะการคืนสำหรับการยืม" />
        <DataTable columns={["Request", "ประเภท", "SKU", "เส้นทาง", "จำนวน", "สถานะ", "การคืน", "เหตุผล", "Timeline", "Action"]} empty={transferRequests.length === 0}>
          {transferRequests.map((request) => (
            <tr key={request.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-900">{request.id}<br /><span className="text-xs font-normal text-slate-500">{request.createdAt}</span></td>
              <td className="px-4 py-3">{getTransferTypeLabel(request.type)}</td>
              <td className="px-4 py-3">{request.skuId}<br /><span className="text-xs text-slate-500">{request.skuName}{request.type === "Swap" && request.counterpartSkuName ? ` ⇄ ${request.counterpartSkuName}` : ""}</span></td>
              <td className="px-4 py-3">{request.sourceWarehouseId} → {request.destinationWarehouseId}</td>
              <td className="px-4 py-3">{formatNumber(request.quantity)} {request.unit}</td>
              <td className="px-4 py-3"><TransferStatusBadge status={request.status} /></td>
              <td className="px-4 py-3">
                <BorrowReturnBadge state={getBorrowReturnState(request, today)} />
                {request.type === "Borrow" && request.dueDate ? <div className="mt-1 text-xs text-slate-400">{request.returnedDate ? `คืน ${request.returnedDate}` : `กำหนด ${request.dueDate}`}</div> : null}
              </td>
              <td className="min-w-72 px-4 py-3 text-sm leading-6 text-slate-600">{request.decisionBasis}</td>
              <td className="min-w-72 px-4 py-3 text-xs leading-5 text-slate-500">
                {request.timeline.map((item) => `${item.date}: ${item.action}`).join(" / ")}
              </td>
              <td className="px-4 py-3">
                <div className="grid min-w-36 gap-2">
                  <Button variant="secondary" disabled={request.status !== "Requested"} onClick={() => onUpdateTransfer(request.id, "Approved", "อนุมัติคำขอโอน/ยืม")}>อนุมัติ</Button>
                  <Button disabled={request.status !== "Approved"} onClick={() => onUpdateTransfer(request.id, "Completed", "ปิดงานและรับเข้าคลังปลายทาง")}>ปิดงาน</Button>
                  <Button variant="danger" disabled={request.status === "Completed" || request.status === "Rejected"} onClick={() => onUpdateTransfer(request.id, "Rejected", "ไม่อนุมัติคำขอ")}>ไม่อนุมัติ</Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </>
  );
}

function StockIntelligencePage({
  aiFeedbackLogs,
  receiptDelayLogs,
  onOpenSku,
}: {
  aiFeedbackLogs: AiSuggestionFeedback[];
  receiptDelayLogs: ReceiptDelayLog[];
  onOpenSku: (skuId: string) => void;
}) {
  const [selectedRegionCode, setSelectedRegionCode] = useState("all");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("all");
  const [selectedSkuId, setSelectedSkuId] = useState("all");
  const [search, setSearch] = useState("");
  const keyword = search.trim().toLowerCase();
  const warehouseIds = new Set(getSelectedUsageWarehouseIds(selectedRegionCode, selectedWarehouseId));
  const rows = buildStockIntelligenceRows()
    .filter((row) => warehouseIds.has(row.warehouseId))
    .filter((row) => selectedSkuId === "all" || row.skuId === selectedSkuId)
    .filter((row) => !keyword || `${row.skuId} ${row.skuName} ${row.category} ${row.warehouseId}`.toLowerCase().includes(keyword));
  const stockoutCount = rows.filter((row) => row.status === "Stockout Risk").length;
  const transferSourceCount = rows.filter((row) => row.status === "Transfer Source").length;
  const deadStockCount = rows.filter((row) => row.status === "Dead Stock Candidate").length;
  const projectedImpactTotal = rows.filter((row) => row.projectedAfterPeakSeason < 0).reduce((sum, row) => sum + Math.abs(row.projectedAfterPeakSeason), 0);
  const aiStats = buildAiFeedbackStats(aiFeedbackLogs);
  const avgDelay = receiptDelayLogs.length > 0 ? receiptDelayLogs.reduce((sum, log) => sum + log.delayDays, 0) / receiptDelayLogs.length : 0;

  return (
    <>
      <PageTitle
        eyebrow="วิเคราะห์สต็อก"
        title="Stock & Season Intelligence"
        subtitle="เทียบสต็อก SKU รายคลัง ดู Dead/Slow Stock และคาดการณ์ขาดสต็อกตาม season เพื่อช่วยตัดสินใจโอน ยืม หรือสั่งซื้อ"
      />

      <Card className="mb-5 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="เขตจากชีต WH">
            <select className={inputClass} value={selectedRegionCode} onChange={(event) => { setSelectedRegionCode(event.target.value); setSelectedWarehouseId("all"); }}>
              <option value="all">ทุกเขต</option>
              {getSharedUsageRegionOptions().map((regionCode) => <option key={regionCode} value={regionCode}>{formatPeaRegionCode(regionCode)}</option>)}
            </select>
          </Field>
          <Field label="WH Id">
            <select className={inputClass} value={selectedWarehouseId} onChange={(event) => setSelectedWarehouseId(event.target.value)}>
              <option value="all">ทุกคลัง</option>
              {getFilteredUsageWarehouseOptions(selectedRegionCode).map((warehouse) => (
                <option key={warehouse.warehouseId} value={warehouse.warehouseId}>{warehouse.warehouseId} · {warehouse.warehouseName}</option>
              ))}
            </select>
          </Field>
          <Field label="SKU">
            <select className={inputClass} value={selectedSkuId} onChange={(event) => setSelectedSkuId(event.target.value)}>
              <option value="all">ทุก SKU</option>
              {getSharedUsageSkuOptions().map((sku) => <option key={sku.skuId} value={sku.skuId}>{sku.skuId} · {sku.skuName}</option>)}
            </select>
          </Field>
          <Field label="ค้นหา">
            <input className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหา SKU / รายการ / คลัง" />
          </Field>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="เสี่ยงขาดตาม Season"
          value={String(stockoutCount)}
          helper="Stockout Risk"
          tone="red"
          formula={`นับรายการที่ stock cover ต่ำกว่า 0.25 รอบ หรือ stock หลังหัก demand season สูงสุดติดลบ = ${stockoutCount}`}
          changes="stock, usage season หรือ filter เปลี่ยน"
        />
        <MetricCard
          label="คลังต้นทางที่ช่วยโอนได้"
          value={String(transferSourceCount)}
          helper="Transfer Source"
          tone="blue"
          formula={`นับรายการที่ stock ยังเกิน buffer 0.25 รอบและเหมาะพิจารณาเป็นต้นทางโอน = ${transferSourceCount}`}
          changes="stock หรือ average usage เปลี่ยน"
        />
        <MetricCard
          label="Dead/Slow Stock"
          value={String(deadStockCount)}
          helper="stock cover ≥ 1.5 รอบ"
          tone="purple"
          formula={`นับรายการที่ stock cover ≥ 1.5 รอบ หรือ active period ต่ำมาก = ${deadStockCount}`}
          changes="stock, usage หรือเกณฑ์ dead stock เปลี่ยน"
        />
        <MetricCard
          label="ผลกระทบ forecast shortage"
          value={formatNumber(projectedImpactTotal, 0)}
          helper="หน่วยรวมตาม SKU"
          tone="yellow"
          formula={`รวม absolute shortage หลังหัก demand ของ season สูงสุดจากทุกรายการ = ${formatNumber(projectedImpactTotal, 0)}`}
          changes="season demand หรือ stock เปลี่ยน"
        />
        <MetricCard
          label="Forecast Error / Delay"
          value={aiStats.count > 0 ? `${formatNumber(aiStats.meanAbsoluteErrorPercent, 1)}%` : `${formatNumber(avgDelay, 1)} วัน`}
          helper={aiStats.count > 0 ? "MAE จาก AI Feedback" : "Avg delay จากรับของ"}
          tone="green"
          formula={aiStats.count > 0 ? `เฉลี่ย |error percent| จาก feedback ${aiStats.count} รายการ = ${formatNumber(aiStats.meanAbsoluteErrorPercent, 1)}%` : `เฉลี่ย Delay จาก log รับของ ${receiptDelayLogs.length} รายการ = ${formatNumber(avgDelay, 1)} วัน`}
          changes="บันทึก AI Feedback หรือ Receiving Delay ใหม่"
        />
      </div>

      <Card className="mt-5">
        <SectionHeader title="ตารางเทียบ Stock / Season / Dead Stock รายคลัง" subtitle="ใช้ตัดสินใจว่าควรยืม/โอนจากคลังใด หรือควรสร้างคำขอซื้อใหม่" />
        <DataTable columns={["เขต", "คลัง", "SKU", "Stock", "Avg Usage/เดือน", "Stock Cover", "Season สูงสุด", "คาดการณ์หลัง Season", "สถานะ", "ดำเนินการ"]} empty={rows.length === 0}>
          {rows.map((row) => (
            <tr key={`${row.warehouseId}-${row.skuId}`} className="hover:bg-slate-50">
              <td className="px-4 py-3">{row.regionLabel}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{row.warehouseId}</td>
              <td className="px-4 py-3">{row.skuId}<br /><span className="text-xs text-slate-500">{row.skuName}</span></td>
              <td className="px-4 py-3">{formatNumber(row.stockQty)} {row.unit}</td>
              <td className="px-4 py-3">{formatNumber(row.averageMonthlyUsage)} {row.unit}</td>
              <td className="px-4 py-3">{formatNumber(row.stockCoverPeriods, 2)} รอบ</td>
              <td className="px-4 py-3">{row.peakSeasonLabel}<br /><span className="text-xs text-slate-500">Demand {formatNumber(row.peakSeasonDemand)}</span></td>
              <td className={`px-4 py-3 font-semibold ${row.projectedAfterPeakSeason < 0 ? "text-red-700" : "text-emerald-700"}`}>{formatNumber(row.projectedAfterPeakSeason)} {row.unit}</td>
              <td className="px-4 py-3"><StockIntelligenceStatusBadge status={row.status} /></td>
              <td className="px-4 py-3"><Button variant="secondary" onClick={() => onOpenSku(getShortSkuIdFromPeaSku(row.skuId))}>ดู SKU</Button></td>
            </tr>
          ))}
        </DataTable>
      </Card>
    </>
  );
}

function GotchaBadge({ flag }: { flag: GotchaFlag }) {
  const className: Record<GotchaFlag, string> = {
    "repeat-buy": "bg-red-50 text-red-700 ring-red-200",
    "spend-to-keep": "bg-amber-50 text-amber-700 ring-amber-200",
    "over-peer": "bg-violet-50 text-violet-700 ring-violet-200",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className[flag]}`}>{gotchaFlagLabel[flag]}</span>;
}

// แบนเนอร์ hero "ตลาดนัดเคลียร์ของจม" — โชว์ของจมที่ยืม/แลกได้ ใช้บนสุดของ Dashboard
function DeadStockExchangeBanner({ onOpenTransfer, onOpenAudit }: { onOpenTransfer: (skuId: string) => void; onOpenAudit: () => void }) {
  const listings = getDeadStockListings();
  const totalValue = getTotalDeadStockValue();
  const borrowableCount = listings.filter((item) => item.matchWarehouseId).length;
  if (listings.length === 0) return null;

  return (
    <Card className="overflow-hidden border-violet-200 ring-1 ring-violet-200">
      <div className="grid grid-cols-1 gap-4 bg-brand-violet px-5 py-4 text-white sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Megaphone className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight">ตลาดนัดเคลียร์ของจม · Dead Stock Exchange</p>
            <p className="mt-0.5 text-sm text-white/80">ของพร้อมแบ่งปันจากคลังเพื่อนบ้าน — ยืม/แลกก่อนตั้งงบซื้อใหม่ · ยืม/แลกได้ทันที {borrowableCount} รายการ</p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-0">
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-white/80">ทุนจมรวมที่เคลียร์ได้</p>
            <p className="text-2xl font-extrabold leading-none">{formatTHB(totalValue)}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {listings.slice(0, 4).map((item) => (
          <div key={item.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {item.skuName} <span className="font-normal text-slate-400">· {item.skuId}</span>
                <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">ไม่ขยับ {item.monthsIdle} เดือน</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                คลัง {item.warehouseId} · {formatNumber(item.qty, 0)} {item.unit} · ทุนจม {formatTHB(item.value)}
                {item.matchWarehouseId ? <span className="font-medium text-emerald-700"> · คลัง {item.matchWarehouseId} กำลังขาด {formatNumber(item.matchShortageQty ?? 0, 0)} {item.unit}</span> : null}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant={item.matchWarehouseId ? "success" : "secondary"} onClick={() => onOpenTransfer(item.skuId)}>
                <Recycle className="h-4 w-4" /> {item.matchWarehouseId ? "ยืม/แลกเลย" : "หาผู้รับโอน"}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
        <p className="text-xs text-slate-500">คำนวณจริงจาก: จำนวนของจม × ต้นทุนต่อหน่วย · เปลี่ยนเมื่อ: ของจม/ราคา หรือมีการยืม-โอน</p>
        <Button variant="secondary" onClick={onOpenAudit}>
          <Scale className="h-4 w-4" /> ตรวจซื้อซ้ำ-ของจม ทุกคลัง
        </Button>
      </div>
    </Card>
  );
}

// การ์ดดักตอนจะสร้างคำขอซื้อ — ถ้า SKU นี้มีของจมที่คลังอื่น เสนอยืมแทนการซื้อใหม่
function DeadStockBorrowAlert({
  skuId,
  warehouseId,
  requestedQuantity,
  unitPrice,
  onOpenTransfer,
}: {
  skuId: string;
  warehouseId: string;
  requestedQuantity: number;
  unitPrice: number;
  onOpenTransfer: (skuId: string) => void;
}) {
  const deadElsewhere = findDeadStockForSkuElsewhere(skuId, warehouseId);
  if (!deadElsewhere) return null;

  const potentialSaving = Math.max(0, requestedQuantity) * Math.max(0, unitPrice);

  return (
    <div className="rounded-md border border-red-300 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-800">เบรกก่อนตั้งงบซื้อ! ของนี้มีอยู่แล้วที่คลังเพื่อนบ้าน</p>
          <p className="mt-1 text-sm text-slate-700">
            กำลังจะสั่งซื้อ {deadElsewhere.skuName} {formatNumber(requestedQuantity, 0)} {deadElsewhere.unit}
            {potentialSaving > 0 ? <> ({formatTHB(potentialSaving)})</> : null} — แต่คลัง {deadElsewhere.warehouseId} มีของจม {formatNumber(deadElsewhere.qty, 0)} {deadElsewhere.unit} (ไม่ขยับ {deadElsewhere.monthsIdle} เดือน) ยืมได้ทันที
          </p>
          <div className="mt-3">
            <Button variant="danger" onClick={() => onOpenTransfer(skuId)}>
              <Recycle className="h-4 w-4" /> ขอยืมจาก {deadElsewhere.warehouseId} แทนการซื้อ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetRequestDetailModal({
  record,
  onClose,
  onOpenSku,
  onOpenTransfer,
}: {
  record: BudgetRequestWithFlags;
  onClose: () => void;
  onOpenSku: (skuId: string) => void;
  onOpenTransfer: (skuId: string) => void;
}) {
  const deadForSku = getDeadStockForSku(record.skuId);
  const history = getBudgetHistoryForWarehouseSku(record.warehouseId, record.skuId);
  const peerRatio = record.peerAverageAmount > 0 ? record.amount / record.peerAverageAmount : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">ใบของบ · {record.id}</p>
            <h3 className="mt-0.5 text-lg font-bold text-slate-950">
              ปีงบ {record.fiscalYear} · {record.skuName}
            </h3>
            <p className="text-sm text-slate-500">คลัง {record.warehouseId} · {record.regionLabel} · {record.category}</p>
          </div>
          <button type="button" className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose} aria-label="ปิด">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          {record.flags.length > 0 ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="flex flex-wrap gap-1.5">
                {record.flags.map((flag) => (
                  <GotchaBadge key={flag} flag={flag} />
                ))}
              </div>
              <ul className="mt-2 space-y-1">
                {record.flagNotes.map((note, index) => (
                  <li key={index} className="text-sm text-red-800">• {note}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">ใบของบนี้ไม่ติด flag — ของบตาม demand จริง ไม่มีของจมค้าง</div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">จำนวนที่ของบ</p><p className="text-base font-semibold text-slate-900">{formatNumber(record.requestedQty, 0)} {record.unit}</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">ต้นทุน/หน่วย</p><p className="text-base font-semibold text-slate-900">{formatTHB(record.unitCost)}</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">มูลค่างบ</p><p className="text-base font-semibold text-slate-900">{formatTHB(record.amount)}</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">เทียบคลังอื่น</p><p className={`text-base font-semibold ${peerRatio >= procurementThresholds.overPeerRatio ? "text-violet-700" : "text-slate-900"}`}>{peerRatio > 0 ? `${peerRatio.toFixed(1)}×` : "—"}</p></div>
          </div>
          {record.note ? <p className="text-sm text-slate-600">หมายเหตุ: {record.note}</p> : null}

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">ประวัติการของบ {record.skuId} ของคลังนี้ (ย้อนหลัง)</p>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-3 py-2">ปีงบ</th><th className="px-3 py-2">จำนวน</th><th className="px-3 py-2">มูลค่างบ</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((row) => (
                    <tr key={row.id} className={row.fiscalYear === record.fiscalYear ? "bg-amber-50" : ""}>
                      <td className="px-3 py-2 font-medium">{row.fiscalYear}{row.fiscalYear === record.fiscalYear ? " (ใบนี้)" : ""}</td>
                      <td className="px-3 py-2">{formatNumber(row.requestedQty, 0)} {row.unit}</td>
                      <td className="px-3 py-2">{formatTHB(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {history.length >= 2 ? <p className="mt-1.5 text-xs text-slate-500">ของบ SKU เดียวกัน {history.length} ปีติด — ดูว่าซื้อซ้ำต่อเนื่องหรือไม่</p> : null}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">ของจม {record.skuId} ที่ยังค้างอยู่ในระบบ</p>
            {deadForSku.length === 0 ? (
              <p className="text-sm text-slate-500">ไม่พบของจมของ SKU นี้</p>
            ) : (
              <ul className="space-y-2">
                {deadForSku.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">คลัง {item.warehouseId} · {formatNumber(item.qty, 0)} {item.unit}</p>
                      <p className="text-xs text-slate-500">ไม่ขยับ {item.monthsIdle} เดือน · ทุนจม {formatTHB(item.value)}{item.matchWarehouseId ? ` · คลัง ${item.matchWarehouseId} กำลังขาด` : ""}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{formatTHB(item.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <Button variant="secondary" onClick={() => onOpenSku(record.skuId)}>ดูหน้า SKU</Button>
          <Button variant="success" onClick={() => onOpenTransfer(record.skuId)}><Recycle className="h-4 w-4" /> ดูทางเลือกโอน/ยืม</Button>
          <Button onClick={onClose}>ปิด</Button>
        </div>
      </div>
    </div>
  );
}

function ProcurementAuditPage({
  onOpenSku,
  onOpenTransfer,
}: {
  onOpenSku: (skuId: string) => void;
  onOpenTransfer: (skuId: string) => void;
}) {
  const allRequests = analyzeBudgetRequests();
  const deadListings = getDeadStockListings();
  const totalDeadValue = getTotalDeadStockValue();
  const gotchaCount = getGotchaCaseCount();
  const warehouseSummaries = getWarehouseProcurementSummaries();
  const spendToKeepCount = warehouseSummaries.filter((row) => row.spendToKeep).length;

  const regionOptions = Array.from(new Set(allRequests.map((record) => record.regionLabel)));
  const categoryOptions = Array.from(new Set(allRequests.map((record) => record.category)));

  const [yearFilter, setYearFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BudgetRequestWithFlags | null>(null);

  const filteredRequests = allRequests
    .filter((record) => yearFilter === "all" || record.fiscalYear === yearFilter)
    .filter((record) => regionFilter === "all" || record.regionLabel === regionFilter)
    .filter((record) => categoryFilter === "all" || record.category === categoryFilter)
    .filter((record) => !flaggedOnly || record.flags.length > 0);

  return (
    <>
      <SectionHeader
        title="ตรวจซื้อซ้ำ-ของจม · Procurement Audit"
        subtitle="เก็บทุกการของบ/สั่งซื้อย้อนหลัง 3 ปีงบ เทียบรายคลัง เพื่อจับเคส 'ของบซื้อซ้ำทั้งที่ของยังจม' และเร่งใช้งบให้หมด"
      />

      <Card>
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-700">
            แนวคิด: ถ้าจัดซื้อแม่นและตรวจสอบได้ ของจมต้องลดลง หน้านี้ใช้ <b>เปรียบเทียบย้อนหลัง</b> ว่าคลังไหนยังของบซื้อของที่ตัวเองมีจมอยู่ หรือเร่งใช้งบปลายปีจนเกิดของจมรอบใหม่ · กดที่แถวเพื่อดูรายละเอียดใบของบ
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <MetricCard
            label="มูลค่าของจมรวม"
            value={formatTHB(totalDeadValue)}
            helper={`${deadListings.length} รายการของจม`}
            tone="red"
            formula={`ผลรวม (จำนวนของจม × ต้นทุนต่อหน่วย) ของทุกรายการ = ${formatTHB(totalDeadValue)}`}
            changes="ข้อมูลของจมหรือต้นทุนต่อหน่วยเปลี่ยน"
          />
          <MetricCard
            label="เคสที่ควรทบทวน"
            value={String(gotchaCount)}
            helper="รายการของบที่ติด flag"
            tone="yellow"
            formula={`นับรายการของบที่เข้าเกณฑ์อย่างน้อย 1 flag (ซื้อซ้ำของจม / เร่งใช้งบ / งบสูงกว่าคลังอื่น) = ${gotchaCount}`}
            changes="ข้อมูลการของบ ของจม หรือเกณฑ์ flag เปลี่ยน"
          />
          <MetricCard
            label="คลังเข้าข่ายเร่งใช้งบ"
            value={String(spendToKeepCount)}
            helper={`ใช้งบ ≥ ${Math.round(procurementThresholds.spendToKeepUsageRatio * 100)}% + ของจมเพิ่ม`}
            tone="purple"
            formula={`นับคลังที่ปีล่าสุดใช้งบ ≥ ${Math.round(procurementThresholds.spendToKeepUsageRatio * 100)}% ของที่จัดสรร และมูลค่าของจมเพิ่มจากปีแรก = ${spendToKeepCount}`}
            changes="งบจัดสรร/ใช้จริง หรือมูลค่าของจมรายปีเปลี่ยน"
          />
        </div>
      </Card>

      <Card className="mt-6">
        <SectionHeader
          title="เทียบคลัง: งบ vs ของจม (ปีงบล่าสุด)"
          subtitle="คลังที่ใช้งบเกือบเต็มแต่ของจมยังโตเร็ว = สัญญาณซื้อของไม่ตรง demand"
        />
        <DataTable columns={["คลัง", "เขต", "ใช้งบปีล่าสุด", "มูลค่าของจม", "แนวโน้มของจม", "สถานะ"]} empty={warehouseSummaries.length === 0}>
          {warehouseSummaries.map((row) => {
            const usedPct = Math.min(100, Math.round(row.budgetUsedPercent));
            const hot = row.budgetUsedPercent >= procurementThresholds.spendToKeepUsageRatio * 100;
            return (
              <tr key={row.warehouseId} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{row.warehouseId}</td>
                <td className="px-4 py-3">{row.regionLabel}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                      <div className={`h-full rounded-full ${hot ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${usedPct}%` }} />
                    </div>
                    <span className={`text-xs font-semibold ${hot ? "text-amber-700" : "text-slate-600"}`}>{usedPct}%</span>
                  </div>
                  <span className="text-xs text-slate-500">{formatTHB(row.budgetUsed)} / {formatTHB(row.budgetAllocated)}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-red-700">{formatTHB(row.deadStockValueLatest)}</td>
                <td className={`px-4 py-3 font-semibold ${row.deadStockTrendPercent > 0 ? "text-red-600" : "text-emerald-700"}`}>
                  <span className="inline-flex items-center gap-1">
                    {row.deadStockTrendPercent > 0 ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                    {row.deadStockTrendPercent > 0 ? "+" : ""}{formatNumber(row.deadStockTrendPercent, 0)}%
                  </span>
                  <br /><span className="text-xs font-normal text-slate-500">เทียบปีแรก</span>
                </td>
                <td className="px-4 py-3">
                  {row.spendToKeep ? <GotchaBadge flag="spend-to-keep" /> : <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">ปกติ</span>}
                </td>
              </tr>
            );
          })}
        </DataTable>
        <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          คำนวณจริงจาก: งบจัดสรร/ใช้จริงปีล่าสุด และมูลค่าของจมปลายปี · เปลี่ยนเมื่อ: seed งบหรือของจมรายปีเปลี่ยน
        </p>
      </Card>

      <Card className="mt-6">
        <SectionHeader
          title="ประวัติการของบ + จุดที่ควรทบทวน"
          subtitle="กดที่แถวเพื่อดูรายละเอียดใบของบ เหตุผล flag ของจมที่เกี่ยว และประวัติย้อนหลัง"
        />
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 px-4 py-3">
          <Field label="ปีงบ">
            <select className={inputClass} value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
              <option value="all">ทุกปีงบ</option>
              {fiscalYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </Field>
          <Field label="เขต">
            <select className={inputClass} value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
              <option value="all">ทุกเขต</option>
              {regionOptions.map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
          </Field>
          <Field label="หมวดพัสดุ">
            <select className={inputClass} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">ทุกหมวด</option>
              {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </Field>
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 text-sm text-slate-700">
            <input type="checkbox" checked={flaggedOnly} onChange={(event) => setFlaggedOnly(event.target.checked)} />
            เฉพาะที่ติด flag
          </label>
          <span className="ml-auto text-sm text-slate-500">{filteredRequests.length} รายการ</span>
        </div>
        <DataTable columns={["ปีงบ", "คลัง", "SKU", "จำนวน", "มูลค่างบ", "flag", "รายละเอียด"]} empty={filteredRequests.length === 0}>
          {filteredRequests.map((record) => (
            <tr key={record.id} className={`cursor-pointer hover:bg-blue-50 ${record.flags.length > 0 ? "bg-red-50/40" : ""}`} onClick={() => setSelectedRecord(record)}>
              <td className="px-4 py-3 whitespace-nowrap">{record.fiscalYear}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{record.warehouseId}<br /><span className="text-xs font-normal text-slate-500">{record.regionLabel}</span></td>
              <td className="px-4 py-3">{record.skuName}<br /><span className="text-xs text-slate-500">{record.skuId} · {record.category}</span></td>
              <td className="px-4 py-3 whitespace-nowrap">{formatNumber(record.requestedQty, 0)} {record.unit}</td>
              <td className="px-4 py-3 whitespace-nowrap font-semibold">{formatTHB(record.amount)}</td>
              <td className="px-4 py-3">
                {record.flags.length === 0 ? (
                  <span className="text-xs text-slate-400">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {record.flags.map((flag) => (
                      <GotchaBadge key={flag} flag={flag} />
                    ))}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <Button variant="secondary" onClick={(event) => { event.stopPropagation(); setSelectedRecord(record); }}>
                  <Search className="h-4 w-4" /> ดูใบของบ
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
        <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          เกณฑ์ flag: ซื้อซ้ำของจม = ของบ SKU ที่ยังมี dead stock ค้าง · เร่งใช้งบ = ใช้งบ ≥ {Math.round(procurementThresholds.spendToKeepUsageRatio * 100)}% + ของจมเพิ่ม · งบสูงกว่าคลังอื่น = งบ category สูงกว่าค่าเฉลี่ยคลังอื่น ≥ {procurementThresholds.overPeerRatio} เท่า
        </p>
      </Card>

      {selectedRecord ? (
        <BudgetRequestDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onOpenSku={onOpenSku}
          onOpenTransfer={onOpenTransfer}
        />
      ) : null}
    </>
  );
}

function FeedbackCenterPage({
  notes,
  currentUser,
  onDeleteNote,
  onOpenView,
}: {
  notes: ProcurementNote[];
  currentUser: SessionUser | null;
  onDeleteNote: (id: string, code: string) => void;
  onOpenView: (view: View) => void;
}) {
  const [contextFilter, setContextFilter] = useState("all");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const isAdmin = currentUser?.role === "admin";
  const contextOptions = Array.from(new Set(notes.map((note) => note.context)));
  const filtered = notes.filter((note) => contextFilter === "all" || note.context === contextFilter);
  const labelToView = Object.fromEntries(Object.entries(viewLabels).map(([view, label]) => [label, view])) as Record<string, View>;

  return (
    <>
      <SectionHeader
        title="ศูนย์ความเห็น · Feedback Center"
        subtitle="รวมความเห็น/feedback จากทุกหน้าไว้ที่เดียว เก็บชื่อผู้ให้ความเห็นและหน้าที่เขียน · เพิ่มได้จากปุ่มลอยทุกหน้า (ต้องเข้าสู่ระบบ) · ลบได้เฉพาะ admin พร้อมรหัสยืนยัน"
      />
      <Card>
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-200 px-4 py-3">
          <Field label="กรองตามหน้า">
            <select className={inputClass} value={contextFilter} onChange={(event) => setContextFilter(event.target.value)}>
              <option value="all">ทุกหน้า</option>
              {contextOptions.map((context) => <option key={context} value={context}>{context}</option>)}
            </select>
          </Field>
          <span className="ml-auto text-sm text-slate-500">{filtered.length} ความเห็น{isAdmin ? " · สิทธิ์ admin (ลบได้)" : ""}</span>
        </div>
        <div className="p-4">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">ยังไม่มีความเห็น — กดปุ่ม "ความเห็น" มุมขวาล่างเพื่อเพิ่มจากหน้าใดก็ได้</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((note) => (
                <li key={note.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800">{note.text}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700"><User className="h-3.5 w-3.5" />{note.authorName ?? "ไม่ระบุ"}{note.authorUsername ? ` (@${note.authorUsername})` : ""}</span>
                        <span>·</span>
                        <button
                          type="button"
                          className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"
                          onClick={() => labelToView[note.context] && onOpenView(labelToView[note.context])}
                        >
                          {note.context}
                        </button>
                        <span>·</span>
                        <span>{note.createdAt}</span>
                      </div>
                    </div>
                    {isAdmin ? (
                      <button type="button" className="shrink-0 text-slate-400 hover:text-red-600" onClick={() => { setPendingDeleteId(note.id); setDeleteCode(""); }} aria-label="ลบความเห็น">
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  {isAdmin && pendingDeleteId === note.id ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                      <span className="text-xs text-red-700">ใส่รหัสยืนยันการลบ ({DELETE_GUARD_CODE}):</span>
                      <input className="h-8 w-28 rounded-md border border-slate-300 px-2 text-sm" value={deleteCode} onChange={(event) => setDeleteCode(event.target.value)} placeholder="รหัส" />
                      <Button variant="danger" onClick={() => { onDeleteNote(note.id, deleteCode); setPendingDeleteId(null); setDeleteCode(""); }}>ยืนยันลบ</Button>
                      <Button variant="ghost" onClick={() => { setPendingDeleteId(null); setDeleteCode(""); }}>ยกเลิก</Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </>
  );
}

// ปุ่ม "Sign in with Google" — โหลด Google Identity Services แล้ว render ปุ่มทางการของ Google
function GoogleSignInButton({ onProfile }: { onProfile: (profile: GoogleProfile) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const clientId = getGoogleClientId();
    if (!clientId) return;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const google = (window as unknown as { google?: any }).google;
        if (!google?.accounts?.id) {
          setStatus("error");
          return;
        }
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential?: string }) => {
            const profile = response.credential ? parseGoogleCredential(response.credential) : null;
            if (profile) onProfile(profile);
          },
        });
        google.accounts.id.renderButton(containerRef.current, { theme: "outline", size: "large", width: 320, text: "signin_with", shape: "rectangular" });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [onProfile]);

  return (
    <div className="flex flex-col items-center">
      <div ref={containerRef} />
      {status === "loading" ? <p className="text-xs text-slate-400">กำลังโหลด Google Sign-In...</p> : null}
      {status === "error" ? <p className="text-xs text-red-500">โหลด Google Sign-In ไม่สำเร็จ — ตรวจ Client ID / authorized origin</p> : null}
    </div>
  );
}

type AuthMode = "login" | "register" | "forgot";

function AuthPage({
  currentUser,
  onLogin,
  onRegister,
  onResetPassword,
  onGoogleLogin,
  onLogout,
  onOpenFeedback,
}: {
  currentUser: SessionUser | null;
  onLogin: (username: string, password: string) => boolean;
  onRegister: (name: string, username: string, password: string) => boolean;
  onResetPassword: (username: string, newPassword: string) => boolean;
  onGoogleLogin: (profile: GoogleProfile) => void;
  onLogout: () => void;
  onOpenFeedback: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const reset = () => { setName(""); setUsername(""); setPassword(""); setConfirmPassword(""); setError(""); };
  const switchMode = (next: AuthMode) => { reset(); setMode(next); };

  if (currentUser) {
    return (
      <>
        <SectionHeader title="บัญชีผู้ใช้" subtitle="ข้อมูลผู้ใช้ที่เข้าสู่ระบบ ใช้สำหรับเก็บชื่อผู้ให้ความเห็น/feedback" />
        <Card className="max-w-lg">
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700"><User className="h-6 w-6" /></div>
              <div>
                <p className="text-base font-semibold text-slate-900">{currentUser.name}</p>
                <p className="text-sm text-slate-500">@{currentUser.username} · {currentUser.role === "admin" ? "ผู้ดูแลระบบ (ลบความเห็นได้)" : "ผู้ใช้ทั่วไป"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={onOpenFeedback}><MessageSquare className="h-4 w-4" /> ไปศูนย์ความเห็น</Button>
              <Button variant="secondary" onClick={onLogout}><LogOut className="h-4 w-4" /> ออกจากระบบ</Button>
            </div>
          </div>
        </Card>
      </>
    );
  }

  const title = mode === "login" ? "เข้าสู่ระบบ" : mode === "register" ? "สมัครสมาชิก" : "ลืมรหัสผ่าน";
  const subtitle =
    mode === "login"
      ? "เข้าสู่ระบบเพื่อให้ความเห็น ระบบจะเก็บว่าใครเป็นผู้ให้ feedback"
      : mode === "register"
        ? "สร้างบัญชีใหม่เพื่อเริ่มให้ความเห็น"
        : "ตั้งรหัสผ่านใหม่ด้วย username ของคุณ";

  const submit = () => {
    setError("");
    if (mode === "login") {
      if (!onLogin(username, password)) setError("username หรือรหัสผ่านไม่ถูกต้อง");
      else reset();
      return;
    }
    if (mode === "register") {
      if (password !== confirmPassword) { setError("รหัสผ่านยืนยันไม่ตรงกัน"); return; }
      if (onRegister(name, username, password)) reset();
      else setError("สมัครไม่สำเร็จ — username อาจถูกใช้แล้ว หรือกรอกไม่ครบ");
      return;
    }
    // forgot
    if (password !== confirmPassword) { setError("รหัสผ่านยืนยันไม่ตรงกัน"); return; }
    if (onResetPassword(username, password)) { switchMode("login"); }
    else setError("รีเซ็ตไม่สำเร็จ — ไม่พบ username นี้");
  };

  const canSubmit =
    mode === "login"
      ? Boolean(username.trim() && password)
      : mode === "register"
        ? Boolean(name.trim() && username.trim() && password && confirmPassword)
        : Boolean(username.trim() && password && confirmPassword);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center pt-4">
      <div className="mb-5 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white"><Sparkles className="h-7 w-7" /></div>
        <h1 className="mt-3 text-xl font-bold text-slate-900">PEA AI Inventory</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      {isGoogleAuthEnabled() ? (
        <Card className="mb-4 w-full">
          <div className="flex flex-col items-center gap-3 p-5">
            <GoogleSignInButton onProfile={onGoogleLogin} />
            <div className="flex w-full items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">หรือใช้บัญชีในระบบ</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="w-full">
        <div className="grid grid-cols-2 border-b border-slate-200">
          <button
            type="button"
            className={`py-3 text-sm font-semibold transition ${mode !== "register" ? "border-b-2 border-blue-600 text-blue-700" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => switchMode("login")}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            className={`py-3 text-sm font-semibold transition ${mode === "register" ? "border-b-2 border-blue-600 text-blue-700" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => switchMode("register")}
          >
            สมัครสมาชิก
          </button>
        </div>

        <div className="space-y-3 p-5">
          <p className="text-base font-semibold text-slate-900">{title}</p>

          {mode === "register" ? (
            <Field label="ชื่อ-นามสกุล"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น คุณสมชาย ใจดี" /></Field>
          ) : null}

          <Field label="Username"><input className={inputClass} value={username} onChange={(event) => setUsername(event.target.value)} placeholder={mode === "login" ? "username หรือ admin" : "username"} /></Field>

          <Field label={mode === "forgot" ? "รหัสผ่านใหม่" : "รหัสผ่าน"}>
            <input type="password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="รหัสผ่าน" />
          </Field>

          {mode !== "login" ? (
            <Field label="ยืนยันรหัสผ่าน"><input type="password" className={inputClass} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="พิมพ์รหัสผ่านอีกครั้ง" /></Field>
          ) : null}

          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <Button className="w-full justify-center" disabled={!canSubmit} onClick={submit}>
            {mode === "login" ? <><User className="h-4 w-4" /> เข้าสู่ระบบ</> : mode === "register" ? <><Plus className="h-4 w-4" /> สมัครและเข้าสู่ระบบ</> : <><ShieldCheck className="h-4 w-4" /> ตั้งรหัสผ่านใหม่</>}
          </Button>

          <div className="flex items-center justify-between pt-1 text-xs">
            {mode === "login" ? (
              <>
                <button type="button" className="text-blue-700 hover:underline" onClick={() => switchMode("forgot")}>ลืมรหัสผ่าน?</button>
                <button type="button" className="text-slate-500 hover:text-slate-700 hover:underline" onClick={() => switchMode("register")}>ยังไม่มีบัญชี? สมัคร</button>
              </>
            ) : (
              <button type="button" className="text-blue-700 hover:underline" onClick={() => switchMode("login")}>← กลับไปเข้าสู่ระบบ</button>
            )}
          </div>

          {mode === "login" ? <p className="text-center text-xs text-slate-400">ผู้ดูแลระบบทดสอบ: admin / admin</p> : null}
        </div>
      </Card>

      <p className="mt-4 max-w-md text-center text-xs text-slate-400">
        หมายเหตุ: ระบบ login นี้เป็น PoC เก็บใน browser ต่อเครื่อง (ยังไม่ใช่ auth จริง) อย่าใช้รหัสผ่านจริง · เวอร์ชันใช้งานจริงควรต่อ Firebase/Google เพื่อรองรับรีเซ็ตรหัสผ่านทางอีเมลและเก็บข้อมูลรวมศูนย์
      </p>
    </div>
  );
}

function ReceivingDelayPage({
  requests,
  receiptDelayLogs,
  supplierOfferData,
  onSave,
  onOpenRequestHistory,
  onOpenSku,
}: {
  requests: PurchaseRequest[];
  receiptDelayLogs: ReceiptDelayLog[];
  supplierOfferData: SupplierOffer[];
  onSave: (log: ReceiptDelayLog) => void;
  onOpenRequestHistory: (requestId?: string) => void;
  onOpenSku: (skuId: string) => void;
}) {
  const defaultRequest = requests[0];
  const [relatedRequestId, setRelatedRequestId] = useState(defaultRequest?.id ?? "");
  const selectedRequest = relatedRequestId ? requests.find((request) => request.id === relatedRequestId) : undefined;
  const [skuId, setSkuId] = useState(selectedRequest?.skuId ?? "1CC0CG0002");
  const [warehouseId, setWarehouseId] = useState(selectedRequest?.warehouseId ?? "I010");
  const [supplierId, setSupplierId] = useState(selectedRequest?.supplierId ?? "S001");
  const [plannedReceiveDate, setPlannedReceiveDate] = useState(getDateInputValue());
  const [actualReceiveDate, setActualReceiveDate] = useState(getDateInputValue());
  const [reasonCategory, setReasonCategory] = useState(delayReasonOptions[0]);
  const [note, setNote] = useState("บันทึกผลรับของเข้าคลังและสาเหตุ Delay เพื่อปรับการคำนวณรอบถัดไป");
  const [inspection, setInspection] = useState<boolean[]>(() => inspectionSteps.map(() => true));
  const inspectionResult: "ผ่าน" | "ไม่ผ่าน" = inspection.every(Boolean) ? "ผ่าน" : "ไม่ผ่าน";
  const delayDays = calculateDateDiffDays(plannedReceiveDate, actualReceiveDate);
  const impactDemand = calculateDelayImpactDemand(skuId, supplierId, supplierOfferData, Math.max(delayDays, 0));
  const delayedLogs = receiptDelayLogs.filter((log) => log.delayDays > 0);
  const totalImpactDemand = receiptDelayLogs.reduce((sum, log) => sum + log.impactDemand, 0);

  useEffect(() => {
    if (!selectedRequest) return;
    setSkuId(selectedRequest.skuId);
    setWarehouseId(selectedRequest.warehouseId);
    setSupplierId(selectedRequest.supplierId);
  }, [selectedRequest]);

  const saveLog = () => {
    onSave({
      id: `RCV-${Date.now().toString().slice(-6)}`,
      skuId,
      warehouseId,
      supplierId,
      relatedRequestId: relatedRequestId || undefined,
      plannedReceiveDate,
      actualReceiveDate,
      delayDays,
      reasonCategory,
      note,
      impactDemand,
      createdAt: getCurrentDateTimeLabel(),
      inspection,
      inspectionResult,
    });
  };

  return (
    <>
      <PageTitle
        eyebrow="รับของ / ตรวจรับ"
        title="รับของ & ตรวจรับพัสดุ"
        subtitle="บันทึกรับของเข้าคลัง + ผลตรวจรับ 7 ขั้น (คณะกรรมการ) + สาเหตุ Delay เพื่อประเมิน shortage impact และ supplier lead time รอบถัดไป"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          label="Receiving Log"
          value={String(receiptDelayLogs.length)}
          helper="รายการทั้งหมด"
          formula={`นับ Receiving/Delay log ที่บันทึกใน persistent JSON state = ${receiptDelayLogs.length}`}
          changes="บันทึกรับของหรือ Delay ใหม่"
        />
        <MetricCard
          label="รายการ Delay"
          value={String(delayedLogs.length)}
          helper="delayDays > 0"
          tone="red"
          formula={`นับ log ที่ actual date มากกว่า planned date = ${delayedLogs.length}`}
          changes="บันทึกวันที่รับจริงหรือวันที่คาดว่าจะได้รับใหม่"
        />
        <MetricCard
          label="Impact Demand รวม"
          value={formatNumber(totalImpactDemand, 0)}
          helper="หน่วยรวมตาม SKU"
          tone="yellow"
          formula={`ผลรวม Average Daily Demand × Delay Days ของทุก log = ${formatNumber(totalImpactDemand, 0)}`}
          changes="เพิ่ม log delay หรือแก้ค่า demand/lead time"
        />
        <MetricCard
          label="Impact รอบนี้"
          value={formatNumber(impactDemand, 2)}
          helper={`Delay ${delayDays} วัน`}
          tone={delayDays > 0 ? "yellow" : "green"}
          formula={`Average Daily Demand ของ ${skuId} × max(${delayDays}, 0) วัน = ${formatNumber(impactDemand, 2)}`}
          changes="เลือก SKU/Request หรือวันที่รับจริงเปลี่ยน"
        />
      </div>

      <Card className="mt-5">
        <SectionHeader title="บันทึกรับของเข้าคลังและสาเหตุ Delay" subtitle="ข้อมูลนี้เป็น feedback loop ให้สูตรคำนวณ Lead Time และการคาดการณ์ขาดสต็อกตามฤดูกาล" />
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          <Field label="อ้างอิงคำขอซื้อ">
            <select className={inputClass} value={relatedRequestId} onChange={(event) => setRelatedRequestId(event.target.value)}>
              <option value="">ไม่ผูกกับคำขอซื้อ</option>
              {requests.map((request) => <option key={request.id} value={request.id}>{request.id} · {request.skuId} · {request.status}</option>)}
            </select>
          </Field>
          <Field label="SKU">
            <select className={inputClass} value={skuId} onChange={(event) => setSkuId(event.target.value)}>
              {skus.map((sku) => <option key={sku.id} value={sku.id}>{sku.id} · {sku.name}</option>)}
            </select>
          </Field>
          <Field label="คลังรับเข้า">
            <select className={inputClass} value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.id} · {warehouse.name}</option>)}
            </select>
          </Field>
          <Field label="ซัพพลายเออร์">
            <select className={inputClass} value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.id} · {supplier.name}</option>)}
            </select>
          </Field>
          <Field label="วันที่คาดว่าจะได้รับ">
            <input className={inputClass} type="date" value={plannedReceiveDate} onChange={(event) => setPlannedReceiveDate(event.target.value)} />
          </Field>
          <Field label="วันที่รับจริง">
            <input className={inputClass} type="date" value={actualReceiveDate} onChange={(event) => setActualReceiveDate(event.target.value)} />
          </Field>
          <Field label="สาเหตุ Delay">
            <select className={inputClass} value={reasonCategory} onChange={(event) => setReasonCategory(event.target.value)}>
              {delayReasonOptions.map((reason) => <option key={reason}>{reason}</option>)}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="หมายเหตุ">
              <textarea className={textareaClass} value={note} onChange={(event) => setNote(event.target.value)} />
            </Field>
          </div>
          <div className="flex items-end gap-2">
            <Button className="flex-1" onClick={saveLog}>
              <PackageCheck className="h-4 w-4" />
              บันทึกรับของ / Delay
            </Button>
            {relatedRequestId ? (
              <Button variant="secondary" onClick={() => onOpenRequestHistory(relatedRequestId)}>
                <History className="h-4 w-4" /> เปิดคำขอในประวัติ
              </Button>
            ) : null}
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-500">
            ขั้นต่อไป: หลังบันทึก Delay ระบบใช้ Impact Demand เป็น feedback ปรับ Lead Time/ความเสี่ยงรอบถัดไป — กด “เปิดคำขอในประวัติ” เพื่อดู snapshot ของคำขอที่เกี่ยว หรือ “ดู SKU” เพื่อตรวจสถานะสต็อกปัจจุบัน
          </p>
        </div>
      </Card>

      <Card className="mt-5">
        <SectionHeader title="ตรวจรับพัสดุ (7 ขั้น โดยคณะกรรมการตรวจรับ)" subtitle="ตามระเบียบ พ.ร.บ. การจัดซื้อจัดจ้างฯ พ.ศ. 2560 — กดผ่าน/ไม่ผ่านแต่ละขั้น (ไม่ผ่าน 1 ขั้น = ต้องแจ้งคู่สัญญา)" />
        <div className="space-y-2 p-5">
          {inspectionSteps.map((step, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-md border border-slate-200 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">{i + 1}</span>
                {step}
              </span>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => setInspection((prev) => prev.map((v, idx) => (idx === i ? true : v)))} className={`rounded-md px-3 py-1 text-xs font-semibold transition ${inspection[i] ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>ผ่าน</button>
                <button type="button" onClick={() => setInspection((prev) => prev.map((v, idx) => (idx === i ? false : v)))} className={`rounded-md px-3 py-1 text-xs font-semibold transition ${!inspection[i] ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>ไม่ผ่าน</button>
              </div>
            </div>
          ))}
          <div className={`mt-1 flex flex-col gap-1 rounded-md px-3 py-2 text-sm font-semibold sm:flex-row sm:items-center sm:justify-between ${inspectionResult === "ผ่าน" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            <span>ผลตรวจรับ: {inspectionResult}</span>
            <span className="text-xs font-normal">{inspectionResult === "ผ่าน" ? "→ รับเข้าคลัง + เบิกจ่าย" : "→ ออกหนังสือแจ้งคู่สัญญาให้แก้ไข/ส่งใหม่"}</span>
          </div>
          <p className="text-xs text-slate-500">ผลตรวจรับนี้จะถูกบันทึกพร้อมข้อมูลรับของด้านบนเมื่อกด “บันทึกรับของ / Delay”</p>
        </div>
      </Card>

      <Card className="mt-5">
        <SectionHeader title="Receiving & Delay History" subtitle="ใช้ย้อนดูว่า Supplier หรือกระบวนการใดทำให้ส่งช้า และกระทบ demand ระหว่างรอของเท่าไร" />
        <DataTable columns={["วันที่บันทึก", "SKU", "คลัง", "Supplier", "Plan", "Actual", "Delay", "Impact Demand", "ตรวจรับ", "สาเหตุ", "หมายเหตุ", "ดำเนินการ"]} empty={receiptDelayLogs.length === 0}>
          {receiptDelayLogs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-900">{log.id}<br /><span className="text-xs font-normal text-slate-500">{log.createdAt}</span></td>
              <td className="px-4 py-3">{log.skuId}</td>
              <td className="px-4 py-3">{log.warehouseId}</td>
              <td className="px-4 py-3">{log.supplierId}</td>
              <td className="px-4 py-3">{log.plannedReceiveDate}</td>
              <td className="px-4 py-3">{log.actualReceiveDate}</td>
              <td className={`px-4 py-3 font-semibold ${log.delayDays > 0 ? "text-red-700" : "text-emerald-700"}`}>{log.delayDays} วัน</td>
              <td className="px-4 py-3">{formatNumber(log.impactDemand, 2)}</td>
              <td className="px-4 py-3">
                {log.inspectionResult ? (
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${log.inspectionResult === "ผ่าน" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-red-50 text-red-700 ring-red-200"}`}>{log.inspectionResult}</span>
                ) : (
                  <span className="text-xs text-slate-400">-</span>
                )}
              </td>
              <td className="px-4 py-3">{log.reasonCategory}</td>
              <td className="min-w-72 px-4 py-3 text-sm leading-6 text-slate-600">{log.note}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  {log.relatedRequestId ? (
                    <Button variant="secondary" onClick={() => onOpenRequestHistory(log.relatedRequestId)}><History className="h-4 w-4" /> ดูคำขอ</Button>
                  ) : null}
                  <Button variant="ghost" onClick={() => onOpenSku(log.skuId)}>ดู SKU</Button>
                </div>
              </td>
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

function buildStockIntelligenceRows(): StockIntelligenceRow[] {
  return peaRiskCoverageRecords.map((record) => {
    const sku = peaSkuMaster.find((item) => item.skuId === record.skuId);
    const monthly = Array.from({ length: 12 }, (_, index) =>
      peaMonthlyUsage
        .filter((usage) => usage.warehouseId === record.plantId && usage.skuId === record.skuId && usage.usageMonth === index + 1)
        .reduce((sum, usage) => sum + usage.usageQty, 0),
    );
    const seasonAverages = buildSeasonAverages(monthly);
    const peakSeason = usageSeasons.reduce((best, season) => (seasonAverages[season.id] > seasonAverages[best.id] ? season : best), usageSeasons[0]);
    const peakSeasonDemand = seasonAverages[peakSeason.id] * peakSeason.months.length;
    const projectedAfterPeakSeason = record.stockQty - peakSeasonDemand;
    const sourceExcess = calculateSourceExcess(record.stockQty, record.avgPeriodUsage);
    const status: StockIntelligenceRow["status"] =
      record.stockCoverPeriods >= 1.5 || record.activePeriods <= 3
        ? "Dead Stock Candidate"
        : record.stockCoverPeriods < 0.25 || projectedAfterPeakSeason < 0
          ? "Stockout Risk"
          : sourceExcess > 0
            ? "Transfer Source"
            : "Balanced";

    return {
      skuId: record.skuId,
      skuName: sku?.skuName ?? getShortSkuIdFromPeaSku(record.skuId),
      category: sku?.category ?? "-",
      warehouseId: record.plantId,
      regionLabel: formatPeaRegionCode(record.regionCode),
      unit: record.unit ?? sku?.unit ?? "-",
      stockQty: record.stockQty,
      averageMonthlyUsage: record.avgPeriodUsage,
      stockCoverPeriods: record.stockCoverPeriods,
      peakSeasonLabel: `${peakSeason.label} (${formatNumber(seasonAverages[peakSeason.id])})`,
      peakSeasonDemand,
      projectedAfterPeakSeason,
      status,
    };
  });
}

function buildTransferSuggestions(supplierOfferData: SupplierOffer[], formulaPolicy: FormulaPolicyState): TransferSuggestion[] {
  return inventoryRecords
    .map((inventory) => {
      const effectiveInventory = applyFormulaPolicy(inventory, formulaPolicy);
      const supplier = getSupplierSkuRecord(getDefaultOffer(inventory.skuId, supplierOfferData).supplierId, inventory.skuId, supplierOfferData);
      const recommendation = calculateInventoryRecommendation({
        inventory: effectiveInventory,
        supplier,
        formulaVersion: formulaPolicy.formulaVersion,
      });
      const destinationShortage = Math.max(0, recommendation.reorderPoint - effectiveInventory.currentStock);
      const peaSkuId = resolvePeaSkuId(inventory.skuId);
      const destinationRelationship = peaRiskCoverageRecords.find((record) => record.skuId === peaSkuId && record.plantId === inventory.warehouseId);
      const sourceCandidates = peaRiskCoverageRecords
        .filter((record) => record.skuId === peaSkuId && record.plantId !== inventory.warehouseId)
        .map((record) => ({ record, sourceExcess: calculateSourceExcess(record.stockQty, record.avgPeriodUsage) }))
        .filter((item) => item.sourceExcess > 0)
        .sort((a, b) => b.sourceExcess - a.sourceExcess);
      const bestSource = sourceCandidates[0];

      if (!bestSource || destinationShortage <= 0 || recommendation.suggestedQuantity <= 0) return null;

      const stockRow = buildStockIntelligenceRows().find((row) => row.skuId === peaSkuId && row.warehouseId === bestSource.record.plantId);
      const suggestedQuantity = Math.max(1, Math.min(Math.ceil(bestSource.sourceExcess), recommendation.suggestedQuantity));
      const shortSkuId = getShortSkuIdFromPeaSku(peaSkuId);
      const sku = getSku(shortSkuId);

      return {
        skuId: shortSkuId,
        skuName: sku.name,
        unit: sku.unit,
        sourceWarehouseId: bestSource.record.plantId,
        destinationWarehouseId: inventory.warehouseId,
        sourceStock: bestSource.record.stockQty,
        destinationStock: effectiveInventory.currentStock,
        destinationReorderPoint: recommendation.reorderPoint,
        destinationShortage,
        sourceExcess: bestSource.sourceExcess,
        suggestedQuantity,
        sourceStockCoverPeriods: bestSource.record.stockCoverPeriods,
        destinationStockCoverPeriods: destinationRelationship?.stockCoverPeriods ?? 0,
        peakSeasonLabel: stockRow?.peakSeasonLabel ?? "ไม่พบ season",
        decisionBasis: `ปลายทาง ${inventory.warehouseId} ต่ำกว่า ROP ${formatNumber(destinationShortage)} ${sku.unit}; ต้นทาง ${bestSource.record.plantId} มี stock ${formatNumber(bestSource.record.stockQty)} ${bestSource.record.unit} และกัน buffer usage 0.25 รอบแล้วยังเหลือ ${formatNumber(bestSource.sourceExcess)} ${bestSource.record.unit}`,
      } satisfies TransferSuggestion;
    })
    .filter((item): item is TransferSuggestion => Boolean(item))
    .sort((a, b) => b.destinationShortage - a.destinationShortage);
}

function calculateSourceExcess(stockQty: number, averageMonthlyUsage: number) {
  // ใช้ buffer ขั้นต่ำ 0.25 รอบ usage เพื่อไม่แนะนำให้คลังต้นทางโอนจนเสี่ยงขาดเอง
  return Math.max(0, stockQty - averageMonthlyUsage * 0.25);
}

function getShortSkuIdFromPeaSku(peaSkuId: string) {
  return skus.find((sku) => resolvePeaSkuId(sku.id) === peaSkuId)?.id ?? peaSkuId;
}

type BorrowReturnState = "returned" | "overdue" | "borrowing" | "pending" | "na";

function getBorrowReturnState(request: TransferRequest, today: string): BorrowReturnState {
  if (request.type !== "Borrow") return "na";
  if (request.returnedDate) return "returned";
  if (request.status === "Requested") return "pending";
  if (request.status === "Rejected") return "na";
  if (request.dueDate && request.dueDate < today) return "overdue";
  return "borrowing";
}

const borrowReturnLabel: Record<BorrowReturnState, string> = {
  returned: "คืนแล้ว",
  overdue: "เกินกำหนดคืน",
  borrowing: "ยืมอยู่",
  pending: "รออนุมัติ",
  na: "-",
};

type LeaderRow = { warehouseId: string; count: number };

function rankByWarehouse(items: TransferRequest[], pick: (request: TransferRequest) => string): LeaderRow[] {
  const counts = new Map<string, number>();
  items.forEach((request) => {
    const key = pick(request);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([warehouseId, count]) => ({ warehouseId, count }))
    .sort((a, b) => b.count - a.count);
}

function analyzeTransfers(requests: TransferRequest[], today: string) {
  const borrows = requests.filter((request) => request.type === "Borrow");
  const swaps = requests.filter((request) => request.type === "Swap");
  const needWarehouseEvents = requests.filter((request) => request.type === "Borrow" || request.type === "Transfer");
  const overdue = borrows.filter((request) => getBorrowReturnState(request, today) === "overdue");

  const swapSkuCounts = rankByWarehouse(swaps, (request) => request.skuName);
  const topSwap = swapSkuCounts[0] ?? null;

  return {
    borrowLeaders: rankByWarehouse(borrows, (request) => request.destinationWarehouseId),
    overdueLeaders: rankByWarehouse(overdue, (request) => request.destinationWarehouseId),
    shortageLeaders: rankByWarehouse(needWarehouseEvents, (request) => request.destinationWarehouseId),
    swapCount: swaps.length,
    topSwapName: topSwap ? topSwap.warehouseId : null,
    topSwapCount: topSwap ? topSwap.count : 0,
    returnedCount: borrows.filter((request) => request.returnedDate).length,
    outstandingCount: borrows.filter((request) => getBorrowReturnState(request, today) === "borrowing" || getBorrowReturnState(request, today) === "overdue").length,
    overdueCount: overdue.length,
  };
}

function BorrowReturnBadge({ state }: { state: BorrowReturnState }) {
  if (state === "na") return <span className="text-xs text-slate-400">-</span>;
  const className: Record<Exclude<BorrowReturnState, "na">, string> = {
    returned: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    overdue: "bg-red-50 text-red-700 ring-red-200",
    borrowing: "bg-amber-50 text-amber-700 ring-amber-200",
    pending: "bg-blue-50 text-blue-700 ring-blue-200",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className[state as Exclude<BorrowReturnState, "na">]}`}>{borrowReturnLabel[state]}</span>;
}

function TransferLeaderList({ title, unit, rows, tone, emptyText }: { title: string; unit: string; rows: LeaderRow[]; tone: "amber" | "red" | "blue"; emptyText: string }) {
  const toneClass: Record<"amber" | "red" | "blue", string> = { amber: "text-amber-700", red: "text-red-700", blue: "text-blue-700" };
  const top = rows.slice(0, 5);
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {top.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {top.map((row, index) => (
            <li key={row.warehouseId} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">{index + 1}</span>
                คลัง {row.warehouseId}
              </span>
              <span className={`text-sm font-semibold ${toneClass[tone]}`}>{row.count} <span className="text-xs font-normal text-slate-400">{unit}</span></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TransferStatusBadge({ status }: { status: TransferStatus }) {
  const className: Record<TransferStatus, string> = {
    Requested: "bg-blue-50 text-blue-700 ring-blue-200",
    Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Completed: "bg-slate-100 text-slate-700 ring-slate-200",
    Rejected: "bg-red-50 text-red-700 ring-red-200",
  };
  const label: Record<TransferStatus, string> = {
    Requested: "รออนุมัติ",
    Approved: "อนุมัติแล้ว",
    Completed: "ปิดงานแล้ว",
    Rejected: "ไม่อนุมัติ",
  };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className[status]}`}>{label[status]}</span>;
}

function StockIntelligenceStatusBadge({ status }: { status: StockIntelligenceRow["status"] }) {
  const className: Record<StockIntelligenceRow["status"], string> = {
    "Stockout Risk": "bg-red-50 text-red-700 ring-red-200",
    "Transfer Source": "bg-blue-50 text-blue-700 ring-blue-200",
    "Dead Stock Candidate": "bg-violet-50 text-violet-700 ring-violet-200",
    Balanced: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
  const label: Record<StockIntelligenceRow["status"], string> = {
    "Stockout Risk": "เสี่ยงขาด",
    "Transfer Source": "ต้นทางโอนได้",
    "Dead Stock Candidate": "Dead/Slow Stock",
    Balanced: "สมดุล",
  };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className[status]}`}>{label[status]}</span>;
}

function getTransferTypeLabel(type: TransferType) {
  return type === "Borrow" ? "ยืมชั่วคราว" : type === "Swap" ? "แลกเปลี่ยน" : "โอนย้าย";
}

function calculateDateDiffDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateDelayImpactDemand(skuId: string, supplierId: string, supplierOfferData: SupplierOffer[], delayDays: number) {
  const inventory = inventoryRecords.find((record) => record.skuId === skuId) ?? inventoryRecords[0];
  const supplier = getSupplierSkuRecord(supplierId, skuId, supplierOfferData);
  const recommendation = calculateInventoryRecommendation({ inventory, supplier, formulaVersion });

  return recommendation.averageDailyDemand * delayDays;
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
  budgetSettings,
  onBack,
  onCalculation,
  onCreateRequest,
  onSupplier,
  onTransfer,
  onVmi,
}: {
  skuId: string;
  supplierOfferData: SupplierOffer[];
  formulaPolicy: FormulaPolicyState;
  budgetSettings: BudgetSettingsState;
  onBack: () => void;
  onCalculation: () => void;
  onCreateRequest: (supplierId: string) => void;
  onSupplier: (supplierId: string) => void;
  onTransfer: () => void;
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
  const budget = getBudgetContextForInventory(record, budgetSettings);
  const dataCoverage = getPeaDataCoverage({ warehouseId: record.warehouseId, skuId: sku.id, supplierId: primarySupplier.id });
  const coverageWarnings = getPeaDataCoverageWarnings(dataCoverage);
  const relationshipRecord = getPeaRiskCoverageRecord(record.warehouseId, sku.id);
  const skuLeadTimeSummary = getPeaLeadTimeSkuSummary(sku.id);
  const [showExplanation, setShowExplanation] = useState(false);
  const reorderPointRaw = recommendation.demandDuringLeadTime + recommendation.safetyStock;
  const rawSuggestedQuantity = recommendation.targetStockLevel - record.currentStock;
  const transferSuggestion = buildTransferSuggestions(supplierOfferData, formulaPolicy).find((suggestion) => suggestion.skuId === sku.id && suggestion.destinationWarehouseId === record.warehouseId);
  const skuHoldings = getSkuHoldingsByWarehouse(sku.id);

  return (
    <>
      <PageTitle
        eyebrow="คลังพัสดุ / รายละเอียด SKU"
        title={`${sku.id} ${sku.name}`}
        subtitle={`${warehouse.id} ${warehouse.name} · ${regionLabels[warehouse.region]} · ใช้พื้นที่คลัง ${warehouse.capacityUsed}%`}
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> ย้อนกลับ</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          label="สต็อกปัจจุบัน"
          value={`${formatNumber(record.currentStock)} ${sku.unit}`}
          helper="คงเหลือ"
          formula={`อ่านจาก Inventory record ของ ${record.warehouseId}/${sku.id} = ${formatNumber(record.currentStock)} ${sku.unit}`}
          changes="มี stock movement, import stock ใหม่ หรือแก้ inventory input ของ SKU นี้"
        />
        <MetricCard
          label="ค่าเฉลี่ยการใช้ต่อวัน"
          value={`${formatNumber(recommendation.averageDailyDemand)} ${sku.unit}`}
          helper="ต่อวัน"
          formula={`${formatNumber(recommendation.historicalUsageTotal)} ${sku.unit} / ${recommendation.historicalUsageDays} วัน = ${formatNumber(recommendation.averageDailyDemand)} ${sku.unit}/วัน`}
          changes="ข้อมูลการใช้ย้อนหลังหรือจำนวนวันย้อนหลังเปลี่ยน"
        />
        <MetricCard
          label="ระดับพัสดุสำรองปลอดภัย"
          value={`${formatNumber(recommendation.safetyStock)} ${sku.unit}`}
          helper="กันความเสี่ยงขาดสต็อก"
          tone="green"
          formula={`${formatNumber(recommendation.zScore)} × ${formatNumber(recommendation.demandVariabilityPerDay)} × √${formatNumber(recommendation.adjustedLeadTimeDays)} ≈ ${formatNumber(recommendation.safetyStock)} ${sku.unit}`}
          changes="Service Level, Demand Variability, Lead Time หรือ factor ใน Settings เปลี่ยน"
        />
        <MetricCard
          label="จุดสั่งซื้อใหม่"
          value={`${formatNumber(recommendation.reorderPoint)} ${sku.unit}`}
          helper="จุดเริ่มจัดซื้อ"
          tone="red"
          formula={`${formatNumber(recommendation.demandDuringLeadTime)} ${sku.unit} + ${formatNumber(recommendation.safetyStock)} ${sku.unit} = ${formatNumber(reorderPointRaw)} ${sku.unit}; ปัดเป็น ${formatNumber(recommendation.reorderPoint)} ${sku.unit}`}
          changes="ค่าเฉลี่ยการใช้ต่อวัน, Adjusted Lead Time หรือ Safety Stock เปลี่ยน"
        />
        <MetricCard
          label="ความต้องการคาดการณ์"
          value={`${formatNumber(recommendation.forecastDemandForPlanningPeriod)} ${sku.unit}`}
          helper="รอบแผน"
          formula={`อ่านจาก forecastDemandForPlanningPeriod ของ ${sku.id} = ${formatNumber(recommendation.forecastDemandForPlanningPeriod)} ${sku.unit} ใน ${recommendation.planningPeriodDays} วัน`}
          changes="forecast, planning period หรือข้อมูล demand รอบใหม่เปลี่ยน"
        />
        <MetricCard
          label="จำนวนที่ระบบแนะนำ"
          value={`${formatNumber(recommendation.suggestedQuantity)} ${sku.unit}`}
          helper="AI"
          tone="blue"
          formula={`${formatNumber(recommendation.targetStockLevel)} - ${formatNumber(record.currentStock)} = ${formatNumber(rawSuggestedQuantity)} ${sku.unit}; ปัดตาม MOQ ${formatNumber(recommendation.moq)} เป็น ${formatNumber(recommendation.suggestedQuantity)} ${sku.unit}`}
          changes="Target Stock, Current Stock, MOQ หรือ policy สูตรเปลี่ยน"
        />
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
      {skuHoldings.length > 0 ? (
        <Card className="mt-4">
          <SectionHeader
            title={`การถือครอง ${sku.id} รายคลัง`}
            subtitle="ดูว่า SKU นี้ถูกถือครองที่คลังไหนบ้าง คลังไหนของจม และคลังไหนกำลังขาด เพื่อช่วยตัดสินใจโอน/ยืมก่อนซื้อใหม่"
          />
          <DataTable columns={["คลัง", "เขต", "คงคลัง", "ใช้เฉลี่ย/เดือน", "Stock Cover", "สถานะ"]} empty={skuHoldings.length === 0}>
            {skuHoldings.map((holding) => (
              <tr key={holding.warehouseId} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{holding.warehouseId}</td>
                <td className="px-4 py-3">{holding.regionLabel}</td>
                <td className="px-4 py-3">{formatNumber(holding.stockQty, 0)} {holding.unit}</td>
                <td className="px-4 py-3">{holding.avgMonthlyUsage !== null ? `${formatNumber(holding.avgMonthlyUsage, 0)} ${holding.unit}` : "—"}</td>
                <td className="px-4 py-3">{holding.stockCoverPeriods !== null ? `${formatNumber(holding.stockCoverPeriods, 2)} รอบ` : "—"}</td>
                <td className="px-4 py-3">
                  {holding.status === "dead" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
                      ของจม{holding.monthsIdle !== null ? ` · ไม่ขยับ ${holding.monthsIdle} เดือน` : ""}
                    </span>
                  ) : holding.status === "short" ? (
                    <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">เสี่ยงขาด</span>
                  ) : (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">เหมาะสม</span>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
          <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            คำนวณจริงจาก: คงคลังราย Factory/Plant (BATCH) + usage/cover จาก relationship analysis + รายการของจม · เปลี่ยนเมื่อ: stock, usage หรือข้อมูลของจมเปลี่ยน
          </p>
        </Card>
      ) : null}
      {transferSuggestion ? (
        <Card className="mt-4 border-blue-200 bg-blue-50">
          <SectionHeader
            title="คำแนะนำก่อนสั่งซื้อ: ตรวจโอน/ยืมจากคลังอื่น"
            subtitle="ระบบพบคลังที่อาจช่วยเติม stock ได้ก่อนสร้างคำขอซื้อใหม่"
            action={<Button onClick={onTransfer}><ArrowRightLeft className="h-4 w-4" /> เปิด Transfer Center</Button>}
          />
          <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-4">
            <ReviewMetric label="คลังต้นทางที่แนะนำ" value={`${transferSuggestion.sourceWarehouseId} → ${transferSuggestion.destinationWarehouseId}`} />
            <ReviewMetric label="จำนวนที่ควรโอน/ยืม" value={`${formatNumber(transferSuggestion.suggestedQuantity)} ${transferSuggestion.unit}`} />
            <ReviewMetric label="ปลายทางขาดเทียบ ROP" value={`${formatNumber(transferSuggestion.destinationShortage)} ${transferSuggestion.unit}`} />
            <ReviewMetric label="Season ที่ต้องระวัง" value={transferSuggestion.peakSeasonLabel} />
          </div>
          <div className="border-t border-blue-200 px-5 py-4 text-sm leading-6 text-blue-900">
            <span className="font-semibold">คำนวณจริงจาก:</span> {transferSuggestion.decisionBasis}
            <br />
            <span className="font-semibold">เปลี่ยนเมื่อ:</span> Stock ต้นทาง/ปลายทาง, usage, ROP, MOQ หรือ relationship analysis เปลี่ยน
          </div>
        </Card>
      ) : null}
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
  budgetSettings,
  request,
  onBack,
}: {
  skuId: string;
  supplierOfferData: SupplierOffer[];
  formulaPolicy: FormulaPolicyState;
  budgetSettings: BudgetSettingsState;
  request?: PurchaseRequest;
  onBack: () => void;
}) {
  const sku = getSku(skuId);
  const record = applyFormulaPolicy(inventoryRecords.find((item) => item.skuId === skuId) ?? inventoryRecords[0], formulaPolicy);
  const supplierId = request?.supplierId ?? getDefaultOffer(record.skuId, supplierOfferData).supplierId;
  const supplierRecord = getSupplierSkuRecord(supplierId, skuId, supplierOfferData);
  const recommendation = request?.calculationSnapshot ?? calculateInventoryRecommendation({ inventory: record, supplier: supplierRecord, formulaVersion: formulaPolicy.formulaVersion });
  const snapshot = request?.calculationSnapshot;
  const budget = snapshot?.budgetContextAtRequestDate ?? getBudgetContextForInventory(record, budgetSettings);
  const preview = snapshot
    ? undefined
    : calculatePurchaseRequestPreview({
        recommendation,
        requestedQuantity: recommendation.suggestedQuantity,
        unitPrice: supplierRecord.unitPrice,
        budget,
      });
  const calculationDetailCards = buildActualCalculationCards(record, recommendation, supplierRecord.unit);

  return (
    <>
      <PageTitle
        eyebrow="รายละเอียดการคำนวณ"
        title={`${sku.id} ${sku.name} · เวอร์ชันสูตร ${recommendation.formulaVersion}`}
        subtitle="คำอธิบายวิธีคำนวณระดับพัสดุสำรองปลอดภัย จุดสั่งซื้อใหม่ จำนวนที่แนะนำ และเส้นทางอนุมัติ"
        action={<Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> กลับไปหน้ารายละเอียด SKU</Button>}
      />
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {calculationDetailCards.map((item, index) => (
          <Card key={item.title} className="p-3">
            <p className="text-xs font-semibold text-slate-500">ขั้นที่ {index + 1}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.calculation}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">เปลี่ยนเมื่อ: {item.changes}</p>
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
                formula={`Stock ${formatNumber(relationshipRecord.stockQty, 0)} / Avg usage ${formatNumber(relationshipRecord.avgPeriodUsage, 0)} = ${formatNumber(relationshipRecord.stockCoverPeriods, 2)} รอบ`}
                changes="stock หรือ usage เฉลี่ยจาก relationship file เปลี่ยน"
              />
              <MetricCard
                label="ใช้เฉลี่ยต่อเดือน"
                value={`${formatNumber(relationshipRecord.avgPeriodUsage, 0)} ${relationshipRecord.usageUnit}`}
                helper={`CV ${formatNumber(relationshipRecord.cv, 2)} · ${relationshipRecord.activePeriods} เดือนที่มีข้อมูล`}
                tone="blue"
                formula={`ผลรวม usage รายเดือน / จำนวนเดือนที่มีข้อมูล = ${formatNumber(relationshipRecord.avgPeriodUsage, 0)} ${relationshipRecord.usageUnit}/เดือน`}
                changes="ข้อมูล usage รายเดือนหรือจำนวนเดือน active เปลี่ยน"
              />
              <MetricCard
                label="Lead Time ที่ใช้ประกอบ"
                value={`${formatNumber(leadTimeValue, 1)} วัน`}
                helper={leadTimeSource}
                tone={missingPlantLeadTime ? "yellow" : "green"}
                formula={`เลือก Lead Time จาก ${leadTimeSource} = ${formatNumber(leadTimeValue, 1)} วัน`}
                changes="Lead Time ใน relationship/LT Summary หรือ Supplier Lead Time เปลี่ยน"
              />
              <MetricCard
                label="VMI score"
                value={formatNumber(relationshipRecord.vmiScore, 1)}
                helper={`Stability ${formatNumber(relationshipRecord.stabilityScore, 1)} · Lead ${formatNumber(relationshipRecord.leadScore, 1)}`}
                tone="purple"
                formula={`คะแนนรวมจาก stability ${formatNumber(relationshipRecord.stabilityScore, 1)} และ lead ${formatNumber(relationshipRecord.leadScore, 1)} = ${formatNumber(relationshipRecord.vmiScore, 1)}`}
                changes="เสถียรภาพ demand, lead time หรือค่าความเสี่ยง VMI เปลี่ยน"
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
              <EditableNumberInput min="0" value={form.unitPrice} onValueChange={(value) => updateNumber("unitPrice", value)} />
            </Field>
            <Field label="ระยะเวลารอพัสดุ (Lead Time / วัน)">
              <EditableNumberInput min="1" value={form.leadTimeDays} onValueChange={(value) => updateNumber("leadTimeDays", value)} />
            </Field>
            <Field label="จำนวนสั่งซื้อขั้นต่ำ (MOQ)">
              <EditableNumberInput min="1" value={form.moq} onValueChange={(value) => updateNumber("moq", value)} />
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
        <EditableNumberInput className={numericInputClass} value={draft.unitPrice} onValueChange={(value) => updateNumber("unitPrice", value)} />
      </td>
      <td className="min-w-32 px-4 py-3">
        <EditableNumberInput className={numericInputClass} value={draft.leadTimeDays} onValueChange={(value) => updateNumber("leadTimeDays", value)} />
      </td>
      <td className="min-w-32 px-4 py-3">
        <EditableNumberInput className={numericInputClass} value={draft.moq} onValueChange={(value) => updateNumber("moq", value)} />
      </td>
      <td className="min-w-32 px-4 py-3">
        <EditableNumberInput className={numericInputClass} value={draft.reliabilityScore ?? 0} onValueChange={(value) => updateNumber("reliabilityScore", value)} />
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
    followUpDate: getDateInputValue(addDays(new Date(), 3)),
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
                createdAt: getCurrentDateTimeLabel(),
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
  budgetSettings,
  existingRequests,
  onBack,
  onContactSupplier,
  onOpenTransfer,
  onSubmit,
}: {
  skuId: string;
  supplierId: string;
  supplierOfferData: SupplierOffer[];
  formulaPolicy: FormulaPolicyState;
  budgetSettings: BudgetSettingsState;
  existingRequests: PurchaseRequest[];
  onBack: () => void;
  onContactSupplier: (supplierId: string) => void;
  onOpenTransfer: (skuId: string) => void;
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
  const budget = getBudgetContextForInventory(record, budgetSettings);
  const [requestedQuantity, setRequestedQuantity] = useState(skuId === "1CC0CG0002" ? 20 : recommendation.suggestedQuantity);
  const [reasonCategory, setReasonCategory] = useState(skuId === "1CC0CG0002" ? "มีแผนซ่อมบำรุงเพิ่มเติม" : "");
  const [reasonText, setReasonText] = useState(skuId === "1CC0CG0002" ? "รวมแผนซ่อมบำรุงเพิ่มเติมของคลัง I010 ในรอบเดียวกัน" : "");
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
  const transferSuggestion = buildTransferSuggestions(supplierOfferData, formulaPolicy).find((suggestion) => suggestion.skuId === sku.id && suggestion.destinationWarehouseId === record.warehouseId);

  const buildSnapshot = (requestId: string, createdAt: string): PurchaseRequestCalculationSnapshot => ({
    requestId,
    createdAt,
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
    const requestId = getNextRequestId(existingRequests);
    const createdAt = getCurrentDateTimeLabel();
    const snapshot = buildSnapshot(requestId, createdAt);
    const timeline: ApprovalTimelineItem[] =
      status === "Draft"
        ? [{ role: "Local Warehouse", action: "Draft Created", actor: warehouse.name, date: createdAt }]
        : [
            {
              role: "Local Warehouse",
              action: "Submitted",
              actor: warehouse.name,
              date: createdAt,
              note: `ระบบแนะนำให้อนุมัติที่${getApprovalLayerLabel(recommendedLayer)}`,
            },
          ];

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
      formulaVersion: formulaPolicy.formulaVersion,
      calculationSnapshot: snapshot,
      supplierContactLogSummary: "โทรศัพท์ยืนยันราคาและ Lead Time กับซัพพลายเออร์แล้ว",
      localReason: "Stock ปัจจุบันต่ำกว่าจุดสั่งซื้อใหม่ และงบคลังพื้นที่ไม่เพียงพอสำหรับปริมาณที่ขอ",
      regionalEscalationReason: recommendedLayer === "Central" ? "งบระดับเขตไม่เพียงพอ ต้องส่งต่อส่วนกลาง" : undefined,
      createdAt,
      timeline,
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
          {findDeadStockForSkuElsewhere(sku.id, record.warehouseId) ? (
            <div className="mb-5">
              <DeadStockBorrowAlert
                skuId={sku.id}
                warehouseId={record.warehouseId}
                requestedQuantity={requestedQuantity}
                unitPrice={offer.unitPrice}
                onOpenTransfer={onOpenTransfer}
              />
            </div>
          ) : null}
          {transferSuggestion ? (
            <div className="mb-5">
              <InlineAlert tone="info">
                ก่อนสั่งซื้อ ระบบพบทางเลือกโอน/ยืม {formatNumber(transferSuggestion.suggestedQuantity)} {transferSuggestion.unit} จากคลัง {transferSuggestion.sourceWarehouseId} ไป {transferSuggestion.destinationWarehouseId}
                เพื่อช่วยลดการซื้อใหม่และลด Dead Stock ฝั่งต้นทาง แต่ยังสามารถสร้าง PR ได้หากโอนไม่พอหรือมีเหตุผลเฉพาะ
              </InlineAlert>
            </div>
          ) : null}
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
              <EditableNumberInput min={1} value={requestedQuantity} onValueChange={setRequestedQuantity} />
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
      <div className="mb-4">
        <InlineAlert tone="info">
          <div className="space-y-1">
            <p>ที่มาของค่าในคิวอนุมัติ: มูลค่าประมาณการ = Requested Quantity × Unit Price, เส้นทางอนุมัติ = ตรวจงบคลังพื้นที่ → งบเขต → งบส่วนกลางตาม snapshot ตอนส่งคำขอ</p>
            <p>ค่าบนหน้าตรวจอนุมัติอ่านจาก Calculation Snapshot ของแต่ละคำขอ จึงไม่เปลี่ยนย้อนหลังแม้สูตรหรือราคา Supplier ปัจจุบันถูกแก้ไข</p>
          </div>
        </InlineAlert>
      </div>
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
  aiFeedbackLogs,
  selectedRequestId,
  onSelectRequest,
  onSaveFeedback,
}: {
  requests: PurchaseRequest[];
  contactLogs: SupplierContactLog[];
  aiFeedbackLogs: AiSuggestionFeedback[];
  selectedRequestId: string;
  onSelectRequest: (id: string) => void;
  onSaveFeedback: (request: PurchaseRequest, actualQuantity: number, note: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = requests.filter((request) => {
    const sku = getSku(request.skuId);
    const supplier = getSupplier(request.supplierId);
    return `${request.id} ${sku.id} ${sku.name} ${supplier.name} ${request.status}`.toLowerCase().includes(search.toLowerCase());
  });
  const selected = requests.find((request) => request.id === selectedRequestId) ?? requests[0];
  const logs = selected ? contactLogs.filter((log) => log.requestId === selected.id || log.supplierId === selected.supplierId) : [];
  const selectedFeedbackLogs = selected ? aiFeedbackLogs.filter((log) => log.requestId === selected.id) : [];

  return (
    <>
      <PageTitle eyebrow="ประวัติ" title="ประวัติคำขอซื้อและบันทึกตรวจสอบย้อนหลัง" subtitle="แสดงคำขอซื้อย้อนหลังและภาพบันทึกการคำนวณที่ถูกเก็บ ณ วันที่ส่งคำขอ" />
      <div className="mb-5">
        <InlineAlert tone="info">
          <div className="space-y-1">
            <p>ประวัติหน้านี้ใช้ค่าจาก Calculation Snapshot ที่บันทึกตอนส่งคำขอ ไม่คำนวณใหม่จากสูตรหรือข้อมูล Supplier ปัจจุบัน</p>
            <p>ช่อง AI Feedback ใช้บันทึกค่าจริงหลังใช้งาน เพื่อคำนวณ Error = Actual Quantity - AI Suggested Quantity และใช้ปรับสูตรเวอร์ชันถัดไปเมื่อ error สูงกว่าเกณฑ์</p>
          </div>
        </InlineAlert>
      </div>
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
        {selected ? <HistoryDetail request={selected} logs={logs} aiFeedbackLogs={selectedFeedbackLogs} onSaveFeedback={onSaveFeedback} /> : null}
      </div>
    </>
  );
}

function HistoryDetail({
  request,
  logs,
  aiFeedbackLogs,
  onSaveFeedback,
}: {
  request: PurchaseRequest;
  logs: SupplierContactLog[];
  aiFeedbackLogs: AiSuggestionFeedback[];
  onSaveFeedback: (request: PurchaseRequest, actualQuantity: number, note: string) => void;
}) {
  const sku = getSku(request.skuId);
  const supplier = getSupplier(request.supplierId);
  const [actualQuantity, setActualQuantity] = useState(request.approvedQuantity ?? request.requestedQuantity);
  const [feedbackNote, setFeedbackNote] = useState("บันทึกผลจริงเพื่อเทียบกับ AI Suggest");

  useEffect(() => {
    setActualQuantity(request.approvedQuantity ?? request.requestedQuantity);
    setFeedbackNote("บันทึกผลจริงเพื่อเทียบกับ AI Suggest");
  }, [request.id, request.approvedQuantity, request.requestedQuantity]);

  const previewError = calculateAiSuggestionError(request.aiSuggestedQuantity, actualQuantity);

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
          <h3 className="font-semibold text-slate-950">AI Feedback: เทียบค่าที่ระบบแนะนำกับค่าจริง</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            หาก AI Suggest ไม่ตรงกับการใช้งานจริง ให้บันทึกจำนวนจริงตรงนี้ ระบบจะเก็บ error เทียบกับ snapshot เดิม และถ้า error เกินเกณฑ์ใน Settings จะ auto-tune policy แบบก้าวเล็กพร้อมสร้างสูตรเวอร์ชันใหม่
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            การ auto-tune มีผลกับการคำนวณครั้งถัดไปเท่านั้น ไม่แก้ Request History หรือ Calculation Snapshot เดิมย้อนหลัง
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={`จำนวนจริง (${request.unit})`} hint="อาจเป็นจำนวนที่ใช้จริงหลังรอบแผน หรือจำนวนที่ควรเติมจริงหลังตรวจสอบหน้างาน">
              <EditableNumberInput min="0" value={actualQuantity} onValueChange={setActualQuantity} />
            </Field>
            <Field label="หมายเหตุผลจริง">
              <input className={inputClass} value={feedbackNote} onChange={(event) => setFeedbackNote(event.target.value)} />
            </Field>
          </div>
          <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            <p>AI Suggested Quantity = {formatNumber(request.aiSuggestedQuantity)} {request.unit}</p>
            <p>Actual Quantity = {formatNumber(actualQuantity)} {request.unit}</p>
            <p>ส่วนต่าง = {previewError.errorQuantity > 0 ? "+" : ""}{formatNumber(previewError.errorQuantity)} {request.unit} ({formatPercent(previewError.errorPercent)})</p>
          </div>
          <Button className="mt-4 w-full" onClick={() => onSaveFeedback(request, actualQuantity, feedbackNote)}>บันทึก AI Feedback</Button>
          <div className="mt-4">
            <DataTable columns={["วันที่", "ค่าจริง", "ส่วนต่าง", "% Error", "หมายเหตุ"]} empty={aiFeedbackLogs.length === 0}>
              {aiFeedbackLogs.map((feedback) => (
                <tr key={feedback.id}>
                  <td className="px-4 py-3">{feedback.createdAt}</td>
                  <td className="px-4 py-3">{formatNumber(feedback.actualQuantity)} {request.unit}</td>
                  <td className="px-4 py-3">{feedback.errorQuantity > 0 ? "+" : ""}{formatNumber(feedback.errorQuantity)} {request.unit}</td>
                  <td className="px-4 py-3">{formatPercent(feedback.errorPercent)}</td>
                  <td className="px-4 py-3">{feedback.note}</td>
                </tr>
              ))}
            </DataTable>
          </div>
        </Card>
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
      <div className="mb-5">
        <InlineAlert tone="info">
          <div className="space-y-1">
            <p>ที่มาของคะแนน VMI: คะแนนรวม = Demand Stability + Supplier Reliability + Usage Frequency + Lead Time Stability + Inventory Value Impact - Procurement Complexity Penalty</p>
            <p>ค่าจะเปลี่ยนเมื่อมีข้อมูล usage, lead time, supplier reliability, ราคา หรือมูลค่าสินค้าคงคลังใหม่ และ VMI ใน PoC นี้เป็นการจำลอง ไม่ใช่การเติมของจริงโดยซัพพลายเออร์</p>
          </div>
        </InlineAlert>
      </div>
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
            ระบบแนะนำ 1CC0CG0002 สายเคเบิลใต้ดิน XLPE 240 ตร.มม. เป็นรายการเหมาะกับ VMI อันดับหนึ่ง เพราะความต้องการใช้มีเสถียรภาพสูง ซัพพลายเออร์มีความน่าเชื่อถือ 96% และได้คะแนน 88
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
  const record = applyFormulaPolicy(inventoryRecords.find((item) => item.skuId === "1CC0CG0002") ?? inventoryRecords[0], formulaPolicy);
  const supplierRecord = getSupplierSkuRecord("S001", "1CC0CG0002", supplierOfferData);
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
          <div className="space-y-1">
            <p>VMI ใน PoC นี้เป็นการจำลองผลลัพธ์ ไม่ใช่การให้ Supplier เติมของจริง ใช้เพื่อเปรียบเทียบผลกระทบก่อนตัดสินใจทดลองในระดับเขต</p>
            <p>สูตรหลัก: VMI Safety Stock = Z-score × Demand Variability × √VMI Lead Time, VMI Reorder Point = Average Demand × VMI Lead Time + VMI Safety Stock, Impact = ค่า VMI - ค่าปัจจุบัน</p>
          </div>
        </InlineAlert>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <SectionHeader title="ตารางเปรียบเทียบ" subtitle="C01 สายเคเบิลใต้ดิน XLPE 240 · I010" />
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

const formulaSettingHelp = {
  formulaVersion:
    "ระบบเปลี่ยนอัตโนมัติเมื่อมีการแก้ค่า policy ที่กระทบการคำนวณ เช่น v1.0 เป็น v1.1 ใช้ติดป้ายเวอร์ชันใน Calculation Snapshot และ Audit Trail",
  serviceLevel:
    "ใช้กำหนดระดับความมั่นใจว่าพัสดุจะเพียงพอ ระบบจะคำนวณ Z-score ให้อัตโนมัติ เมื่อบันทึกแล้วหน้า Dashboard, SKU Detail, Create Request และ VMI จะคำนวณ Safety Stock / Reorder Point ใหม่",
  zScore:
    "เป็นค่าทางสถิติที่แปลงจาก Service Level และใช้ในสูตร Safety Stock ช่องนี้อ่านอย่างเดียวเพื่อป้องกัน Service Level กับ Z-score ไม่ตรงกัน",
  seasonalFactor:
    "ใช้ปรับ Lead Time ตามฤดูกาลหรือช่วง demand สูง เมื่อบันทึกแล้วการคำนวณใหม่จะเปลี่ยน Adjusted Lead Time, Safety Stock, Reorder Point และ Suggested Quantity",
  budgetFactor:
    "ใช้ปรับ Lead Time จากข้อจำกัดงบประมาณหรือรอบอนุมัติ เมื่อบันทึกแล้วการคำนวณใหม่จะเปลี่ยน Adjusted Lead Time, Safety Stock, Reorder Point และ Suggested Quantity",
  highVarianceThreshold:
    "ใช้ตรวจว่าผู้ใช้ขอจำนวนต่างจาก AI Suggested Quantity มากเกินเกณฑ์หรือไม่ เมื่อบันทึกแล้วฟอร์ม Create Request จะใช้เกณฑ์ใหม่นี้ในการบังคับรายละเอียดเหตุผล",
  versionNote:
    "ใช้เป็นคำอธิบายในประวัติเวอร์ชันสูตรและ change log เพื่อให้ผู้ตรวจสอบรู้ว่าเปลี่ยน policy เพราะอะไร ไม่กระทบสูตรโดยตรง",
};

function BudgetSettingsPage({
  budgetSettings,
  changeLogs,
  onSave,
}: {
  budgetSettings: BudgetSettingsState;
  changeLogs: ChangeLogEntry[];
  onSave: (settings: BudgetSettingsState, note: string) => void;
}) {
  const [draftBudget, setDraftBudget] = useState<BudgetInputDraftState>(() => budgetSettingsToInputDraft(budgetSettings));
  const [budgetNote, setBudgetNote] = useState("ปรับงบประมาณสำหรับการตรวจสอบเส้นทางอนุมัติ");
  const budgetLogs = changeLogs.filter((log) => log.area === "Budget").slice(0, 12);
  const draftBudgetSettings = budgetInputDraftToSettings(draftBudget, budgetSettings);
  const localTotal = warehouses.reduce((sum, warehouse) => sum + (draftBudgetSettings.localBudgets[warehouse.id] ?? warehouse.localBudget), 0);
  const regionalTotal = regionalBudgets.reduce((sum, budget) => sum + (draftBudgetSettings.regionalBudgets[budget.region] ?? budget.remaining), 0);

  useEffect(() => {
    setDraftBudget(budgetSettingsToInputDraft(budgetSettings));
  }, [budgetSettings]);

  const updateLocalBudget = (warehouseId: string, value: string) => {
    setDraftBudget((current) => ({
      ...current,
      localBudgets: {
        ...current.localBudgets,
        [warehouseId]: value,
      },
    }));
  };

  const updateRegionalBudget = (region: BudgetRegion, value: string) => {
    setDraftBudget((current) => ({
      ...current,
      regionalBudgets: {
        ...current.regionalBudgets,
        [region]: value,
      },
    }));
  };

  return (
    <>
      <PageTitle
        eyebrow="ตั้งค่างบประมาณ"
        title="งบประมาณคลัง เขต และส่วนกลาง"
        subtitle="แก้ไขงบคงเหลือที่ใช้ตรวจ Budget Check และกำหนดเส้นทางอนุมัติของคำขอซื้อ"
      />

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          label="งบคลังพื้นที่รวม"
          value={formatTHB(localTotal)}
          helper={`${warehouses.length} คลัง`}
          formula={`ผลรวม Local Budget ของทุกคลัง demo = ${formatTHB(localTotal)}`}
          changes="แก้งบคลังพื้นที่ในหน้านี้"
        />
        <MetricCard
          label="งบระดับเขตรวม"
          value={formatTHB(regionalTotal)}
          helper={`${regionalBudgets.length} เขต`}
          tone="blue"
          formula={`ผลรวม Regional Budget ทุกเขต = ${formatTHB(regionalTotal)}`}
          changes="แก้งบระดับเขตในหน้านี้"
        />
        <MetricCard
          label="งบส่วนกลาง"
          value={formatTHB(draftBudgetSettings.centralBudgetRemaining)}
          helper="Central National"
          tone="green"
          formula={`อ่านจาก Central Budget Remaining = ${formatTHB(draftBudgetSettings.centralBudgetRemaining)}`}
          changes="แก้งบส่วนกลางในหน้านี้"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <Card>
            <SectionHeader
              title="งบคลังพื้นที่ (Local Budget)"
              subtitle="ใช้เทียบขั้นแรกของ Approval Routing: ถ้า Estimated Cost ไม่เกินงบคลัง ระบบจะแนะนำอนุมัติระดับคลัง"
            />
            <DataTable columns={["WH Id", "คลัง", "ภูมิภาค", "งบคงเหลือ", "คำอธิบาย"]}>
              {warehouses.map((warehouse) => (
                <tr key={warehouse.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{warehouse.id}</td>
                  <td className="px-4 py-3">{warehouse.name}</td>
                  <td className="px-4 py-3">{regionLabels[warehouse.region]}</td>
                  <td className="min-w-52 px-4 py-3">
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      value={draftBudget.localBudgets[warehouse.id] ?? ""}
                      onChange={(event) => updateLocalBudget(warehouse.id, event.target.value)}
                    />
                  </td>
                  <td className="min-w-72 px-4 py-3 text-sm leading-6 text-slate-500">
                    ค่านี้ใช้ใน Budget Check ระดับคลังของ {warehouse.id}; หลังบันทึกจะกระทบ Create Request / SKU Detail / Dashboard ทันที แต่ไม่แก้ snapshot เก่า
                  </td>
                </tr>
              ))}
            </DataTable>
          </Card>

          <Card>
            <SectionHeader
              title="งบระดับเขต (Regional Budget)"
              subtitle="ใช้เมื่อคำขอมีมูลค่าเกินงบคลังพื้นที่ หากยังไม่เกินงบเขต ระบบจะแนะนำส่งอนุมัติระดับเขต"
            />
            <DataTable columns={["ภูมิภาค", "งบคงเหลือ", "คำอธิบาย"]}>
              {regionalBudgets.map((budget) => (
                <tr key={budget.region}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{regionLabels[budget.region]}</td>
                  <td className="min-w-52 px-4 py-3">
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      value={draftBudget.regionalBudgets[budget.region] ?? ""}
                      onChange={(event) => updateRegionalBudget(budget.region, event.target.value)}
                    />
                  </td>
                  <td className="min-w-72 px-4 py-3 text-sm leading-6 text-slate-500">
                    ใช้เทียบกับ Estimated Cost หลังงบคลังไม่พอ ถ้างบเขตไม่พอ ระบบจะส่งต่อส่วนกลาง
                  </td>
                </tr>
              ))}
            </DataTable>
          </Card>

          <Card className="p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="งบส่วนกลาง (Central National)"
                hint="ใช้เมื่อ Estimated Cost เกินงบคลังและงบเขต ลบค่าว่างได้ระหว่างพิมพ์ และระบบจะแปลงค่าว่างเป็น 0 ตอนบันทึก"
              >
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  value={draftBudget.centralBudgetRemaining}
                  onChange={(event) => setDraftBudget((current) => ({ ...current, centralBudgetRemaining: event.target.value }))}
                />
              </Field>
              <Field label="อัปเดตล่าสุด" hint="ระบบบันทึกเวลาปัจจุบันเมื่อกดบันทึก">
                <input className={`${inputClass} bg-slate-50 text-slate-600`} value={budgetSettings.updatedAt} readOnly />
              </Field>
              <div className="md:col-span-2">
                <Field label="หมายเหตุการแก้งบ" hint="ใช้ใน Budget Change Log เพื่อบอกเหตุผลการปรับงบ">
                  <textarea className={textareaClass} value={budgetNote} onChange={(event) => setBudgetNote(event.target.value)} />
                </Field>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setDraftBudget(budgetSettingsToInputDraft(defaultBudgetSettings))}>
                รีเซ็ตเป็นค่า seed
              </Button>
              <Button type="button" onClick={() => onSave(budgetInputDraftToSettings(draftBudget, budgetSettings), budgetNote)}>
                บันทึกงบประมาณ
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-950">ผลกระทบของการแก้งบ</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <InlineAlert tone="info">
                งบที่บันทึกจะถูกใช้ทันทีในการคำนวณ Budget Check และ Recommended Approval Layer ของคำขอใหม่หรือ preview ใหม่
              </InlineAlert>
              <p><span className="font-semibold text-slate-800">Local:</span> ถ้า Estimated Cost ≤ งบคลัง → อนุมัติระดับคลัง</p>
              <p><span className="font-semibold text-slate-800">Regional:</span> ถ้างบคลังไม่พอ แต่ Estimated Cost ≤ งบเขต → ส่งอนุมัติระดับเขต</p>
              <p><span className="font-semibold text-slate-800">Central:</span> ถ้างบเขตไม่พอ → ส่งต่อส่วนกลาง</p>
              <p className="text-xs text-slate-500">Request History และ Calculation Snapshot เดิมจะไม่เปลี่ยนย้อนหลัง เพราะ snapshot ต้องเก็บงบ ณ วันที่สร้างคำขอ</p>
            </div>
          </Card>

          <Card>
            <SectionHeader title="ประวัติการแก้งบประมาณ" subtitle="แสดง log ของ Local, Regional และ Central Budget" />
            <DataTable columns={["วันที่", "เป้าหมาย", "ฟิลด์", "ค่าเดิม", "ค่าใหม่", "หมายเหตุ"]} empty={budgetLogs.length === 0}>
              {budgetLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3">{log.createdAt}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{log.target}</td>
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

function SettingsPage({
  formulaPolicy,
  formulaVersions,
  changeLogs,
  onSaveFormulaPolicy,
  onClearDemoHistory,
}: {
  formulaPolicy: FormulaPolicyState;
  formulaVersions: FormulaVersionRecord[];
  changeLogs: ChangeLogEntry[];
  onSaveFormulaPolicy: (policy: FormulaPolicyState, note: string) => void;
  onClearDemoHistory: () => void;
}) {
  const [draftPolicy, setDraftPolicy] = useState(formulaPolicy);
  const [versionNote, setVersionNote] = useState("ปรับค่านโยบายสำหรับการวางแผนพัสดุคงคลัง");
  const settingsLogs = changeLogs.filter((log) => log.area === "Settings").slice(0, 10);

  // หน้าตั้งค่าแก้ค่านโยบายสูตรได้ใน local state ก่อน
  // เมื่อกดบันทึกเป็นเวอร์ชันใหม่ จึงบันทึกเป็นเวอร์ชันสูตรใหม่และสร้างประวัติการตรวจสอบ
  const updateDraftNumber = (field: keyof Omit<FormulaPolicyState, "formulaVersion">, value: number) => {
    setDraftPolicy((current) => applyAutoFormulaVersion(formulaPolicy, { ...current, [field]: value }));
  };
  const updateDraftServiceLevel = (value: number) => {
    // ให้ผู้ใช้ปรับระดับความมั่นใจอย่างเดียว แล้วคำนวณ Z-score จากความสัมพันธ์ทางสถิติ
    // ลดความสับสนและป้องกันระดับความมั่นใจกับ Z-score ไม่ตรงกัน
    setDraftPolicy((current) =>
      applyAutoFormulaVersion(formulaPolicy, {
        ...current,
        serviceLevel: value,
        zScore: calculateZScoreFromServiceLevel(value),
      }),
    );
  };

  useEffect(() => {
    setDraftPolicy(formulaPolicy);
  }, [formulaPolicy]);

  return (
    <>
      <PageTitle eyebrow="ตั้งค่า" title="สูตรคำนวณและนโยบาย" subtitle="ตั้งค่าเวอร์ชันสูตร นโยบายอนุมัติ และนโยบายการขอแตกต่างจากค่าที่ระบบแนะนำสำหรับต้นแบบ" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <SectionHeader title={`เวอร์ชันสูตร ${draftPolicy.formulaVersion}`} subtitle="แก้ไขค่านโยบายแล้วบันทึกเป็นเวอร์ชันใหม่เพื่อใช้ตรวจสอบย้อนหลัง" />
          <div className="border-b border-slate-200 p-5">
            <InlineAlert tone="info">
              <p>
                การแก้ไขในหน้านี้จะมีผลหลังจากกดบันทึกเป็นเวอร์ชันสูตรใหม่ ค่าที่คำนวณใหม่ใน Dashboard, SKU Detail, Create Request และ VMI
                จะใช้ policy ล่าสุด ส่วน Request History และ Calculation Snapshot เดิมจะไม่เปลี่ยนย้อนหลัง
              </p>
              <p>
                ถ้าผู้ใช้บันทึก AI Feedback แล้ว error สูงกว่าเกณฑ์ส่วนต่างสูง ระบบจะปรับ Service Level และ Seasonal Factor ทีละน้อย พร้อมสร้างสูตรเวอร์ชันใหม่อัตโนมัติเพื่อใช้กับการคำนวณครั้งถัดไป
              </p>
            </InlineAlert>
          </div>
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            <Field label="เวอร์ชันสูตร" hint={formulaSettingHelp.formulaVersion}>
              <input className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-600`} value={draftPolicy.formulaVersion} readOnly />
            </Field>
            <Field label="ระดับความมั่นใจ" hint={formulaSettingHelp.serviceLevel}>
              <EditableNumberInput step="0.005" min="0.8" max="0.995" value={draftPolicy.serviceLevel} onValueChange={updateDraftServiceLevel} />
            </Field>
            <Field label="Z-score ที่ระบบคำนวณ" hint={formulaSettingHelp.zScore}>
              <input className={inputClass} type="number" value={draftPolicy.zScore} readOnly />
            </Field>
            <Field label="ค่าตั้งต้นตัวคูณฤดูกาล" hint={formulaSettingHelp.seasonalFactor}>
              <EditableNumberInput step="0.01" value={draftPolicy.seasonalFactor} onValueChange={(value) => updateDraftNumber("seasonalFactor", value)} />
            </Field>
            <Field label="ค่าตั้งต้นตัวคูณงบประมาณ" hint={formulaSettingHelp.budgetFactor}>
              <EditableNumberInput step="0.01" value={draftPolicy.budgetFactor} onValueChange={(value) => updateDraftNumber("budgetFactor", value)} />
            </Field>
            <Field label="เกณฑ์ส่วนต่างสูง (%)" hint={formulaSettingHelp.highVarianceThreshold}>
              <EditableNumberInput step="1" value={draftPolicy.highVarianceThreshold} onValueChange={(value) => updateDraftNumber("highVarianceThreshold", value)} />
            </Field>
            <div className="md:col-span-2">
              <Field label="หมายเหตุเวอร์ชัน" hint={formulaSettingHelp.versionNote}>
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
              {formulaVersions.map((version, index) => (
                <tr key={`${version.formulaVersion}-${version.createdAt}-${index}`}>
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
              <p className="text-xs leading-5 text-slate-500">
                เส้นทางอนุมัติจะถูกคำนวณใหม่ทุกครั้งที่สร้างคำขอหรือเปลี่ยน Requested Quantity / Supplier Price โดยดูจาก Estimated Cost และงบคงเหลือ ณ เวลานั้น
              </p>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-950">นโยบายการขอแตกต่างจากค่าที่ระบบแนะนำ</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>ต้องระบุเหตุผลเมื่อจำนวนที่ขอต่างจากจำนวนที่ระบบแนะนำ</p>
              <p>เกณฑ์ส่วนต่างสูง = {draftPolicy.highVarianceThreshold}%</p>
              <p>แสดงคำเตือนเมื่อขอมากกว่าหรือน้อยกว่าคำแนะนำของระบบ</p>
              <p className="text-xs leading-5 text-slate-500">
                เมื่อบันทึก policy ใหม่ เกณฑ์นี้จะมีผลกับการสร้างหรือแก้ไขคำขอครั้งถัดไปทันที แต่ไม่แก้เหตุผลหรือสถานะของคำขอที่ส่งไปแล้ว
              </p>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-950">กฎการเก็บข้อมูล</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>ข้อมูล seed ใช้เฉพาะตอนเริ่มต้น หลังจากผู้ใช้แก้ไข ระบบจะเก็บเป็น JSON state ใน browser storage</p>
              <p>Request, Approval, Supplier, SKU, Settings และ Calculation Snapshot ต้องถูกเก็บไว้หลัง refresh</p>
              <p>ค่าคำนวณต้องคำนวณจากข้อมูลปัจจุบัน และ snapshot ต้องเก็บค่าตามเวลาที่สร้างคำขอ</p>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-950">ล้างประวัติทดสอบ</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>ใช้เมื่อต้องการลด log ที่เกิดจากการทดสอบซ้ำ ๆ ระบบจะรีเซ็ต Request History, Approval Timeline, Contact History, Settings Change Log และ Formula Version History</p>
              <p className="text-xs leading-5 text-slate-500">ไม่ลบ Supplier, SKU, Supported Items, ราคา, Lead Time, MOQ หรือค่าตั้งค่า policy ปัจจุบัน</p>
              <Button variant="danger" className="w-full" onClick={onClearDemoHistory}>ล้างประวัติทดสอบ</Button>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-950">Google Sheet PO Feedback</h3>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>สถานะ endpoint: <span className="font-semibold text-slate-950">{isGooglePoFeedbackEnabled() ? "เปิดใช้งาน" : "ยังไม่ได้ตั้งค่า"}</span></p>
              <p>ระบบจะส่งสำเนา event ตอนบันทึก/ส่งคำขอซื้อและตอนอนุมัติไปยัง Google endpoint ถ้าตั้งค่า `VITE_GOOGLE_PO_FEEDBACK_ENDPOINT`</p>
              <p>endpoint นี้เป็นช่องทาง feedback เพิ่มเติม ระบบยังเก็บข้อมูลหลักไว้ใน JSON state เหมือนเดิม</p>
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
    localBudget: "งบคลังพื้นที่",
    regionalBudget: "งบระดับเขต",
    centralBudget: "งบส่วนกลาง",
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

function getSku(id: string): Sku {
  const demo = skus.find((sku) => sku.id === id);
  if (demo) return demo;
  // SKU ที่ไม่ได้อยู่ในชุด demo (อีก 5 ตัวใน catalog) — ดึงชื่อ/หน่วยจาก catalog ให้ถูกต้อง
  const cat = getCatalogSku(id);
  if (cat) {
    return { id: cat.skuId, name: cat.skuName, category: cat.category, unit: cat.unit, criticality: cat.criticality === "Low" ? "Medium" : cat.criticality };
  }
  return skus[0];
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

function getRegionalBudget(region: string, budgetSettings: BudgetSettingsState = defaultBudgetSettings) {
  if (region === "National") return budgetSettings.centralBudgetRemaining;
  return budgetSettings.regionalBudgets[region as BudgetRegion] ?? regionalBudgets.find((budget) => budget.region === region)?.remaining ?? 0;
}

function getBudgetContextForInventory(inventory: InventoryRecord, budgetSettings: BudgetSettingsState = defaultBudgetSettings): BudgetContext {
  const warehouse = getWarehouse(inventory.warehouseId);

  return {
    localBudgetRemaining: budgetSettings.localBudgets[warehouse.id] ?? warehouse.localBudget,
    regionalBudgetRemaining: getRegionalBudget(warehouse.region, budgetSettings),
    centralBudgetRemaining: budgetSettings.centralBudgetRemaining,
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

function getInventoryStatusFromRecommendation(
  inventory: InventoryRecord,
  recommendation: Pick<ReturnType<typeof calculateInventoryRecommendation>, "safetyStock" | "reorderPoint">,
): StockStatus {
  if (inventory.currentStock <= recommendation.safetyStock) return "Critical";
  if (inventory.currentStock <= recommendation.reorderPoint) return "Near Reorder Point";
  return "Normal";
}

function buildActualCalculationCards(
  inventory: InventoryRecord,
  recommendation: InventoryCalculationResult | PurchaseRequestCalculationSnapshot,
  unit: string,
) {
  const reorderPointRaw = recommendation.demandDuringLeadTime + recommendation.safetyStock;
  const rawSuggestedQuantity = recommendation.targetStockLevel - inventory.currentStock;
  const requestedQuantity = "requestedQuantity" in recommendation ? recommendation.requestedQuantity : recommendation.suggestedQuantity;
  const estimatedCost =
    "estimatedCostForRequestedQuantity" in recommendation
      ? recommendation.estimatedCostForRequestedQuantity
      : requestedQuantity * recommendation.unitPrice;
  const targetSource =
    recommendation.targetStockLevelSource === "PolicyOverride"
      ? "Policy/Min-Max target"
      : "Forecast Demand + Safety Stock";

  return [
    {
      title: "ค่าเฉลี่ยการใช้ต่อวัน",
      calculation: `${formatNumber(recommendation.historicalUsageTotal)} ${unit} / ${recommendation.historicalUsageDays} วัน = ${formatNumber(recommendation.averageDailyDemand)} ${unit}/วัน`,
      changes: "ข้อมูลการใช้ย้อนหลังหรือจำนวนวันย้อนหลังเปลี่ยน",
    },
    {
      title: "ความผันผวนของการใช้",
      calculation: `SD รายงวด ${formatNumber(recommendation.demandVariabilityPerPeriod)} ${unit}/งวด แปลงเป็น ${formatNumber(recommendation.demandVariabilityPerDay)} ${unit}/วัน`,
      changes: "รูปแบบการใช้ย้อนหลังรายเดือน/รายงวดเปลี่ยน",
    },
    {
      title: "ระยะเวลารอพัสดุที่ปรับแล้ว",
      calculation: `${formatNumber(recommendation.supplierLeadTimeDays)} วัน × ${formatNumber(recommendation.seasonalFactor)} × ${formatNumber(recommendation.budgetFactor)} = ${formatNumber(recommendation.adjustedLeadTimeDays)} วัน`,
      changes: "Lead Time ของซัพพลายเออร์, Seasonal Factor หรือ Budget Factor เปลี่ยน",
    },
    {
      title: "ระดับพัสดุสำรองปลอดภัย",
      calculation: `${formatNumber(recommendation.zScore)} × ${formatNumber(recommendation.demandVariabilityPerDay)} × √${formatNumber(recommendation.adjustedLeadTimeDays)} ≈ ${formatNumber(recommendation.safetyStock)} ${unit}`,
      changes: "Service Level/Z-score, Demand Variability หรือ Adjusted Lead Time เปลี่ยน",
    },
    {
      title: "ความต้องการใช้ระหว่างรอพัสดุ",
      calculation: `${formatNumber(recommendation.averageDailyDemand)} ${unit}/วัน × ${formatNumber(recommendation.adjustedLeadTimeDays)} วัน = ${formatNumber(recommendation.demandDuringLeadTime)} ${unit}`,
      changes: "Average Daily Demand หรือ Adjusted Lead Time เปลี่ยน",
    },
    {
      title: "จุดสั่งซื้อใหม่",
      calculation: `${formatNumber(recommendation.demandDuringLeadTime)} ${unit} + ${formatNumber(recommendation.safetyStock)} ${unit} = ${formatNumber(reorderPointRaw)} ${unit}; ปัดขึ้นเป็น ${formatNumber(recommendation.reorderPoint)} ${unit}`,
      changes: "Demand During Lead Time หรือ Safety Stock เปลี่ยน",
    },
    {
      title: "ระดับสต็อกเป้าหมาย",
      calculation: `${formatNumber(recommendation.targetStockLevel)} ${unit} จาก ${targetSource}`,
      changes: "Forecast Demand, Safety Stock หรือ Policy Override เปลี่ยน",
    },
    {
      title: "จำนวนที่ระบบแนะนำ",
      calculation: `${formatNumber(recommendation.targetStockLevel)} ${unit} - ${formatNumber(inventory.currentStock)} ${unit} = ${formatNumber(rawSuggestedQuantity)} ${unit}; ปัดตาม MOQ ${formatNumber(recommendation.moq)} เป็น ${formatNumber(recommendation.suggestedQuantity)} ${unit}`,
      changes: "Target Stock, Current Stock หรือ MOQ เปลี่ยน",
    },
    {
      title: "มูลค่าประมาณการ",
      calculation: `${formatNumber(requestedQuantity)} ${unit} × ${formatCurrency(recommendation.unitPrice)} = ${formatCurrency(estimatedCost)}`,
      changes: "Requested Quantity หรือ Unit Price ของซัพพลายเออร์เปลี่ยน",
    },
  ];
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
  const changedFields = (Object.keys(newPolicy) as Array<keyof FormulaPolicyState>).filter((field) => oldPolicy[field] !== newPolicy[field]);

  changedFields.forEach((field) => {
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

function hasBudgetSettingsChange(oldSettings: BudgetSettingsState, newSettings: BudgetSettingsState) {
  const localChanged = warehouses.some((warehouse) => oldSettings.localBudgets[warehouse.id] !== newSettings.localBudgets[warehouse.id]);
  const regionalChanged = regionalBudgets.some((budget) => oldSettings.regionalBudgets[budget.region] !== newSettings.regionalBudgets[budget.region]);
  const centralChanged = oldSettings.centralBudgetRemaining !== newSettings.centralBudgetRemaining;

  return localChanged || regionalChanged || centralChanged;
}

function addBudgetChangeLogs(
  oldSettings: BudgetSettingsState,
  newSettings: BudgetSettingsState,
  note: string,
  addLog: (entry: Omit<ChangeLogEntry, "id" | "actor" | "createdAt">) => void,
) {
  // Budget log แยกจาก Settings เพราะงบประมาณมีผลต่อ Approval Routing โดยตรง
  // แต่ไม่ใช่ formula version และไม่ควรแก้ Calculation Snapshot เดิมย้อนหลัง
  warehouses.forEach((warehouse) => {
    const oldValue = oldSettings.localBudgets[warehouse.id] ?? warehouse.localBudget;
    const newValue = newSettings.localBudgets[warehouse.id] ?? warehouse.localBudget;

    if (oldValue !== newValue) {
      addLog({
        area: "Budget",
        target: warehouse.id,
        field: "localBudget",
        oldValue: formatCurrency(oldValue),
        newValue: formatCurrency(newValue),
        note,
      });
    }
  });

  regionalBudgets.forEach((budget) => {
    const oldValue = oldSettings.regionalBudgets[budget.region] ?? budget.remaining;
    const newValue = newSettings.regionalBudgets[budget.region] ?? budget.remaining;

    if (oldValue !== newValue) {
      addLog({
        area: "Budget",
        target: budget.region,
        field: "regionalBudget",
        oldValue: formatCurrency(oldValue),
        newValue: formatCurrency(newValue),
        note,
      });
    }
  });

  if (oldSettings.centralBudgetRemaining !== newSettings.centralBudgetRemaining) {
    addLog({
      area: "Budget",
      target: "Central National",
      field: "centralBudget",
      oldValue: formatCurrency(oldSettings.centralBudgetRemaining),
      newValue: formatCurrency(newSettings.centralBudgetRemaining),
      note,
    });
  }
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





