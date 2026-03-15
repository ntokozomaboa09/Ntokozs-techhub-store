CREATE DATABASE IF NOT EXISTS ntokozos_tech_hub;
USE ntokozos_tech_hub;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(50)
);

CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    category_id INT,
    brand VARCHAR(100),
    specs JSON,
    image_url VARCHAR(500),
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2),
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT,
    payment_method VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    product_id INT,
    quantity INT,
    price DECIMAL(10,2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    product_id INT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

INSERT INTO categories (name, description, icon) VALUES
('Gaming Laptops', 'High-performance laptops for gaming', 'fa-laptop'),
('Gaming PCs', 'Custom-built desktop computers', 'fa-desktop'),
('Gaming Consoles', 'PlayStation, Xbox, Nintendo', 'fa-gamepad'),
('Gaming Accessories', 'Keyboards, mice, headsets', 'fa-headphones'),
('Monitors', 'High refresh rate displays', 'fa-tv'),
('Components', 'Graphics cards, processors, etc', 'fa-microchip');

INSERT INTO users (username, email, password, full_name, is_admin) VALUES
('admin', 'admin@ntokozostech.com', '$2y$10$YourHashedPasswordHere', 'Ntokozo Maboa', TRUE);

INSERT INTO products (name, description, price, stock, category_id, brand, specs, image_url, featured) VALUES
('ASUS ROG Strix G15', '15.6" 144Hz Gaming Laptop, RTX 3060, Ryzen 7', 15999.99, 10, 1, 'ASUS', 
 '{"processor": "AMD Ryzen 7 5800H", "ram": "16GB DDR4", "storage": "512GB SSD", "graphics": "NVIDIA RTX 3060"}',
 'https://images.unsplash.com/photo-1603487742131-4160ec999306?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', TRUE),

('MSI GE76 Raider', '17.3" 240Hz Gaming Laptop, RTX 3080, i9', 28999.99, 5, 1, 'MSI',
 '{"processor": "Intel i9-12900H", "ram": "32GB DDR5", "storage": "1TB SSD", "graphics": "NVIDIA RTX 3080"}',
 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', TRUE),

('Custom Gaming PC', 'RTX 4070, i7-13700K, 32GB RAM', 24999.99, 3, 2, 'Custom',
 '{"processor": "Intel i7-13700K", "ram": "32GB DDR5", "storage": "1TB NVMe SSD", "graphics": "NVIDIA RTX 4070"}',
 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', TRUE),

('PlayStation 5', 'Sony PlayStation 5 Console with DualSense Controller', 8999.99, 15, 3, 'Sony',
 '{"storage": "825GB SSD", "controller": "DualSense", "edition": "Standard"}',
 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', TRUE),

('Logitech G Pro X', 'Wireless Gaming Headset with Blue Voice Technology', 1999.99, 25, 4, 'Logitech',
 '{"type": "Wireless", "battery": "20+ hours", "driver": "50mm"}',
 'https://images.unsplash.com/photo-1599669454699-248893623440?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', FALSE),

('Samsung Odyssey G7', '32" Curved 240Hz Gaming Monitor, 1ms', 6999.99, 8, 5, 'Samsung',
 '{"size": "32 inch", "refresh": "240Hz", "response": "1ms", "resolution": "2560x1440"}',
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', TRUE),

('Razer BlackWidow V3', 'Mechanical Gaming Keyboard with RGB', 2499.99, 30, 4, 'Razer',
 '{"type": "Mechanical", "switches": "Green", "rgb": "Razer Chroma"}',
 'https://images.unsplash.com/photo-1595225476474-87563907b212?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', FALSE),

('Nintendo Switch OLED', 'Nintendo Switch OLED Model with Neon Joy-Con', 5999.99, 12, 3, 'Nintendo',
 '{"screen": "7-inch OLED", "storage": "64GB", "battery": "4.5-9 hours"}',
 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', TRUE),

('AMD Ryzen 9 7950X', '16-Core 32-Thread Desktop Processor', 8999.99, 7, 6, 'AMD',
 '{"cores": "16", "threads": "32", "max clock": "5.7GHz", "socket": "AM5"}',
 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', FALSE),

('NVIDIA RTX 4090', '24GB GDDR6X Graphics Card', 32999.99, 2, 6, 'NVIDIA',
 '{"memory": "24GB GDDR6X", "cores": "16384", "boost clock": "2.52GHz"}',
 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', TRUE);