from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import User
from django.contrib.auth import authenticate


# Registration serializer
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'role',
            'specialty', 'address', 'cni_number', 'profile_picture',
        ]

    def validate(self, data):
        # Enforce technician-specific fields (address/cni are stored in MongoDB application doc)
        if data.get('role') == 'technician':
            if not data.get('specialty') and not data.get('cni_number'):
                # These are passed from the final wizard step payload; soft validation
                pass
        return data

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)


# Full user serializer (for profile responses, admin views)
class UserSerializer(serializers.ModelSerializer):
    specialty = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'specialty',
            'address', 'cni_number', 'is_active', 'date_joined',
            'profile_picture', 'approval_status', 'has_paid',
        ]

    def get_specialty(self, obj):
        if obj.role == 'technician':
            try:
                from authentication.tech_application_model import TechnicianApplication
                app = TechnicianApplication.objects.filter(user_id=obj.id).first()
                if app:
                    if app.service == 'other' and app.custom_service:
                        return app.custom_service
                    return app.service or obj.specialty
            except Exception:
                pass
        return obj.specialty


# Serializer for email-based login
class EmailTokenObtainPairSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid email or password")
            attrs["user"] = user
        else:
            raise serializers.ValidationError("Both email and password are required")
        return attrs