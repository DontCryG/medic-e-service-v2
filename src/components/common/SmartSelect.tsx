import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './SmartSelect.css';

export interface SmartSelectOption {
  value: string;
  label: string;
}

export interface SmartSelectProps {
  options: SmartSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function SmartSelect({
  options,
  value,
  onChange,
  placeholder = 'กรุณาเลือก...',
  searchable = false,
  disabled = false,
  className = ''
}: SmartSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 10);
      }
      
      // Highlight currently selected item
      const index = options.findIndex(opt => opt.value === value);
      setHighlightedIndex(index >= 0 ? index : 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Scroll to highlighted item
  useEffect(() => {
    if (isOpen && optionsRef.current && highlightedIndex >= 0) {
      const optionElements = optionsRef.current.querySelectorAll('.smart-select-option');
      const highlightedElement = optionElements[highlightedIndex] as HTMLElement;
      
      if (highlightedElement) {
        const container = optionsRef.current;
        const containerHeight = container.clientHeight;
        const scrollTop = container.scrollTop;
        const elementTop = highlightedElement.offsetTop;
        const elementHeight = highlightedElement.offsetHeight;

        if (elementTop < scrollTop) {
          container.scrollTop = elementTop;
        } else if (elementTop + elementHeight > scrollTop + containerHeight) {
          container.scrollTop = elementTop + elementHeight - containerHeight;
        }
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        } else if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          e.preventDefault();
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          containerRef.current?.focus();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        }
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        break;
    }
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div 
      className={`smart-select-container ${className}`} 
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <div 
        className={`smart-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={toggleDropdown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={selectedOption ? 'smart-select-value' : 'smart-select-placeholder'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className="smart-select-icon" />
      </div>

      {isOpen && (
        <div className="smart-select-dropdown">
          {searchable && (
            <div className="smart-select-search-container">
              <input
                ref={searchInputRef}
                type="text"
                className="smart-select-search-input"
                placeholder="ค้นหา..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  // Prevent input from eating ArrowUp/Down and Enter
                  if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
                    e.preventDefault();
                    handleKeyDown(e);
                  }
                }}
              />
            </div>
          )}

          <div className="smart-select-options" ref={optionsRef} role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  className={`smart-select-option 
                    ${option.value === value ? 'selected' : ''} 
                    ${index === highlightedIndex ? 'highlighted' : ''}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {option.label}
                  </span>
                  {option.value === value && <Check size={16} />}
                </div>
              ))
            ) : (
              <div className="smart-select-empty">ไม่พบข้อมูล</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
