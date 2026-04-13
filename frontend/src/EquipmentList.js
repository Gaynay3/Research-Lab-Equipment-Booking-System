import React, { useEffect, useState } from 'react';
import { getEquipment } from './api';

function EquipmentList() {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEquipment().then(data => {
      setEquipment(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="page-content">
        <p className="loading-text">Loading equipment...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h2 className="page-heading">Equipment</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Description</th>
            <th>Total Qty</th>
            <th>Available</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map(eq => (
            <tr key={eq.EquipmentID}>
              <td>{eq.EquipmentName}</td>
              <td>{eq.Category}</td>
              <td>{eq.Description}</td>
              <td>{eq.TotalQty}</td>
              <td>
                {eq.CurrQty === 0 ? (
                  <span className="qty-unavailable">Unavailable</span>
                ) : (
                  eq.CurrQty
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EquipmentList;
