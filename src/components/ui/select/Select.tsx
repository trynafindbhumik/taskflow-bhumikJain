'use client';

import { ChevronDown, Check } from 'lucide-react';
import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select…',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selected = options.find((o) => o.value === value);

  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Estimate height based on options (with padding)
    const estimatedHeight = Math.min(options.length * 42 + 20, 280);
    const width = Math.max(rect.width, 200);

    let top: number;
    let transformOriginY = 'top';

    const spaceBelow = viewportHeight - rect.bottom - 16;
    const spaceAbove = rect.top - 16;

    if (spaceBelow >= estimatedHeight) {
      // Enough space below → open downward (default)
      top = rect.bottom + 8;
      transformOriginY = 'top';
    } else if (spaceAbove >= estimatedHeight) {
      // Not enough below but enough above → flip upward
      top = rect.top - estimatedHeight - 8;
      transformOriginY = 'bottom';
    } else {
      // Very tight space → open downward and let it scroll internally
      top = rect.bottom + 8;
      transformOriginY = 'top';
    }

    // Horizontal safe positioning
    let left = rect.left;
    if (left + width > viewportWidth - 12) {
      left = viewportWidth - width - 12;
    }
    if (left < 12) left = 12;

    setDropdownStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      maxHeight: `${estimatedHeight}px`,
      zIndex: 9999,
      transformOrigin: `${transformOriginY} left`,
      overflowY: 'auto',
    });

    setOpen(true);
  };

  const openDropdown = () => {
    if (disabled) return;
    calculatePosition();
  };

  // Close on outside click, scroll, or resize
  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;

      setOpen(false);
    };

    const handleScrollOrResize = () => setOpen(false);

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open) {
        setOpen(false);
      } else {
        openDropdown();
      }
    }
    if (e.key === 'Escape') setOpen(false);
  };

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      id={listboxId}
      className={styles.dropdown}
      style={dropdownStyle}
      role="listbox"
    >
      {options.map((option) => (
        <div
          key={option.value}
          className={`${styles.option} ${option.value === value ? styles.optionSelected : ''}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange(option.value);
            setOpen(false);
          }}
          role="option"
          aria-selected={option.value === value}
        >
          <span>{option.label}</span>
          {option.value === value && <Check size={13} className={styles.checkIcon} />}
        </div>
      ))}
    </div>
  ) : null;

  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div
        ref={triggerRef}
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''} ${disabled ? styles.disabled : ''}`}
        onClick={openDropdown}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
      >
        <span className={selected ? styles.selectedText : styles.placeholder}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </div>

      {typeof window !== 'undefined' && open ? createPortal(dropdown, document.body) : null}
    </div>
  );
};
