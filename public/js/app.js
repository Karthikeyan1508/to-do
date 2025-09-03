// Professional Todo App JavaScript

// Global variables
let isLoading = false;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
    
    // Initialize search functionality
    initializeSearch();
    
    // Initialize auto-save for forms (if any)
    initializeAutoSave();
    
    // Initialize theme preference
    initializeTheme();
    
    console.log('Todo App initialized successfully');
}

// Tooltip initialization
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Form validation
function initializeFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
                
                // Focus on first invalid field
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) {
                    firstInvalid.focus();
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            form.classList.add('was-validated');
        }, false);
    });
}

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + N = New todo
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            window.location.href = '/todos/new';
        }
        
        // Ctrl/Cmd + / = Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            const searchInput = document.querySelector('input[name="q"]');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Escape = Close modals/clear search
        if (e.key === 'Escape') {
            const searchInput = document.querySelector('input[name="q"]');
            if (searchInput && searchInput === document.activeElement) {
                searchInput.value = '';
                searchInput.blur();
            }
        }
    });
}

// Enhanced search functionality
function initializeSearch() {
    const searchForm = document.querySelector('form[action*="search"]');
    const searchInput = document.querySelector('input[name="q"]');
    
    if (searchInput) {
        // Add search suggestions/autocomplete
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (this.value.length >= 2) {
                    // Could implement live search suggestions here
                    console.log('Searching for:', this.value);
                }
            }, 300);
        });
        
        // Add clear button
        addClearButton(searchInput);
    }
}

function addClearButton(searchInput) {
    if (searchInput.value) {
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'btn btn-sm btn-outline-secondary position-absolute';
        clearBtn.style.cssText = 'right: 40px; top: 50%; transform: translateY(-50%); z-index: 5;';
        clearBtn.innerHTML = '<i class="fas fa-times"></i>';
        clearBtn.title = 'Clear search';
        
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            window.location.href = '/todos';
        });
        
        searchInput.parentElement.style.position = 'relative';
        searchInput.parentElement.appendChild(clearBtn);
    }
}

// Auto-save functionality for forms
function initializeAutoSave() {
    const forms = document.querySelectorAll('form[action*="todos"]');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            if (input.type !== 'submit' && input.type !== 'button') {
                input.addEventListener('blur', () => {
                    saveFormData(form);
                });
            }
        });
    });
}

function saveFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Save to localStorage with form identifier
    const formId = form.action.includes('edit') ? 'edit-todo' : 'new-todo';
    localStorage.setItem(`todo-form-${formId}`, JSON.stringify(data));
}

function loadFormData(form) {
    const formId = form.action.includes('edit') ? 'edit-todo' : 'new-todo';
    const savedData = localStorage.getItem(`todo-form-${formId}`);
    
    if (savedData) {
        const data = JSON.parse(savedData);
        
        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input && input.value === '') {
                input.value = data[key];
            }
        });
    }
}

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('todo-theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('todo-theme', newTheme);
}

// Enhanced todo operations
async function toggleTodo(id, element = null) {
    if (isLoading) return;
    
    isLoading = true;
    
    try {
        // Add loading state to button
        if (element) {
            const originalContent = element.innerHTML;
            element.innerHTML = '<div class="spinner"></div>';
            element.disabled = true;
        }
        
        const response = await fetch(`/todos/${id}/toggle`, {
            method: 'PATCH',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Smooth transition effect
            const todoCard = document.querySelector(`[data-todo-id="${id}"]`);
            if (todoCard) {
                todoCard.style.transition = 'all 0.3s ease';
                todoCard.style.opacity = '0.7';
                
                setTimeout(() => {
                    location.reload();
                }, 150);
            } else {
                location.reload();
            }
            
            // Show success message
            showNotification(data.message, 'success');
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error toggling todo:', error);
        showNotification('Error updating todo: ' + error.message, 'error');
    } finally {
        isLoading = false;
        
        if (element) {
            element.disabled = false;
        }
    }
}

async function deleteTodo(id, element = null) {
    if (isLoading) return;
    
    // Enhanced confirmation dialog
    const result = await showConfirmDialog(
        'Delete Task',
        'Are you sure you want to delete this task? This action cannot be undone.',
        'Delete',
        'Cancel',
        'danger'
    );
    
    if (!result) return;
    
    isLoading = true;
    
    try {
        // Add loading state
        if (element) {
            const originalContent = element.innerHTML;
            element.innerHTML = '<div class="spinner"></div>';
            element.disabled = true;
        }
        
        const response = await fetch(`/todos/${id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Animate out the todo card
            const todoCard = document.querySelector(`[data-todo-id="${id}"]`);
            if (todoCard) {
                todoCard.style.transition = 'all 0.3s ease';
                todoCard.style.transform = 'translateX(-100%)';
                todoCard.style.opacity = '0';
                
                setTimeout(() => {
                    todoCard.remove();
                    
                    // Check if no todos left
                    const remainingTodos = document.querySelectorAll('[data-todo-id]');
                    if (remainingTodos.length === 0) {
                        location.reload();
                    }
                }, 300);
            } else {
                location.reload();
            }
            
            showNotification(data.message, 'success');
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error deleting todo:', error);
        showNotification('Error deleting todo: ' + error.message, 'error');
    } finally {
        isLoading = false;
        
        if (element) {
            element.disabled = false;
        }
    }
}

// Custom notification system
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after duration
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

// Custom confirm dialog
function showConfirmDialog(title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'primary') {
    return new Promise(resolve => {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                            ${cancelText}
                        </button>
                        <button type="button" class="btn btn-${type}" id="confirm-btn">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        // Handle confirm
        modal.querySelector('#confirm-btn').addEventListener('click', () => {
            bootstrapModal.hide();
            resolve(true);
        });
        
        // Handle cancel/close
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
            resolve(false);
        });
    });
}

// Utility functions
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function(...args) {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

// Export functions for global use
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;
window.showNotification = showNotification;
window.toggleTheme = toggleTheme;

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}

// Error handling for unhandled promises
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('An unexpected error occurred', 'error');
});

// Global error handler
window.addEventListener('error', event => {
    console.error('Global error:', event.error);
    // Don't show notification for script errors unless in development
    if (window.location.hostname === 'localhost') {
        showNotification('Script error: ' + event.message, 'error');
    }
});

console.log('Todo App JavaScript loaded successfully');
