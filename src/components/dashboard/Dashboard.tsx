'use client';

import { Plus, CheckCircle2, Clock, AlertCircle, ArrowRight, Folder } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { ProjectCard } from '@/components/elements/projectCard/ProjectCard';
import { Button } from '@/components/ui/button/Button';
import { ConfirmDialog } from '@/components/ui/confirmDialog/ConfirmDialog';
import { Modal } from '@/components/ui/modal/Modal';
import { useToast } from '@/components/ui/toast/ToastContext';
import { apiFetch } from '@/utils/api';
import { auth } from '@/utils/auth';
import type { Project, User, DeadlineTask, DeadlineResponse } from '@/utils/types';

import styles from './Dashboard.module.css';

const DEADLINE_PAGE_SIZE = 5;

interface DashboardStats {
  total: number;
  done: number;
  in_progress: number;
  high_priority: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    done: 0,
    in_progress: 0,
    high_priority: 0,
  });
  const [deadlines, setDeadlines] = useState<DeadlineTask[]>([]);
  const [deadlineOffset, setDeadlineOffset] = useState(0);
  const [deadlineHasMore, setDeadlineHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setUser(auth.getUser());

    const loadDashboard = async () => {
      try {
        const [projectsRes, statsRes, deadlinesRes] = await Promise.all([
          apiFetch<{ projects: Project[] }>('/projects?page=1&limit=50'),
          apiFetch<DashboardStats>('/stats'),
          apiFetch<DeadlineResponse>(`/deadlines?limit=${DEADLINE_PAGE_SIZE}&offset=0`),
        ]);

        setProjects(projectsRes.projects ?? []);
        setStats(statsRes);
        setDeadlines(deadlinesRes.tasks ?? []);
        setDeadlineOffset(DEADLINE_PAGE_SIZE);
        setDeadlineHasMore(deadlinesRes.has_more ?? false);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to load dashboard', 'error');
      } finally {
        setIsReady(true);
      }
    };

    loadDashboard();

    return () => controller.abort();
  }, [router, showToast]);

  const loadMoreDeadlines = async () => {
    setIsLoadingMore(true);
    try {
      const res = await apiFetch<DeadlineResponse>(
        `/deadlines?limit=${DEADLINE_PAGE_SIZE}&offset=${deadlineOffset}`
      );
      setDeadlines((prev) => [...prev, ...(res.tasks ?? [])]);
      setDeadlineOffset((prev) => prev + DEADLINE_PAGE_SIZE);
      setDeadlineHasMore(res.has_more ?? false);
    } catch {
      showToast('Failed to load more deadlines', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const openCreate = () => {
    setProjectName('');
    setProjectDesc('');
    setModalOpen(true);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      showToast('Project name is required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const newProject = await apiFetch<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDesc.trim() || undefined,
        }),
      });

      setProjects((prev) => [newProject, ...prev]);
      setModalOpen(false);
      showToast('Project created successfully', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create project', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (project: Project) => {
    setEditProject(project);
    setEditName(project.name);
    setEditDesc(project.description ?? '');
  };

  const handleEditProject = async () => {
    if (!editProject || !editName.trim()) {
      showToast('Project name is required', 'error');
      return;
    }

    setIsEditing(true);
    try {
      const updated = await apiFetch<Project>(`/projects/${editProject.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || undefined,
        }),
      });

      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditProject(null);
      showToast('Project updated', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update project', 'error');
    } finally {
      setIsEditing(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await apiFetch(`/projects/${deleteId}`, { method: 'DELETE' });
      setProjects((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
      showToast('Project deleted', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete project', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isReady) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.welcome}>
            <h1 className={styles.title}>
              Good {getGreeting()}, {firstName}!
            </h1>
            <p className={styles.subtitle}>
              Here&apos;s what&apos;s happening with your projects today.
            </p>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
            New Project
          </Button>
        </header>

        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statDone}`}>
            <div className={styles.statIcon}>
              <CheckCircle2 size={22} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statValue}>{stats.done}</span>
              <span className={styles.statLabel}>Completed</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.statProgress}`}>
            <div className={styles.statIcon}>
              <Clock size={22} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statValue}>{stats.in_progress}</span>
              <span className={styles.statLabel}>In Progress</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.statHigh}`}>
            <div className={styles.statIcon}>
              <AlertCircle size={22} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statValue}>{stats.high_priority}</span>
              <span className={styles.statLabel}>High Priority</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.statProjects}`}>
            <div className={styles.statIcon}>
              <Folder size={22} />
            </div>
            <div className={styles.statBody}>
              <span className={styles.statValue}>{projects.length}</span>
              <span className={styles.statLabel}>Projects</span>
            </div>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Projects</h2>
            <Link href="/projects" className={styles.viewAll}>
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className={styles.emptyProjects}>
              <p>No projects yet.</p>
              <Button variant="outline" size="sm" onClick={openCreate}>
                Create your first project
              </Button>
            </div>
          ) : (
            <div className={styles.projectGrid}>
              {projects.map((project, i) => (
                <div
                  key={project.id}
                  className={styles.projectCardWrapper}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <ProjectCard {...project} onEdit={openEdit} onDelete={setDeleteId} />
                </div>
              ))}
            </div>
          )}
        </section>

        {deadlines.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Upcoming Deadlines</h2>
            </div>

            <div className={styles.deadlineList}>
              {deadlines.map((task, i) => {
                const due = new Date(task.due_date + 'T00:00:00');
                const isPast = due < new Date();

                return (
                  <Link
                    key={task.id}
                    href={`/projects/${task.project_id}`}
                    className={`${styles.deadlineItem} ${isPast ? styles.deadlinePast : ''}`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className={styles.deadlineDateBox}>
                      <span className={styles.deadlineDay}>
                        {due.toLocaleDateString('en-US', { day: 'numeric' })}
                      </span>
                      <span className={styles.deadlineMonth}>
                        {due.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>

                    <div className={styles.deadlineContent}>
                      <p className={styles.deadlineTitle}>{task.title}</p>
                      {task.description && (
                        <p className={styles.deadlineDesc}>{task.description}</p>
                      )}
                      <span className={styles.deadlineProject}>{task.project_name}</span>
                    </div>

                    <div className={styles.deadlineMeta}>
                      <span
                        className={`${styles.deadlinePriority} ${styles[`dp_${task.priority}`]}`}
                      >
                        {task.priority}
                      </span>
                      {task.assignee && (
                        <span className={styles.deadlineAssignee} title={task.assignee.name}>
                          {task.assignee.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {deadlineHasMore && (
              <div className={styles.loadMoreWrap}>
                <button
                  className={styles.loadMoreBtn}
                  onClick={loadMoreDeadlines}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <span className={styles.loadMoreSpinner} /> Loading…
                    </>
                  ) : (
                    'Load more deadlines'
                  )}
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Project"
        description="Group related tasks under a single project."
      >
        <div className={styles.modalForm}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Project Name *</label>
            <input
              className={styles.textInput}
              placeholder="e.g. Website Redesign"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Description</label>
            <textarea
              className={styles.textarea}
              placeholder="Optional description…"
              rows={3}
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={isSaving} onClick={handleCreateProject}>
              Create Project
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!editProject}
        onClose={() => setEditProject(null)}
        title="Edit Project"
        description="Update your project details."
      >
        <div className={styles.modalForm}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Project Name *</label>
            <input
              className={styles.textInput}
              placeholder="Project name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Description</label>
            <textarea
              className={styles.textarea}
              placeholder="Optional description…"
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setEditProject(null)}>
              Cancel
            </Button>
            <Button isLoading={isEditing} onClick={handleEditProject}>
              Save changes
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message="This will permanently delete the project and all its tasks. This cannot be undone."
        confirmLabel="Delete project"
        isLoading={isDeleting}
      />
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
