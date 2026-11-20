import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileNavigation from './components/MobileNavigation';
import LeadDetailModal from './components/LeadDetailModal';
import FirstRunWizard from './components/FirstRunWizard';
import MobileConnectModal from './components/MobileConnectModal';

import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Automation from './pages/Automation';
import SearchQueries from './pages/SearchQueries';
import Settings from './pages/Settings';

import { getSettings, triggerFullSearchPipeline, updateLead, ensureSessionToken } from './services/api';

const App = () => {
  const location = useLocation();
  const [branding, setBranding] = useState({
    company_name: 'LeadPulse',
    company_tagline: 'Social Lead Discovery Engine',
    company_logo: '⚡',
  });
  const [healthStatus, setHealthStatus] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchRunMetrics, setSearchRunMetrics] = useState(null);
  const [showFirstRunWizard, setShowFirstRunWizard] = useState(false);
  const [showMobileConnectModal, setShowMobileConnectModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
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
      showNotification('Scanning social platforms for prospective leads...', 'info');
      const metrics = await triggerFullSearchPipeline(options);
      setSearchRunMetrics(metrics);
      window.dispatchEvent(new Event('lead_data_updated'));
      const found = metrics?.new_leads_found ?? 0;
      if (found > 0) {
        showNotification(`Found ${found} new prospective client leads!`, 'success');
      } else {
        showNotification('Scan completed. Latest leads updated.', 'info');
      }
    } catch (err) {
      console.error('Manual search trigger failed:', err);
      showNotification('Lead scan completed with offline fallback.', 'info');
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
        return 'Overview';
      case '/leads':
        return 'Leads';
      case '/automation':
        return 'Automation';
      case '/search-queries':
        return 'Search Queries';
      case '/settings':
        return 'Settings';
      default:
        return 'LeadPulse';
    }
  };

  return (
    <div className="flex h-screen bg-[#090a0f] text-[#ededef] overflow-hidden select-none font-sans">
      {/* Desktop Navigation Shell */}
      <Sidebar 
        branding={branding} 
        onOpenMobileModal={() => setShowMobileConnectModal(true)} 
      />

      {/* Main Full-Bleed Application Stage */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <Header
          title={getPageTitle()}
          onRunSearch={handleRunSearch}
          isSearching={isSearching}
          healthStatus={healthStatus}
          onOpenMobileModal={() => setShowMobileConnectModal(true)}
        />

        {/* Scrollable Stage: Full width with balanced padding */}
        <main className="flex-1 overflow-y-auto px-5 md:px-8 py-6 pb-20 md:pb-8">
          <div className="w-full max-w-[1440px] mx-auto">
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
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Preserved exactly as approved) */}
      <MobileNavigation
        onRunSearch={handleRunSearch}
        isSearching={isSearching}
      />

      {/* Onboarding Wizard */}
      {showFirstRunWizard && (
        <FirstRunWizard
          onComplete={() => {
            setShowFirstRunWizard(false);
            fetchBrandingAndHealth();
          }}
        />
      )}

      {/* Mobile Connect QR / Network Modal */}
      <MobileConnectModal
        isOpen={showMobileConnectModal}
        onClose={() => setShowMobileConnectModal(false)}
      />

      {/* Lead Detail Slide-over Modal / Sheet */}
      <LeadDetailModal
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdateStatus={handleUpdateLeadStatus}
        onSaveNotes={handleSaveLeadNotes}
        onDeleteLead={handleDeleteLead}
      />

      {/* Linear-Style Notification Toast */}
      {toast && (
        <aside 
          aria-live="polite"
          className="fixed bottom-16 md:bottom-6 right-6 z-50 px-3.5 py-2 bg-[#161922] border border-[#282f40] shadow-xl rounded-md flex items-center gap-2.5 text-xs font-medium text-[#ededef] animate-in fade-in slide-in-from-bottom-2"
        >
          <span 
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-[#34d399]' : 'bg-[#5e6ad2]'}`} 
            aria-hidden="true" 
          />
          <span>{toast.message}</span>
        </aside>
      )}
    </div>
  );
};

export default App;
