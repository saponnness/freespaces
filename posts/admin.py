from django.contrib import admin
from django.core.exceptions import PermissionDenied
from .models import Post, Category

# Register your models here.
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'author', 'category', 'status', 'created_at', 'published_at')
    list_filter = ('status', 'category', 'created_at')
    search_fields = ('title', 'content', 'slug')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('created_at', 'updated_at', 'published_at')

    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'content', 'category', 'featured_image', 'status')
        }),
        ('Metadata', {
            'fields': ('author', 'created_at', 'updated_at', 'published_at'),
            'classes': ('collapse',)
        }),
    )

    def get_readonly_fields(self, request, obj=None):
        """
        Make author field readonly for existing posts to prevent unauthorized changes.
        Only allow setting author when creating new posts.
        """
        readonly_fields = list(self.readonly_fields)

        # If editing an existing post, make author readonly
        if obj is not None:  # Existing post
            if 'author' not in readonly_fields:
                readonly_fields.append('author')

        return readonly_fields

    def save_model(self, request, obj, form, change):
        """
        Set author for new posts and prevent unauthorized author changes for existing posts.
        """
        if not change:  # If creating new post
            obj.author = request.user
        else:  # If editing existing post
            # Get the original post from database to check for author changes
            try:
                original_post = Post.objects.get(pk=obj.pk)
                if original_post.author != obj.author:
                    # Author change detected - this should not happen with readonly field
                    # but we add this as an extra security layer
                    raise PermissionDenied(
                        "Changing post authorship is not allowed for security reasons. "
                        "Posts must maintain their original author."
                    )
            except Post.DoesNotExist:
                # This shouldn't happen for existing posts, but handle gracefully
                pass

        super().save_model(request, obj, form, change)