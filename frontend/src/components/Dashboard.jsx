import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Wallet,
  TrendingUp,
  Receipt,
  Users,
  Building2,
  Calendar,
  BookOpen,
  Scale,
  ArrowRight,
  CheckCircle,
  Truck,
  Coins,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';

export default function Dashboard({ currentCompany, onNavigate, onToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentCompany) return;
    loadStats();
  }, [currentCompany]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats(currentCompany.company_id);
      setStats(res.data);
    } catch (err) {
      onToast('error', err.message, 'Dashboard Load Failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) => {
    const val = Number(amt) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currentCompany?.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 dark:text-slate-400">
        <div className="animate-spin inline-block w-9 h-9 border-4 border-sky-500 border-t-transparent rounded-full mb-3" />
        <p className="text-xs font-semibold">Hydrating Executive Financial Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 text-sky-300 rounded-full text-xs font-semibold mb-2 border border-sky-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 live-dot" />
            <span>OneERP Finance Workspace</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            {currentCompany?.company_name || 'Organization Dashboard'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 flex flex-wrap gap-2">
            <span>Code: <b className="font-mono text-sky-400">{currentCompany?.company_code}</b></span>
            <span>•</span>
            <span>Currency: <b>{currentCompany?.currency}</b></span>
            <span>•</span>
            <span>FY Start: <b>{currentCompany?.financial_year_start}</b></span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('journal-entries')}
            className="bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-sky-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>+ New Journal Entry</span>
          </button>
          <button
            onClick={() => onNavigate('trial-balance')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <Scale className="w-3.5 h-3.5 text-sky-400" />
            <span>Trial Balance</span>
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cash & Bank Liquidity</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white num-align">
            {formatCurrency(stats?.total_cash)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2">
            <Wallet className="w-3.5 h-3.5" />
            <span>Current company ledger balance</span>
          </div>
        </div>


        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Recognized Revenue</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white num-align">
            {formatCurrency(stats?.total_revenue)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 font-semibold mt-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Operating Inflows</span>
          </div>
        </div>


        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Accounts Payable (AP)</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white num-align">
            {formatCurrency(stats?.ap_outstanding)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-2">
            <span>Due to Trade Suppliers</span>
          </div>
        </div>


        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Accounts Receivable (AR)</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white num-align">
            {formatCurrency(stats?.ar_outstanding)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-2">
            <span>Pending Customer Invoices</span>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Revenue vs Expense Velocity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly performance trajectory across the current fiscal cycle
              </p>
            </div>
            <span className="text-xs text-slate-400">Live ledger trend</span>
          </div>

          <div className="h-64 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center px-6">
            <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No monthly trend data available</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">Revenue and expense history will appear here when ledger reports provide period-level data.</p>
          </div>
        </div>


        <div className="bg-white dark:bg-slate-800/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Working Capital Health</h3>
              <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <Layers className="w-4 h-4" />
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Net current liquid position comparing receivables and cash against liabilities.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
              Working capital ratios will display once the balance sheet report exposes current asset and liability totals.
            </div>
          </div>


          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5">
              Quick Operations
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate('ap')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left font-semibold text-slate-700 dark:text-slate-200 transition flex items-center justify-between"
              >
                <span>AP Invoices</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('ar')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left font-semibold text-slate-700 dark:text-slate-200 transition flex items-center justify-between"
              >
                <span>AR Invoices</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('assets')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left font-semibold text-slate-700 dark:text-slate-200 transition flex items-center justify-between"
              >
                <span>Fixed Assets</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => onNavigate('gst')}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left font-semibold text-slate-700 dark:text-slate-200 transition flex items-center justify-between"
              >
                <span>GST Filings</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('accounts')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-sky-500 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-sky-500 transition" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Chart of Accounts</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            General ledger structure with Assets, Liabilities, Equity, Revenue & Expenses.
          </p>
        </div>

        <div
          onClick={() => onNavigate('journal-entries')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-sky-500 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Scale className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-500 transition" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Double-Entry Journals</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Strict debit-credit balance validation with period control posting.
          </p>
        </div>

        <div
          onClick={() => onNavigate('budget')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-sky-500 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Coins className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-500 transition" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Budget Plan vs Actual</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Allocate departmental expenditure plans and analyze variances in real time.
          </p>
        </div>

        <div
          onClick={() => onNavigate('reports')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm hover:border-sky-500 cursor-pointer transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <CheckCircle className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-rose-500 transition" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">P&L & Balance Sheet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit-grade financial reporting conforming to statutory standards.
          </p>
        </div>
      </div>
    </div>
  );
}
