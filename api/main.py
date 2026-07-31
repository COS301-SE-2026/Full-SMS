# main
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from api/.env
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)
from api.routes.auth_routes import router as auth_router
from api.routes.profile_routes import router as profile_router
from api.routes.upload_routes import router as upload_router
from api.routes.hdf5_routes import router as hdf5_router
from api.routes.workspace_routes import router as workspace_router
from api.routes.analysis_routes import router as analysis_router
from api.routes.session_routes import session_router
from api.routes.export_routes import router as export_router
from api.routes.plugin_routes import router as plugin_router
from api.routes.support_routes import support_router

app = FastAPI(
    title="Full-SMS API",
    description="Backend API for Single-Molecule Spectroscopy Analysis Web Platform",
    version="1.0.0",
    docs_url="/api/py/docs",
    redoc_url="/api/py/redoc",
    openapi_url="/api/py/openapi.json"
)

# CORS configuration - allows frontend to call backend

origins = [o.strip() for o in os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000,https://fullsms-v2.vercel.app").split(",")]
print("CORS origins:", [repr(o) for o in origins])
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://fullsms-v2-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

prefix:str = '/api/py'
app.include_router(auth_router, prefix=prefix)
app.include_router(hdf5_router, prefix=prefix)
app.include_router(profile_router, prefix=prefix)
app.include_router(upload_router, prefix=prefix)
app.include_router(session_router, prefix=prefix)
app.include_router(workspace_router, prefix=prefix)
app.include_router(analysis_router, prefix=prefix)
app.include_router(plugin_router, prefix=prefix)
app.include_router(support_router, prefix=prefix)
app.include_router(export_router, prefix=prefix)

@app.on_event("startup")
async def startup_event():
    print("\n" + "="*60)
    print("Full-SMS Backend Server Started")
    print("Swagger Documentation: http://localhost:8000/api/py/docs")
    print("Health Check: http://localhost:8000/api/py/health")
    print("="*60 + "\n")


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

@app.get("/read", tags=["HDF5 Reading"])
async def read_hdf5():
    """
    Endpoint for reading HDF5 files
    """
    return {"message": "This endpoint is for HDF5 file reading."}
