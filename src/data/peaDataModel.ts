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

const usageYear = 2026;

// SKU Master มาจากชีต "SKU Data" และเติมชื่ออ่านง่ายสำหรับ demo เพราะไฟล์ต้นทางหลายแถวมี SKU Name เป็น NULL
export const peaSkuMaster: PeaSkuMaster[] = [
  {
    skuId: "1CC0CG0002",
    skuName: "สายไฟแรงต่ำ Mock",
    category: "สายไฟ",
    unit: "M",
    criticalityLevel: "High",
    stockTotal: 211_289.283,
    avgUsageOriginal: 27_373.747,
    sourceSheet: "SKU Data",
  },
  {
    skuId: "1CC0CG0004",
    skuName: "สายไฟแรงสูง Mock",
    category: "สายไฟ",
    unit: "M",
    criticalityLevel: "High",
    stockTotal: 340_277.27,
    avgUsageOriginal: 10_234.681,
    sourceSheet: "SKU Data",
  },
  {
    skuId: "1CC0CE0004",
    skuName: "อุปกรณ์ประกอบระบบจำหน่าย Mock",
    category: "อุปกรณ์ระบบจำหน่าย",
    unit: "M",
    criticalityLevel: "Medium",
    stockTotal: 41_675,
    avgUsageOriginal: 13_101.579,
    sourceSheet: "SKU Data",
  },
  {
    skuId: "1CC0CE0000",
    skuName: "อุปกรณ์ซ่อมบำรุง Mock",
    category: "อุปกรณ์ซ่อมบำรุง",
    unit: "M",
    criticalityLevel: "Medium",
    stockTotal: 26_571.6,
    avgUsageOriginal: 9_621.879,
    sourceSheet: "SKU Data",
  },
  {
    skuId: "1DD0DC0000",
    skuName: "อุปกรณ์มาตรฐานสำหรับ VMI Mock",
    category: "อุปกรณ์มาตรฐาน",
    unit: "EA",
    criticalityLevel: "Critical",
    stockTotal: 35_685,
    avgUsageOriginal: 1_985.573,
    sourceSheet: "SKU Data",
  },
  {
    skuId: "1CC0CH0501",
    skuName: "อุปกรณ์ใช้งานประจำ Mock",
    category: "อุปกรณ์ใช้งานประจำ",
    unit: "M",
    criticalityLevel: "Medium",
    stockTotal: 105_829.88,
    avgUsageOriginal: 4_009.669,
    sourceSheet: "SKU Data",
  },
];

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
  ...["I010", "I020", "I030", "I040", "I050", "I070", "K010", "K020", "K030", "K040", "K050", "K060", "K070", "K080", "K090"].map((id) => ({
    id: `MAP-${id}`,
    warehouseId: id,
    factoryId: id,
    mappingType: "exact_code_match" as const,
    confidenceLevel: "high" as const,
    remark: "WH Id ตรงกับ Factory Id ในไฟล์ตัวอย่าง",
  })),
  {
    id: "MAP-A010",
    warehouseId: "A010",
    mappingType: "unknown",
    confidenceLevel: "low",
    remark: "พบ WH Id แต่ยังไม่มี mapping ไป Factory Id ที่ยืนยันได้",
  },
];

function usageRows(warehouseId: string, skuId: string, quantities: number[]): PeaMonthlyUsage[] {
  // แปลงข้อมูล wide format Jan-Dec ให้เป็น long format เพื่อใช้คำนวณ demand และ seasonality ได้ตรงกับ database schema
  return quantities.map((usageQty, index) => ({
    warehouseId,
    skuId,
    usageYear,
    usageMonth: index + 1,
    usageQty,
    sourceSheet: "WH Season Data Item",
  }));
}

export const peaMonthlyUsage: PeaMonthlyUsage[] = [
  ...usageRows("I010", "1CC0CG0002", [45_383, 43_910, 37_523, 47_084, 44_481, 38_567, 51_096, 46_900, 44_120, 42_300, 41_700, 41_720]),
  ...usageRows("I010", "1CC0CG0004", [28_101, 27_836, 33_024, 40_756, 40_476, 34_695, 31_400, 30_800, 29_900, 27_500, 24_600, 20_318]),
  ...usageRows("I010", "1CC0CE0004", [21_158, 24_321, 18_517, 22_207, 18_223, 22_591, 19_900, 20_400, 18_800, 17_900, 16_700, 16_193]),
  ...usageRows("I010", "1CC0CE0000", [14_180, 14_802, 12_717, 14_435, 14_994, 20_105, 17_600, 16_900, 15_800, 14_700, 14_100, 14_656]),
  ...usageRows("I010", "1CC0CH0501", [6_752, 7_318, 8_342, 11_531, 11_291, 12_054, 10_800, 10_400, 9_900, 9_700, 9_400, 10_606]),
  ...usageRows("I010", "1DD0DC0000", [4_135, 4_425, 3_523, 5_108, 4_617, 5_152, 4_900, 4_500, 4_400, 4_300, 4_200, 5_464]),
  ...usageRows("I020", "1CC0CE0000", [31_026, 34_492, 25_626, 37_528, 29_166, 31_928, 39_100, 37_400, 35_200, 33_800, 34_700, 42_543]),
  ...usageRows("K010", "1DD0DC0000", [1_250, 1_180, 1_220, 1_310, 1_280, 1_260, 1_240, 1_270, 1_290, 1_260, 1_230, 1_250]),
];

export const peaStockSummary: PeaStockSummary[] = [
  { factoryId: "I010", skuId: "1CC0CG0002", stockQty: 4_013, unit: "M", sourceSheet: "BATCH" },
  { factoryId: "I020", skuId: "1CC0CG0002", stockQty: 42_849.81, unit: "M", sourceSheet: "BATCH" },
  { factoryId: "K010", skuId: "1CC0CG0002", stockQty: 4_797.7, unit: "M", sourceSheet: "BATCH" },
  { factoryId: "K030", skuId: "1CC0CG0002", stockQty: 5_062.473, unit: "M", sourceSheet: "BATCH" },
  { factoryId: "I010", skuId: "1CC0CG0004", stockQty: 44_026, unit: "M", sourceSheet: "BATCH" },
  { factoryId: "I010", skuId: "1CC0CE0004", stockQty: 6_479, unit: "M", sourceSheet: "BATCH" },
  { factoryId: "I020", skuId: "1CC0CE0004", stockQty: 7_981, unit: "M", sourceSheet: "BATCH" },
  { factoryId: "I010", skuId: "1CC0CE0000", stockQty: 1_159.2, unit: "M", sourceSheet: "BATCH" },
  { factoryId: "I010", skuId: "1CC0CH0501", stockQty: 10_129.98, unit: "M", sourceSheet: "BATCH" },
  { factoryId: "I010", skuId: "1DD0DC0000", stockQty: 106, unit: "EA", sourceSheet: "BATCH" },
  { factoryId: "I020", skuId: "1DD0DC0000", stockQty: 1_559, unit: "EA", sourceSheet: "BATCH" },
  { factoryId: "K010", skuId: "1DD0DC0000", stockQty: 6_499, unit: "EA", sourceSheet: "BATCH" },
  { factoryId: "K030", skuId: "1DD0DC0000", stockQty: 4_027, unit: "EA", sourceSheet: "BATCH" },
];

export const peaLeadTimeSummary: PeaLeadTimeSummary[] = [
  {
    factoryId: "I010",
    skuId: "1DD0DC0000",
    transactionCount: 12,
    avgDocumentProcessLtDays: 24.33,
    avgProcurementLtDays: 26.08,
    avgSumLtDays: 50.42,
    medianSumLtDays: 27,
    p90SumLtDays: 73.4,
    p95SumLtDays: 78,
    avgPoToReceiveDays: 0,
    sourceSheet: "LT Analyst",
  },
  {
    factoryId: "I020",
    skuId: "1DD0DC0000",
    transactionCount: 42,
    avgDocumentProcessLtDays: 1.05,
    avgProcurementLtDays: 20.67,
    avgSumLtDays: 21.71,
    medianSumLtDays: 18,
    p90SumLtDays: 40,
    p95SumLtDays: 46,
    avgPoToReceiveDays: 20.67,
    sourceSheet: "LT Analyst",
  },
  {
    factoryId: "K010",
    skuId: "1DD0DC0000",
    transactionCount: 13,
    avgDocumentProcessLtDays: 1.69,
    avgProcurementLtDays: 12.92,
    avgSumLtDays: 14.62,
    medianSumLtDays: 13,
    p90SumLtDays: 23,
    p95SumLtDays: 26,
    avgPoToReceiveDays: 12.92,
    sourceSheet: "LT Analyst",
  },
  {
    factoryId: "K020",
    skuId: "1DD0DC0000",
    transactionCount: 10,
    avgDocumentProcessLtDays: 15.4,
    avgProcurementLtDays: 55.7,
    avgSumLtDays: 71.1,
    medianSumLtDays: 64,
    p90SumLtDays: 82,
    p95SumLtDays: 90,
    avgPoToReceiveDays: 55.7,
    sourceSheet: "LT Analyst",
  },
  {
    factoryId: "K030",
    skuId: "1DD0DC0000",
    transactionCount: 4,
    avgDocumentProcessLtDays: 4.5,
    avgProcurementLtDays: 26,
    avgSumLtDays: 30.5,
    medianSumLtDays: 34,
    p90SumLtDays: 44.1,
    p95SumLtDays: 48,
    avgPoToReceiveDays: 26,
    sourceSheet: "LT Analyst",
  },
];

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

export const peaLeadTimeSkuSummary: PeaLeadTimeSkuSummary[] = [
  {
    skuId: "1DD0DC0000",
    leadCountSku: 177,
    avgLeadDaysSku: 38.92,
    medianLeadDaysSku: 32,
    p90LeadDaysSku: 69.4,
    sourceSheet: "Lead Time Summary",
  },
];

export const peaRiskCoverageRecords: PeaRiskCoverageRecord[] = [
  {
    plantId: "I010",
    skuId: "1CC0CG0002",
    stockQty: 4_013,
    unit: "M",
    usageUnit: "M",
    totalUsage: 564_784,
    activePeriods: 12,
    avgPeriodUsage: 47_065.33,
    stdPeriodUsage: 7_052.03,
    cv: 0.1498,
    regionCode: "I",
    stockCoverPeriods: 0.0853,
    riskStatus: "Critical: <1 period cover",
    riskRank: 0,
    stabilityScore: 37,
    frequencyScore: 25,
    usageValueScore: 20,
    leadScore: 7.5,
    vmiScore: 89.5,
    sourceSheet: "inventory_relationship_analysis",
  },
  {
    plantId: "I020",
    skuId: "1CC0CG0002",
    stockQty: 42_849.81,
    unit: "M",
    usageUnit: "M",
    totalUsage: 1_164_878,
    activePeriods: 12,
    avgPeriodUsage: 97_073.17,
    stdPeriodUsage: 9_371.2,
    cv: 0.0965,
    regionCode: "I",
    stockCoverPeriods: 0.4414,
    riskStatus: "Critical: <1 period cover",
    riskRank: 0,
    stabilityScore: 38.07,
    frequencyScore: 25,
    usageValueScore: 20,
    leadScore: 7.5,
    vmiScore: 90.57,
    sourceSheet: "inventory_relationship_analysis",
  },
  {
    plantId: "K010",
    skuId: "1CC0CG0002",
    stockQty: 4_797.7,
    unit: "M",
    usageUnit: "M",
    totalUsage: 1_175_903,
    activePeriods: 12,
    avgPeriodUsage: 97_991.92,
    stdPeriodUsage: 8_451.15,
    cv: 0.0862,
    regionCode: "K",
    stockCoverPeriods: 0.049,
    riskStatus: "Critical: <1 period cover",
    riskRank: 0,
    stabilityScore: 38.28,
    frequencyScore: 25,
    usageValueScore: 20,
    leadScore: 7.5,
    vmiScore: 90.78,
    sourceSheet: "inventory_relationship_analysis",
  },
  {
    plantId: "K010",
    skuId: "1DD0DC0000",
    stockQty: 6_499,
    unit: "EA",
    usageUnit: "EA",
    totalUsage: 77_439,
    activePeriods: 12,
    avgPeriodUsage: 6_453.25,
    stdPeriodUsage: 664.39,
    cv: 0.103,
    leadCount: 13,
    avgLeadDays: 14.62,
    medianLeadDays: 13,
    p90LeadDays: 23,
    avgPoToReceiveDays: 12.92,
    leadCountSku: 177,
    avgLeadDaysSku: 38.92,
    medianLeadDaysSku: 32,
    p90LeadDaysSku: 69.4,
    regionCode: "K",
    stockCoverPeriods: 1.007,
    leadDaysBest: 14.62,
    riskStatus: "Risk: <3 periods cover",
    riskRank: 2,
    stabilityScore: 37.94,
    frequencyScore: 25,
    usageValueScore: 19.56,
    leadScore: 14.4,
    vmiScore: 96.9,
    sourceSheet: "inventory_relationship_analysis",
  },
  {
    plantId: "I010",
    skuId: "1DD0DC0000",
    stockQty: 106,
    unit: "EA",
    usageUnit: "EA",
    totalUsage: 54_724,
    activePeriods: 12,
    avgPeriodUsage: 4_560.33,
    stdPeriodUsage: 441.55,
    cv: 0.0968,
    leadCount: 12,
    avgLeadDays: 50.42,
    medianLeadDays: 27,
    p90LeadDays: 73.4,
    leadCountSku: 177,
    avgLeadDaysSku: 38.92,
    medianLeadDaysSku: 32,
    p90LeadDaysSku: 69.4,
    regionCode: "I",
    stockCoverPeriods: 0.0232,
    leadDaysBest: 50.42,
    riskStatus: "Critical: <1 period cover",
    riskRank: 0,
    stabilityScore: 38.06,
    frequencyScore: 25,
    usageValueScore: 18.95,
    leadScore: 12.93,
    vmiScore: 94.94,
    sourceSheet: "inventory_relationship_analysis",
  },
  {
    plantId: "K030",
    skuId: "1DD0DC0000",
    stockQty: 4_027,
    unit: "EA",
    usageUnit: "EA",
    totalUsage: 30_282,
    activePeriods: 12,
    avgPeriodUsage: 2_523.5,
    stdPeriodUsage: 363.6,
    cv: 0.1441,
    leadCount: 4,
    avgLeadDays: 30.5,
    medianLeadDays: 34,
    p90LeadDays: 44.1,
    leadCountSku: 177,
    avgLeadDaysSku: 38.92,
    medianLeadDaysSku: 32,
    p90LeadDaysSku: 69.4,
    regionCode: "K",
    stockCoverPeriods: 1.596,
    leadDaysBest: 30.5,
    riskStatus: "Risk: <3 periods cover",
    riskRank: 2,
    stabilityScore: 37.12,
    frequencyScore: 25,
    usageValueScore: 17.92,
    leadScore: 13.75,
    vmiScore: 93.79,
    sourceSheet: "inventory_relationship_analysis",
  },
  {
    plantId: "I010",
    skuId: "1CC0CE0004",
    stockQty: 6_479,
    unit: "M",
    usageUnit: "M",
    totalUsage: 236_910,
    activePeriods: 12,
    avgPeriodUsage: 19_742.5,
    stdPeriodUsage: 3_227.14,
    cv: 0.1635,
    regionCode: "I",
    stockCoverPeriods: 0.3282,
    riskStatus: "Critical: <1 period cover",
    riskRank: 0,
    stabilityScore: 36.73,
    frequencyScore: 25,
    usageValueScore: 20,
    leadScore: 7.5,
    vmiScore: 89.23,
    sourceSheet: "inventory_relationship_analysis",
  },
];

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

export const peaSupplierSkuPrice: PeaSupplierSkuPrice[] = [
  { supplierId: "S001", skuId: "1CC0CG0002", unitPrice: 2_000, currency: "THB", unit: "M", moq: 10, standardLeadTimeDays: 25, reliabilityScore: 96, priceSource: "mock_supplier_quote", status: "active" },
  { supplierId: "S002", skuId: "1CC0CG0002", unitPrice: 2_150, currency: "THB", unit: "M", moq: 20, standardLeadTimeDays: 18, reliabilityScore: 92, priceSource: "mock_supplier_quote", status: "active" },
  { supplierId: "S002", skuId: "1CC0CG0004", unitPrice: 3_500, currency: "THB", unit: "M", moq: 10, standardLeadTimeDays: 30, reliabilityScore: 92, priceSource: "mock_supplier_quote", status: "active" },
  { supplierId: "S001", skuId: "1CC0CE0004", unitPrice: 12_000, currency: "THB", unit: "M", moq: 10, standardLeadTimeDays: 20, reliabilityScore: 88, priceSource: "mock_supplier_quote", status: "active" },
  { supplierId: "S003", skuId: "1DD0DC0000", unitPrice: 1_200_000, currency: "THB", unit: "EA", moq: 1, standardLeadTimeDays: 60, reliabilityScore: 85, priceSource: "mock_supplier_quote", status: "active" },
  { supplierId: "S003", skuId: "1CC0CH0501", unitPrice: 150, currency: "THB", unit: "M", moq: 50, standardLeadTimeDays: 14, reliabilityScore: 87, priceSource: "mock_supplier_quote", status: "active" },
];

// SKU demo ยังมีรหัสสั้นแบบ C01 จึง map ไปหา SKU Id จากไฟล์ PEA ส่วน WH ใช้รหัสจริงจากชีต WH โดยตรงแล้ว
const prototypeAlias = {
  warehouseId: {} as Record<string, string>,
  skuId: {
    C01: "1CC0CG0002",
    C02: "1CC0CG0004",
    T01: "1DD0DC0000",
    P01: "1CC0CE0004",
    B05: "1CC0CE0000",
    D12: "1CC0CH0501",
  } as Record<string, string>,
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
