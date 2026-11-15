-- Migration: Add approved_by and admin_comment to leave_requests table
-- Run this in Supabase Dashboard -> SQL Editor

ALTER TABLE leave_requests 
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS admin_comment TEXT;

COMMENT ON COLUMN leave_requests.approved_by IS 'ชื่อหรือ Discord ID ของผู้บริหาร/แอดมินที่พิจารณาอนุมัติหรือปฏิเสธ';
COMMENT ON COLUMN leave_requests.admin_comment IS 'หมายเหตุหรือเหตุผลจากผู้บริหาร (เช่น เหตุผลที่ไม่อนุมัติ)';
