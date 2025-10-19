from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.core.paginator import Paginator
from django.template.loader import render_to_string
from posts.models import Post
from .models import Like, Comment

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


@login_required
@require_POST
def add_comment(request, post_id):
    """Add a comment to a post via AJAX"""
    post = get_object_or_404(Post, id=post_id, status='published')
    content = request.POST.get('content', '').strip()
    
    if not content:
        return JsonResponse({'error': 'Comment content is required'}, status=400)
    
    if len(content) > 1000:
        return JsonResponse({'error': 'Comment is too long (max 1000 characters)'}, status=400)
    
    # Create the comment
    comment = Comment.objects.create(
        user=request.user,
        post=post,
        content=content
    )
    
    # Get updated comment count
    comment_count = post.comments.count()
    
    # Render the comment HTML
    comment_html = render_to_string('interactions/comment_item.html', {
        'comment': comment,
        'user': request.user
    })
    
    return JsonResponse({
        'success': True,
        'comment_html': comment_html,
        'comment_count': comment_count
    })


def get_comments(request, post_id):
    """Get paginated comments for a post via AJAX"""
    post = get_object_or_404(Post, id=post_id, status='published')
    page = request.GET.get('page', 1)
    
    comments = post.comments.select_related('user', 'user__profile').all()
    paginator = Paginator(comments, 10)  # 10 comments per page
    
    try:
        comments_page = paginator.page(page)
    except:
        comments_page = paginator.page(1)
    
    # Render comments HTML
    comments_html = render_to_string('interactions/comments_list.html', {
        'comments': comments_page,
        'user': request.user
    })
    
    return JsonResponse({
        'comments_html': comments_html,
        'has_next': comments_page.has_next(),
        'has_previous': comments_page.has_previous(),
        'current_page': comments_page.number,
        'total_pages': paginator.num_pages,
        'comment_count': paginator.count
    })


@login_required
@require_POST  
def delete_comment(request, comment_id):
    """Delete a comment via AJAX"""
    comment = get_object_or_404(Comment, id=comment_id)
    
    # Only allow the comment author to delete their comment
    if comment.user != request.user:
        return JsonResponse({'error': 'You can only delete your own comments'}, status=403)
    
    post_id = comment.post.id
    comment.delete()
    
    # Get updated comment count
    post = get_object_or_404(Post, id=post_id)
    comment_count = post.comments.count()
    
    return JsonResponse({
        'success': True,
        'comment_count': comment_count
    })