import { auth } from './auth';

const BASE_URL = 'http://localhost:4000';
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 600;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  attempt = 0
): Promise<T> {
  const token = auth.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS);
      return apiFetch<T>(path, options, attempt + 1);
    }
    throw networkErr;
  }

  if (response.status === 401) {
    const isAuthRoute = path.includes('/auth/login') || path.includes('/auth/register');
    if (!isAuthRoute) {
      auth.logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw new Error('Invalid credentials');
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    const message =
      (errorData as { message?: string; error?: string }).message ??
      (errorData as { message?: string; error?: string }).error ??
      'Something went wrong';

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
