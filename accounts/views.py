from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import JsonResponse
from .forms import (
    CustomUserCreationForm, ProfileUpdateForm, UserUpdateForm,
    AvatarUpdateForm, NameUpdateForm, BioUpdateForm, SocialLinksUpdateForm,
    UsernameUpdateForm, EmailUpdateForm, CustomPasswordChangeForm,
    AccountDeletionForm, PersonalInfoUpdateForm
)
from .models import Profile

def register(request):
    """User registration view"""
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            username = form.cleaned_data.get('username')
            messages.success(request, f'Account created for {username}! You can now log in.')
            return redirect('accounts:login')
    else:
        form = CustomUserCreationForm()
    return render(request, 'accounts/register.html', {'form': form})

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
                filename = f"profile_pics/{uuid.uuid4()}.{ext}"
                
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

# Account Settings Views
@login_required
def account_settings(request):
    """Main account settings view"""
    profile, created = Profile.objects.get_or_create(user=request.user)

    context = {
        'username_form': UsernameUpdateForm(instance=request.user, user=request.user),
        'email_form': EmailUpdateForm(instance=request.user, user=request.user),
        'personal_info_form': PersonalInfoUpdateForm(instance=request.user),
        'password_form': CustomPasswordChangeForm(user=request.user),
        'deletion_form': AccountDeletionForm(user=request.user),
    }

    return render(request, 'accounts/account_settings.html', context)

@login_required
def update_username(request):
    """Update username"""
    if request.method == 'POST':
        form = UsernameUpdateForm(request.POST, instance=request.user, user=request.user)

        if form.is_valid():
            form.save()
            messages.success(request, 'Username updated successfully!')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f'{field.replace("_", " ").title()}: {error}')

    return redirect('accounts:account_settings')

@login_required
def update_email(request):
    """Update email address"""
    if request.method == 'POST':
        form = EmailUpdateForm(request.POST, instance=request.user, user=request.user)

        if form.is_valid():
            form.save()
            messages.success(request, 'Email address updated successfully!')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f'{field.replace("_", " ").title()}: {error}')

    return redirect('accounts:account_settings')

@login_required
def change_password(request):
    """Change user password"""
    if request.method == 'POST':
        form = CustomPasswordChangeForm(user=request.user, data=request.POST)

        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)  # Keep user logged in after password change
            messages.success(request, 'Password changed successfully!')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f'{field.replace("_", " ").title()}: {error}')

    return redirect('accounts:account_settings')

@login_required
def delete_account(request):
    """Delete user account"""
    if request.method == 'POST':
        form = AccountDeletionForm(request.POST, user=request.user)

        if form.is_valid():
            # Delete the user account
            user = request.user
            user.delete()
            messages.success(request, 'Your account has been deleted successfully.')
            return redirect('feeds:home')  # Redirect to home page after deletion
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f'{field.replace("_", " ").title()}: {error}')

    return redirect('accounts:account_settings')

@login_required
def update_personal_info(request):
    """Update personal information (first name, last name)"""
    if request.method == 'POST':
        form = PersonalInfoUpdateForm(request.POST, instance=request.user)

        if form.is_valid():
            form.save()
            messages.success(request, 'Personal information updated successfully!')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f'{field.replace("_", " ").title()}: {error}')

    return redirect('accounts:account_settings')