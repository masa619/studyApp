from pathlib import Path
import os
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# セキュリティ設定
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')
MANIFEST_PATH = BASE_DIR / 'frontend' / 'dist' / 'manifest.json'
# データベース設定
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# アプリケーション設定
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'quiz', 
]

# CORS設定
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')

# JWT設定
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.environ.get('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', '5'))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.environ.get('JWT_REFRESH_TOKEN_LIFETIME_DAYS', '7'))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# リダイレクト設定
LOGIN_REDIRECT_URL = os.environ.get('LOGIN_REDIRECT_URL')
LOGOUT_REDIRECT_URL = os.environ.get('LOGOUT_REDIRECT_URL', '/login/')

# Application definition
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'studyapp.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',
            BASE_DIR / 'frontend' / 'dist',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'studyapp.wsgi.application'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'frontend' / 'dist',
]
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}