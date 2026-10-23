import React, { useState, useEffect } from 'react';
import { LayersIcon, FlameIcon, AlertTriangleIcon, CheckCircleIcon, ClockIcon } from './Icons';
import { api } from '../api/client';

export default function TraceWaterfall() {
  const [traces, setTraces] = useState([]);
  const [selectedTraceId, setSelectedTraceId] = useState(null);
  const [waterfall, setWaterfall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [onlyErrors, setOnlyErrors] = useState(false);

  useEffect(() => {
    loadTraces();
  }, [onlyErrors]);

  const loadTraces = async () => {
    try {
      const data = await api.getTraces(onlyErrors);
      setTraces(data.traces || []);
      if (data.traces?.length > 0 && !selectedTraceId) {
        loadWaterfall(data.traces[0].trace_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadWaterfall = async (traceId) => {
    setSelectedTraceId(traceId);
    setLoading(true);
    try {
      const data = await api.getTraceWaterfall(traceId);
      setWaterfall(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid-2">
      {/* Left Column: Trace List */}
      <div className="card" style={{ height: '620px', display: 'flex', flexDirection: 'column' }}>
        <div className="card-header">
          <div className="card-title">
            <LayersIcon className="w-5 h-5" style={{ color: '#6366f1' }} />
            Distributed Traces Feed
          </div>
          <button 
            className={`btn ${onlyErrors ? 'btn-danger' : 'btn-secondary'}`}
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            onClick={() => setOnlyErrors(!onlyErrors)}
          >
            {onlyErrors ? 'Showing Errors Only' : 'Filter Errors'}
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {traces.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              No traces recorded yet. Run a chaos scenario to generate distributed telemetry.
            </div>
          ) : (
            traces.map((tr) => {
              const isSelected = selectedTraceId === tr.trace_id;
              return (
                <div
                  key={tr.trace_id}
                  onClick={() => loadWaterfall(tr.trace_id)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                      {tr.root_operation}
                    </span>
                    <span className={`badge ${tr.has_error ? 'badge-red' : 'badge-green'}`}>
                      {tr.has_error ? 'FAILED' : '200 OK'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span className="mono">{tr.trace_id.substring(0, 12)}...</span>
                    <span>{tr.duration_ms}ms</span>
                    <span>{tr.span_count} spans</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    {tr.services?.map(s => (
                      <span key={s} style={{ fontSize: '0.65rem', background: '#1e293b', padding: '0.1rem 0.35rem', borderRadius: '4px', color: '#93c5fd' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Waterfall Visualizer */}
      <div className="card" style={{ height: '620px', display: 'flex', flexDirection: 'column' }}>
        <div className="card-header">
          <div className="card-title">
            <FlameIcon className="w-5 h-5" style={{ color: '#f59e0b' }} />
            OpenTelemetry Span Flamechart / Waterfall
          </div>
          {waterfall && (
            <span className="mono" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Total: {waterfall.total_duration_ms}ms
            </span>
          )}
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading waterfall...</div>
          ) : !waterfall ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Select a trace to inspect its distributed span execution</div>
          ) : (
            <div>
              <div style={{ display: 'flex', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)', color: '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <div style={{ width: '220px' }}>Service & Operation</div>
                <div style={{ width: '70px' }}>Status</div>
                <div style={{ flex: 1 }}>Timeline & Latency Waterfall</div>
              </div>

              {waterfall.spans.map((span) => {
                const totalDur = Math.max(1, waterfall.total_duration_ms);
                const leftPct = (span.offset_ms / totalDur) * 100;
                const widthPct = Math.max(3, (span.duration_ms / totalDur) * 100);

                return (
                  <div key={span.span_id} className="waterfall-row">
                    <div style={{ width: '220px', overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', color: span.has_error ? '#f43f5e' : '#fff' }}>
                        {span.service_name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {span.operation_name}
                      </div>
                    </div>

                    <div style={{ width: '70px' }}>
                      <span className={`badge ${span.status_code >= 400 ? 'badge-red' : 'badge-green'}`} style={{ fontSize: '0.68rem' }}>
                        {span.status_code}
                      </span>
                    </div>

                    <div className="waterfall-bar-container">
                      <div
                        className={`waterfall-bar ${span.has_error ? 'error' : ''}`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        title={`${span.operation_name}: ${span.duration_ms}ms`}
                      ></div>
                    </div>
                    <span className="mono" style={{ fontSize: '0.72rem', width: '55px', textAlign: 'right', color: '#94a3b8' }}>
                      {span.duration_ms}ms
                    </span>
                  </div>
                );
              })}

              {/* Error Explanation if trace failed */}
              {waterfall.spans.some(s => s.has_error) && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px' }}>
                  <div style={{ color: '#f43f5e', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangleIcon className="w-4 h-4" />
                    Leaf Span Error Detail:
                  </div>
                  {waterfall.spans.filter(s => s.has_error).map(s => (
                    <div key={s.span_id} style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                      <strong>[{s.service_name}]</strong>: {s.error_message || `HTTP ${s.status_code} Failure`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
