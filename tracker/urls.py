"""URL patterns for the tracker app."""

from django.urls import path
from . import views

app_name = 'tracker'

urlpatterns = [
    path('api/csrf/', views.api_csrf, name='api_csrf'),

    # ── Auth API ──
    path('api/auth/register/', views.api_register, name='api_register'),
    path('api/auth/login/', views.api_login, name='api_login'),
    path('api/auth/logout/', views.api_logout, name='api_logout'),
    path('api/auth/check/', views.api_check_auth, name='api_check_auth'),

    # ── OAuth ──
    path('api/auth/google/', views.oauth_google_start, name='oauth_google_start'),
    path('api/auth/google/callback/', views.oauth_google_callback, name='oauth_google_callback'),
    path('api/auth/github/', views.oauth_github_start, name='oauth_github_start'),
    path('api/auth/github/callback/', views.oauth_github_callback, name='oauth_github_callback'),

    # ── JSON API endpoints (for React frontend) ──
    path('api/dashboard/', views.api_dashboard, name='api_dashboard'),
    path('api/analytics/', views.api_analytics, name='api_analytics'),
    path('api/chart-data/', views.api_chart_data, name='api_chart_data'),
    path('api/history/', views.api_history, name='api_history'),
    path('api/heatmap/', views.api_heatmap, name='api_heatmap'),
    path('api/weekly-progress/', views.api_weekly_progress, name='api_weekly'),
    path('api/growth-tree/', views.api_growth_tree, name='api_growth_tree'),
    path('api/progress/', views.api_multi_week_progress, name='api_progress'),
    path('api/assistant/chat/', views.api_assistant_chat, name='api_assistant_chat'),
    path('api/assistant/health/', views.api_assistant_health, name='api_assistant_health'),
    path('api/feedback/', views.api_feedback_list, name='api_feedback_list'),
    path('api/feedback/submit/', views.api_feedback_submit, name='api_feedback_submit'),
    path('api/feedback/<int:feedback_id>/upvote/', views.api_feedback_upvote, name='api_feedback_upvote'),
    path('api/health/', views.api_health, name='api_health'),

    # ── Vlogs ──
    path('api/vlogs/', views.api_get_vlogs, name='api_get_vlogs'),
    path('api/vlogs/create/', views.api_create_vlog, name='api_create_vlog'),
    path('api/vlogs/<int:vlog_id>/delete/', views.api_delete_vlog, name='api_delete_vlog'),

    # ── POST endpoints ──
    path('save-session/', views.save_session, name='save_session'),
    path('feedback', views.feedback, name='feedback'),
    path('feedback/<int:feedback_id>/upvote/', views.upvote_feedback, name='feedback_upvote'),

    # ── CSV Export ──
    path('export/', views.export_csv, name='export_csv'),

    # ── HTML template views ──
    path('', views.dashboard, name='dashboard'),
    path('start-study/', views.start_study, name='start_study'),
    path('analytics/', views.analytics, name='analytics_page'),
    path('history/', views.history, name='history_page'),
]
