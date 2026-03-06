from django.contrib import admin
from .models import Product, Order, OrderItem


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'category',
        'price',
        'stock',
        'in_stock',
        'discount',
        'rating',
        'likes',
    )
    list_filter = ('category', 'in_stock', 'discount')
    search_fields = ('name', 'description', 'category')
    ordering = ('id',)
    readonly_fields = ('id',)
    list_editable = ('price', 'stock', 'in_stock', 'discount')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    readonly_fields = ('price_at_purchase', 'get_subtotal')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'status', 'assigned_agent','total_price', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at')
    search_fields = ('customer__username', 'transaction_id')
    ordering = ('-created_at',)
    inlines = [OrderItemInline]
    readonly_fields = ('id', 'total_price', 'created_at', 'updated_at')


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'product', 'quantity', 'price_at_purchase', 'get_subtotal')
    list_filter = ('order', 'product')
    search_fields = ('order__id', 'product__name')
    ordering = ('id',)
    readonly_fields = ('id', 'get_subtotal')
