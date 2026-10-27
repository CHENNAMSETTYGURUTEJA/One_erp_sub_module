import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Plus, X, Download, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';

export default function Budgeting({
  accounts,
  fiscalYears,
  currentCompanyId,
  currentCompany,
  onRefresh,
  onToast,
}) {
  const [budgets, setBudgets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fiscal_year_id: fiscalYears[0]?.fiscal_year_id || '',
    account_id: accounts[0]?.account_id || '',
    budgeted_amount: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, [currentCompanyId]);

  useEffect(() => {
    if (fiscalYears[0] && !formData.fiscal_year_id) {
      setFormData((prev) => ({ ...prev, fiscal_year_id: fiscalYears[0].fiscal_year_id }));
    }
    if (accounts[0] && !formData.account_id) {
      setFormData((prev) => ({ ...prev, account_id: accounts[0].account_id }));
    }
  }, [fiscalYears, accounts]);

  const loadBudgets = async () => {
    try {
      const res = await api.getBudgets(currentCompanyId);
      setBudgets(res.data || []);
    } catch (err) {
      onToast('error', err.message);
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currentCompany?.currency || 'INR',
    }).format(amt || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.setBudget({
        company_id: currentCompanyId,
        fiscal_year_id: Number(formData.fiscal_year_id),
        account_id: Number(formData.account_id),
        budgeted_amount: parseFloat(formData.budgeted_amount),
      });
      onToast('success', 'Budget allocated successfully!');
      setModalOpen(false);
      setFormData({
        fiscal_year_id: fiscalYears[0]?.fiscal_year_id || '',
        account_id: accounts[0]?.account_id || '',
        budgeted_amount: '',
      });
      loadBudgets();
      onRefresh();
    } catch (err) {
      onToast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBudgets = budgets.filter((b) => {
    const acc = accounts.find((a) => a.account_id === b.account_id);
    const searchTarget = acc ? `${acc.account_code} ${acc.account_name}` : String(b.account_id);
    return searchTarget.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleExport = () => {
    const headers = [
      {
        label: 'Account Code',
        accessor: (b) => {
          const acc = accounts.find((a) => a.account_id === b.account_id);
          return acc ? acc.account_code : b.account_id;
        },
      },
      {
        label: 'Account Name',
        accessor: (b) => {
          const acc = accounts.find((a) => a.account_id === b.account_id);
          return acc ? acc.account_name : '';
        },
      },
      { label: 'Budget Plan', accessor: 'budgeted_amount' },
      { label: 'Actual Incurred', accessor: 'actual_amount' },
      { label: 'Variance', accessor: 'variance' },
    ];
    exportToCSV(`Budgets_${currentCompany?.company_code || 'ALL'}`, headers, filteredBudgets);
    onToast('success', 'Budgets exported to CSV.');
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Budgeting & Variance Analysis</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Define budgeted ceilings per account and track variance against actual general ledger expenditures.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Set Account Budget</span>
          </button>
        </div>
      </div>


      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search account name or code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>


      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-3.5 px-4">Account Description</th>
              <th className="py-3.5 px-4 text-right">Budget Plan</th>
              <th className="py-3.5 px-4 text-right">Actual Incurred</th>
              <th className="py-3.5 px-4 text-center">Consumption %</th>
              <th className="py-3.5 px-4 text-right">Variance (Remaining)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredBudgets.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400 text-xs">
                  No account budgets matching criteria.
                </td>
              </tr>
            ) : (
              filteredBudgets.map((b) => {
                const acc = accounts.find((a) => a.account_id === b.account_id);
                const percent = b.budgeted_amount > 0 ? Math.min(100, Math.round((b.actual_amount / b.budgeted_amount) * 100)) : 0;
                const isOver = b.variance < 0;

                return (
                  <tr key={b.budget_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      {acc ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sky-600 dark:text-sky-400">[{acc.account_code}]</span>
                          <span>{acc.account_name}</span>
                        </div>
                      ) : (
                        `Account #${b.account_id}`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right num-align font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(b.budgeted_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right num-align text-slate-600 dark:text-slate-400">
                      {formatCurrency(b.actual_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="w-28 mx-auto flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className={`h-full rounded-full ${isOver ? 'bg-rose-500' : 'bg-sky-500'}`}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                          {percent}%
                        </span>
                      </div>
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right num-align font-bold ${
                        !isOver ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(b.variance)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>


      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Set Account Budget</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Fiscal Year</label>
                <select
                  value={formData.fiscal_year_id}
                  onChange={(e) => setFormData({ ...formData, fiscal_year_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                >
                  {fiscalYears.map((fy) => (
                    <option key={fy.fiscal_year_id} value={fy.fiscal_year_id}>
                      {fy.year_name} ({fy.start_date} to {fy.end_date})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Account</label>
                <select
                  value={formData.account_id}
                  onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                >
                  {accounts.map((a) => (
                    <option key={a.account_id} value={a.account_id}>
                      [{a.account_code}] {a.account_name} ({a.account_type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Budget Allocation</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="525000.00"
                  value={formData.budgeted_amount}
                  onChange={(e) => setFormData({ ...formData, budgeted_amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700"
                >
                  {submitting ? 'Saving...' : 'Set Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
