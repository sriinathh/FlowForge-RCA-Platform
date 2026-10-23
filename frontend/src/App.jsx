import React, { useState, useEffect } from 'react';
import { api } from './api/client';

// Shell & Navigation Components
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import OverviewDashboard from './components/OverviewDashboard';
import ServiceCatalog from './components/ServiceCatalog';
import IncidentCenter from './components/IncidentCenter';
import SettingsWorkspace from './components/SettingsWorkspace';
import GlobalSearchModal from './components/GlobalSearchModal';
import NotificationsDrawer from './components/NotificationsDrawer';

// Core Observability & Investigation Components
import DependencyTopology from './components/DependencyTopology';
import RootCausePanel from './components/RootCausePanel';
import TraceWaterfall from './components/TraceWaterfall';
import ChaosController from './components/ChaosController';
import EvaluationBenchmark from './components/EvaluationBenchmark';
import BaselineModal from './components/BaselineModal';
import ServiceDetailModal from './components/ServiceDetailModal';
import PostMortemExportModal from './components/PostMortemExportModal';
import MetricsTimelineChart from './components/MetricsTimelineChart';
import LogsTerminal from './components/LogsTerminal';
import AICopilotDrawer from './components/AICopilotDrawer';
import TrafficGenerator from './components/TrafficGenerator';

import { 
  ServerIcon, 
  ActivityIcon, 
  ShieldAlertIcon, 
  ZapIcon, 
  RefreshIcon, 
  LayersIcon, 
  BarChartIcon, 
  TerminalIcon,
  BotIcon,
  TrendingUpIcon,
  FileTextIcon
} from './components/Icons';

export default function App() {
  // Navigation & Shell State
  const [activeTab, setActiveTab] = useState('overview'); // overview, topology, services, traces, metrics, logs, incidents, copilot, chaos, benchmark, settings
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [selectedEnvironment, setSelectedEnvironment] = useState('Production');
  const [selectedTimeRange, setSelectedTimeRange] = useState('Last 15m');
  const [currentWorkspace, setCurrentWorkspace] = useState('Production Mesh');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Live Telemetry & System Data State
  const [topology, setTopology] = useState(null);
  const [rcaResult, setRcaResult] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [selectedServiceNode, setSelectedServiceNode] = useState(null);
  const [isBaselineOpen, setIsBaselineOpen] = useState(false);
  const [isPostMortemOpen, setIsPostMortemOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [pingMs, setPingMs] = useState(18);

  // In-memory notifications list
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      type: 'INFO',
      title: 'FlowForge Telemetry Mesh Active',
      message: 'Monitoring 4 microservices across Production Mesh. W3C distributed trace context enabled.',
      time: '10m ago',
      read: true
    },
    {
      id: 'notif-2',
      type: 'INFO',
      title: 'Prometheus & OTel Exporters Connected',
      message: 'Scrape targets healthy on ports 8001, 8002, 8003, and 8004.',
      time: '5m ago',
      read: true
    }
  ]);

  // Handle Theme Switcher
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Keyboard shortcut: Ctrl+K / Cmd+K opens Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Poll system data every 2.5 seconds
  useEffect(() => {
    fetchInitialData();
    const interval = setInterval(refreshTelemetry, 2500);
    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const fetchInitialData = async () => {
    const t0 = performance.now();
    try {
      const [topoData, rcaData, incData] = await Promise.all([
        api.getTopology(),
        api.runRCA(),
        api.getIncidents(),
      ]);
      setTopology(topoData);
      setRcaResult(rcaData);
      const incList = incData.results || incData || [];
      setIncidents(incList);
      setPingMs(Math.round(performance.now() - t0));

      // Check for active incident to populate notification
      const activeInc = incList.find(i => i.status === 'ACTIVE' || i.status === 'INVESTIGATING');
      if (activeInc) {
        setNotifications(prev => {
          if (prev.some(n => n.incidentCode === activeInc.incident_code)) return prev;
          return [
            {
              id: `notif-${activeInc.incident_code}`,
              type: 'INCIDENT',
              title: `Critical Alert: ${activeInc.incident_code}`,
              message: `${activeInc.title} — Root Cause: ${activeInc.root_cause_service || 'Unknown'} (${activeInc.confidence_score || 94}% confidence)`,
              incidentCode: activeInc.incident_code,
              time: 'Just now',
              read: false
            },
            ...prev
          ];
        });
      }
    } catch (err) {
      console.warn("Telemetry fetch note:", err.message);
    }
  };

  const refreshTelemetry = async () => {
    const t0 = performance.now();
    try {
      if (isLiveStreaming) {
        await api.pulseLive().catch(() => {});
      }
      const [topoData, rcaData] = await Promise.all([
        api.getTopology(),
        api.runRCA(),
      ]);
      setTopology(topoData);
      setRcaResult(rcaData);
      setPingMs(Math.max(12, Math.round(performance.now() - t0)));
    } catch (err) {
      // silently ignore transient poller fails
    }
  };

  const handleTriggerScan = async () => {
    setScanning(true);
    try {
      const res = await api.triggerScan();
      setRcaResult(res);
      const incData = await api.getIncidents();
      setIncidents(incData.results || incData || []);
      const topoData = await api.getTopology();
      setTopology(topoData);
    } catch (err) {
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  const handleResolveActiveIncident = async (code) => {
    try {
      await api.resolveIncident(code);
      await api.injectChaos('clear_faults');
      fetchInitialData();
      setNotifications(prev => [
        {
          id: `notif-resolved-${Date.now()}`,
          type: 'INFO',
          title: `Incident ${code} Resolved`,
          message: 'Fault cleared and healthy baseline restored.',
          time: 'Just now',
          read: false
        },
        ...prev
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const activeIncident = incidents.find(i => i.status === 'ACTIVE' || i.status === 'INVESTIGATING');
  const unhealthyCount = topology?.nodes?.filter(n => n.health !== 'HEALTHY').length || 0;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Selected service object for the modal
  const selectedServiceObj = topology?.nodes?.find(n => n.name === selectedServiceNode);

  return (
    <div className="app-shell-layout">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeIncidentCount={activeIncident ? 1 : 0}
        currentOrg="FlowForge Global"
        currentWorkspace={currentWorkspace}
        onSelectWorkspace={(ws) => {
          setCurrentWorkspace(ws.name);
          setSelectedEnvironment(ws.env);
        }}
      />

      {/* Main Content Viewport */}
      <div className="app-main-viewport">
        {/* Top Navbar Header */}
        <TopNavbar
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenSearch={() => setIsSearchOpen(true)}
          selectedEnvironment={selectedEnvironment}
          onSelectEnvironment={(env) => setSelectedEnvironment(env)}
          selectedTimeRange={selectedTimeRange}
          onSelectTimeRange={(tr) => setSelectedTimeRange(tr)}
          isLiveStreaming={isLiveStreaming}
          onToggleLiveStream={() => setIsLiveStreaming(!isLiveStreaming)}
          pingMs={pingMs}
          activeIncident={activeIncident}
          unreadNotificationsCount={unreadNotifications}
          onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onTriggerScan={handleTriggerScan}
          scanning={scanning}
          onOpenChaos={() => setActiveTab('chaos')}
        />

        {/* Scrollable Main Content Body */}
        <main className="app-content-body">
          {/* Active Incident Warning Ribbon (Shown across tabs if incident is firing) */}
          {activeIncident && activeTab !== 'overview' && activeTab !== 'incidents' && (
            <div className="incident-banner" style={{ marginBottom: '1.25rem' }}>
              <div className="banner-left">
                <ShieldAlertIcon className="w-7 h-7" style={{ color: '#f43f5e' }} />
                <div>
                  <div className="banner-title">
                    [{activeIncident.incident_code}] {activeIncident.title}
                  </div>
                  <div className="banner-desc">
                    Originating Root Cause: <strong style={{ color: '#f43f5e', textDecoration: 'underline' }}>{activeIncident.root_cause_service}</strong> ({activeIncident.confidence_score}% Confidence).
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                <button 
                  className="btn btn-cyber"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => setIsPostMortemOpen(true)}
                >
                  <FileTextIcon className="w-3.5 h-3.5" />
                  Post-Mortem
                </button>
                <button 
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => setIsBaselineOpen(true)}
                >
                  Evidence
                </button>
                <button 
                  className="btn btn-danger"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => handleResolveActiveIncident(activeIncident.incident_code)}
                >
                  Resolve Incident
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <OverviewDashboard
              topology={topology}
              incidents={incidents}
              rcaResult={rcaResult}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenChaos={() => setActiveTab('chaos')}
              onTriggerScan={handleTriggerScan}
              scanning={scanning}
            />
          )}

          {/* TAB 2: LIVE MESH & RCA ENGINE */}
          {activeTab === 'topology' && (
            <div>
              <TrafficGenerator onTrafficGenerated={fetchInitialData} />
              <div className="grid-2">
                <DependencyTopology
                  topology={topology}
                  selectedService={selectedServiceNode}
                  onSelectService={(svcName) => setSelectedServiceNode(svcName)}
                />
                <RootCausePanel
                  rcaResult={rcaResult}
                  onRefreshRCA={refreshTelemetry}
                  onOpenBaselineModal={() => setIsBaselineOpen(true)}
                  onOpenPostMortem={() => setIsPostMortemOpen(true)}
                  onOpenCopilot={() => setActiveTab('copilot')}
                />
              </div>
            </div>
          )}

          {/* TAB 3: SERVICE CATALOG & REGISTRY */}
          {activeTab === 'services' && (
            <ServiceCatalog
              topology={topology}
              onSelectService={(svcName) => setSelectedServiceNode(svcName)}
              onOpenChaos={() => setActiveTab('chaos')}
            />
          )}

          {/* TAB 4: DISTRIBUTED TRACES & WATERFALL */}
          {activeTab === 'traces' && (
            <TraceWaterfall />
          )}

          {/* TAB 5: TEMPORAL METRICS EXPLORER */}
          {activeTab === 'metrics' && (
            <div>
              <TrafficGenerator onTrafficGenerated={fetchInitialData} />
              <MetricsTimelineChart />
            </div>
          )}

          {/* TAB 6: TELEMETRY LOGS STREAM */}
          {activeTab === 'logs' && (
            <LogsTerminal />
          )}

          {/* TAB 7: INCIDENT MANAGEMENT CENTER */}
          {activeTab === 'incidents' && (
            <IncidentCenter
              incidents={incidents}
              activeIncident={activeIncident}
              onResolveIncident={handleResolveActiveIncident}
              onOpenPostMortem={() => setIsPostMortemOpen(true)}
              onNavigateToTopology={() => setActiveTab('topology')}
              onRefresh={fetchInitialData}
            />
          )}

          {/* TAB 8: AI SRE COPILOT */}
          {activeTab === 'copilot' && (
            <AICopilotDrawer 
              rcaResult={rcaResult}
              activeIncident={activeIncident}
            />
          )}

          {/* TAB 9: CHAOS FAULT INJECTION */}
          {activeTab === 'chaos' && (
            <ChaosController 
              onFaultInjected={() => {
                fetchInitialData();
                setActiveTab('overview');
              }}
              onFaultCleared={fetchInitialData}
            />
          )}

          {/* TAB 10: RESEARCH EVALUATION BENCHMARK */}
          {activeTab === 'benchmark' && (
            <EvaluationBenchmark />
          )}

          {/* TAB 11: SETTINGS & WORKSPACE */}
          {activeTab === 'settings' && (
            <SettingsWorkspace
              currentOrg="FlowForge Global"
              currentWorkspace={currentWorkspace}
              onSeedDefaults={async () => {
                await api.seedTopology();
                fetchInitialData();
              }}
            />
          )}
        </main>
      </div>

      {/* Global Search Command Palette Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        services={topology?.nodes || []}
        incidents={incidents}
        onNavigate={(tab, payload) => {
          setActiveTab(tab);
          if (tab === 'services' && payload) {
            setSelectedServiceNode(payload);
          }
        }}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onClearAll={() => setNotifications([])}
        onSelectIncident={(code) => {
          setActiveTab('incidents');
        }}
      />

      {/* Baseline Comparison Modal */}
      <BaselineModal 
        isOpen={isBaselineOpen} 
        onClose={() => setIsBaselineOpen(false)} 
      />

      {/* Service Deep Dive Modal */}
      {selectedServiceObj && (
        <ServiceDetailModal
          service={selectedServiceObj}
          onClose={() => setSelectedServiceNode(null)}
          onChaosInjected={() => {
            fetchInitialData();
            setActiveTab('topology');
          }}
        />
      )}

      {/* Post-Mortem Export Modal */}
      <PostMortemExportModal
        isOpen={isPostMortemOpen}
        onClose={() => setIsPostMortemOpen(false)}
        incident={activeIncident}
        rcaResult={rcaResult}
      />
    </div>
  );
}
