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

  if (loading) return <div>Loading equipment...</div>;

  return (
    <div>
      <h2>Equipment List</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Description</th>
            <th>Total Qty</th>
            <th>Current Qty</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map(eq => (
            <tr key={eq.EquipmentID}>
              <td>{eq.EquipmentName}</td>
              <td>{eq.Category}</td>
              <td>{eq.Description}</td>
              <td>{eq.TotalQty}</td>
              <td>{eq.CurrQty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EquipmentList;
