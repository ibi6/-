import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '../components/PageHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { ErrorState, PageLoading } from '../components/ui/Loading'
import { api, type ApiProtocolStat, type ApiSession } from '../lib/api'
import { formatBytes } from '../lib/format'
import { useTheme } from '../theme/useTheme'

export function Protocols() {
  const { palette } = useTheme()
  const colors = palette.chart
  const [stats, setStats] = useState<ApiProtocolStat[]>([])
  const [sessions, setSessions] = useState<ApiSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [s, sess] = await Promise.all([api.protocolStats(), api.sessions()])
      setStats(s)
      setSessions(sess)
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
  if (error) return <ErrorState message={error} onRetry={load} />

  const pieData = stats.map((p) => ({ name: p.protocol, value: p.percent }))

  return (
    <div>
      <PageHeader title="协议分析" subtitle="会话维度协议识别与流量占比" />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          { label: '已识别协议', value: String(stats.length) },
          { label: '总会话数', value: sessions.length.toLocaleString() },
          { label: '主导协议', value: stats[0]?.protocol ?? '-' },
          { label: '主导占比', value: `${stats[0]?.percent ?? 0}%` },
        ].map((m) => (
          <Card key={m.label} className="min-w-0 p-4 sm:p-5">
            <p className="text-[12px] text-muted">{m.label}</p>
            <p className="mt-2 text-xl font-semibold text-ink-900">{m.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="协议流量占比" />
          <CardBody className="flex min-h-[300px] flex-col items-center sm:h-[300px] sm:flex-row">
            <div className="h-[210px] w-full min-w-0 shrink-0 sm:h-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={210}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e8eceb',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid w-full grid-cols-2 gap-x-5 gap-y-2 pt-2 sm:block sm:flex-1 sm:space-y-2 sm:pr-2 sm:pt-0">
              {pieData.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: colors[i % colors.length] }}
                  />
                  <span className="w-16 text-ink-700">{p.name}</span>
                  <span className="ml-auto font-mono text-muted">{p.value}%</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="协议会话计数" />
          <CardBody className="h-[300px] !pt-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
              <BarChart data={stats}>
                <CartesianGrid stroke="#eef1f3" vertical={false} />
                <XAxis dataKey="protocol" tick={{ fill: '#66727f', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#66727f', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e8eceb',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" name="会话数" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {stats.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="协议明细" />
        <CardBody className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-black/[0.04] text-muted">
                  <th className="px-5 py-3 font-medium">协议</th>
                  <th className="px-4 py-3 font-medium">会话数</th>
                  <th className="px-4 py-3 font-medium">流量大小</th>
                  <th className="px-4 py-3 font-medium">占比</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((p, i) => (
                  <tr key={p.protocol} className="border-b border-black/[0.03] last:border-0">
                    <td className="px-5 py-3">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          background: `${colors[i % colors.length]}18`,
                          color: colors[i % colors.length],
                        }}
                      >
                        {p.protocol}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-ink-700">{p.count.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-ink-600">{formatBytes(p.bytes)}</td>
                    <td className="px-4 py-3 font-mono text-ink-600">{p.percent}%</td>
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
