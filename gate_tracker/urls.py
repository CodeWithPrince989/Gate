"""Root URL configuration for gate_tracker project."""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('panel/', include('admin_panel.urls')),
    path('', include('tracker.urls')),
]
