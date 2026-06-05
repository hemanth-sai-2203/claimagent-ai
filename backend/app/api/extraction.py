from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pydantic import ValidationError
from app.schemas.extraction import ExtractionResult
from app.services.extraction import extract_document_data

router = APIRouter(prefix="/extraction", tags=["Extraction"])

@router.post("/", response_model=ExtractionResult, status_code=status.HTTP_200_OK)
async def extract_document(file: UploadFile = File(...)):
    """
    Upload a medical document image (Prescription, Bill, etc.) 
    to extract structured JSON data using Gemini 2.5 Flash.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid file type. Only images are supported."
        )
        
    try:
        contents = await file.read()
        result = extract_document_data(contents, file.content_type)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Extraction failed: {str(e)}"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Schema validation error on extraction output: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
