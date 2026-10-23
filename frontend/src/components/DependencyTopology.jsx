import React from 'react';
import { ServerIcon, ActivityIcon, ShieldAlertIcon, ZapIcon, TrendingUpIcon } from './Icons';

const NODE_POSITIONS = {
  'api-gateway': { x: 130, y: 230 },
  'order-service': { x: 440, y: 140 },
  'user-service': { x: 440, y: 330 },
  'payment-service': { x: 750, y: 140 },
};

export default function DependencyTopology({ topology, selectedService, onSelectService }) {
  const nodes = topology?.nodes || [];
  const edges = topology?.edges || [];

  return (
    <div className="card" style={{ height: '560px', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div className="card-title">
          <ActivityIcon className="w-5 h-5" style={{ color: '#06b6d4' }} />
          <span>Interactive Service Dependency Mesh</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge badge-blue">{nodes.length} Nodes</span>
          <span className="badge badge-green">OpenTelemetry Active</span>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>Click any node to inspect</span>
        </div>
      </div>

      <div className="topology-container" style={{ flex: 1 }}>
        <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="edgeNormal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="edgeError" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="1" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render directed dependency edges with bezier curves and moving packets */}
          {edges.map((edge) => {
            const srcPos = NODE_POSITIONS[edge.source] || { x: 100, y: 100 };
            const tgtPos = NODE_POSITIONS[edge.target] || { x: 300, y: 300 };
            const isDegraded = edge.errorRate > 5.0 || edge.avgLatency > 300;

            const pathD = `M ${srcPos.x} ${srcPos.y} Q ${(srcPos.x + tgtPos.x) / 2} ${(srcPos.y + tgtPos.y) / 2 - 25} ${tgtPos.x} ${tgtPos.y}`;

            return (
              <g key={edge.id}>
                {/* Edge line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isDegraded ? 'url(#edgeError)' : 'url(#edgeNormal)'}
                  strokeWidth={isDegraded ? "3" : "2"}
                  strokeDasharray={isDegraded ? "6 4" : "none"}
                  filter={isDegraded ? "url(#glow)" : "none"}
                />
                
                {/* Traffic packet animation */}
                <circle r={isDegraded ? "5" : "3.5"} fill={isDegraded ? "#f43f5e" : "#38bdf8"}>
                  <animateMotion
                    path={pathD}
                    dur={isDegraded ? "2.5s" : "1.6s"}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Return packet */}
                <circle r={isDegraded ? "4" : "2.5"} fill={isDegraded ? "#fb7185" : "#818cf8"} opacity="0.75">
                  <animateMotion
                    path={pathD}
                    dur={isDegraded ? "2.5s" : "1.6s"}
                    begin="0.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}
        </svg>

        {/* Render interactive service node cards */}
        {nodes.map((svc) => {
          const pos = NODE_POSITIONS[svc.name] || { x: 200, y: 200 };
          const isSelected = selectedService === svc.name;
          const statusClass = svc.health.toLowerCase();

          return (
            <div
              key={svc.name}
              className={`topology-node ${statusClass} ${isSelected ? 'selected' : ''}`}
              style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
              onClick={() => onSelectService(svc.name)}
              title="Click to view deep dive inspection"
            >
              <div className="node-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <ServerIcon className="w-4 h-4" style={{ color: svc.health === 'HEALTHY' ? '#10b981' : '#f43f5e' }} />
                  <span className="node-name">{svc.label}</span>
                </div>
                <span className="node-port">:{svc.port}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className={`badge badge-${svc.health === 'HEALTHY' ? 'green' : (svc.health === 'DEGRADED' ? 'amber' : 'red')}`}>
                  {svc.health}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  {svc.rps} rps
                </span>
              </div>

              {/* Sparkline mini-meter */}
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', margin: '4px 0' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(10, (svc.p95 / 1500) * 100))}%`,
                  background: svc.health === 'HEALTHY' ? '#10b981' : '#f43f5e',
                  borderRadius: '2px'
                }}></div>
              </div>

              <div className="node-metrics">
                <div className="node-metric-item">
                  p95: <span className="node-metric-val">{svc.p95}ms</span>
                </div>
                <div className="node-metric-item">
                  Err: <span className="node-metric-val" style={{ color: svc.errorRate > 5 ? '#f43f5e' : '#10b981' }}>
                    {svc.errorRate}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
