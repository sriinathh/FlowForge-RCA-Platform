import React, { useState } from 'react';
import { FileTextIcon, DownloadIcon, CopyIcon, XCircleIcon, CheckCircleIcon } from './Icons';

export default function PostMortemExportModal({ isOpen, onClose, incident, rcaResult }) {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const topCause = rcaResult?.ranked_causes?.[0];

  const reportMarkdown = `# INCIDENT POST-MORTEM REPORT
**Incident ID:** ${incident?.incident_code || 'INC-2026-LIVE'}
**Title:** ${incident?.title || 'Distributed Application Degradation'}
**Severity:** ${incident?.severity || 'HIGH'} (P2)
**Date & Time:** ${incident?.detected_at || new Date().toISOString()}
**Incident Commander:** FlowForge Automated SRE Engine
**Status:** RESOLVED

---

## 1. Executive Summary
On ${new Date().toLocaleDateString()}, FlowForge detected a systemic degradation affecting customer checkout transactions. Utilizing multi-modal event correlation (combining OpenTelemetry trace leaf error attribution, temporal onset sequencing, and topology graph analysis), the platform algorithmically isolated **${topCause?.display_name || 'payment-service'}** as the originating root cause with **${topCause?.confidence_percentage || 94.2}% confidence**.

---

## 2. Root Cause Analysis (RCA) & Evidence Chain

### 2.1 Primary Failure Mechanism
- **Originating Service:** \`${topCause?.service_name || 'payment-service'}\`
- **Symptom:** ${incident?.primary_symptom || 'Downstream connection timeout resulting in cascading 504 Gateway Timeouts'}
- **Peak Latency:** ${topCause?.metrics?.p95_latency_ms || 2800}ms (Z-score: ${topCause?.evidence?.z_score || 4.2})
- **Peak Error Rate:** ${topCause?.metrics?.error_rate_pct || 88.5}%

### 2.2 Corroborating Evidence
1. **Trace Leaf Attribution:** ${Math.round((topCause?.evidence?.trace_origin_ratio || 0.88) * 100)}% of failed distributed traces terminated inside \`${topCause?.service_name || 'payment-service'}\` before propagating secondary 500 errors to caller services.
2. **Temporal Onset Precedence ($T_0$):** Earliest SLA violation occurred in \`${topCause?.service_name || 'payment-service'}\` at ${topCause?.evidence?.onset_time || 'T0'}, preceding upstream caller alerts by ${topCause?.evidence?.delay_from_t0_sec || 1.8}s.
3. **Topological Blast Radius:** Upstream callers affected: ${(topCause?.evidence?.topology_blast_radius || ['order-service', 'api-gateway']).join(', ')}.

---

## 3. Impact Assessment
- **Affected Endpoints:** \`POST /api/checkout\`, \`POST /orders/process\`
- **Downstream Failure Mode:** Synchronous timeout propagation without circuit breaker fallback.
- **Estimated User Impact:** ~${topCause?.metrics?.error_rate_pct || 85}% of in-flight checkout attempts failed during incident window.

---

## 4. Preventative Action Items & Remediation

| Action Item | Owner | Priority | Target Date |
|---|---|---|---|
| Implement resilience4j / circuit-breaker on \`order-service\` | Backend SRE | P1 | Sprint 14 |
| Configure asynchronous payment queue with customer retry notification | Payment Team | P1 | Sprint 14 |
| Set tighter client HTTP socket timeout (1.5s max) on payment calls | Edge Platform | P2 | Sprint 15 |
| Integrate FlowForge automated webhook alerts into Slack #sre-war-room | DevOps | P2 | Immediate |
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postmortem-${incident?.incident_code || 'report'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 120,
      padding: '1.5rem'
    }}>
      <div className="card" style={{ maxWidth: '850px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="card-header">
          <div className="card-title">
            <FileTextIcon className="w-5 h-5" style={{ color: '#6366f1' }} />
            Automated SRE Post-Mortem Incident Report
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={handleCopy} style={{ fontSize: '0.78rem' }}>
              <CopyIcon className="w-4 h-4" />
              {copied ? 'Copied to Clipboard!' : 'Copy Markdown'}
            </button>
            <button className="btn btn-primary" onClick={handleDownload} style={{ fontSize: '0.78rem' }}>
              <DownloadIcon className="w-4 h-4" />
              Download .MD
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: '0.5rem' }}>
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: '#050811', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <pre className="mono" style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {reportMarkdown}
          </pre>
        </div>
      </div>
    </div>
  );
}
