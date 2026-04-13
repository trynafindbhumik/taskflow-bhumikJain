'use client';

import { User, Mail, Lock, Save, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useCallback } from 'react';

import { Button } from '@/components/ui/button/Button';
import { useToast } from '@/components/ui/toast/ToastContext';
import { apiFetch } from '@/utils/api';
import { auth } from '@/utils/auth';
import type { User as UserType } from '@/utils/types';

import styles from './Profile.module.css';

const AVATAR_COLOURS = [
  '#e23744',
  '#6366f1',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ProfileComponent() {
  const currentUser = auth.getUser();
  const { showToast } = useToast();

  const [name, setName] = useState(currentUser?.name ?? '');
  const email = currentUser?.email ?? '';
  const [isSaving, setIsSaving] = useState(false);
  const [savedName, setSavedName] = useState(currentUser?.name ?? '');

  const savedColor =
    typeof window !== 'undefined'
      ? (localStorage.getItem('tf-avatar-color') ?? AVATAR_COLOURS[0])
      : AVATAR_COLOURS[0];
  const [avatarColor, setAvatarColor] = useState(savedColor);

  const [pwdExpanded, setPwdExpanded] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const handleSaveProfile = useCallback(async () => {
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    if (!currentUser) {
      showToast('Session expired — please log in again', 'error');
      return;
    }

    if (pwdExpanded) {
      if (newPassword.length < 6) {
        setPwdError('New password must be at least 6 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPwdError('Passwords do not match');
        return;
      }
    }

    setPwdError('');
    setIsSaving(true);

    try {
      const payload: Record<string, string> = { name: name.trim() };

      if (pwdExpanded && newPassword) {
        payload.new_password = newPassword;
      }

      const updated = (await apiFetch('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })) as UserType;

      const merged: UserType = { ...currentUser, name: updated.name };
      auth.setUser(merged);
      localStorage.setItem('tf-avatar-color', avatarColor);

      window.dispatchEvent(new CustomEvent('tf:user-updated', { detail: merged }));

      setSavedName(updated.name);
      setNewPassword('');
      setConfirmPassword('');
      if (pwdExpanded) setPwdExpanded(false);

      showToast(
        pwdExpanded ? 'Profile and password updated successfully' : 'Profile updated successfully',
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [name, pwdExpanded, newPassword, confirmPassword, currentUser, avatarColor, showToast]);

  const initials = getInitials(savedName || 'U');

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Profile</h1>
          <p className={styles.pageSubtitle}>Manage your personal information and password</p>
        </div>

        <div className={styles.card}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar} style={{ backgroundColor: avatarColor }}>
                {initials}
              </div>

              <div className={styles.colorRow} role="group" aria-label="Choose avatar colour">
                {AVATAR_COLOURS.map((c) => (
                  <button
                    key={c}
                    className={`${styles.colorSwatch} ${avatarColor === c ? styles.colorSwatchActive : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setAvatarColor(c)}
                    aria-label={`Avatar colour ${c}`}
                    aria-pressed={avatarColor === c}
                  />
                ))}
              </div>
            </div>

            <div className={styles.avatarInfo}>
              <p className={styles.avatarName}>{savedName || 'Your Name'}</p>
              <p className={styles.avatarEmail}>{email}</p>
              <p className={styles.avatarHint}>Pick a colour for your avatar</p>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.form}>
            <h3 className={styles.formSection}>Personal info</h3>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <User size={14} className={styles.labelIcon} aria-hidden />
                Full name
              </label>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <Mail size={14} className={styles.labelIcon} aria-hidden />
                Email address
              </label>
              <input
                className={`${styles.input} ${styles.inputReadonly}`}
                value={email}
                readOnly
                title="Email cannot be changed in this demo"
              />
              <p className={styles.hint}>Email changes are not supported in the demo.</p>
            </div>

            <div className={styles.divider} />

            <button
              className={styles.pwdToggle}
              onClick={() => {
                setPwdExpanded((v) => !v);
                setPwdError('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              type="button"
              aria-expanded={pwdExpanded}
            >
              <div className={styles.pwdToggleLeft}>
                <Lock size={15} aria-hidden />
                <span>Change password</span>
              </div>
              {pwdExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {pwdExpanded && (
              <div className={styles.pwdSection}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>New password</label>
                  <div className={styles.passwordWrap}>
                    <input
                      className={styles.input}
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? 'Hide password' : 'Show password'}
                    >
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Confirm new password</label>
                  <div className={styles.passwordWrap}>
                    <input
                      className={styles.input}
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {pwdError && <p className={styles.errorText}>{pwdError}</p>}
              </div>
            )}

            <div className={styles.actions}>
              <Button
                onClick={handleSaveProfile}
                isLoading={isSaving}
                leftIcon={<Save size={15} />}
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
