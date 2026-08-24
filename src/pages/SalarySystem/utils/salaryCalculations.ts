export interface DutyLog {
  id: string;
  discord_id: string;
  clock_in: string;
  clock_out: string | null;
  total_break_minutes: number;
  total_duty_minutes: number;
  duty_type?: string;
}

export interface LeaveRequest {
  id: string;
  discord_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface StoryLog {
  id: string;
  discord_id: string;
  story_type: string;
  start_time: string;
  end_time: string | null;
}

export interface QueueManagerLog {
  id: string;
  discord_id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
}

export interface UserPosition {
  name: string;
  rank: number;
  oc_rate?: number;
}

export interface UserInfo {
  ic_name: string;
  discord_id: string;
  positions: UserPosition | null;
}

export interface SalaryResult {
  discord_id: string;
  ic_name: string;
  position_name: string;
  total_hours: number;
  total_minutes: number;
  ic_salary: number;
  oc_points: number;
  oc_money: number;
  gacha_ic: number;
  agency_gacha: number;
  gacha_promote: number;
  gacha_premium: number;
  coins: number;
  story_count: number;
  story_money: number;
  mentor_money: number;
}

// Hardcoded Rates based on old rules as fallback
const POSITION_RATES: Record<number, { ic_rate: number; oc_rate: number }> = {
  1: { ic_rate: 70000, oc_rate: 25 }, // ผู้อำนวยการ
  2: { ic_rate: 70000, oc_rate: 25 }, // รองผู้อำนวยการ
  3: { ic_rate: 60000, oc_rate: 15 }, // แพทย์ชำนาญการ
  4: { ic_rate: 55000, oc_rate: 10 }, // แพทย์ทั่วไป
  5: { ic_rate: 55000, oc_rate: 10 }, // พยาบาล (assuming same as Doctor)
  6: { ic_rate: 50000, oc_rate: 0 },  // นักศึกษาแพทย์
};

// Fallback rates if rank is missing
const DEFAULT_RATES = { ic_rate: 50000, oc_rate: 0 };

export function calculateSalary(
  users: UserInfo[],
  dutyLogs: DutyLog[],
  leaveLogs: LeaveRequest[] = [],
  storyLogs: StoryLog[] = [],
  queueManagerLogs: QueueManagerLog[] = [],
  settings: Record<string, any> = {}
): SalaryResult[] {
  
  // Group duty logs by discord_id
  const userLogs = dutyLogs.reduce((acc, log) => {
    if (!acc[log.discord_id]) acc[log.discord_id] = [];
    acc[log.discord_id].push(log);
    return acc;
  }, {} as Record<string, DutyLog[]>);

  // Group leave logs by discord_id
  const userLeaves = leaveLogs.reduce((acc, leave) => {
    if (!acc[leave.discord_id]) acc[leave.discord_id] = [];
    acc[leave.discord_id].push(leave);
    return acc;
  }, {} as Record<string, LeaveRequest[]>);

  // Group story logs by discord_id
  const userStories = storyLogs.reduce((acc, story) => {
    if (!acc[story.discord_id]) acc[story.discord_id] = [];
    acc[story.discord_id].push(story);
    return acc;
  }, {} as Record<string, StoryLog[]>);

  // Group queue manager logs by discord_id
  const userQueueManager = queueManagerLogs.reduce((acc, log) => {
    if (!acc[log.discord_id]) acc[log.discord_id] = [];
    acc[log.discord_id].push(log);
    return acc;
  }, {} as Record<string, QueueManagerLog[]>);

  let pooledGachaIC = 0;
  let pooledCoins = 0;
  let activeUsersCount = 0;

  const initialResults = users.map(user => {
    const logs = userLogs[user.discord_id] || [];
    
    // Calculate total minutes
    let totalMinutes = logs.reduce((sum, log) => sum + (log.total_duty_minutes || 0), 0);
    
    // Check for 7-day bonus
    const daysWorked = new Set(logs.map(log => {
      const d = new Date(log.clock_in);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }));
    
    // Check if they have any APPROVED leaves in this period
    const hasLeaves = (userLeaves[user.discord_id] || []).some(
      leave => leave.status === 'approved'
    );
    
    // Only give the 3 hour bonus if they worked 7 days AND have no approved leaves
    if (daysWorked.size >= 7 && !hasLeaves) {
      totalMinutes += 3 * 60; 
    }

    // Check for Queue Manager Bonus (2 hours for every day >= 120 mins)
    const qmLogs = userQueueManager[user.discord_id] || [];
    const qmDailyMins: Record<string, number> = {};
    qmLogs.forEach(log => {
      const d = new Date(log.start_time);
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      qmDailyMins[dayKey] = (qmDailyMins[dayKey] || 0) + (log.duration_minutes || 0);
    });

    Object.values(qmDailyMins).forEach(mins => {
      if (mins >= 120) {
        totalMinutes += 120; // +2 hours bonus
      }
    });

    // A3: Drop fractional minutes to get total hours
    const totalHours = Math.floor(totalMinutes / 60);

    const rank = user.positions?.rank || 99;
    let rates = POSITION_RATES[rank] || DEFAULT_RATES;
    
    // Use dynamic ic_rate from database if available, fallback to old hardcoded
    const db_ic_rate = (user.positions as any)?.ic_rate;
    if (db_ic_rate !== undefined && db_ic_rate !== null && db_ic_rate > 0) {
      rates = { ...rates, ic_rate: db_ic_rate };
    }
    
    // Use dynamic oc_rate from database if available
    const db_oc_rate = (user.positions as any)?.oc_rate;
    if (db_oc_rate !== undefined && db_oc_rate !== null) {
      rates = { ...rates, oc_rate: db_oc_rate };
    }
    
    // A1: IC = Base * Total Hours
    const ic_salary = rates.ic_rate * totalHours;

    // A2: OC starts at 28
    const oc_points = Math.max(0, totalHours - 27);
    const oc_money = oc_points * rates.oc_rate;

    // Calculate Story Money
    const stories = userStories[user.discord_id] || [];
    let story_count = 0;
    let story_money = 0;
    
    stories.forEach(story => {
      story_count++;
      if (story.story_type === 'ไฟต์ตรง (1 คน)') story_money += settings.story_fight_1 || 200000;
      else if (story.story_type === 'ไฟต์ตรง (2 คน)') story_money += settings.story_fight_2 || 100000;
      else if (story.story_type === 'บั๊มรถ (1 คน)') story_money += settings.story_rob_1 || 350000;
      else if (story.story_type === 'บั๊มรถ (2 คน)') story_money += settings.story_rob_2 || 175000;
      else if (story.story_type === 'ปะทะ') story_money += settings.story_clash || 200000;
      else if (story.story_type === 'ปล้น') story_money += settings.story_heist || 100000;
      else if (story.story_type === 'ตีวง') story_money += settings.story_circle || 150000;
    });

    let gacha_ic = 0;
    let agency_gacha = 0;
    let gacha_promote = 0;
    let gacha_premium = 0;
    let coins = 0;
    let mentor_money = 0;

    // Calculate mentor money
    logs.forEach(log => {
      if (log.duty_type === 'mentor') {
        mentor_money += 500000;
      }
    });

    if (totalHours >= 20) {
      gacha_ic = settings.reward_20h_gacha_ic !== undefined ? settings.reward_20h_gacha_ic : 20;
      coins = settings.reward_20h_coins !== undefined ? settings.reward_20h_coins : 20;
      gacha_premium = settings.reward_20h_gacha_premium !== undefined ? settings.reward_20h_gacha_premium : 3;
      agency_gacha = settings.reward_20h_agency_gacha !== undefined ? settings.reward_20h_agency_gacha : 50;
    } else if (totalHours > 0) {
      gacha_ic = settings.reward_1h_gacha_ic !== undefined ? settings.reward_1h_gacha_ic : 10;
      coins = settings.reward_1h_coins !== undefined ? settings.reward_1h_coins : 5;
      
      const agencyBase = settings.reward_agency_base_hours !== undefined ? settings.reward_agency_base_hours : 10;
      const agencyMult = settings.reward_agency_multiplier !== undefined ? settings.reward_agency_multiplier : 5;
      
      if (totalHours > agencyBase) {
        agency_gacha = (totalHours - agencyBase) * agencyMult;
      }
    } else {
      // Absent (0 hours)
      pooledGachaIC += 10;
      pooledCoins += 5;
    }

    // Gacha Promote (21-30 hours)
    if (totalHours >= 21) {
      const promoteTable: Record<number, number> = {
        21: 30, 22: 40, 23: 50, 24: 60, 25: 70, 26: 80, 27: 100, 28: 120, 29: 150, 30: 180
      };
      
      for (let h = 21; h <= Math.min(totalHours, 30); h++) {
        gacha_promote += promoteTable[h];
      }
    }

    if (totalHours > 0) activeUsersCount++;

    return {
      discord_id: user.discord_id,
      ic_name: user.ic_name,
      position_name: user.positions?.name || 'Unknown',
      total_hours: totalHours,
      total_minutes: totalMinutes,
      ic_salary,
      oc_points,
      oc_money,
      gacha_ic,
      agency_gacha,
      gacha_promote,
      gacha_premium,
      coins,
      story_count,
      story_money,
      mentor_money,
    };
  });

  // Step 5: Distribute pooled items among active workers
  const finalResults = initialResults.map(res => {
    if (res.total_hours > 0 && activeUsersCount > 0) {
      // Assuming rounding down the shared pool items
      res.gacha_ic += Math.floor(pooledGachaIC / activeUsersCount);
      res.coins += Math.floor(pooledCoins / activeUsersCount);
    }
    return res;
  });

  // Sort by Rank, then by hours descending
  return finalResults.sort((a, b) => {
    const rankA = users.find(u => u.discord_id === a.discord_id)?.positions?.rank || 99;
    const rankB = users.find(u => u.discord_id === b.discord_id)?.positions?.rank || 99;
    
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    
    // If rank is the same, sort by total_hours descending
    return b.total_hours - a.total_hours;
  });
}
