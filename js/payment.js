// Payment Processing JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize payment page
    initPaymentPage();
    
    // Load order details
    loadOrderDetails();
});

function initPaymentPage() {
    // Payment method tabs
    const methodTabs = document.querySelectorAll('.method-tab');
    methodTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const method = this.getAttribute('data-method');
            
            // Update active tab
            methodTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding form
            document.querySelectorAll('.method-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(`${method}Form`).classList.add('active');
        });
    });
    
    // PIN toggle
    const togglePinBtn = document.querySelector('.toggle-pin');
    if (togglePinBtn) {
        togglePinBtn.addEventListener('click', function() {
            const pinInput = document.getElementById('toyibpayPIN');
            const type = pinInput.getAttribute('type') === 'password' ? 'text' : 'password';
            pinInput.setAttribute('type', type);
            
            // Toggle icon
            this.innerHTML = type === 'password' 
                ? '<i class="fas fa-eye"></i>' 
                : '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let formatted = '';
            
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formatted += ' ';
                }
                formatted += value[i];
            }
            
            e.target.value = formatted.substring(0, 19);
        });
    }
    
    // Card expiry formatting
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^0-9]/gi, '');
            
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            
            e.target.value = value.substring(0, 5);
        });
    }
    
    // Process payment button
    const processPaymentBtn = document.getElementById('processPaymentBtn');
    if (processPaymentBtn) {
        processPaymentBtn.addEventListener('click', processPayment);
    }
}

function loadOrderDetails() {
    // Get order details from localStorage or URL parameters
    const orderId = getParameterByName('orderId') || 'GM-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    const orderDate = new Date().toISOString().split('T')[0];
    
    // Update order details
    document.getElementById('orderId').textContent = orderId;
    document.getElementById('orderDate').textContent = orderDate;
    document.getElementById('bankReference').textContent = orderId;
    
    // Calculate amounts
    const subtotal = 49.00;
    const tax = subtotal * 0.06;
    const serviceFee = 1.00;
    const totalAmount = subtotal + tax + serviceFee;
    
    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('tax').textContent = tax.toFixed(2);
    document.getElementById('serviceFee').textContent = serviceFee.toFixed(2);
    document.getElementById('totalAmount').textContent = totalAmount.toFixed(2);
    document.getElementById('paidAmount').textContent = totalAmount.toFixed(2);
    
    // Generate transaction ID
    const transactionId = 'TXN-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    document.getElementById('transactionId').textContent = transactionId;
    
    // Store order details
    localStorage.setItem('current_order', JSON.stringify({
        id: orderId,
        transactionId: transactionId,
        amount: totalAmount,
        date: orderDate
    }));
}

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function processPayment() {
    const paymentBtn = document.getElementById('processPaymentBtn');
    const originalText = paymentBtn.innerHTML;
    
    // Show loading state
    paymentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    paymentBtn.disabled = true;
    
    // Validate selected payment method
    const activeTab = document.querySelector('.method-tab.active');
    const method = activeTab.getAttribute('data-method');
    
    let isValid = true;
    let errorMessage = '';
    
    switch (method) {
        case 'toyibpay':
            isValid = validateToyibPay();
            errorMessage = 'Please enter valid ToyibPay credentials.';
            break;
        case 'card':
            isValid = validateCard();
            errorMessage = 'Please enter valid card details.';
            break;
        case 'bank':
            isValid = true; // Bank transfer doesn't need validation
            break;
    }
    
    if (!isValid) {
        showAlert('error', errorMessage);
        paymentBtn.innerHTML = originalText;
        paymentBtn.disabled = false;
        return;
    }
    
    // Simulate payment processing
    setTimeout(() => {
        // Simulate successful payment
        const success = Math.random() > 0.1; // 90% success rate for demo
        
        if (success) {
            completePayment();
        } else {
            // Simulate failed payment
            showAlert('error', 'Payment failed. Please try again or use a different payment method.');
            paymentBtn.innerHTML = originalText;
            paymentBtn.disabled = false;
        }
    }, 2000);
}

function validateToyibPay() {
    const email = document.getElementById('toyibpayEmail').value;
    const pin = document.getElementById('toyibpayPIN').value;
    
    // Basic validation
    if (!email || !pin) {
        return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return false;
    }
    
    // Validate PIN length (assuming 6 digits)
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
        return false;
    }
    
    return true;
}

function validateCard() {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCVC = document.getElementById('cardCVC').value;
    const cardName = document.getElementById('cardName').value;
    
    // Basic validation
    if (!cardNumber || !cardExpiry || !cardCVC || !cardName) {
        return false;
    }
    
    // Validate card number (Luhn algorithm)
    if (!validateCardNumber(cardNumber)) {
        return false;
    }
    
    // Validate expiry date
    if (!validateExpiryDate(cardExpiry)) {
        return false;
    }
    
    // Validate CVC
    if (!/^\d{3,4}$/.test(cardCVC)) {
        return false;
    }
    
    return true;
}

function validateCardNumber(cardNumber) {
    // Remove non-digit characters
    cardNumber = cardNumber.replace(/\D/g, '');
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i), 10);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

function validateExpiryDate(expiry) {
    const [month, year] = expiry.split('/').map(num => parseInt(num, 10));
    
    if (!month || !year || month < 1 || month > 12) {
        return false;
    }
    
    // Add century if needed
    const fullYear = year < 100 ? 2000 + year : year;
    
    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    
    // Check if card is expired
    if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
        return false;
    }
    
    return true;
}

function completePayment() {
    // Get order details
    const order = JSON.parse(localStorage.getItem('current_order')) || {};
    
    // Update payment date
    const paymentDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    document.getElementById('paymentDate').textContent = paymentDate;
    
    // Show success modal
    const modal = document.getElementById('paymentStatusModal');
    modal.classList.add('active');
    
    // Log payment activity
    logActivity('info', `Payment successful: ${order.id} - RM ${order.amount}`);
    
    // Save payment record
    savePaymentRecord(order);
    
    // Clear form
    resetPaymentForm();
}

function savePaymentRecord(order) {
    // Get existing payments
    let payments = JSON.parse(localStorage.getItem('globalmart_payments')) || [];
    
    // Add new payment
    const payment = {
        id: order.transactionId,
        orderId: order.id,
        amount: order.amount,
        date: new Date().toISOString(),
        status: 'completed',
        method: document.querySelector('.method-tab.active').getAttribute('data-method')
    };
    
    payments.push(payment);
    localStorage.setItem('globalmart_payments', JSON.stringify(payments));
    
    // Send to Google Sheets
    sendPaymentToGoogleSheets(payment);
}

function sendPaymentToGoogleSheets(payment) {
    const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL'; // Replace with your Apps Script URL
    
    if (SCRIPT_URL && SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'payment',
                data: payment
            })
        }).catch(error => {
            console.error('Failed to save payment to Google Sheets:', error);
        });
    }
}

function resetPaymentForm() {
    // Reset all forms
    document.querySelectorAll('input').forEach(input => {
        if (input.type !== 'radio' && input.type !== 'checkbox') {
            input.value = '';
        }
    });
    
    // Reset to first payment method
    document.querySelectorAll('.method-tab').forEach((tab, index) => {
        tab.classList.toggle('active', index === 0);
    });
    
    document.querySelectorAll('.method-form').forEach((form, index) => {
        form.classList.toggle('active', index === 0);
    });
}

function showAlert(type, message) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.payment-alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `payment-alert payment-alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="alert-close"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    // Add styles
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        min-width: 300px;
        max-width: 90%;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(alert);
    
    // Add close functionality
    const closeBtn = alert.querySelector('.alert-close');
    closeBtn.addEventListener('click', () => {
        alert.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(alert)) {
                document.body.removeChild(alert);
            }
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(alert)) {
            alert.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(alert)) {
                    document.body.removeChild(alert);
                }
            }, 300);
        }
    }, 5000);
}

// ToyibPay Integration Functions
function initializeToyibPay(apiKey) {
    // Initialize ToyibPay SDK
    // This is a placeholder for actual ToyibPay integration
    console.log('ToyibPay initialized with API key:', apiKey);
    
    // Store API key
    localStorage.setItem('toyibpay_api_key', apiKey);
    
    return {
        createPayment: function(amount, description, callback) {
            // Simulate ToyibPay payment creation
            setTimeout(() => {
                const paymentId = 'toyibpay_' + Date.now();
                callback(null, {
                    paymentId: paymentId,
                    redirectUrl: `toyibpay://payment/${paymentId}`
                });
            }, 1000);
        },
        
        verifyPayment: function(paymentId, callback) {
            // Simulate payment verification
            setTimeout(() => {
                const isSuccess = Math.random() > 0.2; // 80% success rate
                callback(null, {
                    verified: isSuccess,
                    status: isSuccess ? 'completed' : 'failed'
                });
            }, 1500);
        }
    };
}

// Function to process ToyibPay payment
function processToyibPayPayment(amount, email, pin) {
    return new Promise((resolve, reject) => {
        // Simulate API call to ToyibPay
        setTimeout(() => {
            // Simulate successful payment 90% of the time
            const isSuccess = Math.random() > 0.1;
            
            if (isSuccess) {
                resolve({
                    success: true,
                    transactionId: 'TOYIB-' + Date.now(),
                    message: 'Payment successful'
                });
            } else {
                reject({
                    success: false,
                    error: 'Payment failed. Please check your credentials and try again.'
                });
            }
        }, 2000);
    });
}