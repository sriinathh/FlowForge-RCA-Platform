import React, { useState, useEffect } from 'react';
import { TerminalIcon, RefreshIcon, FilterIcon } from './Icons';
import { api } from '../api/client';

export default function LogsTerminal() {
  const [logs, setLogs] = useState([]);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterService, setFilterService] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 3000);
    return () => clearInterval(interval);
  }, [filterLevel, filterService]);

  const loadLogs = async () => {
    try {
      const res = await api.getLogs();
      setLogs(res.logs || []);
    } catch (err) {
      console.warn("Log fetch:", err);
    }
  };

  const filteredLogs = logs.filter(l => {
    if (filterLevel && l.level !== filterLevel) return false;
    if (filterService && l.service_name !== filterService) return false;
    if (searchQuery && !l.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <TerminalIcon className="w-5 h-5" style={{ color: '#10b981' }} />
          Distributed Telemetry & Application Logs Terminal
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Search box */}
          <input
            type="text"
            placeholder="Search log messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: '#090e1a',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.35rem 0.75rem',
              color: '#fff',
              fontSize: '0.78rem',
              width: '200px'
            }}
          />

          {/* Severity filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            style={{
              background: '#090e1a',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.35rem 0.6rem',
              color: '#fff',
              fontSize: '0.78rem'
            }}
          >
            <option value="">All Levels</option>
            <option value="ERROR">ERROR</option>
            <option value="WARN">WARN</option>
            <option value="INFO">INFO</option>
          </select>

          {/* Service filter */}
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            style={{
              background: '#090e1a',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.35rem 0.6rem',
              color: '#fff',
              fontSize: '0.78rem'
            }}
          >
            <option value="">All Services</option>
            <option value="api-gateway">api-gateway</option>
            <option value="order-service">order-service</option>
            <option value="payment-service">payment-service</option>
            <option value="user-service">user-service</option>
          </select>
        </div>
      </div>

      {/* Terminal View */}
      <div className="terminal-window">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="terminal-dot red"></span>
            <span className="terminal-dot yellow"></span>
            <span className="terminal-dot green"></span>
          </div>
          <span className="mono" style={{ fontSize: '0.72rem', color: '#64748b' }}>
            tail -f /var/log/flowforge/telemetry.stream.json
          </span>
          <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
            ● LIVE STREAM
          </span>
        </div>

        <div className="terminal-body">
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              No log entries match the current filter.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '';
              return (
                <div key={log.id} className={`log-entry ${log.level}`}>
                  <span style={{ color: '#64748b', fontSize: '0.72rem', minWidth: '75px' }}>
                    {dateStr}
                  </span>

                  <span className={`badge ${log.level === 'ERROR' ? 'badge-red' : (log.level === 'WARN' ? 'badge-amber' : 'badge-blue')}`} style={{ fontSize: '0.65rem' }}>
                    {log.level}
                  </span>

                  <span style={{ color: '#93c5fd', fontWeight: 600, minWidth: '115px' }}>
                    [{log.service_name}]
                  </span>

                  <span style={{ flex: 1, color: log.level === 'ERROR' ? '#fca5a5' : '#cbd5e1' }}>
                    {log.message}
                  </span>

                  {log.trace_id && (
                    <span className="mono" style={{ fontSize: '0.68rem', color: '#6366f1', background: 'rgba(99, 102, 241, 0.12)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      trace:{log.trace_id.substring(0, 8)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
