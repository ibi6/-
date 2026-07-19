import { PageHeader } from '../components/PageHeader'
import { Card, CardBody } from '../components/ui/Card'
import { PRODUCT_BOUNDARIES, V1_PROTOCOLS } from '../config/capabilities'

const sections = [
  {
    title: '系统简介',
    body: 'PayloadX 面向本地网络流量研判，支持经典 PCAP/CAP 的协议解析、五元组会话重组、应用层载荷提取与敏感字段告警。',
  },
  {
    title: '推荐使用流程',
    body: '1. 在「流量捕获」上传 PCAP 文件\n2. 等待解析任务完成\n3. 在「载荷提取」查看应用层内容\n4. 通过「协议分析 / 特征分析」做进一步研判\n5. 在「告警管理」处理异常事件',
  },
  {
    title: '当前解析范围',
    body: `${V1_PROTOCOLS.join('、')}。HTTPS 无密钥时只展示 TLS 元数据，不声称还原加密正文。`,
  },
  {
    title: '技术架构',
    body: `前端：React 19 + Vite + TailwindCSS\n后端：FastAPI + SQLAlchemy\n解析：${PRODUCT_BOUNDARIES.parserEngine}\n存储：${PRODUCT_BOUNDARIES.databases.join(' / ')}`,
  },
  {
    title: '版本说明',
    body: '当前为 PayloadX v1.0 的第二版界面（UI V2），不是产品 v2.0。PCAPNG、登录鉴权和多用户工作区属于后续路线图。',
  },
]

export function Help() {
  return (
    <div>
      <PageHeader title="帮助文档" subtitle="系统使用与部署说明" />
      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.title}>
            <CardBody>
              <h3 className="text-sm font-semibold text-ink-900">{s.title}</h3>
              <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-muted">
                {s.body}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
