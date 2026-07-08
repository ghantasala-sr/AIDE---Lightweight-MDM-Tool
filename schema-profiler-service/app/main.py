from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI(title="AIDE Schema Profiler Service")

class ColumnData(BaseModel):
    column_name: str
    source_table_name: str
    sample_values: List[str]

class ProfileResult(BaseModel):
    column: str
    inferred_semantic_type: str
    confidence: float
    is_candidate_match_key: bool
    reasoning: str

from langchain_google_vertexai import VertexAI
import json

# Initialize the Gemini model via Vertex AI
llm = VertexAI(model_name="gemini-1.5-pro-preview-0409", max_output_tokens=1024, temperature=0.1)

@app.post("/profile-schema", response_model=List[ProfileResult])
async def profile_schema(columns: List[ColumnData]):
    results = []
    for col in columns:
        prompt = f"""
You are an expert data mapping AI.
Analyze this column from a source table and infer its semantic type for identity resolution.
Table Name: {col.source_table_name}
Column Name: {col.column_name}
Sample Values: {', '.join(col.sample_values)}

Respond ONLY with a valid JSON object matching exactly this schema:
{{
  "column": "{col.column_name}",
  "inferred_semantic_type": "string (e.g. email, first_name, phone, company, etc)",
  "confidence": 0.0 to 1.0,
  "is_candidate_match_key": true/false,
  "reasoning": "brief explanation"
}}
"""
        try:
            response_text = llm.invoke(prompt)
            # Basic cleanup in case LLM wraps in markdown
            clean_text = response_text.replace('```json', '').replace('```', '').strip()
            data = json.loads(clean_text)
            
            results.append(ProfileResult(
                column=data.get("column", col.column_name),
                inferred_semantic_type=data.get("inferred_semantic_type", "unknown"),
                confidence=float(data.get("confidence", 0.5)),
                is_candidate_match_key=bool(data.get("is_candidate_match_key", False)),
                reasoning=data.get("reasoning", "Vertex AI inference")
            ))
        except Exception as e:
            # Fallback
            results.append(ProfileResult(
                column=col.column_name,
                inferred_semantic_type="unknown",
                confidence=0.0,
                is_candidate_match_key=False,
                reasoning=f"Error calling LLM: {str(e)}"
            ))
            
    return results

@app.get("/health")
async def health_check():
    return {"status": "ok"}
