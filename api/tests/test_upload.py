import io
from fastapi.testclient import TestClient
from fastapi import FastAPI
from api.routes.upload import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)

def test_upload_valid_pt3():
    fake_file = io.BytesIO(b"fake pt3 binary content")
    response = client.post(
        "/upload/",
        files={"file": ("experiment.pt3", fake_file, "application/octet-stream")}
    )
    assert response.status_code == 200
    assert response.json()["filename"] == "experiment.pt3"
    assert response.json()["status"] == "pending"

def test_upload_valid_csv():
    fake_file = io.BytesIO(b"time,intensity\n0.1,500\n0.2,480")
    response = client.post(
        "/upload/",
        files={"file": ("data.csv", fake_file, "text/csv")}
    )
    assert response.status_code == 200
    assert response.json()["filename"] == "data.csv"