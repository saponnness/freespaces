from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from django.db.models.signals import post_save
from django.dispatch import receiver

# Create your models here.from django.db import models
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(
        upload_to='profile_pics/', 
        default='profile_pics/default.jpg',
        blank=True
    )
    website = models.URLField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def get_absolute_url(self):
        return reverse('accounts:profile', kwargs={'username': self.user.username})
    
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