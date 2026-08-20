# SQL Alchemy ORM with SQlite database for stroing the login information

from sqlalchemy import create_engine, Column, Integer, String  # type: ignore
from sqlalchemy.orm import declarative_base, sessionmaker, Session  # type: ignore


# Declare the URL first
DATABASE_URL="sqlite:///./Login.db"

# Declare the engine to start with the database connection
engine=create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread":False}
)

# Create a session to interact with the db
session=sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
    )

# Start to create the table
Base=declarative_base()

class Login(Base):
    __tablename__="login"

    id=Column(Integer,primary_key=True,index=True)

    google_id=Column(String,unique=True)

    email=Column(String,unique=True)
    name=Column(String)
    picture=Column(String)
    

Base.metadata.create_all(bind=engine)

def get_db():
    db=session()
    try:
        yield db
    finally:
        db.close()

# @app.get("/")
# def get_info(db:Session=Depends(get_db)):
#     return {
#         "message":"Database connected sucessfully"
#     }
        


