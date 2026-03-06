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


class ServiceRequestSerializer(serializers.ModelSerializer):
    technician_id = serializers.PrimaryKeyRelatedField(
        source='technician',
        queryset=User.objects.filter(role='technician'),
        write_only=True,
        required=False
    )
    client_id = serializers.PrimaryKeyRelatedField(
        source='client',
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = ServiceRequest
        fields = [
            'id',
            'technician_id', 'client_id',
            'client_name', 'contact', 'preferred_method',
            'message', 'location',
            'status',   # <-- writable for PATCH
            'created_at', 'updated_at',
            'technician', 'client',
        ]
        read_only_fields = ['created_at', 'updated_at', 'technician', 'client']
        extra_kwargs = {
            'technician_id': {'required': False},
            'client_id': {'required': False},
            'status': {'required': False},
        }

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data.setdefault('client', request.user)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Allow partial updates (PATCH) without requiring unrelated fields.
        """
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['technician'] = {
            'id': instance.technician_id,
            'username': instance.technician.username,
            'email': instance.technician.email,
            'specialty': instance.technician.specialty,
        }
        data['client'] = None
        if instance.client:
            data['client'] = {
                'id': instance.client_id,
                'username': instance.client.username,
                'email': instance.client.email,
            }
        return data
