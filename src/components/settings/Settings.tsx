'use client';

import { Moon, Sun, Bell, Eye, Save } from 'lucide-react';
import { useState } from 'react';

import { useTheme } from '@/components/providers/themeProvider/ThemeProvider';
import { useToast } from '@/components/ui/toast/ToastContext';
import { preferences, type DefaultView } from '@/utils/preferences';

import styles from './Settings.module.css';

export default function SettingsComponent() {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  // Load persisted preferences on mount.
  const [notifications, setNotifications] = useState(() => preferences.getNotifications());

  const [defaultView, setDefaultView] = useState<DefaultView>(() => preferences.getDefaultView());

  const handleSave = () => {
    preferences.setDefaultView(defaultView);
    preferences.setNotifications(notifications);
    // Broadcast so other open tabs / components pick it up.
    window.dispatchEvent(
      new CustomEvent('tf:preferences-saved', { detail: { defaultView, notifications } })
    );
    showToast('Preferences saved', 'success');
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>Customise your TaskFlow experience</p>
        </div>

        <div className={styles.sections}>
          {/* Appearance */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Appearance</h2>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <p className={styles.settingLabel}>Colour theme</p>
                <p className={styles.settingDesc}>
                  Choose between light and dark mode. Changes apply immediately.
                </p>
              </div>
              <div className={styles.themeToggle}>
                <button
                  className={`${styles.themeBtn} ${theme === 'light' ? styles.themeBtnActive : ''}`}
                  onClick={() => theme === 'dark' && toggleTheme()}
                  aria-pressed={theme === 'light'}
                >
                  <Sun size={15} aria-hidden />
                  <span>Light</span>
                </button>
                <button
                  className={`${styles.themeBtn} ${theme === 'dark' ? styles.themeBtnActive : ''}`}
                  onClick={() => theme === 'light' && toggleTheme()}
                  aria-pressed={theme === 'dark'}
                >
                  <Moon size={15} aria-hidden />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Notifications</h2>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabelRow}>
                  <Bell size={15} className={styles.settingIcon} aria-hidden />
                  <p className={styles.settingLabel}>Task notifications</p>
                </div>
                <p className={styles.settingDesc}>
                  Receive alerts for task assignments and approaching deadlines.
                </p>
              </div>
              <label className={styles.toggle} aria-label="Toggle notifications">
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                <span className={styles.toggleTrack} />
              </label>
            </div>
          </section>

          {/* Preferences */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Preferences</h2>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <div className={styles.settingLabelRow}>
                  <Eye size={15} className={styles.settingIcon} aria-hidden />
                  <p className={styles.settingLabel}>Default task view</p>
                </div>
                <p className={styles.settingDesc}>
                  Choose how tasks are displayed when you open a project. Hit &ldquo;Save&rdquo; to
                  apply.
                </p>
              </div>
              <div className={styles.viewToggle} role="group" aria-label="Default task view">
                <button
                  className={`${styles.viewBtn} ${defaultView === 'board' ? styles.viewBtnActive : ''}`}
                  onClick={() => setDefaultView('board')}
                  aria-pressed={defaultView === 'board'}
                >
                  Board
                </button>
                <button
                  className={`${styles.viewBtn} ${defaultView === 'list' ? styles.viewBtnActive : ''}`}
                  onClick={() => setDefaultView('list')}
                  aria-pressed={defaultView === 'list'}
                >
                  List
                </button>
              </div>
            </div>
          </section>

          {/* Save */}
          <div className={styles.saveRow}>
            <p className={styles.saveHint}>
              Theme changes are instant. Other preferences require saving.
            </p>
            <button className={styles.saveBtn} onClick={handleSave}>
              <Save size={15} aria-hidden />
              Save preferences
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
