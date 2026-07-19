import { useEffect, useState } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { ThemeGrid } from '../components/ThemeSwitcher'
import { Button } from '../components/ui/Button'
import { ProtocolBadge } from '../components/ui/Badge'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { ErrorState, PageLoading } from '../components/ui/Loading'
import { api, type ApiSettings } from '../lib/api'
import { useTheme } from '../theme/useTheme'
import { V1_PROTOCOLS } from '../config/capabilities'

const defaults: ApiSettings = {
  max_upload_mb: 512,
  auto_extract: true,
  deep_inspection: true,
  retain_days: 30,
  hex_columns: 16,
  storage_path: './uploads',
  enabled_protocols: [...V1_PROTOCOLS],
}

export function Settings() {
  const { theme } = useTheme()
  const [settings, setSettings] = useState<ApiSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setSettings(await api.settings())
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const save = async () => {
    if (!settings) return
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
  if (!settings) return <ErrorState message={error || '配置加载失败'} onRetry={load} />

  return (
    <div>
      <PageHeader
        title="系统配置"
        subtitle="界面主题、上传边界与 Hex 展示参数"
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
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
              恢复推荐值
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
            <div className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-start">
              <div className="pt-1 text-sm text-ink-700">证据存储目录</div>
              <div className="rounded-2xl border border-line bg-ink-50/70 px-4 py-3">
                <code className="block break-all text-xs text-ink-600">{settings.storage_path}</code>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  由后端环境变量 UPLOAD_DIR 配置，服务重启后生效。
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-soft)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--accent-deep)]">v1.0 固定解析流水线</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-600">
                上传后自动完成会话重组、载荷提取与敏感字段检查。登录、多用户和规则插件属于后续路线图。
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="当前解析范围" subtitle="当前版本真实支持或识别的协议" />
          <CardBody>
            <div className="flex flex-wrap gap-2" aria-label="v1.0 支持协议">
              {V1_PROTOCOLS.map((protocol) => (
                <div key={protocol} className="rounded-xl bg-ink-50 px-2.5 py-2 ring-1 ring-line">
                  <ProtocolBadge protocol={protocol} />
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">
              HTTPS 不解密正文；无会话密钥时仅展示 TLS 元数据和加密载荷提示。
            </p>
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
