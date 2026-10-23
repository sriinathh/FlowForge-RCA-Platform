"""
Shared OpenTelemetry-compatible tracing, context propagation, and telemetry reporter
for FlowForge demo microservices.
"""

import time
import uuid
import requests
from datetime import datetime, timezone

FLOWFORGE_INGEST_URL = "http://127.0.0.1:8000/api/telemetry/ingest/"

class TraceContext:
    @staticmethod
    def generate_trace_id():
        return uuid.uuid4().hex

    @staticmethod
    def generate_span_id():
        return uuid.uuid4().hex[:16]

    @staticmethod
    def parse_traceparent(header_val):
        """
        Parses W3C traceparent header format:
        00-{trace_id}-{parent_span_id}-{flags}
        """
        if not header_val:
            return None, None
        parts = header_val.split('-')
        if len(parts) >= 3:
            return parts[1], parts[2]
        return None, None

    @staticmethod
    def format_traceparent(trace_id, span_id):
        return f"00-{trace_id}-{span_id}-01"

class TelemetryCollector:
    def __init__(self, service_name, ingest_url=FLOWFORGE_INGEST_URL):
        self.service_name = service_name
        self.ingest_url = ingest_url

    def report_span(self, trace_id, span_id, parent_span_id, operation_name,
                    start_time, end_time, duration_ms, http_method="GET",
                    http_path="", status_code=200, has_error=False,
                    error_message="", attributes=None):
        payload = {
            "spans": [{
                "trace_id": trace_id,
                "span_id": span_id,
                "parent_span_id": parent_span_id,
                "service_name": self.service_name,
                "operation_name": operation_name,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration_ms": duration_ms,
                "http_method": http_method,
                "http_path": http_path,
                "status_code": status_code,
                "has_error": has_error,
                "error_message": error_message,
                "attributes": attributes or {}
            }],
            "metrics": [{
                "service_name": self.service_name,
                "metric_name": "latency_ms",
                "value": duration_ms,
                "timestamp": end_time.isoformat()
            }, {
                "service_name": self.service_name,
                "metric_name": "error_rate_pct",
                "value": 100.0 if has_error else 0.0,
                "timestamp": end_time.isoformat()
            }],
            "logs": []
        }

        if has_error:
            payload["logs"].append({
                "service_name": self.service_name,
                "level": "ERROR",
                "message": f"{operation_name} failed: {error_message}",
                "trace_id": trace_id,
                "span_id": span_id,
                "timestamp": end_time.isoformat()
            })

        try:
            requests.post(self.ingest_url, json=payload, timeout=0.8)
        except Exception:
            # Telemetry delivery failure shouldn't crash the demo service
            pass
