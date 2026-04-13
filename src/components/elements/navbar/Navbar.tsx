'use client';

import {
  Bell,
  Search,
  Layout,
  LogOut,
  User,
  ChevronDown,
  Moon,
  Sun,
  Settings,
  Menu,
  X,
  LayoutDashboard,
  FolderOpen,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useRef, useEffect } from 'react';

import { useTheme } from '@/components/providers/themeProvider/ThemeProvider';
import { NotificationPanel } from '@/components/ui/notificationPanel/NotificationPanel';
import { SearchModal } from '@/components/ui/searchModal/SearchModal';
import { apiFetch } from '@/utils/api';
import { auth } from '@/utils/auth';
import type { Notification, User as UserType } from '@/utils/types';

import styles from './Navbar.module.css';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  mobile?: boolean;
}

const NavItem: React.FC<NavLinkProps> = ({ href, children, onClick, mobile }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={[
        mobile ? styles.mobileNavLink : styles.navLink,
        isActive ? styles.navLinkActive : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // Reactive user state — updates when Profile dispatches tf:user-updated.
  const [user, setUser] = useState<UserType | null>(() => auth.getUser());

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);

  // Keep displayed name in sync when Profile saves.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<UserType>).detail;
      if (detail) setUser(detail);
    };
    window.addEventListener('tf:user-updated', handler);
    return () => window.removeEventListener('tf:user-updated', handler);
  }, []);

  // Load initial unread count.
  useEffect(() => {
    const controller = new AbortController();
    apiFetch<Notification[]>('/notifications')
      .then((data) => {
        if (!controller.signal.aborted) {
          setUnreadCount(data.filter((n) => !n.read).length);
        }
      })
      .catch(() => null);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
  };

  const handleNotifClose = () => {
    setNotifOpen(false);
    apiFetch<Notification[]>('/notifications')
      .then((data) => setUnreadCount(data.filter((n) => !n.read).length))
      .catch(() => null);
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.left}>
          <button
            className={styles.hamburger}
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <Link href="/dashboard" className={styles.logo}>
            <Layout size={20} strokeWidth={2.5} />
            <span>TaskFlow</span>
          </Link>

          <nav className={styles.nav} aria-label="Main navigation">
            <NavItem href="/dashboard">Dashboard</NavItem>
            <NavItem href="/projects">Projects</NavItem>
          </nav>
        </div>

        <button
          className={styles.searchTrigger}
          onClick={() => setSearchOpen(true)}
          aria-label="Open search (Ctrl+K)"
        >
          <Search size={15} className={styles.searchTriggerIcon} />
          <span className={styles.searchTriggerText}>Search projects &amp; tasks…</span>
          <kbd className={styles.kbdHint}>⌘K</kbd>
        </button>

        <div className={styles.right}>
          <button
            className={styles.iconBtn}
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <div className={styles.notifWrapper}>
            <button
              ref={notifBtnRef}
              className={styles.iconBtn}
              onClick={() => setNotifOpen((o) => !o)}
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className={styles.badge} aria-label={`${unreadCount} unread`} />
              )}
            </button>
            <NotificationPanel
              isOpen={notifOpen}
              onClose={handleNotifClose}
              triggerRef={notifBtnRef}
            />
          </div>

          <div className={styles.userMenu} ref={menuRef}>
            <button
              className={styles.userTrigger}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <div className={styles.avatar}>{initials}</div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.name ?? 'User'}</span>
                <span className={styles.userEmail}>{user?.email ?? ''}</span>
              </div>
              <ChevronDown
                size={14}
                className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ''}`}
              />
            </button>

            {menuOpen && (
              <div className={styles.dropdown} role="menu">
                <Link
                  href="/profile"
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <User size={15} />
                  <span>Profile</span>
                </Link>
                <Link
                  href="/settings"
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <Settings size={15} />
                  <span>Settings</span>
                </Link>
                <div className={styles.dropdownDivider} />
                <button
                  className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                  onClick={handleLogout}
                  role="menuitem"
                >
                  <LogOut size={15} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileNavOpen(false)}>
          <nav
            className={styles.mobileDrawer}
            onClick={(e) => e.stopPropagation()}
            aria-label="Mobile navigation"
          >
            <div className={styles.mobileHeader}>
              <Link
                href="/dashboard"
                className={styles.logo}
                onClick={() => setMobileNavOpen(false)}
              >
                <Layout size={18} strokeWidth={2.5} />
                <span>TaskFlow</span>
              </Link>
              <button
                className={styles.mobileClose}
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.mobileLinks}>
              <NavItem href="/dashboard" mobile onClick={() => setMobileNavOpen(false)}>
                <LayoutDashboard size={18} />
                Dashboard
              </NavItem>
              <NavItem href="/projects" mobile onClick={() => setMobileNavOpen(false)}>
                <FolderOpen size={18} />
                Projects
              </NavItem>
              <NavItem href="/profile" mobile onClick={() => setMobileNavOpen(false)}>
                <User size={18} />
                Profile
              </NavItem>
              <NavItem href="/settings" mobile onClick={() => setMobileNavOpen(false)}>
                <Settings size={18} />
                Settings
              </NavItem>
            </div>

            <div className={styles.mobileFooter}>
              <button
                className={styles.mobileLogout}
                onClick={() => {
                  setMobileNavOpen(false);
                  handleLogout();
                }}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};
