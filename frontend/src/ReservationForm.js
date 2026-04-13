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
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    setIsError(false);
    setSubmitting(true);
    try {
      await createReservation({
        ...form,
        Qty: Number(form.Qty),
      });
      setMessage("Reservation submitted successfully.");
      setIsError(false);
      setForm({
        UserID: "",
        EquipmentID: "",
        Qty: 1,
        StartTime: "",
        EndTime: "",
      });
      if (onReservation) onReservation();
    } catch (err) {
      setIsError(true);
      setMessage(
        "Error: " +
          (err.response?.data?.detail || "Could not submit reservation."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <h2 className="page-heading">New Reservation</h2>

      {message && (
        <div className={isError ? "message-error" : "message-success"}>
          {message}
        </div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="UserID">User</label>
            <select
              id="UserID"
              name="UserID"
              value={form.UserID}
              onChange={handleChange}
              required
            >
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.UserID} value={u.UserID}>
                  {u.FirstName} {u.LastName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="EquipmentID">Equipment</label>
            <select
              id="EquipmentID"
              name="EquipmentID"
              value={form.EquipmentID}
              onChange={handleChange}
              required
            >
              <option value="">Select equipment</option>
              {equipment.map((eq) => (
                <option key={eq.EquipmentID} value={eq.EquipmentID}>
                  {eq.EquipmentName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="Qty">Quantity</label>
            <input
              id="Qty"
              type="number"
              name="Qty"
              min="1"
              value={form.Qty}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="StartTime">Start Time</label>
            <input
              id="StartTime"
              type="datetime-local"
              name="StartTime"
              value={form.StartTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="EndTime">End Time</label>
            <input
              id="EndTime"
              type="datetime-local"
              name="EndTime"
              value={form.EndTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mt-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Reservation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReservationForm;
