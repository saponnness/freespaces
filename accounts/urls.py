from django.urls import path
from django.contrib.auth import views as auth_views
from django.shortcuts import render
from . import views

app_name = 'accounts'

urlpatterns = [
    # OAuth and Profile Setup
    path('oauth/callback/', views.oauth_callback_handler, name='oauth_callback'),
    path('profile/setup/', views.profile_setup, name='profile_setup'),
    path('api/validate-username/', views.validate_username_api, name='validate_username_api'),
    path('update-username/', views.update_username, name='update_username'),
    path('oauth-login/', lambda request: render(request, 'accounts/oauth_login.html'), name='oauth_login'),

    # Legacy authentication routes removed - OAuth-only system

    # Profile and settings
    path('profile/', views.profile, name='profile'),
    path('profile/<str:username>/', views.profile, name='profile'),
    path('update-avatar/', views.update_avatar, name='update_avatar'),
    path('update-name/', views.update_name, name='update_name'),
    path('update-bio/', views.update_bio, name='update_bio'),
    path('update-social/', views.update_social_links, name='update_social_links'),
    # OAuth-only account settings
    path('settings/', views.account_settings, name='account_settings'),
    path('delete-account/', views.delete_account, name='delete_account'),


]