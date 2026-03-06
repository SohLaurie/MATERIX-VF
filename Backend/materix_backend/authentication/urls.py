from django.urls import path
from .views import (
    RegisterView,
    EmailTokenObtainPairView,
    CustomTokenRefreshView,
    get_user_profile,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", EmailTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", get_user_profile, name="profile"),
]