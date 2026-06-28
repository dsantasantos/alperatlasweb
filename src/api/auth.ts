import { setAuthToken, setTokenExpiry, ApiError } from './client';
import type { ApiTokenResponse } from './types';
import type { Session } from '../types';

const base = (): string => (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export async function login(username: string, password: string): Promise<Session> {
  const res = await fetch(`${base()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text);
  }

  const data = (await res.json()) as ApiTokenResponse;
  setAuthToken(data.access_token);
  setTokenExpiry(data.expires_in);

  return { name: data.profile, role: 'user', profile: data.profile };
}
