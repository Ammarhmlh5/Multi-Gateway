import type {
  Gateway,
  LoginResponse,
  SMSLog,
  StatsResponse,
} from './types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const TOKEN_KEY = 'telecom_suite_jwt';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    clearToken();
    throw new Error('Unauthorized — please log in again.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data && typeof data.error === 'string'
        ? data.error
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  baseURL: API_BASE_URL,

  async login(username: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse<LoginResponse>(res);
  },

  async getGateways(): Promise<Gateway[]> {
    const res = await fetch(`${API_BASE_URL}/api/admin/gateways`, {
      headers: authHeaders(),
    });
    return handleResponse<Gateway[]>(res);
  },

  async createGateway(name: string, slug: string): Promise<Gateway> {
    const res = await fetch(`${API_BASE_URL}/api/admin/gateways`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, slug }),
    });
    return handleResponse<Gateway>(res);
  },

  async getGatewayLogs(slug: string): Promise<SMSLog[]> {
    const res = await fetch(
      `${API_BASE_URL}/api/admin/gateways/${slug}/logs`,
      { headers: authHeaders() },
    );
    return handleResponse<SMSLog[]>(res);
  },

  async getStats(): Promise<StatsResponse> {
    const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      headers: authHeaders(),
    });
    return handleResponse<StatsResponse>(res);
  },

  async sendSMS(
    slug: string,
    apiKey: string,
    sender: string,
    to: string,
    text: string,
  ): Promise<unknown> {
    const res = await fetch(`${API_BASE_URL}/api/v1/gateway/${slug}/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({ sender, to, text }),
    });
    return handleResponse<unknown>(res);
  },
};
