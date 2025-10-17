from django.shortcuts import render
from django.db.models import Q, Count
from posts.models import Post, Category

# Create your views here.
def home(request):
    """Home page view with all published posts"""
    recent_posts = Post.objects.filter(status='published').select_related('author', 'category').order_by('-created_at')
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
            Q(category__name__icontains=query)
        ).select_related('author', 'category').distinct()
    
    # Get top 10 most popular categories based on published post count
    popular_categories = Category.objects.annotate(
        post_count=Count('post', filter=Q(post__status='published'))
    ).filter(post_count__gt=0).order_by('-post_count')[:10]
    
    # If we have less than 10 categories with posts, pad with remaining categories
    if popular_categories.count() < 10:
        used_category_ids = [cat.id for cat in popular_categories]
        additional_categories = Category.objects.exclude(
            id__in=used_category_ids
        ).order_by('name')[:10 - popular_categories.count()]
        
        # Combine the lists
        popular_categories = list(popular_categories) + list(additional_categories)
    
    context = {
        'posts': posts,
        'query': query,
        'total_results': posts.count() if query else 0,
        'popular_categories': popular_categories
    }
    return render(request, 'feeds/search.html', context)