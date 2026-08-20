from sentence_transformers import SentenceTransformer
import numpy as np
from rag.chunks.chunking import split_text
from typing import List
from uuid import UUID

class EmbeddingManager:

    def __init__(self,model_name:str="all-MiniLM-L6-v2"):

        self.model_name=model_name
        self.model=None
        self.__loadmodel()



    def __loadmodel(self):
        try:
            print(f"Loading model",{self.model_name})
            self.model=SentenceTransformer(self.model_name)
            print(f"Model load sucessfully with the dimension of{self.model.get_embedding_dimension()}")

        except Exception as e:
            print(f"Model load failed{e}")
            raise

    def embed_query(self, text: str) -> np.ndarray:
            if not self.model:
                raise ValueError("Model Load Failed")
            return self.model.encode(text)


    def generate_embedding(self,document_id:UUID)->np.ndarray:
        chunks=split_text(document_id)

        if not self.model:
            raise ValueError("Model Load Failed")
        
        print(f"Genrating the embedding for{len(chunks)}")
        embedding=self.model.encode(
            chunks,
            show_progress_bar=True
            )
        print(f"Embedding for following is:{embedding.shape}")
        return embedding
    






