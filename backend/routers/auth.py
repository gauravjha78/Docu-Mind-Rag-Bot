import os

import httpx
from fastapi import Depends,APIRouter
from fastapi.responses import (HTMLResponse,RedirectResponse)
from urllib.parse import urlencode
from dotenv import load_dotenv
from uuid import UUID
from pydantic import BaseModel


# Connect with database
from db.database import Login,get_db
from sqlalchemy.orm import Session

# putting JWT authentication in the code of login
from core.security import create_token,get_current_user

# Pydantic Validation
from schemas.user import UserResponse
from fastapi import APIRouter

# Supabase connection 
from core.supabase_client import supabase

# Uplaod pdf 
from fastapi import UploadFile, File
from datetime import datetime

# For uploading the user file automaticaaly wihtout manullay typeing the token
from fastapi.responses import RedirectResponse

# upload
from services.rag_pipeline import process_document

from core.retrieval import retrieve_chunks


router=APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)






# initialize load_dot env
load_dotenv()

GOOGLE_CLIENT_ID=os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET=os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URL=os.getenv("GOOGLE_REDIRECT_URL")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


GOOGLE_AUTH_ENDPOINT="https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_ENDPOINT="https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_ENDPOINT="https://www.googleapis.com/oauth2/v2/userinfo"




@router.get("/login")
def login():
    # This all thing's is required in OAuth of google
    params={
        "client_id":GOOGLE_CLIENT_ID,
        "redirect_uri":GOOGLE_REDIRECT_URL,
        "response_type":"code",
        "scope":"openid email profile",
        "access_type":"offline",
        "prompt":"consent"
    }

    url=f"{GOOGLE_AUTH_ENDPOINT}?{urlencode(params)}"
    return RedirectResponse(url)

@router.get("/google/callback")
async def authentication(
    code:str,
    db:Session=Depends(get_db)
    ):
    token_data={
        "code":code,
        "client_id":GOOGLE_CLIENT_ID,
        "client_secret":GOOGLE_CLIENT_SECRET,
        "redirect_uri":GOOGLE_REDIRECT_URL,
        "grant_type":"authorization_code"
    }

    async with httpx.AsyncClient() as client:
        token_response=await client.post(
            GOOGLE_TOKEN_ENDPOINT,
            data=token_data
        )

    token_result=token_response.json()

    if "error" in token_result:
            return {
                "error": token_result
            }
    print(token_result)

    access_token=token_result.get("access_token")

    async with httpx.AsyncClient() as client:

        user_response=await client.get(
            GOOGLE_USERINFO_ENDPOINT,
            headers={
                "Authorization": f"Bearer {access_token}"

            }
        )
        user_info=user_response.json()


        # Check for existing user in database
        existing_user=db.query(Login).filter(
            Login.email==user_info["email"]
        ).first()

        if not existing_user:
            new_user=Login(
                google_id=user_info["id"],
                email=user_info["email"],
                name=user_info["name"],
                picture=user_info["picture"],
                
            )

            db.add(new_user)
            db.commit()
        
        
        jwt_token = create_token(
            {
                "sub": user_info["email"]
            }
        )

        return RedirectResponse(
            url=f"{FRONTEND_URL}/upload?token={jwt_token}",
            status_code=302
        )

@router.get("/users")
def get_users(
    db:Session=Depends(get_db)
):

    users=db.query(Login).all()

    return users

# Save Routing for protection
@router.get("/me",
        response_model=UserResponse)
def get_me(
    current=Depends(get_current_user)
):
    return current




# Supabase Connection test
@router.get("/supabase")
async def supabase_test():
    result=(
        supabase
        .table("documents")
        .select("*")
        .execute()
    )

    return result.data

# Uplaod file in supabase
# Uplaod the only one route for all the process

from uuid import uuid4

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    file_bytes = await file.read()
    file_path = f"pdf/{uuid4()}_{file.filename}"

    supabase.storage.from_("pdfs").upload(
        path=file_path,
        file=file_bytes
    )

    result = (
        supabase.table("documents")
        .insert({
            "user_email": current_user.email,
            "filename": file.filename,
            "storage_path": file_path,
            "file_size": len(file_bytes),
            "status": "processing"
        })
        .execute()
    )

    document_id = UUID(result.data[0]["id"])

    try:
        process_document(document_id)

        (
        supabase.table("documents")
        .update({"status": "completed"})
        .eq("id", document_id)
        .execute()
        )

        return {
            "message": "Document processed successfully",
            "document_id": str(document_id)
        }

    except Exception as e:
        (
        supabase.table("documents")
        .update({"status": "failed"})
        .eq("id", document_id)
        .execute()
        )
        raise e

# # Data Ingestion
# @router.get("/ingest/{document_id}")
# async def ingest_document(document_id:UUID):
#     result= get_pdf_content(document_id)
#     return result

# # Data Chunking
# @router.get("/chunks/{document_id}")
# async def chunk_document(document_id:UUID):
#     result= split_text(document_id)
#     return result


# # Embedding of the following:
# @router.get("/embedding/{document_id}")
# async def embedding(document_id: UUID):

#     chunks=split_text(document_id)

#     manager = EmbeddingManager()

#     embeddings = manager.generate_embedding(
#         document_id
#     )

#     embedding_vector(
#         document_id,
#         chunks,
#         embeddings
#     )

#     return {
#         "message":"content stored sucessfully",
#         "total_chunks":len(chunks)
#     }


# LLM integration
from llm.llm import openai


@router.post("/ai")
async def chat(message:str):
    try:

        value = openai(message)

        return {
            "response": value
        }
    except Exception as e:
        return {
            "result": str(e)
        }