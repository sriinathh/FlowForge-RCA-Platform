import React, { useState } from 'react';
import { ActivityIcon, ZapIcon, SendIcon, CheckCircleIcon, AlertTriangleIcon } from './Icons';

export default function TrafficGenerator({ onTrafficGenerated }) {
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [rps, setRps] = useState(25);
  const [autoLoad, setAutoLoad] = useState(false);

  const handleSendTransaction = async () => {
    setLoading(true);
    try {
      // Send request directly to API gateway
      const res = await fetch('http://127.0.0.1:8001/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: 'prod_982', qty: 1 })
      });
      const data = await res.json();
      setLastResponse({
        status: res.status,
        data: data,
        success: res.ok,
        time: new Date().toLocaleTimeString()
      });
      if (onTrafficGenerated) onTrafficGenerated();
    } catch (err) {
      setLastResponse({
        status: 'CONN_ERR',
        data: { error: `Connection failed: ${err.message}. Ensure API Gateway (:8001) is running.` },
        success: false,
        time: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <div className="card-title">
          <ActivityIcon className="w-5 h-5" style={{ color: '#06b6d4' }} />
          Synthetic Load Generator & Live Traffic Dispatcher
        </div>
        <span className="badge badge-cyan">
          Ingress Target: API Gateway (:8001)
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1rem' }}>
            Dispatch live distributed request transactions through the <strong>API Gateway → Order Service → User/Payment</strong> path to generate OpenTelemetry traces and test dynamic RCA detection.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={handleSendTransaction}
              disabled={loading}
            >
              <SendIcon className="w-4 h-4" />
              {loading ? 'Dispatching Request...' : 'Send Live Checkout Transaction'}
            </button>
          </div>
        </div>

        {/* Response box */}
        <div style={{ padding: '0.9rem', background: '#070b14', borderRadius: '10px', border: '1px solid var(--border-subtle)', minHeight: '85px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.72rem', color: '#64748b' }}>
            <span>Last Gateway Transaction Response</span>
            {lastResponse && <span>{lastResponse.time}</span>}
          </div>

          {lastResponse ? (
            <div style={{ fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span className={`badge ${lastResponse.success ? 'badge-green' : 'badge-red'}`}>
                  HTTP {lastResponse.status}
                </span>
                {lastResponse.data?.trace_id && (
                  <span className="mono" style={{ fontSize: '0.72rem', color: '#6366f1' }}>
                    trace:{lastResponse.data.trace_id.substring(0, 10)}...
                  </span>
                )}
                {lastResponse.data?.duration_ms && (
                  <span className="mono" style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                    {lastResponse.data.duration_ms}ms
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.72rem', color: lastResponse.success ? '#94a3b8' : '#fca5a5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {JSON.stringify(lastResponse.data)}
              </div>
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.78rem', fontStyle: 'italic', paddingTop: '0.5rem' }}>
              Click "Send Live Checkout Transaction" to dispatch an end-to-end W3C distributed trace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
