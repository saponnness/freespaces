from django.shortcuts import render
from posts.models import Post

# Create your views here.
def home(request):
    """Home page view with recent posts"""
    recent_posts = Post.objects.filter(status='published')[:6]  # Show 6 recent posts
    context = {
        'recent_posts': recent_posts
    }
    return render(request, 'feeds/home.html', context)