import { Navigate } from 'react-router-dom'

/** 任务列表合并到流量捕获，保留路由兼容 */
export function Tasks() {
  return <Navigate to="/capture" replace />
}
