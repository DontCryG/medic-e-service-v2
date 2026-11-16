export type DateRangePreset = 
  | 'this_week' 
  | 'last_week' 
  | 'this_month' 
  | 'last_month' 
  | 'last_30_days' 
  | 'custom';

export interface HeatmapCell {
  dayIndex: number; // 0 = Mon, 1 = Tue, ..., 6 = Sun
  dayName: string;
  hour: number; // 0 .. 23
  hourLabel: string;
  totalDutyMinutes: number;
  totalDutyHours: number;
  avgDoctors: number;
  densityLevel: 0 | 1 | 2 | 3 | 4; // 0 = 0 doctors, 1 = < 1.5, 2 = 1.5-3.5, 3 = 3.5-5.5, 4 = > 5.5
  uniqueDoctorCount: number;
}

export interface ShortageInsight {
  type: 'critical_shortage' | 'moderate_shortage' | 'peak_hours' | 'recommendation';
  title: string;
  description: string;
  timeRange?: string;
  days?: string;
  severity: 'danger' | 'warning' | 'success' | 'info';
}

export interface TrendDataPoint {
  key: string;
  label: string;
  budget: number;
  hours: number;
  activeDoctors: number;
  formattedDate?: string;
}

export interface PositionBudgetBreakdown {
  positionName: string;
  rank: number;
  totalBudget: number;
  totalHours: number;
  doctorCount: number;
  percentOfTotal: number;
}

export interface ExecutiveKPIs {
  totalBudget: number;
  prevTotalBudget: number;
  budgetGrowthPercent: number;
  
  totalDutyHours: number;
  prevTotalDutyHours: number;
  hoursGrowthPercent: number;

  activeDoctorsCount: number;
  totalDoctorsCount: number;
  activeRatePercent: number;
  
  costPerHour: number;
  prevCostPerHour: number;
  costPerHourGrowthPercent: number;
}

export interface AnalyticsSummary {
  kpis: ExecutiveKPIs;
  heatmapMatrix: HeatmapCell[][]; // 7 days x 24 hours
  trendData: TrendDataPoint[];
  positionBreakdown: PositionBudgetBreakdown[];
  insights: ShortageInsight[];
  dateRange: {
    startDate: Date;
    endDate: Date;
    daysCount: number;
  };
}
