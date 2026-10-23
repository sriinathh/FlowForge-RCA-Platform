from django.urls import path
from .views import RunRCAView, BaselineComparisonView

urlpatterns = [
    path('rca/', RunRCAView.as_view(), name='run-rca'),
    path('compare/', BaselineComparisonView.as_view(), name='baseline-compare'),
]
