// ============================================================
// PathMind API Client
// ============================================================

const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      detail = null;
    }
    throw new ApiError(response.status, `API error ${response.status}: ${response.statusText}`, detail);
  }

  return response.json() as Promise<T>;
}
