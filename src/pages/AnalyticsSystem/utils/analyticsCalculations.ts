import type { 
  DateRangePreset, 
  HeatmapCell, 
  ShortageInsight, 
  TrendDataPoint, 
  PositionBudgetBreakdown, 
  ExecutiveKPIs 
} from '../types';
import type { DutyLog, SalaryResult } from '@/pages/SalarySystem/utils/salaryCalculations';

export const THAI_DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
export const THAI_SHORT_DAYS = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];

/**
 * Returns date range boundaries for preset and its corresponding previous comparison period
 */
export function getDateRangeFromPreset(
  preset: DateRangePreset,
  customStart?: Date,
  customEnd?: Date
): { current: { start: Date; end: Date }; previous: { start: Date; end: Date } } {
  const now = new Date();

  let start: Date;
  let end: Date;

  switch (preset) {
    case 'this_week': {
      // Monday of this week
      const currentDay = now.getDay();
      const diffToMonday = (currentDay + 6) % 7;
      start = new Date(now);
      start.setDate(now.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'last_week': {
      // Monday of last week
      const currentDay = now.getDay();
      const diffToMonday = (currentDay + 6) % 7;
      start = new Date(now);
      start.setDate(now.getDate() - diffToMonday - 7);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'this_month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
    case 'last_month': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case 'last_30_days': {
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      start = new Date(now);
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'custom':
    default: {
      start = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end = customEnd ? new Date(customEnd) : new Date(now);
      end.setHours(23, 59, 59, 999);
      break;
    }
  }

  // Calculate previous period of equal duration
  const durationMs = end.getTime() - start.getTime() + 1;
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs + 1);

  return {
    current: { start, end },
    previous: { start: prevStart, end: prevEnd }
  };
}

/**
 * Computes 7x24 density matrix from duty logs
 */
export function computeHeatmapMatrix(
  logs: DutyLog[],
  startDate: Date,
  endDate: Date
): { matrix: HeatmapCell[][]; insights: ShortageInsight[] } {
  // Initialize 7 days x 24 hours grid
  // dayIndex: 0 = Mon, ..., 6 = Sun
  const totalMinutesGrid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  const uniqueDoctorsGrid: Set<string>[][] = Array.from({ length: 7 }, () => 
    Array.from({ length: 24 }, () => new Set<string>())
  );

  // Count occurrences of each day of week in the date range
  const dayOccurrences: number[] = Array(7).fill(0);
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const endCursor = new Date(endDate);
  endCursor.setHours(23, 59, 59, 999);

  while (cursor <= endCursor) {
    const dayOfWeek = (cursor.getDay() + 6) % 7; // 0 = Mon
    dayOccurrences[dayOfWeek] += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  // Ensure minimum divisor is 1 to avoid divide by zero
  for (let d = 0; d < 7; d++) {
    if (dayOccurrences[d] === 0) dayOccurrences[d] = 1;
  }

  const rangeStartMs = startDate.getTime();
  const rangeEndMs = endDate.getTime();
  const nowMs = Date.now();

  // Accumulate minutes from each duty log
  for (const log of logs) {
    const logStartMs = new Date(log.clock_in).getTime();
    if (isNaN(logStartMs) || logStartMs > rangeEndMs) continue;

    const rawEndMs = log.clock_out ? new Date(log.clock_out).getTime() : nowMs;
    const logEndMs = isNaN(rawEndMs) ? nowMs : rawEndMs;
    if (logEndMs < rangeStartMs) continue;

    const effectiveStartMs = Math.max(logStartMs, rangeStartMs);
    const effectiveEndMs = Math.min(logEndMs, rangeEndMs);
    if (effectiveEndMs <= effectiveStartMs) continue;

    // Step hour by hour
    let currentMs = effectiveStartMs;
    while (currentMs < effectiveEndMs) {
      const currentDate = new Date(currentMs);
      const dayIndex = (currentDate.getDay() + 6) % 7; // 0 = Mon
      const hour = currentDate.getHours();

      // End of this hour
      const nextHourDate = new Date(currentDate);
      nextHourDate.setHours(hour + 1, 0, 0, 0);
      const nextHourMs = nextHourDate.getTime();

      const chunkEndMs = Math.min(effectiveEndMs, nextHourMs);
      const minutesInHour = Math.max(0, Math.round((chunkEndMs - currentMs) / 60000));

      totalMinutesGrid[dayIndex][hour] += minutesInHour;
      uniqueDoctorsGrid[dayIndex][hour].add(log.discord_id);

      currentMs = chunkEndMs;
    }
  }

  // Build matrix with average active doctors & density levels
  const matrix: HeatmapCell[][] = [];
  let minAvg = Infinity;
  let maxAvg = -Infinity;
  let maxSlot = { day: 0, hour: 0 };

  const dayTotalHours: number[] = Array(7).fill(0);
  const hourTotalHours: number[] = Array(24).fill(0);

  for (let d = 0; d < 7; d++) {
    const row: HeatmapCell[] = [];
    const occurrences = dayOccurrences[d];

    for (let h = 0; h < 24; h++) {
      const totalMinutes = totalMinutesGrid[d][h];
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
      // Average active doctors during that hour = total logged hours / number of that day in range
      const avgDoctors = Math.round((totalMinutes / (occurrences * 60)) * 10) / 10;

      dayTotalHours[d] += totalHours;
      hourTotalHours[h] += totalHours;

      if (avgDoctors < minAvg) {
        minAvg = avgDoctors;
      }
      if (avgDoctors > maxAvg) {
        maxAvg = avgDoctors;
        maxSlot = { day: d, hour: h };
      }

      // Density Level
      let densityLevel: 0 | 1 | 2 | 3 | 4 = 0;
      if (avgDoctors === 0) densityLevel = 0;
      else if (avgDoctors < 1.5) densityLevel = 1;
      else if (avgDoctors < 3.5) densityLevel = 2;
      else if (avgDoctors < 5.5) densityLevel = 3;
      else densityLevel = 4;

      row.push({
        dayIndex: d,
        dayName: THAI_DAYS[d],
        hour: h,
        hourLabel: `${h.toString().padStart(2, '0')}:00`,
        totalDutyMinutes: totalMinutes,
        totalDutyHours: totalHours,
        avgDoctors,
        densityLevel,
        uniqueDoctorCount: uniqueDoctorsGrid[d][h].size
      });
    }
    matrix.push(row);
  }

  // Generate Insights
  const insights: ShortageInsight[] = [];

  // 1. Critical Shortage Analysis
  // Find the longest block of consecutive hours across the week where average doctors < 1.0
  const lowCoverageHours: number[] = [];
  for (let h = 0; h < 24; h++) {
    const avgAcrossWeek = hourTotalHours[h] / (dayOccurrences.reduce((a, b) => a + b, 0) || 7);
    if (avgAcrossWeek < 1.0) {
      lowCoverageHours.push(h);
    }
  }

  if (lowCoverageHours.length > 0) {
    const startHour = lowCoverageHours[0];
    const endHour = (lowCoverageHours[lowCoverageHours.length - 1] + 1) % 24;
    insights.push({
      type: 'critical_shortage',
      title: 'วิกฤตขาดแคลนแพทย์ (Critical Shortage Window)',
      description: `ช่วงเวลา ${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00 น. มีแพทย์ประจำการเฉลี่ยเพียง ${minAvg} คน เสี่ยงต่อการไม่มีแพทย์รับเคสฉุกเฉินในเมือง`,
      timeRange: `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00 น.`,
      severity: 'danger'
    });
  } else {
    insights.push({
      type: 'critical_shortage',
      title: 'ความต่อเนื่องของเวร (Coverage Stability)',
      description: `ทุกช่วงเวลามีแพทย์ปฏิบัติการขั้นต่ำอย่างน้อย 1 คนขึ้นไป ไม่มีช่วงวิกฤตขาดแคลนรุนแรง`,
      severity: 'success'
    });
  }

  // 2. Peak Hours Analysis
  // Find top hours
  let peakStartHour = 19;
  let peakEndHour = 23;
  let highest3HourAvg = -1;
  for (let h = 0; h < 22; h++) {
    const threeHourSum = (hourTotalHours[h] + hourTotalHours[h + 1] + hourTotalHours[h + 2]);
    if (threeHourSum > highest3HourAvg) {
      highest3HourAvg = threeHourSum;
      peakStartHour = h;
      peakEndHour = (h + 3) % 24;
    }
  }

  insights.push({
    type: 'peak_hours',
    title: 'ช่วงเวลาที่แพทย์หนาแน่นสูงสุด (Peak Duty Window)',
    description: `ช่วงเวลา ${peakStartHour.toString().padStart(2, '0')}:00 - ${peakEndHour.toString().padStart(2, '0')}:00 น. มีอัตราการเข้าเวรพร้อมกันสูงสุดเฉลี่ย ${maxAvg} คน (หนาแน่นสุด: วัน${THAI_DAYS[maxSlot.day]})`,
    timeRange: `${peakStartHour.toString().padStart(2, '0')}:00 - ${peakEndHour.toString().padStart(2, '0')}:00 น.`,
    severity: 'info'
  });

  // 3. Executive Staffing Recommendation
  const quietestDayIndex = dayTotalHours.indexOf(Math.min(...dayTotalHours));
  insights.push({
    type: 'recommendation',
    title: 'คำแนะนำการบริหารกำลังพล (Executive Recommendation)',
    description: `ควรพิจารณาจัดระบบโบนัสเวรดึก (Night Shift Multiplier) หรือเวรพิเศษช่วงวัน${THAI_DAYS[quietestDayIndex]} เพื่อกระจายกำลังพลให้ครอบคลุมตลอด 24 ชม. ลดความหน่วงในการตอบสนองเคส`,
    days: `วัน${THAI_DAYS[quietestDayIndex]}`,
    severity: 'warning'
  });

  return { matrix, insights };
}

/**
 * Computes trend data (daily or weekly buckets)
 */
export function computeTrendData(
  logs: DutyLog[],
  salaryResults: SalaryResult[],
  startDate: Date,
  endDate: Date
): TrendDataPoint[] {
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const trendPoints: TrendDataPoint[] = [];

  // Map each doctor's hourly rate from salaryResults
  const doctorHourlyRateMap = new Map<string, number>();
  for (const sr of salaryResults) {
    if (sr.total_hours > 0) {
      doctorHourlyRateMap.set(sr.discord_id, sr.ic_salary / sr.total_hours);
    }
  }

  if (diffDays <= 14) {
    // Group by Day
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const endCursor = new Date(endDate);
    endCursor.setHours(23, 59, 59, 999);

    while (cursor <= endCursor) {
      const dayStartMs = new Date(cursor).setHours(0, 0, 0, 0);
      const dayEndMs = new Date(cursor).setHours(23, 59, 59, 999);
      const dayOfWeek = (cursor.getDay() + 6) % 7;
      const dayLabel = `${THAI_SHORT_DAYS[dayOfWeek]} ${cursor.getDate()} ${cursor.toLocaleDateString('th-TH', { month: 'short' })}`;

      let totalMinutes = 0;
      let totalBudget = 0;
      const activeDoctors = new Set<string>();

      for (const log of logs) {
        const logStartMs = new Date(log.clock_in).getTime();
        const logEndMs = log.clock_out ? new Date(log.clock_out).getTime() : Date.now();

        if (logEndMs < dayStartMs || logStartMs > dayEndMs) continue;

        const effectiveStartMs = Math.max(logStartMs, dayStartMs);
        const effectiveEndMs = Math.min(logEndMs, dayEndMs);
        const minutes = Math.max(0, Math.round((effectiveEndMs - effectiveStartMs) / 60000));

        totalMinutes += minutes;
        activeDoctors.add(log.discord_id);

        const rate = doctorHourlyRateMap.get(log.discord_id) || 50000;
        totalBudget += (minutes / 60) * rate;
      }

      trendPoints.push({
        key: cursor.toISOString().split('T')[0],
        label: dayLabel,
        budget: Math.round(totalBudget),
        hours: Math.round((totalMinutes / 60) * 10) / 10,
        activeDoctors: activeDoctors.size,
        formattedDate: cursor.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
      });

      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    // Group by Week (7-day intervals)
    let weekIndex = 1;
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const weekStart = new Date(cursor);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      if (weekEnd > endDate) {
        weekEnd.setTime(endDate.getTime());
      }

      const weekStartMs = weekStart.getTime();
      const weekEndMs = weekEnd.getTime();
      const weekLabel = `สัปดาห์ที่ ${weekIndex} (${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1})`;

      let totalMinutes = 0;
      let totalBudget = 0;
      const activeDoctors = new Set<string>();

      for (const log of logs) {
        const logStartMs = new Date(log.clock_in).getTime();
        const logEndMs = log.clock_out ? new Date(log.clock_out).getTime() : Date.now();

        if (logEndMs < weekStartMs || logStartMs > weekEndMs) continue;

        const effectiveStartMs = Math.max(logStartMs, weekStartMs);
        const effectiveEndMs = Math.min(logEndMs, weekEndMs);
        const minutes = Math.max(0, Math.round((effectiveEndMs - effectiveStartMs) / 60000));

        totalMinutes += minutes;
        activeDoctors.add(log.discord_id);

        const rate = doctorHourlyRateMap.get(log.discord_id) || 50000;
        totalBudget += (minutes / 60) * rate;
      }

      trendPoints.push({
        key: `week_${weekIndex}`,
        label: weekLabel,
        budget: Math.round(totalBudget),
        hours: Math.round((totalMinutes / 60) * 10) / 10,
        activeDoctors: activeDoctors.size
      });

      cursor.setDate(cursor.getDate() + 7);
      weekIndex++;
    }
  }

  return trendPoints;
}

/**
 * Computes position budget breakdown
 */
export function computePositionBreakdown(
  salaryResults: SalaryResult[],
  users: any[]
): PositionBudgetBreakdown[] {
  const map = new Map<string, { rank: number; budget: number; hours: number; doctors: Set<string> }>();

  // Map users to positions
  for (const u of users) {
    const posName = u.positions?.name || 'แพทย์ทั่วไป';
    const rank = u.positions?.rank ?? 99;
    if (!map.has(posName)) {
      map.set(posName, { rank, budget: 0, hours: 0, doctors: new Set() });
    }
  }

  let totalAllBudget = 0;
  for (const sr of salaryResults) {
    const posName = sr.position_name || 'แพทย์ทั่วไป';
    const existing = map.get(posName) || { rank: 99, budget: 0, hours: 0, doctors: new Set() };
    existing.budget += sr.ic_salary || 0;
    existing.hours += sr.total_hours || 0;
    if (sr.total_hours > 0) {
      existing.doctors.add(sr.discord_id);
    }
    map.set(posName, existing);
    totalAllBudget += sr.ic_salary || 0;
  }

  const breakdown: PositionBudgetBreakdown[] = [];
  map.forEach((val, key) => {
    if (val.budget > 0 || val.hours > 0) {
      breakdown.push({
        positionName: key,
        rank: val.rank,
        totalBudget: Math.round(val.budget),
        totalHours: Math.round(val.hours * 10) / 10,
        doctorCount: val.doctors.size,
        percentOfTotal: totalAllBudget > 0 ? Math.round((val.budget / totalAllBudget) * 1000) / 10 : 0
      });
    }
  });

  return breakdown.sort((a, b) => a.rank - b.rank || b.totalBudget - a.totalBudget);
}

/**
 * Computes Executive KPIs with growth % compared to previous period
 */
export function computeExecutiveKPIs(
  currentResults: SalaryResult[],
  prevResults: SalaryResult[],
  totalNonResignedUsersCount: number
): ExecutiveKPIs {
  const totalBudget = currentResults.reduce((acc, r) => acc + (r.ic_salary || 0), 0);
  const prevTotalBudget = prevResults.reduce((acc, r) => acc + (r.ic_salary || 0), 0);
  const budgetGrowthPercent = prevTotalBudget > 0
    ? Math.round(((totalBudget - prevTotalBudget) / prevTotalBudget) * 1000) / 10
    : totalBudget > 0 ? 100 : 0;

  const totalDutyHours = Math.round(currentResults.reduce((acc, r) => acc + (r.total_hours || 0), 0) * 10) / 10;
  const prevTotalDutyHours = Math.round(prevResults.reduce((acc, r) => acc + (r.total_hours || 0), 0) * 10) / 10;
  const hoursGrowthPercent = prevTotalDutyHours > 0
    ? Math.round(((totalDutyHours - prevTotalDutyHours) / prevTotalDutyHours) * 1000) / 10
    : totalDutyHours > 0 ? 100 : 0;

  const activeDoctorsCount = currentResults.filter(r => r.total_hours > 0).length;
  const totalDoctorsCount = Math.max(totalNonResignedUsersCount, currentResults.length);
  const activeRatePercent = totalDoctorsCount > 0 
    ? Math.round((activeDoctorsCount / totalDoctorsCount) * 1000) / 10 
    : 0;

  const costPerHour = totalDutyHours > 0 ? Math.round(totalBudget / totalDutyHours) : 0;
  const prevCostPerHour = prevTotalDutyHours > 0 ? Math.round(prevTotalBudget / prevTotalDutyHours) : 0;
  const costPerHourGrowthPercent = prevCostPerHour > 0
    ? Math.round(((costPerHour - prevCostPerHour) / prevCostPerHour) * 1000) / 10
    : 0;

  return {
    totalBudget,
    prevTotalBudget,
    budgetGrowthPercent,
    totalDutyHours,
    prevTotalDutyHours,
    hoursGrowthPercent,
    activeDoctorsCount,
    totalDoctorsCount,
    activeRatePercent,
    costPerHour,
    prevCostPerHour,
    costPerHourGrowthPercent
  };
}
