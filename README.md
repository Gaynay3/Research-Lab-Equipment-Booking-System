# Research Lab Equipment Booking System (Sprint 1)

A simple, beginner-friendly prototype for a research lab equipment booking system.

## Features (Sprint 1)
- View equipment
- Submit reservation requests
- View reservations
- Admin approve/deny reservations

## Project Structure
- frontend/: React app
- backend/: FastAPI app
- schema.sql: Database schema
- seed.sql: Sample data

## Setup Instructions

### 1. PostgreSQL Database
1. Install PostgreSQL if not already installed.
2. Create a database (e.g., `lab_booking`).
3. Run `schema.sql` to create tables:
	```
	psql -U postgres -d lab_booking -f schema.sql
	```
4. Run `seed.sql` to insert sample data:
	```
	psql -U postgres -d lab_booking -f seed.sql
	```
5. (Optional) Adjust DB connection settings in `backend/main.py` if needed.

### 2. Backend (FastAPI)
1. Open a terminal in the `backend/` folder.
2. Create and activate a Python virtual environment:
	```
	python -m venv venv
	venv\Scripts\activate  # On Windows
	# Or: source venv/bin/activate  # On Mac/Linux
	```
3. Install dependencies:
	```
	pip install -r requirements.txt
	```
4. Start the FastAPI server:
	```
	uvicorn main:app --reload
	```
5. The API will be available at `http://localhost:8000`

### 3. Frontend (React)
1. Open a terminal in the `frontend/` folder.
2. Install dependencies:
	```
	npm install
	```
3. Start the React app:
	```
	npm start
	```
4. The app will open at `http://localhost:3000`

## Usage
- Use the navigation buttons to view equipment, submit reservations, and view/approve/deny reservations.
- No authentication is required for Sprint 1 demo.

## Notes
- Make sure the backend is running before using the frontend.
- Adjust CORS or API URLs if running on different hosts/ports.
