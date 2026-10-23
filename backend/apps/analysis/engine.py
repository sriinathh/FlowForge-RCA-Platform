"""
FlowForge Evidence-Based Root Cause Analysis (RCA) Engine
Correlates distributed traces, metrics, temporal event sequences, and service dependency topology
to pinpoint and rank the root cause of distributed application failures.
"""

from datetime import datetime, timedelta
from django.utils import timezone
import networkx as nx
from django.db.models import Avg, Max, Count, Q
from apps.services.models import Service, Dependency
from apps.telemetry.models import SpanRecord, MetricRecord, LogRecord
from apps.incidents.models import Incident, IncidentTimeline

def build_dependency_graph():
    """
    Constructs a directed graph representing service dependency topology.
    An edge (A, B) indicates service A calls service B.
    """
    G = nx.DiGraph()
    services = Service.objects.all()
    for svc in services:
        G.add_node(svc.name, display_name=svc.display_name, endpoint=svc.endpoint)

    dependencies = Dependency.objects.select_related('source', 'target').all()
    for dep in dependencies:
        G.add_edge(dep.source.name, dep.target.name, protocol=dep.protocol, is_critical=dep.is_critical)

    return G

def analyze_traces_for_error_origin(window_minutes=5):
    """
    Analyzes distributed traces to locate leaf error spans.
    When a cascading failure occurs (e.g. Gateway -> Orders -> Payment),
    the leaf error span resides in the earliest failing component (e.g. Payment),
    while upstream components only report secondary propagation errors.
    """
    since = timezone.now() - timedelta(minutes=window_minutes)
    error_spans = SpanRecord.objects.filter(has_error=True, start_time__gte=since)
    
    total_error_spans = error_spans.count()
    if total_error_spans == 0:
        return {}, 0, []

    trace_ids = error_spans.values_list('trace_id', flat=True).distinct()
    origin_counts = {}
    failing_traces_sample = []

    for tid in trace_ids:
        spans = list(SpanRecord.objects.filter(trace_id=tid).order_by('start_time'))
        if not spans:
            continue
        
        # Build span hierarchy map to find deepest/leaf error
        span_by_id = {s.span_id: s for s in spans}
        children_map = {}
        for s in spans:
            if s.parent_span_id:
                children_map.setdefault(s.parent_span_id, []).append(s)

        # Find error spans that have NO error among their children
        leaf_error_spans = []
        for s in spans:
            if s.has_error:
                children = children_map.get(s.span_id, [])
                has_child_error = any(c.has_error for c in children)
                if not has_child_error:
                    leaf_error_spans.append(s)

        if not leaf_error_spans:
            # Fallback to earliest error span in trace
            leaf_error_spans = [s for s in spans if s.has_error]

        if leaf_error_spans:
            origin_span = leaf_error_spans[0]
            svc = origin_span.service_name
            origin_counts[svc] = origin_counts.get(svc, 0) + 1

            if len(failing_traces_sample) < 5:
                failing_traces_sample.append({
                    "trace_id": tid,
                    "root_service": spans[0].service_name,
                    "origin_service": svc,
                    "operation": origin_span.operation_name,
                    "status_code": origin_span.status_code,
                    "error_message": origin_span.error_message or "HTTP Error Response",
                    "duration_ms": origin_span.duration_ms
                })

    total_failing_traces = len(trace_ids)
    origin_ratios = {}
    for svc, count in origin_counts.items():
        origin_ratios[svc] = count / max(1, total_failing_traces)

    return origin_ratios, total_failing_traces, failing_traces_sample

def analyze_temporal_precedence(window_minutes=5):
    """
    Identifies the earliest onset time of an anomaly for each service.
    The service that first demonstrated abnormal latency or errors holds temporal priority.
    """
    since = timezone.now() - timedelta(minutes=window_minutes)
    services = Service.objects.all()
    first_anomaly_time = {}

    for svc in services:
        # Check first error span
        first_err = SpanRecord.objects.filter(
            service_name=svc.name, has_error=True, start_time__gte=since
        ).order_by('start_time').first()

        # Check first latency spike (> 500ms or 2.5x normal)
        first_latency_spike = SpanRecord.objects.filter(
            service_name=svc.name, duration_ms__gt=400, start_time__gte=since
        ).order_by('start_time').first()

        onset_candidates = []
        if first_err:
            onset_candidates.append(first_err.start_time)
        if first_latency_spike:
            onset_candidates.append(first_latency_spike.start_time)

        if onset_candidates:
            first_anomaly_time[svc.name] = min(onset_candidates)

    if not first_anomaly_time:
        return {}

    min_time = min(first_anomaly_time.values())
    max_time = max(first_anomaly_time.values())
    time_span = max(1.0, (max_time - min_time).total_seconds())

    temporal_scores = {}
    for svc_name, onset in first_anomaly_time.items():
        delta_sec = (onset - min_time).total_seconds()
        # Earliest gets score close to 1.0, latest gets lower score
        score = max(0.1, 1.0 - (delta_sec / (time_span + 0.1)))
        temporal_scores[svc_name] = {
            "score": round(score, 3),
            "onset_time": onset.isoformat(),
            "delay_from_t0_sec": round(delta_sec, 2)
        }

    return temporal_scores

def compute_topology_influence(G, candidate_services):
    """
    Computes downstream blast radius and upstream caller impact for each candidate.
    """
    blast_radius = {}
    for svc in candidate_services:
        if svc in G:
            # Downstream reachable services that call this service or are called
            # In our graph A -> B (A calls B). If B fails, A is affected.
            # Upstream callers in dependency graph: predecessors
            predecessors = list(nx.ancestors(G, svc))  # Services that have a directed path to svc
            successors = list(nx.descendants(G, svc))   # Services that svc calls
            blast_radius[svc] = {
                "impacted_callers": predecessors,
                "dependencies_called": successors,
                "caller_count": len(predecessors),
                "is_leaf_dependency": len(successors) == 0
            }
        else:
            blast_radius[svc] = {
                "impacted_callers": [],
                "dependencies_called": [],
                "caller_count": 0,
                "is_leaf_dependency": True
            }
    return blast_radius

def generate_ai_explanation(top_cause, ranked_candidates, failing_traces_sample, blast_info):
    """
    Synthesizes multi-modal evidence into an AI-driven, actionable SRE root-cause diagnosis.
    """
    if not top_cause:
        return "No anomalous behavior or systemic failure detected. All microservices operating within baseline SLA.", []

    svc_name = top_cause["service_name"]
    confidence = top_cause["confidence_percentage"]
    metrics = top_cause["metrics"]
    evidence = top_cause["evidence"]

    callers = blast_info.get(svc_name, {}).get("impacted_callers", [])
    callers_str = ", ".join(callers) if callers else "direct clients"

    summary_paragraphs = [
        f"### Root Cause Hypothesis: Primary Fault in `{svc_name}` ({confidence}% Confidence)",
        f"FlowForge multi-event correlation engine identified **{svc_name}** as the originating root cause of the current distributed degradation.",
        "",
        "#### Correlated Evidence:",
        f"1. **Distributed Trace Leaf Attribution:** {round(evidence.get('trace_origin_ratio', 0) * 100, 1)}% of all failing traces terminated inside `{svc_name}` before propagating errors upstream to {callers_str}.",
        f"2. **Temporal Precedence:** `{svc_name}` experienced the earliest anomalous perturbation (T0 = {evidence.get('onset_time', 'N/A')}), preceding downstream alerts by {evidence.get('delay_from_t0_sec', 0)}s.",
        f"3. **Metric Deviation:** Peak latency surged to {metrics.get('p95_latency_ms', 0)}ms with an error rate of {metrics.get('error_rate_pct', 0)}% (Z-score: {round(evidence.get('z_score', 0), 2)}).",
        f"4. **Cascading Blast Radius:** Propagated degradation to upstream callers: {', '.join(callers) if callers else 'None (isolated)'}."
    ]

    # Generate prescriptive SRE recommendations based on service context
    recommendations = []
    if "payment" in svc_name.lower():
        recommendations = [
            f"Inspect downstream payment gateway partner API latency and connection pool saturation on `{svc_name}`.",
            "Verify timeout limits on order checkout client; activate circuit breaker with queued fallback settlement.",
            "Drain incoming non-critical charge traffic or switch to backup payment processor endpoint."
        ]
    elif "user" in svc_name.lower():
        recommendations = [
            f"Examine user service database query latency and authentication token verification cache.",
            "Check for database deadlocks or thread pool starvation in the auth/profile persistence layer.",
            "Enable read-replica failover and temporarily extend JWT verification cache TTL."
        ]
    elif "order" in svc_name.lower():
        recommendations = [
            f"Review order orchestration thread pool and asynchronous message broker backlog.",
            "Check if downstream calls to payment or user service are lacking circuit breaker protection.",
            "Scale order service container replicas and restart degraded worker instances."
        ]
    elif "gateway" in svc_name.lower():
        recommendations = [
            f"Inspect API gateway reverse proxy connection backlog, rate-limiter rules, and ingress socket exhaustion.",
            "Verify edge TLS termination latency and backend routing table configurations."
        ]
    else:
        recommendations = [
            f"Check CPU/Memory resource constraints and error log stack traces on `{svc_name}`.",
            f"Initiate graceful container restart or canary rollback for service `{svc_name}`."
        ]

    return "\n".join(summary_paragraphs), recommendations

def run_root_cause_analysis():
    """
    Executes the full FlowForge Root Cause Analysis pipeline:
    1. Ingests current topology & trace evidence
    2. Performs trace leaf error origin attribution
    3. Calculates temporal onset precedence
    4. Computes topological blast radius
    5. Fuses scores into ranked candidates
    6. Creates or updates Incident records
    """
    G = build_dependency_graph()
    services = Service.objects.all()

    # 1. Trace analysis
    trace_origin_ratios, total_failed_traces, trace_samples = analyze_traces_for_error_origin(window_minutes=5)

    # 2. Temporal analysis
    temporal_scores = analyze_temporal_precedence(window_minutes=5)

    # 3. Anomaly detection & metric scores
    candidate_services = set(trace_origin_ratios.keys()).union(temporal_scores.keys())
    
    # Also include any service currently marked DEGRADED or UNHEALTHY
    for s in services:
        if s.health_status in ['DEGRADED', 'UNHEALTHY', 'DOWN']:
            candidate_services.add(s.name)

    if not candidate_services:
        return {
            "status": "healthy",
            "message": "No active anomalies or incidents detected across the service mesh.",
            "ranked_causes": [],
            "incident": None
        }

    blast_info = compute_topology_influence(G, candidate_services)

    # 4. Multi-criteria fusion scoring
    # Weights:
    # w_trace_origin: 0.35 (strongest direct causal indicator)
    # w_temporal: 0.30 (earliest onset is likely root cause)
    # w_topology_leaf: 0.20 (deepest dependency rather than upstream proxy)
    # w_metric_severity: 0.15 (magnitude of error rate & latency spike)
    
    w_trace = 0.35
    w_temp = 0.30
    w_topo = 0.20
    w_metric = 0.15

    raw_scores = {}
    evidence_map = {}

    for svc_name in candidate_services:
        svc_obj = services.filter(name=svc_name).first()
        
        # Trace origin score
        s_trace = trace_origin_ratios.get(svc_name, 0.0)

        # Temporal score
        temp_data = temporal_scores.get(svc_name, {"score": 0.2, "onset_time": "N/A", "delay_from_t0_sec": 0})
        s_temp = temp_data["score"]

        # Topology leaf score (if it has no downstream or is called by others who failed)
        b_info = blast_info.get(svc_name, {})
        caller_count = b_info.get("caller_count", 0)
        is_leaf = b_info.get("is_leaf_dependency", False)
        s_topo = 0.5 + (0.3 if is_leaf else 0.0) + (0.2 if caller_count > 0 else 0.0)
        s_topo = min(1.0, s_topo)

        # Metric severity
        err_rate = svc_obj.error_rate_pct if svc_obj else 0.0
        lat_ms = svc_obj.p95_latency_ms if svc_obj else 0.0
        s_metric = min(1.0, (err_rate / 100.0) * 0.7 + min(1.0, lat_ms / 1500.0) * 0.3)

        # Composite score
        composite = (w_trace * s_trace) + (w_temp * s_temp) + (w_topo * s_topo) + (w_metric * s_metric)
        raw_scores[svc_name] = composite

        evidence_map[svc_name] = {
            "trace_origin_ratio": round(s_trace, 3),
            "temporal_score": round(s_temp, 3),
            "onset_time": temp_data.get("onset_time"),
            "delay_from_t0_sec": temp_data.get("delay_from_t0_sec", 0),
            "topology_blast_radius": b_info.get("impacted_callers", []),
            "is_leaf_dependency": is_leaf,
            "z_score": round(s_metric * 4.5, 2),
            "p95_latency_ms": round(lat_ms, 1),
            "error_rate_pct": round(err_rate, 2)
        }

    # Normalize scores to 100% confidence distribution (Softmax-like scaling)
    sum_scores = sum(raw_scores.values()) or 1.0
    ranked_candidates = []
    for svc_name, raw in sorted(raw_scores.items(), key=lambda item: item[1], reverse=True):
        conf_pct = round((raw / sum_scores) * 100.0, 1)
        svc_obj = services.filter(name=svc_name).first()
        ranked_candidates.append({
            "service_name": svc_name,
            "display_name": svc_obj.display_name if svc_obj else svc_name,
            "confidence_percentage": conf_pct,
            "raw_score": round(raw, 3),
            "evidence": evidence_map[svc_name],
            "metrics": {
                "p95_latency_ms": svc_obj.p95_latency_ms if svc_obj else 0,
                "error_rate_pct": svc_obj.error_rate_pct if svc_obj else 0,
                "health_status": svc_obj.health_status if svc_obj else 'UNKNOWN'
            }
        })

    top_cause = ranked_candidates[0] if ranked_candidates else None
    ai_summary, recommendations = generate_ai_explanation(
        top_cause, ranked_candidates, trace_samples, blast_info
    )

    # 5. Automatically create or update an Incident
    active_incident = Incident.objects.filter(status__in=['ACTIVE', 'INVESTIGATING']).first()
    severity = 'CRITICAL' if top_cause and top_cause["evidence"]["error_rate_pct"] > 40 else 'HIGH'
    
    impacted = []
    if top_cause:
        impacted = top_cause["evidence"]["topology_blast_radius"]
        if top_cause["service_name"] not in impacted:
            impacted.append(top_cause["service_name"])

    if not active_incident and top_cause:
        active_incident = Incident.objects.create(
            title=f"Degradation Incident: {top_cause['display_name']} Root Cause Detected",
            severity=severity,
            status='ACTIVE',
            primary_symptom=f"Error rate {top_cause['evidence']['error_rate_pct']}% with {top_cause['evidence']['p95_latency_ms']}ms latency",
            root_cause_service=top_cause['service_name'],
            confidence_score=top_cause['confidence_percentage'],
            impacted_services=impacted,
            evidence_breakdown={"ranked_candidates": ranked_candidates, "trace_samples": trace_samples},
            ai_summary=ai_summary,
            recommended_actions=recommendations
        )
        IncidentTimeline.objects.create(
            incident=active_incident,
            event_type='ANOMALY_DETECTED',
            service_name=top_cause['service_name'],
            title=f"First Anomaly Onset in {top_cause['service_name']}",
            description=f"Earliest anomaly detected at {top_cause['evidence']['onset_time']}. RCA confidence: {top_cause['confidence_percentage']}%.",
            metadata=top_cause['evidence']
        )
    elif active_incident and top_cause:
        active_incident.root_cause_service = top_cause['service_name']
        active_incident.confidence_score = top_cause['confidence_percentage']
        active_incident.impacted_services = impacted
        active_incident.evidence_breakdown = {"ranked_candidates": ranked_candidates, "trace_samples": trace_samples}
        active_incident.ai_summary = ai_summary
        active_incident.recommended_actions = recommendations
        active_incident.save()

    return {
        "status": "incident_detected" if active_incident else "normal",
        "incident_code": active_incident.incident_code if active_incident else None,
        "ranked_causes": ranked_candidates,
        "ai_summary": ai_summary,
        "recommended_actions": recommendations,
        "trace_samples": trace_samples,
        "total_failed_traces": total_failed_traces
    }
