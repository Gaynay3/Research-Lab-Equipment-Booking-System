# Research Lab Equipment Booking System

A simple, beginner-friendly prototype for a research lab equipment booking system.

## Features
- View available lab equipment and quantities
- Submit reservation requests with date/time range
- Admin approve/deny reservations
- JWT-based login with bcrypt password hashing
- Role-based navigation (Admin vs. Student/Faculty)
- PostgreSQL triggers enforce availability and overlap rules

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
4. Create a `.env` file in the `backend/` folder (see below).
5. Start the FastAPI server:
	```
	uvicorn main:app --reload
	```
6. The API will be available at `http://localhost:8000`

#### Setting Up the `.env` File

The backend requires a `.env` file in the `backend/` folder with your database credentials and a JWT secret key:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lab_booking
DB_USER=<your_pg_username>
DB_PASS=<your_pg_password>
SECRET_KEY=<your_secret_key>
```

**Generating a secure `SECRET_KEY`:**

The secret key is used to sign JWT tokens. It should be a long, random string. Generate one using any of these methods:

- **Python** (recommended):
	```
	python -c "import secrets; print(secrets.token_hex(32))"
	```
- **OpenSSL** (Mac/Linux):
	```
	openssl rand -hex 32
	```

Copy the output and paste it as the value for `SECRET_KEY` in your `.env` file. Never commit this file to version control — it is already listed in `.gitignore`.

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
- Log in with one of the seeded accounts (all passwords are `password123`):

| Name | Email | Role |
|------|-------|------|
| Carol Admin | carol@univ.edu | Admin |
| Alice Smith | alice@univ.edu | Student |
| Bob Johnson | bob@univ.edu | Faculty |

- **Students/Faculty** can browse equipment and submit reservation requests.
- **Admins** additionally see the Reservations page and can approve or deny requests.

## Notes
- Make sure the backend is running before using the frontend.
- Adjust CORS or API URLs if running on different hosts/ports.
