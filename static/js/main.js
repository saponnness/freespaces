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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initLikeButtons();
    
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
                previewImage(fileInput);
            }
        });
        
        fileInput.addEventListener('change', function() {
            previewImage(this);
        });
    }
}

// Image preview function
function previewImage(input) {
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

// Social sharing functionality
function initSocialSharing() {
    const shareButtons = document.querySelectorAll('[data-share]');
    
    shareButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const platform = this.dataset.share;
            const url = window.location.href;
            const title = document.title;
            
            let shareUrl = '';
            
            switch(platform) {
                case 'x':
                    shareUrl = `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
                    break;
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                    break;

            }
            
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
        });
    });
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