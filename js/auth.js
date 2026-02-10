// Authentication functions for GlobalMart - Enhanced for Login

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginSpinner = document.getElementById('loginSpinner');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        
        // Real-time email validation
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) {
            emailInput.addEventListener('blur', validateEmail);
        }
    }
    
    // Check if user is already logged in
    checkAuthStatus();
});

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    
    // Validate email format
    if (!validateEmailFormat(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Validate password
    if (!password || password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Show loading state
    const loginBtn = document.getElementById('loginBtn');
    const loginSpinner = document.getElementById('loginSpinner');
    
    if (loginBtn && loginSpinner) {
        loginBtn.disabled = true;
        loginSpinner.style.display = 'inline-block';
        loginBtn.innerHTML = loginBtn.innerHTML.replace('Login', 'Logging in...');
    }
    
    try {
        // Log login attempt
        await logToSheet('LOGIN_ATTEMPT', `Login attempt for: ${email}`);
        
        // For demo purposes, we'll simulate API call
        // In production, this should be a server-side authentication
        await simulateApiCall(1500); // Simulate network delay
        
        // Check credentials (demo - replace with actual API call)
        const users = await getUsersFromSheet();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Check if user is active
            if (user.status === 'inactive') {
                showNotification('Your account has been deactivated. Please contact support.', 'error');
                return;
            }
            
            // Create session
            const sessionData = {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                phone: user.phone,
                role: user.role || 'member',
                lastLogin: new Date().toISOString(),
                cart: JSON.parse(localStorage.getItem('cart')) || []
            };
            
            // Save session based on remember me preference
            if (rememberMe) {
                localStorage.setItem('user', JSON.stringify(sessionData));
            } else {
                sessionStorage.setItem('user', JSON.stringify(sessionData));
            }
            
            // Clear guest cart if exists
            localStorage.removeItem('guestCart');
            
            // Log successful login
            await logToSheet('LOGIN_SUCCESS', `User logged in: ${email}`, user.id);
            
            showNotification('Login successful! Welcome back.', 'success');
            
            // Update last login time in database
            await updateLastLogin(user.id);
            
            // Redirect based on role
            setTimeout(() => {
                if (user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1000);
            
        } else {
            // Log failed login attempt
            await logToSheet('LOGIN_FAILED', `Failed login attempt for: ${email}`);
            
            showNotification('Invalid email or password. Please try again.', 'error');
            
            // Reset loading state
            resetLoginButton();
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred. Please try again.', 'error');
        resetLoginButton();
        
        // Log error
        await logToSheet('LOGIN_ERROR', error.toString());
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!validateEmailFormat(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
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
        password: btoa(password), // Simple encoding for demo (use proper hashing in production)
        role: 'member',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        emailVerified: false,
        lastLogin: null
    };
    
    try {
        // Save to Google Sheets via Apps Script
        const response = await saveUserToSheet(userData);
        
        if (response.success) {
            // Auto login after registration
            const sessionData = {
                id: response.userId,
                email,
                fullName,
                phone,
                role: 'member',
                lastLogin: new Date().toISOString()
            };
            
            localStorage.setItem('user', JSON.stringify(sessionData));
            
            // Send welcome email (simulated)
            await sendWelcomeEmail(email, fullName);
            
            showNotification('Registration successful! Welcome to GlobalMart.', 'success');
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
            // Log registration
            await logToSheet('REGISTRATION_SUCCESS', `New user registered: ${email}`, response.userId);
            
        } else {
            showNotification(response.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('An error occurred. Please try again.', 'error');
        await logToSheet('REGISTRATION_ERROR', error.toString());
    }
}

function validateEmail() {
    const emailInput = document.getElementById('loginEmail');
    if (!emailInput) return;
    
    const email = emailInput.value;
    if (email && !validateEmailFormat(email)) {
        emailInput.style.borderColor = '#ef4444';
        emailInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
    } else {
        emailInput.style.borderColor = '';
        emailInput.style.boxShadow = '';
    }
}

function validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function checkAuthStatus() {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
    
    if (user && window.location.pathname.includes('login.html')) {
        // User is already logged in, redirect to home
        showNotification('You are already logged in!', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

function updateUserUI(user) {
    const nav = document.querySelector('.main-nav ul');
    if (nav && user) {
        // Remove existing user menu items
        document.querySelectorAll('.user-menu-item').forEach(item => item.remove());
        
        const userItem = document.createElement('li');
        userItem.className = 'user-menu-item';
        userItem.innerHTML = `
            <a href="#" class="user-menu">
                <i class="fas fa-user-circle"></i>
                ${user.fullName.split(' ')[0]}
            </a>
            <div class="user-dropdown">
                <a href="profile.html"><i class="fas fa-user"></i> My Profile</a>
                <a href="orders.html"><i class="fas fa-shopping-bag"></i> My Orders</a>
                <a href="wishlist.html"><i class="fas fa-heart"></i> Wishlist</a>
                <div class="dropdown-divider"></div>
                <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</a>
            </div>
        `;
        
        const loginItem = document.querySelector('a[href="login.html"]')?.closest('li');
        if (loginItem) {
            loginItem.replaceWith(userItem);
        } else {
            nav.appendChild(userItem);
        }
        
        // Add logout event listener
        document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
        
        // Initialize dropdown functionality
        initUserDropdown();
    }
}

function initUserDropdown() {
    const userMenu = document.querySelector('.user-menu');
    const dropdown = document.querySelector('.user-dropdown');
    
    if (userMenu && dropdown) {
        userMenu.addEventListener('click', function(e) {
            e.preventDefault();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.user-menu-item')) {
                dropdown.style.display = 'none';
            }
        });
        
        // Add styles for dropdown
        const style = document.createElement('style');
        style.textContent = `
            .user-menu-item {
                position: relative;
            }
            
            .user-dropdown {
                display: none;
                position: absolute;
                top: 100%;
                right:
