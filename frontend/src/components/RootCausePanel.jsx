import React from 'react';
import { ShieldAlertIcon, ZapIcon, CheckCircleIcon, ClockIcon, FlameIcon, BotIcon, FileTextIcon } from './Icons';

export default function RootCausePanel({ rcaResult, onRefreshRCA, onOpenBaselineModal, onOpenPostMortem, onOpenCopilot }) {
  const causes = rcaResult?.ranked_causes || [];
  const topCause = causes[0];
  const aiSummary = rcaResult?.ai_summary || "Mesh operating within healthy tolerances.";
  const recommendations = rcaResult?.recommended_actions || [];

  return (
    <div className="card" style={{ height: '560px', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div className="card-title">
          <ShieldAlertIcon className="w-5 h-5" style={{ color: topCause ? '#f43f5e' : '#10b981' }} />
          <span>Evidence-Based Root Cause Ranking</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.74rem' }}
            onClick={onOpenBaselineModal}
          >
            Baseline Comparison
          </button>
          {topCause && (
            <button 
              className="btn btn-cyber" 
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.74rem' }}
              onClick={onOpenPostMortem}
            >
              <FileTextIcon className="w-3.5 h-3.5" />
              Post-Mortem
            </button>
          )}
        </div>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem' }}>
        {causes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
            <CheckCircleIcon className="w-14 h-14" style={{ color: '#10b981', margin: '0 auto 1.25rem', opacity: 0.9 }} />
            <h3 style={{ color: '#fff', fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: 700 }}>Mesh Operating Nominally</h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '360px', margin: '0 auto', lineHeight: 1.5 }}>
              All 4 microservices operating within SLA thresholds. No anomalous trace failures or latency spikes.
            </p>
          </div>
        ) : (
          <>
            {/* Candidate Service Rankings */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.65rem' }}>
                Ranked Root Cause Candidates ({causes.length})
              </div>

              {causes.map((c, idx) => {
                const isTop = idx === 0;
                return (
                  <div key={c.service_name} className={`cause-item ${isTop ? 'top-cause' : ''}`}>
                    <div className="cause-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <span className="cause-rank-badge">#{idx + 1}</span>
                        <strong style={{ fontSize: '0.92rem', color: isTop ? '#fff' : '#cbd5e1' }}>
                          {c.display_name}
                        </strong>
                      </div>
                      <span style={{ 
                        fontSize: '1rem', 
                        fontWeight: 800, 
                        fontFamily: 'var(--font-mono)',
                        color: isTop ? '#f43f5e' : '#818cf8' 
                      }}>
                        {c.confidence_percentage}% Confidence
                      </span>
                    </div>

                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${c.confidence_percentage}%` }}></div>
                    </div>

                    {/* Evidence Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                      <span className="badge badge-blue">
                        Leaf Error Traces: {roundRatio(c.evidence?.trace_origin_ratio)}
                      </span>
                      <span className="badge badge-amber">
                        T0 Lead: +{c.evidence?.delay_from_t0_sec}s
                      </span>
                      <span className="badge badge-purple">
                        Z-Score: {c.evidence?.z_score}
                      </span>
                      {c.evidence?.topology_blast_radius?.length > 0 && (
                        <span className="badge badge-red">
                          Blast Radius: {c.evidence.topology_blast_radius.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Incident Analysis & Recommendations */}
            {topCause && (
              <div className="ai-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <h4>
                    <ZapIcon className="w-4 h-4" />
                    AI SRE Root Cause Diagnosis & Prescriptive Actions
                  </h4>
                  {onOpenCopilot && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                      onClick={onOpenCopilot}
                    >
                      <BotIcon className="w-3.5 h-3.5" />
                      Ask AI Copilot
                    </button>
                  )}
                </div>

                <p style={{ whiteSpace: 'pre-line', fontSize: '0.83rem', marginBottom: '0.85rem' }}>
                  {aiSummary}
                </p>

                {recommendations.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
                      Suggested SRE Remediation Actions:
                    </div>
                    <ul className="rec-list">
                      {recommendations.map((rec, i) => (
                        <li key={i} className="rec-item">
                          <span style={{ color: '#6366f1', fontWeight: 'bold' }}>{i + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function roundRatio(val) {
  if (val === undefined || val === null) return '0%';
  return `${Math.round(val * 100)}%`;
}
