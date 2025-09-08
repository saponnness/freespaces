from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
import re

# Username validation
PROHIBITED_USERNAMES = [
    'admin', 'root', 'system', 'support', 'api', 'www', 'mail', 'ftp',
    'help', 'info', 'news', 'test', 'user', 'guest', 'demo', 'null',
    'undefined', 'freespaces', 'moderator', 'staff'
]



def validate_username(username):
    """Validate username according to our rules"""
    # Remove @ symbol if present for validation
    clean_username = username.lstrip('@')

    # Check length
    if len(clean_username) < 3 or len(clean_username) > 20:
        raise ValidationError('Username must be between 3 and 20 characters long.')

    # Check pattern (alphanumeric and underscore only)
    if not re.match(r'^[a-zA-Z0-9_]+$', clean_username):
        raise ValidationError('Username can only contain letters, numbers, and underscores.')

    # Check prohibited usernames
    if clean_username.lower() in PROHIBITED_USERNAMES:
        raise ValidationError('This username is not allowed.')

    return clean_username

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    # OAuth fields
    google_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    profile_picture_url = models.URLField(blank=True, help_text="Google profile picture URL")

    # Profile fields
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(
        upload_to='profile_pics/',
        default='profile_pics/default.jpg',
        blank=True
    )
    website = models.URLField(blank=True)
    location = models.CharField(max_length=100, blank=True)

    # Social media fields
    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    tiktok_url = models.URLField(blank=True)

    # Profile setup tracking
    profile_setup_complete = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def get_absolute_url(self):
        return reverse('accounts:profile', kwargs={'username': self.user.username})

    @property
    def display_username(self):
        """Return username with @ symbol for display"""
        return f"@{self.user.username}"

    def save(self, *args, **kwargs):
        """Override save to validate username"""
        if self.user.username:
            # Validate username when saving
            validate_username(self.user.username)
        super().save(*args, **kwargs)
    
    @property
    def posts_count(self):
        return self.user.posts.filter(status='published').count()
    
    @property
    def likes_received(self):
        return sum(post.likes.count() for post in self.user.posts.filter(status='published'))

# Signal to create profile when user is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        Profile.objects.create(user=instance)