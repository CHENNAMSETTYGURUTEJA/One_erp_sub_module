import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { CheckCircle2, AlertTriangle, Download, Search, Filter } from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';

export default function TrialBalance({
  currentCompanyId,
  currentCompany,
  onToast,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    loadTrialBalance();
  }, [currentCompanyId]);

  const loadTrialBalance = async () => {
    try {
      setLoading(true);
      const res = await api.getTrialBalance(currentCompanyId);
      setData(res.data);
    } catch (err) {
      onToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currentCompany?.currency || 'INR',
    }).format(amt || 0);
  };

  const rows = data?.rows || [];
  const filteredRows = rows.filter((r) => {
    const matchesSearch =
      r.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.account_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || r.account_type.toUpperCase() === typeFilter.toUpperCase();
    return matchesSearch && matchesType;
  });

  const handleExport = () => {
    const headers = [
      { label: 'Account Code', accessor: 'account_code' },
      { label: 'Account Description', accessor: 'account_name' },
      { label: 'Type', accessor: 'account_type' },
      { label: 'Debit Balance', accessor: (r) => (r.debit > 0 ? r.debit : 0) },
      { label: 'Credit Balance', accessor: (r) => (r.credit > 0 ? r.credit : 0) },
    ];
    exportToCSV(`Trial_Balance_${currentCompany?.company_code || 'COMPANY'}`, headers, filteredRows);
    onToast('success', 'Trial Balance exported to CSV.');
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 dark:text-slate-400 text-xs">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full mb-3" />
        <p>Calculating General Ledger balances & double-entry equilibrium...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Trial Balance Statement</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            General ledger equilibrium verification: Total Debits must equal Total Credits.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <div
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              data?.is_balanced
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
            }`}
          >
            {data?.is_balanced ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>System is Perfectly Balanced</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Out of Balance Alert</span>
              </>
            )}
          </div>
        </div>
      </div>


      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search account code or name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Type:</span>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="ALL">All Account Types</option>
            <option value="ASSET">Assets</option>
            <option value="LIABILITY">Liabilities</option>
            <option value="EQUITY">Equity</option>
            <option value="REVENUE">Revenue</option>
            <option value="EXPENSE">Expenses</option>
          </select>
        </div>
      </div>


      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-3.5 px-4">Account Code</th>
              <th className="py-3.5 px-4">Account Description</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4 text-right">Debit Balance</th>
              <th className="py-3.5 px-4 text-right">Credit Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400 text-xs">
                  No accounts matching filter.
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.account_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                  <td className="py-2.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">{r.account_code}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">{r.account_name}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-500 dark:text-slate-400">{r.account_type}</td>
                  <td className="py-2.5 px-4 text-right num-align">
                    {r.debit > 0 ? (
                      <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(r.debit)}</span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right num-align">
                    {r.credit > 0 ? (
                      <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(r.credit)}</span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-slate-100 dark:bg-slate-900 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700 text-xs">
            <tr>
              <td colSpan="3" className="py-3.5 px-4 uppercase tracking-wider">
                Total Equilibrium Balance
              </td>
              <td className="py-3.5 px-4 text-right num-align font-mono text-sm text-sky-600 dark:text-sky-400">
                {formatCurrency(data?.total_debit)}
              </td>
              <td className="py-3.5 px-4 text-right num-align font-mono text-sm text-sky-600 dark:text-sky-400">
                {formatCurrency(data?.total_credit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
