---
name: devops-deployment
description: ทักษะการเช็คระบบและนำโค้ดขึ้น Production ผ่าน Cloudflare Pages อย่างปลอดภัย
---
# DevOps & Deployment Workflow

ทักษะการนำโค้ดที่ได้รับการพัฒนาและแก้ไขแล้ว ขึ้นสู่ระบบจริง (Production) อย่างปลอดภัย ลดความเสี่ยงที่ระบบจะล่มจาก Human Error

## ขั้นตอนการส่งมอบ (Deployment Workflow):

1. **Pre-flight Check (ตรวจสอบความพร้อม):**
   - **ห้าม Deploy โค้ดที่ยังคอมไพล์ไม่ผ่าน**
   - สั่งรันคำสั่ง `npm run build` เพื่อตรวจสอบ Type Check ของ TypeScript (`tsc -b`) และการแพ็กเกจของ Vite ว่าผ่าน 100% หรือไม่
   - รันคำสั่ง `npm run test -- --run` (ถ้ามี Unit Test) เพื่อการันตีว่าไม่ได้เบรก Logic เก่า

2. **Commit Changes (บันทึกการเปลี่ยนแปลง):**
   - บันทึกโค้ดเข้า Git โดยใช้มาตรฐาน Conventional Commits:
     - `feat:` สำหรับฟีเจอร์ใหม่
     - `fix:` สำหรับการแก้บั๊ก
     - `chore:` สำหรับการปรับปรุงทั่วไป
     - `refactor:` สำหรับการจัดระเบียบโค้ด

3. **Deploy to Cloudflare Pages (นำขึ้นคลาวด์):**
   - ตรวจสอบให้แน่ใจว่า Environmental Variables (เช่น Token, Account ID) ถูกต้อง 
   - สั่งรันคำสั่ง Cloudflare Wrangler: 
     `npx wrangler pages deploy dist --project-name medic-e-service-v2 --commit-dirty=true`

4. **Post-Deploy Report (สรุปผล):**
   - แนบ URL ที่ได้จากผลลัพธ์ของ Wrangler กลับไปให้ผู้ใช้
   - สรุปสั้นๆ ว่าเวอร์ชันนี้มีอะไรอัปเดตไปบ้าง
