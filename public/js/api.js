const API = {
  getToken() {
    return localStorage.getItem('admin_token') || '';
  },

  getHeaders(isAuth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (isAuth) headers.Authorization = `Bearer ${this.getToken()}`;
    return headers;
  },

  async request(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error en la solicitud');
    return data;
  },

  async login(payload) {
    return this.request('/api/auth/login', {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify(payload)
    });
  },
  async getVisibleRecords() { return this.request('/api/records'); },
  async getAllRecords() { return this.request('/api/records/all', { headers: this.getHeaders(true) }); },
  async createRecord(payload) {
    return this.request('/api/records', {
      method: 'POST', headers: this.getHeaders(true), body: JSON.stringify(payload)
    });
  },
  async updateRecord(id, payload) {
    return this.request(`/api/records/${id}`, {
      method: 'PUT', headers: this.getHeaders(true), body: JSON.stringify(payload)
    });
  },
  async deleteRecord(id) {
    return this.request(`/api/records/${id}`, { method: 'DELETE', headers: this.getHeaders(true) });
  },
  async getSummary() { return this.request('/api/dashboard/summary'); },
  async getHistory() { return this.request('/api/history', { headers: this.getHeaders(true) }); },
  async getNotifications() { return this.request('/api/notifications', { headers: this.getHeaders(true) }); },
  async getCompanies() { return this.request('/api/dashboard/companies'); }
};
