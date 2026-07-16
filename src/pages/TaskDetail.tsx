import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Binary, Network } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui/Button'
import { ProtocolBadge, StatusBadge, TypeBadge } from '../components/ui/Badge'
import { ErrorState, PageLoading } from '../components/ui/Loading'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { api, type ApiPayload, type ApiSession, type ApiTask } from '../lib/api'
import { formatBytes, formatDuration, formatTime } from '../lib/format'
import type { PayloadType, TaskStatus } from '../types'

export function TaskDetail() {
  const { id = '' } = useParams()
  const [task, setTask] = useState<ApiTask | null>(null)
  const [sessions, setSessions] = useState<ApiSession[]>([])
  const [payloads, setPayloads] = useState<ApiPayload[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const t = await api.task(id)
      setTask(t)
      const [ss, ps] = await Promise.all([
        api.sessions({ task_id: Number(id) }),
        api.payloads({ task_id: Number(id) }),
      ])
      setSessions(ss)
      setPayloads(ps)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), 2500)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading && !task) return <PageLoading />
  if (error || !task) {
    return <ErrorState title="任务不存在" message={error || `未找到 ID ${id}`} onRetry={load} />
  }

  return (
    <div>
      <PageHeader
        title={task.name}
        subtitle={`${task.filename} · #${task.id}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void api.reparse(task.id).then(load)}
            >
              重新解析
            </Button>
            <Link to="/capture">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4" />
                返回
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '状态', node: <StatusBadge status={task.status as TaskStatus} /> },
          { label: '文件大小', node: <span className="font-mono">{formatBytes(task.file_size)}</span> },
          {
            label: '解析耗时',
            node: (
              <span className="font-mono">
                {task.duration_ms ? formatDuration(task.duration_ms) : '进行中'}
              </span>
            ),
          },
          {
            label: '创建时间',
            node: (
              <span className="font-mono text-sm">
                {task.created_at ? formatTime(task.created_at) : '—'}
              </span>
            ),
          },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-xs text-muted">{item.label}</p>
            <div className="mt-2 text-ink-900">{item.node}</div>
          </Card>
        ))}
      </div>

      {task.error_message && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          <strong>错误：</strong>
          {task.error_message}
        </div>
      )}

      {(task.status === 'extracting' || task.status === 'parsing' || task.status === 'pending') && (
        <Card className="mb-5 p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-ink-600">处理进度</span>
            <span className="font-mono text-[var(--accent-deep)]">{task.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#eef1f3]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-emerald-400 transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </Card>
      )}

      <Card className="mb-5">
        <CardHeader title="识别协议" />
        <CardBody className="flex flex-wrap gap-2">
          {task.protocols.length ? (
            task.protocols.map((p) => <ProtocolBadge key={p} protocol={p} />)
          ) : (
            <span className="text-sm text-muted">尚未识别</span>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title={`关联会话 · ${sessions.length}`} />
          <CardBody className="divide-y divide-black/[0.04] !p-0">
            {sessions.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">暂无会话</p>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <Network className="h-4 w-4 shrink-0 text-[var(--accent-deep)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs text-ink-800">
                      {s.src_ip}:{s.src_port} → {s.dst_ip}:{s.dst_port}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{s.application}</p>
                  </div>
                  <ProtocolBadge protocol={s.protocol} />
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={`提取载荷 · ${payloads.length}`} />
          <CardBody className="divide-y divide-black/[0.04] !p-0">
            {payloads.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">暂无载荷</p>
            ) : (
              payloads.map((p) => (
                <Link
                  key={p.id}
                  to={`/payloads/${p.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-[#fafbfc]"
                >
                  <Binary className="h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink-900">{p.summary}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted">
                      {formatBytes(p.size)}
                      {p.timestamp ? ` · ${formatTime(p.timestamp)}` : ''}
                    </p>
                  </div>
                  <TypeBadge type={p.type as PayloadType} />
                </Link>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
