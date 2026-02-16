from litellm import embedding
import os
from dotenv import load_dotenv

load_dotenv()

class EmbeddingService:
    def __init__(self):
        # Modelo De Gemini.
        # IMPORTANTE: se necesita la API KEY en el archivo .env
        self.model = os.getenv("EMBEDDING_MODEL", "gemini/text-embedding-004")
        self.api_key = os.getenv("GEMINI_API_KEY")

    async def generate(self, text: str) -> list[float]:
        if not text:
            return []

        try:
            response = embedding(
                model=self.model,
                input=text,
                api_key=self.api_key
            )
            return response['data'][0]['embedding']
        except Exception as e:
            print(f"Error generando embedding: {e}")
            return []