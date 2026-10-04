"""URL patterns for the GateTracker Admin Panel."""

from django.urls import path
from . import views

app_name = 'admin_panel'

urlpatterns = [
    # Auth
    path('login/', views.admin_login, name='login'),
    path('logout/', views.admin_logout, name='logout'),

    # Dashboard
    path('', views.dashboard, name='dashboard'),

    # Users
    path('users/', views.users_list, name='users'),
    path('users/<int:user_id>/', views.user_detail, name='user_detail'),
    path('users/<int:user_id>/action/', views.user_action, name='user_action'),

    # Analytics
    path('analytics/', views.analytics_view, name='analytics'),
    path('analytics/export/', views.export_analytics_csv, name='export_csv'),

    # Sessions
    path('sessions/', views.sessions_view, name='sessions'),

    # Subscriptions
    path('subscriptions/', views.subscriptions_view, name='subscriptions'),

    # Announcements
    path('announcements/', views.announcements_view, name='announcements'),
    path('announcements/<int:ann_id>/toggle/', views.announcement_toggle, name='announcement_toggle'),

    # Reports
    path('reports/', views.reports_view, name='reports'),
    path('reports/<int:report_id>/action/', views.report_action, name='report_action'),

    # System Health
    path('system/', views.system_health, name='system_health'),

    # Feature Flags
    path('features/', views.feature_flags_view, name='feature_flags'),
    path('features/<int:flag_id>/toggle/', views.feature_flag_toggle, name='feature_flag_toggle'),

    # Settings
    path('settings/', views.settings_view, name='settings'),

    # API
    path('api/stats/', views.api_dashboard_stats, name='api_stats'),
    path('api/users/search/', views.api_user_search, name='api_user_search'),
]
