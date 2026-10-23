"""
User & Auth Service (Port 8002)
Manages user profiles, credentials, and token validation.
"""

import sys
import os
import time
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from shared.telemetry import TraceContext, TelemetryCollector

app = FastAPI(title="User Service", version="1.0.0")
telemetry = TelemetryCollector("user-service")

chaos_state = {
    "latency_ms": 0.0,
    "error_rate": 0.0,
    "failure_mode": None
}

@app.get("/health")
def health():
    return {"status": "ok", "service": "user-service"}

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

@app.get("/users/validate")
@app.get("/users/{user_id}")
async def validate_user(request: Request, user_id: str = "usr_991"):
    t_start = datetime.now(timezone.utc)
    traceparent = request.headers.get("traceparent")
    trace_id, parent_span_id = TraceContext.parse_traceparent(traceparent)
    if not trace_id:
        trace_id = TraceContext.generate_trace_id()
    span_id = TraceContext.generate_span_id()

    base_latency = 0.015
    sleep_time = base_latency + (chaos_state["latency_ms"] / 1000.0)
    if sleep_time > 0:
        time.sleep(sleep_time)

    has_error = False
    error_msg = ""
    status_code = 200

    if chaos_state["failure_mode"] == "ERROR_500" or chaos_state["error_rate"] > 50:
        has_error = True
        status_code = 500
        error_msg = "DatabasePoolTimeout: connection acquired timeout 3000ms. Deadlock detected in table `users`."
    elif chaos_state["error_rate"] > 0 and (time.time() % 100 < chaos_state["error_rate"]):
        has_error = True
        status_code = 500
        error_msg = "InternalServerError: User session cache deserialization failure."

    t_end = datetime.now(timezone.utc)
    duration_ms = (t_end - t_start).total_seconds() * 1000.0

    telemetry.report_span(
        trace_id=trace_id,
        span_id=span_id,
        parent_span_id=parent_span_id,
        operation_name="validate_user_token",
        start_time=t_start,
        end_time=t_end,
        duration_ms=round(duration_ms, 2),
        http_method="GET",
        http_path=f"/users/{user_id}",
        status_code=status_code,
        has_error=has_error,
        error_message=error_msg,
        attributes={"user_id": user_id, "auth_tier": "premium"}
    )

    if has_error:
        return JSONResponse(status_code=status_code, content={"error": error_msg, "trace_id": trace_id})

    return {
        "status": "VALID",
        "user_id": user_id,
        "username": "alex.dev",
        "email": "alex@flowforge.dev",
        "tier": "gold",
        "trace_id": trace_id
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8002)
