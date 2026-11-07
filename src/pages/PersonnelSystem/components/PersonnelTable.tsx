import { memo } from 'react';
import { Users, Search, Edit2, Trash2, Clock } from 'lucide-react';
import { getInitial } from '../utils/personnelUtils';
import TableSkeleton from '@/components/common/TableSkeleton';
import EmptyState from '@/components/common/EmptyState';

export interface UserWithPosition {
  discord_id: string;
  ic_name: string;
  ic_phone?: string;
  avatar_url?: string;
  is_admin: boolean;
  role?: string;
  positions?: {
    id: string;
    name: string;
    rank: number;
    oc_rate: number;
  };
}

interface PersonnelTableProps {
  profile: any;
  filteredUsers: UserWithPosition[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterRole: string;
  setFilterRole: (val: string) => void;
  onEditClick: (user: UserWithPosition) => void;
  onAddDutyClick: (user: UserWithPosition) => void;
  onDeleteUser: (user: UserWithPosition) => Promise<void>;
}

const PersonnelTable = memo(function PersonnelTable({
  profile,
  filteredUsers,
  loading,
  searchQuery,
  setSearchQuery,
  filterRole,
  setFilterRole,
  onEditClick,
  onAddDutyClick,
  onDeleteUser
}: PersonnelTableProps) {
  const roleFilters = [
    { id: 'all', label: 'ทั้งหมด', activeClass: 'bg-slate-900 text-white shadow-sm' },
    { id: 'admin', label: 'แอดมิน (Admin)', activeClass: 'bg-red-600 text-white shadow-sm' },
    { id: 'medic', label: 'แพทย์ (Medic)', activeClass: 'bg-purple-600 text-white shadow-sm' },
    { id: 'user', label: 'บุคคลทั่วไป (User)', activeClass: 'bg-amber-500 text-white shadow-sm' },
    { id: 'resigned', label: 'พ้นสภาพ', activeClass: 'bg-slate-600 text-white shadow-sm' },
  ];

  return (
    <>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200/80 w-full md:max-w-[420px] focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-500/10 transition-all">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="ค้นหาด้วยชื่อ IC หรือเบอร์โทร..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-1.5 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/80 flex-wrap justify-center sm:justify-start">
          {roleFilters.map((f) => {
            const isActive = filterRole === f.id;
            return (
              <button
                key={f.id}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border-none transition-all ${
                  isActive ? f.activeClass : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
                onClick={() => setFilterRole(f.id)}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 m-0">ทะเบียนบุคลากรแพทย์</h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">รายชื่อเจ้าหน้าที่ สิทธิ์การใช้งาน และตำแหน่งในหน่วยงาน</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            ทั้งหมด {filteredUsers.length} คน
          </span>
        </div>

        {loading ? (
          <div className="py-4">
            <TableSkeleton rows={6} columns={5} />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full border-collapse min-w-[850px] text-left">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className="w-[30%] p-4 text-slate-600 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">ข้อมูลบุคลากร (IC)</th>
                  <th className="w-[25%] p-4 text-slate-600 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">ตำแหน่ง (Position)</th>
                  <th className="w-[15%] p-4 text-slate-600 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">สิทธิ์ (Role)</th>
                  <th className="w-[20%] p-4 text-slate-600 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">Discord ID</th>
                  <th className="w-[10%] p-4 text-slate-600 font-bold border-b border-slate-100 text-xs uppercase tracking-wider text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                  <tr key={user.discord_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 text-slate-700 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0 shadow-sm">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            getInitial(user.ic_name)
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{user.ic_name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{user.ic_phone || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 text-sm font-medium align-middle">{user.positions?.name || '-'}</td>
                    <td className="p-4 align-middle">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block capitalize ${
                        user.role === "admin" || user.role === "superadmin" 
                          ? "bg-red-50 text-red-600 border border-red-200" 
                          : user.role === "medic" 
                          ? "bg-purple-50 text-purple-700 border border-purple-200" 
                          : user.role === "user" 
                          ? "bg-amber-50 text-amber-700 border border-amber-200" 
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-xs font-mono align-middle">{user.discord_id}</td>
                    <td className="p-4 align-middle">
                      <div className="flex gap-1.5 justify-end">
                        <button 
                          className="w-8 h-8 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center cursor-pointer" 
                          onClick={() => onEditClick(user)} 
                          title="แก้ไขข้อมูล"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          className="w-8 h-8 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center justify-center cursor-pointer" 
                          onClick={() => onAddDutyClick(user)} 
                          title="เพิ่มเวลาเวรย้อนหลัง"
                        >
                          <Clock size={15} />
                        </button>
                        {user.discord_id !== profile?.discord_id && (
                          <button 
                            className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors flex items-center justify-center cursor-pointer" 
                            onClick={() => onDeleteUser(user)} 
                            title="พ้นสภาพ"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-8">
                      <EmptyState 
                        title="ไม่พบข้อมูลบุคลากร" 
                        description="ลองเปลี่ยนคำค้นหาหรือตัวกรองบทบาท" 
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
});

export default PersonnelTable;
