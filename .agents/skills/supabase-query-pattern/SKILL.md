---
name: supabase-query-pattern
description: ข้อบังคับในการเขียน React Query เพื่อดึงข้อมูลจาก Supabase สำหรับโปรเจกต์นี้
---

# Supabase + React Query Pattern

เมื่อคุณ (AI) ต้องเขียนระบบดึงข้อมูลหรือบันทึกข้อมูลในโปรเจกต์นี้ ให้ทำตามกฎเหล่านี้:

1. **แยกไฟล์:**
   - Query (ดึงข้อมูล) ให้เขียนใน hooks/use[Feature]Queries.ts
   - Mutation (เพิ่ม/ลบ/แก้ไข) ให้เขียนใน hooks/use[Feature]Mutations.ts
   - Realtime (ดักจับการเปลี่ยนแปลง) ให้เขียนใน hooks/use[Feature]Realtime.ts

2. **การเขียน Query:**
   - ใช้ @tanstack/react-query v5 (useQuery)
   - Query Key ต้องชัดเจน เช่น ['dutyLogs', userId]
   - ห้ามลืมจัดการ Error แบบ maybeSingle() หรือการเช็ค if (error) throw error;

3. **การดักจับ Realtime:**
   - ใช้ supabase.channel('custom-channel').on('postgres_changes', ...).subscribe()
   - เมื่อข้อมูลเปลี่ยน ให้สั่ง queryClient.invalidateQueries({ queryKey: [...] }) เพื่ออัปเดตหน้าจอทันที