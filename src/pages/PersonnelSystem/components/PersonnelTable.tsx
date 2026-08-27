import { memo } from 'react';
import { Users, Search, Edit2, Trash2, Clock } from 'lucide-react';
import { getInitial } from '../utils/personnelUtils';

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
  return (
    <>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center flex-wrap gap-6 mb-8">
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-[var(--border-color)] w-full md:max-w-[450px]">
          <Search size={18} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="ค้นหาด้วยชื่อ IC..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-[var(--border-color)] flex-wrap justify-center sm:justify-start">
          <button className={`px-6 py-2.5 rounded-xl text-[0.95rem] font-semibold cursor-pointer border-none bg-transparent transition-all sm:flex-auto flex-1 text-center ${filterRole === 'all' ? 'bg-slate-100 text-slate-700' : 'text-[var(--text-secondary)]'}`} onClick={() => setFilterRole('all')}>ทั้งหมด</button>
          <button className={`px-6 py-2.5 rounded-xl text-[0.95rem] font-semibold cursor-pointer border-none bg-transparent transition-all sm:flex-auto flex-1 text-center ${filterRole === 'admin' ? 'bg-red-100 text-red-500' : 'text-[var(--text-secondary)]'}`} onClick={() => setFilterRole('admin')}>แอดมิน (Admin)</button>
          <button className={`px-6 py-2.5 rounded-xl text-[0.95rem] font-semibold cursor-pointer border-none bg-transparent transition-all sm:flex-auto flex-1 text-center ${filterRole === 'medic' ? 'bg-indigo-100 text-indigo-600' : 'text-[var(--text-secondary)]'}`} onClick={() => setFilterRole('medic')}>แพทย์ (Medic)</button>
          <button className={`px-6 py-2.5 rounded-xl text-[0.95rem] font-semibold cursor-pointer border-none bg-transparent transition-all sm:flex-auto flex-1 text-center ${filterRole === 'user' ? 'bg-amber-100 text-amber-600' : 'text-[var(--text-secondary)]'}`} onClick={() => setFilterRole('user')}>บุคคลทั่วไป (User)</button>
          <button className={`px-6 py-2.5 rounded-xl text-[0.95rem] font-semibold cursor-pointer border-none bg-transparent transition-all sm:flex-auto flex-1 text-center ${filterRole === 'resigned' ? 'bg-red-50 text-red-500' : 'text-[var(--text-secondary)]'}`} onClick={() => setFilterRole('resigned')}>พ้นสภาพ</button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-[var(--border-color)] overflow-hidden">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', color: '#ea580c' }}>
          <Users size={28} /> ทะเบียนบุคลากรแพทย์
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-[30%] text-left p-4 text-slate-500 font-semibold border-b-2 border-slate-100 text-[0.95rem]">ข้อมูลบุคลากร (IC)</th>
                  <th className="w-[25%] text-left p-4 text-slate-500 font-semibold border-b-2 border-slate-100 text-[0.95rem]">ตำแหน่ง (Position)</th>
                  <th className="w-[15%] text-left p-4 text-slate-500 font-semibold border-b-2 border-slate-100 text-[0.95rem]">สิทธิ์ (Role)</th>
                  <th className="w-[20%] text-left p-4 text-slate-500 font-semibold border-b-2 border-slate-100 text-[0.95rem]">Discord ID</th>
                  <th className="w-[10%] text-right p-4 text-slate-500 font-semibold border-b-2 border-slate-100 text-[0.95rem]">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                  {filteredUsers.length > 0 ? filteredUsers.map(user => (
                    <tr key={user.discord_id}>
                    <td className="p-4 sm:p-5 border-b border-slate-100 text-slate-700 text-[0.95rem] align-middle">
                      <div className="flex items-center gap-4">
                        <div className="w-[45px] h-[45px] rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-lg overflow-hidden shrink-0" style={{ padding: user.avatar_url ? 0 : undefined }}>
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : getInitial(user.ic_name)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-base">{user.ic_name}</div>
                          <div className="text-sm text-slate-500 mt-1">{user.ic_phone || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 sm:p-5 border-b border-slate-100 text-slate-700 text-[0.95rem] align-middle">{user.positions?.name || '-'}</td>
                    <td className="p-4 sm:p-5 border-b border-slate-100 text-slate-700 text-[0.95rem] align-middle">
                      <span className={`px-3 py-1.5 rounded-xl text-sm font-semibold inline-block capitalize ${user.role === "admin" || user.role === "superadmin" ? "bg-red-100 text-red-600" : user.role === "medic" ? "bg-indigo-100 text-indigo-600" : user.role === "user" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"}`}>{user.role}</span>
                    </td>
                    <td className="p-4 sm:p-5 border-b border-slate-100 text-slate-500 text-[0.85rem] align-middle">{user.discord_id}</td>
                    <td className="p-4 sm:p-5 border-b border-slate-100 text-slate-700 text-[0.95rem] align-middle">
                      <div className="flex gap-2 justify-end">
                        <button className="p-2 rounded-xl border border-slate-200 text-blue-500 bg-white hover:bg-blue-50 transition-colors flex items-center justify-center cursor-pointer" onClick={() => onEditClick(user)} title="แก้ไขข้อมูล">
                          <Edit2 size={18} />
                        </button>
                        <button className="p-2 rounded-xl border border-slate-200 text-emerald-500 bg-white hover:bg-emerald-50 transition-colors flex items-center justify-center cursor-pointer" onClick={() => onAddDutyClick(user)} title="เพิ่มเวลาเวรย้อนหลัง">
                          <Clock size={18} />
                        </button>
                        {user.discord_id !== profile?.discord_id && (
                          <button className="p-2 rounded-xl border border-slate-200 text-red-500 bg-white hover:bg-red-50 transition-colors flex items-center justify-center cursor-pointer" onClick={() => onDeleteUser(user)} title="พ้นสภาพ">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  )) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                          <Search size={32} />
                        </div>
                        <div>
                          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#475569', fontSize: '1.1rem' }}>ไม่พบข้อมูลบุคลากร</p>
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>ลองเปลี่ยนคำค้นหาหรือตัวกรองบทบาท</p>
                        </div>
                      </div>
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
