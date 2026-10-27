import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function FinancialReports({
  currentCompanyId,
  currentCompany,
  onToast,
}) {
  const [pnl, setPnl] = useState(null);
  const [bs, setBs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [currentCompanyId]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [pnlRes, bsRes] = await Promise.all([
        api.getProfitAndLoss(currentCompanyId),
        api.getBalanceSheet(currentCompanyId),
      ]);
      setPnl(pnlRes.data);
      setBs(bsRes.data);
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

  if (loading) {
    return <div className="p-8 text-center text-slate-500 text-xs">Generating Financial Statements...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Financial Reports & Statements</h1>
        <p className="text-xs text-slate-500 mt-1">
          Official Income Statement (Profit & Loss) and Statement of Financial Position (Balance Sheet).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">
                Statement of Profit & Loss
              </h2>
              <span className="text-xs text-slate-400">Current Financial Year</span>
            </div>


            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Operating Revenue</h3>
              <div className="space-y-1.5 pl-2">
                {!pnl?.revenues || pnl.revenues.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">No revenue posted yet.</div>
                ) : (
                  pnl.revenues.map((r, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-50">
                      <span className="text-slate-600">[{r.code}] {r.name}</span>
                      <span className="font-semibold text-slate-800 num-align">{formatCurrency(r.amount)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-800 pt-2 border-t mt-2">
                <span>Total Revenue</span>
                <span className="num-align text-sky-700">{formatCurrency(pnl?.total_revenue)}</span>
              </div>
            </div>


            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Operating Expenses</h3>
              <div className="space-y-1.5 pl-2">
                {!pnl?.expenses || pnl.expenses.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">No expenses posted yet.</div>
                ) : (
                  pnl.expenses.map((e, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-50">
                      <span className="text-slate-600">[{e.code}] {e.name}</span>
                      <span className="font-semibold text-slate-800 num-align">{formatCurrency(e.amount)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-800 pt-2 border-t mt-2">
                <span>Total Operating Expenses</span>
                <span className="num-align text-rose-700">{formatCurrency(pnl?.total_expense)}</span>
              </div>
            </div>
          </div>


          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 mt-4 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">Net Profit / (Loss)</span>
            <span
              className={`text-lg font-extrabold num-align ${
                (pnl?.net_profit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatCurrency(pnl?.net_profit)}
            </span>
          </div>
        </div>


        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">Balance Sheet</h2>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  bs?.is_balanced ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {bs?.is_balanced ? 'Assets = Liabilities + Equity ✓' : 'Equation Discrepancy'}
              </span>
            </div>


            <div className="mb-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                <span>Total Assets</span>
                <span className="num-align text-emerald-700">{formatCurrency(bs?.total_assets)}</span>
              </div>
              <div className="space-y-1 pl-2">
                {bs?.assets.map((a, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-0.5">
                    <span className="text-slate-600">[{a.code}] {a.name}</span>
                    <span className="num-align text-slate-800">{formatCurrency(a.amount)}</span>
                  </div>
                ))}
              </div>
            </div>


            <div className="mb-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                <span>Total Liabilities</span>
                <span className="num-align text-rose-700">{formatCurrency(bs?.total_liabilities)}</span>
              </div>
              <div className="space-y-1 pl-2">
                {bs?.liabilities.map((l, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-0.5">
                    <span className="text-slate-600">[{l.code}] {l.name}</span>
                    <span className="num-align text-slate-800">{formatCurrency(l.amount)}</span>
                  </div>
                ))}
              </div>
            </div>


            <div className="mb-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                <span>Owner's Equity & Earnings</span>
                <span className="num-align text-purple-700">{formatCurrency(bs?.total_equity)}</span>
              </div>
              <div className="space-y-1 pl-2">
                {bs?.equity.map((e, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-0.5">
                    <span className="text-slate-600">{e.name}</span>
                    <span className="num-align text-slate-800">{formatCurrency(e.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>


          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 mt-4 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-800">Liabilities + Equity Total</span>
            <span className="text-lg font-extrabold num-align text-slate-900">
              {formatCurrency((bs?.total_liabilities || 0) + (bs?.total_equity || 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

