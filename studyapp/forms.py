from django import forms
from django.contrib.auth.forms import UserCreationForm

class UserCreationForm(UserCreationForm):
    class Meta:
        fields = ['username', 'email', 'password1', 'password2']  # 必要なフィールドを選択