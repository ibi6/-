/**
 * 最优默认：相对路径 /api/v1
 * - 开发：Vite 代理到 http://127.0.0.1:8001
 * - 生产：同源 Nginx 反代 /api
 * 如需直连后端，设置 VITE_API_BASE=http://127.0.0.1:8001/api/v1
 */
const API_BASE = import.meta.env?.VITE_API_BASE ?? '/api/v1'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function errorMessage(detail: unknown, fallback: string): string {
  if (typeof detail === 'string' && detail.trim()) return detail.trim()
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (!item || typeof item !== 'object' || !('msg' in item)) return ''
        return typeof item.msg === 'string' ? item.msg.trim() : ''
      })
      .filter(Boolean)
    if (messages.length) return messages.join('；')
  }
  return fallback || '请求失败，请稍后重试'
}

function setTrimmed(sp: URLSearchParams, key: string, value?: string) {
  const normalized = value?.trim()
  if (normalized) sp.set(key, normalized)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    let message = res.statusText
    try {
      const data: unknown = await res.json()
      const detail = data && typeof data === 'object' && 'detail' in data ? data.detail : undefined
      message = errorMessage(detail, message)
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export interface ApiTask {
  id: number
  name: string
  filename: string
  file_size: number
  status: string
  progress: number
  packet_count: number
  session_count: number
  payload_count: number
  protocols: string[]
  error_message?: string | null
  duration_ms: number
  created_at?: string | null
  finished_at?: string | null
}

export interface ApiSession {
  id: number
  task_id: number
  src_ip: string
  src_port: number
  dst_ip: string
  dst_port: number
  protocol: string
  application: string
  packets: number
  bytes: number
  payload_bytes: number
  status: string
  start_time?: string | null
  end_time?: string | null
  payload_ids: number[]
}

export interface ApiPayload {
  id: number
  task_id: number
  session_id: number | null
  type: string
  protocol: string
  application: string
  content_type: string
  size: number
  summary: string
  preview: string
  hex_sample: string
  ascii_sample: string
  metadata: Record<string, unknown>
  tags: string[]
  severity: string
  timestamp?: string | null
}

export interface ApiAlert {
  id: number
  task_id: number | null
  level: string
  title: string
  detail: string
  status: string
  created_at?: string | null
}

export interface ApiLog {
  id: number
  module: string
  level: string
  message: string
  created_at?: string | null
}

export interface ApiProtocolStat {
  protocol: string
  count: number
  bytes: number
  percent: number
}

export interface ApiDashboard {
  capture_total: number
  payload_total: number
  protocol_count: number
  anomaly_count: number
  uptime: string
  capture_trend: number
  payload_trend: number
  protocol_trend: number
  anomaly_trend: number
  protocol_stats: ApiProtocolStat[]
  recent_tasks: ApiTask[]
  recent_payloads: ApiPayload[]
  recent_alerts: ApiAlert[]
  timeline: { time: string; packets: number; payloads: number }[]
}

export interface ApiSettings {
  max_upload_mb: number
  auto_extract: boolean
  deep_inspection: boolean
  retain_days: number
  hex_columns: number
  storage_path: string
  enabled_protocols: string[]
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  dashboard: () => request<ApiDashboard>('/dashboard'),
  tasks: (params?: { status?: string; q?: string }) => {
    const sp = new URLSearchParams()
    setTrimmed(sp, 'status', params?.status)
    setTrimmed(sp, 'q', params?.q)
    const qs = sp.toString()
    return request<ApiTask[]>(`/tasks${qs ? `?${qs}` : ''}`)
  },
  task: (id: number | string) => request<ApiTask>(`/tasks/${id}`),
  upload: async (file: File, name?: string) => {
    const fd = new FormData()
    fd.append('file', file)
    if (name) fd.append('name', name)
    return request<ApiTask>('/tasks/upload', { method: 'POST', body: fd })
  },
  reparse: (id: number) =>
    request<{ message: string }>(`/tasks/${id}/reparse`, { method: 'POST' }),
  sessions: (params?: { task_id?: number; protocol?: string; q?: string }) => {
    const sp = new URLSearchParams()
    if (params?.task_id != null) sp.set('task_id', String(params.task_id))
    setTrimmed(sp, 'protocol', params?.protocol)
    setTrimmed(sp, 'q', params?.q)
    const qs = sp.toString()
    return request<ApiSession[]>(`/sessions${qs ? `?${qs}` : ''}`)
  },
  payloads: (params?: {
    task_id?: number
    session_id?: number
    type?: string
    q?: string
  }) => {
    const sp = new URLSearchParams()
    if (params?.task_id != null) sp.set('task_id', String(params.task_id))
    if (params?.session_id != null) sp.set('session_id', String(params.session_id))
    setTrimmed(sp, 'type', params?.type)
    setTrimmed(sp, 'q', params?.q)
    const qs = sp.toString()
    return request<ApiPayload[]>(`/payloads${qs ? `?${qs}` : ''}`)
  },
  payload: (id: number | string) => request<ApiPayload>(`/payloads/${id}`),
  alerts: (params?: { level?: string; status?: string }) => {
    const sp = new URLSearchParams()
    setTrimmed(sp, 'level', params?.level)
    setTrimmed(sp, 'status', params?.status)
    const qs = sp.toString()
    return request<ApiAlert[]>(`/alerts${qs ? `?${qs}` : ''}`)
  },
  resolveAlert: (id: number) =>
    request<ApiAlert>(`/alerts/${id}/resolve`, { method: 'POST' }),
  logs: () => request<ApiLog[]>('/logs'),
  protocolStats: () => request<ApiProtocolStat[]>('/stats/protocols'),
  settings: () => request<ApiSettings>('/settings'),
  saveSettings: (body: ApiSettings) =>
    request<ApiSettings>('/settings', { method: 'PUT', body: JSON.stringify(body) }),
}
