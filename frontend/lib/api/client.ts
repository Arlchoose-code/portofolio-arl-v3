import { ApiResponse, ApiPaginatedResponse } from '@/types';

export class ApiClient {
  private basePath = '/api/proxy';
  private isRefreshing = false;
  private refreshSubscribers: Array<(success: boolean) => void> = [];

  private onRefreshed(success: boolean) {
    this.refreshSubscribers.forEach((cb) => cb(success));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (success: boolean) => void) {
    this.refreshSubscribers.push(cb);
  }

  async request<T = any>(endpoint: string, options?: RequestInit, isRetry = false): Promise<ApiResponse<T>> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${this.basePath}/${cleanEndpoint}`;

    try {
      const res = await fetch(url, {
        ...options,
        credentials: options?.credentials || 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const data = await res.json();

      // Handle 401 Unauthorized with Automatic Silent Refresh
      const isAuthEndpoint =
        cleanEndpoint.includes('auth/login') ||
        cleanEndpoint.includes('auth/logout') ||
        cleanEndpoint.includes('auth/refresh') ||
        cleanEndpoint.includes('auth/forgot-password') ||
        cleanEndpoint.includes('auth/reset-password');

      if (res.status === 401 && !isRetry && !isAuthEndpoint) {
        if (!this.isRefreshing) {
          this.isRefreshing = true;
          try {
            const refreshRes = await fetch(`${this.basePath}/admin/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            });
            const refreshData = await refreshRes.json();
            this.isRefreshing = false;

            if (refreshData.status) {
              this.onRefreshed(true);
              return this.request<T>(endpoint, options, true);
            } else {
              this.onRefreshed(false);
              if (
                typeof window !== 'undefined' &&
                window.location.pathname.startsWith('/admin') &&
                window.location.pathname !== '/admin/login' &&
                window.location.pathname !== '/admin/forgot-password' &&
                window.location.pathname !== '/admin/reset-password'
              ) {
                window.location.href = '/admin/login?expired=1';
              }
            }
          } catch {
            this.isRefreshing = false;
            this.onRefreshed(false);
          }
        } else {
          return new Promise<ApiResponse<T>>((resolve) => {
            this.addRefreshSubscriber((success) => {
              if (success) {
                resolve(this.request<T>(endpoint, options, true));
              } else {
                resolve(data);
              }
            });
          });
        }
      }

      return data;
    } catch (err: any) {
      return {
        status: false,
        message: err?.message || 'Network request failed',
        data: null as any,
      };
    }
  }

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          search.append(k, String(v));
        }
      });
      const qs = search.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async getPaginated<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiPaginatedResponse<T>> {
    const res = await this.get<T[]>(endpoint, params);
    return res as unknown as ApiPaginatedResponse<T>;
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T = any>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = `${this.basePath}/${cleanEndpoint}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      return await res.json();
    } catch (err: any) {
      return {
        status: false,
        message: err?.message || 'Upload failed',
        data: null as any,
      };
    }
  }
}

export const client = new ApiClient();
