from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv() 

celery_app = Celery(
    "full_sms",
    broker=os.getenv("CELERY_BROKER_URL"),
    backend=os.getenv("CELERY_RESULT_BACKEND"),
    include=[
        "api.services.hdf5_job_service", 
        "api.services.analysis_services.clustering_job_service"
    ] 
)