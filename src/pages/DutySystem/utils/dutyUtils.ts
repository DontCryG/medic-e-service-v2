export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const formatDateString = (isoString: string | null | undefined): string => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('th-TH', { 
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const getInitial = (name: string | null | undefined): string => name ? name.charAt(0).toUpperCase() : 'M';
