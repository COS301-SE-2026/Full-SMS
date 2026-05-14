from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="Full-SMS API",
    description="Backend API for Single-Molecule Spectroscopy Analysis Web Platform",
    version="1.0.0",
    docs_url="/api/py/docs",
    redoc_url="/api/py/redoc",
    openapi_url="/api/py/openapi.json"
)

# CORS configuration - allows frontend to call backend
origins = os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/py/health", tags=["Health Check"])
async def health_check():
    """
    Health check endpoint to verify that the API is running.
    """
    return {"status": "ok", "message": "Full-SMS API is running!"}


@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint - redirects to documentation
    """
    return {"message": "Full-SMS API", "docs": "/api/py/docs"}