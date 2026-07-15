import { useEffect, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ErrorState, PageLoading } from '../components/ui/Loading'
import { api, type ApiAlert } from '../lib/api'
import { cn } from '../lib/cn'

const levelStyle: Record<string, string> = {
  high: 'bg-rose-50 text-rose-700 ring-rose-100',
  medium: 'bg-orange-50 text-orange-700 ring-orange-100',
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  info: 'bg-sky-50 text-sky-700 ring-sky-100',
}

const levelLabel: Record<string, string> = {
  high: '高危',
  medium: '中危',
  low: '低危',
  info: '提示',
}

const filters = [
  { key: 'all', label: '全部' },
  { key: 'high', label: '高危' },
  { key: 'medium', label: '中危' },
  { key: 'low', label: '低危' },
  { key: 'info', label: '提示' },
] as const

export function Alerts() {
  const [level, setLevel] = useState<(typeof filters)[number]['key']>('all')
  const [list, setList] = useState<ApiAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setList(await api.alerts({ level: level === 'all' ? undefined : level, status: 'all' }))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  if (loading) return <PageLoading />
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div>
      <PageHeader title="告警管理" subtitle="解析过程中规则命中的敏感与异常事件" />

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setLevel(f.key)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-medium transition',
              level === f.key
                ? 'bg-teal-600 text-white shadow-sm'
                : 'border border-line bg-white text-ink-600 hover:bg-ink-50',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardBody className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-black/[0.04] text-muted">
                  <th className="px-5 py-3 font-medium">级别</th>
                  <th className="px-4 py-3 font-medium">标题</th>
                  <th className="px-4 py-3 font-medium">详情</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id} className="border-b border-black/[0.03] last:border-0 hover:bg-[#fafbfc]">
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                          levelStyle[a.level] ?? levelStyle.info,
                        )}
                      >
                        {levelLabel[a.level] ?? a.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-900">{a.title}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-500">{a.detail}</td>
                    <td className="px-4 py-3 text-ink-600">{a.status}</td>
                    <td className="px-5 py-3">
                      {a.status === 'open' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void api.resolveAlert(a.id).then(load)}
                        >
                          处理
                        </Button>
                      ) : (
                        <span className="text-xs text-muted">已处理</span>
                      )}
                    </td>
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
