import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { isAdmin as checkIsAdmin } from '../utils/permissions';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, 
  Clock, 
  CalendarDays, 
  Users, 
  Banknote, 
  Wallet,
  Star,
  ExternalLink,
  Activity,
  ArrowRight,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { useLiveUsers, useCurrentSession } from './DutySystem/hooks/useDutyQueries';

interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  theme: 'purple' | 'orange';
  badge?: string;
}

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } }
};

const MenuCard = ({ icon, title, description, path, theme, badge }: MenuCardProps) => {
  const navigate = useNavigate();
  
  const themeStyles = {
    purple: {
      accentLine: 'bg-gradient-to-r from-purple-600 to-indigo-600',
      iconBox: 'bg-purple-50 text-purple-700 border border-purple-200/80 group-hover:bg-purple-600 group-hover:text-white',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      btn: 'bg-slate-50 text-slate-700 group-hover:bg-purple-600 group-hover:text-white border-slate-200 group-hover:border-purple-600 shadow-sm'
    },
    orange: {
      accentLine: 'bg-gradient-to-r from-orange-500 to-amber-500',
      iconBox: 'bg-orange-50 text-orange-600 border border-orange-200/80 group-hover:bg-orange-500 group-hover:text-white',
      badge: 'bg-orange-50 text-orange-700 border-orange-200',
      btn: 'bg-slate-50 text-slate-700 group-hover:bg-orange-500 group-hover:text-white border-slate-200 group-hover:border-orange-500 shadow-sm'
    }
  };

  const current = themeStyles[theme];

  return (
    <motion.div 
      className="group relative flex flex-col bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden cursor-pointer"
      variants={itemVariants}
      whileHover={{ y: -4 }}
      onClick={() => navigate(path)}
    >
      {/* Top Accent Line */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${current.accentLine}`}></div>
      
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4 mt-2">
        <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 ${current.iconBox} transition-all duration-300 shadow-sm`}>
          {icon}
        </div>
        {badge && (
          <span className={`text-[0.7rem] font-bold px-2.5 py-1 rounded-full border ${current.badge}`}>
            {badge}
          </span>
        )}
      </div>
      
      {/* Body */}
      <div className="flex-grow mb-5">
        <h3 className="text-lg font-bold text-slate-900 m-0 mb-1.5 group-hover:text-purple-700 transition-colors">
          {title}
        </h3>
        <p className="text-xs leading-relaxed text-slate-500 m-0">
          {description}
        </p>
      </div>
      
      {/* Footer / Button */}
      <div className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-between border ${current.btn}`}>
        <span>{theme === 'purple' ? 'เข้าสู่ระบบปฏิบัติงาน' : 'เข้าสู่ระบบจัดการ'}</span>
        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
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
    <motion.div 
      className="flex flex-col w-full max-w-[1240px] mx-auto pt-2 pb-16 px-4 md:px-6 gap-8 animate-in fade-in duration-300"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Operations Welcome Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-6 md:p-8 shadow-xl overflow-hidden text-white border border-slate-800">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Activity size={260} className="translate-x-1/4 -translate-y-1/4 text-white" />
        </div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-purple-200 border border-white/10 backdrop-blur-sm">
                <Radio size={12} className="text-emerald-400 animate-pulse" />
                Medical Operations Center
              </span>
              <span className="text-xs text-purple-300 font-medium hidden sm:inline">• WIP TOWN COUNCIL</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black mb-1.5 mt-0 tracking-tight text-white flex items-center gap-2">
              ยินดีต้อนรับ, {profile?.ic_name || 'ผู้ใช้งาน'}
            </h1>
            <p className="text-purple-200/90 text-sm m-0 flex items-center gap-2 font-medium">
              <CalendarDays size={16} />
              {today}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-3 flex flex-col items-end justify-center">
              <span className="text-purple-300 text-[0.7rem] font-bold uppercase tracking-wider">ตำแหน่ง / สิทธิ์</span>
              <span className="text-white font-black text-sm">{profile?.position?.name || (isAdmin ? 'ผู้บริหาร' : 'แพทย์')}</span>
              <span className="text-[0.65rem] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                <ShieldCheck size={11} /> {profile?.role ? profile.role.toUpperCase() : 'VERIFIED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Operations HUD (Live Status Bar) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* On Duty LIVE Counter */}
        <div 
          onClick={() => navigate('/duty')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">แพทย์เข้าเวร (LIVE)</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{onDutyCount}</span>
              <span className="text-xs font-semibold text-slate-400">ท่านกำลังปฏิบัติหน้าที่</span>
            </div>
            {onBreakCount > 0 && (
              <span className="text-[0.7rem] font-semibold text-amber-600 block mt-1">
                (พักเบรก {onBreakCount} ท่าน)
              </span>
            )}
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-emerald-100">
            <Activity size={24} />
          </div>
        </div>

        {/* Current User Duty Status */}
        <div 
          onClick={() => navigate('/duty')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${currentSession ? 'bg-purple-600' : 'bg-slate-300'}`} />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">สถานะเวรของคุณ</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-base font-black ${
                currentSession?.status === 'on_duty' 
                  ? 'text-emerald-600' 
                  : currentSession?.status === 'on_break' 
                  ? 'text-amber-600' 
                  : 'text-slate-500'
              }`}>
                {currentSession?.status === 'on_duty' 
                  ? 'กำลังปฏิบัติหน้าที่' 
                  : currentSession?.status === 'on_break' 
                  ? 'กำลังพักเบรก' 
                  : 'อยู่นอกเวลาเวร'}
              </span>
            </div>
            <span className="text-[0.7rem] font-semibold text-purple-600 group-hover:underline block mt-1">
              {currentSession ? 'คลิกเพื่อจัดการเวลาเวร →' : 'คลิกเพื่อลงเวลาเข้าเวร →'}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border ${
            currentSession ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-400 border-slate-200'
          }`}>
            <Clock size={24} />
          </div>
        </div>

        {/* Realtime Connection Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between gap-4 sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ระบบเชื่อมต่อ</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-slate-900">Realtime Sync Active</span>
            </div>
            <span className="text-[0.7rem] font-semibold text-emerald-600 block mt-1">
              ● อัปเดตข้อมูลอัตโนมัติแบบเรียลไทม์
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Radio size={24} />
          </div>
        </div>
      </div>

      {/* Medic Services Section */}
      <section>
        <div className="flex items-center gap-3 mb-5 pl-1">
          <div className="w-2 h-6 bg-purple-600 rounded-full shadow-sm"></div>
          <h2 className="text-xl font-bold text-slate-900 m-0 tracking-tight">ระบบปฏิบัติการแพทย์</h2>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <MenuCard 
            theme="purple"
            icon={<LayoutGrid size={24} strokeWidth={2.5} />}
            title="ระบบรับคิวแพทย์"
            description="จัดการคิวผู้ป่วย จัดลำดับการเข้ารับการรักษา และบันทึกเคสสตอรี่"
            path="/queue"
            badge="REALTIME QUEUE"
          />
          <MenuCard 
            theme="purple"
            icon={<Clock size={24} strokeWidth={2.5} />}
            title="ระบบเข้าเวรออกเวร"
            description="ลงเวลาปฏิบัติงาน พักเบรก ตรวจสอบแพทย์เข้าเวรสด และดูประวัติย้อนหลัง"
            path="/duty"
            badge={onDutyCount > 0 ? `${onDutyCount} LIVE` : undefined}
          />
          <MenuCard 
            theme="purple"
            icon={<CalendarDays size={24} strokeWidth={2.5} />}
            title="ระบบลางาน"
            description="ยื่นใบลาพักผ่อน ลากิจ ติดตามสถานะการอนุมัติ และบันทึกประวัติการลา"
            path="/leave"
          />
        </motion.div>
      </section>

      {/* Admin Services Section */}
      {isAdmin && (
        <section className="mt-2">
          <div className="flex items-center gap-3 mb-5 pl-1">
            <div className="w-2 h-6 bg-orange-500 rounded-full shadow-sm"></div>
            <h2 className="text-xl font-bold text-slate-900 m-0 tracking-tight">ระบบจัดการภายใน (Admin Only)</h2>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <MenuCard 
              theme="orange"
              icon={<Users size={24} strokeWidth={2.5} />}
              title="ระบบจัดการบุคลากร"
              description="ทะเบียนประวัติแพทย์ ปรับตำแหน่ง กำหนดสิทธิ์ และเพิ่มเวลาเวรย้อนหลัง"
              path="/personnel"
            />
            <MenuCard 
              theme="orange"
              icon={<Banknote size={24} strokeWidth={2.5} />}
              title="ระบบคำนวณเงินเดือน"
              description="คำนวณรายได้ สรุปค่าเวร โบนัสสตอรี่/พี่เลี้ยง และพิมพ์สลิปเงินเดือน"
              path="/salary"
            />
            <MenuCard 
              theme="orange"
              icon={<Wallet size={24} strokeWidth={2.5} />}
              title="ระบบบัญชี & คลังสิ่งของ"
              description="บันทึกรายรับ-รายจ่ายทางการเงิน และบริหารจัดการคลังยา/เวชภัณฑ์"
              path="/accounting"
            />
          </motion.div>
        </section>
      )}

      {/* Guide Links */}
      <section className="mt-2">
        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0 text-amber-600">
              <Star size={22} className="fill-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 m-0 mb-0.5">คู่มือและกฎระเบียบหน่วยงานแพทย์</h3>
              <p className="text-xs text-slate-500 m-0">อ่านแนวทางการปฏิบัติงานและระเบียบของหน่วยงานแพทย์ WIP TOWN</p>
            </div>
          </div>
          <a 
            href="https://sites.google.com/view/wiptown/medic" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-purple-700 hover:text-purple-800 hover:border-purple-300 rounded-xl font-bold text-xs no-underline transition-all shadow-sm hover:shadow whitespace-nowrap"
          >
            <ExternalLink size={15} />
            เปิดอ่านคู่มือหน่วยงาน
          </a>
        </div>
      </section>
    </motion.div>
  );
}
