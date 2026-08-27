# Design & UI Guidelines (medic-e-service-v2)

## 🎨 Styling & CSS Architecture
- **Vanilla CSS:** ระบบนี้ใช้ **CSS ปกติ (.css)** แยกตามโฟลเดอร์ Component (เช่น DutySystem.css, Portal.css)
- **CSS Variables:** สีและโครงสร้างหลักจะอ้างอิงจากตัวแปร CSS Global (เช่น ar(--primary), ar(--bg-main))
- **คำเตือนสำคัญ (CRITICAL RULE):** ระบบใช้ CSS Flexbox และ Grid แบบเฉพาะเจาะจง (Bespoke) ในการจัดเรียงตารางข้อมูล (Data Tables) **ห้าม** ให้ AI เขียน Script ลบหรือรวมคลาส CSS ของตารางเข้าด้วยกันเด็ดขาด เพราะจะทำให้ UI พังทั้งหมด

## 🧩 UI Components
- **Icons:** ใช้ lucide-react เท่านั้น ห้ามนำเข้า library ไอคอนอื่น
- **Modals & Alerts:** 
  - ใช้ SweetAlert2 (Swal.fire) สำหรับการ Confirm ก่อนลบข้อมูล หรือแจ้งเตือน Success/Error
  - ใช้ React Modal แบบสร้างเอง สำหรับฟอร์มที่มีการกรอกข้อมูลซับซ้อน (เช่น EditPersonnelModal.tsx)
- **Date Picking:** ใช้ eact-datepicker

## ♿ Accessibility & UX
- ทุกครั้งที่มีการบันทึกข้อมูล (Mutation) ปุ่มควรจะเข้าสู่สถานะ disabled หรือแสดง Loading text (เช่น "กำลังบันทึก...") เพื่อป้องกันการกดเบิ้ล
- ต้องมี Feedback ให้ผู้ใช้เสมอเมื่อทำงานสำเร็จ (Success Toast / Swal)

## ⚠️ กฎเหล็กในการแก้ไขโค้ด (Lessons Learned)
1. **ปัญหาภาษาไทย (Mojibake):** เนื่องจากหน้าเว็บใช้ภาษาไทยทั้งหมด ห้ามใช้ PowerShell Get-Content หรือ Set-Content ตรงๆ ในการแก้ไขไฟล์ ให้ใช้ File Edit Tool หรือ Node.js Buffer เพื่อรักษา Encoding UTF-8 เสมอ
2. **รักษาโครงสร้าง Folder:** เวลาสร้างหน้าใหม่ หรือเพิ่ม Component ใหม่ จะต้องเก็บใน src/pages/<FeatureName>/components/ ห้ามสร้างไฟล์ทิ้งไว้หน้า src เด็ดขาด
3. **ห้ามรื้อระบบ Database:** ฐานข้อมูลเชื่อมต่อกับ Supabase อยู่แล้ว อย่าพยายามเปลี่ยนกลับไปเป็น Firebase โดยไม่จำเป็น