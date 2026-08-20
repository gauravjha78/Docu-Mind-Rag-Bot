from fastapi import FastAPI
from routers.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, chat


app = FastAPI()

app.include_router(auth.router)
app.include_router(chat.router)

origins=[
    "http://localhost:5173"   
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


