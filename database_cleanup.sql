-- ==============================================================================
-- MEDIC E-SERVICE V2: DATABASE CLEANUP SCRIPT
-- สคริปต์ลบตาราง (Tables) และคอลัมน์ (Columns) ที่ไม่ได้ใช้งานในระบบ
-- ==============================================================================
-- วิธีใช้งาน: คัดลอกคำสั่งทั้งหมดนี้ไปวางใน "SQL Editor" บน Supabase Dashboard แล้วกด "Run"
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- ส่วนที่ 1: ลบคอลัมน์ของระบบสตอรี่ออกจากตาราง queue_status (6 คอลัมน์)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS queue_status 
  DROP COLUMN IF EXISTS story_gang_1,
  DROP COLUMN IF EXISTS story_gang_2,
  DROP COLUMN IF EXISTS story_locked,
  DROP COLUMN IF EXISTS story_premium,
  DROP COLUMN IF EXISTS story_target_time,
  DROP COLUMN IF EXISTS story_type;

-- ------------------------------------------------------------------------------
-- ส่วนที่ 2: ลบตารางที่ไม่ได้ใช้งานแล้ว (Drop Unused Tables)
-- ------------------------------------------------------------------------------

-- 2.1 ลบตารางบันทึกสตอรี่ (story_logs) - ถอดระบบสตอรี่ออกเรียบร้อยแล้ว
DROP TABLE IF EXISTS story_logs CASCADE;

-- 2.2 ลบตารางประวัติคิวรุ่นเก่า (queue_logs) - ระบบปัจจุบันใช้ queue_manager_logs
DROP TABLE IF EXISTS queue_logs CASCADE;

-- 2.3 ลบตารางคำขอทั่วไป (general_requests) - ไม่มีการใช้งานในโค้ดระบบ
DROP TABLE IF EXISTS general_requests CASCADE;

-- ------------------------------------------------------------------------------
-- ส่วนที่ 3: ตั้งค่า Foreign Keys ทั้งหมดให้เป็น ON DELETE CASCADE
-- เพื่อให้เมื่อ Admin ลบรายชื่อแพทย์ออกจากระบบ ข้อมูลจะถูกลบได้อย่างราบรื่น ไม่ติด Error 409
-- ------------------------------------------------------------------------------

-- 3.1 queue_status
ALTER TABLE IF EXISTS queue_status DROP CONSTRAINT IF EXISTS fk_queue_status_users;
ALTER TABLE IF EXISTS queue_status 
  ADD CONSTRAINT fk_queue_status_users 
  FOREIGN KEY (discord_id) REFERENCES users(discord_id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 3.2 duty_logs
ALTER TABLE IF EXISTS duty_logs DROP CONSTRAINT IF EXISTS fk_duty_logs_users;
ALTER TABLE IF EXISTS duty_logs 
  ADD CONSTRAINT fk_duty_logs_users 
  FOREIGN KEY (discord_id) REFERENCES users(discord_id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 3.3 queue_manager_logs
ALTER TABLE IF EXISTS queue_manager_logs DROP CONSTRAINT IF EXISTS queue_manager_logs_discord_id_fkey;
ALTER TABLE IF EXISTS queue_manager_logs 
  ADD CONSTRAINT queue_manager_logs_discord_id_fkey 
  FOREIGN KEY (discord_id) REFERENCES users(discord_id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 3.4 leave_requests
ALTER TABLE IF EXISTS leave_requests DROP CONSTRAINT IF EXISTS leave_requests_discord_id_fkey;
ALTER TABLE IF EXISTS leave_requests 
  ADD CONSTRAINT leave_requests_discord_id_fkey 
  FOREIGN KEY (discord_id) REFERENCES users(discord_id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 3.5 accounting_logs
ALTER TABLE IF EXISTS accounting_logs DROP CONSTRAINT IF EXISTS accounting_logs_discord_id_fkey;
ALTER TABLE IF EXISTS accounting_logs 
  ADD CONSTRAINT accounting_logs_discord_id_fkey 
  FOREIGN KEY (discord_id) REFERENCES users(discord_id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 3.6 inventory_logs
ALTER TABLE IF EXISTS inventory_logs DROP CONSTRAINT IF EXISTS inventory_logs_discord_id_fkey;
ALTER TABLE IF EXISTS inventory_logs 
  ADD CONSTRAINT inventory_logs_discord_id_fkey 
  FOREIGN KEY (discord_id) REFERENCES users(discord_id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ------------------------------------------------------------------------------
-- ส่วนที่ 4: คืนพื้นที่ดิสก์และจัดระเบียบตาราง (VACUUM ANALYZE)
-- ------------------------------------------------------------------------------
VACUUM ANALYZE queue_status;
VACUUM ANALYZE duty_logs;
VACUUM ANALYZE users;
VACUUM ANALYZE system_settings;
