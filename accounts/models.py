# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    # 例: Google連携時に userinfo の sub (一意ID)を保持したい場合
    google_sub = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile_images/', blank=True, null=True)
    email = models.EmailField(max_length=255, blank=True, null=True)
    
    # Googleから取得できるその他の情報
    google_name = models.CharField(max_length=255, blank=True, null=True)
    google_given_name = models.CharField(max_length=255, blank=True, null=True)
    google_family_name = models.CharField(max_length=255, blank=True, null=True)
    google_picture = models.URLField(max_length=255, blank=True, null=True)
    google_locale = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
        return self.username