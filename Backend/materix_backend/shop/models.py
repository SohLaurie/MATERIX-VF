import datetime
import mongoengine
from decimal import Decimal

class Product(mongoengine.Document):
    meta = {
        'collection': 'products',
        'indexes': ['category']
    }

    CATEGORY_CHOICES = [
        ('Tools', 'Tools'),
        ('Materials', 'Materials'),
        ('Hardware', 'Hardware'),
        ('Safety', 'Safety'),
    ]

    name = mongoengine.StringField(max_length=100, required=True)
    price = mongoengine.DecimalField(precision=2, required=True)
    image_url = mongoengine.StringField(blank=True, null=True)
    three_d_path = mongoengine.StringField(blank=True, null=True)
    mtl_file = mongoengine.StringField(blank=True, null=True)
    category = mongoengine.StringField(max_length=50, choices=CATEGORY_CHOICES)
    rating = mongoengine.FloatField(default=0.0)
    likes = mongoengine.IntField(default=0)
    description = mongoengine.StringField(blank=True, null=True)
    in_stock = mongoengine.BooleanField(default=True)
    discount = mongoengine.IntField(default=0)  # percentage
    stock = mongoengine.IntField(default=0)  # quantity available
    created_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)

    def final_price(self):
        """Return the price after discount."""
        if self.discount > 0:
            return self.price - (self.price * Decimal(self.discount) / Decimal(100))
        return self.price

    def __str__(self):
        return f"{self.name} ({self.category})"


class OrderItem(mongoengine.EmbeddedDocument):
    product_id = mongoengine.StringField(required=True)
    product_name = mongoengine.StringField(required=True)
    quantity = mongoengine.IntField(default=1)
    price_at_purchase = mongoengine.DecimalField(precision=2, required=True)

    def __str__(self):
        return f"{self.quantity} × {self.product_name}"

    def get_subtotal(self):
        return self.price_at_purchase * self.quantity


class Order(mongoengine.Document):
    meta = {
        'collection': 'orders',
        'indexes': ['customer_id', 'assigned_agent_id']
    }

    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("In Progress", "In Progress"),
        ("Delivered", "Delivered"),
    ]

    customer_id = mongoengine.IntField(required=True)
    customer_username = mongoengine.StringField(required=True)
    customer_address = mongoengine.StringField(blank=True, null=True)

    assigned_agent_id = mongoengine.IntField(blank=True, null=True)
    assigned_agent_username = mongoengine.StringField(blank=True, null=True)

    total_price = mongoengine.DecimalField(precision=2, default=0.0)
    status = mongoengine.StringField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    created_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)
    transaction_id = mongoengine.StringField(max_length=100, blank=True, null=True)

    items = mongoengine.EmbeddedDocumentListField(OrderItem)

    def __str__(self):
        return f"Order #{self.id} - {self.customer_username} ({self.status})"

    def calculate_total(self):
        """Recalculate the total price from all embedded items."""
        self.total_price = sum(item.get_subtotal() for item in self.items)
        self.save()
        return self.total_price
