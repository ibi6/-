import {
  AlertTriangle,
  BarChart3,
  Binary,
  BookOpen,
  FileText,
  Fingerprint,
  Home,
  Network,
  Radar,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  description: string
  icon: LucideIcon
  end?: boolean
}

export interface RouteMeta {
  title: string
  eyebrow: string
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '首页概览', description: '全局态势', icon: Home, end: true },
  { to: '/capture', label: '流量捕获', description: 'PCAP 任务', icon: Radar },
  { to: '/payloads', label: '载荷提取', description: '调查工作区', icon: Binary },
  { to: '/protocols', label: '协议分析', description: '会话与协议', icon: Network },
  { to: '/stats', label: '数据统计', description: '趋势与汇总', icon: BarChart3 },
  { to: '/features', label: '特征分析', description: '规则与指纹', icon: Fingerprint },
  { to: '/alerts', label: '告警管理', description: '风险处置', icon: AlertTriangle },
  { to: '/settings', label: '系统配置', description: '引擎与外观', icon: Settings },
  { to: '/logs', label: '日志管理', description: '运行记录', icon: FileText },
  { to: '/help', label: '帮助文档', description: '使用说明', icon: BookOpen },
]

const routeMeta = new Map(
  NAV_ITEMS.map((item) => [
    item.to,
    { title: item.label, eyebrow: item.description } satisfies RouteMeta,
  ]),
)

/** 根据当前 URL 返回顶部栏所需的稳定模块信息。 */
export function getRouteMeta(pathname: string): RouteMeta {
  if (/^\/payloads\/[^/]+$/.test(pathname)) {
    return { title: '载荷详情', eyebrow: '载荷调查' }
  }
  if (/^\/tasks\/[^/]+$/.test(pathname)) {
    return { title: '任务详情', eyebrow: '解析任务' }
  }
  return routeMeta.get(pathname) ?? { title: '页面未找到', eyebrow: 'PayloadX' }
}
