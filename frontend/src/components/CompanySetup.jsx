import React, { useState } from 'react';
import { api } from '../api/client';
import { Building2, Plus, Check } from 'lucide-react';

const currentFiscalYearStart = () => {
  const today = new Date();
  const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return `${year}-04-01`;
};

export default function CompanySetup({
  companies,
  currentCompanyId,
  onSelectCompany,
  onCompanyCreated,
  onToast,
}) {
  const [formData, setFormData] = useState({
    company_name: '',
    company_code: '',
    country: 'India',
    currency: 'INR',
    financial_year_start: currentFiscalYearStart(),
    company_address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.createCompany({
        ...formData,
        company_code: formData.company_code.trim().toUpperCase(),
        currency: formData.currency.trim().toUpperCase(),
      });
      onToast('success', `Company ${formData.company_code} created and default Chart of Accounts seeded!`, 'Success');
      setFormData({
        company_name: '',
        company_code: '',
        country: 'India',
        currency: 'INR',
        financial_year_start: currentFiscalYearStart(),
        company_address: '',
      });
      onCompanyCreated(res.data.company_id);
    } catch (err) {
      onToast('error', err.message, 'Company Creation Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Company Setup</h1>
        <p className="text-xs text-slate-500 mt-1">
          Establish organizational entities, legal details, currency, and financial year start in MySQL.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-600" />
            <span>Register New Company</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="e.g. STACKLY Technologies Private Limited"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company Code * (Unique)
              </label>
              <input
                type="text"
                required
                value={formData.company_code}
                onChange={(e) => setFormData({ ...formData, company_code: e.target.value })}
                placeholder="e.g. STACKLY01"
                className="w-full text-sm uppercase font-mono px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none transition"
              />
              <p className="text-[11px] text-slate-400 mt-1">Alphanumeric identifier used across ERP accounting.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Currency *
                </label>
                <input
                  type="text"
                  required
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full text-sm uppercase font-mono px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Financial Year Start *
              </label>
              <input
                type="date"
                required
                value={formData.financial_year_start}
                onChange={(e) => setFormData({ ...formData, financial_year_start: e.target.value })}
                className="w-full text-sm px-3 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Registered Address *
              </label>
              <textarea
                required
                rows={3}
                value={formData.company_address}
                onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                placeholder="Plot 42, Electronic City Phase 1, Bengaluru..."
                className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2.5 rounded-lg transition shadow-md flex items-center justify-center gap-2"
            >
              <span>💾</span>
              <span>{submitting ? 'Saving to MySQL...' : 'Save Company to Database'}</span>
            </button>
          </form>
        </div>


        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>📋 Registered Companies in Database</span>
            <span className="text-xs font-normal text-slate-500">{companies.length} records</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Currency</th>
                  <th className="py-3 px-4">FY Start</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((c) => {
                  const isSelected = c.company_id === currentCompanyId;
                  return (
                    <tr
                      key={c.company_id}
                      className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-sky-50/50' : ''}`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-sky-700">{c.company_code}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{c.company_name}</td>
                      <td className="py-3 px-4 text-slate-600">{c.country}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{c.currency}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{c.financial_year_start}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectCompany(c.company_id)}
                          className={`text-xs px-2.5 py-1 rounded font-medium transition ${
                            isSelected
                              ? 'bg-sky-600 text-white font-semibold'
                              : 'bg-slate-100 hover:bg-sky-100 hover:text-sky-800 text-slate-700'
                          }`}
                        >
                          {isSelected ? 'Active Context ✓' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

