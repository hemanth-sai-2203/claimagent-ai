import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Document

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = "uploads"

@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if file.content_type and not (file.content_type.startswith("image/") or file.content_type == "application/pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid file type. Only images and PDFs are supported."
        )
    
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    doc = Document(
        filename=file.filename,
        file_path=file_path
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    return {"document_id": doc.id}
