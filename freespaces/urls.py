"""
URL configuration for freespaces project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from django.urls import reverse_lazy

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('feeds.urls')),
    path('accounts/', include('accounts.urls')),
    # Explicit redirects to avoid Allauth error templates
    path('auth/socialaccount/login/cancelled/',
         RedirectView.as_view(url=reverse_lazy('feeds:home'), permanent=False),
         name='socialaccount_login_cancelled_redirect'),
    path('auth/socialaccount/login/error/',
         RedirectView.as_view(url=reverse_lazy('feeds:home'), permanent=False),
         name='socialaccount_login_error_redirect'),
    path('auth/social/login/cancelled/',
         RedirectView.as_view(url=reverse_lazy('feeds:home'), permanent=False),
         name='social_login_cancelled_redirect'),
    path('auth/social/login/error/',
         RedirectView.as_view(url=reverse_lazy('feeds:home'), permanent=False),
         name='social_login_error_redirect'),
    path('auth/', include('allauth.urls')),  # Django Allauth URLs
    path('posts/', include('posts.urls')),
    path('interactions/', include('interactions.urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)