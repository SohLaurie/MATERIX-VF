from django.db import models 
from django.conf import settings
from decimal import Decimal


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('Tools', 'Tools'),
        ('Materials', 'Materials'),
        ('Hardware', 'Hardware'),
        ('Safety', 'Safety'),
    ]

    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to="products/images/", blank=True, null=True)
    three_d_path = models.FileField(upload_to="products/3d/", blank=True, null=True)
    mtl_file = models.FileField(upload_to="products/mtl/", blank=True, null=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    rating = models.FloatField(default=0.0)
    likes = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True, null=True)
    in_stock = models.BooleanField(default=True)
    discount = models.PositiveIntegerField(default=0)  # percentage
    stock = models.PositiveIntegerField(default=0)  # quantity available
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def final_price(self):
        """Return the price after discount (Decimal safe)."""
        if self.discount > 0:
            return self.price - (self.price * Decimal(self.discount) / Decimal(100))
        return self.price

    def __str__(self):
        return f"{self.name} ({self.category})"


class Order(models.Model):
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("In Progress", "In Progress"),
        ("Delivered", "Delivered"),
    ]

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="orders"
    )

    # NEW FIELD: Assigned delivery agent (nullable)
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="assigned_orders",
        null=True,
        blank=True
    )

    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Order #{self.id} - {self.customer.username} ({self.status})"

    def calculate_total(self):
        """Recalculate the total price from all items."""
        self.total_price = sum(item.get_subtotal() for item in self.items.all())
        self.save()
        return self.total_price


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} × {self.product.name}"

    def get_subtotal(self):
        
        return self.price_at_purchase * self.quantity
