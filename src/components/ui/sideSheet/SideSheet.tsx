'use client';

import { X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import styles from './SideSheet.module.css';

interface SideSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

export const SideSheet: React.FC<SideSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  width = 'md',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      const raf = requestAnimationFrame(() => setVisible(false));
      return () => cancelAnimationFrame(raf);
    }

    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      sheetRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.overlay} ${visible ? styles.overlayVisible : ''}`}
      onClick={onClose}
      aria-modal
      role="dialog"
      aria-labelledby="sidesheet-title"
    >
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${styles[width]} ${visible ? styles.sheetVisible : ''}`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 id="sidesheet-title" className={styles.title}>
              {title}
            </h2>
            {description && <p className={styles.description}>{description}</p>}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close panel">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
};
