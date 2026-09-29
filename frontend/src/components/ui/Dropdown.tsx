import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DropdownProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

export function Dropdown({ label, icon, value, options, onChange }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative group z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "glass-card flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-colors w-full text-left outline-none",
          isOpen ? "border-accent ring-1 ring-accent/30 bg-panel" : "hover:bg-panel border-white/5",
          "focus:border-accent focus:ring-1 focus:ring-accent/30"
        )}
      >
        <div className="text-text-muted">{icon}</div>
        <div className="flex flex-col pr-4 flex-1">
          <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
          <span className="text-sm font-medium">{selectedOption?.label || value}</span>
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-text-muted transition-transform duration-200",
            isOpen ? "transform rotate-180 text-accent" : "opacity-50 group-hover:opacity-100"
          )} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[200px] glass-card shadow-2xl rounded-lg py-1 border border-white/10 bg-background overflow-hidden transition-all duration-200 origin-top">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors",
                value === opt.value 
                  ? "bg-accent/10 text-accent font-medium" 
                  : "text-text-primary hover:bg-accent/5 hover:text-accent"
              )}
            >
              {opt.label}
              {value === opt.value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
