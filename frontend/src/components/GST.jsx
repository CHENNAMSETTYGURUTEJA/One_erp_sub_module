import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Plus, X, Search, Download, ShieldCheck, FileCheck } from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';

export default function GST({
  currentCompanyId,
  currentCompany,
  onRefresh,
  onToast,
}) {
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    transaction_ref: '',
    hsn_sac: '998313',
    taxable_value: '',
    cgst_rate_percent: 9.0,
    sgst_rate_percent: 9.0,
    igst_rate_percent: 0.0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadGST();
  }, [currentCompanyId]);

  const loadGST = async () => {
    try {
      const res = await api.getGSTRecords(currentCompanyId);
      setRecords(res.data || []);
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

  const totalTaxable = records.reduce((sum, r) => sum + (r.taxable_value || 0), 0);
  const totalCGST = records.reduce((sum, r) => sum + (r.cgst_amount || 0), 0);
  const totalSGST = records.reduce((sum, r) => sum + (r.sgst_amount || 0), 0);
  const totalIGST = records.reduce((sum, r) => sum + (r.igst_amount || 0), 0);
  const totalTax = records.reduce((sum, r) => sum + (r.total_tax || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.recordGST({
        company_id: currentCompanyId,
        transaction_ref: formData.transaction_ref.trim(),
        hsn_sac: formData.hsn_sac.trim(),
        taxable_value: parseFloat(formData.taxable_value),
        cgst_rate_percent: parseFloat(formData.cgst_rate_percent) || 0,
        sgst_rate_percent: parseFloat(formData.sgst_rate_percent) || 0,
        igst_rate_percent: parseFloat(formData.igst_rate_percent) || 0,
      });
      onToast('success', 'GST transaction calculated and recorded!');
      setModalOpen(false);
      setFormData({
        transaction_ref: '',
        hsn_sac: '998313',
        taxable_value: '',
        cgst_rate_percent: 9.0,
        sgst_rate_percent: 9.0,
        igst_rate_percent: 0.0,
      });
      loadGST();
      onRefresh();
    } catch (err) {
      onToast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.transaction_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.hsn_sac.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleExport = () => {
    const headers = [
      { label: 'Transaction Ref', accessor: 'transaction_ref' },
      { label: 'HSN / SAC Code', accessor: 'hsn_sac' },
      { label: 'Taxable Base Value', accessor: 'taxable_value' },
      { label: 'CGST (Central Tax)', accessor: 'cgst_amount' },
      { label: 'SGST (State Tax)', accessor: 'sgst_amount' },
      { label: 'IGST (Integrated Tax)', accessor: 'igst_amount' },
      { label: 'Total Tax Liability', accessor: 'total_tax' },
    ];
    exportToCSV(`GST_Compliance_${currentCompany?.company_code || 'ALL'}`, headers, filteredRecords);
    onToast('success', 'GST records exported to CSV.');
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Goods & Services Tax (GST)</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated statutory tax split (CGST, SGST, IGST) conforming to Indian GST compliance.
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
            <span>Record GST Invoice</span>
          </button>
        </div>
      </div>


      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Taxable Base</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mt-1 num-align">
            {formatCurrency(totalTaxable)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">CGST (Central)</div>
          <div className="text-lg font-bold text-sky-600 dark:text-sky-400 mt-1 num-align">
            {formatCurrency(totalCGST)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">SGST (State)</div>
          <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1 num-align">
            {formatCurrency(totalSGST)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">IGST (Interstate)</div>
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1 num-align">
            {formatCurrency(totalIGST)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm col-span-2 lg:col-span-1">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total Tax Liability</div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 num-align">
            {formatCurrency(totalTax)}
          </div>
        </div>
      </div>


      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transaction ref or HSN..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>


      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-3.5 px-4">Transaction Ref</th>
              <th className="py-3.5 px-4">HSN / SAC</th>
              <th className="py-3.5 px-4 text-right">Taxable Base</th>
              <th className="py-3.5 px-4 text-right">CGST</th>
              <th className="py-3.5 px-4 text-right">SGST</th>
              <th className="py-3.5 px-4 text-right">IGST</th>
              <th className="py-3.5 px-4 text-right">Total Tax</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400 text-xs">
                  No GST entries matching filter.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => (
                <tr key={r.gst_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">{r.transaction_ref}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                      {r.hsn_sac}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right num-align text-slate-900 dark:text-white font-semibold">
                    {formatCurrency(r.taxable_value)}
                  </td>
                  <td className="py-3.5 px-4 text-right num-align text-sky-600 dark:text-sky-400">
                    {r.cgst_amount > 0 ? formatCurrency(r.cgst_amount) : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right num-align text-indigo-600 dark:text-indigo-400">
                    {r.sgst_amount > 0 ? formatCurrency(r.sgst_amount) : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right num-align text-purple-600 dark:text-purple-400">
                    {r.igst_amount > 0 ? formatCurrency(r.igst_amount) : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right num-align font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(r.total_tax)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>


      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Record GST Transaction</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Invoice / Ref #</label>
                  <input
                    type="text"
                    required
                    placeholder="STACKLY01-GST-2601"
                    value={formData.transaction_ref}
                    onChange={(e) => setFormData({ ...formData, transaction_ref: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    required
                    placeholder="998313"
                    value={formData.hsn_sac}
                    onChange={(e) => setFormData({ ...formData, hsn_sac: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Taxable Base Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="100000.00"
                  value={formData.taxable_value}
                  onChange={(e) => setFormData({ ...formData, taxable_value: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">CGST %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.cgst_rate_percent}
                    onChange={(e) => setFormData({ ...formData, cgst_rate_percent: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">SGST %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.sgst_rate_percent}
                    onChange={(e) => setFormData({ ...formData, sgst_rate_percent: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">IGST %</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.igst_rate_percent}
                    onChange={(e) => setFormData({ ...formData, igst_rate_percent: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>
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
                  {submitting ? 'Calculating...' : 'Record GST'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
