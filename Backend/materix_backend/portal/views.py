# portal/views.py
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from authentication.models import User
from .models import ServiceRequest
from .serializers import TechnicianPublicSerializer, ServiceRequestSerializer
from notifications.models import Notification
import re
from datetime import datetime

def format_request_message_for_tech(client_name, raw_message):
    urgency = "normal"
    date_str = ""
    desc = raw_message or ""
    
    urgency_match = re.search(r'\[Urgency:\s*([^\]]+)\]', desc, re.IGNORECASE)
    if urgency_match:
        urgency = urgency_match.group(1).strip()
        
    date_match = re.search(r'\[Preferred Date:\s*([^\]]+)\]', desc, re.IGNORECASE)
    if date_match:
        date_str = date_match.group(1).strip()
        
    desc = re.sub(r'\[Urgency:\s*[^\]]+\]\s*', '', desc, flags=re.IGNORECASE)
    desc = re.sub(r'\[Preferred Date:\s*[^\]]+\]\s*', '', desc, flags=re.IGNORECASE)
    desc = desc.strip()
    
    formatted_date = ""
    if date_str and date_str.lower() != "any":
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            formatted_date = dt.strftime("%d/%m/%Y")
        except ValueError:
            formatted_date = date_str
            
    if formatted_date:
        return f"New service request from {client_name}: {desc} on {formatted_date}"
    else:
        return f"New service request from {client_name}: {desc}"

def format_request_message_for_client(raw_message, status, tech_name):
    desc = raw_message or ""
    desc = re.sub(r'\[Urgency:\s*[^\]]+\]\s*', '', desc, flags=re.IGNORECASE)
    desc = re.sub(r'\[Preferred Date:\s*[^\]]+\]\s*', '', desc, flags=re.IGNORECASE)
    desc = desc.strip()
    
    return f"Your service request '{desc}' has been {status} by {tech_name}."

class TechnicianListView(generics.ListAPIView):
    serializer_class = TechnicianPublicSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        # Only show technicians who are fully activated: approved by admin AND paid
        qs = User.objects.filter(
            role='technician',
            approval_status='approved',
            has_paid=True,
            is_suspended=False,
        )

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(username__icontains=search)

        category = self.request.query_params.get('category', '').strip()
        if category:
            qs = qs.filter(specialty__iexact=category)

        availability = self.request.query_params.get('availability', '').strip().lower()
        if availability in ('available', 'unavailable'):
            available_flag = (availability == 'available')
            if available_flag:
                qs = qs.filter(is_active=True)
            else:
                qs = qs.exclude(is_active=True)

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
            sr = serializer.save()
            try:
                Notification.objects.create(
                    recipient_id=sr.technician_id,
                    request_id=str(sr.id),
                    message=format_request_message_for_tech(sr.client_name, sr.message),
                    notif_type="new_request"
                )
            except Exception as e:
                print(f"Failed to create request notification: {e}")
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
            recipient_id = updated_request.client_id
            if not recipient_id:
                try:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    lookup_name = updated_request.client_username or updated_request.client_name
                    if lookup_name:
                        u = User.objects.filter(username=lookup_name).first()
                        if u:
                            recipient_id = u.id
                except Exception as e:
                    print(f"Fallback lookup error: {e}")

            if recipient_id:
                try:
                    Notification.objects.create(
                        recipient_id=recipient_id,
                        request_id=str(updated_request.id),
                        message=format_request_message_for_client(updated_request.message, updated_request.status, user.username)
                    )
                except Exception as e:
                    print(f"Failed to create request notification: {e}")
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
