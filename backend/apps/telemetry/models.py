from django.db import models
from django.utils import timezone

class SpanRecord(models.Model):
    trace_id = models.CharField(max_length=64, db_index=True)
    span_id = models.CharField(max_length=32, db_index=True)
    parent_span_id = models.CharField(max_length=32, null=True, blank=True, db_index=True)
    
    service_name = models.CharField(max_length=64, db_index=True)
    operation_name = models.CharField(max_length=128)
    
    start_time = models.DateTimeField(default=timezone.now, db_index=True)
    end_time = models.DateTimeField(default=timezone.now)
    duration_ms = models.FloatField(default=0.0)
    
    http_method = models.CharField(max_length=16, blank=True, default='GET')
    http_path = models.CharField(max_length=256, blank=True, default='')
    status_code = models.IntegerField(default=200)
    has_error = models.BooleanField(default=False, db_index=True)
    error_message = models.TextField(blank=True, default='')
    
    attributes = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['trace_id', 'start_time']),
            models.Index(fields=['service_name', 'start_time']),
        ]

    def __str__(self):
        return f"[{self.service_name}] {self.operation_name} - {self.duration_ms}ms (Error={self.has_error})"

class MetricRecord(models.Model):
    service_name = models.CharField(max_length=64, db_index=True)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    metric_name = models.CharField(max_length=64, db_index=True)  # latency_ms, error_rate_pct, rps
    value = models.FloatField()
    labels = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['service_name', 'metric_name', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.service_name} | {self.metric_name} = {self.value} at {self.timestamp}"

class LogRecord(models.Model):
    LEVEL_CHOICES = [
        ('DEBUG', 'Debug'),
        ('INFO', 'Info'),
        ('WARN', 'Warn'),
        ('ERROR', 'Error'),
        ('FATAL', 'Fatal'),
    ]

    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    service_name = models.CharField(max_length=64, db_index=True)
    level = models.CharField(max_length=16, choices=LEVEL_CHOICES, default='INFO', db_index=True)
    message = models.TextField()
    trace_id = models.CharField(max_length=64, blank=True, default='', db_index=True)
    span_id = models.CharField(max_length=32, blank=True, default='')
    stack_trace = models.TextField(blank=True, default='')
    context = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.level}] {self.service_name}: {self.message[:60]}"
