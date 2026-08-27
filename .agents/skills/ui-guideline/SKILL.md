---
name: ui-guideline
description: กฎในการแก้ไข UI และ CSS ของระบบ
---

# UI & CSS Guideline

1. **ห้ามรื้อ CSS ของตาราง (Tables):**
   - ตารางในระบบนี้ถูกจัด Layout ไว้ด้วย CSS Grid/Flex แบบเฉพาะเจาะจง ห้ามใช้คำสั่ง Replace All หรือลบคลาสของตารางเด็ดขาด
2. **การแจ้งเตือน:**
   - เมื่อเพิ่ม/ลบ/แก้ไข สำเร็จ ให้ใช้ Swal.fire({ title: 'สำเร็จ!', icon: 'success' }) เสมอ
3. **Icons:**
   - ดึงไอคอนจาก lucide-react เท่านั้น