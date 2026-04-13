'use client';

import { Search, Folder, CheckSquare, X, ArrowRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef, useCallback } from 'react';

import { apiFetch } from '@/utils/api';
import type { SearchResult, Task } from '@/utils/types';

import styles from './SearchModal.module.css';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const PRIORITY_CLASS: Record<Task['priority'], string> = {
  low: 'priorityLow',
  medium: 'priorityMedium',
  high: 'priorityHigh',
};

// Recent searches stored in memory (no localStorage)
let recentSearches: string[] = [];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    let prev = '';

    if (isOpen) {
      prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiFetch<SearchResult>(`/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch {
      setResults({ projects: [], tasks: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults(null);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      debounceRef.current = setTimeout(() => performSearch(query), 300);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch]);

  const totalResults = (results?.projects.length ?? 0) + (results?.tasks.length ?? 0);

  const navigateTo = (href: string, searchTerm?: string) => {
    if (searchTerm && !recentSearches.includes(searchTerm)) {
      recentSearches = [searchTerm, ...recentSearches].slice(0, 5);
    }
    onClose();
    router.push(href);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="search">
        {/* Search input */}
        <div className={styles.inputRow}>
          <Search size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Search projects and tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              className={styles.clearBtn}
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <button className={styles.escBtn} onClick={onClose}>
            ESC
          </button>
        </div>

        {/* Results body */}
        <div className={styles.body}>
          {/* Loading */}
          {isLoading && (
            <div className={styles.loadingRow}>
              <div className={styles.spinner} />
              <span>Searching…</span>
            </div>
          )}

          {/* Recent searches — shown when no query */}
          {!query && !isLoading && recentSearches.length > 0 && (
            <div className={styles.section}>
              <p className={styles.sectionLabel}>
                <Clock size={12} />
                Recent
              </p>
              {recentSearches.map((s) => (
                <button key={s} className={styles.recentItem} onClick={() => setQuery(s)}>
                  <Search size={13} className={styles.recentIcon} />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          )}

          {/* Empty state — no query, no recent */}
          {!query && !isLoading && recentSearches.length === 0 && (
            <div className={styles.emptyState}>
              <Search size={32} strokeWidth={1.5} />
              <p>Search across all your projects and tasks</p>
            </div>
          )}

          {/* No results */}
          {query && !isLoading && results && totalResults === 0 && (
            <div className={styles.emptyState}>
              <p>
                No results for <strong>&quot;{query}&quot;</strong>
              </p>
              <span>Try a different keyword</span>
            </div>
          )}

          {/* Results */}
          {results && totalResults > 0 && !isLoading && (
            <>
              {/* Projects */}
              {results.projects.length > 0 && (
                <div className={styles.section}>
                  <p className={styles.sectionLabel}>
                    <Folder size={12} />
                    Projects
                  </p>
                  {results.projects.map((project) => (
                    <button
                      key={project.id}
                      className={`${styles.resultItem} ${styles.projectItem}`}
                      onClick={() => navigateTo(`/projects/${project.id}`, query)}
                    >
                      <div className={styles.resultIcon}>
                        <Folder size={15} />
                      </div>
                      <div className={styles.resultContent}>
                        <span className={styles.resultTitle}>{project.name}</span>
                        {project.description && (
                          <span className={styles.resultSub}>{project.description}</span>
                        )}
                      </div>
                      <ArrowRight size={14} className={styles.resultArrow} />
                    </button>
                  ))}
                </div>
              )}

              {/* Tasks */}
              {results.tasks.length > 0 && (
                <div className={styles.section}>
                  <p className={styles.sectionLabel}>
                    <CheckSquare size={12} />
                    Tasks
                  </p>
                  {results.tasks.map((task) => (
                    <button
                      key={task.id}
                      className={`${styles.resultItem} ${styles.taskItem}`}
                      onClick={() => navigateTo(`/projects/${task.project_id}`, query)}
                    >
                      <div className={styles.resultContent}>
                        <div className={styles.taskMeta}>
                          <span
                            className={`${styles.statusBadge} ${styles[`status_${task.status}`]}`}
                          >
                            {STATUS_LABELS[task.status]}
                          </span>
                          <span
                            className={`${styles.priorityBadge} ${styles[PRIORITY_CLASS[task.priority]]}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <span className={styles.resultTitle}>{task.title}</span>
                        <span className={styles.resultSub}>in {task.project_name}</span>
                      </div>
                      <ArrowRight size={14} className={styles.resultArrow} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer hint */}
        {totalResults > 0 && (
          <div className={styles.footer}>
            <span>
              {totalResults} result{totalResults !== 1 ? 's' : ''}
            </span>
            <span>Click to navigate</span>
          </div>
        )}
      </div>
    </div>
  );
};
