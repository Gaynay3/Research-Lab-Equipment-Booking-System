# FastAPI backend for Research Lab Equipment Booking System (Sprint 1)
# Core endpoints: equipment, reservations, users
# Connects to PostgreSQL using psycopg2

import os

from dotenv import load_dotenv

load_dotenv()

from datetime import datetime, timedelta
from typing import List, Optional

import psycopg2
import psycopg2.errors
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
from passlib.context import CryptContext
from pydantic import BaseModel, Field

# Database connection settings (edit as needed)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "lab_booking")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "postgres")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


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
    Category: Optional[str] = Field(alias="categoryname")
    TotalQty: int = Field(alias="totalqty")
    CurrQty: int = Field(alias="currqty")

    model_config = {"populate_by_name": True, "serialize_by_alias": False}


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

    model_config = {"populate_by_name": True, "serialize_by_alias": False}


class ReservationCreate(BaseModel):
    UserID: int
    EquipmentID: int
    Qty: int
    StartTime: str
    EndTime: str


class Category(BaseModel):
    CategoryID: int = Field(alias="categoryid")
    CategoryName: str = Field(alias="categoryname")

    model_config = {"populate_by_name": True, "serialize_by_alias": False}


class CategoryCreate(BaseModel):
    CategoryName: str


class EquipmentCreate(BaseModel):
    EquipmentName: str
    CategoryID: Optional[int] = None
    Description: Optional[str] = None
    Qty: int


class QuantityIncrease(BaseModel):
    Amount: int


class User(BaseModel):
    UserID: int = Field(alias="userid")
    FirstName: str = Field(alias="firstname")
    LastName: str = Field(alias="lastname")
    Email: str = Field(alias="email")
    RoleID: int = Field(alias="roleid")

    model_config = {"populate_by_name": True, "serialize_by_alias": False}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role_id: int
    first_name: str


def rows_to_dicts(cursor, rows):
    keys = [desc[0] for desc in cursor.description]
    return [dict(zip(keys, row)) for row in rows]


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def create_access_token(data, expires_delta):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + expires_delta
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user_id = int(user_id)
        if user_id is None:
            raise credentials_exception
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise credentials_exception
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT UserID, FirstName, LastName, Email, RoleID FROM UserAccount WHERE UserID = %s",
        (user_id,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row is None:
        raise credentials_exception
    return User(
        **dict(zip(["userid", "firstname", "lastname", "email", "roleid"], row))
    )


# API endpoints
@app.get("/")
def root():
    return {"message": "Research Lab Equipment Booking System API"}


@app.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT UserID, FirstName, LastName, Email, PasswordHash, RoleID FROM UserAccount WHERE Email = %s",
        (form_data.username,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row is None or not verify_password(form_data.password, row[4]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id, first_name, _, _, _, role_id = row
    token = create_access_token(
        {"sub": user_id}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user_id,
        role_id=role_id,
        first_name=first_name,
    )


@app.get("/equipment", response_model=List[Equipment], response_model_by_alias=False)
def get_equipment():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT e.EquipmentID, e.EquipmentName, e.Description, e.SerialNumber, c.CategoryName, e.TotalQty, e.CurrQty FROM Equipment e LEFT JOIN Category c ON e.CategoryID = c.CategoryID ORDER BY e.EquipmentName"
    )
    rows = cur.fetchall()
    result = rows_to_dicts(cur, rows)
    cur.close()
    conn.close()
    return [Equipment(**row) for row in result]


@app.get("/categories", response_model=List[Category], response_model_by_alias=False)
def get_categories():
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT CategoryID, CategoryName FROM Category ORDER BY CategoryName")
    rows = cur.fetchall()
    result = rows_to_dicts(cur, rows)
    cur.close()
    conn.close()
    return [Category(**row) for row in result]


@app.post("/categories", response_model=Category, response_model_by_alias=False)
def create_category(
    body: CategoryCreate, current_user: User = Depends(get_current_user)
):
    if current_user.RoleID != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create categories.",
        )
    conn = get_db_conn()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO Category (CategoryName) VALUES (%s) RETURNING CategoryID, CategoryName",
            (body.CategoryName,),
        )
        row = cur.fetchone()
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Category already exists.")
    cur.close()
    conn.close()
    return Category(**dict(zip(["categoryid", "categoryname"], row)))


@app.post("/equipment", response_model=Equipment, response_model_by_alias=False)
def create_equipment(
    body: EquipmentCreate, current_user: User = Depends(get_current_user)
):
    if current_user.RoleID != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can add equipment.",
        )
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO Equipment (EquipmentName, Description, CategoryID, TotalQty, CurrQty) VALUES (%s, %s, %s, %s, %s) RETURNING EquipmentID",
        (body.EquipmentName, body.Description, body.CategoryID, body.Qty, body.Qty),
    )
    row = cur.fetchone()
    conn.commit()
    equipment_id = row[0]
    cur.execute(
        "SELECT e.EquipmentID, e.EquipmentName, e.Description, e.SerialNumber, c.CategoryName, e.TotalQty, e.CurrQty FROM Equipment e LEFT JOIN Category c ON e.CategoryID = c.CategoryID WHERE e.EquipmentID = %s",
        (equipment_id,),
    )
    rows = cur.fetchall()
    result = rows_to_dicts(cur, rows)
    cur.close()
    conn.close()
    return Equipment(**result[0])


@app.patch(
    "/equipment/{equipment_id}/quantity",
    response_model=Equipment,
    response_model_by_alias=False,
)
def increase_equipment_quantity(
    equipment_id: int,
    body: QuantityIncrease,
    current_user: User = Depends(get_current_user),
):
    if current_user.RoleID != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update equipment quantity.",
        )
    if body.Amount < 1:
        raise HTTPException(status_code=400, detail="Amount must be at least 1.")
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "UPDATE Equipment SET TotalQty = TotalQty + %s, CurrQty = CurrQty + %s WHERE EquipmentID = %s RETURNING EquipmentID",
        (body.Amount, body.Amount, equipment_id),
    )
    row = cur.fetchone()
    if not row:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Equipment not found.")
    conn.commit()
    cur.execute(
        "SELECT e.EquipmentID, e.EquipmentName, e.Description, e.SerialNumber, c.CategoryName, e.TotalQty, e.CurrQty FROM Equipment e LEFT JOIN Category c ON e.CategoryID = c.CategoryID WHERE e.EquipmentID = %s",
        (equipment_id,),
    )
    rows = cur.fetchall()
    result = rows_to_dicts(cur, rows)
    cur.close()
    conn.close()
    return Equipment(**result[0])


@app.get(
    "/reservations", response_model=List[Reservation], response_model_by_alias=False
)
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


@app.post("/reservations", response_model=Reservation, response_model_by_alias=False)
def create_reservation(
    res: ReservationCreate, current_user: User = Depends(get_current_user)
):
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO Reservation (UserID, EquipmentID, Qty, StartTime, EndTime) VALUES (%s, %s, %s, %s, %s) RETURNING ReservationID, UserID, EquipmentID, Qty, CAST(StartTime AS TEXT), CAST(EndTime AS TEXT), Status, ApprovedBy, CAST(CreatedAt AS TEXT)",
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


@app.put(
    "/reservations/{reservation_id}/approve",
    response_model=Reservation,
    response_model_by_alias=False,
)
def approve_reservation(
    reservation_id: int, current_user: User = Depends(get_current_user)
):
    if current_user.RoleID != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can approve reservations.",
        )
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "UPDATE Reservation SET Status='Approved', ApprovedBy=%s WHERE ReservationID=%s RETURNING ReservationID, UserID, EquipmentID, Qty, CAST(StartTime AS TEXT), CAST(EndTime AS TEXT), Status, ApprovedBy, CAST(CreatedAt AS TEXT)",
        (current_user.UserID, reservation_id),
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


@app.put(
    "/reservations/{reservation_id}/deny",
    response_model=Reservation,
    response_model_by_alias=False,
)
def deny_reservation(
    reservation_id: int, current_user: User = Depends(get_current_user)
):
    if current_user.RoleID != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can deny reservations.",
        )
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "UPDATE Reservation SET Status='Denied', ApprovedBy=NULL WHERE ReservationID=%s RETURNING ReservationID, UserID, EquipmentID, Qty, CAST(StartTime AS TEXT), CAST(EndTime AS TEXT), Status, ApprovedBy, CAST(CreatedAt AS TEXT)",
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


@app.get("/users", response_model=List[User], response_model_by_alias=False)
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
