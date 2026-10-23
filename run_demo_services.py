import subprocess
import sys
import time

p_pay = subprocess.Popen([sys.executable, "-m", "uvicorn", "payment-service.main:app", "--port", "8004", "--host", "127.0.0.1"], cwd="demo-services")
p_usr = subprocess.Popen([sys.executable, "-m", "uvicorn", "user-service.main:app", "--port", "8002", "--host", "127.0.0.1"], cwd="demo-services")
p_ord = subprocess.Popen([sys.executable, "-m", "uvicorn", "order-service.main:app", "--port", "8003", "--host", "127.0.0.1"], cwd="demo-services")
p_gw = subprocess.Popen([sys.executable, "-m", "uvicorn", "api-gateway.main:app", "--port", "8001", "--host", "127.0.0.1"], cwd="demo-services")

print("All 4 demo microservices launched.")
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    p_pay.terminate()
    p_usr.terminate()
    p_ord.terminate()
    p_gw.terminate()
