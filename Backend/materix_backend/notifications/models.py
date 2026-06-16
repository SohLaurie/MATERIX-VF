import datetime
import mongoengine

class Notification(mongoengine.Document):
    meta = {
        'collection': 'notifications',
        'indexes': ['recipient_id']
    }

    recipient_id = mongoengine.IntField(required=True)
    request_id = mongoengine.StringField(blank=True, null=True)
    message = mongoengine.StringField(required=True)
    is_read = mongoengine.BooleanField(default=False)
    created_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)

    def __str__(self):
        return f"Notification to recipient #{self.recipient_id}: {self.message[:20]}"
