from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import Base, engine
from app.auth.router import router as auth_router

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Full-SMS API",
    version="1.0.0"
)

# lets Next.js frontend work
app.add_middleware(
    CORSMiddleware,
    allow_origins = [settings.frontend_url],
    allow_credentials = True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api")

@app.get("/api/health", tags=["Heath"])
def health_check():
    """Simple health check endpoint."""
    return{"status":"ok","service": "full-sms-api"}
