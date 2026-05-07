import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-pro")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
