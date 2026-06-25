from rest_framework import serializers 
from .models import Product, Order, OrderItem

class ProductSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    final_price = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    three_d_path = serializers.SerializerMethodField()
    mtl_file = serializers.SerializerMethodField()
    category = serializers.CharField()
    rating = serializers.FloatField()
    likes = serializers.IntegerField()
    description = serializers.CharField(allow_blank=True, allow_null=True)
    in_stock = serializers.BooleanField()
    discount = serializers.IntegerField()
    stock = serializers.IntegerField()

    def get_final_price(self, obj):
        return obj.final_price()

    def get_image(self, obj):
        if obj.image_url:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image_url)
            return obj.image_url
        return None

    def get_three_d_path(self, obj):
        if obj.three_d_path:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.three_d_path)
            return obj.three_d_path
        return None

    def get_mtl_file(self, obj):
        if obj.mtl_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.mtl_file)
            return obj.mtl_file
        return None


class OrderItemSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField(read_only=True)  # Mock id if frontend expects it
    product = serializers.CharField(source="product_id")
    product_name = serializers.CharField(read_only=True)
    quantity = serializers.IntegerField(default=1)
    price_at_purchase = serializers.DecimalField(max_digits=10, decimal_places=2)
    get_subtotal = serializers.SerializerMethodField()

    def get_id(self, obj):
        return None

    def get_get_subtotal(self, obj):
        return obj.get_subtotal()


class OrderSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    customer = serializers.IntegerField(source="customer_id", read_only=True)
    customer_username = serializers.CharField(read_only=True)
    customer_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    status = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    transaction_id = serializers.CharField(read_only=True)
    assigned_agent = serializers.CharField(source="assigned_agent_username", read_only=True)
    gps_location = serializers.DictField(required=False, allow_null=True)
    customer_phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    items = OrderItemSerializer(many=True)

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        request = self.context.get("request")
        
        cust_addr = validated_data.pop("customer_address", None)
        if not cust_addr:
            cust_addr = request.user.address or ""
            
        gps_loc = validated_data.pop("gps_location", None)
        cust_phone = validated_data.pop("customer_phone", None)
        
        embedded_items = []
        for item_data in items_data:
            prod_id = item_data["product_id"]
            try:
                prod = Product.objects.get(id=prod_id)
                prod_name = prod.name
            except Exception:
                prod_name = "Unknown Product"
                
            embedded_items.append(OrderItem(
                product_id=prod_id,
                product_name=prod_name,
                quantity=item_data["quantity"],
                price_at_purchase=item_data["price_at_purchase"]
            ))
            
        order = Order(
            customer_id=request.user.id,
            customer_username=request.user.username,
            customer_address=cust_addr,
            customer_phone=cust_phone,
            gps_location=gps_loc,
            items=embedded_items,
            **validated_data
        )
        order.save()
        order.calculate_total()
        return order
