'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
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

export default function LoginComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

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
      router.push('/dashboard');
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
