from rest_framework import serializers
from authentication.models import User

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'profile_picture', 'role', 'address', 'specialty', 'cni_number']
        extra_kwargs = {
            'email': {'required': True},
            'username': {'required': True},
        }
