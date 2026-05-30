import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Xóa NODE_TLS_REJECT_UNAUTHORIZED='0' để tránh cảnh báo bảo mật trên Vercel
// Sử dụng config ssl: { rejectUnauthorized: false } của thư viện pg thay thế.
// =============================================================================
// TypeScript Interfaces
// =============================================================================
export interface EventRecord {
    id: number;
    event_date: string;
    title: string;
    description: string;
    category: string;
    image_url?: string;
    created_at: Date;
    updated_at?: Date;
}

export interface GalleryRecord {
    id: number;
    image_url: string;
    label: string;
    order: number;
    created_at: Date;
    updated_at?: Date;
}

export interface ContactRecord {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    message: string | null;
    type: string;
    created_at: Date;
}

export interface AdminRecord {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    created_at: Date;
    updated_at?: Date;
}

// =============================================================================
// Connection Pool Configuration (Supabase PostgreSQL)
// =============================================================================
let pool: Pool | null = null;
let poolConnecting: Promise<Pool> | null = null;

export async function getPool(): Promise<Pool> {
    if (pool) return pool;

    if (!poolConnecting) {
        poolConnecting = (async () => {
            try {
                // Determine connection string
                let connectionString = process.env.POSTGRES_URL_POSTGRES_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_POSTGRES_PRISMA_URL;
                
                // Fallback to local postgres if not set
                if (!connectionString) {
                    const dbUser = process.env.DB_USER || 'postgres';
                    const dbPassword = process.env.DB_PASSWORD || 'postgres';
                    const dbHost = process.env.DB_HOST || 'localhost';
                    const dbPort = process.env.DB_PORT || '5432';
                    const dbName = process.env.DB_NAME || 'pagoda_website';
                    connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
                }

                const isVercel = process.env.VERCEL === '1';
                
                // Loại bỏ sslmode từ connection string một cách an toàn bằng đối tượng URL
                try {
                    const parsedUrl = new URL(connectionString);
                    parsedUrl.searchParams.delete('sslmode');
                    connectionString = parsedUrl.toString();
                } catch (e) {
                    console.warn('Could not parse connection string as URL');
                }

                pool = new Pool({
                    connectionString,
                    max: 10,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 10000,
                    ssl: { rejectUnauthorized: false }
                });

                // Test connection
                const client = await pool.connect();
                client.release();
                
                console.log('✅ PostgreSQL Pool connected successfully');
                return pool;
            } catch (error) {
                pool = null;
                poolConnecting = null;
                throw new Error(`Failed to connect to PostgreSQL: ${(error as Error).message}`);
            }
        })();
    }

    const result = await poolConnecting;
    poolConnecting = null;
    return result;
}

/**
 * Khởi tạo các bảng trong database (idempotent).
 */
export async function initDatabase(): Promise<void> {
    try {
        const p = await getPool();

        // Create admins table
        await p.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id              SERIAL          PRIMARY KEY,
                username        VARCHAR(100)    NOT NULL UNIQUE,
                email           VARCHAR(100)    NOT NULL UNIQUE,
                password_hash   VARCHAR(500)    NOT NULL,
                created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create events table
        await p.query(`
            CREATE TABLE IF NOT EXISTS events (
                id              SERIAL          PRIMARY KEY,
                event_date      VARCHAR(10)     NOT NULL,
                title           VARCHAR(255)    NOT NULL,
                description     TEXT            NOT NULL,
                category        VARCHAR(50)     NOT NULL,
                image_url       TEXT            NULL,
                created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create gallery table
        await p.query(`
            CREATE TABLE IF NOT EXISTS gallery (
                id              SERIAL          PRIMARY KEY,
                image_url       VARCHAR(500)    NOT NULL,
                label           VARCHAR(255)    NOT NULL,
                "order"         INT             DEFAULT 0,
                created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
                updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create contacts table
        await p.query(`
            CREATE TABLE IF NOT EXISTS contacts (
                id              SERIAL          PRIMARY KEY,
                name            VARCHAR(255)    NOT NULL,
                email           VARCHAR(255)    NOT NULL,
                phone           VARCHAR(20)     NULL,
                message         TEXT            NULL,
                type            VARCHAR(50)     DEFAULT 'inquiry',
                created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Database tables initialized (PostgreSQL)');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        throw error;
    }
}

/**
 * Đóng Connection Pool an toàn.
 */
export async function closePool(): Promise<void> {
    if (pool) {
        try {
            await pool.end();
            pool = null;
            poolConnecting = null;
            console.log('✅ Connection pool closed');
        } catch (error) {
            console.error('❌ Error closing pool:', error);
        }
    }
}

// =============================================================================
// Events CRUD
// =============================================================================

export async function getEvents(): Promise<EventRecord[]> {
    try {
        const p = await getPool();
        const result = await p.query('SELECT id, event_date, title, description, category, image_url, created_at FROM events ORDER BY created_at DESC');
        return result.rows;
    } catch (error) {
        console.error('❌ Error fetching events:', error);
        throw new Error(`Failed to fetch events: ${(error as Error).message}`);
    }
}

export async function getEventById(id: number): Promise<EventRecord | null> {
    try {
        const p = await getPool();
        const result = await p.query('SELECT id, event_date, title, description, category, image_url, created_at FROM events WHERE id = $1', [id]);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('❌ Error fetching event by ID:', error);
        throw new Error(`Failed to fetch event by ID: ${(error as Error).message}`);
    }
}

export async function addEvent(date: string, title: string, description: string, category: string, imageUrl?: string): Promise<number> {
    try {
        const p = await getPool();
        const result = await p.query(
            `INSERT INTO events (event_date, title, description, category, image_url) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [date, title, description, category, imageUrl || null]
        );
        return result.rows[0].id;
    } catch (error) {
        console.error('❌ Error adding event:', error);
        throw new Error(`Failed to add event: ${(error as Error).message}`);
    }
}

export async function updateEvent(id: number, date: string, title: string, description: string, category: string, imageUrl?: string): Promise<boolean> {
    try {
        const p = await getPool();
        const result = await p.query(
            `UPDATE events 
             SET event_date = $1, title = $2, description = $3, category = $4, image_url = $5, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $6`,
            [date, title, description, category, imageUrl || null, id]
        );
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error('❌ Error updating event:', error);
        throw new Error(`Failed to update event: ${(error as Error).message}`);
    }
}

export async function deleteEvent(id: number): Promise<boolean> {
    try {
        const p = await getPool();
        const result = await p.query('DELETE FROM events WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error('❌ Error deleting event:', error);
        throw new Error(`Failed to delete event: ${(error as Error).message}`);
    }
}

// =============================================================================
// Gallery CRUD
// =============================================================================

export async function getGalleryItems(): Promise<GalleryRecord[]> {
    try {
        const p = await getPool();
        const result = await p.query('SELECT id, image_url, label, "order", created_at FROM gallery ORDER BY "order" ASC, created_at DESC');
        return result.rows;
    } catch (error) {
        console.error('❌ Error fetching gallery:', error);
        throw new Error(`Failed to fetch gallery: ${(error as Error).message}`);
    }
}

export async function addGalleryItem(image_url: string, label: string, order: number): Promise<number> {
    try {
        const p = await getPool();
        const result = await p.query(
            `INSERT INTO gallery (image_url, label, "order") 
             VALUES ($1, $2, $3) RETURNING id`,
            [image_url, label, order]
        );
        return result.rows[0].id;
    } catch (error) {
        console.error('❌ Error adding gallery item:', error);
        throw new Error(`Failed to add gallery item: ${(error as Error).message}`);
    }
}

export async function updateGalleryItem(id: number, image_url: string, label: string, order: number): Promise<boolean> {
    try {
        const p = await getPool();
        const result = await p.query(
            `UPDATE gallery 
             SET image_url = $1, label = $2, "order" = $3, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $4`,
            [image_url, label, order, id]
        );
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error('❌ Error updating gallery item:', error);
        throw new Error(`Failed to update gallery item: ${(error as Error).message}`);
    }
}

export async function deleteGalleryItem(id: number): Promise<boolean> {
    try {
        const p = await getPool();
        const result = await p.query('DELETE FROM gallery WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error('❌ Error deleting gallery item:', error);
        throw new Error(`Failed to delete gallery item: ${(error as Error).message}`);
    }
}

// =============================================================================
// Contacts CRUD
// =============================================================================

export async function saveContact(
    name: string,
    email: string,
    phone: string | null,
    message: string,
    type: string
): Promise<number> {
    try {
        const p = await getPool();
        const result = await p.query(
            `INSERT INTO contacts (name, email, phone, message, type) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [name, email, phone || null, message, type]
        );
        return result.rows[0].id;
    } catch (error) {
        console.error('❌ Error saving contact:', error);
        throw new Error(`Failed to save contact: ${(error as Error).message}`);
    }
}

export async function getContacts(): Promise<ContactRecord[]> {
    try {
        const p = await getPool();
        const result = await p.query('SELECT id, name, email, phone, message, type, created_at FROM contacts ORDER BY created_at DESC');
        return result.rows;
    } catch (error) {
        console.error('❌ Error fetching contacts:', error);
        throw new Error(`Failed to fetch contacts: ${(error as Error).message}`);
    }
}

export async function deleteContact(id: number): Promise<boolean> {
    try {
        const p = await getPool();
        const result = await p.query('DELETE FROM contacts WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error('❌ Error deleting contact:', error);
        throw new Error(`Failed to delete contact: ${(error as Error).message}`);
    }
}

// =============================================================================
// Admins
// =============================================================================

export async function getAdminByUsername(username: string): Promise<AdminRecord | null> {
    try {
        const p = await getPool();
        const result = await p.query('SELECT id, username, email, password_hash, created_at FROM admins WHERE username = $1', [username]);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('❌ Error fetching admin by username:', error);
        throw new Error(`Failed to fetch admin: ${(error as Error).message}`);
    }
}

export async function getAdminById(id: number): Promise<AdminRecord | null> {
    try {
        const p = await getPool();
        const result = await p.query('SELECT id, username, email, password_hash, created_at FROM admins WHERE id = $1', [id]);
        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('❌ Error fetching admin by id:', error);
        throw new Error(`Failed to fetch admin: ${(error as Error).message}`);
    }
}

export async function createAdmin(username: string, email: string, password_hash: string): Promise<number> {
    try {
        const p = await getPool();
        const result = await p.query(
            'INSERT INTO admins (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
            [username, email, password_hash]
        );
        return result.rows[0].id;
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        throw new Error(`Failed to create admin: ${(error as Error).message}`);
    }
}
