from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    request_id = serializers.IntegerField(source='request.id', read_only=True)
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'request_id', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'recipient', 'request_id', 'created_at']
