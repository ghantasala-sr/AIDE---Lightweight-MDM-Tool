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

from langchain_anthropic import ChatAnthropic
import json

# We will initialize ChatAnthropic inside the endpoint
_llm = None
def get_llm():
    global _llm
    if _llm is None:
        _llm = ChatAnthropic(model_name="claude-3-5-sonnet-20240620", max_tokens=1024, temperature=0.1)
    return _llm

@app.post("/profile-schema", response_model=List[ProfileResult])
async def profile_schema(columns: List[ColumnData]):
    # Serialize columns payload to string
    columns_json = json.dumps([c.model_dump() for c in columns])
    
    prompt = f"""
You are an expert data mapping AI.
Analyze these columns from a source table and infer their semantic types for identity resolution.

Columns Data:
{columns_json}

Respond ONLY with a valid JSON ARRAY of objects matching exactly this schema for each column:
[
  {{
    "column": "column_name",
    "inferred_semantic_type": "string (e.g. email, first_name, phone, company, etc)",
    "confidence": 0.0 to 1.0,
    "is_candidate_match_key": true/false,
    "reasoning": "brief explanation"
  }}
]
"""
    try:
        llm = get_llm()
        response_message = llm.invoke(prompt)
        # Basic cleanup in case LLM wraps in markdown
        clean_text = response_message.content.replace('```json', '').replace('```', '').strip()
        data_list = json.loads(clean_text)
        
        results = []
        for data in data_list:
            results.append(ProfileResult(
                column=data.get("column", "unknown"),
                inferred_semantic_type=data.get("inferred_semantic_type", "unknown"),
                confidence=float(data.get("confidence", 0.5)),
                is_candidate_match_key=bool(data.get("is_candidate_match_key", False)),
                reasoning=data.get("reasoning", "Vertex AI inference")
            ))
        return results
    except Exception as e:
        # Fallback
        results = []
        for col in columns:
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
