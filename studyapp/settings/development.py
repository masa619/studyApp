from .base import *

# 開発環境固有の設定
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Ensure that the development server allows HTTP connections
SECURE_PROXY_SSL_HEADER = None

# JWT設定
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 5))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_TOKEN_LIFETIME_MINUTES', 7))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

INSTALLED_APPS += ['ocr_app']
# メディアファイルのURLとルート
MEDIA_URL = '/media/'
MEDIA_ROOT = '/Users/shipro/Documents/CREATE_DATA2'  # 絶対パスで指定
print(MEDIA_ROOT)

CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:8000",
]

