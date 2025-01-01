from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from studyapp import views
from studyapp.views import RegisterView, LogoutView
from exam_core.views.import_views import ImportAreasAPIView, ExamCategoryListAPIView, CategoryExamListAPIView
from exam_core.views.delete_views import ExamListDeleteAPIView, QuestionListDeleteAPIView, ChoiceListDeleteAPIView
from exam_core.views.exam_views import AllExamCategoryListAPIView, CategoryExamListV2APIView, ExamDetailAPIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from django.conf import settings
from django.conf.urls.static import static
from django.urls import re_path
from django.views.static import serve
import os

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),
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
    path('exam_core/api/categories/', ExamCategoryListAPIView.as_view(), name='exam-category-list'),
    path('exam_core/api/categories/<slug:cat_slug>/exams/',CategoryExamListAPIView.as_view(),name='category-exam-list'),
    path('exam_core/api/import-areas/', ImportAreasAPIView.as_view(), name='import-areas'),
    path('exam_core/api/import-areas/<int:exam_id>/', ImportAreasAPIView.as_view(), name='import-areas'),
    path('exam_core/api/delete-exams/', ExamListDeleteAPIView.as_view(), name='exam-list-delete'),
    path('exam_core/api/delete-questions/', QuestionListDeleteAPIView.as_view(), name='question-list-delete'),
    path('exam_core/api/delete-choices/', ChoiceListDeleteAPIView.as_view(), name='choice-list-delete'),
    path('exam_core/api/v2/all-categories/', AllExamCategoryListAPIView.as_view(), name='all-category-list'),
    path('exam_core/api/v2/categories/<slug:cat_slug>/exams/', CategoryExamListV2APIView.as_view(), name='category-exam-list-v2'),
    path('exam_core/api/v2/exams/<int:exam_id>/', ExamDetailAPIView.as_view(), name='exam-detail'),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    print(settings.MEDIA_ROOT)

urlpatterns += [
    re_path(r'^.*$', views.index, name='index'),
]

urlpatterns += [
    re_path(r'^favicon\.ico$', serve, {
        'path': 'favicon.ico',
        'document_root': settings.STATICFILES_DIRS[0],
    }),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)