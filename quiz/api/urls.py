from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('exams', views.ExamViewSet)
router.register('questions', views.QuestionViewSet)
router.register('choices', views.ChoiceViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('quiz/', views.QuizAPIView.as_view(), name='quiz-api'),
    path('answer-log/',views.AnswerLogView.as_view(), name='answer-log'),
]