-- Create Database
CREATE DATABASE IF NOT EXISTS pagoda_website CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pagoda_website;

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date VARCHAR(10) NOT NULL COMMENT 'Format: DD/MM',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL COMMENT 'Lễ hội, Tu tập, Giảng dạy, etc',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,
    label VARCHAR(255) NOT NULL,
    `order` INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_order (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT,
    type ENUM('inquiry', 'donation', 'newsletter') DEFAULT 'inquiry',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Sample Events
INSERT INTO events (date, title, description, category) VALUES
('15/08', 'Lễ Vu Lan', 'Tưởng nhớ những Phật tử đã từng mở chia, truyền kinh pháp cho chúng ta.', 'Lễ hội'),
('01/01', 'Tết Nguyên Đán', 'Kỷ niệm năm mới với các buổi tụng kinh và bài giảng Phật pháp đầu năm.', 'Tết'),
('08/04', 'Lễ Phật Đản', 'Kỷ niệm ngày Đức Phật Thích Ca Mâu Ni ra đời - ngày thiêng liêng của Phật giáo.', 'Lễ hội'),
('15/10', 'Thiền định chiều', 'Buổi thiền định lâu dài từ chiều đến tối, giúp tu tập sâu sắc hơn.', 'Tu tập'),
('28/03', 'Giảng kinh Pháp Hoa', 'Giáo sư giảng giải kinh Pháp Hoa - một trong những kinh điển quan trọng nhất của Phật giáo.', 'Giảng dạy'),
('09/06', 'Lễ Tam Bảo', 'Cúng dường Tam Bảo (Phật, Pháp, Tăng) trong không khí trang nghiêm và trang trọng.', 'Lễ tụng');
