import React, { useState } from "react";
import "./App.css";
import EquipmentList from "./EquipmentList";
import ReservationForm from "./ReservationForm";
import ReservationsPage from "./ReservationsPage";
import LoginPage from "./LoginPage";
import { setAuthToken } from "./api";

function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.access_token) setAuthToken(parsed.access_token);
        return parsed;
      }
    } catch {}
    return null;
  });
  const [page, setPage] = useState("equipment");

  const handleLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setAuthToken(userData.access_token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setAuthToken(null);
    setUser(null);
    setPage("equipment");
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <span className="app-title">
            Research Lab Equipment Booking System
          </span>
          <nav className="app-nav">
            <button
              className={"nav-link" + (page === "equipment" ? " active" : "")}
              onClick={() => setPage("equipment")}
            >
              Equipment
            </button>
            <button
              className={"nav-link" + (page === "reserve" ? " active" : "")}
              onClick={() => setPage("reserve")}
            >
              New Reservation
            </button>
            {user.role_id === 1 && (
              <button
                className={
                  "nav-link" + (page === "reservations" ? " active" : "")
                }
                onClick={() => setPage("reservations")}
              >
                Reservations
              </button>
            )}
            <span className="nav-user">Welcome, {user.first_name}</span>
            <button className="nav-link" onClick={handleLogout}>
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main>
        {page === "equipment" && <EquipmentList />}
        {page === "reserve" && <ReservationForm user={user} />}
        {page === "reservations" && user.role_id === 1 && <ReservationsPage />}
      </main>
    </div>
  );
}

export default App;
