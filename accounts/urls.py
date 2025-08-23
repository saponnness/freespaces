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
]