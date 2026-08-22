---
description: กฎโครงสร้างโปรเจกต์และการจัดการ State (Zustand & TanStack Query)
---
# 1. Architecture & State Management Rules

กฎระเบียบสำหรับการออกแบบและจัดระเบียบโครงสร้างของ React Application

- **Separation of Concerns:** ต้องแยก UI (React Components), Business Logic (Custom Hooks), และ Data Fetching (Services) ออกจากกันอย่างชัดเจน ห้ามยัดทุกอย่างไว้ในไฟล์เดียว
- **Server State vs Client State:**
  - ข้อมูลที่ดึงจาก Database (Supabase) **ต้อง** ถูกจัดการด้วย `TanStack Query` (`useQuery`, `useMutation`) เท่านั้น เพื่อใช้ประโยชน์จาก Caching, Background Fetching และ Invalidations
  - สถานะของ UI ที่ใช้ร่วมกันทั้งแอป (เช่น เปิด/ปิด Sidebar, ข้อมูล User Session ปัจจุบัน) ให้เก็บและจัดการผ่าน `Zustand`
- **File Structure & Clean Code:**
  - ไฟล์ Component หนึ่งๆ ไม่ควรมีความยาวเกินความจำเป็น (แนะนำไม่เกิน 250-300 บรรทัด) หากยาวเกินไปให้พิจารณาแยกเป็น Sub-component ย่อยๆ
  - การ Import ไฟล์ให้จัดระเบียบไลบรารีภายนอก (Third-party) ไว้ด้านบนสุด ตามด้วย Components และ Utility ภายใน
