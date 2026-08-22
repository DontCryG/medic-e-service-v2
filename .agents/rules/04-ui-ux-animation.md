---
description: กฎการจัดการหน้าตา (UI/UX), การวาง Layout และการควบคุม Framer Motion ให้ปลอดภัย
---
# 4. UI/UX & Animation Safety Rules

มาตรฐานความสวยงาม การจัด Layout และเทคนิคแอนิเมชันที่ไม่สร้างข้อผิดพลาด

- **Framer Motion React Safety:**
  - ทุกครั้งที่ใช้ Component `<AnimatePresence>` เพื่อทำแอนิเมชันตอนลบ Element ออกจากหน้าจอ จะต้องมั่นใจว่า Component ลูกตรงกลางที่เป็น `<motion.div>` หรือ Element อื่นๆ **มี `key` prop ที่ไม่ซ้ำกันและเป็นค่าคงที่ (Unique & Stable Key)** เสมอ
  - ห้ามใช้ Index ของ Array เป็น Key ภายใน `<AnimatePresence>` เด็ดขาด เพื่อป้องกัน React DOM Mutation Error (เช่น `NotFoundError: Failed to execute 'insertBefore' on 'Node'`)
- **Styling & Theme Consistency:**
  - ยึดการใช้ CSS Variables ที่ตั้งไว้ในระบบ (เช่น `var(--primary)`, `var(--bg-secondary)`, `var(--text-primary)`) เป็นหลัก 
  - ห้าม Hardcode โค้ดสีหรือฟอนต์แปลกปลอมเข้าไปใน Inline Style เว้นแต่เป็นการคำนวณแบบ Dynamic
- **Responsive by Default:**
  - สร้าง UI ในแบบ Mobile-First หรือคำนึงถึงขนาดหน้าจอเล็กเสมอ (หน้าจอแคบต้องไม่พัง Layout ไม่ล้นออกนอกจอ)
