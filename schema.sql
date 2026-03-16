-- Research Lab Equipment Booking System: Sprint 1 SQL Schema

-- Table: Role
CREATE TABLE Role (
    RoleID INT PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE
);

-- Table: User
CREATE TABLE "User" (
    UserID INT PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    RoleID INT NOT NULL,
    FOREIGN KEY (RoleID) REFERENCES Role(RoleID)
);

-- Table: Equipment
CREATE TABLE Equipment (
    EquipmentID INT PRIMARY KEY,
    EquipmentName VARCHAR(150) NOT NULL,
    Description VARCHAR(255),
    SerialNumber VARCHAR(100) UNIQUE,
    Category VARCHAR(100),
    TotalQty INT NOT NULL CHECK (TotalQty >= 0),
    CurrQty INT NOT NULL CHECK (CurrQty >= 0 AND CurrQty <= TotalQty)
);

-- Table: Reservation
CREATE TABLE Reservation (
    ReservationID INT PRIMARY KEY,
    UserID INT NOT NULL,
    EquipmentID INT NOT NULL,
    Qty INT NOT NULL CHECK (Qty > 0),
    StartTime DATETIME NOT NULL,
    EndTime DATETIME NOT NULL,
    Status VARCHAR(20) DEFAULT 'Pending' CHECK (Status IN ('Pending','Approved','Denied','Returned','Late')),
    ApprovedBy INT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES "User"(UserID),
    FOREIGN KEY (EquipmentID) REFERENCES Equipment(EquipmentID),
    FOREIGN KEY (ApprovedBy) REFERENCES "User"(UserID),
    CHECK (EndTime > StartTime),
    UNIQUE (EquipmentID, StartTime, EndTime)
);

-- Table: UsageLog
CREATE TABLE UsageLog (
    LogID INT PRIMARY KEY,
    UserID INT NOT NULL,
    EquipmentID INT NOT NULL,
    ReservationID INT NOT NULL,
    CheckOutTime DATETIME,
    CheckInTime DATETIME,
    Condition VARCHAR(255),
    LoggedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES "User"(UserID),
    FOREIGN KEY (EquipmentID) REFERENCES Equipment(EquipmentID),
    FOREIGN KEY (ReservationID) REFERENCES Reservation(ReservationID),
    CHECK (CheckInTime IS NULL OR CheckOutTime IS NULL OR CheckInTime > CheckOutTime)
);

-- Sample Inserts
INSERT INTO Role (RoleID, RoleName) VALUES (1, 'Admin'), (2, 'Student'), (3, 'Faculty');
INSERT INTO "User" (UserID, FirstName, LastName, Email, PasswordHash, RoleID) VALUES (1, 'Alice', 'Smith', 'alice@univ.edu', 'hash1', 2);
INSERT INTO Equipment (EquipmentID, EquipmentName, TotalQty, CurrQty) VALUES (1, 'Microscope', 5, 5);

-- Sample Query: Check available equipment
SELECT EquipmentName, CurrQty FROM Equipment WHERE CurrQty > 0;

-- Sample Query: Find overlapping reservations
SELECT * FROM Reservation r1
WHERE EXISTS (
    SELECT 1 FROM Reservation r2
    WHERE r1.EquipmentID = r2.EquipmentID
      AND r1.ReservationID <> r2.ReservationID
      AND r1.StartTime < r2.EndTime
      AND r1.EndTime > r2.StartTime
);
