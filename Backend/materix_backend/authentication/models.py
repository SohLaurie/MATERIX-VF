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

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150)  # required for AbstractBaseUser compatibility
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    specialty = models.CharField(max_length=100, blank=True, null=True)  # technician only
    address = models.CharField(max_length=255, blank=True, null=True)    # technician only
    cni_number = models.CharField(max_length=50, blank=True, null=True)  # technician only
    availability = models.BooleanField(default=True)  # ✅ new technician field
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)  # ✅ new technician field

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_suspended = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    profile_picture = models.ImageField(upload_to="profiles/", blank=True, null=True)

    USERNAME_FIELD = "email"  # login with email
    REQUIRED_FIELDS = ["username"]  # username is still required

    objects = UserManager()

    def _str_(self):
        return f"{self.username} ({self.role})"