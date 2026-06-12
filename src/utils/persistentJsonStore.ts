const STORAGE_PREFIX = "pea-ai-inventory";
const STORAGE_VERSION = 1;

type StoredJsonEnvelope<T> = {
  version: number;
  savedAt: string;
  data: T;
};

function getStorageKey(key: string) {
  return `${STORAGE_PREFIX}:${key}`;
}

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * อ่านข้อมูล JSON ที่ผู้ใช้เคยแก้ไขไว้ใน browser storage
 *
 * ใช้ seed data เป็น fallback เท่านั้น:
 * - ครั้งแรกที่เปิดระบบจะอ่านจาก seed
 * - หลังจากผู้ใช้เพิ่ม/แก้/submit แล้ว ต้องอ่านค่าจาก JSON storage
 */
export function loadPersistentJson<T>(key: string, fallback: T): T {
  if (!canUseBrowserStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(getStorageKey(key));
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as StoredJsonEnvelope<T> | T;

    if (parsed && typeof parsed === "object" && "data" in parsed) {
      return (parsed as StoredJsonEnvelope<T>).data;
    }

    return parsed as T;
  } catch (error) {
    console.warn(`Cannot load persistent JSON for ${key}`, error);
    return fallback;
  }
}

/**
 * บันทึกข้อมูลเป็น JSON ทุกครั้งที่ state สำคัญเปลี่ยน
 *
 * หมายเหตุ:
 * Frontend-only app ไม่สามารถเขียนกลับไฟล์ .json ใน repo ได้โดยตรง
 * จึงเก็บเป็น JSON ใน localStorage เพื่อให้ข้อมูลอยู่ต่อหลัง refresh
 */
export function savePersistentJson<T>(key: string, data: T) {
  if (!canUseBrowserStorage()) return;

  const envelope: StoredJsonEnvelope<T> = {
    version: STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    data,
  };

  window.localStorage.setItem(getStorageKey(key), JSON.stringify(envelope));
}

export function removePersistentJson(key: string) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.removeItem(getStorageKey(key));
}

const SEED_VERSION_KEY = "__seedVersion";

/**
 * รีเซ็ต cache ของ seed/master data เมื่อมีการเปลี่ยนชุดข้อมูลตั้งต้น (เช่น เพิ่ม SKU ใหม่)
 *
 * ปัญหาเดิม: localStorage เก็บ seed เวอร์ชันเก่าไว้ แล้ว overwrite ข้อมูล seed ใหม่ตอนโหลด
 * ทำให้ SKU/inventory ที่เพิ่งเพิ่มไม่ขึ้น — ต้อง bump seedVersion เพื่อล้าง cache ชุดนั้น
 */
export function ensureSeedVersion(currentSeedVersion: number, keysToReset: string[]) {
  if (!canUseBrowserStorage()) return;
  const storedRaw = window.localStorage.getItem(getStorageKey(SEED_VERSION_KEY));
  const stored = storedRaw === null ? null : Number(storedRaw);
  if (stored === currentSeedVersion) return;
  keysToReset.forEach((key) => window.localStorage.removeItem(getStorageKey(key)));
  window.localStorage.setItem(getStorageKey(SEED_VERSION_KEY), String(currentSeedVersion));
}
