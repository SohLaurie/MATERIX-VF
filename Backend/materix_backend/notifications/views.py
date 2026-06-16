from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class MyNotificationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects(recipient_id=request.user.id).order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True, context={"request": request})
        return Response(serializer.data)


class MarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        Notification.objects(recipient_id=request.user.id, is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read"}, status=status.HTTP_200_OK)


class DeleteNotificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            notif = Notification.objects.get(id=pk, recipient_id=request.user.id)
            notif.delete()
            return Response({"detail": "Notification deleted"}, status=status.HTTP_204_NO_CONTENT)
        except Exception:
            return Response({"detail": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)


class ClearNotificationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        Notification.objects(recipient_id=request.user.id).delete()
        return Response({"detail": "All notifications cleared"}, status=status.HTTP_204_NO_CONTENT)
