from rest_framework import serializers
from .models import Incident, IncidentTimeline, IncidentNote

class IncidentTimelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentTimeline
        fields = '__all__'

class IncidentNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentNote
        fields = ['id', 'author', 'text', 'created_at']

class IncidentSerializer(serializers.ModelSerializer):
    timeline = IncidentTimelineSerializer(many=True, read_only=True)
    notes = IncidentNoteSerializer(many=True, read_only=True)

    class Meta:
        model = Incident
        fields = '__all__'

