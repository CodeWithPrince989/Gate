"""
Custom template tags and filters for the admin panel.
"""

from django import template
from django.utils import timezone

register = template.Library()


@register.filter
def subtract(value, arg):
    """Subtract arg from value."""
    try:
        return float(value) - float(arg)
    except (ValueError, TypeError):
        return 0


@register.filter
def percentage(value, total):
    """Calculate percentage."""
    try:
        if float(total) == 0:
            return 0
        return round((float(value) / float(total)) * 100, 1)
    except (ValueError, TypeError, ZeroDivisionError):
        return 0


@register.filter
def format_duration(minutes):
    """Format minutes into human-readable duration."""
    try:
        minutes = float(minutes)
        if minutes < 60:
            return f"{minutes:.0f}m"
        hours = minutes / 60
        if hours < 24:
            return f"{hours:.1f}h"
        days = hours / 24
        return f"{days:.1f}d"
    except (ValueError, TypeError):
        return "0m"


@register.filter
def time_ago(dt):
    """Human-readable relative time."""
    if not dt:
        return "Never"
    now = timezone.now()
    diff = now - dt
    seconds = diff.total_seconds()

    if seconds < 60:
        return "Just now"
    elif seconds < 3600:
        mins = int(seconds / 60)
        return f"{mins}m ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours}h ago"
    elif seconds < 604800:
        days = int(seconds / 86400)
        return f"{days}d ago"
    else:
        return dt.strftime('%b %d, %Y')


@register.filter
def status_color(status):
    """Map status to TailwindCSS color class."""
    colors = {
        'active': 'emerald',
        'expired': 'red',
        'cancelled': 'gray',
        'trial': 'blue',
        'pending': 'yellow',
        'open': 'blue',
        'in_progress': 'amber',
        'resolved': 'emerald',
        'closed': 'gray',
        'wont_fix': 'red',
        'info': 'blue',
        'warning': 'amber',
        'success': 'emerald',
        'critical': 'red',
        'bug': 'red',
        'suggestion': 'blue',
        'feature': 'purple',
        'other': 'gray',
        'low': 'gray',
        'medium': 'yellow',
        'high': 'orange',
    }
    return colors.get(status, 'gray')


@register.filter
def multiply(value, arg):
    """Multiply value by arg."""
    try:
        return float(value) * float(arg)
    except (ValueError, TypeError):
        return 0


@register.filter
def divide(value, arg):
    """Divide value by arg."""
    try:
        if float(arg) == 0:
            return 0
        return float(value) / float(arg)
    except (ValueError, TypeError, ZeroDivisionError):
        return 0
