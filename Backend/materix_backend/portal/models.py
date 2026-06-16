import datetime
import mongoengine

class ServiceRequest(mongoengine.Document):
    meta = {
        'collection': 'service_requests',
        'indexes': ['technician_id', 'client_id']
    }

    PREFERRED_CHOICES = [
        ('Call', 'Call'),
        ('WhatsApp', 'WhatsApp'),
        ('Email', 'Email'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    technician_id = mongoengine.IntField(required=True)
    technician_username = mongoengine.StringField()
    client_id = mongoengine.IntField(null=True)
    client_username = mongoengine.StringField(null=True)

    client_name = mongoengine.StringField(max_length=150, required=True)
    contact = mongoengine.StringField(max_length=150, required=True)
    preferred_method = mongoengine.StringField(max_length=20, choices=PREFERRED_CHOICES, required=True)
    message = mongoengine.StringField(required=True)
    location = mongoengine.StringField(max_length=255, blank=True, null=True)
    status = mongoengine.StringField(max_length=20, choices=STATUS_CHOICES, default='pending')

    created_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)

    def __str__(self):
        return f"Request → {self.technician_username} [{self.status}]"
