FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the API code
COPY api/ ./api/

# Expose port
EXPOSE 8000

# Default command (overridden by celery_worker service)
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
