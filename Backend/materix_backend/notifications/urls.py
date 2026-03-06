from django.urls import path
from .views import MyNotificationsView, MarkAllReadView, DeleteNotificationView, ClearNotificationsView

urlpatterns = [
    path('my/', MyNotificationsView.as_view(), name='my-notifications'),
    path('mark-all-read/', MarkAllReadView.as_view(), name='mark-all-read'),
    path('<int:pk>/', DeleteNotificationView.as_view(), name='delete-notification'),
    path('clear/', ClearNotificationsView.as_view(), name='clear-notifications'),
]
