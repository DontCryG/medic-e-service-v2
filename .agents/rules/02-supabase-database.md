---
description: มาตรฐานความปลอดภัยและการใช้งาน Supabase & Realtime WebSockets
---
# 2. Supabase & Realtime Mastery Rules

กฎเหล็กสำหรับการเชื่อมต่อฐานข้อมูลและการทำ Realtime Sync

- **Realtime Channel Safety (ป้องกัน Crash/Memory Leak):**
  - ทุกการเรียกสร้าง WebSocket ผ่าน `supabase.channel()` **ต้อง** มี Suffix เป็นตัวแปรสุ่มต่อท้ายชื่อ Channel เสมอ (เช่น `live-data-${Date.now()}_${Math.random()}`) เพื่อหลีกเลี่ยงปัญหาการชนกัน (Join multiple times) เมื่อ React ทำการ Remount
  - **ห้ามลืม:** ต้องมีการเรียก `supabase.removeChannel(channel)` ใน Cleanup function ของ `useEffect` ทุกครั้งอย่างเด็ดขาด
- **Query & RLS Safety (ป้องกัน 401 Unauthorized / Null Array):**
  - ทุก `useQuery` ที่ทำการดึงข้อมูลส่วนตัวหรือข้อมูลที่มี Row Level Security (RLS) ปกป้องอยู่ **ต้อง** สอดแทรก Option `enabled: !!user` หรือตรวจสอบ Auth State ก่อนเสมอ เพื่อไม่ให้ยิง Request เปล่าๆ ออกไปตอนที่ Token ยังไม่พร้อม
- **Type Safety:** โค้ดที่ดึงข้อมูลจากตาราง ต้องอ้างอิง Interface/Type จาก Database Schema (เช่น `users`, `duty_logs`) ห้ามกำหนดข้อมูลมั่วหรือข้ามการระบุ Type
