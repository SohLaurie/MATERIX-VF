"""
authentication/views.py

Endpoints:
  POST   /api/auth/register/                         – register any user role
  POST   /api/auth/login/                            – JWT login (email + password)
  POST   /api/auth/token/refresh/                    – JWT token refresh
  GET    /api/auth/profile/                          – current user profile (JWT)
  GET    /api/auth/admin/users/                      – list all users (admin)
  POST   /api/auth/admin/users/                      – create user (admin)
  PATCH  /api/auth/admin/users/<pk>/                 – edit user (admin)
  DELETE /api/auth/admin/users/<pk>/                 – delete user (admin)
  GET    /api/auth/admin/technicians/                – list all technician applications (admin)
  PATCH  /api/auth/admin/technicians/<pk>/approve/   – approve application (admin)
  PATCH  /api/auth/admin/technicians/<pk>/reject/    – reject application (admin)
  POST   /api/auth/complete-payment/                 – mark technician as paid + active (JWT)
"""

import os
import uuid
from django.conf import settings
from rest_framework import generics, permissions, serializers, status
from .models import User
from .serializers import RegisterSerializer, UserSerializer
from .tech_application_model import TechnicianApplication
from notifications.models import Notification
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _save_uploaded_file(file_obj, subdir):
    """Save an InMemoryUploadedFile under MEDIA_ROOT/<subdir>/ and return its relative URL."""
    if not file_obj:
        return ''
    ext = os.path.splitext(file_obj.name)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    save_dir = os.path.join(settings.MEDIA_ROOT, subdir)
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, filename)
    with open(save_path, 'wb+') as dest:
        for chunk in file_obj.chunks():
            dest.write(chunk)
    return f"{settings.MEDIA_URL}{subdir}/{filename}"


def _is_admin(user):
    return user.is_authenticated and (user.role == 'admin' or user.is_staff)


# ─── Registration ─────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    """
    Register any user.  For technicians the wizard sends extra fields via
    multipart/form-data so we also create a TechnicianApplication document
    in MongoDB with all the rich profile data.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # ── Technician: save extra form data into MongoDB ──────────────────
        if user.role == 'technician':
            data = request.data

            # Save profile photo
            photo_url = ''
            if 'photo' in request.FILES:
                photo_url = _save_uploaded_file(request.FILES['photo'], 'profiles')

            # Save portfolio photos (multi-file field named 'portfolio_photos')
            portfolio_urls = []
            for pf in request.FILES.getlist('portfolio_photos'):
                portfolio_urls.append(_save_uploaded_file(pf, 'portfolio'))

            # Save documents (multi-file field named 'documents')
            doc_urls = []
            for df in request.FILES.getlist('documents'):
                doc_urls.append(_save_uploaded_file(df, 'documents'))

            TechnicianApplication(
                user_id        = user.id,
                first_name     = data.get('first_name', ''),
                last_name      = data.get('last_name', ''),
                email          = data.get('email', ''),
                phone          = data.get('phone', ''),
                whatsapp       = data.get('whatsapp', ''),
                dob            = data.get('dob', ''),
                gender         = data.get('gender', ''),
                city           = data.get('city', ''),
                address        = data.get('address', ''),
                cni            = data.get('cni_number', ''),
                service        = data.get('service', ''),
                custom_service = data.get('custom_service', ''),
                experience     = data.get('experience', ''),
                availability   = data.get('availability', ''),
                radius         = data.get('radius', ''),
                about          = data.get('about', ''),
                specializations = data.get('specializations', ''),
                photo_url      = photo_url,
                portfolio_urls = portfolio_urls,
                doc_urls       = doc_urls,
            ).save()

        headers = self.get_success_headers(serializer.data)
        return Response(
            UserSerializer(user, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


# ─── JWT Login ───────────────────────────────────────────────────────────────

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = self.initial_data.get("email")
        password = self.initial_data.get("password")

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid email or password")
            attrs["username"] = user.username   # map email → username internally

        return super().validate(attrs)


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class CustomTokenRefreshView(TokenRefreshView):
    pass


# ─── Current User Profile ─────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)


# ─── Admin: User CRUD ─────────────────────────────────────────────────────────

class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        users = User.objects.all().order_by('-date_joined')
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        if not _is_admin(request.user):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        serializer = RegisterSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request, pk):
        if not _is_admin(request.user):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        user = get_object_or_404(User, pk=pk)
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            if 'password' in request.data and request.data['password']:
                from django.contrib.auth.hashers import make_password
                user.password = make_password(request.data['password'])
            if 'profile_picture' in request.data and not request.data['profile_picture']:
                user.profile_picture = None
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not _is_admin(request.user):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        user = get_object_or_404(User, pk=pk)
        if user == request.user:
            return Response({"error": "Cannot delete your own admin account"}, status=status.HTTP_400_BAD_REQUEST)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Admin: Technician Applications ──────────────────────────────────────────

class AdminTechnicianListView(APIView):
    """
    GET /api/auth/admin/technicians/
    Returns all technician User records joined with their MongoDB application data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        techs = User.objects.filter(role='technician').order_by('-date_joined')
        result = []
        for tech in techs:
            # Try to pull the rich application document from MongoDB
            try:
                app = TechnicianApplication.objects.get(user_id=tech.id)
                app_data = {
                    "first_name": app.first_name,
                    "last_name": app.last_name,
                    "phone": app.phone,
                    "whatsapp": app.whatsapp,
                    "dob": app.dob,
                    "gender": app.gender,
                    "city": app.city,
                    "address": app.address,
                    "cni": app.cni,
                    "service": app.service,
                    "custom_service": app.custom_service,
                    "experience": app.experience,
                    "availability": app.availability,
                    "radius": app.radius,
                    "about": app.about,
                    "specializations": app.specializations,
                    "photo_url": app.photo_url,
                    "portfolio_urls": app.portfolio_urls,
                    "doc_urls": app.doc_urls,
                    "submitted_at": app.submitted_at.isoformat() if app.submitted_at else None,
                }
            except Exception:
                app_data = {}

            # Build absolute photo URL if stored as a relative MEDIA path
            photo = app_data.get('photo_url', '') or ''
            if photo and not photo.startswith('http') and request:
                photo = request.build_absolute_uri(photo)

            profile_pic_url = None
            if tech.profile_picture and hasattr(tech.profile_picture, 'url'):
                profile_pic_url = request.build_absolute_uri(tech.profile_picture.url)

            result.append({
                "id": tech.id,
                "username": tech.username,
                "email": tech.email,
                "specialty": tech.specialty,
                "cni_number": tech.cni_number,
                "approval_status": tech.approval_status,
                "has_paid": tech.has_paid,
                "is_active": tech.is_active,
                "date_joined": tech.date_joined.isoformat(),
                "profile_picture": profile_pic_url,
                "application": app_data,
            })

        return Response(result)


class AdminTechnicianApproveView(APIView):
    """
    PATCH /api/auth/admin/technicians/<pk>/approve/
    Sets approval_status = 'approved' and sends a notification to the technician.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not _is_admin(request.user):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        tech = get_object_or_404(User, pk=pk, role='technician')

        if tech.approval_status == 'approved':
            return Response({"detail": "Already approved."}, status=status.HTTP_200_OK)

        tech.approval_status = 'approved'
        tech.save()

        # Create a MongoDB notification for the technician
        Notification(
            recipient_id=tech.id,
            message=(
                "🎉 Congratulations! Your Materix technician application has been reviewed and approved. "
                "Please proceed to payment to activate your account and become visible to clients."
            ),
            notif_type='payment_required',
        ).save()

        return Response({"detail": "Technician approved and notified."}, status=status.HTTP_200_OK)


class AdminTechnicianRejectView(APIView):
    """
    PATCH /api/auth/admin/technicians/<pk>/reject/
    Sets approval_status = 'rejected' and notifies the technician.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if not _is_admin(request.user):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        tech = get_object_or_404(User, pk=pk, role='technician')
        reason = request.data.get('reason', 'Your application did not meet our current requirements.')

        tech.approval_status = 'rejected'
        tech.save()

        Notification(
            recipient_id=tech.id,
            message=(
                f"We're sorry — your Materix technician application has been reviewed and was not approved. "
                f"Reason: {reason}"
            ),
            notif_type='application_rejected',
        ).save()

        return Response({"detail": "Technician rejected and notified."}, status=status.HTTP_200_OK)


class CompletePaymentView(APIView):
    """
    POST /api/auth/complete-payment/
    Called after the technician completes the payment simulation.
    Sets has_paid = True → profile becomes visible on the portal.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != 'technician':
            return Response({"error": "Only technicians can complete payment."}, status=status.HTTP_403_FORBIDDEN)
        if user.approval_status != 'approved':
            return Response({"error": "Your account has not been approved yet."}, status=status.HTTP_403_FORBIDDEN)
        if user.has_paid:
            return Response({"detail": "Payment already completed."}, status=status.HTTP_200_OK)

        user.has_paid = True
        user.save()

        # Send confirmation notification
        Notification(
            recipient_id=user.id,
            message=(
                "✅ Payment received! Your account is now fully activated. "
                "Your profile is visible to clients on the Materix portal. Welcome aboard!"
            ),
            notif_type='account_activated',
        ).save()

        return Response({
            "detail": "Payment complete. Your profile is now live on the portal!",
            "has_paid": True,
        }, status=status.HTTP_200_OK)