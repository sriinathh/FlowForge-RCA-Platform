import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  SettingsIcon,
  BuildingIcon,
  UserIcon,
  GlobeIcon,
  CheckIcon,
  CopyIcon,
  ShieldAlertIcon,
  ZapIcon,
  RefreshIcon,
  DatabaseIcon,
  TerminalIcon
} from './Icons';

export default function SettingsWorkspace({
  currentOrg = 'FlowForge Global',
  currentWorkspace = 'Production Mesh',
  onSeedDefaults
}) {
  const [activeTab, setActiveTab] = useState('general'); // general, tokens, members, retention
  const [apiTokens, setApiTokens] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newTokenName, setNewTokenName] = useState('');
  const [createdSecret, setCreatedSecret] = useState(null);
  const [copied, setCopied] = useState(false);

  // Invite member state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Editor');

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      const [tokRes, memRes, wsRes] = await Promise.all([
        api.getApiTokens().catch(() => ({ tokens: [] })),
        api.getTeamMembers().catch(() => ({ members: [] })),
        api.getWorkspaces().catch(() => ({ workspaces: [] })),
      ]);
      setApiTokens(tokRes.tokens || []);
      setTeamMembers(memRes.members || []);
      setWorkspaces(wsRes.workspaces || []);
    } catch (err) {
      console.warn("Settings data fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateToken = async () => {
    if (!newTokenName.trim()) return;
    try {
      const res = await api.createApiToken(newTokenName.trim(), 'telemetry:full');
      setApiTokens([res.token, ...apiTokens]);
      setCreatedSecret(res.secret);
      setNewTokenName('');
    } catch (err) {
      alert("Failed to generate token: " + err.message);
    }
  };

  const handleCopy = () => {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevokeToken = async (id) => {
    try {
      await api.revokeApiToken(id);
      setApiTokens(apiTokens.filter(t => t.id !== id));
    } catch (err) {
      alert("Failed to revoke token: " + err.message);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    try {
      const newMember = await api.inviteTeamMember({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole
      });
      setTeamMembers([...teamMembers, newMember]);
      setInviteName('');
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (err) {
      alert("Failed to invite member: " + err.message);
    }
  };

  return (
    <div className="settings-page-container">
      {/* Header */}
      <div className="settings-header-bar">
        <div>
          <h2 className="settings-title">Workspace & Security Settings</h2>
          <p className="settings-subtitle">
            Manage organization members, secure API ingestion keys, data retention policies, and tenant configurations backed by PostgreSQL / SQLite.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="settings-tabs-row">
        <button
          className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <BuildingIcon className="w-4 h-4" />
          General & Environments
        </button>

        <button
          className={`settings-tab-btn ${activeTab === 'tokens' ? 'active' : ''}`}
          onClick={() => setActiveTab('tokens')}
        >
          <ZapIcon className="w-4 h-4" />
          API Tokens & Secrets ({apiTokens.length})
        </button>

        <button
          className={`settings-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          <UserIcon className="w-4 h-4" />
          Team & RBAC ({teamMembers.length})
        </button>

        <button
          className={`settings-tab-btn ${activeTab === 'retention' ? 'active' : ''}`}
          onClick={() => setActiveTab('retention')}
        >
          <DatabaseIcon className="w-4 h-4" />
          Data Retention & Storage
        </button>
      </div>

      {/* Tab 1: General */}
      {activeTab === 'general' && (
        <div className="settings-section-card">
          <h3 className="section-title">Organization & Workspace Identity</h3>
          <div className="form-group-grid">
            <div className="form-group">
              <label>Organization Name</label>
              <input type="text" defaultValue={currentOrg} readOnly className="input-field" />
            </div>
            <div className="form-group">
              <label>Active Workspace</label>
              <input type="text" defaultValue={currentWorkspace} readOnly className="input-field" />
            </div>
            <div className="form-group">
              <label>Tenant ID (UUID)</label>
              <input type="text" defaultValue="tenant-flowforge-88192a" readOnly className="input-field mono" />
            </div>
            <div className="form-group">
              <label>Primary Ingestion Region</label>
              <input type="text" defaultValue="us-east-1 (Distributed Edge)" readOnly className="input-field" />
            </div>
          </div>

          <div className="settings-divider"></div>

          <h3 className="section-title">Registered Workspaces ({workspaces.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
            {workspaces.map(ws => (
              <div key={ws.id} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>{ws.name}</span>
                  {ws.is_default && <span className="tag-emerald">Default</span>}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                  Environment: <strong className="text-cyan">{ws.environment}</strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Monitored Services: {ws.services_count || 4}
                </div>
              </div>
            ))}
          </div>

          <div className="settings-divider"></div>

          <h3 className="section-title">Telemetry Ingestion Endpoints</h3>
          <div className="meta-box-pre">
            <div className="endpoint-row">
              <span className="ep-label">HTTP Batch Ingestion:</span>
              <span className="ep-url mono">POST http://127.0.0.1:8000/api/telemetry/ingest/</span>
            </div>
            <div className="endpoint-row">
              <span className="ep-label">OpenTelemetry OTLP/HTTP:</span>
              <span className="ep-url mono">http://127.0.0.1:4318/v1/traces</span>
            </div>
            <div className="endpoint-row">
              <span className="ep-label">OpenTelemetry OTLP/gRPC:</span>
              <span className="ep-url mono">127.0.0.1:4317</span>
            </div>
            <div className="endpoint-row">
              <span className="ep-label">Prometheus Metrics Scrape:</span>
              <span className="ep-url mono">http://127.0.0.1:9090</span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.8rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={onSeedDefaults}>
              <RefreshIcon className="w-3.5 h-3.5" />
              Reset Default Microservices & Topology
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: API Tokens */}
      {activeTab === 'tokens' && (
        <div className="settings-section-card">
          <h3 className="section-title">Secure Ingestion API Tokens</h3>
          <p className="section-desc">
            API tokens authenticate telemetry reported from SDKs, OpenTelemetry Collectors, and external microservices. Secrets are only displayed once upon generation and hashed with SHA-256 in the database.
          </p>

          {/* New Token Dialog / Secret Display */}
          {createdSecret && (
            <div className="secret-reveal-banner">
              <div className="secret-reveal-header">
                <ShieldAlertIcon className="w-5 h-5 text-emerald" />
                <span style={{ fontWeight: 700, color: 'var(--emerald-light)' }}>
                  Token Created Successfully in Database — Copy Your Secret Now!
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                For security reasons, this token will NEVER be shown again. Store it securely in your deployment secrets or environment variables.
              </p>
              <div className="secret-copy-row">
                <code className="secret-code mono">{createdSecret}</code>
                <button className="btn btn-primary btn-sm" onClick={handleCopy}>
                  {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setCreatedSecret(null)}>
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Create Token Row */}
          <div className="token-create-row">
            <input
              type="text"
              placeholder="Token description (e.g. Production Kubernetes Cluster Daemon)..."
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="input-field"
              style={{ maxWidth: '400px' }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleGenerateToken} disabled={!newTokenName.trim()}>
              Generate New Token
            </button>
          </div>

          {/* Tokens Table */}
          <div className="tokens-table">
            <div className="tokens-header-row">
              <span>Token Name</span>
              <span>Key Prefix</span>
              <span>Scope</span>
              <span>Created</span>
              <span>Last Used</span>
              <span>Action</span>
            </div>
            {apiTokens.length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>No tokens generated yet.</div>
            ) : apiTokens.map((tok) => (
              <div key={tok.id} className="tokens-body-row">
                <span className="token-name-text">{tok.name}</span>
                <span className="mono text-cyan">{tok.prefix}</span>
                <span className="scope-pill">{tok.scope}</span>
                <span className="mono text-muted">{tok.created_at ? new Date(tok.created_at).toLocaleDateString() : 'Active'}</span>
                <span className="mono text-muted">{tok.last_used_at ? new Date(tok.last_used_at).toLocaleDateString() : 'Never'}</span>
                <div>
                  <button className="btn btn-danger btn-xs" onClick={() => handleRevokeToken(tok.id)}>
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Team Members */}
      {activeTab === 'members' && (
        <div className="settings-section-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 className="section-title">Workspace Members & Access Control</h3>
              <p className="section-desc">Manage who has access to investigate incidents and manage alert rules in this workspace.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowInviteModal(true)}>
              + Invite Member
            </button>
          </div>

          {/* Invite Member Inline Form */}
          {showInviteModal && (
            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--border-medium)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.6rem', color: 'var(--text-main)' }}>Invite New Workspace Member</div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Full Name (e.g. SRE Lead)"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, minWidth: '180px' }}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, minWidth: '220px' }}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="filter-select"
                >
                  <option value="Workspace Admin">Workspace Admin</option>
                  <option value="Editor">Editor</option>
                  <option value="Telemetry Ingest">Telemetry Ingest</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <button className="btn btn-primary btn-sm" onClick={handleInviteMember}>
                  Save Member
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="members-table">
            <div className="members-header-row">
              <span>Member</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
            </div>
            {teamMembers.length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Loading members from database...</div>
            ) : teamMembers.map((m, idx) => (
              <div key={m.id || idx} className="members-body-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div className="user-avatar-sm">{m.name.charAt(0)}</div>
                  <span style={{ fontWeight: 600 }}>{m.name}</span>
                </div>
                <span className="mono text-muted">{m.email}</span>
                <span className="role-tag">{m.role}</span>
                <span className="status-pill healthy">{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Data Retention & Storage */}
      {activeTab === 'retention' && (
        <div className="settings-section-card">
          <h3 className="section-title">Telemetry Retention & Capacity Policy</h3>
          <p className="section-desc">
            Define automated compaction, TTL expiries, and tiered storage for high-volume logs, spans, and metrics.
          </p>

          <div className="retention-grid">
            <div className="retention-card">
              <span className="retention-type">Distributed Traces (Spans)</span>
              <span className="retention-val">14 Days</span>
              <span className="retention-desc">High-resolution span trees & waterfalls. 100% error-trace retention in SQLite/Postgres.</span>
            </div>
            <div className="retention-card">
              <span className="retention-type">Time-Series Metrics</span>
              <span className="retention-val">90 Days</span>
              <span className="retention-desc">10-second resolution for 7 days, 1-minute rollups for 90 days.</span>
            </div>
            <div className="retention-card">
              <span className="retention-type">Telemetry Log Streams</span>
              <span className="retention-val">30 Days</span>
              <span className="retention-desc">Structured application logs & stack traces indexed for full-text search.</span>
            </div>
            <div className="retention-card">
              <span className="retention-type">Incident Audit Logs</span>
              <span className="retention-val">365 Days</span>
              <span className="retention-desc">RCA evidence breakdowns, timelines, and post-mortems retained for compliance.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
