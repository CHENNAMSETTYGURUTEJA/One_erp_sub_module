



const state = {
  activeTab: 'dashboard',
  currentCompanyId: null,
  companies: [],
  accounts: [],
  fiscalYears: [],
  activePeriod: null,
  dashboardStats: null,
};

const localDateISO = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const currentFiscalStartYear = () => {
  const now = new Date();
  return now.getFullYear() - (now.getMonth() < 3 ? 1 : 0);
};
const currentFiscalYearStart = () => `${currentFiscalStartYear()}-04-01`;
const currentFiscalYearEnd = () => `${currentFiscalStartYear() + 1}-03-31`;
const defaultDueDate = () => {
  const due = new Date();
  due.setDate(due.getDate() + 30);
  return localDateISO(due);
};


function showToast(type, message, title = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-50 border-emerald-500 text-emerald-800',
    error: 'bg-rose-50 border-rose-500 text-rose-800',
    warning: 'bg-amber-50 border-amber-500 text-amber-800',
    info: 'bg-sky-50 border-sky-500 text-sky-800',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  toast.className = `toast flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg bg-white max-w-md ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <span class="font-bold text-lg leading-none">${icons[type] || '•'}</span>
    <div class="flex-1">
      ${title ? `<p class="font-semibold text-sm">${title}</p>` : ''}
      <p class="text-xs leading-relaxed">${message}</p>
    </div>
    <button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-gray-600 font-bold text-xs ml-2">✕</button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 4500);
}


function formatCurrency(amount, currency = 'INR') {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
  }).format(val);
}


document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  await loadInitialData();
});

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-link');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = item.dataset.tab;
      switchTab(targetTab);
    });
  });


  const compSelect = document.getElementById('company-selector');
  if (compSelect) {
    compSelect.addEventListener('change', async (e) => {
      state.currentCompanyId = Number(e.target.value);
      localStorage.setItem('selected_company_id', state.currentCompanyId);
      await refreshCurrentView();
    });
  }
}

async function loadInitialData() {
  try {

    const res = await api.getCompanies();
    state.companies = res.data || [];

    const compSelect = document.getElementById('company-selector');
    if (compSelect) {
      compSelect.innerHTML = '';
      state.companies.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.company_id;
        opt.textContent = `${c.company_code} - ${c.company_name}`;
        compSelect.appendChild(opt);
      });


      const storedId = Number(localStorage.getItem('selected_company_id'));
      const found = state.companies.find(c => c.company_id === storedId);
      if (found) {
        state.currentCompanyId = storedId;
        compSelect.value = storedId;
      } else if (state.companies.length > 0) {
        state.currentCompanyId = state.companies[0].company_id;
        compSelect.value = state.currentCompanyId;
      }
    }

    await refreshCurrentView();
  } catch (err) {
    showToast('error', err.message, 'Initialization Error');
  }
}

function switchTab(tabName) {
  state.activeTab = tabName;


  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.tab === tabName) {
      link.classList.add('bg-sky-700', 'text-white', 'shadow-sm');
      link.classList.remove('text-slate-300', 'hover:bg-slate-800');
    } else {
      link.classList.remove('bg-sky-700', 'text-white', 'shadow-sm');
      link.classList.add('text-slate-300', 'hover:bg-slate-800');
    }
  });

  refreshCurrentView();
}

async function refreshCurrentView() {
  if (!state.currentCompanyId) {
    renderCompanySetup();
    return;
  }


  try {
    const [accRes, fyRes] = await Promise.all([
      api.getAccounts(state.currentCompanyId),
      api.getFiscalYears(state.currentCompanyId),
    ]);
    state.accounts = accRes.data || [];
    state.fiscalYears = fyRes.data || [];


    if (state.fiscalYears.length > 0) {
      const allPeriods = state.fiscalYears.flatMap(fy => fy.periods || []);
      state.activePeriod = allPeriods.find(p => p.status === 'OPEN') || allPeriods[0] || null;
    }

    updateHeaderBadges();
  } catch (e) {
    console.warn('Context refresh note:', e);
  }


  switch (state.activeTab) {
    case 'dashboard':
      await renderDashboard();
      break;
    case 'company-setup':
      await renderCompanySetup();
      break;
    case 'fiscal-years':
      await renderFiscalYears();
      break;
    case 'accounts':
      await renderChartOfAccounts();
      break;
    case 'journal-entries':
      await renderJournalEntries();
      break;
    case 'general-ledger':
      await renderGeneralLedger();
      break;
    case 'trial-balance':
      await renderTrialBalance();
      break;
    case 'ap':
      await renderAccountsPayable();
      break;
    case 'ar':
      await renderAccountsReceivable();
      break;
    case 'assets':
      await renderFixedAssets();
      break;
    case 'budget':
      await renderBudgeting();
      break;
    case 'gst':
      await renderGST();
      break;
    case 'reports':
      await renderFinancialReports();
      break;
    default:
      await renderDashboard();
  }
}

function updateHeaderBadges() {
  const periodBadge = document.getElementById('period-status-badge');
  if (periodBadge) {
    if (state.activePeriod) {
      const isOpen = state.activePeriod.status === 'OPEN';
      periodBadge.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isOpen ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}">
          <span class="w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-500 live-dot' : 'bg-rose-500'}"></span>
          ${state.activePeriod.period_name} • ${state.activePeriod.status}
        </span>
      `;
    } else {
      periodBadge.innerHTML = `
        <span class="px-2.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600">No Open Period</span>
      `;
    }
  }
}


async function renderDashboard() {
  const container = document.getElementById('view-container');
  container.innerHTML = `<div class="p-8 text-center text-slate-500"><div class="animate-spin inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mb-3"></div><p>Loading Dashboard Analytics...</p></div>`;

  try {
    const res = await api.getDashboardStats(state.currentCompanyId);
    const stats = res.data;
    state.dashboardStats = stats;

    const currCompany = state.companies.find(c => c.company_id === state.currentCompanyId) || {};
    const currency = currCompany.currency || 'INR';

    container.innerHTML = `
      <div class="space-y-6">

        <div class="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 text-sky-300 rounded-full text-xs font-semibold mb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span> STACKLY OneERP Platform
            </div>
            <h1 class="text-2xl font-extrabold tracking-tight">${currCompany.company_name || 'Organization Dashboard'}</h1>
            <p class="text-xs text-slate-300 mt-1">Company Code: <span class="font-mono text-sky-400 font-bold">${currCompany.company_code}</span> | Currency: ${currency} | Fiscal Year: ${currCompany.financial_year_start || 'April'}</p>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="switchTab('journal-entries')" class="bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition shadow-md flex items-center gap-1.5">
              <span>✍️</span> New Journal Entry
            </button>
            <button onclick="switchTab('trial-balance')" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs px-4 py-2.5 rounded-lg transition">
              <span>⚖️</span> View Trial Balance
            </button>
          </div>
        </div>


        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between text-slate-500 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Cash & Bank Liquidity</span>
              <span class="text-emerald-500 text-lg">💰</span>
            </div>
            <div class="text-2xl font-bold text-slate-900 num-align">${formatCurrency(stats.total_cash, currency)}</div>
            <p class="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <span class="text-emerald-600 font-semibold">● Active Accounts</span> (1001 / 1002)
            </p>
          </div>


          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between text-slate-500 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
              <span class="text-sky-500 text-lg">📈</span>
            </div>
            <div class="text-2xl font-bold text-slate-900 num-align">${formatCurrency(stats.total_revenue, currency)}</div>
            <p class="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <span>Sales & Consulting Revenue</span>
            </p>
          </div>


          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between text-slate-500 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Accounts Payable (AP)</span>
              <span class="text-rose-500 text-lg">📥</span>
            </div>
            <div class="text-2xl font-bold text-slate-900 num-align">${formatCurrency(stats.ap_outstanding, currency)}</div>
            <p class="text-xs text-rose-600 mt-2 font-medium">Owed to Suppliers</p>
          </div>


          <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between text-slate-500 mb-2">
              <span class="text-xs font-semibold uppercase tracking-wider">Accounts Receivable (AR)</span>
              <span class="text-indigo-500 text-lg">📤</span>
            </div>
            <div class="text-2xl font-bold text-slate-900 num-align">${formatCurrency(stats.ar_outstanding, currency)}</div>
            <p class="text-xs text-indigo-600 mt-2 font-medium">Due from Customers</p>
          </div>
        </div>


        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Financial Summary</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center text-sm py-1.5 border-b border-slate-100">
                  <span class="text-slate-600">Total Operating Expenses</span>
                  <span class="font-semibold text-rose-600 num-align">${formatCurrency(stats.total_expense, currency)}</span>
                </div>
                <div class="flex justify-between items-center text-sm py-1.5 border-b border-slate-100">
                  <span class="text-slate-600">Total Journal Postings</span>
                  <span class="font-bold text-slate-800 num-align">${stats.total_journal_entries} entries</span>
                </div>
                <div class="flex justify-between items-center text-base py-3 font-bold border-t border-slate-200">
                  <span class="text-slate-800">Net Period Position</span>
                  <span class="num-align ${stats.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
                    ${formatCurrency(stats.net_profit, currency)}
                  </span>
                </div>
              </div>
            </div>
            <div class="mt-6 pt-4 border-t border-slate-100 flex gap-2">
              <button onclick="switchTab('reports')" class="w-full text-center py-2 px-3 bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-xs rounded-lg transition">
                Open Full Financial Statements →
              </button>
            </div>
          </div>


          <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">End-to-End FICO Process Pipeline</h3>
            <p class="text-xs text-slate-500 mb-6">Real-time status of the business story workflow configured in your system.</p>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div class="p-3 rounded-lg bg-sky-50 border border-sky-100">
                <div class="text-xl mb-1">🏢</div>
                <div class="text-xs font-bold text-sky-900">1. Company</div>
                <div class="text-[10px] text-sky-600 mt-1 font-mono">${currCompany.company_code} (Active)</div>
              </div>
              <div class="p-3 rounded-lg bg-sky-50 border border-sky-100">
                <div class="text-xl mb-1">📅</div>
                <div class="text-xs font-bold text-sky-900">2. Fiscal Periods</div>
                <div class="text-[10px] text-sky-600 mt-1">${state.activePeriod ? state.activePeriod.period_name : 'Configured'}</div>
              </div>
              <div class="p-3 rounded-lg bg-sky-50 border border-sky-100">
                <div class="text-xl mb-1">📑</div>
                <div class="text-xs font-bold text-sky-900">3. Accounts</div>
                <div class="text-[10px] text-sky-600 mt-1">${state.accounts.length} Gl Accounts</div>
              </div>
              <div class="p-3 rounded-lg bg-sky-50 border border-sky-100">
                <div class="text-xl mb-1">⚖️</div>
                <div class="text-xs font-bold text-sky-900">4. Trial Balance</div>
                <div class="text-[10px] text-emerald-600 font-bold mt-1">Balanced ✓</div>
              </div>
            </div>


            <div class="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
              <span class="text-slate-400 font-medium py-1">Quick Navigate:</span>
              <button onclick="switchTab('ap')" class="px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">📥 Accounts Payable</button>
              <button onclick="switchTab('ar')" class="px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">📤 Accounts Receivable</button>
              <button onclick="switchTab('assets')" class="px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">🏭 Fixed Assets</button>
              <button onclick="switchTab('budget')" class="px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">📊 Budgets</button>
              <button onclick="switchTab('gst')" class="px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">🧾 GST Tax</button>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-rose-600">Failed to load dashboard: ${err.message}</div>`;
  }
}


async function renderCompanySetup() {
  const container = document.getElementById('view-container');
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">Company Setup</h1>
          <p class="text-xs text-slate-500 mt-1">Establish organizational entities, legal details, currency, and financial year start.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 class="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>🏢</span> Register New Company
          </h2>

          <form id="create-company-form" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Company Name *</label>
              <input type="text" id="comp-name" required placeholder="e.g. STACKLY" class="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Company Code * (Unique)</label>
              <input type="text" id="comp-code" required placeholder="e.g. STACKLY01" class="w-full text-sm uppercase font-mono px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition" />
              <p class="text-[11px] text-slate-400 mt-1">Alphanumeric identifier used across ERP accounting.</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Country *</label>
                <input type="text" id="comp-country" required value="India" class="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Currency *</label>
                <input type="text" id="comp-currency" required value="INR" class="w-full text-sm uppercase font-mono px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Financial Year Start *</label>
              <input type="date" id="comp-fy-start" required value="${currentFiscalYearStart()}" class="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Registered Address *</label>
              <textarea id="comp-address" required rows="3" placeholder="Plot 42, Electronic City Phase 1, Bengaluru..." class="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none transition"></textarea>
            </div>

            <button type="submit" id="save-company-btn" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2.5 rounded-lg transition shadow-md flex items-center justify-center gap-2">
              <span>💾</span> Save Company to Database
            </button>
          </form>
        </div>


        <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 class="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>📋 Registered Companies in Database</span>
            <span class="text-xs font-normal text-slate-500">${state.companies.length} records</span>
          </h2>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th class="py-3 px-4">Code</th>
                  <th class="py-3 px-4">Company Name</th>
                  <th class="py-3 px-4">Country</th>
                  <th class="py-3 px-4">Currency</th>
                  <th class="py-3 px-4">FY Start</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${state.companies.map(c => `
                  <tr class="hover:bg-slate-50/80 transition ${c.company_id === state.currentCompanyId ? 'bg-sky-50/50' : ''}">
                    <td class="py-3 px-4 font-mono font-bold text-sky-700">${c.company_code}</td>
                    <td class="py-3 px-4 font-medium text-slate-800">${c.company_name}</td>
                    <td class="py-3 px-4 text-slate-600">${c.country}</td>
                    <td class="py-3 px-4 font-mono text-slate-600">${c.currency}</td>
                    <td class="py-3 px-4 text-slate-500 text-xs">${c.financial_year_start}</td>
                    <td class="py-3 px-4 text-right">
                      <button onclick="selectCompany(${c.company_id})" class="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-sky-100 hover:text-sky-800 font-medium transition">
                        ${c.company_id === state.currentCompanyId ? 'Selected ✓' : 'Select'}
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;


  const form = document.getElementById('create-company-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-company-btn');
    btn.disabled = true;
    btn.textContent = 'Saving to MySQL...';

    const payload = {
      company_name: document.getElementById('comp-name').value.trim(),
      company_code: document.getElementById('comp-code').value.trim().toUpperCase(),
      country: document.getElementById('comp-country').value.trim(),
      currency: document.getElementById('comp-currency').value.trim().toUpperCase(),
      financial_year_start: document.getElementById('comp-fy-start').value,
      company_address: document.getElementById('comp-address').value.trim(),
    };

    try {
      const res = await api.createCompany(payload);
      showToast('success', `Company ${payload.company_code} created and default Chart of Accounts seeded!`, 'Success');
      await loadInitialData();
    } catch (err) {
      showToast('error', err.message, 'Validation / Duplicate Code Error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>💾</span> Save Company to Database';
    }
  });
}

function selectCompany(id) {
  state.currentCompanyId = id;
  localStorage.setItem('selected_company_id', id);
  const compSelect = document.getElementById('company-selector');
  if (compSelect) compSelect.value = id;
  showToast('info', 'Switched active company context.');
  refreshCurrentView();
}


async function renderFiscalYears() {
  const container = document.getElementById('view-container');
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">Fiscal Years & Financial Periods</h1>
          <p class="text-xs text-slate-500 mt-1">Manage reporting years and open/close posting periods.</p>
        </div>
        <button onclick="document.getElementById('modal-create-fy').classList.remove('hidden')" class="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition shadow-sm">
          + Create Fiscal Year
        </button>
      </div>

      ${state.fiscalYears.length === 0 ? `
        <div class="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
          <p class="text-slate-500 text-sm mb-4">No Fiscal Year has been created for this company yet.</p>
          <button onclick="document.getElementById('modal-create-fy').classList.remove('hidden')" class="bg-sky-600 text-white text-xs px-4 py-2 rounded-lg font-semibold">
            Create First Fiscal Year
          </button>
        </div>
      ` : state.fiscalYears.map(fy => `
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <div>
              <span class="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800 uppercase">Active Reporting Year</span>
              <h2 class="text-xl font-bold text-slate-900 mt-1">${fy.year_name}</h2>
              <p class="text-xs text-slate-500">${fy.start_date} to ${fy.end_date}</p>
            </div>
            <span class="text-xs text-slate-400">12 Accounting Periods Generated</span>
          </div>


          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            ${(fy.periods || []).map(p => `
              <div class="p-3.5 rounded-lg border ${p.status === 'OPEN' ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50'} flex justify-between items-center">
                <div>
                  <div class="text-xs font-bold text-slate-800">Period ${p.period_number}: ${p.period_name}</div>
                  <div class="text-[11px] text-slate-500">${p.start_date} to ${p.end_date}</div>
                  <span class="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">
                    ${p.status}
                  </span>
                </div>
                <button onclick="togglePeriod(${p.period_id}, '${p.status === 'OPEN' ? 'CLOSED' : 'OPEN'}')" class="text-xs px-2.5 py-1.5 rounded font-medium transition ${p.status === 'OPEN' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}">
                  ${p.status === 'OPEN' ? 'Close Period' : 'Open Period'}
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}


      <div id="modal-create-fy" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-slate-800 text-base">Define New Fiscal Year</h3>
            <button onclick="document.getElementById('modal-create-fy').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>
          <form id="create-fy-form" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Fiscal Year Label</label>
              <input type="text" id="fy-name" required value="FY ${currentFiscalStartYear()}-${currentFiscalStartYear() + 1}" class="w-full text-sm px-3 py-2 border rounded-lg" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <input type="date" id="fy-start" required value="${currentFiscalYearStart()}" class="w-full text-sm px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                <input type="date" id="fy-end" required value="${currentFiscalYearEnd()}" class="w-full text-sm px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <button type="submit" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2 rounded-lg transition mt-2">
              Generate Fiscal Year & 12 Monthly Periods
            </button>
          </form>
        </div>
      </div>
    </div>
  `;


  const fyForm = document.getElementById('create-fy-form');
  if (fyForm) {
    fyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.createFiscalYear({
          company_id: state.currentCompanyId,
          year_name: document.getElementById('fy-name').value.trim(),
          start_date: document.getElementById('fy-start').value,
          end_date: document.getElementById('fy-end').value,
        });
        showToast('success', 'Fiscal Year and 12 monthly periods generated successfully!');
        document.getElementById('modal-create-fy').classList.add('hidden');
        await refreshCurrentView();
      } catch (err) {
        showToast('error', err.message);
      }
    });
  }
}

async function togglePeriod(periodId, newStatus) {
  try {
    await api.updatePeriodStatus(periodId, newStatus);
    showToast('info', `Period updated to ${newStatus}`);
    await refreshCurrentView();
  } catch (err) {
    showToast('error', err.message);
  }
}


async function renderChartOfAccounts() {
  const container = document.getElementById('view-container');
  const typeColors = {
    Asset: 'bg-emerald-100 text-emerald-800',
    Liability: 'bg-rose-100 text-rose-800',
    Equity: 'bg-purple-100 text-purple-800',
    Revenue: 'bg-sky-100 text-sky-800',
    Expense: 'bg-amber-100 text-amber-800',
  };

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">Chart of Accounts (COA)</h1>
          <p class="text-xs text-slate-500 mt-1">Foundational ledger accounts classifying Assets, Liabilities, Equity, Revenue, and Expenses.</p>
        </div>
        <button onclick="document.getElementById('modal-create-account').classList.remove('hidden')" class="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition shadow-sm">
          + Add Account
        </button>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span class="text-xs font-bold text-slate-700 uppercase">General Ledger Master</span>
          <span class="text-xs text-slate-500">${state.accounts.length} active ledger accounts</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-100/70 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th class="py-3 px-4">Code</th>
                <th class="py-3 px-4">Account Name</th>
                <th class="py-3 px-4">Category / Type</th>
                <th class="py-3 px-4 text-right">Opening Balance</th>
                <th class="py-3 px-4 text-right">Current Ledger Balance</th>
                <th class="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${state.accounts.map(a => `
                <tr class="hover:bg-slate-50 transition">
                  <td class="py-3 px-4 font-mono font-bold text-sky-700">${a.account_code}</td>
                  <td class="py-3 px-4 font-medium text-slate-800">${a.account_name}</td>
                  <td class="py-3 px-4">
                    <span class="text-xs px-2.5 py-0.5 rounded-full font-semibold ${typeColors[a.account_type] || 'bg-slate-100 text-slate-700'}">
                      ${a.account_type}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right num-align text-slate-500">${formatCurrency(a.opening_balance)}</td>
                  <td class="py-3 px-4 text-right num-align font-bold text-slate-900">${formatCurrency(a.current_balance)}</td>
                  <td class="py-3 px-4 text-center">
                    <span class="inline-block w-2 h-2 rounded-full ${a.is_active ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>


      <div id="modal-create-account" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-bold text-slate-800 text-base">Add New Account</h3>
            <button onclick="document.getElementById('modal-create-account').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>
          <form id="create-account-form" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Account Code *</label>
              <input type="text" id="acc-code" required placeholder="e.g. 5005" class="w-full text-sm font-mono px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Account Name *</label>
              <input type="text" id="acc-name" required placeholder="e.g. Travel & Conveyance" class="w-full text-sm px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Account Type *</label>
              <select id="acc-type" required class="w-full text-sm px-3 py-2 border rounded-lg bg-white">
                <option value="Asset">Asset (Debit balance)</option>
                <option value="Liability">Liability (Credit balance)</option>
                <option value="Equity">Equity (Credit balance)</option>
                <option value="Revenue">Revenue (Credit balance)</option>
                <option value="Expense">Expense (Debit balance)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Opening Balance</label>
              <input type="number" step="0.01" id="acc-op-bal" value="0.00" class="w-full text-sm px-3 py-2 border rounded-lg" />
            </div>
            <button type="submit" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2 rounded-lg transition mt-2">
              Save Account to COA
            </button>
          </form>
        </div>
      </div>
    </div>
  `;


  const accForm = document.getElementById('create-account-form');
  if (accForm) {
    accForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.createAccount({
          company_id: state.currentCompanyId,
          account_code: document.getElementById('acc-code').value.trim(),
          account_name: document.getElementById('acc-name').value.trim(),
          account_type: document.getElementById('acc-type').value,
          opening_balance: parseFloat(document.getElementById('acc-op-bal').value) || 0,
        });
        showToast('success', 'Account added to Chart of Accounts!');
        document.getElementById('modal-create-account').classList.add('hidden');
        await refreshCurrentView();
      } catch (err) {
        showToast('error', err.message);
      }
    });
  }
}


async function renderJournalEntries() {
  const container = document.getElementById('view-container');
  container.innerHTML = `<div class="p-8 text-center text-slate-500">Loading Journal Entries...</div>`;

  try {
    const res = await api.getJournalEntries(state.currentCompanyId);
    const entries = res.data || [];

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900">Journal Entries & GL Posting</h1>
            <p class="text-xs text-slate-500 mt-1">Record double-entry financial vouchers. Total Debit must equal Total Credit before posting.</p>
          </div>
          <button onclick="document.getElementById('modal-create-jv').classList.remove('hidden')" class="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition shadow-sm">
            + New Journal Entry
          </button>
        </div>


        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span class="text-xs font-bold text-slate-700 uppercase">Journal Vouchers Register</span>
            <span class="text-xs text-slate-500">${entries.length} recorded entries</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-100/70 text-slate-600 text-xs uppercase tracking-wider">
                <tr>
                  <th class="py-3 px-4">Voucher No</th>
                  <th class="py-3 px-4">Date</th>
                  <th class="py-3 px-4">Description / Reference</th>
                  <th class="py-3 px-4 text-right">Debit</th>
                  <th class="py-3 px-4 text-right">Credit</th>
                  <th class="py-3 px-4 text-center">Status</th>
                  <th class="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${entries.map(e => `
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-3 px-4 font-mono font-bold text-sky-700">${e.entry_number}</td>
                    <td class="py-3 px-4 text-slate-600 text-xs">${e.entry_date}</td>
                    <td class="py-3 px-4">
                      <div class="font-medium text-slate-800">${e.description}</div>
                      ${e.reference ? `<div class="text-[11px] text-slate-400">Ref: ${e.reference}</div>` : ''}
                    </td>
                    <td class="py-3 px-4 text-right num-align font-semibold text-slate-800">${formatCurrency(e.total_debit)}</td>
                    <td class="py-3 px-4 text-right num-align font-semibold text-slate-800">${formatCurrency(e.total_credit)}</td>
                    <td class="py-3 px-4 text-center">
                      <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${e.status === 'POSTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                        ${e.status}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right">
                      ${e.status === 'DRAFT' ? `
                        <button onclick="postJournalEntry(${e.journal_entry_id})" class="text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded shadow-sm transition">
                          Post to GL
                        </button>
                      ` : `
                        <span class="text-xs text-slate-400 italic">Posted ✓</span>
                      `}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>


        <div id="modal-create-jv" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <h3 class="font-bold text-slate-900 text-base">Create Journal Voucher (Double-Entry)</h3>
                <p class="text-xs text-slate-500">Total debits must strictly equal total credits.</p>
              </div>
              <button onclick="document.getElementById('modal-create-jv').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form id="create-jv-form" class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Financial Period *</label>
                  <select id="jv-period" required class="w-full text-sm px-3 py-2 border rounded-lg bg-white">
                    ${(state.fiscalYears.flatMap(fy => fy.periods || [])).map(p => `
                      <option value="${p.period_id}" ${p.status === 'CLOSED' ? 'disabled' : ''}>
                        ${p.period_name} ${p.status === 'CLOSED' ? '(CLOSED)' : ''}
                      </option>
                    `).join('')}
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Entry Date *</label>
                  <input type="date" id="jv-date" required value="${localDateISO()}" class="w-full text-sm px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Description / Narration *</label>
                <input type="text" id="jv-desc" required placeholder="e.g. Paid Office Rent for April" class="w-full text-sm px-3 py-2 border rounded-lg" />
              </div>


              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs font-bold text-slate-700 uppercase">Debit & Credit Lines</span>
                  <button type="button" onclick="addJournalLineRow()" class="text-xs text-sky-600 font-semibold hover:underline">+ Add Line</button>
                </div>
                <div id="jv-lines-container" class="space-y-2">

                  <div class="grid grid-cols-12 gap-2 items-center jv-line-row">
                    <div class="col-span-6">
                      <select class="jv-line-acc w-full text-xs px-2 py-1.5 border rounded bg-white">
                        ${state.accounts.map(a => `<option value="${a.account_id}">[${a.account_code}] ${a.account_name}</option>`).join('')}
                      </select>
                    </div>
                    <div class="col-span-3">
                      <input type="number" step="0.01" class="jv-line-debit w-full text-xs px-2 py-1.5 border rounded text-right" placeholder="Debit" oninput="calculateJVBalance()" />
                    </div>
                    <div class="col-span-3">
                      <input type="number" step="0.01" class="jv-line-credit w-full text-xs px-2 py-1.5 border rounded text-right" placeholder="Credit" oninput="calculateJVBalance()" />
                    </div>
                  </div>

                  <div class="grid grid-cols-12 gap-2 items-center jv-line-row">
                    <div class="col-span-6">
                      <select class="jv-line-acc w-full text-xs px-2 py-1.5 border rounded bg-white">
                        ${state.accounts.map(a => `<option value="${a.account_id}">[${a.account_code}] ${a.account_name}</option>`).join('')}
                      </select>
                    </div>
                    <div class="col-span-3">
                      <input type="number" step="0.01" class="jv-line-debit w-full text-xs px-2 py-1.5 border rounded text-right" placeholder="Debit" oninput="calculateJVBalance()" />
                    </div>
                    <div class="col-span-3">
                      <input type="number" step="0.01" class="jv-line-credit w-full text-xs px-2 py-1.5 border rounded text-right" placeholder="Credit" oninput="calculateJVBalance()" />
                    </div>
                  </div>
                </div>
              </div>


              <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                <div>
                  Total Debit: <span id="jv-total-debit" class="font-bold text-slate-800">₹0.00</span> |
                  Total Credit: <span id="jv-total-credit" class="font-bold text-slate-800">₹0.00</span>
                </div>
                <div id="jv-balance-status" class="font-bold text-rose-600">
                  Difference: ₹0.00 (Unbalanced)
                </div>
              </div>

              <button type="submit" id="jv-submit-btn" disabled class="w-full bg-slate-300 text-slate-500 font-semibold text-sm py-2.5 rounded-lg transition">
                Debits and Credits must balance to Save
              </button>
            </form>
          </div>
        </div>
      </div>
    `;


    setupJVFormListener();
  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-rose-600">Failed to load journal entries: ${err.message}</div>`;
  }
}

function addJournalLineRow() {
  const container = document.getElementById('jv-lines-container');
  const div = document.createElement('div');
  div.className = 'grid grid-cols-12 gap-2 items-center jv-line-row';
  div.innerHTML = `
    <div class="col-span-6">
      <select class="jv-line-acc w-full text-xs px-2 py-1.5 border rounded bg-white">
        ${state.accounts.map(a => `<option value="${a.account_id}">[${a.account_code}] ${a.account_name}</option>`).join('')}
      </select>
    </div>
    <div class="col-span-3">
      <input type="number" step="0.01" class="jv-line-debit w-full text-xs px-2 py-1.5 border rounded text-right" placeholder="Debit" oninput="calculateJVBalance()" />
    </div>
    <div class="col-span-3 flex items-center gap-1">
      <input type="number" step="0.01" class="jv-line-credit w-full text-xs px-2 py-1.5 border rounded text-right" placeholder="Credit" oninput="calculateJVBalance()" />
      <button type="button" onclick="this.parentElement.parentElement.remove(); calculateJVBalance();" class="text-rose-500 font-bold px-1 hover:text-rose-700">✕</button>
    </div>
  `;
  container.appendChild(div);
}

function calculateJVBalance() {
  const debitInputs = document.querySelectorAll('.jv-line-debit');
  const creditInputs = document.querySelectorAll('.jv-line-credit');

  let totalDebit = 0;
  let totalCredit = 0;

  debitInputs.forEach(i => totalDebit += (parseFloat(i.value) || 0));
  creditInputs.forEach(i => totalCredit += (parseFloat(i.value) || 0));

  document.getElementById('jv-total-debit').textContent = formatCurrency(totalDebit);
  document.getElementById('jv-total-credit').textContent = formatCurrency(totalCredit);

  const diff = Math.abs(totalDebit - totalCredit);
  const statusEl = document.getElementById('jv-balance-status');
  const submitBtn = document.getElementById('jv-submit-btn');

  if (totalDebit > 0 && diff < 0.001) {
    statusEl.className = 'font-bold text-emerald-600 flex items-center gap-1';
    statusEl.innerHTML = '<span>✓</span> Perfectly Balanced';
    submitBtn.disabled = false;
    submitBtn.className = 'w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2.5 rounded-lg transition shadow-md';
    submitBtn.textContent = 'Save Balanced Journal Voucher (Draft)';
  } else {
    statusEl.className = 'font-bold text-rose-600';
    statusEl.textContent = `Difference: ${formatCurrency(diff)} (Unbalanced)`;
    submitBtn.disabled = true;
    submitBtn.className = 'w-full bg-slate-300 text-slate-500 font-semibold text-sm py-2.5 rounded-lg transition';
    submitBtn.textContent = 'Debits and Credits must balance to Save';
  }
}

function setupJVFormListener() {
  const form = document.getElementById('create-jv-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rows = document.querySelectorAll('.jv-line-row');
    const lines = [];

    rows.forEach(r => {
      const accId = Number(r.querySelector('.jv-line-acc').value);
      const debit = parseFloat(r.querySelector('.jv-line-debit').value) || 0;
      const credit = parseFloat(r.querySelector('.jv-line-credit').value) || 0;
      if (debit > 0 || credit > 0) {
        lines.push({ account_id: accId, debit, credit });
      }
    });

    const payload = {
      company_id: state.currentCompanyId,
      period_id: Number(document.getElementById('jv-period').value),
      entry_date: document.getElementById('jv-date').value,
      description: document.getElementById('jv-desc').value.trim(),
      lines: lines,
    };

    try {
      await api.createJournalEntry(payload);
      showToast('success', 'Journal Voucher created as Draft!');
      document.getElementById('modal-create-jv').classList.add('hidden');
      await refreshCurrentView();
    } catch (err) {
      showToast('error', err.message);
    }
  });
}

async function postJournalEntry(id) {
  try {
    await api.postJournalEntry(id);
    showToast('success', 'Journal Voucher successfully posted to General Ledger!');
    await refreshCurrentView();
  } catch (err) {
    showToast('error', err.message);
  }
}


async function renderGeneralLedger() {
  const container = document.getElementById('view-container');
  const firstAccountId = state.accounts[0]?.account_id || null;

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">General Ledger (GL)</h1>
          <p class="text-xs text-slate-500 mt-1">Detailed transaction history, debit/credit flows, and running balances for each account.</p>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-slate-700">Account:</label>
          <select id="gl-account-selector" onchange="loadGLStatement(this.value)" class="text-sm px-3 py-1.5 border rounded-lg bg-white">
            ${state.accounts.map(a => `<option value="${a.account_id}">[${a.account_code}] ${a.account_name}</option>`).join('')}
          </select>
        </div>
      </div>

      <div id="gl-statement-card" class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <p class="text-slate-400 text-sm text-center">Select an account to view General Ledger statement.</p>
      </div>
    </div>
  `;

  if (firstAccountId) {
    loadGLStatement(firstAccountId);
  }
}

async function loadGLStatement(accountId) {
  const card = document.getElementById('gl-statement-card');
  card.innerHTML = `<div class="p-6 text-center text-slate-500">Loading GL Statement...</div>`;

  try {
    const res = await api.getAccountGL(accountId, state.currentCompanyId);
    const gl = res.data;

    let runningBalance = gl.opening_balance;
    const isNormalDebit = ['Asset', 'Expense'].includes(gl.account_type);

    card.innerHTML = `
      <div>
        <div class="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
          <div>
            <span class="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded">GL ${gl.account_code}</span>
            <h2 class="text-xl font-bold text-slate-900 mt-2">${gl.account_name}</h2>
            <p class="text-xs text-slate-500">Type: ${gl.account_type} | Normal Balance: ${isNormalDebit ? 'Debit' : 'Credit'}</p>
          </div>
          <div class="text-right">
            <div class="text-xs text-slate-400">Current Ledger Balance</div>
            <div class="text-2xl font-bold text-slate-900 num-align">${formatCurrency(gl.current_balance)}</div>
          </div>
        </div>

        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
            <tr>
              <th class="py-2.5 px-4">Date</th>
              <th class="py-2.5 px-4">Voucher No</th>
              <th class="py-2.5 px-4">Description</th>
              <th class="py-2.5 px-4 text-right">Debit</th>
              <th class="py-2.5 px-4 text-right">Credit</th>
              <th class="py-2.5 px-4 text-right">Running Balance</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr class="bg-slate-50/50 text-slate-500 text-xs italic">
              <td colspan="3" class="py-2 px-4 font-semibold">Opening Balance</td>
              <td class="py-2 px-4 text-right">-</td>
              <td class="py-2 px-4 text-right">-</td>
              <td class="py-2 px-4 text-right num-align font-semibold">${formatCurrency(gl.opening_balance)}</td>
            </tr>
            ${gl.transactions.length === 0 ? `
              <tr><td colspan="6" class="py-8 text-center text-slate-400 text-xs">No posted transactions yet for this account.</td></tr>
            ` : gl.transactions.map(t => {
              if (isNormalDebit) {
                runningBalance += (t.debit - t.credit);
              } else {
                runningBalance += (t.credit - t.debit);
              }
              return `
                <tr class="hover:bg-slate-50 transition">
                  <td class="py-2.5 px-4 text-xs text-slate-500">${t.entry_date}</td>
                  <td class="py-2.5 px-4 font-mono font-bold text-sky-700 text-xs">${t.entry_number}</td>
                  <td class="py-2.5 px-4 font-medium text-slate-800">${t.description}</td>
                  <td class="py-2.5 px-4 text-right num-align text-slate-800">${t.debit > 0 ? formatCurrency(t.debit) : '-'}</td>
                  <td class="py-2.5 px-4 text-right num-align text-slate-800">${t.credit > 0 ? formatCurrency(t.credit) : '-'}</td>
                  <td class="py-2.5 px-4 text-right num-align font-bold text-slate-900">${formatCurrency(runningBalance)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    card.innerHTML = `<div class="p-6 text-center text-rose-600">${err.message}</div>`;
  }
}


async function renderTrialBalance() {
  const container = document.getElementById('view-container');
  container.innerHTML = `<div class="p-8 text-center text-slate-500">Generating Trial Balance Report...</div>`;

  try {
    const res = await api.getTrialBalance(state.currentCompanyId);
    const tb = res.data;

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900">Trial Balance Statement</h1>
            <p class="text-xs text-slate-500 mt-1">Verifies accounting equilibrium where Total Debits equal Total Credits.</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-bold ${tb.is_balanced ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}">
            ${tb.is_balanced ? '✓ System is Perfectly Balanced' : '✕ Out of Balance Alert'}
          </span>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b">
              <tr>
                <th class="py-3 px-4">Account Code</th>
                <th class="py-3 px-4">Account Description</th>
                <th class="py-3 px-4">Type</th>
                <th class="py-3 px-4 text-right">Debit Balance</th>
                <th class="py-3 px-4 text-right">Credit Balance</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${tb.rows.map(r => `
                <tr class="hover:bg-slate-50 transition">
                  <td class="py-2.5 px-4 font-mono font-bold text-sky-700">${r.account_code}</td>
                  <td class="py-2.5 px-4 font-medium text-slate-800">${r.account_name}</td>
                  <td class="py-2.5 px-4 text-xs text-slate-500">${r.account_type}</td>
                  <td class="py-2.5 px-4 text-right num-align ${r.debit > 0 ? 'font-semibold text-slate-800' : 'text-slate-400'}">${r.debit > 0 ? formatCurrency(r.debit) : '-'}</td>
                  <td class="py-2.5 px-4 text-right num-align ${r.credit > 0 ? 'font-semibold text-slate-800' : 'text-slate-400'}">${r.credit > 0 ? formatCurrency(r.credit) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot class="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-sm">
              <tr>
                <td colspan="3" class="py-3.5 px-4 uppercase text-xs tracking-wider">Total Equilibrium Verification</td>
                <td class="py-3.5 px-4 text-right num-align text-base text-sky-900">${formatCurrency(tb.total_debit)}</td>
                <td class="py-3.5 px-4 text-right num-align text-base text-sky-900">${formatCurrency(tb.total_credit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}


async function renderAccountsPayable() {
  const container = document.getElementById('view-container');
  try {
    const res = await api.getAPInvoices(state.currentCompanyId);
    const invoices = res.data || [];

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900">Accounts Payable (AP)</h1>
            <p class="text-xs text-slate-500 mt-1">Vendor invoice tracking: Invoice → Payment → Remaining Balance.</p>
          </div>
          <button onclick="document.getElementById('modal-create-ap').classList.remove('hidden')" class="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition shadow-sm">
            + New Supplier Invoice
          </button>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b">
              <tr>
                <th class="py-3 px-4">Invoice #</th>
                <th class="py-3 px-4">Supplier / Vendor</th>
                <th class="py-3 px-4">Due Date</th>
                <th class="py-3 px-4 text-right">Invoice Total</th>
                <th class="py-3 px-4 text-right">Paid</th>
                <th class="py-3 px-4 text-right">Remaining Balance</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${invoices.length === 0 ? `
                <tr><td colspan="8" class="p-8 text-center text-slate-400 text-xs">No AP invoices registered yet.</td></tr>
              ` : invoices.map(i => `
                <tr class="hover:bg-slate-50 transition">
                  <td class="py-3 px-4 font-mono font-bold text-sky-700">${i.invoice_number}</td>
                  <td class="py-3 px-4 font-medium text-slate-800">${i.vendor_name}</td>
                  <td class="py-3 px-4 text-slate-500 text-xs">${i.due_date}</td>
                  <td class="py-3 px-4 text-right num-align">${formatCurrency(i.total_amount)}</td>
                  <td class="py-3 px-4 text-right num-align text-emerald-600">${formatCurrency(i.paid_amount)}</td>
                  <td class="py-3 px-4 text-right num-align font-bold text-rose-600">${formatCurrency(i.remaining_amount)}</td>
                  <td class="py-3 px-4 text-center">
                    <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${i.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : (i.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')}">
                      ${i.status}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    ${i.status !== 'PAID' ? `
                      <button onclick="promptAPPayment(${i.ap_invoice_id}, ${i.remaining_amount})" class="text-xs px-3 py-1 rounded bg-sky-100 text-sky-800 hover:bg-sky-200 font-semibold transition">
                        Pay Supplier
                      </button>
                    ` : `<span class="text-xs text-slate-400 italic">Settled ✓</span>`}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>


        <div id="modal-create-ap" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-slate-800 text-base">Register Vendor Bill</h3>
              <button onclick="document.getElementById('modal-create-ap').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form id="create-ap-form" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Vendor Name *</label>
                <input type="text" id="ap-vendor" required placeholder="e.g. Apex Hardware Supplies" class="w-full text-sm px-3 py-2 border rounded-lg" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Invoice Number *</label>
                  <input type="text" id="ap-inv-no" required placeholder="STACKLY01-AP-2601" class="w-full text-sm font-mono px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Total Bill Amount *</label>
                  <input type="number" step="0.01" id="ap-amount" required placeholder="50000" class="w-full text-sm px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Invoice Date</label>
                  <input type="date" id="ap-date" required value="${localDateISO()}" class="w-full text-sm px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input type="date" id="ap-due" required value="${defaultDueDate()}" class="w-full text-sm px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <button type="submit" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2 rounded-lg transition mt-2">
                Register Supplier Invoice
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    const apForm = document.getElementById('create-ap-form');
    if (apForm) {
      apForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await api.createAPInvoice({
            company_id: state.currentCompanyId,
            vendor_name: document.getElementById('ap-vendor').value.trim(),
            invoice_number: document.getElementById('ap-inv-no').value.trim(),
            invoice_date: document.getElementById('ap-date').value,
            due_date: document.getElementById('ap-due').value,
            total_amount: parseFloat(document.getElementById('ap-amount').value),
          });
          showToast('success', 'Supplier invoice registered successfully!');
          document.getElementById('modal-create-ap').classList.add('hidden');
          await refreshCurrentView();
        } catch (err) {
          showToast('error', err.message);
        }
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}

async function promptAPPayment(invoiceId, remaining) {
  const amountStr = prompt(`Enter payment amount to disburse (Max remaining: ${remaining}):`, remaining);
  if (!amountStr) return;
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid positive number');
    return;
  }
  try {
    await api.recordAPPayment(invoiceId, amount);
    showToast('success', 'Supplier payment successfully applied!');
    await refreshCurrentView();
  } catch (err) {
    showToast('error', err.message);
  }
}


async function renderAccountsReceivable() {
  const container = document.getElementById('view-container');
  try {
    const res = await api.getARInvoices(state.currentCompanyId);
    const invoices = res.data || [];

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900">Accounts Receivable (AR)</h1>
            <p class="text-xs text-slate-500 mt-1">Customer billings and collections: Customer Invoice → Payment Receipt → Remaining Due.</p>
          </div>
          <button onclick="document.getElementById('modal-create-ar').classList.remove('hidden')" class="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition shadow-sm">
            + New Customer Invoice
          </button>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b">
              <tr>
                <th class="py-3 px-4">Invoice #</th>
                <th class="py-3 px-4">Customer Name</th>
                <th class="py-3 px-4">Due Date</th>
                <th class="py-3 px-4 text-right">Invoice Amount</th>
                <th class="py-3 px-4 text-right">Received</th>
                <th class="py-3 px-4 text-right">Remaining Due</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${invoices.length === 0 ? `
                <tr><td colspan="8" class="p-8 text-center text-slate-400 text-xs">No customer invoices created yet.</td></tr>
              ` : invoices.map(i => `
                <tr class="hover:bg-slate-50 transition">
                  <td class="py-3 px-4 font-mono font-bold text-sky-700">${i.invoice_number}</td>
                  <td class="py-3 px-4 font-medium text-slate-800">${i.customer_name}</td>
                  <td class="py-3 px-4 text-slate-500 text-xs">${i.due_date}</td>
                  <td class="py-3 px-4 text-right num-align">${formatCurrency(i.total_amount)}</td>
                  <td class="py-3 px-4 text-right num-align text-emerald-600">${formatCurrency(i.received_amount)}</td>
                  <td class="py-3 px-4 text-right num-align font-bold text-indigo-600">${formatCurrency(i.remaining_amount)}</td>
                  <td class="py-3 px-4 text-center">
                    <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${i.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                      ${i.status}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    ${i.status !== 'PAID' ? `
                      <button onclick="promptARPayment(${i.ar_invoice_id}, ${i.remaining_amount})" class="text-xs px-3 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-semibold transition">
                        Receive Payment
                      </button>
                    ` : `<span class="text-xs text-slate-400 italic">Fully Paid ✓</span>`}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>


        <div id="modal-create-ar" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-slate-800 text-base">Create Customer Invoice</h3>
              <button onclick="document.getElementById('modal-create-ar').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form id="create-ar-form" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Customer / Client Name *</label>
                <input type="text" id="ar-customer" required placeholder="e.g. Northstar Analytics Pvt Ltd" class="w-full text-sm px-3 py-2 border rounded-lg" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Invoice Number *</label>
                  <input type="text" id="ar-inv-no" required placeholder="STACKLY01-AR-2601" class="w-full text-sm font-mono px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Invoice Total *</label>
                  <input type="number" step="0.01" id="ar-amount" required placeholder="420000" class="w-full text-sm px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Invoice Date</label>
                  <input type="date" id="ar-date" required value="${localDateISO()}" class="w-full text-sm px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input type="date" id="ar-due" required value="${defaultDueDate()}" class="w-full text-sm px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <button type="submit" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2 rounded-lg transition mt-2">
                Generate Customer Invoice
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    const arForm = document.getElementById('create-ar-form');
    if (arForm) {
      arForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await api.createARInvoice({
            company_id: state.currentCompanyId,
            customer_name: document.getElementById('ar-customer').value.trim(),
            invoice_number: document.getElementById('ar-inv-no').value.trim(),
            invoice_date: document.getElementById('ar-date').value,
            due_date: document.getElementById('ar-due').value,
            total_amount: parseFloat(document.getElementById('ar-amount').value),
          });
          showToast('success', 'Customer invoice created successfully!');
          document.getElementById('modal-create-ar').classList.add('hidden');
          await refreshCurrentView();
        } catch (err) {
          showToast('error', err.message);
        }
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}

async function promptARPayment(invoiceId, remaining) {
  const amountStr = prompt(`Enter customer collection receipt amount (Max remaining: ${remaining}):`, remaining);
  if (!amountStr) return;
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid positive number');
    return;
  }
  try {
    await api.recordARPayment(invoiceId, amount);
    showToast('success', 'Customer payment receipt recorded!');
    await refreshCurrentView();
  } catch (err) {
    showToast('error', err.message);
  }
}


async function renderFixedAssets() {
  const container = document.getElementById('view-container');
  try {
    const res = await api.getAssets(state.currentCompanyId);
    const assets = res.data || [];

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900">Fixed Assets Management</h1>
            <p class="text-xs text-slate-500 mt-1">Asset registry, capital acquisition cost, accumulated depreciation, and net book value.</p>
          </div>
          <button onclick="document.getElementById('modal-create-asset').classList.remove('hidden')" class="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition shadow-sm">
            + Register Asset
          </button>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b">
              <tr>
                <th class="py-3 px-4">Asset Code</th>
                <th class="py-3 px-4">Asset Name</th>
                <th class="py-3 px-4">Category</th>
                <th class="py-3 px-4 text-right">Purchase Cost</th>
                <th class="py-3 px-4 text-right">Accumulated Depreciation</th>
                <th class="py-3 px-4 text-right">Net Book Value</th>
                <th class="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${assets.length === 0 ? `
                <tr><td colspan="7" class="p-8 text-center text-slate-400 text-xs">No fixed assets registered yet.</td></tr>
              ` : assets.map(a => `
                <tr class="hover:bg-slate-50 transition">
                  <td class="py-3 px-4 font-mono font-bold text-sky-700">${a.asset_code}</td>
                  <td class="py-3 px-4 font-medium text-slate-800">${a.asset_name}</td>
                  <td class="py-3 px-4 text-xs text-slate-500">${a.category}</td>
                  <td class="py-3 px-4 text-right num-align">${formatCurrency(a.purchase_cost)}</td>
                  <td class="py-3 px-4 text-right num-align text-rose-600">${formatCurrency(a.accumulated_depreciation)}</td>
                  <td class="py-3 px-4 text-right num-align font-bold text-emerald-700">${formatCurrency(a.current_net_value)}</td>
                  <td class="py-3 px-4 text-right">
                    <button onclick="promptDepreciation(${a.asset_id})" class="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">
                      + Depreciate
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>


        <div id="modal-create-asset" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-slate-800 text-base">Register Capital Asset</h3>
              <button onclick="document.getElementById('modal-create-asset').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form id="create-asset-form" class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Asset Code *</label>
                  <input type="text" id="asset-code" required placeholder="AST-001" class="w-full text-sm font-mono px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select id="asset-cat" class="w-full text-sm px-3 py-2 border rounded-lg bg-white">
                    <option value="Machinery & Equipment">Machinery & Equipment</option>
                    <option value="IT Hardware & Servers">IT Hardware & Servers</option>
                    <option value="Vehicles & Fleet">Vehicles & Fleet</option>
                    <option value="Furniture & Fixtures">Furniture & Fixtures</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Asset Name / Description *</label>
                <input type="text" id="asset-name" required placeholder="High-Speed CNC Milling Machine" class="w-full text-sm px-3 py-2 border rounded-lg" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Purchase Cost *</label>
                  <input type="number" step="0.01" id="asset-cost" required placeholder="500000" class="w-full text-sm px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Purchase Date</label>
                  <input type="date" id="asset-date" required value="${localDateISO()}" class="w-full text-sm px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <button type="submit" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2 rounded-lg transition mt-2">
                Save Asset to Register
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    const assetForm = document.getElementById('create-asset-form');
    if (assetForm) {
      assetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await api.createAsset({
            company_id: state.currentCompanyId,
            asset_code: document.getElementById('asset-code').value.trim().toUpperCase(),
            category: document.getElementById('asset-cat').value,
            asset_name: document.getElementById('asset-name').value.trim(),
            purchase_cost: parseFloat(document.getElementById('asset-cost').value),
            purchase_date: document.getElementById('asset-date').value,
          });
          showToast('success', 'Fixed Asset registered successfully!');
          document.getElementById('modal-create-asset').classList.add('hidden');
          await refreshCurrentView();
        } catch (err) {
          showToast('error', err.message);
        }
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}

async function promptDepreciation(assetId) {
  const amountStr = prompt('Enter depreciation amount:');
  if (!amountStr) return;
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return;
  try {
    await api.recordDepreciation(assetId, amount);
    showToast('success', 'Depreciation recorded successfully!');
    await refreshCurrentView();
  } catch (err) {
    showToast('error', err.message);
  }
}


async function renderBudgeting() {
  const container = document.getElementById('view-container');
  try {
    const res = await api.getBudgets(state.currentCompanyId);
    const budgets = res.data || [];

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900">Budgeting & Variance Analysis</h1>
            <p class="text-xs text-slate-500 mt-1">Define budgeted allocations per account and monitor variances against actual ledger expenditures.</p>
          </div>
          <button onclick="document.getElementById('modal-create-budget').classList.remove('hidden')" class="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition shadow-sm">
            + Set Account Budget
          </button>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b">
              <tr>
                <th class="py-3 px-4">Account ID</th>
                <th class="py-3 px-4 text-right">Budget Allocation</th>
                <th class="py-3 px-4 text-right">Actual Incurred</th>
                <th class="py-3 px-4 text-right">Variance (Remaining)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${budgets.length === 0 ? `
                <tr><td colspan="4" class="p-8 text-center text-slate-400 text-xs">No account budgets set yet.</td></tr>
              ` : budgets.map(b => {
                const acc = state.accounts.find(a => a.account_id === b.account_id);
                return `
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-3 px-4 font-medium text-slate-800">
                      ${acc ? `[${acc.account_code}] ${acc.account_name}` : `Account #${b.account_id}`}
                    </td>
                    <td class="py-3 px-4 text-right num-align font-semibold text-slate-900">${formatCurrency(b.budgeted_amount)}</td>
                    <td class="py-3 px-4 text-right num-align text-slate-600">${formatCurrency(b.actual_amount)}</td>
                    <td class="py-3 px-4 text-right num-align font-bold ${b.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}">
                      ${formatCurrency(b.variance)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>


        <div id="modal-create-budget" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-slate-800 text-base">Set Account Budget</h3>
              <button onclick="document.getElementById('modal-create-budget').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form id="create-budget-form" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Fiscal Year *</label>
                <select id="budget-fy" class="w-full text-sm px-3 py-2 border rounded-lg bg-white">
                  ${state.fiscalYears.map(fy => `<option value="${fy.fiscal_year_id}">${fy.year_name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Expense Account *</label>
                <select id="budget-acc" class="w-full text-sm px-3 py-2 border rounded-lg bg-white">
                  ${state.accounts.map(a => `<option value="${a.account_id}">[${a.account_code}] ${a.account_name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Budget Allocation Amount *</label>
                <input type="number" step="0.01" id="budget-amt" required placeholder="1000000" class="w-full text-sm px-3 py-2 border rounded-lg" />
              </div>
              <button type="submit" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2 rounded-lg transition mt-2">
                Save Budget
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    const budgetForm = document.getElementById('create-budget-form');
    if (budgetForm) {
      budgetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await api.setBudget({
            company_id: state.currentCompanyId,
            fiscal_year_id: Number(document.getElementById('budget-fy').value),
            account_id: Number(document.getElementById('budget-acc').value),
            budgeted_amount: parseFloat(document.getElementById('budget-amt').value),
          });
          showToast('success', 'Budget allocated successfully!');
          document.getElementById('modal-create-budget').classList.add('hidden');
          await refreshCurrentView();
        } catch (err) {
          showToast('error', err.message);
        }
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}


async function renderGST() {
  const container = document.getElementById('view-container');
  try {
    const res = await api.getGSTRecords(state.currentCompanyId);
    const records = res.data || [];

    const totalTaxable = records.reduce((sum, r) => sum + r.taxable_value, 0);
    const totalCGST = records.reduce((sum, r) => sum + r.cgst_amount, 0);
    const totalSGST = records.reduce((sum, r) => sum + r.sgst_amount, 0);
    const totalTax = records.reduce((sum, r) => sum + r.total_tax, 0);

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-2xl font-extrabold text-slate-900">GST Compliance & Tax Reporting</h1>
            <p class="text-xs text-slate-500 mt-1">Statutory calculation and breakdown of CGST, SGST, IGST across business transactions.</p>
          </div>
          <button onclick="document.getElementById('modal-create-gst').classList.remove('hidden')" class="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition shadow-sm">
            + Record GST Entry
          </button>
        </div>


        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-xl border border-slate-200">
            <div class="text-xs text-slate-500">Taxable Turnover</div>
            <div class="text-xl font-bold text-slate-900 mt-1">${formatCurrency(totalTaxable)}</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200">
            <div class="text-xs text-slate-500">Total CGST (Central)</div>
            <div class="text-xl font-bold text-sky-700 mt-1">${formatCurrency(totalCGST)}</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200">
            <div class="text-xs text-slate-500">Total SGST (State)</div>
            <div class="text-xl font-bold text-sky-700 mt-1">${formatCurrency(totalSGST)}</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 bg-sky-50/50">
            <div class="text-xs text-slate-500">Total Tax Liability</div>
            <div class="text-xl font-bold text-slate-900 mt-1">${formatCurrency(totalTax)}</div>
          </div>
        </div>


        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b">
              <tr>
                <th class="py-3 px-4">Transaction Ref</th>
                <th class="py-3 px-4">HSN / SAC</th>
                <th class="py-3 px-4 text-right">Taxable Value</th>
                <th class="py-3 px-4 text-right">CGST</th>
                <th class="py-3 px-4 text-right">SGST</th>
                <th class="py-3 px-4 text-right">IGST</th>
                <th class="py-3 px-4 text-right font-bold">Total Tax</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${records.length === 0 ? `
                <tr><td colspan="7" class="p-8 text-center text-slate-400 text-xs">No GST records logged yet.</td></tr>
              ` : records.map(r => `
                <tr class="hover:bg-slate-50 transition">
                  <td class="py-3 px-4 font-mono font-bold text-sky-700">${r.transaction_ref}</td>
                  <td class="py-3 px-4 font-mono text-slate-600 text-xs">${r.hsn_sac}</td>
                  <td class="py-3 px-4 text-right num-align">${formatCurrency(r.taxable_value)}</td>
                  <td class="py-3 px-4 text-right num-align text-slate-600">${formatCurrency(r.cgst_amount)}</td>
                  <td class="py-3 px-4 text-right num-align text-slate-600">${formatCurrency(r.sgst_amount)}</td>
                  <td class="py-3 px-4 text-right num-align text-slate-600">${formatCurrency(r.igst_amount)}</td>
                  <td class="py-3 px-4 text-right num-align font-bold text-slate-900">${formatCurrency(r.total_tax)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>


        <div id="modal-create-gst" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-slate-800 text-base">Record GST Transaction</h3>
              <button onclick="document.getElementById('modal-create-gst').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form id="create-gst-form" class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Invoice / Ref *</label>
                  <input type="text" id="gst-ref" required placeholder="STACKLY01-GST-2601" class="w-full text-sm font-mono px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">HSN/SAC Code *</label>
                  <input type="text" id="gst-hsn" required value="998311" class="w-full text-sm font-mono px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Taxable Value *</label>
                <input type="number" step="0.01" id="gst-taxable" required placeholder="50000" class="w-full text-sm px-3 py-2 border rounded-lg" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">CGST %</label>
                  <input type="number" step="0.1" id="gst-cgst" value="9.0" class="w-full text-sm px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">SGST %</label>
                  <input type="number" step="0.1" id="gst-sgst" value="9.0" class="w-full text-sm px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <button type="submit" class="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2 rounded-lg transition mt-2">
                Calculate & Save GST Entry
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    const gstForm = document.getElementById('create-gst-form');
    if (gstForm) {
      gstForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          await api.recordGST({
            company_id: state.currentCompanyId,
            transaction_ref: document.getElementById('gst-ref').value.trim(),
            hsn_sac: document.getElementById('gst-hsn').value.trim(),
            taxable_value: parseFloat(document.getElementById('gst-taxable').value),
            cgst_rate_percent: parseFloat(document.getElementById('gst-cgst').value) || 0,
            sgst_rate_percent: parseFloat(document.getElementById('gst-sgst').value) || 0,
            igst_rate_percent: 0,
          });
          showToast('success', 'GST entry calculated and saved!');
          document.getElementById('modal-create-gst').classList.add('hidden');
          await refreshCurrentView();
        } catch (err) {
          showToast('error', err.message);
        }
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}


async function renderFinancialReports() {
  const container = document.getElementById('view-container');
  container.innerHTML = `<div class="p-8 text-center text-slate-500">Generating Financial Statements...</div>`;

  try {
    const [pnlRes, bsRes] = await Promise.all([
      api.getProfitAndLoss(state.currentCompanyId),
      api.getBalanceSheet(state.currentCompanyId),
    ]);
    const pnl = pnlRes.data;
    const bs = bsRes.data;

    container.innerHTML = `
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900">Financial Reports & Statements</h1>
          <p class="text-xs text-slate-500 mt-1">Official Income Statement (Profit & Loss) and Statement of Financial Position (Balance Sheet).</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div class="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                <h2 class="text-base font-bold text-slate-800 uppercase tracking-wider">Statement of Profit & Loss</h2>
                <span class="text-xs text-slate-400">Current Financial Year</span>
              </div>


              <div class="mb-4">
                <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Operating Revenue</h3>
                <div class="space-y-1.5 pl-2">
                  ${pnl.revenues.length === 0 ? `<div class="text-xs text-slate-400 italic">No revenue posted yet.</div>` : pnl.revenues.map(r => `
                    <div class="flex justify-between text-xs py-1 border-b border-slate-50">
                      <span class="text-slate-600">[${r.code}] ${r.name}</span>
                      <span class="font-semibold text-slate-800 num-align">${formatCurrency(r.amount)}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="flex justify-between text-xs font-bold text-slate-800 pt-2 border-t mt-2">
                  <span>Total Revenue</span>
                  <span class="num-align text-sky-700">${formatCurrency(pnl.total_revenue)}</span>
                </div>
              </div>


              <div class="mb-4">
                <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Operating Expenses</h3>
                <div class="space-y-1.5 pl-2">
                  ${pnl.expenses.length === 0 ? `<div class="text-xs text-slate-400 italic">No expenses posted yet.</div>` : pnl.expenses.map(e => `
                    <div class="flex justify-between text-xs py-1 border-b border-slate-50">
                      <span class="text-slate-600">[${e.code}] ${e.name}</span>
                      <span class="font-semibold text-slate-800 num-align">${formatCurrency(e.amount)}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="flex justify-between text-xs font-bold text-slate-800 pt-2 border-t mt-2">
                  <span>Total Operating Expenses</span>
                  <span class="num-align text-rose-700">${formatCurrency(pnl.total_expense)}</span>
                </div>
              </div>
            </div>


            <div class="p-4 rounded-lg bg-slate-50 border border-slate-200 mt-4 flex justify-between items-center">
              <span class="text-sm font-bold text-slate-800">Net Profit / (Loss)</span>
              <span class="text-lg font-extrabold num-align ${pnl.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}">
                ${formatCurrency(pnl.net_profit)}
              </span>
            </div>
          </div>


          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div class="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                <h2 class="text-base font-bold text-slate-800 uppercase tracking-wider">Balance Sheet</h2>
                <span class="text-xs font-semibold px-2 py-0.5 rounded ${bs.is_balanced ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                  ${bs.is_balanced ? 'Assets = Liabilities + Equity ✓' : 'Equation Discrepancy'}
                </span>
              </div>


              <div class="mb-4">
                <div class="flex justify-between items-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <span>Total Assets</span>
                  <span class="num-align text-emerald-700">${formatCurrency(bs.total_assets)}</span>
                </div>
                <div class="space-y-1 pl-2">
                  ${bs.assets.map(a => `
                    <div class="flex justify-between text-xs py-0.5">
                      <span class="text-slate-600">[${a.code}] ${a.name}</span>
                      <span class="num-align text-slate-800">${formatCurrency(a.amount)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>


              <div class="mb-4">
                <div class="flex justify-between items-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <span>Total Liabilities</span>
                  <span class="num-align text-rose-700">${formatCurrency(bs.total_liabilities)}</span>
                </div>
                <div class="space-y-1 pl-2">
                  ${bs.liabilities.map(l => `
                    <div class="flex justify-between text-xs py-0.5">
                      <span class="text-slate-600">[${l.code}] ${l.name}</span>
                      <span class="num-align text-slate-800">${formatCurrency(l.amount)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>


              <div class="mb-4">
                <div class="flex justify-between items-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <span>Owner's Equity & Earnings</span>
                  <span class="num-align text-purple-700">${formatCurrency(bs.total_equity)}</span>
                </div>
                <div class="space-y-1 pl-2">
                  ${bs.equity.map(e => `
                    <div class="flex justify-between text-xs py-0.5">
                      <span class="text-slate-600">${e.name}</span>
                      <span class="num-align text-slate-800">${formatCurrency(e.amount)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>


            <div class="p-4 rounded-lg bg-slate-50 border border-slate-200 mt-4 flex justify-between items-center">
              <span class="text-sm font-bold text-slate-800">Liabilities + Equity Total</span>
              <span class="text-lg font-extrabold num-align text-slate-900">
                ${formatCurrency(bs.total_liabilities + bs.total_equity)}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="p-8 text-center text-rose-600">${err.message}</div>`;
  }
}
