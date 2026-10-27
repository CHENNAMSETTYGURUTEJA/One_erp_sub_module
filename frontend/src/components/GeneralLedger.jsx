import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function GeneralLedger({
  accounts,
  currentCompanyId,
  currentCompany,
  onToast,
}) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.account_id || '');
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAccountId) {
      loadStatement(selectedAccountId);
    }
  }, [selectedAccountId, currentCompanyId]);

  const loadStatement = async (accId) => {
    try {
      setLoading(true);
      const res = await api.getAccountGL(accId, currentCompanyId);
      setStatement(res.data);
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

  let runningBalance = statement?.opening_balance || 0;
  const isNormalDebit = ['Asset', 'Expense'].includes(statement?.account_type);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">General Ledger (GL)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Detailed transaction history, debit/credit flows, and running balances for each account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700">Account:</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(Number(e.target.value))}
            className="text-sm px-3 py-1.5 border rounded-lg bg-white"
          >
            {accounts.map((a) => (
              <option key={a.account_id} value={a.account_id}>
                [{a.account_code}] {a.account_name} ({a.account_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading Statement...</div>
        ) : statement ? (
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded">
                  GL {statement.account_code}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-2">{statement.account_name}</h2>
                <p className="text-xs text-slate-500">
                  Type: {statement.account_type} | Normal Balance: {isNormalDebit ? 'Debit' : 'Credit'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Current Ledger Balance</div>
                <div className="text-2xl font-bold text-slate-900 num-align">
                  {formatCurrency(statement.current_balance)}
                </div>
              </div>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Voucher No</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Debit</th>
                  <th className="py-2.5 px-4 text-right">Credit</th>
                  <th className="py-2.5 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-50/50 text-slate-500 text-xs italic">
                  <td colSpan="3" className="py-2 px-4 font-semibold">Opening Balance</td>
                  <td className="py-2 px-4 text-right">-</td>
                  <td className="py-2 px-4 text-right">-</td>
                  <td className="py-2 px-4 text-right num-align font-semibold">
                    {formatCurrency(statement.opening_balance)}
                  </td>
                </tr>
                {statement.transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                      No posted transactions yet for this account.
                    </td>
                  </tr>
                ) : (
                  statement.transactions.map((t, idx) => {
                    if (isNormalDebit) {
                      runningBalance += (t.debit - t.credit);
                    } else {
                      runningBalance += (t.credit - t.debit);
                    }
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-4 text-xs text-slate-500">{t.entry_date}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-sky-700 text-xs">{t.entry_number}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">{t.description}</td>
                        <td className="py-2.5 px-4 text-right num-align text-slate-800">
                          {t.debit > 0 ? formatCurrency(t.debit) : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right num-align text-slate-800">
                          {t.credit > 0 ? formatCurrency(t.credit) : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right num-align font-bold text-slate-900">
                          {formatCurrency(runningBalance)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

