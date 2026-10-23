from rest_framework import serializers
from .models import Organization, Workspace, TeamMember, ApiToken

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'

class WorkspaceSerializer(serializers.ModelSerializer):
    services_count = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = ['id', 'name', 'slug', 'environment', 'is_default', 'created_at', 'services_count']

    def get_services_count(self, obj):
        from apps.services.models import Service
        return Service.objects.count()

class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = ['id', 'name', 'email', 'role', 'status', 'created_at']

class ApiTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApiToken
        fields = ['id', 'name', 'prefix', 'scope', 'is_active', 'created_at', 'last_used_at']
