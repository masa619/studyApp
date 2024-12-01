from .base import *

# 開発環境固有の設定
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Ensure that the development server allows HTTP connections
SECURE_PROXY_SSL_HEADER = None

# INSTALLED_APPS += [
#     'quiz', 
# ]
