import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # Pydantic V2: ConfigDict sustituye a la sintaxis class Config (deprecada
    # en V2.0 y eliminada en V3.0).
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")
    # FastAPI
    APP_NAME: str = "Gremio Estelar — Media Engine"
    DEBUG: bool = False
    PORT: int = 8001

    # Cloudflare R2
    R2_ENDPOINT: str = os.getenv("R2_ENDPOINT", "")
    R2_ACCESS_KEY: str = os.getenv("R2_ACCESS_KEY", "")
    R2_SECRET_KEY: str = os.getenv("R2_SECRET_KEY", "")
    R2_BUCKET: str = os.getenv("R2_BUCKET", "gremio-estelar-media")

    # Public URL for serving objects (enable Public Development URL in R2 Dashboard).
    # Required for uploads to work — the engine fails fast with a clear error if missing.
    R2_PUBLIC_URL: str = os.getenv("R2_PUBLIC_URL", "")

    # Shared internal token. When set, /internal/* endpoints require
    # it via the X-Internal-Token header (sent by the Express backend).
    MEDIA_ENGINE_TOKEN: str = os.getenv("MEDIA_ENGINE_TOKEN", "")

    # Processing limits
    MAX_IMAGE_SIZE: int = 5 * 1024 * 1024  # 5MB
    MAX_IMAGE_DIMENSION: int = 1200
    MAX_GIF_DIMENSION: int = 800
    WEBP_QUALITY_STATIC: int = 80
    WEBP_QUALITY_ANIMATED: int = 70
    JPEG_QUALITY_FALLBACK: int = 85

    # Allowed input formats
    ALLOWED_MIMES: list[str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    ]


settings = Settings()
