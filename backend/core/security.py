from dotenv import load_dotenv
from datetime import datetime, timezone,timedelta
from jose import JWTError,jwt
from fastapi import HTTPException,status,Depends
import os
# Owth2 and JWT configuration in the code.
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from db.database import get_db,Login

load_dotenv()

SECRET_KEY=os.getenv("SECRET_KEY")
ALGORITHM=os.getenv("ALGORITHM")

# Oauth setup
oauth2_scheme=OAuth2PasswordBearer(tokenUrl="/auth/login")



# CreATE The acess token first
def create_token(data:dict,expires_minutes:int=60):

    to_encode=data.copy()
    expire=datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)

    to_encode.update({
        "exp":expire
    })

    token=jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    return token


# Verify the token
def verify_token(token:str):
    try:
        payload=jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email=payload.get("sub")

        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Token"
            )
        
        return payload
    
    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

# Oauth2 setup for the following routes
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    print("TOKEN RECEIVED:", token)

    payload = verify_token(token)

    email = payload.get("sub")

    user = db.query(Login).filter(
        Login.email == email
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user