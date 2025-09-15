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
    const commentForm = document.getElementById('comment-form');
    const commentContent = document.getElementById('comment-content');
    const charCount = document.getElementById('char-count');
    
    // Auto-load comments on page load since section is now always visible
    if (commentToggleBtn && commentsSection) {
        const postId = commentToggleBtn.dataset.postId;
        loadComments(postId);
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
    showConfirmationModal({
        title: 'Delete Comment',
        message: 'Are you sure you want to delete this comment?',
        type: 'warning',
        confirmText: 'Delete Comment',
        cancelText: 'Cancel',
        dangerZoneText: 'This action cannot be undone. The comment will be permanently deleted.',
        onConfirm: () => {
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
        },
        onCancel: () => {
            // User cancelled, no action needed
        }
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

// Account Settings Functionality
function initAccountSettings() {
    // Add confirmation for password change
    const passwordForm = document.querySelector('form[action*="change-password"]');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();

            showConfirmationModal({
                title: 'Change Password',
                message: 'Are you sure you want to change your password?',
                type: 'warning',
                confirmText: 'Change Password',
                cancelText: 'Cancel',
                dangerZoneText: 'You will need to sign in again on all your devices after changing your password.',
                onConfirm: () => {
                    // Submit the form
                    passwordForm.submit();
                },
                onCancel: () => {
                    // User cancelled, no action needed
                }
            });
        });
    }

    // Add real-time validation feedback for all forms on account settings page
    const accountForms = document.querySelectorAll('form[action*="settings/"], form[action*="accounts/"]');
    accountForms.forEach(form => {
        const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (this.value.trim() === '') {
                    this.classList.add('border-red-300');
                    this.classList.remove('border-gray-200');
                } else {
                    this.classList.remove('border-red-300');
                    this.classList.add('border-gray-200');
                }
            });
        });
    });

    // Enhanced validation for account settings
    initAccountFormsValidation();
}

function initAccountFormsValidation() {
    // Check if we're on the login page - if so, skip validation feedback
    const isLoginPage = document.querySelector('form[method="post"]:not([action])') &&
                       document.querySelector('input[name="username"]') &&
                       document.querySelector('input[name="password"]') &&
                       !document.querySelector('input[name="email"]') &&
                       !document.querySelector('input[name*="new_password"]');

    // Username validation (skip for login page)
    const usernameInput = document.querySelector('input[name="username"]');
    if (usernameInput && !isLoginPage) {
        usernameInput.addEventListener('input', function() {
            const value = this.value.trim();
            const feedback = this.parentElement.querySelector('.validation-feedback') ||
                           createValidationFeedback(this.parentElement);

            if (value.length < 3) {
                showValidationError(feedback, 'Username must be at least 3 characters long');
            } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                showValidationError(feedback, 'Username can only contain letters, numbers, and underscores');
            } else {
                showValidationSuccess(feedback, 'Username is valid');
            }
        });
    }

    // Email validation (skip for login page, though login page doesn't have email field)
    const emailInput = document.querySelector('input[name="email"]');
    if (emailInput && !isLoginPage) {
        emailInput.addEventListener('input', function() {
            const value = this.value.trim();
            const feedback = this.parentElement.querySelector('.validation-feedback') ||
                           createValidationFeedback(this.parentElement);

            if (value && !isValidEmail(value)) {
                showValidationError(feedback, 'Please enter a valid email address');
            } else if (value) {
                showValidationSuccess(feedback, 'Email format is valid');
            } else {
                hideValidationFeedback(feedback);
            }
        });
    }

    // Password strength validation for new passwords (skip for login page)
    const newPasswordInputs = document.querySelectorAll('input[name*="new_password"], input[name*="password1"]');
    if (!isLoginPage) {
        newPasswordInputs.forEach(input => {
            input.addEventListener('input', function() {
                const strength = calculatePasswordStrength(this.value);
                const feedback = this.parentElement.querySelector('.validation-feedback') ||
                               createValidationFeedback(this.parentElement);

                if (this.value.length === 0) {
                    hideValidationFeedback(feedback);
                    return;
                }

                if (strength < 2) {
                    showValidationError(feedback, 'Password is too weak');
                } else if (strength < 3) {
                    showValidationWarning(feedback, 'Password strength: Medium');
                } else {
                    showValidationSuccess(feedback, 'Password strength: Strong');
                }
            });
        });
    }
}

function createValidationFeedback(parent) {
    const feedback = document.createElement('div');
    feedback.className = 'validation-feedback text-sm mt-1 hidden';
    parent.appendChild(feedback);
    return feedback;
}

function showValidationError(feedback, message) {
    feedback.className = 'validation-feedback text-sm mt-1 text-red-600';
    feedback.innerHTML = `<svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
    </svg>${message}`;
}

function showValidationWarning(feedback, message) {
    feedback.className = 'validation-feedback text-sm mt-1 text-yellow-600';
    feedback.innerHTML = `<svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
    </svg>${message}`;
}

function showValidationSuccess(feedback, message) {
    feedback.className = 'validation-feedback text-sm mt-1 text-green-600';
    feedback.innerHTML = `<svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
    </svg>${message}`;
}

function hideValidationFeedback(feedback) {
    feedback.className = 'validation-feedback text-sm mt-1 hidden';
    feedback.innerHTML = '';
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initLikeButtons();
    initCommentSystem();
    initAccountSettings();

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

// Infinite scroll functionality removed - no Load More buttons exist
// This was incomplete placeholder code that referenced non-existent buttons

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
            if (selectedPosts.length > 0) {
                showConfirmationModal({
                    title: `Delete ${selectedPosts.length} Posts`,
                    message: `Are you sure you want to delete ${selectedPosts.length} selected posts?`,
                    type: 'danger',
                    confirmText: `Delete ${selectedPosts.length} Posts`,
                    cancelText: 'Cancel',
                    requireConfirmation: true,
                    confirmationText: 'I understand that this will permanently delete all selected posts and their associated data.',
                    dangerZoneText: 'This will permanently delete all selected posts and their associated data. This action cannot be undone.',
                    onConfirm: () => {
                        bulkDeletePosts(selectedPosts);
                    },
                    onCancel: () => {
                        // User cancelled, no action needed
                    }
                });
            } else {
                showToast('Please select posts to delete', 'warning');
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
            showToast(`Successfully deleted ${postIds.length} posts`, 'success');
            location.reload();
        } else {
            showToast('Error deleting posts', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error deleting posts', 'error');
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
            showToast(`Successfully published ${postIds.length} posts`, 'success');
            location.reload();
        } else {
            showToast('Error publishing posts', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error publishing posts', 'error');
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
            showConfirmationModal({
                title: 'Remove Image',
                message: 'Are you sure you want to remove this image?',
                type: 'warning',
                confirmText: 'Remove Image',
                cancelText: 'Cancel',
                dangerZoneText: 'The image will be removed from this post. You can add a new image if needed.',
                onConfirm: () => {
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

                    showToast('Image removed successfully', 'success');
                },
                onCancel: () => {
                    // User cancelled, no action needed
                }
            });
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
    initSetupAvatarCropping();
    initProfileSetupUsernameValidation();
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
let setupCropper = null;

// JavaScript functions for inline editing
function toggleNameEdit() {
    const display = document.getElementById('name-display');
    const edit = document.getElementById('name-edit');
    
    display.classList.toggle('hidden');
    edit.classList.toggle('hidden');
}

function toggleBioEdit() {
    console.log('toggleBioEdit() called');
    const display = document.getElementById('bio-display');
    const edit = document.getElementById('bio-edit');

    console.log('bio display element:', display);
    console.log('bio edit element:', edit);

    if (display && edit) {
        display.classList.toggle('hidden');
        edit.classList.toggle('hidden');
        console.log('Bio toggled - display hidden:', display.classList.contains('hidden'));
        console.log('Bio toggled - edit hidden:', edit.classList.contains('hidden'));
    } else {
        console.error('Could not find bio display or edit elements');
    }
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

// Profile Setup Username Validation
function initProfileSetupUsernameValidation() {
    const usernameInput = document.getElementById('username-input');
    const validationDiv = document.getElementById('username-validation');
    const feedbackDiv = document.getElementById('username-feedback');
    const submitBtn = document.getElementById('setup-submit-btn');

    if (!usernameInput || !validationDiv || !feedbackDiv || !submitBtn) {
        return; // Not on profile setup page
    }

    let validationTimeout;
    let isValidating = false;
    let isValid = false;

    function showValidationIcon(type, message = '') {
        validationDiv.innerHTML = '';
        feedbackDiv.innerHTML = '';
        feedbackDiv.classList.add('hidden');

        if (type === 'loading') {
            validationDiv.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>';
        } else if (type === 'success') {
            validationDiv.innerHTML = '<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
            isValid = true;
        } else if (type === 'error') {
            validationDiv.innerHTML = '<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
            if (message) {
                feedbackDiv.innerHTML = `<span class="text-red-500">${message}</span>`;
                feedbackDiv.classList.remove('hidden');
            }
            isValid = false;
        }

        // Update submit button state
        submitBtn.disabled = !isValid || usernameInput.value.trim().length === 0;
        submitBtn.classList.toggle('opacity-50', submitBtn.disabled);
        submitBtn.classList.toggle('cursor-not-allowed', submitBtn.disabled);
    }

    function validateUsername(username) {
        if (isValidating) return;

        isValidating = true;
        showValidationIcon('loading');

        // Basic client-side validation first
        if (username.length < 3) {
            showValidationIcon('error', 'Username must be at least 3 characters long');
            isValidating = false;
            return;
        }

        if (username.length > 20) {
            showValidationIcon('error', 'Username must be 20 characters or less');
            isValidating = false;
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showValidationIcon('error', 'Username can only contain letters, numbers, and underscores');
            isValidating = false;
            return;
        }

        // Server-side validation for uniqueness
        fetch('/accounts/api/validate-username/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({ username: username })
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                showValidationIcon('success');
            } else {
                showValidationIcon('error', data.error || 'Username is not available');
            }
        })
        .catch(error => {
            console.error('Username validation error:', error);
            showValidationIcon('error', 'Unable to validate username. Please try again.');
        })
        .finally(() => {
            isValidating = false;
        });
    }

    // Add event listener for real-time validation
    usernameInput.addEventListener('input', function() {
        const username = this.value.trim();

        // Clear previous timeout
        if (validationTimeout) {
            clearTimeout(validationTimeout);
        }

        // Clear validation if empty
        if (username.length === 0) {
            validationDiv.innerHTML = '';
            feedbackDiv.innerHTML = '';
            feedbackDiv.classList.add('hidden');
            isValid = false;
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            return;
        }

        // Debounce validation
        validationTimeout = setTimeout(() => {
            validateUsername(username);
        }, 500);
    });

    // Initial state - disable submit button
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
}

// Profile Setup Avatar cropping functions
function initSetupAvatarCropping() {
    const setupAvatarUpload = document.getElementById('setup-avatar-upload');
    if (setupAvatarUpload) {
        setupAvatarUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const image = document.getElementById('setupCropImage');
                    image.src = event.target.result;

                    // Show modal
                    document.getElementById('setupCropModal').classList.remove('hidden');

                    // Initialize cropper
                    if (setupCropper) {
                        setupCropper.destroy();
                    }

                    setupCropper = new Cropper(image, {
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
                        restore: true,
                        checkCrossOrigin: true,
                        checkOrientation: true,
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
    }
}

function closeSetupCropModal() {
    document.getElementById('setupCropModal').classList.add('hidden');
    if (setupCropper) {
        setupCropper.destroy();
        setupCropper = null;
    }
    // Clear the file input
    const setupUpload = document.getElementById('setup-avatar-upload');
    if (setupUpload) {
        setupUpload.value = '';
    }
}

function saveSetupCroppedImage() {
    if (setupCropper) {
        const canvas = setupCropper.getCroppedCanvas({
            width: 300,
            height: 300,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });

        const croppedImage = canvas.toDataURL('image/jpeg', 0.9);

        // Update the profile preview
        const profilePreview = document.getElementById('profile-preview');
        if (profilePreview) {
            if (profilePreview.tagName === 'IMG') {
                profilePreview.src = croppedImage;
            } else {
                // Replace the div with an img element
                const newImg = document.createElement('img');
                newImg.src = croppedImage;
                newImg.alt = 'Profile';
                newImg.className = 'w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover';
                newImg.id = 'profile-preview';
                profilePreview.parentNode.replaceChild(newImg, profilePreview);
            }
        }

        // Store the cropped image data for form submission
        // We'll add a hidden input to the profile setup form
        let hiddenInput = document.getElementById('setup-profile-image-data');
        if (!hiddenInput) {
            hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'profile_image_data';
            hiddenInput.id = 'setup-profile-image-data';
            document.getElementById('profile-setup-form').appendChild(hiddenInput);
        }
        hiddenInput.value = croppedImage;

        // Close modal
        closeSetupCropModal();
    }
}


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

// Reusable Modal Confirmation System
function createConfirmationModal(options = {}) {
    const {
        title = 'Confirm Action',
        message = 'Are you sure you want to proceed?',
        type = 'warning', // 'warning', 'danger', 'info', 'success'
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        requireConfirmation = false,
        confirmationText = 'I understand this action cannot be undone',
        onConfirm = () => {},
        onCancel = () => {},
        showInput = false,
        inputPlaceholder = '',
        inputType = 'text',
        inputRequired = false,
        inputValidation = null,
        dangerZoneText = null
    } = options;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 opacity-0 scale-95 transition-all duration-200';

    // Icon based on type
    const icons = {
        warning: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>`,
        danger: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>`,
        info: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
        </svg>`,
        success: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>`
    };

    // Icon colors
    const iconColors = {
        warning: 'text-amber-500',
        danger: 'text-red-500',
        info: 'text-blue-500',
        success: 'text-green-500'
    };

    // Button styles
    const buttonStyles = {
        warning: 'bg-amber-500 hover:bg-amber-600',
        danger: 'danger-button',
        info: 'bg-blue-500 hover:bg-blue-600',
        success: 'bg-green-500 hover:bg-green-600'
    };

    modal.innerHTML = `
        <div class="confirmation-modal max-w-md w-full mx-4 p-6 rounded-2xl">
            <div class="text-center mb-6">
                <div class="warning-icon w-16 h-16 mx-auto mb-4 ${iconColors[type]}">
                    ${icons[type]}
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">${title}</h3>
                <p class="text-gray-600">${message}</p>
            </div>

            ${dangerZoneText ? `
                <div class="danger-zone mb-6">
                    <div class="flex items-start space-x-3">
                        <svg class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                        </svg>
                        <div>
                            <h4 class="font-semibold text-red-800 mb-1">Warning</h4>
                            <p class="text-sm text-red-700">${dangerZoneText}</p>
                        </div>
                    </div>
                </div>
            ` : ''}

            ${showInput ? `
                <div class="mb-6">
                    <input type="${inputType}"
                           class="modal-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                           placeholder="${inputPlaceholder}"
                           ${inputRequired ? 'required' : ''}>
                    <div class="input-error text-red-500 text-sm mt-1 hidden"></div>
                </div>
            ` : ''}

            ${requireConfirmation ? `
                <div class="mb-6">
                    <label class="flex items-start space-x-3 cursor-pointer">
                        <input type="checkbox" class="confirmation-checkbox mt-1" required>
                        <span class="confirmation-text">${confirmationText}</span>
                    </label>
                </div>
            ` : ''}

            <div class="flex flex-col sm:flex-row gap-3">
                <button class="confirm-button flex-1 py-3 px-6 rounded-xl font-semibold text-white ${buttonStyles[type]} ${requireConfirmation || (showInput && inputRequired) ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${requireConfirmation || (showInput && inputRequired) ? 'disabled' : ''}>
                    ${confirmText}
                </button>
                <button class="cancel-button flex-1 py-3 px-6 rounded-xl font-semibold">
                    ${cancelText}
                </button>
            </div>
        </div>
    `;

    // Setup event handlers
    const confirmBtn = modal.querySelector('.confirm-button');
    const cancelBtn = modal.querySelector('.cancel-button');
    const checkbox = modal.querySelector('.confirmation-checkbox');
    const input = modal.querySelector('.modal-input');
    const inputError = modal.querySelector('.input-error');

    // Checkbox functionality
    if (checkbox) {
        checkbox.addEventListener('change', function() {
            updateConfirmButton();
        });
    }

    // Input validation
    if (input) {
        input.addEventListener('input', function() {
            validateInput();
            updateConfirmButton();
        });
    }

    function validateInput() {
        if (!input) return true;

        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        if (inputRequired && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (inputValidation && typeof inputValidation === 'function') {
            const validationResult = inputValidation(value);
            if (validationResult !== true) {
                isValid = false;
                errorMessage = validationResult;
            }
        }

        if (inputError) {
            if (isValid) {
                inputError.classList.add('hidden');
                input.classList.remove('border-red-500');
            } else {
                inputError.textContent = errorMessage;
                inputError.classList.remove('hidden');
                input.classList.add('border-red-500');
            }
        }

        return isValid;
    }

    function updateConfirmButton() {
        const checkboxValid = !checkbox || checkbox.checked;
        const inputValid = !input || (!inputRequired || validateInput());

        if (checkboxValid && inputValid) {
            confirmBtn.disabled = false;
            confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            confirmBtn.disabled = true;
            confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    // Confirm button click
    confirmBtn.addEventListener('click', function() {
        if (confirmBtn.disabled) return;

        const inputValue = input ? input.value.trim() : null;
        onConfirm(inputValue);
        closeModal(modal);
    });

    // Cancel button click
    cancelBtn.addEventListener('click', function() {
        onCancel();
        closeModal(modal);
    });

    // Backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            onCancel();
            closeModal(modal);
        }
    });

    // Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            onCancel();
            closeModal(modal);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    return modal;
}

function showConfirmationModal(options) {
    const modal = createConfirmationModal(options);
    document.body.appendChild(modal);

    // Animate in
    setTimeout(() => {
        modal.classList.remove('opacity-0', 'scale-95');
        modal.classList.add('opacity-100', 'scale-100');
    }, 10);

    return modal;
}

function closeModal(modal) {
    modal.classList.remove('opacity-100', 'scale-100');
    modal.classList.add('opacity-0', 'scale-95');

    setTimeout(() => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    }, 200);
}

// Make key functions globally available
window.showConfirmationModal = showConfirmationModal;
window.showNotification = showNotification;
window.showToast = showToast;
window.closeModal = closeModal;
window.toggleDeleteButton = toggleDeleteButton;
window.confirmAccountDeletion = confirmAccountDeletion;

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
    showConfirmationModal,
    closeModal,
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

// ============================================================================
// Inline Username Editing Functions
// ============================================================================

// Toggle username editing mode (following the exact pattern from name/bio editing)
function toggleUsernameEdit() {
    console.log('toggleUsernameEdit() called');
    const display = document.getElementById('username-display');
    const edit = document.getElementById('username-edit');

    console.log('display element:', display);
    console.log('edit element:', edit);

    if (display && edit) {
        display.classList.toggle('hidden');
        edit.classList.toggle('hidden');
        console.log('Toggled visibility - display hidden:', display.classList.contains('hidden'));
        console.log('Toggled visibility - edit hidden:', edit.classList.contains('hidden'));
    } else {
        console.error('Could not find username display or edit elements');
    }
}


// Account Settings Functions
function toggleDeleteButton() {
    const input = document.getElementById('delete-confirmation');
    const button = document.getElementById('delete-account-btn');

    if (input && button) {
        const isValid = input.value.trim().toUpperCase() === 'DELETE';
        button.disabled = !isValid;

        if (isValid) {
            button.classList.remove('opacity-50', 'cursor-not-allowed', 'disabled:hover:bg-red-600');
            button.classList.add('hover:bg-red-700');
        } else {
            button.classList.add('opacity-50', 'cursor-not-allowed', 'disabled:hover:bg-red-600');
            button.classList.remove('hover:bg-red-700');
        }
    }
}

function confirmAccountDeletion() {
    const input = document.getElementById('delete-confirmation');

    if (input && input.value.trim().toUpperCase() === 'DELETE') {
        showConfirmationModal({
            title: 'Delete Account Permanently',
            message: 'Are you absolutely sure you want to delete your account?',
            type: 'danger',
            confirmText: 'Delete My Account Forever',
            cancelText: 'Cancel',
            requireConfirmation: true,
            confirmationText: 'I understand that this action cannot be undone and all my data will be permanently deleted.',
            dangerZoneText: 'This action cannot be undone. All your posts, comments, profile information, and account data will be permanently deleted. You will not be able to recover your account or any of your content.',
            onConfirm: () => {
                // Create and submit a form for account deletion
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = '/accounts/delete-account/';

                // Add CSRF token
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrfmiddlewaretoken';
                csrfInput.value = csrftoken;
                form.appendChild(csrfInput);

                // Add confirmation
                const confirmInput = document.createElement('input');
                confirmInput.type = 'hidden';
                confirmInput.name = 'confirm_deletion';
                confirmInput.value = 'DELETE';
                form.appendChild(confirmInput);

                document.body.appendChild(form);
                form.submit();
            },
            onCancel: () => {
                // User cancelled, no action needed
            }
        });
    } else {
        showToast('Please type "DELETE" to confirm account deletion', 'warning');
    }
}

function signOutAllDevices() {
    showConfirmationModal({
        title: 'Sign Out From All Devices',
        message: 'Are you sure you want to sign out from all devices?',
        type: 'warning',
        confirmText: 'Sign Out All Devices',
        cancelText: 'Cancel',
        dangerZoneText: 'You will need to sign in again on all your devices. This will end all active sessions.',
        onConfirm: () => {
            // Create and submit a form for signing out all devices
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/accounts/logout-all/';

            // Add CSRF token
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrfmiddlewaretoken';
            csrfInput.value = csrftoken;
            form.appendChild(csrfInput);

            document.body.appendChild(form);
            form.submit();
        },
        onCancel: () => {
            // User cancelled, no action needed
        }
    });
}

// Navigation logout confirmation
function confirmLogout() {
    showConfirmationModal({
        title: 'Sign Out',
        message: 'Are you sure you want to sign out?',
        type: 'info',
        confirmText: 'Sign Out',
        cancelText: 'Cancel',
        onConfirm: () => {
            document.getElementById('logout-form').submit();
        },
        onCancel: () => {
            // User cancelled, no action needed
        }
    });
}

// Account settings logout this device confirmation
function confirmLogoutThisDevice() {
    showConfirmationModal({
        title: 'Sign Out From This Device',
        message: 'Are you sure you want to sign out from this device?',
        type: 'info',
        confirmText: 'Sign Out',
        cancelText: 'Cancel',
        onConfirm: () => {
            document.getElementById('logout-this-device-form').submit();
        },
        onCancel: () => {
            // User cancelled, no action needed
        }
    });
}

// Initialize OAuth-related event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Username modal event listeners
    const usernameModal = document.getElementById('username-modal');
    if (usernameModal) {
        // Close modal on background click
        usernameModal.addEventListener('click', function(e) {
            if (e.target === usernameModal) {
                hideUsernameModal();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !usernameModal.classList.contains('hidden')) {
                hideUsernameModal();
            }
        });
    }

    // No additional username editing initialization needed - using onclick handlers in templates

    // Delete confirmation input
    const deleteInput = document.getElementById('delete-confirmation');
    if (deleteInput) {
        deleteInput.addEventListener('input', toggleDeleteButton);
    }
});