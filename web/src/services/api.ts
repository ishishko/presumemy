import { ofetch } from 'ofetch'

function createHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = localStorage.getItem('sb-token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

const api = ofetch.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

export function get<T>(url: string, query?: Record<string, any>, options?: any) {
  return api<T>(url, {
    query,
    headers: createHeaders(),
    ...options,
  })
}

export function getById<T>(url: string, id: number) {
  return api<T>(`${url}/${id}`, {
    headers: createHeaders(),
  })
}

export function post<T>(url: string, body: any): Promise<T> {
  return api<{ data: T }>(url, {
    method: 'POST',
    body,
    headers: createHeaders(),
  }).then(res => res.data)
}

export function put<T>(url: string, id: number, body: any): Promise<T> {
  return api<{ data: T }>(`${url}/${id}`, {
    method: 'PUT',
    body,
    headers: createHeaders(),
  }).then(res => res.data)
}

export function del(url: string, id: number) {
  return api<{ message: string }>(`${url}/${id}`, {
    method: 'DELETE',
    headers: createHeaders(),
  })
}

export function delWithBody<T>(url: string, id: number, body: any) {
  return api<T>(`${url}/${id}`, {
    method: 'DELETE',
    body,
    headers: createHeaders(),
  })
}

export function patch<T>(url: string, id: number | string, body: any): Promise<T> {
  return api<{ data: T }>(`${url}/${id}`, {
    method: 'PATCH',
    body,
    headers: createHeaders(),
  }).then(res => res.data)
}

export default {
  get,
  getById,
  post,
  put,
  del,
  delWithBody,
  patch,
}

