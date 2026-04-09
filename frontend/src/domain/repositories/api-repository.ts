export interface ApiRepository {
  get<T>(url: string, params?: Record<string, string | number | undefined>): Promise<T>;
  post<T>(
    url: string,
    body?: unknown,
    options?: {
      headers?: Record<string, string>;
      timeoutMs?: number;
      suppressSuccessToast?: boolean;
    }
  ): Promise<T>;
  put<T>(url: string, body?: unknown): Promise<T>;
  patch<T>(url: string, body?: unknown): Promise<T>;
  delete(url: string): Promise<void>;
}
