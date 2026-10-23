from django.db import models
from django.utils import timezone
import hashlib
import secrets

class Organization(models.Model):
    name = models.CharField(max_length=128, default='FlowForge Global')
    slug = models.CharField(max_length=64, unique=True, default='flowforge-global')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Workspace(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='workspaces')
    name = models.CharField(max_length=128)
    slug = models.CharField(max_length=64, db_index=True)
    environment = models.CharField(max_length=32, default='Production')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.environment})"

class TeamMember(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Workspace Admin'),
        ('EDITOR', 'Editor'),
        ('INGEST', 'Telemetry Ingest'),
        ('VIEWER', 'Viewer'),
    ]

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='members')
    name = models.CharField(max_length=128)
    email = models.EmailField()
    role = models.CharField(max_length=32, default='Workspace Admin')
    status = models.CharField(max_length=16, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} <{self.email}> - {self.role}"

class ApiToken(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='api_tokens')
    name = models.CharField(max_length=128)
    token_hash = models.CharField(max_length=64, db_index=True)
    prefix = models.CharField(max_length=24)
    scope = models.CharField(max_length=64, default='telemetry:full')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    @classmethod
    def create_token(cls, workspace, name, scope='telemetry:full'):
        raw_secret = f"ff_live_{secrets.token_hex(16)}"
        token_hash = hashlib.sha256(raw_secret.encode('utf-8')).hexdigest()
        prefix = f"{raw_secret[:12]}..."
        obj = cls.objects.create(
            workspace=workspace,
            name=name,
            token_hash=token_hash,
            prefix=prefix,
            scope=scope,
            is_active=True
        )
        return obj, raw_secret

    def __str__(self):
        return f"{self.name} ({self.prefix})"
