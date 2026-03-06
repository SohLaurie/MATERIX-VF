from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User

@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    model = User

    # Custom method to render profile picture thumbnail
    def profile_picture_thumbnail(self, obj):
        if obj.profile_picture and hasattr(obj.profile_picture, 'url'):  
            return format_html(
                '<img src="{}" width="50" height="50" style="border-radius:50%; object-fit:cover;" />',
                obj.profile_picture.url
            )
        return "No Image"
    profile_picture_thumbnail.short_description = 'Profile Picture'

    # ✅ Show technician-specific fields too
    list_display = (
        "email",
        "username",
        "role",
        "specialty",     # ✅ Technician field
        "address",       # ✅ Location field
        "cni_number",    # ✅ Technician ID
        "is_staff",
        "is_active",
        "is_suspended",
        "date_joined",
        "profile_picture_thumbnail",
    )

    list_filter = ("role", "is_staff", "is_active", "is_suspended")
    readonly_fields = ("date_joined", "profile_picture_thumbnail")

    # ✅ Group fields properly in detail view
    fieldsets = (
        (None, {
            "fields": (
                "email",
                "password",
                "username",
                "role",
                "specialty",   # ✅ Add
                "address",     # ✅ Add
                "cni_number",  # ✅ Add
                "availability", # ✅ Add
                "rating",       # ✅ Add
                "profile_picture",
                "profile_picture_thumbnail",
            )
        }),
        ("Permissions", {
            "fields": (
                "is_staff",
                "is_active",
                "is_suspended",
                "groups",
                "user_permissions",
            )
        }),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "email",
                "password1",
                "password2",
                "username",
                "role",
                "specialty",   # ✅ Add
                "address",     # ✅ Add
                "cni_number",  # ✅ Add
                "availability",     # ✅ show availability
                "rating",    # ✅ show rating
                "profile_picture",
                "is_staff",
                "is_active",
                "is_suspended",
            ),
        }),
    )

    search_fields = ("email", "username", "specialty", "address")
    ordering = ("email",)
