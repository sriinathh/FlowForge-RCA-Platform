from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/services/', include('apps.services.urls')),
    path('api/telemetry/', include('apps.telemetry.urls')),
    path('api/incidents/', include('apps.incidents.urls')),
    path('api/analysis/', include('apps.analysis.urls')),
    path('api/simulation/', include('apps.simulation.urls')),
]
