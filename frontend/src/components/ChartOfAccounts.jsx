import React, { useState } from 'react';
import { api } from '../api/client';
import { Plus, X } from 'lucide-react';

export default function ChartOfAccounts({
  accounts,
  currentCompanyId,
  currentCompany,
  onRefresh,
  onToast,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: 'Expense',
    opening_balance: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const typeColors = {
    Asset: 'bg-emerald-100 text-emerald-800',
    Liability: 'bg-rose-100 text-rose-800',
    Equity: 'bg-purple-100 text-purple-800',
    Revenue: 'bg-sky-100 text-sky-800',
    Expense: 'bg-amber-100 text-amber-800',
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currentCompany?.currency || 'INR',
    }).format(amt || 0);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createAccount({
        company_id: currentCompanyId,
        ...formData,
        account_code: formData.account_code.trim().toUpperCase(),
        opening_balance: parseFloat(formData.opening_balance) || 0,
      });
      onToast('success', 'Account added to Chart of Accounts!');
      setModalOpen(false);
      setFormData({
        account_code: '',
        account_name: '',
        account_type: 'Expense',
        opening_balance: 0,
      });
      onRefresh();
    } catch (err) {
      onToast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Chart of Accounts (COA)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Foundational ledger accounts classifying Assets, Liabilities, Equity, Revenue, and Expenses.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-700 uppercase">General Ledger Master</span>
          <span className="text-xs text-slate-500">{accounts.length} active ledger accounts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/70 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Category / Type</th>
                <th className="py-3 px-4 text-right">Opening Balance</th>
                <th className="py-3 px-4 text-right">Current Ledger Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((a) => (
                <tr key={a.account_id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-sky-700">{a.account_code}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{a.account_name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        typeColors[a.account_type] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {a.account_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right num-align text-slate-500">
                    {formatCurrency(a.opening_balance)}
                  </td>
                  <td className="py-3 px-4 text-right num-align font-bold text-slate-900">
                    {formatCurrency(a.current_balance)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        a.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base">Add New Account</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5005"
                  value={formData.account_code}
                  onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                  className="w-full text-sm font-mono px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legal & Professional Fees"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  className="w-full text-sm px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Type *</label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                  className="w-full text-sm px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="Asset">Asset (Debit balance)</option>
                  <option value="Liability">Liability (Credit balance)</option>
                  <option value="Equity">Equity (Credit balance)</option>
                  <option value="Revenue">Revenue (Credit balance)</option>
                  <option value="Expense">Expense (Debit balance)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.opening_balance}
                  onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                  className="w-full text-sm px-3 py-2 border rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2 rounded-lg transition mt-2"
              >
                {submitting ? 'Saving to COA...' : 'Save Account to COA'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

