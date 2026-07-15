import { PageHeader } from '../components/PageHeader'
import { Card, CardBody } from '../components/ui/Card'

const sections = [
  {
    title: '系统简介',
    body: '本系统面向网络流量分析场景，支持 PCAP/PCAPNG 捕获文件的协议解析、会话重组与应用层载荷提取，并提供可视化仪表盘、告警与特征分析能力。',
  },
  {
    title: '推荐使用流程',
    body: '1. 在「流量捕获」上传 PCAP 文件\n2. 等待解析任务完成\n3. 在「载荷提取」查看应用层内容\n4. 通过「协议分析 / 特征分析」做进一步研判\n5. 在「告警管理」处理异常事件',
  },
  {
    title: '支持协议（演示）',
    body: 'HTTP、HTTPS/TLS、DNS、TCP、UDP、MQTT、WebSocket、FTP、SMTP 等。成品阶段由 Python 解析引擎扩展。',
  },
  {
    title: '技术架构（规划）',
    body: '前端：React + Vite + Tailwind\n后端：Python FastAPI\n解析：Scapy / dpkt + 会话重组\n存储：SQLite / PostgreSQL',
  },
  {
    title: '毕业设计说明',
    body: '当前为前端展示版，数据与上传流程均为 Mock。确认界面与功能范围后，将接入真实 Python 解析后端。',
  },
]

export function Help() {
  return (
    <div>
      <PageHeader title="帮助文档" subtitle="系统使用说明与毕设说明" />
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
