from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Organization, Workspace, TeamMember, ApiToken
from .serializers import OrganizationSerializer, WorkspaceSerializer, TeamMemberSerializer, ApiTokenSerializer

def seed_default_accounts():
    org, _ = Organization.objects.get_or_create(
        slug='flowforge-global',
        defaults={'name': 'FlowForge Global'}
    )

    ws_prod, _ = Workspace.objects.get_or_create(
        organization=org,
        slug='ws-prod',
        defaults={'name': 'Production Mesh', 'environment': 'Production', 'is_default': True}
    )

    Workspace.objects.get_or_create(
        organization=org,
        slug='ws-staging',
        defaults={'name': 'Staging Cluster', 'environment': 'Staging', 'is_default': False}
    )

    Workspace.objects.get_or_create(
        organization=org,
        slug='ws-dev',
        defaults={'name': 'Dev Local Sandbox', 'environment': 'Development', 'is_default': False}
    )

    # Seed default team members if empty
    if TeamMember.objects.filter(workspace=ws_prod).count() == 0:
        TeamMember.objects.create(workspace=ws_prod, name='SRE Incident Commander', email='sre-lead@flowforge.internal', role='Workspace Admin', status='Active')
        TeamMember.objects.create(workspace=ws_prod, name='Platform Architect', email='architect@flowforge.internal', role='Editor', status='Active')
        TeamMember.objects.create(workspace=ws_prod, name='Observability Engineer', email='telemetry@flowforge.internal', role='Editor', status='Active')
        TeamMember.objects.create(workspace=ws_prod, name='DevOps Automation Bot', email='service-account@flowforge.internal', role='Telemetry Ingest', status='Active')

    # Seed initial tokens if empty
    if ApiToken.objects.filter(workspace=ws_prod).count() == 0:
        ApiToken.create_token(ws_prod, 'OpenTelemetry Ingest Agent', scope='telemetry:write')
        ApiToken.create_token(ws_prod, 'Prometheus Remote Write Proxy', scope='metrics:write')
        ApiToken.create_token(ws_prod, 'CI/CD Deployment Webhook', scope='deployments:write')

    return org, ws_prod

class WorkspaceListView(APIView):
    def get(self, request):
        if Workspace.objects.count() == 0:
            seed_default_accounts()
        workspaces = Workspace.objects.all().order_by('-is_default', 'name')
        return Response({"workspaces": WorkspaceSerializer(workspaces, many=True).data})

class TeamMemberListCreateView(APIView):
    def get(self, request):
        if TeamMember.objects.count() == 0:
            seed_default_accounts()
        members = TeamMember.objects.all().order_by('name')
        return Response({"members": TeamMemberSerializer(members, many=True).data})

    def post(self, request):
        name = request.data.get('name')
        email = request.data.get('email')
        role = request.data.get('role', 'Editor')
        if not name or not email:
            return Response({"error": "name and email are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        ws = Workspace.objects.filter(is_default=True).first() or Workspace.objects.first()
        if not ws:
            _, ws = seed_default_accounts()

        member = TeamMember.objects.create(
            workspace=ws,
            name=name,
            email=email,
            role=role,
            status='Active'
        )
        return Response(TeamMemberSerializer(member).data, status=status.HTTP_201_CREATED)

class ApiTokenListCreateView(APIView):
    def get(self, request):
        if ApiToken.objects.count() == 0:
            seed_default_accounts()
        tokens = ApiToken.objects.filter(is_active=True).order_by('-created_at')
        return Response({"tokens": ApiTokenSerializer(tokens, many=True).data})

    def post(self, request):
        name = request.data.get('name')
        scope = request.data.get('scope', 'telemetry:full')
        if not name:
            return Response({"error": "Token name is required"}, status=status.HTTP_400_BAD_REQUEST)

        ws = Workspace.objects.filter(is_default=True).first() or Workspace.objects.first()
        if not ws:
            _, ws = seed_default_accounts()

        token_obj, raw_secret = ApiToken.create_token(workspace=ws, name=name, scope=scope)

        return Response({
            "token": ApiTokenSerializer(token_obj).data,
            "secret": raw_secret
        }, status=status.HTTP_201_CREATED)

class ApiTokenRevokeView(APIView):
    def delete(self, request, token_id):
        try:
            token = ApiToken.objects.get(id=token_id)
            token.is_active = False
            token.save()
            return Response({"status": "revoked", "id": token_id})
        except ApiToken.DoesNotExist:
            return Response({"error": "Token not found"}, status=status.HTTP_404_NOT_FOUND)
