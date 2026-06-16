from django.urls import path
from .views import (
    ProductListView,
    ProductDetailView,
    OrderListCreateView,
    OrderDetailView,
    DeliveryOrderListView,
    AssignOrderView,
    DeliverOrderView,
    AdminStatsView,
    AdminOrderListView,
    AdminOrderDetailView,
    AdminProductListView,
    AdminProductDetailView,
)

urlpatterns = [
    # --- Products ---
    path("products/", ProductListView.as_view(), name="product-list"),
    path("products/<str:id>/", ProductDetailView.as_view(), name="product-detail"),

    # --- Orders (customer) ---
    path("orders/", OrderListCreateView.as_view(), name="order-list"),
    path("orders/<str:pk>/", OrderDetailView.as_view(), name="order-detail"),

    # --- Delivery agent endpoints ---
    path("delivery/orders/", DeliveryOrderListView.as_view(), name="delivery-orders"),
    path("delivery/orders/<str:pk>/assign/", AssignOrderView.as_view(), name="assign-order"),
    path("delivery/orders/<str:pk>/deliver/", DeliverOrderView.as_view(), name="deliver-order"),

    # --- Admin Dashboard endpoints ---
    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("admin/orders/", AdminOrderListView.as_view(), name="admin-orders"),
    path("admin/orders/<str:pk>/", AdminOrderDetailView.as_view(), name="admin-order-detail"),
    path("admin/products/", AdminProductListView.as_view(), name="admin-products"),
    path("admin/products/<str:pk>/", AdminProductDetailView.as_view(), name="admin-product-detail"),
]
