import React, { useEffect, useState } from "react";
import {
  getEquipment,
  getCategories,
  createCategory,
  createEquipment,
  addEquipmentQty,
} from "./api";

const EMPTY_NEW_FORM = {
  EquipmentName: "",
  CategoryID: "",
  newCategoryName: "",
  Description: "",
  Qty: "",
};

const EMPTY_STOCK_FORM = {
  EquipmentID: "",
  Amount: "",
};

function EquipmentList({ user }) {
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState("new"); // "new" | "stock"

  const [newForm, setNewForm] = useState(EMPTY_NEW_FORM);
  const [stockForm, setStockForm] = useState(EMPTY_STOCK_FORM);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    Promise.all([getEquipment(), getCategories()]).then(
      ([equipData, catData]) => {
        setEquipment(equipData);
        setCategories(catData);
        setLoading(false);
      },
    );
  }, []);

  const openModal = () => {
    setTab("new");
    setNewForm(EMPTY_NEW_FORM);
    setStockForm(EMPTY_STOCK_FORM);
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError(null);
    setSuccess(null);
  };

  const switchTab = (t) => {
    setTab(t);
    setError(null);
    setSuccess(null);
  };

  // add new submit
  const handleNewSubmit = async (e) => {
    e.preventDefault();
    if (!newForm.EquipmentName.trim()) {
      setError("Equipment Name is required.");
      return;
    }
    if (!newForm.Qty) {
      setError("Quantity is required.");
      return;
    }
    if (newForm.CategoryID === "__new__" && !newForm.newCategoryName.trim()) {
      setError("New Category Name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    let resolvedCategoryID;

    if (newForm.CategoryID === "__new__") {
      try {
        const newCat = await createCategory({
          CategoryName: newForm.newCategoryName.trim(),
        });
        resolvedCategoryID = newCat.CategoryID;
        const updatedCats = await getCategories();
        setCategories(updatedCats);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to create category.");
        setSubmitting(false);
        return;
      }
    } else {
      resolvedCategoryID =
        newForm.CategoryID === "" ? null : parseInt(newForm.CategoryID);
    }

    try {
      const created = await createEquipment({
        EquipmentName: newForm.EquipmentName.trim(),
        CategoryID: resolvedCategoryID,
        Description: newForm.Description.trim() || null,
        Qty: parseInt(newForm.Qty),
      });
      setEquipment((prev) =>
        [...prev, created].sort((a, b) =>
          a.EquipmentName.localeCompare(b.EquipmentName),
        ),
      );
      setSuccess("Equipment added successfully.");
      setNewForm(EMPTY_NEW_FORM);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add equipment.");
    }

    setSubmitting(false);
  };

  // add stock submit
  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!stockForm.EquipmentID) {
      setError("Please select a piece of equipment.");
      return;
    }
    if (!stockForm.Amount || parseInt(stockForm.Amount) < 1) {
      setError("Amount must be at least 1.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await addEquipmentQty(
        parseInt(stockForm.EquipmentID),
        parseInt(stockForm.Amount),
      );
      setEquipment((prev) =>
        prev.map((eq) =>
          eq.EquipmentID === updated.EquipmentID ? updated : eq,
        ),
      );
      setSuccess("Stock updated successfully.");
      setStockForm(EMPTY_STOCK_FORM);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update stock.");
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="page-content">
        <p className="loading-text">Loading equipment...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-heading-row">
        <h2 className="page-heading">Equipment</h2>
        {user.role_id === 1 && (
          <button className="btn btn-primary btn-sm" onClick={openModal}>
            Add Equipment
          </button>
        )}
      </div>

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
          {equipment.map((eq) => (
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

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <h3 className="modal-title">Add Equipment</h3>
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="modal-tabs">
              <button
                className={
                  "modal-tab" + (tab === "new" ? " modal-tab-active" : "")
                }
                onClick={() => switchTab("new")}
                type="button"
              >
                New Equipment
              </button>
              <button
                className={
                  "modal-tab" + (tab === "stock" ? " modal-tab-active" : "")
                }
                onClick={() => switchTab("stock")}
                type="button"
              >
                Add Stock
              </button>
            </div>

            {/* Feedback */}
            {error && <div className="message-error">{error}</div>}
            {success && <div className="message-success">{success}</div>}

            {/* ── Tab: New Equipment ── */}
            {tab === "new" && (
              <form onSubmit={handleNewSubmit}>
                <div className="form-group">
                  <label>Equipment Name</label>
                  <input
                    type="text"
                    value={newForm.EquipmentName}
                    onChange={(e) =>
                      setNewForm((p) => ({
                        ...p,
                        EquipmentName: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newForm.CategoryID}
                    onChange={(e) =>
                      setNewForm((p) => ({ ...p, CategoryID: e.target.value }))
                    }
                  >
                    <option value="">— Select category —</option>
                    {categories.map((cat) => (
                      <option key={cat.CategoryID} value={cat.CategoryID}>
                        {cat.CategoryName}
                      </option>
                    ))}
                    {user.role_id === 1 && (
                      <option value="__new__">+ Add new category…</option>
                    )}
                  </select>
                </div>

                {newForm.CategoryID === "__new__" && user.role_id === 1 && (
                  <div className="form-group">
                    <label>New Category Name</label>
                    <input
                      type="text"
                      value={newForm.newCategoryName}
                      onChange={(e) =>
                        setNewForm((p) => ({
                          ...p,
                          newCategoryName: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    value={newForm.Description}
                    onChange={(e) =>
                      setNewForm((p) => ({ ...p, Description: e.target.value }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newForm.Qty}
                    onChange={(e) =>
                      setNewForm((p) => ({ ...p, Qty: e.target.value }))
                    }
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting…" : "Add Equipment"}
                  </button>
                </div>
              </form>
            )}

            {/* ── Tab: Add Stock ── */}
            {tab === "stock" && (
              <form onSubmit={handleStockSubmit}>
                <div className="form-group">
                  <label>Equipment</label>
                  <select
                    value={stockForm.EquipmentID}
                    onChange={(e) =>
                      setStockForm((p) => ({
                        ...p,
                        EquipmentID: e.target.value,
                      }))
                    }
                  >
                    <option value="">— Select equipment —</option>
                    {equipment.map((eq) => (
                      <option key={eq.EquipmentID} value={eq.EquipmentID}>
                        {eq.EquipmentName}{" "}
                        <span>
                          (current stock: {eq.CurrQty} / {eq.TotalQty})
                        </span>
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Units to Add</label>
                  <input
                    type="number"
                    min="1"
                    value={stockForm.Amount}
                    onChange={(e) =>
                      setStockForm((p) => ({ ...p, Amount: e.target.value }))
                    }
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting…" : "Add Stock"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipmentList;
