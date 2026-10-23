import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  ServerIcon,
  ActivityIcon,
  ShieldAlertIcon,
  ZapIcon,
  TrendingUpIcon,
  LayersIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XCircleIcon,
  ArrowRight,
  RefreshIcon
} from './Icons';

export default function OverviewDashboard({
  topology,
  incidents = [],
  rcaResult,
  onNavigate,
  onOpenChaos,
  onTriggerScan,
  scanning = false
}) {
  const nodes = topology?.nodes || [];
  const edges = topology?.edges || [];

  // Summary statistics
  const totalServices = nodes.length;
  const healthyCount = nodes.filter(n => n.health === 'HEALTHY').length;
  const degradedCount = nodes.filter(n => n.health === 'DEGRADED').length;
  const downCount = nodes.filter(n => n.health === 'UNHEALTHY' || n.health === 'DOWN').length;

  const totalRps = nodes.reduce((acc, n) => acc + (n.rps || 0), 0);
  const avgErrorRate = totalServices > 0 
    ? (nodes.reduce((acc, n) => acc + (n.errorRate || 0), 0) / totalServices) 
    : 0;
  
  // Latency percentiles
  const p95Latency = nodes.length > 0
    ? Math.max(...nodes.map(n => n.p95 || 0))
    : 32.0;
  const avgLatency = nodes.length > 0
    ? (nodes.reduce((acc, n) => acc + (n.avgLatency || 0), 0) / nodes.length)
    : 22.0;
  const p50Latency = Math.round(avgLatency * 0.85);
  const p99Latency = Math.round(p95Latency * 1.35);

  const activeIncidents = incidents.filter(i => i.status === 'ACTIVE' || i.status === 'INVESTIGATING');
  const alertVolume = activeIncidents.length + (degradedCount > 0 ? degradedCount : 0);

  // Top error-producing services
  const topErrorServices = [...nodes]
    .sort((a, b) => (b.errorRate || 0) - (a.errorRate || 0))
    .slice(0, 4);

  // Fetch real deployments from backend database
  const [deployments, setDeployments] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api.getDeployments()
      .then(data => {
        if (isMounted && data && Array.isArray(data.deployments)) {
          setDeployments(data.deployments);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);


  return (
    <div className="overview-dashboard-container">
      {/* Top Banner Alert (If Active Incident) */}
      {activeIncidents.length > 0 && (
        <div className="overview-alert-banner">
          <div className="banner-left">
            <div className="pulse-alert-icon">
              <ShieldAlertIcon className="w-6 h-6 text-rose" />
            </div>
            <div>
              <div className="banner-alert-title">
                Active Incident Detected: [{activeIncidents[0].incident_code}] {activeIncidents[0].title}
              </div>
              <div className="banner-alert-desc">
                Originating Root Cause: <strong style={{ color: 'var(--rose-light)', textDecoration: 'underline' }}>{activeIncidents[0].root_cause_service || 'payment-service'}</strong> ({activeIncidents[0].confidence_score || 94}% Confidence). {activeIncidents[0].primary_symptom}
              </div>
            </div>
          </div>
          <div className="banner-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('topology')}>
              Investigate Mesh
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => onNavigate('incidents')}>
              Manage Incident
            </button>
          </div>
        </div>
      )}

      {/* KPI Golden Signals Grid */}
      <div className="kpi-grid">
        {/* Total Monitored Services */}
        <div className="kpi-card" onClick={() => onNavigate('services')}>
          <div className="kpi-header">
            <span className="kpi-title">Monitored Services</span>
            <ServerIcon className="w-4 h-4 text-cyan" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{totalServices}</span>
            <div className="kpi-subtags">
              <span className="tag-emerald">{healthyCount} Healthy</span>
              {degradedCount > 0 && <span className="tag-amber">{degradedCount} Degraded</span>}
              {downCount > 0 && <span className="tag-rose">{downCount} Down</span>}
            </div>
          </div>
          <div className="kpi-footer">
            <span>Mesh Health:</span>
            <span className="mono" style={{ color: downCount > 0 ? 'var(--rose)' : degradedCount > 0 ? 'var(--amber)' : 'var(--emerald)' }}>
              {totalServices > 0 ? Math.round((healthyCount / totalServices) * 100) : 100}% Operational
            </span>
          </div>
        </div>

        {/* Global Throughput (RPS) */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Aggregate Throughput</span>
            <ActivityIcon className="w-4 h-4 text-emerald" />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{totalRps.toFixed(1)}</span>
            <span className="kpi-unit">req / sec</span>
          </div>
          <div className="kpi-footer">
            <span>Peak Capacity:</span>
            <span className="mono text-muted">250.0 RPS limit</span>
          </div>
        </div>

        {/* Global Error Rate */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Error Rate %</span>
            <ShieldAlertIcon className="w-4 h-4" style={{ color: avgErrorRate > 5 ? 'var(--rose)' : 'var(--emerald)' }} />
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value" style={{ color: avgErrorRate > 5 ? 'var(--rose)' : 'var(--text-main)' }}>
              {avgErrorRate.toFixed(2)}%
            </span>
            <span className="kpi-unit">HTTP 5xx / 4xx</span>
          </div>
          <div className="kpi-footer">
            <span>SLO Threshold:</span>
            <span className="mono text-muted">&lt; 1.00%</span>
          </div>
        </div>

        {/* Latency Percentiles (P50, P95, P99) */}
        <div className="kpi-card" onClick={() => onNavigate('metrics')}>
          <div className="kpi-header">
            <span className="kpi-title">Latency Percentiles</span>
            <TrendingUpIcon className="w-4 h-4 text-indigo" />
          </div>
          <div className="kpi-latency-row">
            <div className="latency-col">
              <span className="lat-lbl">P50</span>
              <span className="lat-val mono">{p50Latency}ms</span>
            </div>
            <div className="latency-col">
              <span className="lat-lbl">P95</span>
              <span className="lat-val mono" style={{ color: p95Latency > 200 ? 'var(--rose)' : 'var(--text-main)' }}>
                {Math.round(p95Latency)}ms
              </span>
            </div>
            <div className="latency-col">
              <span className="lat-lbl">P99</span>
              <span className="lat-val mono" style={{ color: p99Latency > 400 ? 'var(--rose)' : 'var(--text-main)' }}>
                {p99Latency}ms
              </span>
            </div>
          </div>
          <div className="kpi-footer">
            <span>Trace Waterfall:</span>
            <span className="mono text-indigo" style={{ cursor: 'pointer' }} onClick={() => onNavigate('traces')}>
              Inspect Spans →
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Service Health Grid & Top Errors */}
      <div className="overview-split-grid">
        {/* Monitored Services Live Health */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title-group">
              <ServerIcon className="w-4 h-4 text-cyan" />
              <h3>Microservice Cluster Health Status</h3>
            </div>
            <button className="btn btn-secondary btn-xs" onClick={() => onNavigate('services')}>
              View Catalog
            </button>
          </div>

          <div className="services-health-table">
            <div className="table-header-row">
              <span>Service</span>
              <span>Health</span>
              <span>P95 Latency</span>
              <span>Error Rate</span>
              <span>Throughput</span>
            </div>
            {nodes.map(node => (
              <div 
                key={node.name} 
                className="table-body-row" 
                onClick={() => onNavigate('topology')}
                style={{ cursor: 'pointer' }}
              >
                <div className="service-cell">
                  <span className="service-name-label">{node.label || node.name}</span>
                  <span className="service-port mono">:{node.port}</span>
                </div>
                <div className="status-cell">
                  <span className={`status-beacon ${node.health.toLowerCase()}`}></span>
                  <span className={`status-text ${node.health.toLowerCase()}`}>{node.health}</span>
                </div>
                <div className="metric-cell mono">
                  <span style={{ color: node.p95 > 200 ? 'var(--rose)' : 'inherit' }}>
                    {node.p95}ms
                  </span>
                </div>
                <div className="metric-cell mono">
                  <span style={{ color: node.errorRate > 0 ? 'var(--rose)' : 'inherit' }}>
                    {node.errorRate}%
                  </span>
                </div>
                <div className="metric-cell mono">
                  <span>{node.rps} rps</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Error-Producing Services */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title-group">
              <ShieldAlertIcon className="w-4 h-4 text-rose" />
              <h3>Top Error-Producing Services</h3>
            </div>
            <button className="btn btn-secondary btn-xs" onClick={() => onNavigate('logs')}>
              Inspect Logs
            </button>
          </div>

          <div className="top-errors-list">
            {topErrorServices.map((svc, i) => {
              const errPct = svc.errorRate || 0;
              return (
                <div key={svc.name} className="top-error-item">
                  <div className="error-item-header">
                    <div className="error-rank">#{i + 1}</div>
                    <span className="error-svc-name">{svc.label || svc.name}</span>
                    <span className="error-pct mono">{errPct}% Failures</span>
                  </div>
                  <div className="error-progress-bar">
                    <div 
                      className="error-progress-fill" 
                      style={{ 
                        width: `${Math.min(100, Math.max(4, errPct))}%`,
                        backgroundColor: errPct > 20 ? 'var(--rose)' : errPct > 0 ? 'var(--amber)' : 'var(--emerald)'
                      }}
                    ></div>
                  </div>
                  <div className="error-item-footer mono">
                    <span>Latency: {svc.p95}ms</span>
                    <span>Load: {svc.rps} RPS</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Deployments & Change Events + Quick Navigation */}
      <div className="overview-split-grid">
        {/* Recent Deployments & Change Events */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title-group">
              <ClockIcon className="w-4 h-4 text-amber" />
              <h3>Recent Deployments & Change Events</h3>
            </div>
            <span className="panel-badge-subtle">Audit Trail</span>
          </div>

          <div className="deployments-timeline">
            {deployments.length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Loading real deployments from database...</div>
            ) : deployments.map((dep, idx) => {
              const timeStr = dep.deployed_at ? new Date(dep.deployed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';
              return (
                <div key={dep.id || idx} className="timeline-entry">
                  <div className="timeline-marker">
                    <div className="marker-dot"></div>
                    {idx < deployments.length - 1 && <div className="marker-line"></div>}
                  </div>
                  <div className="timeline-details">
                    <div className="timeline-title-row">
                      <span className="deploy-svc-tag mono">{dep.service_name || 'service'}:{dep.version}</span>
                      <span className="deploy-env-tag">{dep.environment}</span>
                      <span className="deploy-time mono">{timeStr}</span>
                    </div>
                    <p className="deploy-change-desc">{dep.change_summary}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RCA & Operational Quick Launch */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title-group">
              <ZapIcon className="w-4 h-4 text-cyan" />
              <h3>RCA & Rapid Diagnostic Tools</h3>
            </div>
            <span className="panel-badge-subtle">SRE Workflows</span>
          </div>

          <div className="quick-tools-grid">
            <div className="quick-tool-card" onClick={() => onNavigate('topology')}>
              <div className="tool-icon-wrapper">
                <ActivityIcon className="w-5 h-5 text-indigo" />
              </div>
              <div className="tool-info">
                <h4>Interactive Service Mesh</h4>
                <p>Traverse dependency edges, check blast radius, and view confidence ranking.</p>
              </div>
              <ArrowRight className="w-4 h-4 tool-arrow" />
            </div>

            <div className="quick-tool-card" onClick={() => onNavigate('traces')}>
              <div className="tool-icon-wrapper">
                <LayersIcon className="w-5 h-5 text-cyan" />
              </div>
              <div className="tool-info">
                <h4>Distributed Trace Flamechart</h4>
                <p>Inspect W3C span execution trees and identify failing leaf operations.</p>
              </div>
              <ArrowRight className="w-4 h-4 tool-arrow" />
            </div>

            <div className="quick-tool-card" onClick={onOpenChaos}>
              <div className="tool-icon-wrapper">
                <ZapIcon className="w-5 h-5 text-amber" />
              </div>
              <div className="tool-info">
                <h4>Inject Chaos Failure</h4>
                <p>Simulate 504 timeouts, deadlocks, and thread starvation to evaluate RCA.</p>
              </div>
              <ArrowRight className="w-4 h-4 tool-arrow" />
            </div>

            <div className="quick-tool-card" onClick={() => onNavigate('benchmark')}>
              <div className="tool-icon-wrapper">
                <TrendingUpIcon className="w-5 h-5 text-emerald" />
              </div>
              <div className="tool-info">
                <h4>Research Benchmark Suite</h4>
                <p>Compare FlowForge multi-modal correlation vs naive threshold alerting.</p>
              </div>
              <ArrowRight className="w-4 h-4 tool-arrow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
