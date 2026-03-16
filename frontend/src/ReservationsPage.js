import React, { useEffect, useState } from 'react';
import { getReservations, getUsers, getEquipment, approveReservation, denyReservation } from './api';

function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    refresh();
    getUsers().then(setUsers);
    getEquipment().then(setEquipment);
  }, []);

  const refresh = () => {
    setLoading(true);
    getReservations().then(data => {
      setReservations(data);
      setLoading(false);
    });
  };

  const userName = id => {
    const u = users.find(u => u.UserID === id);
    return u ? `${u.FirstName} ${u.LastName}` : id;
  };
  const equipmentName = id => {
    const eq = equipment.find(e => e.EquipmentID === id);
    return eq ? eq.EquipmentName : id;
  };

  const handleApprove = async id => {
    setMessage('');
    try {
      await approveReservation(id);
      setMessage('Reservation approved.');
      refresh();
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.detail || 'Could not approve.'));
    }
  };
  const handleDeny = async id => {
    setMessage('');
    try {
      await denyReservation(id);
      setMessage('Reservation denied.');
      refresh();
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.detail || 'Could not deny.'));
    }
  };

  if (loading) return <div>Loading reservations...</div>;

  return (
    <div>
      <h2>Reservations</h2>
      {message && <div>{message}</div>}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Equipment</th>
            <th>Qty</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(r => (
            <tr key={r.ReservationID}>
              <td>{r.ReservationID}</td>
              <td>{userName(r.UserID)}</td>
              <td>{equipmentName(r.EquipmentID)}</td>
              <td>{r.Qty}</td>
              <td>{r.StartTime.replace('T', ' ').slice(0, 16)}</td>
              <td>{r.EndTime.replace('T', ' ').slice(0, 16)}</td>
              <td>{r.Status}</td>
              <td>
                {r.Status === 'Pending' && (
                  <>
                    <button onClick={() => handleApprove(r.ReservationID)}>Approve</button>
                    <button onClick={() => handleDeny(r.ReservationID)}>Deny</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReservationsPage;
