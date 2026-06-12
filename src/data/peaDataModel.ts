import {
  generateMonthlyUsage,
  generateStockSummary,
  generateRiskCoverage,
  generateLeadTimeSummary,
  generateLeadTimeSkuSummary,
  generateSkuMaster,
  generateSupplierSkuPrice,
} from "./peaCatalog";

export type PeaCriticality = "Critical" | "High" | "Medium";
export type WarehouseFactoryMappingType = "exact_code_match" | "manual_mapping" | "inferred_region" | "unknown";
export type WarehouseFactoryMappingConfidence = "high" | "medium" | "low";

export type PeaSkuMaster = {
  skuId: string;
  skuName: string;
  category: string;
  unit: string;
  criticalityLevel: PeaCriticality;
  stockTotal: number;
  avgUsageOriginal: number;
  sourceSheet: "SKU Data";
};

export type PeaWarehouseMaster = {
  warehouseId: string;
  warehouseName: string;
  regionCode: string;
  warehouseType: "Warehouse";
  status: "active";
  sourceSheet: "WH";
};

export type PeaFactoryMaster = {
  factoryId: string;
  factoryName: string;
  supplierId: string;
  regionCode: string;
  factoryType: "Factory / Plant";
  status: "active";
  sourceSheet: "Supplier Factory";
};

export type PeaWarehouseFactoryMapping = {
  id: string;
  warehouseId: string;
  factoryId?: string;
  mappingType: WarehouseFactoryMappingType;
  confidenceLevel: WarehouseFactoryMappingConfidence;
  remark: string;
};

export type PeaMonthlyUsage = {
  warehouseId: string;
  skuId: string;
  usageYear: number;
  usageMonth: number;
  usageQty: number;
  sourceSheet: "WH Season Data Item";
};

export type PeaStockSummary = {
  factoryId: string;
  skuId: string;
  stockQty: number;
  unit: string;
  sourceSheet: "BATCH";
};

export type PeaLeadTimeSummary = {
  factoryId: string;
  skuId: string;
  transactionCount: number;
  avgDocumentProcessLtDays: number;
  avgProcurementLtDays: number;
  avgSumLtDays: number;
  medianSumLtDays?: number;
  p90SumLtDays: number;
  p95SumLtDays: number;
  avgPoToReceiveDays?: number;
  sourceSheet: "LT Analyst";
};

export type PeaRelationshipSummary = {
  stockRows: number;
  stockSkuPlantKeys: number;
  movingRows: number;
  movingSkuPlantKeys: number;
  sapIssueRows: number;
  leadTimeRows: number;
  leadTimeSkuKeys: number;
  mergedSkuPlantKeys: number;
  stockUsageIntersectionKeys: number;
  stockOnlyKeys: number;
  usageOnlyKeys: number;
};

export type PeaRiskCoverageRecord = {
  plantId: string;
  skuId: string;
  stockQty: number;
  unit?: string;
  usageUnit: string;
  totalUsage: number;
  activePeriods: number;
  avgPeriodUsage: number;
  stdPeriodUsage: number;
  cv: number;
  leadCount?: number;
  avgLeadDays?: number;
  medianLeadDays?: number;
  p90LeadDays?: number;
  avgPoToReceiveDays?: number;
  leadCountSku?: number;
  avgLeadDaysSku?: number;
  medianLeadDaysSku?: number;
  p90LeadDaysSku?: number;
  regionCode: string;
  stockCoverPeriods: number;
  leadDaysBest?: number;
  riskStatus: string;
  riskRank: number;
  stabilityScore: number;
  frequencyScore: number;
  usageValueScore: number;
  leadScore: number;
  vmiScore: number;
  sourceSheet: "inventory_relationship_analysis";
};

export type PeaLeadTimeSkuSummary = {
  skuId: string;
  leadCountSku: number;
  avgLeadDaysSku: number;
  medianLeadDaysSku: number;
  p90LeadDaysSku: number;
  sourceSheet: "Lead Time Summary";
};

export type PeaSupplierMaster = {
  supplierId: string;
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string;
  lineId: string;
  regionSupported: string;
  status: "active";
  source: "mock_supplier";
};

export type PeaSupplierSkuPrice = {
  supplierId: string;
  skuId: string;
  unitPrice: number;
  currency: "THB";
  unit: string;
  moq: number;
  standardLeadTimeDays: number;
  reliabilityScore: number;
  priceSource: "mock_supplier_quote";
  status: "active";
};

export type PeaDataCoverage = {
  requestedWarehouseId: string;
  requestedSkuId: string;
  requestedSupplierId?: string;
  resolvedWarehouseId: string;
  resolvedSkuId: string;
  warehouseRegionCode?: string;
  mappedFactoryId?: string;
  mappedFactorySupplierId?: string;
  mappingType?: WarehouseFactoryMappingType;
  mappingConfidence?: WarehouseFactoryMappingConfidence;
  mappingRemark?: string;
  flags: {
    hasUsageData: boolean;
    hasStockData: boolean;
    hasLeadTimeData: boolean;
    hasSupplierData: boolean;
    hasWarehouseFactoryMapping: boolean;
  };
};

// SKU Master มาจากชีต "SKU Data" และเติมชื่ออ่านง่ายสำหรับ demo เพราะไฟล์ต้นทางหลายแถวมี SKU Name เป็น NULL
export const peaSkuMaster: PeaSkuMaster[] = generateSkuMaster();

const peaWarehouseRegionRows = [
  { regionCode: "A", warehouseIds: ["A010", "A020", "A030", "A040", "A050", "A060", "A070", "A080", "A100", "A110"] },
  { regionCode: "B", warehouseIds: ["B010", "B020", "B030", "B040", "B050", "B060", "B061", "B070", "B080", "B090", "B100", "B120"] },
  { regionCode: "C", warehouseIds: ["C010", "C020", "C030", "C040", "C050", "C060", "C070", "C080", "C090", "C100", "C110", "C120"] },
  { regionCode: "D", warehouseIds: ["D010", "D020", "D030", "D040", "D050", "D060", "D070", "D080", "D090", "D100", "D110", "D120"] },
  { regionCode: "E", warehouseIds: ["E010", "E020", "E030", "E040", "E050", "E060", "E070", "E080", "E090", "E100", "E110", "E120"] },
  { regionCode: "F", warehouseIds: ["F010", "F020", "F030", "F040", "F050", "F060", "F070", "F080", "F090", "F100"] },
  { regionCode: "G", warehouseIds: ["G010", "G020", "G030", "G040", "G050", "G060", "G070", "G080", "G090", "G100", "G110", "G120", "G130", "G140"] },
  { regionCode: "H", warehouseIds: ["H010", "H020", "H030", "H040", "H050", "H060", "H070", "H080", "H090", "H100", "H110"] },
  { regionCode: "I", warehouseIds: ["I010", "I020", "I030", "I040", "I050", "I060", "I070"] },
  { regionCode: "J", warehouseIds: ["J010", "J020", "J030", "J040", "J050", "J060", "J070", "J080"] },
  { regionCode: "K", warehouseIds: ["K010", "K020", "K030", "K040", "K050", "K060", "K070", "K080", "K090"] },
  { regionCode: "L", warehouseIds: ["L010", "L020", "L030", "L040", "L050", "L060", "L070", "L080", "L090", "L100", "L110", "L120"] },
];

// WH master มาจากชีต "WH" เวอร์ชันใหม่ที่มี column "Region (เขต)" แล้ว
// จึงใช้ regionCode/เขต จากไฟล์โดยตรง ไม่เดาจากตัวอักษรแรกของ WH Id
export const peaWarehouseMaster: PeaWarehouseMaster[] = peaWarehouseRegionRows.flatMap(({ regionCode, warehouseIds }) =>
  warehouseIds.map((warehouseId) => ({
    warehouseId,
    warehouseName: `คลัง ${warehouseId}`,
    regionCode,
    warehouseType: "Warehouse",
    status: "active",
    sourceSheet: "WH",
  })),
);

const peaFactorySupplierRows = [
  { supplierId: "A", factoryIds: ["A000", "A010", "A020", "A030"] },
  { supplierId: "I", factoryIds: ["I000", "I010", "I020", "I030", "I040", "I050", "I070"] },
  { supplierId: "K", factoryIds: ["K000", "K010", "K020", "K030", "K040", "K050", "K060", "K070", "K080", "K090"] },
];

// ชีต "Supplier Factory" เวอร์ชันล่าสุดมี Factory Id, Factory Name และ Supplier Id
// Supplier Id ในชีตนี้เป็น source id ที่ผูกกับ Factory/Plant เช่น I010 -> I, K010 -> K
// ยังไม่ใช่ข้อมูล vendor contact/price แบบเต็ม ซึ่งยังอยู่ใน mock supplier แยกต่างหาก
export const peaFactoryMaster: PeaFactoryMaster[] = peaFactorySupplierRows.flatMap(({ supplierId, factoryIds }) =>
  factoryIds.map((factoryId) => ({
    factoryId,
    factoryName: `Factory / Plant ${factoryId}`,
    supplierId,
    regionCode: factoryId.slice(0, 1),
    factoryType: "Factory / Plant",
    status: "active",
    sourceSheet: "Supplier Factory",
  })),
);

export const peaWarehouseFactoryMapping: PeaWarehouseFactoryMapping[] = [
  ...["A010", "A020", "I010", "I020", "I030", "I040", "I050", "I070", "K010", "K020", "K030", "K040", "K050", "K060", "K070", "K080", "K090"].map((id) => ({
    id: `MAP-${id}`,
    warehouseId: id,
    factoryId: id,
    mappingType: "exact_code_match" as const,
    confidenceLevel: "high" as const,
    remark: "WH Id ตรงกับ Factory Id ในไฟล์ตัวอย่าง",
  })),
];

export const peaMonthlyUsage: PeaMonthlyUsage[] = generateMonthlyUsage();

export const peaStockSummary: PeaStockSummary[] = generateStockSummary();

export const peaLeadTimeSummary: PeaLeadTimeSummary[] = generateLeadTimeSummary();

// สรุปจากไฟล์ inventory_relationship_analysis.xlsx ที่ ChatGPT วิเคราะห์ความสัมพันธ์ระหว่าง stock, usage และ lead time
// ใช้เป็นข้อมูลประกอบใน Dashboard/SKU เพื่อให้เห็น data coverage และความเสี่ยงเชิง relationship โดยไม่แทนที่ calculation demo หลัก
export const peaRelationshipSummary: PeaRelationshipSummary = {
  stockRows: 24_740,
  stockSkuPlantKeys: 5_389,
  movingRows: 75_484,
  movingSkuPlantKeys: 6_276,
  sapIssueRows: 170_886,
  leadTimeRows: 11_513,
  leadTimeSkuKeys: 2_261,
  mergedSkuPlantKeys: 11_072,
  stockUsageIntersectionKeys: 594,
  stockOnlyKeys: 4_796,
  usageOnlyKeys: 5_683,
};

export const peaLeadTimeSkuSummary: PeaLeadTimeSkuSummary[] = generateLeadTimeSkuSummary();

export const peaRiskCoverageRecords: PeaRiskCoverageRecord[] = generateRiskCoverage();

// Supplier เป็น mock vendor แยกจาก Factory เพราะ Excel ยังไม่มีข้อมูลผู้ขายจริง
export const peaSupplierMaster: PeaSupplierMaster[] = [
  {
    supplierId: "S001",
    supplierName: "บริษัท อัลฟ่า อิเล็คทริค จำกัด",
    contactPerson: "คุณสมชาย ใจดี",
    phone: "081-111-1111",
    email: "somchai@alpha.co.th",
    lineId: "alpha_electric",
    regionSupported: "North",
    status: "active",
    source: "mock_supplier",
  },
  {
    supplierId: "S002",
    supplierName: "บริษัท เบต้า เคเบิล จำกัด",
    contactPerson: "คุณวิภา",
    phone: "082-222-2222",
    email: "beta@example.com",
    lineId: "beta_cable",
    regionSupported: "National",
    status: "active",
    source: "mock_supplier",
  },
  {
    supplierId: "S003",
    supplierName: "บริษัท เซ็นทรัล ทรานส์ฟอร์ม จำกัด",
    contactPerson: "คุณนที",
    phone: "083-333-3333",
    email: "central@example.com",
    lineId: "central_transform",
    regionSupported: "National",
    status: "active",
    source: "mock_supplier",
  },
];

export const peaSupplierSkuPrice: PeaSupplierSkuPrice[] = generateSupplierSkuPrice();

// Demo ใช้รหัส PEA จริงทั้งหมดแล้ว (catalog) จึงไม่ต้อง map รหัสสั้น — เก็บ alias ไว้เผื่อข้อมูลเก่า/ภายนอก
const prototypeAlias = {
  warehouseId: {} as Record<string, string>,
  skuId: {} as Record<string, string>,
};

export function resolvePeaWarehouseId(warehouseId: string): string {
  return prototypeAlias.warehouseId[warehouseId] ?? warehouseId;
}

export function resolvePeaSkuId(skuId: string): string {
  return prototypeAlias.skuId[skuId] ?? skuId;
}

export function getPeaRiskCoverageRecord(warehouseId: string, skuId: string): PeaRiskCoverageRecord | undefined {
  const resolvedWarehouseId = resolvePeaWarehouseId(warehouseId);
  const resolvedSkuId = resolvePeaSkuId(skuId);

  return peaRiskCoverageRecords.find((record) => record.plantId === resolvedWarehouseId && record.skuId === resolvedSkuId);
}

export function getPeaLeadTimeSkuSummary(skuId: string): PeaLeadTimeSkuSummary | undefined {
  const resolvedSkuId = resolvePeaSkuId(skuId);

  return peaLeadTimeSkuSummary.find((record) => record.skuId === resolvedSkuId);
}

export function getWarehouseFactoryMapping(warehouseId: string): PeaWarehouseFactoryMapping | undefined {
  const resolvedWarehouseId = resolvePeaWarehouseId(warehouseId);
  return peaWarehouseFactoryMapping.find((mapping) => mapping.warehouseId === resolvedWarehouseId);
}

export function getPeaDataCoverage(params: {
  warehouseId: string;
  skuId: string;
  supplierId?: string;
}): PeaDataCoverage {
  const resolvedWarehouseId = resolvePeaWarehouseId(params.warehouseId);
  const resolvedSkuId = resolvePeaSkuId(params.skuId);
  const warehouse = peaWarehouseMaster.find((item) => item.warehouseId === resolvedWarehouseId);
  const mapping = getWarehouseFactoryMapping(params.warehouseId);
  const mappedFactoryId = mapping?.factoryId;
  const mappedFactory = mappedFactoryId ? peaFactoryMaster.find((item) => item.factoryId === mappedFactoryId) : undefined;

  // ตรวจ coverage แยกทีละแหล่ง เพื่อให้ UI แจ้งผู้ใช้ได้ว่าขาด demand, stock, lead time หรือ supplier price ส่วนไหน
  const hasUsageData = peaMonthlyUsage.some((item) => item.warehouseId === resolvedWarehouseId && item.skuId === resolvedSkuId);
  const hasStockData = Boolean(mappedFactoryId) && peaStockSummary.some((item) => item.factoryId === mappedFactoryId && item.skuId === resolvedSkuId);
  const hasLeadTimeData = Boolean(mappedFactoryId) && peaLeadTimeSummary.some((item) => item.factoryId === mappedFactoryId && item.skuId === resolvedSkuId);
  const hasSupplierData = params.supplierId
    ? peaSupplierSkuPrice.some((item) => item.supplierId === params.supplierId && item.skuId === resolvedSkuId)
    : peaSupplierSkuPrice.some((item) => item.skuId === resolvedSkuId);

  return {
    requestedWarehouseId: params.warehouseId,
    requestedSkuId: params.skuId,
    requestedSupplierId: params.supplierId,
    resolvedWarehouseId,
    resolvedSkuId,
    warehouseRegionCode: warehouse?.regionCode,
    mappedFactoryId,
    mappedFactorySupplierId: mappedFactory?.supplierId,
    mappingType: mapping?.mappingType,
    mappingConfidence: mapping?.confidenceLevel,
    mappingRemark: mapping?.remark,
    flags: {
      hasUsageData,
      hasStockData,
      hasLeadTimeData,
      hasSupplierData,
      hasWarehouseFactoryMapping: Boolean(mappedFactoryId),
    },
  };
}

export function getPeaDataCoverageWarnings(coverage: PeaDataCoverage): string[] {
  const warnings: string[] = [];

  if (!coverage.flags.hasWarehouseFactoryMapping) {
    warnings.push("ไม่พบการจับคู่ระหว่างรหัสคลังและรหัสโรงงาน จึงยังเชื่อมความต้องการใช้กับสต็อกและระยะเวลาส่งมอบได้ไม่สมบูรณ์");
  }

  if (!coverage.flags.hasUsageData) {
    warnings.push("ขาดข้อมูลการใช้ย้อนหลังรายเดือนสำหรับคลังและ SKU นี้");
  }

  if (!coverage.flags.hasStockData) {
    warnings.push("ขาดข้อมูลสต็อกปัจจุบันจากข้อมูล batch หรือสรุปสต็อกสำหรับโรงงานและ SKU นี้");
  }

  if (!coverage.flags.hasLeadTimeData) {
    warnings.push("ไม่พบข้อมูลระยะเวลาส่งมอบสำหรับโรงงานและ SKU นี้ อาจต้องใช้ระยะเวลาส่งมอบมาตรฐานของซัพพลายเออร์หรือค่ากลางจากนโยบาย");
  }

  if (!coverage.flags.hasSupplierData) {
    warnings.push("ขาดข้อมูลราคาซัพพลายเออร์ ปริมาณสั่งขั้นต่ำ หรือระยะเวลาส่งมอบมาตรฐานสำหรับ SKU นี้");
  }

  return warnings;
}
