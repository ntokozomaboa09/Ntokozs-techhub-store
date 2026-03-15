let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let token = localStorage.getItem('token') || null;

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadFeaturedProducts();
    loadAllProducts();
    updateCartUI();
    checkAuth();
    
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    document.getElementById('cartBtn').addEventListener('click', toggleCart);
    document.getElementById('closeCart').addEventListener('click', toggleCart);
    document.getElementById('accountBtn').addEventListener('click', openAuthModal);
    
    document.getElementById('categoryFilter').addEventListener('change', filterProducts);
    document.getElementById('brandFilter').addEventListener('change', filterProducts);
    document.getElementById('sortFilter').addEventListener('change', filterProducts);
    
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);
    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });
});

async function apiRequest(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Something went wrong');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

async function loadCategories() {
    try {
        const categories = await apiRequest('/categories');
        const categoryGrid = document.getElementById('categoryGrid');
        const categoryFilter = document.getElementById('categoryFilter');
        
        categoryGrid.innerHTML = '';
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        
        categories.forEach(category => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.innerHTML = `
                <i class="fas ${category.icon}"></i>
                <h3>${category.name}</h3>
            `;
            card.addEventListener('click', () => {
                document.getElementById('categoryFilter').value = category.id;
                filterProducts();
                document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
            });
            categoryGrid.appendChild(card);
            
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

async function loadFeaturedProducts() {
    try {
        const products = await apiRequest('/featured-products');
        displayProducts(products, 'featuredProducts');
    } catch (error) {
        console.error('Failed to load featured products:', error);
    }
}

async function loadAllProducts() {
    try {
        const products = await apiRequest('/products');
        displayProducts(products, 'allProducts');
        updateBrandFilter(products);
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

async function filterProducts() {
    const category = document.getElementById('categoryFilter').value;
    const brand = document.getElementById('brandFilter').value;
    const sort = document.getElementById('sortFilter').value;
    
    let url = '/products?';
    if (category) url += `category=${category}&`;
    if (brand) url += `brand=${brand}&`;
    
    try {
        let products = await apiRequest(url);
        
        if (sort === 'price_low') {
            products.sort((a, b) => a.price - b.price);
        } else if (sort === 'price_high') {
            products.sort((a, b) => b.price - a.price);
        }
        
        displayProducts(products, 'allProducts');
    } catch (error) {
        console.error('Failed to filter products:', error);
    }
}

function displayProducts(products, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 50px;">No products found</p>';
        return;
    }
    
    products.forEach(product => {
        const specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : (product.specs || {});
        const specsText = Object.values(specs).slice(0, 2).join(' • ');
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            ${product.featured ? '<span class="product-badge">Featured</span>' : ''}
            <div class="product-image">
                <img src="${product.image_url || 'https://images.unsplash.com/photo-1593640495253-23196b27a87f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-specs">${specsText}</div>
                <div class="product-price">R${Number(product.price).toFixed(2)}</div>
                <div class="product-actions">
                    <button class="btn-add" onclick="addToCart(${product.id}, '${product.name}', ${product.price}, '${product.image_url}')">Add to Cart</button>
                    <button class="btn-view" onclick="viewProduct(${product.id})"><i class="fas fa-eye"></i></button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateBrandFilter(products) {
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    const brandFilter = document.getElementById('brandFilter');
    
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
    });
}

async function viewProduct(productId) {
    try {
        const product = await apiRequest(`/products/${productId}`);
        
        const specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : (product.specs || {});
        const specsHtml = Object.entries(specs).map(([key, value]) => `
            <div class="spec-item">
                <span>${key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                <span><strong>${value}</strong></span>
            </div>
        `).join('');
        
        const modalContent = document.getElementById('modalProduct');
        modalContent.innerHTML = `
            <div class="modal-product-image">
                <img src="${product.image_url || 'https://images.unsplash.com/photo-1593640495253-23196b27a87f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}" alt="${product.name}">
            </div>
            <div class="modal-product-info">
                <h2>${product.name}</h2>
                <div class="modal-product-price">R${Number(product.price).toFixed(2)}</div>
                <div class="modal-product-specs">
                    ${specsHtml}
                </div>
                <p class="modal-product-description">${product.description}</p>
                <button class="btn btn-primary" onclick="addToCart(${product.id}, '${product.name}', ${product.price}, '${product.image_url}')" style="width: 100%; padding: 16px;">
                    Add to Cart
                </button>
            </div>
        `;
        
        document.getElementById('productModal').classList.add('show');
    } catch (error) {
        console.error('Failed to load product:', error);
    }
}

async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    
    try {
        const products = await apiRequest(`/products?search=${encodeURIComponent(query)}`);
        displayProducts(products, 'allProducts');
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Search failed:', error);
    }
}

function addToCart(productId, productName, productPrice, productImage) {
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage || 'https://images.unsplash.com/photo-1593640495253-23196b27a87f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification(`${productName} added to cart!`, 'success');
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    cartItems.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        total += item.price * item.quantity;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">R${item.price.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="quantity-btn remove" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        cartItems.appendChild(itemElement);
    });
    
    cartTotal.textContent = `R${total.toFixed(2)}`;
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    showNotification('Product removed from cart', 'info');
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('open');
}

async function handleCheckout() {
    if (!currentUser) {
        closeModals();
        openAuthModal();
        showNotification('Please login to checkout', 'warning');
        return;
    }
    
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'warning');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = {
        items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
        })),
        total_amount: total,
        shipping_address: 'Sample Address - 123 Main St',
        payment_method: 'card'
    };
    
    try {
        await apiRequest('/orders', 'POST', order);
        cart = [];
        saveCart();
        updateCartUI();
        toggleCart();
        showNotification('Order placed successfully! Thank you for shopping with Ntokozo\'s Tech Hub', 'success');
    } catch (error) {
        console.error('Checkout failed:', error);
        showNotification('Checkout failed. Please try again.', 'error');
    }
}

function checkAuth() {
    if (currentUser) {
        document.getElementById('accountBtn').innerHTML = `<i class="fas fa-user"></i> ${currentUser.username}`;
        if (currentUser.is_admin) {
            document.getElementById('adminLink').style.display = 'inline';
        }
    } else {
        document.getElementById('accountBtn').innerHTML = '<i class="fas fa-user"></i> Account';
        document.getElementById('adminLink').style.display = 'none';
    }
}

function openAuthModal() {
    if (currentUser) {
        if (confirm('Logout?')) {
            logout();
        }
    } else {
        document.getElementById('authModal').classList.add('show');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.querySelector('input[type="text"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    try {
        const result = await apiRequest('/login', 'POST', { username, password });
        
        token = result.token;
        currentUser = result.user;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        closeModals();
        checkAuth();
        showNotification(`Welcome back, ${currentUser.username}!`, 'success');
    } catch (error) {
        console.error('Login failed:', error);
        showNotification('Invalid username or password', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const inputs = form.querySelectorAll('input');
    
    const userData = {
        full_name: inputs[0].value,
        username: inputs[1].value,
        email: inputs[2].value,
        password: inputs[3].value
    };
    
    const confirmPassword = inputs[4].value;
    
    if (userData.password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    try {
        const result = await apiRequest('/register', 'POST', userData);
        
        token = result.token;
        
        const loginResult = await apiRequest('/login', 'POST', {
            username: userData.username,
            password: userData.password
        });
        
        currentUser = loginResult.user;
        token = loginResult.token;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        closeModals();
        checkAuth();
        showNotification('Registration successful! Welcome to Ntokozo\'s Tech Hub', 'success');
    } catch (error) {
        console.error('Registration failed:', error);
        showNotification(error.message || 'Registration failed', 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    token = null;
    currentUser = null;
    checkAuth();
    showNotification('Logged out successfully', 'info');
}

function showTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelector('.auth-tab').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.querySelectorAll('.auth-tab')[1].classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 5000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);