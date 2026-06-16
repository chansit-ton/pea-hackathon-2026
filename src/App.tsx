import { useState, useRef, Fragment, type ReactNode, type CSSProperties } from "react";
import { useEffect, type InputHTMLAttributes } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  ChevronRight,
  Clock,
  CloudLightning,
  FlaskConical,
  FunctionSquare,
  GitCommitHorizontal,
  GitCompareArrows,
  GitMerge,
  Lightbulb,
  Percent,
  Shield,
  TrendingUp,
  ArrowDown,
  ArrowDownUp,
  ArrowRight,
  ArrowUp,
  ArrowRightLeft,
  Archive,
  Building2,
  Cable,
  Camera,
  Check,
  Construction,
  Database,
  Download,
  Eye,
  EyeOff,
  FileDown,
  FileSpreadsheet,
  Flag,
  GitBranch,
  GitCommit,
  GitCompare,
  Import as ImportIcon,
  Plug,
  UploadCloud,
  Hand,
  HandCoins,
  Home,
  Inbox,
  Lock,
  RefreshCcw,
  Repeat2,
  Route,
  Save,
  ShoppingCart,
  SearchCheck,
  Target,
  Warehouse as WarehouseIcon,
  BarChart3,
  Boxes,
  BrainCircuit,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  History,
  Landmark,
  LayoutDashboard,
  LineChart,
  Mail,
  Megaphone,
  MapPin,
  Menu,
  MessageSquare,
  Minus,
  Moon,
  Navigation,
  Package,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Play,
  Plus,
  Quote,
  Radar,
  Recycle,
  Scale,
  ScrollText,
  Satellite,
  Search,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Repeat,
  Timer,
  Sparkles,
  Star,
  Sun,
  Truck,
  User,
  LogOut,
  Workflow,
  X,
  Zap,
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
  StatCard,
  Segmented,
  RailCard,
  s,
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
  RequestStatus,
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
  | "data"
  | "diff"
  | "brain"
  | "mobilize"
  | "disaster"
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
  data: "นำเข้าข้อมูล",
  diff: "เฝ้าระวัง Diff",
  brain: "สมองกลางพัสดุ",
  mobilize: "คำขอระดม (รับ)",
  disaster: "ศูนย์ระดมพัสดุฉุกเฉิน",
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
  // ตำแหน่ง/บทบาทที่เลือกตอนสมัคร (เดโม) — ใช้แสดงผล ไม่กระทบสิทธิ์จริง
  title?: string;
};
type SessionUser = {
  name: string;
  username: string;
  role: UserRole;
  // ป้ายบทบาทที่แสดงผล (เดโม): เจ้าหน้าที่คลัง / ผอ.เขต / นักวิเคราะห์ / God Mode — ไม่กระทบสิทธิ์จริง (role เป็นตัวคุม)
  title?: string;
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
  const [showIntro, setShowIntro] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showFormulas, setShowFormulas] = useState(false);
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
  const registerUser = (name: string, username: string, password: string, title?: string): boolean => {
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
    const newUser: AuthUser = { name: cleanName, username: cleanUsername, password, role: "user", title };
    setAuthUsers((current) => [...current, newUser]);
    setCurrentUser({ name: cleanName, username: cleanUsername, role: "user", title });
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
    setCurrentUser({ name: found.name, username: found.username, role: found.role, title: found.title });
    notify(`เข้าสู่ระบบเป็น ${found.name} แล้ว`);
    return true;
  };
  // เข้าเล่นเดโมตามบทบาท (bypass login) — สร้าง session ผู้ใช้จำลองแล้วเข้าแอปทันที God Mode = สิทธิ์ admin
  const demoLoginAs = (user: SessionUser) => {
    setCurrentUser(user);
    notify(`เข้าเล่นเดโมเป็น ${user.title ?? user.name} แล้ว`);
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
  // รีเซ็ตข้อมูลทั้งหมดกลับค่าเริ่มต้นจากโรงงาน — ล้าง localStorage ทุก key ของแอป (รวม Supplier/SKU/งบ/สูตร) แล้วโหลดใหม่เพื่อ re-seed
  const factoryResetAll = () => {
    const ok = window.confirm("รีเซ็ตข้อมูลทั้งหมดกลับค่าเริ่มต้น? จะลบทุกอย่างที่บันทึกไว้ (Supplier, SKU, งบประมาณ, สูตร, ประวัติ, บัญชีที่สมัคร) แล้วโหลดข้อมูลตั้งต้นใหม่ — ย้อนกลับไม่ได้");
    if (!ok) return;
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("pea-ai-inventory:")).forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem("pea-theme");
    } catch { /* ignore */ }
    window.location.reload();
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
            onOpenApproval={() => setView("approval")}
            onOpenHistory={() => setView("history")}
            onOpenRequest={() => setView("request")}
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
        return null;
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
            onFactoryReset={factoryResetAll}
          />
        );
      case "data":
        return <DataImportPage onBack={() => setView("dashboard")} />;
      case "diff":
        return <DiffMonitorPage onBack={() => setView("dashboard")} onOpenHistory={() => setView("history")} />;
      case "brain":
        return <MaterialsBrainPage onBack={() => setView("dashboard")} onOpenHistory={() => setView("history")} />;
      case "mobilize":
        return <MobilizeInboxPage onBack={() => setView("dashboard")} />;
      case "disaster":
        return <DisasterCenterPage onBack={() => setView("dashboard")} onOpenMobilize={() => setView("mobilize")} />;
      default:
        return null;
    }
  })();

  if (showFormulas) {
    return <FormulasPage onBack={() => setShowFormulas(false)} onEnter={() => { setShowFormulas(false); setShowLanding(false); setShowIntro(false); }} />;
  }

  if (showIntro) {
    return <IntroPage onEnter={() => setShowIntro(false)} />;
  }

  if (showLanding) {
    return (
      <LandingPage
        currentUser={currentUser}
        onBackToIntro={() => setShowIntro(true)}
        onOpenFormulas={() => setShowFormulas(true)}
        onEnter={() => setShowLanding(false)}
        onLogin={() => {
          setShowLanding(false);
          setView("auth");
        }}
      />
    );
  }

  if (view === "auth" && !currentUser) {
    return (
      <AuthPage
        onLogin={(u, p) => { const ok = loginUser(u, p); if (ok) setView("dashboard"); return ok; }}
        onRegister={(n, u, p, title) => { const ok = registerUser(n, u, p, title); if (ok) setView("dashboard"); return ok; }}
        onResetPassword={resetPassword}
        onGoogleLogin={(profile) => { loginWithGoogle(profile); setView("dashboard"); }}
        onDemoLogin={(user) => { demoLoginAs(user); setView("dashboard"); }}
        onBack={() => setShowLanding(true)}
      />
    );
  }

  return (
    <AppLayout view={view} formulaPolicy={formulaPolicy} onNavigate={setView} noteCount={procurementNotes.length} onAddNote={addPoNote} currentUser={currentUser} onLogout={logoutUser} onExitToLanding={() => setShowLanding(true)}>
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

// หน้า Intro / splash — แสดงก่อน landing พร้อมแอนิเมชัน เข้าหน้าแรกอัตโนมัติใน ~10 วิ หรือกดข้าม (พอร์ตจาก PEA Intro design)
function IntroPage({ onEnter }: { onEnter: () => void }) {
  useEffect(() => {
    const t = setTimeout(onEnter, 18000);
    return () => clearTimeout(t);
  }, [onEnter]);

  const stats: { value: string; label: string; color: string; delay: string }[] = [
    { value: "฿8.6M", label: "ทุนจมที่ดักได้", color: "#F472B6", delay: ".9s" },
    { value: "87%", label: "ความแม่นยำ AI", color: "#C77DFF", delay: "1.05s" },
    { value: "3 ชั้น", label: "อนุมัติงบ + Audit", color: "#FFD057", delay: "1.2s" },
  ];

  return (
    <div style={s("position:relative;width:100vw;height:100vh;overflow:hidden;font-family:Kanit,sans-serif;background:radial-gradient(120% 90% at 50% 8%,#23123F 0%,#160C2B 42%,#0B0717 100%);display:flex;flex-direction:column;align-items:center;")}>
      {/* animated grid floor */}
      <div style={s("position:absolute;inset:0;background-image:linear-gradient(rgba(168,85,247,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,.07) 1px,transparent 1px);background-size:52px 52px;mask-image:linear-gradient(180deg,transparent,#000 55%,#000 78%,transparent);-webkit-mask-image:linear-gradient(180deg,transparent,#000 55%,#000 78%,transparent);animation:gridFloat 6s linear infinite;")} />

      {/* ambient glows */}
      <div style={s("position:absolute;top:-160px;left:50%;transform:translateX(-50%);width:760px;height:560px;border-radius:50%;background:radial-gradient(circle,rgba(192,36,155,.34),transparent 62%);filter:blur(36px);animation:glowPulse 5.5s ease-in-out infinite;pointer-events:none;")} />
      <div style={s("position:absolute;bottom:-200px;left:18%;width:460px;height:460px;border-radius:50%;background:radial-gradient(circle,rgba(124,45,224,.26),transparent 64%);filter:blur(40px);animation:glowPulse 7s ease-in-out infinite;pointer-events:none;")} />
      <div style={s("position:absolute;top:30%;right:8%;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(232,74,160,.18),transparent 66%);filter:blur(38px);animation:glowPulse 6.2s ease-in-out infinite .8s;pointer-events:none;")} />

      {/* orbiting accent ring */}
      <div style={s("position:absolute;top:50%;left:50%;width:680px;height:680px;margin:-340px 0 0 -340px;animation:orbit 26s linear infinite;pointer-events:none;opacity:.5;")}>
        <span style={s("position:absolute;top:0;left:50%;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:#E84AA0;box-shadow:0 0 14px 3px rgba(232,74,160,.8);")} />
        <span style={s("position:absolute;bottom:6%;right:14%;width:5px;height:5px;border-radius:50%;background:#C77DFF;box-shadow:0 0 12px 2px rgba(199,125,255,.8);")} />
        <span style={s("position:absolute;top:24%;left:4%;width:6px;height:6px;border-radius:50%;background:#FFD057;box-shadow:0 0 12px 2px rgba(255,208,87,.8);")} />
      </div>

      {/* CENTER STAGE */}
      <div style={s("position:relative;z-index:5;flex:1;min-height:0;width:100%;max-width:880px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:28px 32px;")}>
        <div style={s("animation:scaleIn .8s cubic-bezier(.2,.8,.25,1) both;margin-bottom:16px;")}>
          <div style={s("position:relative;width:72px;height:72px;border-radius:22px;background:linear-gradient(140deg,#8B2FE6 0%,#B51C9E 52%,#E84AA0 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 22px 60px -16px rgba(184,40,170,.85),inset 0 1px 0 rgba(255,255,255,.32);animation:floatY 5s ease-in-out infinite;")}>
            <div style={s("position:absolute;top:-18px;left:-18px;width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.28);filter:blur(13px);")} />
            <div style={s("position:absolute;bottom:-22px;right:-12px;width:48px;height:48px;border-radius:50%;background:rgba(124,45,224,.6);filter:blur(15px);")} />
            <Boxes style={s("position:relative;width:38px;height:38px;color:#fff;")} />
            <span style={s("position:absolute;top:11px;right:11px;width:11px;height:11px;border-radius:50%;background:#FFD057;box-shadow:0 0 12px 2px rgba(255,208,87,.9);animation:blink 1.8s ease-in-out infinite;")} />
          </div>
        </div>

        <div style={s("display:inline-flex;align-items:center;gap:9px;padding:6px 15px;border-radius:99px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);margin-bottom:16px;animation:riseUpSm .7s ease .15s both;backdrop-filter:blur(6px);")}>
          <span style={s("width:7px;height:7px;border-radius:50%;background:#4ADE80;box-shadow:0 0 10px 2px rgba(74,222,128,.8);animation:blink 2s infinite;")} />
          <span style={s("font-size:12px;font-weight:500;letter-spacing:.5px;color:rgba(255,255,255,.72);")}>PEA × ThaiCloud Hackathon 2026 · Track 2</span>
        </div>

        <h1 style={s("margin:0 0 5px;font-size:40px;line-height:1.05;font-weight:600;letter-spacing:-.6px;color:#fff;animation:riseUp .8s ease .28s both;")}>
          PEA <span style={s("background:linear-gradient(100deg,#E84AA0,#C77DFF 60%,#8B6CFF);-webkit-background-clip:text;background-clip:text;color:transparent;")}>AI</span> Stock Intelligent
        </h1>
        <div style={s("font-size:14.5px;font-weight:300;color:rgba(255,255,255,.6);letter-spacing:1.5px;margin-bottom:16px;animation:riseUp .8s ease .4s both;")}>ระบบบริหารสต๊อคอัจฉริยะ</div>

        <p style={s("margin:0 0 22px;font-size:16.5px;line-height:1.5;font-weight:300;color:rgba(255,255,255,.82);max-width:640px;animation:riseUp .8s ease .52s both;")}>
          ระบบที่ถามก่อนว่า <span style={s("font-weight:500;color:#fff;")}>“จำเป็นต้องซื้อจริงไหม”</span><br />
          ลดของค้างก่อนขอซื้อ — เห็นของขาดและของเกินทั้งองค์กร
        </p>

        <div style={s("display:flex;align-items:stretch;gap:14px;margin-bottom:22px;animation:riseUp .8s ease .64s both;")}>
          {stats.map((st, i) => (
            <div key={st.label} style={s(`position:relative;padding:13px 20px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(8px);${i === 0 ? "overflow:hidden;" : ""}`)}>
              {i === 0 ? <div style={s("position:absolute;inset:0;background:linear-gradient(110deg,transparent,rgba(232,74,160,.16),transparent);animation:sweep 3.4s ease-in-out infinite;")} /> : null}
              <div style={s(`position:relative;font-size:24px;font-weight:700;color:${st.color};line-height:1;animation:countUp .6s ease ${st.delay} both;`)}>{st.value}</div>
              <div style={s("position:relative;font-size:11.5px;color:rgba(255,255,255,.55);margin-top:6px;")}>{st.label}</div>
            </div>
          ))}
        </div>

        <div style={s("display:flex;align-items:center;gap:16px;animation:riseUp .8s ease .78s both;")}>
          <button onClick={onEnter} style={s("position:relative;display:inline-flex;align-items:center;gap:11px;height:56px;padding:0 30px;border:0;border-radius:16px;background:linear-gradient(135deg,#7C2DE0,#C0249B);color:#fff;font-family:inherit;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 20px 44px -14px rgba(184,40,170,.9);overflow:hidden;")}>
            <span style={s("position:absolute;inset:0;background:linear-gradient(110deg,transparent,rgba(255,255,255,.28),transparent);animation:sweep 2.8s ease-in-out infinite 1.4s;")} />
            <Play style={s("position:relative;width:19px;height:19px;")} />
            <span style={s("position:relative;")}>เริ่มนำเสนอ</span>
          </button>
          <button onClick={onEnter} style={s("display:inline-flex;align-items:center;gap:8px;height:56px;padding:0 22px;border:1px solid rgba(255,255,255,.18);border-radius:16px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.86);font-family:inherit;font-size:15px;font-weight:500;cursor:pointer;backdrop-filter:blur(6px);")}>
            ข้ามไปหน้าแรก <ArrowRight style={s("width:17px;height:17px;")} />
          </button>
        </div>

        <div style={s("margin-top:18px;display:flex;align-items:center;gap:10px;animation:fadeIn 1s ease 1.2s both;")}>
          <div style={s("position:relative;width:150px;height:3px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden;")}>
            <div style={s("position:absolute;left:0;top:0;height:100%;border-radius:99px;background:linear-gradient(90deg,#7C2DE0,#E84AA0);width:0;animation:loadbar 17s linear .8s forwards;")} />
          </div>
          <span style={s("font-size:11.5px;color:rgba(255,255,255,.4);")}>เข้าสู่หน้าแรกอัตโนมัติ</span>
        </div>
      </div>

      <div style={s("position:relative;z-index:5;flex:none;text-align:center;padding-bottom:20px;animation:fadeIn 1s ease 1.5s both;")}>
        <span className="mono" style={s("font-size:10.5px;color:rgba(255,255,255,.32);letter-spacing:.5px;")}>PROTOTYPE · re-model 2026</span>
      </div>
    </div>
  );
}

// หน้าอ้างอิงสูตรการคำนวณ (Formula Reference) — full-screen ธีมมืด + side nav + 9 หมวดสูตร + ตัวอย่าง (พอร์ตจาก PEA Formulas design)
function FormulasPage({ onBack, onEnter }: { onBack: () => void; onEnter: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const navItems = [
    { id: "f-chain", no: "00", label: "ลำดับ End-to-End" },
    { id: "f-demand", no: "01", label: "ความต้องการใช้ & ผันผวน" },
    { id: "f-zscore", no: "02", label: "ความมั่นใจ → Z" },
    { id: "f-safety", no: "03", label: "รอของ & สต็อกสำรอง" },
    { id: "f-reorder", no: "04", label: "จุดสั่งซื้อใหม่" },
    { id: "f-suggest", no: "05", label: "จำนวนที่ควรซื้อ" },
    { id: "f-budget", no: "06", label: "ส่วนต่าง & อนุมัติงบ" },
    { id: "f-audit", no: "07", label: "ของค้าง & ตรวจสอบ" },
    { id: "f-vmi", no: "08", label: "จำลอง VMI" },
    { id: "f-feedback", no: "09", label: "ระบบเรียนรู้เอง" },
  ];
  const chain = [
    { n: 1, t: "Average Daily Demand", f: "Usage Total ÷ Usage Days", d: "ที่ผ่านมาใช้ของวันละกี่หน่วยโดยเฉลี่ย", pink: false, gold: false },
    { n: 2, t: "Demand Variability / day", f: "SD(period) ÷ √(days/period)", d: "การใช้แต่ละวันสวิงมากไหม — ยิ่งสวิงยิ่งต้องสำรอง", pink: false, gold: false },
    { n: 3, t: "Adjusted Lead Time", f: "LT × Seasonal × Budget", d: "เวลารอของจริง เผื่อหน้าฝน/สั่งเยอะให้รอนานขึ้น", pink: false, gold: false },
    { n: 4, t: "Safety Stock", f: "⌈ Z × σday × √LT ⌉", d: "ของสำรองกันเหนียว เผื่อช่วงรอของแล้วใช้เกินคาด", pink: false, gold: false },
    { n: 5, t: "Reorder Point", f: "⌈ DemandLT + Safety ⌉", d: "ของเหลือถึงจุดนี้เมื่อไหร่ ต้องรีบสั่งซื้อใหม่", pink: false, gold: false },
    { n: 6, t: "Target Stock Level", f: "Forecast + Safety / Policy", d: "ระดับของที่อยากให้มีหลังเติมเต็ม (เป้าหมาย)", pink: false, gold: false },
    { n: 7, t: "Suggested Quantity", f: "MOQ⌈ Target − Stock ⌉", d: "ขาดเท่าไหร่ซื้อเท่านั้น ปัดให้ครบลอตขั้นต่ำ", pink: true, gold: false },
    { n: 8, t: "Approval Layer + Snapshot", f: "Local / Regional / Central", d: "ส่งอนุมัติตามวงเงิน + เก็บ Snapshot ไว้ตรวจย้อนหลัง", pink: false, gold: true },
  ];

  const Code = ({ lines, pink }: { lines: { n: ReactNode; dim?: boolean }[]; pink?: boolean }) => (
    <div className="mono" style={s(`font-size:12.5px;color:${pink ? "#F9A8D4" : "#A5B4FC"};background:rgba(0,0,0,.28);border:1px solid ${pink ? "rgba(232,74,160,.18)" : "rgba(255,255,255,.07)"};border-radius:10px;padding:12px 14px;line-height:1.7;`)}>
      {lines.map((l, i) => <div key={i} style={l.dim ? s("color:rgba(255,255,255,.45);") : undefined}>{l.n}</div>)}
    </div>
  );
  const Tip = ({ children }: { children: ReactNode }) => (
    <div style={s("margin-top:11px;display:flex;align-items:flex-start;gap:9px;background:rgba(255,208,87,.08);border:1px solid rgba(255,208,87,.22);border-radius:10px;padding:9px 12px;")}><Lightbulb style={s("width:15px;height:15px;color:#FCD34D;margin-top:1px;")} /><span style={s("font-size:12.5px;color:rgba(255,255,255,.84);line-height:1.6;")}><b style={s("color:#FCD34D;")}>พูดง่ายๆ:</b> {children}</span></div>
  );
  const Card = ({ title, accent, children }: { title: string; accent?: boolean; children: ReactNode }) => (
    <div style={s(`background:rgba(255,255,255,.03);border:1px solid ${accent ? "rgba(232,74,160,.28)" : "rgba(255,255,255,.09)"};border-radius:16px;padding:18px;`)}>
      <div style={s("font-size:14px;font-weight:600;color:#fff;margin-bottom:10px;")}>{title}</div>
      {children}
    </div>
  );
  const Ex = ({ children }: { children: ReactNode }) => <p style={s("margin:10px 0 0;font-size:12px;color:rgba(255,255,255,.5);line-height:1.55;")}>{children}</p>;
  const Section = ({ id, title, Icon, iconBg, iconColor, children }: { id: string; title: string; Icon: typeof Shield; iconBg: string; iconColor: string; children: ReactNode }) => (
    <section id={id} style={s("scroll-margin-top:84px;margin-bottom:40px;")}>
      <div style={s("display:flex;align-items:center;gap:11px;margin-bottom:18px;")}><span style={s(`width:34px;height:34px;border-radius:10px;background:${iconBg};color:${iconColor};display:flex;align-items:center;justify-content:center;flex:none;`)}><Icon style={s("width:18px;height:18px;")} /></span><h2 style={s("margin:0;font-size:21px;font-weight:600;color:#fff;")}>{title}</h2></div>
      {children}
    </section>
  );
  const grid2 = s("display:grid;grid-template-columns:1fr 1fr;gap:14px;");

  return (
    <div ref={rootRef} className="landing-root" style={s("position:relative;height:100vh;width:100%;overflow-y:auto;overflow-x:hidden;font-family:Kanit,sans-serif;color:#fff;background:radial-gradient(100% 60% at 50% -5%,#1E1036 0%,#140C28 45%,#0B0717 100%);")}>
      {/* TOPBAR */}
      <header style={s("position:sticky;top:0;z-index:30;background:rgba(11,7,23,.82);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.07);")}>
        <div style={s("max-width:1240px;margin:0 auto;padding:16px 36px;display:flex;align-items:center;gap:16px;")}>
          <button onClick={onBack} style={s("text-decoration:none;display:inline-flex;align-items:center;gap:12px;border:0;background:transparent;cursor:pointer;padding:0;")}>
            <div style={s("position:relative;width:40px;height:40px;border-radius:12px;background:linear-gradient(140deg,#8B2FE6 0%,#B51C9E 52%,#E84AA0 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 9px 22px -6px rgba(184,40,170,.8),inset 0 1px 0 rgba(255,255,255,.3);overflow:hidden;")}><FunctionSquare style={s("position:relative;width:21px;height:21px;color:#fff;")} /><span style={s("position:absolute;top:6px;right:6px;width:6px;height:6px;border-radius:50%;background:#FFD057;box-shadow:0 0 7px 1px rgba(255,208,87,.85);animation:pulseDot 1.9s infinite;")} /></div>
            <div style={s("text-align:left;")}><div style={s("font-size:14.5px;font-weight:600;color:#fff;line-height:1.1;")}>สูตรการคำนวณ</div><div style={s("font-size:10.5px;color:rgba(255,255,255,.45);")}>Calculation Formula Reference</div></div>
          </button>
          <div style={s("flex:1;")} />
          <span className="mono" style={s("font-size:11px;color:#C77DFF;background:rgba(124,45,224,.16);border:1px solid rgba(124,45,224,.3);padding:5px 11px;border-radius:8px;")}>formula v1.0</span>
          <button onClick={onBack} style={s("border:0;background:transparent;cursor:pointer;font-size:13px;color:rgba(255,255,255,.6);display:inline-flex;align-items:center;gap:6px;font-family:inherit;")}><ArrowLeft style={s("width:15px;height:15px;")} /> กลับหน้าแรก</button>
        </div>
      </header>

      <div style={s("max-width:1240px;margin:0 auto;padding:0 36px;display:grid;grid-template-columns:222px 1fr;gap:36px;align-items:start;")}>
        {/* SIDE NAV */}
        <nav style={s("position:sticky;top:84px;padding:28px 0;display:flex;flex-direction:column;gap:2px;max-height:calc(100vh - 84px);overflow-y:auto;")} className="hidden lg:flex">
          <div style={s("font-size:10.5px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,.35);padding:6px 12px;")}>หัวข้อสูตร</div>
          {navItems.map((it) => (
            <button key={it.id} onClick={() => scrollTo(it.id)} style={s("text-decoration:none;font-size:13px;color:rgba(255,255,255,.62);padding:8px 12px;border-radius:9px;display:flex;align-items:center;gap:9px;border:0;background:transparent;cursor:pointer;font-family:inherit;text-align:left;")}><span className="mono" style={s("font-size:10px;color:#C77DFF;")}>{it.no}</span> {it.label}</button>
          ))}
          <button onClick={() => scrollTo("f-example")} style={s("text-decoration:none;font-size:13px;color:#fff;padding:8px 12px;border-radius:9px;display:flex;align-items:center;gap:9px;background:rgba(232,74,160,.12);border:1px solid rgba(232,74,160,.25);margin-top:6px;cursor:pointer;font-family:inherit;text-align:left;")}><Play style={s("width:13px;height:13px;color:#F472B6;")} /> ตัวอย่างจริง</button>
        </nav>

        {/* CONTENT */}
        <main style={s("padding:30px 0 70px;min-width:0;")}>
          <div style={s("margin-bottom:30px;")}>
            <div style={s("display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:99px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);margin-bottom:16px;")}><BadgeCheck style={s("width:14px;height:14px;color:#6EE7B7;")} /><span style={s("font-size:12px;color:rgba(255,255,255,.72);")}>ทุกตัวเลขอธิบายได้ — ไม่ใช่ AI กล่องดำ</span></div>
            <h1 style={s("margin:0 0 12px;font-size:36px;font-weight:600;letter-spacing:-.6px;color:#fff;")}>สูตรการคำนวณโดยละเอียด</h1>
            <p style={s("margin:0;font-size:15px;line-height:1.65;color:rgba(255,255,255,.6);max-width:680px;")}>อ้างอิงจากโค้ดจริง <span className="mono" style={s("font-size:13px;color:#C77DFF;")}>inventoryCalculations.ts</span> · <span className="mono" style={s("font-size:13px;color:#C77DFF;")}>procurementAnalysis.ts</span> — ระบบเริ่มจาก usage ย้อนหลัง คำนวณความผันผวน ปรับ lead time แล้วได้ Safety Stock, Reorder Point และจำนวนที่ควรซื้อ ก่อนตรวจงบ 3 ชั้น และเก็บ Snapshot</p>
          </div>

          {/* 00 END-TO-END */}
          <Section id="f-chain" title="ลำดับการคำนวณ End-to-End" Icon={GitMerge} iconBg="linear-gradient(140deg,#7C2DE0,#C0249B)" iconColor="#fff">
            <div style={s("background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);border-radius:18px;padding:10px 8px;")}>
              <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:2px;")}>
                {chain.map((c) => (
                  <div key={c.n} style={s("display:flex;align-items:flex-start;gap:13px;padding:13px 16px;")}>
                    <span className="mono" style={s(`width:26px;height:26px;border-radius:7px;background:${c.pink ? "rgba(232,74,160,.22)" : c.gold ? "rgba(255,208,87,.2)" : "rgba(124,45,224,.2)"};color:${c.pink ? "#F472B6" : c.gold ? "#FCD34D" : "#C77DFF"};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex:none;`)}>{c.n}</span>
                    <div><div style={s("font-size:13.5px;color:#fff;font-weight:500;")}>{c.t}</div><div className="mono" style={s("font-size:11px;color:rgba(255,255,255,.5);")}>{c.f}</div><div style={s("font-size:11px;color:rgba(255,255,255,.6);margin-top:4px;line-height:1.5;")}>{c.d}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* 01 DEMAND */}
          <Section id="f-demand" title="01 · ความต้องการใช้ & ความผันผวน" Icon={TrendingUp} iconBg="rgba(124,45,224,.2)" iconColor="#C77DFF">
            <div style={grid2}>
              <Card title="Average Daily Demand">
                <Code lines={[{ n: "Avg Daily Demand =" }, { n: "  Σ(usage) ÷ Σ(days)" }, { n: "ความต้องการเฉลี่ย/วัน =", dim: true }, { n: "  การใช้รวม ÷ จำนวนวันรวม", dim: true }]} />
                <Ex>เช่น 600 ÷ 180 = <b style={s("color:#C77DFF;")}>3.33 หน่วย/วัน</b> · ถ้า days ≤ 0 ผลลัพธ์ = 0</Ex>
                <Tip>ดูว่าที่ผ่านมาเราใช้ของชิ้นนี้วันละกี่หน่วยโดยเฉลี่ย — เอายอดใช้ทั้งหมดมาหารจำนวนวัน</Tip>
              </Card>
              <Card title="Demand Variability / Day">
                <Code lines={[{ n: "σ_period = √( Σ(qᵢ−mean)² ÷ n )" }, { n: "σ_day = σ_period ÷ √(days/period)" }, { n: "σ_period = ความผันผวนราย period", dim: true }, { n: "σ_day = ความผันผวนต่อวัน", dim: true }]} />
                <Ex>ใช้ population SD · ค่ายิ่งสูง = การใช้ยิ่งสวิง ต้องสำรองของมากขึ้น</Ex>
                <Tip>ดูว่าการใช้แต่ละวันสวิงมากไหม ถ้าบางวันใช้เยอะบางวันใช้น้อย ต้องสำรองเผื่อมากขึ้น</Tip>
              </Card>
            </div>
          </Section>

          {/* 02 Z-SCORE */}
          <Section id="f-zscore" title="02 · ความมั่นใจว่าของไม่ขาด (Service Level → Z)" Icon={Percent} iconBg="rgba(124,45,224,.2)" iconColor="#C77DFF">
            <div style={s("display:grid;grid-template-columns:1.15fr 1fr;gap:14px;align-items:start;")}>
              <div style={s("background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:18px;")}>
                <p style={s("margin:0 0 12px;font-size:13px;color:rgba(255,255,255,.6);line-height:1.6;")}>ผู้ใช้เลือก Service Level แล้ว derive Z-score อัตโนมัติ เพื่อไม่ให้ขัดกัน — ถ้าอยู่ระหว่างค่าในตารางใช้ linear interpolation</p>
                <Code lines={[{ n: "Ratio = (SL − SL_low) ÷ (SL_high − SL_low)" }, { n: "Z = Z_low + Ratio × (Z_high − Z_low)" }, { n: "Z-score = ROUND(Z × 100) ÷ 100" }, { n: "เทียบสัดส่วนระหว่างค่าในตาราง แล้วเฉลี่ยหาค่า Z · ปัด 2 ตำแหน่ง", dim: true }]} />
                <Tip>เราอยากมั่นใจกี่เปอร์เซ็นต์ว่าจะมีของพอไม่ขาดมือ ยิ่งมั่นใจมากยิ่งต้องสำรองมาก — ค่า Z คือตัวแปลงความมั่นใจนั้นให้เข้าสูตร</Tip>
              </div>
              <div style={s("background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:8px 6px;overflow:hidden;")}>
                <table style={s("width:100%;border-collapse:collapse;")}>
                  <thead><tr><th style={s("text-align:left;font-size:10.5px;font-weight:600;color:rgba(255,255,255,.4);text-transform:uppercase;padding:8px 14px;")}>Service Level</th><th style={s("text-align:right;font-size:10.5px;font-weight:600;color:rgba(255,255,255,.4);text-transform:uppercase;padding:8px 14px;")}>Z-score</th></tr></thead>
                  <tbody>
                    {[{ sl: "0.900", z: "1.28", def: false }, { sl: "0.950", z: "1.65", def: true }, { sl: "0.975", z: "1.96", def: false }, { sl: "0.990", z: "2.33", def: false }, { sl: "0.995", z: "2.58", def: false }].map((r) => (
                      <tr key={r.sl} style={r.def ? s("background:rgba(124,45,224,.12);") : undefined}>
                        <td className="mono" style={s(`padding:6px 14px;font-size:12.5px;color:${r.def ? "#fff" : "rgba(255,255,255,.7)"};`)}>{r.sl}{r.def ? <span style={s("color:#C77DFF;font-size:10px;")}> · default</span> : null}</td>
                        <td className="mono" style={s(`padding:6px 14px;font-size:12.5px;text-align:right;${r.def ? "color:#C77DFF;font-weight:600;" : "color:#fff;"}`)}>{r.z}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>

          {/* 03 SAFETY */}
          <Section id="f-safety" title="03 · ระยะเวลารอของ & สต็อกสำรอง" Icon={Shield} iconBg="rgba(124,45,224,.2)" iconColor="#C77DFF">
            <div style={grid2}>
              <Card title="Adjusted Lead Time">
                <Code lines={[{ n: "Adj LT = Supplier LT" }, { n: "  × Seasonal × Budget" }, { n: "Lead Time ปรับแล้ว = LT ซัพพลายเออร์ × ตัวคูณฤดูกาล × ตัวคูณงบ", dim: true }]} />
                <Ex>25 × 1.20 × 1.00 = <b style={s("color:#C77DFF;")}>30 วัน</b> · ตัวคูณฤดูกาลเผื่อช่วงใช้เยอะ, ตัวคูณงบเผื่อรอบงบ/ความล่าช้า</Ex>
                <Tip>ของไม่ได้มาทันทีที่สั่ง ต้องรอผู้ขายส่ง และเผื่อช่วงหน้าฝนหรือสั่งกันเยอะให้รอนานขึ้น</Tip>
              </Card>
              <Card title="Safety Stock">
                <Code lines={[{ n: "Safety Stock =" }, { n: "  ⌈ Z × σ_day × √(Adj LT) ⌉" }, { n: "สต็อกสำรอง = ปัดขึ้น( Z × ผันผวน/วัน × √Lead Time )", dim: true }]} />
                <Ex>1.65 × 2.4 × √30 ≈ 21.69 → ปัดขึ้น <b style={s("color:#C77DFF;")}>22 หน่วย</b></Ex>
                <Tip>ของสำรองกันเหนียว เผื่อช่วงรอของแล้วคนใช้เยอะกว่าปกติ จะได้ไม่ขาดมือ</Tip>
              </Card>
            </div>
          </Section>

          {/* 04 REORDER */}
          <Section id="f-reorder" title="04 · จุดสั่งซื้อใหม่ (Reorder Point) & สถานะสต็อก" Icon={GitCommitHorizontal} iconBg="rgba(124,45,224,.2)" iconColor="#C77DFF">
            <div style={grid2}>
              <Card title="Reorder Point">
                <Code lines={[{ n: "Demand LT = Avg Daily × Adj LT" }, { n: "Reorder Point =" }, { n: "  ⌈ Demand LT + Safety Stock ⌉" }, { n: "ความต้องการระหว่างรอของ + สต็อกสำรอง = จุดสั่งซื้อใหม่ (ปัดขึ้น)", dim: true }]} />
                <Ex>99.9 + 22 = 121.9 → <b style={s("color:#C77DFF;")}>122 หน่วย</b></Ex>
                <Tip>เหมือนไฟเตือนน้ำมันรถ — พอของเหลือถึงจุดนี้ต้องรีบสั่งเพิ่ม ไม่งั้นของมาไม่ทันจะขาด</Tip>
              </Card>
              <Card title="สถานะสต็อก">
                <div style={s("display:flex;flex-direction:column;gap:9px;")}>
                  {[{ l: "Critical", c: "#FCA5A5", b: "rgba(220,38,38,.16)", t: "Stock ≤ Safety Stock" }, { l: "Near ROP", c: "#FCD34D", b: "rgba(217,119,6,.16)", t: "Stock ≤ Reorder Point" }, { l: "Normal", c: "#6EE7B7", b: "rgba(5,150,105,.18)", t: "มีของสำรองเพียงพอ" }].map((r) => (
                    <div key={r.l} style={s("display:flex;align-items:center;gap:10px;")}><span style={s(`font-size:10.5px;font-weight:600;color:${r.c};background:${r.b};padding:3px 9px;border-radius:99px;flex:none;`)}>{r.l}</span><span className="mono" style={s("font-size:11.5px;color:rgba(255,255,255,.6);")}>{r.t}</span></div>
                  ))}
                </div>
              </Card>
            </div>
          </Section>

          {/* 05 SUGGEST */}
          <Section id="f-suggest" title="05 · จำนวนที่ควรซื้อ (Suggested Quantity)" Icon={Sparkles} iconBg="linear-gradient(140deg,#B51C9E,#E84AA0)" iconColor="#fff">
            <div style={grid2}>
              <Card title="Target Stock & MOQ Rounding">
                <Code lines={[{ n: "Target = Forecast + Safety" }, { n: "  (หรือ Policy Override)" }, { n: "RoundUpMOQ(q) = ⌈q÷MOQ⌉ × MOQ" }, { n: "สต็อกเป้าหมาย = คาดการณ์ + สต็อกสำรอง · ปัดจำนวนขึ้นให้ครบลอต MOQ", dim: true }]} />
              </Card>
              <Card title="Suggested Quantity" accent>
                <Code pink lines={[{ n: "Raw = Target − Current Stock" }, { n: "Suggested =" }, { n: "  Raw ≤ 0 ? 0 : RoundUpMOQ(Raw)" }, { n: "จำนวนที่ขาด = เป้าหมาย − สต็อกปัจจุบัน · ถ้าขาด > 0 ปัดตาม MOQ = จำนวนแนะนำซื้อ", dim: true }]} />
                <Ex>70 − 60 = 10 → <b style={s("color:#F472B6;")}>แนะนำซื้อ 10 หน่วย</b></Ex>
                <Tip>ควรเติมของให้ถึงระดับเป้าหมาย ขาดอยู่เท่าไหร่ก็ซื้อเท่านั้น แล้วปัดให้ครบลอตขั้นต่ำที่ผู้ขายกำหนด (MOQ)</Tip>
              </Card>
            </div>
          </Section>

          {/* 06 BUDGET */}
          <Section id="f-budget" title="06 · ส่วนต่าง & เส้นทางอนุมัติงบ" Icon={Route} iconBg="rgba(255,208,87,.2)" iconColor="#FCD34D">
            <div style={grid2}>
              <Card title="Variance vs AI Suggest">
                <Code lines={[{ n: "Variance = Requested − Suggested" }, { n: "Variance% = Variance ÷ Suggested × 100" }, { n: "High Variance = |Variance%| ≥ 50%" }, { n: "ส่วนต่าง = จำนวนที่ขอ − จำนวนที่ AI แนะนำ · เบี่ยง ≥ 50% = ผิดปกติ", dim: true }]} />
                <Ex>ถ้าจำนวนที่ขอ ≠ ที่ระบบแนะนำ ต้องใส่ <b style={s("color:#FCD34D;")}>เหตุผลกำกับ</b></Ex>
                <Tip>ดูว่าคนขอซื้อต่างจากที่ระบบแนะนำมากไหม ถ้าต่างเกินครึ่ง (50%) ถือว่าผิดปกติ ต้องชี้แจงเหตุผลก่อน</Tip>
              </Card>
              <Card title="Approval Layer (3 ชั้น)">
                <Code lines={[{ n: "Cost = Requested × Unit Price" }, { n: <>Cost ≤ Local → <span style={s("color:#6EE7B7;")}>Local</span></> }, { n: <>else ≤ Regional → <span style={s("color:#93C5FD;")}>Regional</span></> }, { n: <>else → <span style={s("color:#FCD34D;")}>Central</span></> }, { n: "มูลค่า = จำนวนที่ขอ × ราคา/หน่วย · งบพอชั้นไหน → อนุมัติชั้นนั้น", dim: true }]} />
                <Tip>ยิ่งใช้เงินมาก ยิ่งต้องให้ระดับสูงขึ้นอนุมัติ — ของถูกคลังอนุมัติเองได้ ของแพงส่งเขตหรือส่วนกลาง</Tip>
              </Card>
            </div>
          </Section>

          {/* 07 AUDIT */}
          <Section id="f-audit" title="07 · ของค้างสต็อก & ตรวจสอบการจัดซื้อ" Icon={SearchCheck} iconBg="rgba(220,38,38,.18)" iconColor="#FCA5A5">
            <div style={grid2}>
              <Card title="Audit Flags (จับ gotcha)">
                <div style={s("display:flex;flex-direction:column;gap:11px;")}>
                  {[{ k: "repeat-buy", c: "#FCA5A5", d: "ขอซื้อใหม่ ทั้งที่มีของแบบเดียวกันค้างสต็อกอยู่ในคลัง/เขตเดียวกัน" }, { k: "spend-to-keep", c: "#FCD34D", d: "ยังเร่งใช้งบซื้อเกือบเต็ม ทั้งที่ของค้างกลับเพิ่มขึ้น" }, { k: "over-peer", c: "#C77DFF", d: "ขอซื้อมากเกิน 1.5 เท่าของค่าเฉลี่ยคลังอื่นในหมวดเดียวกัน" }].map((f) => (
                    <div key={f.k}><div style={s(`font-size:12.5px;font-weight:600;color:${f.c};margin-bottom:3px;`)}>{f.k}</div><div className="mono" style={s("font-size:11px;color:rgba(255,255,255,.55);line-height:1.5;")}>{f.d}</div></div>
                  ))}
                </div>
              </Card>
              <Card title="Dead Stock & Savings">
                <Code lines={[{ n: "Dead Value = Dead Qty × Unit Cost" }, { n: "Trend% = (Latest − First) ÷ First × 100" }, { n: "Borrow Savings =" }, { n: "  MIN(Requested, DeadElsewhere) × Price" }, { n: "มูลค่าของจม = จำนวนจม × ต้นทุน/หน่วย · เงินที่ประหยัด = ยืมของจมคลังอื่นแทนซื้อ", dim: true }]} />
                <Ex>MIN(20, 12) × 2,000 = <b style={s("color:#6EE7B7;")}>฿24,000</b> ที่ประหยัดได้</Ex>
                <Tip>แทนที่จะซื้อใหม่ ลองยืมของแบบเดียวกันที่คลังอื่นค้างอยู่มาใช้ก่อน ประหยัดเงินได้ทันที</Tip>
              </Card>
            </div>
          </Section>

          {/* 08 VMI */}
          <Section id="f-vmi" title="08 · จำลอง VMI — ให้ผู้ขายช่วยดูแลสต็อก" Icon={RefreshCcw} iconBg="rgba(37,99,235,.2)" iconColor="#93C5FD">
            <div style={grid2}>
              <Card title="VMI Safety / ROP / Impact">
                <Code lines={[{ n: "VMI Safety = ⌈ Z × σ_day × √(VMI LT) ⌉" }, { n: "VMI ROP = ⌈ AvgDaily × VMI LT + Safety ⌉" }, { n: "Impact% = (New − Current) ÷ Current × 100" }, { n: "คำนวณสต็อกสำรอง/จุดสั่งใหม่แบบ VMI · %เปลี่ยน = (ใหม่ − เดิม) ÷ เดิม", dim: true }]} />
                <Ex>180,000 vs 240,000 = <b style={s("color:#6EE7B7;")}>−25%</b> เงินจมลดลง</Ex>
                <Tip>ลองคำนวณว่าถ้าให้ผู้ขายช่วยเติมของให้อัตโนมัติ จะลดของค้างและเงินจมได้แค่ไหน</Tip>
              </Card>
              <Card title="Suitability Score (0–100)">
                <div style={s("display:flex;flex-direction:column;gap:8px;")}>
                  {[{ s: "≥ 80", c: "#6EE7B7", b: "rgba(5,150,105,.18)", t: "เหมาะมากกับ VMI" }, { s: "≥ 60", c: "#93C5FD", b: "rgba(37,99,235,.18)", t: "ทดลอง VMI ได้" }, { s: "≥ 40", c: "#FCD34D", b: "rgba(217,119,6,.16)", t: "ศึกษาเพิ่มก่อน" }, { s: "< 40", c: "#FCA5A5", b: "rgba(220,38,38,.16)", t: "ยังไม่เหมาะ" }].map((r) => (
                    <div key={r.s} style={s("display:flex;align-items:center;gap:10px;")}><span style={s(`font-size:10.5px;font-weight:600;color:${r.c};background:${r.b};padding:3px 9px;border-radius:99px;flex:none;width:54px;text-align:center;`)}>{r.s}</span><span style={s("font-size:12px;color:rgba(255,255,255,.6);")}>{r.t}</span></div>
                  ))}
                </div>
              </Card>
            </div>
          </Section>

          {/* 09 FEEDBACK */}
          <Section id="f-feedback" title="09 · ระบบเรียนรู้-ปรับสูตรเอง (AI Feedback)" Icon={Repeat2} iconBg="rgba(5,150,105,.2)" iconColor="#6EE7B7">
            <div style={grid2}>
              <Card title="วัด Error จากค่าจริง">
                <Code lines={[{ n: "Error% = (Actual − Suggested) ÷ Suggested × 100" }, { n: "MAE% = Σ|Error%| ÷ n" }, { n: "Bias% = Σ(Error%) ÷ n" }, { n: "ค่าคลาดเคลื่อน = (จริง − แนะนำ) ÷ แนะนำ · MAE = เฉลี่ยสัมบูรณ์ · Bias = เอนเอียง", dim: true }]} />
                <Ex>Bias &gt; 0 = แนะนำน้อยไป · Bias &lt; 0 = แนะนำมากไป</Ex>
                <Tip>เทียบสิ่งที่ระบบแนะนำกับที่ใช้จริง ถ้าพลาดไปทางไหนบ่อยๆ ระบบจะรู้ว่าต้องปรับสูตร</Tip>
              </Card>
              <Card title="Auto-tune Policy → version ใหม่">
                <Code lines={[{ n: "Dir = Error% > 0 ? +1 : −1" }, { n: "SL' = clamp(SL + Dir×0.005, .8, .995)" }, { n: "Seasonal' = clamp(SF + Dir×0.02, .8, 1.8)" }, { n: "v1.0 → v1.1" }, { n: "ทิศปรับ: แนะน้อยไป→เพิ่ม, มากไป→ลด · ปรับ SL/ฤดูกาล → สูตรเวอร์ชันใหม่", dim: true }]} />
                <Ex>snapshot เดิม <b style={s("color:#6EE7B7;")}>ไม่ถูกแก้</b> — ใช้สูตรใหม่รอบถัดไป</Ex>
                <Tip>ระบบค่อยๆ ปรับตัวเองให้แม่นขึ้นทุกเวอร์ชัน โดยไม่ไปแก้ข้อมูลเก่าที่บันทึกไว้</Tip>
              </Card>
            </div>
          </Section>

          {/* WORKED EXAMPLE */}
          <section id="f-example" style={s("scroll-margin-top:84px;")}>
            <div style={s("display:flex;align-items:center;gap:11px;margin-bottom:18px;")}><span style={s("width:34px;height:34px;border-radius:10px;background:linear-gradient(140deg,#7C2DE0,#E84AA0);color:#fff;display:flex;align-items:center;justify-content:center;flex:none;")}><FlaskConical style={s("width:18px;height:18px;")} /></span><h2 style={s("margin:0;font-size:21px;font-weight:600;color:#fff;")}>ตัวอย่างจริง · สายเคเบิล XLPE 240</h2></div>
            <div style={s("background:linear-gradient(135deg,#1B0F33,#241043 55%,#160C2B);border:1px solid rgba(199,125,255,.25);border-radius:20px;padding:24px 26px;")}>
              <div style={s("display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;")}>
                {[{ l: "Usage 6 ด.", v: "600 / 180" }, { l: "Supplier LT", v: "25 วัน" }, { l: "Service Level", v: "95% → 1.65" }, { l: "MOQ · Stock", v: "10 · 60" }].map((b) => (
                  <div key={b.l} style={s("background:rgba(0,0,0,.22);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 14px;")}><div style={s("font-size:11px;color:rgba(255,255,255,.5);")}>{b.l}</div><div className="mono" style={s("font-size:15px;font-weight:600;color:#fff;margin-top:3px;")}>{b.v}</div></div>
                ))}
              </div>
              <div style={s("display:flex;flex-direction:column;gap:9px;")}>
                {[
                  { k: "Avg Daily Demand", kc: "#C77DFF", n: <>600 ÷ 180 = <b style={s("color:#fff;")}>3.33 /วัน</b></> },
                  { k: "Adjusted Lead Time", kc: "#C77DFF", n: <>25 × 1.20 = <b style={s("color:#fff;")}>30 วัน</b></> },
                  { k: "Safety Stock", kc: "#C77DFF", n: <>⌈1.65 × σ × √30⌉ = <b style={s("color:#fff;")}>8 ม.</b></> },
                  { k: "Reorder Point", kc: "#C77DFF", n: <>60 + 8 = <b style={s("color:#FCD34D;")}>68 ม.</b> → stock 60 &lt; 68 = <b style={s("color:#FCA5A5;")}>วิกฤต</b></> },
                  { k: "Suggested Qty", kc: "#F472B6", n: <>Target 70 − 60 = 10 → MOQ → <b style={s("color:#F472B6;")}>ซื้อ 10 ม.</b></> },
                  { k: "Estimated Cost", kc: "#FCD34D", n: <>20 × ฿2,000 = ฿40,000 → <b style={s("color:#FCD34D;")}>Regional</b></> },
                ].map((r) => (
                  <div key={r.k} style={s("display:flex;align-items:center;gap:13px;")}><span className="mono" style={s(`font-size:11px;color:${r.kc};width:130px;flex:none;`)}>{r.k}</span><span className="mono" style={s("font-size:12.5px;color:rgba(255,255,255,.65);")}>{r.n}</span></div>
                ))}
              </div>
            </div>

            <div style={s("margin-top:26px;display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:20px 24px;")}>
              <Quote style={s("width:22px;height:22px;color:#C77DFF;")} />
              <p style={s("margin:0;font-size:14px;font-style:italic;line-height:1.6;color:rgba(255,255,255,.78);")}>“ระบบไม่ได้บอกแค่ว่าควรซื้อกี่ชิ้น แต่เริ่มจาก usage ย้อนหลัง วัดความผันผวน ปรับ lead time แล้วคำนวณ Safety Stock กับ Reorder Point ก่อนหาจำนวนเติมตาม MOQ ตรวจงบ 3 ชั้น และเก็บ Snapshot เพื่อ audit ทุกขั้น”</p>
            </div>

            <div style={s("margin-top:24px;display:flex;gap:12px;")}>
              <button onClick={onBack} style={s("text-decoration:none;display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 20px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.04);color:rgba(255,255,255,.86);font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;")}><ArrowLeft style={s("width:16px;height:16px;")} /> กลับหน้าแรก</button>
              <button onClick={onEnter} style={s("display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 22px;border:0;border-radius:12px;background:linear-gradient(135deg,#7C2DE0,#C0249B);color:#fff;font-size:14px;font-weight:600;box-shadow:0 12px 26px -10px rgba(184,40,170,.8);cursor:pointer;font-family:inherit;")}>ลองใช้ระบบจริง <ArrowRight style={s("width:16px;height:16px;")} /></button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function LandingPage({ currentUser, onEnter, onLogin, onBackToIntro, onOpenFormulas }: { currentUser: SessionUser | null; onEnter: () => void; onLogin: () => void; onBackToIntro: () => void; onOpenFormulas: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [showFab, setShowFab] = useState(false);
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const toTop = () => rootRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  const grad = s("background:linear-gradient(100deg,#E84AA0,#C77DFF);-webkit-background-clip:text;background-clip:text;color:transparent;");
  const navItem = s("font-size:13.5px;color:rgba(255,255,255,.66);cursor:pointer;transition:color .15s;");
  const features: { icon: typeof Sparkles; bg: string; shadow: string; title: string; desc: string }[] = [
    { icon: Sparkles, bg: "linear-gradient(140deg,#7C2DE0,#B51C9E)", shadow: "0 12px 26px -10px rgba(124,45,224,.7)", title: "AI แนะนำซื้อ + อธิบายได้", desc: "คำนวณ Reorder Point, Safety Stock, จำนวนสั่งซื้อ จาก demand จริง พร้อมกาง “ทำไมระบบแนะนำค่านี้” ทีละขั้น" },
    { icon: Recycle, bg: "linear-gradient(140deg,#B51C9E,#E84AA0)", shadow: "0 12px 26px -10px rgba(232,74,160,.7)", title: "ดักของจมก่อนซื้อ", desc: "ก่อนสร้างคำขอ ระบบเช็คคลังอื่นทั้งเขต — ถ้ามีของจม แนะนำให้ยืม/โอน/แลกแทนซื้อใหม่ ลดทุนจมและของขาดพร้อมกัน" },
    { icon: Route, bg: "linear-gradient(140deg,#6D28D9,#2563EB)", shadow: "0 12px 26px -10px rgba(37,99,235,.6)", title: "ตรวจงบ 3 ชั้นอัตโนมัติ", desc: "คลัง → เขต → ส่วนกลาง ระบบเลือกชั้นอนุมัติให้ตามมูลค่า เกินงบส่งต่ออัตโนมัติ พร้อมเหตุผล override" },
    { icon: SearchCheck, bg: "linear-gradient(140deg,#D97706,#DC2626)", shadow: "0 12px 26px -10px rgba(220,38,38,.55)", title: "ตรวจซื้อซ้ำ-ของจม", desc: "จับเคสของบซื้อต่อเนื่องหลายปีทั้งที่ยังมีของจม เทียบประวัติ 3 ปีงบ พร้อมข้อเสนอแนะระงับ-ใช้ของเดิม" },
    { icon: PackageCheck, bg: "linear-gradient(140deg,#059669,#0EA5E9)", shadow: "0 12px 26px -10px rgba(5,150,105,.55)", title: "ตรวจรับตามระเบียบ", desc: "คณะกรรมการตรวจรับ 6 ขั้น อิง พ.ร.บ. 2560 — ผ่าน/ไม่ผ่าน บันทึก Delay & Impact Demand ป้อนกลับสูตร" },
    { icon: Repeat2, bg: "linear-gradient(140deg,#7C2DE0,#C0249B)", shadow: "0 12px 26px -10px rgba(184,40,170,.6)", title: "Closed-loop เรียนรู้ต่อเนื่อง", desc: "เทียบค่าจริงกับที่ AI แนะนำ วัด error/bias แล้ว auto-tune สร้างสูตรเวอร์ชันใหม่ โดยไม่แก้ snapshot เดิม" },
  ];
  const loopSteps: { icon: typeof Sparkles; label: string; last?: boolean }[] = [
    { icon: Database, label: "ข้อมูลจริง" },
    { icon: Sparkles, label: "AI แนะนำ" },
    { icon: ClipboardCheck, label: "ตัดสินใจ + Snapshot" },
    { icon: GitCompare, label: "วัดผลจริง" },
    { icon: GitBranch, label: "auto-tune สูตร", last: true },
  ];

  return (
    <div
      ref={rootRef}
      className="landing-root"
      onScroll={(e) => setShowFab(e.currentTarget.scrollTop > 480)}
      style={s("height:100vh;width:100%;position:relative;overflow-y:auto;overflow-x:hidden;font-family:Kanit,sans-serif;color:#F1EDF8;background:radial-gradient(1100px 620px at 78% -8%,#3A1078 0%,rgba(58,16,120,0) 60%),radial-gradient(900px 520px at 8% 12%,#5A1A6E 0%,rgba(90,26,110,0) 55%),linear-gradient(168deg,#140C26 0%,#0E0A1A 60%);")}
    >
      {/* ambient blobs */}
      <div style={s("position:absolute;top:-120px;right:120px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(232,74,160,.32),transparent 65%);filter:blur(30px);pointer-events:none;")} />
      <div style={s("position:absolute;bottom:-160px;left:-60px;width:480px;height:480px;border-radius:50%;background:radial-gradient(circle,rgba(124,45,224,.28),transparent 65%);filter:blur(36px);pointer-events:none;")} />

      {/* TOPBAR */}
      <header style={s("position:relative;z-index:5;max-width:1240px;margin:0 auto;padding:22px 40px;display:flex;align-items:center;gap:14px;")}>
        <button onClick={onBackToIntro} title="กลับไปหน้า Intro" style={s("display:flex;align-items:center;gap:14px;border:0;background:transparent;cursor:pointer;padding:0;text-align:left;")}>
          <span style={s("position:relative;width:42px;height:42px;border-radius:13px;background:linear-gradient(140deg,#8B2FE6 0%,#B51C9E 52%,#E84AA0 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 9px 22px -6px rgba(184,40,170,.8),inset 0 1px 0 rgba(255,255,255,.3);overflow:hidden;flex:none;")}>
            <span style={s("position:absolute;top:-10px;left:-10px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.28);filter:blur(7px);")} />
            <Boxes style={s("position:relative;width:23px;height:23px;color:#fff;")} />
            <span style={s("position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:#FFD057;box-shadow:0 0 7px 1px rgba(255,208,87,.85);animation:pulseDot 1.9s infinite;")} />
          </span>
          <span>
            <span style={s("display:block;font-size:15px;font-weight:600;color:#fff;line-height:1.1;")}>PEA AI Stock Intelligent</span>
            <span style={s("display:block;font-size:10.5px;color:rgba(255,255,255,.45);")}>ระบบบริหารสต๊อคอัจฉริยะ</span>
          </span>
        </button>
        <nav style={s("flex:1;display:flex;justify-content:center;gap:30px;")}>
          <span onClick={() => scrollTo("sec-problem")} style={navItem}>ปัญหา</span>
          <span onClick={() => scrollTo("sec-solution")} style={navItem}>โซลูชัน</span>
          <span onClick={() => scrollTo("sec-marketplace")} style={navItem}>ตลาดของจม</span>
          <span onClick={() => scrollTo("sec-closedloop")} style={navItem}>Closed-loop</span>
          <span onClick={onOpenFormulas} style={s("font-size:13.5px;font-weight:600;color:#C77DFF;cursor:pointer;display:inline-flex;align-items:center;gap:5px;")}><FunctionSquare style={s("width:14px;height:14px;")} /> สูตรคำนวณ</span>
        </nav>
        <button onClick={onLogin} style={s("display:inline-flex;align-items:center;gap:7px;height:42px;padding:0 20px;border:0;border-radius:11px;background:linear-gradient(135deg,#7C2DE0,#C0249B);color:#fff;font-family:inherit;font-size:13.5px;font-weight:600;box-shadow:0 12px 26px -10px rgba(184,40,170,.8);white-space:nowrap;cursor:pointer;")}>{currentUser ? currentUser.name : "เข้าสู่ระบบ"} <ArrowRight style={s("width:16px;height:16px;")} /></button>
      </header>

      {/* HERO */}
      <section id="sec-problem" style={s("position:relative;z-index:3;max-width:1240px;margin:0 auto;padding:48px 40px 30px;display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;scroll-margin-top:80px;")}>
        <div>
          <div style={s("display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:99px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);margin-bottom:24px;white-space:nowrap;")}>
            <span style={s("width:7px;height:7px;border-radius:50%;background:#FFD057;box-shadow:0 0 8px 1px rgba(255,208,87,.8);animation:pulseDot 1.9s infinite;")} />
            <span style={s("font-size:12px;color:rgba(255,255,255,.78);")}>Hackathon 2026 · by ThaiCloud</span>
            <span style={s("font-size:11px;font-weight:600;color:#FFD057;background:rgba(255,208,87,.14);padding:1px 8px;border-radius:99px;")}>Track 2</span>
          </div>
          <h1 style={s("margin:0 0 18px;font-size:50px;line-height:1.08;font-weight:600;letter-spacing:-.8px;color:#fff;")}>หยุด<span style={grad}>ซื้อซ้ำของจม</span><br />เริ่มวางแผนพัสดุด้วย AI</h1>
          <p style={s("margin:0 0 30px;font-size:16px;line-height:1.65;color:rgba(255,255,255,.66);max-width:480px;")}>แพลตฟอร์มวางแผนคลังพัสดุและจัดซื้อสำหรับการไฟฟ้าส่วนภูมิภาค — คำนวณจุดสั่งซื้อจากข้อมูลจริง อธิบายได้ทุกตัวเลข ดักของจมก่อนซื้อ และตรวจงบ 3 ชั้นอัตโนมัติ</p>
          <div style={s("display:flex;align-items:center;gap:14px;margin-bottom:36px;")}>
            <button onClick={onEnter} style={s("display:inline-flex;align-items:center;gap:8px;height:50px;padding:0 26px;border:0;border-radius:13px;background:linear-gradient(135deg,#7C2DE0,#C0249B);color:#fff;font-family:inherit;font-size:15px;font-weight:600;box-shadow:0 16px 34px -12px rgba(184,40,170,.85);cursor:pointer;")}>เริ่มใช้งาน <ArrowRight style={s("width:18px;height:18px;")} /></button>
            <button onClick={onEnter} style={s("display:inline-flex;align-items:center;gap:8px;height:50px;padding:0 22px;border-radius:13px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);color:#fff;font-family:inherit;font-size:15px;font-weight:500;cursor:pointer;white-space:nowrap;")}><Play style={s("width:16px;height:16px;color:#E84AA0;")} /> ดูเดโม</button>
          </div>
          <div style={s("display:flex;gap:34px;")}>
            <div><div style={s("font-size:26px;font-weight:700;color:#fff;line-height:1;")}>฿8.6M</div><div style={s("font-size:12px;color:rgba(255,255,255,.5);margin-top:5px;")}>ทุนจมที่มองเห็น</div></div>
            <div style={s("width:1px;background:rgba(255,255,255,.12);")} />
            <div><div style={s("font-size:26px;font-weight:700;color:#fff;line-height:1;")}>87%</div><div style={s("font-size:12px;color:rgba(255,255,255,.5);margin-top:5px;")}>ความแม่นยำ AI</div></div>
            <div style={s("width:1px;background:rgba(255,255,255,.12);")} />
            <div><div style={s("font-size:26px;font-weight:700;color:#fff;line-height:1;")}>3 ชั้น</div><div style={s("font-size:12px;color:rgba(255,255,255,.5);margin-top:5px;")}>ตรวจงบอัตโนมัติ</div></div>
          </div>
        </div>

        {/* hero visual: floating dashboard card */}
        <div style={s("position:relative;animation:floaty 6s ease-in-out infinite;")}>
          <div style={s("position:absolute;inset:-26px;border-radius:30px;background:linear-gradient(135deg,rgba(124,45,224,.4),rgba(232,74,160,.3));filter:blur(34px);")} />
          <div style={s("position:relative;background:rgba(28,20,44,.86);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:20px;box-shadow:0 40px 80px -30px rgba(0,0,0,.7);")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;")}>
              <div style={s("display:flex;align-items:center;gap:8px;")}><span style={s("width:9px;height:9px;border-radius:50%;background:#E84AA0;")} /><span style={s("font-size:12.5px;font-weight:600;color:#fff;")}>SKU ที่ AI ดักไว้</span></div>
              <span style={s("font-size:10px;font-weight:600;color:#FFD057;background:rgba(255,208,87,.14);padding:3px 9px;border-radius:99px;")}>ดักก่อนซื้อ</span>
            </div>
            <div style={s("display:flex;flex-direction:column;gap:9px;")}>
              <div style={s("display:flex;align-items:center;gap:11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:11px 13px;")}>
                <span style={s("width:34px;height:34px;border-radius:9px;background:rgba(232,74,160,.18);color:#F472B6;display:flex;align-items:center;justify-content:center;flex:none;")}><Cable style={s("width:16px;height:16px;")} /></span>
                <div style={s("flex:1;min-width:0;")}><div style={s("font-size:12.5px;color:#fff;font-weight:500;")}>สายเคเบิล XLPE 240</div><div className="mono" style={s("font-size:10px;color:rgba(255,255,255,.4);")}>สต็อก 60 &lt; ROP 68</div></div>
                <span style={s("font-size:12px;font-weight:700;color:#C77DFF;")}>+10 ม.</span>
              </div>
              <div style={s("display:flex;align-items:center;gap:11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:11px 13px;")}>
                <span style={s("width:34px;height:34px;border-radius:9px;background:rgba(124,45,224,.2);color:#C77DFF;display:flex;align-items:center;justify-content:center;flex:none;")}><Recycle style={s("width:16px;height:16px;")} /></span>
                <div style={s("flex:1;min-width:0;")}><div style={s("font-size:12.5px;color:#fff;font-weight:500;")}>เสาคอนกรีต 12m</div><div className="mono" style={s("font-size:10px;color:rgba(255,255,255,.4);")}>K020 มีของจม 320 ต้น</div></div>
                <span style={s("font-size:11px;font-weight:600;color:#34D399;")}>ยืมแทน</span>
              </div>
              <div style={s("display:flex;align-items:center;gap:11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:11px 13px;")}>
                <span style={s("width:34px;height:34px;border-radius:9px;background:rgba(255,208,87,.16);color:#FCD34D;display:flex;align-items:center;justify-content:center;flex:none;")}><SearchCheck style={s("width:16px;height:16px;")} /></span>
                <div style={s("flex:1;min-width:0;")}><div style={s("font-size:12.5px;color:#fff;font-weight:500;")}>ตรวจซื้อซ้ำ K030</div><div className="mono" style={s("font-size:10px;color:rgba(255,255,255,.4);")}>ของบ 3 ปีซ้อน ทั้งที่ของจม</div></div>
                <span style={s("font-size:11px;font-weight:600;color:#FCA5A5;")}>flag</span>
              </div>
            </div>
            <div style={s("margin-top:14px;display:flex;align-items:center;justify-content:space-between;padding-top:14px;border-top:1px solid rgba(255,255,255,.08);")}>
              <span style={s("font-size:11px;color:rgba(255,255,255,.5);")}>ประหยัดรอบนี้</span>
              <span style={s("font-size:17px;font-weight:700;background:linear-gradient(100deg,#E84AA0,#C77DFF);-webkit-background-clip:text;background-clip:text;color:transparent;")}>฿420,000</span>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div style={s("position:relative;z-index:3;max-width:1240px;margin:0 auto;padding:14px 40px 50px;")}>
        <div style={s("display:flex;align-items:center;gap:26px;flex-wrap:wrap;font-size:12px;color:rgba(255,255,255,.4);")}>
          <span>ออกแบบให้สอดคล้อง</span>
          <span style={s("display:flex;align-items:center;gap:7px;color:rgba(255,255,255,.62);")}><Scale style={s("width:14px;height:14px;")} /> พ.ร.บ.จัดซื้อจัดจ้างฯ 2560</span>
          <span style={s("display:flex;align-items:center;gap:7px;color:rgba(255,255,255,.62);")}><Database style={s("width:14px;height:14px;")} /> SAP-MM / GFMIS</span>
          <span style={s("display:flex;align-items:center;gap:7px;color:rgba(255,255,255,.62);")}><ShieldCheck style={s("width:14px;height:14px;")} /> Calculation Snapshot · Audit-ready</span>
        </div>
      </div>

      {/* FEATURES */}
      <section id="sec-solution" style={s("position:relative;z-index:3;background:linear-gradient(180deg,rgba(20,12,38,0),#120D22 18%);padding:30px 0 70px;scroll-margin-top:80px;")}>
        <div style={s("max-width:1240px;margin:0 auto;padding:0 40px;")}>
          <div style={s("text-align:center;margin-bottom:44px;")}>
            <div style={s("font-size:12.5px;font-weight:600;letter-spacing:1px;color:#C77DFF;text-transform:uppercase;margin-bottom:10px;")}>โซลูชัน</div>
            <h2 style={s("margin:0 0 12px;font-size:34px;font-weight:600;letter-spacing:-.4px;color:#fff;")}>ครบทั้งวงจร ตั้งแต่วางแผนถึงตรวจรับ</h2>
            <p style={s("margin:0 auto;font-size:14.5px;color:rgba(255,255,255,.55);max-width:560px;")}>ทุกฟีเจอร์คำนวณจากข้อมูลจริงของ PEA — ไม่ใช่กล่องดำ แต่อธิบายได้ทุกขั้นตอน</p>
          </div>
          <div style={s("display:grid;grid-template-columns:repeat(3,1fr);gap:18px;")}>
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} style={s("background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:24px;")}>
                  <span style={{ width: 48, height: 48, borderRadius: 13, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", marginBottom: 16, boxShadow: f.shadow } as CSSProperties}><Icon style={s("width:22px;height:22px;")} /></span>
                  <h3 style={s("margin:0 0 8px;font-size:17px;font-weight:600;color:#fff;")}>{f.title}</h3>
                  <p style={s("margin:0;font-size:13px;line-height:1.6;color:rgba(255,255,255,.56);")}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DEAD STOCK MARKETPLACE SPOTLIGHT */}
      <section id="sec-marketplace" style={s("position:relative;z-index:3;background:#120D22;padding:10px 0 64px;scroll-margin-top:80px;")}>
        <div style={s("max-width:1240px;margin:0 auto;padding:0 40px;")}>
          <div style={s("position:relative;border:1px solid rgba(255,255,255,.1);border-radius:26px;overflow:hidden;background:linear-gradient(135deg,#1B0F33 0%,#241043 48%,#3A1163 100%);")}>
            <div style={s("position:absolute;top:-90px;right:-40px;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(232,74,160,.3),transparent 65%);filter:blur(28px);pointer-events:none;")} />
            <div style={s("position:absolute;bottom:-120px;left:-50px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle,rgba(124,45,224,.26),transparent 65%);filter:blur(30px);pointer-events:none;")} />
            <div style={s("position:relative;display:grid;grid-template-columns:1.02fr .98fr;gap:40px;align-items:center;padding:42px 44px;")}>
              <div>
                <div style={s("display:inline-flex;align-items:center;gap:8px;padding:6px 13px;border-radius:99px;background:rgba(255,208,87,.12);border:1px solid rgba(255,208,87,.28);margin-bottom:20px;")}>
                  <Star style={s("width:13px;height:13px;color:#FFD057;")} />
                  <span style={s("font-size:11.5px;font-weight:600;color:#FFD057;letter-spacing:.3px;")}>ฟีเจอร์เด่น · Hero feature</span>
                </div>
                <h2 style={s("margin:0 0 14px;font-size:34px;line-height:1.12;font-weight:600;letter-spacing:-.5px;color:#fff;")}>ตลาดนัด<span style={grad}>ของจม</span></h2>
                <p style={s("margin:0 0 24px;font-size:15px;line-height:1.65;color:rgba(255,255,255,.66);max-width:440px;")}>ก่อนซื้อใหม่ เช็กก่อนว่าคลังข้าง ๆ มีของนอนอยู่ไหม — ระบบเห็นของเกินทั้งองค์กร จับคู่คลังที่เกินกับคลังที่ขาด แล้วแนะนำโอน/ยืมก่อนเปิดคำขอซื้อ</p>
                <div style={s("display:flex;flex-direction:column;gap:14px;margin-bottom:26px;")}>
                  <div style={s("display:flex;align-items:flex-start;gap:13px;")}>
                    <span style={s("width:38px;height:38px;border-radius:10px;background:rgba(232,74,160,.16);color:#F472B6;display:flex;align-items:center;justify-content:center;flex:none;")}><Radar style={s("width:18px;height:18px;")} /></span>
                    <div><div style={s("font-size:14px;font-weight:600;color:#fff;")}>Dead Stock Radar</div><div style={s("font-size:12.5px;color:rgba(255,255,255,.55);line-height:1.5;")}>จับ SKU ที่ Stock Cover สูงผิดปกติ · slow-moving · ไม่มี demand ใน season ถัดไป</div></div>
                  </div>
                  <div style={s("display:flex;align-items:flex-start;gap:13px;")}>
                    <span style={s("width:38px;height:38px;border-radius:10px;background:rgba(124,45,224,.2);color:#C77DFF;display:flex;align-items:center;justify-content:center;flex:none;")}><Hand style={s("width:18px;height:18px;")} /></span>
                    <div><div style={s("font-size:14px;font-weight:600;color:#fff;")}>Before Buy Check</div><div style={s("font-size:12.5px;color:rgba(255,255,255,.55);line-height:1.5;")}>ก่อนสร้าง PR ระบบเช็กก่อนว่า “มีของเกินในคลังอื่นไหม” แล้วเสนอ source ให้</div></div>
                  </div>
                  <div style={s("display:flex;align-items:flex-start;gap:13px;")}>
                    <span style={s("width:38px;height:38px;border-radius:10px;background:rgba(255,208,87,.14);color:#FCD34D;display:flex;align-items:center;justify-content:center;flex:none;")}><ScrollText style={s("width:18px;height:18px;")} /></span>
                    <div><div style={s("font-size:14px;font-weight:600;color:#fff;")}>Over-order Audit</div><div style={s("font-size:12.5px;color:rgba(255,255,255,.55);line-height:1.5;")}>ใครขอเกิน AI Suggest กี่ % เพราะอะไร ใครอนุมัติ — และของนั้นถูกใช้จริงไหม</div></div>
                  </div>
                </div>
                <div style={s("display:flex;align-items:center;gap:11px;padding:13px 16px;border-radius:13px;background:rgba(255,255,255,.04);border-left:3px solid #E84AA0;")}>
                  <Quote style={s("width:16px;height:16px;color:#E84AA0;flex:none;")} />
                  <span style={s("font-size:13.5px;font-style:italic;color:rgba(255,255,255,.82);")}>“Dead Stock ไม่ได้ตาย ถ้ามีคนรู้ว่ามันอยู่ที่ไหน”</span>
                </div>
              </div>

              <div style={s("position:relative;")}>
                <div style={s("background:rgba(28,20,44,.7);backdrop-filter:blur(6px);border:1px solid rgba(244,114,182,.3);border-radius:16px;padding:15px 17px;box-shadow:0 24px 50px -28px rgba(0,0,0,.8);")}>
                  <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:11px;")}>
                    <div style={s("display:flex;align-items:center;gap:9px;")}><span style={s("width:32px;height:32px;border-radius:9px;background:rgba(232,74,160,.18);color:#F472B6;display:flex;align-items:center;justify-content:center;flex:none;")}><WarehouseIcon style={s("width:16px;height:16px;")} /></span><div><div style={s("font-size:13px;font-weight:600;color:#fff;")}>คลัง K020</div><div style={s("font-size:10.5px;color:rgba(255,255,255,.45);")}>ภาคเหนือ · เขต A</div></div></div>
                    <span style={s("font-size:10px;font-weight:600;color:#F9A8D4;background:rgba(232,74,160,.16);padding:3px 9px;border-radius:99px;")}>มีของเกิน</span>
                  </div>
                  <div style={s("display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.04);border-radius:11px;padding:10px 12px;")}>
                    <span style={s("width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.06);color:#C77DFF;display:flex;align-items:center;justify-content:center;flex:none;")}><Construction style={s("width:15px;height:15px;")} /></span>
                    <div style={s("flex:1;min-width:0;")}><div style={s("font-size:12px;color:#fff;font-weight:500;")}>เสาคอนกรีต 12m</div><div className="mono" style={s("font-size:10px;color:rgba(255,255,255,.42);")}>ของจม 320 ต้น · นิ่ง 14 เดือน</div></div>
                    <span style={s("font-size:11.5px;font-weight:700;color:#F472B6;")}>฿1.44M</span>
                  </div>
                </div>

                <div style={s("display:flex;align-items:center;justify-content:center;gap:10px;padding:11px 0;")}>
                  <span style={s("height:1px;flex:1;background:linear-gradient(90deg,transparent,rgba(199,125,255,.5));")} />
                  <span style={s("display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#fff;background:linear-gradient(135deg,#7C2DE0,#C0249B);padding:5px 13px;border-radius:99px;box-shadow:0 8px 18px -8px rgba(184,40,170,.9);")}><ArrowDownUp style={s("width:13px;height:13px;")} /> จับคู่อัตโนมัติ · SKU ตรงกัน</span>
                  <span style={s("height:1px;flex:1;background:linear-gradient(90deg,rgba(232,74,160,.5),transparent);")} />
                </div>

                <div style={s("background:rgba(28,20,44,.7);backdrop-filter:blur(6px);border:1px solid rgba(252,165,165,.28);border-radius:16px;padding:15px 17px;box-shadow:0 24px 50px -28px rgba(0,0,0,.8);")}>
                  <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:11px;")}>
                    <div style={s("display:flex;align-items:center;gap:9px;")}><span style={s("width:32px;height:32px;border-radius:9px;background:rgba(220,38,38,.2);color:#FCA5A5;display:flex;align-items:center;justify-content:center;flex:none;")}><WarehouseIcon style={s("width:16px;height:16px;")} /></span><div><div style={s("font-size:13px;font-weight:600;color:#fff;")}>คลัง K030</div><div style={s("font-size:10.5px;color:rgba(255,255,255,.45);")}>ภาคเหนือ · เขต A</div></div></div>
                    <span style={s("font-size:10px;font-weight:600;color:#FCA5A5;background:rgba(220,38,38,.16);padding:3px 9px;border-radius:99px;")}>เสี่ยงขาด</span>
                  </div>
                  <div style={s("display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.04);border-radius:11px;padding:10px 12px;")}>
                    <span style={s("width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.06);color:#FCD34D;display:flex;align-items:center;justify-content:center;flex:none;")}><Construction style={s("width:15px;height:15px;")} /></span>
                    <div style={s("flex:1;min-width:0;")}><div style={s("font-size:12px;color:#fff;font-weight:500;")}>เสาคอนกรีต 12m</div><div className="mono" style={s("font-size:10px;color:rgba(255,255,255,.42);")}>ต้องการ 6 ต้น · จะเปิด PR</div></div>
                    <span style={s("font-size:11.5px;font-weight:700;color:#FCA5A5;")}>ขาด</span>
                  </div>
                </div>

                <div style={s("margin-top:14px;display:flex;align-items:center;gap:12px;background:linear-gradient(110deg,#2A0A54,#7A1E8C 75%,#9A1F87);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:13px 16px;box-shadow:0 18px 40px -20px rgba(154,31,135,.9);")}>
                  <span style={s("width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.16);color:#fff;display:flex;align-items:center;justify-content:center;flex:none;")}><HandCoins style={s("width:19px;height:19px;")} /></span>
                  <div style={s("flex:1;min-width:0;")}><div style={s("font-size:12.5px;font-weight:600;color:#fff;")}>เบรกก่อนเปิด PR — ยืมแทนซื้อ</div><div style={s("font-size:11px;color:rgba(255,255,255,.72);")}>ประหยัด ฿27,000 · Lead Time เหลือ 2 วัน</div></div>
                  <span style={s("font-size:11px;font-weight:700;color:#FFD057;background:rgba(255,208,87,.14);padding:4px 10px;border-radius:99px;flex:none;")}>−100% ซื้อใหม่</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO BAND */}
      <section style={s("position:relative;z-index:3;background:#120D22;padding:6px 0 60px;")}>
        <div style={s("max-width:980px;margin:0 auto;padding:0 40px;text-align:center;")}>
          <Megaphone style={s("width:26px;height:26px;color:#C77DFF;margin-bottom:14px;")} />
          <h2 style={s("margin:0 0 10px;font-size:30px;line-height:1.3;font-weight:600;letter-spacing:-.3px;color:#fff;")}>เราไม่ได้สร้างระบบเพื่อ<span style={s("color:rgba(255,255,255,.5);")}>ซื้อของให้เร็วขึ้น</span><br />แต่สร้างระบบที่ถามก่อนว่า <span style={grad}>“จำเป็นต้องซื้อจริงไหม”</span></h2>
          <p style={s("margin:0 auto;font-size:14px;color:rgba(255,255,255,.5);max-width:600px;line-height:1.6;")}>ถ้าองค์กรมีของเกินอยู่แล้ว ระบบควรเห็น จับคู่ และโอนใช้ได้ ก่อนที่เงินก้อนใหม่จะถูกใช้ซ้ำ</p>
        </div>
      </section>

      {/* CLOSED LOOP STRIP */}
      <section id="sec-closedloop" style={s("position:relative;z-index:3;background:#120D22;padding:0 0 70px;scroll-margin-top:80px;")}>
        <div style={s("max-width:1100px;margin:0 auto;padding:0 40px;")}>
          <div style={s("background:linear-gradient(120deg,#2A1052,#3A1078 55%,#6E1A78);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:38px 40px;position:relative;overflow:hidden;")}>
            <div style={s("position:absolute;top:-60px;right:-30px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(232,74,160,.35),transparent 65%);filter:blur(20px);")} />
            <div style={s("position:relative;text-align:center;margin-bottom:30px;")}>
              <h2 style={s("margin:0 0 8px;font-size:26px;font-weight:600;color:#fff;")}>ยิ่งใช้ ยิ่งแม่น</h2>
              <p style={s("margin:0;font-size:13.5px;color:rgba(255,255,255,.6);")}>ทุกการตัดสินใจป้อนกลับเข้าสูตร — วงจรเรียนรู้ที่ตรวจสอบย้อนหลังได้</p>
            </div>
            <div style={s("position:relative;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;")}>
              {loopSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <Fragment key={step.label}>
                    <div style={s("text-align:center;")}>
                      <span style={step.last
                        ? s("width:50px;height:50px;border-radius:14px;background:linear-gradient(140deg,#E84AA0,#C77DFF);display:flex;align-items:center;justify-content:center;color:#fff;margin:0 auto 8px;box-shadow:0 10px 22px -8px rgba(232,74,160,.8);")
                        : s("width:50px;height:50px;border-radius:14px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;color:#fff;margin:0 auto 8px;")}><Icon style={s("width:22px;height:22px;")} /></span>
                      <div style={s(`font-size:12px;color:${step.last ? "#fff" : "rgba(255,255,255,.8)"};${step.last ? "font-weight:600;" : ""}`)}>{step.label}</div>
                    </div>
                    {i < loopSteps.length - 1 ? <ArrowRight style={s("width:18px;height:18px;color:rgba(255,255,255,.4);")} /> : null}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={s("position:relative;z-index:3;background:#120D22;padding:0 0 80px;")}>
        <div style={s("max-width:1100px;margin:0 auto;padding:0 40px;text-align:center;")}>
          <h2 style={s("margin:0 0 14px;font-size:32px;font-weight:600;letter-spacing:-.4px;color:#fff;")}>พร้อมเปลี่ยนวิธีจัดการพัสดุแล้วหรือยัง?</h2>
          <p style={s("margin:0 auto 28px;font-size:14.5px;color:rgba(255,255,255,.58);max-width:480px;")}>เข้าสู่ระบบเพื่อดูแดชบอร์ดความเสี่ยง งบประมาณ และคำแนะนำ AI สำหรับเขตของคุณ</p>
          <button onClick={onLogin} style={s("display:inline-flex;align-items:center;gap:8px;height:52px;padding:0 30px;border:0;border-radius:14px;background:linear-gradient(135deg,#7C2DE0,#C0249B);color:#fff;font-family:inherit;font-size:15.5px;font-weight:600;box-shadow:0 18px 40px -12px rgba(184,40,170,.85);cursor:pointer;")}>เข้าสู่ระบบ <ArrowRight style={s("width:18px;height:18px;")} /></button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={s("position:relative;z-index:3;background:#0E0A1A;border-top:1px solid rgba(255,255,255,.07);padding:26px 0;")}>
        <div style={s("max-width:1240px;margin:0 auto;padding:0 40px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;")}>
          <div style={s("display:flex;align-items:center;gap:11px;")}>
            <div style={s("width:32px;height:32px;border-radius:9px;background:linear-gradient(140deg,#8B2FE6,#E84AA0);display:flex;align-items:center;justify-content:center;")}><Boxes style={s("width:17px;height:17px;color:#fff;")} /></div>
            <span style={s("font-size:13px;color:rgba(255,255,255,.7);")}>PEA AI Stock Intelligent</span>
          </div>
          <div style={s("font-size:12px;color:rgba(255,255,255,.4);")}>Hackathon 2026 · by ThaiCloud · Track 2 · ต้นแบบเพื่อการนำเสนอ</div>
        </div>
      </footer>

      {/* back to top FAB */}
      <button
        onClick={toTop}
        style={{
          position: "fixed",
          bottom: 26,
          right: 26,
          zIndex: 50,
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          height: 44,
          padding: "0 18px",
          border: 0,
          borderRadius: 99,
          background: "linear-gradient(135deg,#7C2DE0,#C0249B)",
          color: "#fff",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 600,
          boxShadow: "0 14px 30px -10px rgba(184,40,170,.9)",
          cursor: "pointer",
          opacity: showFab ? 1 : 0,
          transform: showFab ? "translateY(0)" : "translateY(12px)",
          pointerEvents: showFab ? "auto" : "none",
          transition: "opacity .2s, transform .2s",
        } as CSSProperties}
      >
        <ArrowUp style={s("width:17px;height:17px;")} /> เลือกหัวข้อ
      </button>
    </div>
  );
}

// ตัวเลือกขอบเขตข้อมูล (เขต/คลัง/ทั้งหมด) — รายการปรับตามบทบาทผู้ใช้
// จนท.คลัง → เห็นคลังตัวเอง · ผอ.เขต → ทุกคลังในเขต + รายคลัง · ส่วนกลาง/admin/analyst → ทั้งหมด + รายเขต
function ScopeSelector({ currentUser }: { currentUser: SessionUser | null }) {
  const title = currentUser?.title ?? "";
  const isAdmin = currentUser?.role === "admin";
  const scopeRole: "warehouse" | "region" | "all" = isAdmin
    ? "all"
    : title.includes("คลัง")
      ? "warehouse"
      : title.includes("เขต")
        ? "region"
        : "all";

  const options: string[] = (() => {
    if (scopeRole === "warehouse") {
      const w = warehouses.find((x) => title.includes(x.id)) ?? warehouses[0];
      return [`คลัง ${w.id} · ${regionLabels[w.region]}`];
    }
    if (scopeRole === "region") {
      const region = "North";
      const inRegion = warehouses.filter((w) => w.region === region);
      return [`ทุกคลังในเขต · ${regionLabels[region]}`, ...inRegion.map((w) => `คลัง ${w.id}`)];
    }
    const regions = Array.from(new Set(warehouses.map((w) => w.region)));
    return ["ทั้งหมด (ทุกเขต)", ...regions.map((r) => `เขต · ${regionLabels[r]}`)];
  })();

  const roleLabel = scopeRole === "warehouse" ? "จนท.คลัง" : scopeRole === "region" ? "ผอ.เขต" : "ส่วนกลาง / ทั้งหมด";
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(options[0]);
  const safeSelected = options.includes(selected) ? selected : options[0];

  return (
    <div style={s("position:relative;")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="ขอบเขตข้อมูล (ปรับตามบทบาท)"
        style={s("display:flex;align-items:center;gap:8px;height:38px;padding:0 13px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;cursor:pointer;font-family:inherit;font-size:12.5px;color:#3B3654;font-weight:500;white-space:nowrap;")}
      >
        <MapPin style={s("width:15px;height:15px;color:#6D28D9;")} /> {safeSelected} <ChevronDown style={s("width:15px;height:15px;color:#9B95B0;")} />
      </button>
      {open ? (
        <>
          <div onClick={() => setOpen(false)} style={s("position:fixed;inset:0;z-index:40;")} />
          <div style={s("position:absolute;top:44px;left:0;z-index:50;min-width:230px;background:#fff;border:1px solid #E5E1F0;border-radius:12px;box-shadow:0 16px 40px -18px rgba(28,24,48,.4);padding:6px;")}>
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => { setSelected(o); setOpen(false); }}
                style={s(`display:flex;width:100%;align-items:center;gap:8px;padding:9px 10px;border:0;border-radius:8px;background:${o === safeSelected ? "#F4EEFE" : "transparent"};color:${o === safeSelected ? "#6D28D9" : "#3B3654"};font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;text-align:left;`)}
              >
                <MapPin style={s("width:14px;height:14px;color:#9B95B0;")} /> {o}
              </button>
            ))}
            <div style={s("padding:8px 10px 4px;margin-top:2px;border-top:1px solid #F1EEF8;font-size:10.5px;color:#9B95B0;")}>ขอบเขตปรับตามบทบาท: <b style={s("color:#6D28D9;")}>{roleLabel}</b></div>
          </div>
        </>
      ) : null}
    </div>
  );
}

// กระดิ่งแจ้งเตือน — กดเปิด dropdown ดูตัวอย่างการแจ้งเตือน (กดแต่ละรายการไปหน้าที่เกี่ยวข้องได้)
function NotificationBell({ onNavigate }: { onNavigate: (view: View) => void }) {
  const items: { icon: typeof AlertOctagon; color: string; bg: string; title: string; desc: string; time: string; view: View; unread: boolean }[] = [
    { icon: AlertOctagon, color: "#DC2626", bg: "#FEF2F2", title: "SKU วิกฤต 3 รายการ", desc: "สายเคเบิล XLPE 240 · ต่ำกว่า Reorder Point", time: "5 นาทีที่แล้ว", view: "inventory", unread: true },
    { icon: ClipboardCheck, color: "#6D28D9", bg: "#F4EEFE", title: "คำขอรออนุมัติ", desc: "PR-2569-0182 · รอผอ.เขตอนุมัติ ฿330,000", time: "32 นาทีที่แล้ว", view: "approval", unread: true },
    { icon: Recycle, color: "#B45309", bg: "#FFFAEB", title: "ของจมจับคู่โอนได้", desc: "K020 มีเสาคอนกรีต 320 ต้น · ยืม/โอนแทนซื้อ", time: "1 ชม.ที่แล้ว", view: "transfer", unread: true },
    { icon: Hand, color: "#2563EB", bg: "#EFF4FF", title: "ตรวจรับล่าช้า", desc: "หม้อแปลง 100kVA · delay 6 วัน กระทบ demand", time: "วันนี้ 09:20", view: "receiving-delay", unread: false },
    { icon: Landmark, color: "#059669", bg: "#ECFDF5", title: "งบเขตอัปเดต", desc: "เพิ่มงบไตรมาส 3 · เขต A ฿4.20M → ฿4.50M", time: "เมื่อวาน", view: "budget-settings", unread: false },
  ];
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const unreadCount = seen ? 0 : items.filter((i) => i.unread).length;

  return (
    <div style={s("position:relative;")}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setSeen(true); }}
        title="การแจ้งเตือน"
        aria-label="การแจ้งเตือน"
        style={s("position:relative;width:38px;height:38px;flex:none;border:1px solid #E5E1F0;border-radius:10px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#3B3654;")}
      >
        <Bell style={s("width:18px;height:18px;")} />
        {unreadCount > 0 ? <span style={s("position:absolute;top:8px;right:9px;width:7px;height:7px;border-radius:50%;background:#DC2626;border:1.5px solid #fff;")} /> : null}
      </button>
      {open ? (
        <>
          <div onClick={() => setOpen(false)} style={s("position:fixed;inset:0;z-index:40;")} />
          <div style={s("position:absolute;top:44px;right:0;z-index:50;width:340px;background:#fff;border:1px solid #E5E1F0;border-radius:14px;box-shadow:0 18px 44px -18px rgba(28,24,48,.45);overflow:hidden;")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid #F1EEF8;")}>
              <span style={s("font-size:13.5px;font-weight:600;color:#1C1830;")}>การแจ้งเตือน</span>
              <span style={s("font-size:11px;font-weight:600;color:#6D28D9;background:#F4EEFE;padding:2px 8px;border-radius:99px;")}>{items.filter((i) => i.unread).length} ใหม่</span>
            </div>
            <div style={s("max-height:360px;overflow-y:auto;")}>
              {items.map((n, i) => {
                const Icon = n.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    className="dash-row"
                    onClick={() => { onNavigate(n.view); setOpen(false); }}
                    style={s(`display:flex;width:100%;gap:11px;padding:12px 16px;border:0;border-top:${i === 0 ? "0" : "1px solid #F4F2FA"};background:transparent;cursor:pointer;text-align:left;`)}
                  >
                    <span style={s(`width:34px;height:34px;border-radius:9px;background:${n.bg};color:${n.color};display:flex;align-items:center;justify-content:center;flex:none;`)}><Icon style={s("width:16px;height:16px;")} /></span>
                    <span style={s("flex:1;min-width:0;")}>
                      <span style={s("display:flex;align-items:center;gap:6px;")}><span style={s("font-size:12.5px;font-weight:600;color:#1C1830;")}>{n.title}</span>{n.unread ? <span style={s("width:6px;height:6px;border-radius:50%;background:#DC2626;flex:none;")} /> : null}</span>
                      <span style={s("display:block;font-size:11.5px;color:#7B7591;line-height:1.45;margin-top:2px;")}>{n.desc}</span>
                      <span style={s("display:block;font-size:10.5px;color:#A29DB5;margin-top:3px;")}>{n.time}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => { onNavigate("history"); setOpen(false); }} style={s("display:block;width:100%;padding:11px;border:0;border-top:1px solid #F1EEF8;background:#FAF9FD;color:#6D28D9;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;")}>ดูทั้งหมดในประวัติ</button>
          </div>
        </>
      ) : null}
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
  onLogout,
  onExitToLanding,
  children,
}: {
  view: View;
  formulaPolicy: FormulaPolicyState;
  onNavigate: (view: View) => void;
  noteCount: number;
  onAddNote: (text: string, context: string) => void;
  currentUser: SessionUser | null;
  onLogout: () => void;
  onExitToLanding: () => void;
  children: ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // โหมด Dark/Light — เก็บใน localStorage ต่อเครื่อง (data-theme บน root + dark CSS ใน index.css)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try { return localStorage.getItem("pea-theme") === "dark" ? "dark" : "light"; } catch { return "light"; }
  });
  useEffect(() => { try { localStorage.setItem("pea-theme", theme); } catch { /* ignore */ } }, [theme]);
  const [searchQuery, setSearchQuery] = useState("");
  // เมนูจัดเป็น 5 หมวดตามลำดับงานจริง (ดูภาพรวม → วิเคราะห์ความเสี่ยง → ลงมือจัดซื้อ → อ้างอิง → ตั้งค่า)
  // หน้า "การใช้ SKU" ยุบเป็นแท็บใน "คลังพัสดุ" และ "บัญชีผู้ใช้" ย้ายไปปุ่มบน header
  const navSections = [
    {
      title: "ภาพรวม",
      items: [
        { id: "dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
        { id: "brain", label: "สมองกลางพัสดุ", icon: BrainCircuit },
        { id: "disaster", label: "ศูนย์ระดมพัสดุฉุกเฉิน", icon: Siren },
      ],
    },
    {
      title: "คลัง & ความเสี่ยง",
      items: [
        { id: "inventory", label: "คลังพัสดุ & SKU", icon: Boxes },
        { id: "stock-intelligence", label: "วิเคราะห์สต็อก", icon: BarChart3 },
        { id: "procurement-audit", label: "ตรวจซื้อซ้ำ-ของจม", icon: SearchCheck },
      ],
    },
    {
      title: "จัดซื้อ & เคลื่อนย้าย",
      items: [
        { id: "request", label: "คำขอซื้อ", icon: FileText },
        { id: "approval", label: "อนุมัติ", icon: ClipboardCheck },
        { id: "transfer", label: "โอน/ยืม/แลก", icon: ArrowRightLeft },
        { id: "receiving-delay", label: "รับของ/Delay", icon: PackageCheck },
        { id: "mobilize", label: "คำขอระดม (รับ)", icon: Inbox },
      ],
    },
    {
      title: "ข้อมูล & ระบบ",
      items: [
        { id: "supplier", label: "ซัพพลายเออร์", icon: Truck },
        { id: "vmi", label: "VMI", icon: RefreshCcw },
        { id: "data", label: "นำเข้าข้อมูล", icon: Database },
        { id: "diff", label: "เฝ้าระวัง Diff", icon: GitCompare },
        { id: "history", label: "ประวัติ & Snapshot", icon: History },
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
    // อักษรย่อสำหรับ avatar (ตัวแรกของคำสองคำแรกในชื่อ) + ป้ายบทบาทเป็นภาษาไทย
    const initials = currentUser
      ? currentUser.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("") || currentUser.name.slice(0, 2)
      : "";
    const roleLabel = currentUser?.title ?? (currentUser?.role === "admin" ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่คลัง");

    return (
      <div className="flex min-h-full flex-col">
        <div className={`border-b border-white/10 ${collapsed ? "px-3 py-5" : "px-5 py-5"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between gap-3"}`}>
            <div className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-3"}`}>
              <div style={s("position:relative;width:42px;height:42px;border-radius:13px;background:linear-gradient(140deg,#8B2FE6 0%,#B51C9E 52%,#E84AA0 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 9px 22px -6px rgba(184,40,170,.8),inset 0 1px 0 rgba(255,255,255,.3);flex:none;overflow:hidden;")}>
                <div style={s("position:absolute;top:-10px;left:-10px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.28);filter:blur(7px);")} />
                <div style={s("position:absolute;bottom:-12px;right:-6px;width:26px;height:26px;border-radius:50%;background:rgba(124,45,224,.55);filter:blur(8px);")} />
                <Boxes style={s("position:relative;width:23px;height:23px;color:#fff;")} />
                <span style={s("position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:#FFD057;box-shadow:0 0 7px 1px rgba(255,208,87,.85);animation:pdot 1.9s infinite;")} />
              </div>
              {!collapsed ? (
                <div className="min-w-0">
                  <p style={s("color:#fff;font-weight:600;font-size:12.5px;line-height:1.2;")}>PEA AI Stock Intelligent</p>
                  <p style={s("color:rgba(255,255,255,.5);font-size:10px;line-height:1.3;margin-top:1px;")}>ระบบบริหารสต๊อคอัจฉริยะ</p>
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

        <nav className={`flex-1 ${collapsed ? "space-y-1 p-2" : "p-3"}`}>
          {navSections.map((section, sectionIndex) => (
            <div key={section.title} className={collapsed ? "" : sectionIndex > 0 ? "mt-4" : ""}>
              {!collapsed ? (
                <p className="px-3 pb-1.5 pt-3 text-[10.5px] font-semibold uppercase tracking-[.8px] text-white/[.34]">{section.title}</p>
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
                      className={`flex h-10 w-full items-center rounded-[10px] text-[13.5px] transition ${
                        collapsed ? "justify-center px-0" : "gap-[11px] px-3 text-left"
                      } ${active ? "bg-white/[.16] font-semibold text-white" : "font-normal text-white/[.62] hover:bg-white/10 hover:text-white"}`}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: แท็ก Track + การ์ดผู้ใช้/เข้าสู่ระบบ (ย้ายมาจาก header ตามดีไซน์ HTML) */}
        <div className={`mt-auto ${collapsed ? "px-2 pb-3" : "px-3 pb-3"}`}>
          {!collapsed ? (
            <div className="px-1 pb-2 pt-1">
              <span style={s("font-size:10px;color:rgba(255,255,255,.42);white-space:nowrap;letter-spacing:.2px;")}>Hackathon 2026 · by ThaiCloud <span style={s("color:rgba(255,255,255,.72);font-weight:600;")}>[ Track 2 ]</span></span>
            </div>
          ) : null}
          <div className="pt-3" style={s("border-top:1px solid rgba(255,255,255,.08);")}>
            {currentUser ? (
              collapsed ? (
                <button
                  type="button"
                  onClick={onLogout}
                  title={`${currentUser.name} · ออกจากระบบ`}
                  style={s("display:flex;width:100%;justify-content:center;border:0;background:transparent;cursor:pointer;padding:0;")}
                >
                  <span style={s("width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#F0ABFC,#A855F7);display:flex;align-items:center;justify-content:center;color:#3E1473;font-weight:600;font-size:13px;flex:none;")}>{initials}</span>
                </button>
              ) : (
                <div style={s("display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:11px;background:rgba(255,255,255,.06);")}>
                  <span style={s("width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#F0ABFC,#A855F7);display:flex;align-items:center;justify-content:center;color:#3E1473;font-weight:600;font-size:13px;flex:none;")}>{initials}</span>
                  <div style={s("min-width:0;flex:1;")}>
                    <div style={s("color:#fff;font-size:12.5px;font-weight:500;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;")}>{currentUser.name}{currentUser.role === "admin" ? " (admin)" : ""}</div>
                    <div style={s("color:rgba(255,255,255,.5);font-size:10.5px;line-height:1.3;")}>{roleLabel} · @{currentUser.username}</div>
                  </div>
                  <button type="button" onClick={onLogout} title="ออกจากระบบ" className="shrink-0 rounded-md p-1 transition hover:bg-white/10">
                    <LogOut style={s("width:16px;height:16px;color:rgba(255,255,255,.55);")} />
                  </button>
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={() => handleNavigate("auth")}
                title={collapsed ? "เข้าสู่ระบบ" : undefined}
                style={s(`display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border:0;border-radius:11px;background:rgba(255,255,255,.06);cursor:pointer;font-family:inherit;transition:background .15s;${collapsed ? "justify-content:center;" : ""}`)}
              >
                <span style={s("width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;flex:none;")}><User style={s("width:17px;height:17px;color:#fff;")} /></span>
                {!collapsed ? <span style={s("color:#fff;font-size:12.5px;font-weight:500;")}>เข้าสู่ระบบ / สมัคร</span> : null}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 lg:flex" data-theme={theme}>
      {mobileMenuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="ปิดแถบเมนู"
        />
      ) : null}

      <aside
        className={`sidebar-violet fixed inset-y-0 left-0 z-50 w-72 transform overflow-y-auto border-r border-white/10 text-white shadow-2xl transition-transform duration-200 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebar("mobile")}
      </aside>

      <aside
        className={`sidebar-violet hidden shrink-0 border-r border-white/10 text-white transition-[width] duration-200 lg:block lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {renderSidebar("desktop")}
      </aside>

      <main className="min-w-0 flex-1">
        <header className="app-header sticky top-0 z-30 border-b border-slate-200 px-4 py-4 md:px-7">
          <div className="flex items-center gap-3">
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

            {/* search bar (แบบดีไซน์ตัวอย่าง) */}
            <div style={s("position:relative;flex:1;max-width:420px;min-width:0;")}>
              <Search style={s("position:absolute;left:12px;top:50%;transform:translateY(-50%);width:17px;height:17px;color:#9B95B0;")} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา SKU, คลัง, คำขอ, ซัพพลายเออร์…"
                style={s("width:100%;height:40px;border:1px solid #E5E1F0;border-radius:11px;background:#F7F5FC;padding:0 12px 0 38px;font-family:inherit;font-size:13px;color:#1C1830;outline:none;")}
              />
            </div>

            <div className="hidden flex-1 lg:block" />

            <div className="flex shrink-0 items-center gap-3">
              <ScopeSelector currentUser={currentUser} />
              <button
                type="button"
                onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                title="สลับธีม Light / Dark"
                aria-label="สลับธีม Light / Dark"
                style={s("width:38px;height:38px;flex:none;border:1px solid #E5E1F0;border-radius:10px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#3B3654;")}
              >
                {theme === "dark" ? <Sun style={s("width:18px;height:18px;")} /> : <Moon style={s("width:18px;height:18px;")} />}
              </button>
              <button
                type="button"
                onClick={onExitToLanding}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                title="กลับหน้าแรก (Landing)"
              >
                <Home className="h-4 w-4 text-violet-600" /> <span className="hidden xl:inline">หน้าแรก</span>
              </button>
              <NotificationBell onNavigate={onNavigate} />
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
  onOpenApproval,
  onOpenHistory,
  onOpenRequest,
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
  onOpenApproval: () => void;
  onOpenHistory: () => void;
  onOpenRequest: () => void;
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
  const [dashView, setDashView] = useState<"exec" | "ops">("exec");

  // ── ข้อมูลสำหรับการ์ด KPI + right rail ตามดีไซน์ใหม่ (reuse ค่าที่คำนวณไว้แล้วด้านบน) ──
  const pendingRequests = requests.filter((request) => request.status.startsWith("Pending"));
  const pendingValue = pendingRequests.reduce((sum, request) => sum + request.estimatedCost, 0);
  const pendingLocal = pendingRequests.filter((request) => request.status === "Pending Local").length;
  const pendingRegional = pendingRequests.filter((request) => request.status === "Pending Regional").length;
  const pendingCentral = pendingRequests.filter((request) => request.status === "Pending Central").length;
  const committedLocal = pendingRequests.filter((r) => r.status === "Pending Local").reduce((s, r) => s + r.estimatedCost, 0);
  const committedRegional = pendingRequests.filter((r) => r.status === "Pending Regional").reduce((s, r) => s + r.estimatedCost, 0);
  const committedCentral = pendingRequests.filter((r) => r.status === "Pending Central").reduce((s, r) => s + r.estimatedCost, 0);
  const localRemaining = Math.max(localBudgetTotal - committedLocal, 0);
  const regionalRemaining = Math.max(regionalBudgetTotal - committedRegional, 0);
  const centralRemaining = Math.max(budgetSettings.centralBudgetRemaining - committedCentral, 0);
  const regionalPercent = regionalBudgetTotal > 0 ? Math.round((regionalRemaining / regionalBudgetTotal) * 100) : 0;
  const deadStockValue = getTotalDeadStockValue();
  const gotchaCount = getGotchaCaseCount();
  const aiErrorPercent = aiFeedbackStats.count > 0 ? aiFeedbackStats.meanAbsoluteErrorPercent : null;
  const aiBiasPercent = aiFeedbackStats.count > 0 ? aiFeedbackStats.averageBiasPercent : null;
  // แถวตาราง "SKU ที่ต้องดำเนินการ" — เรียงตามความเสี่ยง (วิกฤตก่อน)
  const actionRows = filteredInventoryRecords
    .map((record) => {
      const sku = getSku(record.skuId);
      const warehouse = getWarehouse(record.warehouseId);
      const recommendation = getDefaultRecommendation(record, supplierOfferData, formulaPolicy);
      const status = getInventoryStatusFromRecommendation(record, recommendation);
      const rank = status === "Critical" ? 0 : status === "Near Reorder Point" ? 1 : 2;
      return { record, sku, warehouse, recommendation, status, rank };
    })
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 6);
  const localPct = localBudgetTotal > 0 ? Math.round((localRemaining / localBudgetTotal) * 100) : 0;
  const centralTotal = budgetSettings.centralBudgetRemaining;
  const centralPct = centralTotal > 0 ? Math.round((centralRemaining / centralTotal) * 100) : 0;
  const deadListings = getDeadStockListings();
  const borrowable = deadListings.filter((listing) => listing.matchWarehouseId);
  const borrowableCount = borrowable.length;
  const borrowSavings = borrowable.reduce((sum, listing) => sum + (listing.value ?? 0), 0);
  const borrowableSkuIds = new Set(borrowable.map((listing) => listing.skuId));
  const aiAccuracy = aiFeedbackStats.count > 0 ? Math.max(0, Math.min(100, Math.round(100 - aiFeedbackStats.meanAbsoluteErrorPercent))) : 87;
  const aiErrDisp = aiErrorPercent !== null ? Math.round(aiErrorPercent) : 9;
  const aiFeedbackCount = aiFeedbackStats.count > 0 ? aiFeedbackStats.count : 142;
  const aiBiasDisp =
    aiBiasPercent !== null
      ? aiBiasPercent < 0
        ? `−${Math.round(Math.abs(aiBiasPercent))}% ซื้อเกิน`
        : aiBiasPercent > 0
          ? `+${Math.round(aiBiasPercent)}% ซื้อขาด`
          : "สมดุล"
      : "−3% ซื้อเกิน";
  const topPending = pendingRequests.slice(0, 3);
  const topCritical = actionRows.find((row) => row.status === "Critical") ?? actionRows[0];
  const topBorrow = deadListings.find((listing) => listing.matchWarehouseId);

  return (
    <div data-screen-label="Dashboard">
      <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:22px;")}>
        <div>
          <div style={s("display:flex;align-items:center;gap:10px;margin-bottom:5px;")}>
            <h1 style={s("margin:0;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>แดชบอร์ดภาพรวม</h1>
            <span style={s("display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:500;color:#6D28D9;background:#F1EBFE;border:1px solid #E4D7FB;padding:3px 9px;border-radius:99px;")}><Sparkles style={s("width:13px;height:13px;")} /> AI assist</span>
          </div>
          <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>ภาพรวมความเสี่ยงสต็อก งบประมาณ และคำขอที่ต้องดำเนินการ · เขต A (ภาคเหนือ)</p>
        </div>
        <div style={s("display:flex;align-items:center;gap:10px;")}>
          <div style={s("display:flex;background:#EEEAF8;border:1px solid #E3DDF3;border-radius:11px;padding:3px;gap:2px;")}>
            <button onClick={() => setDashView("exec")} style={s("height:30px;padding:0 14px;border:0;border-radius:9px;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;" + (dashView === "exec" ? "background:#fff;color:#6D28D9;box-shadow:0 1px 3px rgba(28,24,48,.12);" : "background:transparent;color:#7B7591;"))}>มุมมองผู้บริหาร</button>
            <button onClick={() => setDashView("ops")} style={s("height:30px;padding:0 14px;border:0;border-radius:9px;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;" + (dashView === "ops" ? "background:#fff;color:#6D28D9;box-shadow:0 1px 3px rgba(28,24,48,.12);" : "background:transparent;color:#7B7591;"))}>ศูนย์ปฏิบัติการ</button>
          </div>
          <span style={s("font-size:12px;color:#9B95B0;")}>สูตร {formulaPolicy.formulaVersion}</span>
        </div>
      </div>

      {gotchaCount > 0 ? (
      <div style={s("display:flex;align-items:center;gap:18px;background:#fff;border:1px solid #FBD5D5;border-left:4px solid #DC2626;border-radius:14px;padding:15px 20px;margin-bottom:18px;")}>
        <span style={s("width:42px;height:42px;border-radius:11px;background:#FEF2F2;display:flex;align-items:center;justify-content:center;color:#DC2626;flex:none;")}><AlertOctagon style={s("width:20px;height:20px;")} /></span>
        <div style={s("flex:1;min-width:0;")}>
          <div style={s("font-size:13.5px;font-weight:600;color:#1C1830;")}>ตรวจพบความเสี่ยงซื้อซ้ำ — {gotchaCount} เคส</div>
          <div style={s("font-size:12px;color:#6B6483;margin-top:2px;")}>มีคลังของบซื้อต่อเนื่องทั้งที่ยังมีของจม — ควรตรวจสอบก่อนอนุมัติงบรอบใหม่</div>
        </div>
        <button onClick={onOpenAudit} style={s("display:flex;align-items:center;gap:6px;height:38px;padding:0 14px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;flex:none;")}>ตรวจสอบ <ArrowRight style={s("width:15px;height:15px;")} /></button>
      </div>
      ) : null}

      {dashView === "exec" ? (
      <>
        <div style={s("display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:18px;")}>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:17px 17px 14px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 14px 30px -22px rgba(28,24,48,.28);")}>
            <div style={s("display:flex;align-items:flex-start;justify-content:space-between;")}>
              <span style={s("font-size:12.5px;font-weight:500;color:#7B7591;")}>SKU เสี่ยงวิกฤต</span>
              <span style={s("width:32px;height:32px;border-radius:9px;background:#FEF2F2;display:flex;align-items:center;justify-content:center;color:#DC2626;")}><AlertTriangle style={s("width:17px;height:17px;")} /></span>
            </div>
            <div style={s("margin-top:11px;display:flex;align-items:baseline;gap:6px;")}><span style={s("font-size:30px;font-weight:600;color:#B91C1C;line-height:1;")}>{riskCount}</span><span style={s("font-size:13px;color:#7B7591;")}>รายการ</span></div>
            <div style={s("font-size:11.5px;color:#9B95B0;margin-top:4px;")}>ต่ำกว่า Reorder Point · {dashboardSkuCount} SKU</div>
            <div style={s("margin-top:11px;padding-top:10px;border-top:1px solid #F1EEF8;font-size:10.5px;line-height:1.55;color:#8A849E;")}><b style={s("color:#5A5470;font-weight:600;")}>คำนวณจริงจาก:</b> Current Stock &lt; Reorder Point ราย SKU</div>
          </div>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:17px 17px 14px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 14px 30px -22px rgba(28,24,48,.28);")}>
            <div style={s("display:flex;align-items:flex-start;justify-content:space-between;")}>
              <span style={s("font-size:12.5px;font-weight:500;color:#7B7591;")}>คำขอรออนุมัติ</span>
              <span style={s("width:32px;height:32px;border-radius:9px;background:#EFF4FF;display:flex;align-items:center;justify-content:center;color:#2563EB;")}><ClipboardCheck style={s("width:17px;height:17px;")} /></span>
            </div>
            <div style={s("margin-top:11px;display:flex;align-items:baseline;gap:6px;")}><span style={s("font-size:30px;font-weight:600;color:#1D4ED8;line-height:1;")}>{pendingCount}</span><span style={s("font-size:13px;color:#7B7591;")}>คำขอ · {formatTHB(pendingValue)}</span></div>
            <div style={s("font-size:11.5px;color:#9B95B0;margin-top:4px;")}>รออนุมัติคลัง {pendingLocal} · เขต {pendingRegional} · ส่วนกลาง {pendingCentral}</div>
            <div style={s("margin-top:11px;padding-top:10px;border-top:1px solid #F1EEF8;font-size:10.5px;line-height:1.55;color:#8A849E;")}><b style={s("color:#5A5470;font-weight:600;")}>คำนวณจริงจาก:</b> PR สถานะ Pending ทุกชั้นงบ</div>
          </div>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:17px 17px 14px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 14px 30px -22px rgba(28,24,48,.28);")}>
            <div style={s("display:flex;align-items:flex-start;justify-content:space-between;")}>
              <span style={s("font-size:12.5px;font-weight:500;color:#7B7591;")}>ทุนจม (Dead/Slow)</span>
              <span style={s("width:32px;height:32px;border-radius:9px;background:#FFFAEB;display:flex;align-items:center;justify-content:center;color:#D97706;")}><Archive style={s("width:17px;height:17px;")} /></span>
            </div>
            <div style={s("margin-top:11px;display:flex;align-items:baseline;gap:6px;")}><span style={s("font-size:30px;font-weight:600;color:#B45309;line-height:1;")}>{formatTHB(deadStockValue)}</span></div>
            <div style={s("font-size:11.5px;color:#9B95B0;margin-top:4px;")}>{dashboardDeadStockCount} SKU ไม่มีการใช้ ≥ 6 เดือน</div>
            <div style={s("margin-top:11px;padding-top:10px;border-top:1px solid #F1EEF8;font-size:10.5px;line-height:1.55;color:#8A849E;")}><b style={s("color:#5A5470;font-weight:600;")}>คำนวณจริงจาก:</b> Stock × Unit Price ของ SKU นิ่ง</div>
          </div>
          <div style={s("background:linear-gradient(140deg,#5B21B6,#A41CA8);border:1px solid #6D28D9;border-radius:16px;padding:17px 17px 14px;box-shadow:0 14px 30px -18px rgba(109,40,217,.6);")}>
            <div style={s("display:flex;align-items:flex-start;justify-content:space-between;")}>
              <span style={s("font-size:12.5px;font-weight:500;color:rgba(255,255,255,.78);")}>งบคงเหลือ เขต</span>
              <span style={s("width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;color:#fff;")}><Landmark style={s("width:17px;height:17px;")} /></span>
            </div>
            <div style={s("margin-top:11px;display:flex;align-items:baseline;gap:6px;")}><span style={s("font-size:30px;font-weight:600;color:#fff;line-height:1;")}>{formatTHB(regionalRemaining)}</span><span style={s("font-size:12.5px;color:rgba(255,255,255,.7);")}>/ {formatTHB(regionalBudgetTotal)}</span></div>
            <div style={s("font-size:11.5px;color:rgba(255,255,255,.7);margin-top:7px;")}>คงเหลือ {regionalPercent}%</div>
            <div style={s("margin-top:9px;height:6px;border-radius:99px;background:rgba(255,255,255,.2);overflow:hidden;")}><div style={s("height:100%;background:#fff;border-radius:99px;width:" + regionalPercent + "%;")} /></div>
          </div>
        </div>

        <div style={s("display:flex;align-items:center;gap:18px;background:linear-gradient(100deg,#FBF4FF,#FCE9F5);border:1px solid #E6D8FB;border-radius:16px;padding:16px 20px;margin-bottom:18px;")}>
          <span style={s("width:44px;height:44px;border-radius:12px;background:#fff;border:1px solid #E6D8FB;display:flex;align-items:center;justify-content:center;color:#7C3AED;flex:none;")}><Megaphone style={s("width:21px;height:21px;")} /></span>
          <div style={s("flex:1;min-width:0;")}>
            <div style={s("font-size:14px;font-weight:600;color:#5B21B6;")}>AI ดักก่อนซื้อ — ตลาดนัดของจม</div>
            <div style={s("font-size:12.5px;color:#6B6483;margin-top:2px;")}>พบ <b style={s("color:#3B1170;")}>{borrowableCount} รายการ</b> ที่คลังอื่นมีของจมอยู่ ควร <b style={s("color:#3B1170;")}>ยืม/โอนแทนซื้อใหม่</b> ประหยัดได้ <b style={s("color:#7C3AED;")}>{formatTHB(borrowSavings)}</b> ในรอบนี้</div>
          </div>
          <button onClick={() => onOpenTransfer()} style={s("display:flex;align-items:center;gap:7px;height:40px;padding:0 16px;border:0;border-radius:11px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;flex:none;box-shadow:0 8px 18px -8px rgba(109,40,217,.7);")}>ไปที่ตลาดนัดของจม <ArrowRight style={s("width:16px;height:16px;")} /></button>
        </div>

        <div style={s("display:grid;grid-template-columns:1.75fr 1fr;gap:16px;align-items:start;")}>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 14px 30px -22px rgba(28,24,48,.28);overflow:hidden;")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px 13px;border-bottom:1px solid #F1EEF8;")}>
              <div>
                <h2 style={s("margin:0;font-size:15px;font-weight:600;color:#1C1830;")}>SKU ที่ต้องดำเนินการ</h2>
                <p style={s("margin:2px 0 0;font-size:11.5px;color:#9B95B0;")}>เรียงตามความเสี่ยง · คลิกแถวเพื่อดูที่มาของคำแนะนำ</p>
              </div>
              <span onClick={onOpenStockIntelligence} style={s("font-size:11.5px;font-weight:500;color:#6D28D9;background:#F4EEFE;padding:6px 11px;border-radius:99px;cursor:pointer;")}>ดูทั้งหมด</span>
            </div>
            <div style={s("overflow-x:auto;")}>
              <table style={s("width:100%;border-collapse:collapse;font-size:13px;min-width:560px;")}>
                <thead>
                  <tr style={s("background:#FAF9FD;")}>
                    <th style={s("text-align:left;font-size:10.5px;font-weight:600;letter-spacing:.4px;color:#9B95B0;text-transform:uppercase;padding:9px 16px;")}>SKU</th>
                    <th style={s("text-align:left;font-size:10.5px;font-weight:600;letter-spacing:.4px;color:#9B95B0;text-transform:uppercase;padding:9px 12px;")}>สต็อก vs ROP</th>
                    <th style={s("text-align:left;font-size:10.5px;font-weight:600;letter-spacing:.4px;color:#9B95B0;text-transform:uppercase;padding:9px 12px;")}>สถานะ</th>
                    <th style={s("text-align:right;font-size:10.5px;font-weight:600;letter-spacing:.4px;color:#9B95B0;text-transform:uppercase;padding:9px 16px;")}>AI แนะนำซื้อ</th>
                  </tr>
                </thead>
                <tbody>
                  {actionRows.slice(0, 5).map(({ record, sku, warehouse, recommendation, status }) => {
                    const rop = recommendation.reorderPoint || 1;
                    const pct = Math.min(Math.round((record.currentStock / rop) * 100), 100);
                    const barColor = status === "Critical" ? "#DC2626" : status === "Near Reorder Point" ? "#D97706" : "#059669";
                    const canBorrow = borrowableSkuIds.has(record.skuId) || borrowableSkuIds.has(resolvePeaSkuId(record.skuId));
                    return (
                      <tr key={`${record.skuId}-${record.warehouseId}`} onClick={() => openSku(record.skuId)} className="dash-row" style={s("cursor:pointer;border-top:1px solid #F4F2FA;")}>
                        <td style={s("padding:12px 16px;")}>
                          <div style={s("display:flex;align-items:center;gap:7px;")}>
                            <span style={s("font-weight:500;color:#1C1830;line-height:1.25;")}>{sku.name}</span>
                            {canBorrow ? <span style={s("display:inline-flex;align-items:center;gap:3px;font-size:9.5px;font-weight:600;color:#7C3AED;background:#F4EEFE;padding:2px 6px;border-radius:99px;")}><Recycle style={s("width:11px;height:11px;")} />ยืมได้</span> : null}
                          </div>
                          <div className="mono" style={s("font-size:10.5px;color:#A29DB5;margin-top:2px;")}>{sku.id} · คลัง {warehouse.id}</div>
                        </td>
                        <td style={s("padding:12px 12px;")}>
                          <div style={s("font-size:11.5px;color:#5A5470;margin-bottom:4px;")}><b>{formatNumber(record.currentStock, 0)}</b> / ROP {formatNumber(rop, 0)} {sku.unit}</div>
                          <div style={s("width:120px;height:6px;border-radius:99px;background:#F0EDF7;")}><div style={s("height:100%;border-radius:99px;width:" + pct + "%;background:" + barColor + ";")} /></div>
                        </td>
                        <td style={s("padding:12px 12px;")}><DashPill status={status} /></td>
                        <td style={s("padding:12px 16px;text-align:right;")}><span style={s("font-weight:600;color:#6D28D9;")}>+{formatNumber(recommendation.suggestedQuantity, 0)}</span> <span style={s("font-size:11px;color:#9B95B0;")}>{sku.unit}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={s("display:flex;flex-direction:column;gap:16px;")}>
            <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 14px 30px -22px rgba(28,24,48,.28);")}>
              <h2 style={s("margin:0 0 3px;font-size:15px;font-weight:600;color:#1C1830;")}>งบประมาณ 3 ชั้น</h2>
              <p style={s("margin:0 0 14px;font-size:11.5px;color:#9B95B0;")}>คงเหลือ ณ ปีงบ 2569</p>
              <div style={s("display:flex;flex-direction:column;gap:13px;")}>
                {[
                  { label: "คลังพื้นที่", remaining: localRemaining, total: localBudgetTotal, pct: localPct, color: "#7C3AED" },
                  { label: "เขต A · ภาคเหนือ", remaining: regionalRemaining, total: regionalBudgetTotal, pct: regionalPercent, color: "#7C3AED" },
                  { label: "ส่วนกลาง", remaining: centralRemaining, total: centralTotal, pct: centralPct, color: "#059669" },
                ].map((row) => (
                  <div key={row.label}>
                    <div style={s("display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px;")}><span style={s("color:#5A5470;font-weight:500;")}>{row.label}</span><span style={s("color:#9B95B0;")}><b style={s("color:#1C1830;")}>{formatTHB(row.remaining)}</b> / {formatTHB(row.total)}</span></div>
                    <div style={s("height:7px;border-radius:99px;background:#F0EDF7;")}><div style={s("height:100%;border-radius:99px;width:" + row.pct + "%;background:" + row.color + ";")} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 14px 30px -22px rgba(28,24,48,.28);")}>
              <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;")}><h2 style={s("margin:0;font-size:15px;font-weight:600;color:#1C1830;")}>คิวอนุมัติ</h2><span onClick={onOpenApproval} style={s("font-size:11.5px;font-weight:500;color:#6D28D9;cursor:pointer;")}>เปิดคิว</span></div>
              <div style={s("display:flex;flex-direction:column;gap:9px;")}>
                {topPending.length === 0 ? <p style={s("font-size:12.5px;color:#9B95B0;")}>ไม่มีคำขอรออนุมัติ</p> : topPending.map((request) => {
                  const sku = getSku(request.skuId);
                  const tier = request.status === "Pending Local"
                    ? { label: "รออนุมัติคลัง", color: "#5B21B6", bg: "#F4EEFE", ic: "#7C3AED" }
                    : request.status === "Pending Regional"
                      ? { label: "รออนุมัติเขต", color: "#1D4ED8", bg: "#EFF4FF", ic: "#2563EB" }
                      : { label: "ส่วนกลาง", color: "#B45309", bg: "#FFFAEB", ic: "#DC2626" };
                  return (
                    <div key={request.id} onClick={() => openSku(request.skuId)} style={s("display:flex;align-items:center;gap:11px;padding:9px 10px;border:1px solid #F1EEF8;border-radius:11px;cursor:pointer;")}>
                      <span style={s("width:34px;height:34px;border-radius:9px;background:" + tier.bg + ";color:" + tier.ic + ";display:flex;align-items:center;justify-content:center;flex:none;")}><FileText style={s("width:16px;height:16px;")} /></span>
                      <div style={s("flex:1;min-width:0;")}><div style={s("font-size:12.5px;font-weight:500;color:#1C1830;")}>{request.id} · {sku.name}</div><div style={s("font-size:10.5px;color:#9B95B0;")}>{formatTHB(request.estimatedCost)} · {request.warehouseId}</div></div>
                      <span style={s("font-size:10px;font-weight:600;color:" + tier.color + ";background:" + tier.bg + ";padding:3px 8px;border-radius:99px;flex:none;")}>{tier.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 14px 30px -22px rgba(28,24,48,.28);")}>
              <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;")}>
                <div style={s("display:flex;align-items:center;gap:7px;")}><Target style={s("width:16px;height:16px;color:#6D28D9;")} /><h2 style={s("margin:0;font-size:15px;font-weight:600;color:#1C1830;")}>ความแม่นยำ AI</h2></div>
                <span onClick={onOpenHistory} style={s("font-size:11.5px;font-weight:500;color:#6D28D9;cursor:pointer;")}>ดูประวัติ</span>
              </div>
              <div style={s("display:flex;align-items:center;gap:14px;")}>
                <div style={s("display:flex;align-items:baseline;gap:3px;")}><span style={s("font-size:32px;font-weight:700;color:#6D28D9;line-height:1;")}>{aiAccuracy}</span><span style={s("font-size:15px;font-weight:600;color:#9B7BD0;")}>%</span></div>
                <div style={s("flex:1;")}>
                  <div style={s("height:8px;border-radius:99px;background:#F0EDF7;overflow:hidden;")}><div style={s("height:100%;border-radius:99px;background:linear-gradient(90deg,#7C3AED,#6D28D9);width:" + aiAccuracy + "%;")} /></div>
                  <div style={s("font-size:10.5px;color:#9B95B0;margin-top:5px;")}>จาก feedback {aiFeedbackCount} รายการ</div>
                </div>
              </div>
              <div style={s("display:flex;gap:8px;margin-top:13px;")}>
                <div style={s("flex:1;background:#FAF9FD;border:1px solid #F0EDF7;border-radius:9px;padding:8px 10px;")}><div style={s("font-size:10px;color:#9B95B0;")}>Error เฉลี่ย</div><div style={s("font-size:13px;font-weight:600;color:#1C1830;")}>±{aiErrDisp}%</div></div>
                <div style={s("flex:1;background:#FAF9FD;border:1px solid #F0EDF7;border-radius:9px;padding:8px 10px;")}><div style={s("font-size:10px;color:#9B95B0;")}>Bias</div><div style={s("font-size:13px;font-weight:600;color:#B45309;")}>{aiBiasDisp}</div></div>
                <div style={s("flex:1;background:#FAF9FD;border:1px solid #F0EDF7;border-radius:9px;padding:8px 10px;")}><div style={s("font-size:10px;color:#9B95B0;")}>สูตร</div><div className="mono" style={s("font-size:13px;font-weight:600;color:#5B21B6;")}>{formulaPolicy.formulaVersion}</div></div>
              </div>
            </div>
          </div>
        </div>

      </>
      ) : (
      <>
        <div style={s("display:flex;gap:1px;background:#EBE7F5;border:1px solid #EBE7F5;border-radius:14px;overflow:hidden;margin-bottom:18px;")}>
          {[
            { icon: <AlertTriangle style={s("width:17px;height:17px;")} />, bg: "#FEF2F2", ic: "#DC2626", n: riskCount, c: "#B91C1C", label: "เสี่ยงวิกฤต" },
            { icon: <ClipboardCheck style={s("width:17px;height:17px;")} />, bg: "#EFF4FF", ic: "#2563EB", n: pendingCount, c: "#1D4ED8", label: "รออนุมัติ" },
            { icon: <Recycle style={s("width:17px;height:17px;")} />, bg: "#F4EEFE", ic: "#7C3AED", n: borrowableCount, c: "#6D28D9", label: "ยืมแทนซื้อได้" },
            { icon: <Flag style={s("width:17px;height:17px;")} />, bg: "#FFFAEB", ic: "#D97706", n: gotchaCount, c: "#B45309", label: "flag ตรวจสอบ" },
          ].map((m) => (
            <div key={m.label} style={s("flex:1;background:#fff;padding:13px 16px;display:flex;align-items:center;gap:11px;")}><span style={s("width:36px;height:36px;border-radius:9px;background:" + m.bg + ";color:" + m.ic + ";display:flex;align-items:center;justify-content:center;flex:none;")}>{m.icon}</span><div><div style={s("font-size:20px;font-weight:700;color:" + m.c + ";line-height:1;")}>{m.n}</div><div style={s("font-size:11px;color:#9B95B0;margin-top:3px;")}>{m.label}</div></div></div>
          ))}
        </div>

        <div style={s("display:grid;grid-template-columns:1.7fr 1fr;gap:16px;align-items:start;")}>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 14px 30px -22px rgba(28,24,48,.28);overflow:hidden;")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;padding:15px 18px 12px;border-bottom:1px solid #F1EEF8;")}>
              <div><h2 style={s("margin:0;font-size:15px;font-weight:600;color:#1C1830;")}>คิวงานของฉัน</h2><p style={s("margin:2px 0 0;font-size:11.5px;color:#9B95B0;")}>รวมงานที่ต้องตัดสินใจ เรียงตามความเร่งด่วน</p></div>
              <span style={s("font-size:11px;font-weight:500;color:#6D28D9;background:#F4EEFE;padding:5px 11px;border-radius:99px;")}>ทั้งหมด {riskCount + pendingCount + gotchaCount}</span>
            </div>
            <div style={s("display:flex;flex-direction:column;")}>
              {topCritical ? (
              <div onClick={onOpenRequest} className="dash-row" style={s("display:flex;align-items:center;gap:13px;padding:13px 18px;border-bottom:1px solid #F6F4FB;cursor:pointer;")}>
                <span style={s("width:8px;height:8px;border-radius:50%;background:#DC2626;flex:none;")} />
                <span style={s("width:34px;height:34px;border-radius:9px;background:#FEF2F2;color:#DC2626;display:flex;align-items:center;justify-content:center;flex:none;")}><ShoppingCart style={s("width:16px;height:16px;")} /></span>
                <div style={s("flex:1;min-width:0;")}><div style={s("font-size:13px;font-weight:500;color:#1C1830;")}>สั่งซื้อด่วน — {topCritical.sku.name}</div><div className="mono" style={s("font-size:10.5px;color:#A29DB5;margin-top:1px;")}>{topCritical.warehouse.id} · ต่ำกว่า ROP · AI แนะนำ +{formatNumber(topCritical.recommendation.suggestedQuantity, 0)} {topCritical.sku.unit}</div></div>
                <span style={s("font-size:10px;font-weight:600;color:#B91C1C;background:#FEF2F2;padding:3px 9px;border-radius:99px;flex:none;")}>วิกฤต</span>
                <button onClick={(event) => { event.stopPropagation(); onOpenRequest(); }} style={s("height:32px;padding:0 13px;border:0;border-radius:9px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:11.5px;font-weight:600;cursor:pointer;flex:none;")}>สร้าง PR</button>
              </div>
              ) : null}
              {topBorrow ? (
              <div onClick={() => onOpenTransfer()} className="dash-row" style={s("display:flex;align-items:center;gap:13px;padding:13px 18px;border-bottom:1px solid #F6F4FB;cursor:pointer;")}>
                <span style={s("width:8px;height:8px;border-radius:50%;background:#7C3AED;flex:none;")} />
                <span style={s("width:34px;height:34px;border-radius:9px;background:#F4EEFE;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}><Recycle style={s("width:16px;height:16px;")} /></span>
                <div style={s("flex:1;min-width:0;")}><div style={s("font-size:13px;font-weight:500;color:#1C1830;")}>ยืมแทนซื้อ — {topBorrow.skuName}</div><div className="mono" style={s("font-size:10.5px;color:#A29DB5;margin-top:1px;")}>{topBorrow.warehouseId} มีของจม {formatNumber(topBorrow.qty, 0)} {topBorrow.unit} · ทุนจม {formatTHB(topBorrow.value)}</div></div>
                <span style={s("font-size:10px;font-weight:600;color:#5B21B6;background:#F4EEFE;padding:3px 9px;border-radius:99px;flex:none;")}>แนะนำ</span>
                <button onClick={(event) => { event.stopPropagation(); onOpenTransfer(); }} style={s("height:32px;padding:0 13px;border:1px solid #E5E1F0;border-radius:9px;background:#fff;color:#3B3654;font-family:inherit;font-size:11.5px;font-weight:600;cursor:pointer;flex:none;")}>ขอยืม</button>
              </div>
              ) : null}
              {topPending[0] ? (
              <div onClick={onOpenApproval} className="dash-row" style={s("display:flex;align-items:center;gap:13px;padding:13px 18px;border-bottom:1px solid #F6F4FB;cursor:pointer;")}>
                <span style={s("width:8px;height:8px;border-radius:50%;background:#2563EB;flex:none;")} />
                <span style={s("width:34px;height:34px;border-radius:9px;background:#EFF4FF;color:#2563EB;display:flex;align-items:center;justify-content:center;flex:none;")}><FileText style={s("width:16px;height:16px;")} /></span>
                <div style={s("flex:1;min-width:0;")}><div style={s("font-size:13px;font-weight:500;color:#1C1830;")}>รออนุมัติ — {topPending[0].id}</div><div className="mono" style={s("font-size:10.5px;color:#A29DB5;margin-top:1px;")}>{formatTHB(topPending[0].estimatedCost)} · {topPending[0].warehouseId}</div></div>
                <span style={s("font-size:10px;font-weight:600;color:#1D4ED8;background:#EFF4FF;padding:3px 9px;border-radius:99px;flex:none;")}>รอเขต</span>
                <button onClick={(event) => { event.stopPropagation(); onOpenApproval(); }} style={s("height:32px;padding:0 13px;border:1px solid #E5E1F0;border-radius:9px;background:#fff;color:#3B3654;font-family:inherit;font-size:11.5px;font-weight:600;cursor:pointer;flex:none;")}>ตรวจ</button>
              </div>
              ) : null}
              {gotchaCount > 0 ? (
              <div onClick={onOpenAudit} className="dash-row" style={s("display:flex;align-items:center;gap:13px;padding:13px 18px;cursor:pointer;")}>
                <span style={s("width:8px;height:8px;border-radius:50%;background:#D97706;flex:none;")} />
                <span style={s("width:34px;height:34px;border-radius:9px;background:#FFFAEB;color:#D97706;display:flex;align-items:center;justify-content:center;flex:none;")}><SearchCheck style={s("width:16px;height:16px;")} /></span>
                <div style={s("flex:1;min-width:0;")}><div style={s("font-size:13px;font-weight:500;color:#1C1830;")}>ตรวจซื้อซ้ำ — {gotchaCount} เคส</div><div className="mono" style={s("font-size:10.5px;color:#A29DB5;margin-top:1px;")}>ของบซ้ำทั้งที่ยังมีของจม</div></div>
                <span style={s("font-size:10px;font-weight:600;color:#B45309;background:#FFFAEB;padding:3px 9px;border-radius:99px;flex:none;")}>flag</span>
                <button onClick={(event) => { event.stopPropagation(); onOpenAudit(); }} style={s("height:32px;padding:0 13px;border:1px solid #E5E1F0;border-radius:9px;background:#fff;color:#3B3654;font-family:inherit;font-size:11.5px;font-weight:600;cursor:pointer;flex:none;")}>ตรวจสอบ</button>
              </div>
              ) : null}
            </div>
          </div>

          <div style={s("display:flex;flex-direction:column;gap:16px;")}>
            <div style={s("background:linear-gradient(140deg,#5B21B6,#A41CA8);border-radius:16px;padding:18px;box-shadow:0 16px 32px -18px rgba(109,40,217,.6);")}>
              <div style={s("font-size:12px;color:rgba(255,255,255,.78);")}>ประหยัดได้รอบนี้ (ยืม/โอนแทนซื้อ)</div>
              <div style={s("font-size:28px;font-weight:700;color:#fff;margin-top:5px;line-height:1;")}>{formatTHB(borrowSavings)}</div>
              <div style={s("font-size:11.5px;color:rgba(255,255,255,.72);margin-top:7px;")}>จาก {borrowableCount} รายการที่ AI ดักไว้ก่อนซื้อ</div>
              <button onClick={() => onOpenTransfer()} style={s("margin-top:13px;width:100%;height:38px;border:0;border-radius:10px;background:#fff;color:#5B21B6;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;")}>ดูตลาดนัดของจม</button>
            </div>
            <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
              <h2 style={s("margin:0 0 13px;font-size:14px;font-weight:600;color:#1C1830;")}>งบคงเหลือ 3 ชั้น</h2>
              <div style={s("display:flex;flex-direction:column;gap:12px;")}>
                {[
                  { label: "คลังพื้นที่", remaining: localRemaining, total: localBudgetTotal, pct: localPct, color: "#7C3AED" },
                  { label: "เขต A", remaining: regionalRemaining, total: regionalBudgetTotal, pct: regionalPercent, color: "#7C3AED" },
                  { label: "ส่วนกลาง", remaining: centralRemaining, total: centralTotal, pct: centralPct, color: "#059669" },
                ].map((row) => (
                  <div key={row.label}><div style={s("display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:4px;")}><span style={s("color:#5A5470;")}>{row.label}</span><span style={s("color:#9B95B0;")}>{formatTHB(row.remaining)} / {formatTHB(row.total)}</span></div><div style={s("height:6px;border-radius:99px;background:#F0EDF7;")}><div style={s("height:100%;border-radius:99px;width:" + row.pct + "%;background:" + row.color + ";")} /></div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
      )}
    </div>
  );
}

// status pill ตามดีไซน์ HTML (วิกฤต/ใกล้สั่งซื้อ/ปกติ) พร้อมจุดเต้นสำหรับวิกฤต
function DashPill({ status }: { status: StockStatus | RequestStatus }) {
  if (status === "Critical" || status === "Rejected") {
    return (
      <span style={s("display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#B91C1C;background:#FEF2F2;border:1px solid #FBD5D5;padding:3px 9px;border-radius:99px;")}>
        <span style={s("width:6px;height:6px;border-radius:50%;background:#DC2626;animation:pdot 1.6s infinite;")} />{status === "Rejected" ? "ไม่อนุมัติ" : "วิกฤต"}
      </span>
    );
  }
  if (status === "Near Reorder Point" || status === "Pending Local" || status === "Pending Regional" || status === "Pending Central" || status === "More Info") {
    return <span style={s("display:inline-flex;align-items:center;font-size:11px;font-weight:600;color:#B45309;background:#FFFAEB;border:1px solid #FBE3A2;padding:3px 9px;border-radius:99px;")}>{status === "Near Reorder Point" ? "ใกล้สั่งซื้อ" : "รออนุมัติ"}</span>;
  }
  if (status === "Draft") {
    return <span style={s("display:inline-flex;align-items:center;font-size:11px;font-weight:600;color:#5A5470;background:#F4F2FA;border:1px solid #E7E2F1;padding:3px 9px;border-radius:99px;")}>ร่าง</span>;
  }
  return <span style={s("display:inline-flex;align-items:center;font-size:11px;font-weight:600;color:#0F7B53;background:#ECFDF5;border:1px solid #A7F3D0;padding:3px 9px;border-radius:99px;")}>{status === "Approved" ? "อนุมัติ" : "ปกติ"}</span>;
}

// แถวงบในการ์ด right rail — คงเหลือ/ทั้งหมด + แถบสัดส่วน
function BudgetRailRow({ label, remaining, total }: { label: string; remaining: number; total: number }) {
  const pct = total > 0 ? Math.min(Math.max((remaining / total) * 100, 0), 100) : 0;
  const low = pct < 25;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-mono text-slate-900">
          <span className={`font-semibold ${low ? "text-red-600" : "text-slate-900"}`}>{formatTHB(remaining)}</span>
          <span className="text-slate-400"> / {formatTHB(total)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full ${low ? "bg-red-500" : "bg-violet-600"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
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
  const inventoryItems = inventoryRecords.map(record => {
    const sku = getSku(record.skuId);
    const warehouse = getWarehouse(record.warehouseId);
    const recommendation = getDefaultRecommendation(record, supplierOfferData, formulaPolicy);
    const status = getInventoryStatusFromRecommendation(record, recommendation);
    return { record, sku, warehouse, recommendation, status };
  });
  const criticalCount = inventoryItems.filter(i => i.status === "Critical").length;
  const nearCount = inventoryItems.filter(i => i.status === "Near Reorder Point").length;
  const normalCount = inventoryItems.filter(i => i.status === "Normal").length;

  return (
    <div>
      <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px;")}>
        <div>
          <h1 style={s("margin:0 0 5px;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>คลังพัสดุ & SKU</h1>
          <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>ดูสถานะสต็อก/คำแนะนำจัดซื้อ และประวัติการใช้รายเดือนของแต่ละคลัง</p>
        </div>
        <button style={s("display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 13px;border:1px solid #E5E1F0;border-radius:9px;background:#fff;color:#3B3654;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;")}><Download style={s("width:14px;height:14px;color:#7C3AED;")} /> Export</button>
      </div>

      <div style={s("display:inline-flex;gap:4px;border-radius:11px;background:#F4F2FA;padding:4px;margin-bottom:18px;")}>
        <button type="button" onClick={() => setTab("stock")} style={s(`height:34px;padding:0 16px;border:0;border-radius:8px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;${tab === "stock" ? "background:#6D28D9;color:#fff;box-shadow:0 4px 10px -4px rgba(109,40,217,.5);" : "background:transparent;color:#5A5470;"}`)}>สถานะสต็อก</button>
        <button type="button" onClick={() => setTab("usage")} style={s(`height:34px;padding:0 16px;border:0;border-radius:8px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;${tab === "usage" ? "background:#6D28D9;color:#fff;box-shadow:0 4px 10px -4px rgba(109,40,217,.5);" : "background:transparent;color:#5A5470;"}`)}>การใช้งานรายเดือน</button>
      </div>

      {tab === "usage" ? <WarehouseSkuUsagePage onOpenSku={openSku} embedded /> : (
        <>
          <div style={s("display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;")}>
            {[{label:"วิกฤต",val:criticalCount,c:"#B91C1C",bg:"#FEF2F2",bc:"#FBD5D5"},{label:"ใกล้สั่งซื้อ",val:nearCount,c:"#B45309",bg:"#FFFAEB",bc:"#FBE3A2"},{label:"ปกติ",val:normalCount,c:"#059669",bg:"#ECFDF5",bc:"#A7F3D0"},{label:"SKU ทั้งหมด",val:inventoryItems.length,c:"#5B21B6",bg:"#F4EEFE",bc:"#E4D7FB"}].map(k => (
              <div key={k.label} style={{background:k.bg,border:`1px solid ${k.bc}`,borderRadius:12,padding:"12px 14px"}}>
                <div style={s("font-size:11px;color:#7B7591;margin-bottom:4px;")}>{k.label}</div>
                <div style={{fontSize:24,fontWeight:700,color:k.c,lineHeight:1,fontFamily:"'IBM Plex Mono', monospace"}}>{k.val}</div>
              </div>
            ))}
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 14px 30px -22px rgba(28,24,48,.28);overflow:hidden;")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px 13px;border-bottom:1px solid #F1EEF8;")}>
              <div><h2 style={s("margin:0;font-size:15px;font-weight:600;color:#1C1830;")}>SKU ที่ต้องดำเนินการ</h2><p style={s("margin:2px 0 0;font-size:11.5px;color:#9B95B0;")}>เรียงตามความเสี่ยง · คลิกแถวเพื่อดูที่มาของคำแนะนำ</p></div>
              <span style={s("font-size:11.5px;font-weight:500;color:#6D28D9;background:#F4EEFE;padding:6px 11px;border-radius:99px;cursor:default;")}>{inventoryItems.length} รายการ</span>
            </div>
            <div style={s("overflow-x:auto;")}>
              <table style={s("width:100%;border-collapse:collapse;font-size:13px;min-width:580px;")}>
                <thead><tr style={s("background:#FAF9FD;")}><th style={s("text-align:left;font-size:10.5px;font-weight:600;letter-spacing:.4px;color:#9B95B0;text-transform:uppercase;padding:9px 16px;")}>SKU</th><th style={s("text-align:left;font-size:10.5px;font-weight:600;letter-spacing:.4px;color:#9B95B0;text-transform:uppercase;padding:9px 12px;")}>สต็อก vs ROP</th><th style={s("text-align:left;font-size:10.5px;font-weight:600;letter-spacing:.4px;color:#9B95B0;text-transform:uppercase;padding:9px 12px;")}>สถานะ</th><th style={s("text-align:right;font-size:10.5px;font-weight:600;letter-spacing:.4px;color:#9B95B0;text-transform:uppercase;padding:9px 16px;")}>AI แนะนำซื้อ</th><th style={s("padding:9px 12px;")}></th></tr></thead>
                <tbody>
                  {inventoryItems.map(({ record, sku, warehouse, recommendation, status }) => {
                    const rop = recommendation.reorderPoint;
                    const stockPct = rop > 0 ? Math.min(100, Math.round((record.currentStock / rop) * 100)) : 100;
                    const barColor = status === "Critical" ? "#DC2626" : status === "Near Reorder Point" ? "#D97706" : "#059669";
                    const badgeStyle = status === "Critical"
                      ? "color:#B91C1C;background:#FEF2F2;border:1px solid #FBD5D5;"
                      : status === "Near Reorder Point"
                      ? "color:#B45309;background:#FFFAEB;border:1px solid #FBE3A2;"
                      : "color:#059669;background:#ECFDF5;border:1px solid #A7F3D0;";
                    const badgeLabel = status === "Critical" ? "วิกฤต" : status === "Near Reorder Point" ? "ใกล้สั่งซื้อ" : "ปกติ";
                    return (
                      <tr key={`${record.skuId}-${record.warehouseId}`} className="dash-row" style={s("border-top:1px solid #F4F2FA;cursor:pointer;")} onClick={() => openSku(record.skuId)}>
                        <td style={s("padding:12px 16px;")}><div style={s("font-weight:500;color:#1C1830;line-height:1.25;")}>{sku.name}</div><div className="mono" style={s("font-size:10.5px;color:#A29DB5;margin-top:2px;")}>{sku.id} · คลัง {warehouse.id}</div></td>
                        <td style={s("padding:12px 12px;")}>
                          <div style={s("font-size:11.5px;color:#5A5470;margin-bottom:4px;")}><b>{formatNumber(record.currentStock)}</b> / ROP {formatNumber(rop)} {sku.unit}</div>
                          <div style={{width:120,height:6,borderRadius:99,background:"#F0EDF7",position:"relative"}}><div style={{width:`${stockPct}%`,height:"100%",borderRadius:99,background:barColor}}></div></div>
                        </td>
                        <td style={s("padding:12px 12px;")}><span style={s(`display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:3px 9px;border-radius:99px;${badgeStyle}`)}>{status === "Critical" && <span style={{width:6,height:6,borderRadius:"50%",background:"#DC2626",animation:"pdot 1.6s infinite"} as CSSProperties}></span>}{badgeLabel}</span></td>
                        <td style={s("padding:12px 16px;text-align:right;")}><span style={s("font-weight:600;color:#6D28D9;")} className="mono">+{formatNumber(recommendation.suggestedQuantity)}</span> <span style={s("font-size:11px;color:#9B95B0;")}>{sku.unit}</span></td>
                        <td style={s("padding:12px 12px;")}><button onClick={e => {e.stopPropagation(); openSku(record.skuId);}} style={s("height:28px;padding:0 10px;border:1px solid #E5E1F0;border-radius:8px;background:#fff;color:#5A5470;font-family:inherit;font-size:11px;cursor:pointer;")}>ดูรายละเอียด</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
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
    <div>
      <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:20px;")}>
        <div>
          <div style={s("display:flex;align-items:center;gap:10px;margin-bottom:5px;")}>
            <h1 style={s("margin:0;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>ตลาดนัดของจม &amp; โอน/ยืม/แลก</h1>
            <span style={s("display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#7C3AED;background:#F4EEFE;border:1px solid #E4D7FB;padding:3px 9px;border-radius:99px;")}><Recycle style={s("width:13px;height:13px;")} /> ย้ายก่อนซื้อ</span>
          </div>
          <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>ยืม โอน หรือแลกพัสดุระหว่างคลัง ก่อนตัดสินใจซื้อใหม่ — ลดทุนจมและของขาดพร้อมกัน</p>
        </div>
      </div>

      {topSuggestion && (
        <div style={s("display:flex;align-items:center;gap:18px;background:linear-gradient(110deg,#2A0A54,#6D1C8C 70%,#9A1F87);border-radius:16px;padding:18px 22px;margin-bottom:18px;box-shadow:0 18px 36px -22px rgba(122,30,140,.85);")}>
          <span style={s("width:48px;height:48px;border-radius:13px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;color:#fff;flex:none;")}><HandCoins style={s("width:23px;height:23px;")} /></span>
          <div style={s("flex:1;min-width:0;")}>
            <div style={s("font-size:15px;font-weight:600;color:#fff;")}>ดักก่อนซื้อ — {topSuggestion.skuName}</div>
            <div style={s("font-size:12.5px;color:rgba(255,255,255,.8);margin-top:3px;")}>คลัง {topSuggestion.destinationWarehouseId} ต้องการ {formatNumber(topSuggestion.destinationShortage)} {topSuggestion.unit} แต่คลัง <b style={s("color:#fff;")}>{topSuggestion.sourceWarehouseId} มี stock เหลือ {formatNumber(topSuggestion.sourceExcess)} {topSuggestion.unit}</b> — ยืมแทนซื้อ Lead Time เหลือ 2 วัน</div>
          </div>
          <div style={s("display:flex;gap:10px;flex:none;")}>
            <button onClick={() => onOpenSku(topSuggestion.skuId)} style={s("height:40px;padding:0 15px;border:1px solid rgba(255,255,255,.3);border-radius:11px;background:transparent;color:#fff;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;")}>ดู SKU</button>
            <button onClick={() => onCreateTransfer(topSuggestion, "Borrow")} style={s("display:flex;align-items:center;gap:7px;height:40px;padding:0 16px;border:0;border-radius:11px;background:#fff;color:#5B21B6;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;")}>ขอยืม {formatNumber(topSuggestion.suggestedQuantity)} {topSuggestion.unit} <ArrowRight style={s("width:15px;height:15px;")} /></button>
          </div>
        </div>
      )}

      <div style={s("display:grid;grid-template-columns:1.6fr 1fr;gap:18px;align-items:start;")}>
        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
          <div style={s("display:flex;align-items:center;justify-content:space-between;padding:16px 18px 13px;border-bottom:1px solid #F1EEF8;")}>
            <div><h2 style={s("margin:0;font-size:15px;font-weight:600;color:#1C1830;")}>ประกาศของจม (ยืม/โอน/แลกได้)</h2><p style={s("margin:2px 0 0;font-size:11.5px;color:#9B95B0;")}>{suggestions.length} รายการ · คำขอเปิด {openTransfers.length} รายการ</p></div>
            <div style={s("display:flex;gap:6px;")}>
              <span style={s("font-size:11px;font-weight:500;color:#6D28D9;background:#F4EEFE;padding:5px 11px;border-radius:99px;")}>ทั้งหมด</span>
              <span style={s("font-size:11px;font-weight:500;color:#9B95B0;background:#FAF9FD;padding:5px 11px;border-radius:99px;")}>ในเขตฉัน</span>
            </div>
          </div>
          <div style={s("padding:14px 18px;display:flex;flex-direction:column;gap:11px;")}>
            {suggestions.length === 0 ? (
              <div style={s("text-align:center;padding:24px;color:#9B95B0;font-size:13px;")}>ไม่มีรายการที่แนะนำให้โอน/ยืม</div>
            ) : suggestions.slice(0, 6).map(sg => (
              <div key={`${sg.skuId}-${sg.sourceWarehouseId}-${sg.destinationWarehouseId}`} style={s("display:flex;align-items:center;gap:14px;border:1px solid #EBE7F5;border-radius:13px;padding:13px 14px;")}>
                <span style={s("width:42px;height:42px;border-radius:11px;background:#FFFAEB;color:#D97706;display:flex;align-items:center;justify-content:center;flex:none;")}><Boxes style={s("width:20px;height:20px;")} /></span>
                <div style={s("flex:1;min-width:0;")}>
                  <div style={s("display:flex;align-items:center;gap:7px;")}><span style={s("font-size:13px;font-weight:600;color:#1C1830;")}>{sg.skuName}</span><span style={s("font-size:9.5px;font-weight:600;color:#B45309;background:#FFFAEB;padding:2px 7px;border-radius:99px;")}>ขาด {formatNumber(sg.destinationShortage)} {sg.unit}</span></div>
                  <div className="mono" style={s("font-size:10.5px;color:#A29DB5;margin-top:3px;")}>{sg.sourceWarehouseId} → {sg.destinationWarehouseId} · แนะนำโอน {formatNumber(sg.suggestedQuantity)} {sg.unit}</div>
                </div>
                <div style={s("display:flex;gap:8px;flex:none;")}>
                  <button onClick={() => onCreateTransfer(sg, "Transfer")} style={s("height:34px;padding:0 13px;border:1px solid #E5E1F0;border-radius:9px;background:#fff;color:#3B3654;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;")}>โอน</button>
                  <button onClick={() => onCreateTransfer(sg, "Borrow")} style={s("height:34px;padding:0 13px;border:0;border-radius:9px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;")}>ขอยืม</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            <h2 style={s("margin:0 0 3px;font-size:14px;font-weight:600;color:#1C1830;")}>ทุนจมรายคลัง</h2>
            <p style={s("margin:0 0 14px;font-size:11px;color:#9B95B0;")}>ยืมที่ยังไม่คืน {analytics.outstandingCount} รายการ · เกินกำหนด {analytics.overdueCount}</p>
            <div style={s("display:flex;flex-direction:column;gap:11px;")}>
              {analytics.shortageLeaders.slice(0, 4).map((leader, i) => {
                const pct = i === 0 ? 100 : Math.round(100 - i * 15);
                const color = i === 0 ? "#DC2626" : i === 1 ? "#D97706" : "#7C3AED";
                return (
                  <div key={leader.warehouseId}><div style={s("display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:4px;")}><span style={s("color:#5A5470;font-weight:500;")}>{leader.warehouseId}</span><span style={s("color:#1C1830;font-weight:600;")}>{leader.count} ครั้ง</span></div><div style={s("height:8px;border-radius:99px;background:#F0EDF7;")}><div style={{width:`${pct}%`,height:"100%",borderRadius:"99px",background:color}}></div></div></div>
                );
              })}
              {analytics.shortageLeaders.length === 0 && <div style={s("text-align:center;color:#9B95B0;font-size:12px;")}>ยังไม่มีข้อมูล</div>}
            </div>
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            <h2 style={s("margin:0 0 3px;font-size:14px;font-weight:600;color:#1C1830;")}>พฤติกรรมยืม-แลก</h2>
            <p style={s("margin:0 0 13px;font-size:11px;color:#9B95B0;")}>Leaderboard ทั้งหมด</p>
            <div style={s("display:flex;flex-direction:column;gap:10px;")}>
              <div style={s("display:flex;align-items:center;gap:11px;")}><span style={s("width:30px;height:30px;border-radius:8px;background:#F4EEFE;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}><Repeat2 style={s("width:15px;height:15px;")} /></span><div style={s("flex:1;")}><div style={s("font-size:12px;color:#5A5470;")}>ยืมบ่อยที่สุด</div><div style={s("font-size:12.5px;font-weight:600;color:#1C1830;")}>{analytics.borrowLeaders[0] ? `คลัง ${analytics.borrowLeaders[0].warehouseId} · ${analytics.borrowLeaders[0].count} ครั้ง` : "ยังไม่มีข้อมูล"}</div></div></div>
              <div style={s("display:flex;align-items:center;gap:11px;")}><span style={s("width:30px;height:30px;border-radius:8px;background:#FEF2F2;color:#DC2626;display:flex;align-items:center;justify-content:center;flex:none;")}><AlertOctagon style={s("width:15px;height:15px;")} /></span><div style={s("flex:1;")}><div style={s("font-size:12px;color:#5A5470;")}>ค้างคืนนานสุด</div><div style={s("font-size:12.5px;font-weight:600;color:#1C1830;")}>{analytics.overdueLeaders[0] ? `คลัง ${analytics.overdueLeaders[0].warehouseId} · ${analytics.overdueLeaders[0].count} รายการ` : "ไม่มีรายการเกินกำหนด"}</div></div></div>
              <div style={s("display:flex;align-items:center;gap:11px;")}><span style={s("width:30px;height:30px;border-radius:8px;background:#FFFAEB;color:#D97706;display:flex;align-items:center;justify-content:center;flex:none;")}><ArrowDown style={s("width:15px;height:15px;")} /></span><div style={s("flex:1;")}><div style={s("font-size:12px;color:#5A5470;")}>ขาดบ่อยที่สุด</div><div style={s("font-size:12.5px;font-weight:600;color:#1C1830;")}>{analytics.shortageLeaders[0] ? `คลัง ${analytics.shortageLeaders[0].warehouseId} · ${analytics.shortageLeaders[0].count} ครั้ง` : "ยังไม่มีข้อมูล"}</div></div></div>
            </div>
          </div>
        </div>
      </div>

      <div style={s("margin-top:18px;background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
        <div style={s("display:flex;align-items:center;justify-content:space-between;padding:15px 18px 12px;border-bottom:1px solid #F1EEF8;")}><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>ประวัติคำขอโอน/ยืม/แลก</h2><span style={s("font-size:11.5px;color:#7B7591;")}>{transferRequests.length} รายการ</span></div>
        <div style={s("overflow-x:auto;")}>
          <table style={s("width:100%;border-collapse:collapse;font-size:12.5px;min-width:640px;")}>
            <thead><tr style={s("background:#FAF9FD;")}><th style={s("text-align:left;font-size:10.5px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 16px;")}>Request</th><th style={s("text-align:left;padding:9px 12px;font-size:10.5px;font-weight:600;color:#9B95B0;text-transform:uppercase;")}>ประเภท / SKU</th><th style={s("text-align:left;padding:9px 12px;font-size:10.5px;font-weight:600;color:#9B95B0;text-transform:uppercase;")}>เส้นทาง</th><th style={s("text-align:right;padding:9px 12px;font-size:10.5px;font-weight:600;color:#9B95B0;text-transform:uppercase;")}>จำนวน</th><th style={s("text-align:left;padding:9px 12px;font-size:10.5px;font-weight:600;color:#9B95B0;text-transform:uppercase;")}>สถานะ</th><th style={s("text-align:left;padding:9px 12px;font-size:10.5px;font-weight:600;color:#9B95B0;text-transform:uppercase;")}>Action</th></tr></thead>
            <tbody>
              {transferRequests.length === 0 && <tr><td colSpan={6} style={s("text-align:center;padding:24px;color:#9B95B0;")}>ยังไม่มีประวัติ</td></tr>}
              {transferRequests.map(req => (
                <tr key={req.id} className="dash-row" style={s("border-top:1px solid #F4F2FA;")}>
                  <td style={s("padding:11px 16px;")}><div style={s("font-weight:600;color:#1C1830;")} className="mono">{req.id}</div><div style={s("font-size:10px;color:#9B95B0;")}>{req.createdAt}</div></td>
                  <td style={s("padding:11px 12px;")}><div style={s("color:#5A5470;")}>{getTransferTypeLabel(req.type)}</div><div style={s("font-size:10.5px;color:#9B95B0;")}>{req.skuName}</div></td>
                  <td style={s("padding:11px 12px;color:#5A5470;")}>{req.sourceWarehouseId} → {req.destinationWarehouseId}</td>
                  <td style={s("padding:11px 12px;text-align:right;font-weight:600;color:#1C1830;")}>{formatNumber(req.quantity)} {req.unit}</td>
                  <td style={s("padding:11px 12px;")}><TransferStatusBadge status={req.status} /></td>
                  <td style={s("padding:11px 12px;")}>
                    <div style={s("display:flex;gap:7px;flex-wrap:wrap;")}>
                      <button disabled={req.status !== "Requested"} onClick={() => onUpdateTransfer(req.id, "Approved", "อนุมัติ")} style={s(`height:30px;padding:0 10px;border:1px solid #E5E1F0;border-radius:8px;background:#fff;color:#3B3654;font-family:inherit;font-size:11.5px;cursor:pointer;${req.status !== "Requested" ? "opacity:.4;" : ""}`)}>อนุมัติ</button>
                      <button disabled={req.status !== "Approved"} onClick={() => onUpdateTransfer(req.id, "Completed", "ปิดงาน")} style={s(`height:30px;padding:0 10px;border:0;border-radius:8px;background:#6D28D9;color:#fff;font-family:inherit;font-size:11.5px;cursor:pointer;${req.status !== "Approved" ? "opacity:.4;" : ""}`)}>ปิดงาน</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
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

  const avgCover = rows.length > 0 ? rows.reduce((sum, r) => sum + r.stockCoverPeriods, 0) / rows.length : 0;

  return (
    <div>
      <div style={s("margin-bottom:18px;")}>
        <h1 style={s("margin:0 0 5px;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>วิเคราะห์สต็อก</h1>
        <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>Stock Cover · Dead/Slow Stock · คาดการณ์ขาดตาม season · Forecast error — มองทั้งของขาดและของจมพร้อมกัน</p>
      </div>

      <div style={s("display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:18px;")}>
        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:14px;padding:15px 16px;")}><div style={s("font-size:12px;color:#7B7591;")}>Stock Cover เฉลี่ย</div><div style={s("margin-top:7px;font-size:24px;font-weight:600;color:#1C1830;line-height:1;")} className="mono">{formatNumber(avgCover,1)} <span style={s("font-size:12px;color:#9B95B0;font-weight:400;")}>รอบ</span></div></div>
        <div style={s("background:#fff;border:1px solid #FBE3A2;border-radius:14px;padding:15px 16px;")}><div style={s("font-size:12px;color:#7B7591;")}>Dead/Slow Stock</div><div style={s("margin-top:7px;font-size:24px;font-weight:600;color:#B45309;line-height:1;")} className="mono">{deadStockCount} <span style={s("font-size:12px;color:#9B95B0;font-weight:400;")}>SKU</span></div></div>
        <div style={s("background:#fff;border:1px solid #FBD5D5;border-radius:14px;padding:15px 16px;")}><div style={s("font-size:12px;color:#7B7591;")}>คาดขาดใน 30 วัน</div><div style={s("margin-top:7px;font-size:24px;font-weight:600;color:#B91C1C;line-height:1;")} className="mono">{stockoutCount} <span style={s("font-size:12px;color:#9B95B0;font-weight:400;")}>SKU</span></div></div>
        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:14px;padding:15px 16px;")}><div style={s("font-size:12px;color:#7B7591;")}>Forecast Error</div><div style={s("margin-top:7px;font-size:24px;font-weight:600;color:#5B21B6;line-height:1;")} className="mono">{aiStats.count > 0 ? `±${formatNumber(aiStats.meanAbsoluteErrorPercent,1)}%` : `${formatNumber(avgDelay,1)} วัน`}</div></div>
      </div>

      <div style={s("display:grid;grid-template-columns:1.6fr 1fr;gap:18px;align-items:start;")}>
        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
            <div style={s("padding:15px 18px 12px;border-bottom:1px solid #F1EEF8;")}><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>Stock Cover รายพัสดุ ({rows.length} รายการ)</h2></div>
            <table style={s("width:100%;border-collapse:collapse;font-size:12.5px;")}>
              <thead><tr style={s("background:#FAF9FD;")}><th style={s("text-align:left;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:8px 16px;")}>SKU</th><th style={s("text-align:right;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:8px 10px;")}>สต็อก</th><th style={s("text-align:right;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:8px 10px;")}>Cover</th><th style={s("text-align:left;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:8px 16px;")}>สถานะ</th><th style={s("text-align:left;padding:8px 10px;")}></th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={5} style={s("text-align:center;padding:24px;color:#9B95B0;")}>ไม่มีข้อมูล</td></tr>}
                {rows.map(row => {
                  const coverColor = row.stockCoverPeriods < 1 ? "#B91C1C" : row.stockCoverPeriods >= 6 ? "#B45309" : "#0F7B53";
                  const badgeStyle = row.status === "Stockout Risk" ? "color:#B91C1C;background:#FEF2F2;" : row.status === "Dead Stock Candidate" ? "color:#B45309;background:#FFFAEB;" : "color:#0F7B53;background:#ECFDF5;";
                  const badgeLabel = row.status === "Stockout Risk" ? "เสี่ยงขาด" : row.status === "Dead Stock Candidate" ? "ของจม" : row.status === "Transfer Source" ? "ต้นทางโอน" : "ปกติ";
                  return (
                    <tr key={`${row.warehouseId}-${row.skuId}`} style={s("border-top:1px solid #F4F2FA;")} className="dash-row">
                      <td style={s("padding:11px 16px;")}><div style={s("font-weight:500;color:#1C1830;")}>{row.skuName}</div><div className="mono" style={s("font-size:10px;color:#A29DB5;")}>{row.skuId} · {row.warehouseId}</div></td>
                      <td style={s("padding:11px 10px;text-align:right;color:#1C1830;")}>{formatNumber(row.stockQty)} {row.unit}</td>
                      <td style={{padding:"11px 10px",textAlign:"right",fontWeight:600,color:coverColor}}>{formatNumber(row.stockCoverPeriods,1)} ร.</td>
                      <td style={s("padding:11px 16px;")}><span style={{...s(`font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;${badgeStyle}`)}}>{badgeLabel}</span></td>
                      <td style={s("padding:11px 10px;")}><button onClick={() => onOpenSku(getShortSkuIdFromPeaSku(row.skuId))} style={s("height:28px;padding:0 10px;border:1px solid #E5E1F0;border-radius:8px;background:#fff;color:#5A5470;font-family:inherit;font-size:11px;cursor:pointer;")}>ดู SKU</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);")}>
            <h2 style={s("margin:0 0 12px;font-size:14px;font-weight:600;color:#1C1830;")}>Dead / Slow Stock Candidate</h2>
            <div style={s("display:flex;flex-direction:column;gap:9px;")}>
              {rows.filter(r => r.status === "Dead Stock Candidate").length === 0 ? (
                <div style={s("text-align:center;color:#9B95B0;font-size:12px;")}>ไม่มี Dead/Slow Stock</div>
              ) : rows.filter(r => r.status === "Dead Stock Candidate").slice(0, 5).map((r, i) => (
                <div key={`${r.warehouseId}-${r.skuId}`} style={s("display:flex;align-items:center;gap:11px;")}><span style={{width:"8px",height:"8px",borderRadius:"50%",background:i===0?"#DC2626":"#D97706",flexShrink:0}}></span><div style={s("flex:1;font-size:12px;color:#5A5470;")}>{r.skuName} · {r.warehouseId} · cover {formatNumber(r.stockCoverPeriods,1)} รอบ</div><span style={s("font-size:11px;font-weight:600;color:#1C1830;")}>{formatNumber(r.stockQty)} {r.unit}</span></div>
              ))}
            </div>
          </div>
        </div>

        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
          <h2 style={s("margin:0 0 3px;font-size:14px;font-weight:600;color:#1C1830;")}>คาดการณ์ขาดตาม Season</h2>
          <p style={s("margin:0 0 14px;font-size:11px;color:#9B95B0;")}>ฤดูฝน demand +20% · 6 เดือนข้างหน้า</p>
          <div style={s("display:flex;align-items:flex-end;gap:9px;height:110px;")}>
            {[{m:"ก.ค.",h:55,c:"#E7DCFA"},{m:"ส.ค.",h:72,c:"#D6C2F7"},{m:"ก.ย.",h:100,c:"#DC2626"},{m:"ต.ค.",h:88,c:"#EC7E7E"},{m:"พ.ย.",h:60,c:"#D6C2F7"},{m:"ธ.ค.",h:48,c:"#E7DCFA"}].map(b => (
              <div key={b.m} style={s("flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;")}><div style={{width:"100%",height:`${b.h}%`,background:b.c,borderRadius:"5px 5px 0 0"}}></div><span style={{fontSize:"10px",color:b.h===100?"#B91C1C":"#A29DB5",fontWeight:b.h===100?600:400}}>{b.m}</span></div>
            ))}
          </div>
          <div style={s("margin-top:13px;background:#FEF2F2;border:1px solid #FBD5D5;border-radius:11px;padding:11px 13px;font-size:11.5px;color:#8A4B4B;line-height:1.55;")}><b style={s("color:#B91C1C;")}>ก.ย.</b> คาดขาด {stockoutCount} SKU — แนะนำสั่งล่วงหน้า หรือโอนจากคลังที่ของจม</div>
        </div>
      </div>
    </div>
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

  const topFlagged = allRequests.find(r => r.flags.length > 0);
  const displayRecord = selectedRecord ?? topFlagged ?? null;

  return (
    <div>
      <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:20px;")}>
        <div>
          <h1 style={s("margin:0 0 5px;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>ตรวจซื้อซ้ำ-ของจม</h1>
          <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>เทียบประวัติการของบ 3 ปีงบ จับเคส "ของบซื้อทั้งที่ของจม" และเร่งใช้งบปลายปี</p>
        </div>
        <div style={s("display:flex;gap:8px;")}>
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} style={s("height:38px;padding:0 13px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;outline:none;")}><option value="all">ปีงบทั้งหมด</option>{Array.from(new Set(allRequests.map(r=>r.fiscalYear))).map(y => <option key={y} value={y}>{y}</option>)}</select>
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={s("height:38px;padding:0 13px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;outline:none;")}><option value="all">ทุกคลัง</option>{regionOptions.map(r => <option key={r} value={r}>{r}</option>)}</select>
        </div>
      </div>

      <div style={s("display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:18px;")}>
        <div style={s("background:#fff;border:1px solid #FBD5D5;border-radius:14px;padding:15px 16px;")}><div style={s("display:flex;align-items:center;gap:8px;")}><Flag style={s("width:15px;height:15px;color:#DC2626;")} /><span style={s("font-size:12px;color:#7B7591;")}>เคสที่ flag</span></div><div style={s("margin-top:8px;font-size:26px;font-weight:600;color:#B91C1C;line-height:1;")} className="mono">{gotchaCount} <span style={s("font-size:12px;color:#9B95B0;font-weight:400;")}>ใบของบ</span></div></div>
        <div style={s("background:#fff;border:1px solid #FBE3A2;border-radius:14px;padding:15px 16px;")}><div style={s("display:flex;align-items:center;gap:8px;")}><Archive style={s("width:15px;height:15px;color:#D97706;")} /><span style={s("font-size:12px;color:#7B7591;")}>ทุนจมที่เกี่ยวข้อง</span></div><div style={s("margin-top:8px;font-size:26px;font-weight:600;color:#B45309;line-height:1;")} className="mono">{formatTHB(totalDeadValue)}</div></div>
        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:14px;padding:15px 16px;")}><div style={s("display:flex;align-items:center;gap:8px;")}><RefreshCcw style={s("width:15px;height:15px;color:#6D28D9;")} /><span style={s("font-size:12px;color:#7B7591;")}>งบที่ควรทบทวน</span></div><div style={s("margin-top:8px;font-size:26px;font-weight:600;color:#5B21B6;line-height:1;")} className="mono">{spendToKeepCount} <span style={s("font-size:12px;color:#9B95B0;font-weight:400;")}>คลัง</span></div></div>
      </div>

      <div style={s("display:grid;grid-template-columns:1.5fr 1fr;gap:18px;align-items:start;")}>
        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          {topFlagged && (
            <div style={s("background:#fff;border:1px solid #FBD5D5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
              <div style={s("display:flex;align-items:center;gap:11px;padding:14px 18px;background:#FEF2F2;border-bottom:1px solid #FBD5D5;")}>
                <AlertOctagon style={s("width:18px;height:18px;color:#DC2626;")} />
                <div style={s("flex:1;")}><div style={s("font-size:14px;font-weight:600;color:#991B1B;")}>{topFlagged.warehouseId} · {topFlagged.skuName}</div></div>
                <span style={s("font-size:10.5px;font-weight:600;color:#fff;background:#DC2626;padding:3px 10px;border-radius:99px;")}>{topFlagged.flags.map(f => gotchaFlagLabel[f]).join(" / ")}</span>
              </div>
              <div style={s("padding:15px 18px;")}>
                <div style={s("display:flex;align-items:center;gap:20px;")}>
                  <div style={s("display:flex;align-items:flex-end;gap:10px;height:120px;flex:1;")}>
                    {[{h:62,bc:"#A78BD9",rd:5,label:"ของบ"},{h:56,bc:"#F4A6A6",rd:3,label:"ของจม"},{h:75,bc:"#A78BD9",rd:5},{h:78,bc:"#EC7E7E",rd:3},{h:69,bc:"#7C3AED",rd:5},{h:100,bc:"#DC2626",rd:3,bold:true}].map((b,i) => (
                      <div key={i} style={{flex:1,height:`${b.h}%`,background:b.bc,borderRadius:"5px 5px 0 0"}}></div>
                    ))}
                  </div>
                  <div style={s("width:140px;flex:none;")}>
                    <div style={s("display:flex;align-items:center;gap:7px;margin-bottom:8px;")}><span style={s("width:11px;height:11px;border-radius:3px;background:#7C3AED;")}></span><span style={s("font-size:11.5px;color:#5A5470;")}>ของบซื้อ</span></div>
                    <div style={s("display:flex;align-items:center;gap:7px;margin-bottom:14px;")}><span style={s("width:11px;height:11px;border-radius:3px;background:#DC2626;")}></span><span style={s("font-size:11.5px;color:#5A5470;")}>ของจมคงเหลือ</span></div>
                    <div style={s("background:#FEF2F2;border:1px solid #FBD5D5;border-radius:10px;padding:9px 11px;")}><div style={s("font-size:10.5px;color:#9B6B6B;")}>เหตุผล</div><div style={s("font-size:11px;font-weight:600;color:#B91C1C;line-height:1.4;")}>{topFlagged.flagNotes[0] ?? "—"}</div></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;padding:15px 18px 12px;border-bottom:1px solid #F1EEF8;")}><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>ใบของบที่ตรวจพบ ({filteredRequests.length} รายการ)</h2><label style={s("display:flex;align-items:center;gap:6px;font-size:12px;color:#5A5470;cursor:pointer;")}><input type="checkbox" checked={flaggedOnly} onChange={e => setFlaggedOnly(e.target.checked)} /> เฉพาะที่ติด flag</label></div>
            <div style={s("overflow-x:auto;")}>
              <table style={s("width:100%;border-collapse:collapse;font-size:12.5px;min-width:500px;")}>
                <thead><tr style={s("background:#FAF9FD;")}><th style={s("text-align:left;font-size:10.5px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 16px;")}>ใบของบ / คลัง</th><th style={s("text-align:right;font-size:10.5px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 12px;")}>มูลค่า</th><th style={s("text-align:left;font-size:10.5px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 12px;")}>flag</th></tr></thead>
                <tbody>
                  {filteredRequests.length === 0 && (
                    <tr><td colSpan={3} style={s("text-align:center;padding:24px;color:#9B95B0;")}>ไม่มีรายการ</td></tr>
                  )}
                  {filteredRequests.slice(0, 8).map(rec => {
                    const flagCells = rec.flags.length === 0
                      ? <span style={s("color:#9B95B0;font-size:11px;")}>—</span>
                      : rec.flags.map(f => {
                          const fc = f === "repeat-buy"
                            ? s("font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;margin-right:4px;color:#B91C1C;background:#FEF2F2;border:1px solid #FBD5D5;")
                            : s("font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;margin-right:4px;color:#B45309;background:#FFFAEB;border:1px solid #FBE3A2;");
                          return <span key={f} style={fc}>{gotchaFlagLabel[f]}</span>;
                        });
                    return (
                      <tr key={rec.id} className="dash-row" style={s("border-top:1px solid #F4F2FA;cursor:pointer;")} onClick={() => setSelectedRecord(rec)}>
                        <td style={s("padding:11px 16px;")}><div style={s("font-weight:500;color:#1C1830;")}>{rec.skuName} · {rec.requestedQty} {rec.unit}</div><div className="mono" style={s("font-size:10px;color:#A29DB5;")}>{rec.id} · {rec.warehouseId}</div></td>
                        <td style={s("padding:11px 12px;text-align:right;font-weight:600;color:#1C1830;")}>{formatTHB(rec.amount)}</td>
                        <td style={s("padding:11px 12px;")}>{flagCells}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
          {displayRecord ? (
            <>
              <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;")}><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>รายละเอียดใบของบ</h2><span className="mono" style={s("font-size:10.5px;color:#7C3AED;background:#F4EEFE;padding:3px 8px;border-radius:6px;")}>{displayRecord.id}</span></div>
              <div style={s("display:flex;flex-direction:column;gap:11px;")}>
                <div style={s("display:flex;justify-content:space-between;font-size:12.5px;")}><span style={s("color:#7B7591;")}>คลัง / เขต</span><span style={s("font-weight:500;color:#1C1830;")}>{displayRecord.warehouseId} · {displayRecord.regionLabel}</span></div>
                <div style={s("display:flex;justify-content:space-between;font-size:12.5px;")}><span style={s("color:#7B7591;")}>พัสดุ</span><span style={s("font-weight:500;color:#1C1830;")}>{displayRecord.skuName}</span></div>
                <div style={s("display:flex;justify-content:space-between;font-size:12.5px;")}><span style={s("color:#7B7591;")}>ของบซื้อ</span><span style={s("font-weight:600;color:#1C1830;")}>{displayRecord.requestedQty} {displayRecord.unit} · {formatTHB(displayRecord.amount)}</span></div>
                {displayRecord.flagNotes.length > 0 && <div style={s("font-size:11.5px;color:#B91C1C;background:#FEF2F2;border:1px solid #FBD5D5;border-radius:8px;padding:6px 10px;")}>{displayRecord.flagNotes[0]}</div>}
                <div style={s("height:1px;background:#F1EEF8;margin:3px 0;")}></div>
                <div style={s("display:flex;justify-content:space-between;font-size:12.5px;")}><span style={s("color:#7B7591;")}>ปีงบ</span><span style={s("font-weight:500;color:#1C1830;")}>{displayRecord.fiscalYear}</span></div>
                <div style={s("display:flex;justify-content:space-between;font-size:12.5px;")}><span style={s("color:#7B7591;")}>หมวด</span><span style={s("font-weight:500;color:#1C1830;")}>{displayRecord.category}</span></div>
              </div>
              {displayRecord.flags.length > 0 && (
                <div style={s("margin-top:15px;background:#FEF2F2;border:1px solid #FBD5D5;border-radius:12px;padding:12px 13px;")}>
                  <div style={s("display:flex;align-items:flex-start;gap:8px;")}><AlertTriangle style={s("width:15px;height:15px;color:#DC2626;margin-top:1px;")} /><div style={s("font-size:11.5px;color:#8A4B4B;line-height:1.55;")}><b style={s("color:#B91C1C;")}>flag:</b> {displayRecord.flags.map(f => gotchaFlagLabel[f]).join(" / ")} — แนะนำตรวจสอบก่อนอนุมัติ</div></div>
                </div>
              )}
              <div style={s("display:flex;gap:9px;margin-top:14px;")}>
                <button onClick={() => onOpenSku(displayRecord.skuId)} style={s("flex:1;height:40px;border:1px solid #E5E1F0;border-radius:11px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;")}>ดู SKU</button>
                <button onClick={() => onOpenTransfer(displayRecord.skuId)} style={s("flex:1;height:40px;border:0;border-radius:11px;background:#DC2626;color:#fff;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;")}>ตรวจโอน/ยืม</button>
              </div>
            </>
          ) : (
            <div style={s("text-align:center;padding:30px;color:#9B95B0;font-size:13px;")}>กดที่แถวในตารางเพื่อดูรายละเอียด</div>
          )}
        </div>
      </div>

      {selectedRecord ? (
        <BudgetRequestDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onOpenSku={onOpenSku}
          onOpenTransfer={onOpenTransfer}
        />
      ) : null}
    </div>

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
  onLogin,
  onRegister,
  onResetPassword,
  onGoogleLogin,
  onDemoLogin,
  onBack,
}: {
  onLogin: (username: string, password: string) => boolean;
  onRegister: (name: string, username: string, password: string, title?: string) => boolean;
  onResetPassword: (username: string, newPassword: string) => boolean;
  onGoogleLogin: (profile: GoogleProfile) => void;
  onDemoLogin: (user: SessionUser) => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  // ตำแหน่งที่เลือกตอนสมัคร (เดโม)
  const registerPositions = ["เจ้าหน้าที่คลัง", "ผอ.เขต", "ส่วนกลาง", "นักวิเคราะห์"];
  const [position, setPosition] = useState(registerPositions[0]);

  const reset = () => { setName(""); setUsername(""); setPassword(""); setConfirmPassword(""); setError(""); };
  const switchMode = (next: AuthMode) => { reset(); setMode(next); };

  const submit = () => {
    setError("");
    if (mode === "login") {
      if (!onLogin(username, password)) setError("รหัสพนักงาน/อีเมล หรือรหัสผ่านไม่ถูกต้อง");
      else reset();
      return;
    }
    if (mode === "register") {
      if (password !== confirmPassword) { setError("รหัสผ่านยืนยันไม่ตรงกัน"); return; }
      if (onRegister(name, username, password, position)) reset();
      else setError("สมัครไม่สำเร็จ — username อาจถูกใช้แล้ว หรือกรอกไม่ครบ");
      return;
    }
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

  const title = mode === "login" ? "เข้าสู่ระบบ" : mode === "register" ? "สมัครสมาชิก" : "ลืมรหัสผ่าน";
  const subtitle = mode === "login" ? "กรอกข้อมูลหรือใช้บัญชี PEA ของคุณ" : mode === "register" ? "สร้างบัญชีใหม่เพื่อเริ่มใช้งาน" : "ตั้งรหัสผ่านใหม่ด้วย username ของคุณ";
  const labelStyle = s("display:block;font-size:12.5px;font-weight:500;color:#3B3654;margin-bottom:7px;");
  const inputStyle = (pad: string) => s(`width:100%;height:48px;border:1px solid #E0DAEF;border-radius:12px;background:#fff;padding:${pad};font-family:inherit;font-size:14px;color:#1C1830;outline:none;`);
  const iconStyle = s("position:absolute;left:13px;top:50%;transform:translateY(-50%);width:17px;height:17px;color:#9B95B0;");
  // เข้าเล่นเดโมตามบทบาท — กดการ์ดเพื่อ bypass login เข้าแอปทันที (God Mode = สิทธิ์ admin เต็ม)
  const demoRoles: { label: string; sub: string; icon: typeof WarehouseIcon; user: SessionUser; god?: boolean }[] = [
    { label: "จนท.คลัง", sub: "คลัง I010", icon: WarehouseIcon, user: { name: "จนท.คลัง", username: "demo-warehouse", role: "user", title: "เดโม · คลัง I010" } },
    { label: "ผอ.เขต", sub: "เขต A", icon: Building2, user: { name: "ผอ.เขต", username: "demo-region", role: "user", title: "เดโม · เขต A" } },
    { label: "ส่วนกลาง", sub: "อนุมัติงบกลาง", icon: Landmark, user: { name: "ส่วนกลาง", username: "demo-central", role: "user", title: "เดโม · ส่วนกลาง" } },
    { label: "Analyst", sub: "ทีมวิเคราะห์", icon: LineChart, user: { name: "Analyst", username: "demo-analyst", role: "user", title: "เดโม · ทีมวิเคราะห์" } },
    { label: "God Mode", sub: "ทุกสิทธิ์ · admin", icon: Sparkles, god: true, user: { name: "God Mode", username: "god", role: "admin", title: "ทุกสิทธิ์ · admin" } },
  ];

  return (
    <div style={s("display:flex;min-height:100vh;width:100%;font-family:Kanit,sans-serif;")}>
      {/* LEFT BRAND PANEL */}
      <div style={s("width:46%;flex:none;position:relative;overflow:hidden;background:radial-gradient(700px 420px at 30% 8%,#5A1A6E 0%,rgba(90,26,110,0) 58%),linear-gradient(168deg,#2A1052 0%,#140C26 70%);display:flex;flex-direction:column;padding:44px 50px;color:#fff;")} className="hidden lg:flex">
        <div style={s("position:absolute;bottom:-140px;right:-80px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(232,74,160,.3),transparent 65%);filter:blur(34px);pointer-events:none;")} />
        <div style={s("position:absolute;top:-100px;left:-60px;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(124,45,224,.3),transparent 65%);filter:blur(30px);pointer-events:none;")} />

        <button onClick={onBack} style={s("position:relative;z-index:2;display:flex;align-items:center;gap:12px;border:0;background:transparent;cursor:pointer;padding:0;text-align:left;")}>
          <div style={s("position:relative;width:42px;height:42px;border-radius:13px;background:linear-gradient(140deg,#8B2FE6 0%,#B51C9E 52%,#E84AA0 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 9px 22px -6px rgba(184,40,170,.8),inset 0 1px 0 rgba(255,255,255,.3);overflow:hidden;flex:none;")}>
            <div style={s("position:absolute;top:-10px;left:-10px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.28);filter:blur(7px);")} />
            <Boxes style={s("position:relative;width:23px;height:23px;color:#fff;")} />
            <span style={s("position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:#FFD057;box-shadow:0 0 7px 1px rgba(255,208,87,.85);animation:pulseDot 1.9s infinite;")} />
          </div>
          <div><div style={s("font-size:15px;font-weight:600;color:#fff;line-height:1.1;")}>PEA AI Stock Intelligent</div><div style={s("font-size:10.5px;color:rgba(255,255,255,.45);")}>ระบบบริหารสต๊อคอัจฉริยะ</div></div>
        </button>

        <div style={s("position:relative;z-index:2;flex:1;display:flex;flex-direction:column;justify-content:center;max-width:400px;")}>
          <h1 style={s("margin:0 0 16px;font-size:32px;line-height:1.18;font-weight:600;letter-spacing:-.4px;color:#fff;")}>ยินดีต้อนรับกลับ<br />สู่ศูนย์วางแผนพัสดุ</h1>
          <p style={s("margin:0 0 30px;font-size:14px;line-height:1.65;color:rgba(255,255,255,.6);")}>เข้าสู่ระบบเพื่อดูความเสี่ยงสต็อก คำแนะนำ AI งบประมาณ และคำขอที่ต้องดำเนินการในเขตของคุณ</p>
          <div style={s("display:flex;flex-direction:column;gap:13px;")}>
            <div style={s("display:flex;align-items:center;gap:11px;")}><span style={s("width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;color:#E9B8FF;flex:none;")}><ShieldCheck style={s("width:15px;height:15px;")} /></span><span style={s("font-size:13px;color:rgba(255,255,255,.78);")}>ทุกการตัดสินใจเก็บ Snapshot ตรวจย้อนหลังได้</span></div>
            <div style={s("display:flex;align-items:center;gap:11px;")}><span style={s("width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;color:#E9B8FF;flex:none;")}><Recycle style={s("width:15px;height:15px;")} /></span><span style={s("font-size:13px;color:rgba(255,255,255,.78);")}>ดักของจมก่อนซื้อ — จับคู่โอน/ยืมข้ามคลัง</span></div>
            <div style={s("display:flex;align-items:center;gap:11px;")}><span style={s("width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;color:#E9B8FF;flex:none;")}><Lock style={s("width:15px;height:15px;")} /></span><span style={s("font-size:13px;color:rgba(255,255,255,.78);")}>เชื่อมต่อ PEA SSO ปลอดภัย</span></div>
          </div>
        </div>

        <div style={s("position:relative;z-index:2;display:flex;gap:10px;margin-bottom:24px;")}>
          <div style={s("flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:13px;padding:12px 14px;")}><div style={s("font-size:18px;font-weight:700;color:#fff;line-height:1;")}>฿420K</div><div style={s("font-size:10.5px;color:rgba(255,255,255,.5);margin-top:4px;")}>ประหยัดได้รอบนี้</div></div>
          <div style={s("flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:13px;padding:12px 14px;")}><div style={s("font-size:18px;font-weight:700;color:#fff;line-height:1;")}>12</div><div style={s("font-size:10.5px;color:rgba(255,255,255,.5);margin-top:4px;")}>SKU เสี่ยงรอจัดการ</div></div>
          <div style={s("flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:13px;padding:12px 14px;")}><div style={s("font-size:18px;font-weight:700;color:#fff;line-height:1;")}>7</div><div style={s("font-size:10.5px;color:rgba(255,255,255,.5);margin-top:4px;")}>คำขอรออนุมัติ</div></div>
        </div>

        <div style={s("position:relative;z-index:2;font-size:11.5px;color:rgba(255,255,255,.4);")}>Hackathon 2026 · by ThaiCloud · <span style={s("color:rgba(255,255,255,.62);font-weight:500;")}>Track 2</span></div>
      </div>

      {/* RIGHT FORM */}
      <div style={s("flex:1;background:#F4F2FA;display:flex;align-items:center;justify-content:center;padding:40px;")}>
        <div style={s("width:100%;max-width:396px;")}>
          <button onClick={onBack} style={s("display:inline-flex;align-items:center;gap:6px;margin-bottom:18px;border:0;background:transparent;color:#7B7591;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;padding:0;")}><ArrowLeft style={s("width:15px;height:15px;")} /> กลับหน้าแรก</button>
          <div style={s("margin-bottom:26px;")}>
            <h2 style={s("margin:0 0 6px;font-size:24px;font-weight:600;color:#1C1830;letter-spacing:-.2px;")}>{title}</h2>
            <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>{subtitle}</p>
          </div>

          {mode === "login" && isGoogleAuthEnabled() ? (
            <div style={s("margin-bottom:18px;display:flex;justify-content:center;")}><GoogleSignInButton onProfile={onGoogleLogin} /></div>
          ) : mode === "login" ? (
            <div style={s("display:flex;align-items:center;justify-content:center;gap:10px;height:48px;border:1px solid #E0DAEF;border-radius:12px;background:#fff;color:#9B95B0;font-size:14px;font-weight:600;box-shadow:0 6px 16px -10px rgba(28,24,48,.4);margin-bottom:18px;")}>
              <span style={s("width:22px;height:22px;border-radius:6px;background:linear-gradient(140deg,#8B2FE6,#E84AA0);display:flex;align-items:center;justify-content:center;color:#fff;flex:none;")}><Zap style={s("width:13px;height:13px;")} /></span>
              เข้าสู่ระบบด้วย PEA SSO <span style={s("font-size:10px;color:#B45309;background:#FFFAEB;padding:2px 7px;border-radius:99px;")}>เร็วๆ นี้</span>
            </div>
          ) : null}

          {mode === "login" ? (
            <div style={s("display:flex;align-items:center;gap:14px;margin-bottom:18px;")}><div style={s("flex:1;height:1px;background:#E5E1F0;")} /><span style={s("font-size:11.5px;color:#9B95B0;")}>หรือ</span><div style={s("flex:1;height:1px;background:#E5E1F0;")} /></div>
          ) : null}

          {mode === "register" ? (
            <div style={s("margin-bottom:14px;")}>
              <label style={labelStyle}>ชื่อ-นามสกุล</label>
              <div style={s("position:relative;")}><User style={iconStyle} /><input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น คุณสมชาย ใจดี" style={inputStyle("0 13px 0 40px")} /></div>
            </div>
          ) : null}

          <div style={s("margin-bottom:14px;")}>
            <label style={labelStyle}>{mode === "login" ? "รหัสพนักงาน / อีเมล" : "Username"}</label>
            <div style={s("position:relative;")}><User style={iconStyle} /><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={mode === "login" ? "username หรือ admin" : "username"} style={inputStyle("0 13px 0 40px")} /></div>
          </div>

          <div style={s("margin-bottom:14px;")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;")}>
              <label style={s("font-size:12.5px;font-weight:500;color:#3B3654;")}>{mode === "forgot" ? "รหัสผ่านใหม่" : "รหัสผ่าน"}</label>
              {mode === "login" ? <span onClick={() => switchMode("forgot")} style={s("font-size:11.5px;color:#7C3AED;cursor:pointer;")}>ลืมรหัสผ่าน?</span> : null}
            </div>
            <div style={s("position:relative;")}>
              <Lock style={iconStyle} />
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="รหัสผ่าน" style={inputStyle("0 42px 0 40px")} />
              <button type="button" onClick={() => setShowPw((v) => !v)} style={s("position:absolute;right:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;border:0;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#9B95B0;")}>{showPw ? <EyeOff style={s("width:17px;height:17px;")} /> : <Eye style={s("width:17px;height:17px;")} />}</button>
            </div>
          </div>

          {mode !== "login" ? (
            <div style={s("margin-bottom:14px;")}>
              <label style={labelStyle}>ยืนยันรหัสผ่าน</label>
              <div style={s("position:relative;")}><Lock style={iconStyle} /><input type={showPw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="พิมพ์รหัสผ่านอีกครั้ง" style={inputStyle("0 13px 0 40px")} /></div>
            </div>
          ) : null}

          {mode === "register" ? (
            <div style={s("margin-bottom:18px;")}>
              <label style={labelStyle}>ตำแหน่ง / บทบาท</label>
              <div style={s("display:grid;grid-template-columns:repeat(2,1fr);gap:8px;")}>
                {registerPositions.map((p) => {
                  const on = position === p;
                  return (
                    <button key={p} type="button" onClick={() => setPosition(p)} style={s(`display:flex;align-items:center;gap:7px;padding:10px 11px;border-radius:11px;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:500;text-align:left;transition:all .15s;border:1.5px solid ${on ? "#C9B0F2" : "#E5E1F0"};background:${on ? "#F4EEFE" : "#fff"};color:${on ? "#6D28D9" : "#5A5470"};`)}>
                      <span style={s(`width:16px;height:16px;border-radius:50%;border:2px solid ${on ? "#7C3AED" : "#CFC8E0"};display:flex;align-items:center;justify-content:center;flex:none;`)}>{on ? <span style={s("width:7px;height:7px;border-radius:50%;background:#7C3AED;")} /> : null}</span>
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {error ? <p style={s("margin:0 0 14px;border-radius:10px;background:#FEF2F2;border:1px solid #FBD5D5;padding:9px 12px;font-size:12.5px;color:#B91C1C;")}>{error}</p> : null}

          <button onClick={submit} disabled={!canSubmit} style={s(`display:flex;width:100%;align-items:center;justify-content:center;gap:8px;height:50px;border:0;border-radius:13px;background:linear-gradient(135deg,#7C2DE0,#C0249B);color:#fff;font-family:inherit;font-size:15px;font-weight:600;box-shadow:0 16px 34px -12px rgba(184,40,170,.8);cursor:pointer;${canSubmit ? "" : "opacity:.5;cursor:not-allowed;"}`)}>
            {mode === "login" ? "เข้าสู่ระบบ" : mode === "register" ? "สมัครและเข้าสู่ระบบ" : "ตั้งรหัสผ่านใหม่"} <ArrowRight style={s("width:18px;height:18px;")} />
          </button>

          {mode === "login" ? (
            <div style={s("margin-top:20px;")}>
              <div style={s("display:flex;align-items:center;gap:14px;margin-bottom:13px;")}><div style={s("flex:1;height:1px;background:#E5E1F0;")} /><span style={s("font-size:11px;color:#9B95B0;white-space:nowrap;")}>หรือเข้าเล่นเดโมตามบทบาท (กดเข้าเลย)</span><div style={s("flex:1;height:1px;background:#E5E1F0;")} /></div>
              <div style={s("display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-bottom:9px;")}>
                {demoRoles.filter((r) => !r.god).map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => onDemoLogin(r.user)}
                      style={s("display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:12px;cursor:pointer;font-family:inherit;text-align:left;transition:all .15s;border:1px solid #E5E1F0;background:#fff;")}
                    >
                      <span style={s("width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex:none;background:#F4EEFE;color:#7C3AED;")}><Icon style={s("width:17px;height:17px;")} /></span>
                      <span style={s("min-width:0;")}><span style={s("display:block;font-size:12.5px;font-weight:600;color:#1C1830;")}>{r.label}</span><span style={s("display:block;font-size:10.5px;color:#9B95B0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;")}>{r.sub}</span></span>
                    </button>
                  );
                })}
              </div>
              {demoRoles.filter((r) => r.god).map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => onDemoLogin(r.user)}
                    style={s("display:flex;align-items:center;gap:11px;width:100%;padding:12px 14px;border-radius:12px;cursor:pointer;font-family:inherit;text-align:left;transition:all .15s;border:1.5px solid #C9B0F2;background:linear-gradient(135deg,#F4EEFE,#FBEAF6);box-shadow:0 8px 20px -14px rgba(124,45,224,.7);")}
                  >
                    <span style={s("width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex:none;background:linear-gradient(140deg,#7C2DE0,#C0249B);color:#fff;")}><Icon style={s("width:17px;height:17px;")} /></span>
                    <span style={s("flex:1;min-width:0;")}><span style={s("display:block;font-size:13px;font-weight:700;color:#6D28D9;")}>{r.label}</span><span style={s("display:block;font-size:10.5px;color:#9B6FCF;")}>{r.sub}</span></span>
                    <ArrowRight style={s("width:16px;height:16px;color:#7C3AED;flex:none;")} />
                  </button>
                );
              })}
            </div>
          ) : null}

          {mode === "login" ? (
            <>
              <p style={s("text-align:center;margin:18px 0 0;font-size:12px;color:#9B95B0;")}>ยังไม่มีบัญชี? <span onClick={() => switchMode("register")} style={s("color:#7C3AED;font-weight:500;cursor:pointer;")}>สมัครสมาชิก</span></p>
              <p style={s("text-align:center;margin:8px 0 0;font-size:11.5px;color:#B7B1C6;")}>ผู้ดูแลระบบทดสอบ: admin / admin</p>
            </>
          ) : (
            <p style={s("text-align:center;margin:18px 0 0;font-size:12px;color:#9B95B0;")}><span onClick={() => switchMode("login")} style={s("color:#7C3AED;font-weight:500;cursor:pointer;")}>← กลับไปเข้าสู่ระบบ</span></p>
          )}
        </div>
      </div>
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

  const selectedSku = skus.find(s => s.id === skuId);
  const recvFailed = inspection.some(v => !v);
  const recvDone = inspection.every(v => v);
  const progressPct = `${Math.round((inspection.filter(Boolean).length / inspectionSteps.length) * 100)}%`;

  return (
    <div>
      <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:18px;")}>
        <div>
          <div style={s("display:flex;align-items:center;gap:10px;margin-bottom:5px;")}>
            <h1 style={s("margin:0;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>ตรวจรับพัสดุ</h1>
            <span style={s("display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#5B21B6;background:#F1EBFE;border:1px solid #E4D7FB;padding:3px 9px;border-radius:99px;")}><Scale style={s("width:13px;height:13px;")} /> พ.ร.บ. จัดซื้อจัดจ้างฯ 2560</span>
          </div>
          <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>คณะกรรมการตรวจรับ ดำเนินการ {inspectionSteps.length} ขั้น — ผ่าน → รับเข้าคลัง + เบิกจ่าย · ไม่ผ่าน → แจ้งคู่สัญญา</p>
        </div>
        <button onClick={() => setInspection(inspectionSteps.map(() => true))} style={s("display:flex;align-items:center;gap:6px;height:38px;padding:0 13px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;")}><RefreshCcw style={s("width:14px;height:14px;color:#7C3AED;")} /> เริ่มตรวจใหม่</button>
      </div>

      <div style={s("display:flex;align-items:center;gap:16px;background:#fff;border:1px solid #EBE7F5;border-radius:14px;padding:14px 18px;margin-bottom:16px;box-shadow:0 12px 28px -24px rgba(28,24,48,.4);")}>
        <span style={s("width:44px;height:44px;border-radius:11px;background:#F4EEFE;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}><Zap style={s("width:21px;height:21px;")} /></span>
        <div style={s("flex:1;min-width:0;")}>
          <div style={s("font-size:14px;font-weight:600;color:#1C1830;")}>{selectedSku?.name ?? skuId}</div>
          <div className="mono" style={s("font-size:11px;color:#A29DB5;margin-top:2px;")}>{relatedRequestId || "ไม่ผูกคำขอ"} · {supplierId} · ส่งมอบคลัง {warehouseId}</div>
        </div>
        <div style={s("display:flex;gap:26px;flex:none;")}>
          <div style={s("text-align:right;")}><div style={s("font-size:10.5px;color:#9B95B0;")}>Delay</div><div style={s("font-size:13.5px;font-weight:600;color:#B45309;")}>{delayDays > 0 ? `${delayDays} วัน` : "ไม่มี"}</div></div>
          <div style={s("text-align:right;")}><div style={s("font-size:10.5px;color:#9B95B0;")}>ความคืบหน้า</div><div style={s("font-size:13.5px;font-weight:600;color:#6D28D9;")}>ขั้น {inspection.filter(Boolean).length} / {inspectionSteps.length}</div></div>
        </div>
      </div>

      <div style={s("height:7px;border-radius:99px;background:#EDE9F7;margin-bottom:16px;overflow:hidden;")}><div style={{height:"100%",borderRadius:"99px",background:"linear-gradient(90deg,#7C3AED,#6D28D9)",width:progressPct,transition:"width .35s"}}></div></div>

      <div style={s("display:flex;align-items:center;gap:14px;background:linear-gradient(100deg,#FBF4FF,#FCE9F5);border:1px solid #E6D8FB;border-radius:14px;padding:13px 17px;margin-bottom:18px;")}>
        <span style={s("width:38px;height:38px;border-radius:10px;background:#fff;border:1px solid #E6D8FB;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}><Sparkles style={s("width:18px;height:18px;")} /></span>
        <div style={s("flex:1;min-width:0;font-size:12px;color:#6B6483;line-height:1.5;")}><b style={s("color:#5B21B6;")}>AI ช่วยตรวจรับ:</b> ของน้อย → แนะนำ <b style={s("color:#3B1170;")}>ตรวจนับทั้งหมด</b> · ราคาต่อหน่วยใกล้เคียงตลาด · <b style={s("color:#B45309;")}>ขั้น 5: ตรวจใบรับรอง Type Test/มอก. — เน้นเป็นพิเศษ</b></div>
      </div>

      <div style={s("display:grid;grid-template-columns:1.55fr 1fr;gap:18px;align-items:start;")}>
        <div style={s("display:flex;flex-direction:column;gap:10px;")}>
          {inspectionSteps.map((step, i) => {
            const passed = inspection[i];
            const cardBg = passed ? "display:flex;align-items:flex-start;gap:13px;background:#F0FDF4;border:1px solid #D1FAE5;border-radius:13px;padding:13px 15px;" : "display:flex;align-items:flex-start;gap:13px;background:#FEF2F2;border:1px solid #FBD5D5;border-left:3px solid #DC2626;border-radius:13px;padding:13px 15px;";
            const markBg = passed ? "background:#059669;" : "background:#DC2626;";
            const tagBg = passed ? "color:#059669;background:#D1FAE5;border:1px solid #A7F3D0;" : "color:#DC2626;background:#FEE2E2;border:1px solid #FCA5A5;";
            return (
              <div key={i} style={s(cardBg)}>
                <div style={s(`width:28px;height:28px;border-radius:50%;${markBg}color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex:none;`)}>{passed ? <Check style={s("width:13px;height:13px;")} /> : i + 1}</div>
                <div style={s("flex:1;min-width:0;")}>
                  <div style={s("display:flex;align-items:center;justify-content:space-between;gap:8px;")}>
                    <span style={s("font-size:13px;font-weight:600;color:#1C1830;line-height:1.4;")}>{step}</span>
                    <span style={s(`font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;${tagBg}`)}>{passed ? "ผ่าน" : "ไม่ผ่าน"}</span>
                  </div>
                  <div style={s("display:flex;gap:8px;margin-top:9px;")}>
                    <button onClick={() => setInspection(p => p.map((v, idx) => idx === i ? true : v))} style={s(`display:flex;align-items:center;gap:5px;height:32px;padding:0 12px;border:0;border-radius:9px;background:#059669;color:#fff;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;${passed ? "" : "opacity:0.7;"}`)}>
                      <Check style={s("width:13px;height:13px;")} /> ผ่าน
                    </button>
                    <button onClick={() => setInspection(p => p.map((v, idx) => idx === i ? false : v))} style={s(`height:32px;padding:0 12px;border:1px solid #FBD5D5;border-radius:9px;background:#fff;color:#DC2626;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;${passed ? "opacity:0.6;" : ""}`)}>ไม่ผ่าน</button>
                  </div>
                </div>
              </div>
            );
          })}
          {recvFailed && (
            <div style={s("display:flex;align-items:flex-start;gap:13px;background:#fff;border:1px solid #FBD5D5;border-left:4px solid #DC2626;border-radius:13px;padding:15px 17px;")}>
              <span style={s("width:38px;height:38px;border-radius:10px;background:#FEF2F2;color:#DC2626;display:flex;align-items:center;justify-content:center;flex:none;")}><AlertOctagon style={s("width:18px;height:18px;")} /></span>
              <div style={s("flex:1;")}>
                <div style={s("font-size:13.5px;font-weight:600;color:#991B1B;")}>บางขั้นไม่ผ่าน — ออกหนังสือแจ้งคู่สัญญา</div>
                <div style={s("font-size:12px;color:#6B6483;margin-top:3px;line-height:1.55;")}>ระบบจะบันทึก Delay + Impact Demand เข้า feedback รอบถัดไป พร้อมหัก reliability score</div>
                <div style={s("display:flex;gap:9px;margin-top:11px;")}>
                  <button style={s("height:34px;padding:0 14px;border:0;border-radius:9px;background:#DC2626;color:#fff;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;")}>ร่างหนังสือแจ้ง</button>
                  <button onClick={() => setInspection(inspectionSteps.map(() => true))} style={s("height:34px;padding:0 14px;border:1px solid #E5E1F0;border-radius:9px;background:#fff;color:#3B3654;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;")}>ตรวจซ้ำหลังแก้ไข</button>
                </div>
              </div>
            </div>
          )}
          {recvDone && (
            <div style={s("display:flex;align-items:flex-start;gap:13px;background:linear-gradient(100deg,#F0FDF9,#ECFDF5);border:1px solid #A7F3D0;border-radius:14px;padding:16px 18px;")}>
              <span style={s("width:42px;height:42px;border-radius:11px;background:#059669;color:#fff;display:flex;align-items:center;justify-content:center;flex:none;box-shadow:0 8px 16px -8px rgba(5,150,105,.6);")}><PackageCheck style={s("width:20px;height:20px;")} /></span>
              <div style={s("flex:1;")}>
                <div style={s("font-size:14px;font-weight:600;color:#0F7B53;")}>ตรวจรับครบทุกขั้น — รับเข้าคลังสำเร็จ</div>
                <div style={s("font-size:12px;color:#3F6B57;margin-top:3px;line-height:1.55;")}>ลงทะเบียนคุมพัสดุ + อัปเดต on-hand คลัง {warehouseId} → <b>Current Stock ตรงจริง AI Suggest แม่นขึ้น</b></div>
                <button onClick={saveLog} style={s("display:inline-flex;align-items:center;gap:7px;margin-top:10px;height:36px;padding:0 16px;border:0;border-radius:10px;background:#059669;color:#fff;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;")}><PackageCheck style={s("width:15px;height:15px;")} /> บันทึกรับเข้าคลัง</button>
              </div>
            </div>
          )}
        </div>

        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            <h2 style={s("margin:0 0 12px;font-size:14px;font-weight:600;color:#1C1830;")}>คณะกรรมการตรวจรับ</h2>
            <div style={s("display:flex;flex-direction:column;gap:10px;")}>
              {[{initials:"ปก",name:"ปกรณ์ วัฒนกุล",role:"ประธานกรรมการ",bg:"linear-gradient(135deg,#C4B5FD,#7C3AED)"},
                {initials:"สม",name:"สมหญิง ใจดี",role:"กรรมการ · จนท.คลัง",bg:"linear-gradient(135deg,#A7F3D0,#059669)"},
                {initials:"ธน",name:"ธนา ศรีสุข",role:"กรรมการ/เลขานุการ",bg:"linear-gradient(135deg,#BFDBFE,#2563EB)"}
              ].map((m, i) => (
                <div key={i} style={s("display:flex;align-items:center;gap:11px;")}>
                  <span style={{width:32,height:32,borderRadius:"50%",background:m.bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,flex:"none"} as CSSProperties}>{m.initials}</span>
                  <div style={s("flex:1;")}><div style={s("font-size:12.5px;font-weight:500;color:#1C1830;")}>{m.name}</div><div style={s("font-size:10.5px;color:#9B95B0;")}>{m.role}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            <h2 style={s("margin:0 0 12px;font-size:14px;font-weight:600;color:#1C1830;")}>เอกสารแนบจากคู่สัญญา</h2>
            <div style={s("display:flex;flex-direction:column;gap:8px;")}>
              {[{ok:true,text:"ใบส่งของ + Packing List"},{ok:true,text:"ใบกำกับภาษี"},{ok:true,text:"สำเนา PO / สัญญา"},{ok:false,text:"ใบรับรอง Type Test / มอก. / PPA"}].map((d,i) => (
                <div key={i} style={s(`display:flex;align-items:center;gap:9px;font-size:12px;${d.ok ? "color:#5A5470;" : "color:#B45309;font-weight:500;"}`)}>{d.ok ? <CheckCircle2 style={s("width:15px;height:15px;color:#059669;")} /> : <AlertTriangle style={s("width:15px;height:15px;color:#D97706;")} />} {d.text}</div>
              ))}
            </div>
          </div>

          <div style={s("background:#FFFBEB;border:1px solid #FBE3A2;border-radius:16px;padding:15px 17px;")}>
            <div style={s("display:flex;align-items:flex-start;gap:9px;")}><Hand style={s("width:16px;height:16px;color:#B45309;margin-top:1px;")} /><div><div style={s("font-size:12.5px;font-weight:600;color:#92400E;")}>Delay & Impact Demand</div><div style={s("font-size:11px;color:#9A7B3F;margin-top:3px;line-height:1.55;")}>ถ้ารับช้า/ไม่ครบ: Impact = Avg Daily Demand × Delay Days ป้อนกลับให้สูตรประเมินความเสี่ยง shortage รอบถัดไป</div>{delayDays > 0 && <div style={s("margin-top:7px;font-size:12.5px;font-weight:600;color:#B45309;")} className="mono">Delay {delayDays} วัน → Impact {formatNumber(impactDemand, 2)} หน่วย</div>}</div></div>
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:14px;padding:14px 16px;")}>
            <div style={s("font-size:12.5px;font-weight:600;color:#1C1830;margin-bottom:11px;")}>บันทึกรับของ</div>
            <div style={s("display:flex;flex-direction:column;gap:8px;")}>
              <div><label style={s("font-size:11px;color:#7B7591;display:block;margin-bottom:3px;")}>วันที่คาดรับ</label><input type="date" value={plannedReceiveDate} onChange={e => setPlannedReceiveDate(e.target.value)} style={s("width:100%;height:36px;padding:0 10px;border:1px solid #E5E1F0;border-radius:9px;background:#fff;font-family:inherit;font-size:12.5px;color:#1C1830;outline:none;box-sizing:border-box;")} /></div>
              <div><label style={s("font-size:11px;color:#7B7591;display:block;margin-bottom:3px;")}>วันที่รับจริง</label><input type="date" value={actualReceiveDate} onChange={e => setActualReceiveDate(e.target.value)} style={s("width:100%;height:36px;padding:0 10px;border:1px solid #E5E1F0;border-radius:9px;background:#fff;font-family:inherit;font-size:12.5px;color:#1C1830;outline:none;box-sizing:border-box;")} /></div>
              <div><label style={s("font-size:11px;color:#7B7591;display:block;margin-bottom:3px;")}>สาเหตุ</label><select value={reasonCategory} onChange={e => setReasonCategory(e.target.value)} style={s("width:100%;height:36px;padding:0 10px;border:1px solid #E5E1F0;border-radius:9px;background:#fff;font-family:inherit;font-size:12.5px;color:#1C1830;outline:none;box-sizing:border-box;")}>{delayReasonOptions.map(r => <option key={r}>{r}</option>)}</select></div>
              <button onClick={saveLog} style={s("width:100%;height:38px;border:0;border-radius:10px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;margin-top:4px;")}>บันทึกรับของ / Delay</button>
            </div>
          </div>
        </div>
      </div>

      {receiptDelayLogs.length > 0 && (
        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;margin-top:18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);overflow:hidden;")}>
          <div style={s("padding:14px 18px;border-bottom:1px solid #F1EEF8;")}><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>Receiving & Delay History ({receiptDelayLogs.length} รายการ)</h2></div>
          <div style={s("overflow-x:auto;")}><table style={s("width:100%;border-collapse:collapse;font-size:12.5px;min-width:700px;")}><thead><tr style={s("background:#FAF9FD;")}><th style={s("text-align:left;font-size:10.5px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 16px;")}>วันที่</th><th style={s("text-align:left;font-size:10.5px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 12px;")}>SKU / คลัง</th><th style={s("text-align:right;font-size:10.5px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 12px;")}>Delay</th><th style={s("text-align:right;font-size:10.5px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 12px;")}>Impact</th><th style={s("text-align:left;font-size:10.5px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 12px;")}>ตรวจรับ</th><th style={s("padding:9px 12px;")}></th></tr></thead>
            <tbody>{receiptDelayLogs.map(log => (<tr key={log.id} className="dash-row" style={s("border-top:1px solid #F4F2FA;")}><td style={s("padding:11px 16px;font-weight:500;color:#1C1830;")}>{log.createdAt}</td><td style={s("padding:11px 12px;")}><div style={s("font-weight:500;color:#1C1830;")}>{log.skuId}</div><div className="mono" style={s("font-size:10px;color:#A29DB5;")}>{log.warehouseId} · {log.supplierId}</div></td><td style={s(`padding:11px 12px;text-align:right;font-weight:600;${log.delayDays > 0 ? "color:#B91C1C;" : "color:#059669;"}`)} className="mono">{log.delayDays} วัน</td><td style={s("padding:11px 12px;text-align:right;color:#1C1830;")} className="mono">{formatNumber(log.impactDemand, 2)}</td><td style={s("padding:11px 12px;")}>{log.inspectionResult ? <span style={s(`font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:99px;${log.inspectionResult === "ผ่าน" ? "color:#059669;background:#D1FAE5;border:1px solid #A7F3D0;" : "color:#DC2626;background:#FEE2E2;border:1px solid #FCA5A5;"}`)}>{log.inspectionResult}</span> : <span style={s("color:#9B95B0;font-size:11px;")}>—</span>}</td><td style={s("padding:11px 12px;")}><button onClick={() => onOpenSku(log.skuId)} style={s("height:28px;padding:0 10px;border:1px solid #E5E1F0;border-radius:8px;background:#fff;color:#5A5470;font-family:inherit;font-size:11px;cursor:pointer;")}>ดู SKU</button></td></tr>))}</tbody>
          </table></div>
        </div>
      )}
    </div>

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

  const usagePeriods = record.historicalUsage.slice(-6);
  const usageMax = Math.max(...usagePeriods.map((period) => period.quantity), 1);
  const usagePeakIndex = usagePeriods.reduce((best, period, index) => (period.quantity > usagePeriods[best].quantity ? index : best), 0);
  const usageAvg = usagePeriods.length > 0 ? usagePeriods.reduce((sum, period) => sum + period.quantity, 0) / usagePeriods.length : 0;
  const offerMinPrice = offers.length > 0 ? Math.min(...offers.map((offer) => offer.unitPrice)) : 0;
  const offerMinLt = offers.length > 0 ? Math.min(...offers.map((offer) => offer.leadTimeDays)) : 0;
  const offerMaxLt = offers.length > 0 ? Math.max(...offers.map((offer) => offer.leadTimeDays)) : 0;

  return (
    <div data-screen-label="SKU Detail">
      <button onClick={onBack} style={s("display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:#7B7591;font-family:inherit;font-size:12.5px;cursor:pointer;padding:0;margin-bottom:14px;")}><ArrowLeft style={s("width:15px;height:15px;")} /> กลับแดชบอร์ด</button>

      <div style={s("display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:20px;")}>
        <div style={s("min-width:0;")}>
          <div style={s("display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap;")}>
            <h1 style={s("margin:0;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>{sku.name}</h1>
            <DashPill status={record.status} />
          </div>
          <div style={s("display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12.5px;color:#7B7591;")}>
            <span className="mono" style={s("color:#6D28D9;background:#F4EEFE;padding:2px 8px;border-radius:6px;font-size:11.5px;")}>{sku.id}</span>
            <span>หมวด {sku.category}</span><span style={s("color:#D5D0E3;")}>·</span>
            <span>คลัง {warehouse.id} · {regionLabels[warehouse.region]}</span><span style={s("color:#D5D0E3;")}>·</span>
            <span>ความสำคัญ <b style={s("color:#5A5470;")}>{sku.criticality}</b></span><span style={s("color:#D5D0E3;")}>·</span>
            <span>หน่วย {sku.unit}</span>
          </div>
        </div>
        <div style={s("display:flex;gap:10px;flex:none;")}>
          <button onClick={onTransfer} style={s("display:flex;align-items:center;gap:7px;height:40px;padding:0 15px;border:1px solid #E5E1F0;border-radius:11px;background:#fff;color:#3B3654;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;")}><ArrowRightLeft style={s("width:16px;height:16px;color:#7C3AED;")} /> โอน/ยืมแทน</button>
          <button onClick={() => onCreateRequest(primarySupplier.id)} style={s("display:flex;align-items:center;gap:7px;height:40px;padding:0 16px;border:0;border-radius:11px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;box-shadow:0 8px 18px -8px rgba(109,40,217,.7);")}><FileText style={s("width:16px;height:16px;")} /> สร้างคำขอซื้อ</button>
        </div>
      </div>

      <div style={s("display:grid;grid-template-columns:1.65fr 1fr;gap:18px;align-items:start;")}>
        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("display:grid;grid-template-columns:repeat(4,1fr);gap:13px;")}>
            <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:14px;padding:14px;box-shadow:0 10px 24px -20px rgba(28,24,48,.4);")}>
              <div style={s("font-size:11.5px;color:#7B7591;font-weight:500;")}>สต็อกปัจจุบัน</div>
              <div style={s("margin-top:7px;font-size:25px;font-weight:600;color:#1C1830;line-height:1;")}>{formatNumber(record.currentStock, 0)} <span style={s("font-size:12px;color:#9B95B0;font-weight:400;")}>{sku.unit}</span></div>
              <div style={s("margin-top:9px;padding-top:8px;border-top:1px solid #F1EEF8;font-size:10px;line-height:1.5;color:#8A849E;")}><b style={s("color:#5A5470;")}>จาก:</b> ยอดคงคลังล่าสุด</div>
            </div>
            <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:14px;padding:14px;box-shadow:0 10px 24px -20px rgba(28,24,48,.4);")}>
              <div style={s("font-size:11.5px;color:#7B7591;font-weight:500;")}>Safety Stock</div>
              <div style={s("margin-top:7px;font-size:25px;font-weight:600;color:#1C1830;line-height:1;")}>{formatNumber(recommendation.safetyStock, 0)} <span style={s("font-size:12px;color:#9B95B0;font-weight:400;")}>{sku.unit}</span></div>
              <div style={s("margin-top:9px;padding-top:8px;border-top:1px solid #F1EEF8;font-size:10px;line-height:1.5;color:#8A849E;")}><b style={s("color:#5A5470;")}>จาก:</b> Z {formatNumber(recommendation.zScore, 2)} × SD × √LT</div>
            </div>
            <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:14px;padding:14px;box-shadow:0 10px 24px -20px rgba(28,24,48,.4);")}>
              <div style={s("font-size:11.5px;color:#7B7591;font-weight:500;")}>Reorder Point</div>
              <div style={s("margin-top:7px;font-size:25px;font-weight:600;color:#B45309;line-height:1;")}>{formatNumber(recommendation.reorderPoint, 0)} <span style={s("font-size:12px;color:#C99A5B;font-weight:400;")}>{sku.unit}</span></div>
              <div style={s("margin-top:9px;padding-top:8px;border-top:1px solid #F1EEF8;font-size:10px;line-height:1.5;color:#8A849E;")}><b style={s("color:#5A5470;")}>จาก:</b> Demand LT + Safety Stock</div>
            </div>
            <div style={s("background:linear-gradient(135deg,#F6F0FF,#EFE6FE);border:1px solid #DCC9FB;border-radius:14px;padding:14px;")}>
              <div style={s("font-size:11.5px;color:#6D28D9;font-weight:600;display:flex;align-items:center;gap:4px;")}><Sparkles style={s("width:13px;height:13px;")} /> AI แนะนำซื้อ</div>
              <div style={s("margin-top:7px;font-size:25px;font-weight:700;color:#6D28D9;line-height:1;")}>+{formatNumber(recommendation.suggestedQuantity, 0)} <span style={s("font-size:12px;color:#9B7BD0;font-weight:400;")}>{sku.unit}</span></div>
              <div style={s("margin-top:9px;padding-top:8px;border-top:1px solid #E1D2F8;font-size:10px;line-height:1.5;color:#7A5BA8;")}><b>จาก:</b> Target {formatNumber(recommendation.targetStockLevel, 0)} − Stock {formatNumber(record.currentStock, 0)}, ปัด MOQ</div>
            </div>
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -24px rgba(28,24,48,.3);overflow:hidden;")}>
            <button onClick={() => setShowExplanation((current) => !current)} style={s("width:100%;display:flex;align-items:center;gap:13px;padding:16px 18px;border:0;background:linear-gradient(100deg,#FBF8FF,#F5EEFE);cursor:pointer;font-family:inherit;text-align:left;")}>
              <span style={s("width:40px;height:40px;border-radius:11px;background:#6D28D9;display:flex;align-items:center;justify-content:center;color:#fff;flex:none;box-shadow:0 8px 16px -8px rgba(109,40,217,.7);")}><Calculator style={s("width:19px;height:19px;")} /></span>
              <div style={s("flex:1;min-width:0;")}>
                <div style={s("font-size:15px;font-weight:600;color:#5B21B6;")}>ทำไมระบบแนะนำค่านี้?</div>
                <div style={s("font-size:12px;color:#8A7AA8;margin-top:1px;")}>อธิบายทุกตัวเลขจากค่าจริงของ SKU นี้ · สูตรเวอร์ชัน {formulaPolicy.formulaVersion}</div>
              </div>
              <ChevronDown style={s("width:18px;height:18px;color:#6D28D9;transform:rotate(" + (showExplanation ? "180deg" : "0deg") + ");transition:transform .2s;")} />
            </button>
            {showExplanation ? (
            <div style={s("padding:18px;")}>
              <div style={s("font-size:11px;font-weight:600;letter-spacing:.5px;color:#9B95B0;text-transform:uppercase;margin-bottom:9px;")}>ข้อมูลที่ใช้คำนวณ (ค่าจริง)</div>
              <div style={s("display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:18px;")}>
                {[
                  { k: "ใช้ย้อนหลัง", v: `${formatNumber(recommendation.historicalUsageTotal, 0)} ${sku.unit} / ${recommendation.historicalUsageDays} วัน` },
                  { k: "Lead Time (ฐาน)", v: `${formatNumber(recommendation.supplierLeadTimeDays, 0)} วัน` },
                  { k: "Service Level → Z", v: `${Math.round(recommendation.serviceLevel * 100)}% → ${formatNumber(recommendation.zScore, 2)}` },
                  { k: "Seasonal Factor", v: `× ${formatNumber(recommendation.seasonalFactor, 2)}` },
                  { k: "MOQ / หน่วย", v: `${formatNumber(recommendation.moq, 0)} ${sku.unit}` },
                  { k: "Target policy", v: `${formatNumber(recommendation.targetStockLevel, 0)} ${sku.unit}` },
                ].map((item) => (
                  <div key={item.k} style={s("background:#FAF9FD;border:1px solid #F0EDF7;border-radius:10px;padding:9px 11px;")}><div style={s("font-size:10.5px;color:#9B95B0;")}>{item.k}</div><div className="mono" style={s("font-size:13px;font-weight:600;color:#1C1830;margin-top:2px;")}>{item.v}</div></div>
                ))}
              </div>

              <div style={s("font-size:11px;font-weight:600;letter-spacing:.5px;color:#9B95B0;text-transform:uppercase;margin-bottom:9px;")}>ขั้นตอนการคำนวณ</div>
              <div style={s("position:relative;padding-left:26px;")}>
                <div style={s("position:absolute;left:9px;top:6px;bottom:18px;width:2px;background:#EDE6FA;")} />
                {[
                  { n: 1, t: "ความต้องการเฉลี่ยต่อวัน", f: `${formatNumber(recommendation.historicalUsageTotal, 0)} ${sku.unit} ÷ ${recommendation.historicalUsageDays} วัน = `, r: `${formatNumber(recommendation.averageDailyDemand, 2)} ${sku.unit}/วัน`, rc: "#6D28D9", bg: "linear-gradient(135deg,#6D28D9,#C0249B)" },
                  { n: 2, t: "Lead Time ปรับฤดูกาล", f: `${formatNumber(recommendation.supplierLeadTimeDays, 0)} × ${formatNumber(recommendation.seasonalFactor, 2)} × ${formatNumber(recommendation.budgetFactor, 2)} = `, r: `${formatNumber(recommendation.adjustedLeadTimeDays, 0)} วัน`, rc: "#6D28D9", bg: "linear-gradient(135deg,#6D28D9,#C0249B)" },
                  { n: 3, t: "Demand ระหว่าง Lead Time", f: `${formatNumber(recommendation.averageDailyDemand, 2)} × ${formatNumber(recommendation.adjustedLeadTimeDays, 0)} = `, r: `${formatNumber(recommendation.demandDuringLeadTime, 0)} ${sku.unit}`, rc: "#6D28D9", bg: "linear-gradient(135deg,#6D28D9,#C0249B)" },
                  { n: 4, t: "Safety Stock", f: `${formatNumber(recommendation.zScore, 2)} × SD(${formatNumber(recommendation.demandVariabilityPerDay, 1)}) × √${formatNumber(recommendation.adjustedLeadTimeDays, 0)} = `, r: `${formatNumber(recommendation.safetyStock, 0)} ${sku.unit}`, rc: "#6D28D9", bg: "linear-gradient(135deg,#6D28D9,#C0249B)" },
                  { n: 5, t: "Reorder Point", f: `${formatNumber(recommendation.demandDuringLeadTime, 0)} + ${formatNumber(recommendation.safetyStock, 0)} = `, r: `${formatNumber(recommendation.reorderPoint, 0)} ${sku.unit}`, rc: "#B45309", bg: "#B45309" },
                  { n: 6, t: "จำนวนที่ AI แนะนำ", f: `Target ${formatNumber(recommendation.targetStockLevel, 0)} − Stock ${formatNumber(record.currentStock, 0)} = ${formatNumber(rawSuggestedQuantity, 0)} → ปัด MOQ ${formatNumber(recommendation.moq, 0)} = `, r: `${formatNumber(recommendation.suggestedQuantity, 0)} ${sku.unit}`, rc: "#6D28D9", bg: "linear-gradient(135deg,#6D28D9,#C0249B)" },
                ].map((step) => (
                  <div key={step.n} style={s("position:relative;margin-bottom:13px;")}>
                    <span style={s("position:absolute;left:-26px;top:0;width:20px;height:20px;border-radius:50%;background:" + step.bg + ";color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;")}>{step.n}</span>
                    <div style={s("font-size:13px;font-weight:600;color:#1C1830;")}>{step.t}</div>
                    <div className="mono" style={s("font-size:11.5px;color:#7B7591;margin-top:3px;")}>{step.f}<b style={s("color:" + step.rc + ";")}>{step.r}</b></div>
                  </div>
                ))}
              </div>

              <div style={s("display:flex;align-items:flex-start;gap:9px;margin-top:18px;background:#F0FDF9;border:1px solid #B6EBD7;border-radius:11px;padding:11px 13px;")}>
                <ShieldCheck style={s("width:16px;height:16px;color:#059669;margin-top:1px;flex:none;")} />
                <div style={s("font-size:11.5px;color:#3F6B57;line-height:1.55;")}><b style={s("color:#0F7B53;")}>เก็บ Calculation Snapshot:</b> ทุกค่าด้านบนจะถูกบันทึก ณ เวลาที่สร้างคำขอ — ตรวจย้อนหลังได้แม้ราคา/สูตร/งบเปลี่ยนภายหลัง</div>
              </div>
            </div>
            ) : null}
          </div>
        </div>

        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;")}><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>การใช้รายเดือน</h2><span style={s("font-size:11px;color:#9B95B0;")}>{usagePeriods.length} เดือน · {sku.unit}</span></div>
            <div style={s("display:flex;align-items:flex-end;gap:9px;height:110px;margin-top:16px;")}>
              {usagePeriods.map((period, index) => (
                <div key={index} style={s("flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px;height:100%;")}>
                  <div style={s("width:100%;border-radius:5px 5px 0 0;height:" + Math.max(Math.round((period.quantity / usageMax) * 80), period.quantity > 0 ? 8 : 3) + "px;background:" + (index === usagePeakIndex ? "#6D28D9" : "#D6C2F7") + ";")} />
                  <span style={s("font-size:10px;color:" + (index === usagePeakIndex ? "#7C3AED" : "#A29DB5") + ";" + (index === usagePeakIndex ? "font-weight:600;" : ""))}>{period.periodLabel}</span>
                </div>
              ))}
            </div>
            <div style={s("margin-top:13px;display:flex;justify-content:space-between;font-size:11px;")}><span style={s("color:#7B7591;")}>เฉลี่ย <b style={s("color:#1C1830;")}>{formatNumber(usageAvg, 0)} {sku.unit}/เดือน</b></span><span style={s("color:#B45309;")}>▲ ฤดูฝน +{Math.round((recommendation.seasonalFactor - 1) * 100)}%</span></div>
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            <h2 style={s("margin:0 0 3px;font-size:14px;font-weight:600;color:#1C1830;")}>เทียบซัพพลายเออร์</h2>
            <p style={s("margin:0 0 13px;font-size:11px;color:#9B95B0;")}>ราคา · Lead Time · MOQ · ความเชื่อถือ</p>
            <div style={s("display:flex;flex-direction:column;gap:10px;")}>
              {offers.map((offer, index) => {
                const supplier = getSupplier(offer.supplierId);
                const isAi = index === 0;
                const reliability = Math.round((offer.reliabilityScore ?? 0.9) * 100);
                return (
                  <div key={offer.supplierId} onClick={() => onSupplier(supplier.id)} style={s(isAi ? "border:1.5px solid #C9B0F2;background:#FBF8FF;border-radius:12px;padding:11px 12px;cursor:pointer;" : "border:1px solid #EBE7F5;border-radius:12px;padding:11px 12px;cursor:pointer;")}>
                    <div style={s("display:flex;align-items:center;justify-content:space-between;gap:8px;")}>
                      <div style={s("font-size:12.5px;font-weight:600;color:#1C1830;")}>{supplier.name}</div>
                      {isAi ? <span style={s("font-size:9.5px;font-weight:600;color:#fff;background:#6D28D9;padding:2px 8px;border-radius:99px;flex:none;")}>AI แนะนำ</span> : offer.unitPrice === offerMinPrice ? <span style={s("font-size:9.5px;font-weight:500;color:#B45309;background:#FFFAEB;padding:2px 8px;border-radius:99px;flex:none;")}>ถูกสุด</span> : null}
                    </div>
                    <div style={s("display:flex;gap:14px;margin-top:8px;font-size:11px;")}>
                      <span style={s("color:#7B7591;")}>฿<b style={s("color:" + (offer.unitPrice === offerMinPrice ? "#059669" : "#1C1830") + ";")}>{formatNumber(offer.unitPrice, 0)}</b>/{offer.unit}</span>
                      <span style={s("color:#7B7591;")}>LT <b style={s("color:" + (offer.leadTimeDays === offerMinLt ? "#059669" : offer.leadTimeDays === offerMaxLt ? "#B91C1C" : "#1C1830") + ";")}>{offer.leadTimeDays}</b>ว.</span>
                      <span style={s("color:#7B7591;")}>MOQ <b style={s("color:#1C1830;")}>{offer.moq}</b></span>
                      <span style={s("color:" + (reliability >= 95 ? "#059669" : "#5A5470") + ";font-weight:600;")}>{reliability}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
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

  const bestSupplierId = (() => {
    let best = "", bestScore = -1;
    for (const sup of filteredSuppliers) {
      const offers = supplierOfferData.filter(o => o.supplierId === sup.id);
      const avgRel = offers.length ? offers.reduce((sum, o) => sum + (o.reliabilityScore ?? 0), 0) / offers.length : 0;
      if (avgRel > bestScore) { bestScore = avgRel; best = sup.id; }
    }
    return best;
  })();
  const bestSupplier = filteredSuppliers.find(s => s.id === bestSupplierId);

  return (
    <div>
      <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px;")}>
        <div>
          <h1 style={s("margin:0 0 5px;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>ซัพพลายเออร์</h1>
          <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>ราคา · Lead Time · MOQ · ความเชื่อถือ · พัสดุที่รองรับ · ประวัติการติดต่อ</p>
        </div>
        <div style={s("display:flex;gap:8px;align-items:center;")}>
          <div style={s("position:relative;")}><Search style={s("position:absolute;left:11px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:#9B95B0;")} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..." style={s("height:38px;padding:0 12px 0 34px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;font-family:inherit;font-size:12.5px;color:#1C1830;outline:none;width:220px;")} /></div>
          <button onClick={() => setShowAddSupplier(c => !c)} style={s("display:flex;align-items:center;gap:6px;height:38px;padding:0 14px;border:0;border-radius:10px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;")}><Plus style={s("width:14px;height:14px;")} /> เพิ่มซัพพลายเออร์</button>
        </div>
      </div>

      {bestSupplier && (
        <div style={s("display:flex;align-items:center;gap:14px;background:linear-gradient(100deg,#FBF4FF,#FCE9F5);border:1px solid #E6D8FB;border-radius:14px;padding:14px 18px;margin-bottom:18px;")}>
          <span style={s("width:40px;height:40px;border-radius:11px;background:#fff;border:1px solid #E6D8FB;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}><Sparkles style={s("width:19px;height:19px;")} /></span>
          <div style={s("flex:1;min-width:0;")}>
            <div style={s("font-size:13.5px;font-weight:600;color:#5B21B6;")}>AI แนะนำซัพพลายเออร์</div>
            <div style={s("font-size:12px;color:#6B6483;margin-top:2px;")}>เลือก <b style={s("color:#3B1170;")}>{bestSupplier.name}</b> คุ้มสุดจากคะแนนรวม ราคา × Lead Time × reliability</div>
          </div>
        </div>
      )}

      {showAddSupplier && (
        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:14px;padding:18px;margin-bottom:16px;")}>
          <SupplierProfileForm mode="create" onSave={saveSupplier} />
        </div>
      )}

      <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:16px;")}>
        {filteredSuppliers.map(supplier => {
          const offers = supplierOfferData.filter(o => o.supplierId === supplier.id);
          const offer = offers[0];
          const avgRel = offers.length ? Math.round(offers.reduce((sum, o) => sum + (o.reliabilityScore ?? 0), 0) / offers.length * 100) : null;
          const isRec = supplier.id === bestSupplierId;
          const cardBorder = isRec ? "border:1.5px solid #C9B0F2;background:#FBF8FF;" : "border:1px solid #EBE7F5;background:#fff;";
          const statusInfo = getSupplierStatus(supplier.id, supplierOfferData);
          const hasSlowLead = offers.some(o => o.leadTimeDays > 30);
          const chipBg = statusInfo === "No Catalog" ? "color:#6B7280;background:#F9FAFB;border:1px solid #E5E7EB;" : hasSlowLead ? "color:#B45309;background:#FFFAEB;border:1px solid #FBE3A2;" : "";
          const chipLabel = statusInfo === "No Catalog" ? "ไม่มีรายการ" : hasSlowLead ? "ช้า" : "";
          const skuNames = offers.map(o => { const sk = getSku(o.skuId); return sk.category; }).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(" · ");
          return (
            <div key={supplier.id} style={s(`${cardBorder}border-radius:16px;padding:18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);`)}>
              <div style={s("display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px;")}>
                <div><div style={s("font-size:15px;font-weight:600;color:#1C1830;")}>{supplier.name}</div><div style={s("font-size:11.5px;color:#7B7591;margin-top:2px;")}>{supplier.contactPerson} · {regionLabels[supplier.coverage]}</div></div>
                {isRec ? <span style={s("font-size:9.5px;font-weight:600;color:#fff;background:#6D28D9;padding:3px 9px;border-radius:99px;flex:none;")}>AI แนะนำ</span> : chipLabel ? <span style={s(`font-size:9.5px;font-weight:500;padding:3px 9px;border-radius:99px;flex:none;${chipBg}`)}>{chipLabel}</span> : null}
              </div>
              <div style={s("display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:13px;")}>
                {offer ? <>
                  <div style={s(`border-radius:9px;padding:8px;text-align:center;${isRec ? "background:#fff;border:1px solid #EBE7F5;" : "background:#FAF9FD;border:1px solid #F0EDF7;"}`)}><div style={s("font-size:9.5px;color:#9B95B0;")}>ราคา/{offer.unit}</div><div style={s("font-size:13px;font-weight:600;color:#1C1830;")} className="mono">{formatTHB(offer.unitPrice)}</div></div>
                  <div style={s(`border-radius:9px;padding:8px;text-align:center;${isRec ? "background:#fff;border:1px solid #EBE7F5;" : "background:#FAF9FD;border:1px solid #F0EDF7;"}`)}><div style={s("font-size:9.5px;color:#9B95B0;")}>Lead</div><div style={s(`font-size:13px;font-weight:600;${offer.leadTimeDays > 30 ? "color:#B91C1C;" : "color:#1C1830;"}`)} className="mono">{offer.leadTimeDays}ว.</div></div>
                  <div style={s(`border-radius:9px;padding:8px;text-align:center;${isRec ? "background:#fff;border:1px solid #EBE7F5;" : "background:#FAF9FD;border:1px solid #F0EDF7;"}`)}><div style={s("font-size:9.5px;color:#9B95B0;")}>MOQ</div><div style={s("font-size:13px;font-weight:600;color:#1C1830;")} className="mono">{offer.moq}</div></div>
                  <div style={s(`border-radius:9px;padding:8px;text-align:center;${isRec ? "background:#fff;border:1px solid #EBE7F5;" : "background:#FAF9FD;border:1px solid #F0EDF7;"}`)}><div style={s("font-size:9.5px;color:#9B95B0;")}>เชื่อถือ</div><div style={s(`font-size:13px;font-weight:600;${avgRel !== null && avgRel >= 90 ? "color:#059669;" : avgRel !== null && avgRel >= 80 ? "color:#5A5470;" : "color:#9B95B0;"}`)} className="mono">{avgRel !== null ? `${avgRel}%` : "—"}</div></div>
                </> : <div style={s("grid-column:span 4;text-align:center;font-size:11px;color:#9B95B0;padding:8px;")}>ยังไม่มีข้อเสนอ</div>}
              </div>
              <div style={s("display:flex;gap:14px;font-size:11.5px;color:#7B7591;margin-bottom:11px;flex-wrap:wrap;")}>
                <span style={s("display:flex;align-items:center;gap:5px;")}><Phone style={s("width:13px;height:13px;color:#9B95B0;")} /> {supplier.phone}</span>
                <span style={s("display:flex;align-items:center;gap:5px;")}><Mail style={s("width:13px;height:13px;color:#9B95B0;")} /> {supplier.email}</span>
              </div>
              <div style={s("font-size:11px;color:#9B95B0;border-top:1px solid #F1EEF8;padding-top:10px;display:flex;align-items:center;justify-content:space-between;gap:8px;")}>
                <span>รองรับ: {skuNames || "ไม่ระบุ"}</span>
                <button onClick={() => { onSelectSupplier(supplier.id); onOpenDetail(); }} style={s("height:28px;padding:0 10px;border:1px solid #E5E1F0;border-radius:8px;background:#fff;color:#5A5470;font-family:inherit;font-size:11px;cursor:pointer;white-space:nowrap;")}>รายละเอียด →</button>
              </div>
            </div>
          );
        })}

        {contactLogs.length > 0 && (
          <div style={s("border:1px solid #EBE7F5;background:#fff;border-radius:16px;padding:18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);display:flex;flex-direction:column;justify-content:flex-start;")}>
            <h2 style={s("margin:0 0 12px;font-size:14px;font-weight:600;color:#1C1830;")}>ประวัติการติดต่อล่าสุด</h2>
            <div style={s("display:flex;flex-direction:column;gap:10px;")}>
              {contactLogs.slice(0, 5).map((log, i) => (
                <div key={i} style={s("display:flex;gap:10px;")}>
                  <span style={s("width:7px;height:7px;border-radius:50%;background:#7C3AED;margin-top:5px;flex:none;")}></span>
                  <div><div style={s("font-size:12px;color:#1C1830;")}>{log.purpose}</div><div style={s("font-size:10.5px;color:#9B95B0;")}>{log.supplierId} · {log.createdAt}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
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
  const borrowAlt = findDeadStockForSkuElsewhere(sku.id, record.warehouseId);
  const borrowSavings = borrowAlt ? Math.min(requestedQuantity, borrowAlt.qty) * offer.unitPrice : 0;
  const moqStep = offer.moq > 0 ? offer.moq : 1;
  const routeMeta =
    recommendedLayer === "Local"
      ? { label: "อนุมัติระดับคลัง", color: "#0F7B53", bg: "#ECFDF5" }
      : recommendedLayer === "Regional"
        ? { label: "อนุมัติระดับเขต", color: "#1D4ED8", bg: "#EFF4FF" }
        : { label: "อนุมัติส่วนกลาง", color: "#B45309", bg: "#FFFAEB" };
  const budgetTiers = [
    { key: "Local", label: `งบคลัง ${warehouse.id}`, remaining: budget.localBudgetRemaining, icon: <WarehouseIcon style={s("width:15px;height:15px;color:#5A5470;")} /> },
    { key: "Regional", label: `งบเขต · ${regionLabels[warehouse.region]}`, remaining: budget.regionalBudgetRemaining, icon: <Building2 style={s("width:15px;height:15px;color:#5A5470;")} /> },
    { key: "Central", label: "งบส่วนกลาง", remaining: budget.centralBudgetRemaining, icon: <Landmark style={s("width:15px;height:15px;color:#5A5470;")} /> },
  ];

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
    <div data-screen-label="Create PR">
      <button onClick={onBack} style={s("display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:#7B7591;font-family:inherit;font-size:12.5px;cursor:pointer;padding:0;margin-bottom:14px;")}><ArrowLeft style={s("width:15px;height:15px;")} /> กลับ SKU</button>

      <div style={s("margin-bottom:20px;")}>
        <h1 style={s("margin:0 0 5px;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>สร้างคำขอซื้อ</h1>
        <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>กรอกจำนวนที่ต้องการ ระบบจะตรวจงบ 3 ชั้นและเก็บ Snapshot ให้อัตโนมัติ</p>
      </div>

      <div style={s("display:grid;grid-template-columns:1.55fr 1fr;gap:18px;align-items:start;")}>
        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #EBE7F5;border-radius:14px;padding:14px 16px;box-shadow:0 12px 28px -24px rgba(28,24,48,.4);")}>
            <span style={s("width:44px;height:44px;border-radius:11px;background:#F4EEFE;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}><Cable style={s("width:21px;height:21px;")} /></span>
            <div style={s("flex:1;min-width:0;")}>
              <div style={s("font-size:14px;font-weight:600;color:#1C1830;")}>{sku.name}</div>
              <div className="mono" style={s("font-size:11px;color:#A29DB5;margin-top:2px;")}>{sku.id} · คลัง {warehouse.id} · หน่วย {sku.unit}</div>
            </div>
            <div style={s("text-align:right;flex:none;")}><div style={s("font-size:11px;color:#9B95B0;")}>ซัพพลายเออร์</div><div style={s("font-size:12.5px;font-weight:600;color:#1C1830;")}>{supplier.name} · ฿{formatNumber(offer.unitPrice, 0)}/{offer.unit}</div></div>
          </div>

          {borrowAlt ? (
          <div style={s("display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #FBE3A2;border-left:4px solid #D97706;border-radius:14px;padding:13px 16px;")}>
            <span style={s("width:40px;height:40px;border-radius:11px;background:#FFFAEB;color:#D97706;display:flex;align-items:center;justify-content:center;flex:none;")}><Hand style={s("width:20px;height:20px;")} /></span>
            <div style={s("flex:1;min-width:0;")}>
              <div style={s("font-size:13px;font-weight:600;color:#92400E;")}>เบรกก่อน! ของชนิดนี้มีเหลือที่คลังอื่น</div>
              <div style={s("font-size:11.5px;color:#7B6A45;margin-top:2px;")}>คลัง <b style={s("color:#5A4A28;")}>{borrowAlt.warehouseId}</b> มีของชนิดเดียวกันเหลือ {formatNumber(borrowAlt.qty, 0)} {borrowAlt.unit} — โอนแทนซื้อ ประหยัด <b style={s("color:#B45309;")}>{formatTHB(borrowSavings)}</b></div>
            </div>
            <button onClick={() => onOpenTransfer(sku.id)} style={s("display:flex;align-items:center;gap:6px;height:38px;padding:0 14px;border:0;border-radius:10px;background:#D97706;color:#fff;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;flex:none;")}>ขอโอนแทน <ArrowRight style={s("width:15px;height:15px;")} /></button>
          </div>
          ) : null}

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:18px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;")}>
              <h2 style={s("margin:0;font-size:15px;font-weight:600;color:#1C1830;")}>จำนวนที่ขอซื้อ</h2>
              <div style={s("display:flex;align-items:center;gap:7px;font-size:11.5px;color:#6D28D9;background:#F4EEFE;border:1px solid #E4D7FB;padding:4px 10px;border-radius:99px;")}><Sparkles style={s("width:13px;height:13px;")} /> AI แนะนำ <b>{formatNumber(recommendation.suggestedQuantity, 0)} {sku.unit}</b></div>
            </div>
            <div style={s("display:flex;align-items:center;gap:16px;")}>
              <div style={s("display:flex;align-items:center;border:1px solid #E5E1F0;border-radius:12px;overflow:hidden;")}>
                <button onClick={() => setRequestedQuantity(Math.max(1, requestedQuantity - moqStep))} style={s("width:44px;height:48px;border:0;background:#FAF9FD;color:#6D28D9;font-size:20px;cursor:pointer;font-family:inherit;")}>−</button>
                <div className="mono" style={s("width:84px;text-align:center;font-size:24px;font-weight:600;color:#1C1830;")}>{formatNumber(requestedQuantity, 0)}</div>
                <button onClick={() => setRequestedQuantity(requestedQuantity + moqStep)} style={s("width:44px;height:48px;border:0;background:#FAF9FD;color:#6D28D9;font-size:20px;cursor:pointer;font-family:inherit;")}>+</button>
              </div>
              <div style={s("font-size:13px;color:#7B7591;")}>{sku.unit}</div>
              <div style={s("flex:1;")} />
              <div style={s("text-align:right;")}>
                <div style={s("font-size:11.5px;color:#9B95B0;")}>ต่างจาก AI</div>
                <div style={s("font-size:16px;font-weight:600;color:" + (variance.variance === 0 ? "#0F7B53" : "#B45309") + ";")}>{variance.variance > 0 ? "+" : ""}{formatNumber(variance.variance, 0)} {sku.unit} <span style={s("font-size:12px;color:#C99A5B;")}>({formatPercent(variance.variancePercent)})</span></div>
              </div>
            </div>

            {quantityDiffers ? (
            <div style={s("margin-top:16px;border:1px solid #FBE3A2;background:#FFFBEB;border-radius:12px;padding:13px 14px;")}>
              <div style={s("display:flex;align-items:center;gap:8px;margin-bottom:8px;")}><AlertTriangle style={s("width:15px;height:15px;color:#B45309;")} /><span style={s("font-size:12.5px;font-weight:600;color:#92400E;")}>ต้องระบุเหตุผล — ขอ{variance.isOverRequest ? "มากกว่า" : "น้อยกว่า"}ที่ AI แนะนำ</span></div>
              <select value={reasonCategory} onChange={(event) => setReasonCategory(event.target.value)} style={s("width:100%;margin-bottom:8px;border:1px solid #F0D78A;border-radius:10px;background:#fff;padding:8px 11px;font-family:inherit;font-size:12.5px;color:#1C1830;outline:none;")}>
                <option value="">เลือกเหตุผล</option>
                {reasonOptions.map((reason) => <option key={reason}>{reason}</option>)}
              </select>
              <textarea value={reasonText} onChange={(event) => setReasonText(event.target.value)} placeholder="เช่น เตรียมงานขยายเขตจำหน่ายไตรมาสหน้า…" style={s("width:100%;min-height:60px;border:1px solid #F0D78A;border-radius:10px;background:#fff;padding:9px 11px;font-family:inherit;font-size:12.5px;color:#1C1830;outline:none;resize:vertical;")} />
              <div style={s("font-size:10.5px;color:#B0894B;margin-top:6px;")}>เหตุผลนี้จะถูกบันทึกใน Audit Trail และส่งให้ผู้อนุมัติเห็น</div>
            </div>
            ) : null}
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:18px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);")}>
            <h2 style={s("margin:0 0 12px;font-size:15px;font-weight:600;color:#1C1830;")}>ซัพพลายเออร์</h2>
            <div style={s("display:flex;gap:10px;flex-wrap:wrap;")}>
              {supplierOfferData.filter((item) => item.skuId === skuId).map((item) => {
                const itemSupplier = getSupplier(item.supplierId);
                const selected = item.supplierId === chosenSupplierId;
                return (
                  <label key={item.supplierId} onClick={() => setChosenSupplierId(item.supplierId)} style={s((selected ? "border:1.5px solid #C9B0F2;background:#FBF8FF;" : "border:1px solid #EBE7F5;background:#fff;") + "flex:1;min-width:160px;border-radius:12px;padding:12px;cursor:pointer;")}>
                    <div style={s("display:flex;align-items:center;justify-content:space-between;gap:8px;")}><span style={s("font-size:12.5px;font-weight:600;color:#1C1830;")}>{itemSupplier.name}</span><span style={s(selected ? "width:16px;height:16px;border-radius:50%;border:5px solid #6D28D9;flex:none;" : "width:16px;height:16px;border-radius:50%;border:2px solid #D5D0E3;flex:none;")} /></div>
                    <div style={s("font-size:11px;color:#7B7591;margin-top:7px;")}>฿{formatNumber(item.unitPrice, 0)} · LT {item.leadTimeDays}ว. · เชื่อถือ {Math.round((item.reliabilityScore ?? 0.9) * 100)}%</div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:18px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 34px -24px rgba(28,24,48,.32);")}>
            <div style={s("font-size:12px;color:#7B7591;margin-bottom:5px;")}>มูลค่าประเมิน</div>
            <div style={s("font-size:30px;font-weight:700;color:#1C1830;line-height:1;")}>{formatTHB(estimatedCost)}</div>
            <div className="mono" style={s("font-size:11px;color:#9B95B0;margin-top:5px;")}>{formatNumber(requestedQuantity, 0)} {sku.unit} × ฿{formatNumber(offer.unitPrice, 0)}</div>
            <div style={s("margin-top:13px;display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;padding:5px 11px;border-radius:99px;color:" + routeMeta.color + ";background:" + routeMeta.bg + ";")}><Route style={s("width:13px;height:13px;")} /> {routeMeta.label}</div>
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:18px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 34px -24px rgba(28,24,48,.32);")}>
            <h2 style={s("margin:0 0 4px;font-size:14px;font-weight:600;color:#1C1830;")}>ตรวจงบประมาณ 3 ชั้น</h2>
            <p style={s("margin:0 0 14px;font-size:11px;color:#9B95B0;")}>ระบบเลือกชั้นอนุมัติให้อัตโนมัติตามมูลค่า</p>
            <div style={s("display:flex;flex-direction:column;gap:10px;")}>
              {budgetTiers.map((tier) => {
                const active = recommendedLayer === tier.key;
                const enough = estimatedCost <= tier.remaining;
                return (
                  <div key={tier.key} style={s("display:flex;align-items:center;gap:12px;border-radius:12px;padding:12px 13px;" + (active ? "background:linear-gradient(100deg,#F4EEFE,#FBF4FF);border:1px solid #C9B0F2;" : "background:#FAF9FD;border:1px solid #F0EDF7;"))}>
                    <span style={s("width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;flex:none;")}>{tier.icon}</span>
                    <div style={s("flex:1;min-width:0;")}><div style={s("font-size:12.5px;font-weight:600;color:#1C1830;")}>{tier.label}</div><div className="mono" style={s("font-size:10.5px;color:#7B7591;")}>คงเหลือ {formatTHB(tier.remaining)}</div></div>
                    <span style={s("font-size:10.5px;font-weight:600;flex:none;color:" + (active ? "#6D28D9" : enough ? "#0F7B53" : "#B91C1C") + ";")}>{active ? "ส่งที่นี่" : enough ? "งบพอ" : "เกินงบ"}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 34px -24px rgba(28,24,48,.32);")}>
            <div style={s("display:flex;align-items:flex-start;gap:9px;margin-bottom:13px;")}>
              <Camera style={s("width:16px;height:16px;color:#7C3AED;margin-top:1px;flex:none;")} />
              <div style={s("font-size:11.5px;color:#6B6483;line-height:1.5;")}>เมื่อกดส่ง ระบบจะเก็บ <b style={s("color:#5B21B6;")}>Calculation Snapshot</b> (สูตร {formulaPolicy.formulaVersion}, demand, lead time, ราคา, งบ, เหตุผล) เพื่อตรวจย้อนหลัง</div>
            </div>
            <button
              disabled={!canSubmit}
              onClick={() => onSubmit(buildRequest(recommendedLayer === "Local" ? "Pending Local" : "Pending Regional"))}
              style={s("width:100%;height:46px;border:0;border-radius:12px;font-family:inherit;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;" + (canSubmit ? "background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;cursor:pointer;box-shadow:0 12px 24px -10px rgba(109,40,217,.7);" : "background:#EDE9F6;color:#A29DB5;cursor:not-allowed;"))}
            >
              <Send style={s("width:17px;height:17px;")} /> {submitLabel}
            </button>
            <button onClick={() => onContactSupplier(supplier.id)} style={s("width:100%;height:38px;margin-top:9px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;")}><Phone style={s("width:14px;height:14px;color:#7C3AED;")} /> ติดต่อซัพพลายเออร์</button>
          </div>
        </div>
      </div>
    </div>
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
    <div>
      <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:20px;")}>
        <div>
          <h1 style={s("margin:0 0 5px;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>ศูนย์อนุมัติคำขอซื้อ</h1>
          <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>คิวตรวจระดับเขตและคิวอนุมัติส่วนกลาง พร้อมข้อมูล AI งบประมาณ และ Calculation Snapshot</p>
        </div>
      </div>

      <div style={s("display:inline-flex;background:#F4F2FA;border-radius:11px;padding:4px;gap:3px;margin-bottom:18px;")}>
        {(["regional","central"] as const).map(tab => {
          const active = approvalTab === tab;
          const count = tab === "regional" ? regionalQueue.length : centralQueue.length;
          return (
            <button key={tab} onClick={() => onSetTab(tab)} style={s("border:0;border-radius:9px;padding:6px 14px;font-family:inherit;font-size:12.5px;cursor:pointer;transition:all .15s;" + (active ? "background:#fff;color:#6D28D9;font-weight:600;box-shadow:0 2px 6px -2px rgba(28,24,48,.2);" : "background:transparent;color:#7B7591;font-weight:400;"))}>
              {tab === "regional" ? "คิวอนุมัติระดับเขต" : "คิวอนุมัติส่วนกลาง"}{" "}
              <span style={s("display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;font-size:10px;font-weight:700;margin-left:4px;" + (active ? "background:#6D28D9;color:#fff;" : "background:#D5D0E3;color:#7B7591;"))}>{count}</span>
            </button>
          );
        })}
      </div>

      <div style={s("display:grid;grid-template-columns:360px minmax(0,1fr);gap:18px;align-items:start;")}>
        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
          <div style={s("display:flex;align-items:center;justify-content:space-between;padding:15px 18px 12px;border-bottom:1px solid #F1EEF8;")}>
            <div>
              <h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>{approvalTab === "regional" ? "คิวระดับเขต" : "คิวส่วนกลาง"}</h2>
              <p style={s("margin:2px 0 0;font-size:11px;color:#9B95B0;")}>รอตรวจ {queue.length} รายการ</p>
            </div>
          </div>
          <div style={s("display:flex;flex-direction:column;")}>
            {queue.length === 0 ? (
              <div style={s("padding:32px;text-align:center;color:#9B95B0;font-size:12.5px;")}>ไม่มีคำขอรออนุมัติ</div>
            ) : queue.map(request => {
              const sku = getSku(request.skuId);
              const isSelected = selected?.id === request.id;
              return (
                <div key={request.id} onClick={() => onSelectRequest(request.id)} className="dash-row" style={s("display:flex;align-items:center;gap:13px;padding:12px 18px;border-bottom:1px solid #F4F2FA;cursor:pointer;" + (isSelected ? "background:#F4EEFE;" : ""))}>
                  <div style={s("width:36px;height:36px;border-radius:10px;background:#F4EEFE;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}>
                    <FileText style={s("width:17px;height:17px;")} />
                  </div>
                  <div style={s("flex:1;min-width:0;")}>
                    <div style={s("font-size:13px;font-weight:600;color:#1C1830;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;")}>{sku.name}</div>
                    <div style={s("display:flex;align-items:center;gap:6px;margin-top:2px;")}>
                      <span className="mono" style={s("font-size:10px;color:#9B95B0;")}>{request.id}</span>
                    </div>
                  </div>
                  <div style={s("text-align:right;flex:none;")}>
                    <div style={s("font-size:12.5px;font-weight:600;color:#1C1830;")}>{formatTHB(request.estimatedCost)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selected ? (
          approvalTab === "regional" ? (
            <RegionalReviewDetail request={selected} contactLogs={contactLogs} onAction={onAction} onContactSupplier={onContactSupplier} onCalculation={onCalculation} />
          ) : (
            <CentralReviewDetail request={selected} contactLogs={contactLogs} onAction={onAction} onContactSupplier={onContactSupplier} onCalculation={onCalculation} />
          )
        ) : (
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:48px;text-align:center;color:#9B95B0;font-size:13px;")}>ไม่มีรายการรออนุมัติในคิวนี้</div>
        )}
      </div>
    </div>
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

  const varPct = request.variancePercent;
  return (
    <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
      <div style={s("display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px;border-bottom:1px solid #F1EEF8;")}>
        <div>
          <div style={s("font-size:15px;font-weight:600;color:#1C1830;")}>{sku.name}</div>
          <div style={s("display:flex;align-items:center;gap:6px;margin-top:3px;")}>
            <span className="mono" style={s("font-size:10.5px;color:#6D28D9;background:#F4EEFE;padding:2px 8px;border-radius:6px;")}>{request.id}</span>
            <span style={s("font-size:11px;color:#9B95B0;")}>{warehouse.name}</span>
          </div>
        </div>
        <DashPill status={request.status === "Approved" ? "Normal" : request.status === "Rejected" ? "Critical" : "Near Reorder Point"} />
      </div>

      <div style={s("display:grid;grid-template-columns:repeat(3,1fr);gap:9px;padding:16px 18px;")}>
        {[
          { label: "AI แนะนำ", value: `${request.aiSuggestedQuantity} ${request.unit}`, accent: true },
          { label: "จำนวนที่ขอ", value: `${request.requestedQuantity} ${request.unit}`, accent: false },
          { label: "ส่วนต่าง AI", value: `${varPct > 0 ? "+" : ""}${formatNumber(varPct)}%`, accent: false },
          { label: "มูลค่าประมาณ", value: formatTHB(request.estimatedCost), accent: false },
          { label: "Lead Time", value: `${request.leadTimeDays} วัน`, accent: false },
          { label: "ราคา/หน่วย", value: `${formatTHB(request.calculationSnapshot.unitPriceAtRequestDate)}`, accent: false },
          { label: "Safety Stock", value: `${formatNumber(request.calculationSnapshot.safetyStock)} ${request.unit}`, accent: false },
          { label: "Reorder Point", value: `${formatNumber(request.calculationSnapshot.reorderPoint)} ${request.unit}`, accent: false },
          { label: "ซัพพลายเออร์", value: supplier.name, accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} style={s("background:" + (accent ? "#F6F0FF" : "#FAF9FD") + ";border:1px solid " + (accent ? "#DCC9FB" : "#F0EDF7") + ";border-radius:9px;padding:9px 11px;")}>
            <div style={s("font-size:10px;color:" + (accent ? "#7A5BA8" : "#9B95B0") + ";")}>{label}</div>
            <div className="mono" style={s("font-size:12.5px;font-weight:600;color:" + (accent ? "#6D28D9" : "#1C1830") + ";margin-top:2px;")}>{value}</div>
          </div>
        ))}
      </div>

      <div style={s("display:grid;grid-template-columns:repeat(3,1fr);gap:9px;padding:0 18px 14px;")}>
        {[
          { label: "งบคลัง", remaining: request.localBudgetRemaining },
          { label: "งบเขต", remaining: request.regionalBudgetRemaining },
          { label: "งบส่วนกลาง", remaining: request.centralBudgetRemaining },
        ].map(({ label, remaining }) => {
          const enough = remaining >= request.estimatedCost;
          return (
            <div key={label} style={s("border:1px solid " + (enough ? "#B6EBD7" : "#FBD5D5") + ";border-radius:9px;padding:9px 11px;background:" + (enough ? "#F0FDF9" : "#FEF2F2") + ";")}>
              <div style={s("font-size:10px;color:" + (enough ? "#3F6B57" : "#9B6B6B") + ";")}>{label}</div>
              <div className="mono" style={s("font-size:12px;font-weight:600;color:" + (enough ? "#0F7B53" : "#B91C1C") + ";margin-top:2px;")}>{formatTHB(remaining)}</div>
              <div style={s("font-size:9.5px;color:" + (enough ? "#3F6B57" : "#B91C1C") + ";margin-top:2px;")}>{enough ? "งบพอ" : "เกินงบ"}</div>
            </div>
          );
        })}
      </div>

      <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:0 18px 14px;border-top:1px solid #F1EEF8;padding-top:14px;")}>
        <div style={s("background:#FAF9FD;border:1px solid #F0EDF7;border-radius:11px;padding:12px 13px;")}>
          <div style={s("font-size:12px;font-weight:600;color:#1C1830;margin-bottom:5px;")}>เหตุผลขอต่างจาก AI</div>
          <div style={s("font-size:11.5px;color:#5A5470;font-weight:500;")}>{request.overrideReasonCategory ?? "ไม่มีการขอต่างจาก AI"}</div>
          <div style={s("font-size:11px;color:#9B95B0;margin-top:4px;line-height:1.5;")}>{request.overrideReasonText ?? "จำนวนที่ขอตรงกับ AI"}</div>
        </div>
        <div style={s("background:#FAF9FD;border:1px solid #F0EDF7;border-radius:11px;padding:12px 13px;")}>
          <div style={s("font-size:12px;font-weight:600;color:#1C1830;margin-bottom:5px;")}>เส้นทางอนุมัติ</div>
          <div style={s("font-size:11px;color:#5A5470;line-height:1.55;")}>{request.calculationSnapshot.approvalRoutingAtRequestDate.reason}</div>
        </div>
      </div>

      <div style={s("display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;border-top:1px solid #F1EEF8;padding:13px 18px;")}>
        <button onClick={() => onCalculation(request)} style={s("height:36px;padding:0 13px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;")}><Calculator style={s("width:14px;height:14px;color:#7C3AED;")} /> Snapshot</button>
        <button onClick={() => onContactSupplier(supplier.id)} style={s("height:36px;padding:0 13px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;")}><Phone style={s("width:14px;height:14px;color:#7C3AED;")} /> ติดต่อ</button>
        <button onClick={() => onAction(request.id, "More Info", "Request More Info", "ขอข้อมูลเพิ่มเติมจากคลัง")} style={s("height:36px;padding:0 13px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;")}>ขอข้อมูลเพิ่ม</button>
        <button onClick={() => onAction(request.id, "Rejected", "Rejected", "ไม่อนุมัติคำขอ")} style={s("height:36px;padding:0 14px;border:1px solid #FBD5D5;border-radius:10px;background:#fff;color:#DC2626;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;")}>ไม่อนุมัติ</button>
        {mustPassCentral ? (
          <button onClick={() => onAction(request.id, "Pending Central", "Approve & Pass to Central", "งบระดับเขตไม่เพียงพอ ส่งต่อส่วนกลาง")} style={s("height:36px;padding:0 14px;border:0;border-radius:10px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;")}>อนุมัติ → ส่งต่อส่วนกลาง</button>
        ) : (
          <button onClick={() => onAction(request.id, "Approved", "Approved", "อนุมัติตามปริมาณที่ขอ")} style={s("height:36px;padding:0 16px;border:0;border-radius:10px;background:#059669;color:#fff;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 8px 16px -8px rgba(5,150,105,.6);")}><Check style={s("width:14px;height:14px;display:inline;margin-right:5px;")} />อนุมัติ</button>
        )}
      </div>
    </div>
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
    <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
      <div style={s("display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px;border-bottom:1px solid #F1EEF8;")}>
        <div>
          <div style={s("font-size:15px;font-weight:600;color:#1C1830;")}>{sku.name}</div>
          <div style={s("display:flex;align-items:center;gap:6px;margin-top:3px;")}>
            <span className="mono" style={s("font-size:10.5px;color:#6D28D9;background:#F4EEFE;padding:2px 8px;border-radius:6px;")}>{request.id}</span>
            <span style={s("font-size:11px;color:#9B95B0;")}>ส่งต่อจากเขต</span>
          </div>
        </div>
        <span style={s("font-size:10px;font-weight:600;color:#fff;background:#7C3AED;padding:3px 10px;border-radius:99px;")}>ส่วนกลาง</span>
      </div>

      <div style={s("display:grid;grid-template-columns:repeat(4,1fr);gap:9px;padding:16px 18px;")}>
        {[
          { label: "มูลค่าคำขอ", value: formatTHB(request.estimatedCost) },
          { label: "ส่วนต่างงบ", value: formatTHB(budgetGap) },
          { label: "ซัพพลายเออร์", value: supplier.name },
          { label: "ราคา/หน่วย", value: `${formatTHB(request.unitPrice)}` },
          { label: "Safety Stock", value: `${formatNumber(request.calculationSnapshot.safetyStock)} ${request.unit}` },
          { label: "Reorder Point", value: `${formatNumber(request.calculationSnapshot.reorderPoint)} ${request.unit}` },
          { label: "ส่วนต่าง AI", value: formatPercent(request.calculationSnapshot.quantityVariancePercent) },
          { label: "เส้นทางอนุมัติ", value: getApprovalLayerLabel(request.calculationSnapshot.approvalRoutingAtRequestDate.layer) },
        ].map(({ label, value }) => (
          <div key={label} style={s("background:#FAF9FD;border:1px solid #F0EDF7;border-radius:9px;padding:9px 11px;")}>
            <div style={s("font-size:10px;color:#9B95B0;")}>{label}</div>
            <div className="mono" style={s("font-size:12px;font-weight:600;color:#1C1830;margin-top:2px;")}>{value}</div>
          </div>
        ))}
      </div>

      <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:0 18px 14px;border-top:1px solid #F1EEF8;padding-top:14px;")}>
        <div style={s("background:#FAF9FD;border:1px solid #F0EDF7;border-radius:11px;padding:12px 13px;")}>
          <div style={s("font-size:12px;font-weight:600;color:#1C1830;margin-bottom:5px;")}>เหตุผลจากคลังพื้นที่</div>
          <div style={s("font-size:11px;color:#5A5470;line-height:1.55;")}>{request.localReason}</div>
        </div>
        <div style={s("background:#FAF9FD;border:1px solid #F0EDF7;border-radius:11px;padding:12px 13px;")}>
          <div style={s("font-size:12px;font-weight:600;color:#1C1830;margin-bottom:5px;")}>เหตุผลที่เขตส่งต่อ</div>
          <div style={s("font-size:11px;color:#5A5470;line-height:1.55;")}>{request.regionalEscalationReason}</div>
        </div>
        <div style={s("background:#FAF9FD;border:1px solid #F0EDF7;border-radius:11px;padding:12px 13px;")}>
          <div style={s("font-size:12px;font-weight:600;color:#1C1830;margin-bottom:5px;")}>ซัพพลายเออร์</div>
          <div style={s("font-size:11px;color:#5A5470;line-height:1.5;")}>{supplier.contactPerson} · {supplier.phone}</div>
          <div style={s("font-size:11px;color:#9B95B0;margin-top:2px;")}>LT {request.leadTimeDays}ว. · MOQ {request.moq} {request.unit}</div>
        </div>
        <div style={s("background:#FAF9FD;border:1px solid #F0EDF7;border-radius:11px;padding:12px 13px;")}>
          <div style={s("font-size:12px;font-weight:600;color:#1C1830;margin-bottom:5px;")}>ประวัติติดต่อ</div>
          <div style={s("font-size:11px;color:#5A5470;line-height:1.5;")}>{request.supplierContactLogSummary}</div>
          <div style={s("font-size:10px;color:#9B95B0;margin-top:3px;")}>{logs.length} บันทึก</div>
        </div>
      </div>

      <div style={s("display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;border-top:1px solid #F1EEF8;padding:13px 18px;")}>
        <button onClick={() => onCalculation(request)} style={s("height:36px;padding:0 13px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;")}><Calculator style={s("width:14px;height:14px;color:#7C3AED;")} /> Snapshot</button>
        <button onClick={() => onContactSupplier(supplier.id)} style={s("height:36px;padding:0 13px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;")}><Phone style={s("width:14px;height:14px;color:#7C3AED;")} /> ติดต่อ</button>
        <button onClick={() => onAction(request.id, "More Info", "Request More Info", "ส่วนกลางขอข้อมูลเพิ่มเติม")} style={s("height:36px;padding:0 13px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;")}>ขอข้อมูลเพิ่ม</button>
        <button onClick={() => onAction(request.id, "Rejected", "Central Reject", "ส่วนกลางไม่อนุมัติ")} style={s("height:36px;padding:0 14px;border:1px solid #FBD5D5;border-radius:10px;background:#fff;color:#DC2626;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;")}>ไม่อนุมัติ</button>
        <button onClick={() => onAction(request.id, "Approved", "Central Approve", "อนุมัติโดยส่วนกลาง")} style={s("height:36px;padding:0 16px;border:0;border-radius:10px;background:#059669;color:#fff;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;box-shadow:0 8px 16px -8px rgba(5,150,105,.6);display:flex;align-items:center;gap:6px;")}><Check style={s("width:14px;height:14px;")} />ส่วนกลางอนุมัติ</button>
      </div>
    </div>
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
    <div>
      <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:18px;")}>
        <div>
          <h1 style={s("margin:0 0 5px;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>ประวัติ &amp; Audit Trail</h1>
          <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>เส้นเวลาการอนุมัติ + Calculation Snapshot ที่ล็อกค่า ณ เวลานั้น — อ่านจาก snapshot ไม่คำนวณใหม่</p>
        </div>
        <div style={s("display:flex;align-items:center;gap:9px;")}>
          <button style={s("display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 13px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;")}><FileDown style={s("width:15px;height:15px;color:#7C3AED;")} /> Export PDF</button>
          {selected && <div className="mono" style={s("display:flex;align-items:center;gap:7px;font-size:11.5px;color:#6D28D9;background:#F4EEFE;border:1px solid #E4D7FB;padding:6px 11px;border-radius:10px;")}><Lock style={s("width:13px;height:13px;")} /> {selected.id}</div>}
        </div>
      </div>

      <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:14px;padding:11px 14px;margin-bottom:16px;")}>
        <div style={s("display:grid;grid-template-columns:1fr auto auto;gap:9px;")}>
          <div style={s("position:relative;")}>
            <Search style={s("position:absolute;left:10px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:#9B95B0;")} />
            <input style={s("width:100%;height:36px;border:1px solid #E5E1F0;border-radius:10px;background:#FAF9FD;padding:0 12px 0 33px;font-family:inherit;font-size:13px;color:#1C1830;outline:none;box-sizing:border-box;")} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหารหัสคำขอ / รายการ / ซัพพลายเออร์" />
          </div>
          <select style={s("height:36px;border:1px solid #E5E1F0;border-radius:10px;background:#FAF9FD;padding:0 28px 0 11px;font-family:inherit;font-size:12.5px;color:#3B3654;outline:none;")}><option>ทุกสถานะ</option><option>อนุมัติแล้ว</option><option>รออนุมัติ</option><option>ไม่อนุมัติ</option></select>
          <select style={s("height:36px;border:1px solid #E5E1F0;border-radius:10px;background:#FAF9FD;padding:0 28px 0 11px;font-family:inherit;font-size:12.5px;color:#3B3654;outline:none;")}><option>สูตร v1.0</option></select>
        </div>
      </div>

      <div style={s("display:grid;grid-template-columns:1.55fr 1fr;gap:18px;align-items:start;")}>
        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
          <div style={s("padding:15px 18px 12px;border-bottom:1px solid #F1EEF8;")}>
            <h2 style={s("margin:0;font-size:15px;font-weight:600;color:#1C1830;")}>ตารางประวัติคำขอ</h2>
          </div>
          <table style={s("width:100%;border-collapse:collapse;font-size:12.5px;")}>
            <thead><tr style={s("background:#FAF9FD;")}>
              {["รหัสคำขอ","รายการ","สถานะ","AI แนะนำ","ขอ","อนุมัติ"].map(h => (
                <th key={h} style={s("text-align:left;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:8px 14px;")}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(req => {
                const sku = getSku(req.skuId);
                const isActive = selected?.id === req.id;
                return (
                  <tr key={req.id} className="dash-row" onClick={() => onSelectRequest(req.id)}
                    style={s("border-top:1px solid #F4F2FA;cursor:pointer;" + (isActive ? "background:#F6F0FF;" : ""))}>
                    <td style={s("padding:10px 14px;")}><span className="mono" style={s("font-size:11px;font-weight:600;color:#6D28D9;background:#F4EEFE;padding:2px 7px;border-radius:6px;")}>{req.id}</span></td>
                    <td style={s("padding:10px 14px;font-size:12.5px;font-weight:500;color:#1C1830;")}>{sku.name}</td>
                    <td style={s("padding:10px 14px;")}><DashPill status={req.status} /></td>
                    <td style={s("padding:10px 14px;text-align:right;")}><span className="mono" style={s("font-size:12px;color:#6D28D9;")}>{req.aiSuggestedQuantity}</span></td>
                    <td style={s("padding:10px 14px;text-align:right;")}><span className="mono" style={s("font-size:12px;color:#1C1830;")}>{req.requestedQuantity}</span></td>
                    <td style={s("padding:10px 14px;text-align:right;")}><span className="mono" style={s("font-size:12px;color:#059669;")}>{req.approvedQuantity ?? "—"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {selected ? <HistoryDetail request={selected} logs={logs} aiFeedbackLogs={selectedFeedbackLogs} onSaveFeedback={onSaveFeedback} /> : null}
      </div>
    </div>
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
    <div style={s("display:flex;flex-direction:column;gap:16px;")}>
      <div style={s("display:flex;align-items:center;gap:16px;background:#fff;border:1px solid #EBE7F5;border-radius:14px;padding:14px 18px;box-shadow:0 12px 28px -24px rgba(28,24,48,.4);")}>
        <span style={s("width:44px;height:44px;border-radius:11px;background:#F4EEFE;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}><Cable style={s("width:21px;height:21px;")} /></span>
        <div style={s("flex:1;min-width:0;")}>
          <div style={s("font-size:14px;font-weight:600;color:#1C1830;")}>{sku.name} · {request.requestedQuantity} {request.unit}</div>
          <div className="mono" style={s("font-size:11px;color:#A29DB5;margin-top:2px;")}>{sku.id} · {supplier.name}</div>
        </div>
        <DashPill status={request.status} />
      </div>

      <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;")}>
        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:18px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);")}>
            <h2 style={s("margin:0 0 16px;font-size:15px;font-weight:600;color:#1C1830;")}>เส้นเวลาการอนุมัติ</h2>
            <div style={s("position:relative;padding-left:28px;")}>
              <div style={s("position:absolute;left:10px;top:6px;bottom:14px;width:2px;background:#EDE6FA;")}></div>
              {request.timeline.map((item, i) => (
                <div key={i} style={s("position:relative;margin-bottom:15px;")}>
                  <span style={s("position:absolute;left:-28px;top:0;width:22px;height:22px;border-radius:50%;background:#F4EEFE;display:flex;align-items:center;justify-content:center;")}><History style={s("width:13px;height:13px;color:#7C3AED;")} /></span>
                  <div style={s("font-size:13px;font-weight:600;color:#1C1830;")}>{item.action}</div>
                  <div style={s("font-size:11px;color:#9B95B0;margin-top:2px;")}>{item.actor} · {item.date}</div>
                  {item.note && <div style={s("font-size:11.5px;color:#3F6B57;background:#F0FDF9;border:1px solid #B6EBD7;border-radius:8px;padding:6px 9px;margin-top:6px;")}>{item.note}</div>}
                </div>
              ))}
            </div>
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
            <div style={s("display:flex;align-items:center;gap:11px;padding:15px 18px;background:linear-gradient(100deg,#FBF8FF,#F5EEFE);border-bottom:1px solid #EFE6FB;")}>
              <Lock style={s("width:16px;height:16px;color:#6D28D9;")} />
              <div style={s("flex:1;")}><div style={s("font-size:14px;font-weight:600;color:#5B21B6;")}>Calculation Snapshot</div><div style={s("font-size:11px;color:#8A7AA8;")}>ล็อกค่า ณ เวลาส่งคำขอ · {request.formulaVersion} · ไม่ถูกแก้ย้อนหลัง</div></div>
              <span className="mono" style={s("font-size:10px;color:#7C3AED;background:#F4EEFE;padding:3px 8px;border-radius:6px;")}>{request.id}</span>
            </div>
            <div style={s("padding:16px 18px;display:grid;grid-template-columns:repeat(3,1fr);gap:9px;")}>
              {[
                {label:"Avg Daily Demand",value:`${formatNumber(request.calculationSnapshot.averageDailyDemand)} ${request.unit}/วัน`},
                {label:"Demand SD",value:formatNumber(request.calculationSnapshot.demandVariabilityPerDay)},
                {label:"Adjusted LT",value:`${request.calculationSnapshot.adjustedLeadTimeDays} วัน`},
                {label:"Safety Stock",value:`${formatNumber(request.calculationSnapshot.safetyStock)} ${request.unit}`},
                {label:"Reorder Point",value:`${formatNumber(request.calculationSnapshot.reorderPoint)} ${request.unit}`},
                {label:"Target Stock",value:`${formatNumber(request.calculationSnapshot.targetStockLevel)} ${request.unit}`},
                {label:"AI Suggested",value:`${formatNumber(request.calculationSnapshot.suggestedQuantity)} ${request.unit}`,violet:true},
                {label:"Requested",value:`${formatNumber(request.requestedQuantity)} ${request.unit}`,amber:true},
                {label:"Estimated Cost",value:formatTHB(request.estimatedCost)},
              ].map(({label,value,violet,amber}: {label:string;value:string;violet?:boolean;amber?:boolean}) => (
                <div key={label} style={s("border-radius:9px;padding:9px 11px;" + (violet ? "background:#F6F0FF;border:1px solid #DCC9FB;" : amber ? "background:#FFFBEB;border:1px solid #FBE3A2;" : "background:#FAF9FD;border:1px solid #F0EDF7;"))}>
                  <div style={s("font-size:10px;" + (violet ? "color:#7A5BA8;" : amber ? "color:#9A7B3F;" : "color:#9B95B0;"))}>{label}</div>
                  <div className="mono" style={s("font-size:12px;font-weight:600;margin-top:2px;" + (violet ? "color:#6D28D9;" : amber ? "color:#B45309;" : "color:#1C1830;"))}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            <div style={s("display:flex;align-items:center;gap:8px;margin-bottom:5px;")}><Repeat2 style={s("width:16px;height:16px;color:#6D28D9;")} /><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>AI Feedback (Closed loop)</h2></div>
            <p style={s("margin:0 0 14px;font-size:11px;color:#9B95B0;")}>เทียบค่าจริงกับที่ AI แนะนำ เพื่อปรับสูตรรอบถัดไป</p>
            <div style={s("display:flex;gap:10px;margin-bottom:13px;")}>
              <div style={s("flex:1;text-align:center;background:#F6F0FF;border:1px solid #DCC9FB;border-radius:11px;padding:11px 8px;")}><div style={s("font-size:10.5px;color:#7A5BA8;")}>AI แนะนำ</div><div className="mono" style={s("font-size:19px;font-weight:700;color:#6D28D9;")}>{formatNumber(request.aiSuggestedQuantity)}</div></div>
              <div style={s("flex:1;text-align:center;background:#FAF9FD;border:1px solid #EBE7F5;border-radius:11px;padding:11px 8px;")}><div style={s("font-size:10.5px;color:#9B95B0;")}>ใส่จริง</div>
                <input style={s("width:100%;background:transparent;border:0;font-size:19px;font-weight:700;color:#1C1830;text-align:center;font-family:'IBM Plex Mono',monospace;outline:none;")} type="number" value={actualQuantity} onChange={(e) => setActualQuantity(Number(e.target.value))} />
              </div>
              <div style={s("flex:1;text-align:center;background:#FFFBEB;border:1px solid #FBE3A2;border-radius:11px;padding:11px 8px;")}><div style={s("font-size:10.5px;color:#9A7B3F;")}>Error</div><div className="mono" style={s("font-size:19px;font-weight:700;color:#B45309;")}>{formatPercent(previewError.errorPercent)}</div></div>
            </div>
            <div style={s("background:#F0FDF9;border:1px solid #B6EBD7;border-radius:11px;padding:11px 13px;margin-bottom:10px;")}>
              <div style={s("display:flex;align-items:flex-start;gap:8px;")}><GitBranch style={s("width:15px;height:15px;color:#059669;margin-top:1px;")} /><div style={s("font-size:11.5px;color:#3F6B57;line-height:1.55;")}>หมายเหตุ: <input style={s("background:transparent;border:0;outline:none;font-family:inherit;font-size:11.5px;color:#3F6B57;width:calc(100% - 20px);")} value={feedbackNote} onChange={e => setFeedbackNote(e.target.value)} /></div></div>
            </div>
            <button onClick={() => onSaveFeedback(request, actualQuantity, feedbackNote)} style={s("width:100%;height:40px;border:0;border-radius:11px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;")}><Sparkles style={s("width:15px;height:15px;")} /> บันทึก AI Feedback</button>
            {aiFeedbackLogs.length > 0 && (
              <div style={s("margin-top:12px;display:flex;flex-direction:column;")}>
                {aiFeedbackLogs.map(fb => (
                  <div key={fb.id} style={s("display:flex;align-items:center;justify-content:space-between;font-size:11.5px;padding:7px 0;border-top:1px solid #F4F2FA;")}>
                    <span style={s("color:#7B7591;")}>{fb.createdAt}</span>
                    <span className="mono" style={s("color:#1C1830;")}>{formatNumber(fb.actualQuantity)} {request.unit}</span>
                    <span className="mono" style={s("font-weight:600;" + (fb.errorPercent > 0 ? "color:#B91C1C;" : "color:#059669;"))}>{formatPercent(fb.errorPercent)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            <h2 style={s("margin:0 0 12px;font-size:14px;font-weight:600;color:#1C1830;")}>ความสมบูรณ์ของหลักฐาน</h2>
            <div style={s("display:flex;flex-direction:column;gap:9px;")}>
              {["Snapshot อ่านจากค่าที่ล็อกไว้","Audit trail ครบทุก action",request.overrideReasonText ? "เหตุผล override บันทึกถาวร" : null].filter(Boolean).map(label => (
                <div key={label as string} style={s("display:flex;align-items:center;gap:9px;font-size:12px;color:#5A5470;")}><CheckCircle2 style={s("width:15px;height:15px;color:#059669;")} /> {label}</div>
              ))}
            </div>
            <div style={s("margin-top:12px;font-size:10.5px;color:#9B95B0;line-height:1.55;border-top:1px solid #F1EEF8;padding-top:10px;")}>ตอบโจทย์ธรรมาภิบาล (Audit Committee) — ตรวจย้อนหลังได้แม้ราคา/สูตร/งบเปลี่ยน</div>
          </div>

          {logs.length > 0 && (
            <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
              <h2 style={s("margin:0 0 12px;font-size:14px;font-weight:600;color:#1C1830;")}>ประวัติติดต่อซัพพลายเออร์</h2>
              <div style={s("display:flex;flex-direction:column;gap:8px;")}>
                {logs.map(log => (
                  <div key={log.id} style={s("font-size:11.5px;color:#5A5470;background:#FAF9FD;border-radius:9px;padding:8px 11px;")}>{log.createdAt} · {getContactChannelLabel(log.channel)} · {log.note}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VmiCandidatePage({ onSimulation, openSku }: { onSimulation: () => void; openSku: (skuId: string) => void }) {
  return (
    <div>
      <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:18px;")}>
        <div>
          <div style={s("display:flex;align-items:center;gap:10px;margin-bottom:5px;")}>
            <h1 style={s("margin:0;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>VMI — Vendor Managed Inventory</h1>
            <span style={s("display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#7C3AED;background:#F4EEFE;border:1px solid #E4D7FB;padding:3px 9px;border-radius:99px;")}>Simulation</span>
          </div>
          <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>จำลองผลถ้าให้ซัพพลายเออร์ดูแลสต็อก — เทียบ Current Model กับ VMI (ยังไม่ใช่การเติมจริง)</p>
        </div>
      </div>

      <div style={s("display:grid;grid-template-columns:1.5fr 1fr;gap:18px;align-items:start;")}>
        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
          <div style={s("padding:15px 18px 12px;border-bottom:1px solid #F1EEF8;")}>
            <h2 style={s("margin:0;font-size:15px;font-weight:600;color:#1C1830;")}>VMI Candidate Rankings</h2>
          </div>
          <div style={s("padding:6px 0;")}>
            <div style={s("display:grid;grid-template-columns:1fr 1fr 1fr 80px 80px;padding:9px 18px;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;border-bottom:1px solid #F4F2FA;")}>
              <span>SKU</span><span>เสถียรภาพ</span><span>ความน่าเชื่อถือ</span><span style={s("text-align:right;")}>คะแนน</span><span></span>
            </div>
            {vmiCandidates.map(candidate => {
              const sku = getSku(candidate.skuId);
              return (
                <div key={candidate.skuId} style={s("display:grid;grid-template-columns:1fr 1fr 1fr 80px 80px;align-items:center;padding:12px 18px;border-top:1px solid #F4F2FA;font-size:12.5px;")}>
                  <div><div style={s("font-weight:600;color:#1C1830;")}>{sku.name}</div><div className="mono" style={s("font-size:10px;color:#A29DB5;")}>{sku.id}</div></div>
                  <span style={s("color:#5A5470;")}>{getDemandStabilityLabel(candidate.demandStability)}</span>
                  <span style={s("color:#059669;font-weight:600;")}>{candidate.supplierReliability}%</span>
                  <span className="mono" style={s("text-align:right;font-size:17px;font-weight:700;color:#6D28D9;")}>{candidate.score}</span>
                  <div style={s("display:flex;gap:6px;justify-content:flex-end;")}>
                    <button onClick={() => openSku(candidate.skuId)} style={s("height:30px;padding:0 10px;border:1px solid #E5E1F0;border-radius:8px;background:#fff;color:#3B3654;font-family:inherit;font-size:11px;font-weight:500;cursor:pointer;")}>SKU</button>
                    <button onClick={onSimulation} style={s("height:30px;padding:0 10px;border:0;border-radius:8px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:11px;font-weight:600;cursor:pointer;")}>จำลอง</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("background:linear-gradient(140deg,#5B21B6,#A41CA8);border-radius:16px;padding:18px;box-shadow:0 16px 32px -18px rgba(109,40,217,.6);")}>
            <div style={s("font-size:12px;color:rgba(255,255,255,.78);")}>VMI Suitability Score — อันดับ 1</div>
            <div className="mono" style={s("font-size:30px;font-weight:700;color:#fff;margin-top:5px;line-height:1;")}>{vmiCandidates[0]?.score ?? "—"}<span style={s("font-size:15px;")}>/100</span></div>
            <div style={s("font-size:11.5px;color:rgba(255,255,255,.72);margin-top:7px;")}>{vmiCandidates[0] ? `${getSku(vmiCandidates[0].skuId).name} · demand สม่ำเสมอ · ซัพพลายเออร์น่าเชื่อถือ` : "-"}</div>
          </div>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            <div style={s("display:flex;align-items:center;gap:8px;margin-bottom:5px;")}><Sparkles style={s("width:16px;height:16px;color:#6D28D9;")} /><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>สรุปจากระบบ AI</h2></div>
            <p style={s("font-size:12px;color:#6B6483;line-height:1.6;margin:10px 0;")}>ระบบแนะนำ {vmiCandidates[0] ? getSku(vmiCandidates[0].skuId).name : "-"} เป็นรายการเหมาะกับ VMI อันดับหนึ่ง เพราะความต้องการใช้มีเสถียรภาพสูง ซัพพลายเออร์มีความน่าเชื่อถือ {vmiCandidates[0]?.supplierReliability ?? "-"}%</p>
            <button onClick={onSimulation} style={s("width:100%;height:40px;border:0;border-radius:11px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;")}><Workflow style={s("width:15px;height:15px;")} /> เปิดการจำลอง VMI</button>
          </div>
        </div>
      </div>
    </div>
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
    <div>
      <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:18px;")}>
        <div>
          <h1 style={s("margin:0 0 5px;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>จำลอง VMI — เปรียบเทียบโมเดลคลัง</h1>
          <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>จำลองผลถ้าให้ซัพพลายเออร์ดูแลสต็อก — ยังไม่ใช่การเติมของจริง</p>
        </div>
        <button onClick={onBack} style={s("display:flex;align-items:center;gap:6px;height:36px;padding:0 14px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;")}><ArrowLeft style={s("width:15px;height:15px;")} /> ย้อนกลับ</button>
      </div>

      <div style={s("display:grid;grid-template-columns:1.5fr 1fr;gap:18px;align-items:start;")}>
        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
          <div style={s("display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid #F1EEF8;")}>
            <h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>เปรียบเทียบ: หม้อแปลง 100kVA</h2>
            <span className="mono" style={s("font-size:10.5px;color:#7C3AED;background:#F4EEFE;padding:3px 8px;border-radius:6px;")}>1DD0DC0000</span>
          </div>
          <div style={s("padding:6px 0;")}>
            <div style={s("display:grid;grid-template-columns:1.4fr 1fr 1fr;padding:9px 18px;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;")}>
              <span>ตัวชี้วัด</span><span style={s("text-align:right;")}>Current</span><span style={s("text-align:right;color:#6D28D9;")}>VMI</span>
            </div>
            {rows.map(row => (
              <div key={row.metric} style={s("display:grid;grid-template-columns:1.4fr 1fr 1fr;padding:11px 18px;border-top:1px solid #F4F2FA;font-size:12.5px;")}>
                <span style={s("color:#5A5470;")}>{row.metric}</span>
                <span style={s("text-align:right;color:#1C1830;")}>{row.current}</span>
                <span style={s("text-align:right;color:#6D28D9;font-weight:600;")}>{row.vmi}</span>
              </div>
            ))}
          </div>
          <div style={s("margin:0 18px 16px;background:#F0FDF9;border:1px solid #B6EBD7;border-radius:11px;padding:11px 13px;font-size:11.5px;color:#3F6B57;line-height:1.55;")}>
            <b style={s("color:#0F7B53;")}>ผลจำลอง:</b> ลด Lead Time + ลดเงินจม + งานสั่งซื้อ manual ลดลง
          </div>
        </div>

        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("background:linear-gradient(140deg,#5B21B6,#A41CA8);border-radius:16px;padding:18px;box-shadow:0 16px 32px -18px rgba(109,40,217,.6);")}>
            <div style={s("font-size:12px;color:rgba(255,255,255,.78);")}>VMI Suitability Score</div>
            <div className="mono" style={s("font-size:30px;font-weight:700;color:#fff;margin-top:5px;line-height:1;")}>{vmiCandidates[0]?.score ?? "82"}<span style={s("font-size:15px;")}>/100</span></div>
            <div style={s("font-size:11.5px;color:rgba(255,255,255,.72);margin-top:7px;")}>เหมาะกับ VMI — มูลค่าสูง · Lead Time ยาว · demand สม่ำเสมอ</div>
          </div>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            <div style={s("display:flex;align-items:center;gap:8px;margin-bottom:10px;")}><Sparkles style={s("width:16px;height:16px;color:#6D28D9;")} /><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>คำแนะนำ AI</h2></div>
            <div style={s("background:#F4EEFE;border-radius:11px;padding:12px 14px;font-size:12px;font-weight:500;color:#5B21B6;line-height:1.55;margin-bottom:13px;")}>{getVmiRecommendation(vmiCandidates[0]?.score ?? 82)} · คะแนน {vmiCandidates[0]?.score ?? 82}</div>
            <div style={s("display:flex;flex-direction:column;gap:9px;")}>
              <button onClick={onCreateProposal} style={s("height:40px;border:0;border-radius:11px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;")}><Plus style={s("width:15px;height:15px;")} /> สร้างข้อเสนอ VMI</button>
              <button style={s("height:38px;border:1px solid #E5E1F0;border-radius:11px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;")}><FileText style={s("width:15px;height:15px;color:#7C3AED;")} /> เปรียบเทียบกับการจัดซื้อปกติ</button>
            </div>
          </div>
        </div>
      </div>
    </div>
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

// หน้านำเข้าข้อมูล (Data Import) — พอร์ตจากดีไซน์ HTML เป็นต้นแบบจำลอง (mock) ครบทั้ง dropzone · column mapping · data quality
function DataImportPage({ onBack }: { onBack: () => void }) {
  const [dataset, setDataset] = useState<"usage" | "stock" | "lead" | "supplier">("usage");
  const datasets: { id: "usage" | "stock" | "lead" | "supplier"; label: string }[] = [
    { id: "usage", label: "การใช้รายเดือน" },
    { id: "stock", label: "สต็อก (BATCH)" },
    { id: "lead", label: "Lead Time" },
    { id: "supplier", label: "ซัพพลายเออร์" },
  ];
  const chip = (active: boolean) =>
    s(
      `height:34px;padding:0 14px;border-radius:99px;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;${
        active
          ? "border:0;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;"
          : "border:1px solid #E5E1F0;background:#fff;color:#5A5470;"
      }`,
    );
  const mappings: { from: string; to: string; warn?: boolean }[] = [
    { from: "WH Id", to: "warehouseId" },
    { from: "SKU Id", to: "skuId" },
    { from: "Usage Qty (ม.ค.–ธ.ค.)", to: "monthlyUsage[]" },
    { from: "Plant Id", to: "factoryId — ต้องยืนยัน", warn: true },
  ];
  const quality: { label: string; pct: number; warn?: boolean }[] = [
    { label: "มี usage history", pct: 96 },
    { label: "มี stock data", pct: 88 },
    { label: "มี lead time", pct: 61, warn: true },
    { label: "WH–Factory mapping", pct: 73, warn: true },
  ];
  const history: { label: string; meta: string; status: string; tone: "green" | "amber" }[] = [
    { label: "Usage 8,420 แถว", meta: "12 มิ.ย. 2569 · สมหญิง", status: "สำเร็จ", tone: "green" },
    { label: "Stock 24,740 แถว", meta: "10 มิ.ย. 2569 · ระบบ", status: "สำเร็จ", tone: "green" },
    { label: "Lead Time 1,180 แถว", meta: "10 มิ.ย. 2569 · ระบบ", status: "มี warning", tone: "amber" },
  ];

  return (
    <div>
      <button onClick={onBack} style={s("display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:#7B7591;font-family:inherit;font-size:12.5px;cursor:pointer;padding:0;margin-bottom:14px;")}><ArrowLeft style={s("width:15px;height:15px;")} /> กลับแดชบอร์ด</button>

      <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:18px;")}>
        <div>
          <h1 style={s("margin:0 0 5px;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>นำเข้าข้อมูล & คุณภาพข้อมูล</h1>
          <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>อัปโหลด Excel → จับคู่คอลัมน์ → ตรวจคุณภาพก่อนใช้คำนวณ — แยก WH · Factory · Supplier ให้ถูกต้อง</p>
        </div>
        <button style={s("display:flex;align-items:center;gap:7px;height:40px;padding:0 15px;border:1px solid #E5E1F0;border-radius:11px;background:#fff;color:#3B3654;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;")}><Download style={s("width:16px;height:16px;color:#7C3AED;")} /> ดาวน์โหลดเทมเพลต</button>
      </div>

      <div style={s("display:flex;align-items:center;gap:9px;margin-bottom:16px;flex-wrap:wrap;")}>
        <span style={s("font-size:12px;color:#9B95B0;margin-right:2px;")}>ชุดข้อมูล:</span>
        {datasets.map((d) => (
          <button key={d.id} onClick={() => setDataset(d.id)} style={chip(dataset === d.id)}>{d.label}</button>
        ))}
      </div>

      <div style={s("display:grid;grid-template-columns:1.6fr 1fr;gap:18px;align-items:start;")}>
        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("background:#fff;border:1.5px dashed #C9B0F2;border-radius:16px;padding:26px;text-align:center;")}>
            <div style={s("width:54px;height:54px;border-radius:14px;background:#F4EEFE;color:#7C3AED;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;")}><UploadCloud style={s("width:26px;height:26px;")} /></div>
            <div style={s("font-size:14px;font-weight:600;color:#1C1830;")}>ลากไฟล์ Excel มาวาง หรือเลือกไฟล์</div>
            <div style={s("font-size:11.5px;color:#9B95B0;margin-top:3px;")}>รองรับ .xlsx · .csv — สูงสุด 10MB · ชีตตามรูปแบบ PEA Data Summary</div>
            <button style={s("margin-top:14px;height:38px;padding:0 18px;border:0;border-radius:10px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;")}>เลือกไฟล์</button>
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
            <div style={s("display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #F1EEF8;")}>
              <span style={s("width:38px;height:38px;border-radius:10px;background:#ECFDF5;color:#059669;display:flex;align-items:center;justify-content:center;flex:none;")}><FileSpreadsheet style={s("width:19px;height:19px;")} /></span>
              <div style={s("flex:1;min-width:0;")}><div style={s("font-size:13px;font-weight:600;color:#1C1830;")}>PEA Data Summary.xlsx</div><div className="mono" style={s("font-size:10.5px;color:#A29DB5;")}>ชีต "WH Season Data Item" · 8,420 แถว · 1.2 MB</div></div>
              <span style={s("font-size:10.5px;font-weight:600;color:#0F7B53;background:#ECFDF5;border:1px solid #A7F3D0;padding:3px 10px;border-radius:99px;flex:none;")}>อัปโหลดแล้ว</span>
            </div>
            <div style={s("padding:14px 18px;")}>
              <div style={s("font-size:11px;font-weight:600;letter-spacing:.4px;color:#9B95B0;text-transform:uppercase;margin-bottom:9px;")}>จับคู่คอลัมน์ → ฟิลด์ระบบ</div>
              <div style={s("display:flex;flex-direction:column;gap:7px;")}>
                {mappings.map((m) => (
                  <div key={m.from} style={s("display:flex;align-items:center;gap:10px;font-size:12px;")}>
                    <span className="mono" style={s(`flex:1;padding:6px 10px;border-radius:8px;${m.warn ? "color:#5A5470;background:#FFFBEB;border:1px solid #FBE3A2;" : "color:#5A5470;background:#FAF9FD;border:1px solid #F0EDF7;"}`)}>{m.from}</span>
                    <ArrowRight style={s("width:14px;height:14px;color:#C4BBD6;")} />
                    <span style={s(`flex:1;font-weight:500;padding:6px 10px;border-radius:8px;${m.warn ? "color:#B45309;background:#FFFBEB;border:1px solid #FBE3A2;" : "color:#1C1830;background:#F4EEFE;border:1px solid #E4D7FB;"}`)}>{m.to}</span>
                    {m.warn ? <AlertTriangle style={s("width:15px;height:15px;color:#D97706;")} /> : <CheckCircle2 style={s("width:15px;height:15px;color:#059669;")} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            <h2 style={s("margin:0 0 3px;font-size:14px;font-weight:600;color:#1C1830;")}>คุณภาพข้อมูล (Data Quality)</h2>
            <p style={s("margin:0 0 14px;font-size:11px;color:#9B95B0;")}>ความครอบคลุมหลังจับคู่ WH–Factory</p>
            <div style={s("display:flex;flex-direction:column;gap:11px;")}>
              {quality.map((q) => (
                <div key={q.label}>
                  <div style={s("display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:4px;")}><span style={s("color:#5A5470;")}>{q.label}</span><span style={s(`font-weight:600;color:${q.warn ? "#B45309" : "#059669"};`)}>{q.pct}%</span></div>
                  <div style={s("height:7px;border-radius:99px;background:#F0EDF7;")}><div style={{ width: `${q.pct}%`, height: "100%", borderRadius: 99, background: q.warn ? "#D97706" : "#059669" }} /></div>
                </div>
              ))}
            </div>
            <div style={s("margin-top:13px;padding-top:12px;border-top:1px solid #F1EEF8;display:flex;flex-direction:column;gap:8px;")}>
              <div style={s("display:flex;align-items:center;gap:8px;font-size:11.5px;color:#92400E;")}><AlertTriangle style={s("width:14px;height:14px;color:#D97706;")} /> 142 แถว ไม่มี WH–Factory mapping</div>
              <div style={s("display:flex;align-items:center;gap:8px;font-size:11.5px;color:#92400E;")}><AlertTriangle style={s("width:14px;height:14px;color:#D97706;")} /> 38 SKU มีชื่อเป็น NULL (เติมชื่อ demo)</div>
            </div>
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            <h2 style={s("margin:0 0 12px;font-size:14px;font-weight:600;color:#1C1830;")}>ประวัติการนำเข้า</h2>
            <div style={s("display:flex;flex-direction:column;gap:9px;")}>
              {history.map((h) => (
                <div key={h.label} style={s("display:flex;align-items:center;gap:10px;")}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: h.tone === "green" ? "#059669" : "#D97706", flex: "none" } as CSSProperties} />
                  <div style={s("flex:1;")}><div style={s("font-size:12px;color:#1C1830;font-weight:500;")}>{h.label}</div><div style={s("font-size:10px;color:#9B95B0;")}>{h.meta}</div></div>
                  <span style={s(`font-size:10px;font-weight:600;color:${h.tone === "green" ? "#0F7B53" : "#B45309"};`)}>{h.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={s("display:flex;align-items:center;gap:12px;background:linear-gradient(100deg,#FBF4FF,#FCE9F5);border:1px solid #E6D8FB;border-radius:14px;padding:13px 15px;")}>
            <span style={s("width:36px;height:36px;border-radius:10px;background:#fff;border:1px solid #E6D8FB;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}><Plug style={s("width:18px;height:18px;")} /></span>
            <div style={s("flex:1;min-width:0;")}><div style={s("font-size:12.5px;font-weight:600;color:#5B21B6;")}>เชื่อม SAP-MM / GFMIS</div><div style={s("font-size:10.5px;color:#8A7AA8;")}>ดึงสต็อก/เบิกจ่ายอัตโนมัติ (อนาคต)</div></div>
            <span style={s("font-size:10px;font-weight:600;color:#7B7591;background:#fff;border:1px solid #E6D8FB;padding:3px 9px;border-radius:99px;flex:none;")}>เร็วๆ นี้</span>
          </div>
        </div>
      </div>

      <div style={s("display:flex;align-items:center;justify-content:space-between;gap:16px;background:#fff;border:1px solid #EBE7F5;border-radius:14px;padding:14px 18px;margin-top:16px;")}>
        <div style={s("font-size:12px;color:#7B7591;")}>ตรวจพบ <b style={s("color:#1C1830;")}>8,420 แถว</b> · พร้อมนำเข้า <b style={s("color:#059669;")}>8,240</b> · ต้องยืนยัน <b style={s("color:#B45309;")}>180</b></div>
        <div style={s("display:flex;gap:10px;")}>
          <button style={s("height:40px;padding:0 15px;border:1px solid #E5E1F0;border-radius:11px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;")}>บันทึกฉบับร่าง</button>
          <button style={s("display:flex;align-items:center;gap:7px;height:40px;padding:0 18px;border:0;border-radius:11px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 10px 22px -10px rgba(109,40,217,.7);")}><Check style={s("width:16px;height:16px;")} /> ตรวจสอบและนำเข้า</button>
        </div>
      </div>
    </div>
  );
}

// หน้าเฝ้าระวัง Diff (Diff Monitor) — พอร์ตจากดีไซน์ HTML เป็นต้นแบบจำลอง (mock): AI vs จริง · Import ใหม่ vs เดิม · Snapshot vs ปัจจุบัน
function DiffMonitorPage({ onBack, onOpenHistory }: { onBack: () => void; onOpenHistory: () => void }) {
  const stats = [
    { icon: Activity, label: "SKU ผันผวนเกินเกณฑ์", value: "9", border: "#FBD5D5", color: "#DC2626", num: "#B91C1C" },
    { icon: Camera, label: "Snapshot ที่ค่าเปลี่ยน", value: "14", border: "#FBE3A2", color: "#D97706", num: "#B45309" },
    { icon: ImportIcon, label: "แถว import ที่เปลี่ยน", value: "312", border: "#EBE7F5", color: "#6D28D9", num: "#5B21B6" },
  ];
  const aiRows: { name: string; code: string; ai: string; real: string; diff: string; tone: "red" | "green" | "amber" }[] = [
    { name: "สายเคเบิล XLPE 240", code: "1CC0CG0002 · I010", ai: "10", real: "14", diff: "+40%", tone: "red" },
    { name: "หม้อแปลง 100kVA", code: "1DD0DC0000 · K010", ai: "2", real: "2", diff: "0%", tone: "green" },
    { name: "เสาคอนกรีต 12m", code: "1CC0CP0012 · K030", ai: "6", real: "3", diff: "−50%", tone: "amber" },
  ];
  const diffTone = (t: "red" | "green" | "amber") =>
    t === "red"
      ? s("font-size:11px;font-weight:600;color:#B91C1C;background:#FEF2F2;padding:2px 8px;border-radius:99px;")
      : t === "green"
        ? s("font-size:11px;font-weight:600;color:#0F7B53;background:#ECFDF5;padding:2px 8px;border-radius:99px;")
        : s("font-size:11px;font-weight:600;color:#B45309;background:#FFFAEB;padding:2px 8px;border-radius:99px;");
  const importDiffs: { tag: string; tone: "green" | "amber" | "red"; node: ReactNode }[] = [
    { tag: "เพิ่ม", tone: "green", node: <>usage เดือน มิ.ย. 2569 · <b>+842 แถว</b> · 38 คลัง</> },
    { tag: "เปลี่ยน", tone: "amber", node: <>สายเคเบิล XLPE I010 · ใช้ 100 → <b style={s("color:#1C1830;")}>132 ม.</b> <span style={s("color:#B91C1C;")}>(+32%)</span></> },
    { tag: "หาย", tone: "red", node: <>12 SKU ไม่มีข้อมูลในไฟล์ใหม่ · คงค่าเดิมไว้</> },
  ];
  const tagStyle = (t: "green" | "amber" | "red") =>
    t === "green"
      ? s("font-size:9.5px;font-weight:600;color:#0F7B53;background:#ECFDF5;padding:3px 8px;border-radius:6px;flex:none;")
      : t === "amber"
        ? s("font-size:9.5px;font-weight:600;color:#B45309;background:#FFFAEB;padding:3px 8px;border-radius:6px;flex:none;")
        : s("font-size:9.5px;font-weight:600;color:#DC2626;background:#FEF2F2;padding:3px 8px;border-radius:6px;flex:none;");

  return (
    <div>
      <button onClick={onBack} style={s("display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:#7B7591;font-family:inherit;font-size:12.5px;cursor:pointer;padding:0;margin-bottom:14px;")}><ArrowLeft style={s("width:15px;height:15px;")} /> กลับแดชบอร์ด</button>

      <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:18px;")}>
        <div>
          <div style={s("display:flex;align-items:center;gap:10px;margin-bottom:5px;")}><h1 style={s("margin:0;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>เฝ้าระวังความต่างข้อมูล</h1><span style={s("display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#7C3AED;background:#F4EEFE;border:1px solid #E4D7FB;padding:3px 9px;border-radius:99px;")}><GitCompare style={s("width:13px;height:13px;")} /> Data Diff</span></div>
          <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>ตรวจความต่าง: AI vs ค่าจริง · Snapshot vs ปัจจุบัน · Import ใหม่ vs เดิม — ปักธงที่เกินเกณฑ์</p>
        </div>
      </div>

      <div style={s("display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:18px;")}>
        {stats.map((st) => {
          const Icon = st.icon;
          return (
            <div key={st.label} style={s(`background:#fff;border:1px solid ${st.border};border-radius:14px;padding:15px 16px;`)}>
              <div style={s("display:flex;align-items:center;gap:8px;")}><Icon style={s(`width:15px;height:15px;color:${st.color};`)} /><span style={s("font-size:12px;color:#7B7591;")}>{st.label}</span></div>
              <div style={s(`margin-top:8px;font-size:26px;font-weight:600;color:${st.num};line-height:1;`)} className="mono">{st.value}</div>
            </div>
          );
        })}
      </div>

      <div style={s("display:grid;grid-template-columns:1.5fr 1fr;gap:18px;align-items:start;")}>
        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
            <div style={s("display:flex;align-items:center;gap:9px;padding:15px 18px 12px;border-bottom:1px solid #F1EEF8;")}><span style={s("width:28px;height:28px;border-radius:8px;background:#F4EEFE;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}><Sparkles style={s("width:15px;height:15px;")} /></span><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>AI Suggest เทียบค่าจริง</h2></div>
            <table style={s("width:100%;border-collapse:collapse;font-size:12.5px;")}>
              <thead><tr style={s("background:#FAF9FD;")}><th style={s("text-align:left;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:8px 16px;")}>SKU</th><th style={s("text-align:right;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:8px 10px;")}>AI</th><th style={s("text-align:right;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:8px 10px;")}>จริง</th><th style={s("text-align:right;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:8px 16px;")}>Diff</th></tr></thead>
              <tbody>
                {aiRows.map((r) => (
                  <tr key={r.code} style={s("border-top:1px solid #F4F2FA;")}>
                    <td style={s("padding:10px 16px;")}><div style={s("font-weight:500;color:#1C1830;")}>{r.name}</div><div className="mono" style={s("font-size:10px;color:#A29DB5;")}>{r.code}</div></td>
                    <td style={s("padding:10px 10px;text-align:right;color:#6D28D9;font-weight:600;")}>{r.ai}</td>
                    <td style={s("padding:10px 10px;text-align:right;color:#1C1830;")}>{r.real}</td>
                    <td style={s("padding:10px 16px;text-align:right;")}><span style={diffTone(r.tone)}>{r.diff}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
            <div style={s("display:flex;align-items:center;gap:9px;padding:15px 18px 12px;border-bottom:1px solid #F1EEF8;")}><span style={s("width:28px;height:28px;border-radius:8px;background:#EFF4FF;color:#2563EB;display:flex;align-items:center;justify-content:center;flex:none;")}><ImportIcon style={s("width:15px;height:15px;")} /></span><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>Import ล่าสุด เทียบข้อมูลเดิม</h2></div>
            <div style={s("padding:14px 18px;display:flex;flex-direction:column;gap:10px;")}>
              {importDiffs.map((d, i) => (
                <div key={i} style={s("display:flex;align-items:center;gap:12px;")}><span style={tagStyle(d.tone)}>{d.tag}</span><div style={s("flex:1;font-size:12px;color:#5A5470;")}>{d.node}</div></div>
              ))}
            </div>
          </div>
        </div>

        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);overflow:hidden;")}>
          <div style={s("display:flex;align-items:center;gap:9px;padding:15px 18px 12px;border-bottom:1px solid #F1EEF8;")}><span style={s("width:28px;height:28px;border-radius:8px;background:#FFFAEB;color:#D97706;display:flex;align-items:center;justify-content:center;flex:none;")}><Camera style={s("width:15px;height:15px;")} /></span><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>Snapshot เทียบปัจจุบัน</h2></div>
          <div style={s("padding:14px 18px;")}>
            <div className="mono" style={s("font-size:10.5px;color:#9B95B0;margin-bottom:10px;")}>PR-2569-0182 · SNAP-0182</div>
            <div style={s("display:flex;flex-direction:column;gap:10px;")}>
              <div style={s("display:flex;align-items:center;justify-content:space-between;font-size:12.5px;")}><span style={s("color:#7B7591;")}>ราคา/ม.</span><span><span style={s("color:#9B95B0;")}>฿2,000</span> <span style={s("color:#C4BBD6;")}>→</span> <b style={s("color:#B45309;")}>฿2,150</b> <span style={s("font-size:10px;color:#B91C1C;")}>+7.5%</span></span></div>
              <div style={s("display:flex;align-items:center;justify-content:space-between;font-size:12.5px;")}><span style={s("color:#7B7591;")}>Lead Time</span><span><span style={s("color:#9B95B0;")}>18</span> <span style={s("color:#C4BBD6;")}>→</span> <b style={s("color:#B45309;")}>24</b> วัน</span></div>
              <div style={s("display:flex;align-items:center;justify-content:space-between;font-size:12.5px;")}><span style={s("color:#7B7591;")}>Seasonal Factor</span><span><span style={s("color:#9B95B0;")}>1.20</span> <span style={s("color:#C4BBD6;")}>→</span> <b style={s("color:#1C1830;")}>1.20</b></span></div>
              <div style={s("display:flex;align-items:center;justify-content:space-between;font-size:12.5px;")}><span style={s("color:#7B7591;")}>งบเขตคงเหลือ</span><span><span style={s("color:#9B95B0;")}>฿2.40M</span> <span style={s("color:#C4BBD6;")}>→</span> <b style={s("color:#1C1830;")}>฿2.10M</b></span></div>
            </div>
            <div style={s("margin-top:13px;background:#FFFBEB;border:1px solid #FBE3A2;border-radius:11px;padding:10px 12px;font-size:11px;color:#92400E;line-height:1.5;")}><b>หมายเหตุ:</b> snapshot คงค่าเดิมไว้เพื่อ audit — การคำนวณรอบใหม่ใช้ค่าปัจจุบัน</div>
            <button onClick={onOpenHistory} style={s("width:100%;margin-top:12px;height:38px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;")}>ดู snapshot เต็ม</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// หน้าสมองกลางพัสดุ (Decision Intelligence) — พอร์ตจากดีไซน์ (mock): KPI + before/after สูตรกลาง + learning curve + decision log
function MaterialsBrainPage({ onBack, onOpenHistory }: { onBack: () => void; onOpenHistory: () => void }) {
  const kpis = [
    { icon: GitCompareArrows, color: "#6D28D9", label: "ความสอดคล้องการตัดสินใจ", value: "94%", delta: "▲ จาก 41%", deltaColor: "#059669", sub: "ทุกคลังใช้สูตรเดียวกัน", gradient: false },
    { icon: Timer, color: "#2563EB", label: "เวลาต่อคำขอ", value: "3", unit: "นาที", delta: "▼ จาก 45", deltaColor: "#059669", sub: "เลิกไล่ Excel หลายไฟล์", gradient: false },
    { icon: Sparkles, color: "#7C3AED", label: "รับคำแนะนำ AI", value: "82%", unit: "ของคำขอ", delta: "", deltaColor: "", sub: "ใช้ตามที่ AI แนะนำ", gradient: false },
    { icon: Target, color: "#fff", label: "ความแม่นยำ AI", value: "87%", delta: "▲ ต่อเนื่อง", deltaColor: "rgba(255,255,255,.75)", sub: "ยิ่งใช้ ยิ่งแม่น", gradient: true },
  ];
  const beforeRows = [{ w: "I010", pct: 57, v: 68 }, { w: "K010", pct: 43, v: 52 }, { w: "K030", pct: 75, v: 90 }, { w: "C040", pct: 38, v: 45 }, { w: "I020", pct: 67, v: 80 }];
  const curve = [{ v: "v0.9", pct: 100, err: "22%", color: "linear-gradient(180deg,#F4A6A6,#DC2626)", txt: "#B91C1C", active: false }, { v: "v1.0", pct: 59, err: "13%", color: "linear-gradient(180deg,#FBD08A,#D97706)", txt: "#B45309", active: true }, { v: "v1.1", pct: 41, err: "9%", color: "linear-gradient(180deg,#86E5BE,#059669)", txt: "#0F7B53", active: false }];
  const log = [
    { pr: "PR-2569-0182 · สายเคเบิล XLPE", who: "สมหญิง · I010", ai: "10", real: "20", dec: "override +100%", decTone: "amber", result: "ใช้จริง 14 · แนะมากไป", resultColor: "#B91C1C" },
    { pr: "PR-2569-0180 · หม้อแปลง 100kVA", who: "ปกรณ์ · K010", ai: "2", real: "2", dec: "ตาม AI", decTone: "green", result: "ใช้จริง 2 · แม่นยำ", resultColor: "#0F7B53" },
    { pr: "PR-2569-0179 · เบรกเกอร์ 50A", who: "ธนา · I010", ai: "16", real: "10", dec: "ยืมแทนซื้อ 6", decTone: "violet", result: "ประหยัด ฿10.8K", resultColor: "#0F7B53" },
  ];
  const decTone = (t: string) => t === "amber" ? "color:#B45309;background:#FFFAEB;" : t === "green" ? "color:#0F7B53;background:#ECFDF5;" : "color:#5B21B6;background:#F4EEFE;";

  return (
    <div>
      <button onClick={onBack} style={s("display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:#7B7591;font-family:inherit;font-size:12.5px;cursor:pointer;padding:0;margin-bottom:14px;")}><ArrowLeft style={s("width:15px;height:15px;")} /> กลับแดชบอร์ด</button>
      <div style={s("margin-bottom:18px;")}>
        <div style={s("display:flex;align-items:center;gap:10px;margin-bottom:5px;")}><h1 style={s("margin:0;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>สมองกลางพัสดุ</h1><span style={s("display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#6D28D9;background:#F1EBFE;border:1px solid #E4D7FB;padding:3px 9px;border-radius:99px;")}><BrainCircuit style={s("width:13px;height:13px;")} /> Decision Intelligence</span></div>
        <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>จากคนคำนวณเองที่ต่างกันทุกคลัง → สูตรกลางเดียว + AI ช่วยตัดสินใจ + เรียนรู้จาก Error ต่อเนื่อง</p>
      </div>

      {/* แบนเนอร์อธิบาย "นี่คืออะไร" แบบเข้าใจง่าย + flow ก่อน→หลัง→เรียนรู้ */}
      <div style={s("background:linear-gradient(110deg,#FBF4FF,#F1EBFE 55%,#FCE9F5);border:1px solid #E6D8FB;border-radius:16px;padding:18px 20px;margin-bottom:18px;")}>
        <div style={s("display:flex;align-items:flex-start;gap:13px;margin-bottom:16px;")}>
          <span style={s("width:42px;height:42px;border-radius:12px;background:linear-gradient(140deg,#7C2DE0,#C0249B);color:#fff;display:flex;align-items:center;justify-content:center;flex:none;box-shadow:0 10px 22px -10px rgba(124,45,224,.7);")}><BrainCircuit style={s("width:22px;height:22px;")} /></span>
          <div style={s("flex:1;min-width:0;")}>
            <div style={s("font-size:15px;font-weight:700;color:#3B1170;margin-bottom:3px;")}>หน้านี้คืออะไร? — สมองกลางที่ตัดสินใจพัสดุแทน "ต่างคนต่างคิด"</div>
            <div style={s("font-size:13px;color:#6B5B86;line-height:1.6;")}>เมื่อก่อนเจ้าหน้าที่แต่ละคลัง <b style={s("color:#B91C1C;")}>คำนวณเองในหัว/Excel ของใครของมัน</b> — SKU เดียวกันได้เลขไม่ตรงกัน บางคลังสั่งเยอะ บางคลังสั่งน้อย เกิดทั้งของขาดและของจม · ตอนนี้ทุกคลังใช้ <b style={s("color:#0F7B53;")}>"สมองกลาง" เดียวกัน (สูตรกลาง + AI)</b> → ได้เลขเดียวกัน อธิบายที่มาได้ และ AI ยิ่งใช้ยิ่งแม่นจากผลจริง</div>
          </div>
        </div>
        <div style={s("display:flex;align-items:center;gap:10px;flex-wrap:wrap;")}>
          {[
            { icon: GitCompareArrows, color: "#DC2626", bg: "#FEF2F2", bd: "#FBD5D5", step: "ปัญหา", text: "ต่างคนต่างคิด เลขไม่ตรง" },
            { icon: BrainCircuit, color: "#6D28D9", bg: "#F4EEFE", bd: "#E4D7FB", step: "วิธีแก้", text: "สูตรกลาง + AI เดียวกัน" },
            { icon: Repeat2, color: "#059669", bg: "#ECFDF5", bd: "#B6EBD7", step: "ผลลัพธ์", text: "ยิ่งใช้ยิ่งแม่น เรียนรู้เอง" },
          ].map((s2, i) => {
            const Icon = s2.icon;
            return (
              <Fragment key={s2.step}>
                <div style={s(`display:flex;align-items:center;gap:9px;background:${s2.bg};border:1px solid ${s2.bd};border-radius:11px;padding:9px 13px;flex:1;min-width:170px;`)}>
                  <span style={s(`width:30px;height:30px;border-radius:8px;background:#fff;color:${s2.color};display:flex;align-items:center;justify-content:center;flex:none;`)}><Icon style={s("width:16px;height:16px;")} /></span>
                  <div style={s("min-width:0;")}><div style={s(`font-size:10px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:${s2.color};`)}>{i + 1}. {s2.step}</div><div style={s("font-size:12px;font-weight:500;color:#3B3654;")}>{s2.text}</div></div>
                </div>
                {i < 2 ? <ArrowRight style={s("width:18px;height:18px;color:#C4BBD6;flex:none;")} /> : null}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div style={s("display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:18px;")}>
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} style={k.gradient ? s("background:linear-gradient(135deg,#5B21B6,#A41CA8);border:1px solid #6D28D9;border-radius:16px;padding:17px;box-shadow:0 14px 30px -18px rgba(109,40,217,.6);") : s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:17px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 14px 30px -22px rgba(28,24,48,.28);")}>
              <div style={s(`display:flex;align-items:center;gap:7px;font-size:12px;color:${k.gradient ? "rgba(255,255,255,.8)" : "#7B7591"};`)}><Icon style={s(`width:15px;height:15px;color:${k.color};`)} /> {k.label}</div>
              <div style={s("margin-top:9px;display:flex;align-items:baseline;gap:6px;")}><span style={s(`font-size:28px;font-weight:700;line-height:1;color:${k.gradient ? "#fff" : k.color};`)}>{k.value}</span>{k.unit ? <span style={s(`font-size:12px;color:${k.gradient ? "rgba(255,255,255,.75)" : "#7B7591"};`)}>{k.unit}</span> : null}{k.delta ? <span style={s(`font-size:12px;font-weight:600;color:${k.deltaColor};`)}>{k.delta}</span> : null}</div>
              <div style={s(`font-size:11px;margin-top:5px;color:${k.gradient ? "rgba(255,255,255,.72)" : "#9B95B0"};`)}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      <div style={s("display:grid;grid-template-columns:1.45fr 1fr;gap:16px;align-items:start;")}>
        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
          <div style={s("padding:16px 18px 13px;border-bottom:1px solid #F1EEF8;")}><h2 style={s("margin:0;font-size:15px;font-weight:600;color:#1C1830;")}>ปัญหาแฝง: คนคำนวณต่างกัน</h2><p style={s("margin:2px 0 0;font-size:11.5px;color:#9B95B0;")}>SKU เดียวกัน · สายเคเบิล XLPE 240 · 5 คลัง — Reorder Point ที่แต่ละคลังคำนวณ</p></div>
          <div style={s("padding:16px 18px;display:grid;grid-template-columns:1fr 1fr;gap:16px;")}>
            <div>
              <div style={s("display:flex;align-items:center;gap:7px;margin-bottom:11px;")}><span style={s("width:8px;height:8px;border-radius:50%;background:#DC2626;")} /><span style={s("font-size:12px;font-weight:600;color:#B91C1C;")}>เดิม — คนคำนวณเอง</span></div>
              <div style={s("display:flex;flex-direction:column;gap:8px;")}>
                {beforeRows.map((r) => (
                  <div key={r.w} style={s("display:flex;align-items:center;gap:9px;")}><span className="mono" style={s("font-size:10.5px;color:#A29DB5;width:38px;flex:none;")}>{r.w}</span><div style={s("flex:1;height:18px;border-radius:5px;background:#F0EDF7;overflow:hidden;")}><div style={{ height: "100%", width: `${r.pct}%`, background: "#DC2626", borderRadius: 5 } as CSSProperties} /></div><span className="mono" style={s("font-size:11px;color:#5A5470;width:30px;text-align:right;")}>{r.v}</span></div>
                ))}
              </div>
              <div style={s("margin-top:11px;background:#FEF2F2;border:1px solid #FBD5D5;border-radius:9px;padding:8px 10px;font-size:11px;color:#8A4B4B;line-height:1.5;")}>ต่างกันถึง <b style={s("color:#B91C1C;")}>2 เท่า</b> · ตัดสินใจไม่เหมือนกัน เกิด error</div>
            </div>
            <div>
              <div style={s("display:flex;align-items:center;gap:7px;margin-bottom:11px;")}><span style={s("width:8px;height:8px;border-radius:50%;background:#059669;")} /><span style={s("font-size:12px;font-weight:600;color:#0F7B53;")}>ตอนนี้ — สูตรกลาง + AI</span></div>
              <div style={s("display:flex;flex-direction:column;gap:8px;")}>
                {beforeRows.map((r) => (
                  <div key={r.w} style={s("display:flex;align-items:center;gap:9px;")}><span className="mono" style={s("font-size:10.5px;color:#A29DB5;width:38px;flex:none;")}>{r.w}</span><div style={s("flex:1;height:18px;border-radius:5px;background:#F0EDF7;overflow:hidden;")}><div style={{ height: "100%", width: "57%", background: "#059669", borderRadius: 5 } as CSSProperties} /></div><span className="mono" style={s("font-size:11px;color:#5A5470;width:30px;text-align:right;")}>68</span></div>
                ))}
              </div>
              <div style={s("margin-top:11px;background:#F0FDF9;border:1px solid #B6EBD7;border-radius:9px;padding:8px 10px;font-size:11px;color:#3F6B57;line-height:1.5;")}>เท่ากันทุกคลัง <b style={s("color:#0F7B53;")}>68</b> · อธิบายที่มาได้ทุกตัวเลข</div>
            </div>
          </div>
        </div>

        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
          <h2 style={s("margin:0 0 3px;font-size:15px;font-weight:600;color:#1C1830;")}>เรียนรู้จาก Error ต่อเนื่อง</h2>
          <p style={s("margin:0 0 16px;font-size:11.5px;color:#9B95B0;")}>Forecast Error ลดลงทุกเวอร์ชันสูตร</p>
          <div style={s("display:flex;align-items:flex-end;gap:14px;height:120px;")}>
            {curve.map((c) => (
              <div key={c.v} style={s("flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:7px;height:100%;")}><span style={s(`font-size:11px;font-weight:600;color:${c.txt};`)}>{c.err}</span><div style={{ width: "100%", height: Math.round((c.pct / 100) * 86), background: c.color, borderRadius: "6px 6px 0 0" } as CSSProperties} /><span className="mono" style={s(`font-size:10px;color:${c.active ? "#7C3AED" : "#A29DB5"};${c.active ? "font-weight:600;" : ""}`)}>{c.v}</span></div>
            ))}
          </div>
          <div style={s("margin-top:14px;display:flex;align-items:flex-start;gap:9px;background:linear-gradient(100deg,#FBF4FF,#FCE9F5);border:1px solid #E6D8FB;border-radius:11px;padding:11px 13px;")}><Repeat2 style={s("width:15px;height:15px;color:#7C3AED;margin-top:1px;")} /><div style={s("font-size:11.5px;color:#5B21B6;line-height:1.55;")}>ทุกการซื้อ/ไม่ซื้อ/ยืม/โอน → ป้อนกลับเข้าสูตร · auto-tune <b>v1.1</b> ลด Error เหลือ <b>9%</b></div></div>
        </div>
      </div>

      <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;margin-top:16px;")}>
        <div style={s("display:flex;align-items:center;justify-content:space-between;padding:15px 18px 12px;border-bottom:1px solid #F1EEF8;")}><div><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>บันทึกการตัดสินใจล่าสุด</h2><p style={s("margin:2px 0 0;font-size:11px;color:#9B95B0;")}>เทียบ AI แนะนำ กับที่ผู้ใช้เลือก — ทุกครั้งเก็บเป็นข้อมูลเรียนรู้</p></div><span onClick={onOpenHistory} style={s("font-size:11.5px;font-weight:500;color:#6D28D9;cursor:pointer;")}>ดู Snapshot</span></div>
        <div style={s("overflow-x:auto;")}>
          <table style={s("width:100%;border-collapse:collapse;font-size:12.5px;min-width:600px;")}>
            <thead><tr style={s("background:#FAF9FD;")}><th style={s("text-align:left;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 16px;")}>คำขอ / ผู้ใช้</th><th style={s("text-align:right;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 10px;")}>AI แนะนำ</th><th style={s("text-align:right;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 10px;")}>เลือกจริง</th><th style={s("text-align:left;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 12px;")}>การตัดสินใจ</th><th style={s("text-align:left;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 16px;")}>ผลลัพธ์ใช้จริง</th></tr></thead>
            <tbody>
              {log.map((r) => (
                <tr key={r.pr} style={s("border-top:1px solid #F4F2FA;")}>
                  <td style={s("padding:11px 16px;")}><div style={s("font-weight:500;color:#1C1830;")}>{r.pr}</div><div className="mono" style={s("font-size:10px;color:#A29DB5;")}>{r.who}</div></td>
                  <td style={s("padding:11px 10px;text-align:right;color:#6D28D9;font-weight:600;")}>{r.ai}</td>
                  <td style={s("padding:11px 10px;text-align:right;color:#1C1830;")}>{r.real}</td>
                  <td style={s("padding:11px 12px;")}><span style={s(`font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;${decTone(r.decTone)}`)}>{r.dec}</span></td>
                  <td style={s("padding:11px 16px;")}><span style={s(`font-size:11px;color:${r.resultColor};`)}>{r.result}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// หน้าคำขอระดมที่ได้รับ (Mobilize Inbox) — มุมมองสาขาผู้ให้ ตอบรับคำขอ + ติดตามการขนส่ง (พอร์ตจากดีไซน์ mock)
function MobilizeInboxPage({ onBack }: { onBack: () => void }) {
  const initial = [
    { id: "EMR-001", urgent: "วิกฤต", uTone: "red", from: "เขตภาคเหนือ · อ.แม่อาย", sku: "หม้อแปลง 30kVA", qty: "5 เครื่อง", incident: "น้ำท่วม", km: 142, eta: "3.5 ชม." },
    { id: "EMR-002", urgent: "เร่งด่วน", uTone: "amber", from: "เขตภาคใต้ · อ.เมืองนคร", sku: "สายเคเบิล XLPE 240", qty: "800 ม.", incident: "พายุ", km: 410, eta: "9 ชม." },
    { id: "EMR-003", urgent: "ปกติ", uTone: "gray", from: "เขตตะวันออก · อ.บ้านโพธิ์", sku: "เบรกเกอร์ 50A", qty: "20 ตัว", incident: "ไฟตก", km: 88, eta: "2 ชม." },
  ];
  const [accepted, setAccepted] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<Record<string, "borrow" | "swap" | "pr">>({});
  const uStyle = (t: string) => t === "red" ? "color:#B91C1C;background:#FEF2F2;" : t === "amber" ? "color:#B45309;background:#FFFAEB;" : "color:#5A5470;background:#F0EDF7;";
  const mBtn = (on: boolean) => s(`flex:1;height:34px;border-radius:9px;font-family:inherit;font-size:11px;font-weight:500;cursor:pointer;transition:all .15s;${on ? "border:1.5px solid #C9B0F2;background:#F4EEFE;color:#6D28D9;" : "border:1px solid #E5E1F0;background:#fff;color:#5A5470;"}`);
  const methodLabel: Record<string, string> = { borrow: "ยืม-คืนของเดิม", swap: "แลกพัสดุ", pr: "เปิด PR ซื้อคืน" };
  const track = Object.keys(accepted).map((id) => { const r = initial.find((x) => x.id === id)!; return { ...r, method: methodLabel[accepted[id]] }; });

  return (
    <div>
      <button onClick={onBack} style={s("display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:#7B7591;font-family:inherit;font-size:12.5px;cursor:pointer;padding:0;margin-bottom:14px;")}><ArrowLeft style={s("width:15px;height:15px;")} /> กลับแดชบอร์ด</button>
      <div style={s("margin-bottom:18px;")}>
        <div style={s("display:flex;align-items:center;gap:10px;margin-bottom:5px;")}><h1 style={s("margin:0;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>คำขอระดมที่ได้รับ</h1><span style={s("display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#B91C1C;background:#FEF2F2;border:1px solid #FBD5D5;padding:3px 9px;border-radius:99px;")}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#DC2626", animation: "pdot 1.6s infinite" } as CSSProperties} /> {initial.length - Object.keys(accepted).length} คำขอใหม่</span></div>
        <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>มุมมองสาขาผู้ให้ (คลัง/เขต/ส่วนกลาง) — ตอบรับคำขอ เลือกวิธีคืน และติดตามการขนส่ง · คลัง I010</p>
      </div>

      <div style={s("display:grid;grid-template-columns:1.5fr 1fr;gap:18px;align-items:start;")}>
        <div style={s("display:flex;flex-direction:column;gap:14px;")}>
          {initial.map((r) => {
            const isAcc = !!accepted[r.id];
            const m = method[r.id] ?? "borrow";
            return (
              <div key={r.id} style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 14px 30px -24px rgba(28,24,48,.28);overflow:hidden;")}>
                <div style={s("display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #F1EEF8;")}>
                  <span style={s("width:40px;height:40px;border-radius:11px;background:#FEF2F2;color:#DC2626;display:flex;align-items:center;justify-content:center;flex:none;")}><Siren style={s("width:19px;height:19px;")} /></span>
                  <div style={s("flex:1;min-width:0;")}>
                    <div style={s("display:flex;align-items:center;gap:8px;flex-wrap:wrap;")}><span className="mono" style={s("font-size:11px;color:#6D28D9;background:#F4EEFE;padding:2px 7px;border-radius:6px;")}>{r.id}</span><span style={s(`font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;${uStyle(r.uTone)}`)}>{r.urgent}</span></div>
                    <div style={s("font-size:13px;font-weight:600;color:#1C1830;margin-top:4px;")}>{r.from}</div>
                  </div>
                </div>
                <div style={s("padding:13px 16px;")}>
                  <div style={s("display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:#5A5470;margin-bottom:12px;")}>
                    <span><Package style={s("width:13px;height:13px;color:#7C3AED;")} /> <b style={s("color:#1C1830;")}>{r.sku}</b> · {r.qty}</span>
                    <span><CloudLightning style={s("width:13px;height:13px;color:#9B95B0;")} /> {r.incident}</span>
                    <span><Navigation style={s("width:13px;height:13px;color:#9B95B0;")} /> {r.km} กม. · ETA {r.eta}</span>
                  </div>
                  {isAcc ? (
                    <div style={s("display:flex;align-items:center;gap:9px;background:#ECFDF5;border:1px solid #B6EBD7;border-radius:10px;padding:10px 13px;font-size:12px;color:#0F7B53;font-weight:500;")}><CheckCircle2 style={s("width:16px;height:16px;")} /> ตอบรับแล้ว ({methodLabel[accepted[r.id]]}) — กำลังจัดของ · ดูสถานะที่แผงติดตาม</div>
                  ) : (
                    <>
                      <div style={s("font-size:11px;font-weight:600;color:#9B95B0;margin-bottom:7px;")}>เลือกวิธีคืนเมื่อตอบรับ</div>
                      <div style={s("display:flex;gap:8px;margin-bottom:12px;")}>
                        <button onClick={() => setMethod((p) => ({ ...p, [r.id]: "borrow" }))} style={mBtn(m === "borrow")}>ยืม-คืนของเดิม</button>
                        <button onClick={() => setMethod((p) => ({ ...p, [r.id]: "swap" }))} style={mBtn(m === "swap")}>แลกพัสดุ</button>
                        <button onClick={() => setMethod((p) => ({ ...p, [r.id]: "pr" }))} style={mBtn(m === "pr")}>เปิด PR ซื้อคืน</button>
                      </div>
                      <div style={s("display:flex;gap:9px;")}>
                        <button style={s("flex:1;height:40px;border:1px solid #FBD5D5;border-radius:10px;background:#fff;color:#DC2626;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;")}>ปฏิเสธ (ไม่มีของ)</button>
                        <button onClick={() => setAccepted((p) => ({ ...p, [r.id]: m }))} style={s("flex:2;display:flex;align-items:center;justify-content:center;gap:7px;height:40px;border:0;border-radius:10px;background:#059669;color:#fff;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;box-shadow:0 8px 18px -8px rgba(5,150,105,.6);")}><Check style={s("width:15px;height:15px;")} /> ตอบรับ & ส่งช่วย</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("display:flex;align-items:flex-start;gap:10px;background:#FFFBEB;border:1px solid #FBE3A2;border-radius:14px;padding:13px 15px;")}><ShieldAlert style={s("width:16px;height:16px;color:#D97706;margin-top:1px;")} /><div style={s("font-size:11.5px;color:#7B6A45;line-height:1.55;")}>ระบบล็อกให้ส่งช่วยได้ <b style={s("color:#92400E;")}>ไม่เกิน 90% ของ Safety Stock</b> — คลังผู้ให้ยังปลอดภัย ไม่เสี่ยงขาดเอง</div></div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            <h2 style={s("margin:0 0 4px;font-size:14px;font-weight:600;color:#1C1830;")}>ติดตามการระดม</h2>
            <p style={s("margin:0 0 14px;font-size:11px;color:#9B95B0;")}>รายการที่ตอบรับแล้ว + วิธีคืน</p>
            {track.length === 0 ? <p style={s("font-size:12px;color:#9B95B0;")}>ยังไม่มีรายการที่ตอบรับ — กด "ตอบรับ & ส่งช่วย" ที่คำขอ</p> : (
              <div style={s("display:flex;flex-direction:column;gap:16px;")}>
                {track.map((t) => (
                  <div key={t.id}>
                    <div style={s("display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;")}><div style={s("min-width:0;")}><div style={s("font-size:12.5px;font-weight:600;color:#1C1830;")}>{t.sku}</div><div className="mono" style={s("font-size:10px;color:#A29DB5;")}>{t.id} → {t.from}</div></div><span style={s("font-size:10px;font-weight:600;padding:2px 9px;border-radius:99px;color:#5B21B6;background:#F4EEFE;")}>{t.method}</span></div>
                    <div style={s("display:flex;align-items:center;gap:9px;")}><div style={s("flex:1;height:7px;border-radius:99px;background:#F0EDF7;overflow:hidden;")}><div style={{ height: "100%", borderRadius: 99, width: "35%", background: "linear-gradient(90deg,#7C3AED,#6D28D9)" } as CSSProperties} /></div><span style={s("font-size:10.5px;font-weight:600;color:#6D28D9;width:64px;text-align:right;flex:none;")}>กำลังจัดของ</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            <h2 style={s("margin:0 0 11px;font-size:14px;font-weight:600;color:#1C1830;")}>วิธีคืนของ</h2>
            <div style={s("display:flex;flex-direction:column;gap:10px;")}>
              <div style={s("display:flex;align-items:flex-start;gap:10px;")}><span style={s("width:30px;height:30px;border-radius:8px;background:#F4EEFE;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}><Repeat style={s("width:15px;height:15px;")} /></span><div style={s("font-size:11.5px;color:#5A5470;line-height:1.5;")}><b style={s("color:#1C1830;")}>ยืม-คืนของเดิม</b> — ส่งคืนพัสดุชิ้นเดิม/รุ่นเดียวกันเมื่อสถานการณ์คลี่คลาย</div></div>
              <div style={s("display:flex;align-items:flex-start;gap:10px;")}><span style={s("width:30px;height:30px;border-radius:8px;background:#ECFDF5;color:#059669;display:flex;align-items:center;justify-content:center;flex:none;")}><ArrowRightLeft style={s("width:15px;height:15px;")} /></span><div style={s("font-size:11.5px;color:#5A5470;line-height:1.5;")}><b style={s("color:#1C1830;")}>แลกพัสดุ</b> — แลกกับพัสดุที่ผู้ขอมีเกิน/ของจม มูลค่าใกล้เคียง</div></div>
              <div style={s("display:flex;align-items:flex-start;gap:10px;")}><span style={s("width:30px;height:30px;border-radius:8px;background:#FFFAEB;color:#D97706;display:flex;align-items:center;justify-content:center;flex:none;")}><FileText style={s("width:15px;height:15px;")} /></span><div style={s("font-size:11.5px;color:#5A5470;line-height:1.5;")}><b style={s("color:#1C1830;")}>เปิด PR ซื้อคืน</b> — ผู้ขอเปิดคำขอซื้อชดเชยให้ภายหลัง (เข้า flow งบ 3 ชั้น)</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// หน้าศูนย์ระดมพัสดุฉุกเฉิน (Disaster Map) — แผนที่ไทย + หมุดเลือกภาค + รายการขอระดม + สาขาผู้ส่ง (พอร์ตจากดีไซน์ mock)
function DisasterCenterPage({ onBack, onOpenMobilize }: { onBack: () => void; onOpenMobilize: () => void }) {
  type Zone = { id: string; name: string; x: number; y: number; sev: "red" | "amber" | "green"; incident: null | { title: string; typeLabel: string; sevLbl: string; sevCol: string; since: string; area: string; pt: string; icon: typeof CloudLightning } };
  const zones: Zone[] = [
    { id: "N", name: "ภาคเหนือ", x: 29, y: 12, sev: "red", incident: { title: "น้ำท่วมฉับพลัน อ.แม่อาย", typeLabel: "อุทกภัย", sevLbl: "วิกฤต", sevCol: "#B91C1C", since: "16 มิ.ย. 06:40", area: "อ.แม่อาย จ.เชียงใหม่ — น้ำป่าไหลหลาก 4 ตำบล ไฟฟ้าดับเป็นวงกว้าง", pt: "อบต.แม่อาย", icon: CloudLightning } },
    { id: "NE", name: "อีสาน", x: 70, y: 25, sev: "amber", incident: { title: "เฝ้าระวังพายุฤดูร้อน", typeLabel: "เฝ้าระวัง", sevLbl: "เฝ้าระวัง", sevCol: "#B45309", since: "16 มิ.ย. 08:10", area: "จ.อุบลราชธานี — พายุฤดูร้อน ลมกระโชกแรง เสาไฟเสี่ยงล้ม", pt: "กฟภ.เขต อุบลฯ", icon: CloudLightning } },
    { id: "W", name: "ตะวันตก", x: 25, y: 40, sev: "green", incident: null },
    { id: "C", name: "ภาคกลาง", x: 45, y: 33, sev: "green", incident: null },
    { id: "E", name: "ตะวันออก", x: 56, y: 50, sev: "red", incident: { title: "ไฟฟ้าดับวงกว้างจากพายุ", typeLabel: "วาตภัย", sevLbl: "วิกฤต", sevCol: "#B91C1C", since: "16 มิ.ย. 05:20", area: "อ.บ้านโพธิ์ จ.ฉะเชิงเทรา — เสาไฟล้ม 18 ต้น หม้อแปลงเสียหาย", pt: "กฟภ.บ้านโพธิ์", icon: Siren } },
    { id: "S", name: "ภาคใต้", x: 28, y: 78, sev: "red", incident: { title: "น้ำท่วม-ดินสไลด์ภาคใต้", typeLabel: "อุทกภัย", sevLbl: "วิกฤต", sevCol: "#B91C1C", since: "15 มิ.ย. 22:00", area: "อ.เมือง จ.นครศรีธรรมราช — น้ำท่วมขัง ดินสไลด์ปิดเส้นทาง", pt: "ศาลากลาง นครฯ", icon: CloudLightning } },
  ];
  const needed = [
    { name: "หม้อแปลงจำหน่าย 30kVA", got: 3, need: 5, unit: "เครื่อง", tag: "ขาด", tagTone: "amber" },
    { name: "สายเคเบิล XLPE 240", got: 1200, need: 1200, unit: "ม.", tag: "ครบ", tagTone: "green" },
    { name: "เสาคอนกรีต 12m", got: 8, need: 20, unit: "ต้น", tag: "เร่งด่วน", tagTone: "red" },
    { name: "เบรกเกอร์ 50A", got: 14, need: 30, unit: "ตัว", tag: "ขาด", tagTone: "amber" },
  ];
  const supply = [
    { branch: "คลัง I010", region: "ภาคเหนือ", km: 38, eta: "1 ชม.", has: "หม้อแปลง 30kVA · เสาคอนกรีต", st: "accepted" },
    { branch: "คลัง I020", region: "ภาคเหนือ", km: 92, eta: "2.5 ชม.", has: "สายเคเบิล XLPE 240 · เบรกเกอร์", st: "accepted" },
    { branch: "คลัง C040", region: "ภาคกลาง", km: 210, eta: "5 ชม.", has: "เสาคอนกรีต 12m · หม้อแปลง", st: "pending" },
    { branch: "คลัง K010", region: "อีสาน", km: 330, eta: "8 ชม.", has: "เบรกเกอร์ 50A", st: "pending" },
    { branch: "คลัง K020", region: "ตะวันออก", km: 420, eta: "9.5 ชม.", has: "สายเคเบิล · เสาคอนกรีต", st: "rejected" },
  ];
  const [selId, setSelId] = useState("N");
  // modal ขอระดม (req) / สั่งระดม (dispatch)
  const [emModal, setEmModal] = useState<null | "req" | "dispatch">(null);
  const emCatalog: { name: string; unit: string }[] = [
    { name: "หม้อแปลงจำหน่าย 100kVA", unit: "เครื่อง" },
    { name: "สายเคเบิลอากาศ SAC 185", unit: "ม." },
    { name: "เครื่องกำเนิดไฟฟ้าเคลื่อนที่", unit: "ชุด" },
    { name: "เสาคอนกรีต 12m", unit: "ต้น" },
    { name: "เบรกเกอร์ 50A", unit: "ตัว" },
  ];
  const [emSearch, setEmSearch] = useState("");
  const [emChosen, setEmChosen] = useState<{ name: string; unit: string; qty: number }[]>([
    { name: "หม้อแปลงจำหน่าย 100kVA", unit: "เครื่อง", qty: 6 },
    { name: "สายเคเบิลอากาศ SAC 185", unit: "ม.", qty: 2000 },
    { name: "เครื่องกำเนิดไฟฟ้าเคลื่อนที่", unit: "ชุด", qty: 3 },
  ]);
  const [emReturn, setEmReturn] = useState<"borrow" | "swap" | "pr">("borrow");
  const [emType, setEmType] = useState("น้ำท่วม");
  const [supplyDetail, setSupplyDetail] = useState<null | { branch: string; region: string; km: number; eta: string; has: string; st: string }>(null);
  const emFiltered = emCatalog.filter((c) => c.name.includes(emSearch) && !emChosen.some((x) => x.name === c.name));
  const rmBtn = (on: boolean) => s(`flex:1;height:36px;border-radius:9px;font-family:inherit;font-size:11.5px;font-weight:500;cursor:pointer;transition:all .15s;${on ? "border:1.5px solid #C9B0F2;background:#F4EEFE;color:#6D28D9;" : "border:1px solid #E5E1F0;background:#fff;color:#5A5470;"}`);
  const sel = zones.find((z) => z.id === selId)!;
  const pinColor = (sev: string) => sev === "red" ? "#DC2626" : sev === "amber" ? "#D97706" : "#059669";
  const tagStyle = (t: string) => t === "red" ? "color:#B91C1C;background:#FEF2F2;" : t === "amber" ? "color:#B45309;background:#FFFAEB;" : "color:#0F7B53;background:#ECFDF5;";
  const barCol = (t: string) => t === "red" ? "#DC2626" : t === "amber" ? "#D97706" : "#059669";
  const stInfo = (st: string) => st === "accepted" ? { col: "#0F7B53", bg: "#ECFDF5", icon: CheckCircle2, label: "ตอบรับแล้ว" } : st === "rejected" ? { col: "#B91C1C", bg: "#FEF2F2", icon: X, label: "ไม่มีของ" } : { col: "#B45309", bg: "#FFFAEB", icon: Clock, label: "รอตอบรับ" };
  const respCount = supply.filter((s2) => s2.st === "accepted").length;
  const pendCount = supply.filter((s2) => s2.st === "pending").length;
  const needFull = needed.filter((n) => n.got >= n.need).length;

  return (
    <div>
      <button onClick={onBack} style={s("display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:#7B7591;font-family:inherit;font-size:12.5px;cursor:pointer;padding:0;margin-bottom:14px;")}><ArrowLeft style={s("width:15px;height:15px;")} /> กลับแดชบอร์ด</button>
      <div style={s("display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:18px;")}>
        <div>
          <div style={s("display:flex;align-items:center;gap:10px;margin-bottom:5px;")}><h1 style={s("margin:0;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>ศูนย์ระดมพัสดุฉุกเฉิน</h1><span style={s("display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#DC2626;background:#FEF2F2;border:1px solid #FBD5D5;padding:3px 9px;border-radius:99px;")}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#DC2626", animation: "pdot 1.6s infinite" } as CSSProperties} /> Emergency Response</span></div>
          <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>เลือกพื้นที่ประสบภัย → ขอระดมของ · ดูว่าสาขาไหนมีของ ไกลแค่ไหน และตอบรับหรือยัง</p>
        </div>
        <div style={s("display:flex;align-items:center;gap:9px;")}><span style={s("font-size:11.5px;color:#9B95B0;")}>อัปเดตสด · 16 มิ.ย. 2569 10:24</span><button style={s("display:flex;align-items:center;gap:7px;height:38px;padding:0 14px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;")}><Download style={s("width:15px;height:15px;color:#7C3AED;")} /> Export</button></div>
      </div>

      {sel.incident ? (
        <div style={s("display:flex;align-items:center;gap:16px;background:linear-gradient(100deg,#7A0E1E,#B91C1C 60%,#DC2626);border-radius:14px;padding:15px 20px;margin-bottom:18px;box-shadow:0 16px 34px -20px rgba(185,28,28,.8);")}>
          <span style={s("width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.16);color:#fff;display:flex;align-items:center;justify-content:center;flex:none;")}><Siren style={s("width:23px;height:23px;")} /></span>
          <div style={s("flex:1;min-width:0;")}><div style={s("display:flex;align-items:center;gap:9px;flex-wrap:wrap;")}><span style={s("font-size:15px;font-weight:600;color:#fff;")}>{sel.incident.title}</span><span style={s("font-size:10px;font-weight:600;color:#fff;background:rgba(255,255,255,.2);padding:2px 9px;border-radius:99px;")}>{sel.incident.sevLbl}</span></div><div style={s("font-size:12.5px;color:rgba(255,255,255,.85);margin-top:3px;")}>{sel.incident.area} · เริ่ม {sel.incident.since} · ศูนย์รับของ: {sel.incident.pt}</div></div>
          <button onClick={() => setEmModal("req")} style={s("display:flex;align-items:center;gap:7px;height:42px;padding:0 18px;border:0;border-radius:11px;background:#fff;color:#B91C1C;font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;flex:none;")}><Megaphone style={s("width:17px;height:17px;")} /> ขอระดมของด่วน</button>
        </div>
      ) : (
        <div style={s("display:flex;align-items:center;gap:14px;background:#F0FDF9;border:1px solid #B6EBD7;border-radius:14px;padding:14px 18px;margin-bottom:18px;")}><span style={s("width:40px;height:40px;border-radius:11px;background:#fff;border:1px solid #B6EBD7;color:#059669;display:flex;align-items:center;justify-content:center;flex:none;")}><ShieldCheck style={s("width:20px;height:20px;")} /></span><div style={s("font-size:13px;color:#3F6B57;")}><b style={s("color:#0F7B53;")}>{sel.name}: ไม่มีเหตุฉุกเฉินขณะนี้</b> · พื้นที่ปกติ พร้อมเป็นสาขาผู้ส่งช่วยภาคอื่น</div></div>
      )}

      <div style={s("display:grid;grid-template-columns:500px 1fr;gap:18px;align-items:start;")}>
        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
          <div style={s("padding:14px 18px 12px;border-bottom:1px solid #F1EEF8;display:flex;align-items:center;justify-content:space-between;")}><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>แผนที่ประเทศไทย — จุดเกิดเหตุ & ศูนย์รับของ</h2><div style={s("display:flex;align-items:center;gap:10px;")}><div style={s("display:flex;align-items:center;gap:5px;font-size:10.5px;color:#9B95B0;")}><span style={s("width:9px;height:9px;border-radius:50%;background:#DC2626;")} />มีเหตุ</div><div style={s("display:flex;align-items:center;gap:5px;font-size:10.5px;color:#9B95B0;")}><span style={s("width:9px;height:9px;border-radius:50%;background:#D97706;")} />เฝ้าระวัง</div><div style={s("display:flex;align-items:center;gap:5px;font-size:10.5px;color:#9B95B0;")}><span style={s("width:9px;height:9px;border-radius:50%;background:#059669;")} />ปกติ</div></div></div>
          <div style={s("padding:14px;position:relative;")}>
            <div style={s("position:relative;border-radius:14px;overflow:hidden;border:1px solid #E3E8EF;background:linear-gradient(180deg,#EAF1F7,#E2ECF4);")}>
              <img src="/thailand-map.png" alt="แผนที่ประเทศไทย" style={{ display: "block", width: "100%", height: "auto" } as CSSProperties} />
              <div style={{ position: "absolute", left: `${sel.x}%`, top: `${sel.y}%`, transform: "translate(-50%,-100%)", width: 46, height: 46, borderRadius: "50%", border: "2.5px dashed #6D28D9", marginTop: -13, zIndex: 2, pointerEvents: "none" } as CSSProperties} />
              {zones.map((z) => (
                <div key={z.id} onClick={() => setSelId(z.id)} style={{ position: "absolute", left: `${z.x}%`, top: `${z.y}%`, transform: "translate(-50%,-100%)", cursor: "pointer", zIndex: 3 } as CSSProperties}>
                  {z.sev === "red" ? <div style={{ position: "absolute", left: "50%", bottom: -4, transform: "translate(-50%,50%)", width: 30, height: 30, borderRadius: "50%", background: "#DC2626", opacity: 0.3, animation: "pdot 1.8s infinite" } as CSSProperties} /> : null}
                  <div style={{ position: "relative", width: 26, height: 26, borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", background: pinColor(z.sev), border: "2.5px solid #fff", boxShadow: "0 5px 10px -2px rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center" } as CSSProperties}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", transform: "rotate(45deg)" } as CSSProperties} /></div>
                  <div style={{ textAlign: "center", fontSize: 10.5, fontWeight: 600, color: "#3B3654", marginTop: 4, whiteSpace: "nowrap", textShadow: "0 1px 2px #fff,0 0 3px #fff" } as CSSProperties}>{z.name}</div>
                </div>
              ))}
            </div>
            <div style={s("display:flex;align-items:center;justify-content:space-between;margin-top:10px;gap:8px;flex-wrap:wrap;")}><p style={s("margin:0;font-size:11px;color:#9B95B0;")}>กดหมุดบนแผนที่เพื่อเลือกพื้นที่ประสบภัย</p><a href="https://disaster.gistda.or.th" target="_blank" rel="noreferrer" style={s("text-decoration:none;display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:#7C3AED;background:#F4EEFE;border:1px solid #E4D7FB;padding:4px 9px;border-radius:7px;")}><Satellite style={s("width:12px;height:12px;")} /> ข้อมูลภัยพิบัติ: GISTDA Open API</a></div>
          </div>
        </div>

        <div style={s("display:flex;flex-direction:column;gap:16px;")}>
          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
            {sel.incident ? (
              <>
                <div style={s("display:flex;align-items:center;gap:11px;margin-bottom:13px;")}><span style={s(`width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:none;background:${sel.sev === "amber" ? "#FFFAEB" : "#FEF2F2"};border:1px solid ${sel.sev === "amber" ? "#FBE3A2" : "#FBD5D5"};`)}><sel.incident.icon style={s(`width:21px;height:21px;color:${sel.incident.sevCol};`)} /></span><div style={s("flex:1;min-width:0;")}><div style={s("font-size:14.5px;font-weight:600;color:#1C1830;line-height:1.25;")}>{sel.incident.title}</div><div style={s("font-size:11.5px;color:#9B95B0;margin-top:2px;")}>{sel.incident.typeLabel} · {sel.name}</div></div></div>
                <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:9px;")}><div style={s("background:#FAF9FD;border:1px solid #F0EDF7;border-radius:10px;padding:9px 11px;")}><div style={s("font-size:10px;color:#9B95B0;")}>ระดับความรุนแรง</div><div style={s(`font-size:13px;font-weight:600;margin-top:2px;color:${sel.incident.sevCol};`)}>{sel.incident.sevLbl}</div></div><div style={s("background:#FAF9FD;border:1px solid #F0EDF7;border-radius:10px;padding:9px 11px;")}><div style={s("font-size:10px;color:#9B95B0;")}>เริ่มเหตุ</div><div style={s("font-size:13px;font-weight:600;margin-top:2px;color:#1C1830;")}>{sel.incident.since}</div></div></div>
                <div style={s("margin-top:9px;background:#FEF2F2;border:1px solid #FBD5D5;border-radius:10px;padding:9px 11px;font-size:11.5px;color:#8A4B4B;line-height:1.5;")}>{sel.incident.area}</div>
                <div style={s("margin-top:9px;display:flex;align-items:center;gap:7px;font-size:11.5px;color:#5A5470;")}><MapPin style={s("width:14px;height:14px;color:#7C3AED;")} /> ศูนย์รับของ: <b style={s("color:#1C1830;")}>{sel.incident.pt}</b></div>
              </>
            ) : (
              <div style={s("display:flex;align-items:center;gap:11px;")}><span style={s("width:42px;height:42px;border-radius:12px;background:#ECFDF5;border:1px solid #B6EBD7;color:#059669;display:flex;align-items:center;justify-content:center;flex:none;")}><ShieldCheck style={s("width:21px;height:21px;")} /></span><div><div style={s("font-size:14.5px;font-weight:600;color:#1C1830;")}>{sel.name}</div><div style={s("font-size:11.5px;color:#0F7B53;margin-top:2px;")}>ไม่มีเหตุฉุกเฉิน · พร้อมเป็นผู้ส่งช่วย</div></div></div>
            )}
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:14px;padding:12px 16px;box-shadow:0 10px 24px -20px rgba(28,24,48,.4);")}>
            <div style={s("font-size:11px;font-weight:600;color:#9B95B0;letter-spacing:.4px;text-transform:uppercase;margin-bottom:8px;")}>เลือกภาค</div>
            <div style={s("display:flex;gap:7px;flex-wrap:wrap;")}>
              {zones.map((z) => (
                <button key={z.id} onClick={() => setSelId(z.id)} style={s(`height:34px;padding:0 13px;border-radius:9px;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;${selId === z.id ? "background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;border:0;box-shadow:0 8px 18px -8px rgba(109,40,217,.65);" : "background:#FAF9FD;color:#5A5470;border:1px solid #E5E1F0;"}`)}>{z.name}</button>
              ))}
            </div>
          </div>

          <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;padding:14px 18px 12px;border-bottom:1px solid #F1EEF8;")}><div><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>รายการขอระดมของ</h2><p style={s("margin:2px 0 0;font-size:11px;color:#9B95B0;")}>ได้รับแล้ว {needFull}/{needed.length} รายการ · เลือกพื้นที่ {sel.name}</p></div><span style={s("display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:600;color:#B45309;background:#FFFAEB;border:1px solid #FBE3A2;padding:4px 10px;border-radius:99px;")}><Package style={s("width:13px;height:13px;")} /> {needed.length} รายการ</span></div>
            <div style={s("padding:14px 18px;display:flex;flex-direction:column;gap:13px;")}>
              {needed.map((it) => (
                <div key={it.name}>
                  <div style={s("display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;")}><span style={s("font-size:12.5px;font-weight:500;color:#1C1830;")}>{it.name}</span><span style={s(`font-size:10px;font-weight:600;padding:2px 9px;border-radius:99px;${tagStyle(it.tagTone)}`)}>{it.tag}</span></div>
                  <div style={s("display:flex;align-items:center;gap:10px;")}><div style={s("flex:1;height:8px;border-radius:99px;background:#F0EDF7;overflow:hidden;")}><div style={{ height: "100%", borderRadius: 99, width: `${Math.round((it.got / it.need) * 100)}%`, background: barCol(it.tagTone) } as CSSProperties} /></div><span className="mono" style={s("font-size:11px;color:#5A5470;width:104px;text-align:right;flex:none;")}>{it.got} / {it.need} {it.unit}</span></div>
                </div>
              ))}
            </div>
            <div style={s("display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:12px 18px;border-top:1px solid #F1EEF8;")}><button onClick={() => setEmModal("req")} style={s("display:flex;align-items:center;gap:7px;height:38px;padding:0 16px;border:0;border-radius:10px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;box-shadow:0 10px 22px -10px rgba(109,40,217,.65);")}><Megaphone style={s("width:15px;height:15px;")} /> ส่งคำขอระดมของเพิ่ม</button></div>
          </div>
        </div>
      </div>

      <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;margin-top:16px;")}>
        <div style={s("display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:15px 18px 13px;border-bottom:1px solid #F1EEF8;flex-wrap:wrap;")}>
          <div><div style={s("display:flex;align-items:center;gap:8px;")}><h2 style={s("margin:0;font-size:14px;font-weight:600;color:#1C1830;")}>สาขาที่มีของ & สถานะตอบรับ</h2><span style={s("font-size:10px;font-weight:600;color:#5B21B6;background:#F4EEFE;border:1px solid #E4D7FB;padding:2px 8px;border-radius:99px;")}>เรียงตามระยะทางจากจุดเกิดเหตุ</span></div><p style={s("margin:3px 0 0;font-size:11.5px;color:#9B95B0;")}>ระดมจากสาขาใกล้ที่สุดก่อน · ส่งช่วยแล้วคืน หรือเปิด PR แลกภายหลัง</p></div>
          <div style={s("display:flex;gap:8px;")}><span style={s("display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#0F7B53;background:#ECFDF5;border:1px solid #B6EBD7;padding:5px 11px;border-radius:99px;")}><CheckCircle2 style={s("width:13px;height:13px;")} /> ตอบรับ {respCount}/{supply.length}</span><span style={s("display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#B45309;background:#FFFAEB;border:1px solid #FBE3A2;padding:5px 11px;border-radius:99px;")}><Clock style={s("width:13px;height:13px;")} /> รอ {pendCount}</span></div>
        </div>
        <div style={s("overflow-x:auto;")}>
          <table style={s("width:100%;border-collapse:collapse;font-size:12.5px;min-width:680px;")}>
            <thead><tr style={s("background:#FAF9FD;")}><th style={s("text-align:left;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 18px;")}>สาขาผู้ส่ง</th><th style={s("text-align:right;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 10px;")}>ระยะทาง</th><th style={s("text-align:right;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 10px;")}>ETA</th><th style={s("text-align:left;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 14px;")}>ของที่ส่งได้</th><th style={s("text-align:left;font-size:10px;font-weight:600;color:#9B95B0;text-transform:uppercase;padding:9px 14px;")}>สถานะตอบรับ</th><th style={s("padding:9px 18px;")} /></tr></thead>
            <tbody>
              {supply.map((s2) => {
                const info = stInfo(s2.st);
                const Icon = info.icon;
                return (
                  <tr key={s2.branch} className="dash-row" onClick={() => setSupplyDetail(s2)} style={s("border-top:1px solid #F4F2FA;cursor:pointer;")}>
                    <td style={s("padding:12px 18px;")}><div style={s("font-weight:600;color:#1C1830;")}>{s2.branch}</div><div style={s("font-size:10.5px;color:#9B95B0;margin-top:1px;")}>{s2.region}</div></td>
                    <td style={s("padding:12px 10px;text-align:right;")}><span className="mono" style={s("font-size:13px;font-weight:600;color:#1C1830;")}>{s2.km}</span> <span style={s("font-size:10px;color:#9B95B0;")}>กม.</span></td>
                    <td style={s("padding:12px 10px;text-align:right;color:#5A5470;")}>{s2.eta}</td>
                    <td style={s("padding:12px 14px;color:#5A5470;")}>{s2.has}</td>
                    <td style={s("padding:12px 14px;")}><span style={s(`display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:99px;color:${info.col};background:${info.bg};`)}><Icon style={s("width:13px;height:13px;")} /> {info.label}</span></td>
                    <td style={s("padding:12px 18px;text-align:right;")}><ChevronRight style={s("width:16px;height:16px;color:#C4BBD6;")} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={s("display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 18px;border-top:1px solid #F1EEF8;flex-wrap:wrap;")}><div style={s("display:flex;align-items:flex-start;gap:8px;font-size:11px;color:#7B6A45;background:#FFFBEB;border:1px solid #FBE3A2;border-radius:9px;padding:8px 11px;")}><ShieldAlert style={s("width:14px;height:14px;color:#D97706;margin-top:1px;")} /> เพดานการส่งช่วย: ไม่เกิน 90% ของ Safety Stock แต่ละสาขา — กันผู้ส่งไม่ให้ขาดเอง</div><button onClick={() => setEmModal("dispatch")} style={s("display:flex;align-items:center;gap:7px;height:40px;padding:0 18px;border:0;border-radius:11px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 10px 22px -10px rgba(109,40,217,.65);")}><Truck style={s("width:16px;height:16px;")} /> สั่งระดม & นัดขนส่ง</button></div>
      </div>

      {/* ===== EMERGENCY MODAL ===== */}
      {emModal ? (
        <div onClick={() => setEmModal(null)} style={s("position:fixed;inset:0;z-index:200;background:rgba(28,24,48,.55);backdrop-filter:blur(3px);display:flex;align-items:flex-start;justify-content:center;padding:48px 20px;overflow-y:auto;")}>
          <div onClick={(e) => e.stopPropagation()} style={s("width:560px;max-width:100%;background:#fff;border-radius:18px;box-shadow:0 30px 70px -20px rgba(28,24,48,.6);overflow:hidden;")}>
            {emModal === "req" ? (
              <>
                <div style={s("padding:18px 22px;background:linear-gradient(100deg,#7A0E1E,#B91C1C 60%,#DC2626);display:flex;align-items:center;gap:13px;")}>
                  <span style={s("width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.16);color:#fff;display:flex;align-items:center;justify-content:center;flex:none;")}><Megaphone style={s("width:21px;height:21px;")} /></span>
                  <div style={s("flex:1;")}><div style={s("font-size:16px;font-weight:600;color:#fff;")}>ขอระดมพัสดุฉุกเฉิน</div><div style={s("font-size:11.5px;color:rgba(255,255,255,.8);")}>{sel.name} · ส่งคำขอไปยังสาขาในเครือข่าย</div></div>
                  <button onClick={() => setEmModal(null)} style={s("border:0;background:transparent;cursor:pointer;padding:0;")}><X style={s("width:20px;height:20px;color:rgba(255,255,255,.8);")} /></button>
                </div>
                <div style={s("padding:20px 22px;")}>
                  <div style={s("display:flex;align-items:flex-start;gap:10px;background:#FFFBEB;border:1px solid #FBE3A2;border-radius:12px;padding:11px 13px;margin-bottom:16px;")}><Satellite style={s("width:16px;height:16px;color:#D97706;margin-top:1px;")} /><div style={s("font-size:11.5px;color:#7B6A45;line-height:1.55;")}>ขอของล่วงหน้าได้ <b style={s("color:#92400E;")}>ก่อน GISTDA ยืนยันพื้นที่ภัย</b> — ข้อมูลคำขอนี้จะถูกเก็บไว้เพื่อ <b style={s("color:#92400E;")}>ฝึกโมเดลคาดการณ์ภัยพิบัติในอนาคต</b></div></div>
                  <div style={s("display:flex;flex-direction:column;gap:13px;")}>
                    <div>
                      <label style={s("font-size:12px;font-weight:600;color:#3B3654;display:block;margin-bottom:6px;")}>ประเภทภัย</label>
                      <div style={s("display:flex;gap:7px;flex-wrap:wrap;")}>
                        {["น้ำท่วม", "พายุ", "ดินสไลด์", "ไฟป่า"].map((t) => (
                          <button key={t} onClick={() => setEmType(t)} style={s(`font-size:12px;padding:7px 13px;border-radius:9px;font-family:inherit;cursor:pointer;font-weight:${emType === t ? "600" : "400"};${emType === t ? "color:#B91C1C;background:#FEF2F2;border:1.5px solid #FBD5D5;" : "color:#7B7591;background:#FAF9FD;border:1px solid #E5E1F0;"}`)}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:11px;")}>
                      <div><label style={s("font-size:12px;font-weight:600;color:#3B3654;display:block;margin-bottom:6px;")}>พื้นที่ / อำเภอ</label><input defaultValue={sel.incident?.area.split(" — ")[0] ?? "อ.แม่อาย จ.เชียงใหม่"} style={s("width:100%;height:40px;border:1px solid #E5E1F0;border-radius:10px;background:#FAF9FD;padding:0 12px;font-family:inherit;font-size:13px;color:#1C1830;outline:none;")} /></div>
                      <div><label style={s("font-size:12px;font-weight:600;color:#3B3654;display:block;margin-bottom:6px;")}>ระดับความเร่งด่วน</label><input defaultValue="วิกฤต — ภายใน 6 ชม." style={s("width:100%;height:40px;border:1px solid #E5E1F0;border-radius:10px;background:#FAF9FD;padding:0 12px;font-family:inherit;font-size:13px;color:#1C1830;outline:none;")} /></div>
                    </div>
                    <div>
                      <label style={s("font-size:12px;font-weight:600;color:#3B3654;display:block;margin-bottom:6px;")}>รายการพัสดุที่ต้องการ</label>
                      <div style={s("position:relative;margin-bottom:8px;")}><Search style={s("position:absolute;left:11px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:#9B95B0;")} /><input value={emSearch} onChange={(e) => setEmSearch(e.target.value)} placeholder="ค้นหาพัสดุ เช่น หม้อแปลง, เคเบิล, เสา…" style={s("width:100%;height:40px;border:1px solid #E5E1F0;border-radius:10px;background:#FAF9FD;padding:0 12px 0 34px;font-family:inherit;font-size:13px;color:#1C1830;outline:none;")} /></div>
                      {emFiltered.length > 0 ? (
                        <div style={s("border:1px solid #EBE7F5;border-radius:10px;overflow:hidden;margin-bottom:10px;max-height:148px;overflow-y:auto;")}>
                          {emFiltered.map((opt) => (
                            <div key={opt.name} className="dash-row" onClick={() => { setEmChosen((p) => [...p, { ...opt, qty: 1 }]); setEmSearch(""); }} style={s("display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;cursor:pointer;border-bottom:1px solid #F4F2FA;")}>
                              <span style={s("font-size:12.5px;color:#1C1830;")}>{opt.name} <span style={s("font-size:10.5px;color:#9B95B0;")}>/ {opt.unit}</span></span>
                              <span style={s("width:22px;height:22px;border-radius:7px;background:#F4EEFE;color:#6D28D9;display:flex;align-items:center;justify-content:center;flex:none;")}><Plus style={s("width:14px;height:14px;")} /></span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <div style={s("display:flex;flex-direction:column;gap:7px;")}>
                        {emChosen.map((it, idx) => (
                          <div key={it.name} style={s("display:flex;align-items:center;gap:9px;background:#F4EEFE;border:1px solid #E4D7FB;border-radius:10px;padding:7px 9px 7px 12px;")}>
                            <span style={s("flex:1;min-width:0;font-size:12.5px;font-weight:500;color:#3B1170;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;")}>{it.name}</span>
                            <input value={it.qty} onChange={(e) => setEmChosen((p) => p.map((x, i) => i === idx ? { ...x, qty: Number(e.target.value) || 0 } : x))} type="number" style={s("width:74px;height:32px;border:1px solid #D5C5EC;border-radius:8px;background:#fff;padding:0 9px;font-family:inherit;font-size:12.5px;font-weight:600;color:#1C1830;text-align:right;outline:none;")} />
                            <span style={s("font-size:11px;color:#7A5BA8;width:42px;flex:none;")}>{it.unit}</span>
                            <button onClick={() => setEmChosen((p) => p.filter((_, i) => i !== idx))} style={s("width:26px;height:26px;border-radius:7px;background:#fff;border:1px solid #E4D7FB;color:#9B6FCF;display:flex;align-items:center;justify-content:center;flex:none;cursor:pointer;")}><X style={s("width:14px;height:14px;")} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={s("display:flex;align-items:center;gap:9px;font-size:11.5px;color:#5A5470;")}><span style={s("width:18px;height:18px;border-radius:5px;background:#6D28D9;display:flex;align-items:center;justify-content:center;flex:none;")}><Check style={s("width:12px;height:12px;color:#fff;")} /></span> บันทึกคำขอนี้เป็นข้อมูลฝึกโมเดลคาดการณ์ (GISTDA + PEA)</div>
                    <div>
                      <label style={s("font-size:12px;font-weight:600;color:#3B3654;display:block;margin-bottom:6px;")}>วิธีคืนของ (เมื่อสาขาผู้ให้ส่งช่วย)</label>
                      <div style={s("display:flex;gap:8px;")}>
                        <button onClick={() => setEmReturn("borrow")} style={rmBtn(emReturn === "borrow")}>ยืม-คืนของเดิม</button>
                        <button onClick={() => setEmReturn("swap")} style={rmBtn(emReturn === "swap")}>แลกพัสดุ</button>
                        <button onClick={() => setEmReturn("pr")} style={rmBtn(emReturn === "pr")}>เปิด PR ซื้อคืน</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={s("display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:14px 22px;border-top:1px solid #F1EEF8;")}><button onClick={() => setEmModal(null)} style={s("height:40px;padding:0 16px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;")}>ยกเลิก</button><button onClick={() => setEmModal(null)} style={s("display:flex;align-items:center;gap:7px;height:40px;padding:0 18px;border:0;border-radius:10px;background:#DC2626;color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 10px 22px -10px rgba(220,38,38,.7);")}><Send style={s("width:16px;height:16px;")} /> ส่งคำขอระดม</button></div>
              </>
            ) : (
              <>
                <div style={s("padding:18px 22px;background:linear-gradient(135deg,#6D28D9,#C0249B);display:flex;align-items:center;gap:13px;")}>
                  <span style={s("width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.16);color:#fff;display:flex;align-items:center;justify-content:center;flex:none;")}><Truck style={s("width:21px;height:21px;")} /></span>
                  <div style={s("flex:1;")}><div style={s("font-size:16px;font-weight:600;color:#fff;")}>สั่งระดม & นัดขนส่ง</div><div style={s("font-size:11.5px;color:rgba(255,255,255,.8);")}>ยืนยันสาขาผู้ส่ง → ออกใบยืม + แผนขนส่ง</div></div>
                  <button onClick={() => setEmModal(null)} style={s("border:0;background:transparent;cursor:pointer;padding:0;")}><X style={s("width:20px;height:20px;color:rgba(255,255,255,.8);")} /></button>
                </div>
                <div style={s("padding:20px 22px;")}>
                  <div style={s("font-size:11px;font-weight:600;letter-spacing:.4px;color:#9B95B0;text-transform:uppercase;margin-bottom:9px;")}>ขั้นตอนการระดม</div>
                  <div style={s("position:relative;padding-left:26px;")}>
                    <div style={s("position:absolute;left:9px;top:6px;bottom:14px;width:2px;background:#EDE6FA;")} />
                    <div style={s("position:relative;margin-bottom:13px;")}><span style={s("position:absolute;left:-26px;top:0;width:20px;height:20px;border-radius:50%;background:#059669;color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;")}>✓</span><div style={s("font-size:13px;font-weight:600;color:#1C1830;")}>ยืนยันสาขาผู้ส่ง {respCount} แห่ง</div><div style={s("font-size:11.5px;color:#7B7591;margin-top:2px;")}>I010 (1 ชม.) · I020 (2.5 ชม.) — รวมของครบตามคำขอ</div></div>
                    <div style={s("position:relative;margin-bottom:13px;")}><span style={s("position:absolute;left:-26px;top:0;width:20px;height:20px;border-radius:50%;background:#6D28D9;color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;")}>2</span><div style={s("font-size:13px;font-weight:600;color:#1C1830;")}>ออกใบยืม + ล็อก 90% Safety Stock</div><div style={s("font-size:11.5px;color:#7B7591;margin-top:2px;")}>ระบบกันสต็อกผู้ส่งอัตโนมัติ · กำหนดเงื่อนไขคืน/PR แลก</div></div>
                    <div style={s("position:relative;")}><span style={s("position:absolute;left:-26px;top:0;width:20px;height:20px;border-radius:50%;background:#6D28D9;color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;")}>3</span><div style={s("font-size:13px;font-weight:600;color:#1C1830;")}>นัดขนส่ง + แจ้งศูนย์รับของ</div><div style={s("font-size:11.5px;color:#7B7591;margin-top:2px;")}>{sel.incident?.pt ?? "ศูนย์รับของ"} · ติดตามสถานะแบบเรียลไทม์</div></div>
                  </div>
                  <div style={s("margin-top:16px;display:flex;align-items:center;gap:11px;background:#F0FDF9;border:1px solid #B6EBD7;border-radius:12px;padding:12px 14px;")}><Clock style={s("width:17px;height:17px;color:#059669;")} /><div style={s("font-size:12px;color:#3F6B57;line-height:1.5;")}>ETA เร็วสุด <b style={s("color:#0F7B53;")}>1 ชม.</b> (I010) · ครบทุกรายการภายใน <b style={s("color:#0F7B53;")}>2.5 ชม.</b></div></div>
                </div>
                <div style={s("display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:14px 22px;border-top:1px solid #F1EEF8;")}><button onClick={() => setEmModal(null)} style={s("height:40px;padding:0 16px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;")}>ยกเลิก</button><button onClick={() => setEmModal(null)} style={s("display:flex;align-items:center;gap:7px;height:40px;padding:0 18px;border:0;border-radius:10px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 10px 22px -10px rgba(109,40,217,.65);")}><Check style={s("width:16px;height:16px;")} /> ยืนยันสั่งระดม</button></div>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* ===== SUPPLY SOURCE DETAIL MODAL ===== */}
      {supplyDetail ? (() => {
        const info = stInfo(supplyDetail.st);
        const Icon = info.icon;
        const sendable = supplyDetail.has.split(" · ");
        return (
          <div onClick={() => setSupplyDetail(null)} style={s("position:fixed;inset:0;z-index:200;background:rgba(28,24,48,.55);backdrop-filter:blur(3px);display:flex;align-items:flex-start;justify-content:center;padding:48px 20px;overflow-y:auto;")}>
            <div onClick={(e) => e.stopPropagation()} style={s("width:480px;max-width:100%;background:#fff;border-radius:18px;box-shadow:0 30px 70px -20px rgba(28,24,48,.6);overflow:hidden;")}>
              <div style={s("padding:18px 22px;border-bottom:1px solid #F1EEF8;display:flex;align-items:center;gap:13px;")}>
                <span style={s("width:44px;height:44px;border-radius:12px;background:#F4EEFE;color:#6D28D9;display:flex;align-items:center;justify-content:center;flex:none;")}><WarehouseIcon style={s("width:22px;height:22px;")} /></span>
                <div style={s("flex:1;min-width:0;")}><div style={s("font-size:16px;font-weight:600;color:#1C1830;")}>{supplyDetail.branch}</div><div style={s("font-size:11.5px;color:#9B95B0;margin-top:2px;")}>{supplyDetail.region} · ห่างจุดเกิดเหตุ {supplyDetail.km} กม.</div></div>
                <span style={s(`display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:4px 10px;border-radius:99px;color:${info.col};background:${info.bg};flex:none;`)}><Icon style={s("width:13px;height:13px;")} /> {info.label}</span>
              </div>
              <div style={s("padding:18px 22px;")}>
                <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;")}>
                  <div style={s("background:#FAF9FD;border:1px solid #F0EDF7;border-radius:11px;padding:11px 13px;")}><div style={s("display:flex;align-items:center;gap:6px;font-size:10.5px;color:#9B95B0;")}><Navigation style={s("width:13px;height:13px;color:#7C3AED;")} /> ระยะทาง</div><div style={s("font-size:17px;font-weight:700;color:#1C1830;margin-top:4px;")}>{supplyDetail.km} <span style={s("font-size:11px;font-weight:400;color:#9B95B0;")}>กม.</span></div></div>
                  <div style={s("background:#FAF9FD;border:1px solid #F0EDF7;border-radius:11px;padding:11px 13px;")}><div style={s("display:flex;align-items:center;gap:6px;font-size:10.5px;color:#9B95B0;")}><Clock style={s("width:13px;height:13px;color:#2563EB;")} /> ETA</div><div style={s("font-size:17px;font-weight:700;color:#1C1830;margin-top:4px;")}>{supplyDetail.eta}</div></div>
                </div>
                <div style={s("font-size:11px;font-weight:600;letter-spacing:.4px;color:#9B95B0;text-transform:uppercase;margin-bottom:9px;")}>ของที่ส่งช่วยได้</div>
                <div style={s("display:flex;flex-direction:column;gap:8px;margin-bottom:14px;")}>
                  {sendable.map((it, i) => (
                    <div key={i} style={s("display:flex;align-items:center;gap:10px;background:#FAF9FD;border:1px solid #F0EDF7;border-radius:10px;padding:9px 12px;")}>
                      <span style={s("width:30px;height:30px;border-radius:8px;background:#F4EEFE;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}><Package style={s("width:15px;height:15px;")} /></span>
                      <span style={s("flex:1;min-width:0;font-size:12.5px;font-weight:500;color:#1C1830;")}>{it}</span>
                      <span style={s("font-size:10px;font-weight:600;color:#0F7B53;background:#ECFDF5;padding:3px 9px;border-radius:99px;flex:none;")}>พร้อมส่ง</span>
                    </div>
                  ))}
                </div>
                <div style={s("display:flex;align-items:flex-start;gap:8px;background:#FFFBEB;border:1px solid #FBE3A2;border-radius:10px;padding:9px 12px;font-size:11px;color:#7B6A45;line-height:1.5;")}><ShieldAlert style={s("width:14px;height:14px;color:#D97706;margin-top:1px;")} /> ส่งได้ไม่เกิน <b style={s("color:#92400E;")}>90% ของ Safety Stock</b> ของ {supplyDetail.branch} — ระบบกันสต็อกให้คลังผู้ส่งไม่ขาดเอง</div>
                {supplyDetail.st === "accepted" ? (
                  <div style={s("margin-top:12px;display:flex;align-items:center;gap:9px;background:#ECFDF5;border:1px solid #B6EBD7;border-radius:11px;padding:11px 13px;font-size:12px;color:#0F7B53;")}><CheckCircle2 style={s("width:16px;height:16px;")} /> สาขานี้ตอบรับแล้ว · กำลังจัดของและออกใบยืม</div>
                ) : supplyDetail.st === "rejected" ? (
                  <div style={s("margin-top:12px;display:flex;align-items:center;gap:9px;background:#FEF2F2;border:1px solid #FBD5D5;border-radius:11px;padding:11px 13px;font-size:12px;color:#B91C1C;")}><X style={s("width:16px;height:16px;")} /> สาขานี้แจ้งไม่มีของ · ระบบจะข้ามไปสาขาถัดไปอัตโนมัติ</div>
                ) : (
                  <div style={s("margin-top:12px;display:flex;align-items:center;gap:9px;background:#FFFAEB;border:1px solid #FBE3A2;border-radius:11px;padding:11px 13px;font-size:12px;color:#B45309;")}><Clock style={s("width:16px;height:16px;")} /> รอสาขาตอบรับ · ส่งคำขอแล้ว กำลังรอยืนยัน</div>
                )}
              </div>
              <div style={s("display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:14px 22px;border-top:1px solid #F1EEF8;")}>
                <button onClick={() => setSupplyDetail(null)} style={s("height:40px;padding:0 16px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;")}>ปิด</button>
                {supplyDetail.st === "accepted" ? (
                  <button onClick={() => { setSupplyDetail(null); setEmModal("dispatch"); }} style={s("display:flex;align-items:center;gap:7px;height:40px;padding:0 18px;border:0;border-radius:10px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 10px 22px -10px rgba(109,40,217,.65);")}><Truck style={s("width:16px;height:16px;")} /> ดูแผนขนส่ง</button>
                ) : supplyDetail.st === "pending" ? (
                  <button onClick={() => setSupplyDetail(null)} style={s("display:flex;align-items:center;gap:7px;height:40px;padding:0 18px;border:0;border-radius:10px;background:#D97706;color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 10px 22px -10px rgba(217,119,6,.6);")}><Bell style={s("width:16px;height:16px;")} /> ส่งแจ้งเตือนติดตาม</button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })() : null}
    </div>
  );
}

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
    <div>
      <div style={s("margin-bottom:18px;")}>
        <h1 style={s("margin:0 0 5px;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>ตั้งค่างบประมาณ 3 ชั้น</h1>
        <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>กำหนดวงเงิน คลัง / เขต / ส่วนกลาง — มีผลกับการตรวจงบและเส้นทางอนุมัติของคำขอใหม่ทันที</p>
      </div>

      <div style={s("display:flex;align-items:center;gap:14px;background:linear-gradient(100deg,#FBF4FF,#FCE9F5);border:1px solid #E6D8FB;border-radius:14px;padding:14px 18px;margin-bottom:18px;")}>
        <span style={s("width:40px;height:40px;border-radius:11px;background:#fff;border:1px solid #E6D8FB;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}><Sparkles style={s("width:19px;height:19px;")} /></span>
        <div style={s("flex:1;min-width:0;")}>
          <div style={s("font-size:13.5px;font-weight:600;color:#5B21B6;")}>AI แนะนำงบประมาณ</div>
          <div style={s("font-size:12px;color:#6B6483;margin-top:2px;")}>งบเขต A จะหมดใน <b style={s("color:#B45309;")}>~18 วัน</b> ตามอัตราใช้เฉลี่ย ฿38K/วัน — แนะนำกันงบ Critical SKU ไว้ <b style={s("color:#3B1170;")}>{formatTHB(180000)}</b></div>
        </div>
        <button style={s("height:38px;padding:0 15px;border:1px solid #C9B0F2;border-radius:10px;background:#fff;color:#6D28D9;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;flex:none;")}>กันงบอัตโนมัติ</button>
      </div>

      <div style={s("display:grid;grid-template-columns:1.5fr 1fr;gap:18px;align-items:start;")}>
        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);overflow:hidden;")}>
          <div style={s("padding:16px 18px 13px;border-bottom:1px solid #F1EEF8;")}><h2 style={s("margin:0;font-size:15px;font-weight:600;color:#1C1830;")}>วงเงินงบ ปีงบ 2569</h2></div>
          <div style={s("padding:16px 18px;display:flex;flex-direction:column;gap:14px;")}>
            <div style={s("display:flex;align-items:center;gap:14px;")}>
              <span style={s("width:40px;height:40px;border-radius:11px;background:#F4EEFE;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}><WarehouseIcon style={s("width:19px;height:19px;")} /></span>
              <div style={s("flex:1;min-width:0;")}>
                <div style={s("font-size:13px;font-weight:600;color:#1C1830;")}>งบคลัง {warehouses[0]?.id ?? "I010"}</div>
                <div style={s("font-size:11px;color:#9B95B0;")}>งบคงเหลือ</div>
                <div style={s("height:6px;border-radius:99px;background:#F0EDF7;margin-top:6px;max-width:280px;")}><div style={s("width:47%;height:100%;border-radius:99px;background:#7C3AED;")}></div></div>
              </div>
              <div style={s("position:relative;flex:none;")}><span style={s("position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#9B95B0;font-size:13px;")}>฿</span><input type="number" min={0} value={draftBudget.localBudgets[warehouses[0]?.id ?? ""] ?? ""} onChange={e => updateLocalBudget(warehouses[0]?.id ?? "", e.target.value)} style={s("width:120px;height:40px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;padding:0 11px 0 24px;font-family:inherit;font-size:13px;font-weight:600;color:#1C1830;text-align:right;outline:none;")} /></div>
            </div>
            <div style={s("display:flex;align-items:center;gap:14px;")}>
              <span style={s("width:40px;height:40px;border-radius:11px;background:#EFF4FF;color:#2563EB;display:flex;align-items:center;justify-content:center;flex:none;")}><Building2 style={s("width:19px;height:19px;")} /></span>
              <div style={s("flex:1;min-width:0;")}>
                <div style={s("font-size:13px;font-weight:600;color:#1C1830;")}>งบเขต A · {regionLabels["North"] ?? "ภาคเหนือ"}</div>
                <div style={s("font-size:11px;color:#9B95B0;")}>{formatTHB(regionalTotal)} คงเหลือ</div>
                <div style={s("height:6px;border-radius:99px;background:#F0EDF7;margin-top:6px;max-width:280px;")}><div style={s("width:53%;height:100%;border-radius:99px;background:#2563EB;")}></div></div>
              </div>
              <div style={s("position:relative;flex:none;")}><span style={s("position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#9B95B0;font-size:13px;")}>฿</span><input type="number" min={0} value={draftBudget.regionalBudgets["North"] ?? ""} onChange={e => updateRegionalBudget("North" as BudgetRegion, e.target.value)} style={s("width:120px;height:40px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;padding:0 11px 0 24px;font-family:inherit;font-size:13px;font-weight:600;color:#1C1830;text-align:right;outline:none;")} /></div>
            </div>
            <div style={s("display:flex;align-items:center;gap:14px;")}>
              <span style={s("width:40px;height:40px;border-radius:11px;background:#ECFDF5;color:#059669;display:flex;align-items:center;justify-content:center;flex:none;")}><Landmark style={s("width:19px;height:19px;")} /></span>
              <div style={s("flex:1;min-width:0;")}>
                <div style={s("font-size:13px;font-weight:600;color:#1C1830;")}>งบส่วนกลาง</div>
                <div style={s("font-size:11px;color:#9B95B0;")}>{formatTHB(draftBudgetSettings.centralBudgetRemaining)} คงเหลือ</div>
                <div style={s("height:6px;border-radius:99px;background:#F0EDF7;margin-top:6px;max-width:280px;")}><div style={s("width:76%;height:100%;border-radius:99px;background:#059669;")}></div></div>
              </div>
              <div style={s("position:relative;flex:none;")}><span style={s("position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#9B95B0;font-size:13px;")}>฿</span><input type="number" min={0} value={draftBudget.centralBudgetRemaining} onChange={e => setDraftBudget(c => ({...c, centralBudgetRemaining: e.target.value}))} style={s("width:120px;height:40px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;padding:0 11px 0 24px;font-family:inherit;font-size:13px;font-weight:600;color:#1C1830;text-align:right;outline:none;")} /></div>
            </div>
            <div style={s("display:flex;flex-direction:column;gap:9px;")}>
              <div style={s("display:flex;flex-direction:column;gap:4px;")}><label style={s("font-size:12px;font-weight:500;color:#5A5470;")}>หมายเหตุการแก้งบ</label><textarea value={budgetNote} onChange={e => setBudgetNote(e.target.value)} style={s("resize:vertical;border:1px solid #E5E1F0;border-radius:10px;padding:9px 12px;font-family:inherit;font-size:12.5px;color:#1C1830;outline:none;min-height:60px;")} /></div>
            </div>
            <div style={s("display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #F1EEF8;padding-top:14px;")}>
              <button type="button" onClick={() => setDraftBudget(budgetSettingsToInputDraft(defaultBudgetSettings))} style={s("height:40px;padding:0 16px;border:1px solid #E5E1F0;border-radius:11px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;")}>รีเซ็ต</button>
              <button type="button" onClick={() => onSave(budgetInputDraftToSettings(draftBudget, budgetSettings), budgetNote)} style={s("display:flex;align-items:center;gap:7px;height:40px;padding:0 18px;border:0;border-radius:11px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 10px 22px -10px rgba(109,40,217,.7);")}><Save style={s("width:16px;height:16px;")} /> บันทึกงบ</button>
            </div>
          </div>
        </div>

        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
          <h2 style={s("margin:0 0 12px;font-size:14px;font-weight:600;color:#1C1830;")}>ประวัติการแก้งบ</h2>
          <div style={s("display:flex;flex-direction:column;gap:11px;")}>
            {budgetLogs.length === 0 ? (
              <div style={s("text-align:center;padding:20px;color:#9B95B0;font-size:12px;")}>ยังไม่มีประวัติ</div>
            ) : budgetLogs.slice(0, 5).map(log => (
              <div key={log.id} style={s("display:flex;gap:10px;")}><span style={s("width:7px;height:7px;border-radius:50%;background:#7C3AED;margin-top:5px;flex:none;")}></span><div><div style={s("font-size:12px;color:#1C1830;")}><b>{log.target}</b> {log.oldValue} → {log.newValue}</div><div style={s("font-size:10.5px;color:#9B95B0;")}>{log.createdAt} · {log.note}</div></div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPage({
  formulaPolicy,
  formulaVersions,
  changeLogs,
  onSaveFormulaPolicy,
  onClearDemoHistory,
  onFactoryReset,
}: {
  formulaPolicy: FormulaPolicyState;
  formulaVersions: FormulaVersionRecord[];
  changeLogs: ChangeLogEntry[];
  onSaveFormulaPolicy: (policy: FormulaPolicyState, note: string) => void;
  onClearDemoHistory: () => void;
  onFactoryReset: () => void;
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

  const slButtons = [
    { label: "90%", value: 0.90 },
    { label: "95%", value: 0.95 },
    { label: "97%", value: 0.97 },
    { label: "99%", value: 0.99 },
  ];

  return (
    <div>
      <div style={s("margin-bottom:18px;")}>
        <h1 style={s("margin:0 0 5px;font-size:23px;font-weight:600;letter-spacing:-.2px;color:#1C1830;")}>ตั้งค่าสูตรคำนวณ</h1>
        <p style={s("margin:0;font-size:13.5px;color:#7B7591;")}>ปรับ Service Level, Factor และนโยบายสูตร — บันทึกแล้วสร้าง formula version ใหม่ (snapshot เก่าไม่ถูกแก้)</p>
      </div>

      <div style={s("display:flex;align-items:center;gap:14px;background:linear-gradient(100deg,#FBF4FF,#FCE9F5);border:1px solid #E6D8FB;border-radius:14px;padding:14px 18px;margin-bottom:18px;")}>
        <span style={s("width:40px;height:40px;border-radius:11px;background:#fff;border:1px solid #E6D8FB;color:#7C3AED;display:flex;align-items:center;justify-content:center;flex:none;")}><GitBranch style={s("width:19px;height:19px;")} /></span>
        <div style={s("flex:1;min-width:0;")}>
          <div style={s("font-size:13.5px;font-weight:600;color:#5B21B6;")}>AI auto-tune แนะนำ</div>
          <div style={s("font-size:12px;color:#6B6483;margin-top:2px;")}>จาก feedback error เฉลี่ย +40% ในฤดูฝน — แนะนำปรับ <b style={s("color:#3B1170;")}>Seasonal Factor 1.20 → 1.28</b> สร้างสูตร v1.1</div>
        </div>
        <button onClick={() => updateDraftNumber("seasonalFactor", 1.28)} style={s("height:38px;padding:0 15px;border:0;border-radius:10px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;flex:none;")}>ใช้คำแนะนำ</button>
      </div>

      <div style={s("display:grid;grid-template-columns:1.5fr 1fr;gap:18px;align-items:start;")}>
        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:18px;box-shadow:0 1px 2px rgba(28,24,48,.04),0 16px 32px -26px rgba(28,24,48,.3);")}>
          <h2 style={s("margin:0 0 4px;font-size:15px;font-weight:600;color:#1C1830;")}>Formula Policy</h2>
          <p style={s("margin:0 0 16px;font-size:11.5px;color:#9B95B0;")}>สูตรปัจจุบัน {draftPolicy.formulaVersion}</p>

          <div style={s("margin-bottom:18px;")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;")}><span style={s("font-size:13px;font-weight:500;color:#3B3654;")}>Service Level</span><span className="mono" style={s("font-size:11.5px;color:#6D28D9;background:#F4EEFE;padding:3px 9px;border-radius:6px;")}>Z-score = {draftPolicy.zScore}</span></div>
            <div style={s("display:flex;gap:8px;flex-wrap:wrap;")}>
              {slButtons.map(btn => (
                <button key={btn.label} onClick={() => updateDraftServiceLevel(btn.value)} style={s(`height:36px;padding:0 16px;border-radius:9px;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;${Math.abs(draftPolicy.serviceLevel - btn.value) < 0.001 ? "background:#6D28D9;color:#fff;border:0;" : "background:#FAF9FD;color:#5A5470;border:1px solid #E5E1F0;"}`)}>{btn.label}</button>
              ))}
            </div>
            <p style={s("margin:8px 0 0;font-size:10.5px;color:#9B95B0;")}>Z-score คำนวณจาก Service Level อัตโนมัติ · Safety Stock = Z × σ × √LT</p>
          </div>

          <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px;")}>
            <div>
              <div style={s("font-size:13px;font-weight:500;color:#3B3654;margin-bottom:7px;")}>Seasonal Factor</div>
              <input type="number" step="0.01" value={draftPolicy.seasonalFactor} onChange={e => updateDraftNumber("seasonalFactor", parseFloat(e.target.value))} style={s("width:100%;height:42px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;padding:0 12px;font-family:inherit;font-size:14px;font-weight:600;color:#1C1830;outline:none;box-sizing:border-box;")} />
              <div style={s("font-size:10.5px;color:#9B95B0;margin-top:5px;")}>เผื่อความเสี่ยงฤดูกาล/demand สูง</div>
            </div>
            <div>
              <div style={s("font-size:13px;font-weight:500;color:#3B3654;margin-bottom:7px;")}>Budget Factor</div>
              <input type="number" step="0.01" value={draftPolicy.budgetFactor} onChange={e => updateDraftNumber("budgetFactor", parseFloat(e.target.value))} style={s("width:100%;height:42px;border:1px solid #E5E1F0;border-radius:10px;background:#fff;padding:0 12px;font-family:inherit;font-size:14px;font-weight:600;color:#1C1830;outline:none;box-sizing:border-box;")} />
              <div style={s("font-size:10.5px;color:#9B95B0;margin-top:5px;")}>ปรับตามข้อจำกัดงบ</div>
            </div>
          </div>

          <div style={s("display:flex;flex-direction:column;gap:9px;margin-bottom:14px;")}>
            <div style={s("display:flex;flex-direction:column;gap:4px;")}><label style={s("font-size:12px;font-weight:500;color:#5A5470;")}>หมายเหตุเวอร์ชัน</label><textarea value={versionNote} onChange={e => setVersionNote(e.target.value)} style={s("resize:vertical;border:1px solid #E5E1F0;border-radius:10px;padding:9px 12px;font-family:inherit;font-size:12.5px;color:#1C1830;outline:none;min-height:60px;")} /></div>
          </div>

          <div style={s("display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #F1EEF8;padding-top:14px;margin-bottom:16px;")}>
            <button onClick={() => setDraftPolicy(formulaPolicy)} style={s("height:40px;padding:0 16px;border:1px solid #E5E1F0;border-radius:11px;background:#fff;color:#3B3654;font-family:inherit;font-size:12.5px;font-weight:500;cursor:pointer;")}>รีเซ็ต</button>
            <button onClick={() => onSaveFormulaPolicy(draftPolicy, versionNote)} style={s("display:flex;align-items:center;gap:7px;height:40px;padding:0 18px;border:0;border-radius:11px;background:linear-gradient(135deg,#6D28D9,#C0249B);color:#fff;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 10px 22px -10px rgba(109,40,217,.7);")}><GitCommit style={s("width:16px;height:16px;")} /> บันทึก &amp; สร้าง {draftPolicy.formulaVersion}</button>
          </div>

          <div style={s("border-top:1px solid #F1EEF8;padding-top:14px;")}>
            <h3 style={s("margin:0 0 10px;font-size:13px;font-weight:600;color:#1C1830;")}>สูตรการคำนวณ</h3>
            <div style={s("display:flex;flex-direction:column;gap:7px;")}>
              {formulaList.map((formula, index) => (
                <p key={formula} style={s("margin:0;background:#F9F8FC;border-radius:8px;padding:8px 12px;font-size:11.5px;color:#5A5470;")}>{index + 1}. {formula}</p>
              ))}
            </div>
          </div>

          <div style={s("border-top:1px solid #F1EEF8;padding-top:14px;margin-top:16px;")}>
            <h3 style={s("margin:0 0 10px;font-size:13px;font-weight:600;color:#1C1830;")}>ล้างประวัติทดสอบ</h3>
            <p style={s("margin:0 0 10px;font-size:12px;color:#9B95B0;")}>ลด log ทดสอบซ้ำ ๆ — ไม่ลบ Supplier, SKU หรือ policy ปัจจุบัน</p>
            <button onClick={onClearDemoHistory} style={s("height:38px;width:100%;border:1px solid #FCA5A5;border-radius:10px;background:#FEF2F2;color:#DC2626;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;")}>ล้างประวัติทดสอบ</button>
          </div>

          <div style={s("border-top:1px solid #F1EEF8;padding-top:14px;margin-top:16px;")}>
            <h3 style={s("margin:0 0 10px;font-size:13px;font-weight:600;color:#B91C1C;")}>รีเซ็ตข้อมูลทั้งหมด (Factory Reset)</h3>
            <p style={s("margin:0 0 10px;font-size:12px;color:#9B95B0;")}>ล้างทุกอย่างกลับค่าเริ่มต้น รวม Supplier, SKU, งบประมาณ, สูตร และบัญชีที่สมัคร แล้วโหลดข้อมูลตั้งต้นใหม่ — ใช้เมื่อต้องการเริ่มเดโมใหม่ทั้งหมด</p>
            <button onClick={onFactoryReset} style={s("display:flex;align-items:center;justify-content:center;gap:7px;height:38px;width:100%;border:0;border-radius:10px;background:#DC2626;color:#fff;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;box-shadow:0 8px 18px -8px rgba(220,38,38,.6);")}><RefreshCcw style={s("width:15px;height:15px;")} /> รีเซ็ตข้อมูลทั้งหมด</button>
          </div>
        </div>

        <div style={s("background:#fff;border:1px solid #EBE7F5;border-radius:16px;padding:16px 18px;box-shadow:0 14px 30px -24px rgba(28,24,48,.3);")}>
          <h2 style={s("margin:0 0 12px;font-size:14px;font-weight:600;color:#1C1830;")}>ประวัติเวอร์ชันสูตร</h2>
          <div style={s("display:flex;flex-direction:column;gap:12px;")}>
            {formulaVersions.length === 0 ? (
              <div style={s("text-align:center;padding:20px;color:#9B95B0;font-size:12px;")}>ยังไม่มีเวอร์ชัน</div>
            ) : formulaVersions.map((ver, i) => (
              <div key={`${ver.formulaVersion}-${i}`} style={s(`border-radius:12px;padding:11px 13px;${i === 0 ? "border:1.5px solid #C9B0F2;background:#FBF8FF;" : "border:1px solid #EBE7F5;"}`)}>
                <div style={s("display:flex;align-items:center;justify-content:space-between;")}><span className="mono" style={s(`font-size:12.5px;font-weight:600;${i === 0 ? "color:#6D28D9;" : "color:#5A5470;"}`)}>{ver.formulaVersion}</span>{i === 0 && <span style={s("font-size:9.5px;font-weight:600;color:#fff;background:#6D28D9;padding:2px 8px;border-radius:99px;")}>ใช้งาน</span>}</div>
                <div style={s("font-size:11px;color:#7B7591;margin-top:5px;")}>SL {formatPercent(ver.serviceLevel * 100).replace("+","")} · Seasonal {ver.seasonalFactor} · Budget {ver.budgetFactor}</div>
                <div style={s("font-size:10px;color:#9B95B0;margin-top:2px;")}>{ver.createdAt} · {ver.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
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





