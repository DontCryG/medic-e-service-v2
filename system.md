# System Architecture (medic-e-service-v2)

เอกสารนี้อธิบายสถาปัตยกรรมและโครงสร้างระบบปัจจุบันของโปรเจกต์ (อ้างอิงจาก Source Code จริง ณ ปัจจุบัน)

## 🛠️ Tech Stack หลัก
- **Frontend Framework:** React 19 + TypeScript + Vite
- **Routing:** React Router v7 (eact-router-dom)
- **Database & Auth:** Supabase (@supabase/supabase-js)
- **Server State Management:** TanStack React Query v5 (@tanstack/react-query)
- **Client State Management:** Zustand (zustand)
- **UI Components & Tools:**
  - sweetalert2 (สำหรับแจ้งเตือนและ Popup แบบด่วน)
  - lucide-react (สำหรับไอคอนทั้งหมด)
  - eact-datepicker (สำหรับเลือกวันที่)
  - ramer-motion (สำหรับแอนิเมชัน)

## 🔐 Authentication Flow
- **ระบบ Login:** ใช้ **Supabase Auth (Discord OAuth)** เป็นหลักในการยืนยันตัวตน
- โค้ดส่วน Login อยู่ที่ src/pages/Portal.tsx โดยใช้ supabase.auth.getSession() เพื่อดึงข้อมูลเซสชัน
- **State:** เมื่อล็อกอินสำเร็จ ข้อมูลพนักงานจะถูกเก็บลงใน Zustand Store (src/store/authStore.ts) เพื่อให้ทุกหน้าสามารถดึงสิทธิ์ (Role/Position) ไปใช้เช็คเพื่อซ่อน/แสดงปุ่มต่างๆ ได้

## 📂 โครงสร้างระบบและโมดูลหลัก (Core Systems)
ระบบถูกแบ่งออกเป็นฟีเจอร์หลักๆ ตามโฟลเดอร์ใน src/pages/:

1. **Duty System (DutySystem/)**: ระบบเข้าเวร มีแสดงรายชื่อคนกำลังเข้าเวร (Live Users), ประวัติการเข้าเวร, และการเพิ่มเวรพิเศษ
2. **Leave System (LeaveSystem/)**: ระบบการลาพักผ่อน/ลาป่วย
3. **Salary System (SalarySystem/)**: ระบบคำนวณเงินเดือน, ออกสลิปเงินเดือน (Payslip), และดูรายงานเงินเดือนสรุป
4. **Personnel System (PersonnelSystem/)**: จัดการบุคลากร เพิ่ม/ลด/แก้ไขตำแหน่ง
5. **Accounting System (AccountingSystem/)**: ระบบบัญชีและการจัดการคลัง (Inventory/Finance Logs)
6. **Request Management (RequestManagement/)**: จัดการคำร้องต่างๆ
7. **Queue System (QueueSystem/)**: ระบบคิว (Queue Row)
8. **System Settings (SystemSettings/)**: ตั้งค่าระบบหลังบ้าน เช่น แก๊ง/ครอบครัว, ตำแหน่ง, และราคาเบิกจ่าย

## 🔄 Data Fetching & Realtime Strategy
- **React Query:** โฟลเดอร์ของแต่ละระบบจะมีแฟ้ม hooks/ เช่น useDutyQueries.ts หรือ useDutyMutations.ts ซึ่งใช้ React Query ในการดึงข้อมูลและจัดการ Caching
- **Realtime:** มีไฟล์เช่น useDutyRealtime.ts ทำหน้าที่ Subscribe ข้อมูลจาก Supabase แบบ Real-time ทันทีที่ข้อมูลมีการ Insert/Update/Delete มันจะสั่ง Invalidate React Query Cache เพื่อให้หน้าเว็บดึงข้อมูลใหม่โดยอัตโนมัติ
