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
    desc: '提取 HTTP/JSON/二进制等载荷，生成长度、熵值、关键字命中等特征。',
    tags: ['长度', '熵值', '关键字'],
  },
  {
    icon: Fingerprint,
    title: '应用指纹',
    desc: '基于端口、SNI、User-Agent、MQTT Topic 等识别应用类型。',
    tags: ['SNI', 'UA', 'Topic'],
  },
  {
    icon: Shield,
    title: '异常行为特征',
    desc: '大流量连接、非常用端口、敏感字段传输等行为规则打分。',
    tags: ['异常流量', '敏感字段', '评分'],
  },
]

const sampleRows = [
  { name: 'pkt_len_mean', value: '842.3', type: '数值' },
  { name: 'payload_entropy', value: '6.21', type: '数值' },
  { name: 'http_method', value: 'POST', type: '类别' },
  { name: 'tls_sni', value: 'cdn.example.com', type: '字符串' },
  { name: 'mqtt_topic', value: 'sensor/temp', type: '字符串' },
  { name: 'sensitive_hit', value: 'password', type: '标签' },
  { name: 'inter_arrival_ms', value: '12.4', type: '数值' },
  { name: 'app_label', value: 'REST API', type: '标签' },
]

export function Features() {
  return (
    <div>
      <PageHeader
        title="特征分析"
        subtitle="从会话与载荷中抽取可用于识别与检测的特征（演示数据）"
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
        <CardHeader title="样例特征向量" />
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
