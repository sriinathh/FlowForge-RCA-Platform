"""
Payment Gateway Service (Port 8004)
Handles payment processing and credit card charges.
"""

import sys
import os
import time
from datetime import datetime, timezone
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
import uvicorn

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from shared.telemetry import TraceContext, TelemetryCollector

app = FastAPI(title="Payment Service", version="1.0.0")
telemetry = TelemetryCollector("payment-service")

chaos_state = {
    "latency_ms": 0.0,
    "error_rate": 0.0,
    "failure_mode": None
}

@app.get("/health")
def health():
    return {"status": "ok", "service": "payment-service"}

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

@app.post("/payments/charge")
async def process_payment(request: Request):
    t_start = datetime.now(timezone.utc)
    traceparent = request.headers.get("traceparent")
    trace_id, parent_span_id = TraceContext.parse_traceparent(traceparent)
    if not trace_id:
        trace_id = TraceContext.generate_trace_id()
    span_id = TraceContext.generate_span_id()

    # Base processing latency (35-65ms) + injected chaos
    base_latency = 0.045
    sleep_time = base_latency + (chaos_state["latency_ms"] / 1000.0)
    if sleep_time > 0:
        time.sleep(sleep_time)

    # Check error condition
    has_error = False
    error_msg = ""
    status_code = 200

    if chaos_state["failure_mode"] == "LATENCY_AND_TIMEOUT" or chaos_state["latency_ms"] > 2000:
        has_error = True
        status_code = 504
        error_msg = "GatewayTimeout: Downstream banking processor host unresponsive after 2500ms"
    elif chaos_state["error_rate"] > 0 and (time.time() % 100 < chaos_state["error_rate"]):
        has_error = True
        status_code = 500
        error_msg = "PaymentException: Settlement transaction rejected by card network"

    t_end = datetime.now(timezone.utc)
    duration_ms = (t_end - t_start).total_seconds() * 1000.0

    telemetry.report_span(
        trace_id=trace_id,
        span_id=span_id,
        parent_span_id=parent_span_id,
        operation_name="charge_credit_card",
        start_time=t_start,
        end_time=t_end,
        duration_ms=round(duration_ms, 2),
        http_method="POST",
        http_path="/payments/charge",
        status_code=status_code,
        has_error=has_error,
        error_message=error_msg,
        attributes={"amount": 89.99, "currency": "USD"}
    )

    if has_error:
        return JSONResponse(status_code=status_code, content={"error": error_msg, "trace_id": trace_id})

    return {
        "status": "APPROVED",
        "payment_id": f"PAY-{uuid.uuid4().hex[:8].upper()}",
        "trace_id": trace_id,
        "duration_ms": round(duration_ms, 1)
    }

if __name__ == "__main__":
    import uuid
    uvicorn.run(app, host="127.0.0.1", port=8004)
