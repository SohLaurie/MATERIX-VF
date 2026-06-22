import datetime
import mongoengine
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import User

class MongoUser(mongoengine.Document):
    meta = {
        'collection': 'users',
        'indexes': ['sqlite_id', 'username', 'email']
    }

    sqlite_id       = mongoengine.IntField(required=True, unique=True)
    username        = mongoengine.StringField(required=True)
    email           = mongoengine.StringField(default='')
    role            = mongoengine.StringField(default='')
    specialty       = mongoengine.StringField(default='')
    address         = mongoengine.StringField(default='')
    cni_number      = mongoengine.StringField(default='')
    profile_picture = mongoengine.StringField(default='')
    approval_status = mongoengine.StringField(default='pending')
    has_paid        = mongoengine.BooleanField(default=False)
    is_active       = mongoengine.BooleanField(default=True)
    date_joined     = mongoengine.DateTimeField(default=datetime.datetime.utcnow)

    def __str__(self):
        return f"MongoUser #{self.sqlite_id} — {self.username}"


@receiver(post_save, sender=User)
def sync_user_to_mongo(sender, instance, **kwargs):
    pic_url = ""
    if instance.profile_picture and hasattr(instance.profile_picture, 'url'):
        pic_url = instance.profile_picture.url

    MongoUser.objects(sqlite_id=instance.id).update_one(
        set__username=instance.username,
        set__email=instance.email or "",
        set__role=instance.role or "",
        set__specialty=instance.specialty or "",
        set__address=instance.address or "",
        set__cni_number=instance.cni_number or "",
        set__profile_picture=pic_url,
        set__approval_status=instance.approval_status or "pending",
        set__has_paid=bool(instance.has_paid),
        set__is_active=bool(instance.is_active),
        set__date_joined=instance.date_joined,
        upsert=True
    )


@receiver(post_delete, sender=User)
def delete_user_from_mongo(sender, instance, **kwargs):
    MongoUser.objects(sqlite_id=instance.id).delete()
