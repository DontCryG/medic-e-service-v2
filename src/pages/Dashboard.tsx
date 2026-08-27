import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
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
  Activity
} from 'lucide-react';

interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  theme: 'purple' | 'orange';
}

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const MenuCard = ({ icon, title, description, path, theme }: MenuCardProps) => {
  const navigate = useNavigate();
  
  const themeStyles = {
    purple: {
      accentLine: 'bg-[#8b5cf6]',
      iconBox: 'bg-purple-100 text-[#8b5cf6]',
      titleHover: 'group-hover:text-[#8b5cf6]',
      btn: 'bg-purple-50 text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white border-purple-100 hover:border-[#8b5cf6] shadow-sm'
    },
    orange: {
      accentLine: 'bg-[#f97316]',
      iconBox: 'bg-orange-100 text-[#f97316]',
      titleHover: 'group-hover:text-[#f97316]',
      btn: 'bg-orange-50 text-[#f97316] hover:bg-[#f97316] hover:text-white border-orange-100 hover:border-[#f97316] shadow-sm'
    }
  };

  const current = themeStyles[theme];

  return (
    <motion.div 
      className="group relative flex flex-col bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
      variants={itemVariants}
      whileHover={{ y: -6 }}
      onClick={() => navigate(path)}
    >
      {/* Top Accent Line */}
      <div className={`absolute top-0 left-0 w-full h-1.5 ${current.accentLine} opacity-80`}></div>
      
      {/* Header */}
      <div className="flex items-start gap-4 mb-4 mt-2">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${current.iconBox} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
          {icon}
        </div>
        <div className="pt-2 flex-grow">
          <h3 className={`text-[1.15rem] font-bold text-slate-800 m-0 ${current.titleHover} transition-colors`}>{title}</h3>
        </div>
      </div>
      
      {/* Body */}
      <div className="flex-grow mb-6">
        <p className="text-[0.9rem] leading-relaxed text-slate-500 m-0">{description}</p>
      </div>
      
      {/* Footer / Button */}
      <motion.button 
        className={`w-full py-3 rounded-xl font-semibold text-[0.95rem] transition-all flex items-center justify-center border ${current.btn}`}
        onClick={(e) => {
          e.stopPropagation();
          navigate(path);
        }}
        whileTap={{ scale: 0.96 }}
      >
        {theme === 'purple' ? 'เข้าใช้งานระบบ' : 'เข้าสู่ระบบจัดการ'}
      </motion.button>
    </motion.div>
  );
};

export default function Dashboard() {
  const { user: profile } = useAuthStore();
  const isAdmin = profile?.role === 'director' || profile?.role === 'deputy_director' || profile?.role === 'admin' || profile?.role === 'management';

  const today = new Date().toLocaleDateString('th-TH', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <motion.div 
      className="flex flex-col w-full max-w-[1200px] mx-auto pt-4 pb-16 px-4 md:px-8 gap-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Welcome Banner */}
      <motion.div 
        className="relative bg-gradient-to-r from-[#4c1d95] via-[#5b21b6] to-[#6d28d9] rounded-3xl p-8 md:p-10 shadow-xl overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        {/* Background Decor */}
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
           <Activity size={300} className="translate-x-1/4 -translate-y-1/4 text-white" />
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 mt-0 tracking-tight text-white">
              ยินดีต้อนรับ, {profile?.ic_name || 'ผู้ใช้งาน'} 👋
            </h1>
            <p className="text-purple-200 text-lg m-0 flex items-center gap-2">
              <CalendarDays size={20} />
              {today}
            </p>
          </div>
          {isAdmin && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[160px]">
              <span className="text-purple-200 text-sm font-semibold mb-1 uppercase tracking-wider">สถานะ</span>
              <span className="text-white font-bold text-lg">{profile?.position?.name || 'ผู้บริหาร'}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Medic Services Section */}
      <section>
        <div className="flex items-center gap-4 mb-6 pl-2">
          <div className="w-2.5 h-8 bg-gradient-to-b from-[#8b5cf6] to-[#6d28d9] rounded-full shadow-sm"></div>
          <h2 className="text-2xl font-bold text-slate-800 m-0 tracking-tight">ระบบปฏิบัติการแพทย์</h2>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <MenuCard 
            theme="purple"
            icon={<LayoutGrid size={28} strokeWidth={2.5} />}
            title="ระบบรับคิวแพทย์"
            description="ระบบจัดการคิวผู้ป่วย จัดลำดับการเข้ารับการรักษาและการเรียกคิวเข้าห้องตรวจ"
            path="/queue"
          />
          <MenuCard 
            theme="purple"
            icon={<Clock size={28} strokeWidth={2.5} />}
            title="ระบบเข้าเวรออกเวร"
            description="บันทึกการลงเวลาปฏิบัติงาน และตรวจสอบตารางเวรของแพทย์แต่ละท่าน"
            path="/duty"
          />
          <MenuCard 
            theme="purple"
            icon={<CalendarDays size={28} strokeWidth={2.5} />}
            title="ระบบลางาน"
            description="ระบบส่งใบลาพักผ่อน ลาป่วย และตรวจสอบประวัติการลางานของบุคลากร"
            path="/leave"
          />
        </motion.div>
      </section>

      {/* Admin Services Section */}
      {isAdmin && (
        <section className="mt-4">
          <div className="flex items-center gap-4 mb-6 pl-2">
            <div className="w-2.5 h-8 bg-gradient-to-b from-[#f97316] to-[#ea580c] rounded-full shadow-sm"></div>
            <h2 className="text-2xl font-bold text-slate-800 m-0 tracking-tight">ระบบจัดการภายใน (Admin Only)</h2>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <MenuCard 
              theme="orange"
              icon={<Users size={28} strokeWidth={2.5} />}
              title="ระบบจัดการบุคลากร"
              description="ฐานข้อมูลทะเบียนประวัติ และปรับเปลี่ยนสิทธิ์ (Role) เจ้าหน้าที่"
              path="/personnel"
            />
            <MenuCard 
              theme="orange"
              icon={<Banknote size={28} strokeWidth={2.5} />}
              title="ระบบคำนวณเงินเดือน"
              description="คำนวณรายได้ สรุปยอดเงินเดือน โบนัส และค่าตอบแทนพิเศษของบุคลากร"
              path="/salary"
            />
            <MenuCard 
              theme="orange"
              icon={<Wallet size={28} strokeWidth={2.5} />}
              title="ระบบบัญชี & คลังสิ่งของ"
              description="บันทึกรายรับ-รายจ่ายทางการเงิน และบริหารจัดการรับเข้า-เบิกออกสิ่งของ"
              path="/accounting"
            />
          </motion.div>
        </section>
      )}

      {/* Recommended Link Section */}
      <motion.section 
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <div className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
               <Star size={24} className="text-amber-500 fill-amber-500" />
            </div>
            <div>
               <h3 className="text-lg font-bold text-slate-800 m-0 mb-1">แนะนำเว็บไซต์ที่เกี่ยวข้อง</h3>
               <p className="text-sm text-slate-500 m-0">อ่านคู่มือและกฎระเบียบของหน่วยงานแพทย์</p>
            </div>
          </div>
          <motion.a 
            href="https://sites.google.com/view/wiptown/medic" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-[#8b5cf6] rounded-xl font-bold text-[0.95rem] no-underline transition-all shadow-sm hover:shadow-md hover:border-purple-300 hover:text-purple-700 whitespace-nowrap"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <ExternalLink size={18} />
            กฎหน่วยงานแพทย์ WIP TOWN
          </motion.a>
        </div>
      </motion.section>
    </motion.div>
  );
}
