from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from posts.models import Post
from .models import Like

# Create your views here.
@login_required
@require_POST
def toggle_like(request, post_id):
    """Toggle like/unlike for a post via AJAX"""
    post = get_object_or_404(Post, id=post_id, status='published')
    
    like, created = Like.objects.get_or_create(
        user=request.user,
        post=post
    )
    
    if not created:
        # Like already exists, so remove it (unlike)
        like.delete()
        liked = False
    else:
        # New like created
        liked = True
    
    # Get updated like count
    like_count = post.likes.count()
    
    return JsonResponse({
        'liked': liked,
        'like_count': like_count
    })