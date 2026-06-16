from django.contrib import admin
# Note: Product, Order, and OrderItem models have been migrated to MongoDB/MongoEngine.
# Django's default Admin site only supports relational SQL models.
# To manage MongoDB collections, use MongoDB Atlas dashboard or a tool like MongoDB Compass.

# from .models import Product, Order, OrderItem
# 
# @admin.register(Product)
# class ProductAdmin(admin.ModelAdmin):
#     ...
