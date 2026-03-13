import json
import os
from typing import List
from pydantic import BaseModel, Field
from google import genai

# ============================================================================
# Pydantic Schema for Structured Output
# ============================================================================

class EvidenceItem(BaseModel):
    filename: str = Field(
        description="Short, valid filename (e.g., 'Lease_Agreement_PDF'). No spaces/special chars."
    )
    description: str = Field(
        description="Explanation of what this evidence contains and why it helps the case."
    )

class EvidenceRecommendationResponse(BaseModel):
    items: List[EvidenceItem]

# ============================================================================
# Core Functions
# ============================================================================

def recommend_evidence(extracted_info: dict, api_key: str) -> dict:
    """
    Uses Gemini (gemini-3-flash-preview) to recommend evidence based on extracted case info.
    Returns a dict of evidence_name -> description.
    """
    # Initialize the client with the v1alpha version
    client = genai.Client(api_key=api_key, http_options={'api_version': 'v1alpha'})

    prompt = f"""
    You are a legal strategist. Based on the extracted case information below, recommend relevant pieces of evidence that would support the plaintiff's claims.

    CASE INFO:
    {json.dumps(extracted_info)}

    INSTRUCTIONS:
    Provide the output strictly as a JSON object (a dictionary).
    - The Keys must be short, valid file names for the evidence (e.g., "Lease_Agreement_PDF", "Email_Thread_Nov2023"). Avoid spaces or special characters in keys.
    - The Values must be a description of what information this evidence contains and why it helps the case.
    """
    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[prompt],
            config={
                "response_mime_type": "application/json",
                "response_json_schema": EvidenceRecommendationResponse.model_json_schema(),
            },
        )

        # Parse the structured response
        structured_data = EvidenceRecommendationResponse.model_validate_json(response.text)
        
        # Convert list back to the dictionary format expected by your downstream code
        # Format: { "Filename_Key": "Description Value" }
        evidence_dict = {item.filename: item.description for item in structured_data.items}
        
        return evidence_dict

    except Exception as e:
        print(f"Error generating evidence recommendations: {e}")
        # Return empty dict on failure to prevent crash
        return {}

def create_evidence_folders(evidence_dict: dict, evidence_folder_path: str):
    """
    Creates folder structure with description.txt for each recommended evidence.
    """
    os.makedirs(evidence_folder_path, exist_ok=True)
    for folder_name, description in evidence_dict.items():
        safe_name = "".join(c for c in folder_name if c.isalnum() or c in ("_", "-"))
        path = os.path.join(evidence_folder_path, safe_name)
        os.makedirs(path, exist_ok=True)
        with open(os.path.join(path, "description.txt"), "w", encoding="utf-8") as f:
            f.write(description)
