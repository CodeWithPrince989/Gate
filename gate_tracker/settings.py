"""
Django settings for gate_tracker project.

Production-ready with environment variables for Render deployment.
Falls back to development defaults when env vars are not set.
"""

import os
import sys
import hashlib
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured

load_dotenv()  # loads .env file (Supabase DATABASE_URL, etc.)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ── Environment ──
DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes')

BUILD_TIME_COMMANDS = {'collectstatic', 'migrate', 'makemigrations', 'showmigrations', 'test', 'check'}
is_build_time_command = len(sys.argv) > 1 and sys.argv[1] in BUILD_TIME_COMMANDS

def _derive_runtime_secret_key():
    """
    Derive a stable fallback secret from deployment-specific env.
    This keeps existing Render services bootable even if SECRET_KEY was never provisioned.
    """
    seed_parts = [
        os.environ.get('DATABASE_URL', ''),
        os.environ.get('RENDER_EXTERNAL_HOSTNAME', ''),
        os.environ.get('RENDER_SERVICE_ID', ''),
        os.environ.get('RENDER_PROJECT_ID', ''),
        os.environ.get('FRONTEND_URL', ''),
    ]
    seed = '|'.join(part for part in seed_parts if part)
    if not seed:
        return ''
    digest = hashlib.sha256(seed.encode('utf-8')).hexdigest()
    return f'render-derived-{digest}'

SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = 'dev-only-secret-key-not-for-production'
    elif is_build_time_command:
        SECRET_KEY = 'render-build-only-secret-key'
    else:
        SECRET_KEY = _derive_runtime_secret_key()
        if not SECRET_KEY:
            raise ImproperlyConfigured('SECRET_KEY must be set when DEBUG is False')

def _split_env_list(value):
    return [item.strip() for item in value.split(',') if item.strip()]


default_allowed_hosts = [
    'localhost',
    '127.0.0.1',
    '[::1]',
    'testserver',
    '.onrender.com',
    '.render.com',
]
ALLOWED_HOSTS = default_allowed_hosts + _split_env_list(os.environ.get('ALLOWED_HOSTS', ''))

# Render can expose multiple hostnames depending on request path and proxy layer.
for render_host in (
    os.environ.get('RENDER_EXTERNAL_HOSTNAME', ''),
    os.environ.get('RENDER_INTERNAL_HOSTNAME', ''),
):
    if render_host:
        ALLOWED_HOSTS.append(render_host.strip())

ALLOWED_HOSTS = list(dict.fromkeys(ALLOWED_HOSTS))

# Frontend URL for OAuth redirects and CORS/CSRF configuration.
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'corsheaders',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.github',
    'tracker',
    'admin_panel',
]

SITE_ID = 1

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'gate_tracker.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'gate_tracker.wsgi.application'


# ── Database ──
# Uses DATABASE_URL env var in production (Render provides this for PostgreSQL).
# Falls back to SQLite for local development.
DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600,
    )
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True


# ── Static Files ──
STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

# WhiteNoise compression (lenient — no manifest crash on missing .map files)
STORAGES = {
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ── CORS ──
# In production, set CORS_ALLOWED_ORIGINS env var (comma-separated).
# Example: https://gate-tracker.vercel.app
_cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if _cors_origins:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(',') if o.strip()]
    CORS_ALLOW_ALL_ORIGINS = False
elif DEBUG:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = [FRONTEND_URL]
    CORS_ALLOW_ALL_ORIGINS = False

CORS_ALLOW_CREDENTIALS = True

# ── CSRF ──
CSRF_TRUSTED_ORIGINS = _split_env_list(os.environ.get('CSRF_TRUSTED_ORIGINS', ''))

# ── Cross-origin session cookies (Vercel → Render) ──
# SameSite=None + Secure is required for cross-site cookies
SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = 'None'
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Trust proxy protocol headers, but avoid trusting forwarded hostnames by default.
# Some platforms send internal X-Forwarded-Host values for health checks, which can
# trigger DisallowedHost even when the public Host header is correct.
USE_X_FORWARDED_HOST = os.environ.get('USE_X_FORWARDED_HOST', 'False').lower() in ('true', '1', 'yes')


# ── OAuth / django-allauth ──
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': os.environ.get('GOOGLE_CLIENT_ID', ''),
            'secret': os.environ.get('GOOGLE_CLIENT_SECRET', ''),
        },
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
    },
    'github': {
        'APP': {
            'client_id': os.environ.get('GITHUB_CLIENT_ID', ''),
            'secret': os.environ.get('GITHUB_CLIENT_SECRET', ''),
        },
        'SCOPE': ['user:email'],
    },
}

# allauth config
ACCOUNT_LOGIN_METHODS = {'email'}
ACCOUNT_SIGNUP_FIELDS = ['email*', 'password1*', 'password2*']
ACCOUNT_EMAIL_VERIFICATION = 'none'
SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_LOGIN_ON_GET = True

# ── AI Assistant (Gemini) ──
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY', '')
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-1.5-flash')
GEMINI_API_VERSION = os.environ.get('GEMINI_API_VERSION', 'v1')

# ── Email / notifications ──
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', '').strip()
ADMINS = [('Admin', ADMIN_EMAIL)] if ADMIN_EMAIL else []
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', ADMIN_EMAIL or 'no-reply@gatetracker.local')
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'localhost')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '25'))
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'False').lower() in ('true', '1', 'yes')
EMAIL_USE_SSL = os.environ.get('EMAIL_USE_SSL', 'False').lower() in ('true', '1', 'yes')
