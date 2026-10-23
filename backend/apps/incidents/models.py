from django.db import models
from django.utils import timezone
import uuid

class Incident(models.Model):
    SEVERITY_CHOICES = [
        ('CRITICAL', 'Critical (P1)'),
        ('HIGH', 'High (P2)'),
        ('MEDIUM', 'Medium (P3)'),
        ('LOW', 'Low (P4)'),
    ]

    STATUS_CHOICES = [
        ('ACTIVE', 'Active / Firing'),
        ('INVESTIGATING', 'Investigating'),
        ('MITIGATED', 'Mitigated'),
        ('RESOLVED', 'Resolved'),
    ]

    incident_code = models.CharField(max_length=32, unique=True, db_index=True)
    title = models.CharField(max_length=256)
    severity = models.CharField(max_length=16, choices=SEVERITY_CHOICES, default='HIGH')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='ACTIVE', db_index=True)
    
    detected_at = models.DateTimeField(default=timezone.now, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    primary_symptom = models.TextField(blank=True, default='')
    root_cause_service = models.CharField(max_length=64, blank=True, default='')
    confidence_score = models.FloatField(default=0.0)
    
    impacted_services = models.JSONField(default=list, blank=True)
    evidence_breakdown = models.JSONField(default=dict, blank=True)
    ai_summary = models.TextField(blank=True, default='')
    recommended_actions = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-detected_at']

    def save(self, *args, **kwargs):
        if not self.incident_code:
            self.incident_code = f"INC-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.incident_code}] {self.title} ({self.status})"

class IncidentTimeline(models.Model):
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='timeline')
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    event_type = models.CharField(max_length=64)  # ANOMALY_DETECTED, ALERT_FIRED, RCA_UPDATED, ACTION_TAKEN
    service_name = models.CharField(max_length=64, blank=True, default='')
    title = models.CharField(max_length=256)
    description = models.TextField(blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.incident.incident_code} - {self.event_type} at {self.timestamp}"

class IncidentNote(models.Model):
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='notes')
    author = models.CharField(max_length=128, default='SRE Lead')
    text = models.TextField()
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note by {self.author} on {self.incident.incident_code}"

