from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .simulator import CHAOS_SCENARIOS, inject_scenario_telemetry, run_evaluation_benchmark_suite, generate_live_pulse
from .models import BenchmarkRun

class LivePulseView(APIView):
    """
    Emits continuous live background telemetry across the microservice mesh.
    """
    def post(self, request):
        result = generate_live_pulse()
        return Response(result)

class ScenarioListView(APIView):
    """
    List available chaos fault injection scenarios.
    """
    def get(self, request):
        scenarios = []
        for key, sc in CHAOS_SCENARIOS.items():
            scenarios.append({
                "key": key,
                "name": sc["name"],
                "target_service": sc["target_service"],
                "fault_type": sc["fault_type"],
                "description": sc["description"],
                "injected_latency_ms": sc["injected_latency_ms"],
                "injected_error_rate": sc["injected_error_rate"]
            })
        return Response({"scenarios": scenarios})

class InjectFaultView(APIView):
    """
    Injects a fault scenario or clears faults across the microservices.
    """
    def post(self, request):
        scenario_key = request.data.get('scenario_key', 'payment_timeout')
        try:
            result = inject_scenario_telemetry(scenario_key)
            return Response(result)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RunBenchmarkView(APIView):
    """
    Triggers an automated evaluation benchmark comparing FlowForge against baseline.
    """
    def post(self, request):
        trials = int(request.data.get('trials', 10))
        trials = max(3, min(30, trials))
        benchmark_results = run_evaluation_benchmark_suite(trials=trials)
        return Response(benchmark_results)

class BenchmarkHistoryView(APIView):
    """
    Returns history of benchmark runs.
    """
    def get(self, request):
        runs = BenchmarkRun.objects.all()[:10]
        data = [{
            "run_id": r.run_id,
            "created_at": r.created_at.isoformat(),
            "trials": r.total_trials,
            "flowforge_accuracy": r.flowforge_accuracy_pct,
            "threshold_accuracy": r.threshold_accuracy_pct,
            "mtti_sec": r.mean_time_to_identify_sec,
            "false_pos_reduction": r.false_positive_reduction_pct,
            "avg_latency_ms": r.avg_processing_latency_ms
        } for r in runs]
        return Response({"benchmarks": data})
