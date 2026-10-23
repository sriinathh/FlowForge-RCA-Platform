"""
API Gateway Service (Port 8001)
Public ingress reverse proxy dispatching requests to Order and User microservices.
"""

import sys
import os
import time
import requests
from datetime import datetime, timezone
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from shared.telemetry import TraceContext, TelemetryCollector

app = FastAPI(title="API Gateway", version="1.0.0")
telemetry = TelemetryCollector("api-gateway")

ORDER_SERVICE_URL = os.environ.get("ORDER_SERVICE_URL", "http://127.0.0.1:8003")
USER_SERVICE_URL = os.environ.get("USER_SERVICE_URL", "http://127.0.0.1:8002")

chaos_state = {
    "latency_ms": 0.0,
    "error_rate": 0.0,
    "failure_mode": None
}

@app.get("/health")
def health():
    return {"status": "ok", "service": "api-gateway"}

@app.post("/chaos/inject")
def inject_chaos(config: dict):
    chaos_state["latency_ms"] = float(config.get("latency_ms", 0.0))
    chaos_state["error_rate"] = float(config.get("error_rate", 0.0))
    chaos_state["failure_mode"] = config.get("failure_mode")
    return {"status": "injected", "chaos_state": chaos_state}

@app.post("/chaos/clear")
def clear_chaos():
    chaos_state["latency_ms"] = 0.0
    chaos_state["error_rate"] = 0.0
    chaos_state["failure_mode"] = None
    return {"status": "cleared"}

@app.post("/api/checkout")
async def checkout(request: Request):
    t_start = datetime.now(timezone.utc)
    trace_id = TraceContext.generate_trace_id()
    span_id = TraceContext.generate_span_id()

    # Local chaos
    sleep_time = chaos_state["latency_ms"] / 1000.0
    if sleep_time > 0:
        time.sleep(sleep_time)

    outbound_traceparent = TraceContext.format_traceparent(trace_id, span_id)
    headers = {"traceparent": outbound_traceparent}

    has_error = False
    error_msg = ""
    status_code = 200
    order_data = {}

    if chaos_state["failure_mode"] == "SOCKET_RESET":
        has_error = True
        status_code = 503
        error_msg = "GatewayIngressReset: Edge connection pool reset by peer."
    else:
        try:
            resp = requests.post(f"{ORDER_SERVICE_URL}/orders/process", headers=headers, timeout=5.0)
            status_code = resp.status_code
            if resp.status_code >= 400:
                has_error = True
                error_msg = f"Upstream error from Order service: {resp.text[:120]}"
            else:
                order_data = resp.json()
        except Exception as e:
            has_error = True
            status_code = 504
            error_msg = f"GatewayTimeout: Order service unreachable or timed out: {str(e)}"

    t_end = datetime.now(timezone.utc)
    duration_ms = (t_end - t_start).total_seconds() * 1000.0

    telemetry.report_span(
        trace_id=trace_id,
        span_id=span_id,
        parent_span_id=None,
        operation_name="HTTP POST /api/checkout",
        start_time=t_start,
        end_time=t_end,
        duration_ms=round(duration_ms, 2),
        http_method="POST",
        http_path="/api/checkout",
        status_code=status_code,
        has_error=has_error,
        error_message=error_msg,
        attributes={"client_ip": "192.168.1.104", "route": "checkout"}
    )

    if has_error:
        return JSONResponse(status_code=status_code, content={"error": error_msg, "trace_id": trace_id})

    return {
        "status": "SUCCESS",
        "trace_id": trace_id,
        "duration_ms": round(duration_ms, 1),
        "order": order_data
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
