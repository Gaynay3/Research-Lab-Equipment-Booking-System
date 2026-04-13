import React, { useState } from 'react';
import './App.css';
import EquipmentList from './EquipmentList';
import ReservationForm from './ReservationForm';
import ReservationsPage from './ReservationsPage';

function App() {
  const [page, setPage] = useState('equipment');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <span className="app-title">
            Research Lab Equipment Booking System
          </span>
          <nav className="app-nav">
            <button
              className={`nav-link${page === "equipment" ? " active" : ""}`}
              onClick={() => setPage("equipment")}
            >
              Equipment
            </button>
            <button
              className={`nav-link${page === "reserve" ? " active" : ""}`}
              onClick={() => setPage("reserve")}
            >
              New Reservation
            </button>
            <button
              className={`nav-link${page === "reservations" ? " active" : ""}`}
              onClick={() => setPage("reservations")}
            >
              Reservations
            </button>
          </nav>
        </div>
      </header>

      <main>
        {page === "equipment" && <EquipmentList />}
        {page === "reserve" && <ReservationForm />}
        {page === "reservations" && <ReservationsPage />}
      </main>
    </div>
  );
}

export default App;
