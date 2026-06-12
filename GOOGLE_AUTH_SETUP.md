# Google Sign-In (OAuth) Setup

ระบบรองรับการเข้าสู่ระบบด้วยบัญชี Google (Google Identity Services) ทำงานฝั่ง client บน Vercel ได้เลย ไม่ต้องมี backend
ถ้ายังไม่ตั้งค่า ปุ่ม Google จะไม่ขึ้น และระบบจะใช้ login แบบ local (PoC) แทนโดยอัตโนมัติ

## 1. สร้าง OAuth Client ID

1. ไปที่ https://console.cloud.google.com/ → สร้าง/เลือก project
2. เมนู **APIs & Services → Credentials**
3. กด **Create Credentials → OAuth client ID**
   - ถ้ายังไม่เคยตั้ง **OAuth consent screen** ให้ตั้งก่อน (เลือก External, ใส่ชื่อแอป, อีเมล, บันทึก)
4. **Application type: Web application**
5. **Authorized JavaScript origins** ใส่ origin ที่จะรันจริง เช่น:
   - `http://localhost:5173` (สำหรับ dev)
   - `https://<your-app>.vercel.app` (สำหรับ production)
6. กด Create แล้วคัดลอก **Client ID** (รูปแบบ `xxxxx.apps.googleusercontent.com`)

> หมายเหตุ: Google Sign-In ต้องรันบน origin ที่ลงทะเบียนไว้เท่านั้น (localhost หรือ https) — เปิดไฟล์ตรง ๆ จะไม่ทำงาน

## 2. ตั้งค่า Environment Variables

สร้าง/แก้ `.env.local` (ดูตัวอย่างใน `.env.example`):

```
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_ADMIN_EMAIL=your-admin@gmail.com
```

- `VITE_GOOGLE_CLIENT_ID` — Client ID จากขั้นตอนที่ 1
- `VITE_ADMIN_EMAIL` (optional) — อีเมลที่จะได้สิทธิ์ admin (ลบความเห็นได้) เมื่อล็อกอินด้วย Google

บน Vercel: เพิ่ม env เดียวกันใน **Project Settings → Environment Variables** แล้ว redeploy

restart dev server หลังแก้ env (`npm run dev`)

## 3. ผลที่ได้

- หน้า `บัญชีผู้ใช้` จะมีปุ่ม **Sign in with Google** อยู่ด้านบน
- ล็อกอินแล้วระบบเก็บ **ชื่อ + อีเมลจริง** จาก Google ใช้ติดกับความเห็น/feedback
- ถ้าอีเมลตรง `VITE_ADMIN_EMAIL` จะเป็น role admin (ลบความเห็นได้ด้วยรหัส 99999)
- login แบบ local (admin/admin + สมัครเอง) ยังใช้ได้เป็น fallback

## ข้อจำกัด / สิ่งที่ยังต้องทำต่อ

- **ความปลอดภัย:** PoC นี้ decode id_token ฝั่ง client โดยไม่ verify ลายเซ็นที่ server — ของจริงควร verify ที่ backend ก่อนเชื่อ identity
- **การเก็บ feedback รวมศูนย์:** Google Sign-In ให้แค่ identity ส่วนตัว feedback ยังเก็บใน localStorage ต่อเครื่อง ถ้าต้องการให้ feedback ของทุกคนมารวมที่เดียว ต้องเก็บลง datastore เช่น Firestore หรือส่งเข้า Google Sheet ผ่าน `VITE_GOOGLE_PO_FEEDBACK_ENDPOINT` (ดู `GOOGLE_SHEET_ENDPOINT.md`)
