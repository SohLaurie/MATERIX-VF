from rest_framework import generics, permissions, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Product, Order
from .serializers import ProductSerializer, OrderSerializer

# -------------------------------

# Product Views

# -------------------------------

class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]  # allow public GET requests

class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = "id"
    permission_classes = [AllowAny]  # allow public GET requests

# -------------------------------

# Customer Order Views

# -------------------------------

class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]


    def get_queryset(self):
        # Each customer only sees their own orders
        return Order.objects.filter(customer=self.request.user).order_by("-created_at")
   

class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]


    def get_queryset(self):
        # Each customer only views their own orders
        return Order.objects.filter(customer=self.request.user)


# -------------------------------

# Delivery Dashboard Views

# -------------------------------

class DeliveryOrderListView(generics.ListAPIView):
    """
    List all orders for delivery agents.
    Assigned orders will also be included.
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]


    def get_queryset(self):
        # Show all orders (assigned or not) to delivery agents
        return Order.objects.all().order_by("-created_at")


class AssignOrderView(APIView):
    """
    Delivery agent accepts an unassigned order.
    """
    permission_classes = [permissions.IsAuthenticated]


    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, assigned_agent__isnull=True)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not available or already taken."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order.assigned_agent = request.user
        order.status = "In Progress"  # ✅ ensure DB is updated
        order.save()

        serializer = OrderSerializer(order)
        data = serializer.data
        # frontend display: "You" for current user
        data["assigned_agent"] = "You"
        return Response(data, status=status.HTTP_200_OK)


class DeliverOrderView(APIView):
    """
    Delivery agent marks their assigned order as delivered.
    """
    permission_classes = [permissions.IsAuthenticated]


    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, assigned_agent=request.user)
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found or not assigned to you."},
                status=status.HTTP_404_NOT_FOUND,
            )

        order.status = "Delivered"  # ✅ ensure DB is updated
        order.save()

        serializer = OrderSerializer(order)
        data = serializer.data
        data["assigned_agent"] = "You"
        return Response(data, status=status.HTTP_200_OK)

