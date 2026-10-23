from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg, Max, Count, Q
from .models import SpanRecord, MetricRecord, LogRecord
from .serializers import SpanRecordSerializer, MetricRecordSerializer, LogRecordSerializer
from apps.services.models import Service

class IngestBatchTelemetryView(APIView):
    """
    Unified telemetry ingestion for OpenTelemetry traces, Prometheus metrics, and structured logs.
    Also updates live Service metrics and health state.
    """
    def post(self, request):
        data = request.data
        spans_created = 0
        metrics_created = 0
        logs_created = 0

        # Ingest Spans
        spans_data = data.get('spans', [])
        for s in spans_data:
            SpanRecord.objects.create(
                trace_id=s.get('trace_id'),
                span_id=s.get('span_id'),
                parent_span_id=s.get('parent_span_id') or None,
                service_name=s.get('service_name', 'unknown'),
                operation_name=s.get('operation_name', 'http_request'),
                start_time=s.get('start_time') or timezone.now(),
                end_time=s.get('end_time') or timezone.now(),
                duration_ms=float(s.get('duration_ms', 0.0)),
                http_method=s.get('http_method', 'GET'),
                http_path=s.get('http_path', ''),
                status_code=int(s.get('status_code', 200)),
                has_error=bool(s.get('has_error', False)),
                error_message=s.get('error_message', ''),
                attributes=s.get('attributes', {})
            )
            spans_created += 1

        # Ingest Metrics
        metrics_data = data.get('metrics', [])
        for m in metrics_data:
            MetricRecord.objects.create(
                service_name=m.get('service_name'),
                metric_name=m.get('metric_name'),
                value=float(m.get('value', 0.0)),
                timestamp=m.get('timestamp') or timezone.now(),
                labels=m.get('labels', {})
            )
            metrics_created += 1

        # Ingest Logs
        logs_data = data.get('logs', [])
        for l in logs_data:
            LogRecord.objects.create(
                service_name=l.get('service_name', 'system'),
                level=l.get('level', 'INFO').upper(),
                message=l.get('message', ''),
                trace_id=l.get('trace_id', ''),
                span_id=l.get('span_id', ''),
                stack_trace=l.get('stack_trace', ''),
                timestamp=l.get('timestamp') or timezone.now(),
                context=l.get('context', {})
            )
            logs_created += 1

        # Automatically update Service aggregated live metrics
        services_touched = set()
        for s in spans_data:
            services_touched.add(s.get('service_name'))
        for m in metrics_data:
            services_touched.add(m.get('service_name'))

        recent_window = timezone.now() - timedelta(minutes=2)
        for svc_name in services_touched:
            if not svc_name:
                continue
            recent_spans = SpanRecord.objects.filter(service_name=svc_name, start_time__gte=recent_window)
            if recent_spans.exists():
                total = recent_spans.count()
                errors = recent_spans.filter(has_error=True).count()
                error_rate = (errors / total) * 100.0
                avg_lat = recent_spans.aggregate(Avg('duration_ms'))['duration_ms__avg'] or 20.0
                p95_lat = avg_lat * 1.5

                health = 'HEALTHY'
                if error_rate > 30.0 or avg_lat > 1500:
                    health = 'UNHEALTHY'
                elif error_rate > 5.0 or avg_lat > 400:
                    health = 'DEGRADED'

                Service.objects.filter(name=svc_name).update(
                    health_status=health,
                    avg_latency_ms=round(avg_lat, 1),
                    p95_latency_ms=round(p95_lat, 1),
                    error_rate_pct=round(error_rate, 2),
                    last_heartbeat=timezone.now()
                )

        return Response({
            "status": "ingested",
            "spans": spans_created,
            "metrics": metrics_created,
            "logs": logs_created
        }, status=status.HTTP_201_CREATED)

class TraceListView(APIView):
    """
    List distinct distributed request traces with duration, involved services, and error flags.
    """
    def get(self, request):
        limit = int(request.query_params.get('limit', 25))
        only_errors = request.query_params.get('only_errors', 'false').lower() == 'true'

        query = SpanRecord.objects.all()
        if only_errors:
            query = query.filter(has_error=True)

        trace_ids = query.values_list('trace_id', flat=True).distinct()[:limit]
        traces = []

        for tid in trace_ids:
            spans = SpanRecord.objects.filter(trace_id=tid).order_by('start_time')
            if not spans.exists():
                continue
            root_span = spans.filter(parent_span_id__isnull=True).first() or spans.first()
            has_error = spans.filter(has_error=True).exists()
            services_involved = list(spans.values_list('service_name', flat=True).distinct())
            
            # calculate duration from min start to max end
            min_start = spans.first().start_time
            max_end = max(s.end_time for s in spans)
            duration_ms = max(0.0, (max_end - min_start).total_seconds() * 1000.0)
            if duration_ms == 0.0 and spans.first():
                duration_ms = sum(s.duration_ms for s in spans)

            traces.append({
                "trace_id": tid,
                "root_operation": root_span.operation_name,
                "http_path": root_span.http_path,
                "start_time": min_start.isoformat(),
                "duration_ms": round(duration_ms, 1),
                "has_error": has_error,
                "span_count": spans.count(),
                "services": services_involved,
                "origin_service": root_span.service_name
            })

        return Response({"traces": sorted(traces, key=lambda x: x["start_time"], reverse=True)})

class TraceWaterfallView(APIView):
    """
    Returns full span waterfall hierarchical layout for an individual trace.
    """
    def get(self, request, trace_id):
        spans = SpanRecord.objects.filter(trace_id=trace_id).order_by('start_time')
        if not spans.exists():
            return Response({"error": "Trace not found"}, status=status.HTTP_404_NOT_FOUND)

        min_time = spans.first().start_time
        span_items = []

        for s in spans:
            offset_ms = max(0.0, (s.start_time - min_time).total_seconds() * 1000.0)
            span_items.append({
                "span_id": s.span_id,
                "parent_span_id": s.parent_span_id,
                "service_name": s.service_name,
                "operation_name": s.operation_name,
                "start_time": s.start_time.isoformat(),
                "duration_ms": round(s.duration_ms, 2),
                "offset_ms": round(offset_ms, 2),
                "status_code": s.status_code,
                "has_error": s.has_error,
                "error_message": s.error_message,
                "http_method": s.http_method,
                "http_path": s.http_path,
                "attributes": s.attributes
            })

        total_duration = max(item["offset_ms"] + item["duration_ms"] for item in span_items)

        return Response({
            "trace_id": trace_id,
            "total_duration_ms": round(total_duration, 2),
            "span_count": len(span_items),
            "has_error": any(item["has_error"] for item in span_items),
            "spans": span_items
        })

class MetricSeriesView(APIView):
    """
    Time-series metric points for charting latency, error rates, and RPS.
    """
    def get(self, request):
        service = request.query_params.get('service')
        metric_name = request.query_params.get('metric', 'latency_ms')
        minutes = int(request.query_params.get('minutes', 15))

        since = timezone.now() - timedelta(minutes=minutes)
        query = MetricRecord.objects.filter(timestamp__gte=since)
        if service:
            query = query.filter(service_name=service)
        if metric_name:
            query = query.filter(metric_name=metric_name)

        metrics = query.order_by('timestamp')[:300]
        data = [{
            "timestamp": m.timestamp.isoformat(),
            "service": m.service_name,
            "metric": m.metric_name,
            "value": round(m.value, 2)
        } for m in metrics]

        return Response({"series": data})

class LogListView(APIView):
    """
    Search and filter logs.
    """
    def get(self, request):
        trace_id = request.query_params.get('trace_id')
        service = request.query_params.get('service')
        level = request.query_params.get('level')
        limit = int(request.query_params.get('limit', 50))

        query = LogRecord.objects.all()
        if trace_id:
            query = query.filter(trace_id=trace_id)
        if service:
            query = query.filter(service_name=service)
        if level:
            query = query.filter(level=level.upper())

        logs = query.order_by('-timestamp')[:limit]
        return Response({"logs": LogRecordSerializer(logs, many=True).data})
