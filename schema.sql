-- Research Lab Equipment Booking System: SQL Schema

-- Table: Role
CREATE TABLE Role (
    RoleID SERIAL PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL UNIQUE
);

-- Table: UserAccount
CREATE TABLE UserAccount (
    UserID SERIAL PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    RoleID INT NOT NULL,
    FOREIGN KEY (RoleID) REFERENCES Role(RoleID)
);

-- Table: Category
CREATE TABLE Category (
    CategoryID SERIAL PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL UNIQUE
);

-- Table: Equipment
CREATE TABLE Equipment (
    EquipmentID SERIAL PRIMARY KEY,
    EquipmentName VARCHAR(150) NOT NULL,
    Description VARCHAR(255),
    SerialNumber VARCHAR(100) UNIQUE,
    CategoryID INT REFERENCES Category(CategoryID),
    TotalQty INT NOT NULL CHECK (TotalQty >= 0),
    CurrQty INT NOT NULL CHECK (CurrQty >= 0 AND CurrQty <= TotalQty)
);

-- Table: Reservation
CREATE TABLE Reservation (
    ReservationID SERIAL PRIMARY KEY,
    UserID INT NOT NULL,
    EquipmentID INT NOT NULL,
    Qty INT NOT NULL CHECK (Qty > 0),
    StartTime TIMESTAMP NOT NULL,
    EndTime TIMESTAMP NOT NULL,
    Status VARCHAR(20) DEFAULT 'Pending' CHECK (Status IN ('Pending','Approved','Denied','Returned','Late')),
    ApprovedBy INT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES UserAccount(UserID),
    FOREIGN KEY (EquipmentID) REFERENCES Equipment(EquipmentID),
    FOREIGN KEY (ApprovedBy) REFERENCES UserAccount(UserID),
    CHECK (EndTime > StartTime)
);

-- Table: UsageLog
CREATE TABLE UsageLog (
    LogID SERIAL PRIMARY KEY,
    ReservationID INT NOT NULL,
    CheckOutTime TIMESTAMP,
    CheckInTime TIMESTAMP,
    Condition VARCHAR(255),
    LoggedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ReservationID) REFERENCES Reservation(ReservationID),
    CHECK (CheckInTime IS NULL OR CheckOutTime IS NULL OR CheckInTime > CheckOutTime)
);

-- Trigger: prevent overlapping approved reservations for the same equipment
CREATE OR REPLACE FUNCTION check_reservation_overlap()
RETURNS TRIGGER AS $$
DECLARE
    available_qty INT;
    total_reserved INT;
BEGIN
    IF NEW.Status = 'Approved' THEN
        -- Sum up all approved reservations for this equipment that overlap with the new time window
        SELECT COALESCE(SUM(Qty), 0) INTO total_reserved
        FROM Reservation
        WHERE EquipmentID = NEW.EquipmentID
          AND ReservationID != NEW.ReservationID
          AND Status = 'Approved'
          AND StartTime < NEW.EndTime
          AND EndTime > NEW.StartTime;

        -- Get total available quantity for this equipment
        SELECT TotalQty INTO available_qty
        FROM Equipment
        WHERE EquipmentID = NEW.EquipmentID;

        -- Reject if the new reservation would exceed total quantity
        IF (total_reserved + NEW.Qty) > available_qty THEN
            RAISE EXCEPTION 'Equipment is fully booked during the requested time window';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_overlap
BEFORE UPDATE ON Reservation
FOR EACH ROW EXECUTE FUNCTION check_reservation_overlap();

-- Trigger: decrease CurrQty when a reservation status changes to Approved
CREATE OR REPLACE FUNCTION decrease_equipment_qty()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.Status != 'Approved' AND NEW.Status = 'Approved' THEN
        UPDATE Equipment
        SET CurrQty = CurrQty - NEW.Qty
        WHERE EquipmentID = NEW.EquipmentID;

        IF (SELECT CurrQty FROM Equipment WHERE EquipmentID = NEW.EquipmentID) < 0 THEN
            RAISE EXCEPTION 'Not enough equipment available';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrease_qty
AFTER UPDATE ON Reservation
FOR EACH ROW EXECUTE FUNCTION decrease_equipment_qty();

-- Trigger: restore CurrQty when a reservation is denied or returned
CREATE OR REPLACE FUNCTION restore_equipment_qty()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.Status = 'Approved' AND NEW.Status IN ('Denied', 'Returned') THEN
        UPDATE Equipment
        SET CurrQty = CurrQty + OLD.Qty
        WHERE EquipmentID = OLD.EquipmentID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_restore_qty
AFTER UPDATE ON Reservation
FOR EACH ROW EXECUTE FUNCTION restore_equipment_qty();
