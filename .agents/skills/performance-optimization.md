---
name: performance-optimization
description: ทักษะการวิเคราะห์และเพิ่มประสิทธิภาพแอปพลิเคชัน (React Performance & Vite Build Size)
---
# Performance Optimization Skill

ทักษะขั้นสูงสำหรับการรีดประสิทธิภาพ เมื่อแอปพลิเคชันเริ่มทำงานช้า หรือ Build Size มีขนาดใหญ่เกินไป (เช่น เจอ Chunk Size Warning > 500kB จาก Vite)

## กระบวนการวิเคราะห์และแก้ไข (Optimization Workflow):

1. **Bundle Size Reduction (การลดขนาดแอป):**
   - ตรวจสอบ Component ที่มีขนาดใหญ่แต่ไม่ได้ใช้งานทันที (เช่น Modals ขนาดใหญ่, หน้า Admin ที่ผู้ใช้ทั่วไปไม่ได้เข้า)
   - ปรับไปใช้ `React.lazy()` ควบคู่กับ `<Suspense>` แบบ Dynamic Import (เช่น `const HistoryModal = lazy(() => import('./HistoryModal'))`) เพื่อซอยขนาดไฟล์ Chunk ของ Vite ให้เล็กลง

2. **React Rendering Optimization (ลดการ Re-render):**
   - ใช้ `React.memo()` ครอบ List Items ย่อยๆ ในกรณีที่หน้านั้นมีข้อมูล Realtime วิ่งเข้ามาตลอดเวลา
   - ป้องกันการสร้าง Function/Object ใหม่พร่ำเพรื่อ โดยครอบตัวแปรที่ส่งเป็น Props ด้วย `useCallback` หรือ `useMemo` เมื่อเห็นสมควร

3. **Query & Data Payload Optimization:**
   - การดึงข้อมูลจาก Supabase ด้วย `select('*')` ถือเป็นข้อห้ามเมื่อข้อมูลตารางมีขนาดใหญ่
   - ให้เลือก Select เฉพาะคอลัมน์ที่ UI จำเป็นต้องใช้จริงๆ เพื่อประหยัด Bandwidth และเพิ่มความเร็วในการตอบสนองของระบบ
