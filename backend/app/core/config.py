from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = BASE_DIR / "uploads"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "流量应用载荷提取系统"
    app_env: str = "development"
    # 默认 SQLite；生产可改为 mysql+pymysql://user:pass@host/db
    database_url: str = f"sqlite:///{(DATA_DIR / 'payloadx.db').as_posix()}"
    upload_dir: str = str(UPLOAD_DIR)
    max_upload_mb: int = 512
    # 开发默认走 Vite 同源代理，CORS 仅作备用（直连调试时）
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173"
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
