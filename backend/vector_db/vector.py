from supabase import create_client
from uuid import UUID
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL=os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY=os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase=create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)

def embedding_vector(document_id:UUID,chunks:list[str],embeddings):
    row=[]

    for idx,(chunks,embeddings) in enumerate(
        zip(chunks,embeddings)
    ):
        row.append({
            "document_id": str(document_id),
            "chunk_index": idx,
            "chunk_text": chunks,
            "embedding": embeddings.tolist()
        } )

    response = (
        supabase
        .table("docuement_chunks")
        .insert(row)
        .execute()
    )

    return response