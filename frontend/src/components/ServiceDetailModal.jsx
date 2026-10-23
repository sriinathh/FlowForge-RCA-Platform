import React, { useState } from 'react';
import { ServerIcon, XCircleIcon, ZapIcon, ActivityIcon, ArrowRight, ShieldAlertIcon } from './Icons';
import { api } from '../api/client';

export default function ServiceDetailModal({ service, onClose, onChaosInjected }) {
  if (!service) return null;

  const [injecting, setInjecting] = useState(false);
  const [latencyVal, setLatencyVal] = useState(2500);

  const handleInjectCustom = async () => {
    setInjecting(true);
    try {
      // Find scenario matching this service
      let scenarioKey = 'payment_timeout';
      if (service.name === 'user-service') scenarioKey = 'user_db_deadlock';
      else if (service.name === 'order-service') scenarioKey = 'order_cpu_throttle';
      else if (service.name === 'api-gateway') scenarioKey = 'gateway_connection_reset';

      await api.injectChaos(scenarioKey);
      if (onChaosInjected) onChaosInjected();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '1.5rem'
    }}>
      <div className="card" style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="card-header">
          <div className="card-title">
            <ServerIcon className="w-5 h-5" style={{ color: service.health === 'HEALTHY' ? '#10b981' : '#f43f5e' }} />
            <span>{service.label}</span>
            <span className="mono" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>:{service.port}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>

        <div>
          {/* Status Chip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span className={`badge badge-${service.health === 'HEALTHY' ? 'green' : (service.health === 'DEGRADED' ? 'amber' : 'red')}`} style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
              ● {service.health} STATUS
            </span>
            <span className="mono" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Endpoint: {service.endpoint}
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>P95 Latency</div>
              <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
                {service.p95}ms
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Avg Latency</div>
              <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#cbd5e1', marginTop: '0.2rem' }}>
                {service.avgLatency}ms
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Error Rate</div>
              <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: service.errorRate > 5 ? '#f43f5e' : '#10b981', marginTop: '0.2rem' }}>
                {service.errorRate}%
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Throughput</div>
              <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
                {service.rps} rps
              </div>
            </div>
          </div>

          {/* Fault Injection Quick Trigger */}
          <div style={{ padding: '1.1rem', background: 'rgba(244, 63, 94, 0.06)', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.3)', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ZapIcon className="w-5 h-5" style={{ color: '#f43f5e' }} />
              <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Inject Fault Directly into {service.label}</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.85rem' }}>
              Forces anomaly conditions on this service to test FlowForge's leaf trace attribution and blast radius calculation.
            </p>
            <button 
              className="btn btn-danger" 
              onClick={handleInjectCustom} 
              disabled={injecting}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {injecting ? 'Injecting Chaos...' : `Trigger Anomaly on ${service.label}`}
            </button>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
