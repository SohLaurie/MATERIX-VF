from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

# Custom user manager
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        return self.create_user(email, password, **extra_fields)

# Custom User model
class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('client', 'Client'),
        ('technician', 'Technician'),
        ('delivery', 'Delivery Agent'),
        ('admin', 'Admin'),
    ]

    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150)  # required for AbstractBaseUser compatibility
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    specialty = models.CharField(max_length=100, blank=True, null=True)  # technician only
    address = models.CharField(max_length=255, blank=True, null=True)    # technician only
    cni_number = models.CharField(max_length=50, blank=True, null=True)  # technician only
    availability = models.BooleanField(default=True)  # ✅ new technician field
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)  # ✅ new technician field
    # ── Technician verification state machine ──────────────────────────────
    # approval_status: admin reviews the submitted application
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,
        default='pending',
    )
    # has_paid: tech completes subscription payment after admin approval
    has_paid = models.BooleanField(default=False)

    # ── 2FA fields ──────────────────────────────────────────────────────────
    two_fa_enabled = models.BooleanField(default=False)
    two_factor_code = models.CharField(max_length=6, blank=True, null=True)
    two_factor_code_created_at = models.DateTimeField(blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_suspended = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    profile_picture = models.ImageField(upload_to="profiles/", blank=True, null=True)

    USERNAME_FIELD = "email"  # login with email
    REQUIRED_FIELDS = ["username"]  # username is still required

    objects = UserManager()

    def __str__(self):
        return f"{self.username} ({self.role})"


class SystemSetting(models.Model):
    key = models.CharField(max_length=50, unique=True)
    value = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.key}: {self.value}"


class PaymentTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('order', 'Order Payment'),
        ('subscription', 'Technician Subscription'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Successful'),
        ('failed', 'Failed'),
    ]

    transaction_id = models.CharField(max_length=100, unique=True, help_text="Unique external reference sent to CamPay")
    campay_reference = models.CharField(max_length=100, blank=True, null=True, help_text="Transaction reference returned by CamPay")
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="XAF")
    phone_number = models.CharField(max_length=20, help_text="Payer mobile money phone number (format: 237xxxxxxxxx)")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    
    # Relationships
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, help_text="User initiating the payment")
    order_id = models.CharField(max_length=100, null=True, blank=True, help_text="Order ID (MongoDB string ID) if transaction_type is 'order'")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.transaction_type.capitalize()} - {self.transaction_id} ({self.status})"