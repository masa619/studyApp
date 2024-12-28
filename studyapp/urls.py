from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from . import views
from .views import RegisterView, LogoutView
from django.contrib.auth import views as auth_views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from django.conf import settings
from django.conf.urls.static import static
from django.urls import re_path
from django.views.static import serve
import os

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name='index'),
    path('api/', include([
        path('', include('quiz.api.urls')),  # quiz関連のAPIを直接includeする
        #path('register/', RegisterView.as_view(), name='register'),
        path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        path('token/verify/', TokenVerifyView.as_view(), name='verify'),
        path('logout/', LogoutView.as_view(), name='logout'),
    ])),
    path('ocr_app/api/', include('ocr_app.urls')),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    print(settings.MEDIA_ROOT)

# React のためのキャッチオール���ート (メディアファイルの処理より後に記述)
urlpatterns += [
    re_path(r'^.*$', views.index, name='index'),
]

urlpatterns += [
    re_path(r'^favicon\.ico$', serve, {
        'path': 'favicon.ico',
        'document_root': settings.STATICFILES_DIRS[0],
    }),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)