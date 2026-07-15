export type TaskStatus = 'pending' | 'parsing' | 'extracting' | 'completed' | 'failed'
export type Protocol =
  | 'HTTP'
  | 'HTTPS'
  | 'DNS'
  | 'FTP'
  | 'SMTP'
  | 'TLS'
  | 'TCP'
  | 'UDP'
  | 'MQTT'
  | 'WebSocket'
export type PayloadType = 'text' | 'json' | 'html' | 'image' | 'binary' | 'form' | 'file'
export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical'

export interface CaptureTask {
  id: string
  name: string
  filename: string
  size: number
  status: TaskStatus
  progress: number
  createdAt: string
  finishedAt?: string
  packetCount: number
  sessionCount: number
  payloadCount: number
  protocols: Protocol[]
  durationMs: number
  errorMessage?: string
}

export interface FlowSession {
  id: string
  taskId: string
  fiveTuple: {
    srcIp: string
    srcPort: number
    dstIp: string
    dstPort: number
    protocol: Protocol
  }
  startTime: string
  endTime: string
  packets: number
  bytes: number
  payloadBytes: number
  application: string
  status: 'open' | 'closed' | 'timeout'
  payloadIds: string[]
}

export interface ExtractedPayload {
  id: string
  sessionId: string
  taskId: string
  type: PayloadType
  protocol: Protocol
  application: string
  contentType: string
  size: number
  timestamp: string
  summary: string
  preview: string
  hexSample: string
  asciiSample: string
  metadata: Record<string, string | number | boolean>
  tags: string[]
  severity: Severity
}

export interface ProtocolStat {
  protocol: Protocol
  count: number
  bytes: number
  percent: number
}

export interface TimelinePoint {
  time: string
  packets: number
  payloads: number
}

export interface ActivityItem {
  id: string
  type: 'task' | 'payload' | 'alert' | 'system'
  title: string
  detail: string
  time: string
  severity?: Severity
}

export interface SystemSettings {
  maxUploadMb: number
  autoExtract: boolean
  deepInspection: boolean
  retainDays: number
  hexColumns: number
  languages: string[]
  enabledProtocols: Protocol[]
  storagePath: string
}
