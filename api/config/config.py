from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_JWT_SECRET: str

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()