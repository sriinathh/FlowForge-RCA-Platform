import React, { useState } from 'react';
import {
  ServerIcon,
  SearchIcon,
  FilterIcon,
  ActivityIcon,
  ZapIcon,
  ShieldAlertIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon,
  ClockIcon,
  GlobeIcon
} from './Icons';

export default function ServiceCatalog({
  topology,
  onSelectService,
  onOpenChaos
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [envFilter, setEnvFilter] = useState('ALL');

  const nodes = topology?.nodes || [];
  const edges = topology?.edges || [];

  // Filter nodes using real database fields
  const filteredNodes = nodes.filter(n => {
    const matchesSearch = !searchQuery || 
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.team && n.team.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || n.health === statusFilter;
    const matchesEnv = envFilter === 'ALL' || (n.environment || 'Production') === envFilter;

    return matchesSearch && matchesStatus && matchesEnv;
  });

  return (
    <div className="service-catalog-container">
      {/* Header & Controls */}
      <div className="catalog-header-bar">
        <div>
          <h2 className="catalog-title">Service Registry & Catalog</h2>
          <p className="catalog-subtitle">
            Monitored microservices, Golden Signals, dependencies, deployment versions, and SLO targets.
          </p>
        </div>

        <div className="catalog-filters-row">
          {/* Search box */}
          <div className="catalog-search-box">
            <SearchIcon className="w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search by name, team, or label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select 
            className="filter-select" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Health States</option>
            <option value="HEALTHY">Healthy Only</option>
            <option value="DEGRADED">Degraded Only</option>
            <option value="UNHEALTHY">Unhealthy Only</option>
          </select>

          {/* Environment Filter */}
          <select 
            className="filter-select" 
            value={envFilter} 
            onChange={(e) => setEnvFilter(e.target.value)}
          >
            <option value="ALL">All Environments</option>
            <option value="Production">Production</option>
            <option value="Staging">Staging</option>
            <option value="Development">Development</option>
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="catalog-grid">
        {filteredNodes.map(node => {
          const env = node.environment || 'Production';
          const team = node.team || 'Platform Engineering';
          const version = node.version || 'v1.0.0';
          const slo = node.slo || '99.9% Availability';
          const tier = node.tier || 'Tier 1';

          // Find dependencies (downstream) and callers (upstream)
          const outgoing = edges.filter(e => e.source === node.name).map(e => e.target);
          const incoming = edges.filter(e => e.target === node.name).map(e => e.source);

          const isUnhealthy = node.health === 'UNHEALTHY' || node.health === 'DOWN';
          const isDegraded = node.health === 'DEGRADED';

          return (
            <div 
              key={node.name} 
              className={`catalog-card ${isUnhealthy ? 'card-unhealthy' : isDegraded ? 'card-degraded' : 'card-healthy'}`}
              onClick={() => onSelectService(node.name)}
            >
              {/* Card Header */}
              <div className="catalog-card-header">
                <div className="svc-identity">
                  <div className="svc-avatar">
                    <ServerIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="svc-title">{node.label || node.name}</h3>
                    <span className="svc-endpoint mono">{node.endpoint || `http://127.0.0.1:${node.port}`}</span>
                  </div>
                </div>

                <div className="svc-badges">
                  <span className={`status-pill ${node.health.toLowerCase()}`}>
                    {node.health}
                  </span>
                  <span className="env-pill">{env}</span>
                </div>
              </div>

              {/* Golden Signals Row */}
              <div className="signals-metrics-grid">
                <div className="signal-cell">
                  <span className="signal-lbl">P95 LATENCY</span>
                  <span className="signal-val mono" style={{ color: node.p95 > 200 ? 'var(--rose)' : 'var(--text-main)' }}>
                    {node.p95}ms
                  </span>
                </div>
                <div className="signal-cell">
                  <span className="signal-lbl">ERROR RATE</span>
                  <span className="signal-val mono" style={{ color: node.errorRate > 0 ? 'var(--rose)' : 'var(--emerald)' }}>
                    {node.errorRate}%
                  </span>
                </div>
                <div className="signal-cell">
                  <span className="signal-lbl">TRAFFIC (RPS)</span>
                  <span className="signal-val mono">
                    {node.rps}
                  </span>
                </div>
                <div className="signal-cell">
                  <span className="signal-lbl">AVG LATENCY</span>
                  <span className="signal-val mono">
                    {node.avgLatency}ms
                  </span>
                </div>
              </div>

              {/* Ownership & Metadata */}
              <div className="svc-meta-box">
                <div className="meta-row">
                  <span className="meta-key">Team Owner:</span>
                  <span className="meta-val">{team}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-key">Deploy Version:</span>
                  <span className="meta-val mono">{version}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-key">SLO Target:</span>
                  <span className="meta-val">{slo}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-key">Dependencies:</span>
                  <span className="meta-val mono">
                    {outgoing.length > 0 ? outgoing.join(', ') : 'Leaf Service (No Outgoing)'}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-key">Callers:</span>
                  <span className="meta-val mono">
                    {incoming.length > 0 ? incoming.join(', ') : 'Ingress Edge (No Upstream)'}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="catalog-card-footer">
                <span className="heartbeat-tag mono">
                  Heartbeat: {node.lastHeartbeat ? 'Active' : 'Connected'}
                </span>
                <button 
                  className="btn btn-secondary btn-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectService(node.name);
                  }}
                >
                  Deep Dive & Telemetry →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredNodes.length === 0 && (
        <div className="catalog-empty-state">
          <ServerIcon className="w-10 h-10 text-muted" />
          <p>No services match your filters</p>
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setEnvFilter('ALL'); }}>
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
