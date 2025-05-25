import datetime
from typing import Annotated, List  # Add Annotated

from fastapi import (APIRouter, Depends,  # Ensure Depends is imported
                     HTTPException, status)
from sqlalchemy.orm import Session

from blockchain.core import Blockchain

from .. import crud, models, schemas  # Added models
from ..config import settings
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/events",
    tags=["blockchain_events"],
)

# Initialize the blockchain - In a real app, this might be loaded from a persisted state
# or managed by a separate service. For simplicity, we create a new one on server start.
# This means blockchain data is lost on server restart unless persisted.
# A production system would need to save/load the chain (e.g., to a file or DB).
supply_chain_blockchain = Blockchain(difficulty=settings.BLOCKCHAIN_DIFFICULTY) # New way

@router.post("/record", status_code=status.HTTP_201_CREATED)
def record_supply_chain_event(
    event_data_in: schemas.BlockchainEventCreate, # Renamed to avoid conflict
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[models.User, Depends(get_current_active_user)] # Add dependency
):
    product = crud.get_product(db, product_id=event_data_in.product_id)
    if not product:
        raise HTTPException(
            status_code=404,
            detail=f"Product with ID {event_data_in.product_id} not found."
        )

    # You can augment event_data with current_user info if your schema allows
    # For example, if BlockchainEventData had a 'recorded_by_user_id' field.
    # Or, you can modify the 'actor' field based on the user if that makes sense.
    # For now, we'll just use current_user for protection.
    # print(f"Event recorded by: {current_user.username}")

    event_payload = event_data_in.model_dump()
    if event_data_in.timestamp is None:
        event_payload["timestamp"] = datetime.datetime.utcnow().isoformat()
    else:
        event_payload["timestamp"] = event_data_in.timestamp.isoformat()

    # Add who recorded the event, if desired and schema supports
    # event_payload["recorded_by"] = current_user.username

    try:
        new_block = supply_chain_blockchain.add_block(event_payload)
        return {
            "message": "Event recorded on the blockchain successfully.",
            "block_index": new_block.index,
            "block_hash": new_block.hash,
            "event_data": new_block.data
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record event on blockchain: {str(e)}"
        ) from e


@router.get("/history/{product_id}", response_model=List[schemas.BlockData])
def get_product_event_history(product_id: int, db: Session = Depends(get_db)):
    # Validate product_id (optional)
    product = crud.get_product(db, product_id=product_id)
    if not product:
        raise HTTPException(status_code=404,
                            detail=f"Product with ID {product_id} not found for history lookup.")

    # Filter blockchain for events related to this product_id
    product_history = []
    for block in supply_chain_blockchain.chain:
        if block.index == 0: # Skip Genesis block for product-specific history
            continue
        # Ensure block.data is a dictionary and has 'product_id'
        if isinstance(block.data, dict) and block.data.get("product_id") == product_id:
            block_info = schemas.BlockData(
                index=block.index,
                timestamp=block.timestamp,
                data=block.data, # Assuming data is already a dict or serializable
                previous_hash=block.previous_hash,
                hash=block.hash,
                nonce=block.nonce
            )
            product_history.append(block_info)

    if not product_history:
        # Return empty list if no history, or 404 if preferred
        return []   # Or raise HTTPException(status_code=404,
                    #detail=f"No blockchain events found for product ID {product_id}")
    return product_history

@router.get("/blockchain/info", response_model=schemas.BlockchainInfo)
def get_blockchain_info():
    chain_data = []
    for block in supply_chain_blockchain.chain:
        chain_data.append(schemas.BlockData(
            index=block.index,
            timestamp=block.timestamp,
            data=block.data,
            previous_hash=block.previous_hash,
            hash=block.hash,
            nonce=block.nonce
        ))
    return schemas.BlockchainInfo(
        chain=chain_data,
        is_valid=supply_chain_blockchain.is_chain_valid(),
        difficulty=supply_chain_blockchain.difficulty,
        chain_length=len(supply_chain_blockchain.chain)
    )

@router.post("/blockchain/validate", summary="Validate Blockchain Integrity")
def validate_blockchain_integrity():
    is_valid = supply_chain_blockchain.is_chain_valid()
    if is_valid:
        return {"message": "Blockchain is valid."}
    else:
        # In a real scenario, this would trigger alerts or recovery mechanisms
        raise HTTPException(status_code=500, detail="Blockchain integrity check failed!")
