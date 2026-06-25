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
    AdminTechnicianVerifyDocView,
    CompletePaymentView,
    Verify2FAView,
    AdminSettingsView,
    Resend2FAView,
    InitiatePaymentView,
    CheckPaymentStatusView,
    CamPayWebhookView,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path("register/",             RegisterView.as_view(),              name="register"),
    path("login/",                EmailTokenObtainPairView.as_view(),  name="login"),
    path("verify-2fa/",           Verify2FAView.as_view(),             name="verify_2fa"),
    path("resend-2fa/",           Resend2FAView.as_view(),             name="resend_2fa"),
    path("token/refresh/",        CustomTokenRefreshView.as_view(),    name="token_refresh"),
    path("profile/",              get_user_profile,                    name="profile"),
    path("admin/settings/",       AdminSettingsView.as_view(),         name="admin_settings"),

    # ── Admin: generic user CRUD ──────────────────────────────────────────────
    path("admin/users/",          AdminUserListView.as_view(),         name="admin_users"),
    path("admin/users/<int:pk>/", AdminUserDetailView.as_view(),       name="admin_user_detail"),

    # ── Admin: technician applications ────────────────────────────────────────
    path("admin/technicians/",                         AdminTechnicianListView.as_view(),    name="admin_technicians"),
    path("admin/technicians/<int:pk>/approve/",        AdminTechnicianApproveView.as_view(), name="admin_tech_approve"),
    path("admin/technicians/<int:pk>/reject/",         AdminTechnicianRejectView.as_view(),  name="admin_tech_reject"),
    path("admin/technicians/<int:pk>/verify-doc/",     AdminTechnicianVerifyDocView.as_view(), name="admin_tech_verify_doc"),

    # ── Technician payment completion ─────────────────────────────────────────
    path("complete-payment/",     CompletePaymentView.as_view(),       name="complete_payment"),

    # ── CamPay Payments ───────────────────────────────────────────────────────
    path("payments/initiate/",    InitiatePaymentView.as_view(),       name="initiate_payment"),
    path("payments/status/<str:transaction_id>/", CheckPaymentStatusView.as_view(), name="payment_status"),
    path("payments/webhook/",     CamPayWebhookView.as_view(),         name="payment_webhook"),
]