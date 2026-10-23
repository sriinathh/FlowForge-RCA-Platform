import React, { useState } from 'react';
import {
  ZapIcon,
  RefreshIcon,
  SearchIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  GlobeIcon,
  ClockIcon,
  ChevronDownIcon,
  MenuIcon
} from './Icons';

export default function TopNavbar({
  onToggleSidebar,
  onOpenSearch,
  selectedEnvironment = 'Production',
  onSelectEnvironment,
  selectedTimeRange = 'Last 15m',
  onSelectTimeRange,
  isLiveStreaming,
  onToggleLiveStream,
  pingMs = 18,
  activeIncident,
  unreadNotificationsCount = 2,
  onToggleNotifications,
  theme = 'dark',
  onToggleTheme,
  onTriggerScan,
  scanning = false,
  onOpenChaos
}) {
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

  const environments = ['Production', 'Staging', 'Development'];
  const timeRanges = ['Last 5m', 'Last 15m', 'Last 1h', 'Last 6h', 'Last 24h', 'Custom Range'];

  return (
    <header className="top-navbar">
      {/* Left: Mobile Toggle & Brand Identity */}
      <div className="top-navbar-left">
        <button className="mobile-toggle-btn" onClick={onToggleSidebar} title="Toggle navigation">
          <MenuIcon className="w-5 h-5" />
        </button>

        <div className="navbar-brand">
          <div className="brand-logo-glow">
            <ZapIcon className="w-5 h-5" style={{ color: '#fff' }} />
          </div>
          <div className="brand-titles">
            <div className="brand-heading">
              <span className="brand-name">FlowForge</span>
              <span className="brand-version-tag">v2.4</span>
            </div>
            <span className="brand-subtext">Real-Time Observability & RCA</span>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar Trigger */}
      <div className="top-navbar-center">
        <div className="global-search-trigger" onClick={onOpenSearch}>
          <SearchIcon className="w-3.5 h-3.5 search-icon" />
          <span className="search-placeholder">Search services, incidents, logs, traces...</span>
          <div className="search-hotkey">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="top-navbar-right">
        {/* Environment Selector */}
        <div className="dropdown-wrapper">
          <button 
            className="navbar-pill-btn" 
            onClick={() => setEnvDropdownOpen(!envDropdownOpen)}
            title="Filter by deployment environment"
          >
            <GlobeIcon className="w-3.5 h-3.5 text-cyan" />
            <span className="pill-text">{selectedEnvironment}</span>
            <ChevronDownIcon className="w-3 h-3 text-dim" />
          </button>

          {envDropdownOpen && (
            <div className="navbar-dropdown-menu">
              <div className="dropdown-header">DEPLOYMENT ENVIRONMENT</div>
              {environments.map(env => (
                <div
                  key={env}
                  className={`dropdown-item ${selectedEnvironment === env ? 'selected' : ''}`}
                  onClick={() => {
                    if (onSelectEnvironment) onSelectEnvironment(env);
                    setEnvDropdownOpen(false);
                  }}
                >
                  <span className={`env-dot ${env.toLowerCase()}`}></span>
                  <span>{env}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Time Range Selector */}
        <div className="dropdown-wrapper">
          <button 
            className="navbar-pill-btn" 
            onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
            title="Global evaluation time window"
          >
            <ClockIcon className="w-3.5 h-3.5 text-amber" />
            <span className="pill-text">{selectedTimeRange}</span>
            <ChevronDownIcon className="w-3 h-3 text-dim" />
          </button>

          {timeDropdownOpen && (
            <div className="navbar-dropdown-menu">
              <div className="dropdown-header">TIME RANGE</div>
              {timeRanges.map(tr => (
                <div
                  key={tr}
                  className={`dropdown-item ${selectedTimeRange === tr ? 'selected' : ''}`}
                  onClick={() => {
                    if (onSelectTimeRange) onSelectTimeRange(tr);
                    setTimeDropdownOpen(false);
                  }}
                >
                  <span>{tr}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Streaming Toggle */}
        <button
          onClick={onToggleLiveStream}
          className={`live-stream-btn ${isLiveStreaming ? 'active' : ''}`}
          title="Toggle automatic background telemetry polling"
        >
          <span className={`beacon-dot ${isLiveStreaming ? 'pulse' : ''}`}></span>
          <span className="stream-label">{isLiveStreaming ? 'LIVE' : 'PAUSED'}</span>
          <span className="ping-val mono">{pingMs}ms</span>
        </button>

        {/* Notifications Bell */}
        <button 
          className="icon-action-btn"
          onClick={onToggleNotifications}
          title="Notifications & active alerts"
        >
          <BellIcon className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="notification-badge">{unreadNotificationsCount}</span>
          )}
        </button>

        {/* Theme Toggle (Dark / Light) */}
        <button 
          className="icon-action-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <SunIcon className="w-4 h-4 text-amber" /> : <MoonIcon className="w-4 h-4 text-indigo" />}
        </button>

        <div className="divider-vertical"></div>

        {/* Fast Action Buttons */}
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={onTriggerScan} 
          disabled={scanning}
          title="Run immediate RCA correlation scan"
        >
          <RefreshIcon className={`w-3.5 h-3.5 ${scanning ? 'spin' : ''}`} />
          <span>{scanning ? 'Scanning...' : 'Scan'}</span>
        </button>

        <button 
          className="btn btn-primary btn-sm"
          onClick={onOpenChaos}
          title="Inject chaos failure scenario"
        >
          <ZapIcon className="w-3.5 h-3.5" />
          <span>Chaos</span>
        </button>
      </div>
    </header>
  );
}
