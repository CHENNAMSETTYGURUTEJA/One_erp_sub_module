import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Database,
  ChevronDown,
  User,
  LogOut,
  Search,
  Menu,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function Header({
  companies,
  currentCompanyId,
  onSelectCompany,
  activePeriod,
  user,
  activeTab,
  onSelectTab,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenProfile,
  onLogout,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const searchableModules = [
    { id: 'dashboard', name: 'Executive Dashboard', cat: 'Overview' },
    { id: 'company-setup', name: 'Company Setup', cat: 'Master Data' },
    { id: 'fiscal-years', name: 'Fiscal Years & Periods', cat: 'Master Data' },
    { id: 'accounts', name: 'Chart of Accounts', cat: 'FICO' },
    { id: 'journal-entries', name: 'Journal Entries & Posting', cat: 'FICO' },
    { id: 'general-ledger', name: 'General Ledger', cat: 'FICO' },
    { id: 'trial-balance', name: 'Trial Balance', cat: 'FICO' },
    { id: 'ap', name: 'Accounts Payable (AP Invoices)', cat: 'Subledgers' },
    { id: 'ar', name: 'Accounts Receivable (AR Invoices)', cat: 'Subledgers' },
    { id: 'assets', name: 'Fixed Assets Management', cat: 'Subledgers' },
    { id: 'budget', name: 'Budgeting & Variances', cat: 'Subledgers' },
    { id: 'gst', name: 'GST Tax Compliance', cat: 'Taxation' },
    { id: 'reports', name: 'P&L and Balance Sheet Reports', cat: 'Reports' },
  ];

  const filteredModules = searchQuery.trim()
    ? searchableModules.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.cat.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchableModules;


  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    }

    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const initials = (user?.username || 'Admin').slice(0, 2).toUpperCase();
  const currentCompany = companies.find((c) => c.company_id === currentCompanyId);

  const currentTabLabel =
    searchableModules.find((m) => m.id === activeTab)?.name || 'Dashboard';

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 z-20 shrink-0 transition-colors">

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            S
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                STACKLY
              </span>
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 px-1.5 py-0.5 bg-sky-50 dark:bg-sky-950/60 rounded border border-sky-200 dark:border-sky-800">
                OneERP
              </span>
            </div>
            <div className="hidden lg:flex items-center text-[11px] text-slate-400 font-medium">
              <span>{currentCompany?.company_name || 'Cloud Platform'}</span>
              <ChevronRight className="w-3 h-3 mx-1 text-slate-400" />
              <span className="text-sky-600 dark:text-sky-400 font-semibold">{currentTabLabel}</span>
            </div>
          </div>
        </div>
      </div>


      <div className="hidden md:block relative max-w-xs w-full mx-4" ref={searchRef}>
        <div
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:border-sky-400 dark:hover:border-sky-500 transition"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="flex-1 truncate">Quick search...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-400 font-mono">
            Ctrl+K
          </kbd>
        </div>

        {searchOpen && (
          <div className="absolute top-10 left-0 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in duration-150">
            <div className="px-3 pb-2 border-b border-slate-100 dark:border-slate-700">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Quick search..."
                autoFocus
                className="w-full bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 rounded-lg outline-none border border-slate-200 dark:border-slate-700 focus:border-sky-500"
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
              {filteredModules.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelectTab(m.id);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full px-3 py-2 text-left rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                    activeTab === m.id
                      ? 'bg-sky-50 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <span>{m.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{m.cat}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>


      <div className="flex items-center gap-2.5">

        {activePeriod && (
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
            <span>{activePeriod.period_name}</span>
          </div>
        )}


        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 p-1 pl-2.5 rounded-lg border border-slate-200 dark:border-slate-700 transition">
          <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <select
            value={currentCompanyId || ''}
            onChange={(e) => onSelectCompany(Number(e.target.value))}
            className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-1 max-w-[130px] sm:max-w-none truncate"
          >
            {companies.map((c) => (
              <option key={c.company_id} value={c.company_id} className="dark:bg-slate-800">
                {c.company_code} - {c.company_name}
              </option>
            ))}
          </select>
        </div>


        <div className="hidden 2xl:flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">MySQL Active</span>
        </div>


        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 py-1 pr-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {user?.username || 'Admin User'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-wide">
                {user?.role || 'SUPERUSER'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>


          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.username || 'Admin User'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'admin@saponeerp.local'}
                </p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded">
                  {user?.role || 'ACCOUNTANT'}
                </span>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Edit Profile Details</span>
                </button>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
