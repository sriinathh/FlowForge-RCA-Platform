from rest_framework import serializers
from .models import Service, Dependency

class DependencySerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source='source.name', read_only=True)
    target_name = serializers.CharField(source='target.name', read_only=True)

    class Meta:
        model = Dependency
        fields = ['id', 'source', 'source_name', 'target', 'target_name', 'protocol', 'call_frequency', 'avg_latency_ms', 'error_rate_pct', 'is_critical']

class ServiceSerializer(serializers.ModelSerializer):
    downstream = serializers.SerializerMethodField()
    upstream = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = '__all__'

    def get_downstream(self, obj):
        return [dep.target.name for dep in obj.downstream_dependencies.all()]

    def get_upstream(self, obj):
        return [dep.source.name for dep in obj.upstream_dependencies.all()]

class DeploymentSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        from .models import Deployment
        model = Deployment
        fields = ['id', 'service', 'service_name', 'version', 'environment', 'deployed_at', 'status', 'change_summary', 'commit_hash', 'deployed_by']

