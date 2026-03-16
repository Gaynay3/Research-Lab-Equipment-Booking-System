import React, { useEffect, useState } from 'react';
import { getEquipment, getUsers, createReservation } from './api';

function ReservationForm({ onReservation }) {
  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [form, setForm] = useState({
    UserID: '',
    EquipmentID: '',
    Qty: 1,
    StartTime: '',
    EndTime: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    getUsers().then(setUsers);
    getEquipment().then(setEquipment);
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      await createReservation({
        ...form,
        Qty: Number(form.Qty)
      });
      setMessage('Reservation submitted!');
      setForm({ UserID: '', EquipmentID: '', Qty: 1, StartTime: '', EndTime: '' });
      if (onReservation) onReservation();
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.detail || 'Could not submit reservation.'));
    }
  };

  return (
    <div>
      <h2>New Reservation</h2>
      <form onSubmit={handleSubmit}>
        <label>User:
          <select name="UserID" value={form.UserID} onChange={handleChange} required>
            <option value="">Select user</option>
            {users.map(u => (
              <option key={u.UserID} value={u.UserID}>{u.FirstName} {u.LastName}</option>
            ))}
          </select>
        </label>
        <label>Equipment:
          <select name="EquipmentID" value={form.EquipmentID} onChange={handleChange} required>
            <option value="">Select equipment</option>
            {equipment.map(eq => (
              <option key={eq.EquipmentID} value={eq.EquipmentID}>{eq.EquipmentName}</option>
            ))}
          </select>
        </label>
        <label>Quantity:
          <input type="number" name="Qty" min="1" value={form.Qty} onChange={handleChange} required />
        </label>
        <label>Start Time:
          <input type="datetime-local" name="StartTime" value={form.StartTime} onChange={handleChange} required />
        </label>
        <label>End Time:
          <input type="datetime-local" name="EndTime" value={form.EndTime} onChange={handleChange} required />
        </label>
        <button type="submit">Submit</button>
      </form>
      {message && <div>{message}</div>}
    </div>
  );
}

export default ReservationForm;
