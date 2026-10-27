import React, { useState } from 'react';
import { api } from '../api/client';
import { Calendar, Plus, X } from 'lucide-react';

export default function FiscalYears({
  fiscalYears,
  currentCompanyId,
  onRefresh,
  onToast,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPeriod, setHistoryPeriod] = useState(null);
  const [periodHistory, setPeriodHistory] = useState([]);
  const [formData, setFormData] = useState({
    year_name: '',
    start_date: '',
    end_date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createFiscalYear({
        company_id: currentCompanyId,
        ...formData,
      });
      onToast('success', 'Fiscal year and monthly accounting periods generated successfully.');
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      onToast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const showHistory = async (period) => {
    try {
      const response = await api.getFiscalPeriodHistory(period.period_id);
      setHistoryPeriod(period);
      setPeriodHistory(response.data || []);
      setHistoryOpen(true);
    } catch (err) {
      onToast('error', err.message);
    }
  };

  const handleToggle = async (periodId, status) => {
    if (!window.confirm(`${status === 'CLOSED' ? 'Close' : 'Reopen'} this accounting period? This changes where journals can be posted.`)) return;
    try {
      await api.updatePeriodStatus(periodId, status);
      onToast('info', `Period updated to ${status}`);
      onRefresh();
    } catch (err) {
      onToast('error', err.message);
    }
  };

  const allPeriods = fiscalYears.flatMap((year) => year.periods || []);
  const dateNow = new Date();
  const today = `${dateNow.getFullYear()}-${String(dateNow.getMonth() + 1).padStart(2, '0')}-${String(dateNow.getDate()).padStart(2, '0')}`;
  const currentPeriod = allPeriods.find((period) => period.start_date <= today && period.end_date >= today);
  const visibleYears = fiscalYears.map((year) => ({
    ...year,
    periods: (year.periods || []).filter((period) => {
      const matchesSearch = `${period.period_name} ${period.period_number}`.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch && (statusFilter === 'ALL' || period.status === statusFilter);
    }),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Fiscal Period Management</h1>
          <p className="text-xs text-slate-500 mt-1">Configure reporting calendars and control posting access by period.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create Fiscal Year</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"><div className="text-xs text-slate-500">Total periods</div><div className="mt-1 text-2xl font-bold">{allPeriods.length}</div></div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4"><div className="text-xs text-emerald-700">Open periods</div><div className="mt-1 text-2xl font-bold text-emerald-800">{allPeriods.filter((p) => p.status === 'OPEN').length}</div></div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"><div className="text-xs text-slate-500">Closed periods</div><div className="mt-1 text-2xl font-bold">{allPeriods.filter((p) => p.status === 'CLOSED').length}</div></div>
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4"><div className="text-xs text-cyan-800">Current reporting period</div><div className="mt-1 text-lg font-bold text-cyan-950">{currentPeriod?.period_name || 'No period for today'}</div></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
        <input aria-label="Search periods" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search period name or number" className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <select aria-label="Filter period status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="ALL">All statuses</option><option value="OPEN">Open</option><option value="CLOSED">Closed</option></select>
      </div>

      {fiscalYears.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 text-sm mb-4">No Fiscal Year has been created for this company yet.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-sky-600 text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-sky-700 transition"
          >
            Create First Fiscal Year
          </button>
        </div>
      ) : (
        visibleYears.map((fy) => (
          <div key={fy.fiscal_year_id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800 uppercase">Fiscal year</span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{fy.year_name}</h2>
                <p className="text-xs text-slate-500">{fy.start_date} to {fy.end_date}</p>
              </div>
              <span className="text-xs text-slate-400">{(fy.periods || []).length} accounting periods</span>
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {fy.periods.length === 0 ? <div className="sm:col-span-2 lg:col-span-4 text-sm text-slate-500 py-6 text-center">No periods match these filters.</div> : fy.periods.map((p) => {
                const isOpen = p.status === 'OPEN';
                return (
                  <div
                    key={p.period_id}
                    className={`p-3.5 rounded-lg border ${
                      isOpen ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50'
                    } flex justify-between items-center`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Period {p.period_number}: {p.period_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {p.start_date} to {p.end_date}
                      </div>
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end">
                      <button
                        onClick={() => handleToggle(p.period_id, isOpen ? 'CLOSED' : 'OPEN')}
                        className={`text-xs px-2.5 py-1.5 rounded font-medium transition ${isOpen ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                      >{isOpen ? 'Close' : 'Reopen'}</button>
                      <button onClick={() => showHistory(p)} className="text-[11px] text-sky-700 hover:underline">History</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}


      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base">Define New Fiscal Year</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fiscal Year Label</label>
                <input
                  type="text"
                  required
                  value={formData.year_name}
                  onChange={(e) => setFormData({ ...formData, year_name: e.target.value })}
                  className="w-full text-sm px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full text-sm px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full text-sm px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2 rounded-lg transition mt-2"
              >
                {submitting ? 'Generating periods...' : 'Generate Fiscal Year & Periods'}
              </button>
            </form>
          </div>
        </div>
      )}
      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="font-bold text-slate-900 dark:text-white">Period status history</h3><p className="text-xs text-slate-500 mt-1">{historyPeriod?.period_name}</p></div>
              <button onClick={() => setHistoryOpen(false)} aria-label="Close history" className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            {periodHistory.length ? <div className="space-y-2 max-h-80 overflow-y-auto">{periodHistory.map((entry) => <div key={entry.history_id} className="flex justify-between gap-4 rounded-lg border border-slate-200 dark:border-slate-700 p-3"><div className="text-sm"><span className="font-semibold">{entry.previous_status}</span><span className="mx-2 text-slate-400">→</span><span className="font-semibold">{entry.new_status}</span><div className="mt-1 text-xs text-slate-500">By {entry.changed_by}</div></div><time className="text-xs text-slate-500">{new Date(entry.changed_at).toLocaleString()}</time></div>)}</div> : <p className="py-8 text-center text-sm text-slate-500">No status changes have been recorded for this period.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

