import React, { useState } from 'react';
import {
  ShieldAlertIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  UserIcon,
  FileTextIcon,
  ActivityIcon,
  RefreshIcon,
  CheckIcon,
  CloseIcon
} from './Icons';

export default function IncidentCenter({
  incidents = [],
  activeIncident,
  onResolveIncident,
  onOpenPostMortem,
  onNavigateToTopology,
  onRefresh
}) {
  const [selectedIncidentCode, setSelectedIncidentCode] = useState(
    activeIncident?.incident_code || (incidents[0]?.incident_code || null)
  );
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [investigationNote, setInvestigationNote] = useState('');

  const selectedIncident = incidents.find(i => i.incident_code === selectedIncidentCode) || activeIncident || incidents[0];

  const filteredIncidents = incidents.filter(i => {
    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || i.severity === severityFilter;
    return matchesStatus && matchesSeverity;
  });

  const handleAddNote = async () => {
    if (!investigationNote.trim() || !selectedIncident) return;
    const noteText = investigationNote.trim();
    const code = selectedIncident.incident_code;
    setInvestigationNote('');
    try {
      const { api } = await import('../api/client');
      await api.addIncidentNote(code, noteText, 'SRE Incident Commander');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to post note:", err);
    }
  };



  return (
    <div className="incident-center-container">
      {/* Top Incident Control Header */}
      <div className="incident-header-bar">
        <div>
          <h2 className="incident-page-title">Incident Management Center</h2>
          <p className="incident-page-subtitle">
            Triage, investigate, correlate root causes, and track the full incident resolution lifecycle.
          </p>
        </div>

        <div className="incident-filter-controls">
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Lifecycle States</option>
            <option value="ACTIVE">Active / Firing</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select 
            className="filter-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical (P1)</option>
            <option value="HIGH">High (P2)</option>
            <option value="MEDIUM">Medium (P3)</option>
          </select>

          <button className="btn btn-secondary btn-sm" onClick={onRefresh}>
            <RefreshIcon className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Split View: Left List, Right Detail */}
      <div className="incident-split-layout">
        {/* Left Column: Incidents List */}
        <div className="incidents-sidebar-panel">
          <div className="incidents-panel-header">
            <span>INCIDENT QUEUE ({filteredIncidents.length})</span>
          </div>

          <div className="incidents-list-scroll">
            {filteredIncidents.map(inc => {
              const isActive = inc.incident_code === selectedIncident?.incident_code;
              const isResolved = inc.status === 'RESOLVED';
              return (
                <div
                  key={inc.incident_code}
                  className={`incident-list-card ${isActive ? 'selected' : ''} ${isResolved ? 'resolved' : 'firing'}`}
                  onClick={() => setSelectedIncidentCode(inc.incident_code)}
                >
                  <div className="incident-card-top">
                    <span className="incident-code mono">[{inc.incident_code}]</span>
                    <span className={`severity-badge ${(inc.severity || 'HIGH').toLowerCase()}`}>
                      {inc.severity || 'HIGH'}
                    </span>
                  </div>

                  <h4 className="incident-card-title">{inc.title}</h4>

                  <div className="incident-card-meta">
                    <span className="root-cause-tag">
                      RCA: <strong>{inc.root_cause_service || 'Unknown'}</strong>
                    </span>
                    <span className="conf-score mono">
                      {inc.confidence_score || 0}% Conf
                    </span>
                  </div>

                  <div className="incident-card-status-row">
                    <span className={`status-pill ${(inc.status || 'ACTIVE').toLowerCase()}`}>
                      {inc.status || 'ACTIVE'}
                    </span>
                    <span className="detected-time mono">
                      {inc.detected_at ? new Date(inc.detected_at).toLocaleTimeString() : 'Recent'}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredIncidents.length === 0 && (
              <div className="incidents-empty-state">
                <CheckCircleIcon className="w-8 h-8 text-emerald" />
                <p>No incidents match the active filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Incident Details, RCA, Timeline & Notes */}
        {selectedIncident ? (
          <div className="incident-detail-panel">
            {/* Detail Header */}
            <div className="detail-panel-header">
              <div className="detail-title-block">
                <div className="detail-badges-row">
                  <span className="incident-code-large mono">[{selectedIncident.incident_code}]</span>
                  <span className={`severity-badge ${(selectedIncident.severity || 'HIGH').toLowerCase()}`}>
                    {selectedIncident.severity || 'HIGH'}
                  </span>
                  <span className={`status-pill ${(selectedIncident.status || 'ACTIVE').toLowerCase()}`}>
                    {selectedIncident.status || 'ACTIVE'}
                  </span>
                </div>
                <h2 className="detail-title">{selectedIncident.title}</h2>
              </div>

              <div className="detail-header-actions">
                <button className="btn btn-cyber btn-sm" onClick={onOpenPostMortem}>
                  <FileTextIcon className="w-3.5 h-3.5" />
                  Post-Mortem
                </button>
                <button className="btn btn-secondary btn-sm" onClick={onNavigateToTopology}>
                  <ActivityIcon className="w-3.5 h-3.5" />
                  View Mesh
                </button>
                {selectedIncident.status !== 'RESOLVED' && (
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => onResolveIncident(selectedIncident.incident_code)}
                  >
                    Resolve Incident
                  </button>
                )}
              </div>
            </div>

            {/* RCA Attribution Banner */}
            <div className="incident-rca-box">
              <div className="rca-box-left">
                <div className="rca-label">IDENTIFIED ROOT CAUSE SERVICE</div>
                <div className="rca-service-name">
                  {selectedIncident.root_cause_service || 'payment-service'}
                </div>
                <div className="rca-explanation">
                  {selectedIncident.primary_symptom || 'Originating failure causing secondary cascade across upstream callers.'}
                </div>
              </div>
              <div className="rca-box-right">
                <div className="rca-score-val mono">
                  {selectedIncident.confidence_score || 94.2}%
                </div>
                <span className="rca-score-label">RCA Confidence</span>
              </div>
            </div>

            {/* Incident Metadata Grid */}
            <div className="incident-meta-grid">
              <div className="meta-card">
                <span className="meta-card-label">DETECTION TIMESTAMP</span>
                <span className="meta-card-value mono">
                  {selectedIncident.detected_at ? new Date(selectedIncident.detected_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="meta-card">
                <span className="meta-card-label">RESOLVED TIMESTAMP</span>
                <span className="meta-card-value mono">
                  {selectedIncident.resolved_at ? new Date(selectedIncident.resolved_at).toLocaleString() : 'Open / Unresolved'}
                </span>
              </div>
              <div className="meta-card">
                <span className="meta-card-label">IMPACTED SERVICES</span>
                <span className="meta-card-value mono text-rose">
                  {Array.isArray(selectedIncident.impacted_services) && selectedIncident.impacted_services.length > 0
                    ? selectedIncident.impacted_services.join(', ')
                    : 'order-service, api-gateway'}
                </span>
              </div>
              <div className="meta-card">
                <span className="meta-card-label">ASSIGNED OWNER</span>
                <span className="meta-card-value">
                  SRE Incident Commander (Active)
                </span>
              </div>
            </div>

            {/* SRE Actionable Recommendations */}
            <div className="recommendations-box">
              <div className="section-label">RECOMMENDED MITIGATION ACTIONS</div>
              <ul className="action-items-list">
                {Array.isArray(selectedIncident.recommended_actions) && selectedIncident.recommended_actions.length > 0 ? (
                  selectedIncident.recommended_actions.map((act, idx) => (
                    <li key={idx} className="action-item">
                      <CheckCircleIcon className="w-4 h-4 text-emerald" />
                      <span>{act}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="action-item">
                      <CheckCircleIcon className="w-4 h-4 text-emerald" />
                      <span>Execute <code>POST /chaos/clear</code> to restore healthy latency baseline.</span>
                    </li>
                    <li className="action-item">
                      <CheckCircleIcon className="w-4 h-4 text-emerald" />
                      <span>Verify downstream payment gateway connection pool and circuit breaker thresholds.</span>
                    </li>
                    <li className="action-item">
                      <CheckCircleIcon className="w-4 h-4 text-emerald" />
                      <span>Scale out replica pods for <code>{selectedIncident.root_cause_service || 'payment-service'}</code> if saturation persists.</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Investigation Notes & Audit Log */}
            <div className="investigation-notes-box">
              <div className="section-label">ENGINEER INVESTIGATION NOTES & AUDIT TRAIL</div>
              
              <div className="note-input-row">
                <input
                  type="text"
                  placeholder="Add triage note, mitigation step, or root cause finding..."
                  value={investigationNote}
                  onChange={(e) => setInvestigationNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <button className="btn btn-secondary btn-sm" onClick={handleAddNote}>
                  Post Note
                </button>
              </div>

              <div className="notes-list">
                {(selectedIncident.notes || []).map(n => {
                  const timeFormatted = n.created_at ? new Date(n.created_at).toLocaleTimeString() : 'Recent';
                  return (
                    <div key={n.id} className="note-entry">
                      <div className="note-header">
                        <span className="note-author">{n.author}</span>
                        <span className="note-time mono">{timeFormatted}</span>
                      </div>
                      <p className="note-text">{n.text}</p>
                    </div>
                  );
                })}
                
                {/* Default Audit History entries */}
                <div className="note-entry system">
                  <div className="note-header">
                    <span className="note-author text-cyan">FlowForge RCA Engine (System)</span>
                    <span className="note-time mono">At Detection</span>
                  </div>
                  <p className="note-text">
                    Algorithmic correlation identified leaf span errors localized in <code>{selectedIncident.root_cause_service || 'payment-service'}</code> with temporal onset priority $T_0$.
                  </p>
                </div>
                <div className="note-entry system">
                  <div className="note-header">
                    <span className="note-author text-indigo">Telemetry Ingestion Pipeline</span>
                    <span className="note-time mono">At Detection</span>
                  </div>
                  <p className="note-text">
                    Threshold breach triggered: p95 latency exceeded 200ms and error rate spiked across callers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="incident-no-selection">
            <ShieldAlertIcon className="w-12 h-12 text-muted" />
            <p>Select an incident from the queue to inspect details and audit history.</p>
          </div>
        )}
      </div>
    </div>
  );
}
