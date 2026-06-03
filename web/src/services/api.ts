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
  baseURL: '/api',
})

export function get<T>(url: string, query?: Record<string, any>) {
  return api<T>(url, {
    query,
    headers: createHeaders(),
  })
}

export function getById<T>(url: string, id: number) {
  return api<T>(`${url}/${id}`, {
    headers: createHeaders(),
  })
}

export function post<T>(url: string, body: any) {
  return api<T>(url, {
    method: 'POST',
    body,
    headers: createHeaders(),
  })
}

export function put<T>(url: string, id: number, body: any) {
  return api<T>(`${url}/${id}`, {
    method: 'PUT',
    body,
    headers: createHeaders(),
  })
}

export function del(url: string, id: number) {
  return api<{ message: string }>(`${url}/${id}`, {
    method: 'DELETE',
    headers: createHeaders(),
  })
}

export default {
  get,
  getById,
  post,
  put,
  del,
}
