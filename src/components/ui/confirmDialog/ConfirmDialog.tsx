'use client';

import { AlertTriangle } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal/Modal';

import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  isLoading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className={styles.content}>
      <div className={styles.iconWrap}>
        <AlertTriangle size={24} />
      </div>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
);
