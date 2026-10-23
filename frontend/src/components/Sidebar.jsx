import React, { useState, useEffect } from 'react';
import {
  ZapIcon,
  ActivityIcon,
  ServerIcon,
  LayersIcon,
  TrendingUpIcon,
  TerminalIcon,
  ShieldAlertIcon,
  BotIcon,
  BarChartIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  BuildingIcon,
  CheckIcon,
  UserIcon
} from './Icons';

import { api } from '../api/client';

export default function Sidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  activeIncidentCount = 0,
  currentOrg = 'FlowForge Global',
  currentWorkspace = 'Production Mesh',
  onSelectWorkspace
}) {
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([
    { id: 'ws-prod', name: 'Production Mesh', environment: 'Production', services_count: 4 },
    { id: 'ws-staging', name: 'Staging Cluster', environment: 'Staging', services_count: 4 },
    { id: 'ws-dev', name: 'Dev Local Sandbox', environment: 'Development', services_count: 4 },
  ]);

  useEffect(() => {
    let isMounted = true;
    api.getWorkspaces()
      .then(data => {
        if (isMounted && data && Array.isArray(data.workspaces) && data.workspaces.length > 0) {
          setWorkspaces(data.workspaces);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);


  const navSections = [
    {
      title: 'OBSERVABILITY',
      items: [
        { id: 'overview', label: 'Overview Dashboard', icon: BarChartIcon, badge: null },
        { id: 'topology', label: 'Live Mesh & RCA', icon: ActivityIcon, badge: activeIncidentCount > 0 ? `${activeIncidentCount} Alert` : null, badgeColor: 'rose' },
        { id: 'services', label: 'Service Catalog', icon: ServerIcon, badge: '4' },
        { id: 'traces', label: 'Distributed Traces', icon: LayersIcon, badge: null },
        { id: 'metrics', label: 'Metrics Explorer', icon: TrendingUpIcon, badge: null },
        { id: 'logs', label: 'Log Stream', icon: TerminalIcon, badge: null },
      ]
    },
    {
      title: 'OPERATIONS & RCA',
      items: [
        { id: 'incidents', label: 'Incident Center', icon: ShieldAlertIcon, badge: activeIncidentCount > 0 ? `${activeIncidentCount}` : null, badgeColor: 'rose' },
        { id: 'copilot', label: 'AI SRE Copilot', icon: BotIcon, badge: 'AI', badgeColor: 'cyan' },
        { id: 'chaos', label: 'Chaos Fault Injection', icon: ZapIcon, badge: null },
        { id: 'benchmark', label: 'Research Benchmark', icon: BarChartIcon, badge: 'Empirical' },
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { id: 'settings', label: 'Platform & Security', icon: SettingsIcon, badge: null }
      ]
    }
  ];

  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Workspace / Org Switcher */}
      <div className="sidebar-header">
        <div className="workspace-switcher" onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}>
          <div className="workspace-icon">
            <BuildingIcon className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="workspace-info">
              <span className="org-label">{currentOrg}</span>
              <span className="workspace-name">{currentWorkspace}</span>
            </div>
          )}
          {!isCollapsed && (
            <ChevronDownIcon className={`w-3.5 h-3.5 dropdown-arrow ${orgDropdownOpen ? 'open' : ''}`} />
          )}
        </div>

        {/* Dropdown Menu */}
        {orgDropdownOpen && !isCollapsed && (
          <div className="workspace-dropdown-menu">
            <div className="dropdown-section-title">SWITCH WORKSPACE</div>
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className={`workspace-menu-item ${currentWorkspace === ws.name ? 'active' : ''}`}
                onClick={() => {
                  if (onSelectWorkspace) onSelectWorkspace(ws);
                  setOrgDropdownOpen(false);
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.82rem' }}>{ws.name}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {ws.environment || ws.env || 'Production'} • {ws.services_count || ws.services || 4} Services
                  </span>
                </div>
                {currentWorkspace === ws.name && <CheckIcon className="w-4 h-4" style={{ color: 'var(--emerald)' }} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nav List */}
      <div className="sidebar-scrollable">
        {navSections.map((section, idx) => (
          <div key={idx} className="sidebar-nav-section">
            {!isCollapsed && (
              <div className="sidebar-section-title">{section.title}</div>
            )}
            <ul className="sidebar-nav-list">
              {section.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => onSelectTab(item.id)}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className="nav-item-icon">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      {!isCollapsed && (
                        <span className="nav-item-label">{item.label}</span>
                      )}
                      {!isCollapsed && item.badge && (
                        <span className={`nav-badge ${item.badgeColor || 'subtle'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer User Profile & Collapse Toggle */}
      <div className="sidebar-footer">
        <div className="user-profile-chip">
          <div className="user-avatar">
            <UserIcon className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="user-meta">
              <span className="user-name">SRE Admin</span>
              <span className="user-role">Workspace Owner</span>
            </div>
          )}
        </div>

        <button
          className="collapse-toggle-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
