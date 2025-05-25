import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    sku = Column(String, unique=True, index=True, nullable=False) # Stock Keeping Unit
    manufacturer = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship to blockchain event references (optional, for easier querying)
    # This is conceptual, actual blockchain data is not directly linked via SQL FK.
    # We might store blockchain transaction IDs or block indexes here if needed.

# If implementing role-based access:
# class User(Base):
#     __tablename__ = "users"
#     id = Column(Integer, primary_key=True, index=True)
#     username = Column(String, unique=True, index=True)
#     hashed_password = Column(String)
#     role = Column(String) # e.g., 'supplier', 'manufacturer', 'retailer'