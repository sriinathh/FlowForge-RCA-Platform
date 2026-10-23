"""
FlowForge Multi-Process Local Runner.
Launches the Django Backend, 4 Demo Microservices, and the React Frontend simultaneously.
"""

import sys
import os
import subprocess
import time
import signal

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

PROCESSES = []

def run_service(name, cmd, cwd):
    print(f"🚀 Starting {name}...")
    p = subprocess.Popen(cmd, cwd=cwd, shell=True)
    PROCESSES.append((name, p))
    return p

def shutdown(signum, frame):
    print("\n🛑 Shutting down FlowForge platform...")
    for name, p in PROCESSES:
        print(f"   Stopping {name}...")
        p.terminate()
        try:
            p.wait(timeout=2)
        except subprocess.TimeoutExpired:
            p.kill()
    print("✅ All services stopped. Goodbye!")
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    print("=" * 65)
    print("       FLOWFORGE — AI ROOT CAUSE ANALYSIS PLATFORM")
    print("=" * 65)

    # 1. Apply Backend migrations & seed
    print("\n📦 Initializing Backend Database...")
    subprocess.run([sys.executable, "backend/manage.py", "migrate"], cwd=ROOT_DIR)

    # 2. Launch Django Backend
    run_service(
        "FlowForge Backend (Port 8000)",
        f'"{sys.executable}" backend/manage.py runserver 127.0.0.1:8000',
        ROOT_DIR
    )
    time.sleep(1.5)

    # 3. Launch Demo Microservices
    run_service(
        "Payment Service (Port 8004)",
        f'"{sys.executable}" -m uvicorn payment-service.main:app --port 8004 --host 127.0.0.1',
        os.path.join(ROOT_DIR, "demo-services")
    )
    run_service(
        "User Service (Port 8002)",
        f'"{sys.executable}" -m uvicorn user-service.main:app --port 8002 --host 127.0.0.1',
        os.path.join(ROOT_DIR, "demo-services")
    )
    run_service(
        "Order Service (Port 8003)",
        f'"{sys.executable}" -m uvicorn order-service.main:app --port 8003 --host 127.0.0.1',
        os.path.join(ROOT_DIR, "demo-services")
    )
    run_service(
        "API Gateway (Port 8001)",
        f'"{sys.executable}" -m uvicorn api-gateway.main:app --port 8001 --host 127.0.0.1',
        os.path.join(ROOT_DIR, "demo-services")
    )
    time.sleep(1.5)

    # 4. Launch React Frontend
    run_service(
        "React Frontend (Port 3000)",
        "npm.cmd run dev",
        os.path.join(ROOT_DIR, "frontend")
    )

    print("\n" + "=" * 65)
    print("🎉 FlowForge is fully running!")
    print("👉 Dashboard UI:      http://localhost:3000")
    print("👉 Backend API:       http://127.0.0.1:8000/api/")
    print("👉 API Gateway:       http://127.0.0.1:8001")
    print("👉 Microservices:     8002 (Users), 8003 (Orders), 8004 (Payments)")
    print("Press Ctrl+C to terminate all services.")
    print("=" * 65 + "\n")

    while True:
        time.sleep(1)

if __name__ == "__main__":
    main()
