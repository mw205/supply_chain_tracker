import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load environment variables from .env file
# Ensures that this happens early, before settings are imported elsewhere
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..")) # Project Root
load_dotenv(os.path.join(BASE_DIR, ".env"))


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./default_supply_chain.db")
    BLOCKCHAIN_DIFFICULTY: int = int(os.getenv("BLOCKCHAIN_DIFFICULTY", "2"))
    
    # Example for a secret key if you add features like JWT authentication
    # SECRET_KEY: str = os.getenv("SECRET_KEY", "a_default_secret_key_for_dev_only")

    # You can add more application settings here as needed
    # e.g., API_V1_STR: str = "/api/v1"

    class Config:
        env_file = os.path.join(BASE_DIR, ".env") # Explicitly tell Pydantic where to look too
        env_file_encoding = 'utf-8'
        extra = 'ignore' # Ignore extra fields in .env

settings = Settings()