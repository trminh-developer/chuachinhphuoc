import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool: mysql.Pool;

export function getPool(): mysql.Pool {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'pagoda_website',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            charset: 'utf8mb4',
        });
    }
    return pool;
}

export async function initDatabase(): Promise<void> {
    const p = getPool();
    await p.execute(`
        CREATE TABLE IF NOT EXISTS events (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date VARCHAR(10) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            category VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await p.execute(`
        CREATE TABLE IF NOT EXISTS gallery (
            id INT AUTO_INCREMENT PRIMARY KEY,
            image_url VARCHAR(500) NOT NULL,
            label VARCHAR(255) NOT NULL,
            \`order\` INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await p.execute(`
        CREATE TABLE IF NOT EXISTS contacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            message TEXT,
            type ENUM('inquiry', 'donation', 'newsletter') DEFAULT 'inquiry',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await p.execute(`
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password_hash VARCHAR(500) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Database tables initialized');
}

// ==================== Events ====================
export async function getEvents() {
    const [rows] = await getPool().execute('SELECT * FROM events ORDER BY created_at DESC');
    return rows;
}

export async function addEvent(date: string, title: string, description: string, category: string) {
    const [result] = await getPool().execute(
        'INSERT INTO events (date, title, description, category) VALUES (?, ?, ?, ?)',
        [date, title, description, category]
    ) as mysql.ResultSetHeader[];
    return (result as any).insertId;
}

export async function deleteEvent(id: number) {
    await getPool().execute('DELETE FROM events WHERE id = ?', [id]);
}

// ==================== Gallery ====================
export async function getGalleryItems() {
    const [rows] = await getPool().execute('SELECT * FROM gallery ORDER BY `order` ASC, created_at DESC');
    return rows;
}

export async function addGalleryItem(image_url: string, label: string, order: number) {
    const [result] = await getPool().execute(
        'INSERT INTO gallery (image_url, label, `order`) VALUES (?, ?, ?)',
        [image_url, label, order]
    ) as mysql.ResultSetHeader[];
    return (result as any).insertId;
}

export async function deleteGalleryItem(id: number) {
    await getPool().execute('DELETE FROM gallery WHERE id = ?', [id]);
}

// ==================== Contacts ====================
export async function saveContact(name: string, email: string, phone: string | null, message: string, type: string) {
    const [result] = await getPool().execute(
        'INSERT INTO contacts (name, email, phone, message, type) VALUES (?, ?, ?, ?, ?)',
        [name, email, phone || null, message, type]
    ) as mysql.ResultSetHeader[];
    return (result as any).insertId;
}

export async function getContacts() {
    const [rows] = await getPool().execute('SELECT * FROM contacts ORDER BY created_at DESC');
    return rows;
}

// ==================== Admins ====================
export async function getAdminByUsername(username: string) {
    const [rows] = await getPool().execute(
        'SELECT * FROM admins WHERE username = ?',
        [username]
    ) as any[];
    return rows.length > 0 ? rows[0] : null;
}

export async function getAdminById(id: number) {
    const [rows] = await getPool().execute(
        'SELECT * FROM admins WHERE id = ?',
        [id]
    ) as any[];
    return rows.length > 0 ? rows[0] : null;
}

export async function createAdmin(username: string, email: string, password_hash: string) {
    const [result] = await getPool().execute(
        'INSERT INTO admins (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, password_hash]
    ) as mysql.ResultSetHeader[];
    return (result as any).insertId;
}