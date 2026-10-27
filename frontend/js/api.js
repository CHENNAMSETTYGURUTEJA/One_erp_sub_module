




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

    try {
      const response = await fetch(url, config);
      const json = await response.json();

      if (!response.ok) {

        let errorMsg = json.message || 'Operation failed';
        if (json.errors && Array.isArray(json.errors)) {
          errorMsg = json.errors.map(e => `${e.field}: ${e.message}`).join(', ');
        }
        const error = new Error(errorMsg);
        error.status = response.status;
        error.details = json;
        throw error;
      }

      return json;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
      throw err;
    }
  }


  login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
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


  getAccounts(companyId) {
    return this.request(`/accounts?company_id=${companyId}`);
  }

  createAccount(data) {
    return this.request('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  getJournalEntries(companyId, status = null) {
    const query = status ? `&status=${status}` : '';
    return this.request(`/journal-entries?company_id=${companyId}${query}`);
  }

  createJournalEntry(data) {
    return this.request('/journal-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  postJournalEntry(journalEntryId) {
    return this.request(`/journal-entries/${journalEntryId}/post`, {
      method: 'POST',
    });
  }

  getAccountGL(accountId, companyId) {
    return this.request(`/gl/account/${accountId}?company_id=${companyId}`);
  }


  getAPInvoices(companyId) {
    return this.request(`/ap/invoices?company_id=${companyId}`);
  }

  createAPInvoice(data) {
    return this.request('/ap/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  recordAPPayment(invoiceId, amount) {
    return this.request(`/ap/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ payment_amount: amount }),
    });
  }

  getARInvoices(companyId) {
    return this.request(`/ar/invoices?company_id=${companyId}`);
  }

  createARInvoice(data) {
    return this.request('/ar/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  recordARPayment(invoiceId, amount) {
    return this.request(`/ar/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify({ receipt_amount: amount }),
    });
  }

  getAssets(companyId) {
    return this.request(`/assets?company_id=${companyId}`);
  }

  createAsset(data) {
    return this.request('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  recordDepreciation(assetId, amount) {
    return this.request(`/assets/${assetId}/depreciate`, {
      method: 'POST',
      body: JSON.stringify({ depreciation_amount: amount }),
    });
  }

  getBudgets(companyId, fiscalYearId = null) {
    const query = fiscalYearId ? `&fiscal_year_id=${fiscalYearId}` : '';
    return this.request(`/budgets?company_id=${companyId}${query}`);
  }

  setBudget(data) {
    return this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getGSTRecords(companyId) {
    return this.request(`/gst?company_id=${companyId}`);
  }

  recordGST(data) {
    return this.request('/gst', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  getTrialBalance(companyId) {
    return this.request(`/reports/trial-balance?company_id=${companyId}`);
  }

  getProfitAndLoss(companyId) {
    return this.request(`/reports/profit-loss?company_id=${companyId}`);
  }

  getBalanceSheet(companyId) {
    return this.request(`/reports/balance-sheet?company_id=${companyId}`);
  }

  getDashboardStats(companyId) {
    return this.request(`/dashboard/stats?company_id=${companyId}`);
  }
}

window.api = new ApiClient();

