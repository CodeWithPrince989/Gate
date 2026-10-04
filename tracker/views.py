"""
Views for the GATE Study Intelligence Tracker.

API endpoints (JSON) for React frontend + HTML template views + CSV export.
All data endpoints filter by request.user for per-user data isolation.
"""

import csv
import html
import json
import logging
import re
import secrets
from datetime import date, timedelta
from functools import lru_cache

import requests as http_requests
from django.conf import settings as django_settings
from django.core.mail import EmailMessage
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import F, Sum, Count
from django.http import HttpResponse, JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import render, redirect
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST
from functools import wraps

from .models import DailyStats, Feedback, StudySession, VlogPost

logger = logging.getLogger(__name__)

VISTRA_SYSTEM_PROMPT = """
You are Vistra AI, an intelligent study assistant for GATE Computer Science aspirants.

Purpose:
- Help students improve productivity, discipline, and conceptual understanding.

Responsibilities:
- Help create daily study plans.
- Suggest how to study specific GATE subjects.
- Identify weak subjects and give practical improvement strategies.
- Encourage consistency and revision.
- Give short explanations for CS topics.
- Motivate students when they lose consistency.

Behavior rules:
1. Keep answers concise and practical.
2. Focus on actionable study advice, not long theory.
3. Encourage solving previous year questions (PYQs).
4. Promote discipline, consistency, and revision.
5. Prefer structured responses (bullets, short steps, compact plans).
6. Do not include irrelevant information unrelated to GATE prep.
7. Never claim to replace teachers or coaching institutes.

GATE CSE subjects:
- Data Structures and Algorithms
- Operating Systems
- Database Management Systems
- Computer Networks
- Theory of Computation
- Compiler Design
- Computer Organization and Architecture
- Digital Logic
- Engineering Mathematics
- General Aptitude
""".strip()

VISTRA_PROMPT_TEMPLATE = (
    f"{VISTRA_SYSTEM_PROMPT}\n\n"
    "User request:\n{user_message}\n\n"
    "Respond as Vistra AI.\n"
    "Give a complete answer in one response.\n"
    "Do not stop after an introduction.\n"
    "For broad questions, provide 4-6 concise bullet points followed by a short action plan."
)

VISTRA_COMPLETION_PROMPT_TEMPLATE = (
    f"{VISTRA_SYSTEM_PROMPT}\n\n"
    "The previous answer was incomplete.\n"
    "User request:\n{user_message}\n\n"
    "Incomplete draft:\n{draft_reply}\n\n"
    "Write the full final answer from scratch.\n"
    "Do not repeat that it was incomplete.\n"
    "Return one complete response with practical bullet points and a short action plan."
)


def login_required_api(view_func):
    """Decorator: returns 401 JSON for unauthenticated API requests."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper


@ensure_csrf_cookie
def api_csrf(request):
    """Issue a CSRF cookie and return the matching token for the SPA."""
    return JsonResponse({'csrfToken': get_token(request)})


@lru_cache(maxsize=1)
def _get_gemini_client():
    """Create and cache a Gemini client from environment-backed Django settings."""
    api_key = getattr(django_settings, 'GEMINI_API_KEY', '') or getattr(django_settings, 'GOOGLE_API_KEY', '')
    if not api_key:
        raise RuntimeError('GEMINI_API_KEY is not configured')

    try:
        from google import genai
    except ImportError as exc:
        raise RuntimeError('google-genai is not installed') from exc

    api_version = getattr(django_settings, 'GEMINI_API_VERSION', 'v1')
    return genai.Client(api_key=api_key, http_options={'api_version': api_version})


def _generate_gemini_reply(user_message):
    """Generate a text reply from Gemini without risking app startup failures."""
    try:
        from google.genai import types
    except ImportError as exc:
        raise RuntimeError('google-genai is not installed') from exc

    client = _get_gemini_client()
    model_name = getattr(django_settings, 'GEMINI_MODEL', 'gemini-1.5-flash')
    response = client.models.generate_content(
        model=model_name,
        contents=VISTRA_PROMPT_TEMPLATE.format(user_message=user_message),
        config=types.GenerateContentConfig(
            temperature=0.35,
            max_output_tokens=1200,
        ),
    )
    reply = _extract_gemini_text(response)
    if _looks_incomplete(reply):
        follow_up = client.models.generate_content(
            model=model_name,
            contents=VISTRA_COMPLETION_PROMPT_TEMPLATE.format(
                user_message=user_message,
                draft_reply=reply or "(empty draft)",
            ),
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=1200,
            ),
        )
        completed_reply = _extract_gemini_text(follow_up)
        if completed_reply:
            reply = completed_reply
    if not reply:
        raise RuntimeError('Gemini returned an empty response')
    return reply


def _extract_gemini_text(response):
    """Normalize text extraction across Gemini SDK response shapes."""
    reply = (getattr(response, 'text', '') or '').strip()
    if not reply:
        candidates = getattr(response, 'candidates', []) or []
        parts = []
        for candidate in candidates:
            content = getattr(candidate, 'content', None)
            for part in getattr(content, 'parts', []) or []:
                text = getattr(part, 'text', '')
                if text:
                    parts.append(text)
        reply = '\n'.join(parts).strip()
    return reply


def _looks_incomplete(reply):
    """Heuristic for visibly cut-off assistant responses."""
    if not reply:
        return True

    normalized = reply.strip()
    if len(normalized) < 140:
        return True

    incomplete_endings = (':', ',', ';', ' and', ' or', ' but', ' because', ' so', ' that')
    lower = normalized.lower()
    if lower.endswith(incomplete_endings):
        return True

    if normalized.count('\n') == 0 and normalized.count('. ') < 2:
        return True

    return False


def _gemini_status():
    """Report non-secret Gemini configuration status for debugging."""
    api_key = getattr(django_settings, 'GEMINI_API_KEY', '') or getattr(django_settings, 'GOOGLE_API_KEY', '')
    model_name = getattr(django_settings, 'GEMINI_MODEL', 'gemini-1.5-flash')
    api_version = getattr(django_settings, 'GEMINI_API_VERSION', 'v1')

    try:
        import google.genai  # noqa: F401
        sdk_installed = True
    except ImportError:
        sdk_installed = False

    return {
        'configured': bool(api_key),
        'sdk_installed': sdk_installed,
        'model': model_name,
        'api_version': api_version,
    }


# ══════════════════════════════════════════════
#  AUTH API ENDPOINTS
# ══════════════════════════════════════════════

def api_register(request):
    """Register a new user with username, email, password."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return JsonResponse({'error': 'Username and password required'}, status=400)

    if len(username) > 150:
        return JsonResponse({'error': 'Username is too long'}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({'error': 'Username already taken'}, status=409)
        
    if email and User.objects.filter(email=email).exists():
        return JsonResponse({'error': 'Email is already registered'}, status=409)

    try:
        user = User.objects.create_user(username=username, email=email, password=password)
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        return JsonResponse({
            'status': 'ok',
            'user': {'id': user.id, 'username': user.username, 'email': user.email}
        })
    except Exception as e:
        logger.error(f"Registration exception: {e}")
        return JsonResponse({'error': 'Registration failed due to invalid data format'}, status=400)


def api_login(request):
    """Log in with username and password."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    username = data.get('username', '')
    password = data.get('password', '')
    
    if not username or not password:
        return JsonResponse({'error': 'Username and password required'}, status=400)

    try:
        user = authenticate(request, username=username, password=password)
        if user is None:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)

        login(request, user)
        return JsonResponse({
            'status': 'ok',
            'user': {'id': user.id, 'username': user.username, 'email': user.email}
        })
    except Exception as e:
        logger.error(f"Login exception: {e}")
        return JsonResponse({'error': 'An internal error occurred during login'}, status=500)

@require_POST
def api_logout(request):
    """Log out the current user."""
    logout(request)
    return JsonResponse({'status': 'ok'})


def api_check_auth(request):
    """Check if user is authenticated."""
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
            }
        })
    return JsonResponse({'authenticated': False})


# ══════════════════════════════════════════════
#  OAUTH ENDPOINTS (Google & GitHub)
# ══════════════════════════════════════════════

def oauth_google_start(request):
    """Redirect browser to Google OAuth consent screen."""
    from urllib.parse import urlencode
    client_id = django_settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id']
    backend_url = request.build_absolute_uri('/')[:-1]  # e.g. https://x-gate.onrender.com
    redirect_uri = f"{backend_url}/api/auth/google/callback/"
    state = secrets.token_urlsafe(32)
    request.session['oauth_google_state'] = state
    params = urlencode({
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'access_type': 'online',
        'prompt': 'select_account',
        'state': state,
    })
    return redirect(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


def oauth_google_callback(request):
    """Exchange Google auth code for tokens, create/login user, redirect to frontend."""
    from urllib.parse import urlencode
    state = request.GET.get('state', '')
    expected_state = request.session.pop('oauth_google_state', '')
    if not state or not expected_state or not secrets.compare_digest(state, expected_state):
        return redirect(f"{django_settings.FRONTEND_URL}/?error=invalid_state")

    code = request.GET.get('code')
    if not code:
        return redirect(f"{django_settings.FRONTEND_URL}/?error=no_code")

    backend_url = request.build_absolute_uri('/')[:-1]
    redirect_uri = f"{backend_url}/api/auth/google/callback/"
    provider = django_settings.SOCIALACCOUNT_PROVIDERS['google']['APP']

    # Exchange code for tokens
    token_resp = http_requests.post('https://oauth2.googleapis.com/token', data={
        'code': code,
        'client_id': provider['client_id'],
        'client_secret': provider['secret'],
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code',
    })
    if token_resp.status_code != 200:
        return redirect(f"{django_settings.FRONTEND_URL}/?error=token_exchange_failed")

    access_token = token_resp.json().get('access_token')

    # Fetch user info
    user_resp = http_requests.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        headers={'Authorization': f'Bearer {access_token}'},
    )
    if user_resp.status_code != 200:
        return redirect(f"{django_settings.FRONTEND_URL}/?error=userinfo_failed")

    info = user_resp.json()
    email = info.get('email', '')
    name = info.get('name', '')
    if not email or not info.get('verified_email', False):
        return redirect(f"{django_settings.FRONTEND_URL}/?error=unverified_email")

    # Find or create user
    user = User.objects.filter(email=email).first()
    if not user:
        username = email.split('@')[0]
        # Ensure unique username
        base = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{counter}"
            counter += 1
        user = User.objects.create_user(username=username, email=email, password=None)
        user.first_name = name
        user.save()

    login(request, user, backend='django.contrib.auth.backends.ModelBackend')

    # Redirect to frontend with user info as query params
    params = urlencode({
        'oauth': 'success',
        'id': user.id,
        'username': user.username,
        'email': user.email,
    })
    return redirect(f"{django_settings.FRONTEND_URL}/oauth/callback?{params}")


def oauth_github_start(request):
    """Redirect browser to GitHub OAuth authorization page."""
    from urllib.parse import urlencode
    client_id = django_settings.SOCIALACCOUNT_PROVIDERS['github']['APP']['client_id']
    backend_url = request.build_absolute_uri('/')[:-1]
    redirect_uri = f"{backend_url}/api/auth/github/callback/"
    state = secrets.token_urlsafe(32)
    request.session['oauth_github_state'] = state
    params = urlencode({
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'scope': 'user:email',
        'state': state,
    })
    return redirect(f"https://github.com/login/oauth/authorize?{params}")


def oauth_github_callback(request):
    """Exchange GitHub auth code for tokens, create/login user, redirect to frontend."""
    from urllib.parse import urlencode
    state = request.GET.get('state', '')
    expected_state = request.session.pop('oauth_github_state', '')
    if not state or not expected_state or not secrets.compare_digest(state, expected_state):
        return redirect(f"{django_settings.FRONTEND_URL}/?error=invalid_state")

    code = request.GET.get('code')
    if not code:
        return redirect(f"{django_settings.FRONTEND_URL}/?error=no_code")

    backend_url = request.build_absolute_uri('/')[:-1]
    redirect_uri = f"{backend_url}/api/auth/github/callback/"
    provider = django_settings.SOCIALACCOUNT_PROVIDERS['github']['APP']

    # Exchange code for access token
    token_resp = http_requests.post(
        'https://github.com/login/oauth/access_token',
        headers={'Accept': 'application/json'},
        data={
            'client_id': provider['client_id'],
            'client_secret': provider['secret'],
            'code': code,
            'redirect_uri': redirect_uri,
        },
    )
    if token_resp.status_code != 200:
        return redirect(f"{django_settings.FRONTEND_URL}/?error=token_exchange_failed")

    access_token = token_resp.json().get('access_token')
    if not access_token:
        return redirect(f"{django_settings.FRONTEND_URL}/?error=no_access_token")

    # Fetch user info
    user_resp = http_requests.get(
        'https://api.github.com/user',
        headers={'Authorization': f'Bearer {access_token}'},
    )
    if user_resp.status_code != 200:
        return redirect(f"{django_settings.FRONTEND_URL}/?error=userinfo_failed")

    info = user_resp.json()
    gh_username = info.get('login', '')
    name = info.get('name', '') or gh_username

    # Fetch email (may be private)
    email_resp = http_requests.get(
        'https://api.github.com/user/emails',
        headers={'Authorization': f'Bearer {access_token}'},
    )
    email = ''
    if email_resp.status_code == 200:
        emails = email_resp.json()
        primary = next((e for e in emails if e.get('primary') and e.get('verified')), None)
        if primary:
            email = primary.get('email', '')
        else:
            verified = next((e for e in emails if e.get('verified')), None)
            if verified:
                email = verified.get('email', '')

    # Find or create user
    user = None
    if email:
        user = User.objects.filter(email=email).first()
    if not user:
        user = User.objects.filter(username=gh_username).first()
    if not user:
        username = gh_username
        base = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{counter}"
            counter += 1
        user = User.objects.create_user(username=username, email=email, password=None)
        user.first_name = name
        user.save()

    login(request, user, backend='django.contrib.auth.backends.ModelBackend')

    params = urlencode({
        'oauth': 'success',
        'id': user.id,
        'username': user.username,
        'email': user.email,
    })
    return redirect(f"{django_settings.FRONTEND_URL}/oauth/callback?{params}")


# ══════════════════════════════════════════════
#  MULTI-WEEK PROGRESS
# ══════════════════════════════════════════════

@login_required_api
def api_multi_week_progress(request):
    """
    JSON: Last 8 weeks of study data for histogram + trends.
    Each week has total hours, questions, sessions, subject breakdown.
    Includes week-over-week changes and motivational alerts.
    """
    user = request.user
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    start_of_8_weeks = monday - timedelta(weeks=7)

    # Pre-fetch and group stats
    all_stats = DailyStats.objects.filter(user=user, date__gte=start_of_8_weeks, date__lte=today)
    stats_by_week = {w: [] for w in range(8)}
    for stat in all_stats:
        w_index = (stat.date - start_of_8_weeks).days // 7
        if 0 <= w_index < 8:
            stats_by_week[w_index].append(stat)

    # Pre-fetch and group sessions
    all_sessions_raw = StudySession.objects.filter(user=user, date__gte=start_of_8_weeks, date__lte=today).values('date', 'subject', 'duration_minutes')
    sessions_by_week = {w: {'count': 0, 'subjects': {}} for w in range(8)}
    for s in all_sessions_raw:
        w_index = (s['date'] - start_of_8_weeks).days // 7
        if 0 <= w_index < 8:
            sessions_by_week[w_index]['count'] += 1
            subj = s['subject']
            sessions_by_week[w_index]['subjects'][subj] = sessions_by_week[w_index]['subjects'].get(subj, 0) + s['duration_minutes']

    weeks = []
    
    for w in range(8):
        wk_start = start_of_8_weeks + timedelta(weeks=w)
        wk_end = wk_start + timedelta(days=6)
        
        w_stats = stats_by_week[w]
        total_mins = sum(s.total_study_time for s in w_stats)
        total_q = sum(s.total_questions for s in w_stats)
        total_lec = sum(s.total_lectures for s in w_stats)
        days_studied = sum(1 for s in w_stats if s.total_study_time > 0)
        
        best_day = max(w_stats, key=lambda s: s.total_study_time, default=None) if w_stats else None
        
        w_sessions = sessions_by_week[w]
        session_count = w_sessions['count']
        
        # Subject breakdown
        subj_list = [{'subject': k, 'total': v} for k, v in w_sessions['subjects'].items()]
        subj_list.sort(key=lambda x: x['total'], reverse=True)
        subj_list = subj_list[:5]
        
        subject_breakdown = [
            {'subject': SUBJECT_MAP.get(s['subject'], s['subject']),
             'hours': round(s['total'] / 60, 2)}
            for s in subj_list
        ]

        weeks.append({
            'week_label': f"{wk_start.strftime('%b %d')}",
            'week_range': f"{wk_start.strftime('%b %d')} – {wk_end.strftime('%b %d')}",
            'hours': round(total_mins / 60, 2),
            'questions': total_q,
            'lectures': total_lec,
            'sessions': session_count,
            'days_studied': days_studied,
            'subject_breakdown': subject_breakdown,
            'best_day_hours': round((best_day.total_study_time / 60), 1) if best_day else 0,
            'best_day_date': str(best_day.date) if best_day else None,
            'is_current': w == 7,
        })

    # Week-over-week analysis
    alerts = []
    for i in range(1, len(weeks)):
        prev_h = weeks[i - 1]['hours']
        curr_h = weeks[i]['hours']
        if prev_h > 0 and curr_h < prev_h:
            drop_pct = round(((prev_h - curr_h) / prev_h) * 100)
            if drop_pct > 30:
                alerts.append({
                    'week': weeks[i]['week_label'],
                    'type': 'critical',
                    'message': f"⚠️ {drop_pct}% drop in study hours!",
                    'suggestion': "Try setting a daily 2-hour minimum goal.",
                })
            elif drop_pct > 10:
                alerts.append({
                    'week': weeks[i]['week_label'],
                    'type': 'warning',
                    'message': f"📉 {drop_pct}% decrease from previous week.",
                    'suggestion': "Stay consistent — small sessions add up!",
                })
        elif curr_h > prev_h and prev_h > 0:
            gain_pct = round(((curr_h - prev_h) / prev_h) * 100)
            if gain_pct > 20:
                alerts.append({
                    'week': weeks[i]['week_label'],
                    'type': 'success',
                    'message': f"🚀 {gain_pct}% increase! Great momentum!",
                    'suggestion': "Keep this pace — you're on fire!",
                })

    # Consistency score (avg days studied per week)
    total_days = sum(w['days_studied'] for w in weeks)
    consistency = round((total_days / (len(weeks) * 7)) * 100)

    # Total across all weeks
    total_hours = sum(w['hours'] for w in weeks)
    total_questions = sum(w['questions'] for w in weeks)
    avg_weekly = round(total_hours / max(len([w for w in weeks if w['hours'] > 0]), 1), 1)

    return JsonResponse({
        'weeks': weeks,
        'alerts': alerts,
        'consistency_score': min(consistency, 100),
        'total_hours': round(total_hours, 1),
        'total_questions': total_questions,
        'avg_weekly_hours': avg_weekly,
    })

# ══════════════════════════════════════════════
#  VLOG / JOURNEY ENDPOINTS
# ══════════════════════════════════════════════

def api_get_vlogs(request):
    """JSON: List all vlog posts, public read access."""
    vlogs = VlogPost.objects.all()
    data = []
    for v in vlogs:
        data.append({
            'id': v.id,
            'title': _sanitize_text(v.title),
            'content': _sanitize_text(v.content),
            'date': str(v.date),
            'youtube_url': v.youtube_url,
            'author': v.user.username,
            'created_at': v.created_at.isoformat(),
        })
    return JsonResponse(data, safe=False)


def _sanitize_text(text):
    """Strip HTML tags and escape special characters to prevent XSS."""
    # Remove all HTML tags
    clean = re.sub(r'<[^>]+>', '', text)
    # Collapse any leftover angle brackets
    clean = clean.replace('<', '&lt;').replace('>', '&gt;')
    # Unescape so stored text is plain (React auto-escapes on render)
    clean = html.unescape(clean)
    # Strip any remaining dangerous patterns
    clean = re.sub(r'(?i)javascript\s*:', '', clean)
    clean = re.sub(r'(?i)on\w+\s*=', '', clean)
    return clean.strip()


@login_required_api
def api_create_vlog(request):
    """JSON: Create a new vlog post (requires login)."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    
    raw_title = data.get('title', '').strip()
    raw_content = data.get('content', '').strip()
    youtube_url = data.get('youtube_url', '').strip() or None

    if not raw_title or not raw_content:
        return JsonResponse({'error': 'Title and content are required'}, status=400)

    # Sanitize inputs to prevent XSS / HTML injection
    title = _sanitize_text(raw_title)
    content = _sanitize_text(raw_content)

    if not title or not content:
        return JsonResponse({'error': 'Invalid content detected. Please use plain text only.'}, status=400)

    # Validate YouTube URL format if provided
    if youtube_url:
        yt_pattern = re.compile(r'^https?://(www\.)?(youtube\.com|youtu\.be)/')
        if not yt_pattern.match(youtube_url):
            return JsonResponse({'error': 'Invalid YouTube URL format'}, status=400)

    try:
        post = VlogPost.objects.create(
            user=request.user,
            title=title,
            content=content,
            youtube_url=youtube_url
        )
        return JsonResponse({'status': 'ok', 'id': post.id})
    except Exception as e:
        logger.error(f"Failed to create vlog post: {e}")
        return JsonResponse({'error': 'Failed to create vlog entry'}, status=500)


@login_required_api
@require_POST
def api_delete_vlog(request, vlog_id):
    """JSON: Delete a vlog post (owner or staff only)."""
    try:
        post = VlogPost.objects.get(id=vlog_id)
    except VlogPost.DoesNotExist:
        return JsonResponse({'error': 'Vlog not found'}, status=404)

    # Only the author or staff can delete
    if post.user != request.user and not request.user.is_staff:
        return JsonResponse({'error': 'Permission denied'}, status=403)

    post.delete()
    return JsonResponse({'status': 'ok'})


# ──────────────────────────────────────────────

SUBJECT_MAP = dict(StudySession.SUBJECT_CHOICES)


def _calculate_streak(user):
    """Calculate current and longest consecutive-day study streaks for a user."""
    dates_with_sessions = (
        StudySession.objects.filter(user=user)
        .values_list('date', flat=True)
        .distinct()
        .order_by('-date')
    )
    dates_set = set(dates_with_sessions)

    # Current streak: count back from today
    current_streak = 0
    day = date.today()
    while day in dates_set:
        current_streak += 1
        day -= timedelta(days=1)

    # Longest streak
    if not dates_set:
        return 0, 0
    sorted_dates = sorted(dates_set)
    longest = 1
    run = 1
    for i in range(1, len(sorted_dates)):
        if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
            run += 1
            longest = max(longest, run)
        else:
            run = 1

    return current_streak, longest


def _session_to_dict(s):
    """Serialize a StudySession to a dictionary."""
    return {
        'id': s.id,
        'date': str(s.date),
        'subject': s.subject,
        'subject_display': SUBJECT_MAP.get(s.subject, s.subject),
        'study_type': s.study_type,
        'duration_minutes': s.duration_minutes,
        'questions_solved': s.questions_solved,
        'lecture_minutes': s.lecture_minutes,
        'notes_created': s.notes_created,
        'created_at': s.created_at.isoformat() if s.created_at else None,
    }


# ══════════════════════════════════════════════
#  JSON API ENDPOINTS (for React frontend)
# ══════════════════════════════════════════════

@login_required_api
def api_dashboard(request):
    """JSON: today's stats + streaks + recent sessions."""
    user = request.user
    today = date.today()
    today_sessions = StudySession.objects.filter(user=user, date=today)

    today_hours = (today_sessions.aggregate(s=Sum('duration_minutes'))['s'] or 0) / 60
    today_questions = today_sessions.aggregate(q=Sum('questions_solved'))['q'] or 0
    today_lectures = today_sessions.aggregate(l=Sum('lecture_minutes'))['l'] or 0

    current_streak, longest_streak = _calculate_streak(user)
    recent = [_session_to_dict(s) for s in StudySession.objects.filter(user=user)[:5]]

    return JsonResponse({
        'today_hours': round(today_hours, 2),
        'today_questions': today_questions,
        'today_lectures': today_lectures,
        'current_streak': current_streak,
        'longest_streak': longest_streak,
        'recent_sessions': recent,
        'total_sessions': StudySession.objects.filter(user=user).count(),
    })


@login_required_api
def api_analytics(request):
    """JSON: analytics summary stats."""
    user = request.user
    total_days = DailyStats.objects.filter(user=user).count()
    avg_daily = 0
    if total_days:
        total_mins = DailyStats.objects.filter(user=user).aggregate(s=Sum('total_study_time'))['s'] or 0
        avg_daily = round((total_mins / total_days) / 60, 2)

    subject_agg = (
        StudySession.objects.filter(user=user)
        .values('subject')
        .annotate(total=Sum('duration_minutes'))
        .order_by('-total')
    )
    most_studied = subject_agg.first()
    least_studied = subject_agg.last()

    most_name = SUBJECT_MAP.get(most_studied['subject'], '—') if most_studied else '—'
    least_name = SUBJECT_MAP.get(least_studied['subject'], '—') if least_studied else '—'

    current_streak, longest_streak = _calculate_streak(user)

    return JsonResponse({
        'avg_daily_hours': avg_daily,
        'most_studied': most_name,
        'least_studied': least_name,
        'current_streak': current_streak,
        'longest_streak': longest_streak,
    })


@login_required_api
def api_chart_data(request):
    """JSON: chart data for Chart.js (daily hours, questions, subjects, types)."""
    user = request.user
    fourteen_days_ago = date.today() - timedelta(days=13)
    daily = DailyStats.objects.filter(user=user, date__gte=fourteen_days_ago).order_by('date')

    daily_labels = [d.date.strftime('%b %d') for d in daily]
    daily_hours = [round(d.total_study_time / 60, 2) for d in daily]
    daily_questions = [d.total_questions for d in daily]

    # Subject distribution
    subject_dist = (
        StudySession.objects.filter(user=user)
        .values('subject')
        .annotate(total=Sum('duration_minutes'))
        .order_by('-total')
    )
    subject_labels = [SUBJECT_MAP.get(s['subject'], s['subject']) for s in subject_dist]
    subject_values = [round(s['total'] / 60, 2) for s in subject_dist]

    # Type comparison
    types = ['Lecture', 'Practice', 'Theory', 'Revision']
    type_agg = StudySession.objects.filter(user=user, study_type__in=types).values('study_type').annotate(t=Sum('duration_minutes'))
    type_dict = {item['study_type']: item['t'] or 0 for item in type_agg}
    type_totals = [round(type_dict.get(t, 0) / 60, 2) for t in types]

    return JsonResponse({
        'daily_labels': daily_labels,
        'daily_hours': daily_hours,
        'daily_questions': daily_questions,
        'subject_labels': subject_labels,
        'subject_values': subject_values,
        'type_labels': ['Lecture', 'Practice', 'Theory', 'Revision'],
        'type_values': type_totals,
    })


@login_required_api
def api_history(request):
    """JSON: filtered list of study sessions."""
    user = request.user
    sessions = StudySession.objects.filter(user=user)

    subject = request.GET.get('subject')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    search = request.GET.get('search')

    if subject:
        sessions = sessions.filter(subject=subject)
    if date_from:
        sessions = sessions.filter(date__gte=date_from)
    if date_to:
        sessions = sessions.filter(date__lte=date_to)
    if search:
        sessions = sessions.filter(subject__icontains=search)

    return JsonResponse([_session_to_dict(s) for s in sessions[:200]], safe=False)


@login_required_api
def api_heatmap(request):
    """JSON: {date_string: total_minutes} for the last 365 days."""
    user = request.user
    one_year_ago = date.today() - timedelta(days=364)
    daily = DailyStats.objects.filter(user=user, date__gte=one_year_ago).order_by('date')
    data = {str(d.date): round(d.total_study_time, 1) for d in daily}
    return JsonResponse(data)


@login_required_api
def api_weekly_progress(request):
    """
    JSON: day-by-day breakdown for this week + comparison with last week.
    Returns daily hours, questions, sessions for Mon–Sun of current week,
    plus totals for this week and last week for comparison.
    """
    user = request.user
    today = date.today()
    # Monday of this week
    monday = today - timedelta(days=today.weekday())
    last_monday = monday - timedelta(days=7)

    # Pre-fetch data for the week to avoid N+1 queries
    week_end = monday + timedelta(days=6)
    week_stats = DailyStats.objects.filter(user=user, date__gte=monday, date__lte=week_end)
    stats_dict = {s.date: s for s in week_stats}
    
    week_sessions_agg = StudySession.objects.filter(user=user, date__gte=monday, date__lte=week_end).values('date').annotate(count=Count('id'))
    sessions_dict = {s['date']: s['count'] for s in week_sessions_agg}

    days = []
    for i in range(7):
        d = monday + timedelta(days=i)
        stats = stats_dict.get(d)
        sessions_count = sessions_dict.get(d, 0)
        days.append({
            'date': str(d),
            'day': d.strftime('%a'),
            'hours': round((stats.total_study_time if stats else 0) / 60, 2),
            'questions': stats.total_questions if stats else 0,
            'lectures': stats.total_lectures if stats else 0,
            'sessions': sessions_count,
            'is_today': d == today,
            'is_future': d > today,
        })

    # This week totals calculated from pre-fetched stats to save queries
    valid_this_week_stats = [s for s in week_stats if s.date <= today]
    this_week_mins = sum(s.total_study_time for s in valid_this_week_stats)
    this_week_q = sum(s.total_questions for s in valid_this_week_stats)

    # Last week totals
    last_week_mins = DailyStats.objects.filter(
        user=user, date__gte=last_monday, date__lt=monday
    ).aggregate(t=Sum('total_study_time'))['t'] or 0
    last_week_q = DailyStats.objects.filter(
        user=user, date__gte=last_monday, date__lt=monday
    ).aggregate(q=Sum('total_questions'))['q'] or 0

    return JsonResponse({
        'days': days,
        'this_week_hours': round(this_week_mins / 60, 2),
        'this_week_questions': this_week_q,
        'last_week_hours': round(last_week_mins / 60, 2),
        'last_week_questions': last_week_q,
        'week_label': f"{monday.strftime('%b %d')} – {(monday + timedelta(days=6)).strftime('%b %d')}",
    })


@login_required_api
def api_growth_tree(request):
    """
    JSON: study tree growth data. The tree grows stages based on total study hours.
    Stage 0: seed (0 hrs), Stage 1: sprout (1 hr), Stage 2: sapling (5 hrs),
    Stage 3: young tree (15 hrs), Stage 4: mature tree (40 hrs),
    Stage 5: grand tree (100 hrs), Stage 6: legendary (200+ hrs).
    """
    user = request.user
    total_mins = StudySession.objects.filter(user=user).aggregate(t=Sum('duration_minutes'))['t'] or 0
    total_hours = total_mins / 60

    # Today's contribution
    today_mins = StudySession.objects.filter(user=user, date=date.today()).aggregate(
        t=Sum('duration_minutes'))['t'] or 0

    stages = [
        (0, 'Seed', 'Your journey begins here.'),
        (1, 'Sprout', 'The first signs of growth!'),
        (5, 'Sapling', 'Taking root, getting stronger.'),
        (15, 'Young Tree', 'Branches reaching for the sky.'),
        (40, 'Mature Tree', 'Strong and steady — keep going!'),
        (100, 'Grand Tree', 'A towering achievement!'),
        (200, 'Legendary Oak', 'You are unstoppable. 🏆'),
    ]

    current_stage = 0
    for i, (threshold, _, _) in enumerate(stages):
        if total_hours >= threshold:
            current_stage = i

    # Progress to next stage
    next_threshold = stages[min(current_stage + 1, len(stages) - 1)][0]
    curr_threshold = stages[current_stage][0]
    if next_threshold > curr_threshold:
        progress = min((total_hours - curr_threshold) / (next_threshold - curr_threshold), 1.0)
    else:
        progress = 1.0

    return JsonResponse({
        'total_hours': round(total_hours, 1),
        'today_hours': round(today_mins / 60, 2),
        'stage': current_stage,
        'stage_name': stages[current_stage][1],
        'stage_message': stages[current_stage][2],
        'next_stage_name': stages[min(current_stage + 1, len(stages) - 1)][1],
        'next_stage_hours': next_threshold,
        'progress_to_next': round(progress, 3),
        'total_stages': len(stages),
    })


# ══════════════════════════════════════════════
#  VISTRA AI ASSISTANT (POST)
# ══════════════════════════════════════════════

@require_POST
@login_required_api
def api_assistant_chat(request):
    """Proxy chat requests to Gemini using a server-side API key."""
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    user_message = (data.get('message') or '').strip()
    if not user_message:
        return JsonResponse({'error': 'Message is required'}, status=400)

    try:
        reply = _generate_gemini_reply(user_message)
    except RuntimeError as exc:
        logger.warning('Gemini configuration error: %s', exc)
        return JsonResponse({'error': str(exc)}, status=500)
    except Exception as exc:
        logger.exception('Gemini request failed')
        return JsonResponse({'error': f'Assistant request failed: {exc}'}, status=502)

    return JsonResponse({'reply': reply})


def api_health(request):
    """Lightweight health endpoint for Render/Vercel checks."""
    return JsonResponse({'status': 'ok'})


@login_required_api
def api_assistant_health(request):
    """Debug endpoint for assistant configuration and SDK availability."""
    status = _gemini_status()
    http_status = 200 if status['configured'] and status['sdk_installed'] else 503
    return JsonResponse(status, status=http_status)


# ══════════════════════════════════════════════
#  SAVE SESSION (POST)
# ══════════════════════════════════════════════

@require_POST
@login_required_api
def save_session(request):
    """Save a completed study session and update DailyStats."""
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    user = request.user
    duration_sec = float(data.get('duration_seconds', 0))
    duration_min = round(duration_sec / 60, 2)

    session = StudySession.objects.create(
        user=user,
        subject=data.get('subject', 'DSA'),
        study_type=data.get('study_type', 'Theory'),
        duration_minutes=duration_min,
        questions_solved=int(data.get('questions_solved', 0)),
        lecture_minutes=int(data.get('lecture_minutes', 0)),
        notes_created=data.get('notes_created', False),
    )

    # Update DailyStats for this user + date
    today = session.date
    stats, _ = DailyStats.objects.get_or_create(user=user, date=today)
    agg = StudySession.objects.filter(user=user, date=today).aggregate(
        total_time=Sum('duration_minutes'),
        total_q=Sum('questions_solved'),
        total_l=Sum('lecture_minutes'),
    )
    stats.total_study_time = agg['total_time'] or 0
    stats.total_questions = agg['total_q'] or 0
    stats.total_lectures = agg['total_l'] or 0
    stats.save()

    return JsonResponse({'status': 'ok', 'session_id': session.id})


# ══════════════════════════════════════════════
#  CSV EXPORT
# ══════════════════════════════════════════════

@login_required_api
def export_csv(request):
    """Stream all study sessions for the logged-in user as a downloadable CSV file."""
    user = request.user
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="gate_study_data.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Date', 'Subject', 'Study Type', 'Duration (min)',
        'Questions Solved', 'Lecture Minutes', 'Notes Created',
    ])

    for s in StudySession.objects.filter(user=user):
        writer.writerow([
            s.date, s.get_subject_display(), s.study_type,
            s.duration_minutes, s.questions_solved,
            s.lecture_minutes, s.notes_created,
        ])

    return response


# ══════════════════════════════════════════════
#  HTML TEMPLATE VIEWS (optional fallback)
# ══════════════════════════════════════════════

def dashboard(request):
    """HTML dashboard page."""
    user = request.user
    if not user.is_authenticated:
        return render(request, 'dashboard.html', {
            'today_hours': 0,
            'today_questions': 0,
            'today_lectures': 0,
            'current_streak': 0,
            'longest_streak': 0,
            'recent_sessions': [],
            'recent_feedback': [],
        })

    today = date.today()
    today_sessions = StudySession.objects.filter(user=user, date=today)

    today_hours = (today_sessions.aggregate(s=Sum('duration_minutes'))['s'] or 0) / 60
    today_questions = today_sessions.aggregate(q=Sum('questions_solved'))['q'] or 0
    today_lectures = today_sessions.aggregate(l=Sum('lecture_minutes'))['l'] or 0

    current_streak, longest_streak = _calculate_streak(user)
    recent = today_sessions[:5]

    return render(request, 'dashboard.html', {
        'today_hours': round(today_hours, 2),
        'today_questions': today_questions,
        'today_lectures': today_lectures,
        'current_streak': current_streak,
        'longest_streak': longest_streak,
        'recent_sessions': recent,
        'recent_feedback': Feedback.objects.order_by('-created_at')[:3],
    })


def _send_feedback_notification(feedback_entry):
    """Email the admin when new community feedback is submitted."""
    admin_email = getattr(django_settings, 'ADMIN_EMAIL', '').strip()
    if not admin_email:
        logger.warning('Feedback submitted but ADMIN_EMAIL is not configured.')
        return False

    submitted_at = timezone.localtime(feedback_entry.created_at).strftime('%Y-%m-%d %H:%M:%S %Z')
    subject = 'New community feedback submission'
    body = (
        'A new feedback submission was received.\n\n'
        f'Name: {feedback_entry.name or "Anonymous"}\n'
        f'Email: {feedback_entry.email or "Not provided"}\n'
        f'Submission time: {submitted_at}\n\n'
        'Message:\n'
        f'{feedback_entry.message}\n'
    )
    reply_to = [feedback_entry.email] if feedback_entry.email else None
    message = EmailMessage(
        subject=subject,
        body=body,
        from_email=getattr(django_settings, 'DEFAULT_FROM_EMAIL', None),
        to=[admin_email],
        reply_to=reply_to or None,
    )
    message.send(fail_silently=False)
    return True


def _feedback_payload(feedback_entry):
    """Serialize feedback records for JSON responses."""
    return {
        'id': feedback_entry.id,
        'name': feedback_entry.name or 'Anonymous',
        'email': feedback_entry.email,
        'message': feedback_entry.message,
        'created_at': timezone.localtime(feedback_entry.created_at).isoformat(),
        'upvotes': feedback_entry.upvotes,
    }


@login_required_api
def api_feedback_list(request):
    """Return recent community feedback entries."""
    recent_feedback = Feedback.objects.order_by('-created_at')[:12]
    return JsonResponse({'items': [_feedback_payload(item) for item in recent_feedback]})


@require_POST
@login_required_api
def api_feedback_submit(request):
    """Accept feedback submissions from the React frontend."""
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    message = (data.get('message') or '').strip()
    if not message:
        return JsonResponse({'error': 'Please share a feedback message before submitting.'}, status=400)

    entry = Feedback.objects.create(name=name, email=email, message=message)
    try:
        _send_feedback_notification(entry)
    except Exception:
        logger.exception('Failed to send feedback notification email for feedback_id=%s', entry.id)

    return JsonResponse({
        'status': 'ok',
        'message': 'Thanks for sharing your feedback.',
        'feedback': _feedback_payload(entry),
    })


def feedback(request):
    """Render and accept community feedback submissions."""
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        email = request.POST.get('email', '').strip()
        message = request.POST.get('message', '').strip()

        if not message:
            recent_feedback = Feedback.objects.order_by('-created_at')[:6]
            context = {
                'recent_feedback': recent_feedback,
                'form_values': {'name': name, 'email': email, 'message': message},
                'form_error': 'Please share a feedback message before submitting.',
            }
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'error': context['form_error']}, status=400)
            return render(request, 'feedback.html', context, status=400)

        entry = Feedback.objects.create(name=name, email=email, message=message)
        try:
            _send_feedback_notification(entry)
        except Exception:
            logger.exception('Failed to send feedback notification email for feedback_id=%s', entry.id)
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({
                'status': 'ok',
                'feedback_id': entry.id,
                'message': 'Thanks for sharing your feedback.',
            })
        return redirect(f"{request.path}?submitted=1")

    return render(request, 'feedback.html', {
        'submitted': request.GET.get('submitted') == '1',
        'recent_feedback': Feedback.objects.order_by('-created_at')[:6],
        'form_values': {'name': '', 'email': '', 'message': ''},
    })


@require_POST
def upvote_feedback(request, feedback_id):
    """Increment upvotes for a feedback idea."""
    updated = Feedback.objects.filter(id=feedback_id).update(upvotes=F('upvotes') + 1)
    if not updated:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'error': 'Feedback not found'}, status=404)
        return redirect('tracker:feedback')

    feedback_item = Feedback.objects.get(id=feedback_id)
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'status': 'ok', 'upvotes': feedback_item.upvotes})
    return redirect('tracker:feedback')


@require_POST
@login_required_api
def api_feedback_upvote(request, feedback_id):
    """Increment upvotes for feedback ideas from the React frontend."""
    updated = Feedback.objects.filter(id=feedback_id).update(upvotes=F('upvotes') + 1)
    if not updated:
        return JsonResponse({'error': 'Feedback not found'}, status=404)

    feedback_item = Feedback.objects.get(id=feedback_id)
    return JsonResponse({'status': 'ok', 'upvotes': feedback_item.upvotes})


def start_study(request):
    return render(request, 'start_study.html', {
        'subjects': StudySession.SUBJECT_CHOICES,
        'types': StudySession.TYPE_CHOICES,
    })


def analytics(request):
    user = request.user
    if user.is_authenticated:
        total_days = DailyStats.objects.filter(user=user).count()
        avg_daily = 0
        if total_days:
            total_mins = DailyStats.objects.filter(user=user).aggregate(s=Sum('total_study_time'))['s'] or 0
            avg_daily = round((total_mins / total_days) / 60, 2)

        subject_agg = (
            StudySession.objects.filter(user=user)
            .values('subject')
            .annotate(total=Sum('duration_minutes'))
            .order_by('-total')
        )
        most_studied = subject_agg.first()
        least_studied = subject_agg.last()
    else:
        avg_daily = 0
        most_studied = None
        least_studied = None

    return render(request, 'analytics.html', {
        'avg_daily_hours': avg_daily,
        'most_studied': dict(StudySession.SUBJECT_CHOICES).get(most_studied['subject'], '—') if most_studied else '—',
        'least_studied': dict(StudySession.SUBJECT_CHOICES).get(least_studied['subject'], '—') if least_studied else '—',
    })


def history(request):
    user = request.user
    sessions = StudySession.objects.filter(user=user) if user.is_authenticated else StudySession.objects.none()
    subject = request.GET.get('subject')
    if subject:
        sessions = sessions.filter(subject=subject)
    return render(request, 'history.html', {
        'sessions': sessions[:100],
        'subjects': StudySession.SUBJECT_CHOICES,
    })
