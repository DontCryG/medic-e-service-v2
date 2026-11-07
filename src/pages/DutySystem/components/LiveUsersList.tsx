import { Activity, Play, Pause, Square, Clock } from 'lucide-react';
import TableSkeleton from '@/components/common/TableSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { isAdmin } from '@/utils/permissions';
import { getInitial } from '../utils/dutyUtils';

interface LiveUsersListProps {
  liveUsers: any[];
  profile: any;
  loading: boolean;
  onAdminToggleBreak: (user: any) => void;
  onAdminClockOut: (user: any) => void;
}

export default function LiveUsersList({ 
  liveUsers, 
  profile, 
  loading, 
  onAdminToggleBreak, 
  onAdminClockOut 
}: LiveUsersListProps) {
  const onDutyCount = liveUsers.filter(u => u.status === 'on_duty').length;
  const onBreakCount = liveUsers.filter(u => u.status === 'on_break').length;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Activity size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 m-0">กำลังเข้าเวร</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 m-0 mt-0.5">สถานะแพทย์ที่กำลังปฏิบัติหน้าที่ในปัจจุบัน</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
            พร้อมปฏิบัติหน้าที่ {onDutyCount} คน
          </span>
          {onBreakCount > 0 && (
            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
              พักเบรก {onBreakCount} คน
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full min-w-[650px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="p-4 text-slate-600 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">ชื่อแพทย์</th>
              <th className="p-4 text-slate-600 font-bold border-b border-slate-100 text-xs uppercase tracking-wider text-center">สถานะ</th>
              <th className="p-4 text-slate-600 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">เวลาเข้าเวร</th>
              {isAdmin(profile?.role) && (
                <th className="p-4 text-slate-600 font-bold border-b border-slate-100 text-xs uppercase tracking-wider text-right">จัดการ (แอดมิน)</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={isAdmin(profile?.role) ? 4 : 3} className="p-6">
                  <TableSkeleton rows={3} columns={isAdmin(profile?.role) ? 4 : 3} />
                </td>
              </tr>
            ) : liveUsers.length > 0 ? liveUsers.map(user => {
              const isOnDuty = user.status === 'on_duty';
              return (
                <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 text-slate-700 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 shadow-sm">
                          {user.users?.avatar_url ? (
                            <img src={user.users.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            getInitial(user.users?.ic_name)
                          )}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          isOnDuty ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{user.users?.ic_name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{user.users?.position || 'แพทย์'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      isOnDuty 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      {isOnDuty ? 'ปฏิบัติหน้าที่' : 'พักเบรก'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700 align-middle">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      <Clock size={14} className="text-slate-400" />
                      {new Date(user.clock_in).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    </div>
                  </td>
                  {isAdmin(profile?.role) && (
                    <td className="p-4 text-right align-middle">
                      <div className="flex gap-2 justify-end">
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
                          onClick={() => onAdminToggleBreak(user)}
                          disabled={loading}
                        >
                          {user.status === 'on_break' ? <><Play size={13} /> กลับเข้าเวร</> : <><Pause size={13} /> พักเบรก</>}
                        </button>
                        <button 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
                          onClick={() => onAdminClockOut(user)}
                          disabled={loading}
                        >
                          <Square size={13} /> ออกเวร
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={isAdmin(profile?.role) ? 4 : 3} className="p-8">
                  <EmptyState
                    title="ไม่มีแพทย์เข้าเวรในขณะนี้"
                    description="รายชื่อแพทย์ที่กำลังปฏิบัติหน้าที่หรือพักเบรกจะแสดงสดที่นี่ (LIVE)"
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
