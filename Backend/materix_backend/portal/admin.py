# portal/admin.py
from django.contrib import admin
from .models import ServiceRequest

@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "technician", "client", "client_name", "preferred_method", "status", "created_at")
    list_filter = ("status", "preferred_method", "created_at")
    search_fields = ("client_name", "contact", "message", "technician__username", "client__username")
