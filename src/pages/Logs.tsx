import { useEffect, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { Card, CardBody } from '../components/ui/Card'
import { ErrorState, PageLoading } from '../components/ui/Loading'
import { api, type ApiLog } from '../lib/api'
import { formatTime } from '../lib/format'

const levelColor: Record<string, string> = {
  INFO: 'text-sky-600',
  WARN: 'text-amber-600',
  ERROR: 'text-rose-600',
}

export function Logs() {
  const [logs, setLogs] = useState<ApiLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setLogs(await api.logs())
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

  return (
    <div>
      <PageHeader title="日志管理" subtitle="上传、解析与系统运行日志" />
      <Card>
        <CardBody className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left font-mono text-[12px]">
              <thead>
                <tr className="border-b border-black/[0.04] bg-[#fafbfc] text-muted">
                  <th className="px-5 py-3 font-medium">时间</th>
                  <th className="px-4 py-3 font-medium">级别</th>
                  <th className="px-4 py-3 font-medium">模块</th>
                  <th className="px-5 py-3 font-medium">消息</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-black/[0.03] last:border-0">
                    <td className="whitespace-nowrap px-5 py-2.5 text-ink-500">
                      {l.created_at ? formatTime(l.created_at) : '—'}
                    </td>
                    <td className={`px-4 py-2.5 font-semibold ${levelColor[l.level] ?? 'text-ink-600'}`}>
                      {l.level}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--accent-deep)]">{l.module}</td>
                    <td className="px-5 py-2.5 text-ink-700">{l.message}</td>
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
