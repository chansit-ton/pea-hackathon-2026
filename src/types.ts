export type Region = "North" | "Northeast" | "East" | "South" | "National";

export type Warehouse = {
  id: string;
  name: string;
  region: Region;
  level: "Local";
  localBudget: number;
  capacityUsed: number;
};

export type RegionalBudget = {
  region: Exclude<Region, "National">;
  remaining: number;
};

export type Sku = {
  id: string;
  name: string;
  category: string;
  unit: string;
  criticality: "Critical" | "High" | "Medium";
};

export type Supplier = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  lineId: string;
  coverage: Region;
};

export type SupplierOffer = {
  supplierId: string;
  skuId: string;
  unitPrice: number;
  currency: "THB";
  leadTimeDays: number;
  moq: number;
  unit: string;
};

export type StockStatus = "Normal" | "Near Reorder Point" | "Critical";

export type InventoryRecord = {
  skuId: string;
  warehouseId: string;
  currentStock: number;
  averageDailyDemand?: number;
  safetyStock?: number;
  reorderPoint: number;
  forecastDemand?: number;
  aiSuggestedQuantity: number;
  status: StockStatus;
};

export type CalculationSnapshot = {
  formulaVersion: string;
  historicalUsage: string;
  averageDailyDemand: string;
  supplierLeadTime: string;
  seasonalFactor: string;
  budgetFactor: string;
  adjustedLeadTime: string;
  zScore: string;
  demandVariability: string;
  safetyStock: string;
  demandDuringLeadTime: string;
  reorderPoint: string;
  targetStockLevel: string;
  currentStock: string;
  suggestedQuantity: string;
};

export type ContactChannel = "Phone" | "Email" | "Line" | "Meeting" | "Other";

export type SupplierContactLog = {
  id: string;
  supplierId: string;
  skuId?: string;
  requestId?: string;
  channel: ContactChannel;
  purpose: string;
  note: string;
  followUpDate?: string;
  createdAt: string;
};

export type ApprovalLayer = "Local" | "Regional" | "Central";

export type RequestStatus =
  | "Draft"
  | "Pending Local"
  | "Pending Regional"
  | "Pending Central"
  | "More Info"
  | "Approved"
  | "Rejected";

export type ApprovalTimelineItem = {
  role: string;
  action: string;
  actor: string;
  date: string;
  note?: string;
};

export type PurchaseRequest = {
  id: string;
  skuId: string;
  warehouseId: string;
  supplierId: string;
  aiSuggestedQuantity: number;
  requestedQuantity: number;
  approvedQuantity?: number;
  unit: string;
  unitPrice: number;
  leadTimeDays: number;
  adjustedLeadTimeDays: number;
  moq: number;
  estimatedCost: number;
  localBudgetRemaining: number;
  regionalBudgetRemaining: number;
  centralBudgetRemaining: number;
  recommendedLayer: ApprovalLayer;
  status: RequestStatus;
  variancePercent: number;
  overrideReasonCategory?: string;
  overrideReasonText?: string;
  formulaVersion: string;
  calculationSnapshot: CalculationSnapshot;
  supplierContactLogSummary: string;
  localReason?: string;
  regionalEscalationReason?: string;
  createdAt: string;
  timeline: ApprovalTimelineItem[];
};

export type VmiCandidate = {
  skuId: string;
  demandStability: "High" | "Medium" | "Low";
  supplierReliability: number;
  score: number;
};

export type VmiComparisonMetric = {
  metric: string;
  current: string;
  vmi: string;
  impact: string;
};
