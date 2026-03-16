# FastAPI backend for Research Lab Equipment Booking System (Sprint 1)
# Core endpoints: equipment, reservations, users
# Connects to PostgreSQL using psycopg2

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
import os
from typing import List, Optional

# Database connection settings (edit as needed)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "lab_booking")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")

def get_db_conn():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )

app = FastAPI()

# Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Equipment(BaseModel):
    EquipmentID: int
    EquipmentName: str
    Description: Optional[str]
    SerialNumber: Optional[str]
    Category: Optional[str]
    TotalQty: int
    CurrQty: int

class Reservation(BaseModel):
    ReservationID: int
    UserID: int
    EquipmentID: int
    Qty: int
    StartTime: str
    EndTime: str
    Status: str
    ApprovedBy: Optional[int]
    CreatedAt: str

class ReservationCreate(BaseModel):
    UserID: int
    EquipmentID: int
    Qty: int
    StartTime: str
    EndTime: str

class User(BaseModel):
    UserID: int
    FirstName: str
    LastName: str
    Email: str
    RoleID: int

# API endpoints
@app.get("/")
def root():
    return {"message": "Research Lab Equipment Booking System API"}

@app.get("/equipment", response_model=List[Equipment])
def get_equipment():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT EquipmentID, EquipmentName, Description, SerialNumber, Category, TotalQty, CurrQty FROM Equipment ORDER BY EquipmentName")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [Equipment(**dict(zip([desc[0] for desc in cur.description], row))) for row in rows]

@app.get("/reservations", response_model=List[Reservation])
def get_reservations():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM Reservation ORDER BY CreatedAt DESC")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [Reservation(**dict(zip([desc[0] for desc in cur.description], row))) for row in rows]

@app.post("/reservations", response_model=Reservation)
def create_reservation(res: ReservationCreate):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO Reservation (UserID, EquipmentID, Qty, StartTime, EndTime)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING *
    """, (res.UserID, res.EquipmentID, res.Qty, res.StartTime, res.EndTime))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=400, detail="Reservation could not be created.")
    return Reservation(**dict(zip([desc[0] for desc in cur.description], row)))

@app.put("/reservations/{reservation_id}/approve", response_model=Reservation)
def approve_reservation(reservation_id: int):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        UPDATE Reservation SET Status='Approved' WHERE ReservationID=%s RETURNING *
    """, (reservation_id,))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Reservation not found.")
    return Reservation(**dict(zip([desc[0] for desc in cur.description], row)))

@app.put("/reservations/{reservation_id}/deny", response_model=Reservation)
def deny_reservation(reservation_id: int):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        UPDATE Reservation SET Status='Denied' WHERE ReservationID=%s RETURNING *
    """, (reservation_id,))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Reservation not found.")
    return Reservation(**dict(zip([desc[0] for desc in cur.description], row)))

@app.get("/users", response_model=List[User])
def get_users():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT UserID, FirstName, LastName, Email, RoleID FROM UserAccount ORDER BY FirstName")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [User(**dict(zip([desc[0] for desc in cur.description], row))) for row in rows]
