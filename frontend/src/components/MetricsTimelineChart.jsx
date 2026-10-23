import React, { useState, useEffect } from 'react';
import { TrendingUpIcon, ActivityIcon, ClockIcon } from './Icons';
import { api } from '../api/client';

const SERVICE_COLORS = {
  'payment-service': '#f43f5e',
  'order-service': '#6366f1',
  'api-gateway': '#06b6d4',
  'user-service': '#10b981',
};

export default function MetricsTimelineChart() {
  const [metricType, setMetricType] = useState('latency_ms'); // latency_ms, error_rate_pct
  const [seriesData, setSeriesData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSeries();
    const interval = setInterval(loadSeries, 4000);
    return () => clearInterval(interval);
  }, [metricType]);

  const loadSeries = async () => {
    try {
      const res = await api.getMetricSeries('', metricType);
      setSeriesData(res.series || []);
    } catch (err) {
      console.warn("Series load:", err);
    }
  };

  // Group by service
  const grouped = {};
  seriesData.forEach(pt => {
    grouped[pt.service] = grouped[pt.service] || [];
    grouped[pt.service].push(pt);
  });

  const services = ['payment-service', 'order-service', 'api-gateway', 'user-service'];

  // Calculate scales for SVG
  const width = 850;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 30, left: 50 };

  const allValues = seriesData.map(d => d.value);
  const maxVal = Math.max(10, ...(allValues.length ? allValues : [100]));
  const minVal = 0;

  const getPoints = (pts) => {
    if (!pts || pts.length < 2) return '';
    return pts.map((pt, i) => {
      const x = padding.left + (i / (pts.length - 1)) * (width - padding.left - padding.right);
      const y = height - padding.bottom - ((pt.value - minVal) / (maxVal - minVal || 1)) * (height - padding.top - padding.bottom);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <div className="card-title">
          <TrendingUpIcon className="w-5 h-5" style={{ color: '#06b6d4' }} />
          Synchronized Temporal Metric Sequencer ($T_0$ Anomaly Detection)
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.75rem' }}>
            {services.map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: SERVICE_COLORS[s] }}></span>
                <span style={{ color: '#cbd5e1' }}>{s}</span>
              </div>
            ))}
          </div>

          {/* Toggle buttons */}
          <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(255,255,255,0.04)', padding: '0.2rem', borderRadius: '8px' }}>
            <button
              className="btn"
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.72rem',
                background: metricType === 'latency_ms' ? 'var(--primary)' : 'transparent',
                color: '#fff'
              }}
              onClick={() => setMetricType('latency_ms')}
            >
              Latency (ms)
            </button>
            <button
              className="btn"
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.72rem',
                background: metricType === 'error_rate_pct' ? 'var(--primary)' : 'transparent',
                color: '#fff'
              }}
              onClick={() => setMetricType('error_rate_pct')}
            >
              Error Rate (%)
            </button>
          </div>
        </div>
      </div>

      {/* SVG Multi-Line Chart */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '240px' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - padding.bottom - pct * (height - padding.top - padding.bottom);
            const val = Math.round(minVal + pct * (maxVal - minVal));
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  {val}{metricType === 'error_rate_pct' ? '%' : 'ms'}
                </text>
              </g>
            );
          })}

          {/* Render lines for each service */}
          {services.map(s => {
            const pts = grouped[s] || [];
            const polyline = getPoints(pts);
            if (!polyline) return null;

            return (
              <g key={s}>
                <polyline
                  fill="none"
                  stroke={SERVICE_COLORS[s]}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polyline}
                />
                {/* Last point marker */}
                {pts.length > 0 && (
                  <circle
                    cx={padding.left + (pts.length - 1) / (pts.length - 1 || 1) * (width - padding.left - padding.right)}
                    cy={height - padding.bottom - ((pts[pts.length - 1].value - minVal) / (maxVal - minVal || 1)) * (height - padding.top - padding.bottom)}
                    r="4"
                    fill={SERVICE_COLORS[s]}
                    boxShadow={`0 0 10px ${SERVICE_COLORS[s]}`}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.72rem', color: '#64748b' }}>
        <span>← Earlier (T0 Anomaly Onset)</span>
        <span>FlowForge Multi-Signal Temporal Timeline</span>
        <span>Latest Realtime →</span>
      </div>
    </div>
  );
}
