import axios from 'axios';

const API = axios.create({ baseURL: "http://localhost:8000" });

export const shieldAPI = {
  addTarget: (email) => API.get(`/add-to-watchlist/${email}`),
  // You can add more like: getAlerts: () => API.get('/alerts')
};