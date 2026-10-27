import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Plus, X, Search, Download, Filter, TrendingDown } from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';

const todayIso = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export default function FixedAssets({
  currentCompanyId,
  currentCompany,
  onRefresh,
  onToast,
}) {
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    asset_code: '',
    asset_name: '',
    category: 'IT Infrastructure',
    purchase_cost: '',
    purchase_date: todayIso(),
  });
  const [submitting, setSubmitting] = useState(false);


  const [deprModalOpen, setDeprModalOpen] = useState(false);
  const [activeAsset, setActiveAsset] = useState(null);
  const [deprAmount, setDeprAmount] = useState('');

  useEffect(() => {
    loadAssets();
  }, [currentCompanyId]);

  const loadAssets = async () => {
    try {
      const res = await api.getAssets(currentCompanyId);
      setAssets(res.data || []);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createAsset({
        company_id: currentCompanyId,
        ...formData,
        asset_code: formData.asset_code.trim().toUpperCase(),
        purchase_cost: parseFloat(formData.purchase_cost),
      });
      onToast('success', 'Fixed Asset registered successfully!');
      setModalOpen(false);
      setFormData({
        asset_code: '',
        asset_name: '',
        category: 'IT Infrastructure',
        purchase_cost: '',
        purchase_date: todayIso(),
      });
      loadAssets();
      onRefresh();
    } catch (err) {
      onToast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepreciate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.depreciateAsset(activeAsset.asset_id, parseFloat(deprAmount));
      onToast('success', 'Asset depreciation recorded successfully!');
      setDeprModalOpen(false);
      setDeprAmount('');
      setActiveAsset(null);
      loadAssets();
      onRefresh();
    } catch (err) {
      onToast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.asset_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', ...new Set(assets.map((a) => a.category))];

  const handleExport = () => {
    const headers = [
      { label: 'Asset Code', accessor: 'asset_code' },
      { label: 'Asset Name', accessor: 'asset_name' },
      { label: 'Category', accessor: 'category' },
      { label: 'Purchase Date', accessor: 'purchase_date' },
      { label: 'Historical Cost', accessor: 'purchase_cost' },
      { label: 'Accumulated Depreciation', accessor: 'accumulated_depreciation' },
      { label: 'Net Book Value', accessor: 'current_net_value' },
      { label: 'Status', accessor: 'status' },
    ];
    exportToCSV(`Fixed_Assets_${currentCompany?.company_code || 'ALL'}`, headers, filteredAssets);
    onToast('success', 'Fixed Assets exported to CSV.');
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Fixed Assets Register</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Capital asset capitalization, historical cost, and straight-line depreciation ledger.
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
            <span>Register Capital Asset</span>
          </button>
        </div>
      </div>


      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search asset code or name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? `All Categories (${assets.length})` : c}
              </option>
            ))}
          </select>
        </div>
      </div>


      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-3.5 px-4">Asset Code</th>
              <th className="py-3.5 px-4">Asset Description</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Capitalized Date</th>
              <th className="py-3.5 px-4 text-right">Cost</th>
              <th className="py-3.5 px-4 text-right">Acc. Depreciation</th>
              <th className="py-3.5 px-4 text-right">Net Book Value</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-400 text-xs">
                  No assets matching filter criteria.
                </td>
              </tr>
            ) : (
              filteredAssets.map((a) => (
                <tr key={a.asset_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">{a.asset_code}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">{a.asset_name}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                      {a.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">{a.purchase_date}</td>
                  <td className="py-3.5 px-4 text-right num-align text-slate-900 dark:text-white font-semibold">
                    {formatCurrency(a.purchase_cost)}
                  </td>
                  <td className="py-3.5 px-4 text-right num-align text-rose-600 dark:text-rose-400">
                    -{formatCurrency(a.accumulated_depreciation)}
                  </td>
                  <td className="py-3.5 px-4 text-right num-align font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(a.current_net_value)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        setActiveAsset(a);
                        setDeprAmount('');
                        setDeprModalOpen(true);
                      }}
                      className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold px-3 py-1 rounded-lg transition cursor-pointer"
                    >
                      Depreciate
                    </button>
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
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Register Fixed Asset</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Asset Code</label>
                  <input
                    type="text"
                    required
                    placeholder="FA-IT-003"
                    value={formData.asset_code}
                    onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value="IT Infrastructure">IT Infrastructure</option>
                    <option value="IT Hardware">IT Hardware</option>
                    <option value="Machinery & Plant">Machinery & Plant</option>
                    <option value="Vehicles & Logistics">Vehicles & Logistics</option>
                    <option value="Furniture & Fixtures">Furniture & Fixtures</option>
                    <option value="Facilities & Buildings">Facilities & Buildings</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Asset Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cisco Enterprise Core Router Switch"
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Historical Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="120000.00"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
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
                  {submitting ? 'Capitalizing...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {deprModalOpen && activeAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Record Depreciation</h3>
              <button onClick={() => setDeprModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Writing down asset book value for <b>{activeAsset.asset_name}</b> ({activeAsset.asset_code}). Current Book Value: <b>{formatCurrency(activeAsset.current_net_value)}</b>.
            </p>
            <form onSubmit={handleDepreciate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Depreciation Write-Down Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={activeAsset.current_net_value}
                  value={deprAmount}
                  onChange={(e) => setDeprAmount(e.target.value)}
                  placeholder="e.g. 15000.00"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeprModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700"
                >
                  {submitting ? 'Applying...' : 'Post Depreciation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
