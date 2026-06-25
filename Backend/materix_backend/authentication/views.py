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
import requests
from django.conf import settings
from rest_framework import generics, permissions, serializers, status
from .models import User, SystemSetting, PaymentTransaction
from .serializers import RegisterSerializer, UserSerializer
from .tech_application_model import TechnicianApplication
from notifications.models import Notification
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
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


def send_2fa_email(user, code):
    from django.core.mail import get_connection, EmailMultiAlternatives
    
    # ALWAYS print 2FA code to server console for testing/debugging
    print(f"[2FA] [DEBUG] 2FA Verification Code for {user.email} is: {code}")
    
    smtp_host_setting = SystemSetting.objects.filter(key="smtp_host").first()
    smtp_port_setting = SystemSetting.objects.filter(key="smtp_port").first()
    smtp_user_setting = SystemSetting.objects.filter(key="smtp_user").first()
    smtp_pass_setting = SystemSetting.objects.filter(key="smtp_pass").first()
    smtp_from_setting = SystemSetting.objects.filter(key="smtp_from").first()
    
    host = smtp_host_setting.value if smtp_host_setting else ""
    port = smtp_port_setting.value if smtp_port_setting else ""
    user_email = smtp_user_setting.value if smtp_user_setting else ""
    password = smtp_pass_setting.value if smtp_pass_setting else ""
    from_addr = smtp_from_setting.value if smtp_from_setting else "MATERIX Security <security@materix.com>"
    
    subject = "Your 2FA Login Verification Code"
    text_message = f"Hello,\n\nYour login verification code is: {code}\n\nThis code will expire in 5 minutes."
    
    # Build the 6 separate digit blocks dynamically
    digit_blocks_html = "".join([
        f'<div class="digit-box">{d}</div>' for d in code
    ])
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account</title>
        <style>
            body {{
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #edf2f7;
                margin: 0;
                padding: 40px 10px;
                -webkit-font-smoothing: antialiased;
            }}
            .container {{
                width: 100%;
                max-width: 520px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 24px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0;
            }}
            .header {{
                background-color: #0f172a;
                padding: 24px 30px;
                overflow: hidden;
            }}
            .logo {{
                float: left;
                font-size: 22px;
                font-weight: 900;
                color: #ffc700;
                letter-spacing: 1.5px;
                font-family: 'Segoe UI', Arial, sans-serif;
            }}
            .no-reply {{
                float: right;
                font-size: 13px;
                color: #94a3b8;
                margin-top: 6px;
            }}
            .content {{
                padding: 45px 35px 35px 35px;
                text-align: center;
                color: #334155;
            }}
            .icon-container {{
                width: 64px;
                height: 64px;
                border-radius: 16px;
                background-color: #fff5eb;
                margin: 0 auto 24px auto;
                text-align: center;
            }}
            .title {{
                font-size: 24px;
                font-weight: 800;
                color: #0f172a;
                margin: 0 0 12px 0;
                letter-spacing: -0.5px;
            }}
            .intro-text {{
                font-size: 14px;
                color: #475569;
                line-height: 1.6;
                margin: 0 0 25px 0;
            }}
            .highlight {{
                color: #ff8000;
                font-weight: 700;
            }}
            .divider {{
                height: 1px;
                background-color: #f1f5f9;
                margin: 25px 0;
            }}
            .section-header {{
                font-size: 11px;
                font-weight: 800;
                color: #94a3b8;
                letter-spacing: 1.5px;
                text-transform: uppercase;
                margin-bottom: 20px;
            }}
            .digit-container {{
                text-align: center;
                margin-bottom: 20px;
            }}
            .digit-box {{
                display: inline-block;
                width: 44px;
                height: 52px;
                line-height: 52px;
                text-align: center;
                background-color: #0f172a;
                border-radius: 12px;
                font-size: 26px;
                font-weight: 800;
                color: #ffc700;
                margin: 0 4px;
                font-family: 'Segoe UI', Arial, sans-serif;
            }}
            .expiry-warning {{
                font-size: 13px;
                color: #94a3b8;
                margin-top: 15px;
                display: inline-block;
            }}
            .expiry-warning-red {{
                color: #ef4444;
                font-weight: 700;
            }}
            .info-box {{
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 20px;
                text-align: left;
                margin-top: 35px;
                font-size: 13px;
                color: #475569;
                line-height: 1.5;
            }}
            .footer {{
                background-color: #0f172a;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #1e293b;
            }}
            .footer-logo {{
                font-size: 16px;
                font-weight: 800;
                color: #ffc700;
                letter-spacing: 1px;
                margin-bottom: 6px;
                display: block;
            }}
            .footer-link {{
                font-size: 12px;
                color: #94a3b8;
                display: block;
                margin-bottom: 15px;
            }}
            .footer-copyright {{
                font-size: 11px;
                color: #64748b;
                margin: 0;
            }}

            /* Responsive styles for mobile devices */
            @media only screen and (max-width: 480px) {{
                body {{
                    padding: 10px 5px !important;
                }}
                .container {{
                    border-radius: 16px !important;
                }}
                .header {{
                    padding: 16px 20px !important;
                }}
                .logo {{
                    font-size: 18px !important;
                }}
                .no-reply {{
                    font-size: 11px !important;
                    margin-top: 4px !important;
                }}
                .content {{
                    padding: 30px 15px !important;
                }}
                .digit-box {{
                    width: 36px !important;
                    height: 44px !important;
                    line-height: 44px !important;
                    font-size: 20px !important;
                    margin: 0 2px !important;
                    border-radius: 8px !important;
                }}
                .title {{
                    font-size: 20px !important;
                }}
                .intro-text {{
                    font-size: 13px !important;
                }}
                .info-box {{
                    padding: 15px !important;
                    font-size: 12px !important;
                    margin-top: 25px !important;
                }}
                .footer {{
                    padding: 20px !important;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">MATERIX</div>
                <div class="no-reply">No-Reply - noreply@materix.com</div>
            </div>
            <div class="content">
                <div class="icon-container">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" height="100%">
                        <tr>
                            <td align="center" valign="middle" style="height: 64px; vertical-align: middle;">
                                <span style="font-size: 30px; line-height: 64px; color: #ff8000; display: block; margin: 0 auto;">✉️</span>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <h1 class="title">Verify Your Account</h1>
                
                <p class="intro-text">
                    Use the code below to complete your login verification on <span class="highlight">Materix</span>. It expires in <strong>5 minutes</strong>.
                </p>
                
                <div class="divider"></div>
                
                <div class="section-header">Your Verification Code</div>
                
                <div class="digit-container">
                    {digit_blocks_html}
                </div>
                
                <div class="expiry-warning">
                    <span style="font-size: 14px; vertical-align: middle; margin-right: 4px; display: inline-block;">⚠️</span>
                    <span class="expiry-warning-red">Expires in 5 minutes</span> - Do not share this code with anyone.
                </div>
                
                <div class="info-box">
                    If you did not request this verification, please ignore this email. Your account security is important to us. Never share this code with anyone claiming to be from Materix.
                </div>
            </div>
            <div class="footer">
                <span class="footer-logo">MATERIX</span>
                <span class="footer-link">Safety First - www.materix.com</span>
                <p class="footer-copyright">
                    © 2026 Materix. All rights reserved. - This is an automated message.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    if host and port and user_email and password:
        try:
            connection = get_connection(
                backend='django.core.mail.backends.smtp.EmailBackend',
                host=host,
                port=int(port),
                username=user_email,
                password=password,
                use_tls=True,
            )
            email_msg = EmailMultiAlternatives(
                subject=subject,
                body=text_message,
                from_email=from_addr,
                to=[user.email],
                connection=connection
            )
            email_msg.attach_alternative(html_message, "text/html")
            email_msg.send()
            print(f"2FA Code {code} successfully sent via custom SMTP HTML template to {user.email}")
            return True
        except Exception as e:
            print(f"Failed to send 2FA email via custom SMTP: {e}. Falling back to default mail.")
            
    try:
        email_msg = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=from_addr,
            to=[user.email],
        )
        email_msg.attach_alternative(html_message, "text/html")
        email_msg.send()
        print(f"2FA Code {code} successfully sent via default email backend HTML template to {user.email}")
        return True
    except Exception as e:
        print(f"Failed to send 2FA email via default backend: {e}. fallback code was: {code}")
        return False


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        password = request.data.get("password")
        
        if not email or not password:
            return Response({"detail": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        user = authenticate(username=email, password=password)
        if not user:
            return Response({"detail": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not user.is_active:
            return Response({"detail": "User account is disabled"}, status=status.HTTP_403_FORBIDDEN)
            
        if user.is_suspended:
            return Response({"detail": "User account is suspended"}, status=status.HTTP_403_FORBIDDEN)

        global_2fa = SystemSetting.objects.filter(key="global_2fa_enabled").first()
        global_2fa_enabled = (global_2fa.value == "true") if global_2fa else False

        if global_2fa_enabled or getattr(user, 'two_fa_enabled', False):
            import random
            from django.utils import timezone
            
            code = f"{random.randint(100000, 999999)}"
            user.two_factor_code = code
            user.two_factor_code_created_at = timezone.now()
            user.save()
            
            send_2fa_email(user, code)
            
            return Response({
                "require_2fa": True,
                "email": user.email,
                "message": "Verification code has been sent to your email."
            }, status=status.HTTP_200_OK)
            
        return super().post(request, *args, **kwargs)


class Verify2FAView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        code = request.data.get("code")
        
        if not email or not code:
            return Response({"detail": "Email and code are required"}, status=status.HTTP_400_BAD_REQUEST)
            
        user = get_object_or_404(User, email=email)
        
        if not user.is_active:
            return Response({"detail": "User account is disabled"}, status=status.HTTP_403_FORBIDDEN)
            
        if user.is_suspended:
            return Response({"detail": "User account is suspended"}, status=status.HTTP_403_FORBIDDEN)
            
        if not user.two_factor_code or user.two_factor_code != code:
            return Response({"detail": "Invalid verification code"}, status=status.HTTP_400_BAD_REQUEST)
            
        from django.utils import timezone
        from datetime import timedelta
        
        if user.two_factor_code_created_at:
            elapsed = timezone.now() - user.two_factor_code_created_at
            if elapsed > timedelta(minutes=5):
                return Response({"detail": "Verification code has expired"}, status=status.HTTP_400_BAD_REQUEST)
                
        user.two_factor_code = None
        user.two_factor_code_created_at = None
        user.save()
        
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "username": user.username,
            "role": user.role,
        }, status=status.HTTP_200_OK)


class Resend2FAView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        global_2fa = SystemSetting.objects.filter(key="global_2fa_enabled").first()
        global_2fa_enabled = (global_2fa.value == "true") if global_2fa else False
        
        if not (global_2fa_enabled or getattr(user, 'two_fa_enabled', False)):
            return Response({"detail": "2FA is not enabled for this user"}, status=status.HTTP_400_BAD_REQUEST)
            
        import random
        from django.utils import timezone
        
        code = f"{random.randint(100000, 999999)}"
        user.two_factor_code = code
        user.two_factor_code_created_at = timezone.now()
        user.save()
        
        send_2fa_email(user, code)
        return Response({"message": "Verification code has been resent to your email."}, status=status.HTTP_200_OK)


class AdminSettingsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        settings_keys = ["global_2fa_enabled", "smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "campay_username", "campay_password", "campay_mode"]
        data = {}
        for key in settings_keys:
            setting = SystemSetting.objects.filter(key=key).first()
            if key == "global_2fa_enabled":
                data[key] = (setting.value == "true") if setting else False
            elif key == "campay_mode":
                data[key] = setting.value if setting else "sandbox"
            else:
                data[key] = setting.value if setting else ""
                
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        if not _is_admin(request.user):
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        for key, val in request.data.items():
            if key == "global_2fa_enabled":
                db_val = "true" if val else "false"
            else:
                db_val = str(val) if val is not None else ""
                
            SystemSetting.objects.update_or_create(key=key, defaults={"value": db_val})
            
        return Response({"message": "Settings updated successfully"}, status=status.HTTP_200_OK)


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
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

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


# ─── CamPay Payment Integration Views ───────────────────────────────────────

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

def get_campay_token_and_url():
    """
    Get CamPay API authentication token.
    If credentials are missing or call fails, returns (None, base_url).
    """
    username_setting = SystemSetting.objects.filter(key="campay_username").first()
    password_setting = SystemSetting.objects.filter(key="campay_password").first()
    mode_setting = SystemSetting.objects.filter(key="campay_mode").first()

    username = username_setting.value if username_setting else ""
    password = password_setting.value if password_setting else ""
    mode = mode_setting.value if mode_setting else "sandbox"

    base_url = "https://demo.campay.net" if mode == "sandbox" else "https://www.campay.net"

    if not username or not password:
        return None, base_url

    try:
        url = f"{base_url}/api/token/"
        r = requests.post(url, json={"username": username, "password": password}, timeout=10)
        r.raise_for_status()
        token = r.json().get("token")
        return token, base_url
    except Exception as e:
        print(f"[CamPay] Token generation failed: {e}")
        return None, base_url


def process_successful_payment(transaction):
    """
    Process database side-effects of a successful payment.
    """
    if transaction.status == 'success':
        return

    transaction.status = 'success'
    transaction.save()

    if transaction.transaction_type == 'subscription':
        user = transaction.user
        if user:
            user.has_paid = True
            user.save()
            
            # Send Notification
            Notification(
                recipient_id=user.id,
                message=(
                    "✅ Payment received! Your account is now fully activated. "
                    "Your profile is visible to clients on the Materix portal. Welcome aboard!"
                ),
                notif_type='account_activated',
            ).save()
            print(f"[Payment] Technician {user.email} successfully activated via subscription payment.")

    elif transaction.transaction_type == 'order':
        from shop.models import Order
        try:
            order = Order.objects.get(id=transaction.order_id)
            order.transaction_id = transaction.transaction_id
            order.save()
            print(f"[Payment] MongoDB Order {transaction.order_id} marked as paid.")
        except Exception as e:
            print(f"[Payment] Failed to find or update order {transaction.order_id} in MongoDB: {e}")


class InitiatePaymentView(APIView):
    """
    POST /api/payments/initiate/
    Initiates payment via CamPay.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request):
        phone_number = request.data.get("phone_number")
        amount = request.data.get("amount")
        payment_type = request.data.get("payment_type") # 'order' or 'subscription'
        order_id = request.data.get("order_id") # MongoDB order ID string (optional)

        if not phone_number or not amount or not payment_type:
            return Response({"error": "phone_number, amount, and payment_type are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Standard Cameroon phone format cleanup if needed (e.g. ensure 237 prefix)
        clean_phone = str(phone_number).strip().replace("+", "")
        if not clean_phone.startswith("237") and len(clean_phone) == 9:
            clean_phone = "237" + clean_phone

        transaction_id = uuid.uuid4().hex

        # Fetch CamPay config and credentials
        token, base_url = get_campay_token_and_url()

        campay_reference = None
        is_mock = (token is None)

        if not is_mock:
            # Call CamPay /api/collect/
            try:
                headers = {
                    "Authorization": f"Token {token}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "amount": str(amount),
                    "currency": "XAF",
                    "from": clean_phone,
                    "description": f"MATERIX {payment_type.capitalize()} payment - {transaction_id}",
                    "external_reference": transaction_id
                }
                r = requests.post(f"{base_url}/api/collect/", json=payload, headers=headers, timeout=12)
                r.raise_for_status()
                data = r.json()
                campay_reference = data.get("reference")
            except Exception as e:
                print(f"[CamPay] Collection failed: {e}. Falling back to simulation mode.")
                is_mock = True

        if is_mock:
            # Mock mode
            campay_reference = f"mock_{uuid.uuid4().hex}"

        # Save local PaymentTransaction record
        transaction = PaymentTransaction.objects.create(
            transaction_id=transaction_id,
            campay_reference=campay_reference,
            transaction_type=payment_type,
            amount=amount,
            phone_number=clean_phone,
            user=request.user,
            order_id=order_id if payment_type == 'order' else None,
            status='pending'
        )

        # If order payment, link transaction ID to MongoDB order document
        if payment_type == 'order' and order_id:
            from shop.models import Order
            try:
                order = Order.objects.get(id=order_id)
                order.transaction_id = transaction_id
                order.save()
            except Exception as e:
                print(f"[Payment] Failed to link transaction to order {order_id} in MongoDB: {e}")

        return Response({
            "transaction_id": transaction_id,
            "campay_reference": campay_reference,
            "is_mock": is_mock,
            "message": "Payment initiated successfully."
        }, status=status.HTTP_201_CREATED)


class CheckPaymentStatusView(APIView):
    """
    GET /api/payments/status/<transaction_id>/
    Check status of local payment, poll CamPay if still pending.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, transaction_id):
        try:
            transaction = PaymentTransaction.objects.get(transaction_id=transaction_id)
        except PaymentTransaction.DoesNotExist:
            return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)

        if transaction.status != 'pending':
            return Response({
                "status": transaction.status,
                "transaction_type": transaction.transaction_type
            }, status=status.HTTP_200_OK)

        # If it's a simulated payment
        if transaction.campay_reference and transaction.campay_reference.startswith("mock_"):
            # Simulate payment confirmation after 4 seconds
            from django.utils import timezone
            elapsed = (timezone.now() - transaction.created_at).total_seconds()
            if elapsed >= 4:
                # If the phone number ends with "0000" or matches the mock failure number, simulate a failure
                if transaction.phone_number == "237670000000" or transaction.phone_number.endswith("0000"):
                    transaction.status = 'failed'
                    transaction.save()
                    print(f"[Payment] Simulated failure for number {transaction.phone_number}")
                else:
                    process_successful_payment(transaction)
            return Response({
                "status": transaction.status,
                "transaction_type": transaction.transaction_type,
                "is_mock": True
            }, status=status.HTTP_200_OK)

        # If it's a real CamPay payment, query status directly
        token, base_url = get_campay_token_and_url()
        if token:
            try:
                headers = {"Authorization": f"Token {token}"}
                r = requests.get(f"{base_url}/api/transaction/{transaction.campay_reference}/", headers=headers, timeout=10)
                r.raise_for_status()
                data = r.json()
                campay_status = data.get("status") # 'SUCCESSFUL', 'FAILED', or 'PENDING'
                
                if campay_status == 'SUCCESSFUL':
                    process_successful_payment(transaction)
                elif campay_status == 'FAILED':
                    transaction.status = 'failed'
                    transaction.save()
            except Exception as e:
                print(f"[CamPay] Status check failed: {e}")

        return Response({
            "status": transaction.status,
            "transaction_type": transaction.transaction_type
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class CamPayWebhookView(APIView):
    """
    POST /api/payments/webhook/
    Callback endpoint for CamPay to notify us about transaction changes.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        external_reference = data.get("external_reference")
        campay_status = data.get("status") # 'SUCCESSFUL' or 'FAILED'

        if not external_reference:
            return Response({"error": "external_reference is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            transaction = PaymentTransaction.objects.get(transaction_id=external_reference)
            if campay_status == 'SUCCESSFUL':
                process_successful_payment(transaction)
            elif campay_status == 'FAILED':
                transaction.status = 'failed'
                transaction.save()
            return Response({"status": "processed"}, status=status.HTTP_200_OK)
        except PaymentTransaction.DoesNotExist:
            print(f"[Webhook] Transaction {external_reference} not found in database.")
            return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)