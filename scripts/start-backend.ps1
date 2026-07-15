# 启动 PayloadX 后端（固定 8001）
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
Set-Location $Backend

if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
  Write-Host "创建虚拟环境..." -ForegroundColor Cyan
  python -m venv .venv
  .\.venv\Scripts\pip.exe install -r requirements.txt
}

Write-Host "后端: http://127.0.0.1:8001  (文档 /docs)" -ForegroundColor Green
& .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
