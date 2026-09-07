'use client';

import {
  CheckCircle2,
  Circle,
  Clock,
  GripVertical,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  UserX,
  AlertCircle,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

import type { Task, TaskStatus, User as UserType } from '@/utils/types';

import styles from './TaskCard.module.css';

interface TaskCardProps extends Task {
  members?: UserType[];
  onStatusChange?: (id: string, status: TaskStatus) => void;
  onSubtaskToggle?: (taskId: string, subtaskId: string, completed: boolean) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  isDraggedOver?: 'above' | 'below' | null;
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  todo: <Circle size={16} />,
  in_progress: <Clock size={16} />,
  done: <CheckCircle2 size={16} />,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export const TaskCard: React.FC<TaskCardProps> = ({
  id,
  title,
  description,
  status,
  priority,
  assignee_id,
  due_date,
  subtasks,
  project_id,
  created_at,
  updated_at,
  members = [],
  onStatusChange,
  onSubtaskToggle,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDraggedOver,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close the portaled menu on outside click.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuBtnRef.current?.contains(target) || contextMenuRef.current?.contains(target)) return;
      setMenuOpen(false);
      setMenuPos(null);
    };

    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  // Close on scroll so the fixed menu doesn't drift from its trigger.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleScroll = () => {
      setMenuOpen(false);
      setMenuPos(null);
    };

    document.addEventListener('scroll', handleScroll, true);
    return () => document.removeEventListener('scroll', handleScroll, true);
  }, [menuOpen]);

  const assignee = assignee_id ? members.find((m) => m.id === assignee_id) : undefined;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', id);
    e.dataTransfer.setData('taskStatus', status);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(e, id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOver?.(e, id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop?.(e, id);
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStatusChange?.(id, STATUS_CYCLE[status]);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (menuOpen) {
      setMenuOpen(false);
      setMenuPos(null);
      return;
    }

    const rect = menuBtnRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setMenuOpen(true);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    setMenuPos(null);
    onEdit?.({
      id,
      title,
      description,
      status,
      priority,
      assignee_id,
      due_date,
      subtasks,
      project_id,
      created_at,
      updated_at,
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    setMenuPos(null);
    onDelete?.(id);
  };

  const formattedDate = due_date
    ? new Date(due_date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const totalSubtasks = subtasks?.length ?? 0;
  const completedSubtasks = subtasks?.filter((s) => s.completed).length ?? 0;

  const isOverdue =
    !!due_date &&
    status !== 'done' &&
    new Date(due_date + 'T23:59:59').getTime() < new Date().getTime();

  const cardClass = [
    styles.card,
    menuOpen ? styles.menuActive : '',
    isDraggedOver === 'above' ? styles.dropAbove : '',
    isDraggedOver === 'below' ? styles.dropBelow : '',
    isOverdue ? styles.cardOverdue : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cardClass}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      data-status={status}
    >
      <div className={styles.dragHandle} aria-hidden>
        <GripVertical size={14} />
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <button
            className={`${styles.statusBtn} ${styles[`status_${status}`]}`}
            onClick={handleStatusClick}
            aria-label={`Mark as ${STATUS_CYCLE[status].replace('_', ' ')}`}
            title={`Mark as ${STATUS_CYCLE[status].replace('_', ' ')}`}
          >
            {STATUS_ICONS[status]}
          </button>
          <p className={`${styles.title} ${status === 'done' ? styles.titleDone : ''}`}>{title}</p>
        </div>

        {description && <p className={styles.description}>{description}</p>}

        {showSubtasks && subtasks && subtasks.length > 0 && (
          <div className={styles.cardSubtaskList} onClick={(e) => e.stopPropagation()}>
            {subtasks.map((st) => (
              <div
                key={st.id}
                className={styles.cardSubtaskRow}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSubtaskToggle?.(id, st.id, !st.completed);
                }}
                role="button"
                tabIndex={0}
              >
                <span className={styles.cardSubtaskCheck}>
                  {st.completed ? (
                    <CheckSquare size={12} className={styles.subtaskCheckDone} />
                  ) : (
                    <Square size={12} className={styles.subtaskCheckTodo} />
                  )}
                </span>
                <span
                  className={`${styles.cardSubtaskTitle} ${st.completed ? styles.subtaskTitleDone : ''}`}
                >
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <span className={`${styles.priority} ${styles[`priority_${priority}`]}`}>
              {priority}
            </span>
            {totalSubtasks > 0 && (
              <button
                type="button"
                className={styles.subtaskBadgeBtn}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSubtasks((v) => !v);
                }}
                title={`${completedSubtasks} of ${totalSubtasks} subtasks completed. Click to ${showSubtasks ? 'hide' : 'show'} checklist.`}
              >
                <CheckSquare size={10} />
                {completedSubtasks}/{totalSubtasks}
                {showSubtasks ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            )}
          </div>

          <div className={styles.footerRight}>
            {formattedDate && (
              <span
                className={`${styles.dueDate} ${isOverdue ? styles.dueDateOverdue : ''}`}
                title={isOverdue ? 'Overdue task' : `Due ${formattedDate}`}
              >
                {isOverdue ? <AlertCircle size={11} /> : <Calendar size={11} />}
                {formattedDate}
                {isOverdue && <span className={styles.overdueText}>Overdue</span>}
              </span>
            )}

            {assignee ? (
              <span className={styles.assignee} title={assignee.name}>
                {getInitials(assignee.name)}
              </span>
            ) : assignee_id ? (
              <span className={styles.assigneeUnknown} title="Assigned user">
                ?
              </span>
            ) : (
              <span className={`${styles.assignee} ${styles.assigneeNone}`} title="Unassigned">
                <UserX size={10} />
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        ref={menuBtnRef}
        className={styles.menuBtn}
        onClick={handleMenuToggle}
        aria-label="Task options"
        aria-expanded={menuOpen}
      >
        <MoreVertical size={13} />
      </button>

      {menuOpen &&
        menuPos &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            ref={contextMenuRef}
            className={styles.contextMenu}
            style={{ position: 'fixed', top: menuPos.top, right: menuPos.right }}
            role="menu"
          >
            {onEdit && (
              <button className={styles.contextItem} onClick={handleEdit} role="menuitem">
                <Pencil size={12} />
                <span>Edit task</span>
              </button>
            )}
            {onDelete && (
              <button
                className={`${styles.contextItem} ${styles.contextItemDanger}`}
                onClick={handleDelete}
                role="menuitem"
              >
                <Trash2 size={12} />
                <span>Delete task</span>
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
