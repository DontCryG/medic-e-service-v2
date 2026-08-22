---
description: กฎการเขียนโปรแกรมเชิงรับ (Defensive Programming) และข้อบังคับ QA
---
# 3. Defensive Programming & QA Rules

มาตรฐานการเขียนโค้ดเพื่อป้องกันแอปพลิเคชันล่ม (Crash) และการรักษาระดับคุณภาพ

- **Zero 'any' Policy (Strict TypeScript):**
  - ห้ามประกาศ Type เป็น `any` เด็ดขาด เพื่อปิดช่องโหว่ Runtime Error ยกเว้นกรณีที่เรียกใช้ไลบรารีภายนอกที่ไม่มี Types และไม่สามารถหลีกเลี่ยงได้จริงๆ (ต้องมีคอมเมนต์อธิบายกำกับ)
- **Safe Object Access (Null/Undefined Checks):**
  - ข้อมูลทุกอย่างที่ตอบกลับมาจาก API (Supabase) ไม่สามารถเชื่อถือได้ 100% ต้องใช้ Optional Chaining (`?.`) และ Nullish Coalescing (`??`) เสมอ (เช่น `data?.users?.ic_name ?? 'Unknown'`)
- **UI Error Prevention:**
  - ห้ามทำให้เกิด White Screen of Death ถ้าข้อมูลบางส่วนแหว่งไป ระบบต้องแสดง Fallback UI หรือแจ้งเตือนข้อผิดพลาดที่ชัดเจน
- **Testing Protocol:**
  - Component หรือ Logic สำคัญ (เช่น ระบบคำนวณเวลาเข้าเวร, ระบบคิว) ต้องถูกควบคุมคุณภาพด้วย Unit/Integration Test ผ่าน `Vitest`
  - หากมีการ Refactor โค้ด ต้องรัน `npm run test` เสมอ
