'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useRef, useEffect, useState } from 'react';
import { clsx } from 'clsx';

export interface LoftSelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface LoftSelectProps<T extends string = string> {
  value: T;
  options: LoftSelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  /** Compact style for panels (smaller padding/font) */
  compact?: boolean;
  /** Optional label above the select */
  label?: string;
  /** Placeholder when no value (optional) */
  placeholder?: string;
}

export function LoftSelect<T extends string = string>({
  value,
  options,
  onChange,
  className,
  compact = false,
  label,
  placeholder,
}: LoftSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? placeholder ?? value;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {label && (
        <label className="text-xs font-black block mb-1 tracking-widest text-gray-500 uppercase">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          'w-full flex items-center justify-between bg-white border-2 border-loft-black font-black uppercase tracking-wider cursor-pointer',
          'hover:bg-yellow-50 focus:border-loft-yellow focus:bg-yellow-50 outline-none text-center rounded-none',
          'transition-colors text-loft-black',
          compact
            ? 'py-2 px-3 text-xs'
            : 'py-3 px-4 text-sm'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={displayLabel}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDownIcon
          className={clsx(
            'flex-shrink-0 text-loft-black transition-transform',
            compact ? 'h-4 w-4 ml-2' : 'h-5 w-5 ml-2',
            open && 'rotate-180'
          )}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 bg-white border-2 border-loft-black shadow-loft-sm max-h-60 overflow-auto py-1"
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value as T);
                setOpen(false);
              }}
              className={clsx(
                'cursor-pointer font-black uppercase tracking-wider px-4 transition-colors',
                compact ? 'py-2 text-xs' : 'py-3 text-sm',
                opt.value === value
                  ? 'bg-loft-yellow text-loft-black'
                  : 'hover:bg-yellow-50 text-loft-black'
              )}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
