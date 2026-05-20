.PHONY: backend-check run-api run-frontend frontend-check setup-backend

# Makefile for Full-SMS project

#MAKE SURE TO RUN THIS MAKEFILE FROM THE ROOT DIRECTORY OF THE PROJECT

#This makefile defines the following targets:
#- setup-backend: Installs the backend dependencies using pip.
#- run-api: Sets up the backend and starts the API server using uvicorn.
#- run-frontend: Navigates to the frontend directory, installs dependencies using pnpm,
#  and starts the development server.
#- backend-check: Installs pytest and runs backend tests, allowing for a specific exit code
#  to indicate no tests were collected.
#- frontend-check: Navigates to the frontend directory, installs dependencies, lints the code
#  and builds the frontend application.

#EXAMPLE USAGE:
#To set up the backend and run the API server:
#make run-api

#To run the frontend development server:
#make run-frontend

setup-backend:
	python -m pip install --upgrade pip
	python -m pip install -r ./api/requirements.txt

run-api: setup-backend
	@echo "Backend dependencies installed."
	@echo "Starting the API server..."
	uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

run-frontend:
	cd frontend && pnpm install && pnpm run dev

backend-check: setup-backend
	python -m pip install pytest
	python -m pytest -q || [ $$? -eq 5 ]

frontend-check: 
	cd frontend && pnpm install && pnpm lint && pnpm run build