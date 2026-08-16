import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import './SmartDatePicker.css';

interface SmartTimePickerProps {
  value: string;
  onChange: (time: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function SmartTimePicker({ 
  value, 
  onChange, 
  onBlur, 
  placeholder = "เวลา", 
  disabled = false,
  className = "smart-datepicker-input premium-input",
  style
}: SmartTimePickerProps) {
  const [timeStr, setTimeStr] = useState(value);

  // Sync internal state with external value prop
  useEffect(() => {
    setTimeStr(value || '');
  }, [value]);

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

    // If fully typed (4 digits), update immediately
    if (val.length === 4) {
      const h = parseInt(val.slice(0, 2), 10);
      const m = parseInt(val.slice(2), 10);
      
      // Validate time
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        onChange(formatted);
      }
    } else if (val.length === 0) {
       onChange('');
    }
  };

  const handleTimeBlur = () => {
    // Validate on blur and correct incomplete entries
    if (!timeStr) {
      onChange('');
      if (onBlur) onBlur();
      return;
    }
    
    const val = timeStr.replace(':', '');
    if (val.length === 1 || val.length === 2) {
      // User typed just hours, e.g. "8" or "15"
      const h = parseInt(val, 10);
      if (h >= 0 && h <= 23) {
        const finalTimeStr = `${h.toString().padStart(2, '0')}:00`;
        setTimeStr(finalTimeStr);
        onChange(finalTimeStr);
      } else {
        // Invalid, reset
        setTimeStr(value || '');
      }
    } else if (val.length === 3) {
      // User typed HMM, e.g. "830" -> 08:30
      const h = parseInt(val.slice(0, 1), 10);
      const m = parseInt(val.slice(1), 10);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        const finalTimeStr = `0${h}:${m.toString().padStart(2, '0')}`;
        setTimeStr(finalTimeStr);
        onChange(finalTimeStr);
      } else {
        setTimeStr(value || '');
      }
    } else if (val.length === 4) {
      const h = parseInt(val.slice(0, 2), 10);
      const m = parseInt(val.slice(2), 10);
      if (h > 23 || m > 59) {
         // Invalid, reset to original
         setTimeStr(value || '');
      } else {
         onChange(timeStr);
      }
    }
    
    if (onBlur) {
      onBlur();
    }
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0, width: '120px', ...style }}>
      <Clock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
      <input
        type="text"
        value={timeStr}
        onChange={handleTimeChange}
        onBlur={handleTimeBlur}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        style={{ paddingLeft: '2.25rem', textAlign: 'center', width: '100%', paddingRight: '0.5rem' }}
      />
    </div>
  );
}
