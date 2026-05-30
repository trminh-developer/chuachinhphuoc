import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Vượt qua lỗi Self-Signed Certificate của Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function createAdmin(): Promise<void> {
    const username = process.argv[2];
    const email = process.argv[3];
    const password = process.argv[4];

    if (!username || !email || !password) {
        console.log('❌ Cách sử dụng:');
        console.log('npm run create-admin <username> <email> <password>');
        process.exit(1);
    }

    let connectionString = process.env.POSTGRES_URL_POSTGRES_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_POSTGRES_PRISMA_URL;
    if (!connectionString) {
        const dbUser = process.env.DB_USER || 'postgres';
        const dbPassword = process.env.DB_PASSWORD || 'postgres';
        const dbHost = process.env.DB_HOST || 'localhost';
        const dbPort = process.env.DB_PORT || '5432';
        const dbName = process.env.DB_NAME || 'pagoda_website';
        connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    }

    if (!connectionString.includes('localhost') && !connectionString.includes('sslmode')) {
        connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
    }

    const pool = new Pool({
        connectionString,
        max: 3,
        idleTimeoutMillis: 10000,
        ssl: !connectionString.includes('localhost') ? { rejectUnauthorized: false } : undefined
    });

    try {
        console.log('⏳ Đang kết nối tới PostgreSQL...');
        const client = await pool.connect();
        
        try {
            console.log('⏳ Đang tạo toàn bộ các bảng trong CSDL...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS admins (
                    id              SERIAL          PRIMARY KEY,
                    username        VARCHAR(100)    NOT NULL UNIQUE,
                    email           VARCHAR(100)    NOT NULL UNIQUE,
                    password_hash   VARCHAR(500)    NOT NULL,
                    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
                    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
                );

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

                CREATE TABLE IF NOT EXISTS gallery (
                    id              SERIAL          PRIMARY KEY,
                    image_url       VARCHAR(500)    NOT NULL,
                    label           VARCHAR(255)    NOT NULL,
                    "order"         INT             DEFAULT 0,
                    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
                    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
                );

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

            // Kiểm tra xem user đã tồn tại chưa
            const existing = await client.query('SELECT id FROM admins WHERE username = $1', [username]);
            if (existing.rows.length > 0) {
                console.log(`❌ Tài khoản '${username}' đã tồn tại!`);
                return;
            }

            console.log('⏳ Đang mã hóa mật khẩu...');
            const passwordHash = await bcrypt.hash(password, 10);

            console.log(`⏳ Đang tạo tài khoản '${username}'...`);
            const result = await client.query(
                'INSERT INTO admins (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
                [username, email, passwordHash]
            );

            console.log(`✅ Thành công! Đã tạo tài khoản admin với ID: ${result.rows[0].id}`);
            console.log(`👉 Bạn có thể đăng nhập bằng tài khoản: ${username}`);
            
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await pool.end();
    }
}

createAdmin();