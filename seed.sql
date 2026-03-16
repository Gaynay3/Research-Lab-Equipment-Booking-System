-- PostgreSQL seed data for Research Lab Equipment Booking System (Sprint 1)

-- Roles
INSERT INTO Role (RoleName) VALUES ('Admin'), ('Student'), ('Faculty');

-- Users
INSERT INTO UserAccount (FirstName, LastName, Email, PasswordHash, RoleID) VALUES
('Alice', 'Smith', 'alice@univ.edu', 'hash1', 2),
('Bob', 'Johnson', 'bob@univ.edu', 'hash2', 3),
('Carol', 'Admin', 'carol@univ.edu', 'hash3', 1);

-- Equipment
INSERT INTO Equipment (EquipmentName, Description, SerialNumber, Category, TotalQty, CurrQty) VALUES
('Microscope', 'High precision microscope', 'SN-1001', 'Optics', 5, 5),
('Centrifuge', 'Lab centrifuge', 'SN-2001', 'Biology', 2, 2),
('Spectrometer', 'UV-Vis Spectrometer', 'SN-3001', 'Chemistry', 3, 3);

-- Reservations
INSERT INTO Reservation (UserID, EquipmentID, Qty, StartTime, EndTime, Status, ApprovedBy) VALUES
(1, 1, 1, '2026-03-20 09:00', '2026-03-20 12:00', 'Pending', NULL),
(2, 2, 1, '2026-03-21 10:00', '2026-03-21 13:00', 'Approved', 3);
