from core.supabase_client import supabase
from rag.embedding.embedding import EmbeddingManager

embedder = EmbeddingManager()

def retrieve_chunks(question: str, document_id: str, match_count: int = 5):
    question_embedding = embedder.embed_query(question).tolist()

    response = supabase.rpc("match_documents", {
        "query_embedding": question_embedding,
        "match_count": match_count,
        "p_document_id": document_id
    }).execute()

    return response.data