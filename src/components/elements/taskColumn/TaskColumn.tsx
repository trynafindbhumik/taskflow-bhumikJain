'use client';

import { Plus } from 'lucide-react';
import React, { useState, useRef } from 'react';

import { TaskCard } from '@/components/elements/taskCard/TaskCard';
import type { Task, TaskStatus, User } from '@/utils/types';

import styles from './TaskColumn.module.css';

const COLUMN_CONFIG: Record<TaskStatus, { label: string; colorClass: string }> = {
  todo: { label: 'To Do', colorClass: 'colTodo' },
  in_progress: { label: 'In Progress', colorClass: 'colProgress' },
  done: { label: 'Done', colorClass: 'colDone' },
};

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  members?: User[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  onReorder: (draggedId: string, targetId: string, position: 'above' | 'below') => void;
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({
  status,
  tasks,
  members = [],
  onStatusChange,
  onReorder,
  onAddTask,
  onEditTask,
  onDeleteTask,
}) => {
  const [columnDragOver, setColumnDragOver] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ id: string; pos: 'above' | 'below' } | null>(null);
  const dragOverTarget = useRef<string | null>(null);

  const config = COLUMN_CONFIG[status];

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverTarget.current) {
      setColumnDragOver(true);
    }
  };

  const handleColumnDragLeave = (e: React.DragEvent) => {
    // Only clear when leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setColumnDragOver(false);
      setDropTarget(null);
      dragOverTarget.current = null;
    }
  };

  const handleColumnDrop = (e: React.DragEvent) => {
    e.preventDefault();

    // If we're dropping on the column background (not on a card), move to this status at end
    if (!dragOverTarget.current) {
      const taskId = e.dataTransfer.getData('taskId');
      if (taskId) {
        onStatusChange(taskId, status);
      }
    }

    setColumnDragOver(false);
    setDropTarget(null);
    dragOverTarget.current = null;
  };

  const handleCardDragStart = (_e: React.DragEvent, _id: string) => {
    setDropTarget(null);
    dragOverTarget.current = null;
  };

  const handleCardDragOver = (e: React.DragEvent, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    setColumnDragOver(false);
    dragOverTarget.current = cardId;

    // Determine above/below based on cursor relative to card midpoint
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos: 'above' | 'below' = e.clientY < rect.top + rect.height / 2 ? 'above' : 'below';
    setDropTarget({ id: cardId, pos });
  };

  const handleCardDrop = (e: React.DragEvent, targetCardId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedId = e.dataTransfer.getData('taskId');
    const draggedStatus = e.dataTransfer.getData('taskStatus') as TaskStatus;

    if (!draggedId || draggedId === targetCardId) {
      setDropTarget(null);
      dragOverTarget.current = null;
      return;
    }

    const pos = dropTarget?.id === targetCardId ? dropTarget.pos : 'below';

    if (draggedStatus !== status) {
      // Cross-column: change status first, then position relative to target
      onStatusChange(draggedId, status);
      // A brief delay lets the status update propagate before reordering
      setTimeout(() => onReorder(draggedId, targetCardId, pos), 10);
    } else {
      // Same-column reorder
      onReorder(draggedId, targetCardId, pos);
    }

    setDropTarget(null);
    setColumnDragOver(false);
    dragOverTarget.current = null;
  };

  return (
    <div
      className={`${styles.column} ${columnDragOver && !dropTarget ? styles.dragOver : ''}`}
      onDragOver={handleColumnDragOver}
      onDragLeave={handleColumnDragLeave}
      onDrop={handleColumnDrop}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={`${styles.dot} ${styles[config.colorClass]}`} />
          <h3 className={styles.label}>{config.label}</h3>
          <span className={styles.count}>{tasks.length}</span>
        </div>
        <button
          className={styles.addBtn}
          onClick={() => onAddTask(status)}
          aria-label={`Add task to ${config.label}`}
          title="Add task"
        >
          <Plus size={15} />
        </button>
      </div>

      <div className={styles.taskList}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            {...task}
            members={members}
            onStatusChange={onStatusChange}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onDragStart={handleCardDragStart}
            onDragOver={(e, id) => handleCardDragOver(e as React.DragEvent, id)}
            onDrop={(e, id) => handleCardDrop(e as React.DragEvent, id)}
            isDraggedOver={dropTarget?.id === task.id ? dropTarget.pos : null}
          />
        ))}

        {tasks.length === 0 && (
          <div
            className={`${styles.empty} ${columnDragOver ? styles.emptyActive : ''}`}
            onDragEnter={() => setColumnDragOver(true)}
          >
            <p>Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
};
