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
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center shrink-0">
            <Activity size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 m-0">แพทย์ที่กำลังเข้าเวร</h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.2 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 m-0 mt-0.5 font-normal">สถานะบุคลากรที่กำลังปฏิบัติหน้าที่ในปัจจุบัน</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-md text-[11px]">
            พร้อมปฏิบัติหน้าที่ {onDutyCount} คน
          </span>
          {onBreakCount > 0 && (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-md text-[11px]">
              พักเบรก {onBreakCount} คน
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200/80">
        <table className="w-full min-w-[650px] border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="p-3 text-slate-500 font-semibold border-b border-slate-200/70 text-[11px] uppercase tracking-wider">ชื่อแพทย์</th>
              <th className="p-3 text-slate-500 font-semibold border-b border-slate-200/70 text-[11px] uppercase tracking-wider text-center">สถานะ</th>
              <th className="p-3 text-slate-500 font-semibold border-b border-slate-200/70 text-[11px] uppercase tracking-wider">เวลาเข้าเวร</th>
              {isAdmin(profile?.role) && (
                <th className="p-3 text-slate-500 font-semibold border-b border-slate-200/70 text-[11px] uppercase tracking-wider text-right">จัดการ (แอดมิน)</th>
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
                  <td className="p-3 text-slate-700 align-middle">
                    <div className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200/60 text-purple-700 flex items-center justify-center font-bold text-xs overflow-hidden shrink-0 relative">
                          <span>{getInitial(user.users?.ic_name)}</span>
                          {user.users?.avatar_url && (
                            <img 
                              src={user.users.avatar_url} 
                              alt="Avatar" 
                              className="absolute inset-0 w-full h-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${
                          isOnDuty ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{user.users?.ic_name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.2">{user.users?.position || 'แพทย์'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center align-middle">
                    {isOnDuty ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ปฏิบัติหน้าที่
                      </span>
                    ) : (
                      (() => {
                        const elapsedMins = user.last_break_start 
                          ? Math.floor(Math.max(0, Date.now() - new Date(user.last_break_start).getTime()) / 60000)
                          : 0;
                        const isNearLimit = elapsedMins >= 12;
                        return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                            isNearLimit 
                              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                              : 'bg-amber-50 text-amber-700 border-amber-200/80'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isNearLimit ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            พักเบรก ({elapsedMins}/15 น.)
                          </span>
                        );
                      })()
                    )}
                  </td>
                  <td className="p-3 text-slate-700 align-middle">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
                      <Clock size={13} className="text-slate-400" />
                      {new Date(user.clock_in).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                    </div>
                  </td>
                  {isAdmin(profile?.role) && (
                    <td className="p-3 text-right align-middle">
                      <div className="flex gap-1.5 justify-end">
                        <button 
                          className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
                          onClick={() => onAdminToggleBreak(user)}
                          disabled={loading}
                        >
                          {user.status === 'on_break' ? <><Play size={12} /> กลับเข้าเวร</> : <><Pause size={12} /> พักเบรก</>}
                        </button>
                        <button 
                          className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/80 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
                          onClick={() => onAdminClockOut(user)}
                          disabled={loading}
                        >
                          <Square size={11} /> ออกเวร
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={isAdmin(profile?.role) ? 4 : 3} className="p-6">
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
