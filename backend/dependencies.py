from typing import Annotated  # For Python 3.9+

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from . import crud, models, schemas, security
from .config import settings
from .database import get_db

# from typing_extensions import Annotated # For Python < 3.9, install typing_extensions



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token") # Points to your login endpoint

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)]
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security.jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError as exc:
        raise credentials_exception from exc

    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    if not user.is_active: # Optional: Check if user is active
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

async def get_current_active_user(
    current_user: Annotated[models.User, Depends(get_current_user)]
) -> models.User:
    # This is a convenience dependency if you often need to check if a user is active.
    # Our get_current_user already checks this, so it might be redundant for now
    # but good to show the pattern.
    if not current_user.is_active: # Redundant if get_current_user checks it
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
