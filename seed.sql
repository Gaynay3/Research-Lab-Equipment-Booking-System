-- PostgreSQL seed data for Research Lab Equipment Booking System

-- Roles
INSERT INTO Role (RoleName) VALUES ('Admin'), ('Student'), ('Faculty');

-- Users (passwords are bcrypt hash of password123)
INSERT INTO UserAccount (FirstName, LastName, Email, PasswordHash, RoleID) VALUES
('Carol', 'Admin', 'carol@univ.edu', '$2b$12$Wfuqew.qDEA/t1QfmT9VHuuCLsvp6yuX0qMHySOVbckDWv2rpmgTi', 1),
('Alice', 'Smith', 'alice@univ.edu', '$2b$12$Wfuqew.qDEA/t1QfmT9VHuuCLsvp6yuX0qMHySOVbckDWv2rpmgTi', 2),
('Bob', 'Johnson', 'bob@univ.edu', '$2b$12$Wfuqew.qDEA/t1QfmT9VHuuCLsvp6yuX0qMHySOVbckDWv2rpmgTi', 3);

-- Categories
INSERT INTO Category (CategoryName) VALUES ('Optics'), ('Biology'), ('Chemistry');

-- Equipment (CategoryID references Category table)
INSERT INTO Equipment (EquipmentName, Description, SerialNumber, CategoryID, TotalQty, CurrQty) VALUES
('Microscope', 'High precision microscope', 'SN-1001', 1, 5, 5),
('Centrifuge', 'Lab centrifuge', 'SN-2001', 2, 2, 2),
('Spectrometer', 'UV-Vis Spectrometer', 'SN-3001', 3, 3, 3);

-- Reservations
INSERT INTO Reservation (UserID, EquipmentID, Qty, StartTime, EndTime, Status) VALUES
(2, 1, 1, '2026-03-20 09:00', '2026-03-20 12:00', 'Pending'),
(3, 2, 1, '2026-03-21 10:00', '2026-03-21 13:00', 'Pending');
