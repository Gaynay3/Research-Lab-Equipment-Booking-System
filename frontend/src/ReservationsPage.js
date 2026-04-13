import React, { useEffect, useState } from 'react';
import { getReservations, getUsers, getEquipment, approveReservation, denyReservation } from './api';

function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

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

  const formatTime = (t) => t.replace("T", " ").slice(0, 16);

  const handleApprove = async (id) => {
    setMessage("");
    setIsError(false);
    try {
      await approveReservation(id);
      setMessage("Reservation approved.");
      setIsError(false);
      refresh();
    } catch (err) {
      setIsError(true);
      setMessage(
        "Error: " + (err.response?.data?.detail || "Could not approve."),
      );
    }
  };

  const handleDeny = async (id) => {
    setMessage("");
    setIsError(false);
    try {
      await denyReservation(id);
      setMessage("Reservation denied.");
      setIsError(false);
      refresh();
    } catch (err) {
      setIsError(true);
      setMessage("Error: " + (err.response?.data?.detail || "Could not deny."));
    }
  };

  const statusClass = (status) => {
    if (status === "Pending") return "status-badge status-pending";
    if (status === "Approved") return "status-badge status-approved";
    if (status === "Denied") return "status-badge status-denied";
    return "status-badge status-pending";
  };

  if (loading) {
    return (
      <div className="page-content">
        <p className="loading-text">Loading reservations...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h2 className="page-heading">Reservations</h2>

      {message && (
        <div className={isError ? "message-error" : "message-success"}>
          {message}
        </div>
      )}

      <table className="data-table">
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
              <td>{formatTime(r.StartTime)}</td>
              <td>{formatTime(r.EndTime)}</td>
              <td>
                <span className={statusClass(r.Status)}>{r.Status}</span>
              </td>
              <td>
                {r.Status === "Pending" && (
                  <div className="btn-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleApprove(r.ReservationID)}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDeny(r.ReservationID)}
                    >
                      Deny
                    </button>
                  </div>
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
