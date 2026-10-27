import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import Toast from './components/Toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CompanySetup from './components/CompanySetup';
import FiscalYears from './components/FiscalYears';
import AccountsReceivable from './components/AccountsReceivable';
import LoginPage from './components/LoginPage';
import ProfileModal from './components/ProfileModal';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('oneerp_token'));
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('oneerp_sidebar') === 'collapsed');

  const [activeTab, setActiveTab] = useState('company-setup');
  const [companies, setCompanies] = useState([]);
  const [currentCompanyId, setCurrentCompanyId] = useState(null);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [activePeriod, setActivePeriod] = useState(null);
  const [toasts, setToasts] = useState([]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('oneerp_sidebar', next ? 'collapsed' : 'expanded');
      return next;
    });
  };

  const addToast = (type, message, title = '') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };


  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('oneerp_token');
      if (token) {
        try {
          const res = await api.getProfile();
          if (res.success && res.data) {
            setUser(res.data);
            setIsAuthenticated(true);
            await loadCompanies();
          } else {
            api.logout();
            setIsAuthenticated(false);
          }
        } catch (err) {
          api.logout();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setIsAuthChecking(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentCompanyId) {
      loadCompanyContext(currentCompanyId);
    }
  }, [isAuthenticated, currentCompanyId]);

  const loadCompanies = async () => {
    try {
      const res = await api.getCompanies();
      const list = res.data || [];
      setCompanies(list);

      const storedId = Number(localStorage.getItem('selected_company_id'));
      const found = list.find((c) => c.company_id === storedId);

      if (found) {
        setCurrentCompanyId(storedId);
      } else if (list.length > 0) {
        setCurrentCompanyId(list[0].company_id);
      }
    } catch (err) {
      addToast('error', err.message, 'Failed to Load Companies');
    }
  };

  const loadCompanyContext = async (companyId) => {
    try {
      const fyRes = await api.getFiscalYears(companyId);
      const fYears = fyRes.data || [];
      setFiscalYears(fYears);

      if (fYears.length > 0) {
        const allP = fYears.flatMap((fy) => fy.periods || []);
        const today = new Date();
        const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const current = allP.find((p) => p.start_date <= todayText && p.end_date >= todayText);
        setActivePeriod(current || allP.find((p) => p.status === 'OPEN') || null);
      } else {
        setActivePeriod(null);
      }
    } catch (err) {
      console.warn('Context load note:', err);
    }
  };

  const handleSelectCompany = (id) => {
    setCurrentCompanyId(id);
    localStorage.setItem('selected_company_id', id);
    addToast('info', 'Active company context updated.');
  };

  const handleCompanyCreated = async (newCompanyId) => {
    await loadCompanies();
    if (newCompanyId) {
      handleSelectCompany(newCompanyId);
    }
  };

  const handleLoginSuccess = async (loginData) => {
    setUser(loginData);
    setIsAuthenticated(true);
    addToast('success', `Welcome back, ${loginData.username}!`, 'Signed In');
    await loadCompanies();
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setUser(null);
    addToast('info', 'You have signed out of your account.', 'Logged Out');
  };

  const handleProfileUpdated = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };


  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm font-medium">Initializing STACKLY OneERP...</span>
        </div>
      </div>
    );
  }


  if (!isAuthenticated) {
    return (
      <>
        <Toast toasts={toasts} onDismiss={removeToast} />
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  const currentCompany = companies.find((c) => c.company_id === currentCompanyId) || null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-800 transition-colors">
      <Toast toasts={toasts} onDismiss={removeToast} />


      {profileModalOpen && (
        <ProfileModal
          user={user}
          onClose={() => setProfileModalOpen(false)}
          onProfileUpdated={handleProfileUpdated}
          onToast={addToast}
        />
      )}

      <Header
        companies={companies}
        currentCompanyId={currentCompanyId}
        onSelectCompany={handleSelectCompany}
        activePeriod={activePeriod}
        user={user}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        onOpenProfile={() => setProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50 transition-colors">
          {activeTab === 'company-setup' && (
            <CompanySetup
              companies={companies}
              currentCompanyId={currentCompanyId}
              onSelectCompany={handleSelectCompany}
              onCompanyCreated={handleCompanyCreated}
              onToast={addToast}
            />
          )}

          {activeTab === 'fiscal-years' && (
            <FiscalYears
              mode="years"
              fiscalYears={fiscalYears}
              currentCompanyId={currentCompanyId}
              onRefresh={() => loadCompanyContext(currentCompanyId)}
              onToast={addToast}
            />
          )}

          {activeTab === 'fiscal-periods' && (
            <FiscalYears
              mode="periods"
              fiscalYears={fiscalYears}
              currentCompanyId={currentCompanyId}
              onRefresh={() => loadCompanyContext(currentCompanyId)}
              onToast={addToast}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'ar' && (
            <AccountsReceivable
              currentCompanyId={currentCompanyId}
              currentCompany={currentCompany}
              onRefresh={() => loadCompanyContext(currentCompanyId)}
              onToast={addToast}
            />
          )}

        </main>
      </div>
    </div>
  );
}
