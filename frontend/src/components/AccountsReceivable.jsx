import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Plus, X, Search, Download, Filter } from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';

const todayIso = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export default function AccountsReceivable({
  currentCompanyId,
  currentCompany,
  onRefresh,
  onToast,
}) {
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [ageing, setAgeing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    invoice_number: '',
    total_amount: '',
    invoice_date: todayIso(),
    due_date: '',
  });
  const [submitting, setSubmitting] = useState(false);


  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState(todayIso());
  const [receiptReference, setReceiptReference] = useState('');

  useEffect(() => {
    loadInvoices();
  }, [currentCompanyId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const reportDate = todayIso();
      const [res, receiptRes, ageingRes] = await Promise.all([
        api.getARInvoices(currentCompanyId), api.getARReceipts(currentCompanyId), api.getARAgeing(currentCompanyId, reportDate),
      ]);
      setInvoices(res.data || []);
      setReceipts(receiptRes.data || []);
      setAgeing(ageingRes.data || null);
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

  const today = todayIso();
  const outstandingInvoices = invoices.filter((invoice) => Number(invoice.remaining_amount) > 0);
  const overdueInvoices = outstandingInvoices.filter((invoice) => invoice.due_date < today);
  const totalOutstanding = outstandingInvoices.reduce((sum, invoice) => sum + Number(invoice.remaining_amount || 0), 0);
  const overdueOutstanding = overdueInvoices.reduce((sum, invoice) => sum + Number(invoice.remaining_amount || 0), 0);
  const periodStart = `${today.slice(0, 7)}-01`;
  const periodInvoices = invoices.filter((invoice) => invoice.invoice_date >= periodStart && invoice.invoice_date <= today);
  const periodReceipts = invoices.reduce((sum, invoice) => sum + (invoice.invoice_date >= periodStart && invoice.invoice_date <= today ? Number(invoice.received_amount || 0) : 0), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createARInvoice({
        company_id: currentCompanyId,
        ...formData,
        total_amount: parseFloat(formData.total_amount),
      });
      onToast('success', 'Customer invoice registered successfully!');
      setModalOpen(false);
      setFormData({
        customer_name: '',
        invoice_number: '',
        total_amount: '',
        invoice_date: todayIso(),
        due_date: '',
      });
      loadInvoices();
      onRefresh();
    } catch (err) {
      onToast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordReceipt = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.recordARPayment(
        activeInvoice.ar_invoice_id,
        parseFloat(receiptAmount),
        receiptReference,
        receiptDate
      );
      onToast('success', 'Customer payment receipt recorded!');
      setPayModalOpen(false);
      setReceiptAmount('');
      setReceiptDate(todayIso());
      setReceiptReference('');
      setActiveInvoice(null);
      loadInvoices();
      onRefresh();
    } catch (err) {
      onToast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };


  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch =
      i.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'OVERDUE' ? i.remaining_amount > 0 && i.due_date < today : i.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const headers = [
      { label: 'Invoice #', accessor: 'invoice_number' },
      { label: 'Customer / Client', accessor: 'customer_name' },
      { label: 'Invoice Date', accessor: 'invoice_date' },
      { label: 'Due Date', accessor: 'due_date' },
      { label: 'Total Amount', accessor: 'total_amount' },
      { label: 'Received Amount', accessor: 'received_amount' },
      { label: 'Outstanding Balance', accessor: 'remaining_amount' },
      { label: 'Status', accessor: 'status' },
    ];
    exportToCSV(`AR_Invoices_${currentCompany?.company_code || 'ALL'}`, headers, filteredInvoices);
    onToast('success', 'AR Invoices exported to CSV.');
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Accounts Receivable</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Customer sales billing, collection lifecycle tracking, and cash inflow receipts.
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
            <span>New Customer Invoice</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <button onClick={() => setStatusFilter('UNPAID')} className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"><div className="text-xs text-slate-500">Total outstanding</div><div className="mt-1 text-xl font-bold">{formatCurrency(totalOutstanding)}</div><div className="mt-1 text-xs text-slate-500">{outstandingInvoices.length} open invoices</div></button>
        <button onClick={() => setStatusFilter('OVERDUE')} className="text-left rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-sm"><div className="text-xs text-rose-700">Overdue receivables</div><div className="mt-1 text-xl font-bold text-rose-900">{formatCurrency(overdueOutstanding)}</div><div className="mt-1 text-xs text-rose-700">{overdueInvoices.length} overdue invoices</div></button>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"><div className="text-xs text-slate-500">Invoiced this month</div><div className="mt-1 text-xl font-bold">{formatCurrency(periodInvoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0))}</div><div className="mt-1 text-xs text-slate-500">{periodInvoices.length} invoices</div></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"><div className="text-xs text-slate-500">Collected against this month’s invoices</div><div className="mt-1 text-xl font-bold">{formatCurrency(periodReceipts)}</div><div className="mt-1 text-xs text-slate-500">{periodInvoices.length} invoices dated this month</div></div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><div><h2 className="font-bold text-slate-900 dark:text-white">Receivables ageing</h2><p className="text-xs text-slate-500 mt-1">Outstanding balances grouped by due date, as of {ageing?.as_of || today}.</p></div><div className="text-xs text-slate-500">Total: <b className="text-slate-900 dark:text-white">{formatCurrency(ageing?.total_outstanding || 0)}</b></div></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">{[
          ['Not yet due', 'not_yet_due'], ['1–30 days', 'days_1_30'], ['31–60 days', 'days_31_60'], ['61–90 days', 'days_61_90'], ['Over 90 days', 'over_90_days'],
        ].map(([label, key]) => <div key={key} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><div className="text-[11px] text-slate-500">{label}</div><div className="mt-1 text-sm font-bold">{formatCurrency(ageing?.buckets?.[key] || 0)}</div></div>)}</div>
      </section>


      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer or invoice #..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="ALL">All Invoices ({invoices.length})</option>
            <option value="UNPAID">Uncollected Only</option>
            <option value="PARTIAL">Partially Received</option>
            <option value="PAID">Fully Settled</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>


      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-3.5 px-4">Invoice #</th>
              <th className="py-3.5 px-4">Customer / Client</th>
              <th className="py-3.5 px-4">Due Date</th>
              <th className="py-3.5 px-4 text-right">Invoice Total</th>
              <th className="py-3.5 px-4 text-right">Collected</th>
              <th className="py-3.5 px-4 text-right">Remaining Receivable</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {loading ? (
              <tr><td colSpan="8" className="p-8 text-center text-slate-500 text-sm">Loading customer invoices…</td></tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-400 text-xs">
                  No matching AR invoices found.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((i) => (
                <tr key={i.ar_invoice_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">{i.invoice_number}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">{i.customer_name}</td>
                  <td className={`py-3.5 px-4 text-xs ${Number(i.remaining_amount) > 0 && i.due_date < today ? 'text-rose-600 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>{i.due_date}{Number(i.remaining_amount) > 0 && i.due_date < today && <span className="block text-[10px] uppercase tracking-wide">Overdue</span>}</td>
                  <td className="py-3.5 px-4 text-right num-align text-slate-900 dark:text-white font-semibold">
                    {formatCurrency(i.total_amount)}
                  </td>
                  <td className="py-3.5 px-4 text-right num-align text-emerald-600 dark:text-emerald-400 font-semibold">
                    {formatCurrency(i.received_amount)}
                  </td>
                  <td className="py-3.5 px-4 text-right num-align font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(i.remaining_amount)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        i.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : i.status === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {i.status !== 'PAID' ? (
                      <button
                        onClick={() => {
                          setActiveInvoice(i);
                          setReceiptAmount(String(i.remaining_amount));
                          setReceiptDate(todayIso());
                          setReceiptReference(globalThis.crypto?.randomUUID?.() || `RCPT-${Date.now()}`);
                          setPayModalOpen(true);
                        }}
                        className="text-xs bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold px-3 py-1 rounded-lg transition cursor-pointer"
                      >
                        Receive Payment
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Collected</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white">Recent customer receipts</h2>
          <p className="text-xs text-slate-500 mt-1">Latest 100 receipts recorded for this company.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Receipt reference</th><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Receipt date</th><th className="px-4 py-3 text-right">Amount</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">{receipts.length ? receipts.map((receipt) => <tr key={receipt.receipt_id}><td className="px-4 py-3 font-mono text-xs">{receipt.receipt_reference}</td><td className="px-4 py-3">{invoices.find((invoice) => invoice.ar_invoice_id === receipt.ar_invoice_id)?.invoice_number || `#${receipt.ar_invoice_id}`}</td><td className="px-4 py-3 text-slate-500">{receipt.receipt_date}</td><td className="px-4 py-3 text-right font-semibold">{formatCurrency(receipt.amount)}</td></tr>) : <tr><td colSpan="4" className="px-4 py-8 text-center text-sm text-slate-400">No receipts have been recorded yet.</td></tr>}</tbody>
          </table>
        </div>
      </section>


      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Issue Customer Invoice</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Customer / Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Northstar Analytics Pvt Ltd"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Invoice Number</label>
                  <input
                    type="text"
                    required
                    placeholder="STACKLY01-AR-2601"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Invoice Total</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="420000.00"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700"
                >
                  {submitting ? 'Saving...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {payModalOpen && activeInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Record Receipt</h3>
              <button onClick={() => setPayModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Recording payment inflow from <b>{activeInvoice.customer_name}</b> for Invoice #{activeInvoice.invoice_number}.
            </p>
            <form onSubmit={handleRecordReceipt} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Receipt Amount (Remaining: {formatCurrency(activeInvoice.remaining_amount)})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={activeInvoice.remaining_amount}
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Receipt Date</label>
                <input type="date" required value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700"
                >
                  {submitting ? 'Recording...' : 'Confirm Inflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
