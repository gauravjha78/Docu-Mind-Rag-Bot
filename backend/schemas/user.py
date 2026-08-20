from pydantic import BaseModel

class UserResponse(BaseModel):
    id:int
    name:str
    email:str
    picture:str

    class Config:
        from_attributes=True
