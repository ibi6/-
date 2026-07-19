import { PageHeader } from '../components/PageHeader'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Fingerprint, Shield, Binary, Network } from 'lucide-react'

const features = [
  {
    icon: Network,
    title: '五元组会话特征',
    desc: '源/目的 IP、端口、协议聚合，统计包数、字节数与会话时长。',
    tags: ['五元组', '流重组', '时长'],
  },
  {
    icon: Binary,
    title: '载荷内容特征',
    desc: '提取 HTTP、DNS、TLS 与通用二进制载荷，生成长度、摘要、Hex 与关键字命中。',
    tags: ['长度', '摘要', '关键字'],
  },
  {
    icon: Fingerprint,
    title: '应用指纹',
    desc: '基于端口与载荷前缀识别 HTTP、DNS、TLS 等应用类型。',
    tags: ['端口', '载荷前缀', '协议'],
  },
  {
    icon: Shield,
    title: '异常行为特征',
    desc: '对明文口令等敏感字段生成可解释告警与风险级别。',
    tags: ['敏感字段', '告警', '风险级别'],
  },
]

const sampleRows = [
  { name: 'flow_protocol', value: 'TCP', type: '类别' },
  { name: 'payload_size', value: '150', type: '数值' },
  { name: 'http_method', value: 'POST', type: '类别' },
  { name: 'dns_qname', value: 'portal.campus.edu', type: '字符串' },
  { name: 'tls_encrypted', value: 'true', type: '布尔' },
  { name: 'sensitive_hit', value: 'password', type: '标签' },
  { name: 'severity', value: 'high', type: '级别' },
  { name: 'app_label', value: 'HTTP', type: '标签' },
]

export function Features() {
  return (
    <div>
      <PageHeader
        title="特征分析"
        subtitle="基于当前解析结果的可解释字段与教学示例"
      />

      <div className="mb-5 grid gap-4 md:grid-cols-2">
        {features.map((f) => (
          <Card key={f.title} className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-deep)]">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-900">{f.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{f.desc}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {f.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-line bg-[#fafbfc] px-2.5 py-0.5 text-[11px] text-ink-600"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="规则特征示例" subtitle="教学展示，不代表独立机器学习模型" />
        <CardBody className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-black/[0.04] text-muted">
                  <th className="px-5 py-3 font-medium">特征名</th>
                  <th className="px-4 py-3 font-medium">取值</th>
                  <th className="px-5 py-3 font-medium">类型</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((r) => (
                  <tr key={r.name} className="border-b border-black/[0.03] last:border-0">
                    <td className="px-5 py-2.5 font-mono text-[var(--accent-deep)]">{r.name}</td>
                    <td className="px-4 py-2.5 font-mono text-ink-800">{r.value}</td>
                    <td className="px-5 py-2.5 text-muted">{r.type}</td>
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
