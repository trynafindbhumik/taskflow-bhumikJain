'use client';

import { Plus, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

import { ProjectCard } from '@/components/elements/projectCard/ProjectCard';
import { Button } from '@/components/ui/button/Button';
import { ConfirmDialog } from '@/components/ui/confirmDialog/ConfirmDialog';
import { Modal } from '@/components/ui/modal/Modal';
import { useToast } from '@/components/ui/toast/ToastContext';
import { apiFetch } from '@/utils/api';
import type { Project } from '@/utils/types';

import styles from './Project.module.css';

const PAGE_SIZE = 9;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const { showToast } = useToast();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      try {
        const data = (await apiFetch(`/projects?page=${targetPage}&limit=${PAGE_SIZE}`)) as {
          projects: Project[];
          total: number;
        };
        setProjects(data.projects ?? []);
        setTotal(data.total ?? 0);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Failed to load projects', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchProjects(page);
  }, [page, fetchProjects]);

  const openCreate = () => {
    setCreateName('');
    setCreateDesc('');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!createName.trim()) {
      showToast('Project name is required', 'error');
      return;
    }
    setIsCreating(true);
    try {
      await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: createName.trim(),
          description: createDesc.trim() || undefined,
        }),
      });
      setCreateOpen(false);
      showToast('Project created', 'success');
      // Go to page 1 so the new project is visible.
      if (page === 1) {
        fetchProjects(1);
      } else {
        setPage(1);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to create project', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const openEdit = (project: Project) => {
    setEditProject(project);
    setEditName(project.name);
    setEditDesc(project.description ?? '');
  };

  const handleEdit = async () => {
    if (!editProject || !editName.trim()) {
      showToast('Project name is required', 'error');
      return;
    }
    setIsEditing(true);
    try {
      const updated = (await apiFetch(`/projects/${editProject.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || undefined }),
      })) as Project;
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditProject(null);
      showToast('Project updated', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update project', 'error');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/projects/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      showToast('Project deleted', 'success');
      // If last item on current page, go back.
      const newTotal = total - 1;
      const newPages = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
      const nextPage = Math.min(page, newPages);
      if (nextPage !== page) {
        setPage(nextPage);
      } else {
        fetchProjects(page);
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete project', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const subtitle = isLoading ? 'Loading…' : `${total} active project${total !== 1 ? 's' : ''}`;

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Projects</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
            New Project
          </Button>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${view === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('grid')}
              aria-label="Grid view"
              title="Grid view"
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

        {isLoading ? (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((key) => (
              <div key={key} className={styles.skeletonCard} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          /* Empty state */
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <LayoutGrid size={40} strokeWidth={1.5} />
            </div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started.</p>
            <Button onClick={openCreate} leftIcon={<Plus size={16} />}>
              Create Project
            </Button>
          </div>
        ) : view === 'grid' ? (
          <>
            <div className={styles.grid}>
              {projects.map((project, i) => (
                <div
                  key={project.id}
                  className={styles.cardWrapper}
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <ProjectCard {...project} onEdit={openEdit} onDelete={setDeleteId} />
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        ) : (
          <>
            <div className={styles.listView}>
              {projects.map((project) => (
                <div key={project.id} className={styles.listRowWrapper}>
                  <a href={`/projects/${project.id}`} className={styles.listRow}>
                    <div className={styles.listInfo}>
                      <span className={styles.listName}>{project.name}</span>
                      {project.description && (
                        <span className={styles.listDesc}>{project.description}</span>
                      )}
                    </div>
                    <span className={styles.listDate}>
                      {new Date(project.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </a>
                  <div className={styles.listRowActions}>
                    <button className={styles.listActionBtn} onClick={() => openEdit(project)}>
                      Edit
                    </button>
                    <button
                      className={`${styles.listActionBtn} ${styles.listActionBtnDanger}`}
                      onClick={() => setDeleteId(project.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </main>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Project"
        description="Create a project to group and manage related tasks."
      >
        <div className={styles.modalForm}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Project Name *</label>
            <input
              className={styles.textInput}
              placeholder="e.g. Website Redesign"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Description</label>
            <textarea
              className={styles.textarea}
              placeholder="What is this project about? (optional)"
              rows={3}
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
            />
          </div>
          <div className={styles.modalActions}>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={isCreating} onClick={handleCreate}>
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
              onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
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
            <Button isLoading={isEditing} onClick={handleEdit}>
              Save changes
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="This will permanently delete the project and all its tasks. This cannot be undone."
        confirmLabel="Delete project"
        isLoading={isDeleting}
      />
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className={styles.pagination} role="navigation" aria-label="Page navigation">
      <button
        className={styles.pageBtn}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      <span className={styles.pageInfo}>
        Page {page} of {totalPages}
      </span>

      <button
        className={styles.pageBtn}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
