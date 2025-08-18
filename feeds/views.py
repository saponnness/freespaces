from django.shortcuts import render
from django.db.models import Q
from posts.models import Post, Category

# Create your views here.
def home(request):
    """Home page view with recent posts"""
    recent_posts = Post.objects.filter(status='published')[:6]
    categories = Category.objects.all().order_by('name')
    context = {
        'recent_posts': recent_posts,
        'categories': categories,
    }
    return render(request, 'feeds/home.html', context)

def search(request):
    """Global search functionality"""
    query = request.GET.get('q')
    posts = []
    
    if query:
        posts = Post.objects.filter(
            status='published'
        ).filter(
            Q(title__icontains=query) |
            Q(content__icontains=query) |
            Q(author__username__icontains=query) |
            Q(category__name__icontains=query)
        ).select_related('author', 'category').distinct()
    
    context = {
        'posts': posts,
        'query': query,
        'total_results': posts.count() if query else 0
    }
    return render(request, 'feeds/search.html', context)