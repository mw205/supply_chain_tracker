from datetime import timedelta
from typing import Annotated  # For Python 3.9+

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import \
    OAuth2PasswordRequestForm  # Pre-built form for username/password
from sqlalchemy.orm import Session

from .. import crud, models, schemas, security  # Added models
from ..config import settings
from ..database import get_db
from ..dependencies import get_current_active_user  # Import dependency

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
)

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)]
):
    user = crud.get_user_by_username(db, username=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Annotated[Session, Depends(get_db)]):
    db_user_by_username = crud.get_user_by_username(db, username=user.username)
    if db_user_by_username:
        raise HTTPException(status_code=400, detail="Username already registered")
    if user.email:
        db_user_by_email = crud.get_user_by_email(db, email=user.email)
        if db_user_by_email:
            raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)


@router.get("/users/me", response_model=schemas.User)
async def read_users_me(
    current_user: Annotated[models.User, Depends(get_current_active_user)]
):
    """
    Get current logged-in user.
    """
    return current_user
