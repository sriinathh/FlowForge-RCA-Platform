from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceViewSet, 
    DependencyViewSet, 
    TopologyView, 
    SeedTopologyView,
    OverviewSummaryView,
    DeploymentListView
)

router = DefaultRouter()
router.register(r'registry', ServiceViewSet, basename='service')
router.register(r'dependencies', DependencyViewSet, basename='dependency')

urlpatterns = [
    path('topology/', TopologyView.as_view(), name='topology'),
    path('overview/', OverviewSummaryView.as_view(), name='overview-summary'),
    path('deployments/', DeploymentListView.as_view(), name='deployments-list'),
    path('seed/', SeedTopologyView.as_view(), name='seed-topology'),
    path('', include(router.urls)),
]

