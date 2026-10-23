from django.urls import path
from .views import IngestBatchTelemetryView, TraceListView, TraceWaterfallView, MetricSeriesView, LogListView

urlpatterns = [
    path('ingest/', IngestBatchTelemetryView.as_view(), name='telemetry-ingest'),
    path('traces/', TraceListView.as_view(), name='trace-list'),
    path('traces/<str:trace_id>/waterfall/', TraceWaterfallView.as_view(), name='trace-waterfall'),
    path('metrics/series/', MetricSeriesView.as_view(), name='metric-series'),
    path('logs/', LogListView.as_view(), name='log-list'),
]
