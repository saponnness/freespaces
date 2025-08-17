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
    heart.style.top = (rect.top - 10) + 'px';
    
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