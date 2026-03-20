export interface ApiRepository {
  get<T>(url: string, params?: Record<string, string | number | undefined>): Promise<T>;
  post<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<T>;
  put<T>(url: string, body?: unknown): Promise<T>;
  patch<T>(url: string, body?: unknown): Promise<T>;
  delete(url: string): Promise<void>;
}
