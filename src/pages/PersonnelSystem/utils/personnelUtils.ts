export interface SalaryRate {
  position_name: string;
  rank?: number;
}

export const getPositionRank = (position: string | undefined | null, salaryRates: SalaryRate[] = []): number => {
  if (!position) return 99;
  const cleanPosition = position.replace(' (พ้นสภาพ)', '').trim();
  const rateData = salaryRates.find(r => r.position_name === cleanPosition);
  return rateData ? Number(rateData.rank ?? 99) : 99;
};

export const getInitial = (name: string | undefined | null): string => name ? name.charAt(0).toUpperCase() : '?';
