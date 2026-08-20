from rag.chunks.chunking import split_text
from rag.embedding.embedding import EmbeddingManager
from vector_db.vector import embedding_vector


def process_document(document_id):

    chunks = split_text(document_id)

    manager = EmbeddingManager()

    embeddings = manager.generate_embedding(
        document_id
    )

    embedding_vector(
        document_id,
        chunks,
        embeddings
    )

    return True