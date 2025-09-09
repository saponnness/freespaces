from django.db import models
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify
import re

# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('posts:category', kwargs={'category_name': self.name})

class Post(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    featured_image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def _generate_unique_slug(self):
        """Generate a unique slug from the title"""
        if not self.title or not self.title.strip():
            # Fallback for empty titles
            base_slug = f'post-{timezone.now().strftime("%Y%m%d%H%M%S")}'
        else:
            # Clean the title and create base slug
            # Remove extra whitespace and clean the title
            clean_title = re.sub(r'\s+', ' ', self.title.strip())
            base_slug = slugify(clean_title)

            if not base_slug:
                # If slugify returns empty (e.g., title with only special chars)
                base_slug = f'post-{timezone.now().strftime("%Y%m%d%H%M%S")}'

        # Ensure slug is not too long (leave room for numeric suffix)
        max_length = 240
        if len(base_slug) > max_length:
            base_slug = base_slug[:max_length].rstrip('-')

        # Check for uniqueness and add numeric suffix if needed
        slug = base_slug
        counter = 1
        while Post.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            counter += 1
            # Calculate suffix and ensure total length doesn't exceed limit
            suffix = f'-{counter}'
            if len(base_slug) + len(suffix) > 255:
                # Truncate base_slug to make room for suffix
                truncated_base = base_slug[:255 - len(suffix)].rstrip('-')
                slug = f'{truncated_base}{suffix}'
            else:
                slug = f'{base_slug}{suffix}'

        return slug

    def _should_regenerate_slug(self):
        """Check if slug should be regenerated based on title changes"""
        if not self.pk:  # New post
            return True

        if not self.slug:  # No slug exists
            return True

        # Check if title has changed significantly
        try:
            old_post = Post.objects.get(pk=self.pk)
            old_title_slug = slugify(old_post.title) if old_post.title else ''
            current_title_slug = slugify(self.title) if self.title else ''

            # Regenerate if the slugified title is completely different
            return old_title_slug != current_title_slug and current_title_slug
        except Post.DoesNotExist:
            return True

    def save(self, *args, **kwargs):
        # Generate slug if not provided
        # Don't regenerate if slug was manually set (preserve manual overrides)
        if not self.slug:
            self.slug = self._generate_unique_slug()

        # Set published_at when status changes to published
        if self.status == 'published' and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('posts:detail', kwargs={'slug': self.slug})

    @property
    def excerpt(self):
        """Return first 150 characters of content"""
        return self.content[:150] + "..." if len(self.content) > 150 else self.content