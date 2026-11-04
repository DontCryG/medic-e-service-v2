-- ==========================================================
-- สคริปต์ปรับปรุงประสิทธิภาพ Database และแก้ไข Foreign Key Error
-- รันคำสั่งนี้ใน Supabase Studio -> SQL Editor
-- ==========================================================

-- 1. แก้ไข Error 23503: ปรับ Foreign Key ของ queue_status ให้เป็น ON DELETE CASCADE
--    เพื่อป้องกัน error เวลาลบหรืออัปเดต user แล้วติดค้าง
ALTER TABLE queue_status DROP CONSTRAINT IF EXISTS fk_queue_status_users;
ALTER TABLE queue_status 
  ADD CONSTRAINT fk_queue_status_users 
  FOREIGN KEY (discord_id) 
  REFERENCES users(discord_id) 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

-- 2. สร้าง Indexes เพื่อเร่งความเร็ว Query และลดภาระ CPU ของ Supabase Nano
--    ดัชนีสำหรับ duty_logs (ตารางที่ถูกเรียกบ่อยที่สุด)
CREATE INDEX IF NOT EXISTS idx_duty_logs_status_clock_in 
  ON duty_logs (status, clock_in DESC);

CREATE INDEX IF NOT EXISTS idx_duty_logs_discord_clock_in 
  ON duty_logs (discord_id, clock_in DESC);

--    ดัชนีสำหรับ queue_status
CREATE INDEX IF NOT EXISTS idx_queue_status_discord_id 
  ON queue_status (discord_id);

--    ดัชนีสำหรับ story_logs
CREATE INDEX IF NOT EXISTS idx_story_logs_discord_start 
  ON story_logs (discord_id, start_time DESC);

--    ดัชนีสำหรับ logs บัญชีและเบิกของ
CREATE INDEX IF NOT EXISTS idx_accounting_logs_created_at 
  ON accounting_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at 
  ON inventory_logs (created_at DESC);

--    ดัชนีสำหรับคำขอลา
CREATE INDEX IF NOT EXISTS idx_leave_requests_discord_status 
  ON leave_requests (discord_id, status);
