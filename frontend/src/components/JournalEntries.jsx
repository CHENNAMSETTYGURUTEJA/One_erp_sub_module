import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Plus, X, Check, AlertTriangle, ArrowRight } from 'lucide-react';

const todayIso = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export default function JournalEntries({
  accounts,
  fiscalYears,
  currentCompanyId,
  currentCompany,
  onRefresh,
  onToast,
}) {
  const [entries, setEntries] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [headerData, setHeaderData] = useState({
    period_id: '',
    entry_date: todayIso(),
    description: '',
    reference: '',
  });

  const [lines, setLines] = useState([
    { account_id: accounts[0]?.account_id || '', debit: '', credit: '', description: '' },
    { account_id: accounts[1]?.account_id || '', debit: '', credit: '', description: '' },
  ]);

  useEffect(() => {
    loadEntries();
  }, [currentCompanyId]);

  useEffect(() => {

    const allPeriods = fiscalYears.flatMap((fy) => fy.periods || []);
    const openP = allPeriods.find((p) => p.status === 'OPEN') || allPeriods[0];
    if (openP && !headerData.period_id) {
      setHeaderData((prev) => ({ ...prev, period_id: openP.period_id }));
    }
  }, [fiscalYears]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const res = await api.getJournalEntries(currentCompanyId);
      setEntries(res.data || []);
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


  const addLine = () => {
    setLines([
      ...lines,
      { account_id: accounts[0]?.account_id || '', debit: '', credit: '', description: '' },
    ]);
  };

  const removeLine = (idx) => {
    if (lines.length <= 2) {
      onToast('warning', 'Journal entries must have at least 2 lines (debit & credit)');
      return;
    }
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx, field, value) => {
    const updated = [...lines];
    updated[idx][field] = value;
    setLines(updated);
  };


  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit > 0 && diff < 0.001;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isBalanced) {
      onToast('error', 'Debits and Credits must balance before saving.');
      return;
    }

    try {
      const validLines = lines
        .map((l) => ({
          account_id: Number(l.account_id),
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description || headerData.description,
        }))
        .filter((l) => l.debit > 0 || l.credit > 0);

      await api.createJournalEntry({
        company_id: currentCompanyId,
        period_id: Number(headerData.period_id),
        entry_date: headerData.entry_date,
        description: headerData.description.trim(),
        reference: headerData.reference.trim() || null,
        lines: validLines,
      });

      onToast('success', 'Journal Voucher created as Draft!');
      setModalOpen(false);
      setHeaderData({
        period_id: headerData.period_id,
        entry_date: todayIso(),
        description: '',
        reference: '',
      });
      loadEntries();
      onRefresh();
    } catch (err) {
      onToast('error', err.message);
    }
  };

  const handlePost = async (id) => {
    try {
      await api.postJournalEntry(id);
      onToast('success', 'Journal Voucher posted to General Ledger and Account Balances updated!');
      loadEntries();
      onRefresh();
    } catch (err) {
      onToast('error', err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Journal Entries & GL Posting</h1>
          <p className="text-xs text-slate-500 mt-1">
            Record double-entry financial vouchers. Total Debit must strictly equal Total Credit before posting.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal Entry</span>
        </button>
      </div>


      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-700 uppercase">Journal Vouchers Register</span>
          <span className="text-xs text-slate-500">{entries.length} recorded entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/70 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description / Reference</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Credit</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 text-xs">
                    No journal vouchers recorded yet. Click "New Journal Entry" to create one.
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.journal_entry_id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">{e.entry_number}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{e.entry_date}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{e.description}</div>
                      {e.reference && <div className="text-[11px] text-slate-400">Ref: {e.reference}</div>}
                    </td>
                    <td className="py-3 px-4 text-right num-align font-semibold text-slate-800">
                      {formatCurrency(e.total_debit)}
                    </td>
                    <td className="py-3 px-4 text-right num-align font-semibold text-slate-800">
                      {formatCurrency(e.total_credit)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          e.status === 'POSTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {e.status === 'DRAFT' ? (
                        <button
                          onClick={() => handlePost(e.journal_entry_id)}
                          className="text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded shadow-sm transition"
                        >
                          Post to GL
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Posted ✓</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Create Journal Voucher (Double-Entry)</h3>
                <p className="text-xs text-slate-500">Every debit leg must have an equivalent credit balance.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Financial Period *</label>
                  <select
                    value={headerData.period_id}
                    onChange={(e) => setHeaderData({ ...headerData, period_id: e.target.value })}
                    required
                    className="w-full text-sm px-3 py-2 border rounded-lg bg-white"
                  >
                    {fiscalYears
                      .flatMap((fy) => fy.periods || [])
                      .map((p) => (
                        <option
                          key={p.period_id}
                          value={p.period_id}
                          disabled={p.status === 'CLOSED'}
                        >
                          {p.period_name} {p.status === 'CLOSED' ? '(CLOSED)' : ''}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Entry Date *</label>
                  <input
                    type="date"
                    required
                    value={headerData.entry_date}
                    onChange={(e) => setHeaderData({ ...headerData, entry_date: e.target.value })}
                    className="w-full text-sm px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Narration *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paid Office Rent for April"
                  value={headerData.description}
                  onChange={(e) => setHeaderData({ ...headerData, description: e.target.value })}
                  className="w-full text-sm px-3 py-2 border rounded-lg"
                />
              </div>


              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase">Debit & Credit Lines</span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-xs text-sky-600 font-semibold hover:underline"
                  >
                    + Add Line
                  </button>
                </div>
                <div className="space-y-2">
                  {lines.map((l, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <select
                          value={l.account_id}
                          onChange={(e) => updateLine(idx, 'account_id', e.target.value)}
                          className="w-full text-xs px-2 py-2 border rounded bg-white"
                        >
                          {accounts.map((a) => (
                            <option key={a.account_id} value={a.account_id}>
                              [{a.account_code}] {a.account_name} ({a.account_type})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Debit"
                          value={l.debit}
                          onChange={(e) => updateLine(idx, 'debit', e.target.value)}
                          className="w-full text-xs px-2 py-2 border rounded text-right"
                        />
                      </div>
                      <div className="col-span-3 flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Credit"
                          value={l.credit}
                          onChange={(e) => updateLine(idx, 'credit', e.target.value)}
                          className="w-full text-xs px-2 py-2 border rounded text-right"
                        />
                        {lines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="text-rose-500 font-bold px-1 hover:text-rose-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>


              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                <div>
                  Total Debit: <span className="font-bold text-slate-800">{formatCurrency(totalDebit)}</span> |
                  Total Credit: <span className="font-bold text-slate-800">{formatCurrency(totalCredit)}</span>
                </div>
                <div>
                  {isBalanced ? (
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Balanced ✓
                    </span>
                  ) : (
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> Difference: {formatCurrency(diff)} (Unbalanced)
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!isBalanced}
                className={`w-full font-semibold text-sm py-2.5 rounded-lg transition ${
                  isBalanced
                    ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-md'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isBalanced ? 'Save Balanced Journal Voucher (Draft)' : 'Debits and Credits must balance to Save'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

