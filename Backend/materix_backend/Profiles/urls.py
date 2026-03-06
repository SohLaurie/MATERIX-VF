from django.urls import path
from .views import ProfileView, ProfileUpdateView

urlpatterns = [
    path("", ProfileView.as_view(), name="profile-detail"),
    path("update/", ProfileUpdateView.as_view(), name="profile-update"),
]