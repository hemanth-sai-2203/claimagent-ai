import os
import json
from google import genai
from google.genai import types
from app.schemas.extraction import ExtractionResult

# Define the Gemini Prompt Template
EXTRACTION_PROMPT = """
You are an expert medical claims data extractor for ClaimPilot AI.
Your only job is to analyze the provided medical document image and extract its contents into the exact requested JSON schema.

CRITICAL RULES:
1. NEVER make adjudication decisions (do not approve, reject, or validate policy rules).
2. DO NOT invent or hallucinate data. If a field is missing, omit it or use default empty values.
3. Classify the document accurately (PRESCRIPTION, MEDICAL_BILL, DIAGNOSTIC_REPORT, PHARMACY_BILL).
4. Provide realistic confidence scores (0.0 to 1.0) based on document legibility and completeness.
5. Identify any physical document anomalies in `error_flags` (e.g., blurry text, cut off margins, missing dates, handwritten text that is illegible).
6. Ensure doctor registration numbers, dates, and amounts are extracted exactly as they appear.

Extract the data now and return ONLY the JSON structured data.
"""

def get_gemini_client():
    # Instantiate the client. It will automatically use the GEMINI_API_KEY environment variable.
    return genai.Client()

def extract_document_data(image_bytes: bytes, mime_type: str = "image/jpeg") -> ExtractionResult:
    """
    Takes an image of a medical document, calls Gemini 2.5 Flash, 
    and returns a structured ExtractionResult.
    """
    client = get_gemini_client()
    
    # Using Gemini 2.5 Flash for multimodal structured extraction
    model_name = "gemini-2.5-flash"
    
    # We configure Structured Outputs using response_schema
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=ExtractionResult,
        temperature=0.0  # Zero temperature for deterministic extraction
    )
    
    # Create the part from the image bytes
    image_part = types.Part.from_bytes(
        data=image_bytes,
        mime_type=mime_type,
    )
    
    response = client.models.generate_content(
        model=model_name,
        contents=[EXTRACTION_PROMPT, image_part],
        config=config,
    )
    
    # Parse the resulting JSON into the Pydantic model
    if not response.text:
        raise ValueError("Gemini returned an empty response")
        
    result_dict = json.loads(response.text)
    return ExtractionResult(**result_dict)
