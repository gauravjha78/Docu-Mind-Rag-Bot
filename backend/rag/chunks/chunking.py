
# Do the chunking of the pdf which is uploaded by user and splits into smaller value
from langchain_text_splitters import RecursiveCharacterTextSplitter
from rag.documents.Ingestion import get_pdf_content
from uuid import UUID

documents = get_pdf_content

def split_text(document_id: UUID, chunk_size=1000, chunk_overlap=150):
    """Split the text into smaller chunks better for RAG Performance"""
    documents=get_pdf_content(document_id)

    full_text=""

    for page in documents["pages"]:
        full_text += page["text"]+"\n"

    text_splitter=RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n","\n"," ",""],
    
    )
    splits_docs=text_splitter.split_text(full_text)
    return splits_docs
