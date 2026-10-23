import React, { useState, useEffect, useRef } from 'react';
import {
  SearchIcon,
  ServerIcon,
  ShieldAlertIcon,
  LayersIcon,
  TrendingUpIcon,
  TerminalIcon,
  ZapIcon,
  CloseIcon,
  ArrowRight
} from './Icons';

export default function GlobalSearchModal({
  isOpen,
  onClose,
  services = [],
  incidents = [],
  onNavigate
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search Services
  const matchedServices = (services || []).filter(s =>
    !q || s.name.toLowerCase().includes(q) || s.display_name?.toLowerCase().includes(q) || s.label?.toLowerCase().includes(q)
  );

  // Search Incidents
  const matchedIncidents = (incidents || []).filter(i =>
    !q || i.incident_code.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || i.root_cause_service?.toLowerCase().includes(q)
  );

  // Navigation targets
  const navTargets = [
    { label: 'Overview Dashboard', tab: 'overview', icon: TrendingUpIcon, desc: 'Golden signals, health, and throughput summary' },
    { label: 'Live Mesh & RCA Engine', tab: 'topology', icon: ZapIcon, desc: 'Service dependency graph and algorithmic root cause' },
    { label: 'Service Catalog', tab: 'services', icon: ServerIcon, desc: 'Inspect monitored microservices and SLOs' },
    { label: 'Distributed Traces & Waterfall', tab: 'traces', icon: LayersIcon, desc: 'W3C distributed trace spans and flamechart' },
    { label: 'Metrics Explorer', tab: 'metrics', icon: TrendingUpIcon, desc: 'Temporal latency and error rate time-series' },
    { label: 'Log Stream Terminal', tab: 'logs', icon: TerminalIcon, desc: 'Structured logs and stack traces correlated with traces' },
    { label: 'Chaos Fault Injection', tab: 'chaos', icon: ZapIcon, desc: 'Inject failure scenarios into live services' },
  ].filter(t => !q || t.label.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q));

  const handleSelect = (tab, payload = null) => {
    onNavigate(tab, payload);
    onClose();
  };

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className="search-input-header">
          <SearchIcon className="w-5 h-5 text-muted" />
          <input
            ref={inputRef}
            type="text"
            className="search-palette-input"
            placeholder="Type to search services, incidents, traces, or navigate..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery('')}>
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
          <span className="search-esc-tag">ESC</span>
        </div>

        {/* Results List */}
        <div className="search-results-container">
          {/* Services Section */}
          {matchedServices.length > 0 && (
            <div className="search-results-group">
              <div className="search-group-header">MONITORED SERVICES</div>
              {matchedServices.map((svc) => (
                <div
                  key={svc.name || svc.id}
                  className="search-result-item"
                  onClick={() => handleSelect('services', svc.name || svc.id)}
                >
                  <div className="result-icon-box">
                    <ServerIcon className="w-4 h-4 text-cyan" />
                  </div>
                  <div className="result-info">
                    <div className="result-title">
                      <span>{svc.display_name || svc.label || svc.name}</span>
                      <span className={`status-pill ${(svc.health || 'HEALTHY').toLowerCase()}`}>
                        {svc.health || 'HEALTHY'}
                      </span>
                    </div>
                    <span className="result-subtext mono">
                      Port: {svc.port || 8000} • p95: {svc.p95 || 25}ms • err: {svc.errorRate || 0}%
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted arrow-hover" />
                </div>
              ))}
            </div>
          )}

          {/* Incidents Section */}
          {matchedIncidents.length > 0 && (
            <div className="search-results-group">
              <div className="search-group-header">INCIDENTS & ALERTS</div>
              {matchedIncidents.map((inc) => (
                <div
                  key={inc.incident_code}
                  className="search-result-item"
                  onClick={() => handleSelect('incidents', inc.incident_code)}
                >
                  <div className="result-icon-box danger">
                    <ShieldAlertIcon className="w-4 h-4 text-rose" />
                  </div>
                  <div className="result-info">
                    <div className="result-title">
                      <span className="mono text-rose" style={{ fontWeight: 700 }}>[{inc.incident_code}]</span>
                      <span>{inc.title}</span>
                    </div>
                    <span className="result-subtext">
                      Root Cause: <strong>{inc.root_cause_service || 'Unknown'}</strong> ({inc.confidence_score || 0}% conf)
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted arrow-hover" />
                </div>
              ))}
            </div>
          )}

          {/* Quick Navigation Targets */}
          {navTargets.length > 0 && (
            <div className="search-results-group">
              <div className="search-group-header">NAVIGATION & TOOLS</div>
              {navTargets.map((tgt) => {
                const IconComponent = tgt.icon;
                return (
                  <div
                    key={tgt.tab}
                    className="search-result-item"
                    onClick={() => handleSelect(tgt.tab)}
                  >
                    <div className="result-icon-box">
                      <IconComponent className="w-4 h-4 text-indigo" />
                    </div>
                    <div className="result-info">
                      <div className="result-title">{tgt.label}</div>
                      <span className="result-subtext">{tgt.desc}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted arrow-hover" />
                  </div>
                );
              })}
            </div>
          )}

          {matchedServices.length === 0 && matchedIncidents.length === 0 && navTargets.length === 0 && (
            <div className="search-empty-state">
              <SearchIcon className="w-8 h-8 text-muted" />
              <p>No results found for "{query}"</p>
              <span>Try searching for "payment", "INC", "traces", or "orders"</span>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="search-modal-footer">
          <span>Navigate with <strong>↑</strong> <strong>↓</strong></span>
          <span>Select with <strong>↵</strong></span>
          <span>Close with <strong>ESC</strong></span>
        </div>
      </div>
    </div>
  );
}
