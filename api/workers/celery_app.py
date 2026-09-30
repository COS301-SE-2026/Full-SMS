from celery import Celery
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()
api_env = Path(__file__).resolve().parent.parent / ".env"
if api_env.exists():
    load_dotenv(dotenv_path=api_env) 

celery_app = Celery(
    "full_sms",
    broker=os.getenv("CELERY_BROKER_URL", "redis://127.0.0.1:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://127.0.0.1:6379/0"),
    include=[
        "api.services.hdf5_job_service", 
        "api.services.analysis_services.clustering_job_service"
    ] 
)