from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "PulseRx Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # MongoDB
    MONGO_URI: str = "mongodb://localhost:27017/pulserx"
    MONGO_DB_NAME: str = "pulserx"
    
    # Elasticsearch
    ELASTICSEARCH_URL: str = "http://localhost:9200"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Server
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore"
    )


settings = Settings()