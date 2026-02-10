// Freight Management JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const session = checkAuth();
    if (!session || session.userType !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize freight module
    initializeFreightModule();
    
    // Load data
    loadCouriers();
    loadShippingRules();
    loadRecentShipments();
    
    // Set current date
    updateCurrentDate();
    
    // Initialize event listeners
    initFreightEventListeners();
    
    // Calculate initial shipping estimate
    calculateShipping();
    
    // Log freight module access
    logActivity('info', 'Freight management module accessed');
});

function initializeFreightModule() {
    // Shipping rates configuration
    window.shippingRates = {
        local: {
            baseRate: 5.00,
            perKg: 2.00,
            expressMultiplier: 1.5,
            priorityMultiplier: 2.0,
            deliveryTime: {
                standard: '1-3 days',
                express: '1-2 days',
                priority: 'Same day'
            }
        },
        asean: {
            baseRate: 25.00,
            perKg: 5.00,
            expressMultiplier: 1.8,
            priorityMultiplier: 2.5,
            deliveryTime: {
                standard: '3-7 days',
                express: '2-4 days',
                priority: '1-2 days'
            }
        },
        international: {
            baseRate: 50.00,
            perKg: 10.00,
            expressMultiplier: 2.0,
            priorityMultiplier: 3.0,
            deliveryTime: {
                standard: '7-14 days',
                express: '3-7 days',
                priority: '2-4 days'
            }
        }
    };
    
    // Courier partners data
    window.couriers = [
        {
            id: 1,
            name: 'Pos Malaysia',
            logo: 'fas fa-mail-bulk',
            serviceType: ['Local', 'International'],
            coverage: ['Malaysia', 'Worldwide'],
            trackingUrl: 'https://www.pos.com.my/tracking',
            status: 'active',
            rates: {
                local: { base: 6.00, perKg: 1.50 },
                international: { base: 45.00, perKg: 8.00 }
            }
        },
        {
            id: 2,
            name: 'DHL Express',
            logo: 'fas fa-shipping-fast',
            serviceType: ['Express', 'International'],
            coverage: ['Worldwide'],
            trackingUrl: 'https://www.dhl.com/tracking',
            status: 'active',
            rates: {
                international: { base: 60.00, perKg: 12.00 }
            }
        },
        {
            id: 3,
            name: 'Ninja Van',
            logo: 'fas fa-truck',
            serviceType: ['Local', 'Express'],
            coverage: ['Malaysia', 'Singapore', 'Indonesia'],
            trackingUrl: 'https://www.ninjavan.co/tracking',
            status: 'active',
            rates: {
                local: { base: 5.50, perKg: 1.80 }
            }
        },
        {
            id: 4,
            name: 'Lalamove',
            logo: 'fas fa-motorcycle',
            serviceType: ['Same Day', 'Local'],
            coverage: ['Malaysia'],
            trackingUrl: 'https://www.lalamove.com/tracking',
            status: 'active',
            rates: {
                local: { base: 8.00, perKg: 2.50 }
            }
        }
    ];
    
    // Shipping rules
    window.shippingRules = [
        {
            id: 1,
            name: 'Free Shipping',
            type: 'free_shipping',
            condition: { minAmount: 100, zone: 'local' },
            status: 'active'
        },
        {
            id: 2,
            name: 'Weight Limit',
            type: 'weight_limit',
            condition: { maxWeight: 30 },
            status: 'active'
        },
        {
            id: 3,
            name: 'Restricted Items',
            type: 'restricted',
            condition: { items: ['hazardous', 'flammable', 'explosive'] },
            status: 'active'
        }
    ];
}

function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

function initFreightEventListeners() {
    // Menu toggle for mobile
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.admin-sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshFreightData);
    }
    
    // Calculate all button
    const calculateAllBtn = document.getElementById('calculateAllBtn');
    if (calculateAllBtn) {
        calculateAllBtn.addEventListener('click', calculateAllShipments);
    }
    
    // Export button
    const exportFreightBtn = document.getElementById('exportFreightBtn');
    if (exportFreightBtn) {
        exportFreightBtn.addEventListener('click', exportFreightData);
    }
    
    // Calculate button
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateShipping);
    }
    
    // Add zone button
    const addZoneBtn = document.getElementById('addZoneBtn');
    if (addZoneBtn) {
        addZoneBtn.addEventListener('click', () => openZoneModal());
    }
    
    // Add courier button
    const addCourierBtn = document.getElementById('addCourierBtn');
    if (addCourierBtn) {
        addCourierBtn.addEventListener('click', () => openCourierModal());
    }
    
    // Add rule button
    const addRuleBtn = document.getElementById('addRuleBtn');
    if (addRuleBtn) {
        addRuleBtn.addEventListener('click', () => openRuleModal());
    }
    
    // Refresh tracking button
    const refreshTrackingBtn = document.getElementById('refreshTrackingBtn');
    if (refreshTrackingBtn) {
        refreshTrackingBtn.addEventListener('click', refreshTracking);
    }
    
    // Track button
    const trackBtn = document.getElementById('trackBtn');
    const trackingNumberInput = document.getElementById('trackingNumber');
    
    if (trackBtn && trackingNumberInput) {
        trackBtn.addEventListener('click', trackShipment);
        trackingNumberInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') trackShipment();
        });
    }
    
    // Calculator inputs
    const calculatorInputs = [
        'originCountry', 'destinationCountry', 'packageWeight',
        'packageDimensions', 'shippingMethod', 'insurance', 'declaredValue'
    ];
    
    calculatorInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            if (input.type === 'checkbox') {
                input.addEventListener('change', calculateShipping);
            } else {
                input.addEventListener('input', calculateShipping);
            }
        }
    });
}

function loadCouriers() {
    const tableBody = document.getElementById('couriersTableBody');
    if (!tableBody) return;
    
    // Clear table
    tableBody.innerHTML = '';
    
    // Add couriers to table
    window.couriers.forEach(courier => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <i class="${courier.logo} fa-lg"></i>
            </td>
            <td>
                <strong>${courier.name}</strong>
            </td>
            <td>
                ${courier.serviceType.map(type => 
                    `<span class="badge">${type}</span>`
                ).join(' ')}
            </td>
            <td>${courier.coverage.join(', ')}</td>
            <td>
                <a href="${courier.trackingUrl}" target="_blank" class="link">
                    ${courier.trackingUrl}
                </a>
            </td>
            <td>
                <span class="badge ${courier.status}">
                    ${courier.status}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editCourier(${courier.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteCourier(${courier.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function loadShippingRules() {
    const rulesContainer = document.querySelector('.rules-container');
    if (!rulesContainer) return;
    
    // Clear existing rules (except the hardcoded ones)
    const existingRules = rulesContainer.querySelectorAll('.rule-card');
    if (existingRules.length > window.shippingRules.length) {
        for (let i = window.shippingRules.length; i < existingRules.length; i++) {
            existingRules[i].remove();
        }
    }
}

function loadRecentShipments() {
    // This would load from Google Sheets in production
    // For now, we'll simulate data
    const shipments = [
        {
            trackingNumber: 'GM-2024-001234',
            destination: 'Kuala Lumpur, Malaysia',
            status: 'delivered',
            lastUpdate: '2024-01-15 14:30:00'
        },
        {
            trackingNumber: 'GM-2024-001235',
            destination: 'Singapore',
            status: 'in_transit',
            lastUpdate: '2024-01-15 12:15:00'
        },
        {
            trackingNumber: 'GM-2024-001236',
            destination: 'Tokyo, Japan',
            status: 'processing',
            lastUpdate: '2024-01-15 10:00:00'
        }
    ];
    
    // Store for tracking
    window.recentShipments = shipments;
}

function calculateShipping() {
    const origin = document.getElementById('originCountry').value;
    const destination = document.getElementById('destinationCountry').value;
    const weight = parseFloat(document.getElementById('packageWeight').value) || 1;
    const dimensions = document.getElementById('packageDimensions').value;
    const method = document.getElementById('shippingMethod').value;
    const insurance = document.getElementById('insurance').checked;
    const declaredValue = parseFloat(document.getElementById('declaredValue').value) || 100;
    
    // Determine zone
    let zone;
    if (origin === destination && destination === 'MY') {
        zone = 'local';
    } else if (['MY', 'SG', 'ID', 'TH', 'PH'].includes(destination)) {
        zone = 'asean';
    } else {
        zone = 'international';
    }
    
    const rates = window.shippingRates[zone];
    
    // Calculate base rate
    let baseRate = rates.baseRate;
    
    // Calculate weight charge
    let weightCharge = weight * rates.perKg;
    
    // Calculate method multiplier
    let methodMultiplier = 1;
    if (method === 'express') methodMultiplier = rates.expressMultiplier;
    if (method === 'priority') methodMultiplier = rates.priorityMultiplier;
    
    // Calculate insurance
    let insuranceFee = insurance ? declaredValue * 0.01 : 0;
    
    // Calculate total
    let totalShipping = (baseRate + weightCharge) * methodMultiplier + insuranceFee;
    
    // Get delivery time
    let deliveryTime = rates.deliveryTime[method] || rates.deliveryTime.standard;
    
    // Update display
    document.getElementById('baseRate').textContent = `RM ${baseRate.toFixed(2)}`;
    document.getElementById('weightCharge').textContent = `RM ${weightCharge.toFixed(2)}`;
    document.getElementById('expressFee').textContent = `RM ${((baseRate + weightCharge) * (methodMultiplier - 1)).toFixed(2)}`;
    document.getElementById('insuranceFee').textContent = `RM ${insuranceFee.toFixed(2)}`;
    document.getElementById('totalShipping').textContent = `RM ${totalShipping.toFixed(2)}`;
    document.getElementById('deliveryTime').textContent = deliveryTime;
    
    // Store calculation for later use
    window.currentShippingCalculation = {
        zone: zone,
        baseRate: baseRate,
        weightCharge: weightCharge,
        methodMultiplier: methodMultiplier,
        insuranceFee: insuranceFee,
        totalShipping: totalShipping,
        deliveryTime: deliveryTime
    };
}

function calculateWidgetShipping() {
    const destination = document.getElementById('widgetDestination').value;
    const weight = parseFloat(document.getElementById('widgetWeight').value) || 1;
    
    let total = 0;
    
    switch(destination) {
        case 'local':
            total = 5 + (weight * 2);
            break;
        case 'asean':
            total = 25 + (weight * 5);
            break;
        case 'international':
            total = 50 + (weight * 10);
            break;
    }
    
    const resultElement = document.getElementById('widgetResult').querySelector('strong');
    resultElement.textContent = `RM ${total.toFixed(2)}`;
}

function trackShipment() {
    const trackingNumber = document.getElementById('trackingNumber').value.trim();
    const resultsContainer = document.getElementById('trackingResults');
    
    if (!trackingNumber) {
        showAlert('error', 'Please enter a tracking number.');
        return;
    }
    
    // Clear previous results
    resultsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Tracking...</div>';
    
    // Simulate API call
    setTimeout(() => {
        // Mock tracking data
        const trackingData = generateMockTrackingData(trackingNumber);
        
        if (trackingData) {
            displayTrackingResults(trackingData);
            logActivity('info', `Tracking request: ${trackingNumber}`);
        } else {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3 data-en="Tracking Not Found" data-ms="Penjejakan Tidak Dijumpai"></h3>
                    <p data-en="No tracking information found for this number." data-ms="Tiada maklumat penjejakan ditemui untuk nombor ini."></p>
                </div>
            `;
            updateLanguageText();
        }
    }, 1500);
}

function generateMockTrackingData(trackingNumber) {
    // Generate consistent mock data based on tracking number
    if (!trackingNumber.startsWith('GM-')) {
        return null;
    }
    
    const statuses = [
        {
            status: 'processing',
            description: 'Package received at origin facility',
            location: 'Kuala Lumpur Hub',
            timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
            status: 'in_transit',
            description: 'Package in transit',
            location: 'In Transit',
            timestamp: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
        },
        {
            status: 'out_for_delivery',
            description: 'Out for delivery',
            location: 'Local Delivery Center',
            timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
        },
        {
            status: 'delivered',
            description: 'Delivered successfully',
            location: 'Customer Location',
            timestamp: new Date().toISOString()
        }
    ];
    
    // Pick a random status for demo
    const statusIndex = Math.floor(Math.random() * statuses.length);
    const currentStatus = statuses[statusIndex];
    
    return {
        trackingNumber: trackingNumber,
        status: currentStatus.status,
        estimatedDelivery: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        origin: 'Kuala Lumpur, Malaysia',
        destination: 'Singapore',
        weight: '2.5 kg',
        dimensions: '30x20x15 cm',
        service: 'Express',
        courier: 'DHL Express',
        timeline: statuses.slice(0, statusIndex + 1)
    };
}

function displayTrackingResults(trackingData) {
    const resultsContainer = document.getElementById('trackingResults');
    
    let statusBadge = '';
    let statusColor = '';
    
    switch(trackingData.status) {
        case 'processing':
            statusBadge = 'Processing';
            statusColor = 'var(--warning-color)';
            break;
        case 'in_transit':
            statusBadge = 'In Transit';
            statusColor = 'var(--primary-color)';
            break;
        case 'out_for_delivery':
            statusBadge = 'Out for Delivery';
            statusColor = 'var(--secondary-color)';
            break;
        case 'delivered':
            statusBadge = 'Delivered';
            statusColor = 'var(--success-color)';
            break;
    }
    
    const timelineHTML = trackingData.timeline.map((item, index) => `
        <div class="timeline-item">
            <div class="timeline-icon" style="background-color: ${statusColor};">
                <i class="fas fa-${getStatusIcon(item.status)}"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-time">${formatDateTime(item.timestamp)}</div>
                <div class="timeline-description">${item.description}</div>
                <div class="timeline-location">${item.location}</div>
            </div>
        </div>
    `).join('');
    
    resultsContainer.innerHTML = `
        <div class="tracking-header">
            <h3>Tracking: ${trackingData.trackingNumber}</h3>
            <span class="status-badge" style="background-color: ${statusColor};">
                ${statusBadge}
            </span>
        </div>
        
        <div class="tracking-timeline">
            ${timelineHTML}
        </div>
        
        <div class="shipment-details">
            <h4>Shipment Details</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Origin</span>
                    <span class="detail-value">${trackingData.origin}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Destination</span>
                    <span class="detail-value">${trackingData.destination}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Weight</span>
                    <span class="detail-value">${trackingData.weight}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Dimensions</span>
                    <span class="detail-value">${trackingData.dimensions}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Service</span>
                    <span class="detail-value">${trackingData.service}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Courier</span>
                    <span class="detail-value">${trackingData.courier}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Estimated Delivery</span>
                    <span class="detail-value">${formatDateTime(trackingData.estimatedDelivery)}</span>
                </div>
            </div>
        </div>
    `;
}

function getStatusIcon(status) {
    switch(status) {
        case 'processing': return 'box-open';
        case 'in_transit': return 'truck';
        case 'out_for_delivery': return 'shipping-fast';
        case 'delivered': return 'check-circle';
        default: return 'info-circle';
    }
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function openShippingCalculator() {
    const modal = document.getElementById('shippingCalculatorModal');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <div class="calculator-container">
            <div class="calculator-form">
                <div class="form-row">
                    <div class="form-group">
                        <label data-en="Origin Country" data-ms="Negara Asal"></label>
                        <select class="country-select">
                            <option value="MY" selected>Malaysia</option>
                            <option value="SG">Singapore</option>
                            <option value="ID">Indonesia</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label data-en="Destination Country" data-ms="Negara Destinasi"></label>
                        <select class="country-select">
                            <option value="MY">Malaysia</option>
                            <option value="SG">Singapore</option>
                            <option value="ID">Indonesia</option>
                            <option value="US">United States</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label data-en="Package Weight (kg)" data-ms="Berat Pakej (kg)"></label>
                    <input type="number" value="1" min="0.1" max="50" step="0.1">
                </div>
                <button class="btn-primary btn-block" onclick="calculateModalShipping()">
                    <span data-en="Calculate" data-ms="Kira"></span>
                </button>
            </div>
            <div class="calculator-results">
                <h3 data-en="Shipping Estimate" data-ms="Anggaran Penghantaran"></h3>
                <div class="estimate-details" id="modalEstimate">
                    <div class="estimate-item">
                        <span data-en="Enter details to calculate" data-ms="Masukkan butiran untuk mengira"></span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    updateLanguageText();
    modal.classList.add('active');
}

function calculateModalShipping() {
    // This would calculate shipping for the modal
    const estimateElement = document.getElementById('modalEstimate');
    estimateElement.innerHTML = `
        <div class="estimate-item">
            <span data-en="Estimated Cost:" data-ms="Anggaran Kos:"></span>
            <strong>RM 25.00</strong>
        </div>
        <div class="estimate-item">
            <span data-en="Delivery Time:" data-ms="Masa Penghantaran:"></span>
            <strong>3-5 days</strong>
        </div>
    `;
    updateLanguageText();
}

function openTrackingModal() {
    const modal = document.getElementById('trackingModal');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <div class="tracking-container">
            <div class="tracking-search">
                <input type="text" placeholder="Enter tracking number" 
                       data-en="Enter tracking number" 
                       data-ms="Masukkan nombor penjejakan">
                <button class="btn-primary" onclick="trackInModal()">
                    <i class="fas fa-search"></i>
                    <span data-en="Track" data-ms="Jejak"></span>
                </button>
            </div>
            <div class="tracking-results" id="modalTrackingResults">
                <div class="empty-state">
                    <i class="fas fa-shipping-fast"></i>
                    <h3 data-en="Enter Tracking Number" data-ms="Masukkan Nombor Penjejakan"></h3>
                    <p data-en="Enter a tracking number to view shipment details" data-ms="Masukkan nombor penjejakan untuk melihat butiran penghantaran"></p>
                </div>
            </div>
        </div>
    `;
    
    updateLanguageText();
    modal.classList.add('active');
}

function trackInModal() {
    const input = document.querySelector('#trackingModal input');
    const resultsContainer = document.getElementById('modalTrackingResults');
    
    if (!input.value.trim()) {
        showAlert('error', 'Please enter a tracking number.');
        return;
    }
    
    resultsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Tracking...</div>';
    
    setTimeout(() => {
        resultsContainer.innerHTML = `
            <div class="tracking-header">
                <h3>Tracking: ${input.value}</h3>
                <span class="status-badge" style="background-color: var(--primary-color);">
                    In Transit
                </span>
            </div>
            <div class="shipment-details">
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Status</span>
                        <span class="detail-value">In Transit</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Last Update</span>
                        <span class="detail-value">${formatDateTime(new Date().toISOString())}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Estimated Delivery</span>
                        <span class="detail-value">${formatDateTime(new Date(Date.now() + 86400000).toISOString())}</span>
                    </div>
                </div>
            </div>
        `;
    }, 1500);
}

function openCourierModal() {
    const modal = document.getElementById('courierModal');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <form id="courierForm">
            <div class="form-group">
                <label for="courierName" data-en="Courier Name" data-ms="Nama Kurier"></label>
                <input type="text" id="courierName" required>
            </div>
            
            <div class="form-group">
                <label for="courierLogo" data-en="Logo Icon" data-ms="Ikon Logo"></label>
                <select id="courierLogo" required>
                    <option value="fas fa-truck">Truck</option>
                    <option value="fas fa-shipping-fast">Fast Shipping</option>
                    <option value="fas fa-plane">Plane</option>
                    <option value="fas fa-motorcycle">Motorcycle</option>
                    <option value="fas fa-mail-bulk">Mail</option>
                </select>
            </div>
            
            <div class="form-group">
                <label data-en="Service Types" data-ms="Jenis Perkhidmatan"></label>
                <div class="checkbox-group">
                    <label class="checkbox">
                        <input type="checkbox" name="serviceType" value="Local">
                        <span data-en="Local" data-ms="Tempatan"></span>
                    </label>
                    <label class="checkbox">
                        <input type="checkbox" name="serviceType" value="International">
                        <span data-en="International" data-ms="Antarabangsa"></span>
                    </label>
                    <label class="checkbox">
                        <input type="checkbox" name="serviceType" value="Express">
                        <span data-en="Express" data-ms="Ekspres"></span>
                    </label>
                    <label class="checkbox">
                        <input type="checkbox" name="serviceType" value="Same Day">
                        <span data-en="Same Day" data-ms="Hari Sama"></span>
                    </label>
                </div>
            </div>
            
            <div class="form-group">
                <label for="trackingUrl" data-en="Tracking URL" data-ms="URL Penjejakan"></label>
                <input type="url" id="trackingUrl" required placeholder="https://example.com/tracking">
            </div>
            
            <div class="form-group">
                <label for="courierStatus" data-en="Status" data-ms="Status"></label>
                <select id="courierStatus" required>
                    <option value="active" data-en="Active" data-ms="Aktif"></option>
                    <option value="inactive" data-en="Inactive" data-ms="Tidak Aktif"></option>
                </select>
            </div>
            
            <div class="modal-footer">
                <button type="button" class="btn-outline" onclick="closeModal('courierModal')">
                    <span data-en="Cancel" data-ms="Batal"></span>
                </button>
                <button type="submit" class="btn-primary">
                    <span data-en="Save Courier" data-ms="Simpan Kurier"></span>
                </button>
            </div>
        </form>
    `;
    
    // Add form submission handler
    const form = document.getElementById('courierForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveCourier();
    });
    
    updateLanguageText();
    modal.classList.add('active');
}

function openZoneModal(zoneType = null) {
    const modal = document.getElementById('zoneModal');
    const modalTitle = document.getElementById('zoneModalTitle');
    const modalBody = modal.querySelector('.modal-body');
    
    const isEdit = zoneType !== null;
    const zone = isEdit ? window.shippingRates[zoneType] : null;
    
    modalTitle.innerHTML = isEdit 
        ? `<span data-en="Edit Zone" data-ms="Edit Zon"></span>`
        : `<span data-en="Add Shipping Zone" data-ms="Tambah Zon Penghantaran"></span>`;
    
    modalBody.innerHTML = `
        <form id="zoneForm">
            <input type="hidden" id="zoneType" value="${zoneType || ''}">
            
            <div class="form-group">
                <label for="zoneName" data-en="Zone Name" data-ms="Nama Zon"></label>
                <input type="text" id="zoneName" required 
                       value="${isEdit ? (zoneType === 'local' ? 'Local Delivery' : zoneType === 'asean' ? 'Regional' : 'International') : ''}">
            </div>
            
            <div class="form-group">
                <label for="zoneDescription" data-en="Description" data-ms="Penerangan"></label>
                <input type="text" id="zoneDescription" required 
                       value="${isEdit ? (zoneType === 'local' ? 'Within Malaysia' : zoneType === 'asean' ? 'ASEAN Countries' : 'Worldwide') : ''}">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="baseRate" data-en="Base Rate (RM)" data-ms="Kadar Asas (RM)"></label>
                    <input type="number" id="baseRate" required min="0" step="0.01" 
                           value="${isEdit ? zone.baseRate : '0'}">
                </div>
                <div class="form-group">
                    <label for="perKgRate" data-en="Per Kg Rate (RM)" data-ms="Kadar Per Kg (RM)"></label>
                    <input type="number" id="perKgRate" required min="0" step="0.01" 
                           value="${isEdit ? zone.perKg : '0'}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="expressMultiplier" data-en="Express Multiplier" data-ms="Pengganda Ekspres"></label>
                    <input type="number" id="expressMultiplier" required min="1" step="0.1" 
                           value="${isEdit ? zone.expressMultiplier : '1.5'}">
                </div>
                <div class="form-group">
                    <label for="priorityMultiplier" data-en="Priority Multiplier" data-ms="Pengganda Keutamaan"></label>
                    <input type="number" id="priorityMultiplier" required min="1" step="0.1" 
                           value="${isEdit ? zone.priorityMultiplier : '2.0'}">
                </div>
            </div>
            
            <h4 data-en="Delivery Times" data-ms="Masa Penghantaran"></h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="standardTime" data-en="Standard" data-ms="Standard"></label>
                    <input type="text" id="standardTime" required 
                           value="${isEdit ? zone.deliveryTime.standard : '1-3 days'}">
                </div>
                <div class="form-group">
                    <label for="expressTime" data-en="Express" data-ms="Ekspres"></label>
                    <input type="text" id="expressTime" required 
                           value="${isEdit ? zone.deliveryTime.express : '1-2 days'}">
                </div>
                <div class="form-group">
                    <label for="priorityTime" data-en="Priority" data-ms="Keutamaan"></label>
                    <input type="text" id="priorityTime" required 
                           value="${isEdit ? zone.deliveryTime.priority : 'Same day'}">
                </div>
            </div>
            
            <div class="form-group">
                <label for="zoneCountries" data-en="Countries (comma-separated)" data-ms="Negara (dipisahkan koma)"></label>
                <textarea id="zoneCountries" rows="3">${isEdit ? (zoneType === 'local' ? 'Malaysia' : zoneType === 'asean' ? 'Malaysia, Singapore, Indonesia, Thailand, Philippines, Vietnam, Brunei, Myanmar, Laos, Cambodia' : 'All countries') : ''}</textarea>
            </div>
            
            <div class="modal-footer">
                <button type="button" class="btn-outline" onclick="closeModal('zoneModal')">
                    <span data-en="Cancel" data-ms="Batal"></span>
                </button>
                <button type="submit" class="btn-primary">
                    <span data-en="${isEdit ? 'Update Zone' : 'Add Zone'}" data-ms="${isEdit ? 'Kemas kini Zon' : 'Tambah Zon'}"></span>
                </button>
            </div>
        </form>
    `;
    
    // Add form submission handler
    const form = document.getElementById('zoneForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveZone();
    });
    
    updateLanguageText();
    modal.classList.add('active');
}

function openRateModal() {
    const modal = document.getElementById('rateModal');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <div class="rates-management">
            <h4 data-en="Shipping Rates Configuration" data-ms="Konfigurasi Kadar Penghantaran"></h4>
            
            <div class="rates-table">
                <table>
                    <thead>
                        <tr>
                            <th data-en="Zone" data-ms="Zon"></th>
                            <th data-en="Base Rate (RM)" data-ms="Kadar Asas (RM)"></th>
                            <th data-en="Per Kg (RM)" data-ms="Per Kg (RM)"></th>
                            <th data-en="Express" data-ms="Ekspres"></th>
                            <th data-en="Priority" data-ms="Keutamaan"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td data-en="Local" data-ms="Tempatan"></td>
                            <td><input type="number" value="5.00" min="0" step="0.01"></td>
                            <td><input type="number" value="2.00" min="0" step="0.01"></td>
                            <td><input type="number" value="1.5" min="1" step="0.1"></td>
                            <td><input type="number" value="2.0" min="1" step="0.1"></td>
                        </tr>
                        <tr>
                            <td data-en="Regional" data-ms="Serantau"></td>
                            <td><input type="number" value="25.00" min="0" step="0.01"></td>
                            <td><input type="number" value="5.00" min="0" step="0.01"></td>
                            <td><input type="number" value="1.8" min="1" step="0.1"></td>
                            <td><input type="number" value="2.5" min="1" step="0.1"></td>
                        </tr>
                        <tr>
                            <td data-en="International" data-ms="Antarabangsa"></td>
                            <td><input type="number" value="50.00" min="0" step="0.01"></td>
                            <td><input type="number" value="10.00" min="0" step="0.01"></td>
                            <td><input type="number" value="2.0" min="1" step="0.1"></td>
                            <td><input type="number" value="3.0" min="1" step="0.1"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="modal-footer">
                <button type="button" class="btn-outline" onclick="closeModal('rateModal')">
                    <span data-en="Cancel" data-ms="Batal"></span>
                </button>
                <button type="button" class="btn-primary" onclick="saveShippingRates()">
                    <span data-en="Save Rates" data-ms="Simpan Kadar"></span>
                </button>
            </div>
        </div>
    `;
    
    updateLanguageText();
    modal.classList.add('active');
}

function saveCourier() {
    const form = document.getElementById('courierForm');
    const formData = new FormData(form);
    
    // Get service types
    const serviceTypes = [];
    form.querySelectorAll('input[name="serviceType"]:checked').forEach(checkbox => {
        serviceTypes.push(checkbox.value);
    });
    
    // Create new courier object
    const newCourier = {
        id: window.couriers.length + 1,
        name: document.getElementById('courierName').value,
        logo: document.getElementById('courierLogo').value,
        serviceType: serviceTypes,
        coverage: ['Malaysia'], // Default coverage
        trackingUrl: document.getElementById('trackingUrl').value,
        status: document.getElementById('courierStatus').value,
        rates: {
            local: { base: 5.00, perKg: 2.00 }
        }
    };
    
    // Add to couriers array
    window.couriers.push(newCourier);
    
    // Reload couriers table
    loadCouriers();
    
    // Close modal
    closeModal('courierModal');
    
    // Show success message
    showAlert('success', `Courier "${newCourier.name}" added successfully.`);
    
    // Log activity
    logActivity('info', `New courier added: ${newCourier.name}`);
}

function saveZone() {
    const form = document.getElementById('zoneForm');
    const zoneType = document.getElementById('zoneType').value;
    const isEdit = zoneType !== '';
    
    const zoneData = {
        baseRate: parseFloat(document.getElementById('baseRate').value),
        perKg: parseFloat(document.getElementById('perKgRate').value),
        expressMultiplier: parseFloat(document.getElementById('expressMultiplier').value),
        priorityMultiplier: parseFloat(document.getElementById('priorityMultiplier').value),
        deliveryTime: {
            standard: document.getElementById('standardTime').value,
            express: document.getElementById('expressTime').value,
            priority: document.getElementById('priorityTime').value
        }
    };
    
    if (isEdit) {
        // Update existing zone
        window.shippingRates[zoneType] = zoneData;
        showAlert('success', 'Zone updated successfully.');
        logActivity('info', `Shipping zone updated: ${zoneType}`);
    } else {
        // Add new zone
        const zoneName = document.getElementById('zoneName').value.toLowerCase().replace(' ', '_');
        window.shippingRates[zoneName] = zoneData;
        showAlert('success', 'New zone added successfully.');
        logActivity('info', `New shipping zone added: ${zoneName}`);
    }
    
    // Close modal
    closeModal('zoneModal');
    
    // Recalculate shipping if calculator is open
    calculateShipping();
}

function saveShippingRates() {
    const ratesTable = document.querySelector('.rates-table table');
    const rows = ratesTable.querySelectorAll('tbody tr');
    
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        const zoneName = cells[0].textContent.trim().toLowerCase();
        
        if (window.shippingRates[zoneName]) {
            window.shippingRates[zoneName].baseRate = parseFloat(cells[1].querySelector('input').value);
            window.shippingRates[zoneName].perKg = parseFloat(cells[2].querySelector('input').value);
            window.shippingRates[zoneName].expressMultiplier = parseFloat(cells[3].querySelector('input').value);
            window.shippingRates[zoneName].priorityMultiplier = parseFloat(cells[4].querySelector('input').value);
        }
    });
    
    closeModal('rateModal');
    showAlert('success', 'Shipping rates updated successfully.');
    logActivity('info', 'Shipping rates configuration updated');
    
    // Recalculate shipping
    calculateShipping();
}

function editZone(zoneType) {
    openZoneModal(zoneType);
}

function editCourier(courierId) {
    const courier = window.couriers.find(c => c.id === courierId);
    if (!courier) return;
    
    // Open modal with courier data
    openCourierModal();
    
    // Pre-fill form with courier data
    setTimeout(() => {
        document.getElementById('courierName').value = courier.name;
        document.getElementById('courierLogo').value = courier.logo;
        document.getElementById('trackingUrl').value = courier.trackingUrl;
        document.getElementById('courierStatus').value = courier.status;
        
        // Check service types
        courier.serviceType.forEach(service => {
            const checkbox = document.querySelector(`input[name="serviceType"][value="${service}"]`);
            if (checkbox) checkbox.checked = true;
        });
        
        // Update modal title and submit button
        const modalTitle = document.querySelector('#courierModal .modal-header h3');
        const submitButton = document.querySelector('#courierModal .modal-footer .btn-primary');
        
        if (modalTitle) {
            modalTitle.setAttribute('data-en', 'Edit Courier');
            modalTitle.setAttribute('data-ms', 'Edit Kurier');
        }
        
        if (submitButton) {
            submitButton.setAttribute('data-en', 'Update Courier');
            submitButton.setAttribute('data-ms', 'Kemas kini Kurier');
        }
        
        updateLanguageText();
    }, 100);
}

function deleteCourier(courierId) {
    if (!confirm('Are you sure you want to delete this courier?')) {
        return;
    }
    
    const courierIndex = window.couriers.findIndex(c => c.id === courierId);
    if (courierIndex === -1) return;
    
    const courierName = window.couriers[courierIndex].name;
    window.couriers.splice(courierIndex, 1);
    
    loadCouriers();
    showAlert('success', `Courier "${courierName}" deleted successfully.`);
    logActivity('warning', `Courier deleted: ${courierName}`);
}

function refreshFreightData() {
    // Refresh all freight data
    loadCouriers();
    loadShippingRules();
    loadRecentShipments();
    calculateShipping();
    
    showAlert('info', 'Freight data refreshed successfully.');
    logActivity('info', 'Freight data refreshed');
}

function calculateAllShipments() {
    // This would calculate shipping for all pending shipments
    showAlert('info', 'Calculating shipping for all pending shipments...');
    
    setTimeout(() => {
        showAlert('success', 'Shipping calculations completed for 15 shipments.');
        logActivity('info', 'Bulk shipping calculation completed');
    }, 2000);
}

function exportFreightData() {
    // Prepare data for export
    const exportData = {
        shippingRates: window.shippingRates,
        couriers: window.couriers,
        rules: window.shippingRules,
        timestamp: new Date().toISOString()
    };
    
    // Create JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    // Create download link
    const exportFileDefaultName = `globalmart_freight_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showAlert('success', 'Freight data exported successfully.');
    logActivity('info', 'Freight data exported');
}

function refreshTracking() {
    const trackingNumber = document.getElementById('trackingNumber').value.trim();
    
    if (trackingNumber) {
        trackShipment();
    } else {
        showAlert('info', 'Please enter a tracking number first.');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function showAlert(type, message) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `admin-alert admin-alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-color)' : 
                     type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(alert);
    
    // Remove after 3 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(alert)) {
                document.body.removeChild(alert);
            }
        }, 300);
    }, 3000);
}

// Shipping functions for checkout page
function getShippingOptions(cart, destination) {
    // Calculate cart weight (simulated)
    const cartWeight = cart.reduce((total, item) => total + (item.quantity * 0.5), 0);
    
    // Determine zone
    let zone;
    if (destination.country === 'MY') {
        zone = 'local';
    } else if (['SG', 'ID', 'TH', 'PH', 'VN', 'BN', 'MM', 'LA', 'KH'].includes(destination.country)) {
        zone = 'asean';
    } else {
        zone = 'international';
    }
    
    const rates = window.shippingRates[zone];
    
    // Calculate shipping options
    const options = [
        {
            id: 'standard',
            name: 'Standard Shipping',
            description: `${rates.deliveryTime.standard} delivery`,
            cost: rates.baseRate + (cartWeight * rates.perKg),
            estimatedDays: rates.deliveryTime.standard
        },
        {
            id: 'express',
            name: 'Express Shipping',
            description: `${rates.deliveryTime.express} delivery`,
            cost: (rates.baseRate + (cartWeight * rates.perKg)) * rates.expressMultiplier,
            estimatedDays: rates.deliveryTime.express
        }
    ];
    
    // Add priority option for local shipping
    if (zone === 'local') {
        options.push({
            id: 'priority',
            name: 'Priority Shipping',
            description: `${rates.deliveryTime.priority} delivery`,
            cost: (rates.baseRate + (cartWeight * rates.perKg)) * rates.priorityMultiplier,
            estimatedDays: rates.deliveryTime.priority
        });
    }
    
    // Apply free shipping rule if applicable
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    if (zone === 'local' && cartTotal >= 100) {
        options.forEach(option => {
            if (option.id === 'standard') {
                option.cost = 0;
                option.name = 'Free Standard Shipping';
                option.description = 'Free shipping for orders over RM 100';
            }
        });
    }
    
    return options;
}

function validateShippingAddress(address) {
    const errors = [];
    
    if (!address.country) {
        errors.push('Country is required');
    }
    
    if (!address.state) {
        errors.push('State/Province is required');
    }
    
    if (!address.city) {
        errors.push('City is required');
    }
    
    if (!address.postalCode) {
        errors.push('Postal code is required');
    }
    
    if (!address.addressLine1) {
        errors.push('Address line 1 is required');
    }
    
    // Check for restricted destinations
    const restrictedCountries = ['CU', 'IR', 'KP', 'SY'];
    if (restrictedCountries.includes(address.country)) {
        errors.push('Shipping to this country is not available');
    }
    
    return errors;
}

// Google Sheets integration for freight
function saveShipmentToGoogleSheets(shipmentData) {
    const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
    
    if (SCRIPT_URL && SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'shipment',
                data: shipmentData
            })
        }).catch(error => {
            console.error('Failed to save shipment to Google Sheets:', error);
        });
    }
}

function getShipmentsFromGoogleSheets(filters = {}) {
    const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
    
    if (SCRIPT_URL && SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
        return fetch(`${SCRIPT_URL}?action=getAll&sheet=Shipments`)
            .then(response => response.json())
            .catch(error => {
                console.error('Failed to get shipments from Google Sheets:', error);
                return { success: false, data: [] };
            });
    }
    
    return Promise.resolve({ success: false, data: [] });
}