'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CustomSelect = ({ options, value, onChange, placeholder }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOptionLabel = options.find((option) => option.value === value)?.label;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const adjustPosition = useCallback(() => {
    if (!listRef.current || !buttonRef.current) return;
    const btnRect = buttonRef.current.getBoundingClientRect();
    const list = listRef.current;

    list.style.top = `${btnRect.bottom + 4}px`;
    list.style.left = `${btnRect.left}px`;
    list.style.width = 'auto';

    requestAnimationFrame(() => {
      const listRect = list.getBoundingClientRect();
      const overflow = listRect.right - window.innerWidth + 8;
      if (overflow > 0) {
        list.style.left = `${Math.max(8, btnRect.left - overflow)}px`;
      }
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      adjustPosition();
    }
  }, [isOpen, adjustPosition]);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={selectRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-8 items-center justify-between gap-2 rounded-md border border-purple-500/30 bg-slate-700/50 px-3 text-sm text-white sm:h-9 w-fit whitespace-nowrap"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedOptionLabel || placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          className="fixed z-50 whitespace-nowrap overflow-hidden rounded-md border border-purple-500/50 bg-slate-800 shadow-lg"
          role="listbox"
        >
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm text-white hover:bg-purple-700/50 ${
                option.value === value ? 'bg-purple-900/60' : ''
              }`}
              role="option"
              aria-selected={option.value === value}
            >
              <span>{option.label}</span>
              {option.value === value && <Check className="h-4 w-4 flex-shrink-0" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
