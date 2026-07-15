import { Navigate } from 'react-router-dom'

/** 上传页合并到流量捕获，保留路由兼容 */
export function Upload() {
  return <Navigate to="/capture" replace />
}
