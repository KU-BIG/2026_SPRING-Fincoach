"""Environment configuration."""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Config:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    @property
    def is_dev_mode(self) -> bool:
        return not self.OPENAI_API_KEY and not self.ANTHROPIC_API_KEY


@lru_cache(maxsize=1)
def get_config() -> Config:
    return Config()
