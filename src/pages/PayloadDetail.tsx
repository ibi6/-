import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui/Button'
import {
  ProtocolBadge,
  SeverityBadge,
  Tag,
  TypeBadge,
} from '../components/ui/Badge'
import { HexViewer } from '../components/HexViewer'
import { ErrorState, PageLoading } from '../components/ui/Loading'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { api, type ApiPayload, type ApiSession, type ApiTask } from '../lib/api'
import { formatBytes, formatTime } from '../lib/format'
import type { PayloadType, Severity } from '../types'
import { cn } from '../lib/cn'

type Tab = 'preview' | 'hex' | 'ascii' | 'meta'

export function PayloadDetail() {
  const { id = '' } = useParams()
  const [payload, setPayload] = useState<ApiPayload | null>(null)
  const [session, setSession] = useState<ApiSession | null>(null)
  const [task, setTask] = useState<ApiTask | null>(null)
  const [tab, setTab] = useState<Tab>('preview')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const p = await api.payload(id)
        setPayload(p)
        if (p.session_id) {
          const sessions = await api.sessions({ task_id: p.task_id })
          setSession(sessions.find((s) => s.id === p.session_id) ?? null)
        }
        setTask(await api.task(p.task_id))
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) return <PageLoading />
  if (error || !payload) {
    return <ErrorState title="载荷不存在" message={error || `未找到 ID ${id}`} />
  }

  const copyPreview = async () => {
    setCopyError('')
    try {
      await navigator.clipboard.writeText(payload.preview)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopyError('复制失败，请选择预览内容后手动复制。')
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'preview', label: '结构化预览' },
    { key: 'hex', label: 'Hex 视图' },
    { key: 'ascii', label: 'ASCII' },
    { key: 'meta', label: '元数据' },
  ]

  return (
    <div>
      <PageHeader
        title="载荷详情"
        subtitle={payload.summary}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => void copyPreview()}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? '已复制' : '复制内容'}
            </Button>
            <Link to="/payloads">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                返回
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <TypeBadge type={payload.type as PayloadType} />
        <ProtocolBadge protocol={payload.protocol} />
        <SeverityBadge severity={payload.severity as Severity} />
        {payload.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>

      {copyError ? (
        <div role="alert" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {copyError}
        </div>
      ) : null}

      <div className="mb-5 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '载荷 ID', value: String(payload.id) },
          { label: 'Content-Type', value: payload.content_type },
          { label: '大小', value: formatBytes(payload.size) },
          {
            label: '时间',
            value: payload.timestamp ? formatTime(payload.timestamp) : '—',
          },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-xs text-muted">{item.label}</p>
            <p className="mt-1.5 break-all font-mono text-sm text-ink-900">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div
            className="flex flex-wrap gap-1 border-b border-black/[0.04] px-2 pt-2"
            role="tablist"
            aria-label="载荷内容视图"
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                id={`payload-tab-${t.key}`}
                type="button"
                onClick={() => setTab(t.key)}
                role="tab"
                aria-selected={tab === t.key}
                aria-controls={`payload-panel-${t.key}`}
                className={cn(
                  'focus-ring min-h-11 rounded-t-xl px-4 py-2.5 text-sm font-medium transition',
                  tab === t.key
                    ? 'bg-white text-[var(--accent-deep)] shadow-sm'
                    : 'text-muted hover:text-ink-800',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <CardBody>
            <div
              id={`payload-panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`payload-tab-${tab}`}
              tabIndex={0}
              className="focus-ring rounded-2xl"
            >
              {tab === 'preview' && (
                <pre className="max-h-[480px] overflow-auto rounded-2xl border border-line bg-[#0f1724] p-4 font-mono text-xs leading-relaxed text-emerald-300/90">
                  {payload.preview}
                </pre>
              )}
              {tab === 'hex' && <HexViewer hex={payload.hex_sample || ''} />}
              {tab === 'ascii' && (
                <pre className="max-h-[480px] overflow-auto rounded-2xl border border-line bg-[#fafbfc] p-4 font-mono text-xs text-ink-800">
                  {payload.ascii_sample}
                </pre>
              )}
              {tab === 'meta' && (
                <div className="max-w-full overflow-x-auto rounded-2xl border border-line">
                  <table className="w-full min-w-[420px] text-sm">
                    <tbody>
                      {Object.entries(payload.metadata || {}).map(([k, v]) => (
                        <tr key={k} className="border-b border-black/[0.04] last:border-0">
                          <td className="w-1/3 bg-[#fafbfc] px-4 py-2.5 font-mono text-xs text-muted">{k}</td>
                          <td className="break-all px-4 py-2.5 font-mono text-xs text-ink-800">{String(v)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="来源会话" />
            <CardBody className="space-y-2 text-sm">
              {session ? (
                <>
                  <Row label="会话 ID" value={String(session.id)} />
                  <Row label="源" value={`${session.src_ip}:${session.src_port}`} />
                  <Row label="目的" value={`${session.dst_ip}:${session.dst_port}`} />
                  <Row label="应用" value={session.application} />
                </>
              ) : (
                <p className="text-muted">会话信息缺失</p>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="所属任务" />
            <CardBody className="space-y-2 text-sm">
              {task ? (
                <>
                  <Row label="任务" value={task.name} />
                  <Row label="文件" value={task.filename} />
                  <Link to={`/tasks/${task.id}`} className="focus-ring inline-block rounded pt-1 text-xs text-[var(--accent-deep)] hover:underline">
                    查看任务详情 →
                  </Link>
                </>
              ) : (
                <p className="text-muted">任务信息缺失</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right font-mono text-xs text-ink-800">{value}</span>
    </div>
  )
}
