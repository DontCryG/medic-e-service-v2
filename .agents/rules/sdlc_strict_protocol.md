---
description: Strict Agent Protocol and SDLC Rules for the AI to follow before making any code modifications.
---
# Agent Protocol Rules (กฏข้อบังคับสูงสุดของระบบ)

กฏเหล่านี้ถูกสร้างขึ้นเพื่อให้มั่นใจว่า AI Agent (ตัวผมเอง) จะปฏิบัติงานด้วยความรอบคอบ รัดกุม และไม่ทำการเปลี่ยนแปลงโค้ดใดๆ โดยพลการหรือปราศจากการวิเคราะห์อย่างถี่ถ้วน

## Rule 1: Diagnostic First (วิเคราะห์สาเหตุของปัญหาก่อน)
- ห้ามแก้ไขโค้ดทันทีเมื่อเจอ Error
- ต้องตรวจสอบข้อมูล Log, Stack Trace, และ Context ที่เกี่ยวข้องอย่างละเอียด
- ต้องค้นหา Root Cause (ต้นตอของปัญหา) ให้พบก่อนลงมือเขียนแผนแก้ปัญหา

## Rule 2: SDLC Adherence (ปฏิบัติตามวัฏจักรซอฟต์แวร์)
- ทุกการแก้ไขหรือสร้าง Architecture ใหม่ ต้องทำเอกสารแพลนงาน (Planning Mode)
- ต้องทำ implementation_plan.md ให้ผู้ใช้อนุมัติทุกครั้งก่อนแก้ไขโค้ดที่ซับซ้อน
- หลีกเลี่ยงการทำสิ่งที่นอกเหนือจากสโคปของปัญหาที่ได้รับ

## Rule 3: Atomic & Focused Changes (แก้ไขเฉพาะจุดที่จำเป็น)
- 1 Pull Request / Commit ต่อ 1 ปัญหา
- ห้ามแอบลบโค้ดเก่าที่ไม่ได้เกี่ยวข้อง (No silent refactoring) เพื่อป้องกันผลกระทบที่คาดไม่ถึง

## Rule 4: Graceful Degradation (ระบบต้องทำงานได้เสมอ)
- หลีกเลี่ยงการพังของ External Services (เช่น Supabase, API) ด้วย Error Handling ที่เหมาะสม (Try/Catch)
- หากข้อมูลไม่พร้อมใช้งาน ต้องมีหน้าจอสำรอง (Fallback) ไม่ทำให้เกิด White Screen of Death

## Rule 5: Verification & Testing (ตรวจสอบและทดสอบ)
- หลังจากแก้ไข ต้องมีการเขียนหรือรันคำสั่งทดสอบ (Testing) หรือเขียนเอกสารตรวจสอบ (Verification Plan)
- ตรวจสอบผ่าน Console, Network Tab และเครื่องมือ Testing
- ข้อบังคับ: หากโปรเจกต์ยังไม่มีเครื่องมือ Testing (เช่น Vitest, React Testing Library) ให้ติดตั้งก่อนเริ่มทำงาน
