# Medic E-Service V2 (with Rust High-Performance Backend)

ระบบบริหารจัดการเวรแพทย์ (Duty & Queue System) ที่ขับเคลื่อนด้วย **Rust Backend (Axum + Tokio)** ผสานกับ **React 18 + Vite** และ **Supabase**

---

## 🚀 คุณสมบัติและสถาปัตยกรรม (Architecture)

### 1. High Performance & Concurrency (Rust Backend)
- **Axum 0.8 + Tokio Async Runtime**: รองรับการยิง Request ระดับหมื่น Concurrent Connections โดยใช้หน่วยความจำ (RAM) ต่ำมาก
- **24/7 Server-Side Break Watchdog**: รัน Background Thread ตรวจจับแพทย์ที่พักเบรกเกิน 15 นาที และบังคับออกเวรอัตโนมัติ แม้ผู้ใช้ทุกคนจะปิดหน้าเว็บบราวเซอร์ไปแล้ว
- **Atomic Single-Queued Enforcement**: ระบบป้องกันแพทย์ชนกันในคิว (Single Active Doctor Rotation) รันแบบเซิร์ฟเวอร์ทรานแซกชัน

### 2. High Security & Anti-F12 Inspection
- **Server-Side Token Verification**: ทุก Request ต้องแนบ Supabase Auth JWT Bearer Token — เซิร์ฟเวอร์ Rust ดึง Discord ID และ Role โดยตรง ป้องกันการปลอมแปลง Identity (Spoofing) หรือแก้ไขตัวแปรใน DevTools (F12)
- **Protected Business Logic**: การคำนวณชั่วโมงเวร, หักเวลาพักเบรกแบบทศนิยมแม่นยำ, ตัดเวรเมื่อไม่ถึง 1 นาที, และการแจกโบนัสหมอรันคิว 2 ชั่วโมง (`queue_manager_bonus`) ประมวลผลบน Rust 100%

---

## 🛠️ วิธีการรันระบบ (Getting Started)

### 1. รัน Rust Backend (Port 3001)
```bash
# พัฒนา (Development)
npm run dev:backend
# หรือ
cargo run --manifest-path backend/Cargo.toml

# ทดสอบ Unit Tests
npm run test:backend

# บิลด์สำหรับ Production
npm run build:backend
```

### 2. รัน Frontend (React + Vite)
```bash
# ติดตั้งแพ็กเกจ (ครั้งแรก)
npm install

# รันหน้าบ้าน
npm run dev

# บิลด์โปรเจกต์
npm run build
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env` หรือ `.env` ที่ root)
- `PORT`: พอร์ตสำหรับรัน Backend (ค่าเริ่มต้น `3001`)
- `SUPABASE_URL`: Supabase Project URL
- `SUPABASE_ANON_KEY`: Supabase Anon Public Key (สำหรับยืนยัน JWT)
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (แนะนำสำหรับ Production เพื่อความปลอดภัยระดับ RLS)
- `CORS_ORIGIN`: อนุญาต Origin เช่น `http://localhost:5173` หรือ `*` ในช่วงพัฒนา

### Frontend (`.env`)
- `VITE_SUPABASE_URL`: Supabase Project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase Anon Public Key
- `VITE_API_URL`: URL ของ Rust Backend (ค่าเริ่มต้น `http://localhost:3001`)

---

## 📦 สำรองข้อมูล (Backup)
ก่อนทำการปรับปรุงโครงสร้างเป็น Rust ได้ทำการสำรองข้อมูลไว้เรียบร้อยแล้ว:
- **Archive File**: `medic-e-service-v2-backup-20261115.tar.gz`
- **Git Tag**: `backup-v2-pre-rust`
- **Git Branch**: `backup/pre-rust-backend`
