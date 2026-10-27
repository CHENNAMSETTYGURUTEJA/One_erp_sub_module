import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  BookOpen,
  FileSpreadsheet,
  Scale,
  Receipt,
  Users,
  Truck,
  Coins,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, collapsed, onToggleCollapse }) {
  const navSections = [
    {
      title: 'Foundation & Setup',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'company-setup', label: 'Company Setup', icon: Building2 },
        { id: 'fiscal-years', label: 'Fiscal Years & Periods', icon: Calendar },
        { id: 'accounts', label: 'Chart of Accounts', icon: BookOpen },
      ],
    },
    {
      title: 'General Ledger (FICO)',
      items: [
        { id: 'journal-entries', label: 'Journal Entries & Posting', icon: FileSpreadsheet },
        { id: 'general-ledger', label: 'General Ledger', icon: BookOpen },
        { id: 'trial-balance', label: 'Trial Balance', icon: Scale },
      ],
    },
    {
      title: 'Subledgers & Operations',
      items: [
        { id: 'ap', label: 'Accounts Payable (AP)', icon: Receipt },
        { id: 'ar', label: 'Accounts Receivable (AR)', icon: Users },
        { id: 'assets', label: 'Fixed Assets', icon: Truck },
        { id: 'budget', label: 'Budgeting & Variance', icon: Coins },
        { id: 'gst', label: 'GST Tax Compliance', icon: ShieldCheck },
      ],
    },
    {
      title: 'Financial Statements',
      items: [
        { id: 'reports', label: 'P&L and Balance Sheet', icon: BarChart3 },
      ],
    },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-all duration-300 z-10 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-3 overflow-y-auto space-y-5">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            {!collapsed && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1.5 truncate">
                {sec.title}
              </div>
            )}
            <nav className="space-y-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      collapsed ? 'justify-center px-2' : 'justify-start px-3'
                    } py-2.5 rounded-xl text-xs font-medium transition cursor-pointer group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-600/25 font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-600'}`} />
                    {!collapsed && <span className="ml-3 truncate">{item.label}</span>}


                    {collapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 bg-white text-slate-800 text-[11px] rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 border border-slate-200">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
