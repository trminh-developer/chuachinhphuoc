import sql from 'mssql';

const sqlConfig: sql.config = {
    server: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chuachinhphuoc',
    options: {
        trustServerCertificate: true,
        encrypt: true,
        connectTimeout: 15000,
    }
};

let pool: sql.ConnectionPool;

export async function getPool(): Promise<sql.ConnectionPool> {
    if (!pool) {
        pool = new sql.ConnectionPool(sqlConfig);
        await pool.connect();
    }
    return pool;
}

export async function getEvents() {
    try {
        const p = await getPool();
        const result = await p.request().query('SELECT * FROM events ORDER BY date DESC');
        return result.recordset;
    } catch (error) {
        console.error('Error fetching events:', error);
        throw error;
    }
}

export async function addEvent(date: string, title: string, description: string, category: string) {
    try {
        const p = await getPool();
        const result = await p.request()
            .input('date', sql.VarChar(10), date)
            .input('title', sql.VarChar(255), title)
            .input('description', sql.Text, description)
            .input('category', sql.VarChar(50), category)
            .query(`
                INSERT INTO events (date, title, description, category)
                VALUES (@date, @title, @description, @category);
                SELECT SCOPE_IDENTITY() as id
            `);
        return result.recordset[0].id;
    } catch (error) {
        console.error('Error adding event:', error);
        throw error;
    }
}

export async function getGalleryItems() {
    try {
        const p = await getPool();
        const result = await p.request().query('SELECT * FROM gallery ORDER BY [order] ASC');
        return result.recordset;
    } catch (error) {
        console.error('Error fetching gallery:', error);
        throw error;
    }
}

export async function addGalleryItem(image_url: string, label: string, order: number) {
    try {
        const p = await getPool();
        const result = await p.request()
            .input('image_url', sql.VarChar(500), image_url)
            .input('label', sql.VarChar(255), label)
            .input('order', sql.Int, order)
            .query(`
                INSERT INTO gallery (image_url, label, [order])
                VALUES (@image_url, @label, @order);
                SELECT SCOPE_IDENTITY() as id
            `);
        return result.recordset[0].id;
    } catch (error) {
        console.error('Error adding gallery item:', error);
        throw error;
    }
}

export async function saveContact(name: string, email: string, phone: string | null, message: string, type: string) {
    try {
        const p = await getPool();
        const result = await p.request()
            .input('name', sql.VarChar(255), name)
            .input('email', sql.VarChar(255), email)
            .input('phone', sql.VarChar(20), phone || null)
            .input('message', sql.Text, message)
            .input('type', sql.VarChar(50), type)
            .query(`
                INSERT INTO contacts (name, email, phone, message, type)
                VALUES (@name, @email, @phone, @message, @type);
                SELECT SCOPE_IDENTITY() as id
            `);
        return result.recordset[0].id;
    } catch (error) {
        console.error('Error saving contact:', error);
        throw error;
    }
}

export async function createAdmin(username: string, email: string, password_hash: string) {
    try {
        const p = await getPool();
        await p.request()
            .input('username', sql.VarChar(100), username)
            .input('email', sql.VarChar(100), email)
            .input('password_hash', sql.VarChar(500), password_hash)
            .query(`
                INSERT INTO Admin (users, email, passwords)
                VALUES (@username, @email, @password_hash)
            `);
        return username;
    } catch (error) {
        console.error('Error creating admin:', error);
        throw error;
    }
}

export async function getAdminByUsername(username: string) {
    try {
        const p = await getPool();
        const result = await p.request()
            .input('username', sql.VarChar(100), username)
            .query(`SELECT * FROM Admin WHERE users = @username`);

        if (result.recordset.length === 0) return null;

        const admin = result.recordset[0];
        return {
            id: admin.users,
            username: admin.users,
            email: admin.email,
            password_hash: admin.passwords
        };
    } catch (error) {
        console.error('Error fetching admin:', error);
        throw error;
    }
}

export async function getAdminById(id: number) {
    try {
        const p = await getPool();
        const result = await p.request()
            .input('id', sql.VarChar(100), id.toString())
            .query(`SELECT TOP 1 * FROM Admin WHERE users = @id`);

        if (result.recordset.length === 0) return null;

        const admin = result.recordset[0];
        return {
            id: admin.users,
            username: admin.users,
            email: admin.email,
            password_hash: admin.passwords
        };
    } catch (error) {
        console.error('Error fetching admin:', error);
        throw error;
    }
}
