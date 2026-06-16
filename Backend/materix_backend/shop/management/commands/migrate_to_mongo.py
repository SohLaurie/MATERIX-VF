import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import connections
import mongoengine

# -------------------------------------------------------------
# Local MongoEngine Document Definitions
# -------------------------------------------------------------
class MongoProduct(mongoengine.Document):
    meta = {'collection': 'products'}
    name = mongoengine.StringField(max_length=100, required=True)
    price = mongoengine.DecimalField(precision=2)
    image_url = mongoengine.StringField(blank=True, null=True)
    three_d_path = mongoengine.StringField(blank=True, null=True)
    mtl_file = mongoengine.StringField(blank=True, null=True)
    category = mongoengine.StringField(max_length=50)
    rating = mongoengine.FloatField(default=0.0)
    likes = mongoengine.IntField(default=0)
    description = mongoengine.StringField(blank=True, null=True)
    in_stock = mongoengine.BooleanField(default=True)
    discount = mongoengine.IntField(default=0)
    stock = mongoengine.IntField(default=0)
    created_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)

class MongoOrderItem(mongoengine.EmbeddedDocument):
    product_id = mongoengine.StringField()
    product_name = mongoengine.StringField()
    quantity = mongoengine.IntField(default=1)
    price_at_purchase = mongoengine.DecimalField(precision=2)

class MongoOrder(mongoengine.Document):
    meta = {'collection': 'orders'}
    customer_id = mongoengine.IntField()
    customer_username = mongoengine.StringField()
    customer_address = mongoengine.StringField()
    
    assigned_agent_id = mongoengine.IntField(null=True)
    assigned_agent_username = mongoengine.StringField(null=True)

    total_price = mongoengine.DecimalField(precision=2, default=0.0)
    status = mongoengine.StringField(max_length=20, default="Pending")
    created_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)
    transaction_id = mongoengine.StringField(max_length=100, blank=True, null=True)
    
    items = mongoengine.EmbeddedDocumentListField(MongoOrderItem)

class MongoServiceRequest(mongoengine.Document):
    meta = {'collection': 'service_requests'}
    technician_id = mongoengine.IntField(required=True)
    technician_username = mongoengine.StringField()
    client_id = mongoengine.IntField(null=True)
    client_username = mongoengine.StringField(null=True)

    client_name = mongoengine.StringField(max_length=150)
    contact = mongoengine.StringField(max_length=150)
    preferred_method = mongoengine.StringField(max_length=20)
    message = mongoengine.StringField()
    location = mongoengine.StringField(max_length=255, blank=True, null=True)
    status = mongoengine.StringField(max_length=20, default='pending')

    created_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)

class MongoNotification(mongoengine.Document):
    meta = {'collection': 'notifications'}
    recipient_id = mongoengine.IntField(required=True)
    request_id = mongoengine.StringField(null=True)
    message = mongoengine.StringField()
    is_read = mongoengine.BooleanField(default=False)
    created_at = mongoengine.DateTimeField(default=datetime.datetime.utcnow)


class Command(BaseCommand):
    help = "Migrate database data from SQLite to MongoDB Atlas"

    def handle(self, *args, **options):
        # 1. Connect to MongoDB Atlas (using the connection configuration in Django settings.py)
        # We ensure it's connected
        self.stdout.write(self.style.NOTICE("Connecting to MongoDB Atlas..."))
        
        # 2. Import Django models
        from shop.models import Product, Order, OrderItem
        from portal.models import ServiceRequest
        from notifications.models import Notification

        # 3. Clear existing collections to avoid duplicates on re-runs
        self.stdout.write(self.style.WARNING("Clearing existing MongoDB collections..."))
        MongoProduct.objects.delete()
        MongoOrder.objects.delete()
        MongoServiceRequest.objects.delete()
        MongoNotification.objects.delete()

        # 4. Migrate Products
        self.stdout.write("Migrating Products...")
        product_map = {} # {old_sqlite_id: new_mongo_id_string}
        sqlite_products = Product.objects.all()
        for sp in sqlite_products:
            image_path = sp.image.name if sp.image else None
            three_d_path = sp.three_d_path.name if sp.three_d_path else None
            mtl_path = sp.mtl_file.name if sp.mtl_file else None
            
            mp = MongoProduct(
                name=sp.name,
                price=sp.price,
                image_url=f"/media/{image_path}" if image_path else None,
                three_d_path=f"/media/{three_d_path}" if three_d_path else None,
                mtl_file=f"/media/{mtl_path}" if mtl_path else None,
                category=sp.category,
                rating=sp.rating,
                likes=sp.likes,
                description=sp.description,
                in_stock=sp.in_stock,
                discount=sp.discount,
                stock=sp.stock,
                created_at=sp.created_at or datetime.datetime.utcnow(),
                updated_at=sp.updated_at or datetime.datetime.utcnow()
            )
            mp.save()
            product_map[sp.id] = str(mp.id)
        
        self.stdout.write(self.style.SUCCESS(f"Successfully migrated {len(product_map)} products."))

        # 5. Migrate Orders and nested OrderItems
        self.stdout.write("Migrating Orders and OrderItems...")
        sqlite_orders = Order.objects.all()
        order_count = 0
        for so in sqlite_orders:
            embedded_items = []
            for item in so.items.all():
                new_prod_id = product_map.get(item.product.id)
                if not new_prod_id:
                    self.stdout.write(self.style.WARNING(f"Product ID {item.product.id} not found in map, skipping item."))
                    continue
                embedded_items.append(MongoOrderItem(
                    product_id=new_prod_id,
                    product_name=item.product.name,
                    quantity=item.quantity,
                    price_at_purchase=item.price_at_purchase
                ))
            
            agent_id = so.assigned_agent.id if so.assigned_agent else None
            agent_username = so.assigned_agent.username if so.assigned_agent else None

            mo = MongoOrder(
                customer_id=so.customer.id,
                customer_username=so.customer.username,
                customer_address=so.customer.address or "",
                assigned_agent_id=agent_id,
                assigned_agent_username=agent_username,
                total_price=so.total_price,
                status=so.status,
                created_at=so.created_at or datetime.datetime.utcnow(),
                updated_at=so.updated_at or datetime.datetime.utcnow(),
                transaction_id=so.transaction_id,
                items=embedded_items
            )
            mo.save()
            order_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully migrated {order_count} orders."))

        # 6. Migrate Service Requests
        self.stdout.write("Migrating Service Requests...")
        sqlite_requests = ServiceRequest.objects.all()
        request_map = {} # {old_sqlite_id: new_mongo_id_string}
        for sr in sqlite_requests:
            client_id = sr.client.id if sr.client else None
            client_username = sr.client.username if sr.client else None

            msr = MongoServiceRequest(
                technician_id=sr.technician.id,
                technician_username=sr.technician.username,
                client_id=client_id,
                client_username=client_username,
                client_name=sr.client_name,
                contact=sr.contact,
                preferred_method=sr.preferred_method,
                message=sr.message,
                location=sr.location,
                status=sr.status,
                created_at=sr.created_at or datetime.datetime.utcnow(),
                updated_at=sr.updated_at or datetime.datetime.utcnow()
            )
            msr.save()
            request_map[sr.id] = str(msr.id)

        self.stdout.write(self.style.SUCCESS(f"Successfully migrated {len(request_map)} service requests."))

        # 7. Migrate Notifications
        self.stdout.write("Migrating Notifications...")
        sqlite_notifications = Notification.objects.all()
        notif_count = 0
        for sn in sqlite_notifications:
            req_id = request_map.get(sn.request.id) if sn.request else None
            
            mn = MongoNotification(
                recipient_id=sn.recipient.id,
                request_id=req_id,
                message=sn.message,
                is_read=sn.is_read,
                created_at=sn.created_at or datetime.datetime.utcnow()
            )
            mn.save()
            notif_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully migrated {notif_count} notifications."))
        self.stdout.write(self.style.SUCCESS("Database migration to MongoDB Atlas completed successfully!"))
