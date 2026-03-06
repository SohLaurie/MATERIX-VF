# portal/models.py
from django.db import models
from django.conf import settings

# We reuse your custom user model from the authentication app
# settings.AUTH_USER_MODEL == 'authentication.User'

class ServiceRequest(models.Model):
    # Who is being contacted (must be a technician)
    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='service_requests_received'
    )
    # Who is requesting (optional for unauthenticated users; if logged in we fill automatically)
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='service_requests_made'
    )

    # Snapshot fields coming from the contact form (kept even if user later changes profile)
    client_name = models.CharField(max_length=150)           # "Your Name" from form
    contact = models.CharField(max_length=150)               # email or phone
    PREFERRED_CHOICES = [
        ('Call', 'Call'),
        ('WhatsApp', 'WhatsApp'),
        ('Email', 'Email'),
    ]
    preferred_method = models.CharField(max_length=20, choices=PREFERRED_CHOICES)
    message = models.TextField()
    location = models.CharField(max_length=255, blank=True, null=True)

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)     # ReqDate (when request was sent)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        tech = getattr(self.technician, "username", "tech")
        return f"Request → {tech} [{self.status}]"
