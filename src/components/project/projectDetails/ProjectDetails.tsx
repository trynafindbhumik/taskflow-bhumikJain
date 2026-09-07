'use client';

import {
  ChevronLeft,
  LayoutGrid,
  List,
  Plus,
  ChevronDown,
  ChevronUp,
  Users,
  UserMinus,
  Loader2,
  Mail,
  Trash2,
  CheckSquare,
  Square,
  AlertCircle,
  X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, useMemo, useCallback } from 'react';

import { TaskColumn } from '@/components/elements/taskColumn/TaskColumn';
import NotFoundComponent from '@/components/notFound/NotFound';
import { Button } from '@/components/ui/button/Button';
import { ConfirmDialog } from '@/components/ui/confirmDialog/ConfirmDialog';
import { DatePicker } from '@/components/ui/datePicker/DatePicker';
import { Modal } from '@/components/ui/modal/Modal';
import { Select } from '@/components/ui/select/Select';
import { SideSheet } from '@/components/ui/sideSheet/SideSheet';
import { useToast } from '@/components/ui/toast/ToastContext';
import { apiFetch } from '@/utils/api';
import { preferences } from '@/utils/preferences';
import type {
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  User,
  ProjectMember,
  Subtask,
} from '@/utils/types';

import styles from './ProjectDetails.module.css';

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS_FILTER = [
  { value: 'all', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const STATUS_FORM_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

interface TaskForm {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string;
  due_date: string;
  subtasks: Subtask[];
}

const DEFAULT_FORM: TaskForm = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  assignee_id: '',
  due_date: '',
  subtasks: [],
};

const MAX_DESC = 180;

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  const [view, setView] = useState<'board' | 'list'>(() => preferences.getDefaultView());
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [descExpanded, setDescExpanded] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<TaskForm>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [editSheet, setEditSheet] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<TaskForm>(DEFAULT_FORM);
  const [isEditSaving, setIsEditSaving] = useState(false);

  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [expandedListTaskIds, setExpandedListTaskIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [membersOpen, setMembersOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const [inviteEmails, setInviteEmails] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const handler = () => setView(preferences.getDefaultView());
    window.addEventListener('tf:preferences-saved', handler);
    return () => window.removeEventListener('tf:preferences-saved', handler);
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const load = async () => {
      try {
        const [projectData, tasksData, membersData] = (await Promise.all([
          apiFetch(`/projects/${projectId}`),
          apiFetch(`/projects/${projectId}/tasks`),
          apiFetch(`/projects/${projectId}/members`),
        ])) as [Project, Task[], ProjectMember[]];

        setProject(projectData);
        setTasks(tasksData);
        setMembers(membersData.map((m) => m.user));
      } catch {
        setIsNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [projectId]);

  useEffect(() => {
    if (!membersOpen) return;

    const fetchUsers = async () => {
      try {
        const users = (await apiFetch('/users')) as User[];
        setAllUsers(users);
      } catch {
        showToast('Failed to load users list', 'error');
      }
    };

    fetchUsers();
  }, [membersOpen, showToast]);

  const assigneeFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All Assignees' },
      { value: 'unassigned', label: 'Unassigned' },
      ...members.map((m) => ({ value: m.id, label: m.name })),
    ],
    [members]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchAssignee =
        assigneeFilter === 'all' ||
        (assigneeFilter === 'unassigned' ? !t.assignee_id : t.assignee_id === assigneeFilter);
      const matchSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchPriority && matchAssignee && matchSearch;
    });
  }, [tasks, statusFilter, priorityFilter, assigneeFilter, searchQuery]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
    filteredTasks.forEach((t) => grouped[t.status].push(t));
    return grouped;
  }, [filteredTasks]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const prev = [...tasks];
    setTasks((ts) =>
      ts.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
      )
    );
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err: unknown) {
      setTasks(prev);
      showToast(err instanceof Error ? err.message : 'Failed to update status', 'error');
    }
  };

  const handleSubtaskToggle = async (taskId: string, subtaskId: string, completed: boolean) => {
    const prev = [...tasks];
    let updatedSubtasks: Subtask[] = [];

    setTasks((ts) =>
      ts.map((t) => {
        if (t.id !== taskId) return t;
        updatedSubtasks = (t.subtasks ?? []).map((st) =>
          st.id === subtaskId ? { ...st, completed } : st
        );
        return { ...t, subtasks: updatedSubtasks, updated_at: new Date().toISOString() };
      })
    );

    if (editSheet?.id === taskId) {
      setEditForm((f) => ({
        ...f,
        subtasks: f.subtasks.map((st) => (st.id === subtaskId ? { ...st, completed } : st)),
      }));
    }

    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ subtasks: updatedSubtasks }),
      });
    } catch {
      setTasks(prev);
      showToast('Failed to update subtask', 'error');
    }
  };

  const handleReorder = useCallback(
    (draggedId: string, targetId: string, position: 'above' | 'below') => {
      setTasks((prev) => {
        const arr = [...prev];
        const draggedIdx = arr.findIndex((t) => t.id === draggedId);
        const targetIdx = arr.findIndex((t) => t.id === targetId);
        if (draggedIdx === -1 || targetIdx === -1) return prev;
        const [dragged] = arr.splice(draggedIdx, 1);
        const insertAt = arr.findIndex((t) => t.id === targetId);
        arr.splice(position === 'above' ? insertAt : insertAt + 1, 0, dragged);
        return arr;
      });
    },
    []
  );

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((t) => t.id));
    }
  };

  const handleBulkStatus = async (status: string) => {
    if (!status || selectedTaskIds.length === 0) return;
    const ids = [...selectedTaskIds];
    const prev = [...tasks];
    setTasks((ts) =>
      ts.map((t) =>
        ids.includes(t.id)
          ? { ...t, status: status as TaskStatus, updated_at: new Date().toISOString() }
          : t
      )
    );
    try {
      await Promise.all(
        ids.map((id) =>
          apiFetch(`/tasks/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
          })
        )
      );
      showToast(`Updated status for ${ids.length} task(s)`, 'success');
      setSelectedTaskIds([]);
    } catch {
      setTasks(prev);
      showToast('Failed to update task statuses', 'error');
    }
  };

  const handleBulkPriority = async (priority: string) => {
    if (!priority || selectedTaskIds.length === 0) return;
    const ids = [...selectedTaskIds];
    const prev = [...tasks];
    setTasks((ts) =>
      ts.map((t) =>
        ids.includes(t.id)
          ? { ...t, priority: priority as TaskPriority, updated_at: new Date().toISOString() }
          : t
      )
    );
    try {
      await Promise.all(
        ids.map((id) =>
          apiFetch(`/tasks/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ priority }),
          })
        )
      );
      showToast(`Updated priority for ${ids.length} task(s)`, 'success');
      setSelectedTaskIds([]);
    } catch {
      setTasks(prev);
      showToast('Failed to update task priorities', 'error');
    }
  };

  const handleBulkAssignee = async (assigneeId: string) => {
    if (selectedTaskIds.length === 0) return;
    const ids = [...selectedTaskIds];
    const prev = [...tasks];
    setTasks((ts) =>
      ts.map((t) =>
        ids.includes(t.id)
          ? { ...t, assignee_id: assigneeId || undefined, updated_at: new Date().toISOString() }
          : t
      )
    );
    try {
      await Promise.all(
        ids.map((id) =>
          apiFetch(`/tasks/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ assignee_id: assigneeId || undefined }),
          })
        )
      );
      showToast(`Updated assignee for ${ids.length} task(s)`, 'success');
      setSelectedTaskIds([]);
    } catch {
      setTasks(prev);
      showToast('Failed to update task assignees', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    setIsBulkDeleting(true);
    const ids = [...selectedTaskIds];
    const prev = [...tasks];
    setTasks((ts) => ts.filter((t) => !ids.includes(t.id)));
    try {
      await Promise.all(ids.map((id) => apiFetch(`/tasks/${id}`, { method: 'DELETE' })));
      showToast(`Deleted ${ids.length} task(s)`, 'success');
      setSelectedTaskIds([]);
      setBulkDeleteOpen(false);
    } catch {
      setTasks(prev);
      showToast('Failed to delete tasks', 'error');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const openCreate = (status: TaskStatus) => {
    setCreateForm({ ...DEFAULT_FORM, status, subtasks: [] });
    setNewSubtaskTitle('');
    setCreateOpen(true);
  };

  const handleCreateTask = async () => {
    if (!createForm.title.trim()) {
      showToast('Task title is required', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const task = (await apiFetch(`/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          title: createForm.title.trim(),
          description: createForm.description.trim() || undefined,
          status: createForm.status,
          priority: createForm.priority,
          assignee_id: createForm.assignee_id,
          due_date: createForm.due_date || undefined,
          subtasks: createForm.subtasks,
        }),
      })) as Task;
      setTasks((ts) => [...ts, task]);
      setCreateOpen(false);
      setCreateForm(DEFAULT_FORM);
      setNewSubtaskTitle('');
      showToast('Task created successfully', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create task', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (task: Task) => {
    setEditSheet(task);
    setEditForm({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      assignee_id: task.assignee_id ?? '',
      due_date: task.due_date ?? '',
      subtasks: task.subtasks ? [...task.subtasks] : [],
    });
    setNewSubtaskTitle('');
  };

  const handleEditSave = async () => {
    if (!editSheet || !editForm.title.trim()) {
      showToast('Task title is required', 'error');
      return;
    }
    setIsEditSaving(true);
    try {
      const updated = (await apiFetch(`/tasks/${editSheet.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim() || undefined,
          status: editForm.status,
          priority: editForm.priority,
          assignee_id: editForm.assignee_id,
          due_date: editForm.due_date || undefined,
          subtasks: editForm.subtasks,
        }),
      })) as Task;
      setTasks((ts) => ts.map((t) => (t.id === updated.id ? updated : t)));
      setEditSheet(null);
      showToast('Task updated', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update task', 'error');
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/tasks/${deleteTaskId}`, { method: 'DELETE' });
      setTasks((ts) => ts.filter((t) => t.id !== deleteTaskId));
      setDeleteTaskId(null);
      showToast('Task deleted', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete task', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (members.some((m) => m.id === userId)) return;
    setAddingId(userId);
    try {
      const data = (await apiFetch(`/projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      })) as ProjectMember;
      setMembers((prev) => [...prev, data.user]);
      showToast('Member added', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add member', 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setRemovingId(userId);
    try {
      await apiFetch(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
      setMembers((prev) => prev.filter((m) => m.id !== userId));

      // Refresh tasks to reflect any unassignments made by the backend
      const updatedTasks = (await apiFetch(`/projects/${projectId}/tasks`)) as Task[];
      setTasks(updatedTasks);

      showToast('Member removed', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to remove member', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const handleSendInvites = async () => {
    if (!inviteEmails.trim()) {
      showToast('Please enter at least one email address', 'error');
      return;
    }

    const emails = inviteEmails
      .split(/[\s,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (emails.length === 0) return;

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = emails.filter((e) => !EMAIL_REGEX.test(e));
    if (invalid.length > 0) {
      showToast(`Invalid email${invalid.length > 1 ? 's' : ''}: ${invalid.join(', ')}`, 'error');
      return;
    }

    setIsInviting(true);
    try {
      const freshMembersData = (await apiFetch(
        `/projects/${projectId}/members`
      )) as ProjectMember[];
      setMembers(freshMembersData.map((m) => m.user));
      setInviteEmails('');
      showToast(
        `Invites sent to ${emails.length} email(s). They can now be added as members.`,
        'success'
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to send invites', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const memberOptions = [
    { value: '', label: 'Unassigned' },
    ...members.map((m) => ({ value: m.id, label: m.name })),
  ];

  const nonMembers = allUsers.filter((u) => !members.some((m) => m.id === u.id));
  const ownerId = project?.owner_id;

  // ── Guards — evaluated in render, not in async callbacks ──
  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
        <span>Loading project…</span>
      </div>
    );
  }

  if (isNotFound) {
    return <NotFoundComponent />;
  }

  const description = project?.description ?? '';
  const isDescLong = description.length > MAX_DESC;
  const shownDesc =
    isDescLong && !descExpanded ? description.slice(0, MAX_DESC) + '…' : description;

  const renderTaskForm = (
    form: TaskForm,
    setForm: React.Dispatch<React.SetStateAction<TaskForm>>,
    showStatus = false
  ) => (
    <div className={styles.taskForm}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Title *</label>
        <input
          className={styles.textInput}
          placeholder="What needs to be done?"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          autoFocus
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Description</label>
        <textarea
          className={styles.textarea}
          placeholder="Optional description…"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div className={styles.row2}>
        <Select
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={form.priority}
          onChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}
        />
        {showStatus && (
          <Select
            label="Status"
            options={STATUS_FORM_OPTIONS}
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: v as TaskStatus }))}
          />
        )}
      </div>

      <div className={styles.row2}>
        <Select
          label="Assignee"
          options={memberOptions}
          value={form.assignee_id}
          onChange={(v) => setForm((f) => ({ ...f, assignee_id: v }))}
          placeholder="Unassigned"
        />
        <DatePicker
          label="Due Date"
          value={form.due_date}
          onChange={(v) => setForm((f) => ({ ...f, due_date: v }))}
        />
      </div>

      <div className={styles.subtasksSection}>
        <div className={styles.subtasksHeader}>
          <label className={styles.fieldLabel}>
            Subtasks ({form.subtasks.filter((s) => s.completed).length} of {form.subtasks.length})
          </label>
          {form.subtasks.length > 0 && (
            <div className={styles.subtaskProgressBar}>
              <div
                className={styles.subtaskProgressFill}
                style={{
                  width: `${Math.round(
                    (form.subtasks.filter((s) => s.completed).length / form.subtasks.length) * 100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        <div className={styles.subtaskList}>
          {form.subtasks.map((st) => (
            <div key={st.id} className={styles.subtaskRow}>
              <button
                type="button"
                className={styles.subtaskCheckbox}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    subtasks: f.subtasks.map((item) =>
                      item.id === st.id ? { ...item, completed: !item.completed } : item
                    ),
                  }))
                }
                aria-label={st.completed ? 'Mark subtask incomplete' : 'Mark subtask complete'}
              >
                {st.completed ? (
                  <CheckSquare size={16} className={styles.subtaskCheckDone} />
                ) : (
                  <Square size={16} className={styles.subtaskCheckTodo} />
                )}
              </button>
              <span
                className={`${styles.subtaskTitle} ${st.completed ? styles.subtaskTitleDone : ''}`}
              >
                {st.title}
              </span>
              <button
                type="button"
                className={styles.subtaskRemoveBtn}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    subtasks: f.subtasks.filter((item) => item.id !== st.id),
                  }))
                }
                aria-label="Delete subtask"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.subtaskInputRow}>
          <input
            className={styles.subtaskInput}
            placeholder="Add a subtask…"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (!newSubtaskTitle.trim()) return;
                setForm((f) => ({
                  ...f,
                  subtasks: [
                    ...f.subtasks,
                    {
                      id: `st_${Math.random().toString(36).slice(2, 9)}`,
                      title: newSubtaskTitle.trim(),
                      completed: false,
                    },
                  ],
                }));
                setNewSubtaskTitle('');
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (!newSubtaskTitle.trim()) return;
              setForm((f) => ({
                ...f,
                subtasks: [
                  ...f.subtasks,
                  {
                    id: `st_${Math.random().toString(36).slice(2, 9)}`,
                    title: newSubtaskTitle.trim(),
                    completed: false,
                  },
                ],
              }));
              setNewSubtaskTitle('');
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <button onClick={() => router.push('/projects')} className={styles.backBtn}>
          <ChevronLeft size={16} />
          <span>Projects</span>
        </button>

        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>{project?.name}</h1>
            {description && (
              <div className={styles.descriptionWrap}>
                <p className={styles.subtitle}>{shownDesc}</p>
                {isDescLong && (
                  <button className={styles.descToggle} onClick={() => setDescExpanded((v) => !v)}>
                    {descExpanded ? (
                      <>
                        <ChevronUp size={13} /> Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={13} /> Show more
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className={styles.headerActions}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Users size={14} />}
              onClick={() => setMembersOpen(true)}
            >
              Members ({members.length})
            </Button>
            <Button leftIcon={<Plus size={16} />} onClick={() => openCreate('todo')}>
              New Task
            </Button>
          </div>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Search tasks…"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className={styles.selectWrap}>
              <Select options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
            </div>
            <div className={styles.selectWrap}>
              <Select
                options={PRIORITY_OPTIONS_FILTER}
                value={priorityFilter}
                onChange={setPriorityFilter}
              />
            </div>
            <div className={styles.selectWrap}>
              <Select
                options={assigneeFilterOptions}
                value={assigneeFilter}
                onChange={setAssigneeFilter}
              />
            </div>
          </div>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${view === 'board' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('board')}
              aria-label="Board view"
              title="Board view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('list')}
              aria-label="List view"
              title="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {view === 'board' ? (
          <div className={styles.board}>
            {STATUSES.map((status) => (
              <TaskColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                members={members}
                onStatusChange={handleStatusChange}
                onSubtaskToggle={handleSubtaskToggle}
                onReorder={handleReorder}
                onAddTask={openCreate}
                onEditTask={openEdit}
                onDeleteTask={setDeleteTaskId}
              />
            ))}
          </div>
        ) : (
          <div className={styles.listViewWrap}>
            {selectedTaskIds.length > 0 && (
              <div className={styles.bulkBar}>
                <span className={styles.bulkCount}>{selectedTaskIds.length} task(s) selected</span>
                <div className={styles.bulkActions}>
                  <div className={styles.bulkSelectWrap}>
                    <Select
                      options={STATUS_FORM_OPTIONS}
                      value=""
                      onChange={handleBulkStatus}
                      placeholder="Status…"
                    />
                  </div>
                  <div className={styles.bulkSelectWrap}>
                    <Select
                      options={PRIORITY_OPTIONS}
                      value=""
                      onChange={handleBulkPriority}
                      placeholder="Priority…"
                    />
                  </div>
                  <div className={styles.bulkSelectWrap}>
                    <Select
                      options={memberOptions}
                      value=""
                      onChange={handleBulkAssignee}
                      placeholder="Assignee…"
                    />
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setBulkDeleteOpen(true)}
                    leftIcon={<Trash2 size={13} />}
                  >
                    Delete ({selectedTaskIds.length})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedTaskIds([])}>
                    Deselect
                  </Button>
                </div>
              </div>
            )}

            <div className={styles.listView}>
              {filteredTasks.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No tasks match your filters.</p>
                  <Button variant="outline" size="sm" onClick={() => openCreate('todo')}>
                    Add a task
                  </Button>
                </div>
              ) : (
                <>
                  <div className={styles.listHeaderRow}>
                    <div className={styles.listCheckboxWrap}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={
                          selectedTaskIds.length === filteredTasks.length &&
                          filteredTasks.length > 0
                        }
                        onChange={toggleSelectAll}
                        aria-label="Select all tasks"
                      />
                    </div>
                    <span>Status</span>
                    <span>Task Title</span>
                    <span>Subtasks</span>
                    <span>Priority</span>
                    <span>Assignee</span>
                    <span>Due Date</span>
                  </div>

                  {filteredTasks.map((task) => {
                    const assignee = members.find((m) => m.id === task.assignee_id);
                    const isSelected = selectedTaskIds.includes(task.id);
                    const isExpanded = expandedListTaskIds.includes(task.id);
                    const isOverdue =
                      !!task.due_date &&
                      task.status !== 'done' &&
                      new Date(task.due_date + 'T23:59:59').getTime() < new Date().getTime();

                    const totalSubtasks = task.subtasks?.length ?? 0;
                    const completedSubtasks = task.subtasks?.filter((s) => s.completed).length ?? 0;

                    return (
                      <React.Fragment key={task.id}>
                        <div
                          className={`${styles.listRow} ${isSelected ? styles.listRowSelected : ''}`}
                          onClick={() => openEdit(task)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && openEdit(task)}
                        >
                          <div
                            className={styles.listCheckboxWrap}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              className={styles.checkbox}
                              checked={isSelected}
                              onChange={() => toggleSelectTask(task.id)}
                              aria-label={`Select ${task.title}`}
                            />
                          </div>
                          <span
                            className={`${styles.listStatus} ${styles[`listStatus_${task.status}`]}`}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                          <div className={styles.listMain}>
                            <span className={styles.listTitle}>{task.title}</span>
                            {task.description && (
                              <span className={styles.listDesc}>{task.description}</span>
                            )}
                          </div>

                          <div>
                            {totalSubtasks > 0 ? (
                              <button
                                type="button"
                                className={styles.listSubtasksBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedListTaskIds((prev) =>
                                    prev.includes(task.id)
                                      ? prev.filter((id) => id !== task.id)
                                      : [...prev, task.id]
                                  );
                                }}
                                title={`${completedSubtasks} of ${totalSubtasks} completed. Click to toggle checklist.`}
                              >
                                <CheckSquare size={12} />
                                {completedSubtasks}/{totalSubtasks}
                                {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              </button>
                            ) : (
                              <span className={styles.listUnassigned}>—</span>
                            )}
                          </div>

                          <span
                            className={`${styles.listPriority} ${styles[`listPriority_${task.priority}`]}`}
                          >
                            {task.priority}
                          </span>
                          {assignee ? (
                            <span className={styles.listAssignee} title={assignee.name}>
                              {assignee.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                          ) : (
                            <span className={styles.listUnassigned}>—</span>
                          )}
                          <span className={styles.listDate}>
                            {task.due_date ? (
                              isOverdue ? (
                                <span className={styles.listDateOverdue} title="Overdue task">
                                  <AlertCircle size={12} /> {task.due_date} Overdue
                                </span>
                              ) : (
                                task.due_date
                              )
                            ) : (
                              '—'
                            )}
                          </span>
                        </div>

                        {isExpanded && task.subtasks && task.subtasks.length > 0 && (
                          <div
                            className={styles.listExpandedSubtasks}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {task.subtasks.map((st) => (
                              <div
                                key={st.id}
                                className={styles.subtaskRow}
                                onClick={() => handleSubtaskToggle(task.id, st.id, !st.completed)}
                                role="button"
                                tabIndex={0}
                              >
                                <button type="button" className={styles.subtaskCheckbox}>
                                  {st.completed ? (
                                    <CheckSquare size={15} className={styles.subtaskCheckDone} />
                                  ) : (
                                    <Square size={15} className={styles.subtaskCheckTodo} />
                                  )}
                                </button>
                                <span
                                  className={`${styles.subtaskTitle} ${st.completed ? styles.subtaskTitleDone : ''}`}
                                >
                                  {st.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <Modal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateForm(DEFAULT_FORM);
        }}
        title="Create New Task"
        description={`Adding to: ${createForm.status.replace('_', ' ')}`}
        size="md"
      >
        {renderTaskForm(createForm, setCreateForm, false)}
        <div className={styles.modalActions}>
          <Button variant="outline" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button isLoading={isSaving} onClick={handleCreateTask}>
            Create Task
          </Button>
        </div>
      </Modal>

      <SideSheet
        isOpen={!!editSheet}
        onClose={() => setEditSheet(null)}
        title="Edit Task"
        description={editSheet?.title}
      >
        {editSheet && (
          <>
            {renderTaskForm(editForm, setEditForm, true)}
            <div className={styles.sheetActions}>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setDeleteTaskId(editSheet.id);
                  setEditSheet(null);
                }}
              >
                Delete task
              </Button>
              <div className={styles.sheetActionsRight}>
                <Button variant="outline" onClick={() => setEditSheet(null)}>
                  Cancel
                </Button>
                <Button isLoading={isEditSaving} onClick={handleEditSave}>
                  Save changes
                </Button>
              </div>
            </div>
          </>
        )}
      </SideSheet>

      <ConfirmDialog
        isOpen={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message="This task will be permanently removed. This action cannot be undone."
        confirmLabel="Delete task"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Tasks"
        message={`This will permanently delete ${selectedTaskIds.length} task(s). This action cannot be undone.`}
        confirmLabel={`Delete ${selectedTaskIds.length} task(s)`}
        isLoading={isBulkDeleting}
      />

      <SideSheet
        isOpen={membersOpen}
        onClose={() => setMembersOpen(false)}
        title="Project Members"
        description="Manage who can be assigned tasks in this project"
      >
        <div className={styles.membersPanel}>
          <p className={styles.membersSectionLabel}>Current Members ({members.length})</p>
          {members.map((m) => (
            <div key={m.id} className={styles.memberRow}>
              <div className={styles.memberAvatar}>
                {m.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{m.name}</span>
                <span className={styles.memberEmail}>{m.email}</span>
              </div>
              {m.id === ownerId ? (
                <span className={styles.ownerBadge}>Owner</span>
              ) : (
                <button
                  className={styles.removeMemberBtn}
                  onClick={() => handleRemoveMember(m.id)}
                  disabled={removingId === m.id}
                >
                  {removingId === m.id ? (
                    <Loader2 size={14} className={styles.spinner} />
                  ) : (
                    <UserMinus size={14} />
                  )}
                </button>
              )}
            </div>
          ))}

          {nonMembers.length > 0 && (
            <>
              <p className={`${styles.membersSectionLabel} ${styles.membersSectionLabelSep}`}>
                Quick Add Existing Users
              </p>
              {nonMembers.map((u) => (
                <div key={u.id} className={styles.memberRow}>
                  <div className={`${styles.memberAvatar} ${styles.memberAvatarMuted}`}>
                    {u.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{u.name}</span>
                    <span className={styles.memberEmail}>{u.email}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddMember(u.id)}
                    isLoading={addingId === u.id}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </>
          )}

          <div className={styles.inviteSection}>
            <p className={styles.membersSectionLabel}>Invite New People</p>
            <p className={styles.inviteHint}>
              Enter email addresses (separated by comma or space). They will be invited to join this
              project.
            </p>

            <div className={styles.inviteInputWrap}>
              <Mail size={18} className={styles.inviteIcon} />
              <input
                type="text"
                className={styles.inviteInput}
                placeholder="john@example.com, sarah@company.com"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendInvites()}
              />
            </div>

            <Button
              onClick={handleSendInvites}
              isLoading={isInviting}
              leftIcon={<Mail size={16} />}
              className={styles.inviteBtn}
            >
              Send Invites
            </Button>
          </div>

          {nonMembers.length === 0 && inviteEmails === '' && (
            <p className={styles.emptyMembersHint}>
              All available users are already members. Use the invite box above to bring in new
              people.
            </p>
          )}
        </div>
      </SideSheet>
    </div>
  );
}
