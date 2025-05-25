import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, EmailStr


# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    sku: str
    manufacturer: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    name: Optional[str] = None
    sku: Optional[str] = None

class Product(ProductBase):
    id: int
    created_at: datetime.datetime

    class Config:
        orm_mode = True # Changed from orm_mode = True
        # from_attributes = True for Pydantic v2

# --- Blockchain Event Schemas ---
class BlockchainEventData(BaseModel):
    product_id: int # Link to off-chain product
    event_type: str # e.g., "CREATED", "SHIPPED", "RECEIVED"
    location: Optional[str] = None
    actor: Optional[str] = None # Who performed the action
    notes: Optional[str] = None
    timestamp: Optional[datetime.datetime] = None # Will be set by blockchain

class BlockchainEventCreate(BlockchainEventData):
    pass

class BlockData(BaseModel):
    index: int
    timestamp: float
    data: Any # Can be dict or specific schema
    previous_hash: str
    hash: str
    nonce: int

class BlockchainInfo(BaseModel):
    chain: List[BlockData]
    is_valid: bool
    difficulty: int
    chain_length: int

class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str # Plain password, will be hashed by the backend

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True # Pydantic v2
        # orm_mode = True # Pydantic v1

class User(UserInDBBase): # Schema for returning user data (without password)
    pass

class UserInDB(UserInDBBase): # Schema for user data stored in DB (with hashed_password)
    hashed_password: str


# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None