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
            'id',
            'username',
            'email',
            'password',
            'role',
            'specialty',
            'address',
            'cni_number',
        ]

    def validate(self, data):
        # All clients and technicians must have an address
        if not data.get('address'):
            raise serializers.ValidationError("Address is required.")
        # Enforce technician-specific fields
        if data['role'] == 'technician':
            if not data.get('specialty') or not data.get('cni_number'):
                raise serializers.ValidationError(
                    "Technician must provide specialty and CNI number."
                )
        return data

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)


# Serializer to return user info (for profile or responses)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'role',
            'specialty',
            'address',
            'cni_number',
            'is_active',
            'date_joined',
            'profile_picture',
        ]


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