const API_BASE = '/api/v1';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('oneerp_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('oneerp_token', token);
    } else {
      localStorage.removeItem('oneerp_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    const response = await fetch(url, config);
    const json = await response.json();

    if (!response.ok) {
      let errorMsg = json.message || 'Operation failed';
      if (json.errors && Array.isArray(json.errors)) {
        errorMsg = json.errors.map(e => `${e.field}: ${e.message}`).join(', ');
      }
      const err = new Error(errorMsg);
      err.status = response.status;
      err.details = json;
      throw err;
    }

    return json;
  }


  login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  getProfile() {
    return this.request('/auth/me');
  }

  updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  logout() {
    this.setToken(null);
  }


  getCompanies() {
    return this.request('/companies');
  }

  createCompany(data) {
    return this.request('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  getFiscalYears(companyId) {
    return this.request(`/fiscal-years?company_id=${companyId}`);
  }

  createFiscalYear(data) {
    return this.request('/fiscal-years', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updatePeriodStatus(periodId, status) {
    return this.request(`/fiscal-years/periods/${periodId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  getFiscalPeriodHistory(periodId) {
    return this.request(`/fiscal-years/periods/${periodId}/history`);
  }


  getARInvoices(companyId) {
    return this.request(`/ar/invoices?company_id=${companyId}`);
  }

  getARReceipts(companyId) {
    return this.request(`/ar/receipts?company_id=${companyId}`);
  }

  getARAgeing(companyId, asOf) {
    return this.request(`/ar/ageing?company_id=${companyId}&as_of=${asOf}`);
  }

  createARInvoice(data) {
    return this.request('/ar/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  recordARPayment(invoiceId, amount, receiptReference, receiptDate) {
    return this.request(`/ar/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ receipt_amount: amount, receipt_reference: receiptReference, receipt_date: receiptDate }),
    });
  }

}

export const api = new ApiClient();

