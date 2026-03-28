import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Items endpoints
export const itemsAPI = {
  list: () => api.get('/items/'),
  get: (id) => api.get(`/items/${id}/`),
  create: (data) => api.post('/items/', data),
  update: (id, data) => api.put(`/items/${id}/`, data),
  delete: (id) => api.delete(`/items/${id}/`),
  lowStock: () => api.get('/items/low_stock/'),
  byStatus: (status) => api.get('/items/by_status/', { params: { status } }),
  byLocation: (locationId) => api.get('/items/by_location/', { params: { location_id: locationId } }),
  dashboardStats: () => api.get('/items/dashboard_stats/'),
  addActivity: (id, data) => api.post(`/items/${id}/add_activity/`, data),
};

// Locations endpoints
export const locationsAPI = {
  list: () => api.get('/locations/'),
  get: (id) => api.get(`/locations/${id}/`),
  create: (data) => api.post('/locations/', data),
  update: (id, data) => api.put(`/locations/${id}/`, data),
  delete: (id) => api.delete(`/locations/${id}/`),
};

// Activity logs endpoints
export const activitiesAPI = {
  list: () => api.get('/activities/'),
  get: (id) => api.get(`/activities/${id}/`),
  byItem: (itemId) => api.get('/activities/by_item/', { params: { item_id: itemId } }),
};

// Device units endpoints
export const deviceUnitsAPI = {
  list: (params) => api.get('/device-units/', { params }),
  get: (id) => api.get(`/device-units/${id}/`),
  create: (data) => api.post('/device-units/', data),
  update: (id, data) => api.put(`/device-units/${id}/`, data),
  delete: (id) => api.delete(`/device-units/${id}/`),
};

// Tickets endpoints
export const ticketsAPI = {
  list: (params) => api.get('/tickets/', { params }),
  get: (id) => api.get(`/tickets/${id}/`),
  create: (data) => api.post('/tickets/', data),
  update: (id, data) => api.put(`/tickets/${id}/`, data),
  delete: (id) => api.delete(`/tickets/${id}/`),
  byItem: (itemId) => api.get('/tickets/by_item/', { params: { item_id: itemId } }),
  byDeviceUnit: (deviceUnitId) => api.get('/tickets/', { params: { device_unit: deviceUnitId } }),
};

export default api;
