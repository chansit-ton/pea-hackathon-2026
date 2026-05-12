import type {
  ApprovalRoutingResult,
  BudgetContext,
  HistoricalUsagePeriod,
  InventoryCalculationResult,
  InventoryRecord,
  PurchaseRequestPreview,
  QuantityVarianceResult,
  SupplierSkuRecord,
} from "../types";

/**
 * รวมปริมาณการใช้ย้อนหลังทุกช่วงเวลา
 *
 * ความหมาย:
 * ใช้หาว่าคลังใช้พัสดุรายการนี้รวมทั้งหมดเท่าไรในช่วงข้อมูลย้อนหลัง
 *
 * ตัวอย่าง C01:
 * 80 + 100 + 90 + 120 + 110 + 100 = 600 เมตร
 */
export function calculateHistoricalUsageTotal(historicalUsage: HistoricalUsagePeriod[]): number {
  return historicalUsage.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * รวมจำนวนวันของข้อมูลย้อนหลัง
 *
 * ความหมาย:
 * ใช้เป็นตัวหารในการคำนวณ Average Daily Demand
 *
 * ตัวอย่าง C01:
 * 6 เดือน เดือนละ 30 วัน = 180 วัน
 */
export function calculateHistoricalUsageDays(historicalUsage: HistoricalUsagePeriod[]): number {
  return historicalUsage.reduce((sum, item) => sum + item.days, 0);
}

/**
 * คำนวณค่าเฉลี่ยการใช้ต่อวัน
 *
 * สูตร:
 * Average Daily Demand = Historical Usage Total / Historical Usage Days
 *
 * ตัวอย่าง C01:
 * 600 / 180 = 3.33 เมตร/วัน
 *
 * ใช้ต่อใน:
 * Demand During Lead Time และ Reorder Point
 */
export function calculateAverageDailyDemand(historicalUsageTotal: number, historicalUsageDays: number): number {
  if (historicalUsageDays <= 0) return 0;
  return historicalUsageTotal / historicalUsageDays;
}

/**
 * คำนวณ Standard Deviation ของชุดข้อมูล
 *
 * ความหมาย:
 * ใช้วัดว่าปริมาณการใช้แกว่งมากน้อยแค่ไหน
 * ถ้าค่านี้สูง แปลว่า demand ไม่สม่ำเสมอ และควรมี Safety Stock สูงขึ้น
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * คำนวณความผันผวนของ Demand ต่อวัน
 *
 * วิธีคิด:
 * 1. คำนวณ standard deviation จากปริมาณใช้ราย period เช่น รายเดือน
 * 2. แปลงความผันผวนราย period ให้เป็นรายวัน โดยหารด้วย sqrt(จำนวนวันเฉลี่ยต่อ period)
 *
 * ตัวอย่าง:
 * ถ้า usage รายเดือนแกว่งมาก ระบบจะได้ demandVariabilityPerDay สูงขึ้น
 * และทำให้ Safety Stock สูงขึ้นตาม
 */
export function calculateDemandVariabilityPerDay(
  historicalUsage: HistoricalUsagePeriod[],
): {
  demandVariabilityPerPeriod: number;
  demandVariabilityPerDay: number;
} {
  const quantities = historicalUsage.map((item) => item.quantity);
  const demandVariabilityPerPeriod = calculateStandardDeviation(quantities);
  const averageDaysPerPeriod =
    historicalUsage.length === 0
      ? 0
      : historicalUsage.reduce((sum, item) => sum + item.days, 0) / historicalUsage.length;

  const demandVariabilityPerDay =
    averageDaysPerPeriod > 0 ? demandVariabilityPerPeriod / Math.sqrt(averageDaysPerPeriod) : 0;

  return {
    demandVariabilityPerPeriod,
    demandVariabilityPerDay,
  };
}

/**
 * คำนวณ Lead Time ที่ปรับแล้ว
 *
 * สูตร:
 * Adjusted Lead Time = Supplier Lead Time × Seasonal Factor × Budget Factor
 *
 * ความหมาย:
 * Supplier อาจแจ้ง Lead Time 25 วัน แต่ระบบต้องเผื่อฤดูกาลหรือระยะเวลาอนุมัติภายใน
 *
 * ตัวอย่าง C01:
 * 25 × 1.20 × 1.00 = 30 วัน
 */
export function calculateAdjustedLeadTime(
  supplierLeadTimeDays: number,
  seasonalFactor: number,
  budgetFactor: number,
): number {
  return supplierLeadTimeDays * seasonalFactor * budgetFactor;
}

export function calculateZScoreFromServiceLevel(serviceLevelInput: number): number {
  const serviceLevel = serviceLevelInput > 1 ? serviceLevelInput / 100 : serviceLevelInput;
  const zScoreTable = [
    { serviceLevel: 0.8, zScore: 0.84 },
    { serviceLevel: 0.85, zScore: 1.04 },
    { serviceLevel: 0.9, zScore: 1.28 },
    { serviceLevel: 0.95, zScore: 1.65 },
    { serviceLevel: 0.975, zScore: 1.96 },
    { serviceLevel: 0.99, zScore: 2.33 },
    { serviceLevel: 0.995, zScore: 2.58 },
  ];

  if (serviceLevel <= zScoreTable[0].serviceLevel) return zScoreTable[0].zScore;

  const last = zScoreTable[zScoreTable.length - 1];
  if (serviceLevel >= last.serviceLevel) return last.zScore;

  const upperIndex = zScoreTable.findIndex((item) => serviceLevel <= item.serviceLevel);
  const lower = zScoreTable[upperIndex - 1];
  const upper = zScoreTable[upperIndex];
  const ratio = (serviceLevel - lower.serviceLevel) / (upper.serviceLevel - lower.serviceLevel);

  return Math.round((lower.zScore + ratio * (upper.zScore - lower.zScore)) * 100) / 100;
}

/**
 * คำนวณ Safety Stock
 *
 * สูตร:
 * Safety Stock = Z-score × Demand Variability × √Adjusted Lead Time
 *
 * ความหมาย:
 * จำนวนสำรองขั้นต่ำเพื่อกันความเสี่ยงจาก demand ที่มากกว่าคาด
 * หรือ Lead Time ที่นานกว่าปกติ
 *
 * ตัวอย่าง C01:
 * 1.65 × 2.4 × √30 ≈ 21.69 แล้วปัดขึ้นเป็น 22 เมตรในขั้น orchestrator
 */
export function calculateSafetyStock(
  zScore: number,
  demandVariabilityPerDay: number,
  adjustedLeadTimeDays: number,
): number {
  if (adjustedLeadTimeDays <= 0) return 0;
  return zScore * demandVariabilityPerDay * Math.sqrt(adjustedLeadTimeDays);
}

/**
 * ปัดค่าขึ้นเป็นจำนวนเต็ม
 *
 * ใช้กับค่าที่ต้องนำไปปฏิบัติงานจริง เช่น Safety Stock หรือ Reorder Point
 * เพราะไม่ควรแสดงจำนวนพัสดุที่ต้องเก็บเป็นเศษถ้าเป็นหน่วยใช้งานจริง
 */
export function roundUpQuantity(value: number): number {
  return Math.ceil(value);
}

/**
 * คำนวณปริมาณที่จะถูกใช้ระหว่างรอ Supplier ส่งของ
 *
 * สูตร:
 * Demand During Lead Time = Average Daily Demand × Adjusted Lead Time
 *
 * ตัวอย่าง C01:
 * 3.33 × 30 = 99.9 เมตร
 */
export function calculateDemandDuringLeadTime(averageDailyDemand: number, adjustedLeadTimeDays: number): number {
  return averageDailyDemand * adjustedLeadTimeDays;
}

/**
 * คำนวณจุดเริ่มเติมของหรือเริ่มจัดซื้อ
 *
 * สูตร:
 * Reorder Point = Demand During Lead Time + Safety Stock
 *
 * ความหมาย:
 * ถ้า Current Stock ต่ำกว่าค่านี้ ระบบควรเตือนให้เริ่มกระบวนการเติม stock
 */
export function calculateReorderPoint(demandDuringLeadTime: number, safetyStock: number): number {
  return demandDuringLeadTime + safetyStock;
}

/**
 * คำนวณระดับ Stock เป้าหมายหลังเติมของ
 *
 * วิธีเลือกค่า:
 * - ถ้ามี targetStockLevelOverride ให้ใช้ค่านั้นก่อน
 *   เหมาะกับ policy แบบ Min-Max หรือค่าเป้าหมายที่องค์กรกำหนดไว้
 * - ถ้าไม่มี override ให้ใช้ Forecast Demand + Safety Stock
 *
 * ตัวอย่าง C01:
 * ใช้ Policy Override = 70 เมตร เพื่อให้ demo flow คงที่และอธิบายง่าย
 */
export function calculateTargetStockLevel(params: {
  forecastDemandForPlanningPeriod: number;
  safetyStock: number;
  targetStockLevelOverride?: number;
}): {
  targetStockLevel: number;
  targetStockLevelSource: "PolicyOverride" | "ForecastPlusSafetyStock";
} {
  if (typeof params.targetStockLevelOverride === "number" && params.targetStockLevelOverride >= 0) {
    return {
      targetStockLevel: params.targetStockLevelOverride,
      targetStockLevelSource: "PolicyOverride",
    };
  }

  return {
    targetStockLevel: params.forecastDemandForPlanningPeriod + params.safetyStock,
    targetStockLevelSource: "ForecastPlusSafetyStock",
  };
}

/**
 * ปัดจำนวนสั่งซื้อขึ้นตาม MOQ ของ Supplier
 *
 * ความหมาย:
 * ถ้า Supplier กำหนด MOQ = 10 และระบบคำนวณได้ 13
 * ต้องปัดเป็น 20 เพื่อให้ตรงเงื่อนไขขั้นต่ำ/รอบสั่งซื้อ
 */
export function roundUpToMoq(quantity: number, moq: number): number {
  if (quantity <= 0) return 0;
  if (moq <= 0) return Math.ceil(quantity);

  return Math.ceil(quantity / moq) * moq;
}

/**
 * คำนวณ AI Suggested Quantity
 *
 * สูตร:
 * Suggested Quantity = Target Stock Level - Current Stock
 * จากนั้นปัดขึ้นตาม MOQ
 *
 * ตัวอย่าง C01:
 * Target 70 - Current 60 = 10 เมตร
 * MOQ = 10 จึงแนะนำ 10 เมตรพอดี
 */
export function calculateSuggestedQuantity(targetStockLevel: number, currentStock: number, moq: number): number {
  const rawQuantity = targetStockLevel - currentStock;

  if (rawQuantity <= 0) return 0;

  return roundUpToMoq(rawQuantity, moq);
}

/**
 * คำนวณส่วนต่างระหว่างจำนวนที่ระบบแนะนำกับจำนวนที่ผู้ใช้ขอจริง
 *
 * สูตร:
 * Variance = Requested Quantity - AI Suggested Quantity
 * Variance % = Variance / AI Suggested Quantity × 100
 *
 * ใช้เพื่อ:
 * - แสดง warning ว่าขอมากหรือน้อยกว่าคำแนะนำ
 * - บังคับกรอก Override Reason เมื่อจำนวนไม่ตรงกับ AI
 */
export function calculateQuantityVariance(
  suggestedQuantity: number,
  requestedQuantity: number,
): QuantityVarianceResult {
  const variance = requestedQuantity - suggestedQuantity;
  const variancePercent =
    suggestedQuantity === 0 ? (requestedQuantity > 0 ? 100 : 0) : (variance / suggestedQuantity) * 100;

  return {
    variance,
    variancePercent,
    isOverride: variance !== 0,
    isOverRequest: variance > 0,
    isUnderRequest: variance < 0,
  };
}

/**
 * คำนวณมูลค่าประมาณการของคำขอซื้อ
 *
 * สูตร:
 * Estimated Cost = Requested Quantity × Unit Price
 *
 * ตัวอย่าง C01:
 * 20 × 2,000 = 40,000 THB
 */
export function calculateEstimatedCost(requestedQuantity: number, unitPrice: number): number {
  return requestedQuantity * unitPrice;
}

/**
 * กำหนดเส้นทางอนุมัติจากงบประมาณ 3 ชั้น
 *
 * กติกา:
 * 1. ถ้า Estimated Cost <= Local Budget ให้ไป Local
 * 2. ถ้าเกิน Local แต่ <= Regional Budget ให้ไป Regional
 * 3. ถ้าเกิน Regional ให้ไป Central
 *
 * ตัวอย่าง C01:
 * 40,000 > Local 25,000 แต่ 40,000 <= Regional 300,000
 * ดังนั้น route = Regional
 */
export function determineApprovalLayer(
  estimatedCost: number,
  budget: BudgetContext,
): ApprovalRoutingResult {
  const localEnough = estimatedCost <= budget.localBudgetRemaining;
  const regionalEnough = estimatedCost <= budget.regionalBudgetRemaining;
  const centralEnough = estimatedCost <= budget.centralBudgetRemaining;

  if (localEnough) {
    return {
      layer: "Local",
      localEnough,
      regionalEnough,
      centralEnough,
      reason: "งบคลังพื้นที่เพียงพอ สามารถดำเนินการในระดับคลังได้",
    };
  }

  if (regionalEnough) {
    return {
      layer: "Regional",
      localEnough,
      regionalEnough,
      centralEnough,
      reason: "งบคลังพื้นที่ไม่เพียงพอ แต่งบเขตเพียงพอ จึงส่งคำขอไปยังระดับเขต",
    };
  }

  return {
    layer: "Central",
    localEnough,
    regionalEnough,
    centralEnough,
    reason: "งบคลังพื้นที่และงบเขตไม่เพียงพอ ต้องให้เขตอนุมัติการส่งต่อไปยังส่วนกลาง",
  };
}

/**
 * Orchestrator หลักสำหรับคำนวณคำแนะนำเติม stock
 *
 * หน้าที่:
 * รวมสูตรย่อยทั้งหมดให้ได้ผลลัพธ์เดียวที่ UI ใช้แสดง เช่น
 * Average Daily Demand, Safety Stock, Reorder Point,
 * Target Stock Level, AI Suggested Quantity และ Estimated Cost ของจำนวนที่ระบบแนะนำ
 *
 * หมายเหตุ:
 * ฟังก์ชันนี้ไม่ควรรู้เรื่อง Requested Quantity เพราะ Requested Quantity เป็น input จากผู้ใช้
 * และจะถูกคำนวณต่อใน calculatePurchaseRequestPreview
 */
export function calculateInventoryRecommendation(params: {
  inventory: InventoryRecord;
  supplier: SupplierSkuRecord;
  formulaVersion?: string;
}): InventoryCalculationResult {
  const formulaVersion = params.formulaVersion ?? "v1.0";
  const historicalUsageTotal = calculateHistoricalUsageTotal(params.inventory.historicalUsage);
  const historicalUsageDays = calculateHistoricalUsageDays(params.inventory.historicalUsage);
  const averageDailyDemand = calculateAverageDailyDemand(historicalUsageTotal, historicalUsageDays);
  const { demandVariabilityPerPeriod, demandVariabilityPerDay } = calculateDemandVariabilityPerDay(
    params.inventory.historicalUsage,
  );
  const adjustedLeadTimeDays = calculateAdjustedLeadTime(
    params.supplier.leadTimeDays,
    params.inventory.seasonalFactor,
    params.inventory.budgetFactor,
  );
  const safetyStock = Math.ceil(
    calculateSafetyStock(params.inventory.zScore, demandVariabilityPerDay, adjustedLeadTimeDays),
  );
  const demandDuringLeadTime = calculateDemandDuringLeadTime(averageDailyDemand, adjustedLeadTimeDays);
  const reorderPoint = Math.ceil(calculateReorderPoint(demandDuringLeadTime, safetyStock));
  const { targetStockLevel, targetStockLevelSource } = calculateTargetStockLevel({
    forecastDemandForPlanningPeriod: params.inventory.forecastDemandForPlanningPeriod,
    safetyStock,
    targetStockLevelOverride: params.inventory.targetStockLevelOverride,
  });
  const suggestedQuantity = calculateSuggestedQuantity(
    targetStockLevel,
    params.inventory.currentStock,
    params.supplier.moq,
  );
  const estimatedCostForSuggestedQuantity = calculateEstimatedCost(suggestedQuantity, params.supplier.unitPrice);

  return {
    formulaVersion,
    historicalUsageTotal,
    historicalUsageDays,
    averageDailyDemand,
    demandVariabilityPerPeriod,
    demandVariabilityPerDay,
    supplierLeadTimeDays: params.supplier.leadTimeDays,
    seasonalFactor: params.inventory.seasonalFactor,
    budgetFactor: params.inventory.budgetFactor,
    adjustedLeadTimeDays,
    serviceLevel: params.inventory.serviceLevel,
    zScore: params.inventory.zScore,
    safetyStock,
    demandDuringLeadTime,
    reorderPoint,
    forecastDemandForPlanningPeriod: params.inventory.forecastDemandForPlanningPeriod,
    planningPeriodDays: params.inventory.planningPeriodDays,
    targetStockLevel,
    targetStockLevelSource,
    moq: params.supplier.moq,
    suggestedQuantity,
    unitPrice: params.supplier.unitPrice,
    estimatedCostForSuggestedQuantity,
  };
}

/**
 * คำนวณ preview ของ Purchase Request จากจำนวนที่ผู้ใช้กรอก
 *
 * หน้าที่:
 * - คำนวณ Variance ระหว่าง Requested Quantity กับ AI Suggested Quantity
 * - คำนวณ Estimated Cost จาก Requested Quantity
 * - คำนวณ Approval Routing จากงบประมาณ
 * - บอกว่าต้องกรอก Override Reason หรือไม่
 */
export function calculatePurchaseRequestPreview(params: {
  recommendation: InventoryCalculationResult;
  requestedQuantity: number;
  unitPrice: number;
  budget: BudgetContext;
}): PurchaseRequestPreview {
  const variance = calculateQuantityVariance(params.recommendation.suggestedQuantity, params.requestedQuantity);
  const estimatedCostForRequestedQuantity = calculateEstimatedCost(params.requestedQuantity, params.unitPrice);
  const approvalRouting = determineApprovalLayer(estimatedCostForRequestedQuantity, params.budget);

  return {
    variance,
    estimatedCostForRequestedQuantity,
    approvalRouting,
    requiresOverrideReason: variance.isOverride,
  };
}

/**
 * สร้างข้อความเตือนเมื่อ Requested Quantity ต่างจาก AI Suggested Quantity
 *
 * กรณีขอมากกว่า:
 * เตือนเรื่องงบประมาณ พื้นที่จัดเก็บ และ Overstock
 *
 * กรณีขอน้อยกว่า:
 * เตือนเรื่องต่ำกว่า Safety Stock หรือ Understock
 */
export function getOverrideWarningMessage(params: {
  suggestedQuantity: number;
  requestedQuantity: number;
  unit: string;
}): string | null {
  const { suggestedQuantity, requestedQuantity, unit } = params;

  if (requestedQuantity > suggestedQuantity) {
    const diff = requestedQuantity - suggestedQuantity;
    return `จำนวนที่ขอมากกว่าค่าที่ระบบแนะนำ ${diff} ${unit} อาจส่งผลต่องบประมาณ พื้นที่จัดเก็บ และความเสี่ยง Overstock`;
  }

  if (requestedQuantity < suggestedQuantity) {
    const diff = suggestedQuantity - requestedQuantity;
    return `จำนวนที่ขอน้อยกว่าค่าที่ระบบแนะนำ ${diff} ${unit} อาจเสี่ยงต่อการต่ำกว่า Safety Stock หรือเกิด Understock`;
  }

  return null;
}

/**
 * คำนวณ Safety Stock ภายใต้โมเดล VMI
 *
 * หลักคิด:
 * VMI มักทำให้ Lead Time สั้นลง เพราะ Supplier ช่วย monitor และเติมของ
 * เมื่อ Lead Time ลดลง Safety Stock จึงควรลดลงตามสูตรเดียวกับ inventory ปกติ
 */
export function calculateVmiSafetyStock(
  zScore: number,
  demandVariabilityPerDay: number,
  vmiLeadTimeDays: number,
): number {
  if (vmiLeadTimeDays <= 0) return 0;
  return Math.ceil(zScore * demandVariabilityPerDay * Math.sqrt(vmiLeadTimeDays));
}

/**
 * คำนวณ Reorder Point ภายใต้โมเดล VMI
 *
 * สูตร:
 * VMI ROP = Average Daily Demand × VMI Lead Time + VMI Safety Stock
 */
export function calculateVmiReorderPoint(
  averageDailyDemand: number,
  vmiLeadTimeDays: number,
  vmiSafetyStock: number,
): number {
  return Math.ceil(averageDailyDemand * vmiLeadTimeDays + vmiSafetyStock);
}

/**
 * คำนวณมูลค่า inventory จากจำนวน stock และราคาต่อหน่วย
 *
 * ใช้ใน VMI Simulation เพื่อเปรียบเทียบมูลค่า stock ก่อน/หลังใช้ VMI
 */
export function calculateInventoryValue(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

/**
 * คำนวณผลกระทบของค่าใหม่เทียบกับค่าปัจจุบัน
 *
 * difference:
 * ค่าใหม่ - ค่าเดิม
 *
 * percent:
 * difference / ค่าเดิม × 100
 *
 * ใช้กับ VMI เช่น Lead Time ลดลงกี่วัน หรือ Inventory Value ลดลงกี่เปอร์เซ็นต์
 */
export function calculateImpact(
  currentValue: number,
  newValue: number,
): {
  difference: number;
  percent: number;
} {
  const difference = newValue - currentValue;
  const percent = currentValue === 0 ? 0 : (difference / currentValue) * 100;

  return {
    difference,
    percent,
  };
}

/**
 * คำนวณคะแนนความเหมาะสมของ SKU สำหรับ VMI
 *
 * หลักคิด:
 * รวมคะแนนด้าน demand stability, supplier reliability, usage frequency,
 * lead time stability และ inventory value impact
 * แล้วหัก penalty จากความซับซ้อนในการจัดซื้อ
 *
 * ผลลัพธ์ถูก clamp ให้อยู่ระหว่าง 0-100 เพื่อใช้จัดอันดับ candidate
 */
export function calculateVmiSuitabilityScore(params: {
  demandStabilityScore: number;
  supplierReliabilityScore: number;
  usageFrequencyScore: number;
  leadTimeStabilityScore: number;
  inventoryValueImpactScore: number;
  procurementComplexityPenalty: number;
}): number {
  const score =
    params.demandStabilityScore +
    params.supplierReliabilityScore +
    params.usageFrequencyScore +
    params.leadTimeStabilityScore +
    params.inventoryValueImpactScore -
    params.procurementComplexityPenalty;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * แปลงคะแนน VMI เป็นข้อความแนะนำภาษาไทย
 *
 * ใช้ให้ผู้ใช้เข้าใจเร็วว่า SKU นี้ควรทดลอง VMI หรือควรศึกษาเพิ่มก่อน
 */
export function getVmiRecommendation(score: number): string {
  if (score >= 80) return "เหมาะมากกับการทดลอง VMI";
  if (score >= 60) return "สามารถทดลอง VMI ได้";
  if (score >= 40) return "ควรศึกษาเพิ่มเติมก่อนใช้ VMI";
  return "ยังไม่เหมาะกับ VMI";
}
