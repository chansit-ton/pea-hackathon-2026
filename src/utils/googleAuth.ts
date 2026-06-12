// Google Sign-In (OAuth) ผ่าน Google Identity Services (GIS) — ทำงานฝั่ง client บน Vercel ได้เลย ไม่ต้องมี backend
//
// ตั้งค่า:
// - VITE_GOOGLE_CLIENT_ID = OAuth 2.0 Client ID (Web) จาก Google Cloud Console
// - VITE_ADMIN_EMAIL (optional) = อีเมลที่ให้สิทธิ์ admin (ลบความเห็นได้)
//
// ถ้าไม่ตั้ง CLIENT_ID ปุ่ม Google จะไม่ขึ้น และระบบจะใช้ login แบบ local (PoC) แทน
// หมายเหตุความปลอดภัย: PoC นี้ decode JWT ฝั่ง client โดยไม่ verify ลายเซ็นที่ backend
// ของจริงควร verify id_token ที่ server ก่อนเชื่อถือ identity

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
const adminEmail = import.meta.env.VITE_ADMIN_EMAIL?.trim()?.toLowerCase();

export function getGoogleClientId() {
  return clientId;
}

export function isGoogleAuthEnabled() {
  return Boolean(clientId);
}

export function isAdminEmail(email: string) {
  return Boolean(adminEmail) && email.trim().toLowerCase() === adminEmail;
}

export type GoogleProfile = {
  name: string;
  email: string;
  picture?: string;
};

// โหลดสคริปต์ GIS ครั้งเดียว
let gisPromise: Promise<void> | null = null;
export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if ((window as unknown as { google?: { accounts?: unknown } }).google?.accounts) return Promise.resolve();
  if (gisPromise) return gisPromise;

  gisPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("google-identity-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("โหลด Google Identity ไม่สำเร็จ")));
      return;
    }
    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("โหลด Google Identity ไม่สำเร็จ"));
    document.head.appendChild(script);
  });
  return gisPromise;
}

// decode payload ของ JWT (id_token) ที่ GIS ส่งกลับมา
export function parseGoogleCredential(credential: string): GoogleProfile | null {
  try {
    const payload = credential.split(".")[1];
    const json = decodeURIComponent(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    const data = JSON.parse(json) as { name?: string; email?: string; picture?: string };
    if (!data.email) return null;
    return { name: data.name ?? data.email, email: data.email, picture: data.picture };
  } catch {
    return null;
  }
}
