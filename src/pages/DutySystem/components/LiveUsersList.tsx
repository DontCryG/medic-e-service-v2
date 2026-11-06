import { Activity, Play, Pause, Square } from 'lucide-react';
import TableSkeleton from '@/components/common/TableSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { isAdmin } from '@/utils/permissions';

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
  

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2"><Activity size={22} color="#7c3aed" /> กำลังเข้าเวร <span className="bg-rose-100 text-rose-600 text-xs px-2.5 py-1 rounded-md font-bold animate-pulse">LIVE</span></h3>
      </div>
      <div className="overflow-x-auto border border-slate-200 rounded-md">
        <table className="w-full min-w-[500px] border-collapse text-left">
          <thead>
            <tr>
              <th className="p-4 bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-200">ชื่อแพทย์</th>
              <th className="p-4 bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-200">สถานะ</th>
              <th className="p-4 bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-200">เวลาเริ่ม</th>
              {isAdmin(profile?.role) && <th className="p-4 bg-slate-50 text-slate-500 font-semibold text-sm border-b border-slate-200 text-right">จัดการ (แอดมิน)</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdmin(profile?.role) ? 4 : 3} className="p-6">
                  <TableSkeleton rows={3} columns={isAdmin(profile?.role) ? 4 : 3} />
                </td>
              </tr>
            ) : liveUsers.length > 0 ? liveUsers.map(user => (
              <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="p-4 text-slate-700">
                  <div className="font-semibold">{user.users?.ic_name}</div>
                  <div className="text-xs text-slate-500 mt-1">{user.users?.position}</div>
                </td>
                <td className="p-4 text-slate-700">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${user.status === 'on_duty' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {user.status === 'on_duty' ? 'ปฏิบัติหน้าที่' : 'พักเบรก'}
                  </span>
                </td>
                <td className="p-4 text-slate-700">{new Date(user.clock_in).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</td>
                {isAdmin(profile?.role) && (
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white rounded-md text-xs font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer" onClick={() => onAdminToggleBreak(user)}
                        disabled={loading}
                      >
                        {user.status === 'on_break' ? <><Play size={14} /> กลับเข้าเวร</> : <><Pause size={14} /> พักเบรก</>}
                      </button>
                      <button className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-500 text-white rounded-md text-xs font-semibold hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer" onClick={() => onAdminClockOut(user)}
                        disabled={loading}
                      >
                        <Square size={14} /> ออกเวร
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            )) : (
              <tr>
                <td colSpan={isAdmin(profile?.role) ? 4 : 3} className="p-4">
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
