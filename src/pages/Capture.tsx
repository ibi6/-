import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  CheckCircle2,
  FileUp,
  HardDrive,
  UploadCloud,
  X,
  Layers,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/ui/Button'
import { StatusBadge, ProtocolBadge } from '../components/ui/Badge'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { api, type ApiTask } from '../lib/api'
import { formatBytes, formatTime } from '../lib/format'
import { cn } from '../lib/cn'
import { validateCaptureFile } from '../lib/file-validation'

type Stage = 'idle' | 'selected' | 'uploading' | 'queued' | 'error'

export function Capture() {
  const navigate = useNavigate()
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [uploadedId, setUploadedId] = useState<number | null>(null)

  const loadTasks = useCallback(async () => {
    try {
      setTasks(await api.tasks())
    } catch {
      /* backend offline */
    }
  }, [])

  useEffect(() => {
    void loadTasks()
    const t = setInterval(() => void loadTasks(), 3000)
    return () => clearInterval(t)
  }, [loadTasks])

  const acceptFile = useCallback((f: File | null) => {
    if (!f) return
    const validation = validateCaptureFile(f)
    if (!validation.valid) {
      setStage('error')
      setError(validation.message)
      setFile(null)
      return
    }
    setFile(f)
    setStage('selected')
    setProgress(0)
    setError('')
  }, [])

  const startUpload = async () => {
    if (!file) return
    setStage('uploading')
    setProgress(30)
    setError('')
    try {
      const task = await api.upload(file)
      setProgress(100)
      setStage('queued')
      setUploadedId(task.id)
      void loadTasks()
    } catch (e) {
      setStage('error')
      setError(e instanceof Error ? e.message : '上传失败')
    }
  }

  return (
    <div>
      <PageHeader
        title="流量捕获"
        subtitle="上传 PCAP 文件，后端异步解析并提取应用层载荷"
      />

      <div className="grid min-w-0 gap-5 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="上传捕获文件" subtitle="经典 PCAP 格式解析效果最佳" />
          <CardBody>
            <div
              role="button"
              tabIndex={0}
              aria-label="选择或拖入 PCAP 文件"
              aria-describedby={`${fileInputId}-hint`}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                acceptFile(e.dataTransfer.files?.[0] ?? null)
              }}
              className={cn(
                'focus-ring flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 transition',
                dragOver
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                  : 'border-line bg-[#fafbfc] hover:border-[var(--accent-border)]',
              )}
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-deep)]">
                <FileUp className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium text-ink-900">将 PCAP 文件拖到此处</p>
              <p id={`${fileInputId}-hint`} className="mt-1 text-center text-xs leading-relaxed text-muted">
                支持 .pcap / .cap，最大 512 MB；PCAPNG 请先转换
              </p>
              <label className="mt-5">
                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept=".pcap,.cap"
                  className="hidden"
                  onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
                />
                <span className="inline-flex h-11 cursor-pointer items-center rounded-2xl border border-line bg-white px-4 text-sm text-ink-800 shadow-sm hover:bg-ink-50">
                  选择文件
                </span>
              </label>
            </div>

            {(stage === 'error' || error) && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error || '上传失败'}
              </div>
            )}

            {file && stage !== 'error' && (
              <div className="mt-4 rounded-2xl border border-line bg-[#fafbfc] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <HardDrive className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">{file.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                  {stage === 'selected' && (
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setStage('idle')
                      }}
                      className="focus-ring flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-white hover:text-ink-800"
                      aria-label={`移除文件 ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {(stage === 'uploading' || stage === 'queued') && (
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-muted">
                      <span>{stage === 'uploading' ? '上传中…' : '已提交解析'}</span>
                      <span className="font-mono text-[var(--accent-deep)]">{progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#eef1f3]">
                      <div
                        role="progressbar"
                        aria-label="上传进度"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                        className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-emerald-400"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
                {stage === 'queued' && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    后端已接收并开始解析
                    {uploadedId ? `（任务 #${uploadedId}）` : ''}
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                disabled={!file || stage === 'uploading' || stage === 'queued'}
                onClick={() => void startUpload()}
              >
                <UploadCloud className="h-4 w-4" />
                开始上传并解析
              </Button>
              {uploadedId && (
                <Button variant="secondary" onClick={() => navigate(`/tasks/${uploadedId}`)}>
                  查看任务
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="最近捕获任务" action={<Layers className="h-4 w-4 text-muted" />} />
          <CardBody className="divide-y divide-black/[0.04] !p-0">
            {tasks.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">暂无任务</p>
            ) : (
              tasks.slice(0, 8).map((t) => (
                <Link
                  key={t.id}
                  to={`/tasks/${t.id}`}
                  className="block px-5 py-3.5 transition hover:bg-[#fafbfc]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-ink-900">{t.name}</p>
                    <StatusBadge
                      status={t.status as 'pending' | 'parsing' | 'extracting' | 'completed' | 'failed'}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {t.filename} · {formatBytes(t.file_size)}
                    {t.created_at ? ` · ${formatTime(t.created_at)}` : ''}
                  </p>
                  {(t.status === 'parsing' || t.status === 'extracting') && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef1f3]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${t.progress}%` }}
                      />
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.protocols.slice(0, 4).map((p) => (
                      <ProtocolBadge key={p} protocol={p} />
                    ))}
                  </div>
                </Link>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
