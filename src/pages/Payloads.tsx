import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import {
  ProtocolBadge,
  SeverityBadge,
  Tag,
  TypeBadge,
} from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Card, CardBody } from '../components/ui/Card'
import { ErrorState, PageLoading } from '../components/ui/Loading'
import { api, type ApiPayload } from '../lib/api'
import { formatBytes, formatTime } from '../lib/format'
import type { PayloadType, Severity } from '../types'
import { cn } from '../lib/cn'

const types: (PayloadType | 'all')[] = [
  'all',
  'json',
  'text',
  'binary',
  'file',
  'html',
  'form',
  'image',
]

export function Payloads() {
  const [params] = useSearchParams()
  const sessionFilter = params.get('session')
  const [q, setQ] = useState('')
  const [type, setType] = useState<PayloadType | 'all'>('all')
  const [view, setView] = useState<'table' | 'card'>('table')
  const [list, setList] = useState<ApiPayload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.payloads({
        session_id: sessionFilter ? Number(sessionFilter) : undefined,
        type: type === 'all' ? undefined : type,
        q: q || undefined,
      })
      setList(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionFilter, type])

  const filtered = useMemo(() => {
    if (!q) return list
    const ql = q.toLowerCase()
    return list.filter(
      (p) =>
        p.summary.toLowerCase().includes(ql) ||
        p.tags.some((t) => t.toLowerCase().includes(ql)) ||
        String(p.id).includes(ql),
    )
  }, [list, q])

  if (loading) return <PageLoading />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div>
      <PageHeader title="载荷提取" subtitle="应用层载荷列表（后端解析入库）" />

      {sessionFilter && (
        <div className="mb-4 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm text-teal-800">
          按会话过滤：
          <span className="ml-2 font-mono">{sessionFilter}</span>
          <Link to="/payloads" className="ml-3 text-xs underline">
            清除
          </Link>
        </div>
      )}

      <Card className="mb-5">
        <CardBody className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索摘要 / 标签 / ID"
              className="h-10 w-full rounded-2xl border border-line bg-white pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/12"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium uppercase',
                  type === t ? 'bg-teal-600 text-white' : 'border border-line text-ink-600 hover:bg-ink-50',
                )}
              >
                {t === 'all' ? '全部' : t}
              </button>
            ))}
            <div className="ml-1 flex overflow-hidden rounded-full border border-line">
              <button
                type="button"
                onClick={() => setView('table')}
                className={cn('px-3 py-1.5 text-xs', view === 'table' ? 'bg-teal-600 text-white' : 'text-ink-600')}
              >
                表格
              </button>
              <button
                type="button"
                onClick={() => setView('card')}
                className={cn('px-3 py-1.5 text-xs', view === 'card' ? 'bg-teal-600 text-white' : 'text-ink-600')}
              >
                卡片
              </button>
            </div>
          </div>
        </CardBody>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState title="暂无载荷" description="上传并解析 PCAP 后，这里会显示提取结果。" />
      ) : view === 'table' ? (
        <Card>
          <CardBody className="!p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-black/[0.04] text-muted">
                    <th className="px-5 py-3 font-medium">时间</th>
                    <th className="px-3 py-3 font-medium">协议</th>
                    <th className="px-3 py-3 font-medium">类型</th>
                    <th className="px-3 py-3 font-medium">摘要</th>
                    <th className="px-3 py-3 font-medium">大小</th>
                    <th className="px-5 py-3 font-medium">风险</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-black/[0.03] last:border-0 hover:bg-[#fafbfc]">
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted">
                        {p.timestamp ? formatTime(p.timestamp) : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <ProtocolBadge protocol={p.protocol} />
                      </td>
                      <td className="px-3 py-3">
                        <TypeBadge type={p.type as PayloadType} />
                      </td>
                      <td className="max-w-[320px] px-3 py-3">
                        <Link to={`/payloads/${p.id}`} className="truncate text-ink-800 hover:text-teal-700">
                          {p.summary}
                        </Link>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-ink-600">{formatBytes(p.size)}</td>
                      <td className="px-5 py-3">
                        <SeverityBadge severity={p.severity as Severity} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((p) => (
            <Link key={p.id} to={`/payloads/${p.id}`}>
              <Card className="h-full p-5 transition hover:border-teal-200">
                <div className="flex flex-wrap items-center gap-2">
                  <TypeBadge type={p.type as PayloadType} />
                  <ProtocolBadge protocol={p.protocol} />
                  <SeverityBadge severity={p.severity as Severity} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-ink-900">{p.summary}</h3>
                <p className="mt-1 font-mono text-[11px] text-muted">
                  #{p.id} · {formatBytes(p.size)}
                </p>
                <pre className="mt-3 max-h-24 overflow-hidden rounded-2xl border border-line bg-[#0f1724] p-3 font-mono text-[11px] text-emerald-300/90">
                  {p.preview}
                </pre>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
