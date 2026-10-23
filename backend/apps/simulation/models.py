from django.db import models
from django.utils import timezone

class BenchmarkRun(models.Model):
    run_id = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    total_trials = models.IntegerField(default=10)
    
    flowforge_accuracy_pct = models.FloatField(default=0.0)
    threshold_accuracy_pct = models.FloatField(default=0.0)
    
    mean_time_to_identify_sec = models.FloatField(default=0.0)
    false_positive_reduction_pct = models.FloatField(default=0.0)
    avg_processing_latency_ms = models.FloatField(default=0.0)
    
    detailed_results = models.JSONField(default=list)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Benchmark {self.run_id} - Accuracy: {self.flowforge_accuracy_pct}%"
