from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql://agri:agri_secret@localhost:5432/ai_governance"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    llm_provider: str = "mock"  # openai | anthropic | mock
    embedding_provider: str = "mock"  # openai | mock
    cors_origins: str = "http://localhost:3000"
    upload_dir: str = "uploads"
    embedding_dimensions: int = 384

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
