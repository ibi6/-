import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '../components/PageHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { ErrorState, PageLoading } from '../components/ui/Loading'
import { api, type ApiDashboard, type ApiTask } from '../lib/api'
import { formatBytes } from '../lib/format'
import { useTheme } from '../theme/useTheme'

export function Stats() {
  const { palette } = useTheme()
  const [dash, setDash] = useState<ApiDashboard | null>(null)
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [d, t] = await Promise.all([api.dashboard(), api.tasks()])
      setDash(d)
      setTasks(t)
      setError('')
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
  if (error || !dash) return <ErrorState message={error || '无数据'} onRetry={load} />

  const completed = tasks.filter((t) => t.status === 'completed').length
  const totalBytes = dash.protocol_stats.reduce((s, p) => s + p.bytes, 0)

  return (
    <div>
      <PageHeader title="数据统计" subtitle="捕获、提取与协议维度汇总" />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '捕获包总数', value: dash.capture_total.toLocaleString() },
          { label: '提取载荷总数', value: dash.payload_total.toLocaleString() },
          { label: '协议总流量', value: formatBytes(totalBytes) },
          { label: '完成任务', value: `${completed} / ${tasks.length}` },
        ].map((m) => (
          <Card key={m.label} className="p-5">
            <p className="text-[12px] text-muted">{m.label}</p>
            <p className="mt-2 text-xl font-semibold text-ink-900">{m.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-5">
        <CardHeader title="任务流量趋势（按任务时间）" />
        <CardBody className="h-[320px] !pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dash.timeline}>
              <defs>
                <linearGradient id="sFlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.accent} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={palette.accent} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sPay" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.secondary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={palette.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eef1f3" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: '#8b95a1', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8b95a1', fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e8eceb',
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="packets" name="流量" stroke={palette.accent} fill="url(#sFlow)" strokeWidth={2} />
              <Area type="monotone" dataKey="payloads" name="载荷" stroke={palette.secondary} fill="url(#sPay)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="任务处理统计" />
        <CardBody className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-black/[0.04] text-muted">
                  <th className="px-5 py-3 font-medium">任务</th>
                  <th className="px-4 py-3 font-medium">文件大小</th>
                  <th className="px-4 py-3 font-medium">数据包</th>
                  <th className="px-4 py-3 font-medium">会话</th>
                  <th className="px-4 py-3 font-medium">载荷</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="border-b border-black/[0.03] last:border-0">
                    <td className="px-5 py-3 text-ink-800">{t.name}</td>
                    <td className="px-4 py-3 font-mono text-ink-600">{formatBytes(t.file_size)}</td>
                    <td className="px-4 py-3 font-mono text-ink-600">{t.packet_count.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-ink-600">{t.session_count.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-ink-600">{t.payload_count.toLocaleString()}</td>
                    <td className="px-5 py-3 text-ink-700">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
