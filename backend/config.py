import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "FraudGraph Agent"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # TigerGraph Configuration (Savanna / Community Edition)
    TIGERGRAPH_HOST: str = os.getenv("TIGERGRAPH_HOST", "http://127.0.0.1:9000")
    TIGERGRAPH_GRAPH_NAME: str = os.getenv("TIGERGRAPH_GRAPH_NAME", "FraudGraph")
    TIGERGRAPH_USERNAME: str = os.getenv("TIGERGRAPH_USERNAME", "tigergraph")
    TIGERGRAPH_PASSWORD: str = os.getenv("TIGERGRAPH_PASSWORD", "tigergraph")
    TIGERGRAPH_SECRET: Optional[str] = os.getenv("TIGERGRAPH_SECRET", None)
    TIGERGRAPH_REST_PORT: int = int(os.getenv("TIGERGRAPH_REST_PORT", "9000"))
    TIGERGRAPH_GS_PORT: int = int(os.getenv("TIGERGRAPH_GS_PORT", "14240"))
    USE_TIGERGRAPH_EMULATOR: bool = os.getenv("USE_TIGERGRAPH_EMULATOR", "true").lower() in ("true", "1", "yes")

    # LLM Settings (OpenAI / Gemini)
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    
    # Risk & Uncertainty Thresholds
    UNCERTAINTY_THRESHOLD_HIGH: float = 0.40  # If uncertainty > 40%, step-up evidence is needed
    CONFIDENCE_THRESHOLD_ACT: float = 0.70    # Requires at least 70% confidence for automated action
    CRITICAL_RISK_THRESHOLD: float = 0.80     # Risk >= 0.80 considered high/critical
    HIGH_VALUE_THRESHOLD: float = 2000.0      # Actions above $2,000 require human analyst approval

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
