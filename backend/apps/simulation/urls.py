from django.urls import path
from .views import ScenarioListView, InjectFaultView, RunBenchmarkView, BenchmarkHistoryView, LivePulseView

urlpatterns = [
    path('pulse/', LivePulseView.as_view(), name='simulation-pulse'),
    path('scenarios/', ScenarioListView.as_view(), name='simulation-scenarios'),
    path('inject/', InjectFaultView.as_view(), name='simulation-inject'),
    path('benchmark/run/', RunBenchmarkView.as_view(), name='simulation-benchmark-run'),
    path('benchmark/history/', BenchmarkHistoryView.as_view(), name='simulation-benchmark-history'),
]
