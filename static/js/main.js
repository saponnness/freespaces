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