from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth.models import User
from django.utils.text import slugify
from allauth.exceptions import ImmediateHttpResponse
from django.shortcuts import redirect
from django.urls import reverse
import uuid
import random
import string


class CustomAccountAdapter(DefaultAccountAdapter):
    """Custom account adapter for handling OAuth-only authentication"""
    
    def is_open_for_signup(self, request):
        """Allow signup only through social accounts"""
        return True
    
    def authentication_error(self, request, provider=None, error=None, exception=None, **kwargs):
        home_url = reverse('feeds:home')
        raise ImmediateHttpResponse(redirect(home_url))
    
    def save_user(self, request, user, form, commit=True):
        """Save user with proper username generation"""
        user = super().save_user(request, user, form, commit=False)
        
        # Ensure user has a username
        if not user.username:
            user.username = self.generate_unique_username(user.email)
        
        if commit:
            user.save()
        return user


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """Custom social account adapter for Google OAuth"""

    def is_open_for_signup(self, request, sociallogin):
        """Allow signup through social accounts"""
        return True

    def authentication_error(self, request, provider=None, error=None, exception=None, **kwargs):
        home_url = reverse('feeds:home')
        raise ImmediateHttpResponse(redirect(home_url))

    def get_login_redirect_url(self, request):
        """Override login redirect to use our custom callback handler"""
        return '/accounts/oauth/callback/'

    def get_signup_redirect_url(self, request):
        """Override signup redirect to use our custom callback handler"""
        return '/accounts/oauth/callback/'

    def get_connect_redirect_url(self, request, socialaccount):
        """Override connect redirect to use our custom callback handler"""
        return '/accounts/oauth/callback/'

    def pre_social_login(self, request, sociallogin):
        """
        Handle existing users to prevent them from going through signup flow.
        This is the key method that determines login vs signup behavior.
        """
        # Get the email from the social login
        email = sociallogin.account.extra_data.get('email')

        if email:
            try:
                # Check if a user with this email already exists
                existing_user = User.objects.get(email=email)

                # If user exists, connect this social account to the existing user
                # This prevents Allauth from treating it as a signup
                if not sociallogin.is_existing:
                    sociallogin.connect(request, existing_user)

            except User.DoesNotExist:
                # User doesn't exist, let it proceed as signup
                pass
    
    def save_user(self, request, sociallogin, form=None):
        """Save user with proper username and profile data"""
        user = sociallogin.user

        # Get Google profile data
        google_data = sociallogin.account.extra_data
        user_email = google_data.get('email', '')

        # Check if this is an existing user with the same email
        from django.contrib.auth.models import User
        existing_user = None
        if user_email:
            try:
                existing_user = User.objects.get(email=user_email)
            except User.DoesNotExist:
                pass

        # Set basic user fields
        if not user.email:
            user.email = user_email

        if not user.first_name:
            user.first_name = google_data.get('given_name', '')

        if not user.last_name:
            user.last_name = google_data.get('family_name', '')

        # Generate username if not exists
        if not user.username:
            user.username = self.generate_unique_username(user.email, google_data)

        # Save the user
        user.save()

        # Update or create profile with Google data
        from .models import Profile
        profile, created = Profile.objects.get_or_create(user=user)

        # Set Google-specific profile data
        profile.google_id = google_data.get('sub', '')
        profile.profile_picture_url = google_data.get('picture', '')

        # Enhanced logic: Check if user already exists with complete profile
        if existing_user and hasattr(existing_user, 'profile') and existing_user.profile.profile_setup_complete:
            # Existing user with complete profile - skip setup
            profile.profile_setup_complete = True
        else:
            # New user or existing user without complete profile - require setup
            profile.profile_setup_complete = False

        profile.save()

        return user
    
    def generate_unique_username(self, email, google_data=None):
        """Generate a unique username from email and Google data"""
        # Try to use name from Google data first
        if google_data:
            given_name = google_data.get('given_name', '')
            family_name = google_data.get('family_name', '')
            
            if given_name:
                base_username = slugify(given_name.lower())
                if len(base_username) >= 3:
                    username = self.make_username_unique(base_username)
                    if username:
                        return username
        
        # Fallback to email-based username
        if email:
            email_part = email.split('@')[0]
            base_username = slugify(email_part.lower())
            
            # Ensure minimum length
            if len(base_username) >= 3:
                username = self.make_username_unique(base_username)
                if username:
                    return username
        
        # Final fallback: generate random username
        return self.generate_random_username()
    
    def make_username_unique(self, base_username):
        """Make username unique by appending numbers"""
        # Clean the username
        base_username = ''.join(c for c in base_username if c.isalnum() or c == '_')
        
        if len(base_username) < 3:
            return None
        
        # Truncate if too long
        if len(base_username) > 15:  # Leave room for numbers
            base_username = base_username[:15]
        
        username = base_username
        counter = 1
        
        while User.objects.filter(username=username).exists():
            # Add random suffix to avoid predictable usernames
            suffix = f"_{counter}{random.randint(10, 99)}"
            username = f"{base_username}{suffix}"
            
            # Ensure we don't exceed max length
            if len(username) > 20:
                base_username = base_username[:20-len(suffix)]
                username = f"{base_username}{suffix}"
            
            counter += 1
            
            # Prevent infinite loop
            if counter > 100:
                return self.generate_random_username()
        
        return username
    
    def generate_random_username(self):
        """Generate a completely random username"""
        while True:
            # Generate random username with user_ prefix
            random_part = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
            username = f"user_{random_part}"
            
            if not User.objects.filter(username=username).exists():
                return username
    
    def populate_user(self, request, sociallogin, data):
        """Populate user data from social login"""
        user = super().populate_user(request, sociallogin, data)

        # DO NOT automatically generate username - let user choose in profile setup
        # This ensures users see a blank username field in profile setup
        # Username will be set when user completes profile setup

        return user
