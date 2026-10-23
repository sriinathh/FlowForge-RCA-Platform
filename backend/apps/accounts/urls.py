from django.urls import path
from .views import WorkspaceListView, TeamMemberListCreateView, ApiTokenListCreateView, ApiTokenRevokeView

urlpatterns = [
    path('workspaces/', WorkspaceListView.as_view(), name='accounts-workspaces'),
    path('members/', TeamMemberListCreateView.as_view(), name='accounts-members'),
    path('tokens/', ApiTokenListCreateView.as_view(), name='accounts-tokens'),
    path('tokens/<int:token_id>/revoke/', ApiTokenRevokeView.as_view(), name='accounts-token-revoke'),
]
