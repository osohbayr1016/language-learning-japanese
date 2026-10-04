import { resolveApiBase } from './publicUrl';
import { getItem, removeItem, setItem } from '../storage';
import {
  AUTH_ACCESS_TOKEN_KEY,
  AUTH_REFRESH_TOKEN_KEY,
} from '../auth/tokenStorageKeys';
import { emitAccessTokenRefreshed, emitSessionCleared } from '../auth/authEvents';

const REQUEST_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  status: number;
  code: string | null;
  requestId: string | null;

  constructor(
    message: string,
    opts: { status?: number; code?: string | null; requestId?: string | null } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status ?? 0;
    this.code = opts.code ?? null;
    this.requestId = opts.requestId ?? null;
  }
}

/** Resolve at call time so static web bundles get the live origin (not build-time undefined). */
export function getApiBase(): string {
  return resolveApiBase();
}

function isAuthPathWithoutRetry(path: string): boolean {
  const p = path.split('?')[0];
  return (
    p === '/api/auth/refresh' ||
    p === '/api/auth/login' ||
    p === '/api/auth/register' ||
    p === '/api/auth/logout'
  );
}

function apiMessageForNetworkFailure(error: unknown): string {
  if (error instanceof Error && error.name === 'AbortError') {
    return 'Сервер хэт удаан хариуллаа. Интернэтээ шалгаад дахин оролдоно уу.';
  }
  return 'Сервертэй холбогдож чадсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу.';
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  if (init.signal) return fetch(url, init);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(apiMessageForNetworkFailure(error), {
      code: error instanceof Error && error.name === 'AbortError' ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function parseFailure(res: Response, text: string): Promise<ApiError> {
  let message = `HTTP ${res.status}`;
  let code: string | null = null;
  let responseRequestId: string | null = null;

  try {
    const j = JSON.parse(text) as {
      error?: string;
      code?: string;
      request_id?: string;
    };
    if (typeof j?.error === 'string' && j.error) message = j.error;
    if (typeof j?.code === 'string' && j.code) code = j.code;
    if (typeof j?.request_id === 'string' && j.request_id) responseRequestId = j.request_id;
  } catch {
    /* non-JSON failure body */
  }

  const requestId = res.headers.get('X-Request-ID') || responseRequestId;
  return new ApiError(message, { status: res.status, code, requestId });
}

let refreshInFlight: Promise<string> | null = null;

async function fetchAccessTokenWithRefresh(refreshToken: string): Promise<string> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const base = getApiBase();
    const res = await fetchWithTimeout(`${base}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const text = await res.text();

    if (!res.ok) throw await parseFailure(res, text);
    if (!text.trim()) throw new ApiError('Сервер хоосон хариу өглөө', { code: 'EMPTY_RESPONSE' });

    const parsed = JSON.parse(text) as { data?: { access_token?: string } };
    const access = parsed.data?.access_token;
    if (!access) {
      throw new ApiError('Шинэ access token ирсэнгүй', { code: 'INVALID_REFRESH_RESPONSE' });
    }
    return access;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function clearStoredSession(): Promise<void> {
  await removeItem(AUTH_ACCESS_TOKEN_KEY);
  await removeItem(AUTH_REFRESH_TOKEN_KEY);
  emitSessionCleared();
}

async function doFetch(
  path: string,
  rest: RequestInit,
  token: string | undefined
): Promise<{ res: Response; text: string }> {
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((rest.headers as Record<string, string>) ?? {}),
  };

  if (rest.body != null && rest.body !== '') {
    headers['Content-Type'] = 'application/json';
  }

  const base = getApiBase();
  const res = await fetchWithTimeout(`${base}${path}`, { ...rest, headers });
  const text = await res.text();
  return { res, text };
}

function parseOkResponse<T>(res: Response, text: string): T {
  if (!text.trim()) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(
      'API буруу хариу өглөө. EXPO_PUBLIC_API_URL нь япон API Workers (nihongo-mn-api.*.workers.dev) байх ёстой.',
      {
        status: res.status,
        code: 'INVALID_JSON_RESPONSE',
        requestId: res.headers.get('X-Request-ID'),
      }
    );
  }
}

export async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token: tokenOpt, ...rest } = options;
  let token = tokenOpt;

  let { res, text } = await doFetch(path, rest, token);

  if (res.status === 401 && tokenOpt && !isAuthPathWithoutRetry(path)) {
    const refresh = await getItem(AUTH_REFRESH_TOKEN_KEY);

    if (!refresh) {
      await clearStoredSession();
      throw new ApiError('Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.', {
        status: 401,
        code: 'SESSION_EXPIRED',
        requestId: res.headers.get('X-Request-ID'),
      });
    }

    try {
      const newAccess = await fetchAccessTokenWithRefresh(refresh);
      await setItem(AUTH_ACCESS_TOKEN_KEY, newAccess);
      emitAccessTokenRefreshed(newAccess);
      token = newAccess;
      ({ res, text } = await doFetch(path, rest, token));
    } catch (error) {
      await clearStoredSession();
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') throw error;
      if (error instanceof ApiError && error.code === 'REQUEST_TIMEOUT') throw error;
      throw new ApiError('Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.', {
        status: 401,
        code: 'SESSION_EXPIRED',
        requestId: error instanceof ApiError ? error.requestId : null,
      });
    }

    if (res.status === 401) {
      await clearStoredSession();
      throw new ApiError('Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.', {
        status: 401,
        code: 'SESSION_EXPIRED',
        requestId: res.headers.get('X-Request-ID'),
      });
    }
  }

  if (!res.ok) throw await parseFailure(res, text);
  return parseOkResponse<T>(res, text);
}

export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return '';
  const usp = new URLSearchParams();
  entries.forEach(([k, v]) => usp.append(k, String(v)));
  return `?${usp.toString()}`;
}
