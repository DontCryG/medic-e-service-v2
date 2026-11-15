import { supabase } from './supabase';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new ApiError('กรุณาเข้าสู่ระบบก่อนทำรายการ', 401);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const body: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    message: `API Error: ${res.status} ${res.statusText}`,
  }));

  if (!res.ok || !body.success) {
    throw new ApiError(body.message || `Request failed with status ${res.status}`, res.status);
  }

  return body;
}

export const api = {
  duty: {
    clockIn: async (targetDiscordId?: string) => {
      return request('/api/duty/clock-in', {
        method: 'POST',
        body: JSON.stringify({ target_discord_id: targetDiscordId || null }),
      });
    },

    toggleBreak: async (targetDiscordId?: string) => {
      return request<{ status: string }>('/api/duty/toggle-break', {
        method: 'POST',
        body: JSON.stringify({ target_discord_id: targetDiscordId || null }),
      });
    },

    clockOut: async (targetDiscordId?: string) => {
      return request<{ deleted: boolean; total_duty_minutes: number }>('/api/duty/clock-out', {
        method: 'POST',
        body: JSON.stringify({ target_discord_id: targetDiscordId || null }),
      });
    },
  },

  queue: {
    updateStatus: async (status: string | null, targetDiscordId?: string) => {
      return request('/api/queue/status', {
        method: 'POST',
        body: JSON.stringify({
          status: status || null,
          target_discord_id: targetDiscordId || null,
        }),
      });
    },

    clear: async (targetDiscordId?: string) => {
      return request('/api/queue/clear', {
        method: 'POST',
        body: JSON.stringify({ target_discord_id: targetDiscordId || null }),
      });
    },
  },

  admin: {
    deleteUser: async (targetDiscordId: string) => {
      return request('/api/admin/user/delete', {
        method: 'POST',
        body: JSON.stringify({ target_discord_id: targetDiscordId }),
      });
    },
  },

  health: async () => {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return res.json();
  },
};
