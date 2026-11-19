import { supabase } from './supabase'

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

// DRF errors look like {"detail": "..."} or {"field": ["msg"]} or {"non_field_errors": [...]}
function messageFrom(data: any): string {
  if (!data) return 'Unknown error'
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  return Object.entries(data)
    .map(([k, v]) => (k === 'non_field_errors' ? '' : k + ': ') + (Array.isArray(v) ? v.join(' ') : String(v)))
    .join(' | ')
}

// Every call sends the Supabase access token; Django verifies it.
export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api' + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...init.headers },
  })
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, messageFrom(body))
  return body as T
}

export type Slot = { id: number; code: string; zone: string; occupied: boolean; reserved_until: string | null }
export type Reservation = {
  id: number; slot: number; slot_code: string; plate: string
  start_time: string; end_time: string; fee: string; user_id: string
}
