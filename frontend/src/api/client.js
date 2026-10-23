const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '/api');

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

export const api = {
  // Services, Topology & Dynamic Overview
  getOverview: () => request('/services/overview/'),
  getTopology: () => request('/services/topology/'),
  getDeployments: () => request('/services/deployments/'),
  seedTopology: () => request('/services/seed/', { method: 'POST' }),

  // Accounts, Workspaces, RBAC & API Tokens
  getWorkspaces: () => request('/accounts/workspaces/'),
  getTeamMembers: () => request('/accounts/members/'),
  inviteTeamMember: (data) => request('/accounts/members/', { method: 'POST', body: JSON.stringify(data) }),
  getApiTokens: () => request('/accounts/tokens/'),
  createApiToken: (name, scope = 'telemetry:full') => 
    request('/accounts/tokens/', { method: 'POST', body: JSON.stringify({ name, scope }) }),
  revokeApiToken: (tokenId) => request(`/accounts/tokens/${tokenId}/revoke/`, { method: 'DELETE' }),

  // Incidents & Investigation Notes
  getIncidents: () => request('/incidents/list/'),
  resolveIncident: (code) => request(`/incidents/${code}/resolve/`, { method: 'POST' }),
  addIncidentNote: (code, text, author = 'SRE Lead') =>
    request(`/incidents/${code}/notes/`, { method: 'POST', body: JSON.stringify({ text, author }) }),
  triggerScan: () => request('/incidents/scan/', { method: 'POST' }),

  // Root Cause Analysis
  runRCA: () => request('/analysis/rca/'),
  getBaselineComparison: () => request('/analysis/compare/'),

  // Telemetry Traces & Metrics
  getTraces: (onlyErrors = false) => request(`/telemetry/traces/?only_errors=${onlyErrors}`),
  getTraceWaterfall: (traceId) => request(`/telemetry/traces/${traceId}/waterfall/`),
  getMetricSeries: (service = '', metric = 'latency_ms') => 
    request(`/telemetry/metrics/series/?service=${service}&metric=${metric}`),
  getLogs: (traceId = '') => request(`/telemetry/logs/?trace_id=${traceId}`),

  // Chaos Simulation & Benchmark
  pulseLive: () => request('/simulation/pulse/', { method: 'POST' }),
  getScenarios: () => request('/simulation/scenarios/'),
  injectChaos: (scenarioKey) => 
    request('/simulation/inject/', { method: 'POST', body: JSON.stringify({ scenario_key: scenarioKey }) }),
  runBenchmark: (trials = 10) => 
    request('/simulation/benchmark/run/', { method: 'POST', body: JSON.stringify({ trials }) }),
  getBenchmarkHistory: () => request('/simulation/benchmark/history/'),
};
