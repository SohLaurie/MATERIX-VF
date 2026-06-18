import datetime
import mongoengine


class Notification(mongoengine.Document):
    meta = {
        'collection': 'notifications',
        'indexes': ['recipient_id'],
    }

    NOTIF_TYPE_CHOICES = (
        'general',
        'payment_required',
        'application_rejected',
        'account_activated',
        'new_request',
    )

    recipient_id = mongoengine.IntField(required=True)
    request_id   = mongoengine.StringField(default='')
    message      = mongoengine.StringField(required=True)
    notif_type   = mongoengine.StringField(default='general')  # drives special UI in frontend
    is_read      = mongoengine.BooleanField(default=False)
    created_at   = mongoengine.DateTimeField(default=datetime.datetime.utcnow)

    def __str__(self):
        return f"Notification [{self.notif_type}] to #{self.recipient_id}: {self.message[:30]}"
