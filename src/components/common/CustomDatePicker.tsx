import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CustomDatePicker({ value, onChange, placeholder = 'เลือกวันที่' }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });
  
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleDateClick = (day: number) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Format to YYYY-MM-DD (local timezone offset handled by adjusting before toISOString or manually formatting)
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, '0');
    const dd = String(selected.getDate()).padStart(2, '0');
    
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  // getDay() returns 0 (Sun) to 6 (Sat). We want Monday (1) to be 0, and Sunday (0) to be 6.
  const rawFirstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = (rawFirstDay + 6) % 7;
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const weekDays = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

  const displayValue = value 
    ? `${new Date(value).getDate()} ${monthNames[new Date(value).getMonth()]} ${new Date(value).getFullYear() + 543}`
    : '';

  return (
    <div className="custom-datepicker" style={{ position: 'relative', display: 'inline-block', width: '200px' }} ref={popupRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          background: '#fff',
          cursor: 'pointer',
          color: value ? '#1e293b' : '#94a3b8',
          fontSize: '0.9rem',
          userSelect: 'none'
        }}
      >
        <CalendarIcon size={16} />
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayValue || placeholder}
        </span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '0.5rem',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          padding: '1rem',
          width: '280px',
          zIndex: 9999
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button 
              onClick={prevMonth}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <ChevronLeft size={20} color="#475569" />
            </button>
            <div style={{ fontWeight: 600, color: '#1e293b' }}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear() + 543}
            </div>
            <button 
              onClick={nextMonth}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <ChevronRight size={20} color="#475569" />
            </button>
          </div>

          {/* Days Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '0.5rem' }}>
            {weekDays.map(day => (
              <div key={day} style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {blanks.map(blank => (
              <div key={`blank-${blank}`} />
            ))}
            {days.map(day => {
              const isSelected = value && new Date(value).getDate() === day && new Date(value).getMonth() === currentMonth.getMonth() && new Date(value).getFullYear() === currentMonth.getFullYear();
              const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth.getMonth() && new Date().getFullYear() === currentMonth.getFullYear();
              
              return (
                <div 
                  key={day}
                  onClick={() => handleDateClick(day)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '32px',
                    borderRadius: '50%',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    background: isSelected ? '#0ea5e9' : 'transparent',
                    color: isSelected ? '#fff' : (isToday ? '#0ea5e9' : '#334155'),
                    fontWeight: isSelected || isToday ? 600 : 400,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={() => {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                onChange(`${yyyy}-${mm}-${dd}`);
                setIsOpen(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#0ea5e9',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              วันนี้
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
