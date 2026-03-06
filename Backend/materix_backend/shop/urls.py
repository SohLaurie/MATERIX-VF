from django.urls import path
from .views import (
    ProductListView,
    ProductDetailView,
    OrderListCreateView,
    OrderDetailView,
    DeliveryOrderListView,
    AssignOrderView,
    DeliverOrderView,
)

urlpatterns = [
    # --- Products ---
    path("products/", ProductListView.as_view(), name="product-list"),
    path("products/<int:id>/", ProductDetailView.as_view(), name="product-detail"),

    # --- Orders (customer) ---
    path("orders/", OrderListCreateView.as_view(), name="order-list"),
    path("orders/<int:pk>/", OrderDetailView.as_view(), name="order-detail"),

    # --- Delivery agent endpoints ---
    path("delivery/orders/", DeliveryOrderListView.as_view(), name="delivery-orders"),
    path("delivery/orders/<int:pk>/assign/", AssignOrderView.as_view(), name="assign-order"),
    path("delivery/orders/<int:pk>/deliver/", DeliverOrderView.as_view(), name="deliver-order"),
]
