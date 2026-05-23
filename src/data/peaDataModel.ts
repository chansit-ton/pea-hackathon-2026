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
  p90SumLtDays: number;
  p95SumLtDays: number;
  sourceSheet: "LT Analyst";
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
  mappedFactoryId?: string;
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

export const peaWarehouseMaster: PeaWarehouseMaster[] = [
  "I010",
  "I020",
  "I030",
  "I040",
  "I050",
  "I070",
  "K010",
  "K020",
  "K030",
  "K040",
  "K050",
  "K060",
  "K070",
  "K080",
  "K090",
  "A010",
].map((warehouseId) => ({
  warehouseId,
  warehouseName: `คลัง ${warehouseId}`,
  regionCode: warehouseId.slice(0, 1),
  warehouseType: "Warehouse",
  status: "active",
  sourceSheet: "WH",
}));

// ชีตเดิมชื่อ "Supplier Factory" แต่ข้อมูลจริงคือ Factory / Plant Master ไม่ใช่ Supplier
export const peaFactoryMaster: PeaFactoryMaster[] = [
  "I000",
  "I010",
  "I020",
  "I030",
  "I040",
  "I050",
  "I070",
  "K000",
  "K010",
  "K020",
  "K030",
  "K040",
  "K050",
  "K060",
  "K070",
  "K080",
  "K090",
].map((factoryId) => ({
  factoryId,
  factoryName: `Factory / Plant ${factoryId}`,
  regionCode: factoryId.slice(0, 1),
  factoryType: "Factory / Plant",
  status: "active",
  sourceSheet: "Supplier Factory",
}));

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
  { factoryId: "I010", skuId: "1CC0CG0004", stockQty: 44_026, unit: "M", sourceSheet: "BATCH" },
  { factoryId: "I010", skuId: "1CC0CE0004", stockQty: 6_479, unit: "M", sourceSheet: "BATCH" },
  { factoryId: "I010", skuId: "1CC0CE0000", stockQty: 1_159.2, unit: "M", sourceSheet: "BATCH" },
  { factoryId: "I010", skuId: "1CC0CH0501", stockQty: 10_129.98, unit: "M", sourceSheet: "BATCH" },
  { factoryId: "I010", skuId: "1DD0DC0000", stockQty: 106, unit: "EA", sourceSheet: "BATCH" },
  { factoryId: "K010", skuId: "1DD0DC0000", stockQty: 86, unit: "EA", sourceSheet: "BATCH" },
];

export const peaLeadTimeSummary: PeaLeadTimeSummary[] = [
  {
    factoryId: "I010",
    skuId: "1DD0DC0000",
    transactionCount: 12,
    avgDocumentProcessLtDays: 24.33,
    avgProcurementLtDays: 26.08,
    avgSumLtDays: 50.42,
    p90SumLtDays: 58,
    p95SumLtDays: 62,
    sourceSheet: "LT Analyst",
  },
  {
    factoryId: "K010",
    skuId: "1DD0DC0000",
    transactionCount: 13,
    avgDocumentProcessLtDays: 1.69,
    avgProcurementLtDays: 12.92,
    avgSumLtDays: 14.62,
    p90SumLtDays: 20,
    p95SumLtDays: 24,
    sourceSheet: "LT Analyst",
  },
  {
    factoryId: "K020",
    skuId: "1DD0DC0000",
    transactionCount: 10,
    avgDocumentProcessLtDays: 15.4,
    avgProcurementLtDays: 55.7,
    avgSumLtDays: 71.1,
    p90SumLtDays: 82,
    p95SumLtDays: 90,
    sourceSheet: "LT Analyst",
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

// Bridge นี้ช่วยให้หน้า demo เดิมที่ใช้ C01 / WH-001 สามารถตรวจ coverage กับ model ใหม่ได้ระหว่าง migration
const prototypeAlias = {
  warehouseId: {
    "WH-001": "I010",
    "WH-002": "I020",
    "WH-003": "K010",
    "WH-004": "K020",
    "WH-005": "K030",
  } as Record<string, string>,
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
  const mapping = getWarehouseFactoryMapping(params.warehouseId);
  const mappedFactoryId = mapping?.factoryId;

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
    mappedFactoryId,
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
