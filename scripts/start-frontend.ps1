# 启动 PayloadX 前端（5173 + /api 代理）
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Test-Path ".\node_modules")) {
  Write-Host "安装前端依赖..." -ForegroundColor Cyan
  npm install
}

Write-Host "前端: http://127.0.0.1:5173  (API 代理 -> 8001)" -ForegroundColor Green
npm run dev -- --host 127.0.0.1 --port 5173
