# Generated manually to fix empty usernames

from django.db import migrations
from django.contrib.auth.models import User
import uuid
import random
import string


def fix_empty_usernames(apps, schema_editor):
    """Fix users with empty or null usernames"""
    User = apps.get_model('auth', 'User')
    
    # Find users with empty or null usernames
    users_to_fix = User.objects.filter(username__in=['', None]) | User.objects.filter(username__isnull=True)
    
    for user in users_to_fix:
        # Generate a unique username
        base_username = f"user_{uuid.uuid4().hex[:8]}"
        counter = 1
        username = base_username
        
        # Ensure uniqueness
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1
        
        user.username = username
        user.save()
        print(f"Fixed username for user {user.id}: {username}")


def reverse_fix_empty_usernames(apps, schema_editor):
    """Reverse migration - not recommended"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_merge_20250908_0934'),
    ]

    operations = [
        migrations.RunPython(fix_empty_usernames, reverse_fix_empty_usernames),
    ]
