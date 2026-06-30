// In-memory token store (per constitution: no localStorage/sessionStorage)
let _token: string | null = null;
let _expiresAt: number | null = null;

export function setAuthToken(token: string): void   { _token = token; }
export function setTokenExpiry(expiresIn: number): void { _expiresAt = Date.now() + expiresIn * 1000; }
export function clearAuthToken(): void              { _token = null; _expiresAt = null; }
export function hasAuthToken(): boolean             { return _token !== null; }
export function isTokenExpired(): boolean           { return _expiresAt !== null && Date.now() > _expiresAt; }

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly body: string) {
    super(`API ${status}: ${body}`);
  }
}

const base = (): string => (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

function authHeaders(): Record<string, string> {
  return _token ? { Authorization: `Bearer ${_token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  if (isTokenExpired()) {
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new ApiError(401, 'token expired');
  }

  const headers: Record<string, string> = { ...authHeaders() };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${base()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new ApiError(res.status, text);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function requestForm<T>(method: string, path: string, form: FormData): Promise<T> {
  if (isTokenExpired()) {
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new ApiError(401, 'token expired');
  }
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new ApiError(res.status, text);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function requestBlob(path: string): Promise<Blob> {
  const res = await fetch(`${base()}${path}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text);
  }
  return res.blob();
}

export const httpClient = {
  get:      <T>(path: string)                          => request<T>('GET',   path),
  post:     <T>(path: string, body?: unknown)          => request<T>('POST',  path, body),
  patch:    <T>(path: string, body: unknown)           => request<T>('PATCH', path, body),
  blob:     (path: string)                             => requestBlob(path),
  postForm: <T>(path: string, form: FormData)          => requestForm<T>('POST', path, form),
};
