'use client';

import { Folder, Calendar, ArrowRight, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';

import type { Project } from '@/utils/types';

import styles from './ProjectCard.module.css';

interface ProjectCardProps extends Project {
  taskCount?: number;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  name,
  description,
  created_at,
  owner_id,
  taskCount,
  onEdit,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const date = new Date(created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Close context menu on outside click.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  const stopAndDo = (cb: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cb();
  };

  return (
    <Link
      href={`/projects/${id}`}
      className={`${styles.card} ${menuOpen ? styles.cardMenuOpen : ''}`}
    >
      <div className={styles.cardHeader}>
        <div className={styles.iconWrapper}>
          <Folder size={20} strokeWidth={1.75} />
        </div>

        <div className={styles.menuWrapper} ref={menuRef}>
          <button
            className={styles.menuBtn}
            onClick={stopAndDo(() => setMenuOpen((o) => !o))}
            aria-label="Project options"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className={styles.contextMenu} role="menu">
              {onEdit && (
                <button
                  className={styles.contextItem}
                  onClick={stopAndDo(() => {
                    setMenuOpen(false);
                    onEdit({ id, name, description, owner_id, created_at });
                  })}
                  role="menuitem"
                >
                  <Pencil size={13} />
                  <span>Edit project</span>
                </button>
              )}
              {onDelete && (
                <button
                  className={`${styles.contextItem} ${styles.contextItemDanger}`}
                  onClick={stopAndDo(() => {
                    setMenuOpen(false);
                    onDelete(id);
                  })}
                  role="menuitem"
                >
                  <Trash2 size={13} />
                  <span>Delete project</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.description}>{description ?? 'No description provided.'}</p>
      </div>

      <div className={styles.footer}>
        <div className={styles.meta}>
          <span className={styles.date}>
            <Calendar size={12} />
            {date}
          </span>
          {taskCount !== undefined && <span className={styles.taskCount}>{taskCount} tasks</span>}
        </div>
        <div className={styles.arrow} aria-hidden>
          <ArrowRight size={15} />
        </div>
      </div>
    </Link>
  );
};
