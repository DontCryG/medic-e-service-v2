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

export interface DutyBadgeInfo {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const getDutyBadgeInfo = (
  dutyType: string | null | undefined,
  grantedBy: string | null | undefined
): DutyBadgeInfo | null => {
  if (dutyType === 'exam_doctor') {
    return {
      label: 'สอบหมอใหม่ (+3 ชม.)',
      bgClass: 'bg-blue-100',
      textClass: 'text-blue-700',
      borderClass: 'border-blue-200'
    };
  }
  if (dutyType === 'mentor') {
    return {
      label: 'พี่เลี้ยงหมอใหม่ (+1 ชม.)',
      bgClass: 'bg-pink-100',
      textClass: 'text-pink-700',
      borderClass: 'border-pink-200'
    };
  }
  if (dutyType === 'queue_manager_bonus') {
    return {
      label: 'โบนัสรันคิว (+2 ชม.)',
      bgClass: 'bg-purple-100',
      textClass: 'text-purple-700',
      borderClass: 'border-purple-200'
    };
  }
  if (dutyType === 'manual_add') {
    return {
      label: 'เพิ่มเวรย้อนหลัง',
      bgClass: 'bg-cyan-100',
      textClass: 'text-cyan-700',
      borderClass: 'border-cyan-200'
    };
  }
  if (grantedBy && grantedBy !== 'system') {
    return {
      label: 'เวรพิเศษ (โดย Admin)',
      bgClass: 'bg-amber-100',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-200'
    };
  }
  if (!dutyType || dutyType === 'normal') {
    return null;
  }
  return {
    label: dutyType,
    bgClass: 'bg-indigo-100',
    textClass: 'text-indigo-700',
    borderClass: 'border-indigo-200'
  };
  return null;
};
