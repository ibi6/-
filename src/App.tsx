import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { Capture } from './pages/Capture'
import { Payloads } from './pages/Payloads'
import { PayloadDetail } from './pages/PayloadDetail'
import { Protocols } from './pages/Protocols'
import { Stats } from './pages/Stats'
import { Features } from './pages/Features'
import { Alerts } from './pages/Alerts'
import { Settings } from './pages/Settings'
import { Logs } from './pages/Logs'
import { Help } from './pages/Help'
import { TaskDetail } from './pages/TaskDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="capture" element={<Capture />} />
          <Route path="upload" element={<Navigate to="/capture" replace />} />
          <Route path="payloads" element={<Payloads />} />
          <Route path="payloads/:id" element={<PayloadDetail />} />
          <Route path="protocols" element={<Protocols />} />
          <Route path="sessions" element={<Navigate to="/protocols" replace />} />
          <Route path="stats" element={<Stats />} />
          <Route path="features" element={<Features />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="settings" element={<Settings />} />
          <Route path="logs" element={<Logs />} />
          <Route path="help" element={<Help />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="tasks" element={<Navigate to="/capture" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
