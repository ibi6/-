import { lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })))
const Capture = lazy(() => import('./pages/Capture').then((module) => ({ default: module.Capture })))
const Payloads = lazy(() => import('./pages/Payloads').then((module) => ({ default: module.Payloads })))
const PayloadDetail = lazy(() => import('./pages/PayloadDetail').then((module) => ({ default: module.PayloadDetail })))
const Protocols = lazy(() => import('./pages/Protocols').then((module) => ({ default: module.Protocols })))
const Stats = lazy(() => import('./pages/Stats').then((module) => ({ default: module.Stats })))
const Features = lazy(() => import('./pages/Features').then((module) => ({ default: module.Features })))
const Alerts = lazy(() => import('./pages/Alerts').then((module) => ({ default: module.Alerts })))
const Settings = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })))
const Logs = lazy(() => import('./pages/Logs').then((module) => ({ default: module.Logs })))
const Help = lazy(() => import('./pages/Help').then((module) => ({ default: module.Help })))
const TaskDetail = lazy(() => import('./pages/TaskDetail').then((module) => ({ default: module.TaskDetail })))

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
