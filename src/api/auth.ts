import { setAuthToken, ApiError } from './client';
import type { ApiTokenResponse } from './types';

const base = (): string => (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export async function loginWithCredentials(
  clientId: string,
  clientSecret: string,
): Promise<void> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${base()}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text);
  }

  const data = (await res.json()) as ApiTokenResponse;
  setAuthToken(data.access_token);
}
