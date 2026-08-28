import { SystemHealthData } from '../types';

const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const API_BASE = rawBase.replace(/\/+$/, '');

export class ApiError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('bugforge_auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(
        json.message || `API error: ${res.statusText}`,
        res.status,
        json.error || json.details
      );
    }

    return json.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network request failed', 0);
  }
}

export const api = {
  baseURL: API_BASE,
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: any) =>
    request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  // Dedicated endpoints
  getHealth: () => api.get<SystemHealthData>('/health'),
};
