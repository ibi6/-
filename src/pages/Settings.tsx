import { useEffect, useState } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { ThemeGrid } from '../components/ThemeSwitcher'
import { Button } from '../components/ui/Button'
import { ProtocolBadge } from '../components/ui/Badge'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { ErrorState, PageLoading } from '../components/ui/Loading'
import { api, type ApiSettings } from '../lib/api'
import type { Protocol } from '../types'
import { cn } from '../lib/cn'
import { useTheme } from '../theme/useTheme'

const allProtocols: Protocol[] = [
  'HTTP',
  'HTTPS',
  'DNS',
  'FTP',
  'SMTP',
  'TLS',
  'TCP',
  'UDP',
  'MQTT',
  'WebSocket',
]

const defaults: ApiSettings = {
  max_upload_mb: 512,
  auto_extract: true,
  deep_inspection: true,
  retain_days: 30,
  hex_columns: 16,
  storage_path: './uploads',
  enabled_protocols: allProtocols,
}

export function Settings() {
  const { theme } = useTheme()
  const [settings, setSettings] = useState<ApiSettings>(defaults)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        setSettings(await api.settings())
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const toggleProtocol = (p: Protocol) => {
    setSettings((s) => {
      const enabled = s.enabled_protocols.includes(p)
      return {
        ...s,
        enabled_protocols: enabled
          ? s.enabled_protocols.filter((x) => x !== p)
          : [...s.enabled_protocols, p],
      }
    })
    setSaved(false)
  }

  const save = async () => {
    setSaving(true)
    setSaved(false)
    setError('')
    try {
      setSettings(await api.saveSettings(settings))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoading />
  if (error && !settings) return <ErrorState message={error} />

  return (
    <div>
      <PageHeader
        title="系统配置"
        subtitle="强调色、解析参数与协议插件"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSettings(defaults)
                setSaved(false)
                setError('')
              }}
            >
              <RotateCcw className="h-4 w-4" />
              恢复默认
            </Button>
            <Button size="sm" onClick={() => void save()} disabled={saving} aria-live="polite">
              <Save className="h-4 w-4" />
              {saving ? '保存中…' : saved ? '已保存' : '保存设置'}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="mx-auto max-w-4xl space-y-5">
        <Card>
          <CardHeader title="主题强调色" subtitle={`当前：${theme.name}`} />
          <CardBody>
            <ThemeGrid />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="解析引擎" />
          <CardBody className="space-y-5">
            <Field id="max-upload-mb" label="最大上传体积 (MB)">
              <input
                id="max-upload-mb"
                type="number"
                min={1}
                max={512}
                value={settings.max_upload_mb}
                onChange={(e) => {
                  setSettings({ ...settings, max_upload_mb: Number(e.target.value) })
                  setSaved(false)
                }}
                className="field"
              />
            </Field>
            <Field id="hex-columns" label="Hex 列数">
              <select
                id="hex-columns"
                value={settings.hex_columns}
                onChange={(e) => {
                  setSettings({ ...settings, hex_columns: Number(e.target.value) })
                  setSaved(false)
                }}
                className="field"
              >
                {[8, 16, 32].map((n) => (
                  <option key={n} value={n}>
                    {n} 列
                  </option>
                ))}
              </select>
            </Field>
            <Field id="retain-days" label="数据保留天数">
              <input
                id="retain-days"
                type="number"
                min={1}
                max={365}
                value={settings.retain_days}
                onChange={(e) => {
                  setSettings({ ...settings, retain_days: Number(e.target.value) })
                  setSaved(false)
                }}
                className="field"
              />
            </Field>
            <Field id="storage-path" label="存储位置（只读）">
              <input
                id="storage-path"
                type="text"
                value={settings.storage_path}
                readOnly
                aria-readonly="true"
                className="field cursor-not-allowed bg-ink-50 text-ink-500"
              />
            </Field>
            <Toggle
              label="自动提取载荷"
              desc="任务解析完成后立即进入载荷提取阶段"
              checked={settings.auto_extract}
              onChange={(v) => {
                setSettings({ ...settings, auto_extract: v })
                setSaved(false)
              }}
            />
            <Toggle
              label="深度协议检测 (DPI)"
              desc="基于载荷特征识别加密流量上的应用类型"
              checked={settings.deep_inspection}
              onChange={(v) => {
                setSettings({ ...settings, deep_inspection: v })
                setSaved(false)
              }}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="启用协议插件" />
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {allProtocols.map((p) => {
                const on = settings.enabled_protocols.includes(p)
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProtocol(p)}
                    aria-pressed={on}
                    className={cn(
                      'focus-ring min-h-11 rounded-2xl px-2 py-1.5 transition',
                      on ? 'bg-[var(--accent-soft)] ring-1 ring-[var(--accent-border)]' : 'opacity-45 hover:opacity-75',
                    )}
                  >
                    <ProtocolBadge protocol={p} />
                  </button>
                )
              })}
            </div>
          </CardBody>
        </Card>
      </div>

    </div>
  )
}

function Field({
  id,
  label,
  children,
}: {
  id: string
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-center">
      <label htmlFor={id} className="text-sm text-ink-700">{label}</label>
      {children}
    </div>
  )
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line bg-[#fafbfc] px-4 py-3">
      <div>
        <p className="text-sm text-ink-900">{label}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="theme-checkbox h-5 w-5 shrink-0"
      />
    </label>
  )
}
