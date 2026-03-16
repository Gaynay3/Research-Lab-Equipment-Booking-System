// API utility for backend requests
import axios from 'axios';

const API_BASE = 'http://localhost:8000'; // Adjust if backend runs elsewhere

export const getEquipment = () => axios.get(`${API_BASE}/equipment`).then(res => res.data);
export const getReservations = () => axios.get(`${API_BASE}/reservations`).then(res => res.data);
export const createReservation = (data) => axios.post(`${API_BASE}/reservations`, data).then(res => res.data);
export const approveReservation = (id) => axios.put(`${API_BASE}/reservations/${id}/approve`).then(res => res.data);
export const denyReservation = (id) => axios.put(`${API_BASE}/reservations/${id}/deny`).then(res => res.data);
export const getUsers = () => axios.get(`${API_BASE}/users`).then(res => res.data);
