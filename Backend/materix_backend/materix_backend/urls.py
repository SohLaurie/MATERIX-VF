from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/profile/', include('Profiles.urls')),
    path('api/shop/', include('shop.urls')),
    path('api/portal/', include('portal.urls', namespace='portal')),
    path('api/notifications/', include('notifications.urls')),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)