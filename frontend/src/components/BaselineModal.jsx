import React, { useState, useEffect } from 'react';
import { XCircleIcon, AlertTriangleIcon, CheckCircleIcon, ZapIcon } from './Icons';
import { api } from '../api/client';

export default function BaselineModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadComparison();
    }
  }, [isOpen]);

  const loadComparison = async () => {
    setLoading(true);
    try {
      const res = await api.getBaselineComparison();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem'
    }}>
      <div className="card" style={{ maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-header">
          <div className="card-title">
            <ZapIcon className="w-5 h-5" style={{ color: '#6366f1' }} />
            Baseline Evaluation: Traditional Alerting vs FlowForge RCA
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        {loading || !data ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading comparison...</div>
        ) : (
          <div>
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.25)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <strong style={{ color: '#818cf8' }}>Research Question: </strong>
              <span style={{ color: '#cbd5e1' }}>{data.research_hypothesis}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Traditional Baseline */}
              <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <AlertTriangleIcon className="w-5 h-5" style={{ color: '#f43f5e' }} />
                  <h4 style={{ color: '#f43f5e', fontSize: '0.95rem' }}>Traditional Threshold Alerting</h4>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Alerts Fired: </strong>
                    <span className="badge badge-red">{data.traditional_threshold_alerting?.total_alerts_fired} Simultaneous Alerts</span>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Pinpoints Origin: </strong>
                    <span style={{ color: '#f43f5e', fontWeight: 600 }}>NO (Alert Storm)</span>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Alerted Services: </strong>
                    <div style={{ marginTop: '0.2rem', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      {data.traditional_threshold_alerting?.alerted_services?.map(s => (
                        <span key={s} className="badge" style={{ background: '#334155', color: '#e2e8f0' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {data.traditional_threshold_alerting?.diagnosis}
                  </div>
                </div>
              </div>

              {/* FlowForge RCA */}
              <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <CheckCircleIcon className="w-5 h-5" style={{ color: '#10b981' }} />
                  <h4 style={{ color: '#10b981', fontSize: '0.95rem' }}>FlowForge Evidence RCA</h4>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Ranked Root Cause: </strong>
                    <span className="badge badge-green" style={{ fontSize: '0.8rem' }}>
                      {data.flowforge_evidence_rca?.identified_root_cause}
                    </span>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Confidence Score: </strong>
                    <span style={{ color: '#10b981', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {data.flowforge_evidence_rca?.confidence_score}%
                    </span>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Noise Suppression: </strong>
                    <span style={{ color: '#38bdf8' }}>{data.flowforge_evidence_rca?.false_positive_reduction}</span>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>Correlated Telemetry Dimensions:</strong>
                    <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                      {data.flowforge_evidence_rca?.correlated_signals?.map((sig, i) => (
                        <li key={i}>{sig}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={onClose}>
                Close Comparison
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
