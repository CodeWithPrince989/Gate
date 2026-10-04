"""
Models for the GateTracker Admin Panel.

Covers: Admin Roles, Premium Plans, Subscriptions, Announcements,
Reports/Issues, Feature Flags, Activity Logs, and System Health snapshots.
"""

from django.conf import settings
from django.db import models
from django.utils import timezone


# ══════════════════════════════════════════════
#  ADMIN ROLES & PROFILES
# ══════════════════════════════════════════════

class AdminProfile(models.Model):
    """Extended profile for admin/staff users with role-based access."""

    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('moderator', 'Moderator'),
        ('support', 'Support Staff'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_profile',
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='support')
    avatar_url = models.URLField(blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    is_active_admin = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"

    @property
    def is_super_admin(self):
        return self.role == 'super_admin'

    @property
    def is_moderator(self):
        return self.role in ('super_admin', 'moderator')


# ══════════════════════════════════════════════
#  PREMIUM PLANS & SUBSCRIPTIONS
# ══════════════════════════════════════════════

class PremiumPlan(models.Model):
    """Available subscription plans."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    duration_days = models.IntegerField(default=30, help_text="Plan duration in days")
    features = models.JSONField(default=list, blank=True, help_text="List of feature strings")
    is_active = models.BooleanField(default=True)
    stripe_price_id = models.CharField(max_length=100, blank=True, default='')
    razorpay_plan_id = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['price']

    def __str__(self):
        return f"{self.name} — ₹{self.price}/{self.duration_days}d"


class Subscription(models.Model):
    """User subscription records."""

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
        ('trial', 'Trial'),
        ('pending', 'Pending'),
    ]

    PAYMENT_GATEWAY_CHOICES = [
        ('manual', 'Manual'),
        ('stripe', 'Stripe'),
        ('razorpay', 'Razorpay'),
        ('coupon', 'Coupon'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscriptions',
    )
    plan = models.ForeignKey(PremiumPlan, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_gateway = models.CharField(max_length=20, choices=PAYMENT_GATEWAY_CHOICES, default='manual')
    payment_id = models.CharField(max_length=200, blank=True, default='')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon_code = models.CharField(max_length=50, blank=True, default='')
    starts_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        plan_name = self.plan.name if self.plan else 'Free'
        return f"{self.user.username} — {plan_name} ({self.status})"

    @property
    def is_active(self):
        if self.status != 'active':
            return False
        if self.expires_at and self.expires_at < timezone.now():
            return False
        return True

    @property
    def days_remaining(self):
        if not self.expires_at:
            return None
        delta = self.expires_at - timezone.now()
        return max(0, delta.days)


class Coupon(models.Model):
    """Discount coupons for subscriptions."""

    code = models.CharField(max_length=50, unique=True)
    discount_percent = models.IntegerField(default=0, help_text="Percentage off")
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Flat discount in currency")
    max_uses = models.IntegerField(default=1)
    times_used = models.IntegerField(default=0)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} ({self.discount_percent}% / ₹{self.discount_amount})"

    @property
    def is_valid(self):
        if not self.is_active or self.times_used >= self.max_uses:
            return False
        now = timezone.now()
        if self.valid_until and now > self.valid_until:
            return False
        return now >= self.valid_from


# ══════════════════════════════════════════════
#  ANNOUNCEMENTS & NOTIFICATIONS
# ══════════════════════════════════════════════

class Announcement(models.Model):
    """Admin broadcast messages to all users."""

    TYPE_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('success', 'Success'),
        ('critical', 'Critical'),
    ]

    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    is_active = models.BooleanField(default=True)
    is_pinned = models.BooleanField(default=False)
    target_audience = models.CharField(
        max_length=20,
        choices=[('all', 'All Users'), ('premium', 'Premium Only'), ('free', 'Free Only')],
        default='all',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='announcements',
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"[{self.get_notification_type_display()}] {self.title}"


# ══════════════════════════════════════════════
#  REPORTS / ISSUES
# ══════════════════════════════════════════════

class Report(models.Model):
    """User-submitted bug reports, suggestions, and feature requests."""

    CATEGORY_CHOICES = [
        ('bug', 'Bug Report'),
        ('suggestion', 'Suggestion'),
        ('feature', 'Feature Request'),
        ('other', 'Other'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
        ('wont_fix', "Won't Fix"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports',
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='bug')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    admin_reply = models.TextField(blank=True, default='')
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_reports',
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_category_display()}] {self.title} ({self.status})"


# ══════════════════════════════════════════════
#  FEATURE FLAGS
# ══════════════════════════════════════════════

class FeatureFlag(models.Model):
    """Dynamic feature toggles for the platform."""

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, default='')
    is_enabled = models.BooleanField(default=False)
    rollout_percentage = models.IntegerField(
        default=100,
        help_text="Percentage of users who see this feature (0-100)",
    )
    enable_for_premium_only = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        status = '✅' if self.is_enabled else '❌'
        return f"{status} {self.name}"


# ══════════════════════════════════════════════
#  ACTIVITY LOGS
# ══════════════════════════════════════════════

class ActivityLog(models.Model):
    """Audit trail for admin and user actions."""

    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('login_failed', 'Login Failed'),
        ('user_banned', 'User Banned'),
        ('user_upgraded', 'User Upgraded'),
        ('user_deleted', 'User Deleted'),
        ('settings_changed', 'Settings Changed'),
        ('announcement_created', 'Announcement Created'),
        ('report_resolved', 'Report Resolved'),
        ('feature_toggled', 'Feature Toggled'),
        ('export_data', 'Data Exported'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES, default='other')
    description = models.TextField(blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        user_str = self.user.username if self.user else 'System'
        return f"{self.created_at:%Y-%m-%d %H:%M} | {user_str} | {self.get_action_display()}"


# ══════════════════════════════════════════════
#  SYSTEM HEALTH
# ══════════════════════════════════════════════

class SystemHealthSnapshot(models.Model):
    """Periodic system health snapshots."""

    cpu_usage = models.FloatField(default=0)
    memory_usage = models.FloatField(default=0)
    disk_usage = models.FloatField(default=0)
    active_sessions = models.IntegerField(default=0)
    db_response_ms = models.FloatField(default=0)
    api_response_ms = models.FloatField(default=0)
    error_count = models.IntegerField(default=0)
    uptime_seconds = models.BigIntegerField(default=0)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Health @ {self.created_at:%Y-%m-%d %H:%M} | CPU: {self.cpu_usage}% | MEM: {self.memory_usage}%"
