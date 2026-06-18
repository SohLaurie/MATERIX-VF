"""
TechnicianApplication — MongoDB document.

Stores the rich registration data submitted by a technician that doesn't fit
neatly on the SQLite User model.  Keyed to the SQLite User.id via user_id.
"""
import datetime
import mongoengine


class TechnicianApplication(mongoengine.Document):
    meta = {
        'collection': 'technician_applications',
        'indexes': ['user_id', 'email'],
    }

    # ── Link to SQLite User ──────────────────────────────────────────────────
    user_id = mongoengine.IntField(required=True, unique=True)

    # ── Personal Information (Step 0) ────────────────────────────────────────
    first_name   = mongoengine.StringField(default='')
    last_name    = mongoengine.StringField(default='')
    email        = mongoengine.StringField(default='')
    phone        = mongoengine.StringField(default='')
    whatsapp     = mongoengine.StringField(default='')
    dob          = mongoengine.StringField(default='')
    gender       = mongoengine.StringField(default='')
    city         = mongoengine.StringField(default='')
    address      = mongoengine.StringField(default='')
    cni          = mongoengine.StringField(default='')

    # ── Professional Information (Step 1) ────────────────────────────────────
    service        = mongoengine.StringField(default='')
    custom_service = mongoengine.StringField(default='')
    experience     = mongoengine.StringField(default='')
    availability   = mongoengine.StringField(default='')
    radius         = mongoengine.StringField(default='')
    about          = mongoengine.StringField(default='')
    specializations = mongoengine.StringField(default='')

    # ── Media (Step 2 & 3) ───────────────────────────────────────────────────
    # Profile photo and portfolio photos stored relative to MEDIA_ROOT
    photo_url    = mongoengine.StringField(default='')
    portfolio_urls = mongoengine.ListField(mongoengine.StringField())
    # Document filenames stored relative to MEDIA_ROOT
    doc_urls     = mongoengine.ListField(mongoengine.StringField())

    # ── Timestamps ───────────────────────────────────────────────────────────
    submitted_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)

    def __str__(self):
        return f"Application #{self.user_id} — {self.first_name} {self.last_name}"
