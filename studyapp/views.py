from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages  # メッセージフレームワークを利用
from django.shortcuts import redirect
from django.contrib.auth.models import User
from django.contrib.auth import logout

from rest_framework import serializers, views
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .src.utils import load_vite_manifest

def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()  # ユーザーを保存
            messages.success(request, 'Registration successful! You can now log in.')
            print("proooooo")
            return redirect('login')  # ログインページへリダイレクト
        else:
            print("proooooo2")
            messages.error(request, 'Please correct the errors below.')  # エラー時のメッセージ
    else:
        form = UserCreationForm()  # GETリクエスト時は空のフォームを表示

    return render(request, 'register.html', {'form': form})


def redirect_to_login(request):
    return redirect('login')  # 'login' は URLs の名前を使用


class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password', 'email']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', '')
        )
        return user

class RegisterView(views.APIView):
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'ユーザー登録が完了しました'}, status=201)
        return Response(serializer.errors, status=400)
    

class LogoutView(APIView):
    permission_classes = (IsAuthenticated)

    def post(self, request):
        try:
            logout(request)
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()  # トークンをブラックリストに追加
            return Response({"detail": "Successfully logged out."}, status=200)
        except Exception as e:
            return Response({"detail": str(e)}, status=400)

def index(request):
    manifest = load_vite_manifest()
    return render(request, 'index.html', {'manifest': manifest})