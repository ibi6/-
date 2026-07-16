import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import get_settings
from app.core.logging_config import setup_logging
from app.db.session import Base, SessionLocal, engine
from app.services.seed import seed_if_empty

setup_logging()
logger = logging.getLogger("payloadx")
settings = get_settings()

API_DESCRIPTION = """
**PayloadX** — 流量应用载荷提取 API。

### 处理流水线
`上传 → 解析 → 重组 → 提取 → 入库 → 查询`

### 说明
- v1 优先经典 **PCAP**（PCAPNG 请先转换）。
- 无密钥时 TLS 仅元数据/样例，不提供明文应用载荷。
"""


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    logger.info("%s ready", settings.app_name)
    yield


app = FastAPI(
    title="PayloadX API",
    version="1.0.0",
    description=API_DESCRIPTION,
    lifespan=lifespan,
    contact={"name": "PayloadX 维护者"},
    license_info={"name": "MIT"},
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["Accept", "Content-Type"],
)
app.include_router(router)


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "docs": "/docs",
        "health": "/api/v1/health",
    }
