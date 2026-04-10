from sentence_transformers import SentenceTransformer
import os

class EmbeddingService:
    def __init__(self):
        # Modelo Local (HuggingFace)
        # Se descarga la primera vez y luego corre localmente.
        # No requiere API Key.
        model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        print(f"🔄 Cargando modelo de embeddings local: {model_name}...")
        self.model = SentenceTransformer(model_name)
        print("✅ Modelo cargado correctamente.")

    async def generate(self, text: str) -> list[float]:
        if not text:
            return []

        try:
            # Generate embedding
            # encode devuelve un numpy array, lo convertimos a lista
            vector = self.model.encode(text).tolist()
            return vector
        except Exception as e:
            print(f"Error generando embedding local: {e}")
            return []