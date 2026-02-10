// Authentication functions for GlobalMart

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check if user is already logged in
    checkAuthStatus();
});

async function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Basic validation
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Create user data
    const userData = {
        fullName,
        email,
        phone,
        password, // In production, hash this password
        role: 'member',
        createdAt: new Date().toISOString(),
        status: 'active'
    };
    
    try {
        // Save to Google Sheets via Apps Script
        const response = await saveUserToSheet(userData);
        
        if (response.success) {
            showNotification('Registration successful! Please login.', 'success');
            
            // Auto login after registration
            const loginData = {
                email,
                password,
                remember: true
            };
            
            // Save user session
            localStorage.setItem('user', JSON.stringify({
                id: response.userId,
                email,
                fullName,
                role: 'member'
            }));
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showNotification('Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    try {
        // In production, this should be a server-side authentication
        // For demo, we'll check against Google Sheets
        const users = await getUsersFromSheet();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Create session
            const sessionData = {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role || 'member',
                lastLogin: new Date().toISOString()
            };
            
            if (rememberMe) {
                localStorage.setItem('user', JSON.stringify(sessionData));
            } else {
                sessionStorage.setItem('user', JSON.stringify(sessionData));
            }
            
            showNotification('Login successful!', 'success');
            
            // Redirect based on role
            setTimeout(() => {
                if (user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1000);
            
        } else {
            showNotification('Invalid email or password', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    }
}

function checkAuthStatus() {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
    
    if (user) {
        // Update UI for logged in user
        updateUserUI(user);
        
        // Check if on login/register page, redirect if already logged in
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('register.html')) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
}

function updateUserUI(user) {
    // Update navigation to show user info
    const nav = document.querySelector('.main-nav ul');
    if (nav && user) {
        const userItem = document.createElement('li');
        userItem.innerHTML = `
            <a href="#" class="user-menu">
                <i class="fas fa-user"></i>
                ${user.fullName}
            </a>
        `;
        nav.appendChild(userItem);
        
        // Add logout option
        const logoutItem = document.createElement('li');
        logoutItem.innerHTML = `
            <a href="#" id="logoutBtn">
                <i class="fas fa-sign-out-alt"></i>
                Logout
            </a>
        `;
        nav.appendChild(logoutItem);
        
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    }
}

function handleLogout(e) {
    e.preventDefault();
    
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    
    showNotification('Logged out successfully', 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Google Sheets API functions
async function saveUserToSheet(userData) {
    try {
        const response = await fetch(SHEET_URL + '/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error saving user:', error);
        throw error;
    }
}

async function getUsersFromSheet() {
    try {
        const response = await fetch(SHEET_URL + '/getUsers');
        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

function showNotification(message, type = 'info') {
    // Reuse the notification function from main.js
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    const bgColor = type === 'error' ? '#ef4444' : 
                    type === 'success' ? '#10b981' : '#3b82f6';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${bgColor};
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}