import { clsx } from 'clsx';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
};

export const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTimer = () => {
    timerRef.current = setTimeout(() => onClose(id), 4500);
  };

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={clsx(styles.toast, styles[type])}
      role="alert"
      aria-live="polite"
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
    >
      <span className={styles.icon}>{ICONS[type]}</span>
      <p className={styles.message}>{message}</p>
      <button className={styles.closeBtn} onClick={() => onClose(id)} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
};
