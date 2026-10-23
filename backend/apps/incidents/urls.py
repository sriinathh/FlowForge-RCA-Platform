from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IncidentViewSet, IncidentResolveView, TriggerDetectionScanView, IncidentNoteCreateView

router = DefaultRouter()
router.register(r'list', IncidentViewSet, basename='incident')

urlpatterns = [
    path('scan/', TriggerDetectionScanView.as_view(), name='trigger-scan'),
    path('<str:incident_code>/resolve/', IncidentResolveView.as_view(), name='resolve-incident'),
    path('<str:incident_code>/notes/', IncidentNoteCreateView.as_view(), name='add-incident-note'),
    path('', include(router.urls)),
]

