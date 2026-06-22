from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
import os
from .models import Product, Order
from .serializers import ProductSerializer, OrderSerializer

class ProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True, context={"request": request})
        return Response(serializer.data)


class ProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, id):
        try:
            product = Product.objects.get(id=id)
            serializer = ProductSerializer(product, context={"request": request})
            return Response(serializer.data)
        except Exception:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)


class OrderListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects(customer_id=request.user.id).order_by("-created_at")
        serializer = OrderSerializer(orders, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = OrderSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            order = serializer.save()
            return Response(OrderSerializer(order, context={"request": request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.get(id=pk, customer_id=request.user.id)
            serializer = OrderSerializer(order, context={"request": request})
            return Response(serializer.data)
        except Exception:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            order = Order.objects.get(id=pk, customer_id=request.user.id)
            order.delete()
            return Response({"success": True, "message": "Order removed from history"}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)


class DeliveryOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.all().order_by("-created_at")
        serializer = OrderSerializer(orders, many=True, context={"request": request})
        return Response(serializer.data)


class AssignOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(id=pk)
            if order.assigned_agent_id is not None:
                return Response(
                    {"error": "Order not available or already taken."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception:
            return Response(
                {"error": "Order not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        order.assigned_agent_id = request.user.id
        order.assigned_agent_username = request.user.username
        order.status = "In Progress"
        order.save()

        serializer = OrderSerializer(order, context={"request": request})
        data = serializer.data
        data["assigned_agent"] = "You"
        return Response(data, status=status.HTTP_200_OK)


class DeliverOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(id=pk, assigned_agent_id=request.user.id)
        except Exception:
            return Response(
                {"error": "Order not found or not assigned to you."},
                status=status.HTTP_404_NOT_FOUND,
            )

        order.status = "Delivered"
        order.save()

        serializer = OrderSerializer(order, context={"request": request})
        data = serializer.data
        data["assigned_agent"] = "You"
        return Response(data, status=status.HTTP_200_OK)


from django.contrib.auth import get_user_model
User = get_user_model()

class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        delivered_orders = Order.objects(status="Delivered")
        total_revenue = float(sum(o.total_price for o in delivered_orders))
        active_users = User.objects.filter(is_active=True).count()
        pending_orders = Order.objects(status="Pending").count()
        products_in_stock = Product.objects(stock__gt=0).count()
        
        recent_orders = Order.objects.all().order_by("-created_at")[:5]
        recent_orders_serializer = OrderSerializer(recent_orders, many=True, context={"request": request})

        return Response({
            "total_revenue": total_revenue,
            "active_users": active_users,
            "pending_orders": pending_orders,
            "products_in_stock": products_in_stock,
            "recent_orders": recent_orders_serializer.data
        }, status=status.HTTP_200_OK)


class AdminOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        orders = Order.objects.all().order_by("-created_at")
        serializer = OrderSerializer(orders, many=True, context={"request": request})
        return Response(serializer.data)


class AdminOrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        try:
            order = Order.objects.get(id=pk)
        except Exception:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        status_val = request.data.get("status")
        agent_id_val = request.data.get("assigned_agent_id")
        
        if status_val:
            order.status = status_val
        if agent_id_val is not None:
            if agent_id_val == "" or agent_id_val == 0 or agent_id_val == "0":
                order.assigned_agent_id = None
                order.assigned_agent_username = None
            else:
                try:
                    agent = User.objects.get(id=int(agent_id_val))
                    order.assigned_agent_id = agent.id
                    order.assigned_agent_username = agent.username
                except Exception:
                    return Response({"error": "Agent not found"}, status=status.HTTP_400_BAD_REQUEST)
        
        for key in ["pickup", "transaction_id", "total_price"]:
            if key in request.data:
                setattr(order, key, request.data[key])
                
        order.save()
        serializer = OrderSerializer(order, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        try:
            order = Order.objects.get(id=pk)
            order.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)


class AdminProductListView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = ProductSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            data = serializer.validated_data
            
            image_file = request.FILES.get("image")
            image_url = None
            if image_file:
                path = default_storage.save(os.path.join('products', 'images', image_file.name), image_file)
                image_url = default_storage.url(path)
            else:
                image_url = request.data.get("image") or None
                
            obj_file = request.FILES.get("three_d_path")
            three_d_path = None
            if obj_file:
                path = default_storage.save(os.path.join('products', '3d', obj_file.name), obj_file)
                three_d_path = default_storage.url(path)
            else:
                three_d_path = request.data.get("three_d_path") or None
                
            mtl_file = request.FILES.get("mtl_file")
            mtl_url = None
            if mtl_file:
                path = default_storage.save(os.path.join('products', '3d', mtl_file.name), mtl_file)
                mtl_url = default_storage.url(path)
            else:
                mtl_url = request.data.get("mtl_file") or None

            p = Product(
                name=data.get("name"),
                price=data.get("price"),
                category=data.get("category"),
                rating=data.get("rating", 0.0),
                likes=data.get("likes", 0),
                description=data.get("description", ""),
                in_stock=data.get("in_stock", True),
                discount=data.get("discount", 0),
                stock=data.get("stock", 0),
                image_url=image_url,
                three_d_path=three_d_path,
                mtl_file=mtl_url
            )
            p.save()
            return Response(ProductSerializer(p, context={"request": request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminProductDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request, pk):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        try:
            p = Product.objects.get(id=pk)
        except Exception:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(p, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            data = serializer.validated_data
            for key, val in data.items():
                setattr(p, key, val)
                
            if "image" in request.FILES:
                image_file = request.FILES["image"]
                path = default_storage.save(os.path.join('products', 'images', image_file.name), image_file)
                p.image_url = default_storage.url(path)
            elif "image" in request.data:
                p.image_url = request.data["image"] or None

            if "three_d_path" in request.FILES:
                obj_file = request.FILES["three_d_path"]
                path = default_storage.save(os.path.join('products', '3d', obj_file.name), obj_file)
                p.three_d_path = default_storage.url(path)
            elif "three_d_path" in request.data:
                p.three_d_path = request.data["three_d_path"] or None

            if "mtl_file" in request.FILES:
                mtl_file = request.FILES["mtl_file"]
                path = default_storage.save(os.path.join('products', '3d', mtl_file.name), mtl_file)
                p.mtl_file = default_storage.url(path)
            elif "mtl_file" in request.data:
                p.mtl_file = request.data["mtl_file"] or None

            p.save()
            return Response(ProductSerializer(p, context={"request": request}).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        try:
            p = Product.objects.get(id=pk)
            p.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
