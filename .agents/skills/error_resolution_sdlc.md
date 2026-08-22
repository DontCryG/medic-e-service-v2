---
name: error-resolution-sdlc
description: Standard Software Development Life Cycle (SDLC) workflow for resolving production and development errors.
---
# Error Resolution SDLC Workflow

ทักษะ (Skill) นี้มีไว้เพื่อให้ระบบใช้เป็นแนวทางมาตรฐานในการแก้ไข Bug หรือ Error ทั้งหมด เพื่อหลีกเลี่ยงการทำแบบขอไปทีหรือทำให้เกิดปัญหาซ้อนปัญหา

## Phase 1: Identification & Triage (ระบุและคัดกรอง)
1. ตรวจสอบข้อมูลจาก Sentry, Console Logs, Network Tab
2. ประเมินความรุนแรง (Severity) และผลกระทบต่อผู้ใช้งาน
3. ทำ Issue Ticket หรือ Incident Report

## Phase 2: Root Cause Analysis (วิเคราะห์ต้นตอ)
1. ติดตามการทำงาน (Call Stack) และ State ของตัวแปรที่เกี่ยวข้อง
2. ตรวจสอบ Code Logic หรือข้อจำกัดของระบบ (เช่น React Lifecycle, Database Constraints)
3. สรุปผลการวิเคราะห์เป็นลายลักษณ์อักษร

## Phase 3: Solution Design (ออกแบบการแก้ไข)
1. คิดค้นวิธีแก้ปัญหา 1-2 วิธี
2. เลือกวิธีที่ดีที่สุด (Best Practice) โดยประเมินความปลอดภัย ประสิทธิภาพ และการบำรุงรักษา
3. จัดทำ implementation_plan.md เพื่อขออนุมัติ

## Phase 4: Implementation (ลงมือแก้ไข)
1. ปฏิบัติตามแผนงานที่วางไว้อย่างเคร่งครัด
2. เขียนโค้ดที่สะอาด (Clean Code) พร้อมเพิ่ม Comments หรือ JSDoc ตามความเหมาะสม
3. ตรวจสอบการจัดการ State และ Cleanup Functions (เช่น ใน useEffect) ให้ถูกต้อง

## Phase 5: Verification & Deployment (ตรวจสอบและนำไปใช้)
1. ทดสอบการทำงานเพื่อยืนยันว่าไม่มี Error เกิดขึ้นอีก
2. ตรวจสอบ Regression (บั๊กที่อาจเกิดกับส่วนอื่น)
3. สรุปผลลง walkthrough.md
