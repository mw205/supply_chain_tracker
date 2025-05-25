from typing import Annotated, List  # Add Annotated

from fastapi import (APIRouter, Depends,  # Ensure Depends is imported
                     HTTPException, status)
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..database import engine, get_db
from ..dependencies import get_current_active_user

# Create database tables if they don't exist
# This should ideally be handled by Alembic migrations in a larger app
models.Base.metadata.create_all(bind=engine)


router = APIRouter(
    prefix="/products",
    tags=["products"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_new_product(
    product: schemas.ProductCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    # Ensure user is authorized to create products
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    db_product_sku = crud.get_product_by_sku(db, sku=product.sku)
    if db_product_sku:
        raise HTTPException(status_code=400,
                            detail=f"Product with SKU {product.sku} already exists.")
    return crud.create_product(db=db, product=product)

@router.get("/", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = crud.get_products(db, skip=skip, limit=limit)
    return products

@router.get("/{product_id}", response_model=schemas.Product)
def read_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.put("/{product_id}", response_model=schemas.Product)
def update_existing_product(product_id: int, product: schemas.ProductUpdate,
                            db: Session = Depends(get_db)):
    db_product = crud.update_product(db, product_id=product_id, product_update=product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product

@router.delete("/{product_id}", response_model=schemas.Product)
def delete_existing_product(product_id: int, db: Session = Depends(get_db)):
    db_product = crud.delete_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product
