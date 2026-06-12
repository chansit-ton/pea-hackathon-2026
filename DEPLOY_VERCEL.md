# Deploy บน Vercel — Checklist

แอปนี้เป็น Vite + React (frontend อย่างเดียว, ไม่มี backend) ข้อมูลหลักเก็บใน browser localStorage
ส่วนที่ "รวมศูนย์" คือ feedback ที่ส่งเข้า Google Sheet และ identity จาก Google Sign-In

> สิ่งที่ต้องตั้งเพิ่มหลัง deploy มี 2 จุดหลัก: **(1) Environment Variables บน Vercel** และ **(2) Authorized origins บน Google Cloud Console** ถ้าไม่ตั้ง ปุ่ม Google จะ error และ feedback จะไม่เข้าชีต

## 1. นำขึ้น Vercel

1. push โค้ดขึ้น GitHub
2. Vercel → Add New → Project → import repo
3. Vercel ตรวจเจอ **Vite** อัตโนมัติ:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. แอปเป็น single page (ไม่มี client-side route) → **ไม่ต้องตั้ง rewrite / SPA fallback**

## 2. Environment Variables (สำคัญ)

Project → Settings → Environment Variables — ใส่ทั้ง 3 ตัว (เลือก Production และ Preview):

```
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_ADMIN_EMAIL=your-admin@gmail.com
VITE_GOOGLE_PO_FEEDBACK_ENDPOINT=https://script.google.com/macros/s/xxxxx/exec
```

- ค่า `VITE_*` ถูก **ฝังตอน build** ดังนั้นเพิ่ม/แก้แล้วต้อง **Redeploy** ใหม่เสมอ (ไม่ใช่แค่ save)
- ถ้าไม่ตั้ง `VITE_GOOGLE_CLIENT_ID` → ปุ่ม Google จะถูกซ่อน ระบบใช้ login แบบ local (admin/admin + สมัครเอง) แทน
- ถ้าไม่ตั้ง `VITE_GOOGLE_PO_FEEDBACK_ENDPOINT` → ความเห็นจะเก็บแค่ใน localStorage ไม่เข้าชีต

## 3. Google Cloud Console — OAuth (สำคัญที่สุด)

### 3.1 Authorized JavaScript origins
APIs & Services → Credentials → OAuth Client (Web) → แก้ → เพิ่ม origin ของ Vercel:

```
https://<ชื่อโปรเจค>.vercel.app
```

(+ custom domain ถ้ามี เช่น `https://app.example.com`)

> ถ้า origin ไม่ตรง จะเจอ error `The given origin is not allowed for the given client ID`

### 3.2 OAuth consent screen — Publishing status
- **Testing**: เฉพาะ test users ที่เพิ่มไว้เท่านั้นที่ login ได้ → เพิ่มอีเมลผู้ใช้ (ได้ถึง 100 คน)
- **In production** (กด Publish app): ใครก็ login ได้ — scope แค่ profile/email ไม่ต้องผ่าน verification

## 4. Google Apps Script (ฝั่งชีต)

- Deployment ต้องเป็น **Web app**, Execute as **Me**, Who has access **Anyone**
- ใช้ URL ที่ลงท้าย `/exec`
- ทุกครั้งที่แก้โค้ด Apps Script ต้อง **Deploy → Manage deployments → New version** (ดู `GOOGLE_SHEET_ENDPOINT.md`)
- ใช้ endpoint เดียวกับ local ได้เลย ไม่ต้องแยกของ production

## 5. จุดที่มักลืม / ข้อควรรู้

- **Preview deployments** ของ Vercel มี URL สุ่มทุก commit → Google Sign-In ใช้ไม่ได้บน preview (origin ไม่ได้ลงทะเบียน) ใช้ได้เฉพาะ Production domain ที่ใส่ใน origins — ถ้าต้องเทสบน preview ต้องเอา URL นั้นไปเพิ่มใน origins ด้วย
- **ข้อมูลแยกตามเครื่อง**: feedback/users/transfer state ฯลฯ อยู่ใน localStorage ของแต่ละ browser — ผู้เข้าชมแต่ละคนเห็นของตัวเอง ส่วนที่รวมศูนย์คือ Google Sheet เท่านั้น
- **`.env.local` ต้องไม่ถูก commit** (อยู่ใน `.gitignore` แล้ว) — Client ID เป็น public อยู่แล้ว แต่กันไว้ดีกว่า
- **HTTPS**: Google Sign-In ต้องรันบน https — Vercel ให้อัตโนมัติ

## 6. ลำดับที่แนะนำ

1. push โค้ด → import เข้า Vercel
2. ใส่ env 3 ตัว → Deploy
3. เอา URL `https://<project>.vercel.app` ไปใส่ใน Google **Authorized origins**
4. เพิ่มอีเมลตัวเองเป็น **test user** (หรือกด **Publish app**)
5. เปิดเว็บจริง → ทดสอบ: login ด้วย Google → พิมพ์ feedback → เปิด Google Sheet เช็คว่ามีแถวใหม่ในชีต `Feedback`

## เก็บตก (optional หลัง deploy)

- ถ้าอยากให้ "ศูนย์ความเห็น" ในแอป **ดึง feedback ของทุกคนจากชีตมาแสดง** ต้องเพิ่ม `doGet` ใน Apps Script แล้วให้แอป fetch (ตอนนี้เป็นทางเดียว: เขียนเข้าชีตอย่างเดียว)
- ถ้าต้องการ auth/ฐานข้อมูลจริง (verify token ฝั่ง server, เก็บข้อมูลรวมศูนย์เต็มรูปแบบ) ค่อยย้ายไป Firebase/Supabase ภายหลัง
