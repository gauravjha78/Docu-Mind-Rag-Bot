from core.supabase_client import supabase
import fitz
from io import BytesIO
from uuid import UUID


def get_pdf_content(document_id:UUID):
    response=(
        supabase.table("documents")
        .select("storage_path")
        .eq("id",document_id)
        .limit(1)
        .single()
        .execute()
    )

    pdf_path=response.data["storage_path"]

    pdf_bytes=(
    supabase.storage.from_("pdfs").download(pdf_path)
    )

    pdf_stream=BytesIO(pdf_bytes)

    pdf_doc = fitz.open(
    stream=pdf_stream.read(),
    filetype="pdf"
    )

    pages= []

    for page_num in range(len(pdf_doc)):
        page=pdf_doc[page_num]
        pages.append({
            "page": page_num+1,
            "text": page.get_text()
        }
        )

    return {
        "metadata": pdf_doc.metadata,
        "pages": pages
    }
        



