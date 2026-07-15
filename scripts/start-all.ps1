# 一键启动：后端 8001 + 前端 5173
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"

if (-not (Test-Path "$Backend\.venv\Scripts\python.exe")) {
  Write-Host "初始化后端虚拟环境..." -ForegroundColor Cyan
  Set-Location $Backend
  python -m venv .venv
  .\.venv\Scripts\pip.exe install -r requirements.txt
  Set-Location $Root
}

if (-not (Test-Path "$Root\node_modules")) {
  Write-Host "安装前端依赖..." -ForegroundColor Cyan
  Set-Location $Root
  npm install
}

Write-Host "启动后端 :8001 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit", "-ExecutionPolicy", "Bypass",
  "-File", (Join-Path $Root "scripts\start-backend.ps1")
)

Start-Sleep -Seconds 2

Write-Host "启动前端 :5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
  "-NoExit", "-ExecutionPolicy", "Bypass",
  "-File", (Join-Path $Root "scripts\start-frontend.ps1")
)

Write-Host ""
Write-Host "打开浏览器: http://127.0.0.1:5173" -ForegroundColor Green
Write-Host "API 文档:   http://127.0.0.1:8001/docs" -ForegroundColor Green
