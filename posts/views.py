from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from django.http import Http404, HttpResponsePermanentRedirect
from .models import Post, Category
from .forms import PostForm

# Create your views here.
def post_list(request):
    """Display all published posts"""
    posts = Post.objects.filter(status='published').select_related('author', 'category')
    categories = Category.objects.all()
    
    # Filter by category if specified
    category_name = request.GET.get('category')
    if category_name:
        posts = posts.filter(category__name=category_name)
    
    # Search functionality
    search_query = request.GET.get('search')
    if search_query:
        posts = posts.filter(
            Q(title__icontains=search_query) | 
            Q(category__name__icontains=search_query)
        )
    
    context = {
        'posts': posts,
        'categories': categories,
        'current_category': category_name,
        'search_query': search_query,
    }
    return render(request, 'posts/post_list.html', context)

def post_detail(request, slug):
    """Display single post"""
    try:
        post = Post.objects.get(slug=slug)

        # If post is published, anyone can view it
        if post.status == 'published':
            return render(request, 'posts/post_detail.html', {'post': post})

        # If post is draft, only the author can view it
        if post.status == 'draft':
            if request.user.is_authenticated and request.user == post.author:
                return render(request, 'posts/post_detail.html', {'post': post})
            else:
                raise Http404("No Post matches the given query.")

    except Post.DoesNotExist:
        raise Http404("No Post matches the given query.")

@login_required
def post_create(request):
    """Create new post"""
    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.save()
            messages.success(request, 'Your post has been created!')
            return redirect('posts:detail', slug=post.slug)
    else:
        form = PostForm()
    
    return render(request, 'posts/post_create.html', {'form': form})

@login_required
def post_edit(request, slug):
    """Edit existing post"""
    post = get_object_or_404(Post, slug=slug, author=request.user)

    if request.method == 'POST':
        form = PostForm(request.POST, request.FILES, instance=post)
        if form.is_valid():
            form.save()
            messages.success(request, 'Your post has been updated!')
            return redirect('posts:detail', slug=post.slug)
    else:
        form = PostForm(instance=post)

    return render(request, 'posts/post_edit.html', {'form': form, 'post': post})

@login_required
def post_delete(request, slug):
    """Delete post"""
    post = get_object_or_404(Post, slug=slug, author=request.user)

    if request.method == 'POST':
        post.delete()
        messages.success(request, 'Your post has been deleted!')
        return redirect('posts:list')

    return render(request, 'posts/post_delete.html', {'post': post})

@login_required
def my_posts(request):
    """Display user's own posts"""
    posts = Post.objects.filter(author=request.user).select_related('category')
    return render(request, 'posts/my_posts.html', {'posts': posts})

def category_posts(request, category_name):
    """Display posts by category"""
    category = get_object_or_404(Category, name=category_name)
    posts = Post.objects.filter(category=category, status='published').select_related('author')
    
    context = {
        'posts': posts,
        'category': category,
    }
    return render(request, 'posts/category_posts.html', context)


# Backward compatibility redirect views
def post_detail_redirect(request, pk):
    """Redirect old ID-based URLs to new slug-based URLs"""
    post = get_object_or_404(Post, pk=pk)
    return HttpResponsePermanentRedirect(post.get_absolute_url())


@login_required
def post_edit_redirect(request, pk):
    """Redirect old ID-based edit URLs to new slug-based URLs"""
    post = get_object_or_404(Post, pk=pk, author=request.user)
    return HttpResponsePermanentRedirect(f'/posts/{post.slug}/edit/')


@login_required
def post_delete_redirect(request, pk):
    """Redirect old ID-based delete URLs to new slug-based URLs"""
    post = get_object_or_404(Post, pk=pk, author=request.user)
    return HttpResponsePermanentRedirect(f'/posts/{post.slug}/delete/')