'use client';

import { Moon, Sun, LayoutDashboard } from 'lucide-react';
import React from 'react';

import { useTheme } from '@/components/providers/themeProvider/ThemeProvider';

import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.container}>
      <div className={styles.leftPane}>
        <div className={styles.logo}>
          <LayoutDashboard size={22} strokeWidth={2.5} />
          <span>TaskFlow</span>
        </div>

        <div className={styles.content}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          {children}
        </div>

        <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <div className={styles.rightPane} aria-hidden>
        <div className={styles.overlay} />
        <div className={styles.panelContent}>
          <div className={styles.badge}>✦ Task Management</div>
          <h2 className={styles.panelTitle}>
            Ship faster,
            <br />
            stress less.
          </h2>
          <p className={styles.panelText}>
            The modern workspace for teams who move quickly. Organize projects, track tasks, and hit
            every deadline.
          </p>
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>10k+</span>
              <span className={styles.statLbl}>Teams</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum}>99%</span>
              <span className={styles.statLbl}>Uptime</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum}>4.9★</span>
              <span className={styles.statLbl}>Rating</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
