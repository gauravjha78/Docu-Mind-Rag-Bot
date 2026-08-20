from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from core.security import get_current_user
from core.supabase_client import supabase
from core.retrieval import retrieve_chunks
from llm.llm import openai

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    question: str
    document_id: str

@router.post("/")
def chat(req: ChatRequest, current_user=Depends(get_current_user)):
    # Verify this document belongs to the logged-in user
    doc = (
        supabase.table("documents")
        .select("id")
        .eq("id", req.document_id)
        .eq("user_email", current_user.email)
        .limit(1)
        .execute()
    )

    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found")

    chunks = retrieve_chunks(req.question, req.document_id)
    context = "\n\n".join([c["chunk_text"] for c in chunks])
    answer = openai(req.question, context)
    return {"answer": answer, "sources": chunks}