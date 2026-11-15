import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isAdmin as checkIsAdmin } from '../utils/permissions';
import { 
  LayoutGrid, 
  Clock, 
  CalendarDays, 
  Users, 
  Banknote, 
  ExternalLink, 
  Activity, 
  ArrowRight, 
  ShieldCheck, 
  Radio
} from 'lucide-react';
import { useLiveUsers, useCurrentSession } from './DutySystem/hooks/useDutyQueries';

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  badge?: string;
  theme?: 'purple' | 'amber';
}

const ServiceCard = ({ icon, title, description, path, badge, theme = 'purple' }: ServiceCardProps) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(path)}
      className="group relative flex flex-col justify-between bg-white rounded-xl p-5 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all duration-150 cursor-pointer"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
            theme === 'purple' 
              ? 'bg-purple-50/80 text-purple-700 border-purple-200/60' 
              : 'bg-amber-50/80 text-amber-700 border-amber-200/60'
          }`}>
            {icon}
          </div>
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
              theme === 'purple'
                ? 'bg-purple-50 text-purple-700 border-purple-200/60'
                : 'bg-amber-50 text-amber-700 border-amber-200/60'
            }`}>
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-slate-900 m-0 mb-1 group-hover:text-purple-700 transition-colors">
          {title}
        </h3>
        <p className="text-xs leading-relaxed text-slate-500 m-0 font-normal">
          {description}
        </p>
      </div>

      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-purple-700 transition-colors">
        <span>เข้าใช้งานระบบ</span>
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user: profile } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = checkIsAdmin(profile?.role);

  // Live ops data
  const { data: liveUsers = [] } = useLiveUsers();
  const { data: currentSession } = useCurrentSession(profile?.discord_id);

  const onDutyCount = liveUsers.filter(u => u.status === 'on_duty').length;
  const onBreakCount = liveUsers.filter(u => u.status === 'on_break').length;

  const today = new Date().toLocaleDateString('th-TH', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="flex flex-col w-full max-w-[1280px] mx-auto gap-6 animate-in fade-in duration-200">
      
      {/* Clean Minimalist White Hospital Desk Banner */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
              <Radio size={12} className="text-purple-600 animate-pulse" />
              ศูนย์ปฏิบัติการแพทย์ WIP TOWN
            </span>
            <span className="text-[11px] text-slate-400 font-medium">• ระบบบริหารจัดการและบริการแพทย์</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 m-0 leading-tight">
            สวัสดี, {profile?.ic_name || 'คุณหมอ'}
          </h1>
          <p className="text-xs text-slate-500 m-0 mt-1 font-normal flex items-center gap-1.5">
            <CalendarDays size={14} className="text-slate-400" />
            วัน{today}
          </p>
        </div>

        {/* Doctor Identity Tile */}
        <div className="bg-slate-50/90 border border-slate-200/70 rounded-lg px-4 py-2.5 flex items-center justify-between md:justify-end gap-4 shrink-0">
          <div className="flex flex-col md:items-end">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">ตำแหน่ง / หน้าที่</span>
            <span className="text-xs font-bold text-slate-800 leading-tight mt-0.5">
              {profile?.position?.name || (isAdmin ? 'ผู้ดูแลระบบ' : 'แพทย์')}
            </span>
          </div>
          <div className="w-px h-7 bg-slate-200" />
          <div className="flex flex-col md:items-end">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">สิทธิ์การใช้งาน</span>
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
              <ShieldCheck size={12} />
              {profile?.role ? profile.role.toUpperCase() : 'MEDIC'}
            </span>
          </div>
        </div>
      </div>

      {/* Live Telemetry Status Cards (Row of 3 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. On Duty Live Counter */}
        <div 
          onClick={() => navigate('/duty')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-3"
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">แพทย์เข้าเวรสด</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900">{onDutyCount}</span>
              <span className="text-xs text-slate-500 font-medium">ท่าน กำลังปฏิบัติหน้าที่</span>
            </div>
            {onBreakCount > 0 ? (
              <span className="text-[11px] font-medium text-amber-600 block mt-0.5">
                (พักเบรกอยู่ {onBreakCount} ท่าน)
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                ดูรายชื่อแพทย์เข้าเวร →
              </span>
            )}
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <Activity size={18} />
          </div>
        </div>

        {/* 2. Current User Duty Status */}
        <div 
          onClick={() => navigate('/duty')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-3"
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-1.5 h-1.5 rounded-full ${
                currentSession?.status === 'on_duty' ? 'bg-emerald-500' : currentSession?.status === 'on_break' ? 'bg-amber-500' : 'bg-slate-300'
              }`} />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">สถานะเวรของคุณ</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-base font-bold ${
                currentSession?.status === 'on_duty' 
                  ? 'text-emerald-700' 
                  : currentSession?.status === 'on_break' 
                  ? 'text-amber-700' 
                  : 'text-slate-600'
              }`}>
                {currentSession?.status === 'on_duty' 
                  ? 'กำลังปฏิบัติหน้าที่' 
                  : currentSession?.status === 'on_break' 
                  ? 'กำลังพักเบรก' 
                  : 'อยู่นอกเวลาเวร'}
              </span>
            </div>
            <span className="text-[11px] font-medium text-purple-700 block mt-0.5">
              {currentSession ? 'จัดการเวลาเวรของคุณ →' : 'ลงเวลาเข้าเวรทันที →'}
            </span>
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
            currentSession 
              ? 'bg-purple-50 text-purple-700 border-purple-200/60' 
              : 'bg-slate-50 text-slate-400 border-slate-200/60'
          }`}>
            <Clock size={18} />
          </div>
        </div>

        {/* 3. Realtime Connection Status */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">สถานะการเชื่อมต่อ</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-slate-900">Realtime Online</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 block mt-0.5">
              ● ซิงค์ข้อมูลอัตโนมัติแบบสด
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
            <Radio size={18} />
          </div>
        </div>
      </div>

      {/* Medic Services Launchpad */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1 h-3.5 bg-purple-600 rounded-full" />
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">บริการแพทย์และปฏิบัติการ</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ServiceCard 
            theme="purple"
            icon={<LayoutGrid size={18} />}
            title="ระบบรับคิวแพทย์"
            description="จัดการคิวผู้ป่วย จัดลำดับการเข้ารับการรักษา และเรียกคิวแบบเรียลไทม์"
            path="/queue"
            badge="LIVE QUEUE"
          />
          <ServiceCard 
            theme="purple"
            icon={<Clock size={18} />}
            title="ระบบเข้าเวรออกเวร"
            description="ลงเวลาปฏิบัติงาน พักเบรก นับเวลาสะสม และติดตามหลอดเป้าหมายชั่วโมง"
            path="/duty"
            badge={onDutyCount > 0 ? `${onDutyCount} ท่าน` : undefined}
          />
          <ServiceCard 
            theme="purple"
            icon={<CalendarDays size={18} />}
            title="ระบบลางาน"
            description="ยื่นใบลาพักผ่อน ลากิจ ติดตามสถานะการอนุมัติ และบันทึกประวัติการลา"
            path="/leave"
          />
        </div>
      </section>

      {/* Admin Services Launchpad */}
      {isAdmin && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-3.5 bg-amber-500 rounded-full" />
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider m-0">ระบบจัดการภายใน (Admin Only)</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ServiceCard 
              theme="amber"
              icon={<Users size={18} />}
              title="ระบบจัดการบุคลากร"
              description="ทะเบียนประวัติแพทย์ ปรับตำแหน่งหน้าที่ กำหนดสิทธิ์ และเพิ่มเวลาเวร"
              path="/personnel"
            />
            <ServiceCard 
              theme="amber"
              icon={<Banknote size={18} />}
              title="ระบบคำนวณเงินเดือน"
              description="ประมวลผลค่ารอบเวร โบนัสพี่เลี้ยง และจัดพิมพ์ใบสรุปสลิปเงินเดือน"
              path="/salary"
            />
          </div>
        </section>
      )}

      {/* Guide Link Minimal Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h3 className="text-xs font-bold text-slate-900 m-0 mb-0.5">คู่มือและกฎระเบียบหน่วยงานแพทย์</h3>
          <p className="text-xs text-slate-500 m-0 font-normal">อ่านแนวทางการปฏิบัติงานและระเบียบของหน่วยงานแพทย์ WIP TOWN</p>
        </div>
        <a 
          href="https://sites.google.com/view/wiptown/medic" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-semibold text-xs no-underline transition-colors shrink-0"
        >
          <ExternalLink size={13} />
          เปิดอ่านคู่มือ
        </a>
      </div>
    </div>
  );
}
