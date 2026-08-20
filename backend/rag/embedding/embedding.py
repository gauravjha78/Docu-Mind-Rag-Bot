from fastembed import TextEmbedding
import numpy as np
from rag.chunks.chunking import split_text
from typing import List
from uuid import UUID


class EmbeddingManager:

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model_name = model_name
        self.model = None
        self.__loadmodel()

    def __loadmodel(self):
        try:
            print(f"Loading model {self.model_name}")
            self.model = TextEmbedding(model_name=self.model_name)
            print("Model loaded successfully")
        except Exception as e:
            print(f"Model load failed {e}")
            raise

    def embed_query(self, text: str) -> np.ndarray:
        if not self.model:
            raise ValueError("Model Load Failed")
        embedding = list(self.model.embed([text]))[0]
        return np.array(embedding)

    def generate_embedding(self, document_id: UUID) -> np.ndarray:
        chunks = split_text(document_id)

        if not self.model:
            raise ValueError("Model Load Failed")

        print(f"Generating the embedding for {len(chunks)}")
        embeddings = list(self.model.embed(chunks))
        embeddings = np.array(embeddings)
        print(f"Embedding shape is: {embeddings.shape}")
        return embeddings