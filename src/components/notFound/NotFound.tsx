import Link from 'next/link';

import styles from './NotFound.module.css';

export default function NotFoundComponent() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.glowOrb} aria-hidden />

        <div className={styles.errorCode}>
          <span className={styles.digit}>4</span>
          <span className={styles.zeroWrapper} aria-hidden>
            <span className={styles.zeroInner}>
              <svg
                className={styles.zeroIcon}
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <rect
                  x="4"
                  y="4"
                  width="40"
                  height="40"
                  rx="12"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M16 24h16M24 16v16"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </span>
          <span className={styles.digit}>4</span>
        </div>

        <div className={styles.badge}>Page Not Found</div>

        <h1 className={styles.title}>Looks like this task got deleted</h1>
        <p className={styles.subtitle}>
          The page you&apos;re looking for doesn&apos;t exist, was moved, or you may have followed a
          broken link. Either way — we&apos;ve got nothing to show here.
        </p>

        <div className={styles.actions}>
          <Link href="/dashboard" className={styles.primaryAction}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="9 22 9 12 15 12 15 22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Go to Dashboard
          </Link>
          <Link href="/projects" className={styles.secondaryAction}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Browse Projects
          </Link>
        </div>

        <div className={styles.hint}>
          <span className={styles.hintDot} />
          <p>
            If you were linked here from somewhere, it&apos;s probably safe to{' '}
            <Link href="/dashboard" className={styles.hintLink}>
              start fresh
            </Link>
            .
          </p>
        </div>
      </div>

      <div className={styles.gridBg} aria-hidden />
    </div>
  );
}
