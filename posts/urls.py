from django.urls import path
from . import views

app_name = 'posts'

urlpatterns = [
    path('', views.post_list, name='list'),
    path('create/', views.post_create, name='create'),
    path('my-posts/', views.my_posts, name='my_posts'),
    path('<slug:slug>/', views.post_detail, name='detail'),
    path('<slug:slug>/edit/', views.post_edit, name='edit'),
    path('<slug:slug>/delete/', views.post_delete, name='delete'),
    path('category/<str:category_name>/', views.category_posts, name='category'),

    # Backward compatibility URLs (redirect old ID-based URLs to slug-based ones)
    path('id/<int:pk>/', views.post_detail_redirect, name='detail_redirect'),
    path('id/<int:pk>/edit/', views.post_edit_redirect, name='edit_redirect'),
    path('id/<int:pk>/delete/', views.post_delete_redirect, name='delete_redirect'),
]