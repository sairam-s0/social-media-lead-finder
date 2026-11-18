import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileNavigation from './components/MobileNavigation';
import LeadDetailModal from './components/LeadDetailModal';
import FirstRunWizard from './components/FirstRunWizard';

import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Automation from './pages/Automation';
import SearchQueries from './pages/SearchQueries';
import Settings from './pages/Settings';

import { getSettings, triggerFullSearchPipeline, updateLead, ensureSessionToken } from './services/api';

const App = () => {
  const location = useLocation();
  const [branding, setBranding] = useState({
    company_name: 'LeadPulse AI',
    company_tagline: 'Automated Social Lead Discovery Engine',
    company_logo: '⚡',
  });
  const [healthStatus, setHealthStatus] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchRunMetrics, setSearchRunMetrics] = useState(null);
  const [showFirstRunWizard, setShowFirstRunWizard] = useState(false);
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const fetchBrandingAndHealth = async () => {
    try {
      await ensureSessionToken();
      const res = await getSettings();
      if (res.success) {
        if (res.settings) {
          setBranding((prev) => ({
            ...prev,
            company_name: res.settings.company_name || prev.company_name,
            company_tagline: res.settings.company_tagline || prev.company_tagline,
            company_logo: res.settings.company_logo || prev.company_logo,
          }));

          // Trigger First-Run Wizard if setup not yet finalized
          if (res.settings.first_run_completed !== 'true' && !res.vault?.exa_configured) {
            setShowFirstRunWizard(true);
          }
        }
        setHealthStatus(res.system_health);
      }
    } catch (err) {
      console.error('Failed to load branding/health:', err);
    }
  };

  useEffect(() => {
    fetchBrandingAndHealth();
  }, []);

  const handleRunSearch = async (options = {}) => {
    try {
      setIsSearching(true);
      showNotification('🔍 Scanning social platforms & live web for leads...', 'info');
      const metrics = await triggerFullSearchPipeline(options);
      setSearchRunMetrics(metrics);
      window.dispatchEvent(new Event('lead_data_updated'));
      const found = metrics?.new_leads_found ?? 0;
      if (found > 0) {
        showNotification(`✨ Found ${found} new prospective client leads!`, 'success');
      } else {
        showNotification('✅ Lead discovery scan complete! Latest leads loaded.', 'info');
      }
    } catch (err) {
      console.error('Manual search trigger failed:', err);
      showNotification('⚠️ Lead scan completed with offline fallback.', 'info');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      const res = await updateLead(leadId, { status: newStatus });
      if (res.success) {
        setSelectedLead(res.lead);
        window.dispatchEvent(new Event('lead_data_updated'));
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  const handleSaveLeadNotes = async (leadId, notes) => {
    try {
      const res = await updateLead(leadId, { notes });
      if (res.success) {
        setSelectedLead(res.lead);
        window.dispatchEvent(new Event('lead_data_updated'));
      }
    } catch (err) {
      console.error('Failed to save lead notes:', err);
    }
  };

  const handleDeleteLead = (leadId) => {
    setSelectedLead(null);
    window.dispatchEvent(new Event('lead_data_updated'));
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard Overview';
      case '/leads':
        return 'Discovered Leads';
      case '/automation':
        return 'Automation Engine';
      case '/search-queries':
        return 'Search Queries';
      case '/settings':
        return 'System Settings';
      default:
        return 'Social Lead Finder';
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar Navigation */}
      <Sidebar branding={branding} />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          title={getPageTitle()}
          onRunSearch={handleRunSearch}
          isSearching={isSearching}
          healthStatus={healthStatus}
        />

        {/* Scrollable Page Content with Mobile Bottom Padding */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  onSelectLead={setSelectedLead}
                  onRunSearch={handleRunSearch}
                  isSearching={isSearching}
                />
              }
            />
            <Route path="/leads" element={<Leads onSelectLead={setSelectedLead} />} />
            <Route
              path="/automation"
              element={
                <Automation
                  onRunSearch={handleRunSearch}
                  isSearching={isSearching}
                  searchRunMetrics={searchRunMetrics}
                />
              }
            />
            <Route path="/search-queries" element={<SearchQueries />} />
            <Route
              path="/settings"
              element={
                <Settings
                  onBrandingUpdated={(newB) => setBranding((prev) => ({ ...prev, ...newB }))}
                />
              }
            />
          </Routes>
        </main>
      </div>

      {/* Native Mobile Bottom Navigation Bar (Visible on mobile/Android only) */}
      <MobileNavigation
        onRunSearch={handleRunSearch}
        isSearching={isSearching}
      />

      {/* First-Run Onboarding Wizard */}
      {showFirstRunWizard && (
        <FirstRunWizard
          onComplete={() => {
            setShowFirstRunWizard(false);
            fetchBrandingAndHealth();
          }}
        />
      )}

      {/* Lead Detail Slide-over Modal / Mobile Bottom Sheet */}
      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdateStatus={handleUpdateLeadStatus}
        onSaveNotes={handleSaveLeadNotes}
        onDeleteLead={handleDeleteLead}
      />

      {/* Floating System Notification Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-indigo-500/50 shadow-2xl shadow-indigo-950/80 backdrop-blur-xl flex items-center gap-2.5 text-xs font-semibold text-white max-w-[90vw] md:max-w-md pointer-events-none transition-all">
          <span className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-indigo-400'} animate-ping`} />
          <span className="truncate">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
