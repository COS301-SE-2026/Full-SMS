import io
from fastapi.testclient import TestClient
from fastapi import FastAPI
from api.routes.upload_routes import router

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

def test_upload_valid_h5():
    fake_file = io.BytesIO(b"fake h5 content")
    response = client.post(
        "/upload/",
        files={"file": ("data.h5", fake_file, "application/octet-stream")}
    )
    assert response.status_code == 200
    assert response.json()["filename"] == "data.h5"

def test_upload_valid_hdf5():
    fake_file = io.BytesIO(b"fake hdf5 content")
    response = client.post(
        "/upload/",
        files={"file": ("data.hdf5", fake_file, "application/octet-stream")}
    )
    assert response.status_code == 200
    assert response.json()["filename"] == "data.hdf5"

def test_upload_invalid_extension():
    fake_file = io.BytesIO(b"some content")
    response = client.post(
        "/upload/",
        files={"file": ("report.pdf", fake_file, "application/pdf")}
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]

def test_upload_no_file_sent():
    response = client.post("/upload/")
    assert response.status_code == 422

def test_response_contains_all_keys():
    fake_file = io.BytesIO(b"fake pt3 binary content")
    response = client.post(
        "/upload/",
        files={"file": ("experiment.pt3", fake_file, "application/octet-stream")}
    )
    body = response.json()
    assert "message" in body
    assert "filename" in body
    assert "saved_as" in body
    assert "size_bytes" in body
    assert "status" in body

    