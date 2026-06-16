# portal/serializers.py
from rest_framework import serializers
from authentication.models import User
from .models import ServiceRequest

class TechnicianPublicSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='username')
    location = serializers.CharField(source='address', allow_null=True)
    available = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'specialty', 'location', 'available', 'rating', 'image']

    def get_available(self, obj):
        return bool(obj.is_active and not obj.is_suspended)

    def get_rating(self, obj):
        return None

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and hasattr(obj.profile_picture, 'url'):
            url = obj.profile_picture.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None


class ServiceRequestSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    technician_id = serializers.IntegerField()
    client_id = serializers.IntegerField(required=False, allow_null=True)
    client_name = serializers.CharField(max_length=150)
    contact = serializers.CharField(max_length=150)
    preferred_method = serializers.CharField(max_length=20)
    message = serializers.CharField()
    location = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    status = serializers.CharField(default='pending')
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        request = self.context.get('request')
        client_id = None
        client_username = None
        if request and request.user and request.user.is_authenticated:
            client_id = request.user.id
            client_username = request.user.username
            
        tech_id = validated_data.get('technician_id')
        try:
            tech = User.objects.get(id=tech_id, role='technician')
            tech_username = tech.username
        except Exception:
            raise serializers.ValidationError({"technician_id": "Invalid technician ID"})

        sr = ServiceRequest(
            technician_id=tech_id,
            technician_username=tech_username,
            client_id=client_id,
            client_username=client_username,
            **validated_data
        )
        sr.save()
        return sr

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        return {
            'id': str(instance.id),
            'technician_id': instance.technician_id,
            'client_id': instance.client_id,
            'client_name': instance.client_name,
            'contact': instance.contact,
            'preferred_method': instance.preferred_method,
            'message': instance.message,
            'location': instance.location,
            'status': instance.status,
            'created_at': instance.created_at,
            'updated_at': instance.updated_at,
            'technician': {
                'id': instance.technician_id,
                'username': instance.technician_username or "Technician",
            },
            'client': {
                'id': instance.client_id,
                'username': instance.client_username or "Client",
            } if instance.client_id else None
        }
