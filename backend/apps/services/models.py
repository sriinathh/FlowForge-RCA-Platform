from django.db import models
from django.utils import timezone

class Service(models.Model):
    HEALTH_CHOICES = [
        ('HEALTHY', 'Healthy'),
        ('DEGRADED', 'Degraded'),
        ('UNHEALTHY', 'Unhealthy'),
        ('DOWN', 'Down'),
    ]

    name = models.CharField(max_length=64, unique=True, db_index=True)
    display_name = models.CharField(max_length=128)
    endpoint = models.URLField(max_length=256)
    port = models.IntegerField(default=8000)
    health_status = models.CharField(max_length=16, choices=HEALTH_CHOICES, default='HEALTHY')
    
    # Realtime aggregated performance statistics
    p95_latency_ms = models.FloatField(default=25.0)
    avg_latency_ms = models.FloatField(default=18.0)
    error_rate_pct = models.FloatField(default=0.0)
    requests_per_sec = models.FloatField(default=10.0)
    last_heartbeat = models.DateTimeField(default=timezone.now)
    description = models.TextField(blank=True, default='')

    # Extended service catalog metadata
    environment = models.CharField(max_length=32, default='Production', db_index=True)
    team = models.CharField(max_length=64, default='Platform Engineering')
    owner_email = models.CharField(max_length=128, default='sre@flowforge.internal')
    version = models.CharField(max_length=32, default='v1.0.0')
    tier = models.CharField(max_length=32, default='Tier 1')
    slo_target_pct = models.FloatField(default=99.9)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.display_name} ({self.name}) - {self.health_status}"

class Dependency(models.Model):
    source = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='downstream_dependencies')
    target = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='upstream_dependencies')
    protocol = models.CharField(max_length=16, default='HTTP/REST')
    call_frequency = models.CharField(max_length=32, default='Synchronous')
    avg_latency_ms = models.FloatField(default=20.0)
    error_rate_pct = models.FloatField(default=0.0)
    is_critical = models.BooleanField(default=True)

    class Meta:
        unique_together = ('source', 'target')

    def __str__(self):
        return f"{self.source.name} -> {self.target.name}"

class Deployment(models.Model):
    STATUS_CHOICES = [
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('ROLLING_OUT', 'Rolling Out'),
    ]

    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='deployments')
    version = models.CharField(max_length=32)
    environment = models.CharField(max_length=32, default='Production')
    deployed_at = models.DateTimeField(default=timezone.now, db_index=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='SUCCESS')
    change_summary = models.TextField(blank=True, default='')
    commit_hash = models.CharField(max_length=40, blank=True, default='')
    deployed_by = models.CharField(max_length=64, default='CI/CD Automation')

    class Meta:
        ordering = ['-deployed_at']

    def __str__(self):
        return f"{self.service.name}:{self.version} ({self.environment}) - {self.status}"
