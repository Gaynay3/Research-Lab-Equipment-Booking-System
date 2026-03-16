import React, { useState } from 'react';
import './App.css';
import EquipmentList from './EquipmentList';
import ReservationForm from './ReservationForm';
import ReservationsPage from './ReservationsPage';

function App() {
  const [page, setPage] = useState('equipment');

  return (
    <div className="App">
      <nav style={{ marginBottom: 20 }}>
        <button onClick={() => setPage('equipment')}>Equipment</button>
        <button onClick={() => setPage('reserve')}>New Reservation</button>
        <button onClick={() => setPage('reservations')}>Reservations</button>
      </nav>
      {page === 'equipment' && <EquipmentList />}
      {page === 'reserve' && <ReservationForm />}
      {page === 'reservations' && <ReservationsPage />}
    </div>
  );
}

export default App;
