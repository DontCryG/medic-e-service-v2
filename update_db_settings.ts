import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Seeding system_settings...");
  const settings = [
    { key: 'story_fight_1', value: '200000', description: 'เงินสตอรี่: ไฟต์ตรง (1 คน)', type: 'number' },
    { key: 'story_fight_2', value: '100000', description: 'เงินสตอรี่: ไฟต์ตรง (2 คน)', type: 'number' },
    { key: 'story_rob_1', value: '350000', description: 'เงินสตอรี่: ปั๊มรถ (1 คน)', type: 'number' },
    { key: 'story_rob_2', value: '175000', description: 'เงินสตอรี่: ปั๊มรถ (2 คน)', type: 'number' },
    { key: 'story_clash', value: '200000', description: 'เงินสตอรี่: ปะทะ', type: 'number' },
    { key: 'story_heist', value: '100000', description: 'เงินสตอรี่: ปล้น', type: 'number' },
    { key: 'story_circle', value: '150000', description: 'เงินสตอรี่: ตีวง', type: 'number' },
    
    // 20+ hours
    { key: 'reward_20h_gacha_ic', value: '20', description: 'รางวัล > 20 ชม: จำนวนกาชา IC', type: 'number' },
    { key: 'reward_20h_coins', value: '20', description: 'รางวัล > 20 ชม: จำนวนเหรียญ', type: 'number' },
    { key: 'reward_20h_gacha_premium', value: '3', description: 'รางวัล > 20 ชม: จำนวนกาชาพรีเมียม', type: 'number' },
    { key: 'reward_20h_agency_gacha', value: '50', description: 'รางวัล > 20 ชม: จำนวนกาชาหน่วยงาน', type: 'number' },

    // > 0 hours
    { key: 'reward_1h_gacha_ic', value: '10', description: 'รางวัล > 0 ชม: จำนวนกาชา IC', type: 'number' },
    { key: 'reward_1h_coins', value: '5', description: 'รางวัล > 0 ชม: จำนวนเหรียญ', type: 'number' },
    
    // Formula for agency gacha (11-19h): (totalHours - base) * multiplier
    { key: 'reward_agency_base_hours', value: '10', description: 'เริ่มนับกาชาหน่วยงานเมื่อเกินกี่ชม. (ปกติ 10)', type: 'number' },
    { key: 'reward_agency_multiplier', value: '5', description: 'กาชาหน่วยงานที่ได้ต่อชั่วโมง (ปกติ 5)', type: 'number' },
  ];

  const { error: seedError } = await supabase.from('system_settings').upsert(settings, { onConflict: 'key' });
  if (seedError) {
    console.error("Failed to seed system_settings:", seedError.message);
  } else {
    console.log("Seeded system settings successfully!");
  }
}

run();
