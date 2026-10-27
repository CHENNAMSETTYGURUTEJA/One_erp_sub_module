import os
from urllib.parse import quote_plus
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "STACKLY OneERP — Financial Accounting"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"


    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = Field(min_length=1)
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_NAME: str = os.getenv("DB_NAME", "one_erp")


    SECRET_KEY: str = Field(min_length=32)
    ADMIN_PASSWORD: str | None = Field(default=None, min_length=12)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    @property
    def DATABASE_URL(self) -> str:

        safe_password = quote_plus(self.DB_PASSWORD)
        return (
            f"mysql+pymysql://{self.DB_USER}:{safe_password}@"
            f"{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )


settings = Settings()
