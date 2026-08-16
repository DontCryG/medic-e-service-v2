import DatePicker, { registerLocale } from 'react-datepicker';
import type { DatePickerProps } from 'react-datepicker';
import { Calendar } from 'lucide-react';
import { th } from 'date-fns/locale/th';
import 'react-datepicker/dist/react-datepicker.css';
import './SmartDatePicker.css';

// Register Thai locale
registerLocale('th', th);

export interface SmartDatePickerProps extends Omit<DatePickerProps, 'locale'> {
  showIcon?: boolean;
  className?: string;
  wrapperClassName?: string;
}

export default function SmartDatePicker({
  showIcon = true,
  className = '',
  wrapperClassName = '',
  dateFormat = 'dd/MM/yyyy',
  placeholderText = 'วว/ดด/ปปปป',
  ...props
}: SmartDatePickerProps) {
  
  // Custom format to show Buddhist year (พ.ศ.) could be implemented via custom input or 
  // formatting, but we will use the standard date format localized in Thai.
  
  return (
    <div className={`smart-datepicker-container ${wrapperClassName}`}>
      {showIcon && <Calendar size={18} className="smart-datepicker-icon" />}
      <DatePicker
        locale="th"
        dateFormat={dateFormat}
        placeholderText={placeholderText}
        className={`smart-datepicker-input ${showIcon ? 'has-icon' : ''} ${className}`}
        wrapperClassName="smart-datepicker-wrapper"
        portalId="root"
        {...(props as any)}
      />
    </div>
  );
}
