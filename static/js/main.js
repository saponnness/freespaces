// CSRF Token Helper
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');


document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.category-filter-btn');
    const postItems = document.querySelectorAll('.post-item');
    const postsContainer = document.getElementById('posts-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noPostsMessage = document.getElementById('no-posts-message');
    
    // Handle category filter clicks
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const selectedCategory = this.getAttribute('data-category');
            
            // Remove active class from all buttons
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.classList.remove('bg-purple-200', 'text-purple-800');
                btn.classList.add('text-purple-700');
            });
            
            // Add active class to clicked button
            this.classList.add('active', 'bg-purple-200', 'text-purple-800');
            this.classList.remove('text-purple-700');
            
            // Show loading indicator briefly for better UX
            showLoading();
            
            setTimeout(() => {
                filterPosts(selectedCategory);
                hideLoading();
            }, 300);
        });
    });
    
    function showLoading() {
        loadingIndicator.classList.remove('hidden');
        postsContainer.style.opacity = '0.5';
        noPostsMessage.classList.add('hidden');
    }
    
    function hideLoading() {
        loadingIndicator.classList.add('hidden');
        postsContainer.style.opacity = '1';
    }
    
    function filterPosts(category) {
        let visiblePostsCount = 0;
        
        postItems.forEach(post => {
            const postCategory = post.getAttribute('data-category');
            
            if (category === 'all' || postCategory === category) {
                post.style.display = 'block';
                // Add fade-in animation
                post.style.opacity = '0';
                post.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    post.style.transition = 'all 0.3s ease';
                    post.style.opacity = '1';
                    post.style.transform = 'translateY(0)';
                }, visiblePostsCount * 50); // Stagger the animations
                
                visiblePostsCount++;
            } else {
                post.style.display = 'none';
            }
        });
        
        // Show "no posts" message if no posts are visible
        if (visiblePostsCount === 0) {
            noPostsMessage.classList.remove('hidden');
            postsContainer.classList.add('hidden');
        } else {
            noPostsMessage.classList.add('hidden');
            postsContainer.classList.remove('hidden');
        }
        
        // Update page title and heading based on selected category
        const trendingHeading = document.querySelector('h2');
        if (category === 'all') {
            trendingHeading.textContent = 'Trending Now';
        } else {
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            trendingHeading.textContent = `${categoryName} Posts`;
        }
    }
    
    // Initialize with "All" category active
    document.querySelector('[data-category="all"]').classList.add('active', 'bg-purple-200', 'text-purple-800');
    document.querySelector('[data-category="all"]').classList.remove('text-purple-700');
});


// Like Button Functionality
function initLikeButtons() {
    document.addEventListener('click', function(e) {
        const likeButton = e.target.closest('.like-btn');
        if (likeButton) {
            e.preventDefault();
            handleLikeClick(likeButton);
        }
        
        // Handle any heart icon clicks
        if (e.target.closest('button') && e.target.closest('button').querySelector('svg path[d*="M4.318"]')) {
            e.preventDefault();
            const button = e.target.closest('button');
            handleHeartClick(button);
        }
    });
}

function handleLikeClick(button) {
    const postId = button.dataset.postId;
    
    // If we have a post ID, make AJAX request
    if (postId) {
        fetch(`/interactions/like/${postId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken,
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            updateLikeButton(button, data.liked, data.like_count);
            createFloatingHeart(button);
        })
        .catch(error => {
            console.error('Error:', error);
            // Fallback to local toggle
            toggleLikeButton(button);
        });
    } else {
        // Fallback to local toggle
        toggleLikeButton(button);
    }
}

function handleHeartClick(button) {
    const heartIcon = button.querySelector('svg');
    const countSpan = button.querySelector('span');
    
    // Toggle like state with animation
    if (heartIcon.classList.contains('fill-current')) {
        heartIcon.classList.remove('fill-current', 'text-red-500');
        button.classList.remove('text-red-500');
        button.classList.add('text-gray-600');
        if (countSpan) {
            countSpan.textContent = parseInt(countSpan.textContent) - 1;
        }
        
        // Animate scale down
        animateButton(button, 0.8);
    } else {
        heartIcon.classList.add('fill-current', 'text-red-500');
        button.classList.add('text-red-500');
        button.classList.remove('text-gray-600');
        if (countSpan) {
            countSpan.textContent = parseInt(countSpan.textContent) + 1;
        }
        
        // Animate heart pop
        animateButton(button, 1.2);
        createFloatingHeart(button);
    }
}

function updateLikeButton(button, liked, count) {
    const heartIcon = button.querySelector('svg');
    const countSpan = button.querySelector('.like-count');
    
    // Update count
    if (countSpan) {
        countSpan.textContent = count;
    }
    
    // Update heart appearance
    if (liked) {
        heartIcon.classList.add('text-red-500', 'fill-current');
        button.classList.add('text-red-500');
        button.classList.remove('text-gray-600');
        animateButton(button, 1.2);
    } else {
        heartIcon.classList.remove('text-red-500', 'fill-current');
        button.classList.remove('text-red-500');
        button.classList.add('text-gray-600');
        animateButton(button, 0.8);
    }
}

function toggleLikeButton(button) {
    const heartIcon = button.querySelector('svg');
    const countSpan = button.querySelector('span');
    const isLiked = heartIcon.classList.contains('fill-current');
    
    if (isLiked) {
        heartIcon.classList.remove('fill-current', 'text-red-500');
        button.classList.remove('text-red-500');
        button.classList.add('text-gray-600');
        if (countSpan) {
            countSpan.textContent = parseInt(countSpan.textContent) - 1;
        }
        animateButton(button, 0.8);
    } else {
        heartIcon.classList.add('fill-current', 'text-red-500');
        button.classList.add('text-red-500');
        button.classList.remove('text-gray-600');
        if (countSpan) {
            countSpan.textContent = parseInt(countSpan.textContent) + 1;
        }
        animateButton(button, 1.2);
        createFloatingHeart(button);
    }
}

function animateButton(button, scale) {
    button.style.transform = `scale(${scale})`;
    button.style.transition = 'transform 0.15s ease';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 150);
}

function createFloatingHeart(button) {
    // Create floating heart animation
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.cssText = `
        position: absolute;
        pointer-events: none;
        font-size: 20px;
        opacity: 1;
        z-index: 1000;
        animation: floatUp 1s ease-out forwards;
    `;
    
    // Position relative to button
    const rect = button.getBoundingClientRect();
    heart.style.left = (rect.left + rect.width / 2 - 10) + 'px';
    heart.style.top = (rect.top + window.scrollY - 10) + 'px';
    
    document.body.appendChild(heart);
    
    // Remove after animation
    setTimeout(() => {
        if (heart.parentNode) {
            heart.parentNode.removeChild(heart);
        }
    }, 1000);
}


// Comment System Functionality
function initCommentSystem() {
    const commentToggleBtn = document.querySelector('.comment-toggle-btn');
    const commentsSection = document.getElementById('comments-section');
    const closeCommentsBtn = document.getElementById('close-comments');
    const commentForm = document.getElementById('comment-form');
    const commentContent = document.getElementById('comment-content');
    const charCount = document.getElementById('char-count');
    
    // Toggle comments section visibility
    if (commentToggleBtn) {
        commentToggleBtn.addEventListener('click', function() {
            const postId = this.dataset.postId;
            if (commentsSection.classList.contains('hidden')) {
                showCommentsSection();
                loadComments(postId);
            } else {
                hideCommentsSection();
            }
        });
    }
    
    // Close comments section
    if (closeCommentsBtn) {
        closeCommentsBtn.addEventListener('click', hideCommentsSection);
    }
    
    // Character count for comment textarea
    if (commentContent && charCount) {
        commentContent.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            const submitBtn = commentForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = count === 0 || count > 1000;
            }
        });
    }
    
    // Handle comment form submission
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleCommentSubmit(this);
        });
    }
    
    // Handle comment deletion
    document.addEventListener('click', function(e) {
        if (e.target.closest('.delete-comment-btn')) {
            e.preventDefault();
            const btn = e.target.closest('.delete-comment-btn');
            const commentId = btn.dataset.commentId;
            handleCommentDelete(commentId);
        }
        
        // Handle load more comments
        if (e.target.closest('.load-more-comments')) {
            e.preventDefault();
            const btn = e.target.closest('.load-more-comments');
            const nextPage = btn.dataset.nextPage;
            const postId = document.querySelector('.comment-toggle-btn').dataset.postId;
            loadMoreComments(postId, nextPage);
        }
    });
}

function showCommentsSection() {
    const commentsSection = document.getElementById('comments-section');
    if (commentsSection) {
        commentsSection.classList.remove('hidden');
        // Smooth scroll to comments
        commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function hideCommentsSection() {
    const commentsSection = document.getElementById('comments-section');
    if (commentsSection) {
        commentsSection.classList.add('hidden');
    }
}

function loadComments(postId, page = 1) {
    const commentsLoading = document.getElementById('comments-loading');
    const commentsList = document.getElementById('comments-list');
    
    if (commentsLoading) commentsLoading.classList.remove('hidden');
    
    fetch(`/interactions/comments/${postId}/?page=${page}`)
        .then(response => response.json())
        .then(data => {
            if (commentsLoading) commentsLoading.classList.add('hidden');
            
            if (page === 1) {
                commentsList.innerHTML = data.comments_html;
            } else {
                // Append new comments for pagination
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data.comments_html;
                const newComments = tempDiv.querySelectorAll('.comment-item');
                newComments.forEach(comment => {
                    commentsList.appendChild(comment);
                });
                
                // Update load more button
                const loadMoreBtn = commentsList.querySelector('.load-more-comments');
                if (loadMoreBtn) {
                    if (data.has_next) {
                        loadMoreBtn.dataset.nextPage = data.current_page + 1;
                    } else {
                        loadMoreBtn.remove();
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error loading comments:', error);
            if (commentsLoading) commentsLoading.classList.add('hidden');
            showNotification('Error loading comments', 'error');
        });
}

function loadMoreComments(postId, page) {
    loadComments(postId, page);
}

function handleCommentSubmit(form) {
    const formData = new FormData(form);
    const postId = document.querySelector('.comment-toggle-btn').dataset.postId;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';
    
    fetch(`/interactions/comment/add/${postId}/`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrftoken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Clear form
            form.reset();
            document.getElementById('char-count').textContent = '0';
            
            // Add new comment to the top of the list
            const commentsList = document.getElementById('comments-list');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data.comment_html;
            const newComment = tempDiv.firstElementChild;
            
            // Insert at the beginning of comments list
            const commentsContainer = commentsList.querySelector('.comments-list') || commentsList;
            if (commentsContainer.firstChild) {
                commentsContainer.insertBefore(newComment, commentsContainer.firstChild);
            } else {
                commentsContainer.appendChild(newComment);
            }
            
            // Update comment count
            updateCommentCount(data.comment_count);
            
            // Show success notification
            showNotification('Comment posted successfully!', 'success');
            
            // Animate new comment
            newComment.style.opacity = '0';
            newComment.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                newComment.style.transition = 'all 0.3s ease';
                newComment.style.opacity = '1';
                newComment.style.transform = 'translateY(0)';
            }, 100);
        } else {
            showNotification(data.error || 'Error posting comment', 'error');
        }
    })
    .catch(error => {
        console.error('Error posting comment:', error);
        showNotification('Error posting comment', 'error');
    })
    .finally(() => {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

function handleCommentDelete(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) {
        return;
    }
    
    fetch(`/interactions/comment/delete/${commentId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Remove comment from DOM
            const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (commentItem) {
                commentItem.style.transition = 'all 0.3s ease';
                commentItem.style.opacity = '0';
                commentItem.style.transform = 'translateX(-20px)';
                setTimeout(() => {
                    commentItem.remove();
                }, 300);
            }
            
            // Update comment count
            updateCommentCount(data.comment_count);
            
            showNotification('Comment deleted successfully!', 'success');
        } else {
            showNotification(data.error || 'Error deleting comment', 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting comment:', error);
        showNotification('Error deleting comment', 'error');
    });
}

function updateCommentCount(count) {
    const commentCountSpan = document.querySelector('.comment-count');
    if (commentCountSpan) {
        commentCountSpan.textContent = `${count} Comments`;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-full shadow-lg text-white font-semibold text-sm transform transition-all duration-300 translate-x-full`;
    
    // Set background color based on type
    if (type === 'success') {
        notification.classList.add('bg-green-500');
    } else if (type === 'error') {
        notification.classList.add('bg-red-500');
    } else {
        notification.classList.add('bg-blue-500');
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initLikeButtons();
    initCommentSystem();
    
    // Add CSS animation for floating heart
    if (!document.getElementById('heart-animation-css')) {
        const style = document.createElement('style');
        style.id = 'heart-animation-css';
        style.textContent = `
            @keyframes floatUp {
                0% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-50px) scale(1.2);
                }
            }
        `;
        document.head.appendChild(style);
    }
});


// Basic form validation and UX improvements
function initForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            // Add loading states
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Please wait...';
                
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }, 2000);
            }
        });
    });
}


// Password strength validation
function initPasswordValidation() {
    const passwordField = document.querySelector('input[type="password"]');
    if (passwordField) {
        passwordField.addEventListener('input', function(e) {
            const strength = calculatePasswordStrength(e.target.value);
            updatePasswordIndicator(strength);
        });
    }
}

function calculatePasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
}

document.addEventListener('DOMContentLoaded', function() {
    // Handle single password toggle (login page)
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password-input');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const eyeClosed = document.getElementById('eye-closed');
            const eyeOpen = document.getElementById('eye-open');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeClosed.classList.add('hidden');
                eyeOpen.classList.remove('hidden');
            } else {
                passwordInput.type = 'password';
                eyeClosed.classList.remove('hidden');
                eyeOpen.classList.add('hidden');
            }
        });
    }
    
    // Handle multiple password toggles (register page)
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordField = this.previousElementSibling;
            const eyeClosed = this.querySelector('.eye-closed');
            const eyeOpen = this.querySelector('.eye-open');
            
            if (passwordField && passwordField.type === 'password') {
                passwordField.type = 'text';
                eyeClosed.classList.add('hidden');
                eyeOpen.classList.remove('hidden');
            } else if (passwordField) {
                passwordField.type = 'password';
                eyeClosed.classList.remove('hidden');
                eyeOpen.classList.add('hidden');
            }
        });
    });
});


// Category filter functionality
function initCategoryFilters() {
    document.addEventListener('click', function(e) {
        const pill = e.target.closest('.tag-pill');
        if (pill) {
            e.preventDefault();
            
            // Update active state
            const pills = document.querySelectorAll('.tag-pill');
            pills.forEach(p => {
                p.classList.remove('bg-gradient-to-r', 'from-amber-200', 'to-pink-200', 'text-purple-800');
                p.classList.add('text-purple-700');
            });
            
            pill.classList.add('bg-gradient-to-r', 'from-amber-200', 'to-pink-200', 'text-purple-800');
            pill.classList.remove('text-purple-700');
            
            // Get category from pill text
            const category = pill.textContent.trim().replace(/[^\w\s]/gi, '').trim();
            filterByCategory(category);
        }
    });
}

function filterByCategory(category) {
    console.log('Filtering by category:', category);
    
    // Here you would filter the posts or make an AJAX request
    // For demo purposes, we'll just add a loading effect
    const grid = document.querySelector('.masonry-grid');
    if (grid) {
        grid.style.opacity = '0.5';
        setTimeout(() => {
            grid.style.opacity = '1';
        }, 500);
    }
}

// Infinite scroll
function initInfiniteScroll() {
    let loading = false;
    let page = 1;
    
    window.addEventListener('scroll', function() {
        if (loading) return;
        
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
            loading = true;
            loadMoreContent();
        }
    });
    
    function loadMoreContent() {
        const loadMoreBtn = document.querySelector('button[contains("Load More")]');
        
        // Show loading state
        if (loadMoreBtn) {
            const originalText = loadMoreBtn.innerHTML;
            loadMoreBtn.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 mx-auto"></div>';
            loadMoreBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                // Here you would make an actual AJAX request
                // fetch(`/posts/load-more/?page=${++page}`)
                
                loadMoreBtn.innerHTML = originalText;
                loadMoreBtn.disabled = false;
                loading = false;
                
                console.log('Loaded more content for page:', page);
                page++;
            }, 1000);
        } else {
            loading = false;
        }
    }
}

// Animation initialization
function initAnimations() {
    // Smooth scrolling for navigation
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href^="#"]');
        if (link) {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });

    // Add intersection observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards
    document.querySelectorAll('.masonry-item').forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(item);
    });

    // Subtle parallax effect for images
    window.addEventListener('scroll', throttle(function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.masonry-item img');
        
        parallaxElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const speed = 0.05;
                el.style.transform = `translateY(${scrolled * speed}px)`;
            }
        });
    }, 16));
}


// File upload initialization
function initFileUpload() {
    const fileInput = document.querySelector('input[type="file"]');
    const uploadArea = document.querySelector('.file-upload-area');
    
    if (fileInput && uploadArea) {
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                previewImageBlogCover(fileInput);
            }
        });
        
        fileInput.addEventListener('change', function() {
            previewImageBlogCover(this);
        });
    }
}

// Image preview function
function previewImageBlogCover(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('image-preview');
            const uploadArea = document.getElementById('upload-area');
            const previewArea = document.getElementById('preview-area');
            
            if (preview && uploadArea && previewArea) {
                preview.src = e.target.result;
                uploadArea.classList.add('hidden');
                previewArea.classList.remove('hidden');
            }
        }
        reader.readAsDataURL(input.files[0]);
    }
}


// Search functionality with debouncing
function initSearch() {
    let searchTimeout;
    const searchInput = document.querySelector('.search-bar');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 300);
        });
        
        // Handle search form submission
        const searchForm = searchInput.closest('form');
        if (searchForm) {
            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                performSearch(searchInput.value);
            });
        }
    }
}

function performSearch(query) {
    console.log('Searching for:', query);
    
    // Add loading state
    const searchInput = document.querySelector('.search-bar');
    if (searchInput) {
        searchInput.style.opacity = '0.7';
        setTimeout(() => {
            searchInput.style.opacity = '1';
        }, 300);
    }
    
    // Here you would typically make an AJAX request to your search endpoint
    // For now, we'll just log the search query
    if (query.length > 2) {
        // Simulate search request
        fetch(`/feeds/search/?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
        .then(response => response.json())
        .then(data => {
            // Handle search results
            console.log('Search results:', data);
        })
        .catch(error => {
            console.error('Search error:', error);
        });
    }
}


function initReadingProgress() {
    const progressBar = document.querySelector('.reading-progress');
    if (progressBar) {
        window.addEventListener('scroll', function() {
            const article = document.querySelector('article');
            if (article) {
                const articleHeight = article.offsetHeight;
                const scrolled = window.scrollY;
                const progress = (scrolled / articleHeight) * 100;
                progressBar.style.width = Math.min(progress, 100) + '%';
            }
        });
    }
}


function initAdvancedSearch() {
    const searchForm = document.querySelector('.advanced-search-form');
    const searchInput = document.querySelector('.search-input');
    const suggestionsContainer = document.querySelector('.search-suggestions');
    
    if (searchInput) {
        let suggestionTimeout;
        
        searchInput.addEventListener('input', function(e) {
            clearTimeout(suggestionTimeout);
            suggestionTimeout = setTimeout(() => {
                fetchSearchSuggestions(e.target.value);
            }, 200);
        });
        
        searchInput.addEventListener('focus', function() {
            if (suggestionsContainer) {
                suggestionsContainer.classList.remove('hidden');
            }
        });
        
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !suggestionsContainer?.contains(e.target)) {
                suggestionsContainer?.classList.add('hidden');
            }
        });
    }
}

function fetchSearchSuggestions(query) {
    if (query.length < 2) return;
    
    fetch(`/api/search/suggestions/?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            displaySearchSuggestions(data.suggestions);
        })
        .catch(error => {
            console.error('Error fetching suggestions:', error);
        });
}

function displaySearchSuggestions(suggestions) {
    const container = document.querySelector('.search-suggestions');
    if (!container) return;
    
    container.innerHTML = '';
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'search-suggestion';
        item.textContent = suggestion;
        item.addEventListener('click', function() {
            document.querySelector('.search-input').value = suggestion;
            performSearch(suggestion);
            container.classList.add('hidden');
        });
        container.appendChild(item);
    });
}

function initSearchFilters() {
    const filterTags = document.querySelectorAll('.filter-tag');
    
    filterTags.forEach(tag => {
        tag.addEventListener('click', function() {
            this.classList.toggle('active');
            updateSearchResults();
        });
    });
}

function updateSearchResults() {
    const activeFilters = Array.from(document.querySelectorAll('.filter-tag.active'))
        .map(tag => tag.dataset.filter);
    
    const searchQuery = document.querySelector('.search-input').value;
    
    // Combine search query with filters
    const params = new URLSearchParams({
        q: searchQuery,
        filters: activeFilters.join(',')
    });
    
    fetch(`/api/search/?${params}`)
        .then(response => response.json())
        .then(data => {
            renderSearchResults(data.results);
        })
        .catch(error => {
            console.error('Error updating search results:', error);
        });
}


function initProfileTabs() {
    const tabs = document.querySelectorAll('.profile-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.add('hidden'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding content
            const targetContent = document.querySelector(`[data-tab-content="${targetTab}"]`);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }
        });
    });
}

function initProfileActions() {
    const followBtn = document.querySelector('.follow-btn');
    if (followBtn) {
        followBtn.addEventListener('click', function() {
            const userId = this.dataset.userId;
            const isFollowing = this.classList.contains('following');
            
            fetch(`/api/users/${userId}/follow/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ follow: !isFollowing })
            })
            .then(response => response.json())
            .then(data => {
                if (data.following) {
                    this.textContent = 'Following';
                    this.classList.add('following');
                } else {
                    this.textContent = 'Follow';
                    this.classList.remove('following');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    }
}


function initPostManagement() {
    const checkboxes = document.querySelectorAll('.post-checkbox');
    const bulkActions = document.querySelector('.bulk-actions');
    const selectAllBtn = document.querySelector('.select-all-posts');
    
    // Handle individual post selection
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateBulkActions();
        });
    });
    
    // Handle select all
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            const allSelected = Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => {
                cb.checked = !allSelected;
            });
            updateBulkActions();
        });
    }
    
    function updateBulkActions() {
        const selectedPosts = Array.from(checkboxes).filter(cb => cb.checked);
        if (selectedPosts.length > 0) {
            bulkActions?.classList.add('active');
            const countElement = bulkActions?.querySelector('.selected-count');
            if (countElement) {
                countElement.textContent = selectedPosts.length;
            }
        } else {
            bulkActions?.classList.remove('active');
        }
    }
    
    // Handle bulk actions
    const bulkDeleteBtn = document.querySelector('.bulk-delete');
    const bulkPublishBtn = document.querySelector('.bulk-publish');
    
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', function() {
            const selectedPosts = getSelectedPosts();
            if (selectedPosts.length > 0 && confirm(`Delete ${selectedPosts.length} posts?`)) {
                bulkDeletePosts(selectedPosts);
            }
        });
    }
    
    if (bulkPublishBtn) {
        bulkPublishBtn.addEventListener('click', function() {
            const selectedPosts = getSelectedPosts();
            if (selectedPosts.length > 0) {
                bulkPublishPosts(selectedPosts);
            }
        });
    }
}

function getSelectedPosts() {
    return Array.from(document.querySelectorAll('.post-checkbox:checked'))
        .map(cb => cb.value);
}

function bulkDeletePosts(postIds) {
    fetch('/api/posts/bulk-delete/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post_ids: postIds })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert('Error deleting posts');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error deleting posts');
    });
}

function bulkPublishPosts(postIds) {
    fetch('/api/posts/bulk-publish/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ post_ids: postIds })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert('Error publishing posts');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error publishing posts');
    });
}


function initPostEditor() {
    initAutosave();
    initFormValidation();
    initImageManagement();
    initPreviewMode();
    initCharacterCount();
}

function initAutosave() {
    const form = document.querySelector('.edit-form');
    const indicator = document.querySelector('.autosave-indicator');
    let saveTimeout;
    
    if (form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                clearTimeout(saveTimeout);
                
                // Show saving indicator
                if (indicator) {
                    indicator.textContent = 'Saving...';
                    indicator.className = 'autosave-indicator saving show';
                }
                
                saveTimeout = setTimeout(() => {
                    autosavePost();
                }, 2000);
            });
        });
    }
}

function autosavePost() {
    const form = document.querySelector('.edit-form');
    const indicator = document.querySelector('.autosave-indicator');
    
    if (!form) return;
    
    const formData = new FormData(form);
    formData.append('autosave', 'true');
    
    fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrftoken,
        },
    })
    .then(response => response.json())
    .then(data => {
        if (indicator) {
            if (data.success) {
                indicator.textContent = 'Saved';
                indicator.className = 'autosave-indicator show';
                setTimeout(() => {
                    indicator.classList.remove('show');
                }, 2000);
            } else {
                indicator.textContent = 'Save failed';
                indicator.className = 'autosave-indicator error show';
                setTimeout(() => {
                    indicator.classList.remove('show');
                }, 3000);
            }
        }
    })
    .catch(error => {
        console.error('Autosave error:', error);
        if (indicator) {
            indicator.textContent = 'Save failed';
            indicator.className = 'autosave-indicator error show';
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 3000);
        }
    });
}

function initFormValidation() {
    const form = document.querySelector('.edit-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            const isValid = validateForm();
            if (!isValid) {
                e.preventDefault();
            }
        });
        
        // Real-time validation
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', function() {
                validateField(this);
            });
        });
    }
}

function validateForm() {
    const form = document.querySelector('.edit-form');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    const fieldContainer = field.closest('.field-container') || field.parentElement;
    
    // Remove existing error messages
    const existingError = fieldContainer.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    field.classList.remove('field-error', 'field-success');
    
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Specific validations
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    
    if (field.name === 'title' && value.length < 3) {
        showFieldError(field, 'Title must be at least 3 characters long');
        return false;
    }
    
    if (field.name === 'content' && value.length < 10) {
        showFieldError(field, 'Content must be at least 10 characters long');
        return false;
    }
    
    // Field is valid
    field.classList.add('field-success');
    return true;
}

function showFieldError(field, message) {
    field.classList.add('field-error');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.innerHTML = `
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        ${message}
    `;
    
    const fieldContainer = field.closest('.field-container') || field.parentElement;
    fieldContainer.appendChild(errorElement);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function initImageManagement() {
    const removeImageBtn = document.querySelector('.remove-image-btn');
    
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to remove this image?')) {
                const preview = document.querySelector('.current-image-preview');
                if (preview) {
                    preview.style.display = 'none';
                }
                
                // Add hidden input to indicate image removal
                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = 'remove_image';
                hiddenInput.value = 'true';
                document.querySelector('.edit-form').appendChild(hiddenInput);
            }
        });
    }
}

function initPreviewMode() {
    const previewTabs = document.querySelectorAll('.preview-tab');
    const editArea = document.querySelector('.edit-area');
    const previewArea = document.querySelector('.preview-area');
    
    previewTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const mode = this.dataset.mode;
            
            // Update tab states
            previewTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            if (mode === 'edit') {
                editArea?.classList.remove('hidden');
                previewArea?.classList.add('hidden');
            } else {
                editArea?.classList.add('hidden');
                previewArea?.classList.remove('hidden');
                updatePreview();
            }
        });
    });
}

function updatePreview() {
    const contentField = document.querySelector('textarea[name="content"]');
    const previewContent = document.querySelector('.preview-content');
    
    if (contentField && previewContent) {
        // Simple markdown-like preview
        let content = contentField.value;
        content = content.replace(/\n/g, '<br>');
        content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        previewContent.innerHTML = content;
    }
}

function initCharacterCount() {
    const textareas = document.querySelectorAll('textarea[data-max-length]');
    
    textareas.forEach(textarea => {
        const maxLength = parseInt(textarea.dataset.maxLength);
        const countElement = document.createElement('div');
        countElement.className = 'char-count';
        
        textarea.parentElement.appendChild(countElement);
        
        function updateCount() {
            const currentLength = textarea.value.length;
            const remaining = maxLength - currentLength;
            
            countElement.textContent = `${currentLength}/${maxLength}`;
            
            if (remaining < 50) {
                countElement.className = 'char-count warning';
            } else if (remaining < 0) {
                countElement.className = 'char-count error';
            } else {
                countElement.className = 'char-count';
            }
        }
        
        textarea.addEventListener('input', updateCount);
        updateCount(); // Initial count
    });
}


function initDeleteConfirmation() {
    const deleteButtons = document.querySelectorAll('[data-delete-post]');
    const deleteForm = document.querySelector('.delete-form');
    const confirmCheckbox = document.querySelector('.confirmation-checkbox');
    const deleteSubmitBtn = document.querySelector('.delete-submit-btn');
    
    // Handle delete button clicks
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const postTitle = this.dataset.postTitle || 'this post';
            showDeleteConfirmation(postTitle, this.href);
        });
    });
    
    // Handle confirmation checkbox
    if (confirmCheckbox && deleteSubmitBtn) {
        confirmCheckbox.addEventListener('change', function() {
            deleteSubmitBtn.disabled = !this.checked;
            
            if (this.checked) {
                deleteSubmitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                deleteSubmitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        });
    }
    
    // Handle form submission
    if (deleteForm) {
        deleteForm.addEventListener('submit', function(e) {
            if (!confirmCheckbox?.checked) {
                e.preventDefault();
                showShakeAnimation();
                return false;
            }
            
            // Show loading state
            deleteSubmitBtn.disabled = true;
            deleteSubmitBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
            `;
        });
    }
}

function showDeleteConfirmation(postTitle, deleteUrl) {
    const modal = createDeleteModal(postTitle, deleteUrl);
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => {
        modal.classList.remove('opacity-0', 'scale-95');
        modal.classList.add('opacity-100', 'scale-100');
    }, 10);
    
    // Handle backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeDeleteModal(modal);
        }
    });
    
    // Handle escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeDeleteModal(modal);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function createDeleteModal(postTitle, deleteUrl) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 opacity-0 scale-95 transition-all duration-200';
    
    modal.innerHTML = `
        <div class="confirmation-modal max-w-md w-full mx-4 p-6 rounded-2xl">
            <div class="text-center mb-6">
                <div class="warning-icon w-16 h-16 mx-auto mb-4">
                    <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Delete Post</h3>
                <p class="text-gray-600">Are you sure you want to delete "${postTitle}"?</p>
            </div>
            
            <div class="danger-zone mb-6">
                <div class="flex items-start space-x-3">
                    <svg class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <div>
                        <h4 class="font-semibold text-red-800 mb-1">Warning</h4>
                        <p class="text-sm text-red-700">This action cannot be undone. The post and all its interactions will be permanently deleted.</p>
                    </div>
                </div>
            </div>
            
            <div class="mb-6">
                <label class="flex items-start space-x-3 cursor-pointer">
                    <input type="checkbox" class="confirmation-checkbox mt-1" required>
                    <span class="confirmation-text">I understand that this will permanently delete the post and all associated data.</span>
                </label>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3">
                <button class="danger-button flex-1 py-3 px-6 rounded-xl font-semibold opacity-50 cursor-not-allowed" disabled onclick="proceedWithDelete('${deleteUrl}')">
                    Delete Post
                </button>
                <button class="cancel-button flex-1 py-3 px-6 rounded-xl font-semibold" onclick="closeDeleteModal(this.closest('.fixed'))">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    // Setup checkbox functionality
    const checkbox = modal.querySelector('.confirmation-checkbox');
    const deleteBtn = modal.querySelector('.danger-button');
    
    checkbox.addEventListener('change', function() {
        deleteBtn.disabled = !this.checked;
        if (this.checked) {
            deleteBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            deleteBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    });
    
    return modal;
}

function closeDeleteModal(modal) {
    modal.classList.remove('opacity-100', 'scale-100');
    modal.classList.add('opacity-0', 'scale-95');
    
    setTimeout(() => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    }, 200);
}

function proceedWithDelete(deleteUrl) {
    // If we're already on the delete page, submit the form
    const deleteForm = document.querySelector('.delete-form');
    if (deleteForm) {
        deleteForm.submit();
    } else {
        // Otherwise redirect to delete page
        window.location.href = deleteUrl;
    }
}

function showShakeAnimation() {
    const modal = document.querySelector('.confirmation-modal');
    if (modal) {
        modal.classList.add('shake');
        setTimeout(() => {
            modal.classList.remove('shake');
        }, 500);
    }
}

function initBulkDeleteConfirmation() {
    const bulkDeleteBtn = document.querySelector('.bulk-delete-btn');
    
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const selectedCount = document.querySelectorAll('.post-checkbox:checked').length;
            if (selectedCount === 0) {
                showToast('Please select posts to delete', 'warning');
                return;
            }
            
            showBulkDeleteConfirmation(selectedCount);
        });
    }
}

function showBulkDeleteConfirmation(count) {
    const modal = createBulkDeleteModal(count);
    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.remove('opacity-0', 'scale-95');
        modal.classList.add('opacity-100', 'scale-100');
    }, 10);
}

function createBulkDeleteModal(count) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 opacity-0 scale-95 transition-all duration-200';
    
    modal.innerHTML = `
        <div class="confirmation-modal max-w-md w-full mx-4 p-6 rounded-2xl">
            <div class="text-center mb-6">
                <div class="warning-icon w-16 h-16 mx-auto mb-4">
                    <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Delete ${count} Posts</h3>
                <p class="text-gray-600">Are you sure you want to delete ${count} selected posts?</p>
            </div>
            
            <div class="danger-zone mb-6">
                <p class="text-sm text-red-700">This will permanently delete all selected posts and their associated data. This action cannot be undone.</p>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3">
                <button class="danger-button flex-1 py-3 px-6 rounded-xl font-semibold" onclick="confirmBulkDelete()">
                    Delete ${count} Posts
                </button>
                <button class="cancel-button flex-1 py-3 px-6 rounded-xl font-semibold" onclick="closeDeleteModal(this.closest('.fixed'))">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    return modal;
}

function confirmBulkDelete() {
    const selectedPosts = getSelectedPosts();
    const modal = document.querySelector('.fixed');
    
    if (selectedPosts.length > 0) {
        bulkDeletePosts(selectedPosts);
        closeDeleteModal(modal);
    }
}


/**
 * Main JavaScript file for Freespaces
 * Contains all JavaScript functionality for the application
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initProfileDropdown();
    // Add other initializations here as needed
});

/**
 * Profile Dropdown Functionality
 * Handles the profile avatar dropdown menu interactions
 */
function initProfileDropdown() {
    const profileButton = document.getElementById('profileButton');
    const profileDropdown = document.getElementById('profileDropdown');
    
    // Only initialize if both elements exist (user is authenticated)
    if (!profileButton || !profileDropdown) {
        return;
    }
    
    /**
     * Toggle dropdown visibility when profile button is clicked
     */
    profileButton.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleProfileDropdown();
    });
    
    /**
     * Close dropdown when clicking outside of it
     */
    document.addEventListener('click', function(e) {
        if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target)) {
            closeProfileDropdown();
        }
    });
    
    /**
     * Close dropdown when pressing Escape key
     */
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeProfileDropdown();
        }
    });
    
    /**
     * Handle dropdown links for better UX
     */
    const dropdownLinks = profileDropdown.querySelectorAll('a');
    dropdownLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Close dropdown when a link is clicked
            closeProfileDropdown();
        });
    });
}

/**
 * Toggle the profile dropdown visibility
 */
function toggleProfileDropdown() {
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileDropdown) {
        profileDropdown.classList.toggle('hidden');
    }
}

/**
 * Close the profile dropdown
 */
function closeProfileDropdown() {
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
        profileDropdown.classList.add('hidden');
    }
}

/**
 * Open the profile dropdown
 */
function openProfileDropdown() {
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileDropdown && profileDropdown.classList.contains('hidden')) {
        profileDropdown.classList.remove('hidden');
    }
}


let cropper = null;

// JavaScript functions for inline editing
function toggleNameEdit() {
    const display = document.getElementById('name-display');
    const edit = document.getElementById('name-edit');
    
    display.classList.toggle('hidden');
    edit.classList.toggle('hidden');
}

function toggleBioEdit() {
    const display = document.getElementById('bio-display');
    const edit = document.getElementById('bio-edit');
    
    display.classList.toggle('hidden');
    edit.classList.toggle('hidden');
}

function toggleSocialEdit() {
    const display = document.getElementById('social-display');
    const edit = document.getElementById('social-edit');
    
    display.classList.toggle('hidden');
    edit.classList.toggle('hidden');
}

// Avatar cropping functions
document.getElementById('avatar-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const image = document.getElementById('cropImage');
            image.src = event.target.result;
            
            // Show modal
            document.getElementById('cropModal').classList.remove('hidden');
            
            // Initialize cropper
            if (cropper) {
                cropper.destroy();
            }
            
            cropper = new Cropper(image, {
                aspectRatio: 1, // Square crop
                viewMode: 2, // Restrict crop box to not exceed canvas
                dragMode: 'move',
                autoCropArea: 0.8,
                cropBoxResizable: true,
                cropBoxMovable: true,
                guides: true,
                center: true,
                highlight: false,
                background: true,
                responsive: true,
                restore: false,
                checkCrossOrigin: false,
                checkOrientation: false,
                toggleDragModeOnDblclick: false,
                // Contain drag interactions within the container
                modal: true,
                scalable: true,
                zoomable: true,
                zoomOnTouch: true,
                zoomOnWheel: true,
                wheelZoomRatio: 0.1,
                cropBoxResizable: true,
                minContainerWidth: 200,
                minContainerHeight: 200,
            });
        };
        reader.readAsDataURL(file);
    }
});

function closeCropModal() {
    document.getElementById('cropModal').classList.add('hidden');
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    // Clear the file input
    document.getElementById('avatar-upload').value = '';
}

function saveCroppedImage() {
    if (cropper) {
        const canvas = cropper.getCroppedCanvas({
            width: 300,
            height: 300,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });
        
        const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
        
        // Set the cropped image data in hidden input
        document.getElementById('cropped-image-data').value = croppedImage;
        
        // Submit the form
        document.getElementById('cropped-form').submit();
        
        // Close modal
        closeCropModal();
    }
}


// Rich Text Editor Functions

// Core formatting function
function formatDoc(command, value = null) {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    editor.focus();
    
    try {
        if (value !== null) {
            document.execCommand(command, false, value);
        } else {
            document.execCommand(command, false, null);
        }
        updateHiddenField();
        updateToolbarState();
    } catch (error) {
        console.error('Error executing command:', error);
    }
}

// Text formatting functions
function makeBold() {
    formatDoc('bold');
}

function makeItalic() {
    formatDoc('italic');
}

function makeUnderline() {
    formatDoc('underline');
}

// Font size functions
function setFontSize(size) {
    formatDoc('fontSize', size);
}

function increaseFontSize() {
    const currentSize = document.queryCommandValue('fontSize');
    const newSize = Math.min(parseInt(currentSize) + 1, 7);
    formatDoc('fontSize', newSize);
}

function decreaseFontSize() {
    const currentSize = document.queryCommandValue('fontSize');
    const newSize = Math.max(parseInt(currentSize) - 1, 1);
    formatDoc('fontSize', newSize);
}

// List functions
function insertOrderedList() {
    formatDoc('insertOrderedList');
}

function insertUnorderedList() {
    formatDoc('insertUnorderedList');
}

function insertBulletList() {
    formatDoc('insertUnorderedList');
}

function insertNumberedList() {
    formatDoc('insertOrderedList');
}

// Block formatting functions
function insertBlockquote() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    editor.focus();
    
    // Check if current selection is already in a blockquote
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        let node = selection.getRangeAt(0).commonAncestorContainer;
        
        // Find the closest blockquote parent
        while (node && node !== editor) {
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BLOCKQUOTE') {
                // Remove blockquote - unwrap its contents
                const parent = node.parentNode;
                while (node.firstChild) {
                    parent.insertBefore(node.firstChild, node);
                }
                parent.removeChild(node);
                updateHiddenField();
                updateToolbarState();
                return;
            }
            node = node.parentNode;
        }
    }
    
    // If not in blockquote, create one
    formatDoc('formatBlock', '<blockquote>');
}

function insertQuote() {
    insertBlockquote();
}

function insertParagraph() {
    formatDoc('formatBlock', '<p>');
}

// Heading functions
function insertH1() {
    formatDoc('formatBlock', '<h1>');
}

function insertH2() {
    formatDoc('formatBlock', '<h2>');
}

function insertH3() {
    formatDoc('formatBlock', '<h3>');
}

function insertH4() {
    formatDoc('formatBlock', '<h4>');
}

// Text alignment functions
function alignLeft() {
    formatDoc('justifyLeft');
}

function alignCenter() {
    formatDoc('justifyCenter');
}

function alignRight() {
    formatDoc('justifyRight');
}

function alignJustify() {
    formatDoc('justifyFull');
}

// Text color functions
function setTextColor(color) {
    formatDoc('foreColor', color);
}

function setBackgroundColor(color) {
    formatDoc('hiliteColor', color);
}

function insertImage(src, alt) {
    if (!src) {
        src = prompt('Enter image URL:');
        if (!src) return;
    }
    
    const altText = alt || prompt('Enter alt text:') || '';
    insertHTMLAtCursor(`<img src="${src}" alt="${altText}" style="max-width: 100%;">`);
}

function insertHorizontalRule() {
    formatDoc('insertHorizontalRule');
}

function insertLineBreak() {
    formatDoc('insertHTML', '<br>');
}

// List indentation helper functions
function indentListItem(listItem, listType) {
    const parentList = listItem.parentNode;
    const previousSibling = listItem.previousElementSibling;
    
    if (previousSibling && previousSibling.tagName === 'LI') {
        // There's a previous list item - create or use nested list
        let nestedList = previousSibling.querySelector('ol, ul');
        
        if (!nestedList) {
            // Create new nested list
            nestedList = document.createElement(listType.toLowerCase());
            previousSibling.appendChild(nestedList);
        }
        
        // Move current item to nested list
        parentList.removeChild(listItem);
        nestedList.appendChild(listItem);
        
        // Position cursor in the moved item
        positionCursorInElement(listItem);
    }
}

function outdentListItem(listItem) {
    const currentList = listItem.parentNode;
    const parentListItem = currentList.parentNode;
    
    if (parentListItem && parentListItem.tagName === 'LI') {
        // This is a nested list item
        const grandParentList = parentListItem.parentNode;
        
        // Remove from current list
        currentList.removeChild(listItem);
        
        // Add to parent level after the parent list item
        const nextSibling = parentListItem.nextSibling;
        if (nextSibling) {
            grandParentList.insertBefore(listItem, nextSibling);
        } else {
            grandParentList.appendChild(listItem);
        }
        
        // Clean up empty nested list
        if (currentList.children.length === 0) {
            parentListItem.removeChild(currentList);
        }
        
        // Position cursor in the moved item
        positionCursorInElement(listItem);
    }
}

function positionCursorInElement(element) {
    const selection = window.getSelection();
    const range = document.createRange();
    
    // Try to position at the end of text content
    if (element.firstChild && element.firstChild.nodeType === Node.TEXT_NODE) {
        range.setStart(element.firstChild, element.firstChild.textContent.length);
    } else if (element.textContent) {
        range.selectNodeContents(element);
        range.collapse(false); // Collapse to end
    } else {
        range.setStart(element, 0);
    }
    
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
}

// Selection functions
function selectAll() {
    formatDoc('selectAll');
}

function clearSelection() {
    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }
}

// Undo/Redo functions
function undo() {
    formatDoc('undo');
}

function redo() {
    formatDoc('redo');
}

// Cut, Copy, Paste functions
function cutText() {
    formatDoc('cut');
}

function copyText() {
    formatDoc('copy');
}

function pasteText() {
    formatDoc('paste');
}

// Clear formatting functions
function removeFormat() {
    formatDoc('removeFormat');
}

function clearFormatting() {
    formatDoc('removeFormat');
}

function stripHTML() {
    const editor = document.getElementById('editor');
    if (editor) {
        const text = editor.textContent || editor.innerText || '';
        editor.innerHTML = text;
        updateHiddenField();
    }
}

// Content manipulation functions
function replaceText(searchText, replaceText) {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    let content = editor.innerHTML;
    content = content.replace(new RegExp(searchText, 'g'), replaceText);
    editor.innerHTML = content;
    updateHiddenField();
}

function appendText(text) {
    const editor = document.getElementById('editor');
    if (editor) {
        editor.innerHTML += text;
        updateHiddenField();
    }
}

function prependText(text) {
    const editor = document.getElementById('editor');
    if (editor) {
        editor.innerHTML = text + editor.innerHTML;
        updateHiddenField();
    }
}

function clearContent() {
    const editor = document.getElementById('editor');
    if (editor) {
        editor.innerHTML = '';
        updateHiddenField();
    }
}

// Word processing functions
function getWordCount() {
    const editor = document.getElementById('editor');
    if (!editor) return 0;
    
    const text = editor.textContent || editor.innerText || '';
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function getCharacterCount() {
    const editor = document.getElementById('editor');
    if (!editor) return 0;
    
    const text = editor.textContent || editor.innerText || '';
    return text.length;
}

// Table functions
function insertTable(rows = 3, cols = 3) {
    let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%;">';
    for (let i = 0; i < rows; i++) {
        tableHTML += '<tr>';
        for (let j = 0; j < cols; j++) {
            tableHTML += '<td style="padding: 8px; border: 1px solid #ccc;">&nbsp;</td>';
        }
        tableHTML += '</tr>';
    }
    tableHTML += '</table>';
    
    insertHTMLAtCursor(tableHTML);
}

// Print function
function printContent() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    const content = editor.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Print Content</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    blockquote { 
                        border-left: 4px solid #f59e0b; 
                        margin-left: 0; 
                        padding-left: 16px; 
                        background: rgba(245, 158, 11, 0.1); 
                    }
                </style>
            </head>
            <body>${content}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Export functions
function exportToHTML() {
    const editor = document.getElementById('editor');
    if (!editor) return '';
    
    return editor.innerHTML;
}

function exportToText() {
    const editor = document.getElementById('editor');
    if (!editor) return '';
    
    return editor.textContent || editor.innerText || '';
}

// Import functions
function importHTML(html) {
    const editor = document.getElementById('editor');
    if (editor) {
        editor.innerHTML = html;
        updateHiddenField();
    }
}

function importText(text) {
    const editor = document.getElementById('editor');
    if (editor) {
        editor.textContent = text;
        updateHiddenField();
    }
}

// Focus and blur functions
function focusEditor() {
    const editor = document.getElementById('editor');
    if (editor) {
        editor.focus();
    }
}

function blurEditor() {
    const editor = document.getElementById('editor');
    if (editor) {
        editor.blur();
    }
}

// State checking functions
function isBold() {
    return document.queryCommandState('bold');
}

function isItalic() {
    return document.queryCommandState('italic');
}

function isUnderline() {
    return document.queryCommandState('underline');
}

function isOrderedList() {
    return document.queryCommandState('insertOrderedList');
}

function isUnorderedList() {
    return document.queryCommandState('insertUnorderedList');
}

// Content validation functions
function isEmpty() {
    const editor = document.getElementById('editor');
    if (!editor) return true;
    
    const text = (editor.textContent || editor.innerText || '').trim();
    return text.length === 0;
}

function isValidHTML() {
    const editor = document.getElementById('editor');
    if (!editor) return false;
    
    try {
        const div = document.createElement('div');
        div.innerHTML = editor.innerHTML;
        return true;
    } catch (e) {
        return false;
    }
}

// Update the hidden textarea with the editor content
function updateHiddenField() {
    const editor = document.getElementById('editor');
    const hiddenField = document.getElementById('hidden-content');
    
    if (editor && hiddenField) {
        hiddenField.value = editor.innerHTML;
    }
}

// Update toolbar button states based on current selection
function updateToolbarState() {
    const buttons = document.querySelectorAll('.toolbar-btn');
    
    buttons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Check for bold
    if (document.queryCommandState('bold')) {
        document.querySelector('.toolbar-btn[onclick*="bold"]')?.classList.add('active');
    }
    
    // Check for italic
    if (document.queryCommandState('italic')) {
        document.querySelector('.toolbar-btn[onclick*="italic"]')?.classList.add('active');
    }
    
    // Check for underline
    if (document.queryCommandState('underline')) {
        document.querySelector('.toolbar-btn[onclick*="underline"]')?.classList.add('active');
    }
    
    // Check for ordered list
    if (document.queryCommandState('insertOrderedList')) {
        document.querySelector('.toolbar-btn[onclick*="insertOrderedList"]')?.classList.add('active');
    }
    
    // Check for unordered list
    if (document.queryCommandState('insertUnorderedList')) {
        document.querySelector('.toolbar-btn[onclick*="insertUnorderedList"]')?.classList.add('active');
    }
    
    // Check for blockquote
    const selection = window.getSelection();
    let isInBlockquote = false;
    
    if (selection.rangeCount > 0) {
        let node = selection.getRangeAt(0).commonAncestorContainer;
        while (node && node !== document.getElementById('editor')) {
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BLOCKQUOTE') {
                isInBlockquote = true;
                break;
            }
            node = node.parentNode;
        }
    }
    
    if (isInBlockquote) {
        document.querySelector('.toolbar-btn[onclick*="insertBlockquote"]')?.classList.add('active');
    }
}

// Handle image preview for file uploads
function previewInlineImage(input) {
    const uploadArea = document.getElementById('upload-area');
    const previewArea = document.getElementById('preview-area');
    const imagePreview = document.getElementById('image-preview');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            uploadArea.classList.add('hidden');
            previewArea.classList.remove('hidden');
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Initialize rich text editor when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('editor');
    const hiddenField = document.getElementById('hidden-content');
    
    if (editor && hiddenField) {
        // Set initial content if exists
        if (hiddenField.value) {
            editor.innerHTML = hiddenField.value;
        }

        // Set initial font size
        editor.style.fontSize = '12pt';

        // Add event listeners
        editor.addEventListener('input', function() {
            updateHiddenField();
        });
        
        editor.addEventListener('keyup', function() {
            updateToolbarState();
        });
        
        editor.addEventListener('mouseup', function() {
            updateToolbarState();
        });
        
        editor.addEventListener('focus', function() {
            updateToolbarState();
        });
        
        // Handle paste events to clean up formatting
        editor.addEventListener('paste', function(e) {
            e.preventDefault();
            
            // Get plain text from clipboard
            const text = (e.originalEvent || e).clipboardData.getData('text/plain');
            
            // Insert the plain text
            document.execCommand('insertText', false, text);
            
            updateHiddenField();
        });
        
            // Handle keyboard shortcuts and list continuation
            editor.addEventListener('keydown', function(e) {
                if (e.ctrlKey || e.metaKey) {
                    switch(e.key) {
                        case 'b':
                            e.preventDefault();
                            formatDoc('bold');
                            break;
                        case 'i':
                            e.preventDefault();
                            formatDoc('italic');
                            break;
                        case 'u':
                            e.preventDefault();
                            formatDoc('underline');
                            break;
                    }
                }
                
                // Handle Tab key for list indentation
                if (e.key === 'Tab') {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        let currentElement = range.commonAncestorContainer;
                        
                        // Find the closest list item
                        while (currentElement && currentElement !== editor) {
                            if (currentElement.nodeType === Node.ELEMENT_NODE && currentElement.tagName === 'LI') {
                                e.preventDefault();
                                
                                const listItem = currentElement;
                                const parentList = listItem.parentNode;
                                const listType = parentList.tagName; // OL or UL
                                
                                if (e.shiftKey) {
                                    // Shift+Tab: Outdent (move to parent level)
                                    outdentListItem(listItem);
                                } else {
                                    // Tab: Indent (create nested list)
                                    indentListItem(listItem, listType);
                                }
                                
                                updateHiddenField();
                                updateToolbarState();
                                return;
                            }
                            currentElement = currentElement.parentNode;
                        }
                    }
                }
            
                // Handle Enter key for list continuation and line breaks
                if (e.key === 'Enter') {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        let currentElement = range.commonAncestorContainer;
                        
                        // Find the closest list item or list parent
                        while (currentElement && currentElement !== editor) {
                            if (currentElement.nodeType === Node.ELEMENT_NODE) {
                                const tagName = currentElement.tagName;
                                
                                // Handle list items
                                if (tagName === 'LI') {
                                    const listItem = currentElement;
                                    const list = listItem.parentNode;
                                    
                                    // Check if list item is empty
                                    const text = (listItem.textContent || listItem.innerText || '').trim();
                                    
                                    if (text === '' || text === '\u00A0') {
                                        // Empty list item - check if it's nested
                                        const nestedList = listItem.querySelector('ol, ul');
                                        if (nestedList || (list.parentNode && list.parentNode.tagName === 'LI')) {
                                            // If nested, move up one level instead of exiting completely
                                            e.preventDefault();
                                            outdentListItem(listItem);
                                            updateHiddenField();
                                            updateToolbarState();
                                            return;
                                        } else {
                                            // Not nested - exit the list completely
                                            e.preventDefault();
                                            
                                            // Remove the empty list item
                                            listItem.parentNode.removeChild(listItem);
                                            
                                            // Create a new paragraph after the list
                                            const newP = document.createElement('p');
                                            newP.innerHTML = '<br>';
                                            
                                            if (list.nextSibling) {
                                                list.parentNode.insertBefore(newP, list.nextSibling);
                                            } else {
                                                list.parentNode.appendChild(newP);
                                            }
                                            
                                            // Position cursor in the new paragraph
                                            const newRange = document.createRange();
                                            newRange.setStart(newP, 0);
                                            newRange.collapse(true);
                                            selection.removeAllRanges();
                                            selection.addRange(newRange);
                                            
                                            updateHiddenField();
                                            updateToolbarState();
                                            return;
                                        }
                                    } else {
                                        // Non-empty list item - let browser handle normally for continuation
                                        setTimeout(() => {
                                            updateHiddenField();
                                            updateToolbarState();
                                        }, 10);
                                        return;
                                    }
                                }
                                
                                // Handle being inside ordered or unordered lists
                                if (tagName === 'OL' || tagName === 'UL') {
                                    // Let browser handle list continuation normally
                                    setTimeout(() => {
                                        updateHiddenField();
                                        updateToolbarState();
                                    }, 10);
                                    return;
                                }
                            }
                            currentElement = currentElement.parentNode;
                        }
                    }
                    
                    // Default behavior for non-list elements
                    if (!e.shiftKey) {
                        // Create a new line with proper spacing
                        document.execCommand('insertHTML', false, '<br><br>');
                        e.preventDefault();
                        updateHiddenField();
                    }
                }
                
                // Handle backspace in lists
                if (e.key === 'Backspace') {
                    const selection = window.getSelection();
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        let currentElement = range.commonAncestorContainer;
                        
                        // Check if we're at the beginning of a list item
                        while (currentElement && currentElement !== editor) {
                            if (currentElement.nodeType === Node.ELEMENT_NODE && currentElement.tagName === 'LI') {
                                const listItem = currentElement;
                                
                                // Check if cursor is at the very beginning of the list item
                                if (range.startOffset === 0 && range.collapsed) {
                                    const text = (listItem.textContent || listItem.innerText || '').trim();
                                    
                                    if (text === '' || text === '\u00A0') {
                                        // Empty list item - remove it and exit list or move up level
                                        e.preventDefault();
                                        
                                        const list = listItem.parentNode;
                                        const isNested = list.parentNode && list.parentNode.tagName === 'LI';
                                        
                                        if (isNested) {
                                            // Nested list - move up one level
                                            outdentListItem(listItem);
                                        } else {
                                            // Top level - remove item
                                            listItem.parentNode.removeChild(listItem);
                                            
                                            // If list is now empty, remove it entirely
                                            if (list.children.length === 0) {
                                                const newP = document.createElement('p');
                                                newP.innerHTML = '<br>';
                                                list.parentNode.replaceChild(newP, list);
                                                
                                                // Position cursor
                                                const newRange = document.createRange();
                                                newRange.setStart(newP, 0);
                                                newRange.collapse(true);
                                                selection.removeAllRanges();
                                                selection.addRange(newRange);
                                            }
                                        }
                                        
                                        updateHiddenField();
                                        updateToolbarState();
                                        return;
                                    }
                                }
                                break;
                            }
                            currentElement = currentElement.parentNode;
                        }
                    }
                }
            });
        
        // Prevent losing focus when clicking toolbar buttons
        const toolbarButtons = document.querySelectorAll('.toolbar-btn');
        toolbarButtons.forEach(button => {
            button.addEventListener('mousedown', function(e) {
                e.preventDefault();
            });
        });
        
        // Handle font size selector
        const fontSizeSelector = document.querySelector('.font-size-selector');
        if (fontSizeSelector) {
            fontSizeSelector.addEventListener('mousedown', function(e) {
                e.preventDefault();
            });
        }
        
        // Initial toolbar state update
        setTimeout(() => {
            updateToolbarState();
        }, 100);
    }
    
    // Form submission handler to ensure content is saved
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            updateHiddenField();
        });
    }
});

// Additional utility functions for rich text editing

// Clean up HTML content (remove unwanted tags/attributes)
function cleanHTML(html) {
    const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Remove unwanted elements
    const allElements = div.querySelectorAll('*');
    allElements.forEach(el => {
        if (!allowedTags.includes(el.tagName.toLowerCase())) {
            el.outerHTML = el.innerHTML;
        }
        
        // Remove all attributes except for basic ones
        if (el.attributes) {
            Array.from(el.attributes).forEach(attr => {
                if (!['class'].includes(attr.name)) {
                    el.removeAttribute(attr.name);
                }
            });
        }
    });
    
    return div.innerHTML;
}

// Insert HTML at cursor position
function insertHTMLAtCursor(html) {
    const editor = document.getElementById('editor');
    editor.focus();
    
    if (document.selection) {
        // IE
        const range = document.selection.createRange();
        range.pasteHTML(html);
    } else if (window.getSelection) {
        // Modern browsers
        const selection = window.getSelection();
        if (selection.getRangeAt && selection.rangeCount) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            const el = document.createElement('div');
            el.innerHTML = html;
            const frag = document.createDocumentFragment();
            let node;
            while ((node = el.firstChild)) {
                frag.appendChild(node);
            }
            range.insertNode(frag);
            
            // Move cursor to end of inserted content
            const newRange = document.createRange();
            newRange.setStartAfter(frag);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
    }
    
    updateHiddenField();
}

// Get selected text
function getSelectedText() {
    const selection = window.getSelection();
    return selection.toString();
}

// Check if editor has content
function hasContent() {
    const editor = document.getElementById('editor');
    if (!editor) return false;
    
    const text = editor.textContent || editor.innerText || '';
    return text.trim().length > 0;
}

function insertInlineImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleInlineImageUpload(file);
        }
    });
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

function handleInlineImageUpload(file) {
    // Validate file size (e.g., 10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showToast('Image size must be less than 10MB', 'error');
        return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        insertImageWithCaption(e.target.result, file.name);
    };
    reader.readAsDataURL(file);
}

function insertImageWithCaption(imageSrc, fileName) {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    // Check if we're in edit mode (has editor) vs view mode
    const isEditMode = editor.getAttribute('contenteditable') === 'true';
    
    // Generate unique ID for this image
    const imageId = 'img-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Only show remove button in edit mode
    const removeButton = isEditMode ? `
        <button type="button" 
                class="remove-inline-image editor-only" 
                onclick="removeInlineImage('${imageId}')"
                style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center;"
                title="Remove image">×</button>` : '';
    
    // Create the image container with caption
    const imageContainer = `
        <div class="inline-image-container" data-image-id="${imageId}" style="text-align: center; margin: 20px 0; clear: both;">
            <div class="image-wrapper" style="position: relative; display: inline-block; max-width: 100%;">
                <img src="${imageSrc}" 
                     alt="${fileName}" 
                     style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
                     class="inline-uploaded-image">
                ${removeButton}
            </div>
            <div class="image-caption-container" style="margin-top: 8px;">
                <div class="image-caption ${isEditMode ? 'editable-caption' : 'static-caption'}" 
                     ${isEditMode ? 'contenteditable="true"' : ''}
                     placeholder="Add a caption (optional)..."
                     style="font-size: 14px; color: #6b7280; font-style: italic; outline: none; border: 1px solid transparent; padding: 4px 8px; border-radius: 4px; min-height: 20px; cursor: ${isEditMode ? 'text' : 'default'};"
                     data-placeholder="Add a caption (optional)..."
                     ${isEditMode ? 'onblur="updateHiddenField()" oninput="updateHiddenField(); handleCaptionInput(this)" onclick="selectAllCaptionText(this)"' : ''}></div>
            </div>
        </div>
    `;
    
    // Insert the image at cursor position
    insertHTMLAtCursor(imageContainer);
    
    // Focus on the caption field and select the placeholder text
    if (isEditMode) {
        setTimeout(() => {
            const captionDiv = document.querySelector(`[data-image-id="${imageId}"] .image-caption`);
            if (captionDiv) {
                captionDiv.textContent = 'Add a caption (optional)...';
                captionDiv.focus();
                selectAllCaptionText(captionDiv);
            }
            updateHiddenField();
        }, 100);
    }
}

function removeInlineImage(imageId) {
    const imageContainer = document.querySelector(`[data-image-id="${imageId}"]`);
    if (imageContainer) {
        // Also remove the following br if it exists
        const nextElement = imageContainer.nextElementSibling;
        if (nextElement && nextElement.tagName === 'DIV' && nextElement.innerHTML === '<br>') {
            nextElement.remove();
        }
        imageContainer.remove();
        updateHiddenField();
        
        // Refocus the editor
        const editor = document.getElementById('editor');
        if (editor) {
            editor.focus();
        }
    }
}

function handleCaptionInput(captionDiv) {
    // Handle placeholder behavior
    const text = captionDiv.textContent.trim();
    
    if (text === '' || text === 'Add a caption (optional)...') {
        captionDiv.style.color = '#9ca3af';
        captionDiv.style.fontStyle = 'italic';
    } else {
        captionDiv.style.color = '#6b7280';
        captionDiv.style.fontStyle = 'italic';
    }
}

// New function to handle caption text selection
function selectAllCaptionText(captionDiv) {
    const text = captionDiv.textContent.trim();
    
    // If it's the placeholder text, select all for easy replacement
    if (text === 'Add a caption (optional)...' || text === '') {
        // Set the placeholder text if empty
        if (text === '') {
            captionDiv.textContent = 'Add a caption (optional)...';
        }
        
        // Select all text for easy replacement
        setTimeout(() => {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(captionDiv);
            selection.removeAllRanges();
            selection.addRange(range);
        }, 10);
    }
}

// Function to clean up content when publishing (remove editor-only elements)
function cleanContentForPublishing(content) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Remove all editor-only elements (like delete buttons)
    const editorOnlyElements = tempDiv.querySelectorAll('.editor-only, .remove-inline-image');
    editorOnlyElements.forEach(element => element.remove());
    
    // Clean up empty captions
    const emptyCaptions = tempDiv.querySelectorAll('.image-caption');
    emptyCaptions.forEach(caption => {
        const text = caption.textContent.trim();
        if (text === 'Add a caption (optional)...' || text === '') {
            caption.textContent = '';
            caption.style.display = 'none';
        }
        // Remove contenteditable attribute for published content
        caption.removeAttribute('contenteditable');
        caption.classList.remove('editable-caption');
        caption.classList.add('static-caption');
    });
    
    // Remove unnecessary line breaks after images
    const imageContainers = tempDiv.querySelectorAll('.inline-image-container');
    imageContainers.forEach(container => {
        // Remove any trailing br elements after the image container
        let nextSibling = container.nextSibling;
        while (nextSibling) {
            if (nextSibling.nodeType === Node.ELEMENT_NODE && 
                nextSibling.tagName === 'DIV' && 
                nextSibling.innerHTML === '<br>') {
                const toRemove = nextSibling;
                nextSibling = nextSibling.nextSibling;
                toRemove.remove();
            } else if (nextSibling.nodeType === Node.ELEMENT_NODE && 
                       nextSibling.tagName === 'BR') {
                const toRemove = nextSibling;
                nextSibling = nextSibling.nextSibling;
                toRemove.remove();
            } else {
                break;
            }
        }
    });
    
    return tempDiv.innerHTML;
}

// NEW FUNCTION: Clean content for display (removes editor-only elements from view)
function cleanContentForDisplay() {
    // Only run this on the view page (not edit page)
    const editor = document.getElementById('editor');
    const richTextContent = document.querySelector('.rich-text-content');
    
    // If we're on the view page (rich-text-content exists but no contenteditable editor)
    if (richTextContent && (!editor || editor.getAttribute('contenteditable') !== 'true')) {
        // Remove all delete buttons that might still be in the content
        const deleteButtons = richTextContent.querySelectorAll('.remove-inline-image, .editor-only');
        deleteButtons.forEach(button => button.remove());
        
        // Remove contenteditable from any captions
        const captions = richTextContent.querySelectorAll('.image-caption');
        captions.forEach(caption => {
            caption.removeAttribute('contenteditable');
            caption.removeAttribute('onclick');
            caption.removeAttribute('oninput');
            caption.removeAttribute('onblur');
            caption.classList.remove('editable-caption');
            caption.classList.add('static-caption');
            
            // Clean up empty captions
            const text = caption.textContent.trim();
            if (text === 'Add a caption (optional)...' || text === '') {
                caption.textContent = '';
                caption.style.display = 'none';
            }
        });
        
        // Remove hover effects for image containers in view mode
        const imageContainers = richTextContent.querySelectorAll('.inline-image-container');
        imageContainers.forEach(container => {
            container.style.border = 'none';
            container.addEventListener('mouseenter', (e) => {
                e.target.style.borderColor = 'transparent';
            });
        });
    }
}

// Enhanced insertHTMLAtCursor function specifically for images
function insertHTMLAtCursor(html) {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    editor.focus();
    
    const selection = window.getSelection();
    let range;
    
    if (selection.getRangeAt && selection.rangeCount) {
        range = selection.getRangeAt(0);
        range.deleteContents();
        
        // Create a temporary div to hold our HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Insert each node
        const frag = document.createDocumentFragment();
        while (temp.firstChild) {
            frag.appendChild(temp.firstChild);
        }
        
        range.insertNode(frag);
        
        // Move cursor after inserted content
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        // Fallback for older browsers
        editor.innerHTML += html;
    }
    
    updateHiddenField();
}

// Drag and drop functionality for images
function initInlineImageDragDrop() {
    const editor = document.getElementById('editor');
    if (!editor || editor.getAttribute('contenteditable') !== 'true') return;
    
    editor.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        editor.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
    });
    
    editor.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        editor.style.backgroundColor = '';
    });
    
    editor.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        editor.style.backgroundColor = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // Position cursor at drop location
            const range = document.caretRangeFromPoint(e.clientX, e.clientY);
            if (range) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
            
            // Handle each dropped file
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    handleInlineImageUpload(file);
                }
            });
        }
    });
}

// Paste image functionality
function initInlineImagePaste() {
    const editor = document.getElementById('editor');
    if (!editor || editor.getAttribute('contenteditable') !== 'true') return;
    
    editor.addEventListener('paste', function(e) {
        const items = e.clipboardData.items;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // Check if the item is an image
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                
                const file = item.getAsFile();
                if (file) {
                    handleInlineImageUpload(file);
                }
                return;
            }
        }
        
        // Handle text paste (your existing logic)
        // Only prevent default for images, let text paste work normally
    });
}

// Image resizing functionality
function initImageResizing() {
    const editor = document.getElementById('editor');
    if (!editor || editor.getAttribute('contenteditable') !== 'true') return;
    
    editor.addEventListener('click', function(e) {
        if (e.target.classList.contains('inline-uploaded-image')) {
            toggleImageResizer(e.target);
        }
    });
}

function toggleImageResizer(img) {
    // Remove any existing resizers
    const existingResizers = document.querySelectorAll('.image-resizer');
    existingResizers.forEach(resizer => resizer.remove());
    
    // Create resizer controls
    const resizer = document.createElement('div');
    resizer.className = 'image-resizer';
    resizer.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: flex;
        gap: 8px;
    `;
    
    const sizes = [
        { label: 'Small', width: '200px' },
        { label: 'Medium', width: '400px' },
        { label: 'Large', width: '600px' },
        { label: 'Full', width: '100%' }
    ];
    
    sizes.forEach(size => {
        const button = document.createElement('button');
        button.textContent = size.label;
        button.type = 'button';
        button.style.cssText = `
            padding: 4px 8px;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            background: white;
            cursor: pointer;
            font-size: 12px;
        `;
        
        button.addEventListener('click', function() {
            img.style.maxWidth = size.width;
            img.style.width = size.width;
            resizer.remove();
            updateHiddenField();
        });
        
        resizer.appendChild(button);
    });
    
    // Position resizer near the image
    const rect = img.getBoundingClientRect();
    resizer.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    resizer.style.left = rect.left + 'px';
    
    document.body.appendChild(resizer);
    
    // Remove resizer when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', function removeResizer(e) {
            if (!resizer.contains(e.target) && e.target !== img) {
                resizer.remove();
                document.removeEventListener('click', removeResizer);
            }
        });
    }, 100);
}

// Enhanced initialization for rich text editor with inline images
function initRichTextEditorWithImages() {
    const editor = document.getElementById('editor');
    const hiddenField = document.getElementById('hidden-content');
    
    if (editor && hiddenField) {
        // Initialize existing functionality
        if (hiddenField.value) {
            editor.innerHTML = hiddenField.value;
        }
        
        // Only initialize editor functionality if in edit mode
        if (editor.getAttribute('contenteditable') === 'true') {
            // Initialize new image functionality
            initInlineImageDragDrop();
            initInlineImagePaste();
            initImageResizing();
        }
        
        // Add caption placeholder styling
        const style = document.createElement('style');
        style.textContent = `
            .image-caption:empty:before {
                content: attr(data-placeholder);
                color: #9ca3af;
                pointer-events: none;
            }
            
            .image-caption:focus {
                border-color: #f59e0b !important;
                outline: none;
            }
            
            .inline-image-container:hover .remove-inline-image {
                opacity: 1;
            }
            
            .remove-inline-image {
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .remove-inline-image:hover {
                background: rgba(239, 68, 68, 0.9) !important;
                opacity: 1;
            }
            
            .editor-content {
                min-height: 200px;
                line-height: 1.6;
            }
            
            /* Only show hover effects in edit mode */
            [contenteditable="true"] .inline-image-container {
                border: 2px solid transparent;
                transition: border-color 0.2s;
            }
            
            [contenteditable="true"] .inline-image-container:hover {
                border-color: rgba(245, 158, 11, 0.3);
                border-radius: 8px;
            }
            
            /* Ensure view mode has no hover effects */
            .rich-text-content .inline-image-container {
                border: none !important;
            }
            
            .rich-text-content .inline-image-container:hover {
                border: none !important;
            }
        `;
        
        if (!document.getElementById('inline-image-styles')) {
            style.id = 'inline-image-styles';
            document.head.appendChild(style);
        }
        
        // Enhanced update function to handle image data
        const originalUpdateHiddenField = window.updateHiddenField;
        window.updateHiddenField = function() {
            const editor = document.getElementById('editor');
            const hiddenField = document.getElementById('hidden-content');
            
            if (editor && hiddenField) {
                // For regular editing, keep the raw content
                hiddenField.value = editor.innerHTML;
            }
            
            if (originalUpdateHiddenField) {
                originalUpdateHiddenField();
            }
        };
        
        // Override form submission to clean content
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', function(e) {
                const editor = document.getElementById('editor');
                const hiddenField = document.getElementById('hidden-content');
                
                if (editor && hiddenField) {
                    // Clean the content before submitting
                    const cleanedContent = cleanContentForPublishing(editor.innerHTML);
                    hiddenField.value = cleanedContent;
                }
                
                // Continue with form submission
            });
        }
    }
    
    // IMPORTANT: Clean content for display if we're on the view page
    cleanContentForDisplay();
}

// Call this when DOM is loaded (add to your existing DOMContentLoaded listener)
document.addEventListener('DOMContentLoaded', function() {
    // Your existing initialization code...
    
    // Add image functionality
    initRichTextEditorWithImages();
});


// Share Modal Functions
// Add this section to your main.js file

/**
 * Share functionality for posts
 * Handles sharing to social media platforms and copying links
 */

// Open share modal
function openShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Add animation
        const modalContent = modal.querySelector('.bg-white');
        modalContent.style.opacity = '0';
        modalContent.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            modalContent.style.transition = 'all 0.2s ease-out';
            modalContent.style.opacity = '1';
            modalContent.style.transform = 'scale(1)';
        }, 10);
    }
}

// Close share modal
function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        const modalContent = modal.querySelector('.bg-white');
        modalContent.style.transition = 'all 0.2s ease-in';
        modalContent.style.opacity = '0';
        modalContent.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scrolling
        }, 200);
    }
}

// Share to Facebook
function shareToFacebook() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`;
    
    // Open in new tab
    window.open(facebookUrl, '_blank', 'noopener,noreferrer');
    closeShareModal();
}

// Share to Twitter/X
function shareToTwitter() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const twitterUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
    
    // Open in new tab
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    closeShareModal();
}

// Copy link to clipboard
function copyLink() {
    const url = window.location.href;
    
    // Modern browsers
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(() => {
            showToast('Link copied to clipboard!');
        }).catch(err => {
            console.error('Could not copy text: ', err);
            fallbackCopyTextToClipboard(url);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyTextToClipboard(url);
    }
    
    closeShareModal();
}

// Fallback copy method for older browsers
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('Link copied to clipboard!');
        } else {
            showToast('Failed to copy link', 'error');
        }
    } catch (err) {
        console.error('Fallback: Could not copy text: ', err);
        showToast('Failed to copy link', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        
        // Set toast color based on type
        const toastContent = toast.querySelector('div');
        if (type === 'error') {
            toastContent.className = 'bg-red-500 text-white px-6 py-3 rounded-full shadow-lg';
        } else {
            toastContent.className = 'bg-green-500 text-white px-6 py-3 rounded-full shadow-lg';
        }
        
        // Show toast
        toast.classList.remove('hidden');
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            toast.style.transition = 'all 0.3s ease-out';
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.style.transition = 'all 0.3s ease-in';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 3000);
    }
}

// Handle escape key to close modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('shareModal');
        if (modal && !modal.classList.contains('hidden')) {
            closeShareModal();
        }
    }
});

// Initialize share functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
});

// Link Modal Functions
// Also update the openLinkModal function to better preserve selection
function openLinkModal() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    const modal = document.getElementById('linkModal');
    const textInput = document.getElementById('linkText');
    const urlInput = document.getElementById('linkUrl');
    
    if (!modal || !textInput || !urlInput) return;
    
    // Reset form
    textInput.value = '';
    urlInput.value = '';
    
    // Get current selection and preserve it more carefully
    const selection = window.getSelection();
    let selectedText = '';
    let existingLink = null;
    let rangeToSave = null;
    
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        selectedText = selection.toString().trim();
        
        // Clone the range to preserve the exact cursor position
        rangeToSave = range.cloneRange();
        
        // Check if we're inside a link
        let node = range.commonAncestorContainer;
        while (node && node !== editor) {
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A') {
                existingLink = node;
                // For existing links, select the entire link
                rangeToSave.selectNode(node);
                break;
            }
            if (node.parentNode) {
                node = node.parentNode;
            } else {
                break;
            }
        }
    } else {
        // No selection - create a range at current cursor position
        const range = document.createRange();
        const focusNode = selection.focusNode || editor.lastChild || editor;
        const focusOffset = selection.focusOffset || 0;
        
        try {
            if (focusNode.nodeType === Node.TEXT_NODE) {
                range.setStart(focusNode, Math.min(focusOffset, focusNode.textContent.length));
            } else {
                range.setStart(focusNode, Math.min(focusOffset, focusNode.childNodes.length));
            }
            range.collapse(true);
            rangeToSave = range;
        } catch (e) {
            // If there's an error setting the range, create one at the end of the editor
            range.selectNodeContents(editor);
            range.collapse(false);
            rangeToSave = range;
        }
    }
    
    // Fill form with existing data
    if (existingLink) {
        textInput.value = existingLink.textContent || '';
        urlInput.value = existingLink.href || '';
        modal.setAttribute('data-editing-link', 'true');
        modal.linkElement = existingLink;
    } else {
        textInput.value = selectedText;
        modal.setAttribute('data-editing-link', 'false');
        modal.linkElement = null;
    }
    
    // Store the range in the modal
    modal.selectionRange = rangeToSave;
    
    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Focus appropriate field
    if (existingLink) {
        urlInput.focus();
        urlInput.select();
    } else if (textInput.value) {
        urlInput.focus();
    } else {
        textInput.focus();
    }
    
    // Animation
    const modalContent = modal.querySelector('.bg-white');
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        modalContent.style.transition = 'all 0.2s ease-out';
        modalContent.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    }, 10);
}

function closeLinkModal() {
    const modal = document.getElementById('linkModal');
    if (!modal) return;
    
    const modalContent = modal.querySelector('.bg-white');
    modalContent.style.transition = 'all 0.2s ease-in';
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Clean up
        modal.linkElement = null;
        modal.selectionRange = null;
        modal.removeAttribute('data-editing-link');
    }, 200);
}

function insertLink() {
    const modal = document.getElementById('linkModal');
    const textInput = document.getElementById('linkText');
    const urlInput = document.getElementById('linkUrl');
    const editor = document.getElementById('editor');
    
    if (!modal || !textInput || !urlInput || !editor) return;
    
    const linkText = textInput.value.trim();
    const linkUrl = urlInput.value.trim();
    
    // Validation
    if (!linkUrl) {
        urlInput.focus();
        urlInput.style.borderColor = '#ef4444';
        setTimeout(() => {
            urlInput.style.borderColor = '';
        }, 2000);
        return;
    }
    
    if (!linkText) {
        textInput.focus();
        textInput.style.borderColor = '#ef4444';
        setTimeout(() => {
            textInput.style.borderColor = '';
        }, 2000);
        return;
    }
    
    // Normalize URL
    let finalUrl = linkUrl;
    if (!finalUrl.match(/^https?:\/\//)) {
        finalUrl = 'https://' + finalUrl;
    }
    
    // Create the link HTML
    const linkHTML = `<a href="${finalUrl}" style="text-decoration: underline; color: #002280;" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    
    editor.focus();
    
    const isEditing = modal.getAttribute('data-editing-link') === 'true';
    const existingLink = modal.linkElement;
    const savedRange = modal.selectionRange;
    
    if (isEditing && existingLink) {
        // Replace existing link
        existingLink.outerHTML = linkHTML;
    } else {
        // Insert new link at the saved cursor position
        if (savedRange) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(savedRange);
            
            // Delete any selected content first
            savedRange.deleteContents();
            
            // Create a text node and link element
            const linkElement = document.createElement('a');
            linkElement.href = finalUrl;
            linkElement.style.textDecoration = 'underline';
            linkElement.style.color = '#002280';
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            linkElement.textContent = linkText;
            
            // Insert the link element
            savedRange.insertNode(linkElement);
            
            // Position cursor after the link
            const newRange = document.createRange();
            newRange.setStartAfter(linkElement);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        } else {
            // Fallback: insert at current cursor position
            document.execCommand('insertHTML', false, linkHTML);
        }
    }
    
    updateHiddenField();
    closeLinkModal();
    
    if (typeof showToast === 'function') {
        showToast('Link inserted successfully!', 'success');
    }
}

// Initialize link functionality
document.addEventListener('DOMContentLoaded', function() {
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('linkModal');
        
        if (modal && !modal.classList.contains('hidden')) {
            if (e.key === 'Escape') {
                closeLinkModal();
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                insertLink();
            }
        }
        
        // Ctrl+K to open link modal
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            const editor = document.getElementById('editor');
            if (editor && document.activeElement === editor) {
                e.preventDefault();
                openLinkModal();
            }
        }
    });
    
    // Handle clicking on existing links
    const editor = document.getElementById('editor');
    if (editor && editor.getAttribute('contenteditable') === 'true') {
        editor.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' && e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                
                // Select the link
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNode(e.target);
                selection.removeAllRanges();
                selection.addRange(range);
                
                setTimeout(() => {
                    openLinkModal();
                }, 10);
            }
        });
    }
});


function initAccessibility() {
    // Add skip links
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add ARIA labels to interactive elements
    const likeButtons = document.querySelectorAll('.like-btn');
    likeButtons.forEach(btn => {
        if (!btn.getAttribute('aria-label')) {
            btn.setAttribute('aria-label', 'Like this post');
        }
    });
    
    // Improve focus management
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });
}

function initPerformanceOptimizations() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
    
    // Preload critical resources
    const criticalImages = document.querySelectorAll('.hero-image, .featured-image');
    criticalImages.forEach(img => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = img.src;
        document.head.appendChild(link);
    });
    
    // Service worker registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    }
}

function initNotifications() {
    // Request notification permission
    if ('Notification' in window && 'serviceWorker' in navigator) {
        Notification.requestPermission();
    }
}

function showNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/static/images/favicon.png',
            badge: '/static/images/badge.png',
            ...options
        });
    }
}

// Global utilities
window.Freespaces = {
    showToast,
    toggleMobileMenu,
    createFloatingHeart,
    performSearch,
    filterByCategory,
    showNotification,
    showDeleteConfirmation,
    closeDeleteModal,
    initAccessibility,
    initPerformanceOptimizations,
    
    // Analytics helpers
    trackEvent: function(eventName, eventData = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }
        console.log('Event tracked:', eventName, eventData);
    },
    
    // Performance monitoring
    measurePerformance: function(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }
};

// Add CSS classes for keyboard navigation
const keyboardStyles = document.createElement('style');
keyboardStyles.textContent = `
    .keyboard-navigation *:focus {
        outline: 2px solid #fbbf24 !important;
        outline-offset: 2px !important;
    }
    
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
    
    .focus\\:not-sr-only:focus {
        position: static;
        width: auto;
        height: auto;
        padding: inherit;
        margin: inherit;
        overflow: visible;
        clip: auto;
        white-space: normal;
    }
`;
document.head.appendChild(keyboardStyles);

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    // Could send to error tracking service
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    // Could send to error tracking service
});