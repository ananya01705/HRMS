from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://hrms_user:hrms_pass@localhost:5432/hrms_db"
    secret_key: str = "change_this_secret_key"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
