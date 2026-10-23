import React, { useState } from 'react';
import { BotIcon, SparklesIcon, SendIcon, ZapIcon, ShieldAlertIcon } from './Icons';

export default function AICopilotDrawer({ rcaResult, activeIncident }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "👋 Hello! I am the **FlowForge AI SRE Copilot**. I analyze multi-modal telemetry (OpenTelemetry trace trees, metric deviations, temporal T0 sequencing, and topology graphs) to explain failures and prescribe actionable remediation.\n\nAsk me anything about the current mesh health, or click one of the quick investigation prompts below!",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputText, setInputText] = useState('');

  const topCause = rcaResult?.ranked_causes?.[0];

  const handleSend = (textToSend) => {
    const q = textToSend || inputText;
    if (!q.trim()) return;

    const userMsg = {
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Generate intelligent contextual AI answer grounded on current RCA evidence
    setTimeout(() => {
      let aiResponseText = "";
      const lowerQ = q.toLowerCase();

      if (lowerQ.includes('why') || lowerQ.includes('root cause') || lowerQ.includes('payment') || lowerQ.includes('reason')) {
        if (topCause) {
          aiResponseText = `### Root Cause Causality Explanation for \`${topCause.service_name}\`
FlowForge isolated **${topCause.display_name}** with **${topCause.confidence_percentage}% confidence** based on 3 correlated proofs:
1. **Trace Leaf Attribution:** ${Math.round((topCause.evidence?.trace_origin_ratio || 0) * 100)}% of failed traces had their leaf error inside \`${topCause.service_name}\`. Upstream callers (\`order-service\` and \`api-gateway\`) merely propagated secondary HTTP 500/504 errors.
2. **Temporal Onset Precedence:** \`${topCause.service_name}\` degraded first at **${topCause.evidence?.onset_time || 'T0'}**, preceding caller degradation by **${topCause.evidence?.delay_from_t0_sec || 0} seconds**.
3. **Metric Deviation:** Peak latency surged to **${topCause.metrics?.p95_latency_ms}ms** with an error rate of **${topCause.metrics?.error_rate_pct}%** (Z-score: ${topCause.evidence?.z_score}).`;
        } else {
          aiResponseText = "All services in the mesh are currently operating within normal SLAs. No active anomalies or root cause incidents have been identified.";
        }
      } else if (lowerQ.includes('blast radius') || lowerQ.includes('impact') || lowerQ.includes('callers')) {
        const callers = topCause?.evidence?.topology_blast_radius || [];
        aiResponseText = `### Blast Radius & Downstream Dependency Impact
- **Originating Fault Source:** \`${topCause?.service_name || 'None'}\`
- **Impacted Upstream Callers:** ${callers.length > 0 ? callers.map(c => `\`${c}\``).join(', ') : 'Direct clients'}
- **Customer Impact:** External checkout API calls are experiencing elevated 504 timeouts and checkout failures. User auth caching is partially isolated.`;
      } else if (lowerQ.includes('remediation') || lowerQ.includes('command') || lowerQ.includes('fix') || lowerQ.includes('mitigate')) {
        aiResponseText = `### Prescriptive SRE Remediation Runbook
Execute the following emergency mitigations:

\`\`\`bash
# 1. Enable circuit breaker to isolate the degraded service
kubectl scale deployment ${topCause?.service_name || 'payment-service'} --replicas=4

# 2. Inspect container error logs
kubectl logs -l app=${topCause?.service_name || 'payment-service'} --tail=100 -f

# 3. Route payment traffic to secondary failover gateway
curl -X POST http://api-gateway:8001/admin/routing/failover -d '{"service": "${topCause?.service_name || 'payment-service'}"}'
\`\`\``;
      } else {
        aiResponseText = `### SRE Copilot Synthesis
Analyzing active telemetry for **${topCause?.service_name || 'mesh'}**...
- **Current Severity:** ${activeIncident?.severity || 'HIGH'}
- **Incident Status:** ${activeIncident?.status || 'ACTIVE'}
- **Confidence:** ${topCause?.confidence_percentage || 0}%
- **Next Step:** Verify network connectivity or restart pods on service \`${topCause?.service_name || 'unknown'}\`.`;
      }

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }, 600);
  };

  const quickPrompts = [
    "Why was Payment Service identified instead of Gateway?",
    "What is the estimated blast radius?",
    "Show prescriptive remediation commands",
    "Explain how leaf span attribution works"
  ];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '620px' }}>
      <div className="card-header">
        <div className="card-title">
          <BotIcon className="w-5 h-5" style={{ color: '#a855f7' }} />
          <span>AI SRE Root Cause Copilot</span>
          <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>GPT-4 / Claude Ready</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Incident-Grounded Context
        </span>
      </div>

      {/* Chat Messages History */}
      <div className="chat-history">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.sender}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', fontSize: '0.72rem', color: m.sender === 'user' ? '#e0e7ff' : '#a855f7' }}>
              {m.sender === 'user' ? 'You (SRE Engineer)' : 'FlowForge AI Copilot'}
              <span style={{ color: '#64748b' }}>• {m.timestamp}</span>
            </div>
            <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
          </div>
        ))}
      </div>

      {/* Quick Prompts */}
      <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            className="btn btn-secondary"
            style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
            onClick={() => handleSend(qp)}
          >
            <SparklesIcon className="w-3 h-3" style={{ color: '#a855f7' }} />
            {qp}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form 
        className="chat-input-bar" 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
      >
        <input
          type="text"
          className="chat-input"
          placeholder="Ask AI Copilot about the incident, evidence, or fix..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          <SendIcon className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
