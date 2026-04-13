# FastAPI backend for Research Lab Equipment Booking System (Sprint 1)
# Core endpoints: equipment, reservations, users
# Connects to PostgreSQL using psycopg2

import os
from typing import List, Optional

import psycopg2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Database connection settings (edit as needed)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "lab_booking")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")


def get_db_conn():
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASS
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


# Pydantic models — field aliases match PostgreSQL lowercase column names
class Equipment(BaseModel):
    EquipmentID: int = Field(alias="equipmentid")
    EquipmentName: str = Field(alias="equipmentname")
    Description: Optional[str] = Field(alias="description")
    SerialNumber: Optional[str] = Field(alias="serialnumber")
    Category: Optional[str] = Field(alias="category")
    TotalQty: int = Field(alias="totalqty")
    CurrQty: int = Field(alias="currqty")

    model_config = {"populate_by_name": True}


class Reservation(BaseModel):
    ReservationID: int = Field(alias="reservationid")
    UserID: int = Field(alias="userid")
    EquipmentID: int = Field(alias="equipmentid")
    Qty: int = Field(alias="qty")
    StartTime: str = Field(alias="starttime")
    EndTime: str = Field(alias="endtime")
    Status: str = Field(alias="status")
    ApprovedBy: Optional[int] = Field(alias="approvedby")
    CreatedAt: str = Field(alias="createdat")

    model_config = {"populate_by_name": True}


class ReservationCreate(BaseModel):
    UserID: int
    EquipmentID: int
    Qty: int
    StartTime: str
    EndTime: str


class User(BaseModel):
    UserID: int = Field(alias="userid")
    FirstName: str = Field(alias="firstname")
    LastName: str = Field(alias="lastname")
    Email: str = Field(alias="email")
    RoleID: int = Field(alias="roleid")

    model_config = {"populate_by_name": True}


def rows_to_dicts(cursor, rows):
    keys = [desc[0] for desc in cursor.description]
    return [dict(zip(keys, row)) for row in rows]


def row_to_dict(cursor, row):
    keys = [desc[0] for desc in cursor.description]
    return dict(zip(keys, row))


# API endpoints
@app.get("/")
def root():
    return {"message": "Research Lab Equipment Booking System API"}


@app.get("/equipment", response_model=List[Equipment])
def get_equipment():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT EquipmentID, EquipmentName, Description, SerialNumber, Category, TotalQty, CurrQty FROM Equipment ORDER BY EquipmentName"
    )
    rows = cur.fetchall()
    result = rows_to_dicts(cur, rows)
    cur.close()
    conn.close()
    return [Equipment(**row) for row in result]


@app.get("/reservations", response_model=List[Reservation])
def get_reservations():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT ReservationID, UserID, EquipmentID, Qty, CAST(StartTime AS TEXT), CAST(EndTime AS TEXT), Status, ApprovedBy, CAST(CreatedAt AS TEXT) FROM Reservation ORDER BY CreatedAt DESC"
    )
    rows = cur.fetchall()
    keys = [
        "reservationid",
        "userid",
        "equipmentid",
        "qty",
        "starttime",
        "endtime",
        "status",
        "approvedby",
        "createdat",
    ]
    cur.close()
    conn.close()
    return [Reservation(**dict(zip(keys, row))) for row in rows]


@app.post("/reservations", response_model=Reservation)
def create_reservation(res: ReservationCreate):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO Reservation (UserID, EquipmentID, Qty, StartTime, EndTime)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING ReservationID, UserID, EquipmentID, Qty, CAST(StartTime AS TEXT), CAST(EndTime AS TEXT), Status, ApprovedBy, CAST(CreatedAt AS TEXT)
        """,
        (res.UserID, res.EquipmentID, res.Qty, res.StartTime, res.EndTime),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=400, detail="Reservation could not be created.")
    keys = [
        "reservationid",
        "userid",
        "equipmentid",
        "qty",
        "starttime",
        "endtime",
        "status",
        "approvedby",
        "createdat",
    ]
    return Reservation(**dict(zip(keys, row)))


@app.put("/reservations/{reservation_id}/approve", response_model=Reservation)
def approve_reservation(reservation_id: int):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE Reservation SET Status='Approved' WHERE ReservationID=%s
        RETURNING ReservationID, UserID, EquipmentID, Qty, CAST(StartTime AS TEXT), CAST(EndTime AS TEXT), Status, ApprovedBy, CAST(CreatedAt AS TEXT)
        """,
        (reservation_id,),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Reservation not found.")
    keys = [
        "reservationid",
        "userid",
        "equipmentid",
        "qty",
        "starttime",
        "endtime",
        "status",
        "approvedby",
        "createdat",
    ]
    return Reservation(**dict(zip(keys, row)))


@app.put("/reservations/{reservation_id}/deny", response_model=Reservation)
def deny_reservation(reservation_id: int):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE Reservation SET Status='Denied' WHERE ReservationID=%s
        RETURNING ReservationID, UserID, EquipmentID, Qty, CAST(StartTime AS TEXT), CAST(EndTime AS TEXT), Status, ApprovedBy, CAST(CreatedAt AS TEXT)
        """,
        (reservation_id,),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Reservation not found.")
    keys = [
        "reservationid",
        "userid",
        "equipmentid",
        "qty",
        "starttime",
        "endtime",
        "status",
        "approvedby",
        "createdat",
    ]
    return Reservation(**dict(zip(keys, row)))


@app.get("/users", response_model=List[User])
def get_users():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT UserID, FirstName, LastName, Email, RoleID FROM UserAccount ORDER BY FirstName"
    )
    rows = cur.fetchall()
    result = rows_to_dicts(cur, rows)
    cur.close()
    conn.close()
    return [User(**row) for row in result]
