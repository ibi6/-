import { Navigate } from 'react-router-dom'

/** 会话页合并到协议分析，保留路由兼容 */
export function Sessions() {
  return <Navigate to="/protocols" replace />
}
