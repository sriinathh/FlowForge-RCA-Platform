from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.utils import timezone
from datetime import timedelta
from .models import Service, Dependency, Deployment
from .serializers import ServiceSerializer, DependencySerializer, DeploymentSerializer
from apps.incidents.models import Incident

DEFAULT_SERVICES_CONFIG = [
    {
        "name": "api-gateway",
        "display_name": "API Gateway",
        "endpoint": "http://127.0.0.1:8001",
        "port": 8001,
        "description": "Public reverse proxy and authentication token verifier dispatching orders & users",
        "p95_latency_ms": 32.0,
        "avg_latency_ms": 22.0,
        "error_rate_pct": 0.0,
        "requests_per_sec": 48.0,
        "environment": "Production",
        "team": "Core Platform & Edge",
        "owner_email": "sre-edge@flowforge.internal",
        "version": "v2.4.1",
        "tier": "Tier 1 (Critical Ingress)",
        "slo_target_pct": 99.95,
    },
    {
        "name": "order-service",
        "display_name": "Order Management Service",
        "endpoint": "http://127.0.0.1:8003",
        "port": 8003,
        "description": "Coordinates checkout, inventory reservations, calls payments and user accounts",
        "p95_latency_ms": 45.0,
        "avg_latency_ms": 30.0,
        "error_rate_pct": 0.0,
        "requests_per_sec": 35.0,
        "environment": "Production",
        "team": "Checkout & Orders",
        "owner_email": "orders-team@flowforge.internal",
        "version": "v1.12.0",
        "tier": "Tier 1 (Core Business Logic)",
        "slo_target_pct": 99.90,
    },
    {
        "name": "payment-service",
        "display_name": "Payment Gateway Service",
        "endpoint": "http://127.0.0.1:8004",
        "port": 8004,
        "description": "Integrates third-party banking networks, handles 3D Secure and settlements",
        "p95_latency_ms": 65.0,
        "avg_latency_ms": 42.0,
        "error_rate_pct": 0.0,
        "requests_per_sec": 22.0,
        "environment": "Production",
        "team": "FinTech & Payments",
        "owner_email": "payments-sre@flowforge.internal",
        "version": "v3.0.4",
        "tier": "Tier 0 (Financial Processing)",
        "slo_target_pct": 99.99,
    },
    {
        "name": "user-service",
        "display_name": "User & Auth Service",
        "endpoint": "http://127.0.0.1:8002",
        "port": 8002,
        "description": "User profiles, credentials, address verification, and account tier caching",
        "p95_latency_ms": 18.0,
        "avg_latency_ms": 12.0,
        "error_rate_pct": 0.0,
        "requests_per_sec": 40.0,
        "environment": "Production",
        "team": "Identity & Accounts",
        "owner_email": "iam-team@flowforge.internal",
        "version": "v1.8.9",
        "tier": "Tier 1 (Authentication & Profile)",
        "slo_target_pct": 99.95,
    },
]

DEFAULT_DEPENDENCIES = [
    ("api-gateway", "order-service", "HTTP/REST", "High (Sync Checkout)"),
    ("api-gateway", "user-service", "HTTP/REST", "Medium (Sync Auth)"),
    ("order-service", "payment-service", "HTTP/REST", "Critical (Payment Charge)"),
    ("order-service", "user-service", "HTTP/REST", "Low (User Validation)"),
]

def seed_default_topology():
    created_services = {}
    for s_cfg in DEFAULT_SERVICES_CONFIG:
        svc, _ = Service.objects.update_or_create(
            name=s_cfg["name"],
            defaults={
                "display_name": s_cfg["display_name"],
                "endpoint": s_cfg["endpoint"],
                "port": s_cfg["port"],
                "description": s_cfg["description"],
                "p95_latency_ms": s_cfg["p95_latency_ms"],
                "avg_latency_ms": s_cfg["avg_latency_ms"],
                "error_rate_pct": s_cfg["error_rate_pct"],
                "requests_per_sec": s_cfg["requests_per_sec"],
                "health_status": "HEALTHY",
                "last_heartbeat": timezone.now(),
                "environment": s_cfg["environment"],
                "team": s_cfg["team"],
                "owner_email": s_cfg["owner_email"],
                "version": s_cfg["version"],
                "tier": s_cfg["tier"],
                "slo_target_pct": s_cfg["slo_target_pct"],
            }
        )
        created_services[svc.name] = svc

    for src_name, tgt_name, proto, freq in DEFAULT_DEPENDENCIES:
        if src_name in created_services and tgt_name in created_services:
            Dependency.objects.update_or_create(
                source=created_services[src_name],
                target=created_services[tgt_name],
                defaults={
                    "protocol": proto,
                    "call_frequency": freq,
                    "avg_latency_ms": 25.0,
                    "error_rate_pct": 0.0,
                    "is_critical": True
                }
            )

    # Seed initial deployments if empty
    if Deployment.objects.count() == 0:
        now = timezone.now()
        Deployment.objects.create(
            service=created_services["api-gateway"],
            version="v2.4.1",
            environment="Production",
            deployed_at=now - timedelta(minutes=14),
            status="SUCCESS",
            change_summary="Updated reverse proxy timeout to 3500ms and tuned ingress keep-alive",
            commit_hash="c4a8f91",
            deployed_by="CI/CD GitHub Actions"
        )
        Deployment.objects.create(
            service=created_services["order-service"],
            version="v1.12.0",
            environment="Production",
            deployed_at=now - timedelta(hours=1),
            status="SUCCESS",
            change_summary="Async inventory allocation & retry policy for checkout orchestrator",
            commit_hash="7e22b04",
            deployed_by="CI/CD GitHub Actions"
        )
        Deployment.objects.create(
            service=created_services["payment-service"],
            version="v3.0.4",
            environment="Production",
            deployed_at=now - timedelta(hours=3),
            status="SUCCESS",
            change_summary="Stripe & banking network webhook signature authentication upgrade",
            commit_hash="9b14c32",
            deployed_by="CI/CD GitHub Actions"
        )
        Deployment.objects.create(
            service=created_services["user-service"],
            version="v1.8.9",
            environment="Production",
            deployed_at=now - timedelta(hours=6),
            status="SUCCESS",
            change_summary="PostgreSQL connection pool max 50 and JWT verification cache",
            commit_hash="1d88a10",
            deployed_by="CI/CD GitHub Actions"
        )

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all().order_by('name')
    serializer_class = ServiceSerializer

class DependencyViewSet(viewsets.ModelViewSet):
    queryset = Dependency.objects.all()
    serializer_class = DependencySerializer

class TopologyView(APIView):
    """
    Returns nodes and edges formatted for topology graph visualization with full metadata.
    """
    def get(self, request):
        if Service.objects.count() == 0:
            seed_default_topology()

        services = Service.objects.all()
        dependencies = Dependency.objects.select_related('source', 'target').all()

        nodes = []
        for svc in services:
            nodes.append({
                "id": svc.name,
                "label": svc.display_name,
                "name": svc.name,
                "endpoint": svc.endpoint,
                "port": svc.port,
                "health": svc.health_status,
                "p95": round(svc.p95_latency_ms, 1),
                "avgLatency": round(svc.avg_latency_ms, 1),
                "errorRate": round(svc.error_rate_pct, 2),
                "rps": round(svc.requests_per_sec, 1),
                "lastHeartbeat": svc.last_heartbeat.isoformat() if svc.last_heartbeat else None,
                "environment": svc.environment,
                "team": svc.team,
                "owner": svc.owner_email,
                "version": svc.version,
                "tier": svc.tier,
                "slo": f"{svc.slo_target_pct}% Availability"
            })

        edges = []
        for dep in dependencies:
            edges.append({
                "id": f"{dep.source.name}->{dep.target.name}",
                "source": dep.source.name,
                "target": dep.target.name,
                "protocol": dep.protocol,
                "frequency": dep.call_frequency,
                "avgLatency": round(dep.avg_latency_ms, 1),
                "errorRate": round(dep.error_rate_pct, 2),
                "isCritical": dep.is_critical
            })

        return Response({
            "nodes": nodes,
            "edges": edges,
            "totalServices": len(nodes),
            "unhealthyCount": sum(1 for n in nodes if n["health"] != "HEALTHY")
        })

class DeploymentListView(APIView):
    """
    Returns deployment audit history.
    """
    def get(self, request):
        if Deployment.objects.count() == 0:
            seed_default_topology()
        deployments = Deployment.objects.select_related('service').all()[:15]
        return Response({"deployments": DeploymentSerializer(deployments, many=True).data})

class OverviewSummaryView(APIView):
    """
    Dynamic summary metrics aggregated across services, incidents, and deployments.
    """
    def get(self, request):
        if Service.objects.count() == 0:
            seed_default_topology()

        services = Service.objects.all()
        total_services = services.count()
        healthy_count = services.filter(health_status='HEALTHY').count()
        degraded_count = services.filter(health_status='DEGRADED').count()
        down_count = services.filter(health_status__in=['UNHEALTHY', 'DOWN']).count()

        total_rps = sum(s.requests_per_sec for s in services)
        avg_error_rate = (sum(s.error_rate_pct for s in services) / max(1, total_services))
        
        latencies = [s.p95_latency_ms for s in services]
        avg_lat = sum(s.avg_latency_ms for s in services) / max(1, total_services)
        p95_lat = max(latencies) if latencies else 32.0
        p50_lat = round(avg_lat * 0.85, 1)
        p99_lat = round(p95_lat * 1.35, 1)

        active_incidents = Incident.objects.filter(status__in=['ACTIVE', 'INVESTIGATING'])
        top_error_services = services.order_by('-error_rate_pct')[:4]

        recent_deployments = Deployment.objects.select_related('service').all()[:6]

        return Response({
            "mesh_health": {
                "total_services": total_services,
                "healthy_count": healthy_count,
                "degraded_count": degraded_count,
                "down_count": down_count,
                "operational_pct": round((healthy_count / max(1, total_services)) * 100, 1)
            },
            "golden_signals": {
                "total_rps": round(total_rps, 1),
                "avg_error_rate_pct": round(avg_error_rate, 2),
                "p50_latency_ms": p50_lat,
                "p95_latency_ms": round(p95_lat, 1),
                "p99_latency_ms": p99_lat,
            },
            "top_error_services": [{
                "name": s.name,
                "display_name": s.display_name,
                "error_rate_pct": round(s.error_rate_pct, 2),
                "p95_latency_ms": round(s.p95_latency_ms, 1),
                "rps": round(s.requests_per_sec, 1)
            } for s in top_error_services],
            "active_incidents_count": active_incidents.count(),
            "recent_deployments": DeploymentSerializer(recent_deployments, many=True).data
        })

class SeedTopologyView(APIView):
    def post(self, request):
        seed_default_topology()
        return Response({"status": "seeded", "message": "Default microservice topology seeded successfully."})
