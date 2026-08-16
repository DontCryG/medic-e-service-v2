import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, 
  Clock, 
  CalendarDays, 
  Users, 
  UserCog, 
  Banknote, 
  Wallet,
  Star,
  ExternalLink
} from 'lucide-react';
import './Dashboard.css';

interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  theme: 'purple' | 'orange';
}

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const MenuCard = ({ icon, title, description, path, theme }: MenuCardProps) => {
  const navigate = useNavigate();
  return (
    <motion.div 
      className={`menu-card theme-${theme}`}
      variants={itemVariants}
      whileHover={{ y: -5, boxShadow: '0 12px 30px rgba(0,0,0,0.06)' }}
    >
      <div className="menu-card-icon">
        {icon}
      </div>
      <div className="menu-card-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <motion.button 
        className="menu-card-button" 
        onClick={() => navigate(path)}
        whileTap={{ scale: 0.95 }}
      >
        {theme === 'purple' ? 'เข้าใช้งาน' : 'เข้าสู่ระบบ'}
      </motion.button>
    </motion.div>
  );
};

export default function Dashboard() {
  const { user: profile } = useAuthStore();
  const isAdmin = profile?.role === 'director' || profile?.role === 'deputy_director' || profile?.role === 'admin' || profile?.role === 'management';

  return (
    <motion.div 
      className="dashboard-portal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Medic Services Section */}
      <section className="portal-section">
        <div className="section-header">
          <h2>ระบบปฏิบัติการแพทย์ (Medic Services)</h2>
          <div className="header-underline theme-purple"></div>
        </div>
        
        <motion.div 
          className="portal-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <MenuCard 
            theme="purple"
            icon={<LayoutGrid size={28} />}
            title="ระบบรับคิวแพทย์"
            description="ระบบจัดการคิวผู้ป่วย จัดลำดับการเข้ารับการรักษาและการเรียกคิวเข้าห้องตรวจ"
            path="/queue"
          />
          <MenuCard 
            theme="purple"
            icon={<Clock size={28} />}
            title="ระบบเข้าเวรออกเวร"
            description="บันทึกการลงเวลาปฏิบัติงาน และตรวจสอบตารางเวรของแพทย์แต่ละท่าน"
            path="/duty"
          />
          <MenuCard 
            theme="purple"
            icon={<CalendarDays size={28} />}
            title="ระบบลางาน"
            description="ระบบส่งใบลาพักผ่อน ลาป่วย และตรวจสอบประวัติการลางานของบุคลากร"
            path="/leave"
          />
          <MenuCard 
            theme="purple"
            icon={<UserCog size={28} />}
            title="ระบบจัดการคำร้อง"
            description="ตรวจสอบ อนุมัติ และจัดการคำร้องต่างๆ ที่ถูกส่งเข้ามาจากบุคลากร"
            path="/requests"
          />
        </motion.div>
      </section>

      {/* Admin Services Section */}
      {isAdmin && (
        <section className="portal-section" style={{ marginTop: '3rem' }}>
          <div className="section-header">
            <h2>ระบบจัดการภายในแพทย์ (Admin Only)</h2>
            <div className="header-underline theme-orange"></div>
          </div>
          
          <motion.div 
            className="portal-grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <MenuCard 
              theme="orange"
              icon={<Users size={28} />}
              title="ระบบจัดการบุคลากรแพทย์"
              description="ฐานข้อมูลทะเบียนประวัติ และปรับเปลี่ยนสิทธิ์ (Role) เจ้าหน้าที่"
              path="/personnel"
            />
            <MenuCard 
              theme="orange"
              icon={<Banknote size={28} />}
              title="ระบบคำนวณเงินเดือน"
              description="คำนวณรายได้ สรุปยอดเงินเดือน โบนัส และค่าตอบแทนพิเศษของบุคลากร"
              path="/salary"
            />
            <MenuCard 
              theme="orange"
              icon={<Wallet size={28} />}
              title="ระบบบัญชี & คลังสิ่งของ"
              description="บันทึกรายรับ-รายจ่ายทางการเงิน และบริหารจัดการรับเข้า-เบิกออกสิ่งของ"
              path="/accounting"
            />
          </motion.div>
        </section>
      )}

      {/* Recommended Link Section */}
      <motion.section 
        className="portal-section" 
        style={{ marginTop: '4rem', paddingBottom: '3rem' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        <div className="recommended-box">
          <h3>
            <Star size={20} className="star-icon" />
            แนะนำเว็บไซต์ที่เกี่ยวข้อง
          </h3>
          <motion.a 
            href="https://sites.google.com/view/wiptown/medic" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="recommended-button"
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)' }}
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
