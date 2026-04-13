import { clsx } from 'clsx';
import React from 'react';

import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  ...props
}) => (
  <button
    className={clsx(
      styles.btn,
      styles[variant],
      styles[size],
      isLoading && styles.loading,
      fullWidth && styles.fullWidth,
      className
    )}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading && <span className={styles.spinner} aria-hidden />}
    {!isLoading && leftIcon && (
      <span className={styles.icon} aria-hidden>
        {leftIcon}
      </span>
    )}
    {children && <span>{children}</span>}
    {!isLoading && rightIcon && (
      <span className={styles.icon} aria-hidden>
        {rightIcon}
      </span>
    )}
  </button>
);
