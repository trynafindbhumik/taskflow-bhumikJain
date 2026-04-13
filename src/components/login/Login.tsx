'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowRight, Eye, EyeOff, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button/Button';
import { Input } from '@/components/ui/input/Input';
import { useToast } from '@/components/ui/toast/ToastContext';
import { apiFetch } from '@/utils/api';
import { auth } from '@/utils/auth';
import type { AuthResponse } from '@/utils/types';

import styles from './Login.module.css';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof schema>;

const DEMO_EMAIL = 'test@example.com';
const DEMO_PASSWORD = 'password123';

export default function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  const handleCopyToClipboard = useCallback((text: string, field: 'email' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const handleFillDemoCredentials = useCallback(() => {
    setValue('email', DEMO_EMAIL);
    setValue('password', DEMO_PASSWORD);
  }, [setValue]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);

    try {
      const res = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      auth.setToken(res.token);
      auth.setUser(res.user);

      showToast(`Welcome back, ${res.user.name?.split(' ')[0]}!`, 'success');

      const redirect = searchParams.get('redirect');
      const redirectTo = redirect ? decodeURIComponent(redirect) : '/dashboard';

      router.push(redirectTo);
      reset(); // optional: clear form
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invalid email or password';

      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.demoCredentialsContainer}>
          <div className={styles.demoCredentialsHeader}>
            <h3 className={styles.demoCredentialsTitle}>Demo Credentials</h3>
            <button
              type="button"
              className={styles.fillButton}
              onClick={handleFillDemoCredentials}
              aria-label="Fill demo credentials"
            >
              Fill Demo
            </button>
          </div>

          <div className={styles.credentialsGrid}>
            <div className={styles.credentialItem}>
              <label className={styles.credentialLabel}>Email:</label>
              <div className={styles.credentialValue}>
                <code className={styles.credentialCode}>{DEMO_EMAIL}</code>
                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={() => handleCopyToClipboard(DEMO_EMAIL, 'email')}
                  aria-label="Copy email"
                >
                  {copiedField === 'email' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className={styles.credentialItem}>
              <label className={styles.credentialLabel}>Password:</label>
              <div className={styles.credentialValue}>
                <code className={styles.credentialCode}>{DEMO_PASSWORD}</code>
                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={() => handleCopyToClipboard(DEMO_PASSWORD, 'password')}
                  aria-label="Copy password"
                >
                  {copiedField === 'password' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <Input
          label="Email address"
          placeholder="you@example.com"
          type="email"
          icon={<Mail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Password</label>
          <div className={styles.passwordWrap}>
            <input
              className={styles.input}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password?.message && (
            <p className={styles.errorText}>{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" isLoading={isLoading} rightIcon={<ArrowRight size={16} />}>
          Sign in
        </Button>

        <p className={styles.switchText}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className={styles.switchLink}>
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
