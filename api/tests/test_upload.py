import io
from fastapi.testclient import TestClient
from fastapi import FastAPI
from api.routes.upload_routes import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)

def test_upload_valid_ptu():
    test = io.BytesIO(b"bytes vytes bytes bytes")
    response = client.post(
        "/upload/",
        files={"file": ("experiment.ptu", test, "application/octet-stream")}
    )
    assert response.status_code == 200
    assert response.json()["filename"] == "experiment.ptu"
    assert response.json()["status"] == "pending"

def test_upload_valid_csv():
    test = io.BytesIO(b"time,intensity\n0.1,500\n0.2,480")
    response = client.post(
        "/upload/",
        files={"file": ("data.csv", test, "text/csv")}
    )
    assert response.status_code == 200
    assert response.json()["filename"] == "data.csv"

def test_upload_valid_h5():
    test = io.BytesIO(b"fake h5 bytes")
    response = client.post(
        "/upload/",
        files={"file": ("data.h5", test, "application/octet-stream")}
    )
    assert response.status_code == 200
    assert response.json()["filename"] == "data.h5"

def test_upload_valid_hdf5():
    test = io.BytesIO(b"fake hdf5 bytes")
    response = client.post(
        "/upload/",
        files={"file": ("data.hdf5", test, "application/octet-stream")}
    )
    assert response.status_code == 200
    assert response.json()["filename"] == "data.hdf5"

def test_upload_invalid_extension():
    test = io.BytesIO(b"some bytes")
    response = client.post(
        "/upload/",
        files={"file": ("report.pdf", test, "application/pdf")}
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]

def test_upload_no_file_sent():
    response = client.post("/upload/")
    assert response.status_code == 422

def test_response_contains_all_keys():
    test = io.BytesIO(b"fake ptu binary bytes")
    response = client.post(
        "/upload/",
        files={"file": ("experiment.ptu", test, "application/octet-stream")}
    )
    body = response.json()
    assert "message" in body
    assert "filename" in body
    assert "saved_as" in body
    assert "size_bytes" in body
    assert "status" in body

    