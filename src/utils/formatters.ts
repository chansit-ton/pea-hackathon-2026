/**
 * จัดรูปแบบตัวเลขสำหรับ UI ภาษาไทย
 *
 * ใช้ `th-TH` เพื่อให้มี comma/decimal ตาม locale ไทย
 * decimals คือจำนวนทศนิยมสูงสุดที่อนุญาตให้แสดง
 */
export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * จัดรูปแบบตัวเลขเป็นเงินบาท
 *
 * ใช้ใน Estimated Cost, Budget Check และ Inventory Value
 * โดยปัดทศนิยมออก เพราะข้อมูล mock เป็นราคาต่อหน่วยเต็มบาท
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * จัดรูปแบบเปอร์เซ็นต์ของผลต่าง
 *
 * ถ้าค่าเป็นบวกจะเติมเครื่องหมาย + เพื่อให้เห็นชัดว่าเพิ่มขึ้น
 * เช่น +100.0% หรือ -50.0%
 */
export function formatPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

/**
 * จัดรูปแบบผลกระทบแบบมีหน่วย
 *
 * ใช้ใน VMI Simulation เช่น -10 m, -16 days, +5 pcs
 */
export function formatImpact(value: number, unit = ""): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value)}${unit ? ` ${unit}` : ""}`;
}
