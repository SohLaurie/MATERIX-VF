# portal/views.py
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
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


class ServiceRequestCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ServiceRequestSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyServiceRequestsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == 'technician':
            requests = ServiceRequest.objects(technician_id=user.id).order_by('-created_at')
        else:
            requests = ServiceRequest.objects(client_id=user.id).order_by('-created_at')
        
        serializer = ServiceRequestSerializer(requests, many=True, context={"request": request})
        return Response(serializer.data)


class ServiceRequestDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            sr = ServiceRequest.objects.get(id=pk)
            if request.user.id not in (sr.technician_id, sr.client_id) and request.user.role != 'admin':
                return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
            serializer = ServiceRequestSerializer(sr, context={"request": request})
            return Response(serializer.data)
        except Exception:
            return Response({"error": "Service request not found"}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            sr = ServiceRequest.objects.get(id=pk)
        except Exception:
            return Response({"error": "Service request not found"}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        # Only the assigned technician can update status
        if user.role != "technician" or sr.technician_id != user.id:
            return Response({"error": "You are not allowed to update this request."}, status=status.HTTP_403_FORBIDDEN)

        serializer = ServiceRequestSerializer(sr, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            updated_request = serializer.save()

            # Create notification with the new status
            if updated_request.client_id:
                Notification.objects.create(
                    recipient_id=updated_request.client_id,
                    request_id=str(updated_request.id),
                    message=f"Your service request '{updated_request.message[:20]}...' has been {updated_request.status} by {user.username}."
                )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
