"""
Order Management Service (Port 8003)
Orchestrates order placement, inventory verification, and delegates to Payment & User services.
"""

import sys
import os
import time
import uuid
import requests
from datetime import datetime, timezone
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from shared.telemetry import TraceContext, TelemetryCollector

app = FastAPI(title="Order Service", version="1.0.0")
telemetry = TelemetryCollector("order-service")

USER_SERVICE_URL = os.environ.get("USER_SERVICE_URL", "http://127.0.0.1:8002")
PAYMENT_SERVICE_URL = os.environ.get("PAYMENT_SERVICE_URL", "http://127.0.0.1:8004")

chaos_state = {
    "latency_ms": 0.0,
    "error_rate": 0.0,
    "failure_mode": None
}

@app.get("/health")
def health():
    return {"status": "ok", "service": "order-service"}

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

@app.post("/orders/process")
async def process_order(request: Request):
    t_start = datetime.now(timezone.utc)
    traceparent = request.headers.get("traceparent")
    trace_id, parent_span_id = TraceContext.parse_traceparent(traceparent)
    if not trace_id:
        trace_id = TraceContext.generate_trace_id()
    span_id = TraceContext.generate_span_id()

    # Local chaos
    base_latency = 0.025
    sleep_time = base_latency + (chaos_state["latency_ms"] / 1000.0)
    if sleep_time > 0:
        time.sleep(sleep_time)

    outbound_traceparent = TraceContext.format_traceparent(trace_id, span_id)
    headers = {"traceparent": outbound_traceparent}

    # Step 1: Call User Service
    user_ok = True
    user_err = ""
    try:
        user_resp = requests.get(f"{USER_SERVICE_URL}/users/validate", headers=headers, timeout=2.5)
        if user_resp.status_code >= 400:
            user_ok = False
            user_err = f"User validation failed with status {user_resp.status_code}"
    except Exception as e:
        user_ok = False
        user_err = f"User service connection error: {str(e)}"

    # Step 2: Call Payment Service if User ok
    payment_ok = True
    payment_err = ""
    if user_ok:
        try:
            pay_resp = requests.post(f"{PAYMENT_SERVICE_URL}/payments/charge", headers=headers, timeout=3.5)
            if pay_resp.status_code >= 400:
                payment_ok = False
                payment_err = f"Payment charge failed with status {pay_resp.status_code}: {pay_resp.text[:100]}"
        except Exception as e:
            payment_ok = False
            payment_err = f"Payment service timeout / connection error: {str(e)}"

    has_error = False
    error_msg = ""
    status_code = 200

    if not user_ok:
        has_error = True
        status_code = 500
        error_msg = f"OrderFailed: Dependency failure in User service: {user_err}"
    elif not payment_ok:
        has_error = True
        status_code = 500
        error_msg = f"OrderFailed: Dependency failure in Payment service: {payment_err}"
    elif chaos_state["failure_mode"] == "RESOURCE_THROTTLE" or chaos_state["error_rate"] > 50:
        has_error = True
        status_code = 503
        error_msg = "OrderQueueFull: Thread starvation and dispatch queue exhausted"

    t_end = datetime.now(timezone.utc)
    duration_ms = (t_end - t_start).total_seconds() * 1000.0

    telemetry.report_span(
        trace_id=trace_id,
        span_id=span_id,
        parent_span_id=parent_span_id,
        operation_name="process_order_checkout",
        start_time=t_start,
        end_time=t_end,
        duration_ms=round(duration_ms, 2),
        http_method="POST",
        http_path="/orders/process",
        status_code=status_code,
        has_error=has_error,
        error_message=error_msg,
        attributes={"order_id": f"ORD-{uuid.uuid4().hex[:6].upper()}"}
    )

    if has_error:
        return JSONResponse(status_code=status_code, content={"error": error_msg, "trace_id": trace_id})

    return {
        "status": "COMPLETED",
        "order_id": f"ORD-{uuid.uuid4().hex[:6].upper()}",
        "trace_id": trace_id,
        "duration_ms": round(duration_ms, 1)
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8003)
