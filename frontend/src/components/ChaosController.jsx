import React, { useState } from 'react';
import { ZapIcon, RefreshIcon, ShieldAlertIcon, CheckCircleIcon } from './Icons';
import { api } from '../api/client';

export default function ChaosController({ onFaultInjected, onFaultCleared }) {
  const [injecting, setInjecting] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const scenarios = [
    {
      key: 'payment_timeout',
      title: 'Payment Gateway Latency & 504 Spike',
      target: 'payment-service',
      type: 'Cascading Timeout',
      desc: 'Simulates 2800ms payment delay and 504 Gateway Timeout. Triggers cascading failure in Order Service and Gateway.',
      accent: '#f43f5e'
    },
    {
      key: 'user_db_deadlock',
      title: 'User DB Deadlock & 500 Error Storm',
      target: 'user-service',
      type: 'Database Deadlock',
      desc: 'Simulates PostgreSQL connection pool exhaustion on /users/validate, causing 500 Internal Server Errors.',
      accent: '#f59e0b'
    },
    {
      key: 'order_cpu_throttle',
      title: 'Order Orchestration Thread Starvation',
      target: 'order-service',
      type: 'Resource Exhaustion',
      desc: 'Simulates thread pool exhaustion and queue saturation on /orders/process with 1600ms latency.',
      accent: '#06b6d4'
    },
    {
      key: 'gateway_connection_reset',
      title: 'API Gateway Ingress Socket Reset',
      target: 'api-gateway',
      type: 'Edge Ingress Drop',
      desc: 'Simulates reverse proxy socket exhaustion returning HTTP 503 directly at edge.',
      accent: '#8b5cf6'
    }
  ];

  const handleInject = async (key, name) => {
    setInjecting(true);
    try {
      await api.injectChaos(key);
      setLastAction({ success: true, message: `Injected "${name}". RCA engine active.` });
      if (onFaultInjected) onFaultInjected();
    } catch (err) {
      setLastAction({ success: false, message: `Injection failed: ${err.message}` });
    } finally {
      setInjecting(false);
    }
  };

  const handleClear = async () => {
    setInjecting(true);
    try {
      await api.injectChaos('clear_faults');
      setLastAction({ success: true, message: 'All faults cleared. Restored baseline health.' });
      if (onFaultCleared) onFaultCleared();
    } catch (err) {
      setLastAction({ success: false, message: `Clear failed: ${err.message}` });
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
            Chaos & Fault Injection Center
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Inject controlled anomalies into local microservices to evaluate FlowForge's RCA identification accuracy.
          </p>
        </div>

        <button 
          className="btn btn-secondary"
          onClick={handleClear}
          disabled={injecting}
        >
          <RefreshIcon className="w-4 h-4" />
          Clear All Faults & Reset
        </button>
      </div>

      {lastAction && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: lastAction.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
          border: `1px solid ${lastAction.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          color: lastAction.success ? '#10b981' : '#f43f5e'
        }}>
          {lastAction.success ? <CheckCircleIcon className="w-4 h-4" /> : <ShieldAlertIcon className="w-4 h-4" />}
          {lastAction.message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {scenarios.map((sc) => (
          <div key={sc.key} className="scenario-card">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span className="badge" style={{ background: `${sc.accent}20`, color: sc.accent, border: `1px solid ${sc.accent}50` }}>
                  {sc.type}
                </span>
                <span className="mono" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {sc.target}
                </span>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                {sc.title}
              </h3>

              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4, marginBottom: '1.25rem' }}>
                {sc.desc}
              </p>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => handleInject(sc.key, sc.title)}
              disabled={injecting}
            >
              <ZapIcon className="w-4 h-4" />
              {injecting ? 'Injecting Chaos...' : 'Inject Chaos Scenario'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
