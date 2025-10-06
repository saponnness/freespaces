from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.urls import reverse
from django.core.exceptions import ValidationError
from allauth.socialaccount.models import SocialAccount
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
import json
from .forms import (
    ProfileUpdateForm, UserUpdateForm,
    AvatarUpdateForm, NameUpdateForm, BioUpdateForm, SocialLinksUpdateForm,
    UsernameUpdateForm
)
from .models import Profile, validate_username

# OAuth and Profile Setup Views
@login_required
def oauth_callback_handler(request):
    """Handle OAuth callback and redirect to appropriate page"""
    user = request.user

    # DO NOT generate automatic username - let user choose in profile setup
    # Users can exist temporarily without usernames during OAuth flow
    # Username will be required and set in profile_setup view

    profile, created = Profile.objects.get_or_create(user=user)

    # Check if this is a new user or existing user
    if created or not profile.profile_setup_complete:
        # Get Google account data
        try:
            social_account = SocialAccount.objects.get(user=user, provider='google')
            google_data = social_account.extra_data

            # Update profile with Google data
            profile.google_id = social_account.uid
            profile.profile_picture_url = google_data.get('picture', '')
            profile.save()

            # Always redirect to profile setup for new users or incomplete profiles
            return redirect('accounts:profile_setup')

        except SocialAccount.DoesNotExist:
            # If no social account found, still redirect to setup
            return redirect('accounts:profile_setup')

    # If profile is complete, redirect to home
    if profile.profile_setup_complete:
        return redirect('feeds:home')
    else:
        return redirect('accounts:profile_setup')

@login_required
def profile_setup(request):
    """Profile setup page for new OAuth users"""
    profile, created = Profile.objects.get_or_create(user=request.user)

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()

        if username:
            try:
                # Validate username
                clean_username = validate_username(username)

                # Check if username is already taken
                if User.objects.filter(username=clean_username).exclude(id=request.user.id).exists():
                    messages.error(request, 'This username is already taken.')
                else:
                    # Update user with new username
                    request.user.username = clean_username
                    request.user.save()

                    # Handle cropped profile image if provided
                    if 'profile_image_data' in request.POST:
                        import base64
                        from django.core.files.base import ContentFile
                        from django.core.files.storage import default_storage
                        import uuid

                        try:
                            # Get base64 image data
                            image_data = request.POST['profile_image_data']
                            format, imgstr = image_data.split(';base64,')
                            ext = format.split('/')[-1]

                            # Create file from base64 data
                            data = ContentFile(base64.b64decode(imgstr))
                            filename = f"{uuid.uuid4()}.{ext}"

                            # Delete old avatar if it exists and is not default
                            if profile.avatar and 'default.jpg' not in profile.avatar.name:
                                profile.avatar.delete()

                            # Save new avatar
                            profile.avatar.save(filename, data, save=True)

                        except Exception as e:
                            messages.warning(request, 'Profile created successfully, but there was an issue with the profile picture.')

                    # Mark profile setup as complete
                    profile.profile_setup_complete = True
                    profile.save()

                    messages.success(request, f'Welcome to Freespaces, @{clean_username}!')
                    return redirect('feeds:home')

            except Exception as e:
                messages.error(request, str(e))

    # Get Google profile data if available
    google_data = {}
    try:
        social_account = SocialAccount.objects.get(user=request.user, provider='google')
        google_data = social_account.extra_data
    except SocialAccount.DoesNotExist:
        pass

    context = {
        'profile': profile,
        'google_data': google_data,
        'suggested_username': ''  # Always show blank username field for OAuth users
    }

    return render(request, 'accounts/profile_setup.html', context)

@login_required
def validate_username_api(request):
    """API endpoint for real-time username validation"""
    if request.method == 'POST':
        try:
            # Handle both JSON and form data
            if request.content_type == 'application/json':
                data = json.loads(request.body)
                username = data.get('username', '').strip()
            else:
                username = request.POST.get('username', '').strip()

            if not username:
                return JsonResponse({'valid': False, 'error': 'Username is required'})

            try:
                clean_username = validate_username(username)

                # Check if username is already taken (excluding current user)
                if User.objects.filter(username=clean_username).exclude(id=request.user.id).exists():
                    return JsonResponse({'valid': False, 'error': 'Username is already taken'})

                return JsonResponse({'valid': True, 'clean_username': clean_username})

            except ValidationError as e:
                return JsonResponse({'valid': False, 'error': str(e)})

        except json.JSONDecodeError:
            return JsonResponse({'valid': False, 'error': 'Invalid request format'})
        except Exception as e:
            return JsonResponse({'valid': False, 'error': str(e)})

    return JsonResponse({'valid': False, 'error': 'Invalid request method'})

@login_required
def update_username(request):
    """Update user's username"""
    print(f"DEBUG: update_username called with method: {request.method}")

    if request.method == 'POST':
        print(f"DEBUG: POST data: {request.POST}")
        print(f"DEBUG: Current username: {request.user.username}")

        # Determine redirect URL based on HTTP_REFERER
        redirect_url = 'accounts:profile'
        if request.META.get('HTTP_REFERER'):
            if 'settings' in request.META.get('HTTP_REFERER'):
                redirect_url = 'accounts:account_settings'

        print(f"DEBUG: Redirect URL: {redirect_url}")

        form = UsernameUpdateForm(request.POST, instance=request.user)
        print(f"DEBUG: Form created with data: {form.data}")

        if form.is_valid():
            print(f"DEBUG: Form is valid, cleaned data: {form.cleaned_data}")
            old_username = request.user.username
            form.save()
            request.user.refresh_from_db()
            print(f"DEBUG: Username changed from {old_username} to {request.user.username}")
            messages.success(request, f'Username successfully updated to @{form.cleaned_data["username"]}')
        else:
            print(f"DEBUG: Form is invalid, errors: {form.errors}")
            # Extract error messages from form
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, error)

        return redirect(redirect_url)

    print("DEBUG: Non-POST request, redirecting to profile")
    return redirect('accounts:profile')

# Legacy registration view removed - OAuth-only authentication

def profile(request, username=None):
    """User profile view"""
    if username:
        user = get_object_or_404(User, username=username)
    else:
        if not request.user.is_authenticated:
            return redirect('accounts:login')
        user = request.user
    
    profile, created = Profile.objects.get_or_create(user=user)
    
    # Create forms for inline editing (only for own profile)
    context = {'profile': profile}
    if request.user == user:
        context.update({
            'avatar_form': AvatarUpdateForm(instance=profile),
            'name_form': NameUpdateForm(instance=user),
            'bio_form': BioUpdateForm(instance=profile),
            'social_form': SocialLinksUpdateForm(instance=profile),
            'username_form': UsernameUpdateForm(instance=user),
        })
    
    return render(request, 'accounts/profile.html', context)

@login_required
def edit_profile(request):
    """Edit user profile (keep for backward compatibility)"""
    profile, created = Profile.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        user_form = UserUpdateForm(request.POST, instance=request.user)
        profile_form = ProfileUpdateForm(request.POST, request.FILES, instance=profile)
        
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            messages.success(request, 'Your profile has been updated!')
            return redirect('accounts:profile')
    else:
        user_form = UserUpdateForm(instance=request.user)
        profile_form = ProfileUpdateForm(instance=profile)
    
    context = {
        'user_form': user_form,
        'profile_form': profile_form
    }
    return render(request, 'accounts/edit_profile.html', context)

@login_required
def update_avatar(request):
    """Update user avatar"""
    if request.method == 'POST':
        profile = get_object_or_404(Profile, user=request.user)
        
        # Handle cropped image data
        if 'cropped_image' in request.POST:
            import base64
            from django.core.files.base import ContentFile
            from django.core.files.storage import default_storage
            import uuid
            
            try:
                # Get base64 image data
                image_data = request.POST['cropped_image']
                format, imgstr = image_data.split(';base64,')
                ext = format.split('/')[-1]
                
                # Create file from base64 data
                data = ContentFile(base64.b64decode(imgstr))
                filename = f"{uuid.uuid4()}.{ext}"
                
                # Delete old avatar if it exists and is not default
                if profile.avatar and 'default.jpg' not in profile.avatar.name:
                    profile.avatar.delete()
                
                # Save new avatar
                profile.avatar.save(filename, data, save=True)
                messages.success(request, 'Avatar updated successfully!')
                
            except Exception as e:
                messages.error(request, 'Error processing image.')
        else:
            # Handle regular file upload (fallback)
            form = AvatarUpdateForm(request.POST, request.FILES, instance=profile)
            if form.is_valid():
                form.save()
                messages.success(request, 'Avatar updated successfully!')
            else:
                messages.error(request, 'Error updating avatar.')
    
    return redirect('accounts:profile')

@login_required
def update_name(request):
    """Update user name"""
    if request.method == 'POST':
        form = NameUpdateForm(request.POST, instance=request.user)
        
        if form.is_valid():
            form.save()
            messages.success(request, 'Name updated successfully!')
        else:
            messages.error(request, 'Error updating name.')
    
    return redirect('accounts:profile')

@login_required
def update_bio(request):
    """Update user bio"""
    if request.method == 'POST':
        profile = get_object_or_404(Profile, user=request.user)
        form = BioUpdateForm(request.POST, instance=profile)
        
        if form.is_valid():
            form.save()
            messages.success(request, 'Bio updated successfully!')
        else:
            messages.error(request, 'Error updating bio.')
    
    return redirect('accounts:profile')

@login_required
def update_social_links(request):
    """Update social media links"""
    if request.method == 'POST':
        profile = get_object_or_404(Profile, user=request.user)
        form = SocialLinksUpdateForm(request.POST, instance=profile)
        
        if form.is_valid():
            form.save()
            messages.success(request, 'Social links updated successfully!')
        else:
            messages.error(request, 'Error updating social links.')
    
    return redirect('accounts:profile')

# Account Settings Views (OAuth-only)
@login_required
def account_settings(request):
    """OAuth-only account settings view"""
    profile, created = Profile.objects.get_or_create(user=request.user)
    return render(request, 'accounts/account_settings.html')

# Account Deletion View
@login_required
@require_POST
def delete_account(request):
    """Handle account deletion with confirmation"""
    # Check if user confirmed deletion
    if request.POST.get('confirm_deletion') == 'DELETE':
        user = request.user

        # Log out the user first
        logout(request)

        # Delete the user account (this will cascade delete the profile)
        user.delete()

        messages.success(request, 'Your account has been permanently deleted.')
        return redirect('feeds:home')
    else:
        messages.error(request, 'Account deletion confirmation failed.')
        return redirect('accounts:account_settings')

# Legacy password-based authentication views removed
# OAuth-only authentication system in use