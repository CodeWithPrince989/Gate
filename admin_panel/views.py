"""
Views for the GateTracker Admin Panel.
Premium SaaS-grade admin dashboard with analytics, user management, and system monitoring.
"""

import csv
import json
import time
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Avg, Count, Max, Min, Sum, Q, F
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from tracker.models import DailyStats, Feedback, StudySession
from .decorators import admin_required, admin_api_required, super_admin_required
from .models import (
    ActivityLog, AdminProfile, Announcement, Coupon,
    FeatureFlag, PremiumPlan, Report, Subscription, SystemHealthSnapshot,
)


def _log_activity(user, action, description='', request=None, metadata=None):
    """Helper to create an activity log entry."""
    ip = ''
    ua = ''
    if request:
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
        if ',' in ip:
            ip = ip.split(',')[0].strip()
        ua = request.META.get('HTTP_USER_AGENT', '')
    ActivityLog.objects.create(
        user=user, action=action, description=description,
        ip_address=ip or None, user_agent=ua, metadata=metadata or {},
    )


# ══════════════════════════════════════════════
#  AUTH
# ══════════════════════════════════════════════

ADMIN_USERNAME = 'Satya Sarthak Manohari'
ADMIN_PASSWORD = 'Satya@Sarthak@Manohari@2005@05'


def _ensure_admin_user():
    """Ensure the hardcoded admin user exists in the database."""
    try:
        user = User.objects.get(username=ADMIN_USERNAME)
        # Always sync password & flags in case they drifted
        user.set_password(ADMIN_PASSWORD)
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save()
    except User.DoesNotExist:
        user = User.objects.create_superuser(
            username=ADMIN_USERNAME,
            email='admin@gatetracker.com',
            password=ADMIN_PASSWORD,
        )
    return user


def admin_login(request):
    """Admin login page with hardcoded owner credentials."""
    if request.user.is_authenticated and request.user.is_staff:
        return redirect('admin_panel:dashboard')
    error = ''
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            user = _ensure_admin_user()
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            _log_activity(user, 'login', 'Admin panel login', request)
            return redirect('admin_panel:dashboard')
        else:
            error = 'Invalid credentials.'
    return render(request, 'admin_panel/login.html', {'error': error})


@admin_required
def admin_logout(request):
    _log_activity(request.user, 'logout', 'Admin panel logout', request)
    logout(request)
    return redirect('admin_panel:login')


# ══════════════════════════════════════════════
#  DASHBOARD
# ══════════════════════════════════════════════

@admin_required
def dashboard(request):
    """Main admin dashboard with overview analytics."""
    today = date.today()
    yesterday = today - timedelta(days=1)
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    total_users = User.objects.count()
    users_today = User.objects.filter(date_joined__date=today).count()
    users_yesterday = User.objects.filter(date_joined__date=yesterday).count()
    users_this_week = User.objects.filter(date_joined__date__gte=week_ago).count()
    users_this_month = User.objects.filter(date_joined__date__gte=month_ago).count()

    active_today = User.objects.filter(last_login__date=today).count()
    active_week = User.objects.filter(last_login__date__gte=week_ago).count()

    total_sessions = StudySession.objects.count()
    total_hours = (StudySession.objects.aggregate(t=Sum('duration_minutes'))['t'] or 0) / 60
    total_questions = StudySession.objects.aggregate(q=Sum('questions_solved'))['q'] or 0
    sessions_today = StudySession.objects.filter(date=today).count()

    premium_users = Subscription.objects.filter(status='active').values('user').distinct().count()
    total_revenue = Subscription.objects.filter(status='active').aggregate(r=Sum('amount_paid'))['r'] or 0

    growth_pct = 0
    if users_yesterday > 0:
        growth_pct = round(((users_today - users_yesterday) / users_yesterday) * 100, 1)

    # Charts data: user growth (last 14 days)
    growth_labels = []
    growth_data = []
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        growth_labels.append(d.strftime('%b %d'))
        growth_data.append(User.objects.filter(date_joined__date=d).count())

    # DAU chart (last 14 days)
    dau_data = []
    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        dau_data.append(User.objects.filter(last_login__date=d).count())

    # Subject popularity
    subject_dist = (
        StudySession.objects.values('subject')
        .annotate(total=Sum('duration_minutes'))
        .order_by('-total')[:8]
    )
    subject_labels = [s['subject'] for s in subject_dist]
    subject_values = [round(s['total'] / 60, 1) for s in subject_dist]

    # Recent activity
    recent_users = User.objects.order_by('-date_joined')[:5]
    recent_sessions = StudySession.objects.select_related('user').order_by('-created_at')[:5]
    open_reports = Report.objects.filter(status='open').count()
    active_announcements = Announcement.objects.filter(is_active=True).count()

    context = {
        'page_title': 'Dashboard',
        'total_users': total_users,
        'users_today': users_today,
        'users_this_week': users_this_week,
        'users_this_month': users_this_month,
        'active_today': active_today,
        'active_week': active_week,
        'total_sessions': total_sessions,
        'total_hours': round(total_hours, 1),
        'total_questions': total_questions,
        'sessions_today': sessions_today,
        'premium_users': premium_users,
        'total_revenue': total_revenue,
        'growth_pct': growth_pct,
        'growth_labels_json': json.dumps(growth_labels),
        'growth_data_json': json.dumps(growth_data),
        'dau_data_json': json.dumps(dau_data),
        'subject_labels_json': json.dumps(subject_labels),
        'subject_values_json': json.dumps(subject_values),
        'recent_users': recent_users,
        'recent_sessions': recent_sessions,
        'open_reports': open_reports,
        'active_announcements': active_announcements,
    }
    return render(request, 'admin_panel/dashboard.html', context)


# ══════════════════════════════════════════════
#  USER MANAGEMENT
# ══════════════════════════════════════════════

@admin_required
def users_list(request):
    """List all users with search, filter, and pagination."""
    users = User.objects.all().order_by('-date_joined')
    search = request.GET.get('q', '').strip()
    status_filter = request.GET.get('status', '')
    if search:
        users = users.filter(Q(username__icontains=search) | Q(email__icontains=search))
    if status_filter == 'active':
        users = users.filter(is_active=True)
    elif status_filter == 'inactive':
        users = users.filter(is_active=False)
    elif status_filter == 'staff':
        users = users.filter(is_staff=True)

    # Annotate with study data
    users = users.annotate(
        total_study_mins=Sum('study_sessions__duration_minutes'),
        total_questions=Sum('study_sessions__questions_solved'),
        session_count=Count('study_sessions'),
    )

    page = int(request.GET.get('page', 1))
    per_page = 20
    total = users.count()
    total_pages = max(1, (total + per_page - 1) // per_page)
    page = max(1, min(page, total_pages))
    users_page = users[(page - 1) * per_page: page * per_page]

    context = {
        'page_title': 'Users',
        'users': users_page,
        'total_users': total,
        'search': search,
        'status_filter': status_filter,
        'page': page,
        'total_pages': total_pages,
        'page_range': range(max(1, page - 2), min(total_pages + 1, page + 3)),
    }
    return render(request, 'admin_panel/users.html', context)


@admin_required
def user_detail(request, user_id):
    """Detailed view of a single user."""
    target = get_object_or_404(User, id=user_id)
    sessions = StudySession.objects.filter(user=target).order_by('-created_at')[:20]
    total_hours = (StudySession.objects.filter(user=target).aggregate(t=Sum('duration_minutes'))['t'] or 0) / 60
    total_q = StudySession.objects.filter(user=target).aggregate(q=Sum('questions_solved'))['q'] or 0
    sub = Subscription.objects.filter(user=target, status='active').first()
    context = {
        'page_title': f'User: {target.username}',
        'target_user': target,
        'sessions': sessions,
        'total_hours': round(total_hours, 1),
        'total_questions': total_q,
        'subscription': sub,
    }
    return render(request, 'admin_panel/user_detail.html', context)


@admin_required
@require_POST
def user_action(request, user_id):
    """Handle user actions: ban, activate, upgrade, delete, make staff."""
    target = get_object_or_404(User, id=user_id)
    action = request.POST.get('action', '')

    if action == 'ban':
        target.is_active = False
        target.save()
        _log_activity(request.user, 'user_banned', f'Banned user {target.username}', request)
    elif action == 'activate':
        target.is_active = True
        target.save()
    elif action == 'make_staff':
        target.is_staff = True
        target.save()
    elif action == 'remove_staff':
        target.is_staff = False
        target.save()
    elif action == 'upgrade_premium':
        plan = PremiumPlan.objects.filter(is_active=True).first()
        Subscription.objects.create(
            user=target, plan=plan, status='active',
            payment_gateway='manual', amount_paid=0,
            expires_at=timezone.now() + timedelta(days=plan.duration_days if plan else 30),
        )
        _log_activity(request.user, 'user_upgraded', f'Upgraded {target.username} to premium', request)
    elif action == 'delete' and request.user.is_superuser:
        username = target.username
        target.delete()
        _log_activity(request.user, 'user_deleted', f'Deleted user {username}', request)
        return redirect('admin_panel:users')

    return redirect('admin_panel:user_detail', user_id=user_id)


# ══════════════════════════════════════════════
#  ANALYTICS
# ══════════════════════════════════════════════

@admin_required
def analytics_view(request):
    """Platform-wide analytics."""
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    total_users = User.objects.count()
    dau = User.objects.filter(last_login__date=today).count()
    wau = User.objects.filter(last_login__date__gte=week_ago).count()
    mau = User.objects.filter(last_login__date__gte=month_ago).count()

    avg_study = StudySession.objects.aggregate(a=Avg('duration_minutes'))['a'] or 0
    total_hours = (StudySession.objects.aggregate(t=Sum('duration_minutes'))['t'] or 0) / 60

    # Most/least active users
    most_active = (
        User.objects.annotate(total_mins=Sum('study_sessions__duration_minutes'))
        .filter(total_mins__isnull=False)
        .order_by('-total_mins')[:10]
    )
    least_active = (
        User.objects.annotate(total_mins=Sum('study_sessions__duration_minutes'))
        .order_by('total_mins')[:10]
    )

    # Peak hours
    peak_hours = (
        StudySession.objects.extra({'hour': "EXTRACT(hour FROM created_at)"})
        .values('hour')
        .annotate(count=Count('id'))
        .order_by('-count')[:5]
    ) if StudySession.objects.exists() else []

    # Retention: users who studied in both this week and last week
    this_week_users = set(StudySession.objects.filter(date__gte=week_ago).values_list('user_id', flat=True).distinct())
    last_week_users = set(StudySession.objects.filter(
        date__gte=week_ago - timedelta(days=7), date__lt=week_ago
    ).values_list('user_id', flat=True).distinct())
    retention = round(len(this_week_users & last_week_users) / max(len(last_week_users), 1) * 100, 1)

    context = {
        'page_title': 'Analytics',
        'total_users': total_users,
        'dau': dau, 'wau': wau, 'mau': mau,
        'avg_study_mins': round(avg_study, 1),
        'total_hours': round(total_hours, 1),
        'most_active': most_active,
        'least_active': least_active,
        'retention': retention,
    }
    return render(request, 'admin_panel/analytics.html', context)


@admin_required
def export_analytics_csv(request):
    """Export analytics data as CSV."""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="gatetracker_analytics.csv"'
    writer = csv.writer(response)
    writer.writerow(['Username', 'Email', 'Joined', 'Last Login', 'Study Hours', 'Questions', 'Sessions', 'Premium'])
    users = User.objects.annotate(
        total_mins=Sum('study_sessions__duration_minutes'),
        total_q=Sum('study_sessions__questions_solved'),
        sess_count=Count('study_sessions'),
    )
    for u in users:
        has_premium = Subscription.objects.filter(user=u, status='active').exists()
        writer.writerow([
            u.username, u.email, u.date_joined.strftime('%Y-%m-%d'),
            u.last_login.strftime('%Y-%m-%d') if u.last_login else 'Never',
            round((u.total_mins or 0) / 60, 1), u.total_q or 0, u.sess_count, 'Yes' if has_premium else 'No',
        ])
    _log_activity(request.user, 'export_data', 'Exported analytics CSV', request)
    return response


# ══════════════════════════════════════════════
#  STUDY SESSIONS
# ══════════════════════════════════════════════

@admin_required
def sessions_view(request):
    """Monitor all study sessions."""
    sessions = StudySession.objects.select_related('user').order_by('-created_at')
    subject = request.GET.get('subject', '')
    if subject:
        sessions = sessions.filter(subject=subject)
    min_dur = request.GET.get('min_duration', '')
    if min_dur:
        sessions = sessions.filter(duration_minutes__gte=float(min_dur))

    page = int(request.GET.get('page', 1))
    per_page = 25
    total = sessions.count()
    total_pages = max(1, (total + per_page - 1) // per_page)
    page = max(1, min(page, total_pages))

    context = {
        'page_title': 'Sessions',
        'sessions': sessions[(page - 1) * per_page: page * per_page],
        'total_sessions': total,
        'subjects': StudySession.SUBJECT_CHOICES,
        'selected_subject': subject,
        'page': page,
        'total_pages': total_pages,
        'page_range': range(max(1, page - 2), min(total_pages + 1, page + 3)),
    }
    return render(request, 'admin_panel/sessions.html', context)


# ══════════════════════════════════════════════
#  SUBSCRIPTIONS
# ══════════════════════════════════════════════

@admin_required
def subscriptions_view(request):
    """Subscription and premium management."""
    subs = Subscription.objects.select_related('user', 'plan').order_by('-created_at')
    plans = PremiumPlan.objects.all()
    coupons = Coupon.objects.all()
    total_revenue = subs.filter(status='active').aggregate(r=Sum('amount_paid'))['r'] or 0
    active_subs = subs.filter(status='active').count()

    context = {
        'page_title': 'Subscriptions',
        'subscriptions': subs[:50],
        'plans': plans,
        'coupons': coupons,
        'total_revenue': total_revenue,
        'active_subs': active_subs,
        'total_subs': subs.count(),
    }
    return render(request, 'admin_panel/subscriptions.html', context)


# ══════════════════════════════════════════════
#  ANNOUNCEMENTS
# ══════════════════════════════════════════════

@admin_required
def announcements_view(request):
    """Manage announcements."""
    if request.method == 'POST':
        Announcement.objects.create(
            title=request.POST.get('title', ''),
            message=request.POST.get('message', ''),
            notification_type=request.POST.get('type', 'info'),
            target_audience=request.POST.get('audience', 'all'),
            is_active=True,
            created_by=request.user,
        )
        _log_activity(request.user, 'announcement_created', request.POST.get('title', ''), request)
        return redirect('admin_panel:announcements')

    context = {
        'page_title': 'Announcements',
        'announcements': Announcement.objects.all()[:50],
    }
    return render(request, 'admin_panel/announcements.html', context)


@admin_required
@require_POST
def announcement_toggle(request, ann_id):
    ann = get_object_or_404(Announcement, id=ann_id)
    ann.is_active = not ann.is_active
    ann.save()
    return redirect('admin_panel:announcements')


# ══════════════════════════════════════════════
#  REPORTS
# ══════════════════════════════════════════════

@admin_required
def reports_view(request):
    """Issue and feedback management."""
    reports = Report.objects.select_related('user', 'assigned_to').order_by('-created_at')
    status = request.GET.get('status', '')
    if status:
        reports = reports.filter(status=status)

    feedbacks = Feedback.objects.order_by('-created_at')[:20]

    context = {
        'page_title': 'Reports',
        'reports': reports[:50],
        'feedbacks': feedbacks,
        'status_filter': status,
    }
    return render(request, 'admin_panel/reports.html', context)


@admin_required
@require_POST
def report_action(request, report_id):
    report = get_object_or_404(Report, id=report_id)
    action = request.POST.get('action', '')
    if action == 'resolve':
        report.status = 'resolved'
        report.resolved_at = timezone.now()
    elif action == 'close':
        report.status = 'closed'
    elif action == 'in_progress':
        report.status = 'in_progress'
    reply = request.POST.get('reply', '').strip()
    if reply:
        report.admin_reply = reply
    report.save()
    _log_activity(request.user, 'report_resolved', f'Report #{report.id}: {action}', request)
    return redirect('admin_panel:reports')


# ══════════════════════════════════════════════
#  SYSTEM HEALTH
# ══════════════════════════════════════════════

@admin_required
def system_health(request):
    """System monitoring dashboard."""
    snapshots = SystemHealthSnapshot.objects.all()[:24]
    total_users = User.objects.count()
    total_sessions = StudySession.objects.count()
    db_size = 'N/A'
    recent_errors = ActivityLog.objects.filter(action='login_failed').count()

    # Measure DB response time
    start = time.time()
    User.objects.count()
    db_ms = round((time.time() - start) * 1000, 2)

    context = {
        'page_title': 'System Health',
        'snapshots': snapshots,
        'db_response_ms': db_ms,
        'total_users': total_users,
        'total_sessions': total_sessions,
        'recent_errors': recent_errors,
    }
    return render(request, 'admin_panel/system_health.html', context)


# ══════════════════════════════════════════════
#  FEATURE FLAGS
# ══════════════════════════════════════════════

@admin_required
def feature_flags_view(request):
    """Manage feature flags."""
    if request.method == 'POST':
        FeatureFlag.objects.update_or_create(
            slug=request.POST.get('slug', ''),
            defaults={
                'name': request.POST.get('name', ''),
                'description': request.POST.get('description', ''),
                'is_enabled': request.POST.get('is_enabled') == 'on',
                'rollout_percentage': int(request.POST.get('rollout_percentage', 100)),
            },
        )
        return redirect('admin_panel:feature_flags')

    context = {
        'page_title': 'Feature Flags',
        'flags': FeatureFlag.objects.all(),
    }
    return render(request, 'admin_panel/feature_flags.html', context)


@admin_required
@require_POST
def feature_flag_toggle(request, flag_id):
    flag = get_object_or_404(FeatureFlag, id=flag_id)
    flag.is_enabled = not flag.is_enabled
    flag.save()
    _log_activity(request.user, 'feature_toggled', f'{flag.name}: {"ON" if flag.is_enabled else "OFF"}', request)
    return redirect('admin_panel:feature_flags')


# ══════════════════════════════════════════════
#  SETTINGS
# ══════════════════════════════════════════════

@super_admin_required
def settings_view(request):
    """Admin settings page."""
    logs = ActivityLog.objects.all()[:50]
    context = {
        'page_title': 'Settings',
        'activity_logs': logs,
    }
    return render(request, 'admin_panel/settings.html', context)


# ══════════════════════════════════════════════
#  API ENDPOINTS (JSON)
# ══════════════════════════════════════════════

@admin_api_required
def api_dashboard_stats(request):
    """JSON endpoint for real-time dashboard stats."""
    today = date.today()
    return JsonResponse({
        'total_users': User.objects.count(),
        'active_today': User.objects.filter(last_login__date=today).count(),
        'sessions_today': StudySession.objects.filter(date=today).count(),
        'open_reports': Report.objects.filter(status='open').count(),
    })


@admin_api_required
def api_user_search(request):
    """Quick user search for autocomplete."""
    q = request.GET.get('q', '').strip()
    if len(q) < 2:
        return JsonResponse({'users': []})
    users = User.objects.filter(
        Q(username__icontains=q) | Q(email__icontains=q)
    )[:10]
    return JsonResponse({
        'users': [{'id': u.id, 'username': u.username, 'email': u.email} for u in users]
    })
