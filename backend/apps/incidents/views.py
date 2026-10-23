from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import Incident, IncidentTimeline
from .serializers import IncidentSerializer, IncidentTimelineSerializer

class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.all().order_by('-detected_at')
    serializer_class = IncidentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        severity_param = self.request.query_params.get('severity')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        if severity_param:
            qs = qs.filter(severity=severity_param.upper())
        return qs

class IncidentResolveView(APIView):
    def post(self, request, incident_code):
        try:
            incident = Incident.objects.get(incident_code=incident_code)
            incident.status = 'RESOLVED'
            incident.resolved_at = timezone.now()
            incident.save()

            IncidentTimeline.objects.create(
                incident=incident,
                event_type='RESOLVED',
                title='Incident Marked Resolved',
                description=f'Incident {incident_code} marked as resolved by engineer.',
                timestamp=timezone.now()
            )

            return Response(IncidentSerializer(incident).data)
        except Incident.DoesNotExist:
            return Response({'error': 'Incident not found'}, status=status.HTTP_404_NOT_FOUND)

class TriggerDetectionScanView(APIView):
    """
    Scans the system telemetry and triggers RCA engine to detect new incidents or update active ones.
    """
    def post(self, request):
        from apps.analysis.engine import run_root_cause_analysis
        result = run_root_cause_analysis()
        return Response(result)

class IncidentNoteCreateView(APIView):
    """
    Appends an engineer investigation note to an incident.
    """
    def post(self, request, incident_code):
        from .models import IncidentNote
        from .serializers import IncidentNoteSerializer
        try:
            incident = Incident.objects.get(incident_code=incident_code)
            text = request.data.get('text', '').strip()
            author = request.data.get('author', 'SRE Lead').strip() or 'SRE Lead'
            if not text:
                return Response({'error': 'Note text cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

            note = IncidentNote.objects.create(
                incident=incident,
                author=author,
                text=text,
                created_at=timezone.now()
            )
            return Response(IncidentNoteSerializer(note).data, status=status.HTTP_201_CREATED)
        except Incident.DoesNotExist:
            return Response({'error': 'Incident not found'}, status=status.HTTP_404_NOT_FOUND)

