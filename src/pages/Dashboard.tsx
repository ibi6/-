import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowUpRight,
  Clock,
  Layers,
  Network,
  ShieldAlert,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { ProtocolBadge, StatusBadge } from '../components/ui/Badge'
import { ErrorState, PageLoading } from '../components/ui/Loading'
import { api, type ApiDashboard } from '../lib/api'
import { formatBytes, formatTime } from '../lib/format'
import { cn } from '../lib/cn'

const levelStyle: Record<string, string> = {
  high: 'bg-rose-50 text-rose-700 ring-rose-100',
  medium: 'bg-orange-50 text-orange-700 ring-orange-100',
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  info: 'bg-sky-50 text-sky-700 ring-sky-100',
  critical: 'bg-rose-50 text-rose-700 ring-rose-100',
}

const levelLabel: Record<string, string> = {
  high: '高危',
  medium: '中危',
  low: '低危',
  info: '提示',
  critical: '严重',
}

const barColors = ['bg-[var(--accent)]', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-sky-500']

export function Dashboard() {
  const [data, setData] = useState<ApiDashboard | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api.dashboard())
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading) return <PageLoading />
  if (error || !data) {
    return (
      <ErrorState
        title="无法连接后端"
        message={error || '请先启动 backend：uvicorn app.main:app --port 8001'}
        onRetry={load}
      />
    )
  }

  const topProtocols = data.protocol_stats.slice(0, 5)
  const maxProtocol = Math.max(...topProtocols.map((p) => p.percent), 1)

  const metrics = [
    {
      label: '捕获流量总数',
      value: data.capture_total.toLocaleString(),
      hint: `较昨日 ↑ ${data.capture_trend}%`,
      icon: Activity,
      iconBg: 'bg-ink-900',
      iconColor: 'text-teal-300',
    },
    {
      label: '提取载荷总数',
      value: data.payload_total.toLocaleString(),
      hint: `较昨日 ↑ ${data.payload_trend}%`,
      icon: Layers,
      iconBg: 'bg-[var(--accent-soft)]',
      iconColor: 'text-[var(--accent-deep)]',
    },
    {
      label: '识别应用协议',
      value: String(data.protocol_count),
      hint: `协议种类 ${data.protocol_trend}`,
      icon: Network,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
    },
    {
      label: '异常/告警',
      value: String(data.anomaly_count),
      hint: '开放告警数',
      icon: ShieldAlert,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
    },
    {
      label: '系统状态',
      value: data.uptime,
      hint: '后端在线',
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ]

  return (
    <div>
      <PageHeader
        title="调查工作台"
        subtitle="监看解析引擎、协议分布与风险载荷的实时状态"
      />

      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
        {metrics.map((m, index) => {
          const primary = index === 0
          return (
          <Card
            key={m.label}
            className={cn(
              'min-h-[126px] p-4 transition duration-200 hover:-translate-y-0.5 sm:min-h-0 sm:p-5',
              primary
                ? 'metric-card-primary col-span-2 xl:col-span-2'
                : 'metric-card xl:col-span-1',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={cn('text-[12px] font-medium', primary ? 'text-white/55' : 'text-muted')}>
                  {m.label}
                </div>
                <div className={cn('mt-2 text-[24px] font-semibold leading-none tabular-nums sm:text-[26px]', primary ? 'text-white' : 'text-ink-900')}>
                  {m.value}
                </div>
                <div className={cn('mt-2.5 text-[11px]', primary ? 'text-white/55' : 'text-muted')}>
                  {m.hint}
                </div>
              </div>
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10',
                  primary ? 'bg-white/10 text-[var(--accent-2)] ring-1 ring-white/10' : m.iconBg,
                  primary ? '' : m.iconColor,
                )}
              >
                <m.icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
              </div>
            </div>
          </Card>
          )
        })}
      </div>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="协议流量分布" subtitle="按会话占比" />
          <CardBody className="space-y-5">
            {topProtocols.length === 0 ? (
              <p className="text-sm text-muted">暂无协议数据，请先上传 PCAP</p>
            ) : (
              topProtocols.map((p, i) => (
                <div key={p.protocol}>
                  <div className="mb-1.5 flex justify-between text-[13px]">
                    <span className="text-ink-700">{p.protocol}</span>
                    <span className="font-medium tabular-nums text-ink-800">
                      {p.percent}% · {formatBytes(p.bytes)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#eef1f3]">
                    <div
                      className={cn('h-full rounded-full', barColors[i % barColors.length])}
                      style={{ width: `${(p.percent / maxProtocol) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="最新告警"
            action={
              <Link to="/alerts" className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--accent-deep)]">
                全部 <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {data.recent_alerts.length === 0 ? (
              <p className="text-sm text-muted">暂无告警</p>
            ) : (
              data.recent_alerts.map((a) => (
                <div key={a.id} className="flex gap-2.5">
                  <span
                    className={cn(
                      'mt-0.5 h-fit shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                      levelStyle[a.level] ?? levelStyle.info,
                    )}
                  >
                    {levelLabel[a.level] ?? a.level}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink-900">{a.title}</p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-muted">{a.detail}</p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="最近任务"
            action={
              <Link to="/capture" className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--accent-deep)]">
                流量捕获 <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardBody className="space-y-1 !pt-2">
            {data.recent_tasks.length === 0 ? (
              <p className="px-2.5 py-8 text-center text-sm text-muted">暂无解析任务</p>
            ) : data.recent_tasks.map((t) => (
              <Link
                key={t.id}
                to={`/tasks/${t.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl px-2.5 py-2.5 transition hover:bg-[#f6f8f9]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink-900">{t.name}</p>
                    <StatusBadge status={t.status as 'pending' | 'parsing' | 'extracting' | 'completed' | 'failed'} />
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
                    {t.filename} · {formatBytes(t.file_size)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm font-semibold text-ink-800">{t.payload_count}</p>
                  <p className="text-[11px] text-muted">载荷</p>
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="最新载荷提取"
            action={
              <Link to="/payloads" className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--accent-deep)]">
                载荷中心 <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardBody className="!p-0">
            {data.recent_payloads.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">暂无载荷记录</p>
            ) : null}
            <div className="hidden max-w-full overflow-x-auto sm:block">
              <table className="w-full min-w-[480px] text-left text-[12px]">
                <thead>
                  <tr className="border-b border-black/[0.04] text-muted">
                    <th className="px-5 py-2.5 font-medium">时间</th>
                    <th className="px-3 py-2.5 font-medium">摘要</th>
                    <th className="px-3 py-2.5 font-medium">协议</th>
                    <th className="px-5 py-2.5 font-medium">大小</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_payloads.map((p) => (
                    <tr key={p.id} className="border-b border-black/[0.03] last:border-0 hover:bg-[#fafbfc]">
                      <td className="px-5 py-2.5 font-mono text-muted">
                        {p.timestamp ? formatTime(p.timestamp) : '—'}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2.5">
                        <Link to={`/payloads/${p.id}`} className="text-ink-800 hover:text-[var(--accent-deep)]">
                          {p.summary}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <ProtocolBadge protocol={p.protocol} />
                      </td>
                      <td className="px-5 py-2.5 font-mono text-ink-700">{formatBytes(p.size)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-black/[0.04] sm:hidden">
              {data.recent_payloads.map((p) => (
                <Link
                  key={p.id}
                  to={`/payloads/${p.id}`}
                  className="flex min-w-0 items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-ink-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink-900">{p.summary}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted">
                      {p.timestamp ? formatTime(p.timestamp) : '—'} · {formatBytes(p.size)}
                    </p>
                  </div>
                  <ProtocolBadge protocol={p.protocol} />
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
