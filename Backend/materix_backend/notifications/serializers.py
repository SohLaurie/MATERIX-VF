from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    recipient = serializers.IntegerField(source='recipient_id', read_only=True)
    request_id = serializers.CharField(read_only=True)
    message = serializers.CharField(read_only=True)
    is_read = serializers.BooleanField(default=False)
    created_at = serializers.DateTimeField(read_only=True)
