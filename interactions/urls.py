from django.urls import path
from . import views

app_name = 'interactions'

urlpatterns = [
    path('like/<int:post_id>/', views.toggle_like, name='toggle_like'),
    path('comment/add/<int:post_id>/', views.add_comment, name='add_comment'),
    path('comments/<int:post_id>/', views.get_comments, name='get_comments'),
    path('comment/delete/<int:comment_id>/', views.delete_comment, name='delete_comment'),
]