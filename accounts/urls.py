from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

app_name = 'accounts'

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', auth_views.LoginView.as_view(template_name='accounts/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('profile/', views.profile, name='profile'),
    path('profile/<str:username>/', views.profile, name='profile'),
    path('update-avatar/', views.update_avatar, name='update_avatar'),
    path('update-name/', views.update_name, name='update_name'),
    path('update-bio/', views.update_bio, name='update_bio'),
    path('update-social/', views.update_social_links, name='update_social_links'),
    # Account settings URLs
    path('settings/', views.account_settings, name='account_settings'),
    path('settings/update-username/', views.update_username, name='update_username'),
    path('settings/update-email/', views.update_email, name='update_email'),
    path('settings/update-personal-info/', views.update_personal_info, name='update_personal_info'),
    path('settings/change-password/', views.change_password, name='change_password'),
    path('settings/delete-account/', views.delete_account, name='delete_account'),
    path('password-reset/', auth_views.PasswordResetView.as_view(
        template_name='accounts/password_reset.html',
        email_template_name='accounts/password_reset_email.html',
        subject_template_name='accounts/password_reset_subject.txt'
    ), name='password_reset'),
    path('password-reset/done/', auth_views.PasswordResetDoneView.as_view(
        template_name='accounts/password_reset_done.html'
    ), name='password_reset_done'),
    path('password-reset-confirm/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(
        template_name='accounts/password_reset_confirm.html'
    ), name='password_reset_confirm'),
    path('password-reset-complete/', auth_views.PasswordResetCompleteView.as_view(
        template_name='accounts/password_reset_complete.html'
    ), name='password_reset_complete'),
]