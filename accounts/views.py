from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from .forms import CustomUserCreationForm, ProfileUpdateForm, UserUpdateForm
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
    return render(request, 'accounts/profile.html', {'profile': profile})

@login_required
def edit_profile(request):
    """Edit user profile"""
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