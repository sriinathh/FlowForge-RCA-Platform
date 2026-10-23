import React, { useState } from 'react';
import { BarChartIcon, ZapIcon, CheckCircleIcon, ShieldAlertIcon } from './Icons';
import { api } from '../api/client';

export default function EvaluationBenchmark() {
  const [running, setRunning] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [trials, setTrials] = useState(10);

  const handleRunBenchmark = async () => {
    setRunning(true);
    try {
      const data = await api.runBenchmark(trials);
      setBenchmarkResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
            Academic Evaluation & Research Benchmark Suite
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Empirical evaluation comparing FlowForge Multi-Event Correlation against Traditional Threshold Alerting.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select 
            value={trials} 
            onChange={(e) => setTrials(Number(e.target.value))}
            style={{ 
              background: '#0f172a', 
              color: '#fff', 
              border: '1px solid var(--border-subtle)', 
              padding: '0.5rem 0.75rem', 
              borderRadius: '8px', 
              fontSize: '0.85rem' 
            }}
          >
            <option value={5}>5 Trials</option>
            <option value={10}>10 Trials (Standard)</option>
            <option value={20}>20 Trials (Exhaustive)</option>
          </select>

          <button 
            className="btn btn-primary"
            onClick={handleRunBenchmark}
            disabled={running}
          >
            <ZapIcon className="w-4 h-4" />
            {running ? `Running ${trials} Injections...` : 'Execute Benchmark Suite'}
          </button>
        </div>
      </div>

      {/* Evaluation Results Banner / Metrics */}
      {benchmarkResult ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="eval-stat-box" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                FlowForge Accuracy
              </div>
              <div className="eval-number" style={{ color: '#10b981' }}>
                {benchmarkResult.flowforge_accuracy_pct}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.3rem' }}>
                vs {benchmarkResult.threshold_accuracy_pct}% (Threshold Alerting)
              </div>
            </div>

            <div className="eval-stat-box" style={{ borderColor: 'rgba(99, 102, 241, 0.4)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Accuracy Improvement
              </div>
              <div className="eval-number" style={{ color: '#818cf8' }}>
                {benchmarkResult.accuracy_improvement_multiplier}x
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                Identification Precision Multiplier
              </div>
            </div>

            <div className="eval-stat-box" style={{ borderColor: 'rgba(6, 182, 212, 0.4)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Mean Time To Identify (MTTI)
              </div>
              <div className="eval-number" style={{ color: '#06b6d4' }}>
                {benchmarkResult.mean_time_to_identify_sec}s
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                Average T0 to root-cause diagnosis
              </div>
            </div>

            <div className="eval-stat-box" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Alert Noise Reduction
              </div>
              <div className="eval-number" style={{ color: '#f59e0b' }}>
                {benchmarkResult.false_positive_reduction_pct}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                Suppressed secondary cascade alerts
              </div>
            </div>
          </div>

          {/* Trial by Trial Breakdown */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <BarChartIcon className="w-5 h-5" style={{ color: '#6366f1' }} />
                Trial-by-Trial Experimental Results ({benchmarkResult.total_trials} Test Runs)
              </div>
              <span className="badge badge-blue">
                Avg Latency: {benchmarkResult.avg_processing_latency_ms}ms
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="trace-table">
                <thead>
                  <tr>
                    <th>Trial</th>
                    <th>Injected Scenario</th>
                    <th>Ground Truth Fault</th>
                    <th>FlowForge RCA Predicted</th>
                    <th>Confidence</th>
                    <th>FlowForge Match</th>
                    <th>Threshold Baseline</th>
                    <th>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkResult.detailed_results?.map((res) => (
                    <tr key={res.trial}>
                      <td className="mono">#{res.trial}</td>
                      <td style={{ color: '#fff', fontWeight: 500 }}>{res.scenario}</td>
                      <td className="mono" style={{ color: '#f43f5e' }}>{res.ground_truth}</td>
                      <td className="mono" style={{ color: '#818cf8', fontWeight: 600 }}>{res.flowforge_prediction}</td>
                      <td>
                        <span className="badge badge-blue">{res.flowforge_confidence}%</span>
                      </td>
                      <td>
                        {res.flowforge_success ? (
                          <span className="badge badge-green">CORRECT</span>
                        ) : (
                          <span className="badge badge-red">MISSED</span>
                        )}
                      </td>
                      <td>
                        {res.threshold_success ? (
                          <span className="badge badge-green">CORRECT</span>
                        ) : (
                          <span className="badge badge-amber">ALERT STORM</span>
                        )}
                      </td>
                      <td className="mono">{res.processing_latency_ms}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <BarChartIcon className="w-16 h-16" style={{ color: '#6366f1', margin: '0 auto 1.5rem', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>
            No Benchmark Run in Current Session
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '600px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            Click <strong>"Execute Benchmark Suite"</strong> above to simulate controlled multi-service chaos failures and automatically measure Root Cause Identification Accuracy, MTTI, and Alert Suppression Rates.
          </p>
          <button className="btn btn-primary" onClick={handleRunBenchmark} disabled={running}>
            <ZapIcon className="w-4 h-4" />
            {running ? 'Running Benchmark...' : 'Run Automated 10-Trial Benchmark'}
          </button>
        </div>
      )}
    </div>
  );
}
