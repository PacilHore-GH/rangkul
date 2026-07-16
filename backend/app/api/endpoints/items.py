from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict, List, Optional
import uuid

router = APIRouter()

# Schema for input item validation
class ItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "Pending"

# Schema for output item
class Item(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str

# In-memory database mock
db_items = [
    {
        "id": "1",
        "title": "Setup Repository Structure",
        "description": "Establish FastAPI backend and Next.js frontend base templates.",
        "status": "Completed"
    },
    {
        "id": "2",
        "title": "Configure Multi-Container Docker",
        "description": "Create Dockerfiles and docker-compose orchestration.",
        "status": "Completed"
    },
    {
        "id": "3",
        "title": "Design Premium Frontend UI",
        "description": "Build dark mode workspace dashboard with glassmorphism.",
        "status": "Completed"
    },
    {
        "id": "4",
        "title": "Deploy to Cloud Service",
        "description": "Deploy backend to Google Cloud Run and frontend to Vercel.",
        "status": "Pending"
    }
]

@router.get("", response_model=List[Item])
def get_items() -> List[Dict]:
    """
    Get all mock work items.
    """
    return db_items

@router.post("", response_model=Item, status_code=status.HTTP_201_CREATED)
def create_item(item_in: ItemCreate) -> Dict:
    """
    Create a new mock work item.
    """
    new_item = {
        "id": str(uuid.uuid4())[:8],
        "title": item_in.title,
        "description": item_in.description,
        "status": item_in.status
    }
    db_items.append(new_item)
    return new_item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: str):
    """
    Delete a mock work item by ID.
    """
    global db_items
    initial_len = len(db_items)
    db_items = [item for item in db_items if item["id"] != item_id]
    if len(db_items) == initial_len:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Item with ID {item_id} not found"
        )
    return None
