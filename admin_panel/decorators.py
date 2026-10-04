"""
Role-based access control decorators for the GateTracker Admin Panel.
"""

from functools import wraps

from django.http import JsonResponse
from django.shortcuts import redirect


def admin_required(view_func):
    """Require authenticated staff/superuser with an active admin profile."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('admin_panel:login')
        if not (request.user.is_staff or request.user.is_superuser):
            return redirect('admin_panel:login')
        return view_func(request, *args, **kwargs)
    return wrapper


def super_admin_required(view_func):
    """Require Super Admin role."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_superuser:
            return redirect('admin_panel:login')
        profile = getattr(request.user, 'admin_profile', None)
        if profile and not profile.is_super_admin:
            return redirect('admin_panel:dashboard')
        return view_func(request, *args, **kwargs)
    return wrapper


def moderator_required(view_func):
    """Require at least Moderator role."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_staff:
            return redirect('admin_panel:login')
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_api_required(view_func):
    """API decorator: returns 403 JSON for non-admin requests."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        if not (request.user.is_staff or request.user.is_superuser):
            return JsonResponse({'error': 'Admin access required'}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper
