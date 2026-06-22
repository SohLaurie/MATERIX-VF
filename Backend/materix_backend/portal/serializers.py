# portal/serializers.py
from rest_framework import serializers
from authentication.models import User
from .models import ServiceRequest

class TechnicianPublicSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    location = serializers.CharField(source='address', allow_null=True)
    available = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    
    # Extra fields from MongoDB application document
    category = serializers.SerializerMethodField()
    about = serializers.SerializerMethodField()
    experience = serializers.SerializerMethodField()
    hourlyRate = serializers.SerializerMethodField()
    portfolio = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    specializations = serializers.SerializerMethodField()
    radius = serializers.SerializerMethodField()
    service = serializers.SerializerMethodField()
    custom_service = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'name', 'specialty', 'location', 'available', 'rating', 'image',
            'category', 'about', 'experience', 'hourlyRate', 'portfolio', 'reviews',
            'specializations', 'radius', 'service', 'custom_service'
        ]

    def _get_app(self, obj):
        if not hasattr(obj, '_cached_app'):
            try:
                from authentication.tech_application_model import TechnicianApplication
                obj._cached_app = TechnicianApplication.objects.filter(user_id=obj.id).first()
            except Exception:
                obj._cached_app = None
        return obj._cached_app

    def get_name(self, obj):
        app = self._get_app(obj)
        if app and app.first_name:
            return f"{app.first_name} {app.last_name}".strip()
        return obj.username

    def get_available(self, obj):
        return bool(obj.is_active and not obj.is_suspended)

    def get_rating(self, obj):
        return float(obj.rating) if obj.rating else 4.5

    def get_image(self, obj):
        request = self.context.get('request')
        # Check User profile_picture first (existential image)
        if obj.profile_picture and hasattr(obj.profile_picture, 'url'):
            url = obj.profile_picture.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        
        # Fallback to app.photo_url
        app = self._get_app(obj)
        if app and app.photo_url:
            url = app.photo_url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None

    def get_category(self, obj):
        app = self._get_app(obj)
        if app and app.service:
            return app.service
        return obj.specialty or 'electrician'

    def get_about(self, obj):
        app = self._get_app(obj)
        if app and app.about:
            return app.about
        return "No description provided."

    def get_experience(self, obj):
        app = self._get_app(obj)
        if app and app.experience:
            return f"{app.experience} yrs" if app.experience.isdigit() else app.experience
        return "5 yrs"

    def get_hourlyRate(self, obj):
        app = self._get_app(obj)
        if app and app.service:
            rates = {
                'electrician': "$45/hr",
                'plumber': "$38/hr",
                'carpenter': "$42/hr",
                'mason': "$35/hr"
            }
            return rates.get(app.service.lower(), "$35/hr")
        return "$35/hr"

    def get_portfolio(self, obj):
        app = self._get_app(obj)
        if app and app.portfolio_urls:
            request = self.context.get('request')
            result = []
            for url in app.portfolio_urls:
                if request is not None:
                    result.append({"url": request.build_absolute_uri(url), "caption": "Portfolio work"})
                else:
                    result.append({"url": url, "caption": "Portfolio work"})
            return result
        return []

    def get_reviews(self, obj):
        return int(obj.id) * 7 + 12

    def get_specializations(self, obj):
        app = self._get_app(obj)
        if app and app.specializations:
            return app.specializations
        return obj.specialty or ""

    def get_radius(self, obj):
        app = self._get_app(obj)
        if app and app.radius:
            return app.radius
        return ""

    def get_service(self, obj):
        app = self._get_app(obj)
        if app and app.service:
            return app.service
        return obj.specialty or ""

    def get_custom_service(self, obj):
        app = self._get_app(obj)
        if app and app.custom_service:
            return app.custom_service
        return ""



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
            
        tech_id = validated_data.pop('technician_id', None)
        passed_client_id = validated_data.pop('client_id', None)
        if passed_client_id:
            client_id = passed_client_id

        try:
            tech = User.objects.get(id=tech_id, role='technician')
            tech_username = tech.username
        except Exception:
            raise serializers.ValidationError({"technician_id": "Invalid technician ID"})

        # Map lowercase preferred method choices from the frontend to choices expected by MongoEngine model
        pref = validated_data.get('preferred_method', 'Call')
        mapping = {
            'phone': 'Call',
            'call': 'Call',
            'whatsapp': 'WhatsApp',
            'email': 'Email',
        }
        validated_data['preferred_method'] = mapping.get(pref.lower(), pref)

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
