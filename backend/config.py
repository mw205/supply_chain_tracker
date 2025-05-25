import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..")) # Project Root
load_dotenv(os.path.join(BASE_DIR, ".env"))

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./default_supply_chain.db")
    BLOCKCHAIN_DIFFICULTY: int = int(os.getenv("BLOCKCHAIN_DIFFICULTY", "2"))
    # Authentication settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "a_very_default_secret_key_if_not_set_in_env")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    class Config:
        env_file = os.path.join(BASE_DIR, ".env")
        env_file_encoding = 'utf-8'
        extra = 'ignore'

settings = Settings()
