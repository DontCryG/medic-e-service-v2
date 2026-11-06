-- ==========================================================
-- MEDIC E-SERVICE V2: DATABASE MASTER UPGRADE
-- สคริปต์ยกระดับฐานข้อมูลระดับ Enterprise (รันใน Supabase SQL Editor)
-- ==========================================================

-- ----------------------------------------------------------
-- ส่วนที่ 1: แก้ไข Foreign Key Constraints ทั้งระบบ (ป้องกัน Error 23503)
-- ให้เป็น ON DELETE CASCADE และ ON UPDATE CASCADE ทุกตาราง
-- ----------------------------------------------------------

-- 1.1 queue_status
ALTER TABLE queue_status DROP CONSTRAINT IF EXISTS fk_queue_status_users;
ALTER TABLE queue_status 
  ADD CONSTRAINT fk_queue_status_users 
  FOREIGN KEY (discord_id) REFERENCES users(discord_id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.2 duty_logs
ALTER TABLE duty_logs DROP CONSTRAINT IF EXISTS fk_duty_logs_users;
ALTER TABLE duty_logs 
  ADD CONSTRAINT fk_duty_logs_users 
  FOREIGN KEY (discord_id) REFERENCES users(discord_id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.3 story_logs
ALTER TABLE story_logs DROP CONSTRAINT IF EXISTS fk_story_logs_users;
ALTER TABLE story_logs 
  ADD CONSTRAINT fk_story_logs_users 
  FOREIGN KEY (discord_id) REFERENCES users(discord_id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.4 queue_manager_logs
ALTER TABLE queue_manager_logs DROP CONSTRAINT IF EXISTS queue_manager_logs_discord_id_fkey;
ALTER TABLE queue_manager_logs 
  ADD CONSTRAINT queue_manager_logs_discord_id_fkey 
  FOREIGN KEY (discord_id) REFERENCES users(discord_id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.5 leave_requests
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_discord_id_fkey;
ALTER TABLE leave_requests 
  ADD CONSTRAINT leave_requests_discord_id_fkey 
  FOREIGN KEY (discord_id) REFERENCES users(discord_id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.6 accounting_logs
ALTER TABLE accounting_logs DROP CONSTRAINT IF EXISTS accounting_logs_discord_id_fkey;
ALTER TABLE accounting_logs 
  ADD CONSTRAINT accounting_logs_discord_id_fkey 
  FOREIGN KEY (discord_id) REFERENCES users(discord_id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.7 inventory_logs
ALTER TABLE inventory_logs DROP CONSTRAINT IF EXISTS inventory_logs_discord_id_fkey;
ALTER TABLE inventory_logs 
  ADD CONSTRAINT inventory_logs_discord_id_fkey 
  FOREIGN KEY (discord_id) REFERENCES users(discord_id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 1.8 general_requests (ถ้ามี)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'general_requests') THEN
    ALTER TABLE general_requests DROP CONSTRAINT IF EXISTS general_requests_discord_id_fkey;
    ALTER TABLE general_requests 
      ADD CONSTRAINT general_requests_discord_id_fkey 
      FOREIGN KEY (discord_id) REFERENCES users(discord_id) 
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 1.9 users -> positions (ถ้าตำแหน่งถูกลบ ให้ตั้งเป็น NULL แทนการ Error)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_position_id_fkey;
ALTER TABLE users 
  ADD CONSTRAINT users_position_id_fkey 
  FOREIGN KEY (position_id) REFERENCES positions(id) 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------
-- ส่วนที่ 2: ติดตั้ง B-Tree Composite Indexes เพื่อเร่งความเร็ว Query สูงสุด
-- ----------------------------------------------------------

-- 2.1 duty_logs (ตารางหลักที่มีการ Query บ่อยที่สุด)
CREATE INDEX IF NOT EXISTS idx_duty_logs_live_users 
  ON duty_logs (status, clock_in DESC);

CREATE INDEX IF NOT EXISTS idx_duty_logs_user_history 
  ON duty_logs (discord_id, clock_in DESC);

CREATE INDEX IF NOT EXISTS idx_duty_logs_salary_period 
  ON duty_logs (clock_in DESC) WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_duty_logs_type 
  ON duty_logs (duty_type);

-- 2.2 queue_status
CREATE INDEX IF NOT EXISTS idx_queue_status_discord 
  ON queue_status (discord_id);

CREATE INDEX IF NOT EXISTS idx_queue_status_status 
  ON queue_status (status);

-- 2.3 queue_manager_logs
CREATE INDEX IF NOT EXISTS idx_qm_logs_user_start 
  ON queue_manager_logs (discord_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_qm_logs_start_time 
  ON queue_manager_logs (start_time DESC);

-- 2.4 story_logs
CREATE INDEX IF NOT EXISTS idx_story_logs_user_start 
  ON story_logs (discord_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_story_logs_start_time 
  ON story_logs (start_time DESC);

-- 2.5 leave_requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_status 
  ON leave_requests (discord_id, status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_status_dates 
  ON leave_requests (status, start_date DESC);

-- 2.6 accounting_logs & inventory_logs
CREATE INDEX IF NOT EXISTS idx_accounting_logs_type_created 
  ON accounting_logs (type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_type_created 
  ON inventory_logs (type, created_at DESC);

-- 2.7 notifications (ถ้ามี)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_lookup 
      ON notifications (discord_id, is_read, created_at DESC);
  END IF;
END $$;

-- ----------------------------------------------------------
-- ส่วนที่ 3: Data Integrity & Check Constraints
-- ----------------------------------------------------------

-- 3.1 ป้องกันยอดเงินและจำนวนติดลบ
ALTER TABLE accounting_logs DROP CONSTRAINT IF EXISTS chk_accounting_amount;
ALTER TABLE accounting_logs ADD CONSTRAINT chk_accounting_amount CHECK (amount >= 0);

ALTER TABLE inventory_logs DROP CONSTRAINT IF EXISTS chk_inventory_quantity;
ALTER TABLE inventory_logs ADD CONSTRAINT chk_inventory_quantity CHECK (quantity >= 0);

-- ----------------------------------------------------------
-- ส่วนที่ 4: ปรับปรุงข้อมูลประวัติเวรย้อนหลัง (Data Repair & Reconciliation)
-- ----------------------------------------------------------

-- 4.1 อัปเดตโบนัสรันคิว (+2 ชม. = 120 นาที) ในอดีตที่ระบบเคยบันทึกเป็น normal หรือ NULL
UPDATE duty_logs
SET duty_type = 'queue_manager_bonus', granted_by = 'system'
WHERE (duty_type IS NULL OR duty_type = 'normal')
  AND total_duty_minutes = 120
  AND (total_break_minutes = 0 OR total_break_minutes IS NULL)
  AND status = 'completed';

-- 4.2 อัปเดตประวัติพี่เลี้ยงหมอใหม่ (+1 ชม. = 60 นาที) ที่ Admin เคยบันทึกไว้
UPDATE duty_logs
SET duty_type = 'mentor'
WHERE (duty_type IS NULL OR duty_type = 'normal')
  AND total_duty_minutes = 60
  AND (total_break_minutes = 0 OR total_break_minutes IS NULL)
  AND granted_by IS NOT NULL 
  AND granted_by != 'system'
  AND status = 'completed';

-- 4.3 อัปเดตประวัติสอบหมอใหม่ (+3 ชม. = 180 นาที) ที่ Admin เคยบันทึกไว้
UPDATE duty_logs
SET duty_type = 'exam_doctor'
WHERE (duty_type IS NULL OR duty_type = 'normal')
  AND total_duty_minutes = 180
  AND (total_break_minutes = 0 OR total_break_minutes IS NULL)
  AND granted_by IS NOT NULL 
  AND granted_by != 'system'
  AND status = 'completed';

-- 4.4 คำสั่งตรวจสอบประวัติเวรพิเศษ (รันแยกเพื่อดูรายการได้):
-- SELECT id, discord_id, clock_in, clock_out, total_duty_minutes, duty_type, granted_by 
-- FROM duty_logs 
-- WHERE duty_type IN ('queue_manager_bonus', 'mentor', 'exam_doctor', 'manual_add')
--    OR (granted_by IS NOT NULL AND granted_by != 'system')
-- ORDER BY clock_in DESC LIMIT 50;

-- ==========================================================
-- เสร็จสิ้นการอัปเกรดฐานข้อมูลระดับ Enterprise
-- ==========================================================
