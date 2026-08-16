import { useState, useEffect } from 'react';
import SmartDatePicker from './SmartDatePicker';
import { Clock } from 'lucide-react';

interface SmartDateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

export default function SmartDateTimePicker({ value, onChange, placeholder }: SmartDateTimePickerProps) {
  const [timeStr, setTimeStr] = useState('');

  // Sync internal state with external value prop
  useEffect(() => {
    if (value) {
      const hh = value.getHours().toString().padStart(2, '0');
      const mm = value.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hh}:${mm}`);
    } else {
      setTimeStr('');
    }
  }, [value]);

  const handleDateChange = (date: Date | null) => {
    if (!date) {
      onChange(null);
      return;
    }
    // Create a new date object to prevent mutating the original
    const newDate = new Date(date);
    
    // Preserve existing time if available
    if (timeStr && timeStr.length === 5) {
      const [h, m] = timeStr.split(':');
      newDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    } else if (value) {
      newDate.setHours(value.getHours(), value.getMinutes(), 0, 0);
    } else {
      // Default time when no time is selected yet
      newDate.setHours(0, 0, 0, 0);
    }
    
    onChange(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow typing only numbers
    let val = e.target.value.replace(/[^0-9]/g, '');
    
    // Limit to 4 digits
    if (val.length > 4) val = val.slice(0, 4);
    
    let formatted = val;
    if (val.length >= 3) {
      // Format as HH:MM
      formatted = `${val.slice(0, 2)}:${val.slice(2)}`;
    }
    
    setTimeStr(formatted);

    // If fully typed (4 digits), update the date object immediately
    if (val.length === 4) {
      const h = parseInt(val.slice(0, 2), 10);
      const m = parseInt(val.slice(2), 10);
      
      // Validate time
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        // If date exists, update its time
        if (value) {
          const newDate = new Date(value);
          newDate.setHours(h, m, 0, 0);
          onChange(newDate);
        } else {
          // If no date exists yet, create one for today with this time
          const newDate = new Date();
          newDate.setHours(h, m, 0, 0);
          onChange(newDate);
        }
      }
    }
  };

  const handleTimeBlur = () => {
    // Validate on blur and correct incomplete entries
    if (!timeStr) return;
    
    const val = timeStr.replace(':', '');
    if (val.length === 1 || val.length === 2) {
      // User typed just hours, e.g. "8" or "15"
      const h = parseInt(val, 10);
      if (h >= 0 && h <= 23) {
        const finalTimeStr = `${h.toString().padStart(2, '0')}:00`;
        setTimeStr(finalTimeStr);
        
        const newDate = value ? new Date(value) : new Date();
        newDate.setHours(h, 0, 0, 0);
        onChange(newDate);
      } else {
        // Invalid, reset
        setTimeStr(value ? `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}` : '');
      }
    } else if (val.length === 3) {
      // User typed HMM, e.g. "830" -> 08:30
      const h = parseInt(val.slice(0, 1), 10);
      const m = parseInt(val.slice(1), 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        const finalTimeStr = `0${h}:${m.toString().padStart(2, '0')}`;
        setTimeStr(finalTimeStr);
        
        const newDate = value ? new Date(value) : new Date();
        newDate.setHours(h, m, 0, 0);
        onChange(newDate);
      } else {
        setTimeStr(value ? `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}` : '');
      }
    } else if (val.length === 4) {
      const h = parseInt(val.slice(0, 2), 10);
      const m = parseInt(val.slice(2), 10);
      if (h > 23 || m > 59) {
         // Invalid, reset to original
         setTimeStr(value ? `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}` : '');
      }
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: '150px' }}>
        <SmartDatePicker
          selected={value}
          onChange={handleDateChange}
          placeholderText={placeholder || "เลือกวันที่"}
        />
      </div>
      <div style={{ width: '100px', position: 'relative', flexShrink: 0 }}>
        <Clock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
        <input
          type="text"
          value={timeStr}
          onChange={handleTimeChange}
          onBlur={handleTimeBlur}
          placeholder="เวลา"
          className="smart-datepicker-input"
          style={{ paddingLeft: '2.25rem', textAlign: 'center', width: '100%', paddingRight: '0.5rem' }}
        />
      </div>
    </div>
  );
}
