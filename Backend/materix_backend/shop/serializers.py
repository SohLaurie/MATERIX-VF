from rest_framework import serializers 
from .models import Product, Order, OrderItem


class ProductSerializer(serializers.ModelSerializer):
    final_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "price",
            "final_price",
            "image",
            "three_d_path",
            "mtl_file",
            "category",
            "rating",
            "likes",
            "description",
            "in_stock",
            "discount",
            "stock",
        ]

    def get_final_price(self, obj):
        return obj.final_price()


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "price_at_purchase",
            "get_subtotal",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    assigned_agent = serializers.StringRelatedField(read_only=True)  # show username if assigned
    customer_username = serializers.CharField(source="customer.username", read_only=True)
    customer_address = serializers.CharField(source="customer.address", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "customer",
            "customer_username",
            "customer_address",
            "total_price",
            "status",
            "created_at",
            "updated_at",
            "transaction_id",
            "assigned_agent",  # 👈 added here
            "items",
        ]
        read_only_fields = [
            "customer",
            "total_price",
            "status",
            "created_at",
            "updated_at",
            "transaction_id",
            "assigned_agent",  # 👈 cannot be set by customer on creation
        ]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])

        request = self.context.get("request")
        order = Order.objects.create(customer=request.user, **validated_data)

        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)

        order.calculate_total()
        return order
