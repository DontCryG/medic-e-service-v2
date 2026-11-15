-- ==============================================================================
-- Medic E-Service V2: Zero-Trust Row Level Security (RLS) Lockdown
-- ==============================================================================
-- คำแนะนำ: คัดลอกโค้ด SQL ด้านล่างนี้ไปวางใน "SQL Editor" บน Supabase Dashboard
-- ประโยชน์:
-- 1. ป้องกันการเปิด DevTools (F12) เพื่อปลอมแปลงชั่วโมงเวร หรือยิงเพิ่มเวลาเข้าเวรเอง
-- 2. ป้องกันการแอบใส่โบนัสหมอรันคิว (queue_manager_bonus)
-- 3. ให้สิทธิ์เขียน (INSERT/UPDATE/DELETE) ผ่าน Rust Backend (service_role) เท่านั้น
-- ==============================================================================

-- 1. เปิดใช้งาน RLS บนตารางบันทึกการเข้าเวร (duty_logs)
ALTER TABLE duty_logs ENABLE ROW LEVEL SECURITY;

-- ลบ Policies เดิม (ถ้ามี) เพื่อหลีกเลี่ยงการทับซ้อน
DROP POLICY IF EXISTS "Allow authenticated read duty_logs" ON duty_logs;
DROP POLICY IF EXISTS "Allow authenticated insert duty_logs" ON duty_logs;
DROP POLICY IF EXISTS "Allow authenticated update duty_logs" ON duty_logs;
DROP POLICY IF EXISTS "Allow authenticated delete duty_logs" ON duty_logs;
DROP POLICY IF EXISTS "Allow public read duty_logs" ON duty_logs;

-- อนุญาตให้ผู้ใช้ที่ล็อกอินแล้ว อ่านข้อมูลการเข้าเวรได้ (SELECT เท่านั้น)
CREATE POLICY "Allow authenticated read duty_logs" 
ON duty_logs 
FOR SELECT 
TO authenticated 
USING (true);

-- (หมายเหตุ: เมื่อไม่มี Policy สำหรับ INSERT/UPDATE/DELETE สำหรับ authenticated,
-- บราวเซอร์จะไม่สามารถแก้ไขข้อมูลได้โดยตรง จะทำได้ผ่าน Rust Backend ที่ถือ service_role เท่านั้น)


-- 2. เปิดใช้งาน RLS บนตารางประวัติหมอรันคิว (queue_manager_logs)
ALTER TABLE queue_manager_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read queue_manager_logs" ON queue_manager_logs;
DROP POLICY IF EXISTS "Allow authenticated insert queue_manager_logs" ON queue_manager_logs;

-- อนุญาตให้อ่านประวัติการรันคิวได้
CREATE POLICY "Allow authenticated read queue_manager_logs" 
ON queue_manager_logs 
FOR SELECT 
TO authenticated 
USING (true);


-- 3. ตรวจสอบ Realtime Publication
-- ตรวจสอบให้แน่ใจว่าตารางที่จำเป็นอยู่ใน publication ของ supabase_realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'duty_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE duty_logs;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'queue_status'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE queue_status;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'system_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE system_settings;
  END IF;
END $$;
