# portal/urls.py
from django.urls import path
from .views import TechnicianListView, ServiceRequestCreateView, MyServiceRequestsView,ServiceRequestDetailView

app_name = 'portal'

urlpatterns = [
    path('technicians/', TechnicianListView.as_view(), name='technician-list'),
    path('requests/', ServiceRequestCreateView.as_view(), name='request-create'),
    path('requests/my/', MyServiceRequestsView.as_view(), name='request-my'),
    path("requests/<str:pk>/", ServiceRequestDetailView.as_view(), name="service-request-detail"),
]

