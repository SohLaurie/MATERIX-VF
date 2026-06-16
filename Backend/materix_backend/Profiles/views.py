from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializers import ProfileSerializer
from rest_framework.parsers import MultiPartParser, FormParser

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)


class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request):
        user = request.user
        data = request.data.copy() if hasattr(request.data, 'copy') else request.data

        # Check for password update
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        if new_password:
            if user.role != 'admin':
                if not current_password:
                    return Response({"current_password": ["Current password is required to change password."]}, status=status.HTTP_400_BAD_REQUEST)
                if not user.check_password(current_password):
                    return Response({"current_password": ["Invalid current password."]}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()

        # Handle CNI modification check
        new_cni = request.data.get('cni_number')
        if new_cni is not None and new_cni != (user.cni_number or ''):
            if user.role != 'admin':
                return Response({"cni_number": ["CNI Number cannot be modified by non-admin users."]}, status=status.HTTP_403_FORBIDDEN)

        # Handle profile picture deletion
        if 'profile_picture' in request.data and not request.data['profile_picture']:
            user.profile_picture = None
            user.save()
            if hasattr(data, 'pop'):
                data.pop('profile_picture', None)
            else:
                data = {k: v for k, v in data.items() if k != 'profile_picture'}

        serializer = ProfileSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
