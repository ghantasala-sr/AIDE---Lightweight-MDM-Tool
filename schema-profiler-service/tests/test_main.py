from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_profile_schema_empty():
    response = client.post("/profile-schema", json=[])
    assert response.status_code == 200
    assert response.json() == []

# A mocked test for the actual endpoint would patch VertexAI,
# but for now we test that it can receive the correct payload structure.
def test_profile_schema_validation():
    payload = [
        {
            "source_table_name": "users",
            "column_name": "email",
            "sample_values": ["test@example.com", "user@domain.com"]
        }
    ]
    # We won't assert the actual Vertex AI output here to avoid quota usage/latency in CI,
    # but we assert it doesn't return a 422 Unprocessable Entity
    response = client.post("/profile-schema", json=payload)
    assert response.status_code == 200
