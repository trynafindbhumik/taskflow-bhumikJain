'use client';

import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

import styles from './DatePicker.module.css';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatDisplay(iso: string): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map(Number);
  return `${MONTHS[month - 1].slice(0, 3)} ${day}, ${year}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Pick a date',
  disabled = false,
  min,
}) => {
  const today = new Date();
  const parsed = value ? new Date(value + 'T00:00:00') : null;

  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const calHeight = 340;
    const calWidth = 280;

    let top = rect.bottom + 6;
    let left = rect.left;
    let transformOrigin = 'top left';

    // Vertical smart flip
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < calHeight && spaceAbove > calHeight) {
      top = rect.top - calHeight - 6;
      transformOrigin = 'bottom left';
    }

    // Horizontal safe area
    if (left + calWidth > viewportWidth - 16) {
      left = Math.max(16, viewportWidth - calWidth - 16);
      transformOrigin = transformOrigin.replace('left', 'right');
    }

    setPopoverStyle({
      position: 'fixed',
      top,
      left,
      width: calWidth,
      zIndex: 9999,
      transformOrigin,
    });
    setOpen(true);
  };

  const openCalendar = () => {
    if (disabled) return;
    calculatePosition();
  };

  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleScroll = () => setOpen(false);

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const selectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const minDate = min ? new Date(min + 'T00:00:00') : null;

  const isDisabledDay = (day: number) => {
    if (!minDate) return false;
    return new Date(viewYear, viewMonth, day) < minDate;
  };

  const isSelected = (day: number) => {
    if (!parsed) return false;
    return (
      parsed.getFullYear() === viewYear &&
      parsed.getMonth() === viewMonth &&
      parsed.getDate() === day
    );
  };

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  const popover = open ? (
    <div
      ref={popoverRef}
      id={`datepicker-${id}`}
      className={styles.popover}
      style={popoverStyle}
      role="dialog"
      aria-label="Date picker"
    >
      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={prevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft size={15} />
        </button>
        <span className={styles.monthYear}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button type="button" className={styles.navBtn} onClick={nextMonth} aria-label="Next month">
          <ChevronRight size={15} />
        </button>
      </div>

      <div className={styles.grid}>
        {DAYS.map((d) => (
          <span key={d} className={styles.dayHeader}>
            {d}
          </span>
        ))}
        {Array.from({ length: firstDay }, (_, i) => (
          <span key={`e-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dis = isDisabledDay(day);
          const sel = isSelected(day);
          const tod = isToday(day);
          return (
            <button
              key={day}
              type="button"
              className={[
                styles.day,
                sel ? styles.daySelected : '',
                tod && !sel ? styles.dayToday : '',
                dis ? styles.dayDisabled : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => !dis && selectDay(day)}
              disabled={dis}
              aria-label={`${MONTHS[viewMonth]} ${day}, ${viewYear}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.todayBtn}
          onClick={() => {
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            onChange(`${today.getFullYear()}-${mm}-${dd}`);
            setOpen(false);
          }}
        >
          Today
        </button>
        {value && (
          <button
            type="button"
            className={styles.clearFooterBtn}
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}

      <button
        id={id}
        ref={triggerRef}
        type="button"
        className={[styles.trigger, open ? styles.triggerOpen : '', disabled ? styles.disabled : '']
          .filter(Boolean)
          .join(' ')}
        onClick={openCalendar}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Calendar size={15} className={styles.calIcon} />
        <span className={value ? styles.valueText : styles.placeholder}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        {value && (
          <span className={styles.clearBtn} onClick={clear} role="button" aria-label="Clear date">
            <X size={13} />
          </span>
        )}
      </button>

      {typeof window !== 'undefined' && open ? createPortal(popover, document.body) : null}
    </div>
  );
};
