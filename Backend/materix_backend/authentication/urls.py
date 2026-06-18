from django.urls import path
from .views import (
    RegisterView,
    EmailTokenObtainPairView,
    CustomTokenRefreshView,
    get_user_profile,
    AdminUserListView,
    AdminUserDetailView,
    AdminTechnicianListView,
    AdminTechnicianApproveView,
    AdminTechnicianRejectView,
    CompletePaymentView,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path("register/",             RegisterView.as_view(),              name="register"),
    path("login/",                EmailTokenObtainPairView.as_view(),  name="login"),
    path("token/refresh/",        CustomTokenRefreshView.as_view(),    name="token_refresh"),
    path("profile/",              get_user_profile,                    name="profile"),

    # ── Admin: generic user CRUD ──────────────────────────────────────────────
    path("admin/users/",          AdminUserListView.as_view(),         name="admin_users"),
    path("admin/users/<int:pk>/", AdminUserDetailView.as_view(),       name="admin_user_detail"),

    # ── Admin: technician applications ────────────────────────────────────────
    path("admin/technicians/",                         AdminTechnicianListView.as_view(),    name="admin_technicians"),
    path("admin/technicians/<int:pk>/approve/",        AdminTechnicianApproveView.as_view(), name="admin_tech_approve"),
    path("admin/technicians/<int:pk>/reject/",         AdminTechnicianRejectView.as_view(),  name="admin_tech_reject"),

    # ── Technician payment completion ─────────────────────────────────────────
    path("complete-payment/",     CompletePaymentView.as_view(),       name="complete_payment"),
]