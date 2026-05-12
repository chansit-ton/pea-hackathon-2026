export type Region = "North" | "Northeast" | "East" | "South" | "National";

export type Unit = "????" | "???" | "???" | "pcs" | "m";

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
  reliabilityScore?: number;
};

export type StockStatus = "Normal" | "Near Reorder Point" | "Critical";

export type InventoryRecord = {
  skuId: string;
  warehouseId: string;
  currentStock: number;
  historicalUsage: HistoricalUsagePeriod[];
  forecastDemandForPlanningPeriod: number;
  planningPeriodDays: number;
  serviceLevel: number;
  zScore: number;
  seasonalFactor: number;
  budgetFactor: number;
  targetStockLevelOverride?: number;
  averageDailyDemand?: number;
  safetyStock?: number;
  reorderPoint?: number;
  forecastDemand?: number;
  aiSuggestedQuantity?: number;
  status: StockStatus;
};

export type HistoricalUsagePeriod = {
  periodLabel: string;
  days: number;
  quantity: number;
};

export type SupplierSkuRecord = {
  supplierId: string;
  supplierName: string;
  sku: string;
  unitPrice: number;
  currency: "THB";
  unit: Unit | string;
  leadTimeDays: number;
  moq: number;
  reliabilityScore: number;
  contactPerson: string;
  phone: string;
  email: string;
  lineId?: string;
};

export type BudgetContext = {
  localBudgetRemaining: number;
  regionalBudgetRemaining: number;
  centralBudgetRemaining: number;
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

export type ApprovalRoutingResult = {
  layer: ApprovalLayer;
  localEnough: boolean;
  regionalEnough: boolean;
  centralEnough: boolean;
  reason: string;
};

export type QuantityVarianceResult = {
  variance: number;
  variancePercent: number;
  isOverride: boolean;
  isOverRequest: boolean;
  isUnderRequest: boolean;
};

export type TargetStockLevelSource = "PolicyOverride" | "ForecastPlusSafetyStock";

export type InventoryCalculationResult = {
  formulaVersion: string;
  historicalUsageTotal: number;
  historicalUsageDays: number;
  averageDailyDemand: number;
  demandVariabilityPerPeriod: number;
  demandVariabilityPerDay: number;
  supplierLeadTimeDays: number;
  seasonalFactor: number;
  budgetFactor: number;
  adjustedLeadTimeDays: number;
  serviceLevel: number;
  zScore: number;
  safetyStock: number;
  demandDuringLeadTime: number;
  reorderPoint: number;
  forecastDemandForPlanningPeriod: number;
  planningPeriodDays: number;
  targetStockLevel: number;
  targetStockLevelSource: TargetStockLevelSource;
  moq: number;
  suggestedQuantity: number;
  unitPrice: number;
  estimatedCostForSuggestedQuantity: number;
};

export type PurchaseRequestCalculationSnapshot = InventoryCalculationResult & {
  requestId: string;
  createdAt: string;
  requestedQuantity: number;
  approvedQuantity?: number;
  quantityVariance: number;
  quantityVariancePercent: number;
  estimatedCostForRequestedQuantity: number;
  selectedSupplierId: string;
  selectedSupplierName: string;
  supplierLeadTimeDaysAtRequestDate: number;
  unitPriceAtRequestDate: number;
  budgetContextAtRequestDate: BudgetContext;
  approvalRoutingAtRequestDate: ApprovalRoutingResult;
  overrideReasonCategory?: string;
  overrideReasonDetail?: string;
};

export type PurchaseRequestPreview = {
  variance: QuantityVarianceResult;
  estimatedCostForRequestedQuantity: number;
  approvalRouting: ApprovalRoutingResult;
  requiresOverrideReason: boolean;
};

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
  calculationSnapshot: PurchaseRequestCalculationSnapshot;
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
