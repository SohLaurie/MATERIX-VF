import datetime
import mongoengine
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import User, PaymentTransaction

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
    two_fa_enabled  = mongoengine.BooleanField(default=False)
    date_joined     = mongoengine.DateTimeField(default=datetime.datetime.utcnow)

    def __str__(self):
        return f"MongoUser #{self.sqlite_id} — {self.username}"


class MongoPaymentTransaction(mongoengine.Document):
    meta = {
        'collection': 'payment_transactions',
        'indexes': ['transaction_id', 'status', 'user_sqlite_id']
    }

    transaction_id = mongoengine.StringField(required=True, unique=True)
    campay_reference = mongoengine.StringField(default="")
    transaction_type = mongoengine.StringField(default="")
    amount = mongoengine.DecimalField(precision=2, default=0.0)
    currency = mongoengine.StringField(default="XAF")
    phone_number = mongoengine.StringField(default="")
    status = mongoengine.StringField(default="pending")
    
    user_sqlite_id = mongoengine.IntField(blank=True, null=True)
    order_id = mongoengine.StringField(default="")
    
    created_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)

    def __str__(self):
        return f"MongoPaymentTransaction #{self.transaction_id} — {self.status}"


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
        set__two_fa_enabled=bool(instance.two_fa_enabled),
        set__date_joined=instance.date_joined,
        upsert=True
    )


@receiver(post_delete, sender=User)
def delete_user_from_mongo(sender, instance, **kwargs):
    MongoUser.objects(sqlite_id=instance.id).delete()


@receiver(post_save, sender=PaymentTransaction)
def sync_payment_transaction_to_mongo(sender, instance, **kwargs):
    user_id = instance.user.id if instance.user else None
    
    MongoPaymentTransaction.objects(transaction_id=instance.transaction_id).update_one(
        set__campay_reference=instance.campay_reference or "",
        set__transaction_type=instance.transaction_type or "",
        set__amount=float(instance.amount),
        set__currency=instance.currency or "XAF",
        set__phone_number=instance.phone_number or "",
        set__status=instance.status or "pending",
        set__user_sqlite_id=user_id,
        set__order_id=instance.order_id or "",
        set__created_at=instance.created_at or datetime.datetime.utcnow(),
        set__updated_at=instance.updated_at or datetime.datetime.utcnow(),
        upsert=True
    )


@receiver(post_delete, sender=PaymentTransaction)
def delete_payment_transaction_from_mongo(sender, instance, **kwargs):
    MongoPaymentTransaction.objects(transaction_id=instance.transaction_id).delete()

