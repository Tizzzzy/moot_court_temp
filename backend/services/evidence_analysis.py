"""
Evidence analysis service — replicates the exact prompt and multimodal logic
from evidence_feedback/evidence_feedback.py and evidence_feedback/llm.py.
"""

import os
import json
import pandas as pd
from typing import List, Tuple
from pydantic import BaseModel, Field
from google import genai

# Using the preview model which supports vision/pdf understanding
MODEL_ID = "gemini-3-flash-preview"


class EvidenceAnalysisResponse(BaseModel):
    ready_status: bool = Field(
        description="True ONLY if the evidence is strong, accurate, and matches the description perfectly. Otherwise false."
    )
    specific_feedback: str = Field(
        description="Detailed feedback on strength, relevance, and missing details."
    )

def read_excel_as_text(file_path: str) -> str:
    """
    Reads an Excel file and converts it to a CSV-style string
    so the model can read it as text.
    """
    try:
        df = pd.read_excel(file_path)
        return df.to_csv(index=False)
    except Exception as e:
        return f"Error reading Excel file: {e}"


def evidence_feedback(
    extracted_info: dict, 
    evidence_description: str,
    evidence_file_paths: List[str], 
    api_key: str
) -> Tuple[bool, str]:
    """
    Analyzes specific evidence files against the case info and expected description using Gemini.
    
    Args:
        extracted_info: Dictionary of case details.
        evidence_description: What the evidence is supposed to be.
        evidence_file_paths: List of file paths to analyze together.
        api_key: Gemini API Key.

    Returns:
        (is_ready: bool, feedback_text: str)
    """
    client = genai.Client(api_key=api_key, http_options={'api_version': 'v1alpha'})

    # 1. Construct the System/Text Prompt
    prompt_text = f"""
    ROLE: Legal Evidence Analyst.

    CASE SUMMARY:
    {json.dumps(extracted_info)}

    EXPECTED EVIDENCE DESCRIPTION:
    "{evidence_description}"

    TASK:
    The user has uploaded the attached evidence file(s).
    1. specific_feedback: Provide detailed feedback on strength, relevance, and missing details for *all* files.
    2. ready_status: Return true ONLY if the provided evidence is strong, accurate, and matches the description perfectly. Otherwise false.
    """

    # 2. Build the 'contents' list (Text + Files)
    contents = [prompt_text]
    
    print(f" -> Analyzing {len(evidence_file_paths)} file(s)...")

    for file_path in evidence_file_paths:
        if not os.path.exists(file_path):
            print(f"Warning: File not found {file_path}")
            continue

        filename = os.path.basename(file_path)
        ext = os.path.splitext(file_path)[1].lower()

        # --- CASE 1: Excel (Convert to Text) ---
        # Gemini handles text effectively, and Excel is often dense, so converting to CSV text 
        # is often more reliable than image/file upload for tabular data.
        if ext in ['.xlsx', '.xls', '.csv']:
            print(f"Converting Excel/CSV to Text: {filename}...")
            csv_text = read_excel_as_text(file_path)
            contents.append(f"\n\n--- Content of {filename} ---\n{csv_text}")

        # --- CASE 2: Supported Media (PDF, Images) ---
        # Gemini native File API supports PDF and common Image formats directly.
        elif ext in ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif']:
            try:
                print(f"Uploading to Gemini: {filename}...")
                # Upload the file directly using the client
                uploaded_file = client.files.upload(file=file_path)
                contents.append(uploaded_file)
            except Exception as e:
                print(f"Failed to upload {filename}: {e}")

        else:
            print(f"Skipping unsupported file type: {filename}")

    # 3. Call Gemini API
    try:
        print("Sending request to model...")
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=contents,
            config={
                "response_mime_type": "application/json",
                "response_json_schema": EvidenceAnalysisResponse.model_json_schema(),
            },
        )

        # 4. Parse Structured Output
        analysis = EvidenceAnalysisResponse.model_validate_json(response.text)
        return analysis.ready_status, analysis.specific_feedback

    except Exception as e:
        error_msg = f"Gemini API Error: {str(e)}"
        print(error_msg)
        return False, error_msg