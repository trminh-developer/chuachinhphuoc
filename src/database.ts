import { dbPool } from './server';
import mysql from 'mysql2/promise';

interface Event {
    id: number;
    date: string;
    title: string;
    description: string;
    category: string;
    created_at: string;
}

interface GalleryItem {
    id: number;
    image_url: string;
    label: string;
    order: number;
}

interface Admin {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    created_at: string;
}

// Initialize database tables
export async function initializeDatabase() {
    const connection = await dbPool.getConnection();

    try {
        // Create events table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date VARCHAR(10) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                category VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_date (date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Create gallery table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS gallery (
                id INT AUTO_INCREMENT PRIMARY KEY,
                image_url VARCHAR(500) NOT NULL,
                label VARCHAR(255) NOT NULL,
                \`order\` INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_order (\`order\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Create contacts table for newsletter/inquiries
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS contacts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                message TEXT,
                type ENUM('inquiry', 'donation', 'newsletter') DEFAULT 'inquiry',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Create admin table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✓ Database tables initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// Get all events
export async function getEvents(): Promise<Event[]> {
    const connection = await dbPool.getConnection();

    try {
        const [rows] = await connection.execute(`
            SELECT * FROM events
            ORDER BY STR_TO_DATE(date, '%d/%m') ASC
        `);
        return rows as Event[];
    } finally {
        connection.release();
    }
}

// Add new event
export async function addEvent(
    date: string,
    title: string,
    description: string,
    category: string
): Promise<number> {
    const connection = await dbPool.getConnection();

    try {
        const [result] = await connection.execute(
            `INSERT INTO events (date, title, description, category)
             VALUES (?, ?, ?, ?)`,
            [date, title, description, category]
        );
        const insertResult = result as any;
        return insertResult.insertId;
    } finally {
        connection.release();
    }
}

// Get gallery items
export async function getGalleryItems(): Promise<GalleryItem[]> {
    const connection = await dbPool.getConnection();

    try {
        const [rows] = await connection.execute(`
            SELECT * FROM gallery
            ORDER BY \`order\` ASC
        `);
        return rows as GalleryItem[];
    } finally {
        connection.release();
    }
}

// Add gallery item
export async function addGalleryItem(
    imageUrl: string,
    label: string,
    order: number = 0
): Promise<number> {
    const connection = await dbPool.getConnection();

    try {
        const [result] = await connection.execute(
            `INSERT INTO gallery (image_url, label, \`order\`)
             VALUES (?, ?, ?)`,
            [imageUrl, label, order]
        );
        const insertResult = result as any;
        return insertResult.insertId;
    } finally {
        connection.release();
    }
}

// Save contact inquiry
export async function saveContact(
    name: string,
    email: string,
    phone: string | null,
    message: string,
    type: 'inquiry' | 'donation' | 'newsletter' = 'inquiry'
): Promise<number> {
    const connection = await dbPool.getConnection();

    try {
        const [result] = await connection.execute(
            `INSERT INTO contacts (name, email, phone, message, type)
             VALUES (?, ?, ?, ?, ?)`,
            [name, email, phone, message, type]
        );
        const insertResult = result as any;
        return insertResult.insertId;
    } finally {
        connection.release();
    }
}

// Get all contacts
export async function getContacts() {
    const connection = await dbPool.getConnection();

    try {
        const [rows] = await connection.execute(`
            SELECT * FROM contacts
            ORDER BY created_at DESC
        `);
        return rows;
    } finally {
        connection.release();
    }
}

// Admin functions
export async function createAdmin(
    username: string,
    email: string,
    passwordHash: string
): Promise<number> {
    const connection = await dbPool.getConnection();

    try {
        const [result] = await connection.execute(
            `INSERT INTO admins (username, email, password_hash)
             VALUES (?, ?, ?)`,
            [username, email, passwordHash]
        );
        const insertResult = result as any;
        return insertResult.insertId;
    } finally {
        connection.release();
    }
}

export async function getAdminByUsername(username: string): Promise<Admin | null> {
    const connection = await dbPool.getConnection();

    try {
        const [rows] = await connection.execute(
            `SELECT * FROM admins WHERE username = ?`,
            [username]
        );
        const result = rows as Admin[];
        return result.length > 0 ? result[0] : null;
    } finally {
        connection.release();
    }
}

export async function getAdminByEmail(email: string): Promise<Admin | null> {
    const connection = await dbPool.getConnection();

    try {
        const [rows] = await connection.execute(
            `SELECT * FROM admins WHERE email = ?`,
            [email]
        );
        const result = rows as Admin[];
        return result.length > 0 ? result[0] : null;
    } finally {
        connection.release();
    }
}

export async function getAdminById(id: number): Promise<Admin | null> {
    const connection = await dbPool.getConnection();

    try {
        const [rows] = await connection.execute(
            `SELECT * FROM admins WHERE id = ?`,
            [id]
        );
        const result = rows as Admin[];
        return result.length > 0 ? result[0] : null;
    } finally {
        connection.release();
    }
}
