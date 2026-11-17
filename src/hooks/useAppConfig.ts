import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SettingDefinition {
  key: string;
  label: string;
  category: 'org' | 'queue' | 'leave' | 'pricing' | 'salary' | 'custom';
  categoryLabel: string;
  description: string;
  example: string;
  type: 'number' | 'text' | 'boolean';
  unit?: string;
  defaultValue: string;
}

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  // 🏢 ข้อมูลหน่วยงานและทั่วไป (Organization)
  {
    key: 'org_name',
    label: 'ชื่อหน่วยงาน / โรงพยาบาล',
    category: 'org',
    categoryLabel: 'ข้อมูลหน่วยงานและทั่วไป',
    description: 'ชื่อองค์กรหลักที่จะแสดงบนหัวเว็บ (Header), หน้าแรก และเอกสารสลิปเงินเดือน',
    example: 'WIP TOWN MEDICAL SERVICE',
    type: 'text',
    defaultValue: 'WIP TOWN MEDICAL SERVICE'
  },
  {
    key: 'guide_url',
    label: 'ลิงก์คู่มือและกฎระเบียบหน่วยงานแพทย์',
    category: 'org',
    categoryLabel: 'ข้อมูลหน่วยงานและทั่วไป',
    description: 'URL ลิงก์ไปยังเอกสารคู่มือการปฏิบัติหน้าที่ (กดเปิดอ่านได้จากหน้า Dashboard)',
    example: 'https://sites.google.com/view/wiptown/medic',
    type: 'text',
    defaultValue: 'https://sites.google.com/view/wiptown/medic'
  },
  {
    key: 'announcement_banner',
    label: 'ข้อความประกาศด่วนของหน่วยงาน',
    category: 'org',
    categoryLabel: 'ข้อมูลหน่วยงานและทั่วไป',
    description: 'ข้อความประกาศหรือแจ้งเตือนสำคัญที่จะแสดงอยู่บนแดชบอร์ดให้แพทย์ทุกคนเห็น (เว้นว่างไว้หากไม่มีประกาศ)',
    example: 'ยินดีต้อนรับสู่ระบบการแพทย์ V2.0 ขอให้แพทย์ทุกคนบันทึกเวลาเวรตามระเบียบ',
    type: 'text',
    defaultValue: ''
  },

  // ⏱️ ระบบจัดการคิวและเวลาเวร (Queue & Duty)
  {
    key: 'queue_bonus_min_minutes',
    label: 'เวลาทำหน้าที่คิวขั้นต่ำเพื่อรับโบนัส',
    category: 'queue',
    categoryLabel: 'ระบบคิวและเวลาเวร',
    description: 'จำนวนนาทีที่แพทย์ต้องปฏิบัติหน้าที่รับคิวสะสมในแต่ละวัน จึงจะผ่านเกณฑ์รับโบนัสเวลาเวรประจำวัน',
    example: '120 (หมายถึง 2 ชั่วโมง)',
    type: 'number',
    unit: 'นาที/วัน',
    defaultValue: '120'
  },
  {
    key: 'queue_bonus_hours',
    label: 'ชั่วโมงโบนัสที่ได้รับเมื่อผ่านเกณฑ์คิว',
    category: 'queue',
    categoryLabel: 'ระบบคิวและเวลาเวร',
    description: 'จำนวนชั่วโมงเวลาเวรพิเศษที่จะได้รับเพิ่มในรอบเงินเดือนเมื่อรับคิวครบตามเกณฑ์',
    example: '2 (หมายถึง +2 ชม.)',
    type: 'number',
    unit: 'ชั่วโมง/วัน',
    defaultValue: '2'
  },
  {
    key: 'target_duty_hours',
    label: 'เป้าหมายชั่วโมงเวรมาตรฐาน',
    category: 'queue',
    categoryLabel: 'ระบบคิวและเวลาเวร',
    description: 'เป้าหมายชั่วโมงเวรสะสมที่ใช้คำนวณหลอดความก้าวหน้า (Progress Bar) ในหน้าระบบเข้าเวร',
    example: '20 (หมายถึง 20 ชั่วโมง)',
    type: 'number',
    unit: 'ชั่วโมง',
    defaultValue: '20'
  },

  // 🌴 นโยบายและเงื่อนไขการลางาน (Leave Policies)
  {
    key: 'vacation_min_duty_days',
    label: 'จำนวนวันเข้าเวรขั้นต่ำก่อนมีสิทธิ์ลาพักร้อน',
    category: 'leave',
    categoryLabel: 'นโยบายการลางาน',
    description: 'แพทย์ต้องมีประวัติเข้าเวรสะสมอย่างน้อยกี่วัน จึงจะสามารถกดยื่นขออนุมัติลาพักร้อนได้',
    example: '30 (หมายถึง 30 วัน)',
    type: 'number',
    unit: 'วัน',
    defaultValue: '30'
  },
  {
    key: 'vacation_notice_detail',
    label: 'คำชี้แจงระเบียบการลาพักร้อน',
    category: 'leave',
    categoryLabel: 'นโยบายการลางาน',
    description: 'ข้อความคำอธิบายเงื่อนไขที่จะแสดงในกล่องแจ้งเตือนของฟอร์มเมื่อแพทย์เลือกประเภท "ลาพักร้อน"',
    example: 'การลาพักร้อนต้องเข้าเวรครบตามเกณฑ์ ได้รับค่าตอบแทนเวรปกติ และใช้สิทธิ์ได้ 1 ครั้ง/ปี',
    type: 'text',
    defaultValue: 'การลาพักร้อนต้องมีประวัติเข้าเวรครบตามเกณฑ์ ได้รับค่าตอบแทนเวรปกติ และสามารถใช้สิทธิ์ได้ 1 ครั้งต่อปี'
  },
  {
    key: 'leave_notice_detail',
    label: 'คำชี้แจงระเบียบการลากิจ',
    category: 'leave',
    categoryLabel: 'นโยบายการลางาน',
    description: 'ข้อความคำอธิบายเงื่อนไขที่จะแสดงในกล่องแจ้งเตือนของฟอร์มเมื่อแพทย์เลือกประเภท "ลากิจ"',
    example: 'ลากิจโปรดแจ้งล่วงหน้าอย่างน้อย 24 ชั่วโมง และระบุเหตุผลความจำเป็นอย่างชัดเจน',
    type: 'text',
    defaultValue: 'ลากิจโปรดระบุเหตุผลความจำเป็นอย่างชัดเจน และแจ้งล่วงหน้าเพื่อให้ผู้บริหารสามารถจัดเวรทดแทนได้'
  },
  {
    key: 'resign_notice_detail',
    label: 'คำชี้แจงระเบียบการลาออก',
    category: 'leave',
    categoryLabel: 'นโยบายการลางาน',
    description: 'ข้อความคำอธิบายเงื่อนไขที่จะแสดงในกล่องแจ้งเตือนของฟอร์มเมื่อแพทย์เลือกประเภท "ลาออก"',
    example: 'การยื่นคำร้องลาออกจะมีผลตามวันที่ระบุ และสิทธิ์การเข้าใช้งานจะถูกเพิกถอนเมื่อได้รับการอนุมัติ',
    type: 'text',
    defaultValue: 'การยื่นคำร้องลาออกจะมีผลตามวันที่กำหนด และสิทธิ์การเข้าใช้งานระบบจะถูกเพิกถอนเมื่อผู้อำนวยการอนุมัติ'
  },

  // 💵 เรทค่ารักษาพยาบาลและบริการ (Medical Pricing)
  {
    key: 'treatment_price_normal',
    label: 'ค่ารักษาพยาบาล - ประชาชนทั่วไป',
    category: 'pricing',
    categoryLabel: 'เรทค่ารักษาและบริการ',
    description: 'อัตราค่าบริการพื้นฐานสำหรับการรักษาผู้ป่วยประชาชนทั่วไป (IC Cash)',
    example: '5000',
    type: 'number',
    unit: 'บาท/เคส',
    defaultValue: '5000'
  },
  {
    key: 'treatment_price_gang',
    label: 'ค่ารักษาพยาบาล - สมาชิกแก๊ง/สตอรี่',
    category: 'pricing',
    categoryLabel: 'เรทค่ารักษาและบริการ',
    description: 'อัตราค่าบริการสำหรับการรักษาผู้ป่วยที่มีสังกัดแก๊งหรือแฟมิลี่ (IC Cash)',
    example: '10000',
    type: 'number',
    unit: 'บาท/เคส',
    defaultValue: '10000'
  },
  {
    key: 'medical_certificate_price',
    label: 'ค่าธรรมเนียมออกใบรับรองแพทย์',
    category: 'pricing',
    categoryLabel: 'เรทค่ารักษาและบริการ',
    description: 'ค่าบริการออกเอกสารใบรับรองแพทย์หรือตรวจสุขภาพ (IC Cash)',
    example: '20000',
    type: 'number',
    unit: 'บาท/ฉบับ',
    defaultValue: '20000'
  },

  // 🎁 ระบบเงินเดือนและของรางวัล (Salary & Rewards)
  {
    key: 'mentor_reward_amount',
    label: 'ค่าตอบแทนเวรพี่เลี้ยง (บาท/ครั้ง)',
    category: 'salary',
    categoryLabel: 'เงินเดือนและของรางวัล',
    description: 'เงินรางวัลพิเศษสำหรับแพทย์ที่ลงเวลาปฏิบัติหน้าที่เป็นพี่เลี้ยงสอนงานแพทย์ฝึกหัด',
    example: '500000 (หมายถึง 500,000 บาท)',
    type: 'number',
    unit: 'บาท',
    defaultValue: '500000'
  },
  {
    key: 'bonus_7day_hours',
    label: 'โบนัสเข้าเวรครบ 7 วัน',
    category: 'salary',
    categoryLabel: 'เงินเดือนและของรางวัล',
    description: 'จำนวนชั่วโมงเวลาเวรที่เพิ่มให้พิเศษเมื่อแพทย์เข้าเวรติดต่อกันครบ 7 วันโดยไม่มีประวัติการลา',
    example: '3 (หมายถึง +3 ชม.)',
    type: 'number',
    unit: 'ชั่วโมง',
    defaultValue: '3'
  },
  {
    key: 'reward_20h_gacha_ic',
    label: 'รางวัลเป้าหมาย 20 ชม. - Gacha IC',
    category: 'salary',
    categoryLabel: 'เงินเดือนและของรางวัล',
    description: 'จำนวนกล่อง Gacha IC ที่ได้รับเมื่อชั่วโมงเวรรวมถึง 20 ชั่วโมง',
    example: '20',
    type: 'number',
    unit: 'กล่อง',
    defaultValue: '20'
  },
  {
    key: 'reward_20h_coins',
    label: 'รางวัลเป้าหมาย 20 ชม. - Coins',
    category: 'salary',
    categoryLabel: 'เงินเดือนและของรางวัล',
    description: 'จำนวนเหรียญ Coins ที่ได้รับเมื่อชั่วโมงเวรรวมถึง 20 ชั่วโมง',
    example: '20',
    type: 'number',
    unit: 'Coins',
    defaultValue: '20'
  },
  {
    key: 'reward_20h_gacha_premium',
    label: 'รางวัลเป้าหมาย 20 ชม. - Gacha Premium',
    category: 'salary',
    categoryLabel: 'เงินเดือนและของรางวัล',
    description: 'จำนวนกล่อง Premium Gacha ที่ได้รับเมื่อชั่วโมงเวรรวมถึง 20 ชั่วโมง',
    example: '3',
    type: 'number',
    unit: 'กล่อง',
    defaultValue: '3'
  },
  {
    key: 'reward_20h_agency_gacha',
    label: 'รางวัลเป้าหมาย 20 ชม. - Agency Gacha',
    category: 'salary',
    categoryLabel: 'เงินเดือนและของรางวัล',
    description: 'จำนวนกล่อง Agency Gacha ขั้นต่ำที่ได้รับเมื่อถึง 20 ชั่วโมง',
    example: '50',
    type: 'number',
    unit: 'กล่อง',
    defaultValue: '50'
  }
];

export interface AppConfig {
  org_name: string;
  guide_url: string;
  announcement_banner: string;
  queue_bonus_min_minutes: number;
  queue_bonus_hours: number;
  target_duty_hours: number;
  vacation_min_duty_days: number;
  vacation_notice_detail: string;
  leave_notice_detail: string;
  resign_notice_detail: string;
  treatment_price_normal: number;
  treatment_price_gang: number;
  medical_certificate_price: number;
  mentor_reward_amount: number;
  bonus_7day_hours: number;
  reward_20h_gacha_ic: number;
  reward_20h_coins: number;
  reward_20h_gacha_premium: number;
  reward_20h_agency_gacha: number;
  [key: string]: any;
}

export function useAppConfig() {
  const query = useQuery({
    queryKey: ['system_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      if (error) {
        console.error('Error fetching system_settings:', error);
        return [];
      }
      return data || [];
    },
    staleTime: 30 * 1000,
  });

  const config = useMemo<AppConfig>(() => {
    // 1. Start with defaults
    const result: Record<string, any> = {};
    for (const def of SETTING_DEFINITIONS) {
      if (def.type === 'number') {
        result[def.key] = Number(def.defaultValue) || 0;
      } else if (def.type === 'boolean') {
        result[def.key] = def.defaultValue === 'true';
      } else {
        result[def.key] = def.defaultValue;
      }
    }

    // 2. Override with database values
    if (query.data && Array.isArray(query.data)) {
      for (const row of query.data) {
        if (!row.key) continue;
        const def = SETTING_DEFINITIONS.find(d => d.key === row.key);
        const type = def?.type || row.type || 'text';

        if (type === 'number') {
          const num = Number(row.value);
          result[row.key] = isNaN(num) ? (def ? Number(def.defaultValue) : 0) : num;
        } else if (type === 'boolean') {
          result[row.key] = String(row.value).toLowerCase() === 'true';
        } else {
          result[row.key] = row.value ?? '';
        }
      }
    }

    return result as AppConfig;
  }, [query.data]);

  return {
    config,
    rawSettings: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch
  };
}
