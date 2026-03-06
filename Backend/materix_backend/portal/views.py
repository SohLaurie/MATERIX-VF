# portal/views.py
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from authentication.models import User
from .models import ServiceRequest
from .serializers import TechnicianPublicSerializer, ServiceRequestSerializer
from notifications.models import Notification



class TechnicianListView(generics.ListAPIView):
    serializer_class = TechnicianPublicSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = User.objects.filter(role='technician')
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(username__icontains=search)

        category = self.request.query_params.get('category', '').strip()
        if category:
            qs = qs.filter(specialty__iexact=category)

        availability = self.request.query_params.get('availability', '').strip().lower()
        if availability in ('available', 'unavailable'):
            available_flag = (availability == 'available')
            qs = qs.filter(is_active=True, is_suspended=False) if available_flag else qs.exclude(
                Q(is_active=True) & Q(is_suspended=False)
            )

        return qs.order_by('-date_joined', 'username')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class ServiceRequestCreateView(generics.CreateAPIView):
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class MyServiceRequestsView(generics.ListAPIView):
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'technician':
            return ServiceRequest.objects.filter(technician=user).order_by('-created_at')
        return ServiceRequest.objects.filter(client=user).order_by('-created_at')


class ServiceRequestDetailView(generics.RetrieveUpdateAPIView):
    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        request_obj = self.get_object()
        user = self.request.user

        # Only the assigned technician can update status
        if user.role != "technician" or request_obj.technician != user:
            raise PermissionDenied("You are not allowed to update this request.")

        updated_request = serializer.save()

        # Create notification with the new status
        if updated_request.client:
            Notification.objects.create(
                recipient=updated_request.client,
                request=updated_request,
                message=f"Your service request '{updated_request.message[:20]}...' has been {updated_request.status} by {user.username}."
            )


    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True  # ✅ allow PATCH without all fields
        return super().update(request, *args, **kwargs)
