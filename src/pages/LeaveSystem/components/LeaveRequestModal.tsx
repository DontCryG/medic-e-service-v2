import { useState } from 'react';
import { X, ClipboardList } from 'lucide-react';
import { useCreateLeave } from '../hooks/useLeaveMutations';
import { supabase } from '@/lib/supabase';
import Swal from 'sweetalert2';
import SmartDatePicker from '../../../components/common/SmartDatePicker';
import SmartSelect from '../../../components/common/SmartSelect';

interface LeaveRequestModalProps {
  onClose: () => void;
  profile: any;
}

export default function LeaveRequestModal({ onClose, profile }: LeaveRequestModalProps) {
  const [leaveType, setLeaveType] = useState('leave');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createLeaveMutation = useCreateLeave();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) return;
    
    // If resign, end date is same as start date
    const finalEndDate = leaveType === 'resign' ? startDate : endDate;
    if (!finalEndDate) return;

    if (leaveType === 'vacation') {
      // 1. Check if they have used vacation before (pending or approved)
      const { data: pastVacations } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('discord_id', profile.discord_id)
        .eq('leave_type', 'vacation')
        .in('status', ['pending', 'approved']);
      
      if (pastVacations && pastVacations.length > 0) {
        Swal.fire('ไม่สามารถยื่นคำขอได้', 'คุณเคยใช้สิทธิ์ลาพักร้อนไปแล้ว  (สิทธิ์ลาได้ 1 ครั้ง)', 'error');
        return;
      }

      // 2. Check if they have worked for 30 distinct days
      const { data: dutyLogs } = await supabase
        .from('duty_logs')
        .select('clock_in')
        .eq('discord_id', profile.discord_id)
        .eq('status', 'completed');
      
      const distinctDays = new Set((dutyLogs || []).map(log => {
        const d = new Date(log.clock_in);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }));

      if (distinctDays.size < 30) {
        Swal.fire('ไม่สามารถยื่นคำขอได้', `คุณมีชั่วโมงการทำงานไม่ครบ 30 วันตามเงื่อนไขสิทธิ์ลาพักร้อน (ปัจจุบันทำงานไปแล้ว ${distinctDays.size} วัน)`, 'error');
        return;
      }
    }

    setIsSubmitting(true);
    createLeaveMutation.mutate({
      discord_id: profile.discord_id,
      leave_type: leaveType,
      start_date: startDate.toISOString().split('T')[0],
      end_date: finalEndDate.toISOString().split('T')[0],
      reason
    }, {
      onSuccess: () => {
        setIsSubmitting(false);
        onClose();
      },
      onError: () => {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2">
            <ClipboardList size={22} className={
              leaveType === 'vacation' ? 'text-green-500' :
              leaveType === 'resign' ? 'text-red-500' : 'text-[var(--primary)]'
            } />
            ยื่นใบลา
          </h2>
          <button type="button" className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer border-none bg-transparent" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              ประเภทการลา
            </label>
            <SmartSelect
              value={leaveType}
              onChange={setLeaveType}
              options={[
                { value: 'leave', label: 'ลากิจ' },
                { value: 'vacation', label: 'ลาพักร้อน' },
                { value: 'resign', label: 'ลาออก' }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                วันที่เริ่มต้น
              </label>
              <div className="w-full h-[42px]">
                <SmartDatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => {
                    setStartDate(date);
                    if (date && endDate && date > endDate) {
                      setEndDate(date);
                    }
                  }}
                  placeholderText="เลือกวันที่เริ่ม"
                />
              </div>
            </div>
            {leaveType !== 'resign' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  วันที่สิ้นสุด
                </label>
                <div className="w-full h-[42px]">
                  <SmartDatePicker
                    selected={endDate}
                    onChange={(date: Date | null) => setEndDate(date)}
                    placeholderText="เลือกวันที่สิ้นสุด"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              เหตุผล
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ระบุเหตุผลการลา..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <button 
              type="button" 
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors cursor-pointer bg-white w-full sm:w-auto" 
              onClick={onClose}
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className={`px-6 py-2.5 rounded-xl border-none font-semibold text-white transition-all w-full sm:w-auto cursor-pointer ${
                leaveType === 'vacation' ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20' :
                leaveType === 'resign' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' :
                'bg-[var(--primary)] hover:opacity-90 shadow-sm'
              } shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
              disabled={isSubmitting || createLeaveMutation.isPending}
            >
              {(isSubmitting || createLeaveMutation.isPending) ? 'กำลังบันทึก...' : 'ยืนยันการลา'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
