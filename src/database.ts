import sql, { ConnectionPool } from 'mssql/msnodesqlv8';
import dotenv from 'dotenv';

dotenv.config();

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
// Connection Pool Configuration (msnodesqlv8 — Shared Memory / Named Pipes)
// =============================================================================
let pool: ConnectionPool | null = null;
let poolConnecting: Promise<ConnectionPool> | null = null;

const dbServer = process.env.DB_HOST || 'localhost';
const dbName = process.env.DB_NAME || 'pagoda_website';

const sqlConfig: any = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${dbServer};Database=${dbName};Trusted_Connection=Yes;`,
    pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000
    }
};

/**
 * Lấy hoặc khởi tạo Connection Pool.
 * Sử dụng singleton pattern + mutex (poolConnecting) để tránh race condition
 * khi nhiều request đồng thời gọi getPool() lần đầu.
 */
export async function getPool(): Promise<ConnectionPool> {
    // Pool đã sẵn sàng
    if (pool && pool.connected) {
        return pool;
    }

    // Pool đang được khởi tạo bởi request khác → chờ
    if (poolConnecting) {
        return poolConnecting;
    }

    // Khởi tạo pool mới
    poolConnecting = (async () => {
        try {
            pool = new sql.ConnectionPool(sqlConfig);

            pool.on('error', (err: Error) => {
                console.error('❌ Pool error:', err.message);
                pool = null;
                poolConnecting = null;
            });

            await pool.connect();
            console.log('✅ MSSQL Pool connected');
            return pool;
        } catch (error) {
            pool = null;
            poolConnecting = null;
            throw new Error(`Failed to connect to database: ${(error as Error).message}`);
        }
    })();

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
        await p.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'admins')
            CREATE TABLE admins (
                id              INT             PRIMARY KEY IDENTITY(1,1),
                username        VARCHAR(100)    NOT NULL,
                email           VARCHAR(100)    NOT NULL,
                password_hash   VARCHAR(500)    NOT NULL,
                created_at      DATETIME        DEFAULT GETDATE(),
                updated_at      DATETIME        DEFAULT GETDATE(),
                CONSTRAINT UQ_admins_username UNIQUE (username),
                CONSTRAINT UQ_admins_email    UNIQUE (email)
            );
        `);

        // Create events table
        await p.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'events')
            CREATE TABLE events (
                id              INT             PRIMARY KEY IDENTITY(1,1),
                event_date      VARCHAR(10)     NOT NULL,
                title           NVARCHAR(255)   NOT NULL,
                description     NVARCHAR(MAX)   NOT NULL,
                category        NVARCHAR(50)    NOT NULL,
                created_at      DATETIME        DEFAULT GETDATE(),
                updated_at      DATETIME        DEFAULT GETDATE()
            );
        `);

        // Create gallery table
        await p.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'gallery')
            CREATE TABLE gallery (
                id              INT             PRIMARY KEY IDENTITY(1,1),
                image_url       VARCHAR(500)    NOT NULL,
                label           NVARCHAR(255)   NOT NULL,
                [order]         INT             DEFAULT 0,
                created_at      DATETIME        DEFAULT GETDATE(),
                updated_at      DATETIME        DEFAULT GETDATE()
            );
        `);

        // Create contacts table
        await p.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'contacts')
            CREATE TABLE contacts (
                id              INT             PRIMARY KEY IDENTITY(1,1),
                name            NVARCHAR(255)   NOT NULL,
                email           VARCHAR(255)    NOT NULL,
                phone           VARCHAR(20)     NULL,
                message         NVARCHAR(MAX)   NULL,
                type            VARCHAR(50)     DEFAULT 'inquiry',
                created_at      DATETIME        DEFAULT GETDATE()
            );
        `);

        console.log('✅ Database tables initialized');
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
            await pool.close();
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
        const result = await p
            .request()
            .query('SELECT id, event_date, title, description, category, image_url, created_at FROM events ORDER BY created_at DESC');
        return result.recordset;
    } catch (error) {
        console.error('❌ Error fetching events:', error);
        throw new Error(`Failed to fetch events: ${(error as Error).message}`);
    }
}

export async function getEventById(id: number): Promise<EventRecord | null> {
    try {
        const p = await getPool();
        const result = await p
            .request()
            .input('id', sql.Int, id)
            .query('SELECT id, event_date, title, description, category, image_url, created_at FROM events WHERE id = @id');
        return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
        console.error('❌ Error fetching event by ID:', error);
        throw new Error(`Failed to fetch event by ID: ${(error as Error).message}`);
    }
}

export async function addEvent(date: string, title: string, description: string, category: string, imageUrl?: string): Promise<number> {
    try {
        const p = await getPool();
        const result = await p
            .request()
            .input('event_date', sql.VarChar(10), date)
            .input('title', sql.NVarChar(255), title)
            .input('description', sql.NVarChar(sql.MAX), description)
            .input('category', sql.NVarChar(50), category)
            .input('image_url', sql.VarChar(sql.MAX), imageUrl || null)
            .query(`
                INSERT INTO events (event_date, title, description, category, image_url) 
                OUTPUT INSERTED.id 
                VALUES (@event_date, @title, @description, @category, @image_url)
            `);
        return result.recordset[0].id;
    } catch (error) {
        console.error('❌ Error adding event:', error);
        throw new Error(`Failed to add event: ${(error as Error).message}`);
    }
}

export async function updateEvent(id: number, date: string, title: string, description: string, category: string, imageUrl?: string): Promise<boolean> {
    try {
        const p = await getPool();
        const result = await p
            .request()
            .input('id', sql.Int, id)
            .input('event_date', sql.VarChar(10), date)
            .input('title', sql.NVarChar(255), title)
            .input('description', sql.NVarChar(sql.MAX), description)
            .input('category', sql.NVarChar(50), category)
            .input('image_url', sql.VarChar(sql.MAX), imageUrl || null)
            .query(`
                UPDATE events 
                SET event_date = @event_date, title = @title, description = @description, 
                    category = @category, image_url = @image_url, updated_at = GETDATE() 
                WHERE id = @id
            `);
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error('❌ Error updating event:', error);
        throw new Error(`Failed to update event: ${(error as Error).message}`);
    }
}

export async function deleteEvent(id: number): Promise<boolean> {
    try {
        const p = await getPool();
        const result = await p
            .request()
            .input('id', sql.Int, id)
            .query('DELETE FROM events WHERE id = @id');
        return result.rowsAffected[0] > 0;
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
        const result = await p
            .request()
            .query('SELECT id, image_url, label, [order], created_at FROM gallery ORDER BY [order] ASC, created_at DESC');
        return result.recordset;
    } catch (error) {
        console.error('❌ Error fetching gallery:', error);
        throw new Error(`Failed to fetch gallery: ${(error as Error).message}`);
    }
}

export async function addGalleryItem(image_url: string, label: string, order: number): Promise<number> {
    try {
        const p = await getPool();
        const result = await p
            .request()
            .input('image_url', sql.VarChar(500), image_url)
            .input('label', sql.NVarChar(255), label)
            .input('order', sql.Int, order)
            .query(`
                INSERT INTO gallery (image_url, label, [order]) 
                OUTPUT INSERTED.id 
                VALUES (@image_url, @label, @order)
            `);
        return result.recordset[0].id;
    } catch (error) {
        console.error('❌ Error adding gallery item:', error);
        throw new Error(`Failed to add gallery item: ${(error as Error).message}`);
    }
}

export async function updateGalleryItem(id: number, image_url: string, label: string, order: number): Promise<boolean> {
    try {
        const p = await getPool();
        const result = await p
            .request()
            .input('id', sql.Int, id)
            .input('image_url', sql.VarChar(500), image_url)
            .input('label', sql.NVarChar(255), label)
            .input('order', sql.Int, order)
            .query(`
                UPDATE gallery 
                SET image_url = @image_url, label = @label, [order] = @order, updated_at = GETDATE() 
                WHERE id = @id
            `);
        return result.rowsAffected[0] > 0;
    } catch (error) {
        console.error('❌ Error updating gallery item:', error);
        throw new Error(`Failed to update gallery item: ${(error as Error).message}`);
    }
}

export async function deleteGalleryItem(id: number): Promise<boolean> {
    try {
        const p = await getPool();
        const result = await p
            .request()
            .input('id', sql.Int, id)
            .query('DELETE FROM gallery WHERE id = @id');
        return result.rowsAffected[0] > 0;
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
        const result = await p
            .request()
            .input('name', sql.NVarChar(255), name)
            .input('email', sql.VarChar(255), email)
            .input('phone', sql.VarChar(20), phone || null)
            .input('message', sql.NVarChar(sql.MAX), message)
            .input('type', sql.VarChar(50), type)
            .query(`
                INSERT INTO contacts (name, email, phone, message, type) 
                OUTPUT INSERTED.id 
                VALUES (@name, @email, @phone, @message, @type)
            `);
        return result.recordset[0].id;
    } catch (error) {
        console.error('❌ Error saving contact:', error);
        throw new Error(`Failed to save contact: ${(error as Error).message}`);
    }
}

export async function getContacts(): Promise<ContactRecord[]> {
    try {
        const p = await getPool();
        const result = await p
            .request()
            .query('SELECT id, name, email, phone, message, type, created_at FROM contacts ORDER BY created_at DESC');
        return result.recordset;
    } catch (error) {
        console.error('❌ Error fetching contacts:', error);
        throw new Error(`Failed to fetch contacts: ${(error as Error).message}`);
    }
}

export async function deleteContact(id: number): Promise<boolean> {
    try {
        const p = await getPool();
        const result = await p
            .request()
            .input('id', sql.Int, id)
            .query('DELETE FROM contacts WHERE id = @id');
        return result.rowsAffected[0] > 0;
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
        const result = await p
            .request()
            .input('username', sql.VarChar(100), username)
            .query('SELECT id, username, email, password_hash, created_at FROM admins WHERE username = @username');
        return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
        console.error('❌ Error fetching admin by username:', error);
        throw new Error(`Failed to fetch admin: ${(error as Error).message}`);
    }
}

export async function getAdminById(id: number): Promise<AdminRecord | null> {
    try {
        const p = await getPool();
        const result = await p
            .request()
            .input('id', sql.Int, id)
            .query('SELECT id, username, email, password_hash, created_at FROM admins WHERE id = @id');
        return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
        console.error('❌ Error fetching admin by id:', error);
        throw new Error(`Failed to fetch admin: ${(error as Error).message}`);
    }
}

export async function createAdmin(username: string, email: string, password_hash: string): Promise<number> {
    try {
        const p = await getPool();
        const result = await p
            .request()
            .input('username', sql.VarChar(100), username)
            .input('email', sql.VarChar(100), email)
            .input('password_hash', sql.VarChar(500), password_hash)
            .query('INSERT INTO admins (username, email, password_hash) OUTPUT INSERTED.id VALUES (@username, @email, @password_hash)');
        return result.recordset[0].id;
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        throw new Error(`Failed to create admin: ${(error as Error).message}`);
    }
}
